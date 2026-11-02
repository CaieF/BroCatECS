import { System } from '../../../core/ecs/System';
import { World } from '../../../core/ecs/World';
import { BattleContext } from '../../battle/BattleContext';
import {
    C_ECONOMY,
    C_EXP,
    C_HEALTH,
    C_LEVEL,
    C_PENDING_LEVEL_UP,
} from '../../../core/ecs/ComponentTypes';
import { Health } from '../../components/actor/Health';
import { Exp } from '../../components/player/Exp';
import { Level } from '../../components/player/Level';
import { Economy } from '../../components/player/Economy';
import { PendingLevelUp } from '../../components/player/PendingLevelUp';

export class BattleHUDSyncSystem extends System {
    constructor() {
        super();
        this.priority = 1300;
        this.runWhenBattlePaused = true;
    }

    public update(world: World, dt: number, ctx: BattleContext): void {
        const ui = ctx.uiFacade;
        if (!ui) return;

        const player = ctx.playerEntity;
        if (!player || !world.hasEntity(player)) return;

        const health = world.getComponent<Health>(player, C_HEALTH);
        const exp = world.getComponent<Exp>(player, C_EXP);
        const level = world.getComponent<Level>(player, C_LEVEL);
        const economy = world.getComponent<Economy>(player, C_ECONOMY);
        const pending = world.getComponent<PendingLevelUp>(player, C_PENDING_LEVEL_UP);

        ui.updateHUD({
            hpCurrent: health?.current ?? 0,
            hpMax: health?.max ?? 1,

            expCurrent: exp?.current ?? 0,
            expNeed: exp?.need ?? 1,
            level: level?.current ?? 1,

            gold: economy?.gold ?? 0,
            material: economy?.material ?? 0,

            waveIndex: ctx.currentWave,
            waveTimeRemaining: ctx.waveTimeRemaining,

            hasPendingLevelUp: (pending?.count ?? 0) > 0,
        });
    }
}