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
			if (Guncraft.getBullet(IDRegistry.getNameByID(id)))
				return count;
			else
				return 0;
		});
	},
	click: function (id: number, count: number,
		data: number, coords: Callback.ItemUseCoordinates,
		puid: number, extra: ItemExtraData): boolean | void {
		let magID = IDRegistry.getNameByID(id),
			magData = Guncraft.getMag(magID);
		if (magData) {
			let player = new PlayerActor(puid),
				magSlot = player.getSelectedSlot();
			for (let k = 1; k <= 50; k++) {
				let bulletItem: com.zhekasmirnov.apparatus.api.container.ItemContainerSlot = this.container.getSlot("slot" + k),
					bulletId = IDRegistry.getNameByID(bulletItem.id),
					bulletData = Guncraft.getBullet(bulletId);
				if (!bulletData)
					continue;
				for (let i = 0; i < magData.bulletName.length; i++) {
					if (bulletData.parent == magData.bulletName[i]) {
						let magCurBulletCount = extra.getInt("currentBulletCount", 0),
							magMaxBulletCount = magData.bulletMaxCount[i],
							b = magMaxBulletCount - magCurBulletCount;
						if (!b)
							return true;
						let c = bulletItem.count - b;
						if (c < 0)
							b += c;
						let MagArr = magCurBulletCount
							? GuncraftUtil.getInventorySlotCompoundTag(puid, magSlot).getListTag("magArr")
							: new NBT.ListTag();
						for (let i = 0; i < b; i++)
							MagArr.putString(magCurBulletCount + i, bulletId);
						extra.putString("bulletParent", bulletData.parent);
						extra.putInt("maxBulletCount", magMaxBulletCount);
						extra.putInt("currentBulletCount", magCurBulletCount + b);
						let tag = new NBT.CompoundTag();
						tag.putListTag("magArr", MagArr);
						// @ts-ignore
						extra.setCompoundTag(tag);
						let scale = Math.round((
							(magMaxBulletCount - (magCurBulletCount + b))
							/ magMaxBulletCount * 100) + 1);
						(c > 0)
							? this.container.setSlot("slot" + k, bulletItem.id, c, 0)
							: this.container.clearSlot("slot" + k);
						player.setInventorySlot(magSlot, id, 1, scale, extra);
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
