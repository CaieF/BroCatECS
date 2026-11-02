import { System } from '../../../core/ecs/System';
import { World } from '../../../core/ecs/World';
import { BattleContext } from '../../battle/BattleContext';
import {
    C_BONUS_STATS,
    C_CARRY_WEAPON_ENTITY_LINK,
    C_CARRY_WEAPON_SLOTS,
    C_ECONOMY,
    C_FINAL_STATS,
    C_ITEM_INVENTORY,
    C_LEVEL,
    C_PENDING_LEVEL_UP,
    C_WEAPON_INVENTORY,
} from '../../../core/ecs/ComponentTypes';
import { PendingLevelUp } from '../../components/player/PendingLevelUp';
import { Economy } from '../../components/player/Economy';
import { FinalStats } from '../../components/actor/FinalStats';
import { Level } from '../../components/player/Level';
import { CarryWeaponSlots } from '../../components/player/CarryWeaponSlots';
import { StatPanelUtil } from '../../../ui/common/StatPanelUtil';
import { ShopTestDataBuilder } from '../../../ui/utils/ShopTestDataBuilder';
import { WeaponInventory } from '../../components/player/WeaponInventory';
import { ItemInventory } from '../../components/player/ItemInventory';
import { ShopItemGenerator } from '../../shop/ShopItemGenerator';
import { ShopGoodsData } from '../../shop/ShopItemConfig';
import { BonusStats } from '../../components/actor/BonusStats';
import { StatApplyUtil } from '../../formula/StatApplyUtil';
import { ItemConfigTable } from '../../config/ItemConfig';
import { CarryWeaponEntityLink } from '../../components/player/CarryWeaponEntityLink';
import { OwnedWeaponViewData } from '../../../ui/data/OwnedWeaponViewData';
import { WeaponMergeService } from '../../weapon/WeaponMergeService';
import { WeaponDefinitionUtil } from '../../config/WeaponDefinitionUtil';
import { SelectedWeaponInfoData } from '../../../ui/data/SelectedWeaponInfoData';

export class ShopFlowSystem extends System {
    constructor() {
        super();
        this.priority = 1450;
        this.runWhenBattlePaused = true;
    }

    public update(world: World, dt: number, ctx: BattleContext): void {
        const ui = ctx.shopUIFacade;
        if (!ui) return;

        const player = ctx.playerEntity;
        if (!player || !world.hasEntity(player)) return;

        if (!world.hasComponent(player, C_PENDING_LEVEL_UP)) return;
        if (!world.hasComponent(player, C_ECONOMY)) return;
        if (!world.hasComponent(player, C_FINAL_STATS)) return;
        if (!world.hasComponent(player, C_LEVEL)) return;
        if (!world.hasComponent(player, C_CARRY_WEAPON_SLOTS)) return;
        if (!world.hasComponent(player, C_WEAPON_INVENTORY)) return;
        if (!world.hasComponent(player, C_ITEM_INVENTORY)) return;
        if (!world.hasComponent(player, C_BONUS_STATS)) return;
        if (!world.hasComponent(player, C_CARRY_WEAPON_ENTITY_LINK)) return;

        const pending = world.requireComponent<PendingLevelUp>(player, C_PENDING_LEVEL_UP);

        if (ctx.waveJustEnded && !ctx.waveEndUIHandled) {
            ctx.waveEndUIHandled = true;

            if (pending.count <= 0 && !ctx.shopPanelOpen) {
                this.openShopPanel(world, ctx);
            }
        }

        if (
            ctx.waveEndUIHandled &&
            !ctx.levelUpPanelOpen &&
            !ctx.shopPanelOpen &&
            pending.count <= 0 &&
            ctx.battlePaused
        ) {
            this.openShopPanel(world, ctx);
        }
    }

