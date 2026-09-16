/// <reference types="@citizenfx/server" />
/// <reference types="image-js" />

const fs = require('fs');
const path = require('path');
const imagejs = require('image-js');
const sharp = require('sharp');

const resName = GetCurrentResourceName();

function toResourcePath(filename, type) {
	const cleanName = String(filename)
		.replace(/\\/g, '/')
		.replace(/^\/+/, '')
		.replace(/\.png$/i, '.webp');
	const withExt = cleanName.toLowerCase().endsWith('.webp') ? cleanName : `${cleanName}.webp`;
	return `images/${type}/${withExt}`;
}

function ensureParentDir(relativePath) {
	const absPath = path.join(GetResourcePath(resName), relativePath);
	fs.mkdirSync(path.dirname(absPath), { recursive: true });
}

function saveWebpToResource(relativePath, webpBuffer) {
	ensureParentDir(relativePath);
	return SaveResourceFile(
		resName,
		relativePath,
		webpBuffer.toString('binary'),
		webpBuffer.length
	);
}

onNet('takeScreenshot', async (filename, type) => {
	const player = source;
	const relativePath = toResourcePath(filename, type);

	exports['screenshot-basic'].requestClientScreenshot(
		player,
		{
			encoding: 'png',
			quality: 1.0,
		},
		async (err, data) => {
			try {
				if (err) {
					console.error(`[${resName}] screenshot error:`, err);
					return;
				}

				let image = await imagejs.Image.load(data);
				const coppedImage = image.crop({ x: image.width / 4.5, width: image.height });

				image.data = coppedImage.data;
				image.width = coppedImage.width;
				image.height = coppedImage.height;

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

				const webpBuffer = await sharp(Buffer.from(image.data.buffer, image.data.byteOffset, image.data.byteLength), {
					raw: {
						width: image.width,
						height: image.height,
						channels: 4,
					},
				})
					.webp({ lossless: true, alphaQuality: 100 })
					.toBuffer();

				const saved = saveWebpToResource(relativePath, webpBuffer);
				if (!saved) {
					console.error(`[${resName}] SaveResourceFile failed: ${relativePath}`);
					return;
				}

				console.log(`[${resName}] saved ${relativePath}`);
			} catch (error) {
				console.error(`[${resName}]`, error.message || error);
			}
		}
	);
});
