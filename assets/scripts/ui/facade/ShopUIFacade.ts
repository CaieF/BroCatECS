import { ShopPanel } from '../panels/ShopPanel';
import { ShopItemViewData } from '../data/ShopItemViewData';
import { OwnedWeaponViewData } from '../data/OwnedWeaponViewData';
import { OwnedItemViewData } from '../data/OwnedItemViewData';
import { PlayerStatViewData } from '../data/PlayerStatViewData';
import { SelectedWeaponInfoData } from '../data/SelectedWeaponInfoData';

export class ShopUIFacade {
    private _shopPanel: ShopPanel | null = null;

    public init(shopPanel: ShopPanel | null): void {
        this._shopPanel = shopPanel;
    }

    public showShopPanel(
        title: string,
        gold: number,
        refreshCost: number,
        statData: PlayerStatViewData,
        shopItems: ShopItemViewData[],
        ownedWeapons: OwnedWeaponViewData[],
        ownedItems: OwnedItemViewData[],
        onBuy: (itemId: string) => void,
        onToggleLock: (itemId: string) => void,
        onClickWeapon: (data: OwnedWeaponViewData) => void,
        onRefresh: () => void,
        onSort: () => void,
        onDepart: () => void
    ): void {
        if (!this._shopPanel) return;

        this._shopPanel.setTitle(title);
        this._shopPanel.setGold(gold);
        this._shopPanel.setRefreshCost(refreshCost);
        this._shopPanel.setRefreshEnabled(true);

        this._shopPanel.setStatData(statData);
        this._shopPanel.setShopItems(shopItems, onBuy, onToggleLock);
        this._shopPanel.setOwnedWeapons(ownedWeapons, onClickWeapon);
        this._shopPanel.setOwnedItems(ownedItems);

        this._shopPanel.setRefreshHandler(onRefresh);
        this._shopPanel.setSortHandler(onSort);
        this._shopPanel.setDepartHandler(onDepart);

        this._shopPanel.show();
    }

    public showWeaponInfoPanel(
        data: SelectedWeaponInfoData,
        onMerge: () => void,
        onSell: () => void,
        onCancel: () => void
    ): void {
        this._shopPanel?.showWeaponInfoPanel(data, onMerge, onSell, onCancel);
    }

    public hideWeaponInfoPanel(): void {
        this._shopPanel?.hideWeaponInfoPanel();
    }

    public hideShopPanel(): void {
        this._shopPanel?.hide();
    }

    public refreshGold(gold: number): void {
        this._shopPanel?.setGold(gold);
    }
}
