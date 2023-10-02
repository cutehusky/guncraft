class PlayerItemManager {
	uid: number;
	slot: number;
	item: ItemInstance;
	useDuration: number;
	constructor(uid: number) {
		this.uid = uid;
		this.slot = 0;
		this.item = { id: 0, data: 0, count: 0 };
	}

	check(): void {
		let player = new PlayerActor(this.uid),
			slot = player.getSelectedSlot(),
			item = player.getInventorySlot(slot),
			useDuration = player.getItemUseDuration();
		if (this.useDuration && !useDuration)
			this.released();
		if (slot != this.slot || item.id != this.item.id
			|| (item.extra && this.item.extra
				&& item.extra.getInt("uuid", 0)
				!= this.item.extra.getInt("uuid", 0)))
			item = this.changed(item, slot, player);
		this.useDuration = useDuration;
		this.slot = slot;
		this.item = item;
	}

	released(): void {
		if (!PlayerContainer.hasOwnProperty(this.uid))
			return;
		let playerController = PlayerContainer[this.uid];
		if (playerController.actionState >= ActionState.none
			&& playerController.actionState <= ActionState.burstShooting) {
			playerController.actionState = ActionState.none;
			playerController.fireAnimation();
			playerController.updateClient();
			playerController.updateItem();
		}
	}

	changed(item: ItemInstance, slot: number, player: PlayerActor): ItemInstance {
		let newGunData = Guncraft.getGun(IDRegistry.getNameByID(item.id)),
			oldGunData = Guncraft.getGun(IDRegistry.getNameByID(this.item.id));
		if (oldGunData) {
			PlayerContainer[this.uid].destructor();
			delete (PlayerContainer[this.uid]);
		}
		if (newGunData) {
			if (!item.extra.getInt("uuid", 0)) {
				let tag = GuncraftUtil.getInventorySlotCompoundTag(this.uid, slot);
				// @ts-ignore
				item.extra.setCompoundTag(tag);
				item.extra.putInt("uuid", Math.floor(Math.random() * 10000000));
				player.setInventorySlot(slot, item.id, item.count, item.data, item.extra);
			}
			PlayerContainer[this.uid] = new PlayerActionController(this.uid, item, newGunData, slot);
		}
		return item;
	}
}