// SPDX-FileCopyrightText: 2023 Spacebar Contributors <https://spacebar.chat>
// SPDX-License-Identifier: AGPL-3.0-or-later

import type * as Discord from "discord.js";

import docs from "./docs.js";
import phrase from "./phrase.js";

export type MessageWithArgs = Discord.Message & {
	args: string[];
};

type OrPromise<T> = T | Promise<T>;

export type CommandType = {
	name: string;
	description: string;
	options: Discord.APIApplicationCommandOption[];
	exec: (
		caller: MessageWithArgs | Discord.ChatInputCommandInteraction,
	) => OrPromise<Discord.BaseMessageOptions | undefined>;
	autocomplete?: (caller: Discord.AutocompleteInteraction) => unknown;
};

const commands: CommandType[] = [docs, phrase];

export default commands;
