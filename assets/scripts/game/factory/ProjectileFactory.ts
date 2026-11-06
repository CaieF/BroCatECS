import { Node } from 'cc';
import { World } from '../../core/ecs/World';
import {
    C_CAMP,
    C_COLLIDER,
    C_DAMAGE,
    C_LIFE_TIME,
    C_POSITION,
    C_PREVIOUS_POSITION,
    C_PROJECTILE_TAG,
    C_VELOCITY,
    C_VIEW_REF,
} from '../../core/ecs/ComponentTypes';
import { Entity } from '../../core/ecs/Entity';
import { Position } from '../components/common/Position';
import { Velocity } from '../components/common/Velocity';
import { ViewRef } from '../components/common/ViewRef';
import { Damage } from '../components/projectile/Damage';
import { LifeTime } from '../components/common/LifeTime';
import { Collider } from '../components/common/Collider';
import { Camp, CampType } from '../components/common/Camp';
import { BattleContext } from '../battle/BattleContext';

export class ProjectileFactory {
    public static create(
        ctx: BattleContext,
        world: World,
        projectileKey: string,
        bulletLayer: Node,
        x: number,
        y: number,
        dirX: number,
        dirY: number,
        speed: number,
        damageValue: number,
        campType: CampType
    ): Entity {
        const projectileNode = ctx.nodePool.get(projectileKey);
        if (!projectileNode) {
            throw new Error(`Projectile pool get failed: ${projectileKey}`);
        }
        bulletLayer.addChild(projectileNode);
        projectileNode.setPosition(x, y, 0);

        const entity = world.createEntity();

        const position: Position = { x, y };
        const velocity: Velocity = {
            x: dirX * speed,
            y: dirY * speed,
        };
        const viewRef: ViewRef = { node: projectileNode, poolKey: projectileKey };
        const damage: Damage = { value: damageValue };
        const lifeTime: LifeTime = { remaining: 1.5 };
        // The visible yellow body is about 20 units across at the prefab's 0.5 scale.
        const collider: Collider = { radius: 10 };
        const camp: Camp = { value: campType };

        world.addComponent(entity, C_PROJECTILE_TAG, true);
        world.addComponent(entity, C_POSITION, position);
        // Projectiles can be spawned after PositionHistorySystem has run this frame.
        world.addComponent(entity, C_PREVIOUS_POSITION, { x, y, travelFraction: 1 });
        world.addComponent(entity, C_VELOCITY, velocity);
        world.addComponent(entity, C_VIEW_REF, viewRef);
        world.addComponent(entity, C_DAMAGE, damage);
        world.addComponent(entity, C_LIFE_TIME, lifeTime);
        world.addComponent(entity, C_COLLIDER, collider);
        world.addComponent(entity, C_CAMP, camp);

        return entity;
    }
}
