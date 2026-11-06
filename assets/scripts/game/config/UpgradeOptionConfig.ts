import { CharacterStats } from '../components/actor/CharacterStats';

export type UpgradeTier = 1 | 2 | 3 | 4;

export const UPGRADE_TIERS: readonly UpgradeTier[] = [1, 2, 3, 4];

export interface UpgradeStatConfig {
    statKey: keyof CharacterStats;
    title: string;
    /** 百分比属性的数值也以百分点储存，例如 5 表示 +5%。 */
    percent?: boolean;
    /** 依次对应 I、II、III、IV 档。 */
    values: readonly [number, number, number, number];
}

export interface UpgradeOptionConfig {
    id: string;
    statKey: keyof CharacterStats;
    tier: UpgradeTier;
    title: string;
    desc: string;
    addStats: Partial<CharacterStats>;
}

/** 基础升级数值：https://brotato.wiki.spellsandguns.com/Upgrades */
export const UpgradeStatConfigTable: readonly UpgradeStatConfig[] = [
    { statKey: 'maxHp', title: '最大生命值', values: [3, 6, 9, 12] },
    { statKey: 'hpRegen', title: '生命再生', values: [2, 3, 4, 5] },
    { statKey: 'lifeSteal', title: '生命窃取', percent: true, values: [1, 2, 3, 4] },
    { statKey: 'damagePct', title: '伤害', percent: true, values: [5, 8, 12, 16] },
    { statKey: 'meleeDamage', title: '近战伤害', values: [2, 4, 6, 8] },
    { statKey: 'rangedDamage', title: '远程伤害', values: [1, 2, 3, 4] },
    { statKey: 'elementalDamage', title: '元素伤害', values: [1, 2, 3, 4] },
    { statKey: 'attackSpeedPct', title: '攻击速度', percent: true, values: [5, 10, 15, 20] },
    { statKey: 'critChance', title: '暴击率', percent: true, values: [3, 5, 7, 9] },
    { statKey: 'engineering', title: '工程学', values: [2, 3, 4, 5] },
    { statKey: 'range', title: '范围', values: [15, 30, 45, 60] },
    { statKey: 'armor', title: '护甲', values: [1, 2, 3, 4] },
    { statKey: 'dodge', title: '闪避', percent: true, values: [3, 6, 9, 12] },
    { statKey: 'speedPct', title: '速度', percent: true, values: [3, 6, 9, 12] },
    { statKey: 'luck', title: '幸运', values: [5, 10, 15, 20] },
    { statKey: 'harvesting', title: '收获', values: [5, 8, 10, 12] },
];

/** 由属性定义生成所有档位，避免显示数值与实际加成各维护一份。 */
export const UpgradeOptionConfigTable: UpgradeOptionConfig[] = [];

for (const stat of UpgradeStatConfigTable) {
    for (const tier of UPGRADE_TIERS) {
        const value = stat.values[tier - 1];
        UpgradeOptionConfigTable.push({
            id: `${stat.statKey}_tier_${tier}`,
            statKey: stat.statKey,
            tier,
            title: stat.title,
            desc: `+${value}${stat.percent ? '%' : ''} ${stat.title}`,
            addStats: { [stat.statKey]: value },
        });
    }
}
