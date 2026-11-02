
import { BattleContext } from '../../game/battle/BattleContext';
import { World } from './World';

export abstract class System {
    /** 系统是否启用 */
    public enabled: boolean = true;
    /** 系统优先级 */
    public priority: number = 0;

    /**
     * 当战斗暂停时，该系统是否仍继续运行
     * 用于 UI / 面板 / 必要清理 等系统
     */
    public runWhenBattlePaused: boolean = false;


    onAdd?(world: World, ctx: BattleContext): void;
    onRemove?(world: World, ctx: BattleContext): void;

    abstract update(world: World, dt: number, ctx: BattleContext): void;
}