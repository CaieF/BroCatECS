import { System } from '../../../core/ecs/System';
import { World } from '../../../core/ecs/World';
import { Query } from '../../../core/ecs/Query';
import { BattleContext } from '../../battle/BattleContext';
import {
    C_EXP,
    C_LEVEL,
    C_PENDING_LEVEL_UP,
    C_PLAYER_TAG,
} from '../../../core/ecs/ComponentTypes';
import { Exp } from '../../components/player/Exp';
import { Level } from '../../components/player/Level';
import { PendingLevelUp } from '../../components/player/PendingLevelUp';

export class ExpLevelSystem extends System {
    constructor() {
        super();
        this.priority = 78;
    }

    public update(world: World, dt: number, ctx: BattleContext): void {
        const players = Query.all(world, C_PLAYER_TAG, C_EXP, C_LEVEL, C_PENDING_LEVEL_UP);

        for (const entity of players) {
            const exp = world.requireComponent<Exp>(entity, C_EXP);
            const level = world.requireComponent<Level>(entity, C_LEVEL);
            const pending = world.requireComponent<PendingLevelUp>(entity, C_PENDING_LEVEL_UP);

            while (exp.current >= exp.need) {
                exp.current -= exp.need;
                level.current += 1;
                pending.count += 1;

                exp.need = this.computeNextNeed(level.current);
            }
        }
    }

    private computeNextNeed(level: number): number {
        return 10 + (level - 1) * 5;
    }
}