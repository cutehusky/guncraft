function drop(entityID: number): void {
	let itemEntity = Entity.getRiding(entityID);
	if (itemEntity == -1)
		return;
	let itemData = JSON.parse(Entity.getCompoundTag(itemEntity)
		.getCompoundTag("Item").toScriptable().tag["$mod"]);
	AnimationComponet.SetMolangVariable(entityID, "variable.barrel", itemData.barrel);
	AnimationComponet.SetMolangVariable(entityID, "variable.mag", itemData.magID);
	AnimationComponet.SetMolangVariable(entityID, "variable.reargrip", itemData.reargrip);
	AnimationComponet.SetMolangVariable(entityID, "variable.underbarrel", itemData.underbarrel);
	AnimationComponet.SetMolangVariable(entityID, "variable.optic", itemData.optic);
	AnimationComponet.SetMolangVariable(entityID, "variable.muzzle", itemData.muzzle);
	AnimationComponet.SetMolangVariable(entityID, "variable.stock", itemData.stock);
	AnimationComponet.SetMolangVariable(entityID, "variable.laser", itemData.laser);
}

Callback.addCallback("EntityAdded", function (entityID: number): void {
	let entityType = Entity.getType(entityID);
	if (entityType == Native.EntityType.ITEM) {
		let tag = Entity.getCompoundTag(entityID),
			itemData = tag.getCompoundTag("Item").toScriptable(),
			itemID: string = itemData.Name.replace("minecraft:item_", ""),
			gunData = Guncraft.getGunData(itemID);
		if (gunData) {
			// initial native drop item
			let list = tag.getListTag("Tags");
			list.putString(list.length(), "item." + itemID);
			tag.putListTag("Tags", list);
			Entity.setCompoundTag(entityID, tag);
		}
	} else if (!entityType) {
		let tag = Entity.getCompoundTag(entityID),
			id = tag.getString("identifier");
		// initial custom drop item model
		if (id == "drop:gun")
			GuncraftUtil.delay(drop, 0.1, entityID);
	}
});
