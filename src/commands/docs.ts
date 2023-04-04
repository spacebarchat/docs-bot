// SPDX-FileCopyrightText: 2023 Spacebar Contributors <https://spacebar.chat>
// SPDX-FileCopyrightText: 2023 Maddy <https://github.com/MaddyUnderStars>
//
// SPDX-License-Identifier: AGPL-3.0-or-later
import * as Discord from "discord.js";
import type { CommandType } from ".";
import lunr from "lunr";
import fetch from "node-fetch";
import he from "he";

const SEARCH_ENDPOINT = "/search/search_index.json";
const SPACEBAR_DOCS_BASE_URL = "https://docs.spacebar.chat";

type MKDOCS_RESULT = {
	location: string;
	title: string;
	text: string;
};

type MKDOCS_SEARCH_RESULTS = {
	config: {
		lang: string[];
		separator: string;
		pipeline: string[];
	};
	docs: MKDOCS_RESULT[];
};

type CACHE_TYPE = {
	value?: MKDOCS_SEARCH_RESULTS;
	index?: lunr.Index;
	fetched?: Date;
	ttl: number;
};

const cache: CACHE_TYPE = {
	value: undefined,
	fetched: undefined,
	ttl: 1000 * 60 * 5, // 5 minutes
};

const replaceHtml = (x: string) =>
	x
		.replaceAll("<p>", "")
		.replaceAll("</p>", "\n\n")
		.replaceAll("<pre><code>", "```")
		.replaceAll("</code></pre>", "```")
		.replaceAll("<code>", "`")
		.replaceAll("</code>", "`")
		.replaceAll("<ol>", "")
		.replaceAll("</ol>", "\n")
		.replaceAll("<li>", "*")
		.replaceAll("</li>", "\n")
		.replaceAll("<ul>", "*")
		.replaceAll("</ul>", "");

const getDocs = async () => {
	if (
		!cache.value ||
		(cache.fetched?.valueOf() ?? 0) + cache.ttl < Date.now()
	) {
		const res = await fetch(SPACEBAR_DOCS_BASE_URL + SEARCH_ENDPOINT);
		const json = (await res.json()) as MKDOCS_SEARCH_RESULTS;

		json.docs = json.docs
			.map((x) => ({
				title: replaceHtml(x.title),
				text: replaceHtml(x.text),
				location: x.location,
			}))
			.filter((x) => x.text.length > 0);
		cache.value = json;
		cache.fetched = new Date();

		cache.index = lunr(function () {
			this.ref("location");
			this.field("title", { boost: 2 });
			this.field("location", { boost: 1 });
			this.field("text");

			json.docs.forEach((x) => this.add(x));
		});
	}

	return { index: cache.index as lunr.Index, docs: cache.value.docs };
};

export default {
	name: "docs",
	description: "Search the Spacebar documentation",
	options: [
		{
			name: "query",
			description: "The query to search for",
			type: Discord.ApplicationCommandOptionType.String,
			autocomplete: true,
		},
	],

	exec: async (caller) => {
		const query =
			caller instanceof Discord.ChatInputCommandInteraction
				? caller.options.getString("query")
				: caller.args.join(" ");

		if (!query) {
			return SPACEBAR_DOCS_EMBED;
		}

		const search = await getDocs();
		const searchResult = search.index.search(query);

		const docs = searchResult.map((x) =>
			search.docs.find((y) => y.location == x.ref),
		) as MKDOCS_RESULT[];

		if (!docs || docs.length == 0)
			return "Could not find any matching documents. Try a simpler query.";

		const main = docs.shift() as MKDOCS_RESULT;

		// below mess trims the text to some length, and then expands to preserve code blocks.
		const textGoal = main.text.slice(0, 300);
		const lastCodeBlockStart = textGoal.lastIndexOf("`");
		const description =
			lastCodeBlockStart !== -1
				? main.text.slice(
						0,
						lastCodeBlockStart +
							main.text
								.slice(lastCodeBlockStart + 3)
								.indexOf("`") +
							6,
				  )
				: textGoal;

		return {
			embeds: [
				{
					title: main.title,
					url: `${SPACEBAR_DOCS_BASE_URL}/${main.location}`,
					description: he.decode(description) + " ...",
					fields: docs
						.filter((x) => !!x.text)
						.map((x) => ({
							name: x.title,
							value: `[Link](${SPACEBAR_DOCS_BASE_URL}/${x.location})`,
							inline: true,
						}))
						.slice(0, 4),
					footer: {
						text: "https://docs.spacebar.chat",
					},
				},
			],
		};
	},

	autocomplete: async (caller) => {
		// thanks djs guide! https://discordjs.guide/slash-commands/autocomplete.html#sending-results
		const focus = caller.options.getFocused();
		const res = await getDocs();
		const docs = res.docs.filter((x) => x.title);

		const searchResult = res.index
			.search(focus)
			.map((x) => docs.find((y) => y.location == x.ref));

		const responses = searchResult
			.map((x) => ({
				...x,
				location: new URL(`${SPACEBAR_DOCS_BASE_URL}/${x?.location}`),
			}))
			.map((x) => ({
				name: `${x.title} - ${x.location.pathname}`.slice(0, 100),
				value: (x.title as string).slice(0, 100),
			}))
			.slice(0, 25);

		await caller.respond(responses);
	},
} as CommandType;

const SPACEBAR_DOCS_EMBED = {
	embeds: [
		{
			title: "Spacebar Documentation",
			url: SPACEBAR_DOCS_BASE_URL,
			description:
				"Spacebar is a free and open source, selfhostable, Discord.com-compatible chat platform.",
			fields: [
				{
					inline: true,
					name: "FAQ",
					value: `[Link](${SPACEBAR_DOCS_BASE_URL}/faq)`,
				},
				{
					inline: true,
					name: "Server Setup",
					value: `[Link](${SPACEBAR_DOCS_BASE_URL}/server/setup)`,
				},
				{
					inline: true,
					name: "Reverse Proxies",
					value: `[Link](${SPACEBAR_DOCS_BASE_URL}/setup/server/reverseProxy)`,
				},
				{
					inline: true,
					name: "Configuration",
					value: `[Link](${SPACEBAR_DOCS_BASE_URL}/setup/server/configuration)`,
				},
				{
					inline: true,
					name: "Security",
					value: `[Link](${SPACEBAR_DOCS_BASE_URL}/setup/server/security/)`,
				},
				{
					inline: true,
					name: "Contributing",
					value: `[Link](${SPACEBAR_DOCS_BASE_URL}/contributing)`,
				},
			],
		},
	],
};
