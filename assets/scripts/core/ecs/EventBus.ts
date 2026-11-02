export type EventType<T = any> = string;

export class EventBus {
    private _events: Map<EventType, any[]> = new Map();

    /** 触发事件
     * @param type 事件类型
     * @param event 事件
     */
    public emit<T>(type: EventType<T>, event: T): void {
        let list = this._events.get(type);
        if (!list) {
            list = [];
            this._events.set(type, list);
        }
        list.push(event);
    }

    /** 读取事件
     * @param type 事件类型
     * @returns 事件列表
     */
    public read<T>(type: EventType<T>): readonly T[] {
        return (this._events.get(type) || []) as T[];
    }

    /** 读完并清除事件类型
     * @param type 事件类型
     * @returns 事件列表
     */
    public consume<T>(type: EventType<T>): T[] {
        const list = (this._events.get(type) || []) as T[];
        this._events.delete(type);
        return list;
    }

    /** 清除事件类型
     * @param type 事件类型
     */
    public clearType(type: EventType): void {
        this._events.delete(type);
    }

    /** 清除所有事件 */
    public clearAll(): void {
        this._events.clear();
    }
}