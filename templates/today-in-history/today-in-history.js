import { buildBlock, decorateBlock, loadBlock } from '../../scripts/aem.js';

export default async function decorate(doc) {
  const main = doc.querySelector('main');
  if (!main) return;

  const aside = document.createElement('div');
  aside.className = 'aside';

  const calendarWrapper = document.createElement('div');
  const calendar = buildBlock('calendar', '');
  calendarWrapper.append(calendar);
  aside.append(calendarWrapper);
  decorateBlock(calendar);

  const columnsWrapper = document.createElement('div');
  columnsWrapper.className = 'today-in-history-columns';

  const content = document.createElement('div');
  content.className = 'today-in-history-content';

  [...main.querySelectorAll(':scope > .section')].forEach((section) => {
    content.append(section);
  });

  columnsWrapper.append(content);
  columnsWrapper.append(aside);

  main.textContent = '';
  main.append(columnsWrapper);

  await loadBlock(calendar);
}
