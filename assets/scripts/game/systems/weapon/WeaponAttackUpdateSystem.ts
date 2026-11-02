import { Prefab, Vec3, random } from 'cc';
import { System } from '../../../core/ecs/System';
import { World } from '../../../core/ecs/World';
import { Query } from '../../../core/ecs/Query';
import { BattleContext } from '../../battle/BattleContext';
import {
    C_CARRY_OWNER,
    C_CARRY_WEAPON_TAG,
    C_ENEMY_TAG,
    C_FINAL_STATS,
    C_LEVEL,
    C_POSITION,
    C_VIEW_REF,
    C_WEAPON_ATTACK_STATE,
    C_WEAPON_RUNTIME,
} from '../../../core/ecs/ComponentTypes';
import { Position } from '../../components/common/Position';
import { CarryOwner } from '../../components/weapon/CarryOwner';
import { WeaponRuntime } from '../../components/weapon/WeaponRuntime';
import { WeaponAttackState } from '../../components/weapon/WeaponAttackState';
import { DamageEvent } from '../../event/DamageEvent';
import { E_DAMAGE } from '../../event/GameEventTypes';
import { ProjectileFactory } from '../../factory/ProjectileFactory';
import { WeaponView } from '../../view/WeaponView';
import { ViewRef } from '../../components/common/ViewRef';
import { FinalStats } from '../../components/actor/FinalStats';
import { Level } from '../../components/player/Level';
import { WeaponFormula } from '../../formula/WeaponFormula';
import { CampType } from '../../components/common/Camp';
import { WeaponDefinitionUtil } from '../../config/WeaponDefinitionUtil';

const _tempWorldPos = new Vec3();

function lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
}

export class WeaponAttackUpdateSystem extends System {

    constructor() {
        super();
        this.priority = 47;
    }

    public update(world: World, dt: number, ctx: BattleContext): void {
        const weapons = Query.all(
            world,
            C_CARRY_WEAPON_TAG,
            C_CARRY_OWNER,
            C_POSITION,
            C_WEAPON_RUNTIME,
            C_WEAPON_ATTACK_STATE
        );

        for (const weaponEntity of weapons) {
            const owner = world.requireComponent<CarryOwner>(weaponEntity, C_CARRY_OWNER);
            if (!world.hasEntity(owner.entity)) continue;
            if (!world.hasComponent(owner.entity, C_FINAL_STATS)) continue;
            if (!world.hasComponent(owner.entity, C_LEVEL)) continue;

            const pos = world.requireComponent<Position>(weaponEntity, C_POSITION);
            const runtime = world.requireComponent<WeaponRuntime>(weaponEntity, C_WEAPON_RUNTIME);
            const state = world.requireComponent<WeaponAttackState>(weaponEntity, C_WEAPON_ATTACK_STATE);
            const playerStats = world.requireComponent<FinalStats>(owner.entity, C_FINAL_STATS);
            const playerLevel = world.requireComponent<Level>(owner.entity, C_LEVEL);

            const computed = WeaponFormula.compute(
                runtime.weaponKey,
                runtime.tier,
                playerStats,
                playerLevel.current
            );

            if (state.phase === 'idle') {
                continue;
            }

            // =========================
            // recoil
            // =========================
            if (state.phase === 'recoil') {
                const total = Math.max(runtime.recoilDuration, 0.0001);
                state.timer -= dt;
                const t = 1 - Math.max(0, state.timer) / total;

                pos.x = lerp(state.recoilFromX, state.recoilToX, t);
                pos.y = lerp(state.recoilFromY, state.recoilToY, t);

                if (state.timer <= 0) {
                    if (runtime.type === 'melee') {
                        const targetPos = world.hasEntity(state.targetEntity) && world.hasComponent(state.targetEntity, C_POSITION)
                            ? world.requireComponent<Position>(state.targetEntity, C_POSITION)
                            : null;

                        const dirX = Math.cos(state.aimRad);
                        const dirY = Math.sin(state.aimRad);

                        let dashDist = runtime.dashDistance;

                        if (targetPos) {
                            const tx = targetPos.x - pos.x;
                            const ty = targetPos.y - pos.y;
                            const dist = Math.sqrt(tx * tx + ty * ty);
                            dashDist = Math.min(runtime.dashDistance, dist);
                        }

                        // 可选补偿：近战受 range 影响时，适当增加一点突进距离
                        dashDist += Math.max(0, computed.finalRange - 0) * 0.1;

                        state.phase = 'strike';
                        state.timer = runtime.dashDuration;

                        state.strikeFromX = pos.x;
                        state.strikeFromY = pos.y;
                        state.strikeToX = pos.x + dirX * dashDist;
                        state.strikeToY = pos.y + dirY * dashDist;
                        state.hitApplied = false;
                    } else {
                        state.phase = 'shoot';
                        state.timer = 0;
                        state.fired = false;
                    }
                }

                continue;
            }

            // =========================
            // strike (melee)
            // =========================
            if (state.phase === 'strike') {
                const total = Math.max(runtime.dashDuration, 0.0001);
                state.timer -= dt;
                const t = 1 - Math.max(0, state.timer) / total;

                pos.x = lerp(state.strikeFromX, state.strikeToX, t);
                pos.y = lerp(state.strikeFromY, state.strikeToY, t);

                if (!state.hitApplied && t >= 1.0) {
                    const finalDamage = this.rollDamageWithCrit(
                        computed.finalDamage,
                        computed.finalCritChance,
                        computed.finalCritMultiplier
                    );

                    this.applyMeleeHit(
                        world,
                        weaponEntity,
                        pos,
                        finalDamage,
                        runtime.hitRadius
                    );

                    state.hitApplied = true;
                }

                if (state.timer <= 0) {
                    state.phase = 'recover';
                    state.timer = 0.03;
                }

                continue;
            }

            // =========================
            // shoot (ranged)
            // =========================
            if (state.phase === 'shoot') {
                if (!state.fired) {
                    const finalDamage = this.rollDamageWithCrit(
                        computed.finalDamage,
                        computed.finalCritChance,
                        computed.finalCritMultiplier
                    );

                    this.fireProjectile(
                        world,
                        ctx,
                        weaponEntity,
                        runtime,
                        pos,
                        state.aimRad,
                        finalDamage,
                        runtime.bulletSpeed
                    );

                    state.fired = true;
                }

                state.phase = 'recover';
                state.timer = 0.03;
                continue;
            }

            // =========================
            // recover
            // =========================
            if (state.phase === 'recover') {
                state.timer -= dt;

                if (state.timer <= 0) {
                    state.phase = 'idle';
                }

                continue;
            }
        }
    }

