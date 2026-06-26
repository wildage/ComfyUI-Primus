"""
ComfyUI-Primus - ComfyUI 自定义节点合集
"""

from .CustomizableSelector import NODE_CLASS_MAPPINGS, NODE_DISPLAY_NAME_MAPPINGS

# ComfyUI 自动加载此目录下的 JS 文件
WEB_DIRECTORY = "./web"

__all__ = ['NODE_CLASS_MAPPINGS', 'NODE_DISPLAY_NAME_MAPPINGS', 'WEB_DIRECTORY']
