import { _decorator, Component, Node, Vec3 } from 'cc';
const { ccclass, property } = _decorator;

const _temp = new Vec3();

@ccclass('WeaponView')
export class WeaponView extends Component {
    @property(Node)
    public body: Node | null = null;

    @property(Node)
    public muzzle: Node | null = null;

    private _scaleBody: Node | null = null;
    private _bodyScale = new Vec3(1, 1, 1);
    private _facingLeft = false;

    public setBodyLocalOffset(x: number, y: number): void {
        const target = this.body ?? this.node;
        _temp.set(x, y, 0);
        target.setPosition(_temp);
    }

    public getMuzzleWorldPosition(out: Vec3): Vec3 {
        const target = this.muzzle?.isValid ? this.muzzle : this.node;
        return target.getWorldPosition(out);
    }

    public update_visual(angle: number): void {
        if (!this.body || !this.body.isValid) return;
        if (this._scaleBody !== this.body) {
            this._scaleBody = this.body;
            this._bodyScale.set(this.body.scale);
            this._facingLeft = Math.cos(angle * Math.PI / 180) < 0;
        }

        // Keep the authored scale, and retain the last side near vertical aim
        // so a tiny target displacement does not repeatedly mirror the body.
        const facing = Math.cos(angle * Math.PI / 180);
        if (facing < -0.05) this._facingLeft = true;
        else if (facing > 0.05) this._facingLeft = false;
        this.body.setScale(this._bodyScale.x,
            this._bodyScale.y * (this._facingLeft ? -1 : 1), this._bodyScale.z);
    }
}
