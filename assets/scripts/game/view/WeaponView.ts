import { _decorator, Component, Node, UITransform, Vec3 } from 'cc';
const { ccclass, property } = _decorator;

const _temp = new Vec3();

@ccclass('WeaponView')
export class WeaponView extends Component {
    @property(Node)
    public body: Node | null = null;

    @property(Node)
    public muzzle: Node | null = null;

    public setBodyLocalOffset(x: number, y: number): void {
        const target = this.body ?? this.node;
        _temp.set(x, y, 0);
        target.setPosition(_temp);
    }

    public getMuzzleWorldPosition(out: Vec3): Vec3 {
        const target = this.muzzle ?? this.node;
        const localPos = this.node.parent.getComponent(UITransform).convertToNodeSpaceAR(target.getWorldPosition());
        out.set(localPos);
        // return target.getWorldPosition(out);
        return out;
    }

    public update_visual(angle: number): void {
        if (Math.abs(angle) > 90) {
            this.body.setScale(0.5, -0.5);
        } else {
            this.body.setScale(0.5, 0.5);

        }
    }
}