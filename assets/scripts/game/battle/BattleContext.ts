
import { Material, Node } from 'cc';
import { World } from '../../core/ecs/World';
import { Entity } from '../../core/ecs/Entity';
import { BattleBounds } from './BattleBounds';
import { WeaponPrefabLibrary } from '../config/WeaponPrefabLibrary';
import { EnemyPrefabLibrary } from '../config/EnemyPrefabLibrary';
import { ProjectilePrefabLibrary } from '../config/ProjectilePrefabLibrary';
import { FloatingTextSpawner } from '../../ui/common/FloatingTextSpawner';
import { NodePoolService } from '../../core/pool/NodePoolService';
import { BattleUIFacade } from '../../ui/facade/BattleUIFacade';
import { UpgradeOptionConfig } from '../config/UpgradeOptionConfig';
import { ShopItemViewData } from '../../ui/data/ShopItemViewData';
import { ShopUIFacade } from '../../ui/facade/ShopUIFacade';

/** 战斗上下文 */
export class BattleContext {
    public world: World = new World();

    /** 战斗根节点 */
    public battleRoot: Node | null = null;
    /** 地图根节点 */
    public mapRoot: Node | null = null;
    /** 玩家层 */
    public playerLayer: Node | null = null;
    /** 敌人层 */
    public enemyLayer: Node | null = null;
    /** 子弹层 */
    public bulletLayer: Node | null = null;
    /** 掉落层 */
    public dropLayer: Node | null = null;
    /** 特效层 */
    public effectLayer: Node | null = null;
    /** UI层 */
    public uiLayer: Node | null = null;

    /** 玩家实体ID */
    public playerEntity: Entity = 0;

    /** 游戏时间 */
    public elapsedTime: number = 0;
    /** 是否暂停 */
    public isPaused: boolean = false;

    /** 输入 */
    public input = {
        up: false,
        down: false,
        left: false,
        right: false,
    };

    /** 受击闪白材质 */
    public flashWhiteMaterial: Material | null = null;

    /** 战斗边界 */
    public bounds: BattleBounds = {
        minX: -800,
        maxX: 800,
        minY: -450,
        maxY: 450,
    };

    public weaponPrefabLibrary: WeaponPrefabLibrary = new WeaponPrefabLibrary();
    public enemyPrefabLibrary: EnemyPrefabLibrary = new EnemyPrefabLibrary();
    public projectilePrefabLibrary: ProjectilePrefabLibrary = new ProjectilePrefabLibrary();

    public currentWave: number = 1;

    public floatingTextSpawner: FloatingTextSpawner | null = null;

    public nodePool: NodePoolService = new NodePoolService();

    public waveElapsed: number = 0;
    public waveSpawnTimers: Map<string, number> = new Map();    
    public waveTimeRemaining: number = 0;

    public uiFacade: BattleUIFacade | null = null;

    public levelUpPanelOpen: boolean = false;
    public currentUpgradeOptions: UpgradeOptionConfig[] = [];

    public waveJustEnded: boolean = false;

    /**
     * 战斗暂停：暂停 ECS 战斗逻辑
     * 但允许标记了 runWhenBattlePaused 的系统继续更新（如 UI）
     */
    public battlePaused: boolean = false;

    public maxAliveEnemyCount: number = 100;

    public shopPanelOpen: boolean = false;

    /**
     * 当前这次 waveJustEnded 是否已经触发过结算 UI（升级/商店）流程
     */
    public waveEndUIHandled: boolean = false;

    /**
     * 当前商店商品缓存（测试阶段先放这里）
     */
    public currentShopItems: ShopItemViewData[] = [];

    public shopUIFacade: ShopUIFacade | null = null;
}