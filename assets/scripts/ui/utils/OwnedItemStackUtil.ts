import { OwnedItemViewData } from '../data/OwnedItemViewData';

export interface RawOwnedItemData {
    id: string;
    title: string;
    iconPath?: string;
}

/**
 * 这个工具用于把背包里的原始道具列表，合并成：    
 * 同类一个槽位
 * count 显示数量
 */
export class OwnedItemStackUtil {
    public static merge(items: RawOwnedItemData[]): OwnedItemViewData[] {
        const map = new Map<string, OwnedItemViewData>();

        for (const item of items) {
            const existing = map.get(item.id);
            if (existing) {
                existing.count += 1;
            } else {
                map.set(item.id, {
                    id: item.id,
                    title: item.title,
                    iconPath: item.iconPath,
                    count: 1,
                });
            }
        }

        return Array.from(map.values());
    }
}
