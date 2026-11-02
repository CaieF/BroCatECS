import { Node, Prefab, Vec3 } from 'cc';
import { C_AIM_ROTATION, C_ANIM_STATE, C_ATTACK_TIMER, C_AUTO_AIM, C_BASE_MOVE_SPEED, C_BASE_STATS, C_BONUS_STATS, C_CAMP, C_CARRY_OWNER, C_CARRY_SLOT_INDEX, C_CARRY_WEAPON_SLOTS, C_CARRY_WEAPON_TAG, C_CHARACTER_IDENTITY, C_COLLIDER, C_CONTACT_DAMAGE, C_DAMAGE, C_DEAD_TAG, C_DEATH_DELAY, C_DESTROY_TAG, C_ECONOMY, C_ENEMY_AI, C_ENEMY_IDENTITY, C_ENEMY_SKILL_CONFIG, C_ENEMY_STATE_MACHINE, C_ENEMY_STATS, C_ENEMY_TAG, C_EXP, C_FACING, C_FINAL_STATS, C_HEALTH, C_HURT_FLASH, C_ITEM_INVENTORY, C_LEVEL, C_LIFE_STEAL_STATE, C_LIFE_TIME, C_MOVE_DIRECTION, C_MOVE_INPUT, C_PENDING_LEVEL_UP, C_PICKUP_MAGNET, C_PICKUP_REWARD, C_PICKUP_TAG, C_PLAYER_TAG, C_POSITION, C_PROJECTILE_TAG, C_REGEN_STATE, C_VELOCITY, C_VIEW_REF, C_WEAPON_ATTACK_STATE, C_WEAPON_INVENTORY, C_WEAPON_RUNTIME, C_WEAPON_SLOTS, C_WEAPON_TARGET } from '../../core/ecs/ComponentTypes';
import { BattleContext } from './BattleContext';
import { PlayerInputSystem } from '../systems/input/PlayerInputSystem';
import { PlayerMoveSystem } from '../systems/input/PlayerMoveSystem';
import { TransformSyncSystem } from '../systems/view/TransformSyncSystem';
import { PlayerFactory } from '../factory/PlayerFactory';
import { EnemyChaseSystem } from '../systems/ai/EnemyChaseSystem';
import { EnemyFactory } from '../factory/EnemyFactory';
import { Position } from '../components/common/Position';
import { TargetSearchSystem } from '../systems/ai/TargetSearchSystem';
import { WeaponFireSystem } from '../systems/combat/WeaponFireSystem';
import { ProjectileMoveSystem } from '../systems/combat/ProjectileMoveSystem';
import { CollisionSystem } from '../systems/combat/CollisionSystem';
import { DamageApplySystem } from '../systems/combat/DamageApplySystem';
import { DeathSystem } from '../systems/combat/DeathSystem';
import { DestroySystem } from '../systems/combat/DestroySystem';
import { MoveDirectionUpdateSystem } from '../systems/view/MoveDirectionUpdateSystem';
import { FacingSystem } from '../systems/view/FacingSystem';
import { AnimationStateSystem } from '../systems/view/AnimationStateSystem';
import { DeathAnimationDelaySystem } from '../systems/combat/DeathAnimationDelaySystem';
import { ViewAnimationSyncSystem } from '../systems/view/ViewAnimationSyncSystem';
import { BulletRotationSyncSystem } from '../systems/view/BulletRotationSyncSystem';
import { HurtFlashSystem } from '../systems/view/HurtFlashSystem';
import { BoundsClampSystem } from '../systems/core/BoundsClampSystem';
import { BattleBoundsUtil } from './BattleBoundsUtil';
import { CarryWeaponLayoutSystem } from '../systems/weapon/CarryWeaponLayoutSystem';
import { CarryWeaponRotationSyncSystem } from '../systems/view/CarryWeaponRotationSyncSystem';
import { CarryWeaponFactory } from '../factory/CarryWeaponFactory';
import { CarryWeaponSlots } from '../components/player/CarryWeaponSlots';
import { WeaponAttackStartSystem } from '../systems/weapon/WeaponAttackStartSystem';
import { WeaponAttackUpdateSystem } from '../systems/weapon/WeaponAttackUpdateSystem';
import { StatRebuildSystem } from '../systems/stat/StatRebuildSystem';
import { WeaponTargetSearchSystem } from '../systems/weapon/WeaponTargetSearchSystem';
import { WeaponTier } from '../weapon/WeaponTier';
import { EnemySkillSystem } from '../systems/enemy/EnemySkillSystem';
import { PlayerDeathSystem } from '../systems/player/PlayerDeathSystem';
import { LifeStealSystem } from '../systems/player/LifeStealSystem';
import { PlayerRegenSystem } from '../systems/player/PlayerRegenSystem';
import { HealApplySystem } from '../systems/player/HealApplySystem';
import { FloatingTextSystem } from '../systems/view/FloatingTextSystem';
import { WaveSystem } from '../systems/wave/WaveSystem';
import { ExpLevelSystem } from '../systems/player/ExpLevelSystem';
import { BattleHUDSyncSystem } from '../systems/ui/BattleHUDSyncSystem';
import { LevelUpFlowSystem } from '../systems/ui/LevelUpFlowSystem';
import { PickupAttractSystem } from '../systems/pickup/PickupAttractSystem';
import { PickupCollectSystem } from '../systems/pickup/PickupCollectSystem';
import { WaveSettlementSystem } from '../systems/wave/WaveSettlementSystem';
import { WaveEventCleanupSystem } from '../systems/wave/WaveEventCleanupSystem';
import { EnemySeparationSystem } from '../systems/enemy/EnemySeparationSystem';
import { ShopFlowSystem } from '../systems/ui/ShopFlowSystem';
import { WeaponVisualSyncSystem } from '../systems/weapon/WeaponVisualSyncSystem';

