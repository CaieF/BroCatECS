import { instantiate, Node } from 'cc';
import { Entity } from '../../core/ecs/Entity';
import { World } from '../../core/ecs/World';
import {
    C_AIM_ROTATION,
    C_CARRY_OWNER,
    C_CARRY_SLOT_INDEX,
    C_CARRY_WEAPON_TAG,
    C_POSITION,
    C_VIEW_REF,
    C_WEAPON_ATTACK_STATE,
    C_WEAPON_RUNTIME,
    C_WEAPON_TARGET,
} from '../../core/ecs/ComponentTypes';
import { Position } from '../components/common/Position';
import { ViewRef } from '../components/common/ViewRef';
import { CarryOwner } from '../components/weapon/CarryOwner';
import { CarrySlotIndex } from '../components/weapon/CarrySlotIndex';
import { AimRotation } from '../components/common/AimRotation';
import { WeaponAttackState } from '../components/weapon/WeaponAttackState';
import { WeaponPrefabLibrary } from '../config/WeaponPrefabLibrary';
import { WeaponTarget } from '../components/weapon/WeaponTarget';
import { WeaponTier } from '../weapon/WeaponTier';
import { WeaponDefinitionUtil } from '../config/WeaponDefinitionUtil';
import { BattleContext } from '../battle/BattleContext';

export class CarryWeaponFactory {
    public static create(
        ctx: BattleContext,
        world: World,
        parent: Node,
        ownerEntity: Entity,
        slotIndex: number,
        weaponKey: string,
        tier: WeaponTier,
        startX: number,
        startY: number
    ): Entity {
        const prefabKey = WeaponDefinitionUtil.getPrefabKey(weaponKey);
        const action = WeaponDefinitionUtil.getActionProfile(weaponKey);

        // const prefab = weaponPrefabLibrary.get(prefabKey);
        // if (!prefab) {
        //     throw new Error(`Weapon prefab not found for key=${prefabKey}, weaponKey=${weaponKey}`);
        // }

        // const node = instantiate(prefab);
        const node = ctx.nodePool.get(prefabKey);
        if (!node) {
            throw new Error(`Weapon pool get failed: key=${prefabKey}`);
        }
        parent.addChild(node);
        node.setPosition(startX, startY, 0);

        const entity = world.createEntity();

        const pos: Position = { x: startX, y: startY };
        const viewRef: ViewRef = { node, poolKey: prefabKey };
        const owner: CarryOwner = { entity: ownerEntity };
        const index: CarrySlotIndex = { value: slotIndex };
        const aimRotation: AimRotation = { rad: 0 };

        const attackState: WeaponAttackState = {
            phase: 'idle',
            timer: 0,
            targetEntity: 0,
            aimRad: 0,

            originX: startX,
            originY: startY,
            anchorFromX: startX,
            anchorFromY: startY,

            recoilFromX: 0,
            recoilFromY: 0,
            recoilToX: 0,
            recoilToY: 0,

            strikeFromX: 0,
            strikeFromY: 0,
            strikeToX: 0,
            strikeToY: 0,
            recoverFromX: 0,
            recoverFromY: 0,

            fired: false,
            damage: null,
            hitEntities: new Set<number>(),
        };

        const weaponTarget: WeaponTarget = {
            targetEntity: 0,
            distanceSq: Number.MAX_VALUE,
        };

        world.addComponent(entity, C_CARRY_WEAPON_TAG, true);
        world.addComponent(entity, C_POSITION, pos);
        world.addComponent(entity, C_VIEW_REF, viewRef);
        world.addComponent(entity, C_CARRY_OWNER, owner);
        world.addComponent(entity, C_CARRY_SLOT_INDEX, index);
        world.addComponent(entity, C_AIM_ROTATION, aimRotation);

        world.addComponent(entity, C_WEAPON_RUNTIME, {
            weaponKey,
            tier,
            type: action.type,
            cooldown: 0,

            recoilDistance: action.recoilDistance,
            recoilDuration: action.recoilDuration,
            recoverDuration: action.recoverDuration ?? 0.1,

            dashDistance: action.dashDistance,
            dashDuration: action.dashDuration,
            hitRadius: action.hitRadius,
            hitStart: action.hitStart ?? 0,
            hitEnd: action.hitEnd ?? 48,

            bulletSpeed: action.bulletSpeed,
        });

        world.addComponent(entity, C_WEAPON_ATTACK_STATE, attackState);
        world.addComponent(entity, C_WEAPON_TARGET, weaponTarget);

        return entity;
    }
}
