const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const storage = require('../storage');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('vatsim-events-disable')
    .setDescription('Stop posting VATSIM event announcements in this server')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageWebhooks),

  async execute(interaction) {
    const cfg = storage.getGuildConfig(interaction.guildId);
    if (!cfg) {
      await interaction.reply({ content: 'Announcements are not currently set up here.', ephemeral: true });
      return;
    }

    storage.removeGuildConfig(interaction.guildId);
    await interaction.reply({
      content:
        '✅ VATSIM event announcements are disabled for this server. ' +
        'The webhook itself was left in place in case you want to re-enable — delete it manually in channel settings if not.',
      ephemeral: true,
    });
  },
};
