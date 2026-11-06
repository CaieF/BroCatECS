import { System } from '../../../core/ecs/System';
import { World } from '../../../core/ecs/World';
import { Query } from '../../../core/ecs/Query';
import { BattleContext } from '../../battle/BattleContext';
import {
    C_AIM_ROTATION,
    C_CARRY_OWNER,
    C_CARRY_WEAPON_TAG,
    C_DEAD_TAG,
    C_DESTROY_TAG,
    C_FINAL_STATS,
    C_LEVEL,
    C_POSITION,
    C_WEAPON_ATTACK_STATE,
    C_WEAPON_RUNTIME,
    C_WEAPON_TARGET,
} from '../../../core/ecs/ComponentTypes';
import { Position } from '../../components/common/Position';
import { AimRotation } from '../../components/common/AimRotation';
import { WeaponRuntime } from '../../components/weapon/WeaponRuntime';
import { WeaponAttackState } from '../../components/weapon/WeaponAttackState';
import { WeaponTarget } from '../../components/weapon/WeaponTarget';
import { CarryOwner } from '../../components/weapon/CarryOwner';
import { FinalStats } from '../../components/actor/FinalStats';
import { Level } from '../../components/player/Level';
import { WeaponFormula } from '../../formula/WeaponFormula';
import { WeaponDefinitionUtil } from '../../config/WeaponDefinitionUtil';

export class WeaponAttackStartSystem extends System {
    constructor() {
        super();
        this.priority = 46;
    }

    public update(world: World, dt: number, ctx: BattleContext): void {
        const weapons = Query.all(
            world,
            C_CARRY_WEAPON_TAG,
            C_CARRY_OWNER,
            C_POSITION,
            C_AIM_ROTATION,
            C_WEAPON_RUNTIME,
            C_WEAPON_ATTACK_STATE,
            C_WEAPON_TARGET
        );

        for (const weaponEntity of weapons) {
            const owner = world.requireComponent<CarryOwner>(weaponEntity, C_CARRY_OWNER);
            if (!world.hasEntity(owner.entity)) continue;
            if (!world.hasComponent(owner.entity, C_FINAL_STATS)) continue;
            if (!world.hasComponent(owner.entity, C_LEVEL)) continue;

            const pos = world.requireComponent<Position>(weaponEntity, C_POSITION);
            const aim = world.requireComponent<AimRotation>(weaponEntity, C_AIM_ROTATION);
            const runtime = world.requireComponent<WeaponRuntime>(weaponEntity, C_WEAPON_RUNTIME);
            const state = world.requireComponent<WeaponAttackState>(weaponEntity, C_WEAPON_ATTACK_STATE);
            const weaponTarget = world.requireComponent<WeaponTarget>(weaponEntity, C_WEAPON_TARGET);
            const playerStats = world.requireComponent<FinalStats>(owner.entity, C_FINAL_STATS);
            const playerLevel = world.requireComponent<Level>(owner.entity, C_LEVEL);

            const computed = WeaponFormula.compute(runtime.weaponKey, runtime.tier, playerStats, playerLevel.current);

            if (runtime.cooldown > 0) {
                runtime.cooldown -= dt;
                if (runtime.cooldown < 0) runtime.cooldown = 0;
            }

            if (state.phase !== 'idle') continue;
            if (runtime.cooldown > 0) continue;

            const targetEntity = weaponTarget.targetEntity;
            if (!targetEntity || !world.hasEntity(targetEntity)) continue;
            if (world.hasComponent(targetEntity, C_DEAD_TAG) || world.hasComponent(targetEntity, C_DESTROY_TAG)) continue;
            if (!world.hasComponent(targetEntity, C_POSITION)) continue;

            const targetPos = world.requireComponent<Position>(targetEntity, C_POSITION);

            const dx = targetPos.x - pos.x;
            const dy = targetPos.y - pos.y;
            const distSq = dx * dx + dy * dy;

            const attackRange = Math.max(0, computed.finalRange);
            if (distSq > attackRange * attackRange) {
                continue;
            }

            // 重合时没有新的瞄准方向，保持已有朝向，避免 atan2(0, 0) 突然归零。
            const aimRad = distSq > 1e-8 ? Math.atan2(dy, dx) : aim.rad;

            state.phase = runtime.type === 'melee' ? 'recoil' : 'shoot';
            state.timer = runtime.type === 'melee' ? Math.max(0, runtime.recoilDuration) : 0;
            state.targetEntity = targetEntity;
            state.aimRad = aimRad;

            state.originX = pos.x;
            state.originY = pos.y;
            state.anchorFromX = pos.x;
            state.anchorFromY = pos.y;

            const dirX = Math.cos(aimRad);
            const dirY = Math.sin(aimRad);
            state.recoilFromX = 0;
            state.recoilFromY = 0;
            state.recoilToX = -dirX * runtime.recoilDistance;
            state.recoilToY = -dirY * runtime.recoilDistance;

            const baseRange = WeaponDefinitionUtil.getTierStats(runtime.weaponKey, runtime.tier).range;
            const reach = Math.max(0, runtime.dashDistance + computed.finalRange - baseRange);
            const bladeEnd = Math.max(runtime.hitStart ?? 0, runtime.hitEnd ?? 48);
            const extension = Math.min(reach, Math.max(0, Math.sqrt(distSq) - bladeEnd));
            state.strikeFromX = state.recoilToX;
            state.strikeFromY = state.recoilToY;
            state.strikeToX = dirX * extension;
            state.strikeToY = dirY * extension;
            state.recoverFromX = 0;
            state.recoverFromY = 0;

            state.fired = false;
            state.damage = null;
            state.hitEntities.clear();

            aim.rad = aimRad;

            runtime.cooldown = computed.finalAttackInterval;
        }
    }
}
