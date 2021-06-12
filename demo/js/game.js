/* --- Game class --- */
//
// this class:
//  - 管理请求
//  - 更新游戏（json）
//  - 管理gui
//  -加载关卡
class Game {
    // the gamepad is passed to the contructor
    constructor(gui, gamepad) {
        // link the game
        gamepad.setGame(this, this.manageRequest)

        // set the gamepad and the gui
        this.gamepad = gamepad
        this.gui = gui
    }

    /* --- Game handlers --- */

    // 所有请求都传递给此函数
    manageRequest(request, back, old) {
        let result, promise

        // 如果调用了一个方法，并且请求不是旧的，则更新游戏
        //
        // 使用“magicJson”选项，json只需更改第一个
        // 请求传递到此函数的时间
        //
        // 如果请求是旧的，那么在将请求传递到此函数之前，json将自动更新
        //
        // 实际上，在下面的方法处理程序中，没有传递'back'参数
        //而且没有代码可以删除对back请求的json更改
        if (['PATH', 'REPEAT', 'TURN', 'MOVE'].includes(request.method) && !old)
            // 更新游戏
            result = this[request.method].apply(this, [].concat(request.args, request))
          
        // 检查游戏状态
        this.checkGameStatus(request, back, old)

        // 更新gui
        promise = this.gui.manageRequest(request, back)
        // 你可以回报一个承诺
        return promise.then(() => result)
    }

    // 加载关卡
    loadLevel(level) {
        // 更新maxBlocks设置
        if ('maxBlocks' in level)
            // 如果使用起始块，则添加1
            Blockly.getMainWorkspace().options.maxBlocks = level.maxBlocks + (start ? 1 : 0)
        else
            // no max
            Blockly.getMainWorkspace().options.maxBlocks = Infinity

        // update the toolbox
        if ('blocks' in level)
            // 从xml加载一些块/类别
            this.gamepad.setToolbox({
                blocks: level.blocks
            })
        else
            // 从xml加载所有块/类别
            this.gamepad.setToolbox({
                all: true
            })

        // 更新magicJson
        this.gamepad.level = level.game
        // set the id
        this.id = level.id

        // load the gui
        this.gui.load(this.id)
        //重置工作区，并关闭前一个游戏的请求，如果它没有完成
        this.gamepad.reset()
        // 从本地存储还原旧代码
        this.gamepad.restore('' + this.id + start)
    }

    // 加载代码
    loadCode() {
        // 加载代码，json被重置
        this.gamepad.load()
        // 将代码保存在本地存储中
        this.gamepad.save('' + this.id + start)
        // 重置gui
        this.gui.load()
        // 加载第一个“启动”请求
        this.gamepad.forward()
    }

    /* --- Game utils --- */

    // 检查游戏状态
    checkGameStatus(request, back, old) {
        let pegman = this.gamepad.level.pegman,
            marker = this.gamepad.level.marker

        // 如果游戏结束，显示赢/输警报
        if (request.method == Blockly.Gamepad['STATES']['FINISHED'] && !back) {
            if (pegman.x == marker.x && pegman.y == marker.y)
                alert('you won!')
            else
                alert('you lost!')
        }

        // 记录请求和pegman
        // 由于gamepad.level不是一个普通的对象，因此pegman在控制台中被解析为看起来更好（参见文档）
        console.group()
            console.info('request:      ', request)
            console.info('request type: ', back ? 'backward' : 'forward')
            console.info('request age:  ', old ? 'old' : 'new')
            console.info('\n')     
            console.info('pegman:       ', JSON.parse(JSON.stringify(pegman))) 
        console.groupEnd()
    }

    // 获取下一个位置的{x，y}偏移量
    // 从给定的方向
    getNextPosition(direction) {
        // 方向就是这些输入之一
        //
        // Blockly.Gamepad['INPUTS'] = {
        //    'FORWARD': '0',
        //    'RIGHT': '1',
        //    'BACKWARD': '2',
        //    'LEFT': '3'
        // }

        return [{
                // UP
                x: 0,
                y: 1
            },
            {
                // RIGHT
                x: 1,
                y: 0
            },
            {
                // DOWN
                x: 0,
                y: -1
            },
            {
                // LEFT
                x: -1,
                y: 0
            }
        ][direction]
    }

    // 检查pegman是否能更新其位置
    // 从给定的偏移量
    canMove(path, pegman, position) {
        let x = pegman.x + position.x,
            y = pegman.y + position.y

        // 检查路径是否存在
        return path.find(element => element[0] == x && element[1] == y) != undefined
    }

    /* --- Game methods --- */
    //
    // 使用“magicJson”选项，仅当请求不旧时才会调用这些方法
    //
    // 实际上，在这些方法中，没有代码来更改back请求上的json

    // 因为它会自动更新所有的旧请求

    //“重复直到”方法
    REPEAT() {
        let pegman = this.gamepad.level.pegman,
            marker = this.gamepad.level.marker

        // 返回值：value
        // 如果为真，则循环继续，否则停止
        // while ( value ) {...}
        return {
            return: pegman.x != marker.x || pegman.y != marker.y
        }
    }

    // 'if path' methods
    PATH(direction) {
        let path = this.gamepad.level.path,
            pegman = this.gamepad.level.pegman,
            // 因为方向的值在0到3之间
            // 可以使用方向作为偏移，然后使用模数

            //（方向是一个字符串，因此它被解析）
            // 
            // Blockly.Gamepad['INPUTS'] = {
            //    'FORWARD': '0',
            //    'RIGHT': '1',
            //    'BACKWARD': '2',
            //    'LEFT': '3'
            //}
            position = this.getNextPosition((pegman.direction + direction) % 4)

        // the return: value
        // if ( value ) {...} else {...}
        return {
            return: this.canMove(path, pegman, position)
        }
    }

    // 'move forward' method
    MOVE(request) {
        let path = this.gamepad.level.path,
            pegman = this.gamepad.level.pegman,
            position = this.getNextPosition(pegman.direction),
            canMove = this.canMove(path, pegman, position)

        // 如果佩格曼能移动，位置就会更新
        if (canMove) {
            pegman.x += position.x
            pegman.y += position.y
        } 

        // 用一些数据装饰请求
        // 这些数据将在gui中使用
        request.data = [
            // if the pegman has moved
            canMove,
            // the direction of the pegman
            pegman.direction
        ]
    }

    // 'turn' method
    TURN(direction, request) {
        // 因为方向的值在0到3之间
        // 可以增加值，然后使用模数
        // 
        // Blockly.Gamepad['INPUTS'] = {
        //    'FORWARD': '0',
        //    'RIGHT': '1',
        //    'BACKWARD': '2',
        //    'LEFT': '3'
        // }
        this.gamepad.level.pegman.direction += direction
        this.gamepad.level.pegman.direction %= 4
        
        // 用一些数据装饰请求
        // 数据将在gui中使用
        request.data = [
            // 如果是顺时针方向旋转
            direction == Blockly.Gamepad['INPUTS']['RIGHT']
        ]
    }
}