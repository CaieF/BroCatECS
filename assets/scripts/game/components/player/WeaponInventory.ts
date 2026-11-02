import { WeaponTier } from '../../weapon/WeaponTier';

export interface WeaponInventoryEntry {
    weaponKey: string;
    tier: WeaponTier;
}

export interface WeaponInventory {
    maxSlots: number;
    weapons: WeaponInventoryEntry[];
}