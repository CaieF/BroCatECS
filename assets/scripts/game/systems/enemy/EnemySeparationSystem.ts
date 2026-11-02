import { System } from '../../../core/ecs/System';
import { World } from '../../../core/ecs/World';
import { Query } from '../../../core/ecs/Query';
import { BattleContext } from '../../battle/BattleContext';
import {
    C_COLLIDER,
    C_DEAD_TAG,
    C_DESTROY_TAG,
    C_ENEMY_TAG,
    C_POSITION,
} from '../../../core/ecs/ComponentTypes';
import { Position } from '../../components/common/Position';
import { Collider } from '../../components/common/Collider';

export class EnemySeparationSystem extends System {
    constructor() {
        super();
        this.priority = 32;
    }

    public update(world: World, dt: number, ctx: BattleContext): void {
        const enemies = Query.exclude(
            world,
            [C_ENEMY_TAG, C_POSITION, C_COLLIDER],
            [C_DEAD_TAG, C_DESTROY_TAG]
        );

        const count = enemies.length;
        for (let i = 0; i < count; i++) {
            const entityA = enemies[i];
            const posA = world.requireComponent<Position>(entityA, C_POSITION);
            const colA = world.requireComponent<Collider>(entityA, C_COLLIDER);

            for (let j = i + 1; j < count; j++) {
                const entityB = enemies[j];
                const posB = world.requireComponent<Position>(entityB, C_POSITION);
                const colB = world.requireComponent<Collider>(entityB, C_COLLIDER);

                let dx = posB.x - posA.x;
                let dy = posB.y - posA.y;

                const minDist = colA.radius + colB.radius;
                const distSq = dx * dx + dy * dy;

                if (distSq >= minDist * minDist) {
                    continue;
                }

                let dist = Math.sqrt(distSq);

                if (dist < 0.0001) {
                    // 完全重叠时，给一个默认方向
                    dx = 1;
                    dy = 0;
                    dist = 1;
                }

                const nx = dx / dist;
                const ny = dy / dist;

                const overlap = minDist - dist;
                const push = overlap * 0.5;

                posA.x -= nx * push;
                posA.y -= ny * push;

                posB.x += nx * push;
                posB.y += ny * push;
            }
        }
    }
}