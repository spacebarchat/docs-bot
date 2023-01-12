import type * as Discord from "discord.js";
import Commands from "./commands/index.js";

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

			await command.exec(interaction);
			return;
		}
	};
}
