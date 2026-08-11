/**
 * Customizable Selector 前端 UI
 *
 * 数据模型: 每个 item 内嵌 option / value / value2 / value3 / value4。
 * valueN 下拉框各显示对应字段的选项列表，按索引联动同步。
 * 编辑/删除操作通过索引定位，outputs 变更由服务端自动 expand/shrink items。
 */
import { app } from "../../scripts/app.js";

const NODE_NAME = "Customizable Selector (Primus)";

const PLACEHOLDER_NO_GROUP = "[无分组]";
const PLACEHOLDER_NO_OPTION = "[无选项]";
const PLACEHOLDER_SELECT_GROUP = "[请先选择分组]";

const BTN_EDIT_GROUP = "\u270E 编辑分组名称";
const BTN_EDIT_OPTION = "\u270E 编辑选项描述";
const BTN_EDIT_VALUE = "\u270E 编辑选项值";
const BTN_EDIT_VALUE2 = "\u270E 编辑选项值2";
const BTN_EDIT_VALUE3 = "\u270E 编辑选项值3";
const BTN_EDIT_VALUE4 = "\u270E 编辑选项值4";
const BTN_ADD_GROUP = "+ 增加选项分组";
const BTN_ADD_OPTION = "+ 分组增加选项";
const BTN_DEL_GROUP = "- 删除当前分组";
const BTN_DEL_OPTION = "- 删除当前选项";

const ALL_PRIMUS_BTNS = [
    BTN_EDIT_GROUP, BTN_EDIT_OPTION, BTN_EDIT_VALUE,
    BTN_EDIT_VALUE2, BTN_EDIT_VALUE3, BTN_EDIT_VALUE4,
    BTN_ADD_GROUP, BTN_ADD_OPTION, BTN_DEL_GROUP, BTN_DEL_OPTION,
];

let cachedConfig = null;

async function fetchConfig() {
    try {
        const resp = await fetch('/primus/selector/config');
        if (resp.ok) cachedConfig = await resp.json();
    } catch (e) { console.warn("[Primus] fetchConfig:", e); }
    return cachedConfig;
}

// ========== 下拉框更新 ==========

function updateGroupWidget(node) {
    const w = node.widgets.find(w => w.name === 'group');
    if (!w) return;
    if (cachedConfig?.groups) {
        const groups = Object.keys(cachedConfig.groups);
        w.options.values = groups.length > 0 ? [...groups] : [PLACEHOLDER_NO_GROUP];
        if (!w.options.values.includes(w.value)) w.value = w.options.values[0];
    }
    node.setDirtyCanvas(true, true);
}

/**
 * 根据当前分组刷新所有 option/valueN 下拉框的选项列表。
 */
function updateAllValueWidgets(node) {
    const gw = node.widgets.find(w => w.name === 'group');
    if (!gw) return;
    const groupName = gw.value;
    const groupData = cachedConfig?.groups?.[groupName];
    const items = (groupData?.items) || [];

    const setOptions = (widgetName, fieldName) => {
        const w = node.widgets.find(w2 => w2.name === widgetName);
        if (!w) return;
        if (items.length > 0) {
            const names = items.map(it => it[fieldName] || it['value'] || '');
            w.options.values = [...names];
        } else {
            w.options.values = [PLACEHOLDER_NO_OPTION];
        }
        if (!w.options.values.includes(w.value)) {
            w.value = w.options.values[0];
        }
    };

    setOptions('option', 'option');
    setOptions('value', 'value');
    setOptions('value2', 'value2');
    setOptions('value3', 'value3');
    setOptions('value4', 'value4');

    // 同步 outputs（暂时摘掉回调，避免触发确认弹窗）
    const ow = node.widgets.find(w => w.name === 'outputs');
    if (ow && groupData) {
        const saved = (groupData.outputs || '1');
        if (ow.value !== saved) {
            const savedCb = ow.callback;
            ow.callback = null;
            ow.value = saved;
            ow.callback = savedCb;
            // 手动更新 _prevOutputs
            node._prevOutputs = saved;
        }
        applyOutputsVisibility(node);
    }

    node.setDirtyCanvas(true, true);
}

