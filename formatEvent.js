const { EmbedBuilder } = require('discord.js');

function truncate(str, max) {
  if (!str) return str;
  return str.length > max ? `${str.slice(0, max - 1)}…` : str;
}

function stripMarkdownImages(text) {
  // VATSIM descriptions are Markdown; Discord embeds render Markdown too,
  // but strip raw image tags so they don't clutter the description.
  return (text || '').replace(/!\[.*?\]\(.*?\)/g, '').trim();
}

function formatEvent(event) {
  const start = new Date(event.start_time);
  const end = new Date(event.end_time);
  const startUnix = Math.floor(start.getTime() / 1000);
  const endUnix = Math.floor(end.getTime() / 1000);

  const airports = (event.airports || []).map((a) => a.icao).filter(Boolean);
  const organisers = (event.organisers || [])
    .map((o) => o.subdivision || o.division || o.region)
    .filter(Boolean);

  const embed = new EmbedBuilder()
    .setTitle(truncate(event.name, 256))
    .setURL(event.link || null)
    .setDescription(truncate(stripMarkdownImages(event.short_description || event.description), 2048))
    .setColor(0x0099ff)
    .addFields(
      { name: 'Starts', value: `<t:${startUnix}:F> (<t:${startUnix}:R>)`, inline: false },
      { name: 'Ends', value: `<t:${endUnix}:F>`, inline: false }
    )
    .setFooter({ text: 'VATSIM Events' })
    .setTimestamp(start);

  if (airports.length) {
    embed.addFields({ name: 'Airports', value: airports.join(', '), inline: true });
  }
  if (organisers.length) {
    embed.addFields({ name: 'Organised by', value: organisers.join(', '), inline: true });
  }
  if (event.banner) {
    embed.setImage(event.banner);
  }

  return embed;
}

module.exports = { formatEvent };
