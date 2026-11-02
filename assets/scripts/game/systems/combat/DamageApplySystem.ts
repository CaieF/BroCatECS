import { random } from 'cc';
import { System } from '../../../core/ecs/System';
import { World } from '../../../core/ecs/World';
import { BattleContext } from '../../battle/BattleContext';
import {
    C_CARRY_OWNER,
    C_FINAL_STATS,
    C_HEALTH,
    C_HURT_FLASH,
    C_LIFE_STEAL_STATE,
    C_PLAYER_TAG,
    C_POSITION,
} from '../../../core/ecs/ComponentTypes';
import { Health } from '../../components/actor/Health';
import { HurtFlash } from '../../components/actor/HurtFlash';
import { FinalStats } from '../../components/actor/FinalStats';
import { E_DAMAGE, E_FLOATING_TEXT, E_HEAL } from '../../event/GameEventTypes';
import { DamageEvent } from '../../event/DamageEvent';
import { Position } from '../../components/common/Position';
import { FloatingTextEvent } from '../../event/FloatingTextEvent';
import { CarryOwner } from '../../components/weapon/CarryOwner';
import { LifeStealState } from '../../components/player/LifeStealState';
import { HealEvent } from '../../event/HealEvent';

export class DamageApplySystem extends System {
    constructor() {
        super();
        this.priority = 80;
    }

    public update(world: World, dt: number, ctx: BattleContext): void {
        const events = world.eventBus.consume<DamageEvent>(E_DAMAGE);

        for (const evt of events) {
            if (!world.hasEntity(evt.targetEntity)) continue;
            if (!world.hasComponent(evt.targetEntity, C_HEALTH)) continue;

            let finalDamage = evt.value;
            let dodged = false;

            // 玩家防御结算
            if (world.hasComponent(evt.targetEntity, C_PLAYER_TAG) && world.hasComponent(evt.targetEntity, C_FINAL_STATS)) {
                const stats = world.requireComponent<FinalStats>(evt.targetEntity, C_FINAL_STATS);

                // 闪避
                const dodgeChance = Math.max(0, stats.dodge);
                dodged = random() * 100 < dodgeChance;

                if (dodged) {
                    this.emitMissFloatingText(world, evt.targetEntity);
                    continue;
                }

                // 护甲减伤
                const armor = Math.max(0, stats.armor);
                finalDamage = finalDamage * 100 / (100 + armor);
            }

            const health = world.requireComponent<Health>(evt.targetEntity, C_HEALTH);
            health.current -= finalDamage;

            if (health.current < 0) {
                health.current = 0;
            }

            if (world.hasComponent(evt.targetEntity, C_HURT_FLASH)) {
                const hurtFlash = world.requireComponent<HurtFlash>(evt.targetEntity, C_HURT_FLASH);
                hurtFlash.active = true;
                hurtFlash.remaining = hurtFlash.duration;
            }

            this.emitDamageFloatingText(world, evt.targetEntity, finalDamage);

            // 玩家武器造成伤害时，尝试生命偷取
            this.tryLifeSteal(world, evt.sourceEntity);
        }
    }

    private tryLifeSteal(world: World, sourceEntity: number): void {
        if (!world.hasEntity(sourceEntity)) return;
        if (!world.hasComponent(sourceEntity, C_CARRY_OWNER)) return;

        const owner = world.requireComponent<CarryOwner>(sourceEntity, C_CARRY_OWNER);
        if (!world.hasEntity(owner.entity)) return;
        if (!world.hasComponent(owner.entity, C_PLAYER_TAG)) return;
        if (!world.hasComponent(owner.entity, C_FINAL_STATS)) return;
        if (!world.hasComponent(owner.entity, C_LIFE_STEAL_STATE)) return;

        const stats = world.requireComponent<FinalStats>(owner.entity, C_FINAL_STATS);
        const lifeStealState = world.requireComponent<LifeStealState>(owner.entity, C_LIFE_STEAL_STATE);

        if (lifeStealState.cooldownRemaining > 0) {
            return;
        }

        const chance = Math.max(0, stats.lifeSteal);
        const success = random() * 100 < chance;
        if (!success) return;

        const healEvt: HealEvent = {
            targetEntity: owner.entity,
            value: 1,
            source: 'lifesteal',
        };
        world.eventBus.emit(E_HEAL, healEvt);

        lifeStealState.cooldownRemaining = 0.1;
    }

    private emitMissFloatingText(world: World, entity: number): void {
        if (!world.hasComponent(entity, C_POSITION)) return;

        const pos = world.requireComponent<Position>(entity, C_POSITION);
        const textEvt: FloatingTextEvent = {
            x: pos.x,
            y: pos.y + 28,
            text: 'MISS',
            type: 'miss',
        };
        world.eventBus.emit(E_FLOATING_TEXT, textEvt);
    }

    private emitDamageFloatingText(world: World, entity: number, value: number): void {
        if (!world.hasComponent(entity, C_POSITION)) return;

        const pos = world.requireComponent<Position>(entity, C_POSITION);
        const textEvt: FloatingTextEvent = {
            x: pos.x,
            y: pos.y + 28,
            text: `${Math.round(value)}`,
            type: 'damage',
        };
        world.eventBus.emit(E_FLOATING_TEXT, textEvt);
    }
}