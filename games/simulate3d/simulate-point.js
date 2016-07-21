//--- 2D canvas 模拟 3D 效果 -- 点（->线->面） ----------------------------------------------------------------------

// parameters

var rect = $$tool.getRect('body'),
  c = createjs,
  stage = new c.Stage('cvs'),
  canvas = stage.canvas,
  cw = canvas.width = rect.width,   // canvas width
  ch = canvas.height = rect.height, // canvas height
  focalLen = 500,                   // focal length in z axis
  FPS = 60,
  TICK_ITV_TIME = 1000 / 60;        // interval time between frames in theory


// loop function
var loop = {
  draw: $$tool.noop,
  update: $$tool.noop,
  stateTime: 0,
  totalTime: 0
};

// data storage
var gdata = {
  shapePos: [],
  shapeZ: 50,
  ballParas: [],
  rotsV: [.001, .0012, 0],
  rots: [0, 0, 0],
  translate: [0, 0, 0],
  globalTrans: [0, 0, 0],
  r: 5
};

//---------------------------------------------------------------------------

// finite state machine 有限状态机，便于控制状态的切换

var fsm = StateMachine.create({
  initial: {state: 'hi', defer: true, event: 'init'},
  events: [
    {name: 'tofsm', from: 'hi', to: 'fsm'},
    {name: 'tohi', from: 'fsm', to: 'hi'}
  ],
  callbacks: {
    // init
    "oninit": function (event, from, to) {
      console.log('event: ' + event + ', ' + from + '->' + to);
      // calc txt pos
      calcPos('@');
      // generate balls in stage.children 在极远处生成小球
      generateBalls(gdata.shapePos.length);
      // 通用 draw 方法
      loop.draw = generalDraw;
      // 入场动画
      loop.update = appearAniUpdate;
      // tick
      startTick();
    },

    // global
    "onleavestate": function (event, from, to) {
      if (event == 'init') return;
      console.log('leaving : ' + from);
    },
    "onenterstate": function (event, from, to) {
      if (event == 'init') return;
      console.log('enter : ' + to);
      loop.stateTime = 0; // reset state time
    },

    // prototype
    "ontofsm": function (event, from, to) {
      console.log('event: ' + event + ', ' + from + '->' + to);
    },
    "ontowelcome": function (event, from, to) {
      console.log('event: ' + event + ', ' + from + '->' + to);
    }
  }
});

//---------------------------------------------------------------------------

// functions

// 开始 tick 主循环
function startTick() {
  c.Ticker.timingMode = c.Ticker.RAF_SYNCHED;
  c.Ticker.setFPS(FPS);
  c.Ticker.on('tick', function (evt) {
    loop.update(evt.delta);
    loop.draw();
    loop.totalTime += evt.delta;
    stage.update(evt);
  });
}

// 获取文本 txt 对应图形的坐标
function calcPos(txt) {
  gdata.shapePos = $$tool.getParticlePos($$tool.createTxtCanvas(txt, cw, ch, 'bold ' + ~~(ch / 1.2) + 'px Arial'), 127, 12);
}

// 初始化一定数量的小球，坐标随机
function generateBalls(num) {
  var _num = stage.children.length;
  if (_num >= num) return;
  var colors = [255, 255, 255];
  for (var l = num - _num, x, y, z, ball; l; l--) {
    x = $$tool.random(0, cw);
    y = $$tool.random(0, ch);
    z = $$tool.random(-focalLen * 2, focalLen * 4);
    ball = addBall();
    gdata.ballParas.push({
      x: x, y: y, z: z, colors: colors, ball: ball,
      backupPos: {x: x, y: y, z: z},      // 备份初始坐标数据，用于 tween 缓动函数的计算
      transPos: {x: x, y: y, z: z}        // 存储经过图形变换矩阵变换之后的坐标
    });
  }
}

function sort(arr) {
  arr.length && arr.sort(function (a, b) {
    return a.transPos.z - b.transPos.z;
  });
}

// 添加一个空白 ball
function addBall() {
  var b = new c.Shape();
  b.graphics.f('rgba(0,0,0,0)').dc(0, 0, 0);
  stage.addChild(b);
  return b;
}
// 更新 ball 的坐标、大小、颜色
function resetBall(ball, x, y, colors, scale) {
  ball.x = x;
  ball.y = y;
  ball.graphics.clear()
    .f('rgba(' + colors[0] + ',' + colors[1] + ',' + colors[2] + ',1)')
    .dc(0, 0, gdata.r * scale);
}

