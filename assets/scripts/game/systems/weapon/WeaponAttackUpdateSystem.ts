import { Vec3, random } from 'cc';
import { System } from '../../../core/ecs/System';
import { World } from '../../../core/ecs/World';
import { Query } from '../../../core/ecs/Query';
import { BattleContext } from '../../battle/BattleContext';
import {
    C_CARRY_OWNER,
    C_CARRY_WEAPON_TAG,
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
import { ProjectileFactory } from '../../factory/ProjectileFactory';
import { WeaponView } from '../../view/WeaponView';
import { ViewRef } from '../../components/common/ViewRef';
import { FinalStats } from '../../components/actor/FinalStats';
import { Level } from '../../components/player/Level';
import { WeaponFormula } from '../../formula/WeaponFormula';
import { CampType } from '../../components/common/Camp';
import { WeaponDefinitionUtil } from '../../config/WeaponDefinitionUtil';
import { MeleeHitResolver } from '../../weapon/MeleeHitResolver';

const _tempWorldPos = new Vec3();
const _tempWorldOrigin = new Vec3();
const _tempWorldForward = new Vec3();
const _tempSpawn = new Vec3();
const _tempForward = new Vec3();
const MAX_STRIKE_STEP = 1 / 60;

function lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
}

function smoothStep(t: number): number {
    const clamped = Math.max(0, Math.min(1, t));
    return clamped * clamped * (3 - 2 * clamped);
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
            if (state.phase === 'idle') continue;

            if (state.damage === null) {
                const playerStats = world.requireComponent<FinalStats>(owner.entity, C_FINAL_STATS);
                const playerLevel = world.requireComponent<Level>(owner.entity, C_LEVEL);
                const computed = WeaponFormula.compute(runtime.weaponKey, runtime.tier, playerStats, playerLevel.current);
                state.damage = this.rollDamageWithCrit(
                    computed.finalDamage, computed.finalCritChance, computed.finalCritMultiplier
                );
            }

            const frameDuration = Number.isFinite(dt) ? Math.max(0, dt) : 0;
            let remaining = frameDuration;
            let elapsed = 0;

            // A phase transition consumes no extra frame. Even a long frame keeps
            // the complete thrust path and the exact time of every sweep segment.
            while (state.phase !== 'idle') {
                if (state.phase === 'shoot') {
                    if (!state.fired) {
                        this.fireProjectile(world, ctx, weaponEntity, runtime, pos,
                            state.aimRad, state.damage, runtime.bulletSpeed);
                        state.fired = true;
                    }
                    state.phase = 'recoil';
                    state.timer = Math.max(0, runtime.recoilDuration);
                    continue;
                }

                const phase = state.phase;
                const total = Math.max(0, phase === 'recoil' ? runtime.recoilDuration
                    : phase === 'strike' ? runtime.dashDuration : (runtime.recoverDuration ?? 0.1));
                if (remaining <= 0 && total > 0 && state.timer > 0) break;

                const phaseRemaining = Math.max(0, state.timer);
                const step = Math.min(remaining, phaseRemaining,
                    phase === 'strike' ? MAX_STRIKE_STEP : Number.POSITIVE_INFINITY);
                const frameStart = frameDuration > 0 ? elapsed / frameDuration : 0;
                const from: Position = { x: pos.x, y: pos.y };
                state.timer = Math.max(0, phaseRemaining - step);
                elapsed += step;
                remaining = Math.max(0, remaining - step);
                const frameEnd = frameDuration > 0 ? elapsed / frameDuration : 0;
                const t = smoothStep(total > 0 ? 1 - state.timer / total : 1);
                const fromX = phase === 'recoil' ? state.recoilFromX
                    : phase === 'strike' ? state.strikeFromX : state.recoverFromX;
                const fromY = phase === 'recoil' ? state.recoilFromY
                    : phase === 'strike' ? state.strikeFromY : state.recoverFromY;
                const toX = phase === 'recoil' ? state.recoilToX : phase === 'strike' ? state.strikeToX : 0;
                const toY = phase === 'recoil' ? state.recoilToY : phase === 'strike' ? state.strikeToY : 0;
                pos.x = lerp(state.anchorFromX, state.originX, frameEnd) + lerp(fromX, toX, t);
                pos.y = lerp(state.anchorFromY, state.originY, frameEnd) + lerp(fromY, toY, t);

                if (phase === 'strike') {
                    MeleeHitResolver.applySweep(world, weaponEntity, state, runtime,
                        from, pos, state.damage, frameStart, frameEnd);
                }

                if (state.timer > 1e-8) continue;
                if (phase === 'recoil' && runtime.type === 'melee') {
                    state.phase = 'strike';
                    state.timer = Math.max(0, runtime.dashDuration);
                } else if (phase === 'recover') {
                    state.phase = 'idle';
                    state.timer = 0;
                    pos.x = state.originX;
                    pos.y = state.originY;
                } else {
                    state.recoverFromX = toX;
                    state.recoverFromY = toY;
                    state.phase = 'recover';
                    state.timer = Math.max(0, runtime.recoverDuration ?? 0.1);
                }
            }

            state.anchorFromX = state.originX;
            state.anchorFromY = state.originY;
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
        if (!ctx.bulletLayer || !ctx.bulletLayer.isValid) return;

        const def = WeaponDefinitionUtil.getDefinition(runtime.weaponKey);
        const projectileKey = def.base.projectileKey;
        if (!projectileKey) {
            console.warn('[WeaponAttackUpdateSystem] weapon ' + runtime.weaponKey + ' has no projectileKey');
            return;
        }

        const viewRef = world.getComponent<ViewRef>(weaponEntity, C_VIEW_REF);
        const node = viewRef?.node?.isValid ? viewRef.node : null;
        const parent = node?.parent ?? ctx.effectLayer;
        _tempWorldOrigin.set(weaponPos.x, weaponPos.y, 0);
        _tempWorldForward.set(weaponPos.x + Math.cos(aimRad), weaponPos.y + Math.sin(aimRad), 0);
        if (parent?.isValid) {
            Vec3.transformMat4(_tempWorldOrigin, _tempWorldOrigin, parent.worldMatrix);
            Vec3.transformMat4(_tempWorldForward, _tempWorldForward, parent.worldMatrix);
        }
        _tempWorldPos.set(_tempWorldOrigin);

        if (node) {
            // View sync normally runs after combat. Sample the muzzle from the
            // current ECS pose, including this attack's angle and body mirror.
            node.setPosition(weaponPos.x, weaponPos.y, node.position.z);
            node.angle = aimRad * 180 / Math.PI;
            const weaponView = node.getComponent(WeaponView);
            weaponView?.update_visual(node.angle);
            if (weaponView) weaponView.getMuzzleWorldPosition(_tempWorldPos);
        }

        _tempWorldForward.set(
            _tempWorldPos.x + _tempWorldForward.x - _tempWorldOrigin.x,
            _tempWorldPos.y + _tempWorldForward.y - _tempWorldOrigin.y,
            _tempWorldPos.z + _tempWorldForward.z - _tempWorldOrigin.z
        );
        ctx.bulletLayer.inverseTransformPoint(_tempSpawn, _tempWorldPos);
        ctx.bulletLayer.inverseTransformPoint(_tempForward, _tempWorldForward);
        const dirX = _tempForward.x - _tempSpawn.x;
        const dirY = _tempForward.y - _tempSpawn.y;
        const length = Math.sqrt(dirX * dirX + dirY * dirY);
        if (length <= 1e-8) return;

        ProjectileFactory.create(ctx, world, projectileKey, ctx.bulletLayer,
            _tempSpawn.x, _tempSpawn.y, dirX / length, dirY / length,
            bulletSpeed, damage, CampType.Player);
    }
}
