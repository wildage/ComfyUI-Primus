"""
Customizable Selector 节点包
"""
from . import selector_server  # noqa: F401 - 注册 API 路由

from .customizable_selector import CustomizableSelector

NODE_CLASS_MAPPINGS = {
    CustomizableSelector.NAME: CustomizableSelector,
}

NODE_DISPLAY_NAME_MAPPINGS = {
    CustomizableSelector.NAME: "Customizable Selector",
}

__all__ = ["NODE_CLASS_MAPPINGS", "NODE_DISPLAY_NAME_MAPPINGS"]
