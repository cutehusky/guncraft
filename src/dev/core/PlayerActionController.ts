enum ActionState {
	none,
	autoShooting,
	semiAutoShooting,
	burstShooting,
	modifying,
	reloading,
	sfChanging
}

class PlayerActionController {
	uid: number;
	GunData: Guncraft.GunParam;
	currentSlotIndex: number;

	kexPlayer: KEX.Player;
	client: NetworkClient;
	timeout: number;
	actionState: ActionState;
	isAim: boolean;
	isSecMode: boolean;
	burstCount: number;
	emptySound: boolean;

	// reload
	taskName: string;
	reloadItem: ItemInstance;
	reloadMagArr: NBT.ListTag;

	// mag
	currentBulletCount: number;
	maxBulletCount: number;
	magArr: string[];

	// attachment
	fov: number;
	mode: number;
	newSound: string;
	secMode: boolean;
	recoilCoefficient: number;
	accuracyCoefficient: number;

	// animation
	attachmentID: number;
	stateID: number;
	carryingMagID: number;
	updateAnimationTimeout: number;

	constructor(uid: number, item: ItemInstance, gun: Guncraft.GunParam, currentSlot: number) {
		this.currentSlotIndex = currentSlot;
		this.actionState = ActionState.none;
		this.taskName = "";
		this.updateAnimationTimeout = UpdateAnimationTimeout;
		this.stateID = 0;
		this.uid = uid;
		this.timeout = 0;
		this.burstCount = 0;
		this.isAim = false;
		this.isSecMode = false;
		this.emptySound = false;
		this.GunData = gun;
		this.currentBulletCount = item.extra.getInt("currentBulletCount", 0);
		this.maxBulletCount = item.extra.getInt("maxBulletCount", 0);
		this.magArr = GuncraftUtil.getInventorySlotCompoundTag(this.uid, this.currentSlotIndex).getListTag("magArr").toScriptable();
		this.fov = item.extra.getInt("fov", 0);
		this.mode = item.extra.getInt("mode", 0);
		this.newSound = item.extra.getString("newSound", null);
		this.secMode = item.extra.getBoolean("secMode", false);
		this.recoilCoefficient = item.extra.getFloat("recoilCoefficient", 1);
		this.accuracyCoefficient = item.extra.getFloat("accuracyCoefficient", 1);
		this.attachmentID = item.extra.getInt("attachmentID");
		this.carryingMagID = 0;
		this.kexPlayer = new KEX.Player(this.uid);
		this.client = Network.getClientForPlayer(this.uid);
		this.carryAnimation();
		this.client.send("Guncraft.openUI", {
			name: "fire"
		});
		this.updateClient();
	}

	destructor(): void {
		this.client.send("Guncraft.resetFov", {})
		let player = this.kexPlayer;
		player.setSkinID(0);
		player.setVariant(0);
		this.client.send("Guncraft.closeUI", {
			name: "fire"
		});
		this.client.send("Guncraft.closeUI", {
			name: "modify"
		});
		if (this.reloadItem) {
			if (this.reloadMagArr) {
				let tag = new NBT.CompoundTag();
				tag.putListTag("magArr", this.reloadMagArr);
				// @ts-ignore
				this.reloadItem.extra.setCompoundTag(tag);
			}
			player.addItemToInventory(this.reloadItem.id,
				this.reloadItem.count, this.reloadItem.data,
				this.reloadItem.extra);
		}
	}

	updateClient(): void {
		let text = "",
			color = android.graphics.Color.WHITE;
		if (this.actionState == ActionState.reloading) {
			text = Translation.translate("reloading...");
			color = android.graphics.Color.YELLOW;
		} else if (this.actionState == ActionState.sfChanging) {
			text = Translation.translate("changing...");
			color = android.graphics.Color.YELLOW;
		} else {
			text = this.currentBulletCount + " | " + this.maxBulletCount + " - "
				+ (modeName[this.mode] || ModeName(this.mode));
			if (this.maxBulletCount == 0
				|| this.currentBulletCount / this.maxBulletCount < 0.2)
				color = android.graphics.Color.RED;
		}
		this.client.send("Guncraft.display", {
			text: text,
			color: color
		});
	}

