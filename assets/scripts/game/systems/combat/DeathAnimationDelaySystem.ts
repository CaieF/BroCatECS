import { System } from '../../../core/ecs/System';
import { World } from '../../../core/ecs/World';
import { Query } from '../../../core/ecs/Query';
import { BattleContext } from '../../battle/BattleContext';
import {
    C_DEAD_TAG,
    C_DEATH_DELAY,
    C_DESTROY_TAG,
} from '../../../core/ecs/ComponentTypes';
import { DeathDelay } from '../../components/common/DeathDelay';

/**
 * 死亡后延迟一段时间再销毁，这样死亡动画能播出来。
 */
export class DeathAnimationDelaySystem extends System {
    constructor() {
        super();
        this.priority = 95;
    }

    public update(world: World, dt: number, ctx: BattleContext): void {
        const entities = Query.exclude(
            world,
            [C_DEAD_TAG, C_DEATH_DELAY],
            [C_DESTROY_TAG]
        );

        for (const entity of entities) {
            const deathDelay = world.requireComponent<DeathDelay>(entity, C_DEATH_DELAY);
            deathDelay.remaining -= dt;

            if (deathDelay.remaining <= 0) {
                world.addComponent(entity, C_DESTROY_TAG, true);
            }
        }
    }
}