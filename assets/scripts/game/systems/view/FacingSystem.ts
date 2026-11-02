import { System } from '../../../core/ecs/System';
import { World } from '../../../core/ecs/World';
import { Query } from '../../../core/ecs/Query';
import { BattleContext } from '../../battle/BattleContext';
import { C_FACING, C_MOVE_DIRECTION } from '../../../core/ecs/ComponentTypes';
import { Facing } from '../../components/common/Facing';
import { MoveDirection } from '../../components/common/MoveDirection';

/**
 * 根据 MoveDirection.x 更新朝向。
 */
export class FacingSystem extends System {
    constructor() {
        super();
        this.priority = 36;
    }

    public update(world: World, dt: number, ctx: BattleContext): void {
        const entities = Query.all(world, C_MOVE_DIRECTION, C_FACING);

        for (const entity of entities) {
            const moveDirection = world.requireComponent<MoveDirection>(entity, C_MOVE_DIRECTION);
            const facing = world.requireComponent<Facing>(entity, C_FACING);

            if (moveDirection.x > 0.01) {
                facing.value = -1;
            } else if (moveDirection.x < -0.01) {
                facing.value = 1;
            }
        }
    }
}