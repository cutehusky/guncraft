Guncraft.createGun("hk416", "hk416", {
	slideStop: true,
	saveBullet: true,
	shotTimeout: {
		auto: 1,
		semi_auto: 2
	},
	accuracy: 7,
	recoil: 0.04,
	type: 4,
	mode: [1, 2],
	mag: ["STANAG"],
	bulletName: "5.56*45mm",
	attachment: {
		optic: [],
		muzzle: ["hk416_standard_muzzle"],
		underbarrel: [],
		barrel: [],
		reargrip: [],
		laser: [],
		stock: ["hk416_standard_stock"]
	},
	timeout: {
		loadMag: 2.4 * 20,
		unloadMag: 2.625 * 20,
		unloadMag2: 2.4375 * 20,
		mag2mag: 2.75 * 20,
		mag2mag2: 2.3 * 20,
		link2mag: 2 * 20,
		link2mag2: 2 * 20,
		sf: 0.85 * 20
	},
	fireSound: "guncraft.m4a1.fire"
});
