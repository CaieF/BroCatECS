import { CharacterStats } from '../../game/components/actor/CharacterStats';

/** 属性图标的唯一映射入口，可供升级、属性详情和商店说明复用。 */
export const StatIconPaths: Readonly<Record<keyof CharacterStats, string>> = {
    maxHp: 'textures/ui/icon/stat/icon_max_hp',
    hpRegen: 'textures/ui/icon/stat/icon_hp_regen',
    lifeSteal: 'textures/ui/icon/stat/icon_life_steal',
    damagePct: 'textures/ui/icon/stat/icon_damage_pct',
    meleeDamage: 'textures/ui/icon/stat/icon_melee_damage',
    rangedDamage: 'textures/ui/icon/stat/icon_ranged_damage',
    elementalDamage: 'textures/ui/icon/stat/icon_elemental_damage',
    attackSpeedPct: 'textures/ui/icon/stat/icon_attack_speed',
    // 当前资源库没有专用暴击图标，暂用伤害图标；补图后只需替换此路径。
    critChance: 'textures/ui/icon/stat/icon_damage_pct',
    // 资源文件沿用项目中的拼写，避免重命名破坏已有 Prefab 的引用。
    engineering: 'textures/ui/icon/stat/icon_enginerring',
    range: 'textures/ui/icon/stat/icon_range',
    armor: 'textures/ui/icon/stat/icon_armor',
    dodge: 'textures/ui/icon/stat/icon_dodge',
    speedPct: 'textures/ui/icon/stat/icon_speed',
    luck: 'textures/ui/icon/stat/icon_luck',
    harvesting: 'textures/ui/icon/stat/icon_harvest',
};
