import { System } from '../../../core/ecs/System';
import { World } from '../../../core/ecs/World';
import { Query } from '../../../core/ecs/Query';
import { BattleContext } from '../../battle/BattleContext';
import {
    C_COLLIDER,
    C_DEAD_TAG,
    C_ENEMY_TAG,
    C_PLAYER_TAG,
    C_POSITION,
} from '../../../core/ecs/ComponentTypes';
import { Position } from '../../components/common/Position';
import { Collider } from '../../components/common/Collider';

export class BoundsClampSystem extends System {
    constructor() {
        super();
        // 在寻敌/攻击前得到本帧最终位置，避免边界修正发生在近战判定之后。
        this.priority = 33;
    }

    public update(world: World, dt: number, ctx: BattleContext): void {
        const entities = Query.exclude(
            world,
            [C_POSITION],
            [C_DEAD_TAG]
        );

        const bounds = ctx.bounds;

        for (const entity of entities) {
            const isPlayer = world.hasComponent(entity, C_PLAYER_TAG);
            const isEnemy = world.hasComponent(entity, C_ENEMY_TAG);

            if (!isPlayer && !isEnemy) {
                continue;
            }

            const pos = world.requireComponent<Position>(entity, C_POSITION);
            const radius = world.hasComponent(entity, C_COLLIDER)
                ? world.requireComponent<Collider>(entity, C_COLLIDER).radius
                : 0;

            const minX = bounds.minX + radius;
            const maxX = bounds.maxX - radius;
            const minY = bounds.minY + radius;
            const maxY = bounds.maxY - radius;

            if (pos.x < minX) pos.x = minX;
            if (pos.x > maxX) pos.x = maxX;
            if (pos.y < minY) pos.y = minY;
            if (pos.y > maxY) pos.y = maxY;
        }
    }
}
