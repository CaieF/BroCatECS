import { PickupRewardType } from '../../pickup/PickupRewardType';

export interface PickupReward {
    type: PickupRewardType;
    gold: number;
    exp: number;
}