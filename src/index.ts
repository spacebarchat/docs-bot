import "dotenv/config";
import * as Discord from "discord.js";
import Bot from "./bot.js";

const client = new Discord.Client({
	intents: [],
});

const bot = new Bot(client);

client.on("ready", bot.ready);
client.on("interactionCreate", bot.interactionCreate);

client.login(process.env.TOKEN);