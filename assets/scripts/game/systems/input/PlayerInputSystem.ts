import { System } from '../../../core/ecs/System';
import { World } from '../../../core/ecs/World';
import { BattleContext } from '../../battle/BattleContext';
import { Query } from '../../../core/ecs/Query';
import { C_MOVE_INPUT, C_PLAYER_TAG } from '../../../core/ecs/ComponentTypes';
import { MoveInput } from '../../components/actor/MoveInput';

/** 玩家输入系统 */
export class PlayerInputSystem extends System {
    constructor() {
        super();
        this.priority = 10;
    }

    public update(world: World, dt: number, ctx: BattleContext): void {
        const players = Query.all(world, C_PLAYER_TAG, C_MOVE_INPUT);

        let x = 0;
        let y = 0;

        if (ctx.input.left) x -= 1;
        if (ctx.input.right) x += 1;
        if (ctx.input.up) y += 1;
        if (ctx.input.down) y -= 1;

        for (const entity of players) {
            const input = world.requireComponent<MoveInput>(entity, C_MOVE_INPUT);
            input.x = x;
            input.y = y;
        }
    }
}