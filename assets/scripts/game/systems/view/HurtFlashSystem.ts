import { System } from '../../../core/ecs/System';
import { World } from '../../../core/ecs/World';
import { Query } from '../../../core/ecs/Query';
import { BattleContext } from '../../battle/BattleContext';
import { C_HURT_FLASH } from '../../../core/ecs/ComponentTypes';
import { HurtFlash } from '../../components/actor/HurtFlash';

/**
 * 只负责让闪白计时往下走。
 */
export class HurtFlashSystem extends System {
    constructor() {
        super();
        this.priority = 85;
    }

    public update(world: World, dt: number, ctx: BattleContext): void {
        const entities = Query.all(world, C_HURT_FLASH);

        for (const entity of entities) {
            const hurtFlash = world.requireComponent<HurtFlash>(entity, C_HURT_FLASH);

            if (!hurtFlash.active) continue;

            // DamageApplySystem 在本系统之前执行，不能让长帧直接吃掉新触发的闪白。
            if (hurtFlash.justTriggered) {
                hurtFlash.justTriggered = false;
                continue;
            }

            hurtFlash.remaining -= Number.isFinite(dt) ? Math.max(0, dt) : 0;

            if (hurtFlash.remaining <= 0) {
                hurtFlash.remaining = 0;
                hurtFlash.active = false;
            }
        }
    }
}
