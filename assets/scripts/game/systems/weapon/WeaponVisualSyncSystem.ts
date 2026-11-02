import { System } from '../../../core/ecs/System';
import { World } from '../../../core/ecs/World';
import { BattleContext } from '../../battle/BattleContext';
import {
    C_CARRY_WEAPON_ENTITY_LINK,
    C_CARRY_WEAPON_SLOTS,
    C_DESTROY_TAG,
    C_PLAYER_TAG,
    C_POSITION,
    C_WEAPON_INVENTORY,
} from '../../../core/ecs/ComponentTypes';
import { Query } from '../../../core/ecs/Query';
import { CarryWeaponEntityLink } from '../../components/player/CarryWeaponEntityLink';
import { CarryWeaponSlots } from '../../components/player/CarryWeaponSlots';
import { WeaponInventory } from '../../components/player/WeaponInventory';
import { Position } from '../../components/common/Position';
import { CarryWeaponFactory } from '../../factory/CarryWeaponFactory';

/**
 * 这个系统专门做：

 *  读取玩家 WeaponInventory
 *  读取玩家 CarryWeaponEntityLink
 *  如果 dirty == true
 *  回收当前场上所有携带武器实体
 *  按背包顺序重建武器实体
 *  更新 CarryWeaponSlots.count
 *  清掉 dirty

 */
export class WeaponVisualSyncSystem extends System {
    constructor() {
        super();
        this.priority = 16;
        this.runWhenBattlePaused = true;
    }

    public update(world: World, dt: number, ctx: BattleContext): void {
        if (!ctx.effectLayer) return;

        const players = Query.all(
            world,
            C_PLAYER_TAG,
            C_POSITION,
            C_WEAPON_INVENTORY,
            C_CARRY_WEAPON_SLOTS,
            C_CARRY_WEAPON_ENTITY_LINK
        );

        for (const playerEntity of players) {
            const pos = world.requireComponent<Position>(playerEntity, C_POSITION);
            const inventory = world.requireComponent<WeaponInventory>(playerEntity, C_WEAPON_INVENTORY);
            const slots = world.requireComponent<CarryWeaponSlots>(playerEntity, C_CARRY_WEAPON_SLOTS);
            const link = world.requireComponent<CarryWeaponEntityLink>(playerEntity, C_CARRY_WEAPON_ENTITY_LINK);

            if (!link.dirty) {
                continue;
            }

            // 先回收旧武器实体
            for (const weaponEntity of link.weaponEntities) {
                if (!world.hasEntity(weaponEntity)) continue;

                if (!world.hasComponent(weaponEntity, C_DESTROY_TAG)) {
                    world.addComponent(weaponEntity, C_DESTROY_TAG, true);
                }
            }

            link.weaponEntities.length = 0;

            // 数量同步
            slots.count = inventory.weapons.length;

            // 重建新武器实体
            for (let i = 0; i < inventory.weapons.length; i++) {
                const weapon = inventory.weapons[i];

                const weaponEntity = CarryWeaponFactory.create(
                    ctx,
                    world,
                    ctx.effectLayer,
                    playerEntity,
                    i,
                    weapon.weaponKey,
                    weapon.tier,
                    pos.x,
                    pos.y
                );

                link.weaponEntities.push(weaponEntity);
            }

            link.dirty = false;
        }
    }
}