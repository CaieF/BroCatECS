import { _decorator, Animation, Component, Material, Node, Sprite, Vec3 } from 'cc';

const { ccclass, property } = _decorator;

export type ActorAnimState = 'idle' | 'move' | 'death';

const _tempScale = new Vec3();

interface FlashSpriteBinding {
    sprite: Sprite;
    originalMaterial: Material | null;
}

@ccclass('ActorView')
export class ActorView extends Component {
    @property(Node)
    public visual: Node | null = null;

    @property(Animation)
    public animationComp: Animation | null = null;

    @property([Sprite])
    public flashSprites: Sprite[] = [];

    // 保留旧 prefab 的序列化字段；闪白时序现由 HurtFlash 控制。
    @property({ visible: false })
    public flashPulseSpeed: number = 18;

    private _currentState: ActorAnimState = 'idle';
    private _baseAbsScaleX: number = 1;

    private _flashInitialized: boolean = false;
    private _flashMatTemplate: Material | null = null;
    private _flashBindings: FlashSpriteBinding[] = [];

    protected onLoad(): void {
        const target = this.visual ?? this.node;
        this._baseAbsScaleX = Math.abs(target.scale.x) || 1;
    }

    protected onDisable(): void {
        this.releaseFlashMaterials();
    }

    protected onDestroy(): void {
        this.releaseFlashMaterials();
    }

    /**
     * 设置角色朝向。
     * @param face 面向方向。
     */
    public setFacing(face: 1 | -1): void {
        const target = this.visual ?? this.node;
        const currentScale = target.scale;

        _tempScale.set(
            this._baseAbsScaleX * face,
            currentScale.y,
            currentScale.z
        );

        target.setScale(_tempScale);
    }

    /**
     * 播放动画状态。
     * @param state 动画状态。
     * @returns 
     */
    public playState(state: ActorAnimState): void {
        if (!this.animationComp) return;
        if (this._currentState === state) return;

        const clipState = this.animationComp.getState(state);
        if (!clipState) return;

        this._currentState = state;
        this.animationComp.play(state);
    }

    /**
     * 强制播放动画状态。
     * @param state 动画状态。
     * @returns 
     */
    public forcePlayState(state: ActorAnimState): void {
        if (!this.animationComp) return;

        const clipState = this.animationComp.getState(state);
        if (!clipState) return;

        this._currentState = state;
        this.animationComp.play(state);
    }

    public setFlashEnabled(flashMatTemplate: Material | null, enabled: boolean): void {
        this.setFlashStrength(flashMatTemplate, enabled ? 1 : 0);
    }

    public setFlashStrength(flashMatTemplate: Material | null, strength: number): void {
        if (!flashMatTemplate) {
            this.releaseFlashMaterials();
            return;
        }

        const amount = Number.isFinite(strength) ? Math.min(1, Math.max(0, strength)) : 0;
        if (amount === 0 && !this._flashInitialized) return;

        if (!this._flashInitialized || this._flashMatTemplate !== flashMatTemplate) {
            this.releaseFlashMaterials();
            this.initFlashMaterials(flashMatTemplate);
        }

        for (const { sprite } of this._flashBindings) {
            if (!sprite.isValid || !sprite.enabledInHierarchy) continue;

            // Sprite 换帧/重新启用时会 updateMaterial，customMaterial 才能保留效果。
            if (sprite.customMaterial !== flashMatTemplate) {
                sprite.customMaterial = flashMatTemplate;
            } else if (sprite.getSharedMaterial(0) !== flashMatTemplate) {
                sprite.setSharedMaterial(flashMatTemplate, 0);
            }

            // 实例由 Sprite 持有并销毁，绝不修改共享模板，也不缓存可能已销毁的实例。
            const mat = sprite.getMaterialInstance(0);
            if (!mat) continue;
            mat.setProperty('glowsize', amount);
        }
    }

    private initFlashMaterials(flashMatTemplate: Material): void {
        this._flashMatTemplate = flashMatTemplate;

        const configured = this.flashSprites.filter(sprite => sprite && sprite.isValid);
        const target = this.visual ?? this.node;
        const sprites = configured.length > 0
            ? configured
            : target.getComponentsInChildren(Sprite).filter(sprite => !this.isShadowSprite(sprite.node, target));

        for (const sprite of new Set(sprites)) {
            this._flashBindings.push({ sprite, originalMaterial: sprite.customMaterial });
            sprite.customMaterial = flashMatTemplate;
        }

        this._flashInitialized = true;
    }

    private isShadowSprite(node: Node, visual: Node): boolean {
        for (let current: Node | null = node; current; current = current.parent) {
            if (/shadow/i.test(current.name)) return true;
            if (current === visual) break;
        }
        return false;
    }

    private releaseFlashMaterials(): void {
        for (const { sprite, originalMaterial } of this._flashBindings) {
            if (!sprite.isValid || sprite.customMaterial !== this._flashMatTemplate) continue;

            const shared = sprite.getSharedMaterial(0);
            const rendered = sprite.getRenderMaterial(0);
            if (shared === this._flashMatTemplate && rendered && rendered !== shared) {
                rendered.setProperty('glowsize', 0);
            }
            // 替换材质会由 Cocos 清理旧实例；回池后重新绑定时从零开始。
            sprite.customMaterial = originalMaterial;
        }
        this._flashBindings.length = 0;
        this._flashMatTemplate = null;
        this._flashInitialized = false;
    }
}
