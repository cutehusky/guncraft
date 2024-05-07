class PlayerItemManager {
	uid: number;
	currentSlotIndex: number;
	currentItem: ItemInstance;
	useDuration: number;
	constructor(uid: number) {
		this.uid = uid;
		this.currentSlotIndex = 0;
		this.currentItem = { id: 0, data: 0, count: 0 };
	}

	check(): void {
		let player = new PlayerActor(this.uid),
			currentSlotIndex = player.getSelectedSlot(),
			currentItem = player.getInventorySlot(currentSlotIndex),
			useDuration = player.getItemUseDuration();
		if (this.useDuration && !useDuration)
			this.released();
		if (currentSlotIndex != this.currentSlotIndex
			|| currentItem.id != this.currentItem.id
			|| (currentItem.extra && this.currentItem.extra
				&& currentItem.extra.getInt("uuid", 0)
				!= this.currentItem.extra.getInt("uuid", 0)))
			currentItem = this.changed(currentItem, currentSlotIndex, player);
		this.useDuration = useDuration;
		this.currentSlotIndex = currentSlotIndex;
		this.currentItem = currentItem;
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

	changed(currentItem: ItemInstance, currentSlotIndex: number, player: PlayerActor): ItemInstance {
		let newGunData = Guncraft.getGunData(IDRegistry.getNameByID(currentItem.id)),
			oldGunData = Guncraft.getGunData(IDRegistry.getNameByID(this.currentItem.id));
		if (oldGunData) {
			PlayerContainer[this.uid].destructor();
			delete (PlayerContainer[this.uid]);
		}
		if (newGunData) {
			if (!currentItem.extra.getInt("uuid", 0)) {
				let tag = GuncraftUtil.getInventorySlotCompoundTag(this.uid, currentSlotIndex);
				// @ts-ignore
				currentItem.extra.setCompoundTag(tag);
				currentItem.extra.putInt("uuid", Math.floor(Math.random() * 10000000));
				player.setInventorySlot(currentSlotIndex, currentItem.id, currentItem.count, currentItem.data, currentItem.extra);
			}
			PlayerContainer[this.uid] = new PlayerActionController(this.uid, currentItem, newGunData, currentSlotIndex);
		}
		return currentItem;
	}
}