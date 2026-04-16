import ffetch from '../../scripts/ffetch.js';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function excelDateToJS(serial) {
  return new Date(Math.round((serial - 25569) * 86400 * 1000));
}

export default async function decorate(block) {
  const today = new Date();
  const todayMonth = today.getMonth();
  const todayDay = today.getDate();
  // eslint-disable-next-line no-console
  console.log(`[today-in-history] Looking for month=${todayMonth} day=${todayDay}`);

  const allEntries = await ffetch('/today-in-history/query-index.json').all();
  // eslint-disable-next-line no-console
  console.log(`[today-in-history] Fetched ${allEntries.length} entries`);
  if (allEntries.length > 0) {
    // eslint-disable-next-line no-console
    console.log('[today-in-history] Sample entry:', allEntries[0]);
    const sampleDate = excelDateToJS(Number(allEntries[0].title));
    // eslint-disable-next-line no-console
    console.log(`[today-in-history] Sample decoded: title=${allEntries[0].title} -> ${sampleDate.toISOString()} month=${sampleDate.getUTCMonth()} day=${sampleDate.getUTCDate()}`);
  }

  const entry = allEntries.find((item) => {
    const d = excelDateToJS(Number(item.title));
    return d.getUTCMonth() === todayMonth && d.getUTCDate() === todayDay;
  });

  // eslint-disable-next-line no-console
  console.log('[today-in-history] Matched entry:', entry);

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
