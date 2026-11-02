import { _decorator, Component, EventKeyboard, Input, input, KeyCode, Material, Node, Prefab } from 'cc';
import { BattleContext } from '../game/battle/BattleContext';
import { BattleController } from '../game/battle/BattleController';
import { CameraFollow2D } from '../game/view/CameraFollow2D';
import { FloatingTextSpawner } from '../ui/common/FloatingTextSpawner';
import { BattleHUD } from '../ui/hud/BattleHUD';
import { LevelUpPanel } from '../ui/panels/LevelUpPanel';
import { BattleUIFacade } from '../ui/facade/BattleUIFacade';
import { ShopPanel } from '../ui/panels/ShopPanel';
import { ShopUIFacade } from '../ui/facade/ShopUIFacade';
const { ccclass, property } = _decorator;

@ccclass('BattleEntry')
export class BattleEntry extends Component {
    @property(Node)
    public battleRoot: Node | null = null;

    @property(Node)
    public mapRoot: Node | null = null;

    @property(Node)
    public playerLayer: Node | null = null;

    @property(Node)
    public enemyLayer: Node | null = null;

    @property(Node)
    public bulletLayer: Node | null = null;

    @property(Node)
    public dropLayer: Node | null = null;

    @property(Node)
    public effectLayer: Node | null = null;

    @property(Node)
    public uiLayer: Node | null = null;

    @property(Node)
    public playerNode: Node | null = null;

    @property(Prefab)
    public enemyChasePrefab: Prefab | null = null;

    @property(Prefab)
    public enemyChargerPrefab: Prefab | null = null;

    @property(Prefab)
    public enemyShooterPrefab: Prefab | null = null;

    @property(Prefab)
    public knifePrefab: Prefab | null = null;

    @property(Prefab)
    public pistolPrefab: Prefab | null = null;

    @property(Prefab)
    public shotgunPrefab: Prefab | null = null;

    @property(Prefab)
    public bulletPistolPrefab: Prefab | null = null;

    @property(Prefab)
    public bulletShotgunPrefab: Prefab | null = null;

    @property(Prefab)
    public enemyBulletBasicPrefab: Prefab | null = null;

    @property(Prefab)
    public pickupGoldExpPrefab: Prefab | null = null;

    @property(Material)
    public flashWhiteMaterial: Material | null = null;

    @property(CameraFollow2D)
    public cameraFollow: CameraFollow2D | null = null;

    @property(FloatingTextSpawner)
    public floatingTextSpawner: FloatingTextSpawner | null = null;

    @property(Prefab)
    public floatingTextPrefab: Prefab | null = null;

    private _ctx: BattleContext | null = null;
    private _controller: BattleController | null = null;

    @property(BattleHUD)
    public battleHUD: BattleHUD | null = null;

    @property(LevelUpPanel)
    public levelUpPanel: LevelUpPanel | null = null;

    @property(ShopPanel)
    public shopPanel: ShopPanel | null = null;

    protected start(): void {
        const ctx = new BattleContext();
        ctx.battleRoot = this.battleRoot;
        ctx.mapRoot = this.mapRoot;
        ctx.playerLayer = this.playerLayer;
        ctx.enemyLayer = this.enemyLayer;
        ctx.bulletLayer = this.bulletLayer;
        ctx.dropLayer = this.dropLayer;
        ctx.effectLayer = this.effectLayer;
        ctx.uiLayer = this.uiLayer;
        ctx.flashWhiteMaterial = this.flashWhiteMaterial;

        // ctx.enemyPrefabLibrary.register('enemyChase', this.enemyChasePrefab);
        // ctx.enemyPrefabLibrary.register('enemyCharger', this.enemyChargerPrefab);
        // ctx.enemyPrefabLibrary.register('enemyShooter', this.enemyShooterPrefab);

        ctx.weaponPrefabLibrary.register('knife', this.knifePrefab);
        ctx.weaponPrefabLibrary.register('pistol', this.pistolPrefab);
        ctx.weaponPrefabLibrary.register('shotgun', this.shotgunPrefab);

        // ctx.projectilePrefabLibrary.register('bulletPistol', this.bulletPistolPrefab);
        // ctx.projectilePrefabLibrary.register('bulletShotgun', this.bulletShotgunPrefab);
        // ctx.projectilePrefabLibrary.register('enemyBulletBasic', this.enemyBulletBasicPrefab);

        this.registerNodePool(ctx);

        this.warmUpNodePool(ctx);
        this.initUIFacade(ctx);

        ctx.floatingTextSpawner = this.floatingTextSpawner;
        
        this._ctx = ctx;
        this._controller = new BattleController(ctx, this.playerNode);
        this._controller.init();

        if (this.floatingTextSpawner) {
            this.floatingTextSpawner.setPool(ctx.nodePool);
        }

        if (this.cameraFollow && this.playerNode) {
            this.cameraFollow.target = this.playerNode;
            this.cameraFollow.setBounds(ctx.bounds);
        }


        input.on(Input.EventType.KEY_DOWN, this.onKeyDown, this);
        input.on(Input.EventType.KEY_UP, this.onKeyUp, this);
    }

