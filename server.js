/// <reference types="@citizenfx/server" />
/// <reference types="image-js" />

const imagejs = require('image-js');

const resName = GetCurrentResourceName();

function bufferFromScreenshotData(data) {
    const raw = String(data || '');
    const base64 = raw.replace(/^data:image\/\w+;base64,/, '');
    return Buffer.from(base64, 'base64');
}

function imageToPngBase64(image) {
    if (typeof image.toBase64 === 'function') {
        return String(image.toBase64('image/png') || '').replace(/^data:image\/\w+;base64,/, '');
    }
    return String(image.toDataURL() || '').replace(/^data:image\/\w+;base64,/, '');
}

function resourceRelativePath(type, filename) {
    const relativeName = String(filename || '')
        .replace(/\.png$/i, '')
        .replace(/\\/g, '/')
        .replace(/^\/+/, '');
    const category = String(type || 'misc').replace(/\\/g, '/').replace(/^\/+/, '');
    return `images/${category}/${relativeName}.png`;
}

function savePngInResource(relativePath, pngBase64) {
    const result = exports[resName].SavePngBase64(relativePath, pngBase64) || {};
    return {
        ok: Boolean(result.ok),
        savedAs: result.savedAs || relativePath,
    };
}

try {
    console.log(`^2[screenshot]^7 Anh se duoc luu bang SaveResourceFile trong resource: ${resName}/images`);

    onNet('takeScreenshot', async (filename, type) => {
        const src = source;
        const relativePath = resourceRelativePath(type, filename);

        exports['screenshot-basic'].requestClientScreenshot(
            src,
            {
                encoding: 'png',
                quality: 1.0,
            },
            async (err, data) => {
                if (err) {
                    console.error(`^1[screenshot]^7 Khong chup duoc ${relativePath}: ${err}`);
                    return;
                }

                try {
                    let image = await imagejs.Image.load(bufferFromScreenshotData(data));
                    const croppedImage = image.crop({ x: image.width / 4.5, width: image.height });

                    image.data = croppedImage.data;
                    image.width = croppedImage.width;
                    image.height = croppedImage.height;

                    for (let x = 0; x < image.width; x++) {
                        for (let y = 0; y < image.height; y++) {
                            const pixelArr = image.getPixelXY(x, y);
                            const r = pixelArr[0];
                            const g = pixelArr[1];
                            const b = pixelArr[2];

                            if (g > r + b) {
                                image.setPixelXY(x, y, [255, 255, 255, 0]);
                            }
                        }
                    }

                    const { ok, savedAs } = savePngInResource(relativePath, imageToPngBase64(image));
                    if (!ok) {
                        console.error(`^1[screenshot]^7 SaveResourceFile that bai: ${savedAs || relativePath}`);
                        return;
                    }

                    console.log(`^2[screenshot]^7 Da luu: ${resName}/${savedAs}`);
                } catch (processError) {
                    console.error(`^1[screenshot]^7 Loi xu ly anh ${relativePath}: ${processError.message}`);
                }
            }
        );
    });
} catch (error) {
    console.error(`^1[screenshot]^7 ${error.message}`);
}
