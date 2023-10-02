let displayerUI: UI.Window = new UI.Window({
	location: {
		x: 0,
		y: 0,
		width: 300 * UIScale,
		height: 55 * UIScale,
	},
	drawing: [
		{ type: "background", color: 0 },
		{ type: "bitmap", x: 0, y: 0, scale: 1.425 / UIScale, bitmap: "displayer" }
	],
	elements: {
		"content": {
			type: "text",
			x: 375,
			y: 25,
			text: "",
			multiline: false,
			format: true,
			font: {
				size: 50,
				align: com.zhekasmirnov.innercore.api.mod.ui.types.Font.ALIGN_CENTER,
				bold: true,
				color: android.graphics.Color.WHITE
			}
		}
	}
});
displayerUI.setAsGameOverlay(true);
displayerUI.setTouchable(false);
