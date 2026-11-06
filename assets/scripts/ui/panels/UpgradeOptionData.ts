import { CharacterStats } from '../../game/components/actor/CharacterStats';
import { UpgradeTier } from '../../game/config/UpgradeOptionConfig';

export interface UpgradeOptionData {
    id: string;
    statKey: keyof CharacterStats;
    tier: UpgradeTier;
    title: string;
    desc: string;
    /** 特殊选项可覆盖默认属性图标，路径相对 resources。 */
    iconPath?: string;
}
