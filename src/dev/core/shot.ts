interface bullet_param {
	damage: number,
	ap: number,
	speed: number,
	type: number | Native.EntityType
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

function bulletData(bullet: Guncraft.BulletParam,
	Gun: Guncraft.GunParam): bullet_param {
	return {
		speed: bullet.speed * Gun.speedCoefficient,
		type: Gun.bulletType,
		damage: bullet.damage * Gun.damCoefficient,
		ap: bullet.ap * Gun.APCoefficient
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
			(bullet != 1) && Entity.setFire(entity, 200, true);
			break;
	}
}

function shotEntity(vectorSpawn: Vector, vectorSpeed: LookAngle, attacker: number, bullet: bullet_param, pp: Vector): number {
	let entity = Entity.spawn(
		pp.x + (vectorSpawn.x * 2), pp.y + (vectorSpawn.y * 2),
		pp.z + (vectorSpawn.z * 2), bullet.type);
	Entity.moveToAngle(entity, vectorSpeed, { speed: bullet.speed });
	Speed[entity] = bullet.speed;
	Damage[entity] = bullet.damage;
	AP[entity] = bullet.ap;
	Attacker[entity] = attacker;
	return entity;
}

function shotSingleBullet(Gun: Guncraft.GunParam,
	bullet: Guncraft.BulletParam, attacker: number, pp: Vector, accuracyAdd: number): void {
	let angle = Entity.getLookAngle(attacker),
		ad = 1;
	if (Math.random() > 0.5)
		ad = -1;
	angle.yaw += angleInRadian(Math.random()
		* (Gun.accuracy / 60)) * ad * accuracyAdd * bullet.accuracyCoefficient;
	if (Math.random() < 0.5)
		ad = 1;
	angle.pitch += angleInRadian(Math.random()
		* (Gun.accuracy / 60)) * ad * accuracyAdd * bullet.accuracyCoefficient;
	let ent = shotEntity(lookDir(angle.yaw, angle.pitch)
		, angle, attacker, bulletData(bullet, Gun), pp);
	(bullet.type != 0) && bulletEffect(bullet.type, ent);
}

function shotShotgun(Gun: Guncraft.GunParam, bullet: Guncraft.BulletParam,
	attacker: number, pp: Vector, accuracyAdd: number) {
	let _bullet = bulletData(bullet, Gun),
		angle = Entity.getLookAngle(attacker),
		d = lookDir(angle.yaw, angle.pitch),
		ad = 1;
	if (Math.random() > 0.5)
		ad = -1;
	angle.yaw += angleInRadian(Math.random() * Gun.accuracy / 60) * ad * bullet.accuracyCoefficient * accuracyAdd;
	if (Math.random() < 0.5)
		ad = 1;
	angle.pitch += angleInRadian(Math.random() * Gun.accuracy / 60) * ad * accuracyAdd * bullet.accuracyCoefficient;
	for (let i = 0; i < bullet.shotgunCount; i++) {
		if (Math.random() > 0.5)
			ad = -1;
		let yaw = angle.yaw + angleInRadian(Math.random() * (bullet.shotgunDegreesSpread / 60)) * ad;
		if (Math.random() < 0.5)
			ad = 1;
		let pitch = angle.pitch + angleInRadian(Math.random()
			* (bullet.shotgunDegreesSpread / 60)) * ad;
		let ent = shotEntity(d, { yaw: yaw, pitch: pitch }, attacker, _bullet, pp);
		(bullet.type != 0) && bulletEffect(bullet.type, ent);
	}
}
