const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function buildMonth(year, month, todayDate) {
  const container = document.createElement('div');
  container.className = 'calendar-month';

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthName = MONTHS[month].toLowerCase();

  const grid = document.createElement('div');
  grid.className = 'calendar-grid';

  for (let i = 0; i < firstDay; i += 1) {
    const blank = document.createElement('span');
    blank.className = 'calendar-blank';
    grid.append(blank);
  }

  const isCurrentMonth = todayDate.getFullYear() === year
    && todayDate.getMonth() === month;

  for (let day = 1; day <= daysInMonth; day += 1) {
    const link = document.createElement('a');
    link.href = `/today-in-history/${monthName}-${day}`;
    link.textContent = day;
    link.className = 'calendar-day';
    if (isCurrentMonth && todayDate.getDate() === day) {
      link.classList.add('calendar-today');
    }
    grid.append(link);
  }

  container.append(grid);
  return container;
}

export default async function decorate(block) {
  const today = new Date();
  let currentYear = today.getFullYear();
  let currentMonth = today.getMonth();

  block.textContent = '';

  const nav = document.createElement('div');
  nav.className = 'calendar-nav';

  const prevBtn = document.createElement('button');
  prevBtn.className = 'calendar-prev';
  prevBtn.textContent = '<';
  prevBtn.setAttribute('aria-label', 'Previous month');

  const nextBtn = document.createElement('button');
  nextBtn.className = 'calendar-next';
  nextBtn.textContent = '>';
  nextBtn.setAttribute('aria-label', 'Next month');

  const monthLabel = document.createElement('span');
  monthLabel.className = 'calendar-month-label';

  nav.append(prevBtn, monthLabel, nextBtn);

  const display = document.createElement('div');
  display.className = 'calendar-display';

  function render() {
    monthLabel.textContent = MONTHS[currentMonth];
    display.textContent = '';
    display.append(buildMonth(currentYear, currentMonth, today));
  }

  prevBtn.addEventListener('click', () => {
    currentMonth -= 1;
    if (currentMonth < 0) { currentMonth = 11; currentYear -= 1; }
    render();
  });

  nextBtn.addEventListener('click', () => {
    currentMonth += 1;
    if (currentMonth > 11) { currentMonth = 0; currentYear += 1; }
    render();
  });

  block.append(nav, display);

  const yearLink = document.createElement('a');
  yearLink.href = '/today-in-history';
  yearLink.className = 'calendar-year-link';
  yearLink.textContent = 'Year at a Glance';
  block.append(yearLink);

  render();
}
