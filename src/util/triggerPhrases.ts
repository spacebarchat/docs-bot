// SPDX-FileCopyrightText: 2023 Spacebar Contributors <https://spacebar.chat>
// SPDX-FileCopyrightText: 2023 Maddy <https://github.com/MaddyUnderStars>
//
// SPDX-License-Identifier: AGPL-3.0-or-later
import { Message } from "discord.js";
import docsCommand from "./../commands/docs.js";

const sendDocs = async (
	query: string,
	replyMessage: string,
	caller: Message,
) => {
	const resp = await docsCommand.exec(
		Object.assign({}, caller, { args: query.split(" ") }),
	);

	resp.content = replyMessage;
	caller.reply(resp);
	return true;
};

export const triggerPhrase = async (caller: Message): Promise<boolean> => {
	if (!caller.member || !caller.member.joinedAt) return false;

	if (process.env.NODE_ENV !== "development") {
		// don't bother people that have been here at least a week
		const week = new Date();
		week.setDate(new Date().getDate() - 7);
		if (caller.member.joinedAt.valueOf() < week.valueOf()) return false;

		// or if they have a role
		if (caller.member.roles.cache.size > 1) return false;
	}

	const content = caller.content.toLowerCase();

	if (
		(content === "help" || content === "help please") &&
		caller.attachments.size === 0 // they probably told us in the attachment
	) {
		await caller.reply(
			"We cannot help you if you do not tell us what your issue is.",
		);
		return true;
	}

	if (
		content.includes("/api/ping") ||
		content.includes('"ping":"pong!"') ||
		content.includes("ping pong")
	) {
		await caller.reply(
			"You're looking at the normal output of your Spacebar instance. " +
				"To connect and use your instance, you'll need a client.\n" +
				"You can find the official Spacebar client at <https://app.fosscord.com> or <https://github.com/spacebarchat/client>.",
		);
		return true;
	}

	if (
		content.includes("how") &&
		(content.includes("badges") || content.includes("user flags"))
	) {
		return await sendDocs(
			"user flags",
			"You can change a users flags by setting the `public_flags` column of the `users` table in your database.",
			caller,
		);
	}

	if (content.includes("syntaxerror: unexpected token '.'")) {
		await caller.reply(
			"Update your NodeJS version to at least version 16. " +
				"Check out <https://github.com/nodesource/distributions> if you're on Linux, or https://nodejs.org/en/ on Windows.",
		);
		return true;
	}

	if (content.match(/unexpected (token \w|number) in json at position \d/g)) {
		await caller.reply(
			"You have misconfigured your database. " +
				"If you have recently edited the `config` table, it's values are JSON. " +
				'Strings must be wrapped in quotes. For example, `"https://staging.spacebar.chat"`',
		);
		return true;
	}

	if (
		(content.includes("voice") || content.includes("webrtc")) &&
		(content.includes("when") ||
			(content.includes("is") && content.includes("working")))
	) {
		await caller.reply(
			"Webrtc (voice and video support) is planned, but is not ready yet." +
				" It is a very difficult feature to implement, as we must replicate Discord's server behaviour exactly.\n" +
				"There is no ETA on when voice and video support will be available.",
		);
		return true;
	}

	if (
		["replit", "heroku", "vercel", "glitch", "playit", "beget"].find((x) =>
			content.includes(x),
		) &&
		(content.includes("can spacebar be hosted on") ||
			content.includes("can i host spacebar on") ||
			content.includes("can i use") ||
			content.includes("put on") ||
			content.includes("put it on"))
	) {
		await caller.reply(
			"Hosting Spacebar on replit, heroku, vercel, or other such platforms is not supported. " +
				"While you *can* do it, it is not a good experience for the user or the instance owner.\n" +
				"A big issue with hosting on replit is that you have nowhere to host a dedicated database, which forces you to use sqlite, " +
				"but you cannot edit the sqlite database that is used.",
		);
		return true;
	}

	return false;
};
