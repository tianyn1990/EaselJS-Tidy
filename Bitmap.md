### EaselJS -> Bitmap

[Bitmap API doc](http://createjs.com/docs/easeljs/classes/Bitmap.html)

Bitmap 可以在显示列表中代表 Image、canvas、Video。它可以通过 HTMLElement 元素或一个 String 作为参数来初始化，如：

```
 var bitmap = new createjs.Bitmap("imagePath.jpg");
```

注意：

1. 如果图片等资源还没加载完毕，只有当加载完毕并调用 stage.update() 之后才会展示该资源。
2. Bitmaps with an SVG source currently will not respect an alpha value other than 0 or 1. To get around this, the Bitmap can be cached.
3. Bitmaps with an SVG source will taint the canvas with cross-origin data, which prevents interactivity. This happens in all browsers except recent Firefox builds.
4. 跨域的资源在使用涉及鼠标交互操作的时候（如：`getObjectUnderPoint`、filters、caching）会报错。
可以通过在 Image 对象上设置属性 `img.crossOrigin="Anonymous"` 来避免。

> 关于 2、3：[参考1](https://github.com/CreateJS/EaselJS/issues/325)、[参考2](http://stackoverflow.com/questions/25608721/unable-to-preload-and-display-svg-with-createjs)

#### 结构

在[源代码 —— Bitmap.js](http://www.createjs.com/docs/easeljs/files/easeljs_display_Bitmap.js.html)
中，主要做了一下几件事：

1. 继承于 DisplayObject 类。
构造函数的参数可以为：图片对象、canvas 对象、video 对象、图片路径。

2. 重写了父类的 draw 方法。
使用对象上的参数 sourceRect 来规定图片绘制的区域。如果该参数为空，则绘制整张图片。如果参数超出图片的范围（小于 0 或 大于 width/height）
则做相应的兼容处理。
该方法仅仅负责绘制（单一职责原则），不考虑：visible, alpha, shadow, transform。
该方法主要用来内部调用，一般需要通过更高级的方法封装。

3. 重写了父类的 getBounds 方法。
获得图片的边界（0,0,width,height），兼容图片正在加载中的情况。该方法会在父类中被调用。

4. 实现了 isVisible 方法。
通过：图片已加载完成 && alpha>0 && scaleX/scaleY!=0 && visible==true 来判断。

5. 实现了 toString 方法。

6. 实现了 clone 方法。
通过 Bitmap 实例化了一个新的对象，复制对象上的 sourceRect 属性，并复制 prototype 上的属性。

7. 属性 sourceRect（x, y, width, height），来规定图片的剪裁范围（sourceRect 的部分才会绘制），sourceRect 属性放在每个实例化的对象上

8. 除非使用 filter ，否则不应当使用 cache 缓存 Bitmap 对象（cache 的 API 在 DisplayObject/cache 中）。
从 DisplayObject 的 cache 中继承来的 API 包括：cache、updateCache、superCache 方法。


#### 事件

根据上面的代码可以看出， Bitmap 没有新增的特殊事件，跟 DisplayObject 一致，包括：

1. added、removed
2. click、dbclick
3. mousedown、pressmove、pressup
4. mouseover、mouseout、rollover、rollout
5. tick

由于在之前的文章有介绍，这里仅做补充：

added 事件：每当对象被添加（addChild）到某个 Container 对象（包括 stage 对象）的时候触发。而 removed 事件与 added 相反。

rollover/rollout 与 mouseover/mouseout 基本相同，但有以下两个差别：  
1. 不会产生冒泡
2. 如果监听的是一个 Container 的话，会将所有的子显示对象作为一个整体。
例如有一个 Container 对象 c0，它包含连个子对象 shapeA、shapeB 。 c0 监听了 rollout 事件，shapeA 和 shapeB 在图形上相连。
如果鼠标先经过并离开 shapeA ，再经过图形相连的地方进入 shapeB，最后离开 shapeB。那么 rollout 事件只会触发一次（整个 c0 作为了一个整体），
而如果监听的是 mouseout 事件的话，则会触发两次（从 shapeA/shapeB 离开都会触发）。  
参考：[DEMO](https://jsfiddle.net/tianyn1990/31fdcxok/)
3. 显示对象的 tick 事件会在 stage.update() 之后触发。大体的流程是：先触发 stage 对象所有子对象的 tick 事件，
然后将所有子对象绘制到画布上（通过调用各自的 draw 函数）。


#### 属性

##### 分类

作用范围上可以分为：  
1. 全局，绑定在 prototype 上的属性。所有对象之间通用，改变之后会对全局产生影响。
2. 对象，绑定在对象上的属性。在实例化过程中生成，对象之间不通用，根据对象不同发生变化。
3. 对象覆盖全局，1 和 2 两者重名的情况，2 覆盖 1。
4. 常量，直接绑定在构造方法上的属性，一般用来存储常量。
5. 私有，绑定在对象上，以下划线 _ 开头的内部私有属性，在创建自定义对象的时候可能需要使用到。

来源上可以分为：

1. 从 DisplayObject 继承过来的属性。
2. 自身特有的属性

##### 属性值说明

> 主要是继承于父类 DisplayObject 的属性

> 分类的默认值为：对象范围(1)、从父类继承(1)。若非特殊说明，则都属于此类。

1. alpha  
分类：对象范围(1)、从父类继承(1)（默认值）  
类型：Number [0-1]  
默认：1  
说明：显示对象的透明度，0 全透明，1 不透明

2. cacheCanvas  
类型：HTMLCanvasElement | Object  只读  
默认：null  
说明：当启用缓存的时候，用来存储该显示对象当前版本的缓存 canvas 对象，详见 Cache 类。

3. cacheID  
类型：Number  
默认：1  
说明：当前对象缓存的唯一标识。可以用来判断从上一次校验开始到现在，当前对象的缓存是否改变。

4. compositeOperation  
类型：String（值为原生 API context.globalCompositeOperation 的 12 种取值）  
默认：null  
说明：决定当前显示对象与它后面的显示对象之间重合部分的显示方式（覆盖/复合方式），如果为 null，则继承父容器的 compositeOperation 值。
参考：[MDN Canvas Tutorial](https://developer.mozilla.org/zh-CN/docs/Web/API/Canvas_API/Tutorial/Compositing)、
[whatwg.org doc](http://www.whatwg.org/specs/web-apps/current-work/multipage/the-canvas-element.html#compositing)

5. cursor  
类型：String  
默认：null  
说明：与 css 的 cursor 属性功能一致，值可以为 "pointer", "help", "text" 等。
但需要设置 `enableMouseover` 来启用该属性。且父容器的值会覆盖子显示对象的值。
由此可以看出它是通过监听 mouseover, rollover 事件来实现的。

6. filters  
类型：Array  
默认：null  
说明：当前显示对象的一组滤镜（反色、模糊、黑白等）。
> 注意：只有当对象调用 Cache / UpdateCache 的时候，对象的 filters 属性才会被应用或更新。
只有当显示的区域被缓存之后，filters 才会生效。

7. hitArea  
类型：DisplayObject  
默认：null  
说明：在鼠标交互或调用 getObjectsUnderPoint 方法时，需要校验某个点是否处于当前显示对象中，
此时 hitArea 如果有值，会用 hitArea 的值替代当前显示对象来进行校验操作。hitArea 的图形变换操作会基于当前对象的坐标空间
（就好像 hitArea 是当前对象的子对象一样），hitArea 会基于当前对象的 regX/Y 进行变换。另外 hitArea 在对点进行校验操作的时候
会用自身的 alpha 值（透明度），而非当前对象或祖先对象的透明度值。
并且无论是否透明，都当做不透明处理（点的校验操作都只对「可见 且 不透明 」的像素点生效）。
如果设置到一个 Container 对象上，那么该容器的所有子对象都将不会触发任何鼠标交互，类似使用了 `container.mouseChildren = false`。
> 注意：hitArea 在当前版本（0.8）中不支持 hitTest 方法，同时也不支持 stage 对象。

8. id  
类型：Number  
默认：-1  
说明：当前显示对象的全局唯一 ID。

9. image  
分类：对象范围(1)、**自身特有的属性(2)**  
类型：HTMLImageElement | HTMLCanvasElement | HTMLVideoElement  
说明：Bitmap 类自身的属性，在 draw 方法中会将 image 绘制到画布。需要注意有一些浏览器不支持绘制 video。

10. mask  
类型：Shape  
默认：null  
说明：一个矢量图形对象，用来作为剪裁 Bitmap 对象所依据的路径。这个矢量图的图形变换基于当前显示对象的父容器的坐标空间
（就好像跟当前对象同为父容器的子对象一样）。
> 注意：矢量图的变换基于父容器的坐标空间，而不是像 hitArea 一样是基于当前对象的 regX/regY。

11. mouseEnabled  
类型：Boolean  
默认：true  
说明：在鼠标交互中是否包含当前对象（对象的事件是否会触发）。如果设置为 false，那么父容器对应这一部分区域的事件也会被禁止。
但设置为 false 不会影响 getObjectsUnderPoint 方法。
参考：[DEMO](https://jsfiddle.net/tianyn1990/ewjtx5wu/)

12. name  
类型：String [可选]  
默认：null  
说明：当前对象的名字。在 toString 方法中被使用到，可以用来 debug。

13. parent  
类型：Container [只读][final]  
默认：null  
说明：指向包裹当前对象的 Container 对象或 Stage 对象。如果当前显示对象没有被 addChild 到上述两种对象中，则值为 null。

14. regX/regY  
类型：Number  
默认：0  
说明：当前显示对象所有点的偏移量。比如：以坐标空间的原点绘制一个 100x100 的圆形，那么偏移量应该为 regX=50、regY=50。

15. rotation  
类型：Number  
默认：0  
说明：当前显示对象的旋转角度。

16. scaleX/scaleY  
类型：Number [支持负值]  
默认：1  
说明：当前显示对象的水平/垂直缩放倍数。如果值为负数，则对象会被翻转。

17. skewX/skewY  
类型：Number  
默认：null  
说明：当前显示对象水平/垂直倾斜率。同 css 中的 `transform: skewX(10)`。

18. shadow  
类型：Shadow  
默认：null  
说明：当前对象的阴影。如果为 null 则继承父容器的 shadow 属性。

19. snapToPixel  
类型：Boolean  
默认：true  
说明：当 stage （全局）上的 `stage.snapToPixelEnabled` 为 `true` （默认为 false ）的时候，
决定当前显示对象是否启用「位移不满一像素不进行绘制」的模式。  
参考：[DEMO](https://jsfiddle.net/tianyn1990/o3nxzdy7/)

20. sourceRect  
分类：对象范围(1)、**自身特有的属性(2)**  
类型：Rectangle {x,y,width,height}  
默认：null  
说明：如果只需要将图片的一部分绘制到画布，可以通过设置 sourceRect 属性来限制。
video 资源必须设置 width/height。sourceRect 可以超出图片的最大范围，但只有范围内的图片可以被绘制。

21. stage  
类型：Stage  
说明：记录显示对象最终被添加到的 stage 对象。如果没有添加则为 null。

22. tickEnabled  
类型：Boolean  
默认：true  
说明：如果为 false ，则该对象（及其子对象）的 tick 事件都不会触发。一般可以用来提升性能。
除了禁止 tick 事件之外，在一些显示对象中还可以禁止与 tick 相关的一些更新操作如：
Sprite & MovieClip frame advancing, DOMElement visibility handling。

23. transformMatrix  
类型：Matrix2D  
默认：null  
说明：当前显示对象的「图形变换」，它会覆盖掉其他的图形变换属性如：x/y, rotate, scaleX/scaleY, skewX/skewY。

24. visible  
类型：Boolean  
默认：true  
说明：当前对象是否应该被显示到画布上。
另外，它在 `getObjectsUnderPoint` 方法中也会用到（[此处代码](http://www.createjs.com/docs/easeljs/files/easeljs_display_Container.js.html#l600)），
因此如果为 false ，则当前对象的父容器调用 `getObjectsUnderPoint` 方法永远不会获取到当前对象。

25. x/y  
类型：Number  
默认：0  
说明：当前对象的 x/y 坐标值。需要注意的是当前对象的坐标系是基于父容器的坐标系的。


#### 方法

> Bitmap 的方法主要是继承于 DisplayObject 类 和 EventDispatcher 类
> 继承关系：Bitmap -> DisplayObject -> EventDispatcher

1. addEventListener  
参数：( type  listener  [useCapture] )  
继承：EventDispatcher 类  
说明：为当前对象注册事件，如果对多个事件注册同一个回调方法，方法有可能被触发多次。
```
displayObject.addEventListener("click", handleClick);
function handleClick(event) {
// Click happened.
}
```
第三个参数 useCapture 参考[这里](https://github.com/tianyn1990/tianyn1990.github.io/blob/master/CreateJS/EaselJS/learning.md#事件冒泡)
返回值：第二个参数 listener

2. cache [弃用]  
参数：无  
继承：DisplayObject  
说明：因为 Bitmap 对象已经是「简单格式」对象（的资源只有一个 image、video、canvas，且绘制操作只调用一个 API drawImage），
因此没有使用缓存的必要。  
缓存提升性能的原理：[离屏 canvas 技术](https://github.com/tianyn1990/tianyn1990.github.io/blob/master/Canvas/Learning.md#其他手段离屏canvas)


























