/**
 * 针对 Shape 对象的简单碰撞检测功能
 * 图形支持：圆形、矩形、凸多边形
 *  - 不支持：skewX/Y、scaleX/Y、rotation
 *      - 不支持的原因是:旋转等需要考虑以谁为原点旋转、先旋转再缩放还是反过来、斜切不好计算
 *      - 未来会考虑支持
 *  - 支持：regX/regY
 *
 * ```
 * // 判断两个图形之间是否相交
 * // @param shapeA
 * // @param shapeB
 * // @param useSeparatingAxis 强制使用分离轴定理判断（可以使矩形与圆的判断更准确，凸多边形参与的情况下默认为 true）
 * // @returns {*} 不相交返回false，相交则返回两个图形的真实位置（包含平移）
 * createjs.$Collision.checkCollision(shapeA, shapeB, true)
 * ```
 * @author tianyn1990 <https://github.com/tianyn1990>
 * 参考文章：http://blog.lxjwlt.com/front-end/2014/09/04/2D-collide-detection.html
 */

;
(function (win) {

  /**
   * Shape 对象，碰撞检测工具
   *
   *  目前支持的图形有：Circle、Rect、凸多边形
   *
   * */
  function collisionDetection() {
    var that = {}, simpleCheckFns;

    //CreateJS/EaselJS 未加载
    if (!win.createjs) return that;

    var c = win.createjs;

    //判断 Graphics 图形
    var checkConstructor = [
      [c.Graphics.Rect, 'r'],
      [c.Graphics.Circle, 'c']
    ];

    function _checkGraphic(shape) {
      for (var l = checkConstructor.length, g, result; l; l--) {
        g = checkConstructor[l - 1];
        if (shape.graphics.command && g[0] === shape.graphics.command.constructor) {
          result = g[1];
          break;
        }
      }
      //其他图形认为都是凸多边形，返回 'o'
      return result || 'o';
    }

    function _sortTypes(types, shapeA, shapeB) {
      return types[0] > types[1] ?
      {type: types[1] + '&' + types[0], s1: shapeB, s2: shapeA} :
      {type: types[0] + '&' + types[1], s1: shapeA, s2: shapeB};
    }

    function _goCheck(o, useSeparatingAxis) {
      //只有圆形和矩形之间。则使用简单判断模式
      var isSimple = /^[rc&]{3}$/.test(o.type) && !useSeparatingAxis;
      if (isSimple) {
        return simpleCheckFns[o.type](o.s1, o.s2);
      } else {
        //分离轴定理判断模式，考虑旋转、凸多边形
        // - 圆形和矩形之间的判断，如果使用这种模式，则更加准确
        return _separatingAxisWay(o.type, o.s1, o.s2);
      }
    }

    /**
     * 判断两个图形之间是否相交
     * @param shapeA
     * @param shapeB
     * @param useSeparatingAxis 强制使用分离轴定理判断（可以使矩形与圆的判断更准确，凸多边形参与的情况下默认为 true）
     * @returns {*} 不相交返回false，相交返回两个图形的真实位置（包含平移）
     * @private
     */
    function _checkCollision(shapeA, shapeB, useSeparatingAxis) {
      var types = [_checkGraphic(shapeA), _checkGraphic(shapeB)];
      return _goCheck(_sortTypes(types, shapeA, shapeB), useSeparatingAxis);
    }

    simpleCheckFns = {
      'r&r': _checkR_R,
      'c&c': _checkC_C,
      'c&r': _checkC_R
    };

    //矩形与矩形是否相交
    // - 若相交，则返回两矩形的实际位置
    function _checkR_R(r1, r2, hasPrep) {
      if (hasPrep === undefined) {
        hasPrep = true;
      }
      if (hasPrep) {
        r1 = _prepareRect(r1);
        r2 = _prepareRect(r2);
      }
      var isCol = r1.x > r2.x - r1.w &&
        r1.x < r2.x + r2.w &&
        r1.y > r2.y - r1.h &&
        r1.y < r2.y + r2.h;
      return isCol ? [r1, r2] : isCol;
    }

    //圆形与圆形是否相交
    // - 若相交，则返回两圆的实际位置
    function _checkC_C(c1, c2) {
      c1 = _prepareCircle(c1);
      c2 = _prepareCircle(c2);
      var isCol = c1.radius + c2.radius >
        Math.sqrt(Math.pow(c1.x - c2.x, 2) + Math.pow(c1.y - c2.y, 2));
      return isCol ? [c2, c2] : isCol;
    }

    //圆与矩形是否相交
    // - 将圆形当做为矩形来判断
    // - 若相交，则返回两图形的实际位置
    function _checkC_R(c, r) {
      c = _prepareCircle(c);
      r = _prepareRect(r);
      c.x = c.x - c.radius;
      c.y = c.y - c.radius;
      c.w = c.h = c.radius * 2;
      return _checkR_R(c, r, false);
    }

    //考虑到矩形的regX/Y, x, y的影响
    function _prepareRect(rect) {
      return {
        x: rect.x - rect.regX + rect.graphics.command.x,
        y: rect.y - rect.regY + rect.graphics.command.y,
        w: rect.graphics.command.w,
        h: rect.graphics.command.h
      };
    }

    //考虑到圆形的regX/Y, x, y 的影响
    function _prepareCircle(circle) {
      return {
        x: circle.x - circle.regX + circle.graphics.command.x,
        y: circle.y - circle.regY + circle.graphics.command.y,
        radius: circle.graphics.command.radius
      };
    }

    //利用分离轴定理，判断「圆形 c、矩形 r、凸多边形 o」之间是否相交
    // - 支持：regX/Y
    // - Vector 向量类支持：
    //   - subtract 减法
    //   - prependicular 求垂直向量（长度不变）
    //   - getMagnitude 向量长度
    //   - normalize 求单位向量
    //   - dotProduct 求矢量的点积
    function _separatingAxisWay(type, s1, s2) {
      var isCol = true;
      var types = type.split('&'),
        vectors = [];

      //准备图形对象
      s1 = _prepareSeparatingAxisShape(types[0], s1);
      s2 = _prepareSeparatingAxisShape(types[1], s2);

      //计算可用的单位投影向量
      vectors = vectors.concat(_calcAllVectors(types[0], s1));
      vectors = vectors.concat(_calcAllVectors(types[1], s2));

      //去重复
      vectors = removeRepetition(vectors);

      for (var l = vectors.length, v, li1, li2; l; l--) {
        v = vectors[l - 1];

        //计算图形到单位投影向量的投影值
        li1 = _calcSeparatingAxis(types[0], s1, v);
        li2 = _calcSeparatingAxis(types[1], s2, v);

        //计算两个投影值是否相交
        if (!_calcIsPos(li1, li2)) {
          //当在某一种单位投影下不相交，则两个图形不相交
          isCol = false;
        }
      }
      return isCol ? [s1, s2] : isCol;
    }

    //去重复
    function removeRepetition(vectors) {
      var rec, repeatIdx = 0, tmp;
      for (var i = 0, l = vectors.length; i < l; i++) {
        rec = vectors[i];
        for (var j = i + 1; j < l; j++) {
          if (rec.equals(vectors[j], true)) {
            tmp = vectors[i];
            vectors[i] = vectors[repeatIdx];
            vectors[repeatIdx] = tmp;
            repeatIdx++;
            break;
          }
        }
      }
      vectors.splice(0, repeatIdx);
      return vectors;
    }

    //准备图形对象
    function _prepareSeparatingAxisShape(type, shape) {
      switch (type) {
        case 'c':
          return _prepareCircle(shape);
        case 'r':
          return _prepareSeparatingAxisRect(shape);
        case 'o':
          return _prepareSeparatingAxisPolygon(shape);
      }
    }

    function _prepareSeparatingAxisRect(shape) {
      var rect = {shape: shape},
        pr = _prepareRect(shape);
      rect.points = [//顶点
        new Vector(pr.x, pr.y),
        new Vector(pr.x + pr.w, pr.y),
        new Vector(pr.x, pr.y + pr.h),
        new Vector(pr.x + pr.w, pr.y + pr.h)
      ];
      return rect;
    }

    //只认 moveTo、lineTo 方法
    function _prepareSeparatingAxisPolygon(shape) {
      var actionList = shape.graphics._instructions,
        polygon = {shape: shape, points: []};
      for (var action, i = 0, l = actionList.length; i < l; i++) {
        action = actionList[i];
        if (action.constructor === c.Graphics.MoveTo ||
          action.constructor === c.Graphics.LineTo) {
          polygon.points.push(new Vector(shape.x + action.x - shape.regX, shape.y + action.y - shape.regY));
        }
      }
      return polygon;
    }

    //计算两个投影值是否相交
    function _calcIsPos(li1, li2) {
      return !(li1.min > li2.max || li1.max < li2.min);
    }

    //计算可用的单位投影向量
    function _calcAllVectors(type, shape) {
      switch (type) {
        case 'c':
          return _calcCircleVectors(shape);
        case 'r':
          return _calcPolygonVectors(shape);
        case 'o':
          return _calcPolygonVectors(shape);
      }
    }

    function _calcCircleVectors() {
      return [new Vector(1, 0), new Vector(0, 1)];
    }

    function _calcPolygonVectors(shape) {
      var pts = shape.points, vecs = [];
      for (var pt, prePt, i = 0, l = pts.length; i < l; i++) {
        pt = pts[i];
        if (i == 0) {
          vecs.push(pt.subtract(pts[l - 1]).prependicular().normalize());
        } else {
          prePt = pts[i - 1];
          vecs.push(pt.subtract(prePt).prependicular().normalize());
        }
      }
      return vecs;
    }

    //计算图形到单位投影向量的投影值
    function _calcSeparatingAxis(type, shape, vector) {
      switch (type) {
        case 'c':
          return _calcSeparatingAxisCircle(shape, vector);
        case 'r':
          return _calcSeparatingAxisPolygon(shape, vector);
        case 'o':
          return _calcSeparatingAxisPolygon(shape, vector);
      }
    }

    //计算圆形在单位投影向量的投影值
    function _calcSeparatingAxisCircle(circle, vector) {
      var deltaY = vector.y * circle.radius,
        deltaX = vector.x * circle.radius;
      return {
        min: vector.dotProduct(new Vector(circle.x - deltaX, circle.y - deltaY)),
        max: vector.dotProduct(new Vector(circle.x + deltaX, circle.y + deltaY))
      };
    }

    //计算 凸多边形/矩形 在单位投影向量的投影值
    function _calcSeparatingAxisPolygon(polygon, vector) {
      var p = polygon.points, min, max, tmp;
      for (var i = 0, l = p.length; i < l; i++) {
        tmp = vector.dotProduct(p[i]);
        if (min == undefined || tmp < min) min = tmp;
        if (max == undefined || tmp > max) max = tmp;
      }
      return {min: min, max: max};
    }

    //对外暴露的方法
    that.checkCollision = _checkCollision;

    return that;
  }

  //暴露
  if (typeof define === 'function') {
    define(function () {
      return win.createjs['$Collision'] = collisionDetection();
    });
  } else {
    win.createjs['$Collision'] = collisionDetection();
  }

  /**
   * 定义「向量类」
   * @param x
   * @param y
   * @constructor
   */
  var Vector = function (x, y) {
    this.x = x;
    this.y = y;
  };

  var p = Vector.prototype;

  /**
   * 向量减法
   * @param vector
   */
  p.subtract = function (vector) {
    return new Vector(this.x - vector.x, this.y - vector.y);
  };

  /**
   * 求垂直向量（长度不变）
   * @param isLeft 垂直向量是否在左侧（默认在右侧）
   * @returns {Vector}
   */
  p.prependicular = function (isLeft) {
    isLeft = isLeft ? 1 : -1;
    return new Vector(isLeft * this.y, -isLeft * this.x);
  };

  /**
   * 向量长度
   * @returns {number}
   */
  p.getMagnitude = function () {
    return Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2));
  };

  /**
   * 求单位向量
   * @returns {Vector}
   */
  p.normalize = function () {
    var magn = this.getMagnitude(),
      vec = new Vector(0, 0);
    if (magn != 0) {
      vec.x = this.x / magn;
      vec.y = this.y / magn;
    }
    return vec;
  };
  window.Vector = Vector;

  /**
   * 求矢量的点积
   * @param vector
   * @returns {number}
   */
  p.dotProduct = function (vector) {
    return this.x * vector.x + this.y * vector.y;
  };

  p.clone = function () {
    return new Vector(this.x, this.y);
  };

  p.equals = function (vector, ignoreSymbol) {
    if (ignoreSymbol) {
      return Math.abs(this.x) == Math.abs(vector.x) &&
        Math.abs(this.y) == Math.abs(vector.y);
    }
    return this.x == vector.x && this.y == vector.y;
  };

})(window);