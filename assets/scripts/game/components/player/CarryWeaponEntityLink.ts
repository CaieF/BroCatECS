import { Entity } from '../../../core/ecs/Entity';

/**
 * “场上携带武器实体列表”的组件
 * weaponEntities：当前场上挂着的携带武器实体
 * dirty：当背包变化时置 true，同步系统看到后重建武器实体
 */
export interface CarryWeaponEntityLink {
    weaponEntities: Entity[];
    dirty: boolean;
}