import { System } from '../../../core/ecs/System';
import { World } from '../../../core/ecs/World';
import { BattleContext } from '../../battle/BattleContext';
import { Query } from '../../../core/ecs/Query';
import {
    C_DESTROY_TAG,
    C_LIFE_TIME,
    C_POSITION,
    C_PREVIOUS_POSITION,
    C_PROJECTILE_TAG,
    C_VELOCITY,
} from '../../../core/ecs/ComponentTypes';
import { Position } from '../../components/common/Position';
import { Velocity } from '../../components/common/Velocity';
import { LifeTime } from '../../components/common/LifeTime';
import { PreviousPosition } from '../../components/common/PreviousPosition';

export class ProjectileMoveSystem extends System {
    constructor() {
        super();
        this.priority = 60;
    }

    public update(world: World, dt: number, ctx: BattleContext): void {
        const projectiles = Query.exclude(
            world,
            [C_PROJECTILE_TAG, C_POSITION, C_VELOCITY, C_LIFE_TIME],
            [C_DESTROY_TAG]
        );

        for (const entity of projectiles) {
            const position = world.requireComponent<Position>(entity, C_POSITION);
            const velocity = world.requireComponent<Velocity>(entity, C_VELOCITY);
            const lifeTime = world.requireComponent<LifeTime>(entity, C_LIFE_TIME);

            let previous = world.getComponent<PreviousPosition>(entity, C_PREVIOUS_POSITION);
            if (!previous) {
                previous = { x: position.x, y: position.y };
                world.addComponent(entity, C_PREVIOUS_POSITION, previous);
            }
            previous.x = position.x;
            previous.y = position.y;

            const moveDt = Math.min(Math.max(0, dt), Math.max(0, lifeTime.remaining));
            previous.travelFraction = dt > 0 ? moveDt / dt : 0;
            position.x += velocity.x * moveDt;
            position.y += velocity.y * moveDt;
            lifeTime.remaining = Math.max(0, lifeTime.remaining - moveDt);

            // CollisionSystem tests this final segment before marking expired bullets for recycling.
        }
    }
}
