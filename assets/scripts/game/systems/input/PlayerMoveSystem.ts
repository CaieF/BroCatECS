
import { System } from '../../../core/ecs/System';
import { World } from '../../../core/ecs/World';
import { BattleContext } from '../../battle/BattleContext';
import { Query } from '../../../core/ecs/Query';
import {
    C_FINAL_STATS,
    C_MOVE_INPUT,
    C_PLAYER_TAG,
    C_POSITION,
    C_VELOCITY,
} from '../../../core/ecs/ComponentTypes';
import { MoveInput } from '../../components/actor/MoveInput';
import { FinalStats } from '../../components/actor/FinalStats';
import { Position } from '../../components/common/Position';
import { Velocity } from '../../components/common/Velocity';

/** 玩家移动系统 */
export class PlayerMoveSystem extends System {
    constructor() {
        super();
        this.priority = 20;
    }

    public update(world: World, dt: number, ctx: BattleContext): void {
        const players = Query.all(
            world,
            C_PLAYER_TAG,
            C_MOVE_INPUT,
            C_FINAL_STATS,
            C_POSITION,
            C_VELOCITY
        );

        for (const entity of players) {
            const input = world.requireComponent<MoveInput>(entity, C_MOVE_INPUT);
            const stats = world.requireComponent<FinalStats>(entity, C_FINAL_STATS);
            const position = world.requireComponent<Position>(entity, C_POSITION);
            const velocity = world.requireComponent<Velocity>(entity, C_VELOCITY);

            let dirX = input.x;
            let dirY = input.y;

            const len = Math.sqrt(dirX * dirX + dirY * dirY);
            if (len > 0) {
                dirX /= len;
                dirY /= len;
            }

            velocity.x = dirX * stats.moveSpeed;
            velocity.y = dirY * stats.moveSpeed;

            position.x += velocity.x * dt;
            position.y += velocity.y * dt;
        }
    }
}