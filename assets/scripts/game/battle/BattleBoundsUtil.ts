import { Node, UITransform } from 'cc';
import { BattleBounds } from './BattleBounds';

export class BattleBoundsUtil {
    /** 从地图根节点计算战斗边界 */
    public static fromMapRoot(mapRoot: Node | null): BattleBounds {
        const fallback: BattleBounds = {
            minX: -800,
            maxX: 800,
            minY: -450,
            maxY: 450,
        };

        if (!mapRoot) {
            return fallback;
        }

        const uiTransform = mapRoot.getComponent(UITransform);
        if (!uiTransform) {
            return fallback;
        }

        const worldPos = mapRoot.worldPosition;
        const scale = mapRoot.worldScale;

        const width = uiTransform.width * Math.abs(scale.x);
        const height = uiTransform.height * Math.abs(scale.y);

        const halfW = width * 0.5;
        const halfH = height * 0.5;

        return {
            minX: - halfW,
            maxX: halfW,
            minY: - halfH,
            maxY: halfH,
        };
    }
}