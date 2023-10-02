Callback.addCallback("ServerPlayerLeft", function (uid: number): void {
	//delete invalid data
	if (PlayerContainer.hasOwnProperty(uid))
		delete (PlayerContainer[uid]);
	if (PlayerItemManagerContainer.hasOwnProperty(uid))
		delete (PlayerItemManagerContainer[uid]);
});

Callback.addCallback("LevelLoaded", function (): void {
	Damage = {};
	Explodes = {};
	Fires = {};
	AP = {};
	Attacker = {};
	Speed = {};
	PlayerItemManagerContainer = {};
	PlayerContainer = {};
});

Callback.addCallback("ServerPlayerTick", function (player: number, isPlayerDead: boolean): void {
	if (!PlayerItemManagerContainer.hasOwnProperty(player))
		PlayerItemManagerContainer[player] = new PlayerItemManager(player);
	PlayerItemManagerContainer[player].check();
}, 1);

Callback.addCallback("ServerPlayerTick", function (player: number, isPlayerDead: boolean): void {
	if (!PlayerContainer.hasOwnProperty(player))
		return;
	let playerController = PlayerContainer[player];
	if (isPlayerDead) {
		playerController.destructor();
		delete (PlayerContainer[player]);
		return;
	}
	playerController.updatePlayerAnimation();
	if (playerController.timeout > 0) {
		playerController.timeout--;
		return;
	}

	if (playerController.actionState == ActionState.reloading
		|| playerController.actionState == ActionState.sfChanging) {
		playerController[playerController.taskName]();
		playerController.actionState = ActionState.none;
		playerController.carryAnimation();
		playerController.taskName = "";
		playerController.timeout = 0;
		playerController.updateClient();
		return;
	}

	let gunData = playerController.GunData;

	if (playerController.actionState == ActionState.semiAutoShooting) {
		playerController.shot();
		playerController.actionState = ActionState.none;
		playerController.fireAnimation();
		playerController.timeout = gunData.shotTimeout.semi_auto;
		playerController.updateClient();
		return;
	}

	if (playerController.actionState == ActionState.autoShooting) {
		if (!playerController.shot()) {
			playerController.actionState = ActionState.none;
			playerController.fireAnimation();
		} else
			playerController.timeout = gunData.shotTimeout.auto;
		playerController.updateClient();
		return;
	}

	if (playerController.actionState == ActionState.burstShooting) {
		if (playerController.burstCount > 0) {
			if (!playerController.shot()) {
				playerController.actionState = ActionState.none;
				playerController.fireAnimation();
				playerController.timeout = gunData.shotTimeout.afterBurst;
			} else {
				playerController.burstCount--;
				playerController.timeout = gunData.shotTimeout.burst;
			}
		} else {
			playerController.actionState = ActionState.none;
			playerController.fireAnimation();
			playerController.timeout = gunData.shotTimeout.afterBurst;
		}
		playerController.updateClient();
	}
}, 2);

Callback.addCallback("ItemUseNoTarget", function (item: ItemInstance, player: number): void {
	if (!PlayerContainer.hasOwnProperty(player))
		return;
	let playerController = PlayerContainer[player];
	if (playerController.actionState != ActionState.none)
		return;
	if (!item.data || playerController.currentBulletCount <= 0
		|| !playerController.mode) {
		if (playerController.emptySound
			&& playerController.mode) {
			GuncraftUtil.playSound(Entity.getPosition(player), "empty");
			playerController.emptySound = false;
		}
		return;
	}
	if (playerController.mode == 1) // auto
		playerController.actionState = ActionState.autoShooting;
	else if (playerController.mode == 2)// semi-auto
		playerController.actionState = ActionState.semiAutoShooting;
	else { // burst shooting
		playerController.burstCount = playerController.mode - 1;
		playerController.actionState = ActionState.burstShooting;
	}
	playerController.fireAnimation();
	Game.prevent();
});

//reload magazine
Callback.addCallback("ItemUsingComplete", function (magItem: ItemInstance, puid: number): void {
	let player = new PlayerActor(puid),
		//magazine slot
		magSlot = player.getSelectedSlot(),
		//bullet slot
		bulletSlot = magSlot + 1,
		bulletItem = player.getInventorySlot(bulletSlot),
		bulletId = IDRegistry.getNameByID(bulletItem.id),
		magData = Guncraft.getMag(IDRegistry.getNameByID(magItem.id)),
		bulletData = Guncraft.getBullet(bulletId);
	if (magData && bulletData) {
		for (let i = 0; i < magData.bulletName.length; i++) {
			if (bulletData.parent == magData.bulletName[i]) {
				let magCurBulletCount = magItem.extra.getInt("currentBulletCount", 0),
					magMaxBulletCount = magData.bulletMaxCount[i],
					b = magMaxBulletCount - magCurBulletCount,
					c = bulletItem.count - b;
				if (c < 0)
					b += c;
				let magArr = magCurBulletCount
					? GuncraftUtil.getInventorySlotCompoundTag(puid, magSlot)
						.getListTag("magArr")
					: new NBT.ListTag();
				for (let i = 0; i < b; i++)
					magArr.putString(magCurBulletCount + i, bulletId);
				magItem.extra.putString("bulletParent", bulletData.parent);
				magItem.extra.putInt("maxBulletCount", magMaxBulletCount);
				magItem.extra.putInt("currentBulletCount", magCurBulletCount + b);
				let tag = new NBT.CompoundTag();
				tag.putListTag("magArr", magArr);
				// @ts-ignore
				magItem.extra.setCompoundTag(tag);
				let scale = Math.round(
					((magMaxBulletCount - (magCurBulletCount + b))
						/ magMaxBulletCount * 100) + 1);
				(c > 0)
					? player.setInventorySlot(bulletSlot, bulletItem.id, c, 0, null)
					: player.setInventorySlot(bulletSlot, 0, 0, 0, null);
				player.setInventorySlot(magSlot, magItem.id, 1, scale, magItem.extra);
				break;
			}
		}
	}
});

//prevent some event when player is carying gun
Callback.addCallback("DestroyBlockStart",
	function (coords: Callback.ItemUseCoordinates, block: Tile, player: number): void {
		(PlayerContainer.hasOwnProperty(player)) && Game.prevent();
	});

Callback.addCallback("ItemUse",
	function (coords: Callback.ItemUseCoordinates, item: ItemInstance, block: Tile, isExternal: boolean, player: number): void {
		(PlayerContainer.hasOwnProperty(player)) && Game.prevent();
	});

Callback.addCallback("PlayerAttack",
	function (player: number, victim: number): void {
		(PlayerContainer.hasOwnProperty(player)) && Game.prevent();
	});