	updateItem(): void {
		let player = new PlayerActor(this.uid),
			gunItem = player.getInventorySlot(this.currentSlotIndex),
			tag = GuncraftUtil.getInventorySlotCompoundTag(this.uid,
				this.currentSlotIndex);
		// @ts-ignore
		gunItem.extra.setCompoundTag(tag);
		gunItem.extra.putInt("currentBulletCount", Number(this.currentBulletCount));
		player.setInventorySlot(this.currentSlotIndex, gunItem.id, gunItem.count
			, gunItem.data, gunItem.extra);
	}

	shot(): boolean {
		let uid = this.uid,
			Gun = this.GunData;
		if (this.currentBulletCount <= 0)
			return false;
		// @ts-ignore
		let bullet = Guncraft.getBullet(this.magArr[this.currentBulletCount - 1]),
			pp = Entity.getPosition(uid);
		GuncraftUtil.playSound(pp, this.newSound || Gun.fireSound);
		Commands.execAt("camerashake add @p "
			+ String(Gun.recoil * this.recoilCoefficient * bullet.recoilCoefficient)
			+ " 0.2 rotational", pp.x, pp.y, pp.z);
		(Gun.type != Guncraft.GunType.SHOTGUN)
			? shotSingleBullet(Gun, bullet, uid, pp, this.accuracyCoefficient)
			: shotShotgun(Gun, bullet, uid, pp, this.accuracyCoefficient);
		this.currentBulletCount--;
		if (!this.currentBulletCount && !Gun.slideStop)
			this.emptySound = true;
		return true;
	}

	secModeShot(): boolean {
		//coming soon
		return false
	}

	secModeReload(): void {
		//coming soon
	}

	sf(): void {
		this.carryAnimation();
		this.client.send("Guncraft.resetFov", {});
		this.isAim = false;
		this.changeSelectiveFireAnimation();
		this.taskName = "_sf";
		this.timeout = this.GunData.timeout.sf;
		this.actionState = ActionState.sfChanging;
	}

	_sf(): void {
		this.carryAnimation();
		let nmode = this.GunData.mode,
			player = new PlayerActor(this.uid),
			gunItem = player.getInventorySlot(this.currentSlotIndex);

		if (!gunItem.extra)
			return;
		if (this.mode) {
			for (let i: number = 0; i < nmode.length; i++) {
				if (this.mode == nmode[i]) {
					this.mode = nmode[i + 1] || 0;
					break;
				}
			}
		} else
			this.mode = nmode[0];
		gunItem.extra.putInt("mode", this.mode);
		let tag = GuncraftUtil.getInventorySlotCompoundTag(this.uid, this.currentSlotIndex);
		// @ts-ignore
		gunItem.extra.setCompoundTag(tag);
		player.setInventorySlot(this.currentSlotIndex
			, gunItem.id, gunItem.count, gunItem.data, gunItem.extra);
	}

	getMagInInventory(player: PlayerActor): number {
		let GunData = this.GunData,
			magId = GunData.mag;
		for (let i = 0; i <= 35; i++) {
			let slot = player.getInventorySlot(i);
			for (let k: number = 0; k < magId.length; k++) {
				if (slot.id == ItemID[magId[k]]
					&& slot.extra
					&& slot.extra.getInt("currentBulletCount", 0)
					&& slot.extra.getString("bulletParent", null) == GunData.bulletName)
					return i;
			}
		}
		return -1;
	}

