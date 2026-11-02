import { System } from '../../../core/ecs/System';
import { World } from '../../../core/ecs/World';
import { Query } from '../../../core/ecs/Query';
import { BattleContext } from '../../battle/BattleContext';
import {
    C_PICKUP_MAGNET,
    C_PICKUP_TAG,
    C_PLAYER_TAG,
    C_POSITION,
} from '../../../core/ecs/ComponentTypes';
import { Position } from '../../components/common/Position';
import { PickupMagnet } from '../../components/pickup/PickupMagnet';

export class PickupAttractSystem extends System {
    constructor() {
        super();
        this.priority = 61;
    }

    public update(world: World, dt: number, ctx: BattleContext): void {
        const players = Query.all(world, C_PLAYER_TAG, C_POSITION);
        if (players.length === 0) return;

        const playerPos = world.requireComponent<Position>(players[0], C_POSITION);

        const pickups = Query.all(world, C_PICKUP_TAG, C_POSITION, C_PICKUP_MAGNET);

        for (const entity of pickups) {
            const pos = world.requireComponent<Position>(entity, C_POSITION);
            const magnet = world.requireComponent<PickupMagnet>(entity, C_PICKUP_MAGNET);

            const dx = playerPos.x - pos.x;
            const dy = playerPos.y - pos.y;
            const distSq = dx * dx + dy * dy;

            if (distSq > magnet.attractRadius * magnet.attractRadius) {
                continue;
            }

            const len = Math.sqrt(distSq);
            if (len <= 0.0001) continue;

            const dirX = dx / len;
            const dirY = dy / len;

            pos.x += dirX * magnet.moveSpeed * dt;
            pos.y += dirY * magnet.moveSpeed * dt;
        }
    }
}