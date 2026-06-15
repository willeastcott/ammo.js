const { resolve } = require('path');

async function loadAmmo(options) {
  const { AMMO_PATH } = process.env;
  // Resolve against cwd (always defined) rather than $PWD, which is unset on Windows.
  const path = AMMO_PATH ? resolve(AMMO_PATH) : '../../builds/ammo.js';
  const Ammo = require(path);
  return Ammo(options);
}

module.exports = loadAmmo;
