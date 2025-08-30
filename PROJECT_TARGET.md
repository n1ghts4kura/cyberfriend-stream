# Project Target

好的，现在我们已经搭建好了由Electron + Live2D + React + Vite组成的前端框架。
现在我们需要实现一些新的功能。

**cyberfriend**项目的构想是构建一个响应后端数据的前端Live2D模型展示库。
怎么响应后端数据呢？这就涉及到我们接下来要讨论的实现细节。

> live2d general doc origin: https://docs.live2d.com/zh-CHS/cubism-sdk-manual/top/

Live2DCubismWebSDK提供了操控Live2DCanvas上模型的api，包括但不限于控制人物当前展示的表情、姿势、音效等等。
我们通过与后端进行websocket链接，实现前端接收event数据，然后解包出来相对应的操作，如展示人物的动作2。

那么我们现在要做的，就是抽象/实现出来好用的Api与后端进行对接。

后端的api doc将会在后面进行提供。