export class BattleController {
    private _ctx: BattleContext;
    private _playerNode: Node | null = null;
    // private _enemyPrefab: Prefab | null = null;
    // private _projectilePrefab: Prefab | null = null;
    private _carryWeaponPrefab: Prefab | null = null;

    constructor(ctx: BattleContext, playerNode: Node | null = null) {
        this._ctx = ctx;
        this._playerNode = playerNode;
        // this._enemyPrefab = enemyPrefab;
        // this._projectilePrefab = projectilePrefab;
    }

    /** 初始化战斗控制器 */
    public init(): void {
        this.initBounds();
        this.registerComponents();
        this.registerSystems();
        this.createInitialEntities();
    }

    public update(dt: number): void {
        // if (this._ctx.isPaused) return;

        if (!this._ctx.battlePaused) {
            this._ctx.elapsedTime += dt;
        }

        // World 仍然持续更新，由各系统根据 runWhenBattlePaused 决定是否继续执行
        this._ctx.world.update(dt, this._ctx);

        // this.refreshHUD();
    }

    /** 销毁战斗控制器 */
    public dispose(): void {
        this._ctx.world.clear();
        this._ctx.weaponPrefabLibrary.clear();
        this._ctx.enemyPrefabLibrary.clear();
        this._ctx.projectilePrefabLibrary.clear();
        this._ctx.nodePool.clear();
    }

    /** 初始化战斗边界 */
    private initBounds(): void {
        this._ctx.bounds = BattleBoundsUtil.fromMapRoot(this._ctx.mapRoot);
        const b = this._ctx.bounds;
        console.log('[BattleBounds]', b.minX, b.maxX, b.minY, b.maxY);
    }

