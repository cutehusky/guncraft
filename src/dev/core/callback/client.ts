let lastScreen: string = "";
Callback.addCallback("NativeGuiChanged", function (curScreen: string): void {
	lastScreen = curScreen;
	if (curScreen == "in_game_play_screen") {
		//open ui
		if (modifyMode && !modifyUI.isOpened())
			modifyUI.open();
		if (fireMode && !GUI.isOpened()) {
			GUI.open();
			displayerUIContainer.openAs(displayerUI);
		}
	} else {
		//close ui
		if (modifyUI.isOpened())
			modifyUI.close();
		if (GUI.isOpened()) {
			GUI.close();
			displayerUIContainer.close();
		}
	}
});

Callback.addCallback("LocalLevelLoaded", function (): void {
	Player.resetFov();
	modifyMode = false;
	fireMode = false;
});
