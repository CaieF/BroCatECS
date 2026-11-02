import { FinalStats } from '../../game/components/actor/FinalStats';
import { PlayerStatViewData } from '../data/PlayerStatViewData';

/**
 * 玩家属性转换为ui数据
 */
export class StatPanelUtil {
    public static fromStats(level: number, stats: FinalStats): PlayerStatViewData {
        return {
            level: level,

            maxHp: `${stats.maxHp}`,
            hpRegen: `${stats.hpRegen}`,
            lifeSteal: `${stats.lifeSteal}`,
            damagePct: `${stats.damagePct}`,
            meleeDamage: `${stats.meleeDamage}`,
            rangedDamage: `${stats.rangedDamage}`,
            elementalDamage: `${stats.elementalDamage}`,
            attackSpeedPct: `${stats.attackSpeedPct}`,
            critChance: `${stats.critChance}`,
            engineering: `${stats.engineering}`,
            range: `${stats.range}`,
            armor: `${stats.armor}`,
            dodge: `${stats.dodge}`,
            speedPct: `${stats.speedPct}`,
            luck: `${stats.luck}`,
            harvesting: `${stats.harvesting}`,
        };
    }
}
