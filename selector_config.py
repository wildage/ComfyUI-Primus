"""
配置管理模块 - 管理 Customizable Selector 的分组和选项数据。

数据结构（每个 item 内嵌 value2~4）:
  {
    "groups": {
      "分组1": {
        "outputs": "2",
        "items": [
          {"option": "红", "value": "red", "value2": "crimson"},
          {"option": "蓝", "value": "blue", "value2": "navy"}
        ]
      }
    }
  }
"""

import os
import json

THIS_DIR = os.path.dirname(os.path.abspath(__file__))
CONFIG_FILE = os.path.join(THIS_DIR, 'selector_data.json')

DEFAULT_CONFIG = {"groups": {}}


def _load_config():
    if not os.path.exists(CONFIG_FILE):
        return dict(DEFAULT_CONFIG)
    try:
        with open(CONFIG_FILE, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except (json.JSONDecodeError, IOError):
        return dict(DEFAULT_CONFIG)
    if 'groups' not in data:
        data['groups'] = {}
    # 迁移旧格式
    migrated = _migrate(data)
    if migrated:
        _save_config(data)
    return data


def _migrate(data):
    """将旧格式迁移到新格式，返回是否做了变更。"""
    changed = False
    for g in list(data['groups'].keys()):
        val = data['groups'][g]
        # 旧格式: 列表
        if isinstance(val, list):
            items = []
            for it in val:
                if isinstance(it, str):
                    items.append({"option": it, "value": it})
                else:
                    items.append(it)
            data['groups'][g] = {"outputs": "1", "items": items}
            changed = True
        elif isinstance(val, dict):
            if 'outputs' not in val:
                val['outputs'] = '1'
                changed = True
            if 'items' not in val:
                val['items'] = []
                changed = True
            # 移除旧的顶级 values 数组
            if 'values' in val:
                del val['values']
                changed = True
    return changed


def _save_config(config):
    with open(CONFIG_FILE, 'w', encoding='utf-8') as f:
        json.dump(config, f, ensure_ascii=False, indent=2, sort_keys=True)


def _get_group(group_name):
    config = _load_config()
    return config['groups'].get(group_name)


# ==================== 分组操作 ====================

def get_all_groups():
    config = _load_config()
    return list(config['groups'].keys())


def get_config():
    return _load_config()


def add_group(group_name):
    group_name = group_name.strip()
    if not group_name:
        return False, "分组名称不能为空"
    config = _load_config()
    if group_name in config['groups']:
        return False, f"分组 '{group_name}' 已存在"
    config['groups'][group_name] = {"outputs": "1", "items": []}
    _save_config(config)
    return True, f"分组 '{group_name}' 已添加"


def delete_group(group_name):
    group_name = group_name.strip()
    if not group_name:
        return False, "分组名称不能为空"
    config = _load_config()
    if group_name not in config['groups']:
        return False, f"分组 '{group_name}' 不存在"
    del config['groups'][group_name]
    _save_config(config)
    return True, f"分组 '{group_name}' 已删除"


def rename_group(old_name, new_name):
    old_name = old_name.strip()
    new_name = new_name.strip()
    if not old_name or not new_name:
        return False, "名称不能为空"
    config = _load_config()
    if old_name not in config['groups']:
        return False, f"分组 '{old_name}' 不存在"
    if new_name in config['groups']:
        return False, f"分组 '{new_name}' 已存在"
    config['groups'][new_name] = config['groups'].pop(old_name)
    _save_config(config)
    return True, f"分组 '{old_name}' 已重命名为 '{new_name}'"


def get_group_outputs(group_name):
    group = _get_group(group_name)
    if group:
        return group.get('outputs', '1')
    return '1'


def set_group_outputs(group_name, outputs_value):
    """
    设置 outputs，并自动 expand/shrink items 中的 valueN 字段。
    - expand: 将 value 复制到新增的 valueN
    - shrink: 删除多余的 valueN
    """
    group_name = group_name.strip()
    if not group_name:
        return False, "分组名称不能为空"
    config = _load_config()
    if group_name not in config['groups']:
        return False, f"分组 '{group_name}' 不存在"

    old_outputs = int(config['groups'][group_name].get('outputs', '1'))
    new_outputs = int(outputs_value)
    config['groups'][group_name]['outputs'] = outputs_value

    items = config['groups'][group_name].get('items', [])
    for item in items:
        # expand: 复制 value → valueN
        for i in range(old_outputs + 1, new_outputs + 1):
            field = f'value{i}'
            if field not in item:
                item[field] = item.get('value', '')
        # shrink: 删除多余的 valueN
        for i in range(new_outputs + 1, 5):
            field = f'value{i}'
            item.pop(field, None)

    _save_config(config)
    return True, outputs_value


# ==================== 选项操作（基于索引） ====================

def get_items_for_group(group_name):
    group = _get_group(group_name)
    if not group:
        return []
    return group.get('items', [])


def get_option_names(group_name):
    items = get_items_for_group(group_name)
    return [item.get('option', '') for item in items]


def get_value_names(group_name, field='value'):
    """获取指定 value 字段的所有值列表。"""
    items = get_items_for_group(group_name)
    result = []
    for item in items:
        result.append(item.get(field, item.get('value', '')))
    return result


def add_option(group_name, value_name, option_name=''):
    """添加选项，自动根据当前 outputs 初始化所有 valueN 字段。"""
    group_name = group_name.strip()
    value_name = value_name.strip()
    option_name = option_name.strip()
    if not group_name:
        return False, "分组名称不能为空"
    if not value_name:
        return False, "选项值(value)不能为空"
    if not option_name:
        option_name = value_name
    config = _load_config()
    if group_name not in config['groups']:
        return False, f"分组 '{group_name}' 不存在"
    group = config['groups'][group_name]
    items = group.get('items', [])
    for item in items:
        if item.get('value') == value_name:
            return False, f"选项值 '{value_name}' 在分组 '{group_name}' 中已存在"
    new_item = {"option": option_name, "value": value_name}
    outputs = int(group.get('outputs', '1'))
    for i in range(2, outputs + 1):
        new_item[f'value{i}'] = value_name
    items.append(new_item)
    _save_config(config)
    return True, f"选项 '{value_name}' 已添加到分组 '{group_name}'"


def delete_option_by_index(group_name, index):
    """按索引删除选项。返回 (success, message)。"""
    group_name = group_name.strip()
    if not group_name:
        return False, "分组名称不能为空"
    config = _load_config()
    if group_name not in config['groups']:
        return False, f"分组 '{group_name}' 不存在"
    items = config['groups'][group_name].get('items', [])
    if index < 0 or index >= len(items):
        return False, "索引越界"
    items.pop(index)
    _save_config(config)
    return True, f"选项已删除"


def edit_option_by_index(group_name, index, new_option_name):
    """按索引编辑 option 显示名。返回 (success, message)。"""
    group_name = group_name.strip()
    new_option_name = new_option_name.strip()
    if not group_name or not new_option_name:
        return False, "参数不能为空"
    config = _load_config()
    if group_name not in config['groups']:
        return False, f"分组 '{group_name}' 不存在"
    items = config['groups'][group_name].get('items', [])
    if index < 0 or index >= len(items):
        return False, "索引越界"
    items[index]['option'] = new_option_name
    _save_config(config)
    return True, new_option_name


def edit_value_by_index(group_name, index, field, new_value):
    """按索引编辑指定 value 字段。返回 (success, message)。"""
    group_name = group_name.strip()
    new_value = new_value.strip()
    if not group_name or not new_value:
        return False, "参数不能为空"
    config = _load_config()
    if group_name not in config['groups']:
        return False, f"分组 '{group_name}' 不存在"
    items = config['groups'][group_name].get('items', [])
    if index < 0 or index >= len(items):
        return False, "索引越界"
    # 检查重复（仅当 field 为 value 时检查 primary key）
    if field == 'value':
        for i, item in enumerate(items):
            if i != index and item.get('value') == new_value:
                return False, f"选项值 '{new_value}' 已存在"
    if field not in items[index] and field != 'value':
        items[index][field] = items[index].get('value', '')
    items[index][field] = new_value
    _save_config(config)
    return True, new_value
