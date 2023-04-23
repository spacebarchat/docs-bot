// SPDX-FileCopyrightText: 2023 Vendicated and contributors <https://github.com/Vendicated/Vencord>
// SPDX-License-Identifier: GPL-3.0-or-later

export function unindent(str: string) {
	// Users cannot send tabs, they get converted to spaces. However, a bot may send tabs, so convert them to 4 spaces first
	str = str.replace(/\t/g, "    ");
	const minIndent =
		str
			.match(/^ *(?=\S)/gm)
			?.reduce((prev, curr) => Math.min(prev, curr.length), Infinity) ??
		0;

	if (!minIndent) return str;
	return str.replace(new RegExp(`^ {${minIndent}}`, "gm"), "");
}
