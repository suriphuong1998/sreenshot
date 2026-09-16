/// <reference types="@citizenfx/client" />

const config = JSON.parse(LoadResourceFile(GetCurrentResourceName(), 'config.json'));

const Delay = (ms) => new Promise((res) => setTimeout(res, ms));

// Component ID to name mapping
const componentNames = {
	0: 'head',        // Mũ
	1: 'glasses',     // Kính
	2: 'ears',        // Tai nghe
	3: 'torso',       // Áo trong
	4: 'legs',        // Quần
	5: 'bags',        // Túi
	6: 'feet',        // Giày
	7: 'accessories', // Phụ kiện
	8: 'undershirts', // Áo trong
	9: 'bodyarmor',   // Áo giáp
	10: 'decals',     // Hình xăm
	11: 'tops'        // Áo ngoài
};

let cam;
let camInfo;
let ped;
let interval;
const playerId = PlayerId();
let QBCore = null;

if (config.useQBVehicles) {
	QBCore = exports[config.coreResourceName].GetCoreObject();
}

async function takeScreenshotForComponent(pedType, type, component, drawable, texture, cameraSettings) {
	const cameraInfo = cameraSettings ? cameraSettings : config.cameraSettings[type][component];

	setWeatherTime();

	await Delay(500);

	if (!camInfo || camInfo.zPos !== cameraInfo.zPos || camInfo.fov !== cameraInfo.fov) {
		camInfo = cameraInfo;

		if (cam) {
			DestroyAllCams(true);
			DestroyCam(cam, true);
			cam = null;
		}

		SetEntityRotation(ped, config.greenScreenRotation.x, config.greenScreenRotation.y, config.greenScreenRotation.z, 0, false);
		SetEntityCoordsNoOffset(ped, config.greenScreenPosition.x, config.greenScreenPosition.y, config.greenScreenPosition.z, false, false, false);

		await Delay(50);

		const [playerX, playerY, playerZ] = GetEntityCoords(ped);
		const [fwdX, fwdY, fwdZ] = GetEntityForwardVector(ped);

		const fwdPos = {
			x: playerX + fwdX * 1.2,
			y: playerY + fwdY * 1.2,
			z: playerZ + fwdZ + camInfo.zPos,
		};

		cam = CreateCamWithParams('DEFAULT_SCRIPTED_CAMERA', fwdPos.x, fwdPos.y, fwdPos.z, 0, 0, 0, camInfo.fov, true, 0);

		PointCamAtCoord(cam, playerX, playerY, playerZ + camInfo.zPos);
		SetCamActive(cam, true);
		RenderScriptCams(true, false, 0, true, false, 0);
	}

	await Delay(50);

	SetEntityRotation(ped, camInfo.rotation.x, camInfo.rotation.y, camInfo.rotation.z, 2, false);

	const componentName = componentNames[component] || `component_${component}`;
	const fileName = `${componentName}_${drawable}${texture ? `_${texture}`: ''}.png`;
	const fullPath = `clothings/${pedType}/${componentName}/${fileName}`;
	emitNet('takeScreenshot', fullPath, 'clothing');
	await Delay(2000);
	return;
}
async function takeScreenshotForObject(object, hash, entityType = 'object') {
    setWeatherTime();

    await Delay(500);

    if (cam) {
        DestroyAllCams(true);
        DestroyCam(cam, true);
        cam = null;
    }

    let [[minDimX, minDimY, minDimZ], [maxDimX, maxDimY, maxDimZ]] = GetModelDimensions(hash);
    let modelSize = {
        x: maxDimX - minDimX,
        y: maxDimY - minDimY,
        z: maxDimZ - minDimZ
    }
    let fov;
    let camPos;
    let center;

    // Lấy tọa độ object trước
    const [objectX, objectY, objectZ] = GetEntityCoords(object, false);

    if (entityType === 'vehicle') {
        fov = Math.min(Math.max(modelSize.x, modelSize.y, modelSize.z) / 0.15 * 10, 60);
        center = {
            x: objectX + (minDimX + maxDimX) / 2,
            y: objectY + (minDimY + maxDimY) / 2,
            z: objectZ + (minDimZ + maxDimZ) / 2,
        };
        camPos = {
            x: center.x + (Math.max(modelSize.x, modelSize.y, modelSize.z) + 2) * Math.cos(340),
            y: center.y + (Math.max(modelSize.x, modelSize.y, modelSize.z) + 2) * Math.sin(340),
            z: center.z + modelSize.z / 2,
        };
    } else {
        fov = Math.min(Math.max(modelSize.x, modelSize.z) / 0.15 * 10, 60);
        const [fwdX, fwdY, fwdZ] = GetEntityForwardVector(object);
        center = {
            x: objectX + (minDimX + maxDimX) / 2,
            y: objectY + (minDimY + maxDimY) / 2,
            z: objectZ + (minDimZ + maxDimZ) / 2,
        };
        camPos = {
            x: center.x + fwdX * 1.2 + Math.max(modelSize.x, modelSize.z) / 2,
            y: center.y + fwdY * 1.2 + Math.max(modelSize.x, modelSize.z) / 2,
            z: center.z + fwdZ,
        };
    }

    console.log(modelSize.x, modelSize.z);

    cam = CreateCamWithParams('DEFAULT_SCRIPTED_CAMERA', camPos.x, camPos.y, camPos.z, 0, 0, 0, fov, true, 0);

    PointCamAtCoord(cam, center.x, center.y, center.z);
    SetCamActive(cam, true);
    RenderScriptCams(true, false, 0, true, false, 0);

    await Delay(50);

    // Both vehicle and object: rotate 360 degrees
    const totalRotation = 360;
    const steps = 36; // Number of steps for the rotation
    const increment = totalRotation / steps; // Degree increment per step
    for (let i = 0; i <= steps; i++) {
        const newHeading = GetEntityHeading(object) + increment;
        SetEntityHeading(object, newHeading % 360); // Rotate entity

        const category = entityType === 'vehicle' ? 'vehicles' : 'objects';
        const fullPath = `${category}/${hash}_${i}`;
        emitNet('takeScreenshot', fullPath, 'objects');
        await Delay(2000);
    }
    await Delay(2000);
    return;
}



