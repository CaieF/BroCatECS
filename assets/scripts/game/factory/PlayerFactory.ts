import { Node } from 'cc';
import { World } from '../../core/ecs/World';
import {
    C_ANIM_STATE,
    C_ATTACK_TIMER,
    C_AUTO_AIM,
    C_BASE_MOVE_SPEED,
    C_BASE_STATS,
    C_BONUS_STATS,
    C_CAMP,
    C_CARRY_WEAPON_ENTITY_LINK,
    C_CARRY_WEAPON_SLOTS,
    C_CHARACTER_IDENTITY,
    C_COLLIDER,
    C_ECONOMY,
    C_EXP,
    C_FACING,
    C_FINAL_STATS,
    C_HEALTH,
    C_HURT_FLASH,
    C_ITEM_INVENTORY,
    C_LEVEL,
    C_LIFE_STEAL_STATE,
    C_MOVE_DIRECTION,
    C_MOVE_INPUT,
    C_PENDING_LEVEL_UP,
    C_PLAYER_TAG,
    C_POSITION,
    C_REGEN_STATE,
    C_VELOCITY,
    C_VIEW_REF,
    C_WEAPON_INVENTORY,
    C_WEAPON_SLOTS,
} from '../../core/ecs/ComponentTypes';
import { Entity } from '../../core/ecs/Entity';
import { Position } from '../components/common/Position';
import { Velocity } from '../components/common/Velocity';
import { MoveInput } from '../components/actor/MoveInput';
import { FinalStats } from '../components/actor/FinalStats';
import { ViewRef } from '../components/common/ViewRef';
import { WeaponSlots } from '../components/player/WeaponSlots';
import { AttackTimer } from '../components/weapon/AttackTimer';
import { AutoAim } from '../components/weapon/AutoAim';
import { MoveDirection } from '../components/common/MoveDirection';
import { Facing } from '../components/common/Facing';
import { AnimState } from '../components/common/AnimState';
import { HurtFlash } from '../components/actor/HurtFlash';
import { Collider } from '../components/common/Collider';
import { CarryWeaponSlots } from '../components/player/CarryWeaponSlots';
import { CharacterConfigTable } from '../config/CharacterConfig';
import { CharacterIdentity } from '../components/player/CharacterIdentity';
import { BaseMoveSpeed } from '../components/actor/BaseMoveSpeed';
import { BaseStats } from '../components/actor/BaseStats';
import { CharacterStatsUtil } from '../formula/CharacterStatsUtil';
import { BonusStats } from '../components/actor/BonusStats';
import { Health } from '../components/actor/Health';
import { Level } from '../components/player/Level';
import { Camp, CampType } from '../components/common/Camp';
import { RegenState } from '../components/player/RegenState';
import { LifeStealState } from '../components/player/LifeStealState';
import { Exp } from '../components/player/Exp';
import { Economy } from '../components/player/Economy';
import { PendingLevelUp } from '../components/player/PendingLevelUp';
import { WeaponInventory } from '../components/player/WeaponInventory';
import { ItemInventory } from '../components/player/ItemInventory';
import { WeaponTier } from '../weapon/WeaponTier';
import { CarryWeaponEntityLink } from '../components/player/CarryWeaponEntityLink';

