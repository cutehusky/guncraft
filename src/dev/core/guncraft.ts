namespace Guncraft {

	export interface ArmorParam {
		type: ArmorType,
		level: ArmorLevel
	}

	export interface GunParam {
		type: GunType,
		saveBullet: boolean,
		slideStop: boolean,
		recoil: number,
		accuracy: number,
		mag: string[],
		fireSound: string,
		bulletName: string,
		damCoefficient?: number,
		APCoefficient?: number,
		speedCoefficient?: number,
		mode?: number[], // 1: auto, 2: semi-auto, >=3: mode - 1 burst
		bulletType?: Native.EntityType | number,
		attachment: GunAttachment,
		timeout: Timeout,
		shotTimeout: ShotTimeout
	}

	export interface GunAttachment {
		muzzle: string[],
		underbarrel: string[],
		stock: string[],
		optic: string[],
		laser: string[],
		reargrip: string[],
		barrel: string[]
	}

	export interface MagParam {
		bulletName: string[],
		isMag: boolean, // true is mag, false is link
		bulletMaxCount: number[]
	}

	export interface BulletParam {
		parent: string,
		type: BulletEffect,
		damage: number,
		ap: number,
		speed: number,
		recoilCoefficient: number,
		accuracyCoefficient: number,
		shotgunDegreesSpread?: number,
		shotgunCount?: number
	}

	export interface AttachmentParam {
		type: string,
		fov?: number,
		accuracyCoefficient?: number,
		recoilCoefficient?: number,
		sound?: string,
		secMode?: boolean,
		secModeParam?: SecModeParam
	}

	export interface SecModeParam {

	}

	export interface Timeout {
		loadMag?: number,
		loadLink?: number,
		link2mag?: number,
		link2mag2?: number,
		unloadMag?: number,
		unloadMag2?: number,
		unloadLink?: number,
		unloadLink2?: number,
		mag2mag?: number,
		mag2mag2?: number,
		link2link?: number,
		link2link2?: number,
		mag2link?: number,
		mag2link2?: number,
		sf?: number
	}

	export interface ShotTimeout {
		auto?: number,
		semi_auto?: number,
		afterBurst?: number,
		burst?: number
	}

	export enum GunType {
		RIFLE = 0,
		SUBMACHINEGUN = 1,
		PISTOL = 2,
		MACHINEGUN = 3,
		ASSAULTRIFLE = 4,
		SNIPERRIFLE = 5,
		SHOTGUN = 7,
		DMR = 9,
		ROCKETLAUNCHER = 10,
		GRENADELAUNCHER = 11,
		FLAMETHROWER = 12
	}

	export enum ArmorLevel {
		NIJI = 1,
		NIJII = 2,
		NIJIIIA = 3,
		NIJIII = 4,
		NIJIV = 5
	}

	export enum BulletEffect {
		NORMAL = 0,
		INCENDIARY = 1,
		TRACER = 2,
		EXPLODE = 3,
		INCENDIARYTRACER = 4,
		SUBSONIC = 5
	}

	const gunData = {}

	const bulletData = {}

	const attachmentData = {}

	const magData = {}

	const armorData = {}

	export function createGun(id: string, name: string, param: GunParam, texture?: Item.TextureData): void {
		IDRegistry.genItemID(id);
		Item.createItem(id, name, texture || {
			name: id,
			meta: 0
		}, {
			isTech: true,
			stack: 1
		});
		ItemModel.getFor(ItemID[id], 0).setHandModel(new RenderMesh());
		ItemModel.getFor(ItemID[id], 1).setHandModel(new RenderMesh());
		let extra = new ItemExtraData(),
			tag = new NBT.CompoundTag();
		tag.putListTag("magArr", new NBT.ListTag());
		// @ts-ignore
		extra.setCompoundTag(tag);
		extra.putString("mag", null);
		extra.putString("bulletParent", null);
		extra.putInt("mode", 0);
		extra.putInt("currentBulletCount", 0);
		extra.putInt("maxBulletCount", 0);
		extra.putInt("attachmentID", 0);
		extra.putInt("reargrip", 0);
		extra.putInt("laser", 0);
		extra.putInt("barrel", 0);
		extra.putInt("optic", 0);
		extra.putInt("stock", 0);
		extra.putInt("underbarrel", 0);
		extra.putInt("muzzle", 0);
		extra.putInt("fov", 0);
		extra.putFloat("accuracyCoefficient", 1);
		extra.putFloat("recoilCoefficient", 1);
		extra.putBoolean("secMode", false);
		extra.putString("newSound", null);
		Item.addToCreative(ItemID[id], 1, 0, extra);
		Item.setCategory(ItemID[id], 3);
		Item.setMaxUseDuration(ItemID[id], MaxUseDuration);
		param.mode = param.mode || [2];
		param.damCoefficient = param.damCoefficient || 1;
		param.APCoefficient = param.damCoefficient || 1;
		param.speedCoefficient = param.damCoefficient || 1;
		if (param.type == GunType.GRENADELAUNCHER)
			param.bulletType = param.bulletType || Native.EntityType.PRIMED_TNT;
		else if (param.type == GunType.FLAMETHROWER)
			param.bulletType = param.bulletType || Native.EntityType.SMALL_FIREBALL;
		else
			param.bulletType = param.bulletType || Native.EntityType.ARROW;
		gunData[id] = param;
	}

	export function createMag(id: string, name: string, param: MagParam, texture?: Item.TextureData): void {
		IDRegistry.genItemID(id);
		Item.createItem(id, name, texture || {
			name: id,
			meta: 0
		}, {
			isTech: true,
			stack: 1
		});
		let extra = new ItemExtraData();
		extra.putInt("maxBulletCount", 0);
		extra.putInt("currentBulletCount", 0);
		extra.putString("bulletParent", null);
		Item.setCategory(ItemID[id], 3);
		Item.setMaxDamage(ItemID[id], 100);
		Item.addToCreative(ItemID[id], 1, 101, extra);
		Item.setMaxUseDuration(ItemID[id], 50);
		Item.registerNameOverrideFunction(id, function (item: ItemInstance, name: string): string {
			return name + "\n§7" + item.extra.getInt("currentBulletCount") + "/" + item.extra.getInt("maxBulletCount") + " (" + item.extra.getString("bulletParent") + ")";
		});
		magData[id] = param;
	}

	export function createBullet(id: string, name: string, stack: number, param: BulletParam, texture?: Item.TextureData): void {
		IDRegistry.genItemID(id);
		Item.createItem(id, name, texture || {
			name: param.parent,
			meta: 0
		}, {
			isTech: false,
			stack: stack
		});
		bulletData[id] = param;
	}

	export function createAttachment(id: string, name: string, param: AttachmentParam, texture?: Item.TextureData): void {
		IDRegistry.genItemID(id);
		Item.createItem(id, name, texture || {
			name: id,
			meta: 0
		}, {
			isTech: false,
			stack: 1
		});
		Item.setCategory(ItemID[id], 3);
		Item.setMaxUseDuration(ItemID[id], 20);
		attachmentData[id] = param;
	}

	export function createArmor(id: string, name: string, param: ArmorParam, param_1: {
		knockbackResist: number,
		durability: number,
		armor: number
	}, texture?: Item.TextureData): void {
		IDRegistry.genItemID(id);
		Item.createArmorItem(id, name, texture || {
			name: id,
			meta: 0
		}, {
			type: param.type,
			texture: "armor/blank",
			knockbackResist: param_1.knockbackResist,
			durability: param_1.durability,
			armor: param_1.armor
		});
		armorData[id] = param;
	}

	export function getArmor(id: string): ArmorParam {
		if (armorData.hasOwnProperty(id))
			return armorData[id];
		else
			return null;
	}

	export function getGun(id: string): GunParam {
		if (gunData.hasOwnProperty(id))
			return gunData[id];
		else
			return null;
	}

	export function getMag(id: string): MagParam {
		if (magData.hasOwnProperty(id))
			return magData[id];
		else
			return null;
	}

	export function getBullet(id: string): BulletParam {
		if (bulletData.hasOwnProperty(id))
			return bulletData[id];
		else
			return null;
	}

	export function getAttachment(id: string): AttachmentParam {
		if (attachmentData.hasOwnProperty(id))
			return attachmentData[id];
		else
			return null;
	}
}
