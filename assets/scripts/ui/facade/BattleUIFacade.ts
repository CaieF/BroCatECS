import { BattleHUD } from '../hud/BattleHUD';
import { BattleHUDData } from '../hud/BattleHUDData';
import { LevelUpPanel } from '../panels/LevelUpPanel';
import { UpgradeOptionData } from '../panels/UpgradeOptionData';
import { StatDisplayItem } from '../panels/StatDisplayItem';
import { PlayerStatViewData } from '../data/PlayerStatViewData';

export class BattleUIFacade {
    private _hud: BattleHUD | null = null;
    private _levelUpPanel: LevelUpPanel | null = null;

    public init(hud: BattleHUD | null, levelUpPanel: LevelUpPanel | null): void {
        this._hud = hud;
        this._levelUpPanel = levelUpPanel;
    }

    public updateHUD(data: BattleHUDData): void {
        this._hud?.setHP(data.hpCurrent, data.hpMax);
        this._hud?.setExp(data.expCurrent, data.expNeed, data.level);
        this._hud?.setGold(data.gold);
        this._hud?.setMaterial(data.material);
        this._hud?.setWave(data.waveIndex);
        this._hud?.setWaveTime(data.waveTimeRemaining);
        this._hud?.setUpgradeHint(data.hasPendingLevelUp);
    }

    public showLevelUpPanel(
        options: UpgradeOptionData[],
         statData: PlayerStatViewData,
        refreshCost: number,
        onSelect: (optionId: string) => void,
        onRefresh: () => void
    ): void {
        if (!this._levelUpPanel) return;

        this._levelUpPanel.setOptions(options, onSelect);
        this._levelUpPanel.setStatData(statData);
        this._levelUpPanel.setRefreshCost(refreshCost);
        this._levelUpPanel.setRefreshHandler(onRefresh);
        // this._levelUpPanel.node.active = true;
        this._levelUpPanel.show();
    }

    public hideLevelUpPanel(): void {
        this._levelUpPanel?.hide();
    }

    public updateLevelUpStats(statData: PlayerStatViewData): void {
        this._levelUpPanel?.setStatData(statData);
    }

    
}