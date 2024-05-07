type ControllerContainer = {
	[key: number]: PlayerActionController
}

type ItemManagerContainer = {
	[key: number]: PlayerItemManager
}

let AnimationComponet = null
ModAPI.addAPICallback("AnimationComponet", function (api) {
	AnimationComponet = api;
});

let Damage = {},
	Explodes = {},
	Fires = {},
	AP = {},
	Attacker = {},
	Speed = {},
	PlayerItemManagerContainer: ItemManagerContainer = {},
	PlayerContainer: ControllerContainer = {};

// id: [brokem probability, broken reduce]
const BlockHitData = {
	20: [0.9, 0.7],
	64: [0.2, 0.1],
	241: [0.9, 0.7],
	193: [0.2, 0.1],
	194: [0.2, 0.1],
	195: [0.2, 0.1],
	196: [0.2, 0.1],
	197: [0.2, 0.1],
	183: [0.2, 0.1],
	184: [0.2, 0.1],
	185: [0.2, 0.1],
	186: [0.2, 0.1],
	187: [0.2, 0.1],
	71: [0.08, 0.1],
	167: [0.08, 0.1],
	89: [0.8, 0.5],
	91: [0.8, 0.5],
	102: [0.99, 0.9],
	160: [0.99, 0.9],
	123: [0.8, 0.5],
	124: [0.8, 0.5],
	138: [0.8, 0.5],
	169: [0.8, 0.5],
	65: [0.7, 0.9],
	178: [0.9, 0.5],
	151: [0.9, 0.5],
	149: [0.9, 0.6],
	150: [0.9, 0.6],
	143: [0.9, 0.6],
	127: [0.8, 0.6],
	103: [0.8, 0.5],
	140: [0.7, 0.4],
	107: [0.2, 0.1],
	101: [0.08, 0.9],
	92: [1, 0.8],
	93: [0.9, 0.6],
	94: [0.9, 0.6],
	96: [0.2, 0.1],
	208: [0.9, 0.7],
	83: [0.7, 0.6],
	418: [0.7, 0.6],
	419: [0.9, 0.9],
	400: [0.2, 0.1],
	401: [0.2, 0.1],
	402: [0.2, 0.1],
	403: [0.2, 0.1],
	404: [0.2, 0.1],
	414: [1, 1],
	410: [0.8, 0.5],
	517: [0.9, 0.6],
	518: [0.9, 0.6],
	513: [0.2, 0.1],
	514: [0.2, 0.1],
	117: [0.7, 0.4],
	395: [0.9, 0.6],
	396: [0.9, 0.6],
	397: [0.9, 0.6],
	398: [0.9, 0.6],
	399: [0.9, 0.6],
	77: [0.9, 0.6]
}

const HumanoidData = [44, 116, 32,
	48, 45, 118,
	57, 115, 15,
	46, 34, 63,
	36, 114, 47,
	104, 110];

const MaxUseDuration = 200000;
const UpdateAnimationTimeout = 20;