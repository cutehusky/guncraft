namespace GuncraftUtil {
	export function getEntityType(ent: number): string | number {
		let type = Entity.getType(ent);
		if (type)
			return type;
		else
			return Entity.getCompoundTag(ent).getString("identifier");
	}

	export function getInventorySlotCompoundTag(ent: number, id: number): NBT.CompoundTag {
		let tag = Entity.getCompoundTag(ent).getListTag("Inventory").getCompoundTag(id).getCompoundTag("tag");
		tag.remove("$mod");
		return tag;
	}

	export function playSound(pp: Vector, name: string): void {
		Commands.execAt("playsound " + name + " @a ~ ~ ~ 10.0", pp.x, pp.y, pp.z);
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
