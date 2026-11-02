import { WeaponTier } from '../../game/weapon/WeaponTier';

export interface OwnedWeaponViewData {
    id: string;
    title: string;
    weaponKey: string;
    tier: WeaponTier;
    index: number;
    iconPath?: string;
}