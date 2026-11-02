import { CharacterStats } from "../components/actor/CharacterStats";

export class CharacterStatsUtil {

    /** 创建一个零值的 CharacterStats */
    public static createZero(): CharacterStats {
        return {
            maxHp: 0,
            hpRegen: 0,
            lifeSteal: 0,
            armor: 0,
            dodge: 0,
            speedPct: 0,
            meleeDamage: 0,
            rangedDamage: 0,
            elementalDamage: 0,
            engineering: 0,
            damagePct: 0,
            attackSpeedPct: 0,
            critChance: 0,
            range: 0,
            luck: 0,
            harvesting: 0,
        };
    }

    /** 克隆一个 CharacterStats */
    public static clone(src: CharacterStats): CharacterStats {
        return {
            maxHp: src.maxHp,
            hpRegen: src.hpRegen,
            lifeSteal: src.lifeSteal,
            armor: src.armor,
            dodge: src.dodge,
            speedPct: src.speedPct,
            meleeDamage: src.meleeDamage,
            rangedDamage: src.rangedDamage,
            elementalDamage: src.elementalDamage,
            engineering: src.engineering,
            damagePct: src.damagePct,
            attackSpeedPct: src.attackSpeedPct,
            critChance: src.critChance,
            range: src.range,
            luck: src.luck,
            harvesting: src.harvesting,
        };
    }

    /** 添加一个 CharacterStats 到另一个 CharacterStats */
    public static addTo(target: CharacterStats, bonus: CharacterStats): void {
        target.maxHp += bonus.maxHp;
        target.hpRegen += bonus.hpRegen;
        target.lifeSteal += bonus.lifeSteal;
        target.armor += bonus.armor;
        target.dodge += bonus.dodge;
        target.speedPct += bonus.speedPct;
        target.meleeDamage += bonus.meleeDamage;
        target.rangedDamage += bonus.rangedDamage;
        target.elementalDamage += bonus.elementalDamage;
        target.engineering += bonus.engineering;
        target.damagePct += bonus.damagePct;
        target.attackSpeedPct += bonus.attackSpeedPct;
        target.critChance += bonus.critChance;
        target.range += bonus.range;
        target.luck += bonus.luck;
        target.harvesting += bonus.harvesting;
    }
}