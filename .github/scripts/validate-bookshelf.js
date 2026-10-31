#!/usr/bin/env node
// Validates bookshelf/data.json. Run: node .github/scripts/validate-bookshelf.js [path]
// Rules mirror what bookshelf/app.js accepts, so a file that passes here will
// display exactly as written (app.js silently clamps/repairs anything else).
'use strict';

const fs = require('fs');
const path = process.argv[2] || 'bookshelf/data.json';
const STATUSES = ['Finished', 'In progress', 'Not started', ''];
const errors = [];
const err = (where, msg) => errors.push(`${where}: ${msg}`);

let data;
try {
  const raw = fs.readFileSync(path, 'utf8').replace(/^﻿/, '');
  data = JSON.parse(raw);
} catch (e) {
  console.error(`FAIL  ${path} is not valid JSON: ${e.message}`);
  process.exit(1);
}

const isStr = (v) => typeof v === 'string';
const isInt = (v) => Number.isInteger(v);
const norm = (t) => String(t).toLowerCase().replace(/[^a-z0-9]/g, '');
const messy = (v) => /\s{3,}/.test(v) || v !== v.trim() || /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/.test(v);

if (!data || typeof data !== 'object' || Array.isArray(data)) {
  console.error('FAIL  top level must be an object with "title" and "shelves"');
  process.exit(1);
}
if (!isStr(data.title) || !data.title.trim()) err('title', 'must be a non-empty string');
if (!Array.isArray(data.shelves) || data.shelves.length === 0) {
  err('shelves', 'must be a non-empty array');
  data.shelves = [];
}

const shelfIds = new Set();
const itemIds = new Set();
const titles = new Map();
let bookCount = 0;

data.shelves.forEach((s, si) => {
  const sw = `shelf #${si + 1}${s && s.name ? ` "${s.name}"` : ''}`;
  if (!s || typeof s !== 'object') return err(sw, 'must be an object');
  if (!isStr(s.id) || !s.id) err(sw, 'needs a non-empty string "id"');
  else if (shelfIds.has(s.id)) err(sw, `duplicate shelf id "${s.id}"`);
  else shelfIds.add(s.id);
  if (!isStr(s.name) || !s.name.trim()) err(sw, '"name" must be a non-empty string');
  else if (messy(s.name)) err(sw, 'name has stray whitespace');
  if (!Array.isArray(s.books)) return err(sw, '"books" must be an array');

  s.books.forEach((b, bi) => {
    const w = `${sw} item #${bi + 1}${b && b.title ? ` "${b.title}"` : ''}`;
    if (!b || typeof b !== 'object') return err(w, 'must be an object');
    if (!isStr(b.id) || !b.id) err(w, 'needs a non-empty string "id"');
    else if (itemIds.has(b.id)) err(w, `duplicate id "${b.id}"`);
    else itemIds.add(b.id);

    if (b.type === 'spacer') {
      if (!(typeof b.width === 'number' && b.width >= 8 && b.width <= 320)) err(w, 'spacer width must be 8-320');
      return;
    }
    bookCount++;
    if (!isStr(b.title) || !b.title.trim()) err(w, 'title must be a non-empty string');
    else {
      if (messy(b.title)) err(w, 'title has stray whitespace');
      const k = norm(b.title);
      if (titles.has(k)) err(w, `duplicate title (also on ${titles.get(k)})`);
      else titles.set(k, sw);
    }
    for (const f of ['author', 'series', 'narrator']) {
      if (!isStr(b[f])) err(w, `"${f}" must be a string (use "" if none)`);
      else if (messy(b[f])) err(w, `"${f}" has stray whitespace or junk: ${JSON.stringify(b[f].slice(0, 60))}`);
    }
    if (!isStr(b.review)) err(w, '"review" must be a string');
    if (!isStr(b.color) || !/^#[0-9a-f]{6}$/i.test(b.color)) err(w, `color must look like #a1b2c3 (got ${JSON.stringify(b.color)})`);
    if (!isInt(b.rating) || b.rating < 0 || b.rating > 5) err(w, 'rating must be a whole number 0-5');
    if (!isStr(b.date) || !(b.date === '' || /^\d{4}-\d{2}-\d{2}$/.test(b.date))) err(w, 'date must be "" or YYYY-MM-DD');
    if (!STATUSES.includes(b.status)) err(w, `status must be one of Finished / In progress / Not started (got ${JSON.stringify(b.status)})`);
    if (!isInt(b.width) || b.width < 28 || b.width > 72) err(w, `width must be a whole number 28-72 (got ${b.width})`);
    if (!isInt(b.height) || b.height < 140 || b.height > 240) err(w, `height must be a whole number 140-240 (got ${b.height})`);
  });
});

if (errors.length) {
  console.error(`FAIL  ${path}: ${errors.length} problem${errors.length === 1 ? '' : 's'} found\n`);
  errors.forEach((e) => console.error('  - ' + e));
  process.exit(1);
}
console.log(`OK    ${path}: ${data.shelves.length} shelves, ${bookCount} books, no problems`);
