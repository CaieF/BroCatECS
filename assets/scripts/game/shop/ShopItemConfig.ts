import { WeaponTier } from '../weapon/WeaponTier';

export type ShopGoodsType = 'weapon' | 'item';

export interface ShopGoodsData {
    id: string;
    type: ShopGoodsType;

    weaponKey?: string;
    weaponTier?: WeaponTier;

    itemKey?: string;

    price: number;
    locked: boolean;
}
