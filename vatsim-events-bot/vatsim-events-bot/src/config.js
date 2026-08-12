require('dotenv').config();

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

module.exports = {
  token: requireEnv('DISCORD_TOKEN'),
  clientId: requireEnv('DISCORD_CLIENT_ID'),
  guildId: process.env.DISCORD_GUILD_ID || null,
  pollCron: process.env.POLL_CRON || '*/15 * * * *',
  eventsFetchLimit: Number(process.env.EVENTS_FETCH_LIMIT || 50),
  vatsimEventsUrl: (limit) => `https://my.vatsim.net/api/v2/events/latest/${limit}`,
};
