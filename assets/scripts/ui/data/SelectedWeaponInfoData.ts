import { WeaponTier } from '../../game/weapon/WeaponTier';

export interface SelectedWeaponInfoData {
    weaponKey: string;
    title: string;
    tier: WeaponTier;
    desc: string;

    canMerge: boolean;
    sellGold: number;
}