    /** 注册组件类型 */
    private registerComponents(): void {
        const world = this._ctx.world;

        world.registerComponent(C_PLAYER_TAG);
        world.registerComponent(C_POSITION);
        world.registerComponent(C_VELOCITY);
        world.registerComponent(C_MOVE_INPUT);
        world.registerComponent(C_FINAL_STATS);
        world.registerComponent(C_VIEW_REF);

        world.registerComponent(C_ENEMY_TAG);
        world.registerComponent(C_ENEMY_AI);

        world.registerComponent(C_AUTO_AIM);
        world.registerComponent(C_ATTACK_TIMER);
        world.registerComponent(C_WEAPON_SLOTS);

        world.registerComponent(C_PROJECTILE_TAG);
        world.registerComponent(C_DAMAGE);
        world.registerComponent(C_LIFE_TIME);

        world.registerComponent(C_HEALTH);
        world.registerComponent(C_COLLIDER);
        world.registerComponent(C_DESTROY_TAG);

        world.registerComponent(C_MOVE_DIRECTION);
        world.registerComponent(C_FACING);
        world.registerComponent(C_ANIM_STATE);
        world.registerComponent(C_DEAD_TAG);
        world.registerComponent(C_DEATH_DELAY);
        world.registerComponent(C_HURT_FLASH);

        world.registerComponent(C_CARRY_WEAPON_SLOTS);
        world.registerComponent(C_CARRY_WEAPON_TAG);
        world.registerComponent(C_CARRY_OWNER);
        world.registerComponent(C_CARRY_SLOT_INDEX);
        world.registerComponent(C_AIM_ROTATION);

        world.registerComponent(C_WEAPON_RUNTIME);
        world.registerComponent(C_WEAPON_ATTACK_STATE);

        world.registerComponent(C_CHARACTER_IDENTITY);
        world.registerComponent(C_BASE_MOVE_SPEED);
        world.registerComponent(C_BASE_STATS);
        world.registerComponent(C_BONUS_STATS);

        world.registerComponent(C_ENEMY_IDENTITY);
        world.registerComponent(C_ENEMY_STATS);

        world.registerComponent(C_WEAPON_TARGET);
        world.registerComponent(C_LEVEL);

        world.registerComponent(C_ENEMY_SKILL_CONFIG);
        world.registerComponent(C_ENEMY_STATE_MACHINE);

        world.registerComponent(C_CAMP);
        world.registerComponent(C_CONTACT_DAMAGE);

        world.registerComponent(C_LIFE_STEAL_STATE);
        world.registerComponent(C_REGEN_STATE);

        world.registerComponent(C_EXP);
        world.registerComponent(C_ECONOMY);
        world.registerComponent(C_PENDING_LEVEL_UP);

        world.registerComponent(C_PICKUP_TAG);
        world.registerComponent(C_PICKUP_REWARD);
        world.registerComponent(C_PICKUP_MAGNET);

        world.registerComponent(C_ITEM_INVENTORY);
        world.registerComponent(C_WEAPON_INVENTORY);
    }

    /** 注册系统类型 */
    private registerSystems(): void {
        const world = this._ctx.world;

        world.addSystem(new StatRebuildSystem(), this._ctx);
        world.addSystem(new ExpLevelSystem(), this._ctx);

        world.addSystem(new PlayerInputSystem(), this._ctx);
        world.addSystem(new PlayerMoveSystem(), this._ctx);
        world.addSystem(new EnemyChaseSystem(), this._ctx);
        world.addSystem(new EnemySkillSystem(), this._ctx);
        world.addSystem(new EnemySeparationSystem(), this._ctx);
        
        world.addSystem(new MoveDirectionUpdateSystem(), this._ctx);
        world.addSystem(new FacingSystem(), this._ctx);
        world.addSystem(new AnimationStateSystem(), this._ctx);
        
        world.addSystem(new TargetSearchSystem(), this._ctx);
        world.addSystem(new WeaponTargetSearchSystem(), this._ctx);
        world.addSystem(new CarryWeaponLayoutSystem(), this._ctx);
        world.addSystem(new WeaponAttackStartSystem(), this._ctx);
        world.addSystem(new WeaponAttackUpdateSystem(), this._ctx);
        // world.addSystem(new WeaponFireSystem(this._projectilePrefab), this._ctx);
        world.addSystem(new PickupAttractSystem(), this._ctx);
        world.addSystem(new ProjectileMoveSystem(), this._ctx);
        world.addSystem(new BoundsClampSystem(), this._ctx);

        world.addSystem(new CollisionSystem(), this._ctx);
        world.addSystem(new PickupCollectSystem(), this._ctx);
        world.addSystem(new DamageApplySystem(), this._ctx);
        world.addSystem(new LifeStealSystem(), this._ctx);
        world.addSystem(new PlayerRegenSystem(), this._ctx);
        world.addSystem(new HealApplySystem(), this._ctx);
        world.addSystem(new HurtFlashSystem(), this._ctx);

        world.addSystem(new WaveSystem(), this._ctx)
        world.addSystem(new WeaponVisualSyncSystem(), this._ctx);
        world.addSystem(new WaveSettlementSystem(), this._ctx);

        world.addSystem(new PlayerDeathSystem(), this._ctx);
        world.addSystem(new DeathSystem(), this._ctx);
        world.addSystem(new DeathAnimationDelaySystem(), this._ctx);

        world.addSystem(new BattleHUDSyncSystem(), this._ctx);
        world.addSystem(new LevelUpFlowSystem(), this._ctx);
        world.addSystem(new ShopFlowSystem(), this._ctx);

        world.addSystem(new CarryWeaponRotationSyncSystem(), this._ctx);
        world.addSystem(new BulletRotationSyncSystem(), this._ctx);
        world.addSystem(new TransformSyncSystem(), this._ctx);
        world.addSystem(new ViewAnimationSyncSystem(), this._ctx);
        world.addSystem(new FloatingTextSystem(), this._ctx);
        world.addSystem(new WaveEventCleanupSystem(), this._ctx);
        world.addSystem(new DestroySystem(), this._ctx);
    }

