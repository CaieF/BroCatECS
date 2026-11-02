import { Prefab } from 'cc';

export class EnemyPrefabLibrary {
    private _map: Map<string, Prefab> = new Map();

    public register(key: string, prefab: Prefab | null): void {
        if (!prefab) return;
        this._map.set(key, prefab);
    }

    public get(key: string): Prefab | null {
        return this._map.get(key) ?? null;
    }

    public has(key: string): boolean {
        return this._map.has(key);
    }

    public clear(): void {
        this._map.clear();
    }
}