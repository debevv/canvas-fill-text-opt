# canvas-fill-text-opt

A experimental library attempting to optimize the performance of applications that perform many `canvas.fillText()` API calls.  
It was born out of the frustration of discovering that a desktop 16-core system, in 2022 AD, struggles to display a couple of thousands of strings at 60 FPS inside an HTML `canvas`.

## Installation

```
npm install canvas-fill-text-opt
```

or

```
npm install https://github.com/debevv/canvas-fill-text-opt
```

## Usage

```ts
import FillTextOpt from "canvas-fill-text-opt";

let canvas = document.getElementById("my-canvas") as HTMLCanvasElement;
let ctx = canvas.getContext("2d");

let FTO = new FillTextOpt();
await FTO.init(canvas, {
    concurrency: 8,
    textLimitFactor: 1.4,
    fonts: ["Noto Sans", "url(assets/fonts/NotoSans-Regular.ttf)"],
});

// Context settings will be picked up by next fillText() calls, just as normal
ctx.font = '9pt "Noto Sans"';

// Use it as a regular canvas.fillText()
for (let i = 0; i < 2000; i++) {
    FTO.fillText("If you're lucky this frame will be faster!", i, i);
}

// Clip the text inside a 20x20 rectangle
FTO.fillText("My long canvas text, this part won't even be rendered!", 128, 128, null, {
    x: 128,
    y: 128,
    width: 20,
    height: 20,
});

// Finally, actually render everything on the canvas
await FTO.render();
```

## How it works

### Parallelism through Web Workers and `OffscreenCanvas`

The library will try to distribute the `fillText()` calls among a pool of Web Workers.
Every worker creates an `OffscreenCanvas` and waits for work from the main thread.
When the user calls `render()`, the main thread sends part of the queued `fillText` calls to every worker, wait for them to return the `ImageBitmap`s of their internal `OffscreenCanvas`es and finally composites them atop the user `canvas`.

At initialization, the library will try to detect if the browser supports `OffscreenCanvas` (https://caniuse.com/offscreencanvas). If it does, sets the pool size to `window.navigator.hardwareConcurrency / 2`, that is, half the count of the CPU cores.

Thanks to this optimization, an application that performs hundreds or thousands of `fillText()` calls at every frame was observed to gain a ~20% speedup, given the right conditions.

The size of the workers pool can be changed via the `concurrency` parameter.

### Better text clipping

If needed, the library can clip the rendered text inside a rectangle, if defined as the last parameter of `fillText()`.
When doing so, it will try reduce the number of rendered characters by estimating how many of them can fit in the clip area width, and call `canvas.fillText()` just on the initial part of the given string, the one that will be actually visible.  
The estimation is made by dividing the rectangle width by the average character width (for the current font size and family). The average character width is calculated only once, then cached, using `canvas.measureText()` on a sample UTF-8 text.
The estimated number of characters is finally multiplied by the `textLimitFactor` parameter, in order to add a bit of "safety margin" to the final result.
The default value is `1.4`, but it should be tuned depending on the application.

### API reference

Just take a look at the `FillTextOpt` class inside `index.ts`. It's all there