	reloadMag(): void {
		this.client.send("Guncraft.resetFov", {});
		this.isAim = false;
		this.carryAnimation();
		let player = new PlayerActor(this.uid),
			gunItem = player.getInventorySlot(this.currentSlotIndex),
			targetSlotIndex = this.getMagInInventory(player);
		if (targetSlotIndex != -1) {
			this.reloadItem = player.getInventorySlot(targetSlotIndex);
			this.reloadMagArr = GuncraftUtil.getInventorySlotCompoundTag(this.uid, targetSlotIndex)
				.getListTag("magArr");
			this.taskName = "reload_1";
			player.setInventorySlot(targetSlotIndex, 0, 0, 0, null);
			let targetItemId = IDRegistry.getNameByID(this.reloadItem.id);
			if (gunItem.data) {
				let isMag = Guncraft.getMag(targetItemId).isMag,
					isMag2 = Guncraft.getMag(gunItem.extra.getString("mag")).isMag;
				if (this.currentBulletCount > 0) {
					if (isMag && isMag2) {
						this.timeout = this.GunData.timeout.mag2mag2;
						this.mag2mag2_reloadAnimation(targetItemId);
					} else if (!isMag && isMag2) {
						this.timeout = this.GunData.timeout.link2mag2;
						this.link2mag2_reloadAnimation(targetItemId);
					} else if (isMag && !isMag2) {
						this.timeout = this.GunData.timeout.mag2link2;
						this.mag2link2_reloadAnimation(targetItemId);
					} else {
						this.timeout = this.GunData.timeout.link2link2;
						this.link2link2_reloadAnimation(targetItemId);
					}
				} else {
					if (isMag && isMag2) {
						this.mag2mag_reloadAnimation(targetItemId);
						this.timeout = this.GunData.timeout.mag2mag;
					} else if (!isMag && isMag2) {
						this.timeout = this.GunData.timeout.link2mag;
						this.link2mag_reloadAnimation(targetItemId);
					} else if (isMag && !isMag2) {
						this.timeout = this.GunData.timeout.mag2link;
						this.mag2link_reloadAnimation(targetItemId);
					} else {
						this.timeout = this.GunData.timeout.link2link;
						this.link2link_reloadAnimation(targetItemId);
					}
				}
			} else {
				let isMag = Guncraft.getMag(targetItemId).isMag;
				if (isMag) {
					this.loadMag_reloadAnimation(targetItemId);
					this.timeout = this.GunData.timeout.loadMag;
				} else {
					this.loadLink_reloadAnimation(targetItemId);
					this.timeout = this.GunData.timeout.loadLink;
				}
			}
		} else {
			if (!gunItem.data)
				return;
			this.taskName = "reload_0";
			this.reloadItem = null;
			this.reloadMagArr = null;
			let isMag2 = Guncraft.getMag(gunItem.extra.getString("mag")).isMag;
			if (this.currentBulletCount > 0) {
				if (isMag2) {
					this.unloadMag2_reloadAnimation();
					this.timeout = this.GunData.timeout.unloadMag2;
				} else {
					this.unloadLink2_reloadAnimation();
					this.timeout = this.GunData.timeout.unloadLink2;
				}
			} else {
				if (isMag2) {
					this.unloadMag_reloadAnimation();
					this.timeout = this.GunData.timeout.unloadMag;
				} else {
					this.unloadLink_reloadAnimation();
					this.timeout = this.GunData.timeout.unloadLink;
				}
			}
		}
		this.actionState = ActionState.reloading;
		this.emptySound = false;
	}

	reloadBullet(): void {
		//coming soon
	}

	reload_1(): void {
		let player: PlayerActor = new PlayerActor(this.uid),
			gunItem: ItemInstance = player.getInventorySlot(this.currentSlotIndex);
		let add = gunItem.data ? this.unloadMag(gunItem.extra, player,
			this.GunData.saveBullet, true) : null;
		this.loadMag(gunItem.extra, add, gunItem.id, this.reloadItem,
			this.reloadMagArr, player);
		this.reloadItem = null;
		this.reloadMagArr = null;
	}

