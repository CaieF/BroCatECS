import { System } from '../../../core/ecs/System';
import { World } from '../../../core/ecs/World';
import { Query } from '../../../core/ecs/Query';
import { BattleContext } from '../../battle/BattleContext';
import {
    C_ANIM_STATE,
    C_FACING,
    C_HURT_FLASH,
    C_VIEW_REF,
} from '../../../core/ecs/ComponentTypes';
import { ViewRef } from '../../components/common/ViewRef';
import { Facing } from '../../components/common/Facing';
import { AnimState } from '../../components/common/AnimState';
import { ActorView } from '../../view/ActorView';
import { HurtFlash } from '../../components/actor/HurtFlash';

/**
 * 把 ECS 动画状态和朝向同步到 ActorView。
 */
export class ViewAnimationSyncSystem extends System {
    constructor() {
        super();
        this.priority = 1100;
    }

    public update(world: World, dt: number, ctx: BattleContext): void {
        const entities = Query.all(world, C_VIEW_REF, C_FACING, C_ANIM_STATE);

        for (const entity of entities) {
            const viewRef = world.requireComponent<ViewRef>(entity, C_VIEW_REF);
            const facing = world.requireComponent<Facing>(entity, C_FACING);
            const animState = world.requireComponent<AnimState>(entity, C_ANIM_STATE);

            const node = viewRef.node;
            if (!node || !node.isValid) continue;

            const actorView = node.getComponent(ActorView);
            if (!actorView) continue;

            actorView.setFacing(facing.value);
            actorView.playState(animState.current);

            if (world.hasComponent(entity, C_HURT_FLASH)) {
                const hurtFlash = world.requireComponent<HurtFlash>(entity, C_HURT_FLASH);
                // actorView.setFlashMaterial(ctx.flashWhiteMaterial, hurtFlash.active);
                actorView.setFlashEnabled(ctx.flashWhiteMaterial, hurtFlash.active);
            } else {
                actorView.setFlashEnabled(ctx.flashWhiteMaterial, false);
            }
        }
    }
}