"""
Customizable Selector 节点 - 一个可自定义的下拉选择器节点。
数据持久化到 selector_data.json，每个 item 内嵌 value2~4 字段。
"""

from . import selector_config


class CustomizableSelector:

    NAME = "Customizable Selector (Primus)"
    CATEGORY = "Primus"

    @classmethod
    def INPUT_TYPES(cls):
        groups = selector_config.get_all_groups()

        group_list = groups if groups else ["[无分组]"]
        placeholder = ["[请先选择分组]"]

        # 汇总所有分组的各字段值，确保工作流加载校验通过
        all_options = []
        all_values, all_v2, all_v3, all_v4 = [], [], [], []
        if groups:
            for g in groups:
                all_options.extend(selector_config.get_option_names(g))
                all_values.extend(selector_config.get_value_names(g, 'value'))
                all_v2.extend(selector_config.get_value_names(g, 'value2'))
                all_v3.extend(selector_config.get_value_names(g, 'value3'))
                all_v4.extend(selector_config.get_value_names(g, 'value4'))
        option_list = all_options if all_options else ["[无选项]"]
        value_list = all_values if all_values else ["[无选项]"]
        v2_list = all_v2 if all_v2 else ["[无选项]"]
        v3_list = all_v3 if all_v3 else ["[无选项]"]
        v4_list = all_v4 if all_v4 else ["[无选项]"]

        # 把占位符也加入列表，确保 ComfyUI 校验通过
        for lst in [option_list, value_list, v2_list, v3_list, v4_list]:
            for p in ["[请先选择分组]", "[无选项]", "[无分组]"]:
                if p not in lst:
                    lst.append(p)

        return {
            "required": {
                "group": (group_list, {"default": group_list[0] if group_list else "[无分组]"}),
                "option": (option_list, {"default": option_list[0] if option_list else placeholder[0]}),
                "value": (value_list, {"default": value_list[0] if value_list else placeholder[0]}),
                "value2": (v2_list, {"default": v2_list[0] if v2_list else placeholder[0]}),
                "value3": (v3_list, {"default": v3_list[0] if v3_list else placeholder[0]}),
                "value4": (v4_list, {"default": v4_list[0] if v4_list else placeholder[0]}),
                "outputs": (["1", "2", "3", "4"], {"default": "1"}),
            },
        }

    RETURN_TYPES = ("STRING", "STRING", "STRING", "STRING", "STRING")
    RETURN_NAMES = ("option", "value", "value2", "value3", "value4")
    FUNCTION = "select"
    OUTPUT_NODE = False

    PLACEHOLDERS = {"[无选项]", "[请先选择分组]", "[无分组]"}

    def select(self, group, option, value, value2, value3, value4, outputs):
        def clean(v):
            return "" if v in self.PLACEHOLDERS else v
        results = [clean(option), clean(value), "", "", ""]
        count = int(outputs) if outputs else 1
        if count >= 2:
            results[2] = clean(value2)
        if count >= 3:
            results[3] = clean(value3)
        if count >= 4:
            results[4] = clean(value4)
        return tuple(results)
