import { _decorator, Button, Component, Label, Node } from 'cc';
import { SelectedWeaponInfoData } from '../data/SelectedWeaponInfoData';

const { ccclass, property } = _decorator;

@ccclass('WeaponInfoPanel')
export class WeaponInfoPanel extends Component {
    @property(Node)
    public root: Node | null = null;

    @property(Label)
    public titleLabel: Label | null = null;

    @property(Label)
    public descLabel: Label | null = null;

    @property(Button)
    public mergeButton: Button | null = null;

    @property(Button)
    public sellButton: Button | null = null;

    @property(Button)
    public cancelButton: Button | null = null;

    @property(Label)
    public sellLabel: Label | null = null;

    private _onMerge: (() => void) | null = null;
    private _onSell: (() => void) | null = null;
    private _onCancel: (() => void) | null = null;

    protected onEnable(): void {
        this.mergeButton?.node.on(Button.EventType.CLICK, this.onClickMerge, this);
        this.sellButton?.node.on(Button.EventType.CLICK, this.onClickSell, this);
        this.cancelButton?.node.on(Button.EventType.CLICK, this.onClickCancel, this);
    }

    protected onDisable(): void {
        this.mergeButton?.node.off(Button.EventType.CLICK, this.onClickMerge, this);
        this.sellButton?.node.off(Button.EventType.CLICK, this.onClickSell, this);
        this.cancelButton?.node.off(Button.EventType.CLICK, this.onClickCancel, this);
    }

    public show(): void {
        if (this.root) this.root.active = true;
        else this.node.active = true;
    }

    public hide(): void {
        if (this.root) this.root.active = false;
        else this.node.active = false;
    }

    public setData(
        data: SelectedWeaponInfoData,
        onMerge: () => void,
        onSell: () => void,
        onCancel: () => void
    ): void {
        this._onMerge = onMerge;
        this._onSell = onSell;
        this._onCancel = onCancel;

        if (this.titleLabel) this.titleLabel.string = data.title;
        if (this.descLabel) this.descLabel.string = data.desc;

        if (this.mergeButton) {
            this.mergeButton.node.active = data.canMerge;
            this.mergeButton.interactable = data.canMerge;
        }

        if (this.sellLabel) {
            this.sellLabel.string = `回收 (+${data.sellGold})`;
        }
    }

    private onClickMerge(): void {
        this._onMerge?.();
    }

    private onClickSell(): void {
        this._onSell?.();
    }

    private onClickCancel(): void {
        this._onCancel?.();
    }
}
