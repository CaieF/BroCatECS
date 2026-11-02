import { System } from '../../../core/ecs/System';
import { World } from '../../../core/ecs/World';
import { Query } from '../../../core/ecs/Query';
import { BattleContext } from '../../battle/BattleContext';
import {
    C_FINAL_STATS,
    C_HEALTH,
    C_PLAYER_TAG,
    C_REGEN_STATE,
} from '../../../core/ecs/ComponentTypes';
import { FinalStats } from '../../components/actor/FinalStats';
import { Health } from '../../components/actor/Health';
import { RegenState } from '../../components/player/RegenState';
import { E_HEAL } from '../../event/GameEventTypes';
import { HealEvent } from '../../event/HealEvent';

export class PlayerRegenSystem extends System {
    constructor() {
        super();
        this.priority = 81;
    }

    public update(world: World, dt: number, ctx: BattleContext): void {
        const players = Query.all(
            world,
            C_PLAYER_TAG,
            C_FINAL_STATS,
            C_HEALTH,
            C_REGEN_STATE
        );

        for (const entity of players) {
            const stats = world.requireComponent<FinalStats>(entity, C_FINAL_STATS);
            const health = world.requireComponent<Health>(entity, C_HEALTH);
            const regenState = world.requireComponent<RegenState>(entity, C_REGEN_STATE);

            if (health.current >= health.max) {
                regenState.timer = 0;
                continue;
            }

            if (stats.hpRegen <= 0) {
                regenState.timer = 0;
                continue;
            }

            const secondsPerHp = this.computeSecondsPerHp(stats.hpRegen);

            regenState.timer += dt;

            while (regenState.timer >= secondsPerHp) {
                regenState.timer -= secondsPerHp;

                const evt: HealEvent = {
                    targetEntity: entity,
                    value: 1,
                    source: 'regen',
                };
                world.eventBus.emit(E_HEAL, evt);

                if (health.current + 1 >= health.max) {
                    regenState.timer = 0;
                    break;
                }
            }
        }
    }

    private computeSecondsPerHp(hpRegen: number): number {
        return 5.0 / (1.0 + ((hpRegen - 1.0) / 2.25));
    }
}