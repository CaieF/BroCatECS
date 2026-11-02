import { System } from '../../../core/ecs/System';
import { World } from '../../../core/ecs/World';
import { Query } from '../../../core/ecs/Query';
import { BattleContext } from '../../battle/BattleContext';
import {
    C_ANIM_STATE,
    C_DEAD_TAG,
    C_DESTROY_TAG,
    C_HEALTH,
    C_PLAYER_TAG,
    C_VELOCITY,
} from '../../../core/ecs/ComponentTypes';
import { Health } from '../../components/actor/Health';
import { Velocity } from '../../components/common/Velocity';
import { AnimState } from '../../components/common/AnimState';

export class PlayerDeathSystem extends System {
    constructor() {
        super();
        this.priority = 91;
    }

    public update(world: World, dt: number, ctx: BattleContext): void {
        const players = Query.exclude(
            world,
            [C_PLAYER_TAG, C_HEALTH],
            [C_DEAD_TAG, C_DESTROY_TAG]
        );

        for (const entity of players) {
            const health = world.requireComponent<Health>(entity, C_HEALTH);

            if (health.current <= 0) {
                world.addComponent(entity, C_DEAD_TAG, true);

                if (world.hasComponent(entity, C_VELOCITY)) {
                    const vel = world.requireComponent<Velocity>(entity, C_VELOCITY);
                    vel.x = 0;
                    vel.y = 0;
                }

                if (world.hasComponent(entity, C_ANIM_STATE)) {
                    const animState = world.requireComponent<AnimState>(entity, C_ANIM_STATE);
                    animState.current = 'death';
                    animState.locked = true;
                }

                ctx.isPaused = true;
                console.log('[GameOver] Player dead.');
            }
        }
    }
}