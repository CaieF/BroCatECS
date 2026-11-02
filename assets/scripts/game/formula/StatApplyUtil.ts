import { BonusStats } from '../components/actor/BonusStats';
import { CharacterStats } from '../components/actor/CharacterStats';

export class StatApplyUtil {
    public static applyPartialBonus(
        bonus: BonusStats,
        add: Partial<CharacterStats>
    ): void {
        if (add.maxHp !== undefined) bonus.maxHp += add.maxHp;
        if (add.hpRegen !== undefined) bonus.hpRegen += add.hpRegen;
        if (add.lifeSteal !== undefined) bonus.lifeSteal += add.lifeSteal;
        if (add.armor !== undefined) bonus.armor += add.armor;
        if (add.dodge !== undefined) bonus.dodge += add.dodge;
        if (add.speedPct !== undefined) bonus.speedPct += add.speedPct;
        if (add.meleeDamage !== undefined) bonus.meleeDamage += add.meleeDamage;
        if (add.rangedDamage !== undefined) bonus.rangedDamage += add.rangedDamage;
        if (add.elementalDamage !== undefined) bonus.elementalDamage += add.elementalDamage;
        if (add.engineering !== undefined) bonus.engineering += add.engineering;
        if (add.damagePct !== undefined) bonus.damagePct += add.damagePct;
        if (add.attackSpeedPct !== undefined) bonus.attackSpeedPct += add.attackSpeedPct;
        if (add.critChance !== undefined) bonus.critChance += add.critChance;
        if (add.range !== undefined) bonus.range += add.range;
        if (add.luck !== undefined) bonus.luck += add.luck;
        if (add.harvesting !== undefined) bonus.harvesting += add.harvesting;
    }
}