    private openShopPanel(world: World, ctx: BattleContext): void {
        const player = ctx.playerEntity;
        if (!player || !world.hasEntity(player)) return;

        const economy = world.requireComponent<Economy>(player, C_ECONOMY);
        const stats = world.requireComponent<FinalStats>(player, C_FINAL_STATS);
        const level = world.requireComponent<Level>(player, C_LEVEL);
        const weaponInventory = world.requireComponent<WeaponInventory>(player, C_WEAPON_INVENTORY);
        const itemInventory = world.requireComponent<ItemInventory>(player, C_ITEM_INVENTORY);

        ctx.shopPanelOpen = true;
        ctx.battlePaused = true;

        if (ctx.currentShopItems.length === 0) {
            ctx.currentShopItems = ShopItemGenerator.buildTestShopGoods().map(g => this.toViewData(g));
        }

        const statData = StatPanelUtil.fromStats(level.current, stats);
        const ownedWeapons = ShopTestDataBuilder.buildOwnedWeapons(weaponInventory);
        const ownedItems = ShopTestDataBuilder.buildOwnedItems(itemInventory);

        ctx.shopUIFacade?.showShopPanel(
            `商店（第${Math.max(1, ctx.currentWave - 1)}波）`,
            economy.gold,
            1,
            statData,
            ctx.currentShopItems,
            ownedWeapons,
            ownedItems,
            (itemId: string) => {
                this.handleBuy(world, ctx, itemId);
            },
            (itemId: string) => {
                this.handleToggleLock(ctx, itemId);
            },
            (weaponData: OwnedWeaponViewData) => {
                this.handleClickWeapon(world, ctx, weaponData);
            },
            () => {
                this.handleRefresh(ctx, world);
            },
            () => {
                this.handleSort(ctx, world);
            },
            () => {
                this.handleDepart(ctx);
            }
        );
    }

    private handleBuy(world: World, ctx: BattleContext, itemId: string): void {
        const player = ctx.playerEntity;
        if (!player || !world.hasEntity(player)) return;

        const economy = world.requireComponent<Economy>(player, C_ECONOMY);
        const weaponInventory = world.requireComponent<WeaponInventory>(player, C_WEAPON_INVENTORY);
        const itemInventory = world.requireComponent<ItemInventory>(player, C_ITEM_INVENTORY);
        const carryWeaponSlots = world.requireComponent<CarryWeaponSlots>(player, C_CARRY_WEAPON_SLOTS);
        const weaponLink = world.requireComponent<CarryWeaponEntityLink>(player, C_CARRY_WEAPON_ENTITY_LINK);
        const bonusStats = world.requireComponent<BonusStats>(player, C_BONUS_STATS);

        const goods = ShopItemGenerator.buildTestShopGoods();
        const itemData = goods.find(g => g.id === itemId);
        if (!itemData) return;

        if (economy.gold < itemData.price) {
            return;
        }

        if (itemData.type === 'weapon') {
            if (!itemData.weaponKey || !itemData.weaponTier) return;

            // 武器槽未满，直接加入
            if (weaponInventory.weapons.length < weaponInventory.maxSlots) {
                economy.gold -= itemData.price;

                weaponInventory.weapons.push({
                    weaponKey: itemData.weaponKey,
                    tier: itemData.weaponTier,
                });

                carryWeaponSlots.count = weaponInventory.weapons.length;
                weaponLink.dirty = true;

                console.log('[Shop] buy weapon =', itemData.weaponKey);
            } else {
                // 武器槽已满，尝试自动合成
                const canAutoMerge = WeaponMergeService.canMergeWithIncoming(
                    weaponInventory,
                    itemData.weaponKey,
                    itemData.weaponTier
                );

                if (!canAutoMerge) {
                    console.log('[Shop] weapon slots full and cannot auto merge');
                    return;
                }

                economy.gold -= itemData.price;

                const merged = WeaponMergeService.mergeWithIncoming(
                    weaponInventory,
                    itemData.weaponKey,
                    itemData.weaponTier
                );

                if (merged) {
                    carryWeaponSlots.count = weaponInventory.weapons.length;
                    weaponLink.dirty = true;
                    console.log('[Shop] auto merge weapon =', itemData.weaponKey);
                }
            }
        } else if (itemData.type === 'item') {
            if (!itemData.itemKey) return;

            economy.gold -= itemData.price;

            const existing = itemInventory.items.find(i => i.itemKey === itemData.itemKey);
            if (existing) {
                existing.count += 1;
            } else {
                itemInventory.items.push({
                    itemKey: itemData.itemKey,
                    count: 1,
                });
            }

            const itemCfg = ItemConfigTable[itemData.itemKey];
            if (itemCfg?.addStats) {
                StatApplyUtil.applyPartialBonus(bonusStats, itemCfg.addStats);
            }

            console.log('[Shop] buy item =', itemData.itemKey);
        }

        ctx.currentShopItems = ctx.currentShopItems.filter(i => i.id !== itemId);

        this.rebuildShopUI(world, ctx);
    }

