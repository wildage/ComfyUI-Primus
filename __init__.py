"""
ComfyUI-Primus - ComfyUI 自定义节点合集
"""

# 导入服务端路由模块以注册 API 路由
from . import selector_server  # noqa: F401

from .customizable_selector import CustomizableSelector

NODE_CLASS_MAPPINGS = {
    CustomizableSelector.NAME: CustomizableSelector,
}

NODE_DISPLAY_NAME_MAPPINGS = {
    CustomizableSelector.NAME: "Customizable Selector",
}

# ComfyUI 自动加载此目录下的 JS 文件
WEB_DIRECTORY = "./web"

__all__ = ['NODE_CLASS_MAPPINGS', 'NODE_DISPLAY_NAME_MAPPINGS', 'WEB_DIRECTORY']
