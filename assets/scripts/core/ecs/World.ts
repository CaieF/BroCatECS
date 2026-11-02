import { Entity } from './Entity';
import { System } from './System';
import { ComponentStorage, ComponentType } from './ComponentStorage';
import { EventBus } from './EventBus';
import { BattleContext } from '../../game/battle/BattleContext';

export class World {

    /** 下一个实体ID */
    private _nextEntityId: Entity = 1;

    /** 实体集合 */
    private _entities: Set<Entity> = new Set();

    /** 系统数组 */
    private _systems: System[] = [];

    /** 组件存储映射 */
    private _componentStores: Map<ComponentType, ComponentStorage<any>> = new Map();

    /** 事件总线 */
    private _eventBus: EventBus = new EventBus();

    /** 待销毁实体队列 */
    private _pendingDestroy: Entity[] = [];

    public timeScale: number = 1;

    /** 获取事件总线 */
    public get eventBus(): EventBus {
        return this._eventBus;
    }

    // =========================
    // Entity
    // =========================
    /** 创建实体 */
    public createEntity(): Entity {
        const entity = this._nextEntityId++;
        this._entities.add(entity);
        return entity;
    }

    /** 检查实体是否存在
     * @param entity 实体ID
     */
    public hasEntity(entity: Entity): boolean {
        return this._entities.has(entity);
    }

    /** 销毁实体
     * @param entity 实体ID
     */
    public destroyEntity(entity: Entity): void {
        if (!this._entities.has(entity)) return;
        this._pendingDestroy.push(entity);
    }

    /** 执行待销毁实体 */
    public flushDestroy(): void {
        if (this._pendingDestroy.length === 0) return;

        for (const entity of this._pendingDestroy) {
            if (!this._entities.has(entity)) continue;

            this._entities.delete(entity);

            for (const store of this._componentStores.values()) {
                store.delete(entity);
            }
        }

        this._pendingDestroy.length = 0;
    }

    /** 获取所有实体 */
    public getEntities(): ReadonlySet<Entity> {
        return this._entities;
    }

    // =========================
    // Component
    // =========================
    /** 注册组件类型
     * @param type 组件类型
     */
    public registerComponent<T>(type: ComponentType<T>): void {
        if (this._componentStores.has(type)) return;
        this._componentStores.set(type, new ComponentStorage<T>());
    }

    /** 添加组件到实体
     * @param entity 实体ID
     * @param type 组件类型
     * @param component 组件实例
     */
    public addComponent<T>(entity: Entity, type: ComponentType<T>, component: T): void {
        if (!this._entities.has(entity)) {
            throw new Error(`Entity ${entity} does not exist.`);
        }

        let store = this._componentStores.get(type);
        if (!store) {
            store = new ComponentStorage<T>();
            this._componentStores.set(type, store);
        }

        store.set(entity, component);
    }

    /** 获取实体组件
     * @param entity 实体ID
     * @param type 组件类型
     * @returns 组件实例
     */
    public getComponent<T>(entity: Entity, type: ComponentType<T>): T | undefined {
        const store = this._componentStores.get(type);
        if (!store) return undefined;
        return store.get(entity);
    }

    /** 获取实体组件
     * @param entity 实体ID
     * @param type 组件类型
     * @returns 组件实例
     */
    public requireComponent<T>(entity: Entity, type: ComponentType<T>): T {
        const comp = this.getComponent(entity, type);
        if (comp === undefined) {
            throw new Error(`Entity ${entity} missing component: ${String(type)}`);
        }
        return comp as T;
    }

    /** 检查实体是否有组件
     * @param entity 实体ID
     * @param type 组件类型
     * @returns 是否有组件
     */
    public hasComponent(entity: Entity, type: ComponentType): boolean {
        const store = this._componentStores.get(type);
        if (!store) return false;
        return store.has(entity);
    }

    /** 删除实体组件
     * @param entity 实体ID
     * @param type 组件类型
     */
    public removeComponent(entity: Entity, type: ComponentType): void {
        const store = this._componentStores.get(type);
        if (!store) return;
        store.delete(entity);
    }

    /** 获取组件存储
     * @param type 组件类型
     * @returns 组件存储
     */
    public getStore<T>(type: ComponentType<T>): ComponentStorage<T> | undefined {
        return this._componentStores.get(type);
    }

    // =========================
    // System
    // =========================
    /** 添加系统
     * @param system 系统实例
     */
    public addSystem(system: System, ctx: BattleContext): void {
        this._systems.push(system);
        this._systems.sort((a, b) => a.priority - b.priority);
        system.onAdd?.(this, ctx);
    }

    /** 删除系统
     * @param system 系统实例
     */
    public removeSystem(system: System, ctx: BattleContext): void {
        const index = this._systems.indexOf(system);
        if (index >= 0) {
            this._systems.splice(index, 1);
            system.onRemove?.(this, ctx);
        }
    }

    /** 更新所有系统
     * @param dt 时间间隔
     */
    public update(dt: number, ctx: BattleContext): void {
        const scaledDt = dt * this.timeScale;

        for (const system of this._systems) {
            if (!system.enabled) continue;

            if (ctx.battlePaused && !system.runWhenBattlePaused) {
                continue;
            }

            system.update(this, scaledDt, ctx);
        }
    }

    /** 清空世界
     * 会删除所有实体、组件、系统等
     */
    public clear(): void {
        this._entities.clear();
        this._pendingDestroy.length = 0;
        this._systems.length = 0;
        this._componentStores.clear();
        this._eventBus.clearAll();
    }
}