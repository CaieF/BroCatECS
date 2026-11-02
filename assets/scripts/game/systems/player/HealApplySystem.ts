import { System } from '../../../core/ecs/System';
import { World } from '../../../core/ecs/World';
import { BattleContext } from '../../battle/BattleContext';
import { C_HEALTH, C_POSITION } from '../../../core/ecs/ComponentTypes';
import { Health } from '../../components/actor/Health';
import { Position } from '../../components/common/Position';
import { E_FLOATING_TEXT, E_HEAL } from '../../event/GameEventTypes';
import { HealEvent } from '../../event/HealEvent';
import { FloatingTextEvent } from '../../event/FloatingTextEvent';

export class HealApplySystem extends System {
    constructor() {
        super();
        this.priority = 82;
    }

    public update(world: World, dt: number, ctx: BattleContext): void {
        const events = world.eventBus.consume<HealEvent>(E_HEAL);

        for (const evt of events) {
            if (!world.hasEntity(evt.targetEntity)) continue;
            if (!world.hasComponent(evt.targetEntity, C_HEALTH)) continue;

            const health = world.requireComponent<Health>(evt.targetEntity, C_HEALTH);
            const oldHp = health.current;
            health.current = Math.min(health.max, health.current + evt.value);

            const actualHeal = health.current - oldHp;
            if (actualHeal <= 0) continue;

            if (world.hasComponent(evt.targetEntity, C_POSITION)) {
                const pos = world.requireComponent<Position>(evt.targetEntity, C_POSITION);
                const textEvt: FloatingTextEvent = {
                    x: pos.x,
                    y: pos.y + 30,
                    text: `+${actualHeal}`,
                    type: 'heal',
                };
                world.eventBus.emit(E_FLOATING_TEXT, textEvt);
            }
        }
    }
}