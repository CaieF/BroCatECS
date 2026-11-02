import { _decorator, Button, Component, Label, Node } from 'cc';
import { UpgradeOptionItem } from './UpgradeOptionItem';
import { UpgradeOptionData } from './UpgradeOptionData';
import { PlayerStatViewData } from '../data/PlayerStatViewData';
import { StatPanelView } from '../common/StatPanelView';

const { ccclass, property } = _decorator;

@ccclass('LevelUpPanel')
export class LevelUpPanel extends Component {
    @property(Node)
    public root: Node | null = null;

    @property([UpgradeOptionItem])
    public optionItems: UpgradeOptionItem[] = [];

    @property(Label)
    public refreshCostLabel: Label | null = null;

    @property(Button)
    public refreshButton: Button | null = null;

    @property(StatPanelView)
    public statPanelView: StatPanelView | null = null;

    private _onSelectOption: ((optionId: string) => void) | null = null;
    private _onRefresh: (() => void) | null = null;

    protected onEnable(): void {
        this.refreshButton?.node.on(Button.EventType.CLICK, this.onClickRefresh, this);
    }

    protected onDisable(): void {
        this.refreshButton?.node.off(Button.EventType.CLICK, this.onClickRefresh, this);
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

    public setOptions(
        options: UpgradeOptionData[],
        onSelect: (optionId: string) => void
    ): void {
        this._onSelectOption = onSelect;

        for (let i = 0; i < this.optionItems.length; i++) {
            const item = this.optionItems[i];
            const data = options[i];

            if (!item) continue;

            if (data) {
                item.node.active = true;
                item.setData(data, this.handleSelectOption.bind(this));
            } else {
                item.node.active = false;
            }
        }
    }

    public setStatData(data: PlayerStatViewData): void {
        this.statPanelView?.setData(data);
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

    public setRefreshHandler(handler: () => void): void {
        this._onRefresh = handler;
    }

    private handleSelectOption(optionId: string): void {
        this._onSelectOption?.(optionId);
    }

    private onClickRefresh(): void {
        this._onRefresh?.();
    }
}