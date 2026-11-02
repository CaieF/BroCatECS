import { _decorator, Button, Color, Component, Label, Sprite } from 'cc';
import { OwnedWeaponViewData } from '../data/OwnedWeaponViewData';
import { WeaponTier } from '../../game/weapon/WeaponTier';

const { ccclass, property } = _decorator;

@ccclass('OwnedWeaponSlotItem')
export class OwnedWeaponSlotItem extends Component {
    @property(Sprite)
    public iconSprite: Sprite | null = null;

    @property(Label)
    public titleLabel: Label | null = null;

    @property(Sprite)
    public bgSprite: Sprite | null = null;

    @property(Button)
    public clickButton: Button | null = null;

    private _data: OwnedWeaponViewData | null = null;
    private _onClick: ((data: OwnedWeaponViewData) => void) | null = null;

    protected onEnable(): void {
        this.clickButton?.node.on(Button.EventType.CLICK, this.onClickSelf, this);
    }

    protected onDisable(): void {
        this.clickButton?.node.off(Button.EventType.CLICK, this.onClickSelf, this);
    }

    public setData(data: OwnedWeaponViewData, onClick?: (data: OwnedWeaponViewData) => void): void {
        this._data = data;
        this._onClick = onClick ?? null;

        if (this.titleLabel) {
            this.titleLabel.string = data.title;
        }

        this.refreshTierColor(data.tier);
    }

    private onClickSelf(): void {
        if (this._data && this._onClick) {
            this._onClick(this._data);
        }
    }

    private refreshTierColor(tier: WeaponTier): void {
        if (!this.bgSprite) return;

        switch (tier) {
            case WeaponTier.T1:
                this.bgSprite.color = new Color(30, 30, 30, 255);   // 黑
                break;
            case WeaponTier.T2:
                this.bgSprite.color = new Color(60, 120, 255, 255); // 蓝
                break;
            case WeaponTier.T3:
                this.bgSprite.color = new Color(160, 80, 255, 255); // 紫
                break;
            case WeaponTier.T4:
                this.bgSprite.color = new Color(255, 70, 70, 255);  // 红
                break;
            default:
                this.bgSprite.color = Color.WHITE;
                break;
        }
    }
}