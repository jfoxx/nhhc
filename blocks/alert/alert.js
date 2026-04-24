/**
 * Site-wide notice / alert banner.
 * Optional variant classes: info, warning, success, critical.
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const row = block.firstElementChild;
  const cell = row?.firstElementChild;
  if (!cell) return;

  const body = document.createElement('div');
  body.className = 'alert-body';
  while (cell.firstChild) {
    body.append(cell.firstChild);
  }

  block.replaceChildren(body);
}
