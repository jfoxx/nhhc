import { mountMediaPicker } from './media-core.js';

const root = document.getElementById('root');
if (root) {
  const params = new URLSearchParams(window.location.search);
  const indexPath = params.get('indexPath') || '/media-index.json';
  mountMediaPicker(root, { indexPath }).catch(() => {
    root.textContent = 'Unable to load media picker.';
  });
}
