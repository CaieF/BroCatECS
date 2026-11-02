import { System } from '../../../core/ecs/System';
import { World } from '../../../core/ecs/World';
import { BattleContext } from '../../battle/BattleContext';
import { E_FLOATING_TEXT } from '../../event/GameEventTypes';
import { FloatingTextEvent } from '../../event/FloatingTextEvent';

export class FloatingTextSystem extends System {
    constructor() {
        super();
        this.priority = 1200;
        this.runWhenBattlePaused = true;
    }

    public update(world: World, dt: number, ctx: BattleContext): void {
        const spawner = ctx.floatingTextSpawner;
        if (!spawner) return;

        const events = world.eventBus.consume<FloatingTextEvent>(E_FLOATING_TEXT);

        for (const evt of events) {
            spawner.spawn(evt.x, evt.y, evt.text, evt.type, evt.critical ?? false);
        }
    }
}