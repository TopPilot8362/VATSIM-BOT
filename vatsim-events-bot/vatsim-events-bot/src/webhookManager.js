const { WebhookClient } = require('discord.js');

const WEBHOOK_NAME = 'VATSIM Events';
const AVATAR_URL =
  'https://raw.githubusercontent.com/vatsimnetwork/branding/master/logos/logo-icon-transparent.png';

/**
 * Finds an existing "VATSIM Events" webhook in the given channel, or
 * creates one if none exists. Returns { id, token } which is what gets
 * persisted so future posts don't need to touch the channel API at all.
 */
async function getOrCreateWebhook(channel) {
  const me = channel.guild.members.me;
  if (!me?.permissionsIn(channel).has('ManageWebhooks')) {
    throw new Error(
      "I don't have Manage Webhooks permission in that channel. Grant it and try again."
    );
  }

  const existingWebhooks = await channel.fetchWebhooks();
  let webhook = existingWebhooks.find((wh) => wh.name === WEBHOOK_NAME && wh.owner?.id === channel.client.user.id);

  if (!webhook) {
    webhook = await channel.createWebhook({
      name: WEBHOOK_NAME,
      avatar: AVATAR_URL,
      reason: 'Created for VATSIM event announcements',
    });
  }

  return { id: webhook.id, token: webhook.token };
}

function getWebhookClient(id, token) {
  return new WebhookClient({ id, token });
}

module.exports = { getOrCreateWebhook, getWebhookClient, WEBHOOK_NAME };
