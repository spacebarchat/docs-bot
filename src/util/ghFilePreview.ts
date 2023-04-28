// SPDX-FileCopyrightText: 2023 Spacebar Contributors <https://spacebar.chat>
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Message } from "discord.js";
import fetch from "node-fetch";
import { unindent } from "./unindent";

const LINK_REGEX =
	/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/g;

const GITHUB_RAW_HOST = "https://raw.githubusercontent.com";

export const ghFilePreview = async (caller: Message): Promise<boolean> => {
	// Thanks aliucord for the inspiration

	// also the below code sucks lol don't care

	const content = caller.content;
	const links = content.match(LINK_REGEX);
	if (!links || !links.length) return false;

	// it's a bit too spammy I think
	const link = links[0];

	const url = new URL(link);

	if (url.hostname !== "github.com") return false;

	const lines = url.hash
		.match(/\d*/g)
		?.filter((x) => !!x)
		.map((x) => parseInt(x))
		.sort((a, b) => a - b);
	if (!url.hash || !lines) return false;

	const res = await fetch(
		`${GITHUB_RAW_HOST}${url.pathname.replace("/blob/", "/")}`, // lol hack
	);
	const file = await res.text();
	const fileLines = file.split("\n");

	let out = "";
	for (let i = lines[0] - 1; i <= (lines[1] || lines[0] - 1); i++) {
		if (fileLines.length < i || i < 0) break;
		if (fileLines[i] == undefined) break;
		out += fileLines[i] + "\n";
	}

	if (!out) return false;

	out = unindent(out);

	const fileType = url.pathname.split(".").reverse()[0];

	const msg =
		url.pathname.split("/").reverse()[0] + // file name
		url.hash + // line numbers
		"\n```" +
		fileType +
		"\n";

	// 2000 is maximum discord.com message length. -3 for ``` at end.
	await caller.reply(msg + out.substring(0, 2000 - msg.length - 3) + "```");

	return true;
};
