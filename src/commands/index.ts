import type * as Discord from "discord.js";

import docs from "./docs.js";

export type CommandType = {
	name: string;
	description: string;
	options: Discord.APIApplicationCommandOption[];
	exec: (interaction: Discord.CommandInteraction) => unknown;
};

const commands: CommandType[] = [docs];

export default commands;
