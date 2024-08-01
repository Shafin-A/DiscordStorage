const { Events } = require("discord.js");
require("dotenv").config({ path: "./.env" });

const textChannelID = process.env.TEXT_CHANNEL_ID;

module.exports = {
  name: Events.ClientReady,
  once: true,
  async execute(client) {
    console.log(client.channels.cache);
    const channel = await client.channels.fetch(textChannelID);
    await channel.send("Hi!");
    console.log(`Ready! Logged in as ${client.user.tag}`);
  },
};