    /** 创建初始实体 */
    private createInitialEntities(): void {
        if (!this._playerNode) {
            console.error('[BattleController] playerNode is null, cannot create player entity.');
            return;
        }

        const playerEntity = PlayerFactory.create(this._ctx.world, this._playerNode);
        this._ctx.playerEntity = playerEntity;
        // this.createCarryWeaponsForPlayer();
        this.createTestEnemy();
    }

    private createCarryWeaponsForPlayer(): void {
    if (!this._ctx.effectLayer) {
        console.warn('[BattleController] effectLayer is null, skip create carry weapons.');
        return;
    }

    const playerEntity = this._ctx.playerEntity;
    if (!playerEntity || !this._ctx.world.hasEntity(playerEntity)) {
        return;
    }

    const playerPos = this._ctx.world.getComponent<Position>(playerEntity, C_POSITION);
    const slots = this._ctx.world.getComponent<CarryWeaponSlots>(playerEntity, C_CARRY_WEAPON_SLOTS);

    if (!playerPos || !slots) return;

    const count = Math.max(1, Math.min(6, slots.count));

    for (let i = 0; i < count; i++) {
        const weaponKey = i === 0 ? 'knife' : 'pistol';
        const tier = WeaponTier.T1;

        CarryWeaponFactory.create(
            this._ctx,
            this._ctx.world,
            this._ctx.effectLayer,
            playerEntity,
            i,
            weaponKey,
            tier,
            playerPos.x,
            playerPos.y
        );
    }
}

    private createTestEnemy(): void {

        if (!this._ctx.enemyLayer) {
            console.warn('[BattleController] enemyLayer is null, skip create test enemy.');
            return;
        }

        const playerPos = this._ctx.world.getComponent<Position>(this._ctx.playerEntity, C_POSITION);
        const px = playerPos?.x ?? 0;
        const py = playerPos?.y ?? 0;

        EnemyFactory.create(
            this._ctx,
            this._ctx.world,
            this._ctx.enemyLayer,
            3001,
            this._ctx.currentWave,
            px + 300,
            py + 100
        );

        EnemyFactory.create(
            this._ctx,
            this._ctx.world,
            this._ctx.enemyLayer,
            3002,
            this._ctx.currentWave,
            px + 500,
            py + 200
        );

        EnemyFactory.create(
            this._ctx,
            this._ctx.world,
            this._ctx.enemyLayer,
            3003,
            this._ctx.currentWave,
            px + 200,
            py + 200
        );
    }

    private refreshHUD(): void {
        const ui = this._ctx.uiFacade;
        if (!ui) return;
        
        const player = this._ctx.playerEntity;
        if (!player || !this._ctx.world.hasEntity(player)) return;
        
        const health = this._ctx.world.getComponent<any>(player, 'Health');
        const level = this._ctx.world.getComponent<any>(player, 'Level');
        const exp = this._ctx.world.getComponent<any>(player, 'Exp');

        const hpCurrent = health?.current ?? 0;
        const hpMax = health?.max ?? 1;

        const levelValue = level?.current ?? 1;
        const expCurrent = exp?.current ?? 0;
        const expNeed = 10; // 先写死，后面你接 ExpFormula

        const gold = 0;     // 后续接正式金币系统
        const material = 0; // 后续接正式材料系统

        const waveIndex = this._ctx.currentWave;
        const waveTimeRemaining = 20 - this._ctx.waveElapsed; // 先临时写，后面从 WaveSystem 正式取

        const hasPendingLevelUp = false; // 后续接待升级次数

        ui.updateHUD({
            hpCurrent,
            hpMax,
            expCurrent,
            expNeed,
            level: levelValue,
            gold,
            material,
            waveIndex,
            waveTimeRemaining,
            hasPendingLevelUp,
        });
    }
}