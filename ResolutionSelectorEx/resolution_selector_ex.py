"""
Resolution Selector Ex 节点

基于 ComfyUI 内置的 Resolution Selector（comfy_extras/nodes_resolution.py）改造。

与内置节点的区别（照搬 Comfyroll CR Aspect Ratio 的模式）：
  - width / height 不再是纯输出，而是被定义为节点上的输入框，同时直接作为输出。
  - 前端 resolution_selector_ex.js 会在 aspect_ratio / megapixels / multiple
    发生变化时，按原有计算逻辑实时算出 width / height 并写入这两个框。
  - 因此节点输出值即为这两个框的当前值。
"""

import math


class ResolutionSelectorEx:

    NAME = "Resolution Selector Ex (Primus)"
    CATEGORY = "Primus"

    # 与内置 ResolutionSelector 完全一致的比例定义
    ASPECT_RATIOS = {
        "1:1 (Square)": (1, 1),
        "2:3 (Portrait Photo)": (2, 3),
        "3:2 (Photo)": (3, 2),
        "3:4 (Portrait Standard)": (3, 4),
        "4:3 (Standard)": (4, 3),
        "9:16 (Portrait Widescreen)": (9, 16),
        "16:9 (Widescreen)": (16, 9),
        "21:9 (Ultrawide)": (21, 9),
    }

    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                # width / height 放在最前，作为可承载值的输入框（前端实时填充）
                "width": ("INT", {"default": 1024, "min": 64, "max": 8192}),
                "height": ("INT", {"default": 1024, "min": 64, "max": 8192}),
                "aspect_ratio": (
                    list(cls.ASPECT_RATIOS.keys()),
                    {"default": "1:1 (Square)"},
                ),
                "megapixels": (
                    "FLOAT",
                    {"default": 1.0, "min": 0.1, "max": 16.0, "step": 0.01},
                ),
                "multiple": (
                    "INT",
                    {"default": 8, "min": 8, "max": 128, "step": 4},
                ),
            },
        }

    RETURN_TYPES = ("INT", "INT")
    RETURN_NAMES = ("width", "height")
    FUNCTION = "execute"
    OUTPUT_NODE = False

    @classmethod
    def compute_resolution(cls, aspect_ratio, megapixels, multiple):
        """内置 Resolution Selector 的原始计算逻辑（保持不变）。

        前端 resolution_selector_ex.js 使用完全相同的公式实时计算，
        以保证界面显示值与最终输出一致。
        """
        w_ratio, h_ratio = cls.ASPECT_RATIOS[aspect_ratio]
        total_pixels = megapixels * 1024 * 1024
        scale = math.sqrt(total_pixels / (w_ratio * h_ratio))
        width = round(w_ratio * scale / multiple) * multiple
        height = round(h_ratio * scale / multiple) * multiple
        return width, height

    def execute(self, width, height, aspect_ratio, megapixels, multiple):
        # 照搬 CR Aspect Ratio 的模式：width / height 这两个框的当前值直接作为输出。
        # 前端已按原逻辑在参数变化时把它们算好并写入。
        return (int(width), int(height))
