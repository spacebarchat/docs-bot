import type * as Discord from "discord.js";

import docs from "./docs.js";

export type MessageWithArgs = Discord.Message & {
	args: string[];
};

export type CommandType = {
	name: string;
	description: string;
	options: Discord.APIApplicationCommandOption[];
	exec: (
		caller: MessageWithArgs | Discord.ChatInputCommandInteraction,
	) => Discord.BaseMessageOptions | Promise<Discord.BaseMessageOptions>;
	autocomplete?: (caller: Discord.AutocompleteInteraction) => unknown;
};

const commands: CommandType[] = [docs];

export default commands;
