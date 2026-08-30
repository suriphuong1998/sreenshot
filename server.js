/// <reference types="@citizenfx/server" />
/// <reference types="image-js" />

const imagejs = require('image-js');

const resName = GetCurrentResourceName();
const config = JSON.parse(LoadResourceFile(resName, 'config.json') || '{}');

function bufferFromScreenshotData(data) {
    const raw = String(data || '');
    const base64 = raw.replace(/^data:image\/\w+;base64,/, '');
    return Buffer.from(base64, 'base64');
}

function ensureRgba(image) {
    if (image.alpha && image.channels >= 4) {
        return image;
    }
    if (typeof image.rgba8 === 'function') {
        return image.rgba8();
    }
    if (typeof image.convertColor === 'function') {
        try {
            return image.convertColor('RGBA');
        } catch (error) {
            return image;
        }
    }
    return image;
}

function imageToPngBase64(image) {
    if (typeof image.toBuffer === 'function') {
        const encoded = image.toBuffer({ format: 'png' });
        if (encoded && typeof encoded.then === 'function') {
            return encoded.then((buf) => Buffer.from(buf).toString('base64'));
        }
        if (encoded) {
            return Buffer.from(encoded).toString('base64');
        }
    }

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

function isGreenScreenPixel(r, g, b) {
    return g > r + b || (g >= 80 && g > r + 35 && g > b + 35);
}

function removeGreenScreen(image) {
    for (let x = 0; x < image.width; x++) {
        for (let y = 0; y < image.height; y++) {
            const pixelArr = image.getPixelXY(x, y);
            if (isGreenScreenPixel(pixelArr[0], pixelArr[1], pixelArr[2])) {
                image.setPixelXY(x, y, [0, 0, 0, 0]);
            }
        }
    }
    return image;
}

function cropToContent(image) {
    let minX = image.width;
    let maxX = -1;
    let minY = image.height;
    let maxY = -1;

    for (let x = 0; x < image.width; x++) {
        for (let y = 0; y < image.height; y++) {
            if ((image.getPixelXY(x, y)[3] || 0) > 0) {
                minX = Math.min(minX, x);
                maxX = Math.max(maxX, x);
                minY = Math.min(minY, y);
                maxY = Math.max(maxY, y);
            }
        }
    }

    if (maxX < minX || maxY < minY) {
        return image;
    }

    const pad = 8;
    minX = Math.max(0, minX - pad);
    minY = Math.max(0, minY - pad);
    maxX = Math.min(image.width - 1, maxX + pad);
    maxY = Math.min(image.height - 1, maxY + pad);

    return image.crop({
        x: minX,
        y: minY,
        width: maxX - minX + 1,
        height: maxY - minY + 1,
    });
}

try {
    console.log(`^2[screenshot]^7 Luu anh trong resource: ${resName}/images`);

    onNet('takeScreenshot', async (filename, type) => {
        const src = source;
        const relativePath = resourceRelativePath(type, filename);

        if (config.overwriteExistingImages === false && LoadResourceFile(resName, relativePath)) {
            if (config.debug) {
                console.log(`^3[screenshot]^7 Bo qua file da co: ${relativePath}`);
            }
            return;
        }

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
                    image = ensureRgba(image);
                    image = removeGreenScreen(image);
                    image = cropToContent(image);

                    const pngBase64 = await imageToPngBase64(image);
                    if (!pngBase64) {
                        console.error(`^1[screenshot]^7 Khong encode duoc PNG: ${relativePath}`);
                        return;
                    }

                    const { ok, savedAs } = savePngInResource(relativePath, pngBase64);
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
