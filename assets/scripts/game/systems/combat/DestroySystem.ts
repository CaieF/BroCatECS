import { System } from '../../../core/ecs/System';
import { World } from '../../../core/ecs/World';
import { BattleContext } from '../../battle/BattleContext';
import { Query } from '../../../core/ecs/Query';
import { C_DESTROY_TAG, C_VIEW_REF } from '../../../core/ecs/ComponentTypes';
import { ViewRef } from '../../components/common/ViewRef';

/**
 * 销毁系统
 * 这个系统统一做两件事：
 * 1. 销毁 node
 * 2. 删除实体
 */
export class DestroySystem extends System {
    constructor() {
        super();
        this.priority = 2000;
        this.runWhenBattlePaused = true;
    }

    public update(world: World, dt: number, ctx: BattleContext): void {
        const entities = Query.all(world, C_DESTROY_TAG);

        for (const entity of entities) {
            const viewRef = world.getComponent<ViewRef>(entity, C_VIEW_REF);

            if (viewRef?.node && viewRef.node.isValid) {
                if (viewRef.poolKey) {
                    ctx.nodePool.put(viewRef.poolKey, viewRef.node);
                } else {
                    viewRef.node.destroy();
                }
            }

            world.destroyEntity(entity);
        }

        world.flushDestroy();
    }
}