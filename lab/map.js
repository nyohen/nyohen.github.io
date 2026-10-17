// Work map page: the orbit (three.js) plus the shared case-study panel.
import { mountOrbit } from './orbit-map.js';
let orbit = { setActive() {} };
CaseUI.mount({ barInto: document.getElementById('barhere'), onSelect: (id) => orbit.setActive(id), onClose: () => orbit.setActive(null) });
orbit = mountOrbit(document.getElementById('centre'));
