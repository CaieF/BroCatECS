import { _decorator, Button, Component, Label, Node, Sprite } from 'cc';
import { ShopItemViewData } from '../data/ShopItemViewData';

const { ccclass, property } = _decorator;

@ccclass('ShopItemCard')
export class ShopItemCard extends Component {
    @property(Sprite)
    public iconSprite: Sprite | null = null;

    @property(Label)
    public titleLabel: Label | null = null;

    @property(Label)
    public subTitleLabel: Label | null = null;

    @property(Label)
    public descLabel: Label | null = null;

    @property(Label)
    public priceLabel: Label | null = null;

    @property(Button)
    public buyButton: Button | null = null;

    @property(Button)
    public lockButton: Button | null = null;

    @property(Node)
    public lockedMark: Node | null = null;

    private _itemId: string = '';
    private _onBuy: ((itemId: string) => void) | null = null;
    private _onToggleLock: ((itemId: string) => void) | null = null;

    protected onEnable(): void {
        this.buyButton?.node.on(Button.EventType.CLICK, this.onClickBuy, this);
        this.lockButton?.node.on(Button.EventType.CLICK, this.onClickLock, this);
    }

    protected onDisable(): void {
        this.buyButton?.node.off(Button.EventType.CLICK, this.onClickBuy, this);
        this.lockButton?.node.off(Button.EventType.CLICK, this.onClickLock, this);
    }

    public setData(
        data: ShopItemViewData,
        onBuy: (itemId: string) => void,
        onToggleLock: (itemId: string) => void
    ): void {
        this._itemId = data.id;
        this._onBuy = onBuy;
        this._onToggleLock = onToggleLock;

        if (this.titleLabel) {
            this.titleLabel.string = data.title;
        }

        if (this.subTitleLabel) {
            this.subTitleLabel.string = data.subTitle ?? '';
        }

        if (this.descLabel) {
            this.descLabel.string = data.desc;
        }

        if (this.priceLabel) {
            this.priceLabel.string = `${data.price}`;
        }

        if (this.lockedMark) {
            this.lockedMark.active = data.locked;
        }

        // iconPath 资源加载后续再接，这里先留空
    }

    public setBuyEnabled(enabled: boolean): void {
        if (this.buyButton) {
            this.buyButton.interactable = enabled;
        }
    }

    private onClickBuy(): void {
        this._onBuy?.(this._itemId);
    }

    private onClickLock(): void {
        this._onToggleLock?.(this._itemId);
    }
}
