//ui onclick event
Network.addServerPacket("Guncraft.ButtonOnClick",
	function (client: NetworkClient, data: { name: string, data?: any }): void {
		let uid = client.getPlayerUid();
		if (!PlayerContainer.hasOwnProperty(uid))
			return;
		data.data
			? UIClickEvent[data.name](uid, data.data)
			: UIClickEvent[data.name](uid);
	});

let UIClickEvent = {

	modify: function (uid: number, name: string): void {
		PlayerContainer[uid].modify(name);
	},

	changeSecMode: function (uid: number): void {
		//coming soon
	},

	modifyMode: function (uid: number): void {
		let playerController = PlayerContainer[uid];
		if (playerController.actionState != ActionState.none
			&& playerController.actionState != ActionState.modifying)
			return;
		if (playerController.actionState != ActionState.modifying) {
			playerController.modifyAnimation();
			playerController.client.send("Guncraft.openUI", {
				name: "modify"
			});
			playerController.actionState = ActionState.modifying;
		} else {
			playerController.carryAnimation();
			playerController.client.send("Guncraft.closeUI", {
				name: "modify"
			});
			playerController.actionState = ActionState.none;
		}
	},

	reload: function (uid: number): void {
		let playerController = PlayerContainer[uid];
		if (playerController.actionState != ActionState.none)
			return;
		playerController.reloadMag();
		playerController.updateClient();
	},

	selectiveFire: function (uid: number): void {
		let playerController = PlayerContainer[uid];
		if (playerController.actionState != ActionState.none)
			return;
		playerController.sf();
		playerController.updateClient();
	},

	aim: function (uid: number): void {
		let playerController = PlayerContainer[uid];
		if (playerController.actionState == ActionState.modifying
			|| playerController.actionState == ActionState.reloading
			|| playerController.actionState == ActionState.sfChanging)
			return;
		if (playerController.isAim) {
			playerController.carryAnimation();
			playerController.client.send("Guncraft.resetFov", {});
			playerController.isAim = false;
		} else {
			playerController.client.send("Guncraft.setFov", {
				fov: playerController.fov
			});
			playerController.aimAnimation();
			playerController.isAim = true;
		}
	}
}
