ConfigureMultiplayer({
	name: "Guncraft",
	version: "1.0",
	isClientOnly: false
});

ModAPI.addAPICallback("KernelExtension", function (api) {
	if (typeof api.getKEXVersionCode === "function" && api.getKEXVersionCode() >= 400)
		Launch({ KEX: api });
	else
		Logger.Log("You must have at least 4.0 version of Kernel Extension!", "Guncraft");
});
