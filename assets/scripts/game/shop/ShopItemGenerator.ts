import { ShopGoodsData } from './ShopItemConfig';
import { WeaponTier } from '../weapon/WeaponTier';
import { ItemConfigTable } from '../config/ItemConfig';
import { WeaponDefinitionUtil } from '../config/WeaponDefinitionUtil';

export class ShopItemGenerator {
    public static buildTestShopGoods(): ShopGoodsData[] {
        return [
            {
                id: 'shop_weapon_knife_t1',
                type: 'weapon',
                weaponKey: 'knife',
                weaponTier: WeaponTier.T1,
                price: WeaponDefinitionUtil.getTierStats('knife', WeaponTier.T1).basePrice,
                locked: false,
            },
            {
                id: 'shop_weapon_pistol_t1',
                type: 'weapon',
                weaponKey: 'pistol',
                weaponTier: WeaponTier.T1,
                price: WeaponDefinitionUtil.getTierStats('pistol', WeaponTier.T1).basePrice,
                locked: false,
            },
            {
                id: 'shop_item_armor',
                type: 'item',
                itemKey: 'armorPlate',
                price: ItemConfigTable.armorPlate.price,
                locked: false,
            },
            {
                id: 'shop_item_lungs',
                type: 'item',
                itemKey: 'lungs',
                price: ItemConfigTable.lungs.price,
                locked: false,
            },
        ];
    }
}