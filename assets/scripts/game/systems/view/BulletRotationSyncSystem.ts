import { math } from 'cc';
import { System } from '../../../core/ecs/System';
import { World } from '../../../core/ecs/World';
import { Query } from '../../../core/ecs/Query';
import { BattleContext } from '../../battle/BattleContext';
import {
    C_PROJECTILE_TAG,
    C_VELOCITY,
    C_VIEW_REF,
} from '../../../core/ecs/ComponentTypes';
import { Velocity } from '../../components/common/Velocity';
import { ViewRef } from '../../components/common/ViewRef';
import { WeaponView } from '../../view/WeaponView';

export class BulletRotationSyncSystem extends System {
    constructor() {
        super();
        this.priority = 1050;
    }

    public update(world: World, dt: number, ctx: BattleContext): void {
        const entities = Query.all(world, C_PROJECTILE_TAG, C_VELOCITY, C_VIEW_REF);

        for (const entity of entities) {
            const velocity = world.requireComponent<Velocity>(entity, C_VELOCITY);
            const viewRef = world.requireComponent<ViewRef>(entity, C_VIEW_REF);

            const node = viewRef.node;
            if (!node || !node.isValid) continue;

            if (Math.abs(velocity.x) < 0.0001 && Math.abs(velocity.y) < 0.0001) {
                continue;
            }

            const angleRad = Math.atan2(velocity.y, velocity.x);
            const angleDeg = math.toDegree(angleRad);

        
            node.angle = angleDeg;
            // node.getComponent(WeaponView).update_visual(angleDeg);
        }
    }
}