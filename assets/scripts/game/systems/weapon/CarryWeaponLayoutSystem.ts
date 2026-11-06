import { System } from '../../../core/ecs/System';
import { World } from '../../../core/ecs/World';
import { Query } from '../../../core/ecs/Query';
import { Entity } from '../../../core/ecs/Entity';
import { BattleContext } from '../../battle/BattleContext';
import {
    C_AIM_ROTATION,
    C_CARRY_OWNER,
    C_CARRY_SLOT_INDEX,
    C_CARRY_WEAPON_SLOTS,
    C_CARRY_WEAPON_TAG,
    C_POSITION,
    C_WEAPON_ATTACK_STATE,
    C_WEAPON_TARGET,
} from '../../../core/ecs/ComponentTypes';
import { Position } from '../../components/common/Position';
import { CarryOwner } from '../../components/weapon/CarryOwner';
import { CarrySlotIndex } from '../../components/weapon/CarrySlotIndex';
import { CarryWeaponSlots } from '../../components/player/CarryWeaponSlots';
import { AimRotation } from '../../components/common/AimRotation';
// import { CarryWeaponLayoutUtil } from '../../weapon/CarryWeaponLayoutUtil';
import { WeaponAttackState } from '../../components/weapon/WeaponAttackState';
import { WeaponTarget } from '../../components/weapon/WeaponTarget';
import { CarryWeaponLayoutUtil } from '../../../core/utils/CarryWeaponLayoutUtil';

export class CarryWeaponLayoutSystem extends System {
    constructor() {
        super();
        // Seek targets from this frame's carry anchor, after owner movement.
        this.priority = 43;
    }

    public update(world: World, dt: number, ctx: BattleContext): void {
        const weapons = Query.all(
            world,
            C_CARRY_WEAPON_TAG,
            C_CARRY_OWNER,
            C_CARRY_SLOT_INDEX,
            C_POSITION,
            C_AIM_ROTATION,
            C_WEAPON_TARGET
        );

        const ownerToWeapons = new Map<Entity, Entity[]>();

        for (const weaponEntity of weapons) {
            const owner = world.requireComponent<CarryOwner>(weaponEntity, C_CARRY_OWNER);

            let list = ownerToWeapons.get(owner.entity);
            if (!list) {
                list = [];
                ownerToWeapons.set(owner.entity, list);
            }
            list.push(weaponEntity);
        }

        for (const [ownerEntity, weaponEntities] of ownerToWeapons) {
            if (!world.hasEntity(ownerEntity)) continue;
            if (!world.hasComponent(ownerEntity, C_POSITION)) continue;
            if (!world.hasComponent(ownerEntity, C_CARRY_WEAPON_SLOTS)) continue;

            const ownerPos = world.requireComponent<Position>(ownerEntity, C_POSITION);
            const slots = world.requireComponent<CarryWeaponSlots>(ownerEntity, C_CARRY_WEAPON_SLOTS);

            const count = Math.max(1, Math.min(6, slots.count));
            const offsets = CarryWeaponLayoutUtil.getOffsets(count);


            for (const weaponEntity of weaponEntities) {
                const slotIndex = world.requireComponent<CarrySlotIndex>(weaponEntity, C_CARRY_SLOT_INDEX).value;
                const pos = world.requireComponent<Position>(weaponEntity, C_POSITION);
                const aimRotation = world.requireComponent<AimRotation>(weaponEntity, C_AIM_ROTATION);
                const weaponTarget = world.requireComponent<WeaponTarget>(weaponEntity, C_WEAPON_TARGET);

                const local = offsets[Math.max(0, Math.min(slotIndex, offsets.length - 1))];

                let attacking = false;
                if (world.hasComponent(weaponEntity, C_WEAPON_ATTACK_STATE)) {
                    const attackState = world.requireComponent<WeaponAttackState>(weaponEntity, C_WEAPON_ATTACK_STATE);
                    attacking = attackState.phase !== 'idle';
                    attackState.anchorFromX = attackState.originX;
                    attackState.anchorFromY = attackState.originY;
                    attackState.originX = ownerPos.x + local.x;
                    attackState.originY = ownerPos.y + local.y;
                    if (attacking) aimRotation.rad = attackState.aimRad;
                }

                if (!attacking) {
                    const worldOffsetX = local.x;
                    const worldOffsetY = local.y;

                    pos.x = ownerPos.x + worldOffsetX;
                    pos.y = ownerPos.y + worldOffsetY;
                }

                // 每把武器独立瞄准自己的目标
                if (!attacking &&
                    weaponTarget.targetEntity > 0 &&
                    world.hasEntity(weaponTarget.targetEntity) &&
                    world.hasComponent(weaponTarget.targetEntity, C_POSITION)
                ) {
                    const targetPos = world.requireComponent<Position>(weaponTarget.targetEntity, C_POSITION);
                    const dx = targetPos.x - pos.x;
                    const dy = targetPos.y - pos.y;
                    if (dx * dx + dy * dy > 1e-8) aimRotation.rad = Math.atan2(dy, dx);
                }
            }
        }
    }
}
