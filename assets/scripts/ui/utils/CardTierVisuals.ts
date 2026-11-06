import { UpgradeTier } from '../../game/config/UpgradeOptionConfig';

export interface CardTierVisual {
    label: string;
    backgroundPath: string;
    cardPath: string;
}

/** 保留项目图片本身的配色；统一管理等级外观，供其他卡片 UI 复用。 */
export const CardTierVisuals: Readonly<Record<UpgradeTier, CardTierVisual>> = {
    1: {
        label: 'I',
        backgroundPath: 'textures/ui/card/slot_01',
        cardPath: 'textures/ui/card/card_01',
    },
    2: {
        label: 'II',
        backgroundPath: 'textures/ui/card/slot_02',
        cardPath: 'textures/ui/card/card_02',
    },
    3: {
        label: 'III',
        backgroundPath: 'textures/ui/card/slot_03',
        cardPath: 'textures/ui/card/card_03',
    },
    4: {
        label: 'IV',
        backgroundPath: 'textures/ui/card/slot_04',
        cardPath: 'textures/ui/card/card_04',
    },
};
