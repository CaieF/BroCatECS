import { System } from '../../../core/ecs/System';
import { World } from '../../../core/ecs/World';
import { Query } from '../../../core/ecs/Query';
import { BattleContext } from '../../battle/BattleContext';
import { C_LIFE_STEAL_STATE, C_PLAYER_TAG } from '../../../core/ecs/ComponentTypes';
import { LifeStealState } from '../../components/player/LifeStealState';

export class LifeStealSystem extends System {
    constructor() {
        super();
        this.priority = 79;
    }

    public update(world: World, dt: number, ctx: BattleContext): void {
        const players = Query.all(world, C_PLAYER_TAG, C_LIFE_STEAL_STATE);

        for (const entity of players) {
            const state = world.requireComponent<LifeStealState>(entity, C_LIFE_STEAL_STATE);
            if (state.cooldownRemaining > 0) {
                state.cooldownRemaining -= dt;
                if (state.cooldownRemaining < 0) {
                    state.cooldownRemaining = 0;
                }
            }
        }
    }
}