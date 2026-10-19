// Home page start-up: shared text, torn-name hero, the pipeline diagram ("How I build") and the case-study panel.
// The orbit work map lives on its own opt-in page (map.html), so three.js does not load here.
mountFolio(); mountHero(document.getElementById('band'), 'galaxy');
CaseUI.mount({ bar: false });   // mount first: the pipeline opens its evidence in this panel
mountSystem(document.getElementById('pipeline'));
