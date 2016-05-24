var c = createjs;
var stage = new c.Stage('mineCanvas'),
  canvas = stage.canvas,
  CH = 600, CW = 400;

canvas.width = CW;
canvas.height = CH;

//绘制背景
function drawBg() {
}

//绘制固定小球
var fixBall = {
  container: new c.Container(), //所有固定小球的容器
  firct: .1,                    //固定小球反弹摩擦力系数（0-1，0代表:反弹无摩擦力损失）
  fixBallPath: [                //坐标（总体占 320 * 500）
    [40, 100 - 50], [40 + 80, 100 - 50], [40 + 80 * 2, 100 - 50], [40 + 80 * 3, 100 - 50],
    [80, 100], [80 * 2, 100], [80 * 3, 100],
    [40, 100 * 2 - 50], [40 + 80, 100 * 2 - 50], [40 + 80 * 2, 100 * 2 - 50], [40 + 80 * 3, 100 * 2 - 50],
    [80, 100 * 2], [80 * 2, 100 * 2], [80 * 3, 100 * 2],
    [40, 100 * 3 - 50], [40 + 80, 100 * 3 - 50], [40 + 80 * 2, 100 * 3 - 50], [40 + 80 * 3, 100 * 3 - 50],
    [80, 100 * 3], [80 * 2, 100 * 3], [80 * 3, 100 * 3],
    [40, 100 * 4 - 50], [40 + 80, 100 * 4 - 50], [40 + 80 * 2, 100 * 4 - 50], [40 + 80 * 3, 100 * 4 - 50],
    [80, 100 * 4], [80 * 2, 100 * 4], [80 * 3, 100 * 4]
  ],
  color: '#795548',              //颜色
  color2: '#f60',                //触发后颜色
  r: 10                          //半径
};
function drawFixBall() {
  for (var fball, pos, i = 0, l = fixBall.fixBallPath.length; i < l; i++) {
    pos = fixBall.fixBallPath[i];
    fixBall.container.addChild(fball = new c.Shape())
      .set({x: pos[0], y: pos[1]})
      .graphics
      .f(fixBall.color)
      .dc(0, 0, fixBall.r);
  }
  fixBall.container.cache(0, 0, CW, CH);//缓存
  stage.addChild(fixBall.container);
}


drawFixBall();
stage.update();