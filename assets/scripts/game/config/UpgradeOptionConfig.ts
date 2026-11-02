import { CharacterStats } from '../components/actor/CharacterStats';

export interface UpgradeOptionConfig {
    id: string;
    title: string;
    desc: string;
    iconPath?: string;

    addStats: Partial<CharacterStats>;
}

export const UpgradeOptionConfigTable: UpgradeOptionConfig[] = [
    {
        id: 'regen_2',
        title: '生命再生',
        desc: '+2 生命再生',
        addStats: {
            hpRegen: 2,
        },
    },
    {
        id: 'harvesting_5',
        title: '收获',
        desc: '+5 收获',
        addStats: {
            harvesting: 5,
        },
    },
    {
        id: 'range_15',
        title: '范围',
        desc: '+15 范围',
        addStats: {
            range: 15,
        },
    },
    {
        id: 'element_1',
        title: '元素伤害',
        desc: '+1 元素伤害',
        addStats: {
            elementalDamage: 1,
        },
    },
    {
        id: 'maxhp_8',
        title: '最大生命值',
        desc: '+8 最大生命值',
        addStats: {
            maxHp: 8,
        },
    },
    {
        id: 'armor_2',
        title: '护甲',
        desc: '+2 护甲',
        addStats: {
            armor: 2,
        },
    },
    {
        id: 'speed_3',
        title: '速度',
        desc: '+3% 速度',
        addStats: {
            speedPct: 3,
        },
    },
    {
        id: 'melee_3',
        title: '近战伤害',
        desc: '+3 近战伤害',
        addStats: {
            meleeDamage: 3,
        },
    },
    {
        id: 'ranged_3',
        title: '远程伤害',
        desc: '+3 远程伤害',
        addStats: {
            rangedDamage: 3,
        },
    },
    {
        id: 'dmgpct_5',
        title: '伤害',
        desc: '+5% 伤害',
        addStats: {
            damagePct: 5,
        },
    },
];