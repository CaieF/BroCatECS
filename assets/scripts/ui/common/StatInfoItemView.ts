import { _decorator, Color, Component, Label, Sprite } from 'cc';
import { StatInfoItemData } from '../data/StatInfoItemData';

const { ccclass, property } = _decorator;

@ccclass('StatInfoItemView')
export class StatInfoItemView extends Component {
    @property(Sprite)
    public iconSprite: Sprite | null = null;

    @property(Label)
    public statNameLabel: Label | null = null;

    @property(Label)
    public statValueLabel: Label | null = null;

    private _data: StatInfoItemData | null = null;

    public setData(data: StatInfoItemData): void {
        this._data = data;

        if (this.statNameLabel) {
            this.statNameLabel.string = data.label;
        }

        if (this.statValueLabel) {
            this.statValueLabel.string = `${data.value}`;
        }

        this.refreshColor();
    }

    public getData(): StatInfoItemData | null {
        return this._data;
    }

    private refreshColor(): void {
        if (!this._data) return;

        const valueNum = typeof this._data.value === 'number'
            ? this._data.value
            : Number(this._data.value);

        let color = Color.WHITE;

        if (!Number.isNaN(valueNum)) {
            if (valueNum > 0) {
                color = new Color(80, 255, 120, 255);   // 绿色
            } else if (valueNum < 0) {
                color = new Color(255, 80, 80, 255);    // 红色
            } else {
                color = new Color(220, 220, 220, 255);  // 白灰色
            }
        }

        if (this.statNameLabel) {
            this.statNameLabel.color = color;
        }

        if (this.statValueLabel) {
            this.statValueLabel.color = color;
        }
    }
}