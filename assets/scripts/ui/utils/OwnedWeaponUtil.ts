import { WeaponInventory } from '../../game/components/player/WeaponInventory';
import { OwnedWeaponViewData } from '../data/OwnedWeaponViewData';
import { WeaponDefinitionUtil } from '../../game/config/WeaponDefinitionUtil';

export class OwnedWeaponUtil {
    public static toViewData(inventory: WeaponInventory): OwnedWeaponViewData[] {
        return inventory.weapons.map((w, index) => {
            const def = WeaponDefinitionUtil.getDefinition(w.weaponKey);

            return {
                id: `${w.weaponKey}_${w.tier}_${index}`,
                title: def.base.name,
                weaponKey: w.weaponKey,
                tier: w.tier,
                index,
            };
        });
    }
}