export type ShopItemType = 'weapon' | 'item';

export interface ShopItemViewData {
    id: string;
    type: ShopItemType;

    title: string;
    subTitle?: string;
    desc: string;

    price: number;
    locked: boolean;

    iconPath?: string;
}