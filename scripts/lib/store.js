'use strict';

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', '..', 'public', 'data');
const LIVE_DIR = path.join(DATA_DIR, 'live');

function ensureDirs() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.mkdirSync(LIVE_DIR, { recursive: true });
}

function readJSON(filename) {
  const fp = path.join(DATA_DIR, filename);
  try {
    return JSON.parse(fs.readFileSync(fp, 'utf-8'));
  } catch (err) {
    if (err.code === 'ENOENT') return null;
    throw err;
  }
}

// Atomický zápis: zapíše .tmp → přejmenuje (bezpečné při pádu procesu)
function writeJSON(filename, data) {
  ensureDirs();
  const fp = path.join(DATA_DIR, filename);
  fs.writeFileSync(fp + '.tmp', JSON.stringify(data, null, 2), 'utf-8');
  fs.renameSync(fp + '.tmp', fp);
}

function writeLiveJSON(eventId, data) {
  ensureDirs();
  const fp = path.join(LIVE_DIR, `${eventId}.json`);
  fs.writeFileSync(fp + '.tmp', JSON.stringify(data, null, 2), 'utf-8');
  fs.renameSync(fp + '.tmp', fp);
}

function readLiveJSON(eventId) {
  try {
    return JSON.parse(fs.readFileSync(path.join(LIVE_DIR, `${eventId}.json`), 'utf-8'));
  } catch {
    return null;
  }
}

function updateMeta(updates) {
  const meta = readJSON('meta.json') ?? {};
  writeJSON('meta.json', {
    ...meta,
    ...updates,
    workerLastTick: new Date().toISOString(),
  });
}

module.exports = { readJSON, writeJSON, writeLiveJSON, readLiveJSON, updateMeta, DATA_DIR };
