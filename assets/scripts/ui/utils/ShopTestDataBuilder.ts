import { ShopItemViewData } from '../data/ShopItemViewData';
import { WeaponInventory } from '../../game/components/player/WeaponInventory';
import { ItemInventory } from '../../game/components/player/ItemInventory';
import { OwnedWeaponViewData } from '../data/OwnedWeaponViewData';
import { OwnedItemViewData } from '../data/OwnedItemViewData';
import { OwnedWeaponUtil } from './OwnedWeaponUtil';
import { OwnedItemUtil } from './OwnedItemUtil';
import { ShopGoodsData } from '../../game/shop/ShopItemConfig';
import { ItemConfigTable } from '../../game/config/ItemConfig';
import { WeaponDefinitionUtil } from '../../game/config/WeaponDefinitionUtil';

export class ShopTestDataBuilder {
    public static buildShopItemViews(goods: ShopGoodsData[]): ShopItemViewData[] {
        return goods.map(g => {
            if (g.type === 'weapon' && g.weaponKey && g.weaponTier) {
                const def = WeaponDefinitionUtil.getDefinition(g.weaponKey);
                const tierStats = WeaponDefinitionUtil.getTierStats(g.weaponKey, g.weaponTier);

                return {
                    id: g.id,
                    type: 'weapon',
                    title: def.base.name,
                    subTitle: def.base.category === 'melee' ? '近战' : '远程',
                    desc: `伤害: ${tierStats.baseDamage}\n攻速: ${tierStats.attackInterval}秒\n射程: ${tierStats.range}`,
                    price: g.price,
                    locked: g.locked,
                };
            }

            if (g.type === 'item' && g.itemKey) {
                const cfg = ItemConfigTable[g.itemKey];
                return {
                    id: g.id,
                    type: 'item',
                    title: cfg?.name ?? g.itemKey,
                    subTitle: '道具',
                    desc: cfg?.desc ?? '',
                    price: g.price,
                    locked: g.locked,
                };
            }

            return {
                id: g.id,
                type: 'item',
                title: '未知',
                desc: '',
                price: g.price,
                locked: g.locked,
            };
        });
    }

    public static buildOwnedWeapons(inventory: WeaponInventory): OwnedWeaponViewData[] {
        return OwnedWeaponUtil.toViewData(inventory);
    }

    public static buildOwnedItems(inventory: ItemInventory): OwnedItemViewData[] {
        return OwnedItemUtil.toViewData(inventory);
    }
}
