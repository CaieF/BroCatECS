import { _decorator, Animation, Color, Component, Material, Node, Sprite, Vec3 } from 'cc';

const { ccclass, property } = _decorator;

export type ActorAnimState = 'idle' | 'move' | 'death';

const _tempScale = new Vec3();
const _flashParamsOff = new Float32Array([0, 0, 0, 0]);
const _flashParamsOn = new Float32Array([1, 0, 0, 0]);

@ccclass('ActorView')
export class ActorView extends Component {
    @property(Node)
    public visual: Node | null = null;

    @property(Animation)
    public animationComp: Animation | null = null;

    @property([Sprite])
    public flashSprites: Sprite[] = [];

    @property
    public flashPulseSpeed: number = 18;

    private _currentState: ActorAnimState = 'idle';
    private _baseAbsScaleX: number = 1;

    private _flashEnabled: boolean = false;
    private _flashInitialized: boolean = false;
    private _flashMatTemplate: Material | null = null;

    protected onLoad(): void {
        const target = this.visual ?? this.node;
        this._baseAbsScaleX = Math.abs(target.scale.x) || 1;
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
        if (!flashMatTemplate) return;

        if (!this._flashInitialized || this._flashMatTemplate !== flashMatTemplate) {
            this.initFlashMaterials(flashMatTemplate);
        }

        if (this._flashEnabled === enabled) {
            return;
        }

        this._flashEnabled = enabled;

        for (const sp of this.flashSprites) {
            if (!sp) continue;

            const mat = sp.getMaterialInstance(0);
            if (!mat) continue;

            mat.setProperty('glowsize', enabled ? 1.0 : 0.0);
            mat.setProperty('pulseSpeed', this.flashPulseSpeed);
        }
    }

    private initFlashMaterials(flashMatTemplate: Material): void {
        this._flashMatTemplate = flashMatTemplate;

        for (const sp of this.flashSprites) {
            if (!sp) continue;

            sp.setSharedMaterial(flashMatTemplate, 0);

            const mat = sp.getMaterialInstance(0);
            if (!mat) continue;

            mat.setProperty('glowsize', 0.0);
            mat.setProperty('pulseSpeed', this.flashPulseSpeed);
        }

        this._flashInitialized = true;
        this._flashEnabled = false;
    }
}
