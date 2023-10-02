Callback.addCallback("ProjectileHit", function (p: number, i: ItemInstance, t: Callback.ProjectileHitTarget): void {
	if (Damage.hasOwnProperty(p)) {
		if (t.entity == -1) {
			let _blockHitData = blockHitData,
				bid = World.getBlock(t.coords.x, t.coords.y, t.coords.z).id;
			if (_blockHitData.hasOwnProperty(bid)) {
				let bdata = _blockHitData[bid];
				if (Math.random() < bdata[0] * (AP[p] / 5)) {
					let angle = Entity.getMovingAngle(p);
					World.destroyBlock(t.coords.x, t.coords.y, t.coords.z, false);
					AP[p] *= bdata[1];
					Damage[p] *= bdata[1];
					Speed[p] *= bdata[1];
					Entity.moveToAngle(p, angle, { speed: Speed[p] });
					return;
				}
			}
			if (Explodes.hasOwnProperty(p)) {
				World.explode(t.coords.x, t.coords.y, t.coords.z, (Damage[p] * 0.1) || 1, true);
				delete (Explodes[p]);
			} else if (Fires.hasOwnProperty(p)) {
				let Ent = Entity.spawn(t.coords.x, t.coords.y, t.coords.z, Native.EntityType.SMALL_FIREBALL),
					angle = Entity.getMovingAngle(p);
				Entity.moveToAngle(Ent, angle, { speed: 20 });
				delete (Fires[p]);
			}
		} else {
			let damage: number = DamageCalculate(Damage[p], AP[p], t.y, t.entity);
			Entity.damageEntity(t.entity, damage, 1, { attacker: Attacker[p], bool1: true });
			if (Explodes.hasOwnProperty(p)) {
				let Pos = Entity.getPosition(t.entity);
				World.explode(Pos.x, Pos.y, Pos.z, (0.1 * damage) || 1, true);
				delete (Explodes[p]);
			} else if (Fires.hasOwnProperty(p)) {
				Entity.setFire(t.entity, 60, true);
				delete (Fires[p]);
			}
		}
		Entity.remove(p);
		delete (Damage[p]);
		delete (Speed[p]);
		delete (Attacker[p]);
		delete (AP[p]);
	}
});
