### 状态机

Canvas API 都在其上下文对象 context 上调用。
```
var context = document.getElementById("canvas").getContext('2d');
```
context 是一个状态机，调用任何一个绘制函数，都跟 context 的当前状态有关。  
比如通过调用 **fillRect()** 函数来绘制一个实心矩形，矩形的填充色、透明度、与源图形的遮盖关系等都取决于 context 的状态：
```
//定义 context 状态
context.fillStyle = '#f60';
context.globalAlpha = .9;
context.globalCompositeOperation = 'xor';//抑或，刮奖

//根据状态，绘制实心矩形
context.fillRect(100, 100, 50, 50);
```
**fillRect()** 函数不会返回一个矩形对象。绘制完成之后，矩形就画到画布上了，不再受到控制。

操作的是一支笔，而不是图形对象，这跟DOM完全不一样。

### 常用API归类

##### 状态（准备一支笔）

```
context.fillStyle = '#f60';
context.globalAlpha = .9;
context.globalCompositeOperation = 'xor';
context.shadowColor = 'rgba(255,255,255,1)';
context.font = '60px bold';
context.textAlign = 'left';
```

##### 图形变换（等同css3）（也可以看做改变了状态）

```
context.translate(dx, dy);
context.scale(sx, sy);
context.rotate(rx, ry);
context.transform(a, b, c, d, e, f);
```

##### 绘制（画）

```
context.fillText('hello word', dx, dy);
context.drawImage(IMAGE/canvasElement, sx, sy, sw, sh, dx, dy, dw, dh);
context.arc(x, y, radius, startAngle, endAngle, anticlockwise);
context.fillRect();
```

###### 其他（控制）

```
context.beginPath();
context.closePath();

context.save();
context.restore();
```


### 制作动画的基本流程

1. 动画制作首先要缓存运动物体的状态，所以第一步是创建全局的状态对象。（控制的是一支笔而非对象）
```
//当前状态
var data = {
    小球:{颜色，位置，大小，速度...}
};
```

2. 获取canvas，并设置宽高属性
```
var canvas = document.querySelector("#canvas"),
    context = canvas.getContext('2d'),
    canvas.width = CANVAS_WIDTH,
    canvas.height = CANVAS_HEIGHT;
```

3. 创建循环。通过快速刷新，产生动画效果。
```
//循环（总）
function raf(context, data) {
  requestAnimationFrame(function () {  //或setTimeout
     //todo... 循环体
  });
}
//参数：画布上下文、当前状态
raf(context, data);
```
使用requestAnimationFrame而不是setTimeout，可以让画布的刷新与浏览器刷新保持同步，减少卡顿。

4. 在每个循环中进行更新与绘制
```
// sth.
window.requestAnimationFrame(function () {
    update(data);//更新当前状态data
    draw(context, data);//根据更新后的data状态绘制
    raf(context, data); //next loop
});
// sth.

//更新
function update(data){
    data.小球.位置 = 位移算法(data.小球.位置); //根据算法，返回小球新的位置
}
//绘制
function draw(context, data){
    //清空整个画布
    context.clearRect(0,0,CANVAS_WIDTH,CANVAS_HEIGHT);
    //绘制
    context.绘制小球Fn(data.小球, context);
}
```
由于视觉暂留的效应，一个运动（位置不断改变）的小球就诞生了。


### 性能优化

首先要说性能问题，是因为其他的所有操作都要尽最大可能提升性能。多酷炫的效果，一旦卡了，发生阻塞，就全完蛋。

所谓「阻塞」，可以理解为不间断运行时间超过 16ms 的 JavaScript 代码，以及「导致浏览器花费超过 16ms 时间进行处理」的 JavaScript 代码。  
如果经常出现「小型」的阻塞，那么就会出现「丢帧」的情况，如果使用requestAnimationFrame进行循环，不会丢帧，但动画运行速度会比预期慢（解释）。

##### 计算与渲染，16ms内要完成的事
1. 计算：处理游戏逻辑，计算每个对象的状态（update），不涉及 DOM 操作（但包含对 Canvas 上下文的操作）。
2. 渲染：真正把对象绘制出来。  
 2.1 JavaScript 调用 DOM API（包括 Canvas API）以进行渲染。  
 2.2 浏览器（通常是另一个渲染线程）把渲染后的结果呈现在屏幕上的过程。

