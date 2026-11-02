import { _decorator, Camera, Component, Node, UITransform, Vec3, view } from 'cc';
import { BattleBounds } from '../battle/BattleBounds';

const { ccclass, property } = _decorator;

const _tempPos = new Vec3();

@ccclass('CameraFollow2D')
export class CameraFollow2D extends Component {
    @property(Node)
    public target: Node | null = null;

    @property(Camera)
    public cameraComp: Camera | null = null;

    @property
    public minX: number = -800;

    @property
    public maxX: number = 800;

    @property
    public minY: number = -450;

    @property
    public maxY: number = 450;

    public setBounds(bounds: BattleBounds): void {
        this.minX = bounds.minX * 2;
        this.maxX = bounds.maxX * 2;
        this.minY = bounds.minY * 2;
        this.maxY = bounds.maxY * 2;
        console.log('[CameraFollow2D]', this.minX, this.maxX, this.minY, this.maxY);
    }

    protected lateUpdate(dt: number): void {
        if (!this.target) return;

        const targetPos = this.target.worldPosition;
        let camX = targetPos.x;
        let camY = targetPos.y;

        const halfView = this.getCameraHalfVisibleSize();
        const halfW = halfView.x;
        const halfH = halfView.y;

        const clampMinX = this.minX + halfW;
        const clampMaxX = this.maxX - halfW;
        const clampMinY = this.minY + halfH;
        const clampMaxY = this.maxY - halfH;


        if (clampMinX <= clampMaxX) {
            camX = Math.max(clampMinX, Math.min(clampMaxX, camX));
        } else {
            camX = (this.minX + this.maxX) * 0.5;
        }

        if (clampMinY <= clampMaxY) {
            camY = Math.max(clampMinY, Math.min(clampMaxY, camY));
        } else {
            camY = (this.minY + this.maxY) * 0.5;
        }

        _tempPos.set(camX, camY, this.node.worldPosition.z);
        this.node.setWorldPosition(_tempPos);
        // this.node.setPosition(_tempPos);
    }

    private getCameraHalfVisibleSize(): Vec3 {
        const out = new Vec3();

        if (!this.cameraComp || !this.cameraComp.orthoHeight) {
            out.set(0, 0, 0);
            return out;
        }

        const orthoHeight = this.cameraComp.orthoHeight;
        const visibleSize = view.getVisibleSize();
        const aspect = visibleSize.width / visibleSize.height;

        out.set(orthoHeight * aspect, orthoHeight, 0);
        return out;
    }
}