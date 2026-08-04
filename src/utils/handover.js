/**
 * Formats the `handoverDate` column into the text shown in a deck's
 * "Handover" row.
 *
 * A site reads as immediately available when there is no date on record, or
 * when the recorded date has already passed or falls inside the next two
 * weeks — that much lead time reads as "now" to a tenant, and the buffer
 * stops a deck going stale between generation and the client opening it.
 *
 * Comparison is done on calendar days in UTC. Prisma returns `@db.Date`
 * columns as a Date pinned to UTC midnight, so reading UTC components keeps
 * us on the same calendar date that was stored no matter what timezone the
 * container runs in.
 */

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const IMMEDIATE_WINDOW_DAYS = 14;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Accepts a Date (the Prisma shape) or an ISO string (fixtures / JSON payloads
// that have been through a serialization hop). Anything unparseable — including
// the free-text values the legacy `availability` column carried — yields null
// and therefore falls back to "Immediate".
const parseHandoverDate = (value) => {
    if (value == null) return null;
    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
};

// Whole days since the epoch for a Date's UTC calendar day, so two dates can be
// differenced without any wall-clock time component leaking in.
const utcDayIndex = (date) => Math.floor(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) / MS_PER_DAY
);

/**
 * @param {Date|string|null|undefined} handoverDate - `warehouse.handoverDate`
 * @param {Date} [now] - Reference "today"; injectable for tests
 * @returns {string} 'Immediate', or a formatted date like '15 Sep 2026'
 */
function formatHandover(handoverDate, now = new Date()) {
    const date = parseHandoverDate(handoverDate);
    if (!date) return 'Immediate';

    if (utcDayIndex(date) - utcDayIndex(now) <= IMMEDIATE_WINDOW_DAYS) return 'Immediate';

    return `${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

module.exports = { formatHandover };
