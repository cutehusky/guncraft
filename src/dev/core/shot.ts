interface BulletEntityParam {
	damage: number,
	ap: number,
	speed: number,
	type: number | Native.EntityType
}

function gaussianRandom(mean = 0, stdev = 1) {
	const u = 1 - Math.random(); // Converting [0,1) to (0,1]
	const v = Math.random();
	const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
	// Transform to the desired mean and standard deviation:
	return z * stdev + mean;
}

function angleInRadian(angle: number): number {
	return angle * Math.PI / 180;
}

function lookDir(yaw: number, pitch: number): Vector {
	return {
		x: -Math.sin(yaw) * Math.cos(pitch),
		y: Math.sin(pitch),
		z: Math.cos(yaw) * Math.cos(pitch)
	};
}

function getBulletEntityData(
	bulletData: Guncraft.BulletParam,
	gunData: Guncraft.GunParam): BulletEntityParam {
	return {
		speed: bulletData.speed * gunData.speedCoefficient,
		type: gunData.bulletType,
		damage: bulletData.damage * gunData.damCoefficient,
		ap: bulletData.ap * gunData.APCoefficient
	};
}

function bulletEffect(bullet: number, entity: number): void {
	switch (bullet) {
		case 3:
			Explodes[entity] = true;
			break;
		case 5:
			Attacker[entity] = -1;
			break;
		case 1:
		case 4:
			Fires[entity] = true;
		case 2:
			if (bullet != 1)
				Entity.setFire(entity, 200, true);
			break;
	}
}

function shotEntity(
	spawnVec: Vector,
	moveAngle: LookAngle,
	attackerID: number,
	bulletEntityData: BulletEntityParam,
	pos: Vector): number {
	let projectileID = Entity.spawn(
		pos.x + (spawnVec.x * 2), pos.y + (spawnVec.y * 2),
		pos.z + (spawnVec.z * 2), bulletEntityData.type);
	Entity.moveToAngle(projectileID, moveAngle, { speed: bulletEntityData.speed });
	Entity.setLookAngle(projectileID, moveAngle.yaw, moveAngle.pitch)
	Speed[projectileID] = bulletEntityData.speed;
	Damage[projectileID] = bulletEntityData.damage;
	AP[projectileID] = bulletEntityData.ap;
	Attacker[projectileID] = attackerID;
	return projectileID;
}

function shotSingleBullet(
	gunData: Guncraft.GunParam,
	bulletData: Guncraft.BulletParam,
	attackerID: number,
	pos: Vector,
	accuracyAdd: number): void {
	let angle = Entity.getLookAngle(attackerID);
	angle.yaw += angleInRadian(gaussianRandom()
		* (gunData.accuracy / 60)) * accuracyAdd * bulletData.accuracyCoefficient;
	angle.pitch += angleInRadian(gaussianRandom()
		* (gunData.accuracy / 60)) * accuracyAdd * bulletData.accuracyCoefficient;
	let ent = shotEntity(lookDir(angle.yaw, angle.pitch)
		, angle, attackerID, getBulletEntityData(bulletData, gunData), pos);
	if (bulletData.type != 0)
		bulletEffect(bulletData.type, ent);
}

function shotShotgun(
	gunData: Guncraft.GunParam,
	bulletData: Guncraft.BulletParam,
	attackerID: number,
	pos: Vector,
	accuracyAdd: number) {
	let _bullet = getBulletEntityData(bulletData, gunData),
		angle = Entity.getLookAngle(attackerID),
		shotVec = lookDir(angle.yaw, angle.pitch);

	angle.yaw += angleInRadian(gaussianRandom()
		* gunData.accuracy / 60) * bulletData.accuracyCoefficient * accuracyAdd;
	angle.pitch += angleInRadian(gaussianRandom()
		* gunData.accuracy / 60) * accuracyAdd * bulletData.accuracyCoefficient;

	for (let i = 0; i < bulletData.shotgunCount; i++) {
		let yaw = angle.yaw + angleInRadian(gaussianRandom()
			* (bulletData.shotgunDegreesSpread / 60));
		let pitch = angle.pitch + angleInRadian(gaussianRandom()
			* (bulletData.shotgunDegreesSpread / 60));
		let ent = shotEntity(shotVec, { yaw: yaw, pitch: pitch }, attackerID, _bullet, pos);
		if (bulletData.type != 0)
			bulletEffect(bulletData.type, ent);
	}
}
