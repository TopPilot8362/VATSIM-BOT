const { fetchLatestEvents, eventMatchesFilter } = require('./vatsim');
const { getWebhookClient } = require('./webhookManager');
const { formatEvent } = require('./formatEvent');
const storage = require('./storage');
const config = require('./config');

/**
 * Checks every configured guild for new VATSIM events matching its filter,
 * and posts any it hasn't posted before via that guild's webhook.
 * Returns a summary array for logging / manual-trigger feedback.
 */
async function pollAndAnnounce(client) {
  const guildConfigs = storage.getGuildConfigs();
  const guildIds = Object.keys(guildConfigs);
  if (guildIds.length === 0) return [];

  let events;
  try {
    events = await fetchLatestEvents(config.eventsFetchLimit);
  } catch (err) {
    console.error('Failed to fetch VATSIM events:', err.message);
    return [];
  }

  const summary = [];

  for (const guildId of guildIds) {
    const cfg = guildConfigs[guildId];
    if (!cfg?.webhookId || !cfg?.webhookToken) continue;

    const alreadyPosted = storage.getPostedIds(guildId);
    const matching = events.filter(
      (e) => eventMatchesFilter(e, cfg.division, cfg.subdivision) && !alreadyPosted.has(e.id)
    );

    if (matching.length === 0) {
      summary.push({ guildId, posted: 0 });
      continue;
    }

    const webhookClient = getWebhookClient(cfg.webhookId, cfg.webhookToken);
    const postedIds = [];

    // Oldest-starting first, so the channel reads chronologically
    matching.sort((a, b) => new Date(a.start_time) - new Date(b.start_time));

    for (const event of matching) {
      try {
        await webhookClient.send({
          username: 'VATSIM Events',
          embeds: [formatEvent(event)],
        });
        postedIds.push(event.id);
      } catch (err) {
        console.error(`Failed to post event ${event.id} to guild ${guildId}:`, err.message);
        // If the webhook itself is gone (deleted in Discord), stop trying
        // for this guild this round rather than erroring on every event.
        if (err.code === 10015) break;
      }
    }

    if (postedIds.length) {
      storage.markPosted(guildId, postedIds);
    }
    summary.push({ guildId, posted: postedIds.length });
  }

  return summary;
}

module.exports = { pollAndAnnounce };
