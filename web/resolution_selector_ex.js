/**
 * Resolution Selector Ex 前端
 *
 * width / height 是节点上的输入框，同时直接作为节点输出。
 * 当 aspect_ratio / megapixels / multiple 变化时，按与原 Resolution Selector
 * 完全相同的公式实时计算，并写入 width / height 两个框，使它们始终反映当前选择。
 */

import { app } from "../../scripts/app.js";

const NODE_NAME = "Resolution Selector Ex (Primus)";

// 必须与后端 ResolutionSelectorEx.ASPECT_RATIOS 保持一致
const ASPECT_RATIOS = {
    "1:1 (Square)": [1, 1],
    "2:3 (Portrait Photo)": [2, 3],
    "3:2 (Photo)": [3, 2],
    "3:4 (Portrait Standard)": [3, 4],
    "4:3 (Standard)": [4, 3],
    "9:16 (Portrait Widescreen)": [9, 16],
    "16:9 (Widescreen)": [16, 9],
    "21:9 (Ultrawide)": [21, 9],
};

/**
 * 复刻 Python 的 round()（银行家舍入），避免前后端在 .5 边界产生差异。
 */
function roundHalfEven(n) {
    const floor = Math.floor(n);
    const diff = n - floor;
    if (diff > 0.5) return floor + 1;
    if (diff < 0.5) return floor;
    return floor % 2 === 0 ? floor : floor + 1;
}

/**
 * 原始计算逻辑（与内置 ResolutionSelector.execute 完全一致）。
 */
function computeResolution(aspectRatio, megapixels, multiple) {
    const ratio = ASPECT_RATIOS[aspectRatio];
    if (!ratio) return null;

    const [wRatio, hRatio] = ratio;
    const totalPixels = megapixels * 1024 * 1024;
    const scale = Math.sqrt(totalPixels / (wRatio * hRatio));

    return [
        roundHalfEven((wRatio * scale) / multiple) * multiple,
        roundHalfEven((hRatio * scale) / multiple) * multiple,
    ];
}

/**
 * 按当前参数重算并写入 width / height 两个框。
 */
function updateDimensionWidgets(node) {
    const get = (name) => node.widgets?.find((w) => w.name === name);

    const ratioW = get("aspect_ratio");
    const mpW = get("megapixels");
    const multW = get("multiple");
    const widthW = get("width");
    const heightW = get("height");

    if (!ratioW || !mpW || !multW || !widthW || !heightW) return;

    const megapixels = Number(mpW.value);
    const multiple = Number(multW.value);
    if (!Number.isFinite(megapixels) || !Number.isFinite(multiple) || multiple <= 0) return;

    const result = computeResolution(ratioW.value, megapixels, multiple);
    if (!result) return;

    const [width, height] = result;
    if (widthW.value !== width) widthW.value = width;
    if (heightW.value !== height) heightW.value = height;

    node.setDirtyCanvas?.(true, true);
}

app.registerExtension({
    name: "primus.ResolutionSelectorEx",

    async beforeRegisterNodeDef(nodeType, nodeData) {
        if (nodeData.name !== NODE_NAME) return;

        nodeType.prototype.setupResolutionWidgets = function () {
            // width / height 只读：值只由计算填充，不允许手动编辑
            for (const name of ["width", "height"]) {
                const w = this.widgets?.find((it) => it.name === name);
                if (!w) continue;
                w.disabled = true;
                if (w.inputEl) {
                    w.inputEl.readOnly = true;
                    w.inputEl.style.opacity = 0.7;
                }
            }

            // 参数变化时实时重算（只绑定一次，避免 onConfigure 重复包装）
            if (!this._resolutionCallbacksBound) {
                this._resolutionCallbacksBound = true;
                const self = this;
                for (const name of ["aspect_ratio", "megapixels", "multiple"]) {
                    const w = this.widgets?.find((it) => it.name === name);
                    if (!w) continue;
                    const orig = w.callback;
                    w.callback = (v) => {
                        if (orig) orig.call(self, v);
                        updateDimensionWidgets(self);
                    };
                }
            }

            // 初始计算一次
            updateDimensionWidgets(this);
        };

        const onNodeCreated = nodeType.prototype.onNodeCreated;
        nodeType.prototype.onNodeCreated = function () {
            const result = onNodeCreated ? onNodeCreated.apply(this, arguments) : undefined;
            this.setupResolutionWidgets();
            return result;
        };

        const onConfigure = nodeType.prototype.onConfigure;
        nodeType.prototype.onConfigure = function () {
            const result = onConfigure ? onConfigure.apply(this, arguments) : undefined;
            // 工作流加载后按保存的参数重算一次，覆盖序列化下来的旧值
            this.setupResolutionWidgets();
            return result;
        };
    },
});
