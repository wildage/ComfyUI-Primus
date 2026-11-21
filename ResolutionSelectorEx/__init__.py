"""
Resolution Selector Ex 节点包
"""
from .resolution_selector_ex import ResolutionSelectorEx

NODE_CLASS_MAPPINGS = {
    ResolutionSelectorEx.NAME: ResolutionSelectorEx,
}

NODE_DISPLAY_NAME_MAPPINGS = {
    ResolutionSelectorEx.NAME: "Resolution Selector Ex",
}

__all__ = ["NODE_CLASS_MAPPINGS", "NODE_DISPLAY_NAME_MAPPINGS"]
