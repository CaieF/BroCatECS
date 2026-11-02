import { WeaponInventory, WeaponInventoryEntry } from '../components/player/WeaponInventory';
import { WeaponTier } from './WeaponTier';
import { WeaponDefinitionUtil } from '../config/WeaponDefinitionUtil';

export class WeaponMergeService {
    public static canMerge(inventory: WeaponInventory, weaponKey: string, tier: WeaponTier): boolean {
        if (tier >= WeaponTier.T4) return false;

        const matched = inventory.weapons.filter(
            w => w.weaponKey === weaponKey && w.tier === tier
        );

        return matched.length >= 2;
    }

    public static canMergeWithIncoming(inventory: WeaponInventory, weaponKey: string, tier: WeaponTier): boolean {
        if (tier >= WeaponTier.T4) return false;

        const matchedCount = inventory.weapons.filter(
            w => w.weaponKey === weaponKey && w.tier === tier
        ).length;

        // 背包里已有1把，再买进来1把，就能合成
        return matchedCount >= 1;
    }

    public static mergeOnce(inventory: WeaponInventory, weaponKey: string, tier: WeaponTier): boolean {
        if (tier >= WeaponTier.T4) return false;

        const matchedIndexes: number[] = [];
        for (let i = 0; i < inventory.weapons.length; i++) {
            const w = inventory.weapons[i];
            if (w.weaponKey === weaponKey && w.tier === tier) {
                matchedIndexes.push(i);
                if (matchedIndexes.length >= 2) break;
            }
        }

        if (matchedIndexes.length < 2) {
            return false;
        }

        // 从后往前删，避免索引错乱
        matchedIndexes.sort((a, b) => b - a);
        for (const index of matchedIndexes) {
            inventory.weapons.splice(index, 1);
        }

        const nextTier = WeaponDefinitionUtil.getNextTier(weaponKey, tier);
        if (!nextTier) {
            return false;
        }

        inventory.weapons.push({
            weaponKey,
            tier: nextTier,
        });

        return true;
    }

    public static mergeWithIncoming(inventory: WeaponInventory, weaponKey: string, tier: WeaponTier): boolean {
        if (tier >= WeaponTier.T4) return false;

        // 找背包里的一把同名同阶
        const index = inventory.weapons.findIndex(
            w => w.weaponKey === weaponKey && w.tier === tier
        );

        if (index < 0) {
            return false;
        }

        inventory.weapons.splice(index, 1);

        const nextTier = WeaponDefinitionUtil.getNextTier(weaponKey, tier);
        if (!nextTier) {
            return false;
        }

        inventory.weapons.push({
            weaponKey,
            tier: nextTier,
        });

        return true;
    }

    public static countSameTierWeapons(
        inventory: WeaponInventory,
        weaponKey: string,
        tier: WeaponTier
    ): number {
        return inventory.weapons.filter(w => w.weaponKey === weaponKey && w.tier === tier).length;
    }

    public static findAnotherSameTierIndex(
        inventory: WeaponInventory,
        weaponKey: string,
        tier: WeaponTier,
        excludeIndex: number
    ): number {
        for (let i = 0; i < inventory.weapons.length; i++) {
            if (i === excludeIndex) continue;
            const w = inventory.weapons[i];
            if (w.weaponKey === weaponKey && w.tier === tier) {
                return i;
            }
        }
        return -1;
    }
}