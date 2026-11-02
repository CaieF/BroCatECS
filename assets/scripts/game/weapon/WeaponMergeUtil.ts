

// export class WeaponMergeUtil {
//     public static canMerge(weaponIdA: number, weaponIdB: number): boolean {
//         if (weaponIdA !== weaponIdB) {
//             return false;
//         }

//         const data = WeaponDataTable[weaponIdA];
//         if (!data) return false;

//         return data.tier < WeaponTier.T4;
//     }

//     public static getNextTierWeaponId(weaponId: number): number | null {
//         const data = WeaponDataTable[weaponId];
//         if (!data) return null;

//         if (data.tier >= WeaponTier.T4) {
//             return null;
//         }

//         const nextTier = data.tier + 1;

//         for (const idStr in WeaponDataTable) {
//             const id = Number(idStr);
//             const weapon = WeaponDataTable[id];
//             if (weapon.key === data.key && weapon.tier === nextTier) {
//                 return weapon.weaponId;
//             }
//         }

//         return null;
//     }
// }