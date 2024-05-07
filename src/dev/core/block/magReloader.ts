IDRegistry.genBlockID("magReloader");
Block.createBlockWithRotation("magReloader", [{
	name: Translation.translate("Magazine reloader"),
	texture: [
		["magReloader_bottom", 0],
		["magReloader_top", 0],
		["magReloader_side", 0],
		["magReloader_side", 0],
		["magReloader_side", 0],
		["magReloader_side", 0]
	],
	inCreative: true,
}], {
	base: 58
});

TileEntity.registerPrototype(BlockID["magReloader"], {
	useNetworkItemContainer: true,
	getScreenName: function (player: number, coords: Vector): string {
		return "mag_reload_ui";
	},
	getScreenByName: function (screenName: string): com.zhekasmirnov.innercore.api.mod.ui.window.UIWindowStandard {
		return magReloadUI;
	},
	init: function (): void {
		this.container.setGlobalAddTransferPolicy(function (container: ItemContainer, name: string, id: number, count: number): number {
			count = Math.min(count,
				Math.min(Item.getMaxStack(id), 10) - container.getSlot(name).count);
			if (Guncraft.getBulletData(IDRegistry.getNameByID(id)))
				return count;
			else
				return 0;
		});
	},
	click: function (id: number, count: number,
		data: number, coords: Callback.ItemUseCoordinates,
		playerID: number, extra: ItemExtraData): boolean | void {
		let magID = IDRegistry.getNameByID(id),
			magData = Guncraft.getMagData(magID);
		if (magData) {
			let player = new PlayerActor(playerID),
				magSlot = player.getSelectedSlot();
			for (let k = 1; k <= 50; k++) {
				let bulletItem: com.zhekasmirnov.apparatus.api.container.ItemContainerSlot = this.container.getSlot("slot" + k),
					bulletId = IDRegistry.getNameByID(bulletItem.id),
					bulletData = Guncraft.getBulletData(bulletId);
				if (!bulletData)
					continue;
				for (let i = 0; i < magData.bulletName.length; i++) {
					if (bulletData.parent == magData.bulletName[i]) {
						let magCurBulletCount = extra.getInt("currentBulletCount", 0),
							magMaxBulletCount = magData.bulletMaxCount[i],
							emptyCount = magMaxBulletCount - magCurBulletCount;

						if (emptyCount == 0)
							return true;

						let newBulletCount = bulletItem.count - emptyCount;
						if (newBulletCount < 0)
							emptyCount += newBulletCount;

						let MagArr = magCurBulletCount
							? GuncraftUtil.getInventorySlotCompoundTag(playerID, magSlot).getListTag("magArr")
							: new NBT.ListTag();
						for (let i = 0; i < emptyCount; i++)
							MagArr.putString(magCurBulletCount + i, bulletId);

						extra.putString("bulletParent", bulletData.parent);
						extra.putInt("maxBulletCount", magMaxBulletCount);
						extra.putInt("currentBulletCount", magCurBulletCount + emptyCount);
						let tag = new NBT.CompoundTag();
						tag.putListTag("magArr", MagArr);
						// @ts-ignore
						extra.setCompoundTag(tag);
						let scale = Math.round((
							(magMaxBulletCount - (magCurBulletCount + emptyCount))
							/ magMaxBulletCount * 100) + 1);
						player.setInventorySlot(magSlot, id, 1, scale, extra);

						if (newBulletCount > 0)
							this.container.setSlot("slot" + k, bulletItem.id, newBulletCount, 0)
						else
							this.container.clearSlot("slot" + k);
						break;
					}
				}
			}
			return true;
		} else
			return false;
	},
	defaultValues: {}
});
