import { System } from '../../../core/ecs/System';
import { World } from '../../../core/ecs/World';
import { Query } from '../../../core/ecs/Query';
import { BattleContext } from '../../battle/BattleContext';
import { C_MOVE_DIRECTION, C_VELOCITY } from '../../../core/ecs/ComponentTypes';
import { MoveDirection } from '../../components/common/MoveDirection';
import { Velocity } from '../../components/common/Velocity';

/**
 * 根据 Velocity 更新 MoveDirection
 */
export class MoveDirectionUpdateSystem extends System {
    constructor() {
        super();
        this.priority = 35;
    }

    public update(world: World, dt: number, ctx: BattleContext): void {
        const entities = Query.all(world, C_VELOCITY, C_MOVE_DIRECTION);

        for (const entity of entities) {
            const velocity = world.requireComponent<Velocity>(entity, C_VELOCITY);
            const moveDirection = world.requireComponent<MoveDirection>(entity, C_MOVE_DIRECTION);

            const len = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
            if (len > 0.0001) {
                moveDirection.x = velocity.x / len;
                moveDirection.y = velocity.y / len;
            } else {
                moveDirection.x = 0;
                moveDirection.y = 0;
            }
        }
    }
}