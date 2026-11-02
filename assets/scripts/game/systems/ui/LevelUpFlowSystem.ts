import { System } from '../../../core/ecs/System';
import { World } from '../../../core/ecs/World';
import { BattleContext } from '../../battle/BattleContext';
import {
    C_BONUS_STATS,
    C_ECONOMY,
    C_FINAL_STATS,
    C_LEVEL,
    C_PENDING_LEVEL_UP,
} from '../../../core/ecs/ComponentTypes';
import { PendingLevelUp } from '../../components/player/PendingLevelUp';
import { UpgradeOptionGenerator } from '../../upgrade/UpgradeOptionGenerator';
import { UpgradeOptionConfigTable } from '../../config/UpgradeOptionConfig';
import { BonusStats } from '../../components/actor/BonusStats';
import { StatApplyUtil } from '../../formula/StatApplyUtil';
import { FinalStats } from '../../components/actor/FinalStats';
import { StatDisplayItem } from '../../../ui/panels/StatDisplayItem';
import { Economy } from '../../components/player/Economy';
import { Level } from '../../components/player/Level';
import { StatPanelUtil } from '../../../ui/common/StatPanelUtil';
import { PlayerStatViewData } from '../../../ui/data/PlayerStatViewData';

export class LevelUpFlowSystem extends System {
    constructor() {
        super();
        this.priority = 1400;
        this.runWhenBattlePaused = true;
    }

    public update(world: World, dt: number, ctx: BattleContext): void {
        const ui = ctx.uiFacade;
        if (!ui) return;

        const player = ctx.playerEntity;
        if (!player || !world.hasEntity(player)) return;
        if (!world.hasComponent(player, C_PENDING_LEVEL_UP)) return;

        const pending = world.requireComponent<PendingLevelUp>(player, C_PENDING_LEVEL_UP);

        // 仅波次结束时，且有待处理升级，且当前没打开面板，才弹面板
        if (ctx.waveJustEnded && pending.count > 0 && !ctx.levelUpPanelOpen) {
            this.openLevelUpPanel(world, ctx);
        }
    }

    private openLevelUpPanel(world: World, ctx: BattleContext): void {
        const ui = ctx.uiFacade;
        if (!ui) return;

        const player = ctx.playerEntity;
        if (!player || !world.hasEntity(player)) return;

        ctx.levelUpPanelOpen = true;
        ctx.battlePaused = true;

        if (ctx.currentUpgradeOptions.length === 0) {
            ctx.currentUpgradeOptions = UpgradeOptionGenerator.rollOptions(4);
        }

        const statData = this.buildStatViewData(world, player);

        ui.showLevelUpPanel(
            ctx.currentUpgradeOptions.map(opt => ({
                id: opt.id,
                title: opt.title,
                desc: opt.desc,
                iconPath: opt.iconPath,
            })),
            statData,
            1,
            (optionId: string) => {
                this.selectUpgradeOption(world, ctx, optionId);
            },
            () => {
                this.refreshUpgradeOptions(world, ctx);
            }
        );
    }

    private selectUpgradeOption(world: World, ctx: BattleContext, optionId: string): void {
        const ui = ctx.uiFacade;
        if (!ui) return;

        const player = ctx.playerEntity;
        if (!player || !world.hasEntity(player)) return;

        const pending = world.requireComponent<PendingLevelUp>(player, C_PENDING_LEVEL_UP);
        const bonusStats = world.requireComponent<BonusStats>(player, C_BONUS_STATS);

        const option = UpgradeOptionConfigTable.find(o => o.id === optionId);
        if (!option) return;

        StatApplyUtil.applyPartialBonus(bonusStats, option.addStats);

        pending.count = Math.max(0, pending.count - 1);
        ctx.currentUpgradeOptions = [];

        const statData = this.buildStatViewData(world, player);
        ui.updateLevelUpStats(statData);

        if (pending.count > 0) {
            this.openLevelUpPanel(world, ctx);
        } else {
            ctx.levelUpPanelOpen = false;
            // ctx.battlePaused = false;
            ctx.waveEndUIHandled = true;
            ui.hideLevelUpPanel();
        }
    }

    private refreshUpgradeOptions(world: World, ctx: BattleContext): void {
        const ui = ctx.uiFacade;
        if (!ui) return;

        const player = ctx.playerEntity;
        if (!player || !world.hasEntity(player)) return;
        if (!world.hasComponent(player, C_ECONOMY)) return;

        const economy = world.requireComponent<Economy>(player, C_ECONOMY);
        const refreshCost = 1;

        if (economy.gold < refreshCost) {
            return;
        }

        economy.gold -= refreshCost;
        ctx.currentUpgradeOptions = UpgradeOptionGenerator.rollOptions(4);

        const statData = this.buildStatViewData(world, player);

        ui.showLevelUpPanel(
            ctx.currentUpgradeOptions.map(opt => ({
                id: opt.id,
                title: opt.title,
                desc: opt.desc,
                iconPath: opt.iconPath,
            })),
            statData,
            refreshCost,
            (optionId: string) => {
                this.selectUpgradeOption(world, ctx, optionId);
            },
            () => {
                this.refreshUpgradeOptions(world, ctx);
            }
        );
    }

    private buildStatViewData(world: World, player: number): PlayerStatViewData | null {
        const stats = world.getComponent<FinalStats>(player, C_FINAL_STATS);
        const level = world.getComponent<Level>(player, C_LEVEL);

        if (!stats) return null;

        return StatPanelUtil.fromStats(level?.current ?? 1, stats);
    }
}