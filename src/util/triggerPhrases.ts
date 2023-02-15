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

	// don't bother people that have been here at least a week
	const week = new Date();
	week.setDate(new Date().getDate() - 7);
	if (caller.member.joinedAt.valueOf() < week.valueOf()) return false;

	// or if they have a role
	if (caller.member.roles.cache.size > 1) return false;

	const content = caller.content;

	if (
		(content.toLowerCase() === "help" ||
			content.toLowerCase() === "help please") &&
		caller.attachments.size === 0 // they probably told us in the attachment
	) {
		caller.reply(
			"We cannot help you if you do not tell us what your issue is.",
		);
		return true;
	}

	if (content.includes("/api/ping") || content.includes('"ping":"pong!"'))
		return await sendDocs(
			"test client",
			"By default the test Discord.com client is disabled, which is why you are getting sent to /api/ping. To enable it, follow this guide.",
			caller,
		);

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

	if (content.includes("SyntaxError: Unexpected token '.'")) {
		caller.reply(
			"Update your NodeJS version to at least version 16. " +
				"Check out <https://github.com/nodesource/distributions> if you're on Linux, or https://nodejs.org/en/ on Windows.",
		);
		return true;
	}

	if (content.match(/Unexpected (token \w|number) in JSON at position \d/g)) {
		caller.reply(
			"You have misconfigured your database. " +
				"If you have recently edited the `config` table, it's values are JSON. " +
				'Strings must be wrapped in quotes. For example, `"https://staging.fosscord.com"`',
		);
		return true;
	}

	return true;
};
