const fs = require('fs');
const path = require('path');
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const cron = require('node-cron');
const config = require('./config');
const { pollAndAnnounce } = require('./announcer');

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs
  .readdirSync(commandsPath)
  .filter((file) => file.endsWith('.js') && file !== 'deploy-commands.js');

for (const file of commandFiles) {
  const command = require(path.join(commandsPath, file));
  client.commands.set(command.data.name, command);
}

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
  console.log(`Polling VATSIM events on schedule: ${config.pollCron}`);

  // Run once shortly after startup so newly-configured servers don't
  // wait for the first cron tick, then follow the configured schedule.
  setTimeout(() => runPoll(), 10_000);

  cron.schedule(config.pollCron, () => runPoll());
});

async function runPoll() {
  try {
    const results = await pollAndAnnounce(client);
    const totalPosted = results.reduce((sum, r) => sum + r.posted, 0);
    if (totalPosted > 0) {
      console.log(`Posted ${totalPosted} new event(s) across ${results.length} guild(s).`);
    }
  } catch (err) {
    console.error('Error during scheduled poll:', err);
  }
}

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (err) {
    console.error(`Error executing ${interaction.commandName}:`, err);
    const payload = { content: 'There was an error running that command.', ephemeral: true };
    if (interaction.deferred || interaction.replied) {
      await interaction.editReply(payload);
    } else {
      await interaction.reply(payload);
    }
  }
});

client.login(config.token);
