'use strict';

// Jednoduchý loader .env.local (bez závislostí). Naplní process.env klíči, které
// ještě nejsou nastavené z prostředí (prostředí má přednost — důležité pro CI).
const fs = require('fs');
const path = require('path');

function loadEnv() {
  const fp = path.join(__dirname, '..', '..', '.env.local');
  let raw;
  try {
    raw = fs.readFileSync(fp, 'utf-8');
  } catch {
    return; // .env.local nemusí existovat (např. na CI)
  }
  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (key && process.env[key] === undefined) process.env[key] = value;
  }
}

module.exports = { loadEnv };