// 通用 draw 方法
function generalDraw() {
  //sort(gdata.ballParas);
  var centers = [cw / 2 + gdata.translate[0] + gdata.globalTrans[0], ch / 2 + gdata.translate[1] + gdata.globalTrans[1], gdata.shapeZ + gdata.translate[2] + gdata.globalTrans[2]],
    matrix2Trans = $$tool.matrixMultipy(
      $$tool.rotate(gdata.rots[0], gdata.rots[1], gdata.rots[2]),
      $$tool.translate(gdata.translate[0] + gdata.globalTrans[0], gdata.translate[1] + gdata.globalTrans[1], gdata.translate[2] + gdata.globalTrans[2])
    );
  for (var l = gdata.ballParas.length, pos, para; l; l--) {
    para = gdata.ballParas[l - 1];
    para.transPos = $$tool.getTransPos(para, centers, matrix2Trans);       // 经过图形变换矩阵变换之后的坐标
    pos = $$tool.get3dPos(para.transPos, focalLen, para.colors, centers);  // 施加 z 坐标对 x、y、colors 的影响
    resetBall(para.ball, pos.pos.x, pos.pos.y, pos.colors, pos.scale);
  }
}

// 某一个 update 方法
function appearAniUpdate(delta) {
  loop.stateTime += delta;
  var totalTime = 3000,
    totalFrame = totalTime / TICK_ITV_TIME,
    currentFrame = loop.stateTime / TICK_ITV_TIME;
  gdata.rots[0] += gdata.rotsV[0];
  gdata.rots[1] += gdata.rotsV[1];
  gdata.rots[2] += gdata.rotsV[2];
  if (!!appearAniUpdate.stop) return;
  if (currentFrame - totalFrame > 0 && currentFrame - totalFrame < 5) {
    currentFrame = totalFrame;
  } else if (currentFrame - totalFrame >= 5) {
    showTutorial();
    appearAniUpdate.stop = true;
    return;
  }
  var l = gdata.ballParas.length, para, backupPos, spara;
  for (; l; l--) {
    para = gdata.ballParas[l - 1];
    backupPos = para.backupPos;
    spara = gdata.shapePos[l - 1];
    if (!spara) break;
    para.x = Tween.Bounce.easeOut(currentFrame, backupPos.x, spara.x - backupPos.x, totalFrame);
    para.y = Tween.Bounce.easeOut(currentFrame, backupPos.y, spara.y - backupPos.y, totalFrame);
    para.z = Tween.Bounce.easeOut(currentFrame, backupPos.z, gdata.shapeZ - backupPos.z + gdata.globalTrans[2], totalFrame);
  }
}

// 展示「指引」
function showTutorial() {
  var $tt = document.querySelector(".m-tutorial");
  $tt.setAttribute('class', 'm-tutorial z-show');
  setTimeout(function () {
    $tt.setAttribute('class', 'm-tutorial');
    setTimeout(function (){
      $tt.remove();  
    }, 1000);
  }, 10000);
}

//---------------------------------------------------------------------------

// 事件交互 Event Interaction

var $$body = document.querySelector("body"), mousedown = false, mousedownPos = [];
$$body.addEventListener('mousemove', function (evt) {
  var mx = evt.clientX - rect.left,
    my = evt.clientY - rect.top;
  if (!!mousedown) {
    gdata.translate[0] = mx - mousedownPos[0];
    gdata.translate[1] = my - mousedownPos[1];
    return;
  }
  gdata.rotsV[0] = (my - ch / 2) * .00004;
  gdata.rotsV[1] = (mx - cw / 2) * .00004;
});
$$body.addEventListener('mousedown', function (evt) {
  var mx = evt.clientX - rect.left,
    my = evt.clientY - rect.top;
  mousedownPos = [mx - gdata.translate[0], my - gdata.translate[1]];
  mousedown = true;
});
$$body.addEventListener('mouseup', function (evt) {
  mousedown = false;
});
$$body.addEventListener('keydown', function (evt) {
  switch (evt.keyCode) {
    case 87://w
      gdata.globalTrans[2] -= 5;//z--
      break;
    case 83://s
      gdata.globalTrans[2] += 5;//z++
      break;
    case 65://a
      gdata.globalTrans[0] -= 5;//x--
      break;
    case 68://d
      gdata.globalTrans[0] += 5;//x++
      break;
  }
});

//---------------------------------------------------------------------------

fsm.init();

//---------------------------------------------------------------------------
