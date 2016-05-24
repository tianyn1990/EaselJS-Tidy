var c = createjs;
var stage = new c.Stage('mineCanvas'),
  canvas = stage.canvas,
  CW = canvas.width,
  CH = canvas.height;

var paths = [], prePos = PATH[0], l = PATH.length, train = {}, minus = 0, wait = 2000;

stage.snapToPixelEnabled = true;//启用整像素位移
c.Ticker.timingMode = c.Ticker.RAF;
drawBg();
drawRefPt();
initTrain();
mainTick();

//绘制参考点
function drawRefPt() {
  var cont, pt;
  cont = new c.Container();
  cont.x = 0;
  cont.y = 0;
  for (var i = 0, p; i < l; i++) {
    p = PATH[i];
    cont.addChild(pt = new c.Shape())
      .set({x: p.x, y: p.y})
      .graphics
      .f('red')
      .dc(0, 0, 2);
  }
  cont.cache(0, 0, CW, CH);//缓存
  stage.addChild(cont);
}

//绘制背景图
function drawBg() {
  stage.addChild(new c.Bitmap('./images/rail-1025-420.png'));
}

/**
 * 确定每个点的：
 * 1、距离出发点的距离
 * 2、角度
 * pos:{x,y},dis:,rot:
 */
function initPt() {
  var pt, tdis = 0, pre, next;
  for (var i = 0; i < l; i++) {
    pt = {};
    pt.pos = PATH[i];
    //tdis:总距离
    tdis += Math.sqrt(Math.pow(pt.pos.x - prePos.x, 2) + Math.pow(pt.pos.y - prePos.y, 2));
    pt.dis = tdis;
    prePos = pt.pos;
    //角度稍微复杂
    pre = PATH[i - 1] || PATH[0];
    next = PATH[i + 1] || PATH[l - 1];
    var deltaX = next.x - pre.x,
      deltaY = next.y - pre.y;
    pt.rot = Math.atan2(deltaX, deltaY) * 180 / Math.PI + 90;
    paths.push(pt);
  }
  paths.totalDis = tdis;
}

//初始化小火车
function initTrain() {
  initPt();
  train.v = 100;//1秒移动100px
  train.time = 0;
  train.dis = 0;
  train.disHead = 25;//车头-车厢间距
  train.disBet = 18;//车厢之间间距

  var head = new c.Bitmap('./images/train-256-128.png');
  head.x = 0;
  head.y = 0;
  head.sourceRect = new c.Rectangle(78, 60, 23, 14);
  head.regX = 12;
  head.regY = 7;
  head.snapToPixel = false;//关闭对象的整像素位移
  stage.addChild(head);

  for (var body, bodys = [], bLen = 3; bLen; bLen--) {
    body = head.clone();
    body.sourceRect = new c.Rectangle(128, 60, 17, 14);
    body.regX = 9;
    body.regY = 7;
    stage.addChild(body);
    bodys.push(body);
  }

  bodys.unshift(head);
  train.shapes = bodys;
}
function mainTick() {
  c.Ticker.on('tick', function (evt) {
    train.time += evt.delta;
    if (train.time < wait) return;
    var deltaV = 5000 + 500 * (train.shapes[0].y - 50);
    train.v = Math.sqrt(deltaV < 0 ? 0 : deltaV) - minus;//一秒的位移量
    minus += train.v * .1 * evt.delta / 1000;//每秒钟减速当前速度的10%（当前速度一直在变化）
    //train.dis：小火车的总位移
    train.dis += train.v * (evt.delta / 1000);//这一帧增加的位移
    //移动小火车
    for (var s, ti = 0, tl = train.shapes.length; ti < tl; ti++) {
      s = train.shapes[ti];
      if (ti == 0) {//车头
        move(s, 0);
      } else if (ti == 1) {//第一节车厢
        move(s, train.disHead);
      } else if (ti == tl - 1) {//最后一节车厢
        move(s, train.disHead + (ti - 1) * train.disBet, true);
      } else {
        move(s, train.disHead + (ti - 1) * train.disBet);
      }
    }
    stage.update(evt);
  });
}
function move(shape, disDif, isLast) {
  //计算位移位于paths的哪两个点之间
  var nextPt, prePt,
    dis = train.dis - disDif;
  if (dis < 0) return;
  for (var i = 0, l = paths.length; i < l; i++) {
    if (paths[i].dis > dis) {
      nextPt = paths[i];
      prePt = paths[i - 1] || paths[0];
      break;
    }
    if (i == l - 1 && !!isLast) {
      train.dis = minus = train.time = 0;
    }
  }
  if (!nextPt || !prePt) {
    return;
  }
  //train位于这两个点的位置比例：r
  var l0 = dis - prePt.dis,
    l1 = nextPt.dis - dis,
    r = l0 / (l0 + l1),
    npos = nextPt.pos,
    ppos = prePt.pos,
    nrot = nextPt.rot,
    prot = prePt.rot;
  //角度
  if (Math.abs(prot - nrot) > 180) {
    if (prot < nrot) {
      prot += 180 * 2
    } else {
      nrot += 180 * 2
    }
  }
  shape.rotation = r * nrot + (1 - r) * prot;
  shape.rotation = -shape.rotation + 180;
  //小火车掉头
  if (i > 67) {
    shape.scaleY = -1;
  } else {
    shape.scaleY = 1;
  }
  //xy值
  shape.x = r * npos.x + (1 - r) * ppos.x;
  shape.y = r * npos.y + (1 - r) * ppos.y;
}