import { _decorator, Component, Node, UITransform, Vec3 } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('EnemyView')
export class EnemyView extends Component {
    @property(Node)
    public point: Node | null = null;

    public getShootWorldPosition(out: Vec3): Vec3 {
        const target = this.point ?? this.node;
        const localPos = this.node.parent.getComponent(UITransform).convertToNodeSpaceAR(target.getWorldPosition());
        out.set(localPos);
        return out;
    }
}