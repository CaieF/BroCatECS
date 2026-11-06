import { System } from '../../../core/ecs/System';
import { World } from '../../../core/ecs/World';
import { Query } from '../../../core/ecs/Query';
import { C_COLLIDER, C_DEAD_TAG, C_DESTROY_TAG, C_POSITION, C_PREVIOUS_POSITION } from '../../../core/ecs/ComponentTypes';
import { BattleContext } from '../../battle/BattleContext';
import { Position } from '../../components/common/Position';
import { PreviousPosition } from '../../components/common/PreviousPosition';

/** Snapshot once, before player movement, enemy movement and weapon attacks. */
export class PositionHistorySystem extends System {
    constructor() {
        super();
        this.priority = 0;
    }

    public update(world: World, dt: number, ctx: BattleContext): void {
        const entities = Query.exclude(world, [C_POSITION, C_COLLIDER], [C_DEAD_TAG, C_DESTROY_TAG]);
        for (const entity of entities) {
            const position = world.requireComponent<Position>(entity, C_POSITION);
            let previous = world.getComponent<PreviousPosition>(entity, C_PREVIOUS_POSITION);
            if (!previous) {
                previous = { x: position.x, y: position.y };
                world.addComponent(entity, C_PREVIOUS_POSITION, previous);
            }
            previous.x = position.x;
            previous.y = position.y;
            previous.travelFraction = 1;
        }
    }
}
