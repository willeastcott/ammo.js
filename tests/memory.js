const test = require('ava');
const loadAmmo = require('./helpers/load-ammo.js');

// Initialize global Ammo once for all tests:
test.before(async t => loadAmmo())

const MB = 1024 * 1024;

test('heap starts at 16MB and grows on demand', t => {
  // the default build starts small so that low-end devices can instantiate it...
  const initial = Ammo.HEAP8.byteLength;
  t.is(initial, 16 * MB);

  // ...and grows instead of aborting once a simulation needs more
  const ptr = Ammo._malloc(32 * MB);
  t.not(ptr, 0);
  t.assert(Ammo.HEAP8.byteLength > initial);
  t.assert(Ammo.HEAP8.byteLength >= ptr + 32 * MB);
})
