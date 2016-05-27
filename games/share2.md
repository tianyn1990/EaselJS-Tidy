## canvas 学习总结（二）

### canvas 基础回顾

1. 首先获取到 canvas 的上下文 context 。context 可以在画布上进行绘制操作。
```
var context = document.getElementById("canvas").getContext('2d');
```

2. context 是一个状态机，它的绘制操作是由自己的当前状态决定。
```
//定义 context 状态
context.fillStyle = '#f60'; //颜色
context.globalAlpha = .9;   //透明度
context.translate(10, 10);  //图形变换，位置
//根据状态，绘制实心矩形
context.fillRect(0, 0, 50, 50);
```
上述 canvas 操作，是通过控制 context 这只画笔进行绘制，而非控制一个矩形对象。 

3. 动画的生成是不断 绘制、擦除、再绘制 的过程，如果将 2 中的操作封装为函数
 `drawRect(color, alpha, x, y, w, h)`，那么这样可以产生动画：
```
var x = 10, y = 10;
setInterval(function(){
    context.clearRect(0,0,CANVAS_WIDTH,CANVAS_HEIGHT); //清空画布
    drawRect('#f60', .9, x, y, 50, 50);                //绘制
    x+=1; y+=1;                                        //改变位置
}, 16);
```
实际应用中可能并不使用 setInterval ，时间间隔也肯定不会直接设置为 16。

### CreateJS

#### 介绍

