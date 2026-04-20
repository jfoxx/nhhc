import ffetch from '../../scripts/ffetch.js';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function parseDate(text) {
  const parts = text.trim().split(/\s+/);
  if (parts.length < 2) return null;
  const monthIndex = MONTHS.findIndex((m) => m.toLowerCase() === parts[0].toLowerCase());
  const day = parseInt(parts[1], 10);
  if (monthIndex < 0 || Number.isNaN(day)) return null;
  return { month: monthIndex, day };
}

export default async function decorate(block) {
  const today = new Date();
  const todayMonth = today.getMonth();
  const todayDay = today.getDate();

  const entry = await ffetch('/today-in-history/query-index.json')
    .filter((item) => {
      const d = parseDate(item.title);
      return d && d.month === todayMonth && d.day === todayDay;
    })
    .first();

  if (!entry) return;

  block.textContent = '';

  const tile = document.createElement('div');
  tile.className = 'today-in-history-tile';
  const month = document.createElement('span');
  month.className = 'today-in-history-month';
  month.textContent = MONTHS[todayMonth].toUpperCase();
  const dayNum = document.createElement('span');
  dayNum.className = 'today-in-history-day';
  dayNum.textContent = todayDay;
  tile.append(month, dayNum);

  const body = document.createElement('div');
  body.className = 'today-in-history-body';
  const heading = document.createElement('strong');
  heading.textContent = 'Today in History';
  const desc = document.createElement('p');
  desc.textContent = entry.description;
  body.append(heading, desc);

  const cta = document.createElement('a');
  cta.className = 'today-in-history-cta';
  cta.href = entry.path;
  cta.textContent = 'View More Today in History';

  block.append(tile, body, cta);
}
