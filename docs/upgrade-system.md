# 升级面板与配置

## 配置入口

- `assets/scripts/game/config/UpgradeOptionConfig.ts`：16 种属性、I–IV 四档数值与百分比标记。由同一份定义生成文案和实际加成，共 64 个选项。
- `assets/scripts/game/config/UpgradeRollConfig.ts`：等级、幸运对应的品质概率及指定等级保底。
- `assets/scripts/ui/utils/StatIconPaths.ts`：属性键到图标路径的映射。
- `assets/scripts/ui/utils/CardTierVisuals.ts`：等级到 `slot_01..04`、`card_01..04` 的映射。使用项目图片原有的灰、绿、蓝、紫配色。

数值与抽选规则参考 [Brotato Upgrades](https://brotato.wiki.spellsandguns.com/Upgrades) 和 [Shop 品质概率表](https://brotato.wiki.spellsandguns.com/Shop#Rarity_of_Shop_Items_and_Luck)。普通等级先抽不同属性，再按等级、幸运决定品质；第 5 级固定 II，第 10/15/20 级固定 III，第 25 级及之后每 5 级固定 IV。连升逐级结算，刷新保持当前升级的等级；刷新价格沿用项目原来的 1 金币。

项目目前没有专用暴击率图标，因此 `critChance` 暂时复用伤害图标。补充 `assets/resources/textures/ui/icon/stat/icon_crit_chance.png` 后，导入为 SpriteFrame，并修改 `StatIconPaths.critChance` 即可。工程学资源使用已有文件名 `icon_enginerring`。

## 预制体

`assets/resources/prefabs/ui/OptionItem.prefab` 已绑定：

- `backgroundSprite` → `Bg` 的 Sprite；
- `cardSprite` → 根节点的 Sprite；
- `tierLabel` → `LevelUpLabel`；
- `iconSprite` → `IconSprite`，保持比例适配 64 × 64 区域。

`main.scene` 的四个 OptionItem 实例继承此预制体，不需要逐一添加绑定。

## 资源复用

`core/resources/SpriteFrameCache` 只加载用到的 SpriteFrame，并合并同路径的在途请求。路径相对 `assets/resources`，省略扩展名，加载器统一补 `/spriteFrame`。

`ui/common/SpriteFrameBinding` 管理单个 Sprite 的异步绑定。后一次请求会使旧请求失效；加载失败会清空图片并输出路径，下次请求可重试。其他 UI 可以创建此绑定，调用 `setPath` 切换图片，并在所属组件的 `onDestroy` 中调用 `dispose`。

隐藏面板保留缓存，以便刷新、下一波升级复用；最后一个绑定销毁时释放缓存持有的引用。升级面板不重复加载整个资源目录，也不会强制释放其他模块持有的资源。

## 验证

运行方式见 `tests/README.md`。回归测试使用真实业务 TypeScript 与最小 Cocos 资源桩，覆盖数值、抽选、连续升级、刷新与资源生命周期。实际纹理导入和画面布局仍需在 Cocos Creator 3.8.7 的预览中验收。