function SetPedOnGround() {
	const [x, y, z] = GetEntityCoords(ped, false);
	const [retval, ground] = GetGroundZFor_3dCoord(x, y, z, 0, false);
	SetEntityCoords(ped, x, y, ground, false, false, false, false);

}

function ClearAllPedProps() {
	for (const prop of Object.keys(config.cameraSettings.PROPS)) {
		ClearPedProp(ped, parseInt(prop));
	}
}

async function ResetPedComponents() {

	if (config.debug) console.log(`DEBUG: Resetting Ped Components`);

	SetPedDefaultComponentVariation(ped);

	await Delay(150);

	SetPedComponentVariation(ped, 0, 0, 1, 0); // Head
	SetPedComponentVariation(ped, 1, 0, 0, 0); // Mask
	SetPedComponentVariation(ped, 2, -1, 0, 0); // Hair
	SetPedComponentVariation(ped, 7, 0, 0, 0); // Accessories
	SetPedComponentVariation(ped, 5, 0, 0, 0); // Bags
	SetPedComponentVariation(ped, 6, -1, 0, 0); // Shoes
	SetPedComponentVariation(ped, 9, 0, 0, 0); // Armor
	SetPedComponentVariation(ped, 3, -1, 0, 0); // Torso
	SetPedComponentVariation(ped, 8, -1, 0, 0); // Undershirt
	SetPedComponentVariation(ped, 4, -1, 0, 0); // Legs
	SetPedComponentVariation(ped, 11, -1, 0, 0); // Top
	SetPedHairColor(ped, 45, 15);

	ClearAllPedProps();

	return;
}

function setWeatherTime() {
	if (config.debug) console.log(`DEBUG: Setting Weather & Time`);
	SetRainLevel(0.0);
	SetWeatherTypePersist('EXTRASUNNY');
	SetWeatherTypeNow('EXTRASUNNY');
	SetWeatherTypeNowPersist('EXTRASUNNY');
	NetworkOverrideClockTime(18, 0, 0);
	NetworkOverrideClockMillisecondsPerGameMinute(1000000);
}

