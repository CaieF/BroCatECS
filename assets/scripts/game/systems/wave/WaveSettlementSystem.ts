import { System } from '../../../core/ecs/System';
import { World } from '../../../core/ecs/World';
import { Query } from '../../../core/ecs/Query';
import { BattleContext } from '../../battle/BattleContext';
import {
    C_DESTROY_TAG,
    C_ECONOMY,
    C_PICKUP_REWARD,
    C_PICKUP_TAG,
    C_PLAYER_TAG,
} from '../../..//core/ecs/ComponentTypes';
import { PickupReward } from '../../components/pickup/PickupReward';
import { Economy } from '../../components/player/Economy';

export class WaveSettlementSystem extends System {
    constructor() {
        super();
        this.priority = 100;
    }

    public update(world: World, dt: number, ctx: BattleContext): void {
        if (!ctx.waveJustEnded) {
            return;
        }

        const players = Query.all(world, C_PLAYER_TAG, C_ECONOMY);
        if (players.length === 0) {
            return;
        }

        const playerEntity = players[0];
        const economy = world.requireComponent<Economy>(playerEntity, C_ECONOMY);

        const pickups = Query.exclude(
            world,
            [C_PICKUP_TAG, C_PICKUP_REWARD],
            [C_DESTROY_TAG]
        );

        let convertCount = 0;

        for (const entity of pickups) {
            const reward = world.requireComponent<PickupReward>(entity, C_PICKUP_REWARD);

            if (reward.type === 'goldExp') {
                convertCount += reward.gold;

                if (!world.hasComponent(entity, C_DESTROY_TAG)) {
                    world.addComponent(entity, C_DESTROY_TAG, true);
                }
            }
        }

        economy.material += convertCount;
    }
}