import { System } from '../../../core/ecs/System';
import { World } from '../../../core/ecs/World';
import { Query } from '../../../core/ecs/Query';
import { BattleContext } from '../../battle/BattleContext';
import {
    C_BASE_MOVE_SPEED,
    C_BASE_STATS,
    C_BONUS_STATS,
    C_FINAL_STATS,
    C_HEALTH,
    C_PLAYER_TAG,
} from '../../../core/ecs/ComponentTypes';
import { BaseStats } from '../../components/actor/BaseStats';
import { BonusStats } from '../../components/actor/BonusStats';
import { FinalStats } from '../../components/actor/FinalStats';
import { Health } from '../../components/actor/Health';
import { CharacterStatsUtil } from '../../formula/CharacterStatsUtil';
import { BaseMoveSpeed } from '../../components/actor/BaseMoveSpeed';

export class StatRebuildSystem extends System {
    constructor() {
        super();
        this.priority = 5;
    }

    public update(world: World, dt: number, ctx: BattleContext): void {
        const entities = Query.all(
            world,
            C_PLAYER_TAG,
            C_BASE_STATS,
            C_BONUS_STATS,
            C_FINAL_STATS,
            C_BASE_MOVE_SPEED
        );

        for (const entity of entities) {
            const baseStats = world.requireComponent<BaseStats>(entity, C_BASE_STATS);
            const bonusStats = world.requireComponent<BonusStats>(entity, C_BONUS_STATS);
            const finalStats = world.requireComponent<FinalStats>(entity, C_FINAL_STATS);
            const baseMoveSpeed = world.requireComponent<BaseMoveSpeed>(entity, C_BASE_MOVE_SPEED);

            const merged = CharacterStatsUtil.clone(baseStats);
            CharacterStatsUtil.addTo(merged, bonusStats);

            finalStats.maxHp = merged.maxHp;
            finalStats.hpRegen = merged.hpRegen;
            finalStats.lifeSteal = merged.lifeSteal;
            finalStats.armor = merged.armor;
            finalStats.dodge = merged.dodge;
            finalStats.speedPct = merged.speedPct;
            finalStats.meleeDamage = merged.meleeDamage;
            finalStats.rangedDamage = merged.rangedDamage;
            finalStats.elementalDamage = merged.elementalDamage;
            finalStats.engineering = merged.engineering;
            finalStats.damagePct = merged.damagePct;
            finalStats.attackSpeedPct = merged.attackSpeedPct;
            finalStats.critChance = merged.critChance;
            finalStats.range = merged.range;
            finalStats.luck = merged.luck;
            finalStats.harvesting = merged.harvesting;

            finalStats.moveSpeed = baseMoveSpeed.value * (1 + finalStats.speedPct / 100);

            if (world.hasComponent(entity, C_HEALTH)) {
                const health = world.requireComponent<Health>(entity, C_HEALTH);
                const oldMax = health.max;
                health.max = finalStats.maxHp;

                if (oldMax <= 0) {
                    health.current = health.max;
                } else if (health.current > health.max) {
                    health.current = health.max;
                }
            }
        }
    }
}