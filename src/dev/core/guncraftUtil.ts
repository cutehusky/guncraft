namespace GuncraftUtil {
	export function getEntityType(entityID: number): string | number {
		let entityType = Entity.getType(entityID);
		if (entityType)
			return entityType;
		else
			return Entity.getCompoundTag(entityID).getString("identifier");
	}

	export function getInventorySlotCompoundTag(
		entityID: number,
		slotIndex: number): NBT.CompoundTag {
		let tag = Entity.getCompoundTag(entityID).getListTag("Inventory")
			.getCompoundTag(slotIndex).getCompoundTag("tag");
		tag.remove("$mod");
		return tag;
	}

	export function playSound(pos: Vector, name: string): void {
		Commands.execAt("playsound " + name + " @a ~ ~ ~ 10.0", pos.x, pos.y, pos.z);
	}

	export function delay(f: (parm?: any) => void, timeout: number, param?: any): void {
		let delay = new java.lang.Thread(new java.lang.Runnable({
			run: function () {
				// @ts-ignore
				delay.sleep(timeout * 1000);
				f(param);
			}
		}));
		delay.start();
	}
}
