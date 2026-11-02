import { Entity } from './Entity';
import { World } from './World';
import { ComponentType } from './ComponentStorage';

export class Query {
    /** 查询所有实体
     * @param world 世界
     * @param types 组件类型
     * @returns 实体列表
     */
    public static all(world: World, ...types: ComponentType[]): Entity[] {
        const entities = world.getEntities();
        const result: Entity[] = [];

        for (const entity of entities) {
            let ok = true;
            for (const type of types) {
                if (!world.hasComponent(entity, type)) {
                    ok = false;
                    break;
                }
            }
            if (ok) {
                result.push(entity);
            }
        }

        return result;
    }

    /** 查询排除实体
     * @param world 世界
     * @param include 包含组件类型
     * @param exclude 排除组件类型
     * @returns 实体列表
     */
    public static exclude(world: World, include: ComponentType[], exclude: ComponentType[]): Entity[] {
        const entities = world.getEntities();
        const result: Entity[] = [];

        for (const entity of entities) {
            let valid = true;

            for (const type of include) {
                if (!world.hasComponent(entity, type)) {
                    valid = false;
                    break;
                }
            }

            if (!valid) continue;

            for (const type of exclude) {
                if (world.hasComponent(entity, type)) {
                    valid = false;
                    break;
                }
            }

            if (valid) {
                result.push(entity);
            }
        }

        return result;
    }
}