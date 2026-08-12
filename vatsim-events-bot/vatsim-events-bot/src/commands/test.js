const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { pollAndAnnounce } = require('../announcer');
const storage = require('../storage');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('vatsim-events-test')
    .setDescription('Run a VATSIM event check right now instead of waiting for the schedule')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageWebhooks),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const cfg = storage.getGuildConfig(interaction.guildId);
    if (!cfg) {
      await interaction.editReply('This server has no announcement channel set up. Run `/vatsim-events-setup` first.');
      return;
    }

    const results = await pollAndAnnounce(interaction.client);
    const mine = results.find((r) => r.guildId === interaction.guildId);
    const posted = mine ? mine.posted : 0;

    await interaction.editReply(
      posted > 0
        ? `✅ Posted ${posted} new event${posted === 1 ? '' : 's'} to <#${cfg.channelId}>.`
        : 'No new events to post right now.'
    );
  },
};