	reload_0(): void {
		let player = new PlayerActor(this.uid),
			gunItem = player.getInventorySlot(this.currentSlotIndex);
		this.unloadMag(gunItem.extra, player, this.GunData.saveBullet);
		gunItem.extra.putString("mag", null);
		gunItem.extra.putInt("currentBulletCount", 0);
		gunItem.extra.putInt("maxBulletCount", 0);
		gunItem.extra.putString("bulletParent", null);
		let tag = new NBT.CompoundTag();
		tag.putListTag("magArr", new NBT.ListTag());
		//@ts-ignore
		gunItem.extra.setCompoundTag(tag);
		this.attachmentID = Math.floor(this.attachmentID / 100) * 100;
		gunItem.extra.putInt("attachmentID", this.attachmentID);
		player.setInventorySlot(this.currentSlotIndex,
			gunItem.id, gunItem.count, 0, gunItem.extra);
		this.currentBulletCount = 0;
		this.carryingMagID = 0;
		this.maxBulletCount = 0;
		this.emptySound = true;
	}

	unloadMag(gunExtraData: ItemExtraData, player: PlayerActor, saveBullet: boolean
		, b?: boolean): string {
		let extra = new ItemExtraData(),
			magArr = GuncraftUtil.getInventorySlotCompoundTag(this.uid, this.currentSlotIndex)
				.getListTag("magArr");
		if (this.currentBulletCount > 1
			|| (this.currentBulletCount > 0 && !saveBullet)) {
			let tag: NBT.CompoundTag = new NBT.CompoundTag();
			tag.putListTag("magArr", magArr);
			//@ts-ignore
			extra.setCompoundTag(tag);
			extra.putInt("maxBulletCount", this.maxBulletCount);
			extra.putString("bulletParent", gunExtraData.getString("bulletParent"));
			if (saveBullet) {
				extra.putInt("currentBulletCount", this.currentBulletCount - 1);
				let scale = Math.round(((this.maxBulletCount - this.currentBulletCount + 1)
					/ this.maxBulletCount * 100) + 1);
				player.addItemToInventory(ItemID[gunExtraData.getString("mag")],
					1, scale, extra, true);
				if (!b)
					player.addItemToInventory(ItemID[magArr.getString(this.currentBulletCount - 1)], 1, 0, null, false);
				else
					return magArr.getString(this.currentBulletCount - 1);
			} else {
				extra.putInt("currentBulletCount", this.currentBulletCount);
				let scale = Math.round(((this.maxBulletCount - this.currentBulletCount)
					/ this.maxBulletCount * 100) + 1);
				player.addItemToInventory(ItemID[gunExtraData.getString("mag")],
					1, scale, extra, true);
			}
		} else {
			extra.putInt("currentBulletCount", 0);
			extra.putInt("maxBulletCount", 0);
			extra.putString("bulletParent", null);
			let tag = new NBT.CompoundTag();
			tag.putListTag("magArr", new NBT.ListTag());
			// @ts-ignore
			extra.setCompoundTag(tag);
			player.addItemToInventory(ItemID[gunExtraData.getString("mag")],
				1, 101, extra, true);
			if (this.currentBulletCount) {
				if (!b)
					player.addItemToInventory(ItemID[magArr.getString(0)], 1, 0, null, false);
				else
					return magArr.getString(0);
			}
		}
		return null;
	}

	loadMag(gunExtra: ItemExtraData, add: string,
		gunId: number, slot: ItemInstance, magArr: NBT.ListTag
		, player: PlayerActor): void {
		let bulletCountMax = slot.extra.getInt("maxBulletCount"),
			bulletCount = slot.extra.getInt("currentBulletCount");
		gunExtra.putInt("maxBulletCount", bulletCountMax);
		if (add) {
			magArr.putString(bulletCount, add);
			bulletCount++;
		}
		gunExtra.putInt("currentBulletCount", bulletCount);
		gunExtra.putString("mag", IDRegistry.getNameByID(slot.id));
		gunExtra.putString("bulletParent", slot.extra.getString("bulletParent"));
		let tag: NBT.CompoundTag = new NBT.CompoundTag();
		tag.putListTag("magArr", magArr);
		// @ts-ignore
		gunExtra.setCompoundTag(tag);
		this.maxBulletCount = bulletCountMax;
		this.currentBulletCount = bulletCount;
		this.attachmentID = Math.floor(this.attachmentID / 100) * 100
			+ (this.GunData.mag.indexOf(IDRegistry.getNameByID(slot.id)) + 1) * 10;
		gunExtra.putInt("attachmentID", this.attachmentID);
		this.carryingMagID = 0;
		this.magArr = magArr.toScriptable();
		player.setInventorySlot(this.currentSlotIndex, gunId, 1, 1, gunExtra);
	}

