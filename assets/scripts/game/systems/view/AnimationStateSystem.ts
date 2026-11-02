import { System } from '../../../core/ecs/System';
import { World } from '../../../core/ecs/World';
import { Query } from '../../../core/ecs/Query';
import { BattleContext } from '../../battle/BattleContext';
import {
    C_ANIM_STATE,
    C_DEAD_TAG,
    C_VELOCITY,
} from '../../../core/ecs/ComponentTypes';
import { AnimState } from '../../components/common/AnimState';
import { Velocity } from '../../components/common/Velocity';

/**
 * 根据 Velocity 更新动画状态。
 */
export class AnimationStateSystem extends System {
    constructor() {
        super();
        this.priority = 37;
    }

    public update(world: World, dt: number, ctx: BattleContext): void {
        const entities = Query.all(world, C_ANIM_STATE, C_VELOCITY);

        for (const entity of entities) {
            const animState = world.requireComponent<AnimState>(entity, C_ANIM_STATE);

            if (animState.locked) {
                continue;
            }

            if (world.hasComponent(entity, C_DEAD_TAG)) {
                animState.current = 'death';
                animState.locked = true;
                continue;
            }

            const velocity = world.requireComponent<Velocity>(entity, C_VELOCITY);
            const speedSq = velocity.x * velocity.x + velocity.y * velocity.y;

            animState.current = speedSq > 1 ? 'move' : 'idle';
        }
    }
}