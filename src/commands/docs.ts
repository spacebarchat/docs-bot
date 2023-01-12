import * as Discord from "discord.js";
import type { CommandType } from ".";
import lunr from "lunr";
import fetch from "node-fetch";

const SEARCH_ENDPOINT = "/search/search_index.json";
const FOSSCORD_DOCS_BASE_URL = "https://docs.fosscord.com";

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

export default {
	name: "docs",
	description:
		"Search the Fosscord documentation and returns a link to the best",
	options: [
		{
			name: "query",
			description: "The query to search for",
			type: Discord.ApplicationCommandOptionType.String,
			required: true,
		},
	],
	exec: async (interaction: Discord.CommandInteraction) => {
		if (!interaction.isChatInputCommand()) return;

		const query = interaction.options.getString("query");
		if (!query) {
			return interaction.reply("You need to provide a search query.");
		}

		const res = await fetch(FOSSCORD_DOCS_BASE_URL + SEARCH_ENDPOINT);
		const search = (await res.json()) as MKDOCS_SEARCH_RESULTS;

		const index = lunr(function () {
			this.ref("title");
			this.field("title", { boost: 2 });
			this.field("location", { boost: 1 });
			this.field("text");

			search.docs.forEach((x) => this.add(x));
		});

		const replaceHtml = (x: string) =>
			x
				.replaceAll("<p>", "")
				.replaceAll("</p>", "\n\n")
				.replaceAll("<code>", "`")
				.replaceAll("</code>", "`");

		const searchResult = index.search(query);
		const docs = searchResult
			.map((x) => search.docs.find((y) => y.title == x.ref))
			.map((x) => ({
				...x,
				title: replaceHtml(x?.title || ""),
				text: replaceHtml(x?.text || ""),
			})) as MKDOCS_RESULT[];

		if (!docs || docs.length == 0)
			return await interaction.reply(
				"Could not find any matching documents. Try a simpler query.",
			);

		const main = docs.shift() as MKDOCS_RESULT;

		return await interaction.reply({
			embeds: [
				{
					title: main.title,
					url: `${FOSSCORD_DOCS_BASE_URL}/${main.location}`,
					description: main.text.slice(0, 250) + " ...",
					fields: docs
						.filter((x) => !!x.text)
						.map((x) => ({
							name: x.title,
							value:
								x.text.slice(0, 50) +
								` ...\n[Link](${FOSSCORD_DOCS_BASE_URL}/${x.location})`,
							inline: true,
						}))
						.slice(0, 4),
					footer: {
						text: "https://docs.fosscord.com",
					},
				},
			],
		});
	},
} as CommandType;
