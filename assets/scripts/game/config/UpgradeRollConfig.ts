import { UpgradeTier } from './UpgradeOptionConfig';

export interface UpgradeTierChanceRule {
    tier: UpgradeTier;
    minLevel: number;
    chancePerLevel: number;
    maxChance: number;
}

/**
 * Wiki Upgrades 使用 Shop 品质规则，以升级等级代替波次。
 * 依品质从高到低，使用同一个随机数比较累计概率。
 * 起始等级与增长量以 Wiki 概率表为准：达到 minLevel 当级即有一次增长。
 * https://brotato.wiki.spellsandguns.com/Upgrades
 * https://brotato.wiki.spellsandguns.com/Shop#Rarity_of_Shop_Items_and_Luck
 */
export const UpgradeTierChanceRules: readonly UpgradeTierChanceRule[] = [
    { tier: 4, minLevel: 8, chancePerLevel: 0.0023, maxChance: 0.08 },
    { tier: 3, minLevel: 4, chancePerLevel: 0.02, maxChance: 0.25 },
    { tier: 2, minLevel: 2, chancePerLevel: 0.06, maxChance: 0.60 },
];

/** 指定等级的所有选项固定为该档；同一升级的刷新仍遵循保底。 */
export const UpgradeGuaranteedTiers: Readonly<Partial<Record<number, UpgradeTier>>> = {
    1: 1,
    5: 2,
    10: 3,
    15: 3,
    20: 3,
};

export const UpgradeRecurringGuarantee: {
    startLevel: number;
    interval: number;
    tier: UpgradeTier;
} = { startLevel: 25, interval: 5, tier: 4 };