// ========== option / value 索引联动 ==========

function syncAllVisibleValues(node) {
    const ow = node.widgets.find(w => w.name === 'option');
    if (!ow) return;
    const idx = ow.options.values.indexOf(ow.value);
    if (idx < 0) return;
    syncAllVisibleValuesToIndex(node, idx);
}

function syncAllVisibleValuesTo(node, targetValue) {
    const rw = node.widgets.find(w => w.name === 'value');
    if (!rw) return;
    const idx = rw.options.values.indexOf(targetValue);
    if (idx < 0) return;
    syncAllVisibleValuesToIndex(node, idx);
}

function syncAllVisibleValuesToIndex(node, idx) {
    const ow = node.widgets.find(w => w.name === 'outputs');
    const count = ow ? parseInt(ow.value) || 1 : 1;

    const optW = node.widgets.find(w => w.name === 'option');
    if (optW && idx < optW.options.values.length) {
        const v = optW.options.values[idx];
        if (optW.value !== v) optW.value = v;
    }

    const fields = ['value', 'value2', 'value3', 'value4'];
    for (let i = 0; i < count; i++) {
        const w = node.widgets.find(w2 => w2.name === fields[i]);
        if (w && idx < w.options.values.length) {
            const v = w.options.values[idx];
            if (w.value !== v) w.value = v;
        }
    }
    node.setDirtyCanvas(true, true);
}

// ========== outputs 显隐 ==========

function applyOutputsVisibility(node) {
    const ow = node.widgets.find(w => w.name === 'outputs');
    const count = ow ? parseInt(ow.value) || 1 : 1;

    const set = (name, show) => {
        const w = node.widgets.find(w2 => w2.name === name);
        if (w) w.hidden = !show;
    };

    set('value2', count >= 2); set(BTN_EDIT_VALUE2, count >= 2);
    set('value3', count >= 3); set(BTN_EDIT_VALUE3, count >= 3);
    set('value4', count >= 4); set(BTN_EDIT_VALUE4, count >= 4);

    const sz = node.computeSize();
    sz[0] = Math.max(node.size[0] || sz[0], sz[0]);
    node.setSize(sz);
    node.setDirtyCanvas(true, true);
}

// ========== 辅助 ==========

function currentGroup(node) {
    const w = node.widgets.find(w => w.name === 'group');
    return w ? w.value : '';
}

function currentIndex(node, widgetName) {
    const w = node.widgets.find(w2 => w2.name === widgetName);
    if (!w) return -1;
    return w.options.values.indexOf(w.value);
}

// ========== 扩展注册 ==========