/** 玩家工厂 */
export class PlayerFactory {
    /** 创建玩家实体
     * @param world 世界
     * @param playerNode 玩家节点
     */
    public static create(world: World, playerNode: Node): Entity {
        const entity = world.createEntity();

        const characterId = 1001;
        const charCfg = CharacterConfigTable[characterId];
        if (!charCfg) {
            throw new Error(`CharacterConfig not found: ${characterId}`);
        }


        const position: Position = {
            x: playerNode.position.x,
            y: playerNode.position.y,
        };

        const velocity: Velocity = {
            x: 0,
            y: 0,
        };

        const moveInput: MoveInput = {
            x: 0,
            y: 0,
        };


        const viewRef: ViewRef = {
            node: playerNode,
        };

        const autoAim: AutoAim = {
            range: 500,
            targetEntity: 0,
        };

        const attackTimer: AttackTimer = {
            cooldown: 0,
            interval: 0.4,
        };

        const weaponSlots: WeaponSlots = {
            weaponIds: [1001],
        };

        const moveDirection: MoveDirection = {
            x: 0,
            y: 0,
        };

        const facing: Facing = {
            value: 1,
        };

        const animState: AnimState = {
            current: 'idle',
            locked: false,
        };

        const hurtFlash: HurtFlash = {
            duration: 0.08,
            remaining: 0,
            active: false,
        };

        const collider: Collider = {
            radius: 25,
        };

        const carryWeaponSlots: CarryWeaponSlots = {
            count: 6,
        };

        const weaponInventory: WeaponInventory = {
            maxSlots: 6,
            weapons: [
                { weaponKey: 'knife', tier: WeaponTier.T1 },
                { weaponKey: 'pistol', tier: WeaponTier.T1 },
            ],
        };

        const itemInventory: ItemInventory = {
            items: [
                { itemKey: 'mask', count: 2 },
                { itemKey: 'twig', count: 3 },
            ],
        };

        const identity: CharacterIdentity = {
            characterId,
        };

        const baseMoveSpeed: BaseMoveSpeed = {
            value: charCfg.baseMoveSpeed,
        };

        const baseStats: BaseStats = {
            ...CharacterStatsUtil.clone(charCfg.baseStats),
        };

        const bonusStats: BonusStats = {
            ...CharacterStatsUtil.createZero(),
        };

        const finalStats: FinalStats = {
            ...CharacterStatsUtil.createZero(),
            moveSpeed: charCfg.baseMoveSpeed,
        };

        const health: Health = {
            current: charCfg.baseStats.maxHp / 2,
            max: charCfg.baseStats.maxHp,
        };

        const level: Level = {
            current: 1,
        };

        const camp: Camp = {
            value: CampType.Player,
        };

        const lifeStealState: LifeStealState = {
            cooldownRemaining: 0,
        };

        const regenState: RegenState = {
            timer: 0,
        };

        const exp: Exp = {
            current: 0,
            need: 10,
        };

        const economy: Economy = {
            gold: 49,
            material: 2,
        };

        const pendingLevelUp: PendingLevelUp = {
            count: 0,
        };

        const carryWeaponEntityLink: CarryWeaponEntityLink = {
            weaponEntities: [],
            dirty: true,
        };

        world.addComponent(entity, C_PLAYER_TAG, true);
        world.addComponent(entity, C_POSITION, position);
        world.addComponent(entity, C_VELOCITY, velocity);
        world.addComponent(entity, C_MOVE_INPUT, moveInput);
        world.addComponent(entity, C_VIEW_REF, viewRef);

        world.addComponent(entity, C_AUTO_AIM, autoAim);
        world.addComponent(entity, C_ATTACK_TIMER, attackTimer);
        world.addComponent(entity, C_WEAPON_SLOTS, weaponSlots);

        world.addComponent(entity, C_MOVE_DIRECTION, moveDirection);
        world.addComponent(entity, C_FACING, facing);
        world.addComponent(entity, C_ANIM_STATE, animState);
        world.addComponent(entity, C_HURT_FLASH, hurtFlash);

        world.addComponent(entity, C_CARRY_WEAPON_SLOTS, carryWeaponSlots);
        world.addComponent(entity, C_COLLIDER, collider);
        world.addComponent(entity, C_HEALTH, health);

        world.addComponent(entity, C_CHARACTER_IDENTITY, identity);
        world.addComponent(entity, C_BASE_MOVE_SPEED, baseMoveSpeed);
        world.addComponent(entity, C_BASE_STATS, baseStats);
        world.addComponent(entity, C_BONUS_STATS, bonusStats);
        world.addComponent(entity, C_FINAL_STATS, finalStats);

        world.addComponent(entity, C_LEVEL, level);
        world.addComponent(entity, C_CAMP, camp);

        world.addComponent(entity, C_LIFE_STEAL_STATE, lifeStealState);
        world.addComponent(entity, C_REGEN_STATE, regenState);

        world.addComponent(entity, C_EXP, exp);
        world.addComponent(entity, C_ECONOMY, economy);
        world.addComponent(entity, C_PENDING_LEVEL_UP, pendingLevelUp);

        world.addComponent(entity, C_WEAPON_INVENTORY, weaponInventory);
        world.addComponent(entity, C_ITEM_INVENTORY, itemInventory);

        world.addComponent(entity, C_CARRY_WEAPON_ENTITY_LINK, carryWeaponEntityLink);
        return entity;
    }
}