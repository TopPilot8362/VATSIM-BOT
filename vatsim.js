const config = require('./config');

/**
 * Fetches upcoming/current events from the official VATSIM Events API.
 * Docs: https://vatsim.dev/api/events-api
 */
async function fetchLatestEvents(limit = config.eventsFetchLimit) {
  const url = config.vatsimEventsUrl(limit);
  const res = await fetch(url, {
    headers: { Accept: 'application/json' },
  });

  if (!res.ok) {
    throw new Error(`VATSIM Events API returned ${res.status} ${res.statusText}`);
  }

  const json = await res.json();
  return Array.isArray(json.data) ? json.data : [];
}

/**
 * An event's organiser list can include multiple region/division/subdivision
 * entries. This checks whether an event matches an optional division and/or
 * subdivision filter (case-insensitive). Undefined filters always match.
 */
function eventMatchesFilter(event, divisionFilter, subdivisionFilter) {
  if (!divisionFilter && !subdivisionFilter) return true;
  const organisers = event.organisers || [];
  return organisers.some((org) => {
    const divisionOk =
      !divisionFilter || (org.division || '').toLowerCase() === divisionFilter.toLowerCase();
    const subdivisionOk =
      !subdivisionFilter ||
      (org.subdivision || '').toLowerCase() === subdivisionFilter.toLowerCase();
    return divisionOk && subdivisionOk;
  });
}

module.exports = { fetchLatestEvents, eventMatchesFilter };
