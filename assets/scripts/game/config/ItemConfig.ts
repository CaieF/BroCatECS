import { CharacterStats } from '../components/actor/CharacterStats';

export interface ItemConfigData {
    key: string;
    name: string;
    desc: string;
    price: number;

    addStats?: Partial<CharacterStats>;
}

export const ItemConfigTable: Record<string, ItemConfigData> = {
    armorPlate: {
        key: 'armorPlate',
        name: '护甲片',
        desc: '+2 护甲',
        price: 12,
        addStats: {
            armor: 2,
        },
    },

    lungs: {
        key: 'lungs',
        name: '肺',
        desc: '+2 生命再生',
        price: 18,
        addStats: {
            hpRegen: 2,
        },
    },

    mask: {
        key: 'mask',
        name: '面具',
        desc: '+3 幸运',
        price: 16,
        addStats: {
            luck: 3,
        },
    },

    twig: {
        key: 'twig',
        name: '树枝',
        desc: '+1 近战伤害',
        price: 10,
        addStats: {
            meleeDamage: 1,
        },
    },
};