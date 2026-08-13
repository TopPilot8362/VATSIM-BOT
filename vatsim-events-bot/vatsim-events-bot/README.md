# VATSIM Events Discord Bot

A Discord bot that watches the official [VATSIM Events API](https://vatsim.dev/api/events-api)
and announces new/upcoming network events in a channel of your choice. On setup it creates
its own Discord **webhook** in that channel and posts through it (rather than the bot user
directly), so announcements keep working even if the bot's normal permissions change, and you
can rename/re-avatar the webhook like any other.

## Features

- Polls the VATSIM Events API on a schedule (default every 15 minutes, configurable)
- Posts each new event once as a rich embed (title, times as Discord auto-localised
  timestamps, airports, organiser, banner image, link)
- Optional filtering by VATSIM **division** or **subdivision**, so a division/vACC server
  only sees its own events (e.g. subdivision `VATSSA`)
- Per-server configuration — works across multiple servers from one bot process
- Tracks which events have already been posted so nothing is duplicated
- Slash commands to set up, force a check, and disable

## Requirements

- Node.js 18 or later (uses the built-in `fetch`)
- A Discord application/bot — create one at the
  [Discord Developer Portal](https://discord.com/developers/applications)

## Setup

1. **Clone and install**

   ```bash
   git clone <this-repo-url>
   cd vatsim-events-bot
   npm install
   ```

2. **Create your bot**

   In the [Developer Portal](https://discord.com/developers/applications), create an
   application, add a Bot user, and copy the **bot token** and the application's **client ID**.

3. **Configure environment**

   ```bash
   cp .env.example .env
   ```

   Fill in `.env`:

   ```
   DISCORD_TOKEN=your-bot-token
   DISCORD_CLIENT_ID=your-application-id
   DISCORD_GUILD_ID=        # optional, for instant command registration while testing
   POLL_CRON=*/720 * * * *
   EVENTS_FETCH_LIMIT=50
   ```

4. **Invite the bot** to your server with these scopes/permissions:

   - Scopes: `bot`, `applications.commands`
   - Permissions: `Manage Webhooks`, `Send Messages`, `View Channel` (in the target channel)

   You can build an invite URL in the Developer Portal's OAuth2 → URL Generator page.

5. **Register the slash commands**

   ```bash
   npm run deploy-commands
   ```

6. **Run the bot**

   ```bash
   npm start
   ```

## Usage

- `/vatsim-events-setup channel:#events [division:EMEA] [subdivision:VATSSA]`
  Configures where announcements go, and optionally restricts them to events organised by a
  specific division or subdivision. Creates the "VATSIM Events" webhook in that channel if one
  doesn't already exist. Requires **Manage Webhooks** permission.

- `/vatsim-events-test`
  Runs a check immediately instead of waiting for the schedule — useful right after setup.

- `/vatsim-events-disable`
  Stops posting in this server (the webhook itself is left in place; delete it manually in
  channel settings if you don't want it hanging around).

## How duplicate-avoidance works

Each server keeps a small JSON record (`data/posted.json`) of VATSIM event IDs it has already
announced. Every poll only sends events that are (a) currently returned by the API as
upcoming/current, (b) match the server's optional division/subdivision filter, and (c) aren't
already in that record.

## Data storage

Configuration and posted-event tracking are stored as JSON files under `data/` next to the
code — no external database needed for typical use. If you're running this across many
servers or want proper persistence/backups, swap `src/storage.js` for a real database; every
other file only calls its exported functions, so that's the only file you'd need to touch.

## Deploying

This is a long-running process (it needs to stay online to hit the cron schedule), so it
suits a small VPS, a container, or a "worker" service on platforms like Railway, Fly.io, or
Render, rather than a serverless function. Set the same environment variables there as in
`.env`.

## Project layout

```
src/
  index.js              # bot startup, command routing, cron scheduling
  config.js             # env var loading
  storage.js            # JSON-backed per-guild config + posted-event tracking
  vatsim.js             # VATSIM Events API client + filter matching
  webhookManager.js      # finds/creates the announcement webhook
  formatEvent.js         # turns a VATSIM event into a Discord embed
  announcer.js            # ties it all together: fetch, filter, post
  commands/
    setup.js             # /vatsim-events-setup
    test.js              # /vatsim-events-test
    disable.js           # /vatsim-events-disable
    deploy-commands.js   # registers slash commands with Discord
```

## License

MIT
