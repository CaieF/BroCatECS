import { _decorator, Button, Component, Node, Toggle } from 'cc';
import { PlayerStatViewData } from '../data/PlayerStatViewData';
import { StatInfoItemView } from './StatInfoItemView';
import { StatInfoItemData } from '../data/StatInfoItemData';

const { ccclass, property } = _decorator;

@ccclass('StatPanelView')
export class StatPanelView extends Component {
    @property(Toggle)
    public mainTabButton: Toggle | null = null;

    @property(Toggle)
    public subTabButton: Toggle | null = null;

    @property(Node)
    public mainGroupRoot: Node | null = null;

    @property(Node)
    public subGroupRoot: Node | null = null;

    @property(StatInfoItemView)
    public currentLevelItem: StatInfoItemView | null = null;

    @property(StatInfoItemView)
    public maxHpItem: StatInfoItemView | null = null;

    @property(StatInfoItemView)
    public hpRegenItem: StatInfoItemView | null = null;

    @property(StatInfoItemView)
    public lifeStealItem: StatInfoItemView | null = null;

    @property(StatInfoItemView)
    public damagePctItem: StatInfoItemView | null = null;

    @property(StatInfoItemView)
    public meleeDamageItem: StatInfoItemView | null = null;

    @property(StatInfoItemView)
    public rangedDamageItem: StatInfoItemView | null = null;

    @property(StatInfoItemView)
    public elementalDamageItem: StatInfoItemView | null = null;

    @property(StatInfoItemView)
    public attackSpeedPctItem: StatInfoItemView | null = null;

    @property(StatInfoItemView)
    public critChanceItem: StatInfoItemView | null = null;

    @property(StatInfoItemView)
    public engineeringItem: StatInfoItemView | null = null;

    @property(StatInfoItemView)
    public rangeItem: StatInfoItemView | null = null;

    @property(StatInfoItemView)
    public armorItem: StatInfoItemView | null = null;

    @property(StatInfoItemView)
    public dodgeItem: StatInfoItemView | null = null;

    @property(StatInfoItemView)
    public speedPctItem: StatInfoItemView | null = null;

    @property(StatInfoItemView)
    public luckItem: StatInfoItemView | null = null;

    @property(StatInfoItemView)
    public harvestingItem: StatInfoItemView | null = null;

    private _showMain: boolean = true;

    protected onEnable(): void {
        this.mainTabButton?.node.on(Button.EventType.CLICK, this.onClickMainTab, this);
        this.subTabButton?.node.on(Button.EventType.CLICK, this.onClickSubTab, this);
    }

    protected onDisable(): void {
        this.mainTabButton?.node.off(Button.EventType.CLICK, this.onClickMainTab, this);
        this.subTabButton?.node.off(Button.EventType.CLICK, this.onClickSubTab, this);
    }

    public setData(data: PlayerStatViewData): void {
        this.currentLevelItem?.setData(this.makeItem('currentLevel', '当前等级', data.level));
        this.maxHpItem?.setData(this.makeItem('maxHp', '最大生命值', data.maxHp));
        this.hpRegenItem?.setData(this.makeItem('hpRegen', '生命再生', data.hpRegen));
        this.lifeStealItem?.setData(this.makeItem('lifeSteal', '%生命窃取', data.lifeSteal));
        this.damagePctItem?.setData(this.makeItem('damagePct', '%伤害', data.damagePct));
        this.meleeDamageItem?.setData(this.makeItem('meleeDamage', '近战伤害', data.meleeDamage));
        this.rangedDamageItem?.setData(this.makeItem('rangedDamage', '远程伤害', data.rangedDamage));
        this.elementalDamageItem?.setData(this.makeItem('elementalDamage', '元素伤害', data.elementalDamage));
        this.attackSpeedPctItem?.setData(this.makeItem('attackSpeedPct', '%攻击速度', data.attackSpeedPct));
        this.critChanceItem?.setData(this.makeItem('critChance', '%暴击率', data.critChance));
        this.engineeringItem?.setData(this.makeItem('engineering', '工程学', data.engineering));
        this.rangeItem?.setData(this.makeItem('range', '范围', data.range));
        this.armorItem?.setData(this.makeItem('armor', '护甲', data.armor));
        this.dodgeItem?.setData(this.makeItem('dodge', '%闪避', data.dodge));
        this.speedPctItem?.setData(this.makeItem('speedPct', '%速度', data.speedPct));
        this.luckItem?.setData(this.makeItem('luck', '幸运', data.luck));
        this.harvestingItem?.setData(this.makeItem('harvesting', '收获', data.harvesting));
    }

    public showMainTab(): void {
        this._showMain = true;
        this.refreshTabState();
    }

    public showSubTab(): void {
        this._showMain = false;
        this.refreshTabState();
    }

    private onClickMainTab(): void {
        this.mainTabButton.isChecked = true;
        this.showMainTab();
    }

    private onClickSubTab(): void {
        this.subTabButton.isChecked = true;
        this.showSubTab();
    }

    private refreshTabState(): void {
        if (this.mainGroupRoot) {
            this.mainGroupRoot.active = this._showMain;
        }

        if (this.subGroupRoot) {
            this.subGroupRoot.active = !this._showMain;
        }
    }

    private makeItem(key: string, label: string, value: number | string): StatInfoItemData {
        return {
            key,
            label,
            value,
        };
    }
}