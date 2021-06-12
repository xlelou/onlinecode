// some inputs
Blockly.Gamepad['INPUTS'] = {
    'FORWARD': '0',
    'RIGHT': '1',
    'BACKWARD': '2',
    'LEFT': '3'
}

// init the Gamepad
Blockly.Gamepad.init({
    toolbox,
    blocks: {
        'repeat_until': {
            // 请求将是: { method: 'REPEAT', args: [] }
            method: 'REPEAT', // 请求的方法
            statements: ['DO'], // 语句名称*
            template: Blockly.Gamepad['TEMPLATES']['WHILE'], // 模板类型
            json: {
                // type: 'repeat_until',    是自动设置的
                'message0': '重复直到 %1 %2 执行 %3',
                'args0': [{
                    'type': 'field_image',
                    'src': './images/zhuzi.png',
                    'width': 15,
                    'height': 15,
                },
                {
                    'type': 'input_dummy'
                },
                {
                    // 子块将包含在这里
                    'type': 'input_statement',
                    'name': 'DO' // the statement name*
                }
                ],
                'previousStatement': null,
                'colour': 120,
            }
        },
        'if_path': {
            // the request will be { method: 'PATH', args: [ Blockly.Gamepad['INPUTS']['...some direction'] ]}
            method: 'PATH',
            args: [{
                field: 'DIRECTION', // the field name
                get: parseInt // 返回数字而不是字符串
            }],
            statements: ['DO'],
            template: Blockly.Gamepad['TEMPLATES']['IF'],
            json: {
                'message0': '如果路径 %1 %2 执行 %3',
                'args0': [{
                    'type': 'field_dropdown',
                    'name': 'DIRECTION', // the field name
                    'options': [ // args[0] will be one of these options
                        ['直走', Blockly.Gamepad['INPUTS']['FORWARD']],
                        ['向右 ↻', Blockly.Gamepad['INPUTS']['RIGHT']],
                        ['向左 ↺', Blockly.Gamepad['INPUTS']['LEFT']]
                    ]
                },
                {
                    'type': 'input_dummy'
                },
                {
                    'type': 'input_statement',
                    'name': 'DO'
                }
                ],
                'previousStatement': null,
                'nextStatement': null,
                'colour': 210
            }
        },
        'if_else_path': {
            // the request will be { method: 'PATH', args: [ Blockly.Gamepad['INPUTS']['...some direction'] ]}
            method: 'PATH',
            args: [{
                field: 'DIRECTION',
                get: parseInt
            }],
            statements: ['DO', 'ELSE'],
            template: Blockly.Gamepad['TEMPLATES']['IF_ELSE'],
            json: {
                'message0': '如果路径 %1 %2 执行%3 否则 %4',
                'args0': [{
                    'type': 'field_dropdown',
                    'name': 'DIRECTION',
                    'options': [
                        ['直走', Blockly.Gamepad['INPUTS']['FORWARD']],
                        ['向右 ↻', Blockly.Gamepad['INPUTS']['RIGHT']],
                        ['向左 ↺', Blockly.Gamepad['INPUTS']['LEFT']]
                    ]
                },
                {
                    'type': 'input_dummy'
                },
                {
                    'type': 'input_statement',
                    'name': 'DO'
                },
                {
                    'type': 'input_statement',
                    'name': 'ELSE'
                }
                ],
                'previousStatement': null,
                'nextStatement': null,
                'colour': 210
            }
        },
        'turn': {
            // the request will be { method: 'TURN', args: [ Blockly.Gamepad['INPUTS']['...some direction'] ]}
            method: 'TURN',
            args: [{
                field: 'DIRECTION',
                get: parseInt
            }],
            json: {
                'message0': '向 %1',
                'args0': [{
                    'type': 'field_dropdown',
                    'name': 'DIRECTION',
                    'options': [
                        ['右转 ↻', Blockly.Gamepad['INPUTS']['RIGHT']],
                        ['左转 ↺', Blockly.Gamepad['INPUTS']['LEFT']]
                    ]
                }],
                'previousStatement': null,
                'nextStatement': null,
                'colour': 285
            }
        },
        'move': {
            // the request will be { method: 'MOVE', args: [] ]}
            method: 'MOVE',
            json: {
                'message0': '向前移动',
                'previousStatement': null,
                'nextStatement': null,
                'colour': 285
            }   
        }
    }
})

// create the workspace
Blockly.inject('blockly-div', {
    toolbox,
    toolboxPosition: 'start',
    horizontalLayout: false,
})

// 创建游戏板和游戏
const
    gamepad = new Blockly.Gamepad({
        'start': start, // 启用/禁用起始块
        'magicJson': true, // 查看game.js文件以了解此选项是如何工作的
        'customHighlight': true // 如果为false，请使用块高亮显示方法
    }),
    gui = new Gui(),
    game = new Game(gui, gamepad)

// 在块上下文菜单中添加调试选项
const populate_ = Blockly.ContextMenu.populate_;
Blockly.ContextMenu.populate_ = function (options, rtl) {
    options = options.concat(
        {
            text: 'Set as breakpoint (forward)',
            enabled: true,
            callback: async () => {
                // 减少次数
                guiData.time /= 10
                guiData.lotOfTime /= 10
                // debug
                await gamepad.debug(Blockly.selected.id, false)
                // restore times
                guiData.time *= 10
                guiData.lotOfTime *= 10
            }
        },
        {
            text: 'Set as breakpoint (backward)',
            enabled: true,
            callback: async () => {
                // decrease times
                guiData.time /= 10
                guiData.lotOfTime /= 10
                // debug
                await gamepad.debug(Blockly.selected.id, true)
                // restore times
                guiData.time *= 10
                guiData.lotOfTime *= 10
            }
        })

    return populate_.apply(Blockly.ContextMenu, [options, rtl])
}
// load the level
game.loadLevel(levels[id-1])
