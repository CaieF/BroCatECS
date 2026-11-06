import { System } from '../../../core/ecs/System';
import { World } from '../../../core/ecs/World';
import { BattleContext } from '../../battle/BattleContext';
import {
    C_BASE_STATS,
    C_BONUS_STATS,
    C_ECONOMY,
    C_FINAL_STATS,
    C_LEVEL,
    C_PENDING_LEVEL_UP,
} from '../../../core/ecs/ComponentTypes';
import { PendingLevelUp } from '../../components/player/PendingLevelUp';
import { UpgradeOptionGenerator } from '../../upgrade/UpgradeOptionGenerator';
import { UpgradeOptionConfig } from '../../config/UpgradeOptionConfig';
import { BaseStats } from '../../components/actor/BaseStats';
import { BonusStats } from '../../components/actor/BonusStats';
import { CharacterStats } from '../../components/actor/CharacterStats';
import { CharacterStatsUtil } from '../../formula/CharacterStatsUtil';
import { StatApplyUtil } from '../../formula/StatApplyUtil';
import { FinalStats } from '../../components/actor/FinalStats';
import { Economy } from '../../components/player/Economy';
import { Level } from '../../components/player/Level';
import { StatPanelUtil } from '../../../ui/common/StatPanelUtil';
import { PlayerStatViewData } from '../../../ui/data/PlayerStatViewData';

export class LevelUpFlowSystem extends System {
    private static readonly REFRESH_COST = 1;

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

        const pending = world.getComponent<PendingLevelUp>(player, C_PENDING_LEVEL_UP);
        if (!pending || pending.count <= 0) return;

        ctx.levelUpPanelOpen = true;
        ctx.battlePaused = true;

        if (ctx.currentUpgradeOptions.length === 0) {
            ctx.currentUpgradeOptions = this.rollOptions(world, player);
        }

        this.showOptions(world, ctx);
    }

    private showOptions(world: World, ctx: BattleContext): void {
        const options = ctx.currentUpgradeOptions;
        const statData = this.buildStatViewData(world, ctx.playerEntity);

        ctx.uiFacade?.showLevelUpPanel(
            options.map(opt => ({
                id: opt.id,
                statKey: opt.statKey,
                tier: opt.tier,
                title: opt.title,
                desc: opt.desc,
            })),
            statData,
            LevelUpFlowSystem.REFRESH_COST,
            (optionId: string) => {
                if (ctx.currentUpgradeOptions !== options) return;
                this.selectUpgradeOption(world, ctx, optionId);
            },
            () => {
                if (ctx.currentUpgradeOptions !== options) return;
                this.refreshUpgradeOptions(world, ctx);
            }
        );
    }

    private selectUpgradeOption(world: World, ctx: BattleContext, optionId: string): void {
        const ui = ctx.uiFacade;
        if (!ui) return;

        const player = ctx.playerEntity;
        if (!player || !world.hasEntity(player)) return;
        if (!ctx.levelUpPanelOpen) return;

        const pending = world.requireComponent<PendingLevelUp>(player, C_PENDING_LEVEL_UP);
        if (pending.count <= 0) return;
        const bonusStats = world.requireComponent<BonusStats>(player, C_BONUS_STATS);

        const option = ctx.currentUpgradeOptions.find(o => o.id === optionId);
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
        if (!ctx.levelUpPanelOpen) return;
        if (!world.hasComponent(player, C_ECONOMY)) return;
        const pending = world.getComponent<PendingLevelUp>(player, C_PENDING_LEVEL_UP);
        if (!pending || pending.count <= 0) return;

        const economy = world.requireComponent<Economy>(player, C_ECONOMY);
        const refreshCost = LevelUpFlowSystem.REFRESH_COST;

        if (economy.gold < refreshCost) {
            return;
        }

        economy.gold -= refreshCost;
        ctx.currentUpgradeOptions = this.rollOptions(world, player);
        this.showOptions(world, ctx);
    }

    private rollOptions(world: World, player: number): UpgradeOptionConfig[] {
        const level = world.getComponent<Level>(player, C_LEVEL);
        const pending = world.requireComponent<PendingLevelUp>(player, C_PENDING_LEVEL_UP);
        const stats = this.getCurrentStats(world, player);

        // 同一波内的升级按获得顺序逐个结算；刷新仍使用当前这一轮的等级。
        return UpgradeOptionGenerator.rollOptions(4, {
            level: Math.max(2, (level?.current ?? 2) - pending.count + 1),
            luck: stats?.luck ?? 0,
        });
    }

    private getCurrentStats(world: World, player: number): CharacterStats | undefined {
        const base = world.getComponent<BaseStats>(player, C_BASE_STATS);
        const bonus = world.getComponent<BonusStats>(player, C_BONUS_STATS);
        if (base && bonus) {
            // 战斗暂停时 StatRebuildSystem 不运行，预览与幸运抽选须使用最新加成。
            const stats = CharacterStatsUtil.clone(base);
            CharacterStatsUtil.addTo(stats, bonus);
            return stats;
        }
        return world.getComponent<FinalStats>(player, C_FINAL_STATS);
    }

    private buildStatViewData(world: World, player: number): PlayerStatViewData | null {
        const stats = this.getCurrentStats(world, player);
        const level = world.getComponent<Level>(player, C_LEVEL);

        if (!stats) return null;

        return StatPanelUtil.fromStats(level?.current ?? 1, stats);
    }
}
