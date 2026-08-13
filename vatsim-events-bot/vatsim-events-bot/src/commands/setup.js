const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { getOrCreateWebhook } = require('../webhookManager');
const storage = require('../storage');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('vatsim-events-setup')
    .setDescription('Set the channel where VATSIM event announcements are posted')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageWebhooks)
    .addChannelOption((opt) =>
      opt
        .setName('channel')
        .setDescription('Channel to post announcements in')
        .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
        .setRequired(true)
    )
    .addStringOption((opt) =>
      opt
        .setName('division')
        .setDescription('Only announce events organised by this VATSIM division (e.g. EMEA)')
        .setRequired(false)
    )
    .addStringOption((opt) =>
      opt
        .setName('subdivision')
        .setDescription('Only announce events organised by this VATSIM subdivision (e.g. VATSSA)')
        .setRequired(false)
    ),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const channel = interaction.options.getChannel('channel');
    const division = interaction.options.getString('division');
    const subdivision = interaction.options.getString('subdivision');

    try {
      const webhook = await getOrCreateWebhook(channel);

      storage.setGuildConfig(interaction.guildId, {
        channelId: channel.id,
        webhookId: webhook.id,
        webhookToken: webhook.token,
        division: division || null,
        subdivision: subdivision || null,
      });

      const filterNote = subdivision
        ? ` filtered to subdivision **${subdivision}**`
        : division
        ? ` filtered to division **${division}**`
        : ' with no filter (all VATSIM events)';

      await interaction.editReply(
        `✅ VATSIM event announcements will now be posted in ${channel}${filterNote}. ` +
          `New events are checked on a schedule — use \`/vatsim-events-test\` to run a check right now.`
      );
    } catch (err) {
      console.error('Setup failed:', err);
      await interaction.editReply(`❌ Setup failed: ${err.message}`);
    }
  },
};
