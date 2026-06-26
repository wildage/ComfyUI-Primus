# ComfyUI-Primus
Let me create some easy-to-use custom nodes for ComfyUI.

---

目前只有一个节点：

---

Customizable Selector
可以定义多个用于不同目的的选项组。
默认每个选项组中每个选项只有1个value，但是如果需要每个选项带有多个value(例如分别存正向词和负向词)，则可扩展value的数量，最多可以扩展到每个选项有4个不同的value输出。

`selector_data.json` 是选项组的定义文件，每次在UI更新某个选项组(新增/编辑/删除)都会更新此文件。当个人定义好足够多的常用选项组后注意备份此文件，避免丢失定义。

---
