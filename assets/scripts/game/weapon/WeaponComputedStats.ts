/**
 * 定义武器最终计算结果
 */
export interface WeaponComputedStats {
    finalDamage: number;
    finalAttackInterval: number;
    finalRange: number;
    finalCritChance: number;
    finalCritMultiplier: number;
    finalKnockback: number;
    finalLifeSteal: number;
}