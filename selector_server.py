"""
服务端路由模块 - 提供 Customizable Selector 的 CRUD API（基于索引操作）。
"""

from aiohttp import web
from server import PromptServer
from . import selector_config


routes = PromptServer.instance.routes


@routes.get('/primus/selector/config')
async def api_get_config(request):
    config = selector_config.get_config()
    return web.json_response(config)


@routes.post('/primus/selector/add_group')
async def api_add_group(request):
    data = await request.json()
    group_name = data.get('group_name', '')
    success, message = selector_config.add_group(group_name)
    return web.json_response({
        'success': success,
        'message': message,
        'groups': selector_config.get_all_groups(),
    })


@routes.post('/primus/selector/delete_group')
async def api_delete_group(request):
    data = await request.json()
    group_name = data.get('group_name', '')
    success, message = selector_config.delete_group(group_name)
    return web.json_response({
        'success': success,
        'message': message,
        'groups': selector_config.get_all_groups(),
    })


@routes.post('/primus/selector/rename_group')
async def api_rename_group(request):
    data = await request.json()
    old_name = data.get('old_name', '')
    new_name = data.get('new_name', '')
    success, message = selector_config.rename_group(old_name, new_name)
    return web.json_response({
        'success': success,
        'message': message,
        'groups': selector_config.get_all_groups(),
    })


@routes.post('/primus/selector/set_group_outputs')
async def api_set_group_outputs(request):
    data = await request.json()
    group_name = data.get('group_name', '')
    outputs_value = data.get('outputs', '1')
    success, message = selector_config.set_group_outputs(group_name, outputs_value)
    return web.json_response({
        'success': success,
        'message': message,
    })


@routes.post('/primus/selector/add_option')
async def api_add_option(request):
    data = await request.json()
    group_name = data.get('group_name', '')
    value_name = data.get('value_name', '')
    option_name = data.get('option_name', '')
    success, message = selector_config.add_option(group_name, value_name, option_name)
    return web.json_response({
        'success': success,
        'message': message,
        'option_names': selector_config.get_option_names(group_name),
        'value_names': selector_config.get_value_names(group_name, 'value'),
        'value2_names': selector_config.get_value_names(group_name, 'value2'),
        'value3_names': selector_config.get_value_names(group_name, 'value3'),
        'value4_names': selector_config.get_value_names(group_name, 'value4'),
    })


@routes.post('/primus/selector/delete_option')
async def api_delete_option(request):
    data = await request.json()
    group_name = data.get('group_name', '')
    index = data.get('index', -1)
    success, message = selector_config.delete_option_by_index(group_name, int(index))
    return web.json_response({
        'success': success,
        'message': message,
        'option_names': selector_config.get_option_names(group_name),
        'value_names': selector_config.get_value_names(group_name, 'value'),
        'value2_names': selector_config.get_value_names(group_name, 'value2'),
        'value3_names': selector_config.get_value_names(group_name, 'value3'),
        'value4_names': selector_config.get_value_names(group_name, 'value4'),
    })


@routes.post('/primus/selector/edit_option')
async def api_edit_option(request):
    data = await request.json()
    group_name = data.get('group_name', '')
    index = data.get('index', -1)
    new_option_name = data.get('new_option_name', '')
    success, message = selector_config.edit_option_by_index(group_name, int(index), new_option_name)
    return web.json_response({
        'success': success,
        'message': message,
        'option_names': selector_config.get_option_names(group_name),
    })


@routes.post('/primus/selector/edit_value')
async def api_edit_value(request):
    data = await request.json()
    group_name = data.get('group_name', '')
    index = data.get('index', -1)
    field = data.get('field', 'value')
    new_value = data.get('new_value', '')
    success, message = selector_config.edit_value_by_index(group_name, int(index), field, new_value)
    resp = {
        'success': success,
        'message': message,
        'option_names': selector_config.get_option_names(group_name),
        'value_names': selector_config.get_value_names(group_name, 'value'),
    }
    # 返回对应字段的新列表
    for f in ['value2', 'value3', 'value4']:
        resp[f'{f}_names'] = selector_config.get_value_names(group_name, f)
    return web.json_response(resp)