![image](http://img.alicdn.com/tps/TB1i6rMLpXXXXaZXFXXXXXXXXXX-593-323.png)

只需要考虑 1 和 2.1 ， 2.2 会在另一个线程完成，不会产生阻塞。
因此要让动画流畅不卡顿，保证 js 在一个循环中所有操作在 16ms 内完成是不够的，必须要小于 16ms ，而且越小越好。

##### Canvas API 耗时

一开始提到 canvas 上下文是一个状态机，任何「绘制」操作都跟上下文的当前状态有关。  
因此我们会经常修改 context 的状态，有些是通过「赋值」（ context.globalAlpha 透明度），有些是通过「调用函数」（ context.translate(100, 100) ）。

问题在于：「对 context.lineWidth 赋值的开销远远大于对一个普通对象赋值的开销」。
这种实现方式可以理解为一种优化，context 在赋值操作中进行了一部分工作，不然这些事情都放在 fillRect 中，会更加影响性能（不理解）。

经过测试：context.lineWidth = 5 执行 10^6 次，耗时 55ms，如果输入非法的值会耗时 155ms，而一般的赋值操作，耗时仅6ms。  
lineWidth 是最快的一类操作了，如果是 context.font 的赋值操作 10^6，消耗会超过 1000ms。

赋值操作消耗的时间，跟真正的绘制操作没法比，fillRect 执行 10^6 次，耗时大于 1000ms。 drawImage 经过测试，耗时大于 4000ms。  
也就是说，在一次循环中，不进行任何操作，单纯调用 2000~3000+ 次drawImage，就有可能会发生卡顿。

因此性能优化的第一点，就是节省的使用 context 的任何操作，要意识到 context 的赋值操作也会耗时，并且在可能的情况下，使用更节约的操作。  
我们可以通过合理的安排绘图API的顺序，降低 context 状态改变的频率。通过后续的其他手段，整体降低 context 的调用次数。

##### 其他手段（离屏canvas）

drawImage 方法的参数可以是图片，也可以是另一个 canvas 对象。  
因此对于复杂的、需要调用大量 API 的图形/图片，我们可以先将他们绘制到一个 new canvas 上，然后作为 drawImage 的参数使用。
这个 new canvas 应当有复用的价值。

```
//准备图片（要支持缓存，见 tool.js#$$loadMultipleImage）
var image = $$loadMultipleImage(...);

// 在离屏 canvas 上绘制
var canvasOffscreen = document.createElement('canvas');
canvasOffscreen.width = dw;
canvasOffscreen.height = dh;
canvasOffscreen.getContext('2d').drawImage(image, sx, sy, sw, sh, dx, dy, dw, dh);

// 在绘制每一帧的时候，绘制这个图形
context.drawImage(canvasOffscreen, x, y);
```

另据可靠消息（暂未实验），drawImage 的时候使用「精灵图」，会增加绘制时间。这个问题同样可以通过「离屏canvas」解决。  
另据实验验证，部分低版本安卓内置浏览器无法使用「精灵图」+ drawImage 实现 gif 效果的时候，只能用单图。

##### 视野外的世界绘制

一般是canvas不变，但在 viewport 之外进行了绘制。有人这样说：
> 我做了一个实验，绘制一张 320x180 的图片 104 次，当我每次都绘制在 Canvas 内部时，消耗了 40ms，
> 而每次都绘制在 Canvas 外时，仅消耗了 8ms。大家可以掂量一下，考虑到计算的开销与绘制的开销相差 2~3 个数量级，
> 我认为通过计算来过滤掉哪些画布外的对象，仍然是很有必要的。

当然这样操作会使计算变复杂，计算逻辑复杂、计算时间增加

另一种就很蠢了：  
我曾经为了方便，把 canvas 的 height 设计的非常大，结果在 iphone6 上非常卡，看来 iphone 在 viewport 之外也进行了一定的操作。


##### 分层 canvas

还没用过。  
分层 Canvas 的出发点是，动画中的每种元素（层），对渲染和动画的要求是不一样的。  
对很多游戏而言，主要角色变化的频率和幅度是很大的（他们通常都是走来走去，打打杀杀的），而背景变化的频率或幅度则相对较小
（基本不变，或者缓慢变化，或者仅在某些时机变化）。  
我们需要很频繁地更新和重绘人物，但是对于背景，
我们也许只需要绘制一次，也许只需要每隔 200ms 才重绘一次，绝对没有必要每 16ms 就重绘一次。

##### 缓存

1. 该清理的清理：下雨、粒子
2. ...

##### 方案

举3个例子
1. 下雨：3张图片、真真的雨滴（渐变色、大量、角度随机、顺着角度下落）
2. 粒子效果：圆形、方形
3. 乌云


### 图形变换

绘制任何图形（或图片），都应当先绘制它的基本轮廓（缓存），然后在通过「图形变换」，转换为需要的位置大小角度等。（解释）

图形可以是「位图」（圆角矩形、三角形、椭圆、正多边形、N角星、雪花、雨滴、纸飞机、恐龙？），也可以是 「图片」。
这些用「直线 + 弧 + 曲线」组合出来的「位图」，可以进行简单的填色。

一般的做法是绘制一个「标准的」图形，然后到处使用。另外很多框架中包含图形库（不太了解）。

变换执行顺序：translate -> rotate -> scale，理解的时候，可以「倒着看」，先缩放，再旋转，最后平移！

由于有：

```math
\left[
    \begin{matrix}
        a & c & e \\
        b & d & f \\
        0 & 0 & 1
    \end{matrix}
\right] * \left[
    \begin{matrix}
        x \\
        y \\
        1
    \end{matrix}
\right] = \left[
    \begin{matrix}
        ax + cy + e \\
        dy + bx + f \\
        1
    \end{matrix}
\right]


```
因此：

```
context.transform(a, b, c, d, e, f);
```

a,d 表示缩放 context.scale(a, d);
e,f 表示平移 context.translate(e, f);
cos(rot),sin(rot),-sin(rot),sin(rot) 表示旋转 context.rotate(rot / 180 * Math.PI)  


图形变换本质上是矩阵的左乘：

```math
\left[
    \begin{matrix}
        2 & 0 & 0 \\
        0 & 2 & 0 \\
        0 & 0 & 1
    \end{matrix}
\right] * \left[
    \begin{matrix}
        1 & 0 & 50 \\
        0 & 1 & 50 \\
        0 & 0 & 1
    \end{matrix}
\right] = \left[
    \begin{matrix}
        2 & 0 & 100 \\
        0 & 2 & 100 \\
        0 & 0 & 1
    \end{matrix}
\right]

```

```math
\left[
    \begin{matrix}
        2 & 0 & 100 \\
        0 & 2 & 100 \\
        0 & 0 & 1
    \end{matrix}
\right] * \left[
    \begin{matrix}
        x \\
        y \\
        1
    \end{matrix}
\right] = \left[
    \begin{matrix}
        2x + 100 \\
        2y + 100 \\
        1
    \end{matrix}
\right]
```

放大2倍 * 位移50x50 => 放大2倍+位移100x100  
可以理解为先位移，再放大。

同理 css3。


### 其他

图形变换的状态是「叠加」的，绘制完成之后要重置到初始值，使用save&restore


### 填色，非零环绕原则（判断内侧/外侧）

![image](http://www.108js.com/article/article7/img6/70287.gif)


#### 工具

1. 生成随机数：
```
/*
  起始值
  结束值
  精度（小数位数）
  末位整除
*/
$$random(1, 3, 2, 5)
```
可能的返回：1.00, 1.05, 1.10, 1.15, ... 3.00  

2. 获取DOM节点的位置信息  
```
/*
   获取DOM节点的位置信息
  
   注意：如果在除了body外的父节点中存在滚动条，则scrollTop/scrollLeft/x/y不再准确
  
   @param elem DOM节点
  
   @returns 
        top/bottom/left/right: 距viewport的上下左右距离
        width/height: 宽高
        scrollTop/scrollLeft: body上的滚动条遮住的上/左距离
        x/y: body左上角为坐标系原点，xy值
 */
function $$getBoundingClientRect(elem) {
  var rect = elem.getBoundingClientRect(),
    scroll_top = document.documentElement.scrollTop || document.body.scrollTop,
    scroll_left = document.documentElement.scrollLeft || document.body.scrollLeft;
  return {
    top: rect.top,
    bottom: rect.bottom,
    left: rect.left,
    right: rect.right,
    width: rect.width || rect.right - rect.left,
    height: rect.height || rect.bottom - rect.top,
    scrollTop: scroll_top,
    scrollLeft: scroll_left,
    x: rect.left + scroll_left,
    y: rect.top + scroll_top
  };
}
```

3. 鼠标在canvas的坐标  
```
ctt.canvas.addEventListener('mousemove', function (evt) {
    var loc = $$getBoundingClientRect(evt.target),
      x = evt.clientX - loc.left,
      y = evt.clientY - loc.top;
}
```
