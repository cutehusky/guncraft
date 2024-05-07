Callback.addCallback("ProjectileHit", function (projectileID: number, i: ItemInstance, target: Callback.ProjectileHitTarget): void {
	if (!Damage.hasOwnProperty(projectileID))
		return;

	if (target.entity == -1) { // hit block
		let blockHitData = BlockHitData,
			hitBlockID = World.getBlock(target.coords.x, target.coords.y, target.coords.z).id;

		if (blockHitData.hasOwnProperty(hitBlockID)) {
			let bdata = blockHitData[hitBlockID];
			if (Math.random() < bdata[0] * (AP[projectileID] / 5)) { // break block
				let angle = Entity.getMovingAngle(projectileID);
				World.destroyBlock(target.coords.x, target.coords.y, target.coords.z, false);
				AP[projectileID] *= bdata[1];
				Damage[projectileID] *= bdata[1];
				Speed[projectileID] *= bdata[1];
				Entity.moveToAngle(projectileID, angle, { speed: Speed[projectileID] });
				return;
			}
		}

		if (Explodes.hasOwnProperty(projectileID)) {
			World.explode(target.coords.x, target.coords.y, target.coords.z,
				(Damage[projectileID] * 0.1) || 1, true);
			delete (Explodes[projectileID]);
		} else if (Fires.hasOwnProperty(projectileID)) {
			let fireID = Entity.spawn(target.coords.x, target.coords.y,
				target.coords.z, Native.EntityType.SMALL_FIREBALL),
				angle = Entity.getMovingAngle(projectileID);
			Entity.moveToAngle(fireID, angle, { speed: 20 });
			delete (Fires[projectileID]);
		}
	} else { // hit entity
		let damage = DamageCalculate(
			Damage[projectileID],
			AP[projectileID],
			target.y,
			target.entity);
		Entity.damageEntity(target.entity, damage, 1, {
			attacker: Attacker[projectileID],
			bool1: true
		});

		if (Explodes.hasOwnProperty(projectileID)) {
			let pos = Entity.getPosition(target.entity);
			World.explode(pos.x, pos.y, pos.z,
				(0.1 * Damage[projectileID]) || 1, true);
			delete (Explodes[projectileID]);
		} else if (Fires.hasOwnProperty(projectileID)) {
			Entity.setFire(target.entity, 60, true);
			delete (Fires[projectileID]);
		}
	}
	Entity.remove(projectileID);
	delete (Damage[projectileID]);
	delete (Speed[projectileID]);
	delete (Attacker[projectileID]);
	delete (AP[projectileID]);
});
