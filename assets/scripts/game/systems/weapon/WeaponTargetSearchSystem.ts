import { System } from '../../../core/ecs/System';
import { World } from '../../../core/ecs/World';
import { Query } from '../../../core/ecs/Query';
import { BattleContext } from '../../battle/BattleContext';
import {
    C_CARRY_OWNER,
    C_CARRY_WEAPON_TAG,
    C_DEAD_TAG,
    C_ENEMY_TAG,
    C_FINAL_STATS,
    C_LEVEL,
    C_POSITION,
    C_WEAPON_RUNTIME,
    C_WEAPON_TARGET,
} from '../../../core/ecs/ComponentTypes';
import { Position } from '../../components/common/Position';
import { WeaponRuntime } from '../../components/weapon/WeaponRuntime';
import { WeaponTarget } from '../../components/weapon/WeaponTarget';
import { CarryOwner } from '../../components/weapon/CarryOwner';
import { FinalStats } from '../../components/actor/FinalStats';
import { Level } from '../../components/player/Level';
import { WeaponFormula } from '../../formula/WeaponFormula';

export class WeaponTargetSearchSystem extends System {
    constructor() {
        super();
        this.priority = 44;
    }

    public update(world: World, dt: number, ctx: BattleContext): void {
        const weapons = Query.all(
            world,
            C_CARRY_WEAPON_TAG,
            C_CARRY_OWNER,
            C_POSITION,
            C_WEAPON_RUNTIME,
            C_WEAPON_TARGET
        );

        const enemies = Query.exclude(
            world,
            [C_ENEMY_TAG, C_POSITION],
            [C_DEAD_TAG]
        );

        for (const weaponEntity of weapons) {
            const owner = world.requireComponent<CarryOwner>(weaponEntity, C_CARRY_OWNER);
            if (!world.hasEntity(owner.entity)) continue;
            if (!world.hasComponent(owner.entity, C_FINAL_STATS)) continue;
            if (!world.hasComponent(owner.entity, C_LEVEL)) continue;

            const weaponPos = world.requireComponent<Position>(weaponEntity, C_POSITION);
            const runtime = world.requireComponent<WeaponRuntime>(weaponEntity, C_WEAPON_RUNTIME);
            const weaponTarget = world.requireComponent<WeaponTarget>(weaponEntity, C_WEAPON_TARGET);
            const playerStats = world.requireComponent<FinalStats>(owner.entity, C_FINAL_STATS);
            const playerLevel = world.requireComponent<Level>(owner.entity, C_LEVEL);

            const computed = WeaponFormula.compute(runtime.weaponKey, runtime.tier, playerStats, playerLevel.current);
            const attackRangeSq = computed.finalRange * computed.finalRange;

            let bestTarget = 0;
            let bestDistSq = attackRangeSq;

            for (const enemyEntity of enemies) {
                const enemyPos = world.requireComponent<Position>(enemyEntity, C_POSITION);

                const dx = enemyPos.x - weaponPos.x;
                const dy = enemyPos.y - weaponPos.y;
                const distSq = dx * dx + dy * dy;

                if (distSq <= bestDistSq) {
                    bestDistSq = distSq;
                    bestTarget = enemyEntity;
                }
            }

            weaponTarget.targetEntity = bestTarget;
            weaponTarget.distanceSq = bestTarget > 0 ? bestDistSq : Number.MAX_VALUE;
        }
    }
}