import { System } from '../../../core/ecs/System';
import { World } from '../../../core/ecs/World';
import { BattleContext } from '../../battle/BattleContext';
import { Query } from '../../../core/ecs/Query';
import {
    C_DESTROY_TAG,
    C_LIFE_TIME,
    C_POSITION,
    C_PROJECTILE_TAG,
    C_VELOCITY,
    C_VIEW_REF,
} from '../../../core/ecs/ComponentTypes';
import { Position } from '../../components/common/Position';
import { Velocity } from '../../components/common/Velocity';
import { LifeTime } from '../../components/common/LifeTime';
import { ViewRef } from '../../components/common/ViewRef';

export class ProjectileMoveSystem extends System {
    constructor() {
        super();
        this.priority = 60;
    }

    public update(world: World, dt: number, ctx: BattleContext): void {
        const projectiles = Query.all(
            world,
            C_PROJECTILE_TAG,
            C_POSITION,
            C_VELOCITY,
            C_LIFE_TIME
        );

        for (const entity of projectiles) {
            const position = world.requireComponent<Position>(entity, C_POSITION);
            const velocity = world.requireComponent<Velocity>(entity, C_VELOCITY);
            const lifeTime = world.requireComponent<LifeTime>(entity, C_LIFE_TIME);

            position.x += velocity.x * dt;
            position.y += velocity.y * dt;

            lifeTime.remaining -= dt;

            if (lifeTime.remaining <= 0) {
                if (!world.hasComponent(entity, C_DESTROY_TAG)) {
                    world.addComponent(entity, C_DESTROY_TAG, true);
                }
            }
        }

        world.flushDestroy();
    }
}