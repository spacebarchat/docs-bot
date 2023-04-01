// SPDX-FileCopyrightText: ?????
// SPDX-FileCopyrightText: 2023 Maddy <https://github.com/MaddyUnderStars>
//
// SPDX-License-Identifier: AGPL-3.0???
import { Message } from "discord.js";
import fetch from "node-fetch";

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
	for (let i = lines[0] - 1; i <= lines[1]; i++) {
		if (fileLines.length < i || i < 0) break;
		if (fileLines[i] == undefined) break;
		out += fileLines[i] + "\n";
	}

	if (!out) return false;

	const fileType = url.pathname.split(".").reverse()[0];

	await caller.reply(
		url.pathname.split("/").reverse()[0] +
			url.hash +
			"\n```" +
			fileType +
			"\n" +
			out +
			"```",
	);

	return true;
};
