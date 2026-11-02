import { _decorator, Component, Label, Node, ProgressBar } from 'cc';

const { ccclass, property } = _decorator;

@ccclass('BattleHUD')
export class BattleHUD extends Component {
    @property(ProgressBar)
    public hpBar: ProgressBar | null = null;

    @property(Label)
    public hpLabel: Label | null = null;

    @property(ProgressBar)
    public expBar: ProgressBar | null = null;

    @property(Label)
    public levelLabel: Label | null = null;

    @property(Label)
    public goldLabel: Label | null = null;

    @property(Label)
    public materialLabel: Label | null = null;

    @property(Label)
    public waveLabel: Label | null = null;

    @property(Label)
    public waveTimeLabel: Label | null = null;

    @property(Node)
    public upgradeHintIcon: Node | null = null;

    public setHP(current: number, max: number): void {
        const safeMax = Math.max(1, max);
        if (this.hpBar) {
            this.hpBar.progress = current / safeMax;
        }
        if (this.hpLabel) {
            this.hpLabel.string = `${Math.ceil(current)} / ${Math.ceil(max)}`;
        }
    }

    public setExp(current: number, need: number, level: number): void {
        const safeNeed = Math.max(1, need);
        if (this.expBar) {
            this.expBar.progress = current / safeNeed;
        }
        if (this.levelLabel) {
            this.levelLabel.string = `Lv.${level}`;
        }
    }

    public setGold(value: number): void {
        if (this.goldLabel) {
            this.goldLabel.string = `${Math.floor(value)}`;
        }
    }

    public setMaterial(value: number): void {
        if (this.materialLabel) {
            this.materialLabel.string = `${Math.floor(value)}`;
        }
    }

    public setWave(index: number): void {
        if (this.waveLabel) {
            this.waveLabel.string = `第${index}波`;
        }
    }

    public setWaveTime(seconds: number): void {
        if (this.waveTimeLabel) {
            this.waveTimeLabel.string = `${Math.ceil(Math.max(0, seconds))}`;
        }
    }

    public setUpgradeHint(visible: boolean): void {
        if (this.upgradeHintIcon) {
            this.upgradeHintIcon.active = visible;
        }
    }
}