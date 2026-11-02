import { Entity } from './Entity';

export type ComponentType<T = any> = string;

/** 组件存储 */
export class ComponentStorage<T> {
    private _data: Map<Entity, T> = new Map();

    /** 设置组件存储
     * @param entity 实体
     * @param component 组件
     */
    public set(entity: Entity, component: T): void {
        this._data.set(entity, component);
    }

    /** 获取组件存储
     * @param entity 实体
     * @returns 组件
     */
    public get(entity: Entity): T | undefined {
        return this._data.get(entity);
    }

    /** 检查组件存储是否存在
     * @param entity 实体
     * @returns 是否存在
     */
    public has(entity: Entity): boolean {
        return this._data.has(entity);
    }

    /** 删除组件存储
     * @param entity 实体
     * @returns 是否删除成功
     */
    public delete(entity: Entity): boolean {
        return this._data.delete(entity);
    }

    /** 清空组件存储 */
    public clear(): void {
        this._data.clear();
    }

    /** 获取组件存储迭代器 */
    public entries(): IterableIterator<[Entity, T]> {
        return this._data.entries();
    }

    /** 获取组件存储迭代器
     * @returns 实体迭代器
     */
    public keys(): IterableIterator<Entity> {
        return this._data.keys();
    }

    /** 获取组件存储迭代器
     * @returns 组件迭代器
     */
    public values(): IterableIterator<T> {
        return this._data.values();
    }

    /** 遍历组件存储
     * @param callback 回调函数
     */
    public forEach(callback: (component: T, entity: Entity) => void): void {
        this._data.forEach((component, entity) => {
            callback(component, entity);
        });
    }

    /** 获取组件存储大小 */
    public size(): number {
        return this._data.size;
    }
}