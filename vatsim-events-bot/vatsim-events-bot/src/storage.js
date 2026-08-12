const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const GUILDS_FILE = path.join(DATA_DIR, 'guilds.json');
const POSTED_FILE = path.join(DATA_DIR, 'posted.json');

// Cap how many posted-event IDs we remember per guild so the file
// doesn't grow forever. The VATSIM API only ever returns upcoming/
// current events, so this comfortably exceeds any realistic backlog.
const MAX_POSTED_PER_GUILD = 500;

function ensureFile(filePath, defaultContent) {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(defaultContent, null, 2));
  }
}

function readJson(filePath, defaultContent) {
  ensureFile(filePath, defaultContent);
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (err) {
    console.error(`Failed to parse ${filePath}, resetting to default.`, err);
    return defaultContent;
  }
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

// ---- Guild config: which channel/webhook to post to, optional filters ----

function getGuildConfigs() {
  return readJson(GUILDS_FILE, {});
}

function getGuildConfig(guildId) {
  const all = getGuildConfigs();
  return all[guildId] || null;
}

function setGuildConfig(guildId, config) {
  const all = getGuildConfigs();
  all[guildId] = { ...(all[guildId] || {}), ...config };
  writeJson(GUILDS_FILE, all);
  return all[guildId];
}

function removeGuildConfig(guildId) {
  const all = getGuildConfigs();
  delete all[guildId];
  writeJson(GUILDS_FILE, all);
}

// ---- Posted-event tracking, per guild, to avoid duplicate announcements ----

function getPostedMap() {
  return readJson(POSTED_FILE, {});
}

function getPostedIds(guildId) {
  const map = getPostedMap();
  return new Set(map[guildId] || []);
}

function markPosted(guildId, eventIds) {
  const map = getPostedMap();
  const existing = map[guildId] || [];
  const merged = [...existing, ...eventIds];
  // Keep only the most recent MAX_POSTED_PER_GUILD entries
  map[guildId] = merged.slice(-MAX_POSTED_PER_GUILD);
  writeJson(POSTED_FILE, map);
}

module.exports = {
  getGuildConfigs,
  getGuildConfig,
  setGuildConfig,
  removeGuildConfig,
  getPostedIds,
  markPosted,
};
