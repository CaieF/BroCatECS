import { instantiate, Node, Prefab } from 'cc';

interface PoolEntry {
    prefab: Prefab;
    cache: Node[];
}

/**
 * 节点池服务
 */
export class NodePoolService {
    private _map: Map<string, PoolEntry> = new Map();

    /**
     * 注册节点池
     * @param key 节点池键
     * @param prefab 节点预制体
     * @returns 
     */
    public register(key: string, prefab: Prefab | null): void {
        if (!prefab) return;
        if (this._map.has(key)) return;

        this._map.set(key, {
            prefab,
            cache: [],
        });
    }

    /**
     * 预热节点池
     * @param key 节点池键
     * @param count 预热数量
     * @returns 
     */
    public warmup(key: string, count: number): void {
        const entry = this._map.get(key);
        if (!entry) {
            console.warn(`[NodePoolService] warmup failed, key not found: ${key}`);
            return;
        }

        for (let i = 0; i < count; i++) {
            const node = instantiate(entry.prefab);
            node.active = false;
            entry.cache.push(node);
        }
    }

    /**
     * 获取节点池中的节点
     * @param key 节点池键
     * @returns 节点
     */
    public get(key: string): Node | null {
        const entry = this._map.get(key);
        if (!entry) {
            console.warn(`[NodePoolService] get failed, key not found: ${key}`);
            return null;
        }

        let node: Node;
        if (entry.cache.length > 0) {
            node = entry.cache.pop()!;
        } else {
            node = instantiate(entry.prefab);
        }

        node.active = true;
        return node;
    }

    /**
     * 放回节点池中的节点
     * @param key 节点池键
     * @param node 节点
     * @returns 
     */
    public put(key: string, node: Node | null): void {
        if (!node) return;

        const entry = this._map.get(key);
        if (!entry) {
            console.warn(`[NodePoolService] put failed, key not found: ${key}`);
            node.destroy();
            return;
        }

        node.removeFromParent();
        node.active = false;
        entry.cache.push(node);
    }

    /**
     * 清空所有节点池
     * @returns 
     */
    public clear(): void {
        for (const entry of this._map.values()) {
            for (const node of entry.cache) {
                if (node.isValid) {
                    node.destroy();
                }
            }
            entry.cache.length = 0;
        }
        this._map.clear();
    }
}