import { _decorator, Button, Component, instantiate, Label, Node, Prefab } from 'cc';
import { PlayerStatViewData } from '../data/PlayerStatViewData';
import { StatPanelView } from '../common/StatPanelView';
import { ShopItemViewData } from '../data/ShopItemViewData';
import { OwnedWeaponViewData } from '../data/OwnedWeaponViewData';
import { OwnedItemViewData } from '../data/OwnedItemViewData';
import { ShopItemCard } from './ShopItemCard';
import { OwnedWeaponSlotItem } from './OwnedWeaponSlotItem';
import { OwnedItemSlotItem } from './OwnedItemSlotItem';
import { WeaponInfoPanel } from './WeaponInfoPanel';
import { SelectedWeaponInfoData } from '../data/SelectedWeaponInfoData';

const { ccclass, property } = _decorator;

@ccclass('ShopPanel')
export class ShopPanel extends Component {
    @property(Node)
    public root: Node | null = null;

    @property(Label)
    public titleLabel: Label | null = null;

    @property(Label)
    public goldLabel: Label | null = null;

    @property(Label)
    public refreshCostLabel: Label | null = null;

    @property(Button)
    public refreshButton: Button | null = null;

    @property(Button)
    public sortButton: Button | null = null;

    @property(Button)
    public departButton: Button | null = null;

    @property([ShopItemCard])
    public shopItemCards: ShopItemCard[] = [];

    @property(Node)
    public weaponSlotContainer: Node | null = null;

    @property(Node)
    public itemSlotContainer: Node | null = null;

    @property(Prefab)
    public ownedWeaponSlotPrefab: Prefab | null = null;

    @property(Prefab)
    public ownedItemSlotPrefab: Prefab | null = null;

    @property(StatPanelView)
    public statPanelView: StatPanelView | null = null;

     @property(WeaponInfoPanel)
    public weaponInfoPanel: WeaponInfoPanel | null = null;

    private _onBuy: ((itemId: string) => void) | null = null;
    private _onToggleLock: ((itemId: string) => void) | null = null;
    private _onRefresh: (() => void) | null = null;
    private _onSort: (() => void) | null = null;
    private _onDepart: (() => void) | null = null;
    private _onClickWeaponSlot: ((data: OwnedWeaponViewData) => void) | null = null;

    protected onEnable(): void {
        this.refreshButton?.node.on(Button.EventType.CLICK, this.onClickRefresh, this);
        this.sortButton?.node.on(Button.EventType.CLICK, this.onClickSort, this);
        this.departButton?.node.on(Button.EventType.CLICK, this.onClickDepart, this);
    }

    protected onDisable(): void {
        this.refreshButton?.node.off(Button.EventType.CLICK, this.onClickRefresh, this);
        this.sortButton?.node.off(Button.EventType.CLICK, this.onClickSort, this);
        this.departButton?.node.off(Button.EventType.CLICK, this.onClickDepart, this);
    }

    public show(): void {
        if (this.root) {
            this.root.active = true;
        } else {
            this.node.active = true;
        }
    }

    public hide(): void {
        if (this.root) {
            this.root.active = false;
        } else {
            this.node.active = false;
        }
    }

    public setTitle(text: string): void {
        if (this.titleLabel) {
            this.titleLabel.string = text;
        }
    }

    public setGold(value: number): void {
        if (this.goldLabel) {
            this.goldLabel.string = `${Math.floor(value)}`;
        }
    }

    public setRefreshCost(cost: number): void {
        if (this.refreshCostLabel) {
            this.refreshCostLabel.string = `刷新 - ${cost}`;
        }
    }

    public setRefreshEnabled(enabled: boolean): void {
        if (this.refreshButton) {
            this.refreshButton.interactable = enabled;
        }
    }

    public setStatData(data: PlayerStatViewData): void {
        this.statPanelView?.setData(data);
    }

    public setShopItems(
        items: ShopItemViewData[],
        onBuy: (itemId: string) => void,
        onToggleLock: (itemId: string) => void
    ): void {
        this._onBuy = onBuy;
        this._onToggleLock = onToggleLock;

        for (let i = 0; i < this.shopItemCards.length; i++) {
            const card = this.shopItemCards[i];
            const data = items[i];

            if (!card) continue;

            if (data) {
                card.node.active = true;
                card.setData(data, this.handleBuy.bind(this), this.handleToggleLock.bind(this));
            } else {
                card.node.active = false;
            }
        }
    }

    public setOwnedWeapons(items: OwnedWeaponViewData[], onClickWeapon: (data: OwnedWeaponViewData) => void): void {
        if (!this.weaponSlotContainer || !this.ownedWeaponSlotPrefab) return;

        this._onClickWeaponSlot = onClickWeapon;
        this.clearChildren(this.weaponSlotContainer);

        for (const data of items) {
            const node = instantiate(this.ownedWeaponSlotPrefab);
            this.weaponSlotContainer.addChild(node);

            const view = node.getComponent(OwnedWeaponSlotItem);
            view?.setData(data);
        }
    }

    public setOwnedItems(items: OwnedItemViewData[]): void {
        if (!this.itemSlotContainer || !this.ownedItemSlotPrefab) return;

        this.clearChildren(this.itemSlotContainer);

        for (const data of items) {
            const node = instantiate(this.ownedItemSlotPrefab);
            this.itemSlotContainer.addChild(node);

            const view = node.getComponent(OwnedItemSlotItem);
            view?.setData(data);
        }
    }

    public showWeaponInfoPanel(
        data: SelectedWeaponInfoData,
        onMerge: () => void,
        onSell: () => void,
        onCancel: () => void
    ): void {
        if (!this.weaponInfoPanel) return;

        this.weaponInfoPanel.setData(data, onMerge, onSell, onCancel);
        this.weaponInfoPanel.show();
    }

    public hideWeaponInfoPanel(): void {
        this.weaponInfoPanel?.hide();
    }

    public setRefreshHandler(handler: () => void): void {
        this._onRefresh = handler;
    }

    public setSortHandler(handler: () => void): void {
        this._onSort = handler;
    }

    public setDepartHandler(handler: () => void): void {
        this._onDepart = handler;
    }

    private handleBuy(itemId: string): void {
        this._onBuy?.(itemId);
    }

    private handleToggleLock(itemId: string): void {
        this._onToggleLock?.(itemId);
    }

    private onClickRefresh(): void {
        this._onRefresh?.();
    }

    private onClickSort(): void {
        this._onSort?.();
    }

    private onClickDepart(): void {
        this._onDepart?.();
    }

    private clearChildren(root: Node): void {
        root.removeAllChildren();
    }
}