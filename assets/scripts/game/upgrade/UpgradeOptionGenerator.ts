import {
    UpgradeOptionConfig,
    UpgradeOptionConfigTable,
    UpgradeStatConfigTable,
    UpgradeTier,
} from '../config/UpgradeOptionConfig';
import {
    UpgradeGuaranteedTiers,
    UpgradeRecurringGuarantee,
    UpgradeTierChanceRules,
} from '../config/UpgradeRollConfig';

export interface UpgradeRollContext {
    /** 正在结算的升级等级，而非同一波结束时的最终等级。 */
    level?: number;
    luck?: number;
    /** 可注入随机源，默认 Math.random，取值应为 [0, 1)。 */
    random?: () => number;
}

export class UpgradeOptionGenerator {
    public static rollOptions(count: number, context: UpgradeRollContext = {}): UpgradeOptionConfig[] {
        // 先按属性无放回抽选，再决定档位，避免一屏出现同一属性的不同档。
        const pool = [...UpgradeStatConfigTable];
        const result: UpgradeOptionConfig[] = [];
        const random = context.random ?? Math.random;
        const optionCount = Math.min(pool.length, Math.max(0, Math.floor(count)));

        for (let i = 0; i < optionCount; i++) {
            const index = Math.floor(random() * pool.length);
            const stat = pool.splice(index, 1)[0];
            const tier = this.rollTier(context.level ?? 2, context.luck ?? 0, random);
            const option = UpgradeOptionConfigTable.find(
                candidate => candidate.statKey === stat.statKey && candidate.tier === tier
            );
            if (option) result.push(option);
        }

        return result;
    }

    public static rollTier(level: number, luck: number = 0, random: () => number = Math.random): UpgradeTier {
        const upgradeLevel = Number.isFinite(level) ? Math.max(1, Math.floor(level)) : 2;
        const guaranteedTier = UpgradeGuaranteedTiers[upgradeLevel];
        if (guaranteedTier !== undefined) return guaranteedTier;

        const recurring = UpgradeRecurringGuarantee;
        if (upgradeLevel >= recurring.startLevel
            && (upgradeLevel - recurring.startLevel) % recurring.interval === 0) {
            return recurring.tier;
        }

        const luckMultiplier = Math.max(0, 1 + (Number.isFinite(luck) ? luck : 0) / 100);
        const roll = random();
        for (const rule of UpgradeTierChanceRules) {
            const steps = Math.max(0, upgradeLevel - rule.minLevel + 1);
            const chance = Math.min(rule.maxChance, steps * rule.chancePerLevel * luckMultiplier);
            if (roll < chance) return rule.tier;
        }
        return 1;
    }
}
