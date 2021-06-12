// ATTENTION! ⚠️    
//
// 在下面的代码中使用了一些Gamepad实用程序和类（比如Gamepad.Asynchronizer）。
//这些类是有用的，但不是构建游戏的基础。
//我建议您首先阅读这个代码演示的剩余部分，然后返回这里。



/* --- Gui manager --- */
//
// this class:
//  -被游戏用来管理GUI
class Gui {
    constructor() {
        // 异步器类用于在重置游戏时终止动画
        // 调用asynchronizer.run（）函数时，会创建一个新的GUI实例，
        // 该实例位于asynchronizer.async中
        // 调用asynchronizer.reset（）函数时，将终止GUI的旧实例
        //再也不能和精灵互动了（它会被垃圾收集）
        this.asynchronizer = new Blockly.Gamepad.Asynchronizer(
            // class
            GUI,
            // run function
            function (id) {
                // this === asynchronizer.async  (new GUI())

                // set the sprite
                this.rect = document.getElementById("clipRect" + id)
                this.pegman = document.getElementById("pegman" + id)
                console.log(this,id)
                // set the sprite position
                this.rect.setAttribute('x', guiData.start[id - 1].rect.x)
                this.rect.setAttribute('y', guiData.start[id - 1].rect.y)
                this.pegman.setAttribute('x', guiData.start[id - 1].pegman.x)
                this.pegman.setAttribute('y', guiData.start[id - 1].pegman.y)
            },
            // reset function
            function () {
                // this === asynchronizer.sync
                // nothing to do here
            })
    }

    /* --- Gui handlers --- */

    // load a level
    load(id) {
        // 如果传递了一个新的id，则更新旧的id
        // 否则就用老的
        if(id) this.id = id

        // 关闭旧的gui实例
        this.asynchronizer.reset()
        // 生成新GUI实例
        this.asynchronizer.run(this.id)
        console.log(id)
        console.log(document.getElementById(id))
        // 显示/隐藏游戏背景
        document.getElementById("1").style.display = this.id == 1 ? 'block' : 'none'
        document.getElementById("2").style.display = this.id == 2 ? 'block' : 'none'
        document.getElementById("3").style.display = this.id == 3 ? 'block' : 'none'
        document.getElementById("4").style.display = this.id == 4 ? 'block' : 'none'
        document.getElementById("5").style.display = this.id == 5 ? 'block' : 'none'
        // document.getElementById("6").style.display = this.id == 6 ? 'block' : 'none'
    }

    // 删除动画
    removeAnimation() {
        // ac是GUI的当前实例
        let ac = this.asynchronizer.async, tid

        // 如果用户在
        //“clickTime”毫秒，动画将不显示
        ac.tid = tid = setTimeout(() => ac.animate = ac.tid === tid, guiData.clickTime)
    }

    // 管理请求
    manageRequest(request, back) {
        //ac是GUI的当前实例
        let ac = this.asynchronizer.async

        // 调用异步属性的方法
        if (['TURN', 'MOVE'].includes(request.method))
            // update the gui
            return ac[request.method].apply(ac, [back].concat(request.data))
        else
            // wait a lot of time
            return ac.someTime(true)
    }
}

/* --- Gui class --- */
//
// this class:
//  - manage the animations of the sprite
class GUI {
    constructor() {
        //如果必须加载动画
        this.animate = true
    }

    // return a promise that is solved after some time
    someTime(lotOfTime) {
        // 如果“动画”设置为false，则时间为0
        // 否则时间可以是guiData.lotOfTime或guiData.time
        return new Promise(resolve => {
            setTimeout(resolve, this.animate ? lotOfTime ? guiData.lotOfTime : guiData.time : 0)
        })
    }

    /* --- GUI utils --- */

    // turn the pegman of a frame 
    turn(clockwise) {
        // the rotation offset
        let off = guiData.rotateOff * (clockwise ? -1 : 1),
            // sprite viewport data
            val = parseInt(this.rect.getAttribute('x')),
            x = parseInt(this.pegman.getAttribute('x')) + off

        // adjust the sprite viewport
        if (x > val) x = val - guiData.max
        else if (x < val - guiData.max) x = val

        // update the spites viewport
        this.pegman.setAttribute('x', x)
    }

    // move the pegman of a frame
    move(forward, direction, slap) {
        // the move offset
        let off = guiData.moveOff * (forward ? 1 : -1) * (slap ? 0.4 : 1),
            // the sprite coordinates
            xP = parseInt(this.pegman.getAttribute('x')),
            yP = parseInt(this.pegman.getAttribute('y')),
            xR = parseInt(this.rect.getAttribute('x')),
            yR = parseInt(this.rect.getAttribute('y')),
            // the position offset
            position = [{
                // UP
                x: 0,
                y: -off
            },
            {
                //RIGHT
                x: off,
                y: 0
            },
            {
                //DOWN
                x: 0,
                y: off
            },
            {
                //LEFT
                x: -off,
                y: 0
            }
            ][direction]

        // update the coordinates
        this.pegman.setAttribute('x', position.x + xP)
        this.pegman.setAttribute('y', position.y + yP)
        this.rect.setAttribute('x', position.x + xR)
        this.rect.setAttribute('y', position.y + yR)
    }

    /* --- GUI methods --- */

    // turn the pegman
    TURN(back, clockwise) {
        return new Promise(async resolve => {
            // for each frame
            for (let i = 0; i < guiData.rotateFrames; i++) {
                // turn the pegman of a frame
                this.turn(back ? !clockwise : clockwise)
                // await some time
                await this.someTime()
            }

            resolve()
        })
    }
    // move the pegman
    MOVE(back, hasMoved, direction) {
        return new Promise(async resolve => {
            // if the pegman has not moved show the crash animation
            if (hasMoved) {
                // for each frame
                for (let i = 0; i < guiData.moveFrames; i++) {
                    // move the pegman of a frame
                    this.move(!back, direction)
                    // await some time
                    await this.someTime()
                }
            } else {
                // first half of the crush animation
                this.move(!back, direction, true)

                // await some time
                await this.someTime()

                // second half of the crush animation
                this.move(back, direction, true)

                // await some time
                await this.someTime()
            }

            resolve()
        })
    }
}

/* --- GUI data --- */
//
// some data
const guiData = {
    // animation frame time
    time: 100,
    // time to wait
    lotOfTime: 350,
    // user click max time offset
    clickTime: 350,
    // single frame move offset
    moveOff: 10,
    // move frames
    moveFrames: 5,
    // single frame rotate offset
    rotateOff: 49,
    // rotate frames
    rotateFrames: 4,
    // max length
    max: 735,
    // sprite viewports on start
    start: [{
        pegman: {
            x: -95,
            y: 191
        },
        rect: {
            x: 101,
            y: 191
        }
    },
    {
        pegman: {
            x: -145,
            y: 291
        },
        rect: {
            x: 51,
            y: 291
        }
    },
    {
        pegman: {
            x: -155,
            y: 191
        },
        rect: {
            x: 51,
            y: 191
        }
    },
    {
        pegman: {
            x: -90,
            y: 291
        },
        rect: {
            x: 155,
            y: 285
        }
    },
    {
        pegman: {
            x: -145,
            y: 291
        },
        rect: {
            x: 51,
            y: 291
        }
    }
    ]
}