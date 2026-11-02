import { Prefab } from 'cc';

export class WeaponPrefabLibrary {
    private _map: Map<string, Prefab> = new Map();

    public register(key: string, prefab: Prefab | null): void {
        // console.assert(key.length > 0, '[WeaponPrefabLibrary] key is empty');
        console.log(`[WeaponPrefabLibrary] register key=${key}, prefab=${prefab}`);
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

    public getAllKeys(): string[] {
        return Array.from(this._map.keys());
    }
}