	updatePlayerAnimation(): void {
		let player = this.kexPlayer;
		if (this.updateAnimationTimeout > 0) {
			this.updateAnimationTimeout--;
			return;
		}
		this.updateAnimationTimeout = UpdateAnimationTimeout;
		player.setVariant(this.attachmentID);
	}

	animationTransition(state: number): void {
		let player = this.kexPlayer;
		this.stateID = state;
		player.setVariant(this.attachmentID);
		player.setSkinID(state * 100 + this.carryingMagID);
	}

	fireAnimation(): void {
		let player = this.kexPlayer;
		if (this.actionState >= ActionState.autoShooting
			&& this.actionState <= ActionState.burstShooting)
			player.setSkinID(10000 + this.stateID * 100);
		else
			player.setSkinID(this.stateID * 100);
	}

	unloadMag_reloadAnimation(): void {
		this.carryingMagID = 0;
		this.animationTransition(2);
	}

	unloadMag2_reloadAnimation(): void {
		this.carryingMagID = 0;
		this.animationTransition(3);
	}

	unloadLink_reloadAnimation(): void {
		this.carryingMagID = 0;
		this.animationTransition(14);
	}

	unloadLink2_reloadAnimation(): void {
		this.carryingMagID = 0;
		this.animationTransition(15);
	}

	loadMag_reloadAnimation(mag: string): void {
		this.carryingMagID = this.GunData.mag.indexOf(mag) + 1;
		this.animationTransition(2);
	}

	loadLink_reloadAnimation(mag: string): void {
		this.carryingMagID = this.GunData.mag.indexOf(mag) + 1;
		this.animationTransition(3);
	}

	mag2mag_reloadAnimation(mag: string): void {
		this.carryingMagID = this.GunData.mag.indexOf(mag) + 1;
		this.animationTransition(2);
	}

	mag2mag2_reloadAnimation(mag: string): void {
		this.carryingMagID = this.GunData.mag.indexOf(mag) + 1;
		this.animationTransition(3);
	}

	link2mag_reloadAnimation(mag: string): void {
		this.carryingMagID = this.GunData.mag.indexOf(mag) + 1;
		this.animationTransition(10);
	}

	link2mag2_reloadAnimation(mag: string): void {
		this.carryingMagID = this.GunData.mag.indexOf(mag) + 1;
		this.animationTransition(11);
	}

	mag2link_reloadAnimation(mag: string): void {
		this.carryingMagID = this.GunData.mag.indexOf(mag) + 1;
		this.animationTransition(12);
	}

	mag2link2_reloadAnimation(mag: string): void {
		this.carryingMagID = this.GunData.mag.indexOf(mag) + 1;
		this.animationTransition(13);
	}

	link2link_reloadAnimation(mag: string): void {
		this.carryingMagID = this.GunData.mag.indexOf(mag) + 1;
		this.animationTransition(14);
	}

	link2link2_reloadAnimation(mag: string): void {
		this.carryingMagID = this.GunData.mag.indexOf(mag) + 1;
		this.animationTransition(15);
	}

	carryAnimation(): void {
		this.animationTransition(5);
	}

	aimAnimation(): void {
		this.animationTransition(1);
	}

	changeSelectiveFireAnimation(): void {
		this.animationTransition(4);
	}

	secondModeAimAnimation(): void {
		this.animationTransition(7);
	}

	secondModeReloadAnimation(): void {
		this.animationTransition(8);
	}

	secondModeFireAnimation(): void {
		this.animationTransition(9);
	}

