import { _decorator, Button, Component, Label, RichText, Sprite } from 'cc';
import { UpgradeOptionData } from './UpgradeOptionData';
import { SpriteFrameBinding } from '../common/SpriteFrameBinding';
import { CardTierVisuals } from '../utils/CardTierVisuals';
import { StatIconPaths } from '../utils/StatIconPaths';

const { ccclass, property } = _decorator;

@ccclass('UpgradeOptionItem')
export class UpgradeOptionItem extends Component {
    @property(Label)
    public titleLabel: Label | null = null;

    @property(RichText)
    public descLabel: RichText | null = null;

    @property(Sprite)
    public iconSprite: Sprite | null = null;

    @property(Sprite)
    public backgroundSprite: Sprite | null = null;

    @property(Sprite)
    public cardSprite: Sprite | null = null;

    @property(Label)
    public tierLabel: Label | null = null;

    @property(Button)
    public selectButton: Button | null = null;

    private _optionId: string = '';
    private _onSelect: ((optionId: string) => void) | null = null;
    private _iconBinding: SpriteFrameBinding | null = null;
    private _backgroundBinding: SpriteFrameBinding | null = null;
    private _cardBinding: SpriteFrameBinding | null = null;

    protected onEnable(): void {
        this.selectButton?.node.on(Button.EventType.CLICK, this.onClickSelect, this);
    }

    protected onDisable(): void {
        this.selectButton?.node.off(Button.EventType.CLICK, this.onClickSelect, this);
    }

    protected onDestroy(): void {
        this._iconBinding?.dispose();
        this._backgroundBinding?.dispose();
        this._cardBinding?.dispose();
        this._onSelect = null;
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

        const visual = CardTierVisuals[data.tier] ?? CardTierVisuals[1];
        if (this.tierLabel) {
            this.tierLabel.string = `升级 ${visual.label}`;
        }

        // 面板可能先 setData 再激活，因此在首次绑定时取得资源引用。
        if (this.iconSprite) {
            if (!this._iconBinding) {
                this._iconBinding = new SpriteFrameBinding(this.iconSprite, { width: 64, height: 64 });
            }
            this._iconBinding.setPath(data.iconPath ?? StatIconPaths[data.statKey] ?? '');
        }
        if (this.backgroundSprite) {
            if (!this._backgroundBinding) {
                this._backgroundBinding = new SpriteFrameBinding(this.backgroundSprite);
            }
            this._backgroundBinding.setPath(visual.backgroundPath);
        }
        if (this.cardSprite) {
            if (!this._cardBinding) {
                this._cardBinding = new SpriteFrameBinding(this.cardSprite);
            }
            this._cardBinding.setPath(visual.cardPath);
        }
    }

    private onClickSelect(): void {
        this._onSelect?.(this._optionId);
    }
}
