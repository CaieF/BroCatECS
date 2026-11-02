import { WeaponDefinitionTable } from './WeaponDefinitionTable';
import { WeaponTier } from '../weapon/WeaponTier';
import { WeaponDefinition } from './WeaponDefinition';
import { WeaponTierStats } from './WeaponTierStats';
import { WeaponActionProfile } from './WeaponActionProfile';

export class WeaponDefinitionUtil {
    /**
     * 获取武器定义
     * @param weaponKey 武器键
     * @returns 武器定义
     */
    public static getDefinition(weaponKey: string): WeaponDefinition {
        const def = WeaponDefinitionTable[weaponKey];
        if (!def) {
            throw new Error(`WeaponDefinition not found: ${weaponKey}`);
        }
        return def;
    }

    /**
     * 获取武器等级统计
     * @param weaponKey 武器键
     * @param tier 禉级
     * @returns 禉级统计
     */
    public static getTierStats(weaponKey: string, tier: WeaponTier): WeaponTierStats {
        const def = this.getDefinition(weaponKey);
        const stats = def.tiers.find(t => t.tier === tier);
        if (!stats) {
            throw new Error(`Weapon tier stats not found: ${weaponKey} tier=${tier}`);
        }
        return stats;
    }

    /**
     * 获取武器动作配置
     * @param weaponKey 武器键
     * @returns 动作配置
     */
    public static getActionProfile(weaponKey: string): WeaponActionProfile {
        return this.getDefinition(weaponKey).base.action;
    }

    /**
     * 获取武器预制体键
     * @param weaponKey 武器键
     * @returns 预制体键
     */
    public static getPrefabKey(weaponKey: string): string {
        return this.getDefinition(weaponKey).base.prefabKey;
    }

    /**
     * 获取武器下一个等级
     * @param weaponKey 武器键
     * @param tier 禉级
     * @returns 下一个等级
     */
    public static getNextTier(weaponKey: string, tier: WeaponTier): WeaponTier | null {
        if (tier >= WeaponTier.T4) return null;
        return (tier + 1) as WeaponTier;
    }
}