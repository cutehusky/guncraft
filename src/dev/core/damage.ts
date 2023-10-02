function DamageCalculate(raw: number, ap: number, y: number, ent: number): number {
	let dY: number = y - Entity.getPosition(ent).y,
		type: number | string = GuncraftUtil.getEntityType(ent);
	// @ts-ignore
	if (humanoidData.indexOf(type) == -1)
		return raw;
	// player
	if (type == 63)
		dY++;
	if (dY < 0.75) {
		let armor = Entity.getArmorSlot(ent, 2);
		if (armor.id) {
			let armorData = Guncraft.getArmor(IDRegistry.getNameByID(armor.id));
			Entity.setArmorSlot(ent, 2, armor.id, armor.count, armor.data + raw / 5, armor.extra)
			if (armorData && armorData.level >= ap)
				raw = 0;
		} else
			raw *= 0.8;
	} else if (dY < 1.5) {
		let armor = Entity.getArmorSlot(ent, 1);
		if (armor.id) {
			let armorData = Guncraft.getArmor(IDRegistry.getNameByID(armor.id));
			Entity.setArmorSlot(ent, 1, armor.id, armor.count, armor.data + raw / 5, armor.extra)
			if (armorData && armorData.level >= ap)
				raw = 0
		}
	} else {
		let armor = Entity.getArmorSlot(ent, 0);
		if (armor.id) {
			let armorData = Guncraft.getArmor(IDRegistry.getNameByID(armor.id));
			Entity.setArmorSlot(ent, 0, armor.id, armor.count, armor.data + raw / 5, armor.extra)
			if (armorData && armorData.level > ap)
				raw = 0
		} else
			raw *= 1.8;
	}
	return raw;
}