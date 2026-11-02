import { WeaponBaseDefinition } from './WeaponBaseDefinition';
import { WeaponTierStats } from './WeaponTierStats';

/**
 * 武器定义
 */
export interface WeaponDefinition {
    base: WeaponBaseDefinition;
    tiers: WeaponTierStats[];
}