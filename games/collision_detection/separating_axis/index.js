var c = createjs;
var stage = new c.Stage('mineCanvas'),
  canvas = stage.canvas,
  CH = 350, CW = 400;

canvas.width = CW;
canvas.height = CH;

var rect = new c.Shape().set({x: 100, y: 50});
function updateRect(color) {
  rect.graphics.clear().f(color).dr(20, 20, 110, 70);
}

var circle = new c.Shape().set({x: 90, y: 90});
function updateCircle(color) {
  circle.graphics.clear().f(color).dc(10, 10, 50);
}

var polygon = new c.Shape().set({x: 200, y: 100});
function updatePolygon(color) {
  polygon.graphics.clear().f(color).moveTo(0, 0).lineTo(105, 105).lineTo(10, 165).lineTo(-55, 60).endFill();
}

stage.addChild(rect, polygon, circle);

c.Ticker.timingMode = c.Ticker.RAF;
c.Ticker.on('tick', function (evt) {
  var rc = c.$Collision.checkCollision(rect, circle, true);//强制使用分离轴定理判断
  var pc = c.$Collision.checkCollision(polygon, circle);
  var pr = c.$Collision.checkCollision(polygon, rect);
  if (rc || pr) {
    updateRect('red');
  } else {
    updateRect('black');
  }
  if (rc || pc) {
    updateCircle('red');
  } else {
    updateCircle('black');
  }
  if (pc || pr) {
    updatePolygon('red');
  } else {
    updatePolygon('black');
  }
  stage.update(evt);
});

var vs = {
  rect: {vx: 1, vy: -1, edge: [-20, CW - 130, CH - 90, -20]},
  circle: {vx: 1.5, vy: 2, edge: [40, CW - 60, CH - 60, 40]},
  polygon: {vx: -1.7, vy: -2.3, edge: [0, CW - 105, CH - 165, 55]}
};
rect.on('tick', function () {
  this.x += vs.rect.vx;
  this.y += vs.rect.vy;
  collisionEdge(this, vs.rect);
});
circle.on('tick', function () {
  this.x += vs.circle.vx;
  this.y += vs.circle.vy;
  collisionEdge(this, vs.circle);
});
polygon.on('tick', function () {
  this.x += vs.polygon.vx;
  this.y += vs.polygon.vy;
  collisionEdge(this, vs.polygon);
});

function collisionEdge(shape, vo) {
  if (shape.x <= vo.edge[3] || shape.x >= vo.edge[1]) {
    vo.vx *= -1;
  }
  if (shape.y <= vo.edge[0] || shape.y >= vo.edge[2]) {
    vo.vy *= -1;
  }
}
