/// <reference types="@citizenfx/server" />
/// <reference types="image-js" />

const fs = require('fs');
const path = require('path');
const imagejs = require('image-js');

const resName = GetCurrentResourceName();
const config = JSON.parse(LoadResourceFile(resName, 'config.json') || '{}');
const mainSavePath = path.join(GetResourcePath(resName), 'images');

function toSavePath(filename, type) {
	const cleanName = String(filename)
		.replace(/\\/g, '/')
		.replace(/^\/+/, '')
		.replace(/\.(webp|png)$/i, '');
	return path.join(mainSavePath, type, `${cleanName}.png`);
}

function isGreenScreenPixel(r, g, b) {
	return (g > r + b) || (g > 85 && g > r + 20 && g > b + 20);
}

function removeSpeckArtifacts(image) {
	const w = image.width;
	const h = image.height;
	const keep = new Uint8Array(w * h);

	for (let y = 1; y < h - 1; y++) {
		for (let x = 1; x < w - 1; x++) {
			if (image.getPixelXY(x, y)[3] < 20) continue;
			let neighbors = 0;
			for (let dy = -1; dy <= 1; dy++) {
				for (let dx = -1; dx <= 1; dx++) {
					if (dx === 0 && dy === 0) continue;
					if (image.getPixelXY(x + dx, y + dy)[3] >= 20) neighbors++;
				}
			}
			if (neighbors >= 3) keep[y * w + x] = 1;
		}
	}

	for (let y = 0; y < h; y++) {
		for (let x = 0; x < w; x++) {
			if (!keep[y * w + x]) image.setPixelXY(x, y, [0, 0, 0, 0]);
		}
	}
}

function cropToContent(image) {
	let minX = image.width;
	let maxX = -1;
	let minY = image.height;
	let maxY = -1;

	for (let x = 0; x < image.width; x++) {
		for (let y = 0; y < image.height; y++) {
			const alpha = image.getPixelXY(x, y)[3];
			if (alpha >= 20) {
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

	const pad = 2;
	minX = Math.max(0, minX - pad);
	minY = Math.max(0, minY - pad);
	maxX = Math.min(image.width - 1, maxX + pad);
	maxY = Math.min(image.height - 1, maxY + pad);

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

							if (isGreenScreenPixel(r, g, b)) {
								image.setPixelXY(x, y, [0, 0, 0, 0]);
							}
						}
					}

					removeSpeckArtifacts(image);
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

const DEFER_CONVAR = `${resName}_started_last`;

function anyResourceStarting() {
	const count = GetNumResources();
	for (let i = 0; i < count; i++) {
		const name = GetResourceByFindIndex(i);
		if (!name) continue;
		if (GetResourceState(name) === 'starting') return true;
	}
	return false;
}

on('onResourceStart', (resource) => {
	if (resource !== resName) return;
	if (GetConvar(DEFER_CONVAR, '0') === '1') {
		console.log(`[${resName}] loaded last after other resources.`);
		return;
	}

	const startedAt = Date.now();
	const maxWaitMs = 120000;
	const idleMs = 3000;
	let lastBusy = Date.now();

	const timer = setInterval(() => {
		if (anyResourceStarting()) lastBusy = Date.now();
		const idle = Date.now() - lastBusy;
		const waited = Date.now() - startedAt;
		if (idle < idleMs && waited < maxWaitMs) return;

		clearInterval(timer);
		SetConvar(DEFER_CONVAR, '1');
		console.log(`[${resName}] restarting last (ensure was early).`);
		ExecuteCommand(`restart ${resName}`);
	}, 250);
});