	getAttachmentInSlot(type: string, player: PlayerActor, slotIndex: number)
		: { index: number, data: Guncraft.AttachmentParam, slotIndex: number } {
		let slot = player.getInventorySlot(slotIndex),
			attachmentID = IDRegistry.getNameByID(slot.id),
			attachmentData = Guncraft.getAttachment(attachmentID);
		if (attachmentData) {
			if (attachmentData.type == type) {
				let index = this.GunData.attachment[type].indexOf(attachmentID);
				if (index != -1) {
					return {
						index: index,
						data: attachmentData,
						slotIndex: slotIndex
					};
				}
			}
		}
		return null;
	}

	getAttachmentInInventory(type: string, player: PlayerActor)
		: { index: number, data: Guncraft.AttachmentParam, slotIndex: number } {
		for (let i = 0; i <= 35; i++) {
			let res = this.getAttachmentInSlot(type, player, i);
			if (res)
				return res;
		}
		return null;
	}

	modify(type: string): void {
		let player = new PlayerActor(this.uid),
			data = this.getAttachmentInInventory(type, player),
			GunData = this.GunData;
		if (!data) {
			data = {
				data: {
					type: '',
					fov: 0,
					accuracyCoefficient: 0,
					recoilCoefficient: 0,
					sound: null,
					secMode: false,
				},
				slotIndex: -1,
				index: -1
			};
		}
		let Gun: ItemInstance = player.getInventorySlot(this.currentSlotIndex),
			old: number = Gun.extra.getInt(type, 0),
			oldData1: number = 0,
			oldData2: number = 0;
		if (data.slotIndex != -1)
			if (old)
				player.setInventorySlot(data.slotIndex,
					ItemID[GunData.attachment[type][old - 1]], 1, 0, null)
			else
				player.setInventorySlot(data.slotIndex, 0, 0, 0, null);
		else if (old)
			player.addItemToInventory(ItemID[GunData.attachment[type][old - 1]], 1, 0, null, false);
		Gun.extra.putInt(type, data.index + 1);
		this.attachmentID = Gun.extra.getInt("reargrip", 0) * 100000000
			+ Gun.extra.getInt("barrel", 0)
			+ Gun.extra.getInt("laser", 0) * 10000000
			+ Gun.extra.getInt("stock", 0) * 1000000
			+ Gun.extra.getInt("muzzle", 0) * 100000
			+ Gun.extra.getInt("optic", 0) * 10000
			+ Gun.extra.getInt("underbarrel", 0) * 1000
			+ (GunData.mag.indexOf(Gun.extra.getString("mag") + "") + 1) * 10;
		Gun.extra.putInt("attachmentID", this.attachmentID);
		switch (type) {
			case "optic":
				Gun.extra.putInt("fov", data.data.fov);
				break;
			case "underbarrel":
			case "muzzle":
				if (type == "underbarrel")
					(data.data.secMode)
						? Gun.extra.putBoolean("secMode", true)
						: Gun.extra.putBoolean("secMode", false);
				else
					(data.data.sound)
						? Gun.extra.putString("newSound", data.data.sound)
						: Gun.extra.putString("newSound", null);
			default:
				if (old) {
					let oAttachment = Guncraft.getAttachment(
						GunData.attachment[type][old - 1]);
					oldData1 = oAttachment.recoilCoefficient / 100;
					oldData2 = oAttachment.accuracyCoefficient / 100;
				}
				Gun.extra.putFloat("recoilCoefficient",
					Gun.extra.getFloat("recoilCoefficient")
					+ oldData1 - (data.data.recoilCoefficient / 100));
				Gun.extra.putFloat("accuracyCoefficient",
					Gun.extra.getFloat("accuracyCoefficient")
					+ oldData2 - (data.data.accuracyCoefficient / 100));
				break;
		}
		let tag = GuncraftUtil.getInventorySlotCompoundTag(this.uid, this.currentSlotIndex);
		// @ts-ignore
		Gun.extra.setCompoundTag(tag);
		player.setInventorySlot(this.currentSlotIndex, Gun.id, 1, Gun.data, Gun.extra);
		this.modifyAnimation();
	}

	modifyAnimation(): void {
		let player = this.kexPlayer;
		player.setSkinID(600);
		player.setVariant(this.attachmentID);
	}
}
