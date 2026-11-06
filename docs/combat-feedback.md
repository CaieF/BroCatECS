# 攻击动作、碰撞与受击反馈

## 武器动作

攻击开始时锁定方向，后撤、突刺和回收均使用同一个方向。动作坐标相对携带位置计算，玩家移动时武器继续跟随；回收阶段平滑回到携带位置。远程武器发射后立即后坐，枪口使用本帧的位置、角度和翻面状态计算。

在 `assets/scripts/game/config/WeaponDefinitionTable.ts` 的 `base.action` 中调整：

- `recoilDistance` / `recoilDuration`：近战蓄力后撤或远程射击后坐的距离、时长。
- `dashDistance` / `dashDuration`：近战突刺的基础距离、时长。
- `recoverDuration`：回位时长。
- `hitStart` / `hitEnd` / `hitRadius`：刀身胶囊的轴线起点、终点及半径，沿武器本地 X 轴，单位为战斗层坐标。

当前小刀使用 `[0, 48]` 的刀身轴线与半径 `14`，对应预制体约 82 × 35 的刀身。它替代原来半径 136 的大圆；伤害区域随真实突刺扫过，每次攻击对同一敌人只命中一次。刀身图片、缩放或锚点更改后，需要同步调整这些参数。

## 碰撞

`core/math/CollisionMath.ts` 提供圆与胶囊的连续扫掠判定。`PositionHistorySystem` 在移动前记录位置，边界修正在寻敌和攻击前完成；`MeleeHitResolver` 与 `CollisionSystem` 使用帧内轨迹判定，考虑敌人的相对运动。

子弹选择沿途最早碰到的有效目标，寿命结束时仍检查最后一段轨迹。死亡、待销毁、生命值归零的敌人不再挡子弹，也不再造成接触伤害。敌人体积配置在 `EnemyConfig.ts` 的 `collisionRadius`；当前子弹半径在 `ProjectileFactory.ts` 中为 10。

当前主场景的 PlayerLayer、EnemyLayer、EffectLayer、BulletLayer 均与 BattleRoot 对齐，ECS 位置使用共同的战斗层单位。若改变各层的相对位置或缩放，需要统一 ECS 坐标和碰撞半径；枪口换算本身支持目标子弹层的坐标转换。

## 受击闪白

闪白由本次受击的剩余时间驱动，不依赖着色器的全局正弦相位。每次有效伤害重置计时，触发当帧先显示完整强度；前 40% 时长保持纯白，之后恢复原色。时长在 EnemyFactory / PlayerFactory 初始化的 `HurtFlash.duration` 中调整。

ActorView 为实际受击的 Sprite 使用独立材质实例，保留图片透明度和顶点透明度。回池或销毁会恢复原材质；连续受击、动画换帧和节点复用不会保留旧的闪白状态。

## 验证

按 `tests/README.md` 配置 `COCOS_TYPESCRIPT` 后运行 `node tests/run.cjs`，包含升级及本次战斗回归检查。逻辑测试使用真实业务代码与最小 Cocos 桩；材质最终编译、视觉节奏和手感需要在 Creator 3.8.7 预览中确认。
