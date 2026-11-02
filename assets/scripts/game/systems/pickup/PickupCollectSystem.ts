import { System } from '../../../core/ecs/System';
import { World } from '../../../core/ecs/World';
import { Query } from '../../../core/ecs/Query';
import { BattleContext } from '../../battle/BattleContext';
import {
    C_COLLIDER,
    C_DESTROY_TAG,
    C_ECONOMY,
    C_EXP,
    C_PICKUP_REWARD,
    C_PICKUP_TAG,
    C_PLAYER_TAG,
    C_POSITION,
} from '../../../core/ecs/ComponentTypes';
import { Position } from '../../components/common/Position';
import { Collider } from '../../components/common/Collider';
import { PickupReward } from '../../components/pickup/PickupReward';
import { Economy } from '../../components/player/Economy';
import { Exp } from '../../components/player/Exp';

export class PickupCollectSystem extends System {
    constructor() {
        super();
        this.priority = 71;
    }

    public update(world: World, dt: number, ctx: BattleContext): void {
        const players = Query.exclude(
            world,
            [C_PLAYER_TAG, C_POSITION, C_COLLIDER, C_ECONOMY, C_EXP],
            [C_DESTROY_TAG]
        );
        if (players.length === 0) return;

        const playerEntity = players[0];
        const playerPos = world.requireComponent<Position>(playerEntity, C_POSITION);
        const playerCol = world.requireComponent<Collider>(playerEntity, C_COLLIDER);
        const economy = world.requireComponent<Economy>(playerEntity, C_ECONOMY);
        const exp = world.requireComponent<Exp>(playerEntity, C_EXP);

        const pickups = Query.exclude(
            world,
            [C_PICKUP_TAG, C_POSITION, C_COLLIDER, C_PICKUP_REWARD],
            [C_DESTROY_TAG]
        );

        for (const entity of pickups) {
            const pos = world.requireComponent<Position>(entity, C_POSITION);
            const col = world.requireComponent<Collider>(entity, C_COLLIDER);
            const reward = world.requireComponent<PickupReward>(entity, C_PICKUP_REWARD);

            const dx = pos.x - playerPos.x;
            const dy = pos.y - playerPos.y;
            const rr = playerCol.radius + col.radius;

            if (dx * dx + dy * dy > rr * rr) {
                continue;
            }

            if (reward.type === 'goldExp') {
                economy.gold += reward.gold;
                exp.current += reward.exp;

                if (economy.material > 0) {
                    economy.material -= 1;
                    economy.gold += 1;
                }
            }

            if (!world.hasComponent(entity, C_DESTROY_TAG)) {
                world.addComponent(entity, C_DESTROY_TAG, true);
            }
        }
    }
}