    private rollDamageWithCrit(
        baseDamage: number,
        critChance: number,
        critMultiplier: number
    ): number {
        const clampedCritChance = Math.max(0, critChance);
        const isCrit = random() * 100 < clampedCritChance;
        return isCrit ? baseDamage * critMultiplier : baseDamage;
    }

    private applyMeleeHit(
        world: World,
        sourceWeaponEntity: number,
        centerPos: Position,
        damage: number,
        hitRadius: number
    ): void {
        const enemies = Query.all(world, C_ENEMY_TAG, C_POSITION);

        for (const enemyEntity of enemies) {
            const enemyPos = world.requireComponent<Position>(enemyEntity, C_POSITION);

            const dx = enemyPos.x - centerPos.x;
            const dy = enemyPos.y - centerPos.y;

            if (dx * dx + dy * dy <= hitRadius * hitRadius) {
                const evt: DamageEvent = {
                    sourceEntity: sourceWeaponEntity,
                    targetEntity: enemyEntity,
                    value: damage,
                };
                world.eventBus.emit(E_DAMAGE, evt);
            }
        }
    }

    private fireProjectile(
        world: World,
        ctx: BattleContext,
        weaponEntity: number,
        runtime: WeaponRuntime,
        weaponPos: Position,
        aimRad: number,
        damage: number,
        bulletSpeed: number
    ): void {
        // if (!this._projectilePrefab) return;
        if (!ctx.bulletLayer) return;

        const def = WeaponDefinitionUtil.getDefinition(runtime.weaponKey);
        const projectileKey = def.base.projectileKey;
        if (!projectileKey) {
            console.warn(`[WeaponAttackUpdateSystem] weapon ${runtime.weaponKey} has no projectileKey`);
            return;
        }

        let spawnX = weaponPos.x;
        let spawnY = weaponPos.y;

        const viewRef = world.getComponent<ViewRef>(weaponEntity, C_VIEW_REF);
        if (viewRef?.node && viewRef.node.isValid) {
            const weaponView = viewRef.node.getComponent(WeaponView);
            if (weaponView) {
                weaponView.getMuzzleWorldPosition(_tempWorldPos);
                spawnX = _tempWorldPos.x;
                spawnY = _tempWorldPos.y;
            }
        }

        ProjectileFactory.create(
        ctx,
        world,
        // ctx.projectilePrefabLibrary,
        projectileKey,
        ctx.bulletLayer,
        spawnX,
        spawnY,
        Math.cos(aimRad),
        Math.sin(aimRad),
        bulletSpeed,
        damage,
        CampType.Player
    );
    }
}