CreateJS 是一个非常流行（[排名](https://html5gameengine.com/)）的、轻量级、开源的、
[Adobe 官方赞助](http://www.adobe.com/devnet/createjs.html)的 canvas 动画库。
而 EaselJS 是 CreateJS 的核心部分。

上述特质，造成了它的学习门槛低、适合快速灵活的制作小项目、维护稳定、代码量少适合学习等特点。
并且已经有同学进行过学习甚至有上线的作品了。
因此学习它是比较划算的。

下面把其中的几个部分简要介绍一下，主要是学习过程中感觉比较 **惊喜** 的部分：

#### 简单的例子

先来看一个简单的 绘制矩形 的例子进行直观的了解：

```
//根据 id 获取 stage 对象，createjs 是暴露到全局的命名空间
var stage = new createjs.Stage("mineCanvas");

//绘制一个矩形对象
var rect = new createjs.Shape();
rect.graphics.beginFill('#f60').drawRect(0,0,50,50);

//定义矩形的各种属性
rect.alpha = .9;
rect.x = 10;
rect.y = 10;

//将矩形对象添加到 stage
stage.addChild(rect);

//更新（清空 + 绘制）一次画布
stage.update();
```

#### EaselJS 类的结构

![image](http://tianyn1990.github.io/resources/images/EaselJs_Class_Model.png)
> 我们把上图所有的类都称作「元件」

上图列出了 EaselJS 主要类的结构：

1. 所有元件的基类都是 DisplayObject，所有元件都是一个构造函数（类）
2. Container 可以包含其他（任何）元件。由于它本身也是一个元件，所以不同的 Container 之间可以相互包含
3. 舞台 Stage 是一个特殊的 Container ，也是一个 DisplayObject，它内部封装了 canvas 对象
4. Sprite 元件用来表现帧动画（类似 gif）
5. Bitmap 元件用来表现纯静态的图片
6. Shape 元件用来表现矢量图形，它的实例包含一个 Graphics 元件，用来描述图形
7. Filter 和 Shadow 则是滤镜分支，可以针对任意元件实现颜色变换、模糊、阴影等效果。
如果需要使用滤镜，首先新建 Filter 实例，再添加到目标元件的 FilterList 中，CreateJS 框架在下一帧就会把该元件加上滤镜效果
8. 另外图中没有画的元件还有：Text 元件用来表现文本、DOMElement 元件用来控制 HTML DOM 元素

在一个应用中，各个元件类的实例之间的关系类似下面这张图：

![image](http://tianyn1990.github.io/resources/images/EaselJs_Container.png)

每个类除了可以用来初始化一个对象，如：`new createjs.Stage('myCanvas')` 外，
有的也包含一些静态方法，如：`createjs.Ticker.setFPS(20)` 

#### 基于时间的动画（而非刷新频率）

除了直接使用 setTimeout、requestAnimationFrame 等方法，
以某个固定间隔循环以实现动画效果之外，createjs 还提供了 Ticker 类用来更方便实现动画效果。

Ticker 是 createjs 上的静态接口，不需要 new instance。

##### 一个例子

```
//有 3 种设置帧率的方法，这是其一。默认帧率为 20fps
createjs.Ticker.setFPS(50);

// 通过 on 方法来监听 tick 事件，回调函数会每隔一段时间循环执行一次
createjs.Ticker.on('tick', function(event){
    rect.x += 1;
    rect.y += 1;
    stage.update(event);
});
```

##### 问题

使用 requestAnimationFrame 的动画都存在一个问题，当运行在性能较差的设备上的时候，浏览器的刷新频率会降低。
而使用 setTimeout/setInterval 上也会有类似的问题，即我们设置的时间间隔可能并不是实际运行中的时间间隔。

而我们的位移量（上文中的 x+=1 y+=1）本质上是根据频率计算的。

也就是说：我们是根据频率（假设为 60fps）计算的每一次循环的时间间隔，假设为 1000 / 60 = 16.667 毫秒，即一次循环时间间隔为  16.667 毫秒，
然后通过这个时间得出对应的位移量，假设是 8.333px，这样我们就可以保证 1秒 位移 500px（8.333px/fps * 60fps）。

那么当浏览器的刷新频率改变（有可能是性能原因，或者是我们手动变更了 fps 值），
我们预期的 60fps 没有达到，可能变为 40fps ，那么每次循环时间间隔变为 1000 / 40 = 25ms，
因为我们设置的每次循环的位移量还是 8.333px，那么 1s 的位移量就变为了 333.333px，其结果就是在物体的移动速度变慢了。

而这种变慢是不可控制不可预测的。

##### 解决

Ticker 通过将动画与帧率解耦，动画的执行是基于时间的，而非频率，来实现改变帧率时不会影响动画的速率。

参考：[DEMO](https://jsfiddle.net/tianyn1990/2qj131mu/)，在例子中，切换帧率不影响小球的运动速率

它的实现方式很简单：  
在 tick 事件的回调函数的中增加 delta 参数。
delta 的值是「两次 tick 事件之间」的时间间隔。如果帧率改小，循环频率变慢，delta 的值将变大，也就是两次循环之间的时间间隔边长了。

这样一来，每一次循环中的「位移改变量」就可以根据时间而定，而不是帧率。
当帧率下降的时候，时间间隔 delta 会增加，每次循环中的位移量也会相应变大，导致动画的速率不变，反之亦然。

我们可以根据 delta 来计算位移量：

```
createjs.Ticker.on('tick', function (evt) {
    // 为了方便，我们将时间单位换算成秒
    var _delta = evt.delta / 1000;

    // 500 表示位移速度为：500px/s，时间为 _delta 秒，得到位移 x 的增量
    rect.x += 500 * _delta;

    //...其他代码

    stage.update(evt);
});
```

另外，我们可以通过设置 Ticker 的 timingMode 属性，来设置循环的策略：requestAnimationFrame、setTimeout，或相结合。

其它部分：继承 & 命中测试 & 鼠标交互 & 事件管理 等请参考[这里](https://github.com/tianyn1990/EaselJS-Tidy/blob/master/Tutorial.md#继承)

> 由于 EaselJS 的中文资料不多而且不完整，我建了 [EaselJS-Tidy](https://github.com/tianyn1990/EaselJS-Tidy) 这个项目。
> 希望对 EaselJS API doc 边学习边整理，方便其他初学者学习，也方便以后查阅。

### 最近的一些研究

#### 一、小火车是如何运动的

最终效果：[在轨道上奔跑的小火车](http://tianyn1990.github.io/CreateJS/games/train/index.html)、[jsfiddle DEMO](https://jsfiddle.net/tianyn1990/v0qshvz1/)
参考文章：[taobaofed by 叶斋](http://taobaofed.org/blog/2015/12/28/anim-train/)

##### 采集数据

数据的采集需要用到 AI，AI 即人工智能（英语：Artificial Intelligence, AI）亦称机器智能，
是指由人工制造出来的系统所表现出来的智能。

![image](https://upload.wikimedia.org/wikipedia/commons/b/b8/Kismet_robot_at_MIT_Museum.jpg)

遗憾的是，因为技术原因，这里无法使用人工智能的相关技术，因此主要是依靠生物智能完成。

因此我选择了 Adobe Illustrator CC（用来做 svg 矢量图），首先要做的是沿着轨道采集坐标。
后面我们便可以通过将小火车从坐标的一个点移动到下一个点，来完成动画效果。

![image](http://tianyn1990.github.io/CreateJS/games/train/images/rail-1025-420.png)

我的操作并不标准，仅供参考，如下：

1. 导入图片后，进行适当的剪裁。（可通过：对象-画板-适合图稿边界）
2. 新建图层，嘟（du一声）点，要按先后顺序，这会影响到最终的结果
3. 存储为 svg 格式（文件-存储为）
4. 通过查看 svg 文件，我们可以获取到轨道的坐标信息

结果如下图：

![image](http://tianyn1990.github.io/CreateJS/games/train/images/train-256-128.svg.jpg)

##### 确定位置

根据前面 canvas 动画的绘制原理，我们知道小火车的移动可以依靠不断改变它的坐标来实现。
又因为我们已经采集到了小火车的移动轨迹，所以我们只要将小火车从轨迹上的一个采集点，移动到下一个采集点就可以了。

问题是我们如何确定小火车的当前位置是处于那两个点之间呢？

我们可以先通过勾股定理求得所有两点之间的距离，进而得到轨道的总长度 S，以及每个采集点距离第一个采集点的距离 s[0-n]。
接下来设小火车已经进行的距离为 L。通过对比 L 和每个采集点的距离 s，我们就可以确定小火车当前位于那两个采集点之间了。

假设两个采集点的坐标为 s2(x1, y1)、s3(x2, y2) ，小火车位于两个采集点之间比例为 q 的位置，
可以通过计算得到小火车当前的精确坐标值。

![image](http://tianyn1990.github.io/CreateJS/games/train/images/running_train_position.jpeg)

##### 确定角度

小火车需要沿着轨道的方向移动才会更加真实，因此需要实时获取到火车当前的角度。

我们已经知道小火车位于 s2、s3 两点之间，以及比例值 q ，如果我们可以获知小火车在这两个采集点的角度，
然后通过上图坐标的计算方式（线性内插），就可以得到小火车当前的角度值了。

我的计算角度的方式与原文中不同，我认为这样要简单的多：

![image](http://tianyn1990.github.io/CreateJS/games/train/images/running_train_rotation.jpeg)

可能遇到的两个问题：

1. 已知 tan 值求角度，可以通过 js 提供的方法 atan/atan2 来实现。
2. 小火车在最高点翻转的时候（转了一圈），由于使用的 atan2 的取值范围为 [-PI, PI] ，因此需要特殊计算。

上代码：
```
//...

//计算采集点 s2 的角度值
pre = PATH[i - 1] || PATH[0];      //采集点 s1
next = PATH[i + 1] || PATH[l - 1]; //采集点 s3
var deltaX = next.x - pre.x,       //s3 与 s1 的 deltaX
  deltaY = next.y - pre.y;         //s3 与 s1 的 deltaY
pt.rot = Math.atan2(deltaY, deltaX) * 180 / Math.PI; //采集点 s2 的角度

//...

//计算当前小火车的角度值（小火车位于 s2 s3 之间）
// - preRot：s2 的角度值， nextRot：s3 的角度值
if (Math.abs(preRot - nextRot) > 180) {  //火车在翻转时，负的角度值要变为正的
    if (preRot < nextRot) {
      preRot += 180 * 2
    } else {
      nextRot += 180 * 2
    }
}
shape.rotation = q * nextRot + (1 - q) * preRot; //线性内插求小火车当前的角度

//...
```

##### 速度问题

原文中建议速度与小火车当前 y 轴的值呈反比例：
```
// 在每一帧
train.speed = Math.sqrt(C1 - C2 * train.y)
```
因为轨道分两段，在实际运用中我还增加了摩擦力，摩擦力不断增加且与时间正相关，造成小火车每秒减速 10%。
这样看起来更加真实。


#### 二、碰撞检测

参考文章：[碰撞检测--分离轴定理](http://blog.lxjwlt.com/front-end/2014/09/04/2D-collide-detection.html)、
[HTML5 2D 游戏开发: 碰撞检测和 sprite 动画](http://www.ibm.com/developerworks/cn/web/wa-html5-game8/index.html)

在我的[这个 DEMO](http://tianyn1990.github.io/CreateJS/games/collision_detection/separating_axis/index.html)
中，根据参考文章中的原理，制作了工具方法，专门用来判断两个 Shape 对象是否相交。

在游戏中要模拟物体间的一次碰撞，我们需要做的有：碰撞检测和碰撞行为。
碰撞检测指判断物体之间是否发生了碰撞。碰撞行为是指如果物体间发生了碰撞，物体状态应该如何改变。
这里将简要地介绍一下碰撞检测。

碰撞检测又分为两个阶段：粗略、精密。

因为碰撞检测需要比较高的计算量，因此我们要先把需要检测的图形挑选出来，这个过程被称为粗略检测。

精密阶段的碰撞检测主要有三种方法（由先进程度排序）：

1. 边界区域
2. 光线投射
3. 分离轴定理

在上面的 DEMO 中主要使用了 边界区域、分离轴定理 两种方法进行检测。下面我们分别来探讨：

##### 边界区域检测

通常用于检测圆形、矩形之间是否相交。

分为 3 种情况：圆 & 圆、圆 & 矩形、矩形 & 矩形。

假设：  
圆形：圆心 (cc.x, cc.y) 半径 cc.r  
矩形：左上角 (r.x, r.y) 宽高 r.w, r.h

圆形之间相交条件：圆心距离小于半径
```
Math.sqrt(Math.pow(cc1.x - cc2.x, 2) + Math.pow(cc1.y - cc2.y, 2)) < cc1.r + cc2.r;
```

矩形之间相交条件：
```
r1.x > r2.x - r1.w &&
r1.x < r2.x + r2.w &&
r1.y > r2.y - r1.h &&
r1.y < r2.y + r2.h;
```

圆与矩形之间相交：可以转化为两个矩形之间、或者两个圆形之间相交。
当然这样会在图形的四个角产生误差。

![image](http://tianyn1990.github.io/CreateJS/games/train/images/collision_detection.jpg)

注意：对于不规则图形，可以通过缩小/扩大检测范围，来提高检测效果。

##### 光线投射检测

这个检测方法我没事试验过。它的出现时因为「边界区域检测」可能存在的一个问题：  
当边界区域太小或移动得太快时，检测可能失败。在这两种情况下，图形可在单个动画帧中彼此穿过，进而避免检测。

##### 分离轴定理检测

[这篇文章](http://blog.lxjwlt.com/front-end/2014/09/04/2D-collide-detection.html) 
讲的很好，我基本就是按它思路来实现的。（文中的图片需要翻墙看哦~）

![image](http://tianyn1990.github.io/CreateJS/games/train/images/separating_axis01.jpg)
![image](http://tianyn1990.github.io/CreateJS/games/train/images/separating_axis02.jpg)
![image](http://tianyn1990.github.io/CreateJS/games/train/images/separating_axis03.jpg)
![image](http://tianyn1990.github.io/CreateJS/games/train/images/separating_axis04.jpg)

##### 一点点开发心得

在开发碰撞检测工具的时候，体会到「设计模式：单一职责原则」的好处。
该原则指出：一个类/方法只负责一件事情。

虽然稍有经验的开发人员，在不知道单一职责原则的时候，也会自觉遵守该原则。

但我发现有意识的这样做效率会有一定提高，尤其是针对比较复杂的逻辑结构：

1. 先分析整体逻辑结构
2. 然后划分各个方法
3. 最后实现每个方法

对于高级语言来说，它有两个层面的含义：类、方法，但对 js 来说更多的是方法的职责划分。
扩展一下的话，类、模块 的划分也是基于该原则的，但区别在于是否有意识的去运用。

不要把方法的拆解放到代码 review 或者 重构中去做。


### 待研究的内容

不重叠的碰撞、模拟碰撞后的效果、如何预测小球的移动路径















