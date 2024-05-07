function DamageCalculate(raw: number, ap: number, y: number, entityID: number): number {
	let dY: number = y - Entity.getPosition(entityID).y,
		type: number | string = GuncraftUtil.getEntityType(entityID);
	// @ts-ignore
	if (HumanoidData.indexOf(type) == -1)
		return raw;
	// player
	if (type == 63)
		dY++;
	if (dY < 0.75) {
		let armor = Entity.getArmorSlot(entityID, 2);
		if (armor.id) {
			let armorData = Guncraft.getArmorData(IDRegistry.getNameByID(armor.id));
			Entity.setArmorSlot(entityID, 2, armor.id, armor.count, armor.data + raw / 5, armor.extra)
			if (armorData && armorData.level >= ap)
				raw = 0;
		} else
			raw *= 0.8;
	} else if (dY < 1.5) {
		let armor = Entity.getArmorSlot(entityID, 1);
		if (armor.id) {
			let armorData = Guncraft.getArmorData(IDRegistry.getNameByID(armor.id));
			Entity.setArmorSlot(entityID, 1, armor.id, armor.count, armor.data + raw / 5, armor.extra)
			if (armorData && armorData.level >= ap)
				raw = 0
		}
	} else {
		let armor = Entity.getArmorSlot(entityID, 0);
		if (armor.id) {
			let armorData = Guncraft.getArmorData(IDRegistry.getNameByID(armor.id));
			Entity.setArmorSlot(entityID, 0, armor.id, armor.count, armor.data + raw / 5, armor.extra)
			if (armorData && armorData.level > ap)
				raw = 0
		} else
			raw *= 1.8;
	}
	return raw;
}