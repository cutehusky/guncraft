function drop(ent: number): void {
	let Ent = Entity.getRiding(ent);
	if (Ent == -1)
		return;
	let entity = new KEX.Mob(ent);
	entity.setSkinID(JSON.parse(Entity.getCompoundTag(Ent)
		.getCompoundTag("Item").toScriptable().tag["$mod"]).attachmentID);
}

Callback.addCallback("EntityAdded", function (ent: number): void {
	let type = Entity.getType(ent);
	if (type == Native.EntityType.ITEM) {
		let tag = Entity.getCompoundTag(ent),
			item = tag.getCompoundTag("Item").toScriptable(),
			id: string = item.Name.replace("minecraft:item_", ""),
			gun = Guncraft.getGun(id);
		if (gun) {
			// initial native drop item
			let list = tag.getListTag("Tags");
			list.putString(list.length(), "item." + id);
			tag.putListTag("Tags", list);
			Entity.setCompoundTag(ent, tag);
		}
	} else if (!type) {
		let tag = Entity.getCompoundTag(ent),
			id = tag.getString("identifier");
		// initial custom drop item model
		if (id == "drop:gun")
			GuncraftUtil.delay(drop, 0.1, ent);
	}
});
