import { Query } from '../../core/ecs/Query';
import { World } from '../../core/ecs/World';
import {
    C_COLLIDER, C_DEAD_TAG, C_DESTROY_TAG, C_ENEMY_TAG,
    C_HEALTH, C_POSITION, C_PREVIOUS_POSITION,
} from '../../core/ecs/ComponentTypes';
import { CollisionMath } from '../../core/math/CollisionMath';
import { Health } from '../components/actor/Health';
import { Collider } from '../components/common/Collider';
import { Position } from '../components/common/Position';
import { WeaponAttackState } from '../components/weapon/WeaponAttackState';
import { WeaponRuntime } from '../components/weapon/WeaponRuntime';
import { DamageEvent } from '../event/DamageEvent';
import { E_DAMAGE } from '../event/GameEventTypes';

/** 按刀身胶囊在突刺阶段的实际轨迹判定，每次攻击对同一敌人只结算一次。 */
export class MeleeHitResolver {
    public static applySweep(
        world: World,
        weaponEntity: number,
        state: WeaponAttackState,
        runtime: WeaponRuntime,
        from: Position,
        to: Position,
        damage: number,
        frameStart: number = 0,
        frameEnd: number = 1
    ): void {
        if (!Number.isFinite(damage) || damage <= 0) return;
        const enemies = Query.exclude(world,
            [C_ENEMY_TAG, C_POSITION, C_COLLIDER, C_HEALTH],
            [C_DEAD_TAG, C_DESTROY_TAG]);
        const cos = Math.cos(state.aimRad);
        const sin = Math.sin(state.aimRad);
        const bladeStart = runtime.hitStart ?? 0;
        const bladeEnd = runtime.hitEnd ?? 0;
        const startTime = Math.max(0, Math.min(1, frameStart));
        const endTime = Math.max(startTime, Math.min(1, frameEnd));

        for (const enemy of enemies) {
            if (state.hitEntities.has(enemy)) continue;
            if (world.requireComponent<Health>(enemy, C_HEALTH).current <= 0) continue;
            const pos = world.requireComponent<Position>(enemy, C_POSITION);
            const previous = world.getComponent<Position>(enemy, C_PREVIOUS_POSITION) ?? pos;
            const collider = world.requireComponent<Collider>(enemy, C_COLLIDER);

            // 将敌人相对刀身的运动转入本次锁定的攻击坐标系。
            // 只取本突刺子步占用的帧区间，不把蓄力/回收阶段算作命中。
            const startX = previous.x + (pos.x - previous.x) * startTime - from.x;
            const startY = previous.y + (pos.y - previous.y) * startTime - from.y;
            const endX = previous.x + (pos.x - previous.x) * endTime - to.x;
            const endY = previous.y + (pos.y - previous.y) * endTime - to.y;
            const hit = CollisionMath.segmentCapsuleFirstHit(
                startX * cos + startY * sin, -startX * sin + startY * cos,
                endX * cos + endY * sin, -endX * sin + endY * cos,
                bladeStart, 0, bladeEnd, 0,
                Math.max(0, runtime.hitRadius) + Math.max(0, collider.radius)
            );
            if (hit === null) continue;

            state.hitEntities.add(enemy);
            const event: DamageEvent = {
                sourceEntity: weaponEntity,
                targetEntity: enemy,
                value: damage,
            };
            world.eventBus.emit(E_DAMAGE, event);
        }
    }
}
