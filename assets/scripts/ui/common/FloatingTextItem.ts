import { _decorator, Color, Component, Label, tween, UIOpacity, Vec3 } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('FloatingTextItem')
export class FloatingTextItem extends Component {
    @property(Label)
    public label: Label | null = null;

    @property(UIOpacity)
    public opacity: UIOpacity | null = null;

    private _onFinish: (() => void) | null = null;

    public play(text: string, color: Color, onFinish: () => void): void {
        this._onFinish = onFinish;

        if (this.label) {
            this.label.string = text;
            this.label.color = color;
        }

        if (this.opacity) {
            this.opacity.opacity = 255;
        }

        this.node.setScale(1, 1, 1);
        this.node.setPosition(this.node.position.x, this.node.position.y, 0);

        tween(this.node)
            .stop()
            .parallel(
                tween(this.node).by(0.6, { position: new Vec3(0, 50, 0) }),
                tween(this.node).to(0.6, { scale: new Vec3(1.1, 1.1, 1) }),
                tween(this.opacity!).to(0.6, { opacity: 0 })
            )
            .call(() => {
                const cb = this._onFinish;
                this._onFinish = null;
                cb?.();
            })
            .start();
    }
}