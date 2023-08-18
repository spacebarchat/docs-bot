// SPDX-FileCopyrightText: 2023 Spacebar Contributors <https://spacebar.chat>
// SPDX-License-Identifier: AGPL-3.0-or-later

import * as Discord from "discord.js";
import type { CommandType } from ".";
import { triggerPhrase } from "../util/triggerPhrases.js";

export default {
	name: "phrase",
	description: "Respond to this message as if it was a trigger phrase",
	options: [
		{
			name: "keywords",
			description:
				"Trigger phrase keywords (cannot be used as a /command)",
			type: Discord.ApplicationCommandOptionType.String,
		},
	],

	exec: async (caller) => {
		if (caller instanceof Discord.ChatInputCommandInteraction) return;

		let message = caller.args.join(" ");

		if (!message) {
			if (
				!(caller instanceof Discord.ChatInputCommandInteraction) &&
				caller?.reference?.messageId
			) {
				const referenced = await caller.channel.messages.fetch(
					caller.reference.messageId,
				);

				message = referenced.content;
			}
		}

		caller.content = message;
		caller.member;
		await triggerPhrase(caller as Discord.Message, true);

		return undefined;
	},
} as CommandType;
