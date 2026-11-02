import { Node } from 'cc';
import { World } from '../../core/ecs/World';
import {
    C_COLLIDER,
    C_PICKUP_MAGNET,
    C_PICKUP_REWARD,
    C_PICKUP_TAG,
    C_POSITION,
    C_VIEW_REF,
} from '../../core/ecs/ComponentTypes';
import { Entity } from '../../core/ecs/Entity';
import { Position } from '../components/common/Position';
import { ViewRef } from '../components/common/ViewRef';
import { Collider } from '../components/common/Collider';
import { PickupReward } from '../components/pickup/PickupReward';
import { PickupMagnet } from '../components/pickup/PickupMagnet';
import { BattleContext } from '../battle/BattleContext';

export class DropPickupFactory {
    public static createGoldExp(
        ctx: BattleContext,
        world: World,
        dropLayer: Node,
        x: number,
        y: number,
        gold: number,
        exp: number
    ): Entity {
        const poolKey = 'pickupGoldExp';
        const node = ctx.nodePool.get(poolKey);
        if (!node) {
            throw new Error(`Pickup pool get failed: ${poolKey}`);
        }

        dropLayer.addChild(node);
        node.setPosition(x, y, 0);

        const entity = world.createEntity();

        const position: Position = { x, y };
        const viewRef: ViewRef = { node, poolKey };
        const collider: Collider = { radius: 14 };
        const reward: PickupReward = {
            type: 'goldExp',
            gold,
            exp,
        };
        const magnet: PickupMagnet = {
            attractRadius: 140,
            moveSpeed: 420,
        };

        world.addComponent(entity, C_PICKUP_TAG, true);
        world.addComponent(entity, C_POSITION, position);
        world.addComponent(entity, C_VIEW_REF, viewRef);
        world.addComponent(entity, C_COLLIDER, collider);
        world.addComponent(entity, C_PICKUP_REWARD, reward);
        world.addComponent(entity, C_PICKUP_MAGNET, magnet);

        return entity;
    }
}