app.registerExtension({
    name: "primus.CustomizableSelector",

    async beforeRegisterNodeDef(nodeType, nodeData, app) {
        if (nodeData.name !== NODE_NAME) return;

        const onNodeCreated = nodeType.prototype.onNodeCreated;
        nodeType.prototype.onNodeCreated = function () {
            const result = onNodeCreated ? onNodeCreated.apply(this, arguments) : undefined;
            setTimeout(async () => {
                await fetchConfig();
                this.setupCallbacks();
                this.addPrimusWidgets();
                updateGroupWidget(this);
                updateAllValueWidgets(this);
                applyOutputsVisibility(this);
            }, 50);
            return result;
        };

        const onConfigure = nodeType.prototype.onConfigure;
        nodeType.prototype.onConfigure = function (info) {
            // 捕获 widgets_values 并暂时置空，阻止 base onConfigure 按索引错误赋值。
            // 原因：此时编辑按钮尚未添加（只有 7 个下拉框），但旧工作流保存了 13 个值
            // （含按钮的 null），按索引赋值会导致从 option 开始全部错位。
            const savedWidgetsValues = info.widgets_values ? [...info.widgets_values] : null;
            const origWV = info.widgets_values;
            info.widgets_values = null;

            const result = onConfigure ? onConfigure.apply(this, arguments) : undefined;
            info.widgets_values = origWV; // 恢复，供其他处理器使用

            setTimeout(async () => {
                await fetchConfig();
                this.setupCallbacks();
                this.addPrimusWidgets();
                // 按组件名称手动赋值（过滤掉按钮的 null/0 值），避免索引错位
                if (savedWidgetsValues && savedWidgetsValues.length > 0) {
                    this._applySavedWidgetValues(savedWidgetsValues);
                }
                updateGroupWidget(this);
                updateAllValueWidgets(this);
                applyOutputsVisibility(this);
            }, 100);
            return result;
        };

        // ---- callbacks ----

        nodeType.prototype.setupCallbacks = function () {
            const self = this;

            const gw = this.widgets.find(w => w.name === 'group');
            if (gw) {
                const orig = gw.callback;
                gw.callback = (v) => { if (orig) orig.call(self, v); updateAllValueWidgets(self); syncAllVisibleValues(self); };
            }

            const ow = this.widgets.find(w => w.name === 'option');
            if (ow) {
                const orig = ow.callback;
                ow.callback = (v) => { if (orig) orig.call(self, v); syncAllVisibleValues(self); };
            }

            for (const name of ['value', 'value2', 'value3', 'value4']) {
                const w = this.widgets.find(w2 => w2.name === name);
                if (w) {
                    const orig = w.callback;
                    w.callback = (v) => { if (orig) orig.call(self, v); syncAllVisibleValuesTo(self, v); };
                }
            }

            const outW = this.widgets.find(w => w.name === 'outputs');
            if (outW) {
                this._prevOutputs = outW.value;
                const orig = outW.callback;
                outW.callback = (v) => {
                    const prev = self._prevOutputs;
                    const nv = parseInt(v) || 1;
                    const pv = parseInt(prev) || 1;

                    // 处理上次 Cancel 回退触发的回调
                    if (self._reverting) { self._reverting = false; return; }

                    if (nv < pv) {
                        if (!confirm('如果选择更少的 options，则会永久丢失一部分选项的值，是否继续？')) {
                            self._reverting = true;
                            self._prevOutputs = prev;  // 先手动重置，防止 setter 不触发回调
                            outW.value = prev;
                            // 兜底：如果 setter 未触发回调，延时清除标志
                            setTimeout(() => { self._reverting = false; }, 50);
                            return;
                        }
                    }
                    self._prevOutputs = v;
                    if (orig) orig.call(self, v);

                    // 服务端 expand/shrink items，然后刷新
                    const g = currentGroup(self);
                    if (g && g !== PLACEHOLDER_NO_GROUP) {
                        fetch('/primus/selector/set_group_outputs', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ group_name: g, outputs: v }),
                        }).then(async () => {
                            await fetchConfig();
                            updateAllValueWidgets(self);
                            applyOutputsVisibility(self);
                            syncAllVisibleValues(self);
                        });
                    }
                };
            }
        };

        // ---- widgets 管理 ----

        nodeType.prototype.removePrimusWidgets = function () {
            for (const n of ALL_PRIMUS_BTNS) {
                const i = this.widgets.findIndex(w => w.name === n);
                if (i !== -1) this.widgets.splice(i, 1);
            }
        };

        nodeType.prototype._createBtn = function (name, onClick) {
            const b = this.addWidget("button", name, 0, onClick);
            if (b) b.serialize = false;
            return b;
        };

        nodeType.prototype._moveAfter = function (widget, targetName) {
            const i = this.widgets.indexOf(widget);
            if (i === -1) return;
            this.widgets.splice(i, 1);
            const t = this.widgets.findIndex(w => w.name === targetName);
            this.widgets.splice(t + 1, 0, widget);
        };

        /**
         * 按组件名称手动应用 widgets_values，而非按索引赋值。
         * 兼容两种保存格式：
         *   - 旧格式（13 值）：含编辑按钮的 null 值，需过滤
         *   - 新格式（7 值）：仅下拉框值
         */
        nodeType.prototype._applySavedWidgetValues = function (savedValues) {
            const dropdownNames = ['group', 'option', 'value', 'value2', 'value3', 'value4', 'outputs'];
            // 过滤掉 null/undefined/0（按钮的序列化值），保留下拉框的实际值
            const realValues = savedValues.filter(v => v != null && v !== 0);
            dropdownNames.forEach((name, i) => {
                if (i < realValues.length) {
                    const w = this.widgets.find(w2 => w2.name === name);
                    if (w) w.value = realValues[i];
                }
            });
        };

        nodeType.prototype.addPrimusWidgets = function () {
            this.removePrimusWidgets();
            const self = this;

            // --- 编辑分组 ---
            const eg = this._createBtn(BTN_EDIT_GROUP, () => {
                const g = currentGroup(self);
                if (!g || g === PLACEHOLDER_NO_GROUP) return;
                const nn = prompt("编辑分组名称：", g);
                if (!nn || !nn.trim() || nn.trim() === g) return;
                fetch('/primus/selector/rename_group', {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ old_name: g, new_name: nn.trim() }),
                }).then(r => r.json()).then(async d => {
                    if (d.success) {
                        await fetchConfig();
                        updateGroupWidget(self);
                        const gw = self.widgets.find(w => w.name === 'group');
                        if (gw && gw.options.values.includes(nn.trim())) gw.value = nn.trim();
                        updateAllValueWidgets(self);
                    } else alert(d.message);
                });
            });

            // --- 编辑 option ---
            const eo = this._createBtn(BTN_EDIT_OPTION, () => {
                const g = currentGroup(self);
                if (!g || g === PLACEHOLDER_NO_GROUP) return;
                const idx = currentIndex(self, 'option');
                if (idx < 0) return;
                const ow = self.widgets.find(w => w.name === 'option');
                const cur = ow.value;
                if (!cur || cur === PLACEHOLDER_NO_OPTION || cur === PLACEHOLDER_SELECT_GROUP) return;
                const nn = prompt("编辑选项显示名(option)：", cur);
                if (!nn || !nn.trim() || nn.trim() === cur) return;
                fetch('/primus/selector/edit_option', {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ group_name: g, index: idx, new_option_name: nn.trim() }),
                }).then(r => r.json()).then(async d => {
                    if (d.success) {
                        await fetchConfig();
                        updateAllValueWidgets(self);
                        if (ow.options.values.includes(nn.trim())) ow.value = nn.trim();
                    } else alert(d.message);
                });
            });

            // --- 编辑 valueN ---
            const makeEditValue = (widgetName, fieldName) => {
                return this._createBtn(widgetName, () => {
                    const g = currentGroup(self);
                    if (!g || g === PLACEHOLDER_NO_GROUP) return;
                    const idx = currentIndex(self, fieldName);
                    if (idx < 0) return;
                    const vw = self.widgets.find(w => w.name === fieldName);
                    const cur = vw.value;
                    if (!cur || cur === PLACEHOLDER_NO_OPTION || cur === PLACEHOLDER_SELECT_GROUP) return;
                    const nn = prompt("编辑选项值(value)：", cur);
                    if (!nn || !nn.trim() || nn.trim() === cur) return;
                    fetch('/primus/selector/edit_value', {
                        method: 'POST', headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ group_name: g, index: idx, field: fieldName, new_value: nn.trim() }),
                    }).then(r => r.json()).then(async d => {
                        if (d.success) {
                            await fetchConfig();
                            updateAllValueWidgets(self);
                            const vw2 = self.widgets.find(w => w.name === fieldName);
                            if (vw2 && vw2.options.values.includes(nn.trim())) vw2.value = nn.trim();
                            syncAllVisibleValues(self);
                        } else alert(d.message);
                    });
                });
            };

            const ev = makeEditValue(BTN_EDIT_VALUE, 'value');
            const ev2 = makeEditValue(BTN_EDIT_VALUE2, 'value2');
            const ev3 = makeEditValue(BTN_EDIT_VALUE3, 'value3');
            const ev4 = makeEditValue(BTN_EDIT_VALUE4, 'value4');

            // 排列编辑按钮
            this._moveAfter(eg, 'group');
            this._moveAfter(eo, 'option');
            this._moveAfter(ev, 'value');
            this._moveAfter(ev2, 'value2');
            this._moveAfter(ev3, 'value3');
            this._moveAfter(ev4, 'value4');

            // --- 增加分组 ---
            this._createBtn(BTN_ADD_GROUP, () => {
                const n = prompt("请输入新分组名称：");
                if (!n || !n.trim()) return;
                fetch('/primus/selector/add_group', {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ group_name: n.trim() }),
                }).then(r => r.json()).then(async d => {
                    if (d.success) {
                        await fetchConfig();
                        updateGroupWidget(self);
                        const gw = self.widgets.find(w => w.name === 'group');
                        if (gw && gw.options.values.includes(n.trim())) gw.value = n.trim();
                        updateAllValueWidgets(self);
                    } else alert(d.message);
                });
            });

            // --- 增加选项（value 重复回 value，option 重复回 option 保留 value）---
            this._createBtn(BTN_ADD_OPTION, () => {
                const g = currentGroup(self);
                if (!g || g === PLACEHOLDER_NO_GROUP) { alert("请先添加一个分组！"); return; }
                // value 输入循环
                let vn = null;
                while (true) {
                    const input = prompt(`为分组"${g}"输入选项值(value)：`, vn || '');
                    if (!input || !input.trim()) return;  // 取消则整个流程终止
                    vn = input.trim();
                    // 先在前端预检 value 重复（快速反馈）
                    const vw = self.widgets.find(w => w.name === 'value');
                    if (vw && vw.options.values.includes(vn)) {
                        alert(`选项值 '${vn}' 已存在，请重新输入`);
                        continue;
                    }
                    break;
                }
                // option 输入循环（保留 vn）
                let on = null;
                while (true) {
                    const input = prompt(`为分组"${g}"输入选项显示名(option)：\n（留空则与 value 相同）`, on || vn);
                    if (input === null) return;  // 点取消则整个流程终止
                    const optVal = input.trim();
                    on = optVal;
                    const finalOpt = optVal || vn;
                    // 前端预检 option 重复
                    const ow = self.widgets.find(w => w.name === 'option');
                    if (ow && ow.options.values.includes(finalOpt)) {
                        alert(`选项显示名 '${finalOpt}' 已存在，请重新输入`);
                        continue;
                    }
                    // 提交到后端
                    fetch('/primus/selector/add_option', {
                        method: 'POST', headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ group_name: g, value_name: vn, option_name: finalOpt === vn ? '' : finalOpt }),
                    }).then(r => r.json()).then(async d => {
                        if (d.success) {
                            await fetchConfig();
                            updateAllValueWidgets(self);
                            const ow2 = self.widgets.find(w => w.name === 'option');
                            const vw2 = self.widgets.find(w => w.name === 'value');
                            if (ow2 && ow2.options.values.includes(finalOpt)) ow2.value = finalOpt;
                            if (vw2 && vw2.options.values.includes(vn)) vw2.value = vn;
                        } else alert(d.message);
                    });
                    return;
                }
            });

            // --- 删除分组 ---
            this._createBtn(BTN_DEL_GROUP, () => {
                const g = currentGroup(self);
                if (!g || g === PLACEHOLDER_NO_GROUP) return;
                if (!confirm(`确定要删除分组"${g}"及其所有选项吗？`)) return;
                fetch('/primus/selector/delete_group', {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ group_name: g }),
                }).then(r => r.json()).then(async d => {
                    if (d.success) {
                        await fetchConfig();
                        updateGroupWidget(self);
                        updateAllValueWidgets(self);
                    } else alert(d.message);
                });
            });

            // --- 删除选项 ---
            this._createBtn(BTN_DEL_OPTION, () => {
                const g = currentGroup(self);
                if (!g || g === PLACEHOLDER_NO_GROUP) return;
                const idx = currentIndex(self, 'value');
                if (idx < 0) return;
                const vw = self.widgets.find(w => w.name === 'value');
                if (!vw || vw.value === PLACEHOLDER_NO_OPTION || vw.value === PLACEHOLDER_SELECT_GROUP) return;
                if (!confirm(`确定要删除选项"${vw.value}"吗？`)) return;
                fetch('/primus/selector/delete_option', {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ group_name: g, index: idx }),
                }).then(r => r.json()).then(async d => {
                    if (d.success) {
                        await fetchConfig();
                        updateAllValueWidgets(self);
                    } else alert(d.message);
                });
            });

            this.setDirtyCanvas(true, true);
        };
    },
});
