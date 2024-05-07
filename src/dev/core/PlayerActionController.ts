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
	gunData: Guncraft.GunParam;
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
	reloadMagItem: ItemInstance;
	reloadMagArr: NBT.ListTag;

	// mag
	currentBulletCount: number;
	maxBulletCount: number;
	magArr: string[];

	// attachment
	fov: number;
	mode: number;
	specialSound: string;
	secMode: boolean;
	recoilCoefficient: number;
	accuracyCoefficient: number;

	// animation
	attachmentIndexs: { [key: string]: number };
	updateAnimationTimeout: number;

	constructor(uid: number, item: ItemInstance, gunData: Guncraft.GunParam, currentSlotIndex: number) {
		this.currentSlotIndex = currentSlotIndex;
		this.actionState = ActionState.none;
		this.taskName = "";
		this.updateAnimationTimeout = UpdateAnimationTimeout;
		this.uid = uid;
		this.timeout = 0;
		this.burstCount = 0;
		this.isAim = false;
		this.isSecMode = false;
		this.emptySound = false;
		this.attachmentIndexs = {
			barrel: item.extra.getInt("barrel", 0),
			mag: gunData.mag.indexOf(item.extra.getString("mag") + "") + 1,
			reargrip: item.extra.getInt("reargrip", 0),
			underbarrel: item.extra.getInt("underbarrel", 0),
			optic: item.extra.getInt("optic", 0),
			muzzle: item.extra.getInt("muzzle", 0),
			stock: item.extra.getInt("stock", 0),
			laser: item.extra.getInt("laser", 0)
		};
		this.gunData = gunData;
		this.currentBulletCount = item.extra.getInt("currentBulletCount", 0);
		this.maxBulletCount = item.extra.getInt("maxBulletCount", 0);
		this.magArr = GuncraftUtil.getInventorySlotCompoundTag(this.uid, this.currentSlotIndex).getListTag("magArr").toScriptable();
		this.fov = item.extra.getInt("fov", 0);
		this.mode = item.extra.getInt("mode", 0);
		this.specialSound = item.extra.getString("newSound", null);
		this.secMode = item.extra.getBoolean("secMode", false);
		this.recoilCoefficient = item.extra.getFloat("recoilCoefficient", 1);
		this.accuracyCoefficient = item.extra.getFloat("accuracyCoefficient", 1);
		this.kexPlayer = new KEX.Player(this.uid);
		this.client = Network.getClientForPlayer(this.uid);
		this.setAttachmentModel();
		this.carryAnimation();
		this.client.send("Guncraft.openUI", {
			name: "fire"
		});
		this.updateClient();
	}

	destructor(): void {
		this.client.send("Guncraft.resetFov", {})
		let player = this.kexPlayer;
		this.client.send("Guncraft.closeUI", {
			name: "fire"
		});
		this.client.send("Guncraft.closeUI", {
			name: "modify"
		});
		if (this.reloadMagItem) {
			if (this.reloadMagArr) {
				let tag = new NBT.CompoundTag();
				tag.putListTag("magArr", this.reloadMagArr);
				// @ts-ignore
				this.reloadMagItem.extra.setCompoundTag(tag);
			}
			player.addItemToInventory(this.reloadMagItem.id,
				this.reloadMagItem.count, this.reloadMagItem.data,
				this.reloadMagItem.extra);
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
			gunData = this.gunData;
		if (this.currentBulletCount <= 0)
			return false;
		// @ts-ignore
		let bullet = Guncraft.getBulletData(this.magArr[this.currentBulletCount - 1]),
			playerPos = Entity.getPosition(uid);
		// play sound
		GuncraftUtil.playSound(playerPos, this.specialSound || gunData.fireSound);
		// recoil
		Commands.execAt("camerashake add @p "
			+ String(gunData.recoil * this.recoilCoefficient * bullet.recoilCoefficient)
			+ " 0.2 rotational", playerPos.x, playerPos.y, playerPos.z);
		// shot 
		(gunData.type != Guncraft.GunType.SHOTGUN)
			? shotSingleBullet(gunData, bullet, uid, playerPos, this.accuracyCoefficient)
			: shotShotgun(gunData, bullet, uid, playerPos, this.accuracyCoefficient);
		this.currentBulletCount--;
		if (!this.currentBulletCount && !gunData.slideStop)
			this.emptySound = true;
		return true;
	}

	secModeShot(): void {
		//coming soon
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
		this.timeout = this.gunData.timeout.sf;
		this.actionState = ActionState.sfChanging;
	}

	_sf(): void {
		this.carryAnimation();
		let gunMode = this.gunData.mode,
			player = new PlayerActor(this.uid),
			gunItem = player.getInventorySlot(this.currentSlotIndex);

		if (!gunItem.extra)
			return;
		if (this.mode) {
			for (let i = 0; i < gunMode.length; i++) {
				if (this.mode == gunMode[i]) {
					this.mode = gunMode[i + 1] || 0;
					break;
				}
			}
		} else
			this.mode = gunMode[0];
		gunItem.extra.putInt("mode", this.mode);
		let tag = GuncraftUtil.getInventorySlotCompoundTag(this.uid, this.currentSlotIndex);
		// @ts-ignore
		gunItem.extra.setCompoundTag(tag);
		player.setInventorySlot(this.currentSlotIndex
			, gunItem.id, gunItem.count, gunItem.data, gunItem.extra);
	}

	getMagInInventory(player: PlayerActor): number {
		let gunData = this.gunData,
			availableMagId = gunData.mag;
		for (let i = 0; i <= 35; i++) {
			let itemInSlot = player.getInventorySlot(i);
			for (let k = 0; k < availableMagId.length; k++) {
				if (itemInSlot.id == ItemID[availableMagId[k]]
					&& itemInSlot.extra
					&& itemInSlot.extra.getInt("currentBulletCount", 0)
					&& itemInSlot.extra.getString("bulletParent", null) == gunData.bulletName)
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
			targetMagSlotIndex = this.getMagInInventory(player);

		if (targetMagSlotIndex != -1) {
			this.reloadMagItem = player.getInventorySlot(targetMagSlotIndex);
			this.reloadMagArr = GuncraftUtil.getInventorySlotCompoundTag(this.uid, targetMagSlotIndex)
				.getListTag("magArr");
			this.taskName = "reload_1";

			player.setInventorySlot(targetMagSlotIndex, 0, 0, 0, null);

			let targetItemId = IDRegistry.getNameByID(this.reloadMagItem.id);
			if (gunItem.data) {
				let isMag = Guncraft.getMagData(targetItemId).isMag,
					isMag2 = Guncraft.getMagData(gunItem.extra.getString("mag")).isMag;
				if (this.currentBulletCount > 0) {
					if (isMag && isMag2) {
						this.timeout = this.gunData.timeout.mag2mag2;
						this.mag2mag2_reloadAnimation();
					} else if (!isMag && isMag2) {
						this.timeout = this.gunData.timeout.link2mag2;
						this.link2mag2_reloadAnimation();
					} else if (isMag && !isMag2) {
						this.timeout = this.gunData.timeout.mag2link2;
						this.mag2link2_reloadAnimation();
					} else {
						this.timeout = this.gunData.timeout.link2link2;
						this.link2link2_reloadAnimation();
					}
				} else {
					if (isMag && isMag2) {
						this.mag2mag_reloadAnimation();
						this.timeout = this.gunData.timeout.mag2mag;
					} else if (!isMag && isMag2) {
						this.timeout = this.gunData.timeout.link2mag;
						this.link2mag_reloadAnimation();
					} else if (isMag && !isMag2) {
						this.timeout = this.gunData.timeout.mag2link;
						this.mag2link_reloadAnimation();
					} else {
						this.timeout = this.gunData.timeout.link2link;
						this.link2link_reloadAnimation();
					}
				}
			} else {
				let isMag = Guncraft.getMagData(targetItemId).isMag;
				if (isMag) {
					this.loadMag_reloadAnimation();
					this.timeout = this.gunData.timeout.loadMag;
				} else {
					this.loadLink_reloadAnimation();
					this.timeout = this.gunData.timeout.loadLink;
				}
			}
			AnimationComponet.SetMolangVariable(this.uid, "variable.mag2", this.gunData.mag.indexOf(targetItemId) + 1);
		} else {
			if (!gunItem.data)
				return;
			this.taskName = "reload_0";
			this.reloadMagItem = null;
			this.reloadMagArr = null;
			let isMag2 = Guncraft.getMagData(gunItem.extra.getString("mag")).isMag;
			if (this.currentBulletCount > 0) {
				if (isMag2) {
					this.unloadMag2_reloadAnimation();
					this.timeout = this.gunData.timeout.unloadMag2;
				} else {
					this.unloadLink2_reloadAnimation();
					this.timeout = this.gunData.timeout.unloadLink2;
				}
			} else {
				if (isMag2) {
					this.unloadMag_reloadAnimation();
					this.timeout = this.gunData.timeout.unloadMag;
				} else {
					this.unloadLink_reloadAnimation();
					this.timeout = this.gunData.timeout.unloadLink;
				}
			}
			AnimationComponet.SetMolangVariable(this.uid, "variable.mag2", 0);
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
			this.gunData.saveBullet, false) : null;

		this.loadMag(gunItem.extra, add, gunItem.id, this.reloadMagItem,
			this.reloadMagArr, player);
	}

	reload_0(): void {
		let player = new PlayerActor(this.uid),
			gunItem = player.getInventorySlot(this.currentSlotIndex);
		this.unloadMag(gunItem.extra, player, this.gunData.saveBullet);

		gunItem.extra.putString("mag", null);
		gunItem.extra.putInt("magID", 0);
		gunItem.extra.putInt("currentBulletCount", 0);
		gunItem.extra.putInt("maxBulletCount", 0);
		gunItem.extra.putString("bulletParent", null);
		let tag = new NBT.CompoundTag();
		tag.putListTag("magArr", new NBT.ListTag());
		//@ts-ignore
		gunItem.extra.setCompoundTag(tag);
		player.setInventorySlot(this.currentSlotIndex,
			gunItem.id, gunItem.count, 0, gunItem.extra);

		this.attachmentIndexs['mag'] = 0;
		AnimationComponet.SetMolangVariable(this.uid, "variable.mag", 0);

		this.currentBulletCount = 0;
		this.maxBulletCount = 0;
		this.emptySound = true;
	}

	unloadMag(gunExtraData: ItemExtraData, player: PlayerActor, saveBulletInGun: boolean
		, dropBullet: boolean = true): string {
		let magExtraData = new ItemExtraData(),
			magArr = GuncraftUtil.getInventorySlotCompoundTag(this.uid, this.currentSlotIndex)
				.getListTag("magArr");

		if (this.currentBulletCount > 1
			|| (this.currentBulletCount > 0 && !saveBulletInGun)) {
			let tag: NBT.CompoundTag = new NBT.CompoundTag();
			tag.putListTag("magArr", magArr);
			//@ts-ignore
			magExtraData.setCompoundTag(tag);
			magExtraData.putInt("maxBulletCount", this.maxBulletCount);
			magExtraData.putString("bulletParent", gunExtraData.getString("bulletParent"));

			if (saveBulletInGun) {
				magExtraData.putInt("currentBulletCount", this.currentBulletCount - 1);
				let scale = Math.round(((this.maxBulletCount - this.currentBulletCount + 1)
					/ this.maxBulletCount * 100) + 1);
				player.addItemToInventory(ItemID[gunExtraData.getString("mag")],
					1, scale, magExtraData, true);
				if (dropBullet)
					player.addItemToInventory(ItemID[magArr.getString(this.currentBulletCount - 1)], 1, 0, null, false);
				else
					return magArr.getString(this.currentBulletCount - 1);
			} else {
				magExtraData.putInt("currentBulletCount", this.currentBulletCount);
				let scale = Math.round(((this.maxBulletCount - this.currentBulletCount)
					/ this.maxBulletCount * 100) + 1);
				player.addItemToInventory(ItemID[gunExtraData.getString("mag")],
					1, scale, magExtraData, true);
			}

		} else { // drop empty mag
			magExtraData.putInt("currentBulletCount", 0);
			magExtraData.putInt("maxBulletCount", 0);
			magExtraData.putString("bulletParent", null);
			let tag = new NBT.CompoundTag();
			tag.putListTag("magArr", new NBT.ListTag());
			// @ts-ignore
			magExtraData.setCompoundTag(tag);
			player.addItemToInventory(ItemID[gunExtraData.getString("mag")],
				1, 101, magExtraData, true);

			if (this.currentBulletCount) {
				if (dropBullet)
					player.addItemToInventory(ItemID[magArr.getString(0)], 1, 0, null, false);
				else
					return magArr.getString(0);
			}
		}
		return null;
	}

	loadMag(gunExtraData: ItemExtraData, add: string,
		gunId: number, magItem: ItemInstance, magArr: NBT.ListTag,
		player: PlayerActor): void {
		let bulletCountMax = magItem.extra.getInt("maxBulletCount"),
			bulletCount = magItem.extra.getInt("currentBulletCount"),
			magIndex = this.gunData.mag.indexOf(IDRegistry.getNameByID(magItem.id)) + 1;

		this.attachmentIndexs['mag'] = magIndex;
		AnimationComponet.SetMolangVariable(this.uid, "variable.mag", magIndex);

		if (add)
			magArr.putString(bulletCount++, add);
		gunExtraData.putInt("maxBulletCount", bulletCountMax);
		gunExtraData.putInt("currentBulletCount", bulletCount);
		gunExtraData.putInt("magID", magIndex);
		gunExtraData.putString("mag", IDRegistry.getNameByID(magItem.id));
		gunExtraData.putString("bulletParent", magItem.extra.getString("bulletParent"));
		let tag: NBT.CompoundTag = new NBT.CompoundTag();
		tag.putListTag("magArr", magArr);
		// @ts-ignore
		gunExtraData.setCompoundTag(tag);
		player.setInventorySlot(this.currentSlotIndex, gunId, 1, 1, gunExtraData);

		this.maxBulletCount = bulletCountMax;
		this.currentBulletCount = bulletCount;
		this.magArr = magArr.toScriptable();
		this.reloadMagItem = null;
		this.reloadMagArr = null;
	}

	updatePlayerAnimation(): void {
		if (this.updateAnimationTimeout > 0) {
			this.updateAnimationTimeout--;
			return;
		}
		this.kexPlayer.setSkinID(0);
		this.updateAnimationTimeout = UpdateAnimationTimeout;
	}

	setAttachmentModel(): void {
		for (let key in this.attachmentIndexs)
			AnimationComponet.SetMolangVariable(this.uid, "variable." + key, this.attachmentIndexs[key]);
	}

	animationTransition(state: number): void {
		AnimationComponet.SetMolangVariable(this.uid, "variable.state", state);
	}

	fireAnimation(): void {
		if (this.actionState >= ActionState.autoShooting
			&& this.actionState <= ActionState.burstShooting)
			AnimationComponet.SetMolangVariable(this.uid, "variable.fire", 1);
		else
			AnimationComponet.SetMolangVariable(this.uid, "variable.fire", 0);
	}

	unloadMag_reloadAnimation(): void {
		this.animationTransition(2);
	}

	unloadMag2_reloadAnimation(): void {
		this.animationTransition(3);
	}

	unloadLink_reloadAnimation(): void {
		this.animationTransition(14);
	}

	unloadLink2_reloadAnimation(): void {
		this.animationTransition(15);
	}

	loadMag_reloadAnimation(): void {
		this.animationTransition(2);
	}

	loadLink_reloadAnimation(): void {
		this.animationTransition(3);
	}

	mag2mag_reloadAnimation(): void {
		this.animationTransition(2);
	}

	mag2mag2_reloadAnimation(): void {
		this.animationTransition(3);
	}

	link2mag_reloadAnimation(): void {
		this.animationTransition(10);
	}

	link2mag2_reloadAnimation(): void {
		this.animationTransition(11);
	}

	mag2link_reloadAnimation(): void {
		this.animationTransition(12);
	}

	mag2link2_reloadAnimation(): void {
		this.animationTransition(13);
	}

	link2link_reloadAnimation(): void {
		this.animationTransition(14);
	}

	link2link2_reloadAnimation(): void {
		this.animationTransition(15);
	}

	carryAnimation(): void {
		this.animationTransition(5);
		AnimationComponet.SetMolangVariable(this.uid, "variable.mag2", 0);
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

	getAttachmentInSlot(attachmentType: string, player: PlayerActor, slotIndex: number)
		: { index: number, data: Guncraft.AttachmentParam, slotIndex: number } {
		let itemInSlot = player.getInventorySlot(slotIndex),
			attachmentID = IDRegistry.getNameByID(itemInSlot.id),
			attachmentData = Guncraft.getAttachmentData(attachmentID);
		if (attachmentData) {
			if (attachmentData.type == attachmentType) {
				let attachmentIndex = this.gunData.attachment[attachmentType].indexOf(attachmentID);
				if (attachmentIndex != -1) {
					return {
						index: attachmentIndex,
						data: attachmentData,
						slotIndex: slotIndex
					};
				}
			}
		}
		return null;
	}

	getAttachmentInInventory(attachmentType: string, player: PlayerActor)
		: { index: number, data: Guncraft.AttachmentParam, slotIndex: number } {
		for (let i = 0; i <= 35; i++) {
			let res = this.getAttachmentInSlot(attachmentType, player, i);
			if (res)
				return res;
		}
		return {
			data: Guncraft.emptyAttachment,
			slotIndex: -1,
			index: -1
		};
	}

	modify(attachmentType: string): void {
		let player: PlayerActor = new PlayerActor(this.uid),
			result = this.getAttachmentInInventory(attachmentType, player);

		let gunItem: ItemInstance = player.getInventorySlot(this.currentSlotIndex),
			gunData: Guncraft.GunParam = this.gunData,
			oldAttachmentIndex: number = gunItem.extra.getInt(attachmentType, 0),
			oldData1: number = 0,
			oldData2: number = 0;

		if (result.slotIndex != -1)
			if (oldAttachmentIndex) // swap old attachment and select attachment in inventory
				player.setInventorySlot(result.slotIndex,
					ItemID[gunData.attachment[attachmentType][oldAttachmentIndex - 1]], 1, 0, null)
			else // remove selected attachment in inventory
				player.setInventorySlot(result.slotIndex, 0, 0, 0, null);
		else if (oldAttachmentIndex) // uninstall old attachment
			player.addItemToInventory(ItemID[gunData.attachment[attachmentType][oldAttachmentIndex - 1]], 1, 0, null, false);

		this.attachmentIndexs[attachmentType] = result.index + 1;
		AnimationComponet.SetMolangVariable(this.uid, "variable." + attachmentType, result.index + 1);

		gunItem.extra.putInt(attachmentType, result.index + 1);
		switch (attachmentType) {
			case "optic":
				gunItem.extra.putInt("fov", result.data.fov);
				break;
			case "underbarrel":
			case "muzzle":
				if (attachmentType == "underbarrel")
					(result.data.secMode)
						? gunItem.extra.putBoolean("secMode", true)
						: gunItem.extra.putBoolean("secMode", false);
				else
					(result.data.sound)
						? gunItem.extra.putString("newSound", result.data.sound)
						: gunItem.extra.putString("newSound", null);
			default:
				if (oldAttachmentIndex) {
					let oldAttachmentData = Guncraft.getAttachmentData(
						gunData.attachment[attachmentType][oldAttachmentIndex - 1]);
					oldData1 = oldAttachmentData.recoilCoefficient / 100;
					oldData2 = oldAttachmentData.accuracyCoefficient / 100;
				}
				gunItem.extra.putFloat("recoilCoefficient",
					gunItem.extra.getFloat("recoilCoefficient")
					+ oldData1 - (result.data.recoilCoefficient / 100));
				gunItem.extra.putFloat("accuracyCoefficient",
					gunItem.extra.getFloat("accuracyCoefficient")
					+ oldData2 - (result.data.accuracyCoefficient / 100));
				break;
		}

		let tag = GuncraftUtil.getInventorySlotCompoundTag(this.uid, this.currentSlotIndex);
		// @ts-ignore
		gunItem.extra.setCompoundTag(tag);
		player.setInventorySlot(this.currentSlotIndex, gunItem.id, 1, gunItem.data, gunItem.extra);
	}

	modifyAnimation(): void {
		this.animationTransition(6);
	}
}