function stopWeatherResource() {
	if (config.debug) console.log(`DEBUG: Stopping Weather Resource`);
	if ((GetResourceState('qb-weathersync') == 'started') || (GetResourceState('qbx_weathersync') == 'started')) {
		TriggerEvent('qb-weathersync:client:DisableSync');
		return true;
	} else if (GetResourceState('weathersync') == 'started') {
		TriggerEvent('weathersync:toggleSync')
		return true;
	} else if (GetResourceState('esx_wsync') == 'started') {
		SendNUIMessage({
			error: 'weathersync',
		});
		return false;
	} else if (GetResourceState('cd_easytime') == 'started') {
		TriggerEvent('cd_easytime:PauseSync', false)
		return true;
	} else if (GetResourceState('vSync') == 'started' || GetResourceState('Renewed-Weathersync') == 'started') {
		TriggerEvent('vSync:toggle', false)
		return true;
	}
	return true;
};

function startWeatherResource() {
	if (config.debug) console.log(`DEBUG: Starting Weather Resource again`);
	if ((GetResourceState('qb-weathersync') == 'started') || (GetResourceState('qbx_weathersync') == 'started')) {
		TriggerEvent('qb-weathersync:client:EnableSync');
	} else if (GetResourceState('weathersync') == 'started') {
		TriggerEvent('weathersync:toggleSync')
	} else if (GetResourceState('cd_easytime') == 'started') {
		TriggerEvent('cd_easytime:PauseSync', true)
	} else if (GetResourceState('vSync') == 'started' || GetResourceState('Renewed-Weathersync') == 'started') {
		TriggerEvent('vSync:toggle', true)
	}
}

async function LoadComponentVariation(ped, component, drawable, texture) {
	texture = texture || 0;

	if (config.debug) console.log(`DEBUG: Loading Component Variation: ${component} ${drawable} ${texture}`);

	SetPedPreloadVariationData(ped, component, drawable, texture);
	while (!HasPedPreloadVariationDataFinished(ped)) {
		await Delay(50);
	}
	SetPedComponentVariation(ped, component, drawable, texture, 0);

	return;
}

async function LoadPropVariation(ped, component, prop, texture) {
	texture = texture || 0;

	if (config.debug) console.log(`DEBUG: Loading Prop Variation: ${component} ${prop} ${texture}`);

	SetPedPreloadPropData(ped, component, prop, texture);
	while (!HasPedPreloadPropDataFinished(ped)) {
		await Delay(50);
	}
	ClearPedProp(ped, component);
	SetPedPropIndex(ped, component, prop, texture, 0);

	return;
}

function createGreenScreenVehicle(vehicleHash, vehicleModel) {
	return new Promise(async(resolve, reject) => {
		if (config.debug) console.log(`DEBUG: Spawning Vehicle ${vehicleModel}`);
		const timeout = setTimeout(() => {
			resolve(null);
		}, config.vehicleSpawnTimeout)
		if (!HasModelLoaded(vehicleHash)) {
			RequestModel(vehicleHash);
			while (!HasModelLoaded(vehicleHash)) {
				await Delay(100);
			}
		}
		const vehicle = CreateVehicle(vehicleHash, config.greenScreenVehiclePosition.x, config.greenScreenVehiclePosition.y, config.greenScreenVehiclePosition.z, 0, true, true);
		if (vehicle === 0) {
			clearTimeout(timeout);
			resolve(null);
		}
		clearTimeout(timeout);
		resolve(vehicle);
	});
}


