import { System } from '../../../core/ecs/System';
import { World } from '../../../core/ecs/World';
import { BattleContext } from '../../battle/BattleContext';

export class WaveEventCleanupSystem extends System {
    constructor() {
        super();
        this.priority = 1990;
        this.runWhenBattlePaused = true;
    }

    public update(world: World, dt: number, ctx: BattleContext): void {
        if (ctx.waveJustEnded) {
            ctx.waveJustEnded = false;
        }
    }
}
