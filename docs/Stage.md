### EaselJS -> Stage

[Stage API doc](http://createjs.com/docs/easeljs/classes/Stage.html)

舞台（Stage）是对一个展示列表（display list）的容器（Container）的基类，每次触发它的tick方法来就会把它实例化对象所存储的展示列表绘制到指定的画布（canvas）上。如：

```
var stage = new createjs.Stage("canvasElementId"); 
var image = new createjs.Bitmap("imagePath.png");
stage.addChild(image); 
createjs.Ticker.addEventListener("tick", handleTick); 
function handleTick(event) { 
    image.x += 10; 
    stage.update();
 }
```
以上代码就是给一个canvasElementId的canvas新建一个Stage实例stage，并给stage添加一个child（image），然后用Ticker对象来更新这个child和对这个stage进行重绘。

####构造函数
Stage( canvas )
* canvas HTMLCanvasElement | [String]
参数：一个canvas HTMLDom对象或者canvas的id的字符串

####方法
######addChild
* addChild ( child)  [DisplayObject(http://createjs.com/docs/easeljs/classes/DisplayObject.html)

如：
```
container.addChild(bitmapInstance);
```
在展示列表最前端加入一个子元素，或者
```
container.addChild(bitmapInstance, shapeInstance, textInstance);
```
一次添加多个子元素
