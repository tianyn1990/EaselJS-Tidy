(function (window) {
  var $$tool = {};

  $$tool.noop = function () {
  };

  $$tool.getRect = function (selector) {
    var el = document.querySelector(selector);
    if (!el) return;
    var rect = el.getBoundingClientRect(),
      _left = rect.left,
      _top = rect.top,
      _width = rect.width || rect.right - _left,
      _height = rect.height || rect.bottom - _top;
    return {left: _left, top: _top, width: _width, height: _height};
  };

  $$tool.createTxtCanvas = function (txt, cw, ch, font, x, y) {
    var canvasElement = document.createElement('canvas'),
      stage = new c.Stage(canvasElement),
      otxt = new c.Text(txt || '', font || 'bold 200px Arial', '#000');
    canvasElement.width = cw;
    canvasElement.height = ch;
    otxt.x = x || cw / 2;
    otxt.y = y || ch / 2;
    otxt.textAlign = 'center';
    otxt.textBaseline = 'middle';
    stage.addChild(otxt);
    stage.update();
    return canvasElement;
  };

  /**
   *
   * @param cvs {HTMLCanvasElement}
   * @param minAlpha
   * @param rectNum  {Integer}
   * @returns {Array}
   */
  $$tool.getParticlePos = function (cvs, minAlpha, rectNum) {
    var ctt = cvs.getContext('2d'),
      idata = ctt.getImageData(0, 0, cvs.width, cvs.height),
      w = idata.width,
      h = idata.height,
      data = idata.data,
      partsPos = [];
    rectNum = rectNum || 1;
    minAlpha = minAlpha || 127;
    for (var x = 0, idx; x < w; x++) {
      for (var y = 0; y < h; y++) {
        idx = (y * w + x) * 4;
        if (data[idx + 3] > minAlpha && x % rectNum == 0 && y % rectNum == 0) {
          partsPos.push({
            colors: [data[idx], data[idx + 1], data[idx + 2], data[idx + 3]],
            x: x, y: y
          });
        }
      }
    }
    return partsPos;
  };

  $$tool.random = function (from, range) {
    return ~~(Math.random() * range) + from;
  };

  // 求矩阵乘积
  $$tool.matrixMultipy = function (m1, m2) {
    if (m1[0].length != m2.length) throw '$$tool.matrixMultiple arguments cannot multiply each other.';
    var retM = [], o1, o2, m2T = []; // m2 转置为 m2T
    var l1, l2, l3, i, j, k, sum;
    for (l1 = m2[0].length, i = 0; i < l1; i++) {
      for (l2 = m2.length, j = 0; j < l2; j++) {
        m2T[i] = m2T[i] || [];
        m2T[i].push(m2[j][i]);
      }
    }
    for (l1 = m1.length, i = 0; i < l1; i++) {
      o1 = m1[i];
      for (l2 = m2T.length, j = 0; j < l2; j++) {
        o2 = m2T[j];
        sum = 0;
        for (l3 = o1.length, k = 0; k < l3; k++) {
          sum += o1[k] * o2[k];
        }
        retM[i] = retM[i] || [];
        retM[i].push(sum);
      }
    }
    return retM;
  };

  // 三维矩阵变换：位移
  $$tool.translate = function (x, y, z) {
    return [
      [1, 0, 0, x],
      [0, 1, 0, y],
      [0, 0, 1, z],
      [0, 0, 0, 1]
    ];
  };
  // 三维矩阵变换：旋转
  $$tool.rotate = function (regx, regy, regz) {
    var sinx = Math.sin(regx),
      siny = Math.sin(regy),
      sinz = Math.sin(regz),
      cosx = Math.cos(regx),
      cosy = Math.cos(regy),
      cosz = Math.cos(regz);
    return $$tool.matrixMultipy(
      $$tool.matrixMultipy(
        [                      // 绕 z 轴旋转
          [cosz, sinz, 0, 0],
          [-sinz, cosz, 0, 0],
          [0, 0, 1, 0],
          [0, 0, 0, 1]
        ], [                   // 绕 x 轴旋转
          [1, 0, 0, 0],
          [0, cosx, sinx, 0],
          [0, -sinx, cosx, 0],
          [0, 0, 0, 1]
        ]
      ), [                     // 绕 y 轴旋转
        [cosy, 0, siny, 0],
        [0, 1, 0, 0],
        [-siny, 0, cosy, 0],
        [0, 0, 0, 1]
      ]);
  };
  // 三维矩阵变换：缩放
  $$tool.scale = function (scaleX, scaleY, scaleZ) {
    return [
      [scaleX, 0, 0, 0],
      [0, scaleY, 0, 0],
      [0, 0, scaleZ, 0],
      [0, 0, 0, 1]
    ];
  };

  $$tool.getTransPos = function (para, center, matrix) {
    var disX = para.x - center[0],
      disY = para.y - center[1],
      disZ = para.z - center[2],
      disNews;

    !!matrix && (disNews = deal3dTransform(disX, disY, disZ, matrix));
    disX = disNews[0][0];
    disY = disNews[1][0];
    disZ = disNews[2][0];

    return {
      x: center[0] + disX,
      y: center[1] + disY,
      z: center[2] + disZ
    };
  };

  $$tool.get3dPos = function (para, focalLen, colors, center) {
    var disX = para.x - center[0],
      disY = para.y - center[1],
      disZ = para.z - center[2],
      colorsNew, scale;

    scale = deal3dPos(focalLen, disZ + center[2]);

    !!colors && colors.length == 3 && (colorsNew = deal3dColor(scale, colors));

    return {
      scale: scale,
      pos: {x: center[0] + disX * scale, y: center[1] + disY * scale},
      colors: colorsNew
    };
  };

  function deal3dTransform(disX, disY, disZ, matrix) {
    return $$tool.matrixMultipy(matrix, [[disX], [disY], [disZ], [1]]);
  }

  function deal3dPos(focalLen, z) {
    var scale = focalLen / (focalLen + z);
    return focalLen + z == 0 ? -1 : (scale < 0 ? 0 : scale);
  }

  function deal3dColor(scale, colors) {
    scale = scale < 0 ? 0 : scale;
    var colorScale = 1 - scale < 0 ? 0 : 1 - scale;
    return [~~(colors[0] * colorScale), ~~(colors[1] * colorScale), ~~(colors[2] * colorScale)];
  }

  //---------------------------------------------------------------------------

  //============
  // AMD/REQUIRE
  //============
  if (typeof define === 'function' && define.amd) {
    define(function (require) {
      return $$tool;
    });
  }
  //========
  // BROWSER
  //========
  else if (typeof window !== 'undefined') {
    window.$$tool = $$tool;
  }
})(window, undefined);
