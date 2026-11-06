import { math } from 'cc';
import { System } from '../../../core/ecs/System';
import { World } from '../../../core/ecs/World';
import { Query } from '../../../core/ecs/Query';
import { BattleContext } from '../../battle/BattleContext';
import {
    C_AIM_ROTATION,
    C_CARRY_WEAPON_TAG,
    C_VIEW_REF,
} from '../../../core/ecs/ComponentTypes';
import { AimRotation } from '../../components/common/AimRotation';
import { ViewRef } from '../../components/common/ViewRef';
import { WeaponView } from '../../view/WeaponView';

export class CarryWeaponRotationSyncSystem extends System {
    constructor() {
        super();
        this.priority = 1040;
    }

    public update(world: World, dt: number, ctx: BattleContext): void {
        const weapons = Query.all(world, C_CARRY_WEAPON_TAG, C_AIM_ROTATION, C_VIEW_REF);

        for (const entity of weapons) {
            const aimRotation = world.requireComponent<AimRotation>(entity, C_AIM_ROTATION);
            const viewRef = world.requireComponent<ViewRef>(entity, C_VIEW_REF);

            const node = viewRef.node;
            if (!node || !node.isValid) continue;

            node.angle = math.toDegree(aimRotation.rad);
            node.getComponent(WeaponView)?.update_visual(math.toDegree(aimRotation.rad));
        }
    }
}
