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
#####addChild ( child)  [DisplayObject](http://createjs.com/docs/easeljs/classes/DisplayObject.html)
继承自Container的addChild方法，
如：
```
container.addChild(bitmapInstance);
```
在展示列表最前端加入一个子元素，或者
```
container.addChild(bitmapInstance, shapeInstance, textInstance);
```
一次添加多个子元素
######参数：
* child [DisplayObject]

######返回：
[DisplayObject] 被添加的child或是多个child里最后一个被添加的child

#####addChildAt(  child, index )  [DisplayObject](http://createjs.com/docs/easeljs/classes/DisplayObject.html)
继承Container的addChild函数，把一个child添加到一个展示列表的特定位置，使这个位置之后的元素的index都增加一个，并把它父元素设置到container上：
```
addChildAt(child1, index);
```
或者一次添加多个
```
 addChildAt(child1, child2, ..., index);
```
 index的值必须在0到所有子元素的总数之间，比如也可以把一个myShape添加到某个在原有队列元素otherShape的位置：
```
 container.addChildAt(myShape, container.getChildIndex(otherShape));
```
会把otherShape的index增加1，如果index超过了范围的话会添加失败。
######参数：
* child [DisplayObject]
* index [Number] 插入的位置的index

######返回：
[DisplayObject] 被添加的child或是多个child里最后一个被添加的child

#####addEventListener ( type, listener, [useCapture])  [Function](https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Function) | [Object](https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Object)


