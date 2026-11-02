import { WeaponTier } from '../weapon/WeaponTier';

/**
 * 武器等级属性
 */
export interface WeaponTierStats {
    /**
     * 武器等级
     */
    tier: WeaponTier;

    /**
     * 基础伤害
     */
    baseDamage: number;

    /**
     * 攻击间隔
     */
    attackInterval: number;

    /**
     * 暴击伤害倍数
     */
    critMultiplier: number;
    /**
     * 暴击几率
     */
    critChance: number;

    /**
     * 伤害范围
     */
    range: number;
    /**
     * 推退力
     */
    knockback: number;
    /**
     * 生命值偷取
     */
    lifeSteal: number;

    /**
     * 基础价格
     */
    basePrice: number;
}