    private handleClickWeapon(world: World, ctx: BattleContext, data: OwnedWeaponViewData): void {
        const player = ctx.playerEntity;
        if (!player || !world.hasEntity(player)) return;

        const weaponInventory = world.requireComponent<WeaponInventory>(player, C_WEAPON_INVENTORY);
        const entry = weaponInventory.weapons[data.index];
        if (!entry) return;

        const def = WeaponDefinitionUtil.getDefinition(entry.weaponKey);
        const tierStats = WeaponDefinitionUtil.getTierStats(entry.weaponKey, entry.tier);

        const canMerge =
            WeaponMergeService.findAnotherSameTierIndex(
                weaponInventory,
                entry.weaponKey,
                entry.tier,
                data.index
            ) >= 0;

        const info: SelectedWeaponInfoData = {
            weaponKey: entry.weaponKey,
            title: `${def.base.name} T${entry.tier}`,
            tier: entry.tier,
            desc: `伤害: ${tierStats.baseDamage}\n攻速: ${tierStats.attackInterval}秒\n射程: ${tierStats.range}`,
            canMerge,
            sellGold: Math.floor(tierStats.basePrice * 0.5),
        };

        ctx.shopUIFacade?.showWeaponInfoPanel(
            info,
            () => {
                this.handleMergeWeapon(world, ctx, data.index);
            },
            () => {
                this.handleSellWeapon(world, ctx, data.index);
            },
            () => {
                ctx.shopUIFacade?.hideWeaponInfoPanel();
            }
        );
    }

    private handleMergeWeapon(world: World, ctx: BattleContext, selectedIndex: number): void {
        const player = ctx.playerEntity;
        if (!player || !world.hasEntity(player)) return;

        const weaponInventory = world.requireComponent<WeaponInventory>(player, C_WEAPON_INVENTORY);
        const carryWeaponSlots = world.requireComponent<CarryWeaponSlots>(player, C_CARRY_WEAPON_SLOTS);
        const weaponLink = world.requireComponent<CarryWeaponEntityLink>(player, C_CARRY_WEAPON_ENTITY_LINK);

        const entry = weaponInventory.weapons[selectedIndex];
        if (!entry) return;

        const otherIndex = WeaponMergeService.findAnotherSameTierIndex(
            weaponInventory,
            entry.weaponKey,
            entry.tier,
            selectedIndex
        );

        if (otherIndex < 0) {
            return;
        }

        const merged = WeaponMergeService.mergeOnce(
            weaponInventory,
            entry.weaponKey,
            entry.tier
        );

        if (!merged) {
            return;
        }

        carryWeaponSlots.count = weaponInventory.weapons.length;
        weaponLink.dirty = true;

        ctx.shopUIFacade?.hideWeaponInfoPanel();
        this.rebuildShopUI(world, ctx);
    }

    private handleSellWeapon(world: World, ctx: BattleContext, selectedIndex: number): void {
        const player = ctx.playerEntity;
        if (!player || !world.hasEntity(player)) return;

        const weaponInventory = world.requireComponent<WeaponInventory>(player, C_WEAPON_INVENTORY);
        const carryWeaponSlots = world.requireComponent<CarryWeaponSlots>(player, C_CARRY_WEAPON_SLOTS);
        const weaponLink = world.requireComponent<CarryWeaponEntityLink>(player, C_CARRY_WEAPON_ENTITY_LINK);
        const economy = world.requireComponent<Economy>(player, C_ECONOMY);

        const entry = weaponInventory.weapons[selectedIndex];
        if (!entry) return;

        const tierStats = WeaponDefinitionUtil.getTierStats(entry.weaponKey, entry.tier);
        const sellGold = Math.floor(tierStats.basePrice * 0.5);

        economy.gold += sellGold;
        weaponInventory.weapons.splice(selectedIndex, 1);

        carryWeaponSlots.count = weaponInventory.weapons.length;
        weaponLink.dirty = true;

        ctx.shopUIFacade?.hideWeaponInfoPanel();
        this.rebuildShopUI(world, ctx);
    }

    private handleToggleLock(ctx: BattleContext, itemId: string): void {
        const item = ctx.currentShopItems.find(i => i.id === itemId);
        if (!item) return;

        item.locked = !item.locked;
        this.rebuildShopUIWithCurrent(ctx);
    }

    private handleRefresh(ctx: BattleContext, world: World): void {
        const player = ctx.playerEntity;
        if (!player || !world.hasEntity(player)) return;

        const economy = world.requireComponent<Economy>(player, C_ECONOMY);
        const refreshCost = 1;

        if (economy.gold < refreshCost) {
            return;
        }

        economy.gold -= refreshCost;

        const lockedItems = ctx.currentShopItems.filter(i => i.locked);
        const newItems = ShopItemGenerator.buildTestShopGoods().map(g => this.toViewData(g));

        const result = [...lockedItems];
        for (const item of newItems) {
            if (result.length >= 4) break;
            if (result.some(r => r.id === item.id)) continue;
            result.push(item);
        }

        ctx.currentShopItems = result;
        this.rebuildShopUI(world, ctx);
    }

