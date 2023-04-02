// SPDX-FileCopyrightText: 2023 Spacebar Contributors <https://spacebar.chat>
// SPDX-FileCopyrightText: 2023 Maddy <https://github.com/MaddyUnderStars>
//
// SPDX-License-Identifier: AGPL-3.0-or-later
import "dotenv/config";
import * as Discord from "discord.js";
import Bot from "./bot.js";

const client = new Discord.Client({
	intents: ["MessageContent", "GuildMessages", "Guilds"],
});

const bot = new Bot(client);

client.on("ready", bot.ready);
client.on("interactionCreate", bot.interactionCreate);
client.on("messageCreate", bot.messageCreate);

client.login(process.env.TOKEN);
