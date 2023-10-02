let lastScreen: string = "";
Callback.addCallback("NativeGuiChanged", function (a: string): void {
	lastScreen = a;
	if (a == "in_game_play_screen") {
		//open ui
		if (modifyMode && !modifyUI.isOpened())
			modifyUI.open();
		if (fireMode && !GUI.isOpened()) {
			GUI.open();
			c_displayer.openAs(displayerUI);
		}
	} else {
		//close ui
		if (modifyUI.isOpened())
			modifyUI.close();
		if (GUI.isOpened()) {
			GUI.close();
			c_displayer.close();
		}
	}
});

Callback.addCallback("LocalLevelLoaded", function (): void {
	Player.resetFov();
	modifyMode = false;
	fireMode = false;
});
