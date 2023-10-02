const File = java.io.File,
	StringBuffer = java.lang.StringBuffer,
	Files = java.nio.file.Files;

namespace FileUtils {

	export function isDirectory(path: string): boolean {
		return new File(path).isDirectory();
	}

	export function ReadText(path: string): string {
		let file = new File(path),
			str = new java.lang.StringBuilder(),
			reader = new java.io.BufferedReader(new java.io.FileReader(file)),
			line = "";
		while (line = reader.readLine())
			str.append(line).append("\n");
		reader.close();
		return str.toString();
	}

	export function WriteText(path: string, text: string, add?: boolean): void {
		let file = new File(path),
			writer = new java.io.PrintWriter(
				new java.io.BufferedWriter(new java.io.FileWriter(file, add || false)));
		writer.write(text);
		writer.close();
	}

	export function ReadJson(path: string): object {
		var text = ReadText(path);
		return JSON.parse(text);
	}

	export function WriteJson(path: string, obj: object, beautify?: boolean) {
		var textFile = JSON.stringify(obj, null, beautify ? "\t" : null);
		WriteText(path, textFile);
	}

	export function Delete(path: string): boolean {
		let dir = new File(path);
		if (!dir.delete()) {
			if (!dir.isDirectory())
				return false;
			let filePath = dir.list(),
				b = true;
			for (let index = 0; index < filePath.length; index++)
				b = Delete(path + File.separator + filePath[index]) && b;
			return b;
		}
		return true;
	}

	export function Rename(path: string, newName: string): boolean {
		return new File(path).renameTo(
			new File(path.slice(0, path.lastIndexOf('/') + 1) + newName));
	}

	export function Copy(sourcePath: string, targetPath: string,
		include?: string, move?: boolean): boolean {
		let source = new File(sourcePath),
			target = new File(targetPath);
		if (!source.exists())
			return false;
		if (!target.exists())
			target.mkdirs();
		if (!source.isDirectory()) {
			if (!include || source.getName().endsWith(include))
				return CopyFile(source, target, move);
			return true;
		}
		if (!target.isDirectory())
			return false;
		let filePath = source.list(),
			b = true;
		for (let index = 0; index < filePath.length; index++)
			b = Copy(sourcePath + File.separator + filePath[index],
				targetPath + File.separator + filePath[index], include, move) && b;
		return b;
	}

	function CopyFile(source: java.io.File, target: java.io.File, move?: boolean): boolean {
		try {
			let option = [java.nio.file.StandardCopyOption.REPLACE_EXISTING,
			java.nio.file.StandardCopyOption.COPY_ATTRIBUTES];
			move ? Files.move(source.toPath(), target.toPath(), option)
				: Files.copy(source.toPath(), target.toPath(),
					option);
		} catch (e) {
			return false;
		}
		return true;
	}
}
