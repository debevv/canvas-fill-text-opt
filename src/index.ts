import fillTextOptImpl from "./fillTextOptImpl";

export class Rect {
    x: number;
    y: number;
    width: number;
    height: number;
}

export class FFFont {
    family: string;
    source: string | BinaryData;
    descriptors?: FontFaceDescriptors;

    constructor(family: string, source: string | BinaryData, descriptors?: FontFaceDescriptors) {
        this.family = family;
        this.source = source;
        this.descriptors = descriptors;
    }
}

export class Settings {
    canvas: HTMLCanvasElement;
    concurrency: number;
    textLimitFactor: number;
    fonts: FFFont[];
}

export default class FillTextOpt {
    private S: Settings;
    private workers: FTOWorker[];
    private workersIdx: number;
    private ctx: CanvasRenderingContext2D;

    public get settings(): Settings {
        return this.S;
    }

    public async init(canvas: HTMLCanvasElement, settings: Partial<Settings>) {
        this.S = {
            canvas: canvas,
            concurrency: 0,
            textLimitFactor: 1.4,
            fonts: [],
        };

        this.workers = [];
        this.workersIdx = 0;

        if (isNaN(settings.concurrency)) {
            settings.concurrency = this.offscreenCanvasSupported() ? window.navigator.hardwareConcurrency / 2 : 0;
        }

        await this.updateSettings(settings);
    }

    public async updateSettings(settings: Partial<Settings>) {
        let rebuild = false;

        if (settings.concurrency && settings.concurrency != this.S.concurrency) {
            rebuild = true;
        }

        if (settings.fonts) {
            rebuild = true;
        }

        this.S = { ...this.S, ...settings };

        this.ctx = this.S.canvas.getContext("2d");

        if (!isNaN(this.S.concurrency) && !this.offscreenCanvasSupported()) this.S.concurrency = 0;

        if (rebuild) await this.rebuildWorkers();
    }

    public fillText(text: string, x: number, y: number, maxWidth?: number, clip?: Rect) {
        if (this.S.concurrency > 0) {
            this.workers[this.workersIdx].submitFillText({
                text,
                x,
                y,
                maxWidth: maxWidth == null ? undefined : maxWidth,
                clip,
                fillStyle: this.ctx.fillStyle as any,
                font: this.ctx.font,
                textAlign: this.ctx.textAlign,
                textBaseline: this.ctx.textBaseline,
                textLimitFactor: this.S.textLimitFactor,
            });

            this.workersIdx = (this.workersIdx + 1) % this.workers.length;
        } else {
            maxWidth = maxWidth == null ? undefined : maxWidth;
            fillTextOptImpl(this.ctx, text, x, y, maxWidth, clip, this.S.textLimitFactor);
        }
    }

    public async render() {
        if (this.S.concurrency > 0) {
            let promises = [];
            for (let i = 0; i < this.workers.length; i++) {
                promises.push(this.workers[i].render(this.S.canvas.width, this.S.canvas.height));
            }

            let layers = await Promise.all<ImageBitmap>(promises);

            for (let layer of layers) {
                this.ctx.drawImage(layer, 0, 0);
                layer.close();
            }
        } else {
            return new Promise((resolve, _reject) => {
                setTimeout(resolve, 0);
            });
        }
    }

    private async rebuildWorkers() {
        for (let i = 0; i < this.workers.length; i++) this.workers[i].terminate();

        this.workers = [];
        this.workersIdx = 0;

        for (let i = 0; i < this.S.concurrency; i++) {
            let worker = new FTOWorker();
            await worker.init(i, this.S.fonts);

            this.workers.push(worker);
        }
    }

    private offscreenCanvasSupported(): boolean {
        if (typeof (HTMLCanvasElement.prototype as any).transferControlToOffscreen === "function") return true;
        return false;
    }
}

class OPParams {
    text: string;
    x: number;
    y: number;
    maxWidth: number;
    clip: Rect;
    fillStyle: string;
    font: string;
    textAlign: string;
    textBaseline: string;
    textLimitFactor: number;
}

class FTOWorker {
    private id: number;
    private worker: Worker;
    private operations: OPParams[];

    async init(id: number, fonts: FFFont[]): Promise<void> {
        this.id = id;
        this.worker = new Worker(new URL("./fillTextOptWorker.js", import.meta.url));
        this.operations = [];

        return new Promise((resolve, _reject) => {
            this.worker.onmessage = (event: MessageEvent) => {
                this.worker.onmessage = null;
                resolve(event.data);
            };

            this.worker.postMessage(
                JSON.stringify({
                    type: 0,
                    data: {
                        fonts: fonts,
                    },
                })
            );
        });
    }

    submitFillText(params: OPParams) {
        this.operations.push(params);
    }

    async render(width: number, height: number): Promise<ImageBitmap> {
        return new Promise<ImageBitmap>((resolve, _reject) => {
            this.worker.onmessage = (event: MessageEvent<ImageBitmap>) => {
                this.worker.onmessage = null;
                resolve(event.data);
            };

            this.worker.postMessage(
                JSON.stringify({
                    type: 1,
                    data: {
                        workerID: this.id,
                        width,
                        height,
                        operations: this.operations,
                    },
                })
            );

            this.operations = [];
        });
    }

    terminate() {
        this.worker.terminate();
    }
}
