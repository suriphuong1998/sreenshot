/// <reference types="@citizenfx/server" />
/// <reference types="image-js" />

const fs = require('fs');
const path = require('path');
const imagejs = require('image-js');

const resName = GetCurrentResourceName();
const config = JSON.parse(LoadResourceFile(resName, 'config.json') || '{}');
const mainSavePath = GetResourcePath(resName);

function toSavePath(filename, type) {
	const cleanName = String(filename)
		.replace(/\\/g, '/')
		.replace(/^\/+/, '')
		.replace(/\.(webp|png)$/i, '');
	return path.join(mainSavePath, type, `${cleanName}.png`);
}

function cropToContent(image) {
	let minX = image.width;
	let maxX = -1;
	let minY = image.height;
	let maxY = -1;

	for (let x = 0; x < image.width; x++) {
		for (let y = 0; y < image.height; y++) {
			const alpha = image.getPixelXY(x, y)[3];
			if (alpha > 0) {
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

	const croppedImage = image.crop({
		x: minX,
		y: minY,
		width: maxX - minX + 1,
		height: maxY - minY + 1,
	});

	image.data = croppedImage.data;
	image.width = croppedImage.width;
	image.height = croppedImage.height;
	return image;
}

try {
	if (!fs.existsSync(mainSavePath)) {
		fs.mkdirSync(mainSavePath, { recursive: true });
	}

	onNet('takeScreenshot', async (filename, type) => {
		const fullFilePath = toSavePath(filename, type);
		const saveDir = path.dirname(fullFilePath);

		if (!fs.existsSync(saveDir)) {
			fs.mkdirSync(saveDir, { recursive: true });
		}

		if (config.overwriteExistingImages === false && fs.existsSync(fullFilePath)) {
			if (config.debug) {
				console.log(`DEBUG: Skipping existing file: ${fullFilePath}`);
			}
			return;
		}

		if (config.debug) {
			console.log(`DEBUG: Processing screenshot: ${fullFilePath}`);
		}

		exports['screenshot-basic'].requestClientScreenshot(
			source,
			{
				encoding: 'png',
				quality: 1.0,
			},
			async (err, data) => {
				try {
					if (err) {
						console.error(`Screenshot failed for ${fullFilePath}: ${err}`);
						return;
					}

					let image = await imagejs.Image.load(data);

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

					image = cropToContent(image);
					await image.save(fullFilePath);
					console.log(`[${resName}] saved ${fullFilePath}`);
				} catch (error) {
					console.error(`[${resName}]`, error.message || error);
				}
			}
		);
	});
} catch (error) {
	console.error(error.message);
}
