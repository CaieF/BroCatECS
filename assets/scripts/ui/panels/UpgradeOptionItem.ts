import { _decorator, Button, Component, Label, Node, RichText, Sprite } from 'cc';
import { UpgradeOptionData } from './UpgradeOptionData';

const { ccclass, property } = _decorator;

@ccclass('UpgradeOptionItem')
export class UpgradeOptionItem extends Component {
    @property(Label)
    public titleLabel: Label | null = null;

    @property(RichText)
    public descLabel: RichText | null = null;

    @property(Sprite)
    public iconSprite: Sprite | null = null;

    @property(Button)
    public selectButton: Button | null = null;

    private _optionId: string = '';
    private _onSelect: ((optionId: string) => void) | null = null;

    protected onEnable(): void {
        this.selectButton?.node.on(Button.EventType.CLICK, this.onClickSelect, this);
    }

    protected onDisable(): void {
        this.selectButton?.node.off(Button.EventType.CLICK, this.onClickSelect, this);
    }

    public setData(data: UpgradeOptionData, onSelect: (optionId: string) => void): void {
        this._optionId = data.id;
        this._onSelect = onSelect;

        if (this.titleLabel) {
            this.titleLabel.string = data.title;
        }

        if (this.descLabel) {
            this.descLabel.string = data.desc;
        }

        // iconPath 这一步先不处理资源加载，后续再接
    }

    private onClickSelect(): void {
        this._onSelect?.(this._optionId);
    }
}