RegisterCommand('screenshot', async (source, args) => {
	const modelHashes = [GetHashKey('mp_f_freemode_01'),GetHashKey('mp_m_freemode_01')];

	SendNUIMessage({
		start: true,
	});

	if (!stopWeatherResource()) return;

	DisableIdleCamera(true);


	await Delay(100);

	for (const modelHash of modelHashes) {
		if (IsModelValid(modelHash)) {
			if (!HasModelLoaded(modelHash)) {
				RequestModel(modelHash);
				while (!HasModelLoaded(modelHash)) {
					await Delay(100);
				}
			}

			SetPlayerModel(playerId, modelHash);
			await Delay(150);
			SetModelAsNoLongerNeeded(modelHash);

			await Delay(150);

			ped = PlayerPedId();

			const pedType = modelHash === GetHashKey('mp_m_freemode_01') ? 'male' : 'female';
			SetEntityRotation(ped, config.greenScreenRotation.x, config.greenScreenRotation.y, config.greenScreenRotation.z, 0, false);
			SetEntityCoordsNoOffset(ped, config.greenScreenPosition.x, config.greenScreenPosition.y, config.greenScreenPosition.z, false, false, false);
			FreezeEntityPosition(ped, true);
			await Delay(50);
			SetPlayerControl(playerId, false);

			interval = setInterval(() => {
				ClearPedTasksImmediately(ped);
			}, 1);

			for (const type of Object.keys(config.cameraSettings)) {
				for (const stringComponent of Object.keys(config.cameraSettings[type])) {
					await ResetPedComponents();
					await Delay(150);
					const component = parseInt(stringComponent);
					if (type === 'CLOTHING') {
						const drawableVariationCount = GetNumberOfPedDrawableVariations(ped, component);
						for (let drawable = 0; drawable < drawableVariationCount; drawable++) {
							const textureVariationCount = GetNumberOfPedTextureVariations(ped, component, drawable);
							SendNUIMessage({
								type: config.cameraSettings[type][component].name,
								value: drawable,
								max: drawableVariationCount,
							});
							if (config.includeTextures) {
								for (let texture = 0; texture < textureVariationCount; texture++) {
									await LoadComponentVariation(ped, component, drawable, texture);
									await takeScreenshotForComponent(pedType, type, component, drawable, texture);
								}
							} else {
								await LoadComponentVariation(ped, component, drawable);
								await takeScreenshotForComponent(pedType, type, component, drawable);
							}
						}
					} else if (type === 'PROPS') {
						const propVariationCount = GetNumberOfPedPropDrawableVariations(ped, component);
						for (let prop = 0; prop < propVariationCount; prop++) {
							const textureVariationCount = GetNumberOfPedPropTextureVariations(ped, component, prop);
							SendNUIMessage({
								type: config.cameraSettings[type][component].name,
								value: prop,
								max: propVariationCount,
							});

							if (config.includeTextures) {
								for (let texture = 0; texture < textureVariationCount; texture++) {
									await LoadPropVariation(ped, component, prop, texture);
									await takeScreenshotForComponent(pedType, type, component, prop, texture);
								}
							} else {
								await LoadPropVariation(ped, component, prop);
								await takeScreenshotForComponent(pedType, type, component, prop);
							}
						}
					}
				}
			}
			SetModelAsNoLongerNeeded(modelHash);
			SetPlayerControl(playerId, true);
			FreezeEntityPosition(ped, false);
			clearInterval(interval);
		}
	}
	SetPedOnGround();
	startWeatherResource();
	SendNUIMessage({
		end: true,
	});
	DestroyAllCams(true);
	DestroyCam(cam, true);
	RenderScriptCams(false, false, 0, true, false, 0);
	camInfo = null;
	cam = null;
});

