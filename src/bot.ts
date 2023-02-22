import type * as Discord from "discord.js";
import Commands, { MessageWithArgs } from "./commands/index.js";
import { ghFilePreview } from "./util/ghFIlePreview.js";
import { triggerPhrase } from "./util/triggerPhrases.js";

const PREFIX = process.env.PREFIX as string;

export default class Bot {
	client: Discord.Client;

	constructor(client: Discord.Client) {
		this.client = client;
	}

	ready = async () => {
		for (const command of Commands) {
			await this.client.application?.commands.create({
				name: command.name,
				description: command.description,
				options: command.options,
			});
		}

		console.log(`Ready as ${this.client.user?.tag}`);
	};

	interactionCreate = async (interaction: Discord.Interaction) => {
		if (interaction.isChatInputCommand()) {
			const command = Commands.find(
				(x) => x.name == interaction.commandName,
			);
			if (!command) return;

			const ret = await command.exec(interaction);
			await interaction.reply(ret);

			return;
		} else if (interaction.isAutocomplete()) {
			const command = Commands.find(
				(x) => x.name == interaction.commandName,
			);
			if (!command || !command.autocomplete) return;

			await command.autocomplete(interaction);
		}
	};

	messageCreate = async (message: Discord.Message) => {
		if (message.author.bot) return;

		const wasTriggerPhrase = await triggerPhrase(message);
		if (wasTriggerPhrase) return;

		const wasGhPreview = await ghFilePreview(message);
		if (wasGhPreview) return;

		if (!message.content.startsWith(PREFIX)) return;

		const args = message.content.slice(PREFIX.length).split(" ");

		const cmd = args.shift(); // mutates the args array

		const found = Commands.find((x) => x.name == cmd);
		if (!found) return;

		// TODO: Parse command options and check for any required fields?
		const withArgs: MessageWithArgs = Object.assign({}, message, { args });
		const ret = await found.exec(withArgs);
		await message.reply(ret);

		return;
	};
}
