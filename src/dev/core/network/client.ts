let fireMode = false,
	modifyMode = false,
	c_displayer = new UI.Container();

Network.addClientPacket("Guncraft.display", function (data:
	{ text: string, color: number }): void {
	let content = c_displayer.getGuiContent();
	if (!content)
		content = displayerUI.getContent();
	content.elements["content"].text = data.text;
	content.elements["content"].font.color = data.color;
});

Network.addClientPacket("Guncraft.openUI",
	function (data: { name: string, item?: number }): void {
		switch (data.name) {
			case "fire":
				let content = displayerUI.getContent();
				content.elements["content"].text = "";
				if (lastScreen == "in_game_play_screen") {
					GUI.open();
					c_displayer.openAs(displayerUI);
				}
				fireMode = true;
				break;
			case "modify":
				if (lastScreen == "in_game_play_screen")
					modifyUI.open();
				modifyMode = true;
				break;
		}
	});

Network.addClientPacket("Guncraft.closeUI",
	function (data: { name: string }): void {
		switch (data.name) {
			case "fire":
				if (GUI.isOpened()) {
					GUI.close();
					c_displayer.close();
				}
				fireMode = false;
				break;
			case "modify":
				if (modifyUI.isOpened())
					modifyUI.close();
				modifyMode = false;
				break;
		}
	});

Network.addClientPacket("Guncraft.setFov", function (data: { fov: number }): void {
	Player.setFov(70 - data.fov);
});

Network.addClientPacket("Guncraft.resetFov", function (data: {}): void {
	Player.resetFov();
});

const modeName = [Translation.translate("insurance"),
Translation.translate("auto"), Translation.translate("semi-auto")];

function ModeName(mode: number): string {
	let str = mode - 1;
	return str + Translation.translate("-round burst");
}