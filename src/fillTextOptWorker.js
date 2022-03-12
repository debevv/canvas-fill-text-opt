self.importScripts(new URL("./fillTextOptImpl.js", import.meta.url));

let canvas = new OffscreenCanvas(0, 0);

self.onmessage = async function (messageEvent) {
    let message = JSON.parse(messageEvent.data);

    if (message.type == 0) {
        let fonts = message.data.fonts;
        let promises = [];
        for (let f of fonts) {
            promises.push(new FontFace(f.family, f.source, f.descriptors).load());
        }

        fonts = await Promise.all(promises);

        for (let f of fonts) {
            self.fonts.add(f);
        }

        postMessage(null);
    } else if (message.type == 1) {
        let data = message.data;
        if (canvas.width != data.width || canvas.height != data.height)
            canvas = new OffscreenCanvas(parseInt(data.width), parseInt(data.height));

        let ctx = canvas.getContext("2d", { alpha: true });
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        for (let op of data.operations) {
            ctx.fillStyle = op.fillStyle;
            ctx.font = op.font;
            ctx.textAlign = op.textAlign;
            ctx.textBaseline = op.textBaseline;

            fillTextImpl(ctx, op.text, op.x, op.y, op.maxWidth, op.clip, op.textLimitFactor);
        }

        let image = canvas.transferToImageBitmap();

        postMessage(image, [image]);
    }
};