    private handleSort(ctx: BattleContext, world: World): void {
        ctx.currentShopItems.sort((a, b) => a.price - b.price);
        this.rebuildShopUI(world, ctx);
    }

    private handleDepart(ctx: BattleContext): void {
        ctx.shopPanelOpen = false;
        ctx.battlePaused = false;
        ctx.waveEndUIHandled = false;
        ctx.currentShopItems = [];

        ctx.shopUIFacade?.hideWeaponInfoPanel();
        ctx.shopUIFacade?.hideShopPanel();
    }

    private rebuildShopUI(world: World, ctx: BattleContext): void {
        const player = ctx.playerEntity;
        if (!player || !world.hasEntity(player)) return;

        const economy = world.requireComponent<Economy>(player, C_ECONOMY);
        const stats = world.requireComponent<FinalStats>(player, C_FINAL_STATS);
        const level = world.requireComponent<Level>(player, C_LEVEL);
        const weaponInventory = world.requireComponent<WeaponInventory>(player, C_WEAPON_INVENTORY);
        const itemInventory = world.requireComponent<ItemInventory>(player, C_ITEM_INVENTORY);

        const statData = StatPanelUtil.fromStats(level.current, stats);
        const ownedWeapons = ShopTestDataBuilder.buildOwnedWeapons(weaponInventory);
        const ownedItems = ShopTestDataBuilder.buildOwnedItems(itemInventory);

        ctx.shopUIFacade?.showShopPanel(
            `商店（第${Math.max(1, ctx.currentWave - 1)}波）`,
            economy.gold,
            1,
            statData,
            ctx.currentShopItems,
            ownedWeapons,
            ownedItems,
            (itemId: string) => {
                this.handleBuy(world, ctx, itemId);
            },
            (itemId: string) => {
                this.handleToggleLock(ctx, itemId);
            },
            (weaponData: OwnedWeaponViewData) => {
                this.handleClickWeapon(world, ctx, weaponData);
            },
            () => {
                this.handleRefresh(ctx, world);
            },
            () => {
                this.handleSort(ctx, world);
            },
            () => {
                this.handleDepart(ctx);
            }
        );
    }

    private rebuildShopUIWithCurrent(ctx: BattleContext): void {
        const world = ctx.world;
        const player = ctx.playerEntity;
        if (!player || !world.hasEntity(player)) return;

        const economy = world.requireComponent<Economy>(player, C_ECONOMY);
        const stats = world.requireComponent<FinalStats>(player, C_FINAL_STATS);
        const level = world.requireComponent<Level>(player, C_LEVEL);
        const weaponInventory = world.requireComponent<WeaponInventory>(player, C_WEAPON_INVENTORY);
        const itemInventory = world.requireComponent<ItemInventory>(player, C_ITEM_INVENTORY);

        ctx.shopUIFacade?.showShopPanel(
            `商店（第${Math.max(1, ctx.currentWave - 1)}波）`,
            economy.gold,
            1,
            StatPanelUtil.fromStats(level.current, stats),
            ctx.currentShopItems,
            ShopTestDataBuilder.buildOwnedWeapons(weaponInventory),
            ShopTestDataBuilder.buildOwnedItems(itemInventory),
            (itemId: string) => {
                this.handleBuy(world, ctx, itemId);
            },
            (itemId: string) => {
                this.handleToggleLock(ctx, itemId);
            },
            (weaponData: OwnedWeaponViewData) => {
                this.handleClickWeapon(world, ctx, weaponData);
            },
            () => {
                this.handleRefresh(ctx, world);
            },
            () => {
                this.handleSort(ctx, world);
            },
            () => {
                this.handleDepart(ctx);
            }
        );
    }

    private toViewData(g: ShopGoodsData) {
        if (g.type === 'weapon' && g.weaponKey && g.weaponTier) {
            return ShopTestDataBuilder.buildShopItemViews([g])[0];
        }

        if (g.type === 'item' && g.itemKey) {
            return ShopTestDataBuilder.buildShopItemViews([g])[0];
        }

        return {
            id: g.id,
            type: 'item' as const,
            title: '未知',
            desc: '',
            price: g.price,
            locked: g.locked,
        };
    }
}