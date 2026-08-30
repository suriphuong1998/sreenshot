/// <reference types="@citizenfx/server" />
/// <reference types="image-js" />

const fs = require('fs');
const path = require('path');

const resName = GetCurrentResourceName();
const Delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function failAndStop(errors) {
    console.error('^1========================================^7');
    console.error(`^1[screenshot]^7 KHONG THE START "${resName}" vi thieu resource:`);
    for (const message of errors) {
        console.error(`^1[screenshot]^7  - ${message}`);
    }
    console.error('^1========================================^7');
    StopResource(resName);
}

async function tryStartResource(name, timeoutMs = 15000) {
    let state = GetResourceState(name);

    if (state === 'missing') {
        return { ok: false, reason: 'missing', startedNow: false };
    }

    if (state === 'started') {
        return { ok: true, reason: 'already', startedNow: false };
    }

    console.log(`^3[screenshot]^7 Resource "${name}" chua start (state: ${state}), dang thu start...`);
    ExecuteCommand(`ensure ${name}`);

    const startedAt = Date.now();
    while (Date.now() - startedAt < timeoutMs) {
        await Delay(200);
        state = GetResourceState(name);
        if (state === 'started') {
            console.log(`^2[screenshot]^7 Da start "${name}" thanh cong.`);
            return { ok: true, reason: 'started', startedNow: true };
        }
    }

    return { ok: false, reason: state, startedNow: false };
}

function registerScreenshotHandler() {
    const imagejs = require('image-js');
    const mainSavePath = path.join(GetResourcePath(resName), 'images');

    function ensureDir(dirPath) {
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }
    }

    ensureDir(mainSavePath);
    console.log(`^2[screenshot]^7 Anh se duoc luu tai: ${mainSavePath}`);

    onNet('takeScreenshot', async (filename, type) => {
        const src = source;
        const relativeName = String(filename || '').replace(/\.png$/i, '');
        const filePath = path.join(mainSavePath, type, `${relativeName}.png`);

        ensureDir(path.dirname(filePath));

        exports['screenshot-basic'].requestClientScreenshot(
            src,
            {
                fileName: filePath,
                encoding: 'png',
                quality: 1.0,
            },
            async (err, savedFileName) => {
                if (err) {
                    console.error(`^1[screenshot]^7 Khong chup duoc ${filePath}: ${err}`);
                    return;
                }

                try {
                    let image = await imagejs.Image.load(savedFileName);
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

                    await image.save(savedFileName);
                    console.log(`^2[screenshot]^7 Da luu: ${savedFileName}`);
                } catch (processError) {
                    console.error(`^1[screenshot]^7 Loi xu ly anh ${savedFileName}: ${processError.message}`);
                }
            }
        );
    });
}

(async () => {
    const yarn = await tryStartResource('yarn');

    if (!yarn.ok) {
        if (yarn.reason === 'missing') {
            failAndStop([
                'Thieu resource "yarn" (khong tim thay). Hay dam bao yarn nam trong resources/[system]/[builders] cua FXServer.',
            ]);
        } else {
            failAndStop([
                `Khong start duoc resource "yarn" (state: ${yarn.reason}). Hay chay "ensure yarn" tren console server.`,
            ]);
        }
        return;
    }

    if (yarn.startedNow) {
        console.log(`^3[screenshot]^7 yarn vua duoc start. Restart "${resName}" de yarn cai dat package...`);
        setTimeout(() => {
            ExecuteCommand(`ensure ${resName}`);
        }, 1500);
        StopResource(resName);
        return;
    }

    const screenshotBasic = await tryStartResource('screenshot-basic');

    if (!screenshotBasic.ok) {
        if (screenshotBasic.reason === 'missing') {
            failAndStop([
                'Thieu resource "screenshot-basic" (khong tim thay). Hay tai https://github.com/citizenfx/screenshot-basic va dat vao folder resources.',
            ]);
        } else {
            failAndStop([
                `Khong start duoc resource "screenshot-basic" (state: ${screenshotBasic.reason}). Hay chay "ensure screenshot-basic" tren console server.`,
            ]);
        }
        return;
    }

    try {
        registerScreenshotHandler();
    } catch (error) {
        console.error(`^1[screenshot]^7 ${error.message}`);
    }
})();
