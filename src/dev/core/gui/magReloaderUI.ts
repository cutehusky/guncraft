let magReloadUI = new UI.StandardWindow({
	standard: {
		inventory: {
			standard: true
		},
		header: {
			text: {
				text: Translation.translate("Magazine reloader")
			}
		}
	},
	drawing: [{ type: "background", color: 0 }],
	elements: (function (): UI.ElementSet {
		let obj = {};
		for (let k: number = 0; k < 5; k++) {
			for (let i: number = 0; i < 10; i++) {
				obj["slot" + (i + 1 + k * 10)] = {
					type: "slot",
					x: i * 100,
					y: 100 * k,
					size: 96
				}
			}
		}
		return obj
	})()
});