    protected update(dt: number): void {
        this._controller?.update(dt);
    }

    protected onDestroy(): void {
        this._controller?.dispose();
        this._controller = null;
        this._ctx = null;
    }

    private initUIFacade(ctx: BattleContext): void {
        const uiFacade = new BattleUIFacade();
        uiFacade.init(this.battleHUD, this.levelUpPanel);
        ctx.uiFacade = uiFacade;

        this.levelUpPanel?.hide();

        const shopUIFacade = new ShopUIFacade();
        shopUIFacade.init(this.shopPanel);
        ctx.shopUIFacade = shopUIFacade;

        this.shopPanel?.hide();
    }

    private registerNodePool(ctx: BattleContext): void {
        ctx.nodePool.register('enemyChase', this.enemyChasePrefab);
        ctx.nodePool.register('enemyCharger', this.enemyChargerPrefab);
        ctx.nodePool.register('enemyShooter', this.enemyShooterPrefab);

        ctx.nodePool.register('knife', this.knifePrefab);
        ctx.nodePool.register('pistol', this.pistolPrefab);
        ctx.nodePool.register('shotgun', this.shotgunPrefab);

        ctx.nodePool.register('bulletPistol', this.bulletPistolPrefab);
        ctx.nodePool.register('bulletShotgun', this.bulletShotgunPrefab);
        ctx.nodePool.register('enemyBulletBasic', this.enemyBulletBasicPrefab);

        ctx.nodePool.register('floatingText', this.floatingTextPrefab);
        ctx.nodePool.register('pickupGoldExp', this.pickupGoldExpPrefab);
    }

    private warmUpNodePool(ctx: BattleContext): void {
        ctx.nodePool.warmup('enemyChase', 20);
        ctx.nodePool.warmup('enemyCharger', 10);
        ctx.nodePool.warmup('enemyShooter', 10);

        ctx.nodePool.warmup('bulletPistol', 30);
        ctx.nodePool.warmup('bulletShotgun', 20);
        ctx.nodePool.warmup('enemyBulletBasic', 20);

        ctx.nodePool.warmup('floatingText', 20);
        ctx.nodePool.warmup('pickupGoldExp', 40);
    }

    private onKeyDown(event: EventKeyboard): void {
        if (!this._ctx) return;

        switch (event.keyCode) {
            case KeyCode.KEY_W:
            case KeyCode.ARROW_UP:
                this._ctx.input.up = true;
                break;
            case KeyCode.KEY_S:
            case KeyCode.ARROW_DOWN:
                this._ctx.input.down = true;
                break;
            case KeyCode.KEY_A:
            case KeyCode.ARROW_LEFT:
                this._ctx.input.left = true;
                break;
            case KeyCode.KEY_D:
            case KeyCode.ARROW_RIGHT:
                this._ctx.input.right = true;
                break;
        }
    }

    private onKeyUp(event: EventKeyboard): void {
        if (!this._ctx) return;

        switch (event.keyCode) {
            case KeyCode.KEY_W:
            case KeyCode.ARROW_UP:
                this._ctx.input.up = false;
                break;
            case KeyCode.KEY_S:
            case KeyCode.ARROW_DOWN:
                this._ctx.input.down = false;
                break;
            case KeyCode.KEY_A:
            case KeyCode.ARROW_LEFT:
                this._ctx.input.left = false;
                break;
            case KeyCode.KEY_D:
            case KeyCode.ARROW_RIGHT:
                this._ctx.input.right = false;
                break;
        }
    }
}