RegisterCommand('customscreenshot', async (source, args) => {

	const gender = args[0].toLowerCase();
	const componentName = args[1].toLowerCase();
	
	// Tìm component ID từ tên
	let component = null;
	for (const [id, name] of Object.entries(componentNames)) {
		if (name === componentName) {
			component = parseInt(id);
			break;
		}
	}
	
	if (component === null) {
		console.log(`ERROR: Invalid component name "${componentName}". Available: ${Object.values(componentNames).join(', ')}`);
		return;
	}
	
	// Tự động xác định CLOTHING hoặc PROPS dựa vào component ID
	let type;
	if (component === 0 || component === 1 || component === 2 || component === 6 || component === 7) {
		type = 'PROPS';
	} else {
		type = 'CLOTHING';
	}
	
	let drawable = args[2].toLowerCase() == 'all' ? args[2].toLowerCase() : parseInt(args[2]);
	let prop = args[2].toLowerCase() == 'all' ? args[2].toLowerCase() : parseInt(args[2]);
	let cameraSettings;


	let modelHashes;

	if (gender == 'male') {
		modelHashes = [GetHashKey('mp_m_freemode_01')];
	} else if (gender == 'female') {
		modelHashes = [GetHashKey('mp_f_freemode_01')];
	} else {
		modelHashes = [GetHashKey('mp_m_freemode_01'), GetHashKey('mp_f_freemode_01')];
	}

	if (args[3] != null) {
		let cameraSettings = ''
		for (let i = 3; i < args.length; i++) {
			cameraSettings += args[i] + ' ';
		}

		cameraSettings = JSON.parse(cameraSettings);
	}


	if (!stopWeatherResource()) return;

	DisableIdleCamera(true);


	await Delay(100);

	for (const modelHash of modelHashes) {
		if (IsModelValid(modelHash)) {
			if (!HasModelLoaded(modelHash)) {
				RequestModel(modelHash);
				while (!HasModelLoaded(modelHash)) {
					await Delay(100);
				}
			}

			SetPlayerModel(playerId, modelHash);
			await Delay(150);
			SetModelAsNoLongerNeeded(modelHash);

			await Delay(150);

			ped = PlayerPedId();

			interval = setInterval(() => {
				ClearPedTasksImmediately(ped);
			}, 1);

			const pedType = modelHash === GetHashKey('mp_m_freemode_01') ? 'male' : 'female';
			SetEntityRotation(ped, config.greenScreenRotation.x, config.greenScreenRotation.y, config.greenScreenRotation.z, 0, false);
			SetEntityCoordsNoOffset(ped, config.greenScreenPosition.x, config.greenScreenPosition.y, config.greenScreenPosition.z, false, false, false);
			FreezeEntityPosition(ped, true);
			await Delay(50);
			SetPlayerControl(playerId, false);

			ResetPedComponents();
			await Delay(150);

			if (drawable == 'all') {
				SendNUIMessage({
					start: true,
				});
				if (type === 'CLOTHING') {
					const drawableVariationCount = GetNumberOfPedDrawableVariations(ped, component);
					for (drawable = 0; drawable < drawableVariationCount; drawable++) {
						const textureVariationCount = GetNumberOfPedTextureVariations(ped, component, drawable);
						SendNUIMessage({
							type: config.cameraSettings[type][component].name,
							value: drawable,
							max: drawableVariationCount,
						});
						if (config.includeTextures) {
							for (let texture = 0; texture < textureVariationCount; texture++) {
								await LoadComponentVariation(ped, component, drawable, texture);
								await takeScreenshotForComponent(pedType, type, component, drawable, texture, cameraSettings);
							}
						} else {
							await LoadComponentVariation(ped, component, drawable);
							await takeScreenshotForComponent(pedType, type, component, drawable, null, cameraSettings);
						}
					}
				} else if (type === 'PROPS') {
					const propVariationCount = GetNumberOfPedPropDrawableVariations(ped, component);
					for (prop = 0; prop < propVariationCount; prop++) {
						const textureVariationCount = GetNumberOfPedPropTextureVariations(ped, component, prop);
						SendNUIMessage({
							type: config.cameraSettings[type][component].name,
							value: prop,
							max: propVariationCount,
						});

						if (config.includeTextures) {
							for (let texture = 0; texture < textureVariationCount; texture++) {
								await LoadPropVariation(ped, component, prop, texture);
								await takeScreenshotForComponent(pedType, type, component, prop, texture, cameraSettings);
							}
						} else {
							await LoadPropVariation(ped, component, prop);
							await takeScreenshotForComponent(pedType, type, component, prop, null, cameraSettings);
						}
					}
				}
			} else if (!isNaN(drawable)) {
				if (type === 'CLOTHING') {
					const textureVariationCount = GetNumberOfPedTextureVariations(ped, component, drawable);

					if (config.includeTextures) {
						for (let texture = 0; texture < textureVariationCount; texture++) {
							await LoadComponentVariation(ped, component, drawable, texture);
							await takeScreenshotForComponent(pedType, type, component, drawable, texture, cameraSettings);
						}
					} else {
						await LoadComponentVariation(ped, component, drawable);
						await takeScreenshotForComponent(pedType, type, component, drawable, null, cameraSettings);
					}
				} else if (type === 'PROPS') {
					const textureVariationCount = GetNumberOfPedPropTextureVariations(ped, component, prop);

					if (config.includeTextures) {
						for (let texture = 0; texture < textureVariationCount; texture++) {
							await LoadPropVariation(ped, component, prop, texture);
							await takeScreenshotForComponent(pedType, type, component, prop, texture, cameraSettings);
						}
					} else {
						await LoadPropVariation(ped, component, prop);
						await takeScreenshotForComponent(pedType, type, component, prop, null, cameraSettings);
					}
				}
			}
			SetPlayerControl(playerId, true);
			FreezeEntityPosition(ped, false);
			clearInterval(interval);
		}
	}
	SetPedOnGround();
	startWeatherResource();
	SendNUIMessage({
		end: true,
	});
	DestroyAllCams(true);
	DestroyCam(cam, true);
	RenderScriptCams(false, false, 0, true, false, 0);
	camInfo = null;
	cam = null;
});

