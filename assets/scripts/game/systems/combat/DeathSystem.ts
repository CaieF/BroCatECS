import { System } from '../../../core/ecs/System';
import { World } from '../../../core/ecs/World';
import { BattleContext } from '../../battle/BattleContext';
import { Query } from '../../../core/ecs/Query';
import {
    C_ANIM_STATE,
    C_DEAD_TAG,
    C_DEATH_DELAY,
    C_DESTROY_TAG,
    C_ENEMY_TAG,
    C_HEALTH,
    C_POSITION,
    C_VELOCITY,
} from '../../../core/ecs/ComponentTypes';
import { Health } from '../../components/actor/Health';
import { DeathDelay } from '../../components/common/DeathDelay';
import { Velocity } from '../../components/common/Velocity';
import { AnimState } from '../../components/common/AnimState';
import { DropPickupFactory } from '../../factory/DropPickupFactory';
import { Position } from '../../components/common/Position';

/**
 * 死亡系统
 * 负责检查敌人是否死亡，死亡则添加销毁标签。
 */
export class DeathSystem extends System {
    constructor() {
        super();
        this.priority = 90;
    }

    public update(world: World, dt: number, ctx: BattleContext): void {
        const enemies = Query.exclude(
            world,
            [C_ENEMY_TAG, C_HEALTH],
            [C_DEAD_TAG, C_DESTROY_TAG]
        );

        for (const entity of enemies) {
            const health = world.requireComponent<Health>(entity, C_HEALTH);

            if (health.current <= 0) {
                world.addComponent(entity, C_DEAD_TAG, true);
                world.addComponent<DeathDelay>(entity, C_DEATH_DELAY, {
                    remaining: 0.5,
                });

                if (world.hasComponent(entity, C_VELOCITY)) {
                    const velocity = world.requireComponent<Velocity>(entity, C_VELOCITY);
                    velocity.x = 0;
                    velocity.y = 0;
                }

                if (world.hasComponent(entity, C_ANIM_STATE)) {
                    const animState = world.requireComponent<AnimState>(entity, C_ANIM_STATE);
                    animState.current = 'death';
                    animState.locked = true;
                }

                // 掉落金币+经验
                if (ctx.dropLayer && world.hasComponent(entity, C_POSITION)) {
                    const pos = world.requireComponent<Position>(entity, C_POSITION);
                
                    DropPickupFactory.createGoldExp(
                        ctx,
                        world,
                        ctx.dropLayer,
                        pos.x,
                        pos.y,
                        1, // gold
                        1  // exp
                    );
                }
            }
        }
    }
}