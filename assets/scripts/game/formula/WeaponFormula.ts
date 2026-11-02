import { FinalStats } from '../components/actor/FinalStats';
import { WeaponComputedStats } from '../weapon/WeaponComputedStats';
import { WeaponScalingStat } from '../weapon/WeaponScalingStat';
import { WeaponTier } from '../weapon/WeaponTier';
import { WeaponDefinitionUtil } from '../config/WeaponDefinitionUtil';
import { WeaponCategory } from '../weapon/WeaponCategory';

export class WeaponFormula {
    /**
     * 计算武器最终属性
     * @param weaponKey 武器键
     * @param tier 品质
     * @param playerStats 玩家属性
     * @param playerLevel 玩家等级
     * @returns 武器最终统计
     */
    public static compute(
        weaponKey: string,
        tier: WeaponTier,
        playerStats: FinalStats,
        playerLevel: number
    ): WeaponComputedStats {
        const def = WeaponDefinitionUtil.getDefinition(weaponKey);
        const tierStats = WeaponDefinitionUtil.getTierStats(weaponKey, tier);

        const scaledBonusDamage = this.computeScalingDamage(weaponKey, playerStats, playerLevel);

        const rawDamage = tierStats.baseDamage + scaledBonusDamage;
        const finalDamage = rawDamage * (1 + playerStats.damagePct / 100);

        const finalAttackInterval = tierStats.attackInterval / (1 + playerStats.attackSpeedPct / 100);

        let finalRange = tierStats.range;
        if (def.base.category === WeaponCategory.Ranged) {
            finalRange += playerStats.range;
        } else {
            finalRange += playerStats.range * 0.5;
        }

        return {
            finalDamage,
            finalAttackInterval: Math.max(0.05, finalAttackInterval),
            finalRange,
            finalCritChance: tierStats.critChance + playerStats.critChance,
            finalCritMultiplier: tierStats.critMultiplier,
            finalKnockback: tierStats.knockback,
            finalLifeSteal: tierStats.lifeSteal + playerStats.lifeSteal,
        };
    }
    
    public static computeScalingDamage(
        weaponKey: string,
        playerStats: FinalStats,
        playerLevel: number
    ): number {
        const def = WeaponDefinitionUtil.getDefinition(weaponKey);
        let total = 0;

        for (const scaling of def.base.scaling) {
            const value = this.getScalingSourceValue(scaling.stat, playerStats, playerLevel);
            total += value * scaling.ratio;
        }

        return total;
    }

    private static getScalingSourceValue(
        stat: WeaponScalingStat,
        playerStats: FinalStats,
        playerLevel: number
    ): number {
        switch (stat) {
            case WeaponScalingStat.MeleeDamage:
                return playerStats.meleeDamage;
            case WeaponScalingStat.RangedDamage:
                return playerStats.rangedDamage;
            case WeaponScalingStat.ElementalDamage:
                return playerStats.elementalDamage;
            case WeaponScalingStat.Armor:
                return playerStats.armor;
            case WeaponScalingStat.Engineering:
                return playerStats.engineering;
            case WeaponScalingStat.Range:
                return playerStats.range;
            case WeaponScalingStat.AttackSpeedPct:
                return playerStats.attackSpeedPct;
            case WeaponScalingStat.Level:
                return playerLevel;
            default:
                return 0;
        }
    }
}