import { _decorator, Camera, Color, Component, instantiate, Node, Prefab, Vec3 } from 'cc';
import { FloatingTextItem } from './FloatingTextItem';
import { NodePoolService } from '../../core/pool/NodePoolService';

const { ccclass, property } = _decorator;

const _tempWorld = new Vec3();
const _tempScreen = new Vec3();

@ccclass('FloatingTextSpawner')
export class FloatingTextSpawner extends Component {
    @property(Prefab)
    public floatingTextPrefab: Prefab | null = null;

    private _pool: NodePoolService | null = null!;

    // @property(Camera)
    // public worldCamera: Camera | null = null;
     public setPool(pool: NodePoolService): void {
        this._pool = pool;
    }

    public spawn(worldX: number, worldY: number, text: string, type: 'damage' | 'heal' | 'miss', critical: boolean = false): void {
        if (!this._pool) return;
        // if (!this.floatingTextPrefab) return;

        const node = this._pool.get('floatingText');
        if (!node) return;

        this.node.addChild(node);

        // _tempWorld.set(worldX, worldY, 0);
        // this.worldCamera.convertToUINode(_tempWorld, this.node, _tempScreen);
        node.setPosition(worldX, worldY, 0);

        const item = node.getComponent(FloatingTextItem);
        if (!item) return;

        let color = Color.WHITE;
        if (type === 'damage') {
            color = critical ? new Color(255, 180, 50, 255) : new Color(255, 80, 80, 255);
        } else if (type === 'heal') {
            color = new Color(80, 255, 120, 255);
        } else if (type === 'miss') {
            color = new Color(180, 180, 180, 255);
        }

        item.play(text, color, () => {
            this._pool?.put('floatingText', node);
        });
    }
}