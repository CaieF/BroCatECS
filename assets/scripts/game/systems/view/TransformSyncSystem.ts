import { Vec3 } from 'cc';
import { System } from '../../../core/ecs/System';
import { World } from '../../../core/ecs/World';
import { BattleContext } from '../../battle/BattleContext';
import { Query } from '../../../core/ecs/Query';
import { C_POSITION, C_VIEW_REF } from '../../../core/ecs/ComponentTypes';
import { Position } from '../../components/common/Position';
import { ViewRef } from '../../components/common/ViewRef';

const _tempPos = new Vec3();

/** 位置同步系统 */
export class TransformSyncSystem extends System {
    constructor() {
        super();
        this.priority = 1000;
    }

    public update(world: World, dt: number, ctx: BattleContext): void {
        const entities = Query.all(world, C_POSITION, C_VIEW_REF);

        for (const entity of entities) {
            const position = world.requireComponent<Position>(entity, C_POSITION);
            const viewRef = world.requireComponent<ViewRef>(entity, C_VIEW_REF);

            if (!viewRef.node || !viewRef.node.isValid) continue;

            _tempPos.set(position.x, position.y, 0);
            viewRef.node.setPosition(_tempPos);
        }
    }
}