RegisterCommand('screenshotobject', async (source, args) => {
	let modelHash = isNaN(Number(args[0])) ? GetHashKey(args[0]) : Number(args[0]);
	const ped = GetPlayerPed(-1);

	if (IsWeaponValid(modelHash)) {
		modelHash = GetWeapontypeModel(modelHash);
	}

	if (!stopWeatherResource()) return;

	DisableIdleCamera(true);

	await Delay(100);

	if (IsModelValid(modelHash)) {
		if (!HasModelLoaded(modelHash)) {
			RequestModel(modelHash);
			while (!HasModelLoaded(modelHash)) {
				await Delay(100);
			}
		}
	} else {
		console.log('ERROR: Invalid model');
		return;
	}

	// Tự động nhận biết loại model
	let entityType = 'object'; // default
	let entity;
	
	if (IsModelAVehicle(modelHash)) {
		entityType = 'vehicle';
		entity = CreateVehicle(modelHash, config.greenScreenPosition.x, config.greenScreenPosition.y, config.greenScreenPosition.z, 0, true, true);
		SetEntityRotation(entity, config.greenScreenVehicleRotation.x, config.greenScreenVehicleRotation.y, config.greenScreenVehicleRotation.z, 0, false);
		if (config.debug) console.log(`DEBUG: Detected vehicle model: ${modelHash}`);
	} else {
		entityType = 'object';
		entity = CreateObjectNoOffset(modelHash, config.greenScreenPosition.x, config.greenScreenPosition.y, config.greenScreenPosition.z, false, true, true);
		SetEntityRotation(entity, config.greenScreenRotation.x, config.greenScreenRotation.y, config.greenScreenRotation.z, 0, false);
		if (config.debug) console.log(`DEBUG: Detected object model: ${modelHash}`);
	}

	SetEntityCoords(ped, config.greenScreenHiddenSpot.x, config.greenScreenHiddenSpot.y, config.greenScreenHiddenSpot.z, false, false, false);
	SetPlayerControl(playerId, false);

	FreezeEntityPosition(entity, true);
	await Delay(50);

	await takeScreenshotForObject(entity, modelHash, entityType);

	DeleteEntity(entity);
	SetPlayerControl(playerId, true);
	SetModelAsNoLongerNeeded(modelHash);
	startWeatherResource();
	DestroyAllCams(true);
	DestroyCam(cam, true);
	RenderScriptCams(false, false, 0, true, false, 0);
	cam = null;
});




setImmediate(() => {
	emit('chat:addSuggestions', [
		{
			name: '/screenshot',
			help: 'generate clothing screenshots',
		},
		{
			name: '/customscreenshot',
			help: 'generate custom clothing screenshots (auto-detects CLOTHING/PROPS)',
			params: [
				{name:"male/female/both", help:"The gender to take a screenshot of"},
				{name:"component_name", help:`Component name: ${Object.values(componentNames).join(', ')}`},
				{name:"drawable/all", help:"The drawable variation to take a screenshot of"},
				{name:"camera settings", help:"The camera settings to use for the screenshot (optional)"},
			]
		},
		{
			name: '/screenshotobject',
			help: 'generate object/vehicle screenshots (auto-detects type)',
			params: [
				{name:"model", help:"The object/vehicle hash or model name to take a screenshot of"},
			]
		}
	])
  });

on('onResourceStop', (resName) => {
	if (GetCurrentResourceName() != resName) return;

	startWeatherResource();
	clearInterval(interval);
	SetPlayerControl(playerId, true);
	FreezeEntityPosition(ped, false);
});
