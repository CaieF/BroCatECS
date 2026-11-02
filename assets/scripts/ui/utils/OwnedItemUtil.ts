import { ItemInventory } from '../../game/components/player/ItemInventory';
import { OwnedItemViewData } from '../data/OwnedItemViewData';
import { ItemConfigTable } from '../../game/config/ItemConfig';

export class OwnedItemUtil {
    /**
     * 物品背包转 UI 数据工具
     * @param inventory 物品库存
     * @returns 
     */
    public static toViewData(inventory: ItemInventory): OwnedItemViewData[] {
        return inventory.items.map(item => {
            const cfg = ItemConfigTable[item.itemKey];

            return {
                id: item.itemKey,
                title: cfg?.name ?? item.itemKey,
                count: item.count,
            };
        });
    }
}