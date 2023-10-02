let modifyUI: UI.Window = new UI.Window({
	location: {
		x: 1000,
		y: 0,
		width: 420 * UIScale,
		height: 60 * UIScale
	},
	drawing: [{ type: "background", color: 0 }],
	elements: {
		"underbarrel": {
			type: "button",
			x: (1000 / 7) * 3,
			y: 0,
			bitmap: "button_up_underbarrel",
			bitmap2: "button_down_underbarrel",
			scale: 0.5,
			clicker: {
				onClick: function () {
					Network.sendToServer("Guncraft.ButtonOnClick", {
						name: "modify",
						data: "underbarrel"
					});
				}
			}
		},
		"laser": {
			type: "button",
			x: (1000 / 7) * 2,
			y: 0,
			bitmap: "button_up_laser",
			bitmap2: "button_down_laser",
			scale: 0.5,
			clicker: {
				onClick: function () {
					Network.sendToServer("Guncraft.ButtonOnClick", {
						name: "modify",
						data: "laser"
					});
				}
			}
		},
		"muzzle": {
			type: "button",
			x: 0,
			y: 0,
			bitmap: "button_up_muzzle",
			bitmap2: "button_down_muzzle",
			scale: 0.5,
			clicker: {
				onClick: function () {
					Network.sendToServer("Guncraft.ButtonOnClick", {
						name: "modify",
						data: "muzzle"
					});
				}
			}
		},
		"barrel": {
			type: "button",
			x: (1000 / 7),
			y: 0,
			bitmap: "button_up_barrel",
			bitmap2: "button_down_barrel",
			scale: 0.5,
			clicker: {
				onClick: function () {
					Network.sendToServer("Guncraft.ButtonOnClick", {
						name: "modify",
						data: "barrel"
					});
				}
			}
		},
		"optic": {
			type: "button",
			x: (1000 / 7) * 4,
			y: 0,
			bitmap: "button_up_optic",
			bitmap2: "button_down_optic",
			scale: 0.5,
			clicker: {
				onClick: function () {
					Network.sendToServer("Guncraft.ButtonOnClick", {
						name: "modify",
						data: "optic"
					});
				}
			}
		},
		"RearGrip": {
			type: "button",
			x: (1000 / 7) * 5,
			y: 0,
			bitmap: "button_up_reargrip",
			bitmap2: "button_down_reargrip",
			scale: 0.5,
			clicker: {
				onClick: function () {
					Network.sendToServer("Guncraft.ButtonOnClick", {
						name: "modify",
						data: "reargrip"
					});
				}
			}
		},
		"stock": {
			type: "button",
			x: (1000 / 7) * 6,
			y: 0,
			bitmap: "button_up_stock",
			bitmap2: "button_down_stock",
			scale: 0.5,
			clicker: {
				onClick: function () {
					Network.sendToServer("Guncraft.ButtonOnClick", {
						name: "modify",
						data: "stock"
					});
				}
			}
		}
	}
});
modifyUI.setAsGameOverlay(true);
modifyUI.setDynamic(false);
