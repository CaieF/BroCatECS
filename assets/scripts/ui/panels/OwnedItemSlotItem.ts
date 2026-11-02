import { _decorator, Component, Label, Sprite } from 'cc';
import { OwnedItemViewData } from '../data/OwnedItemViewData';

const { ccclass, property } = _decorator;

@ccclass('OwnedItemSlotItem')
export class OwnedItemSlotItem extends Component {
    @property(Sprite)
    public iconSprite: Sprite | null = null;

    @property(Label)
    public titleLabel: Label | null = null;

    @property(Label)
    public countLabel: Label | null = null;

    public setData(data: OwnedItemViewData): void {
        if (this.titleLabel) {
            this.titleLabel.string = data.title;
        }

        if (this.countLabel) {
            this.countLabel.string = data.count > 1 ? `x${data.count}` : '';
        }

        // iconPath 资源加载后续再接
    }
}