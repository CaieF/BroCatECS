import { WeaponCategory } from '../weapon/WeaponCategory';
import { WeaponScalingEntry } from '../weapon/WeaponScalingEntry';
import { WeaponActionProfile } from './WeaponActionProfile';

/**
 * 武器基础定义
 */
export interface WeaponBaseDefinition {
    key: string;
    name: string;
    category: WeaponCategory;

    prefabKey: string;
    projectileKey?: string;

    scaling: WeaponScalingEntry[];

    action: WeaponActionProfile;

    pierce?: number;
    secondTargetDamagePct?: number;

    description?: string;
    minAppearTier?: number;
}