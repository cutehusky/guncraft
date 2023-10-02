let GUI: UI.Window = new UI.Window({
	location: {
		x: 1000,
		y: UI.getScreenHeight(),
		width: 60 * UIScale,
		height: 240 * UIScale
	},
	drawing: [{ type: "background", color: 0 }],
	elements: {
		"reload": {
			type: "button",
			x: 0,
			y: 1000,
			bitmap: "button_up_reload",
			bitmap2: "button_down_reload",
			scale: 3.5,
			clicker: {
				onClick: function () {
					Network.sendToServer("Guncraft.ButtonOnClick", {
						name: "reload"
					});
				}
			}
		},
		"changeSecMode": {
			type: "button",
			x: 0,
			y: 2000,
			bitmap: "button_up_change_1",
			bitmap2: "button_down_change_1",
			scale: 3.5,
			clicker: {
				onLongClick: function () {
					Network.sendToServer("Guncraft.ButtonOnClick", {
						name: "changeSecMode"
					});
				},
				onClick: function () {
					Network.sendToServer("Guncraft.ButtonOnClick", {
						name: "selectiveFire",
						data: 1
					});
				}
			}
		},
		"aim": {
			type: "button",
			x: 0,
			y: 0,
			bitmap: "button_up_aim",
			bitmap2: "button_down_aim",
			scale: 3.5,
			clicker: {
				onClick: function () {
					Network.sendToServer("Guncraft.ButtonOnClick", {
						name: "aim"
					});
				}
			}
		},
		"modify": {
			type: "button",
			x: 0,
			y: 3000,
			bitmap: "button_up_modify",
			bitmap2: "button_down_modify",
			scale: 3.5,
			clicker: {
				onClick: function () {
					Network.sendToServer("Guncraft.ButtonOnClick", {
						name: "modifyMode"
					});
				}
			}
		}
	}
});
GUI.setAsGameOverlay(true);
GUI.setDynamic(false);