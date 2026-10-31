(() => {
  'use strict';

  /* ------------------------------------------------------------------
   * Virtual Bookshelf
   *  - Visitors: read-only. They load data.json from the site.
   *  - Owner: open the site with ?edit on the end of the URL to edit.
   *    Edits are kept in this browser until you click Publish, which
   *    commits data.json to your GitHub repo (or Download JSON and
   *    upload it yourself).
   * ------------------------------------------------------------------ */

  const $ = (s) => document.querySelector(s);
  const el = (tag, cls, text) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined) n.textContent = text;
    return n;
  };
  const uid = () => Math.random().toString(36).slice(2, 10);
  const clamp = (n, lo, hi, def) => {
    n = Number(n);
    return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : def;
  };

  // Make any text safe to store and display. Quotes, <, >, &, emoji, accents,
  // non-Latin scripts and symbols are all kept exactly as typed. Only invisible
  // control characters and broken surrogate halves are removed, and single-line
  // fields (title, author, shelf names) have line breaks turned into spaces.
  const scrub = (v, multiline) => {
    let s = v === null || v === undefined ? '' : String(v);
    if (typeof s.toWellFormed === 'function') s = s.toWellFormed();
    s = s
      .replace(/\r\n?/g, '\n')
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F\u2028\u2029]/g, '');
    return multiline ? s : s.replace(/[\t\n]+/g, ' ').trim();
  };

  const OWNER = new URLSearchParams(location.search).has('edit');
  const LS = {
    draft: 'bookshelf.draft.v1',
    base: 'bookshelf.baseline.v1',
    gh: 'bookshelf.github.v1',
  };
  const STATUSES = ['Finished', 'In progress', 'Not started'];
  const PALETTE = [
    '#7b2d26', '#2f4858', '#3a5a40', '#c8963e', '#5b3a6b', '#1f3b5c',
    '#b5543c', '#2e2e2e', '#8a9a5b', '#d9c8a3', '#a23b72', '#256d85',
  ];

  const FALLBACK = {
    title: 'My Bookshelf',
    shelves: [{ id: 's1', name: 'Favorites', books: [] }],
  };

  const state = {
    data: null,
    edit: false,
    drag: null,
    baseline: '',
    gap: el('div', 'book-gap'),
  };

  /* ---------------------------- Data helpers --------------------------- */

  const isSpacer = (b) => !!b && b.type === 'spacer';
  const countBooks = (shelf) => shelf.books.filter((b) => !isSpacer(b)).length;

  function normBook(b) {
    b = b || {};
    if (b.type === 'spacer') {
      return { id: String(b.id || uid()), type: 'spacer', width: Math.round(clamp(b.width, 8, 320, 40)) };
    }
    return {
      id: String(b.id || uid()),
      title: scrub(b.title) || 'Untitled',
      author: scrub(b.author),
      color: /^#[0-9a-f]{6}$/i.test(b.color || '') ? b.color : PALETTE[0],
      rating: Math.round(clamp(b.rating, 0, 5, 0)),
      date: /^\d{4}-\d{2}-\d{2}$/.test(b.date || '') ? b.date : '',
      review: scrub(b.review, true),
      series: scrub(b.series),
      narrator: scrub(b.narrator),
      status: STATUSES.includes(b.status) ? b.status : '',
      width: Math.round(clamp(b.width, 28, 72, 44)),
      height: Math.round(clamp(b.height, 140, 240, 190)),
    };
  }

  function normalize(d) {
    const out = { title: scrub(d && d.title) || 'My Bookshelf', shelves: [] };
    const shelves = Array.isArray(d && d.shelves) ? d.shelves : [];
    for (const s of shelves) {
      out.shelves.push({
        id: String((s && s.id) || uid()),
        name: scrub(s && s.name) || 'Shelf',
        books: (Array.isArray(s && s.books) ? s.books : []).map(normBook),
      });
    }
    if (!out.shelves.length) out.shelves.push({ id: uid(), name: 'My Books', books: [] });
    return out;
  }

  function newBook() {
    return {
      id: uid(),
      title: '',
      author: '',
      color: PALETTE[Math.floor(Math.random() * PALETTE.length)],
      rating: 0,
      date: '',
      review: '',
      series: '',
      narrator: '',
      status: 'Finished',
      width: 30 + Math.floor(Math.random() * 30),
      height: 165 + Math.floor(Math.random() * 55),
    };
  }

  function locate(id) {
    for (const shelf of state.data.shelves) {
      const index = shelf.books.findIndex((b) => b.id === id);
      if (index >= 0) return { shelf, index, book: shelf.books[index] };
    }
    return null;
  }

  function contrast(hex) {
    const n = parseInt(hex.slice(1), 16);
    const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.6 ? '#2b1d12' : '#f7efe0';
  }

  function spineFont(b) {
    const avail = b.height - 60;
    for (let fs = 17; fs >= 10; fs--) {
      const lines = Math.max(1, Math.floor((b.width - 12) / (fs * 1.25)));
      if ((b.title.length * fs * 0.62) / lines <= avail) return fs;
    }
    return 10;
  }

  function formatDate(iso) {
    if (!iso) return '';
    const d = new Date(iso + 'T00:00:00');
    return isNaN(d) ? '' : d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  }

  /* ---------------------------- Persistence ---------------------------- */

  function isDirty() {
    return JSON.stringify(state.data) !== state.baseline;
  }
  function updateDirty() {
    const d = $('#dirty');
    if (d) d.hidden = !(OWNER && isDirty());
  }
  function persist() {
    if (!OWNER) return;
    try { localStorage.setItem(LS.draft, JSON.stringify(state.data)); } catch (e) { /* ignore */ }
    updateDirty();
  }
  function commit() {
    persist();
    render();
  }

  async function load() {
    let published = null;
    try {
      const r = await fetch('data.json?v=' + Date.now(), { cache: 'no-store' });
      if (r.ok) published = await r.json();
    } catch (e) { /* e.g. opened from file:// */ }
    const pub = normalize(published || FALLBACK);

    let draft = null;
    if (OWNER) {
      try { draft = JSON.parse(localStorage.getItem(LS.draft)); } catch (e) { draft = null; }
    }
    if (draft) {
      state.data = normalize(draft);
      state.baseline = localStorage.getItem(LS.base) || JSON.stringify(pub);
    } else {
      state.data = pub;
      state.baseline = JSON.stringify(pub);
    }
    render();
    // Browsers refuse to let a page opened straight from a folder (file://) read
    // data.json. Offer a button to pick the file by hand so a local preview works.
    if (!published && location.protocol === 'file:' && !draft) showLocalNotice();
  }

  function showLocalNotice() {
    if ($('#localNote')) return;
    const note = el('div', 'local-note');
    note.id = 'localNote';
    note.append(
      el('strong', null, 'Opened from a folder. '),
      document.createTextNode(
        'Your browser blocks this page from reading data.json when it is opened directly from your computer, ' +
        'so the shelves look empty. Choose data.json from this folder to preview your books. ' +
        'This only affects the local preview; the GitHub Pages site loads it automatically. '
      )
    );
    const pick = el('input');
    pick.type = 'file';
    pick.accept = 'application/json,.json';
    pick.hidden = true;
    pick.addEventListener('change', () => {
      const f = pick.files && pick.files[0];
      if (!f) return;
      const rd = new FileReader();
      rd.onload = () => {
        try {
          const d = normalize(JSON.parse(String(rd.result).replace(/^\uFEFF/, '')));
          state.data = d;
          state.baseline = JSON.stringify(d);
          note.remove();
          render();
        } catch (e) {
          toast('That file is not valid bookshelf JSON.');
        }
      };
      rd.readAsText(f);
    });
    const btn = el('button', 'btn primary', 'Choose data.json');
    btn.type = 'button';
    btn.addEventListener('click', () => pick.click());
    note.append(btn, pick);
    const caseEl = document.querySelector('.case');
    caseEl.parentNode.insertBefore(note, caseEl);
  }

  /* ----------------------------- Rendering ----------------------------- */

  function render() {
    const root = $('#cabinet');
    const scrolls = {};
    root.querySelectorAll('.row').forEach((r) => { scrolls[r.dataset.shelf] = r.scrollLeft; });

    document.body.classList.toggle('editing', state.edit);
    document.title = state.data.title;
    $('#siteTitle').textContent = state.data.title;
    const total = state.data.shelves.reduce((n, s) => n + countBooks(s), 0);
    const sc = state.data.shelves.length;
    $('#subtitle').textContent =
      `${total} book${total === 1 ? '' : 's'} read \u00b7 ${sc} shelf${sc === 1 ? '' : 's'}`.replace('shelfs', 'shelves');

    root.replaceChildren();
    state.data.shelves.forEach((s, i) => root.append(renderShelf(s, i)));
    if (!state.data.shelves.length) {
      root.append(el('p', 'empty big', 'No shelves yet \u2014 add one from the toolbar.'));
    }
    root.querySelectorAll('.row').forEach((r) => { if (scrolls[r.dataset.shelf]) r.scrollLeft = scrolls[r.dataset.shelf]; });

    $('#hint').textContent = state.edit
      ? 'Drag books to rearrange them (or open one to move it), and click a book to edit it.'
      : 'Click any book to read the review.';
    updateDirty();
  }

  function tool(label, title, fn) {
    const b = el('button', null, label);
    b.type = 'button';
    b.title = title;
    b.setAttribute('aria-label', title);
    b.addEventListener('click', fn);
    return b;
  }

  function renderShelf(shelf, si) {
    const sec = el('section', 'bay');
    const row = el('div', 'row');
    row.dataset.shelf = shelf.id;
    shelf.books.forEach((b) => row.append(isSpacer(b) ? renderSpacer(b) : renderBook(b)));

    if (state.edit) {
      const add = el('button', 'add-book', '+ Add book');
      add.type = 'button';
      add.addEventListener('click', () => openBook(newBook(), shelf.id, true));
      row.append(add);
      const addSp = el('button', 'add-space', '+ Add space');
      addSp.type = 'button';
      addSp.title = 'Insert a gap you can drag between books';
      addSp.addEventListener('click', () => {
        const sp = { id: uid(), type: 'spacer', width: 40 };
        shelf.books.push(sp);
        commit();
        toast('Space added at the end of the shelf. Drag it between books, or click it to resize.');
      });
      row.append(addSp);
      wireRow(row);
    } else if (!countBooks(shelf)) {
      row.append(el('p', 'empty', 'This shelf is empty.'));
    }

    const plank = el('div', 'plank');
    const plate = el('div', 'plate');
    plate.append(
      el('span', 'plate-name', shelf.name),
      el('span', 'plate-count', `${countBooks(shelf)} book${countBooks(shelf) === 1 ? '' : 's'}`)
    );
    plank.append(plate);

    const tools = el('div', 'shelf-tools');
    tools.append(
      tool('\u270e', 'Rename shelf', () => renameShelf(shelf)),
      tool('\u25b2', 'Move shelf up', () => moveShelf(si, -1)),
      tool('\u25bc', 'Move shelf down', () => moveShelf(si, 1)),
      tool('\u2715', 'Delete shelf', () => deleteShelf(shelf))
    );
    plank.append(tools);

    sec.append(row, plank);
    return sec;
  }

  function renderBook(b) {
    const n = el('div', b.status === 'Not started' ? 'slot book unread' : 'slot book');
    n.tabIndex = 0;
    n.setAttribute('role', 'button');
    n.setAttribute('aria-label', b.author ? `${b.title} by ${b.author}` : b.title);
    n.title = b.author ? `${b.title} \u2014 ${b.author}` : b.title;
    n.style.setProperty('--c', b.color);
    n.style.setProperty('--fg', contrast(b.color));
    n.style.width = b.width + 'px';
    n.style.height = b.height + 'px';

    const t = el('span', 'spine-title', b.title);
    t.style.fontSize = spineFont(b) + 'px';
    t.style.maxHeight = b.height - 56 + 'px';
    n.append(t);

    const open = () => openBook(b, locate(b.id).shelf.id, false);
    n.addEventListener('click', open);
    n.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
    });

    if (state.edit) {
      n.draggable = true;
      n.addEventListener('dragstart', (e) => {
        state.drag = b.id;
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', b.id);
        state.gap.style.width = b.width + 'px';
        state.gap.style.height = b.height + 'px';
        setTimeout(() => n.classList.add('dragging'), 0);
      });
      n.addEventListener('dragend', () => {
        n.classList.remove('dragging');
        cleanupDrag();
      });
    }
    return n;
  }

  function renderSpacer(b) {
    const n = el('div', 'slot spacer');
    n.dataset.id = b.id;
    n.style.width = b.width + 'px';
    if (state.edit) {
      n.tabIndex = 0;
      n.setAttribute('role', 'button');
      n.setAttribute('aria-label', 'Space between books. Click to resize or move.');
      n.title = 'Space (' + b.width + 'px). Drag to move, click to resize.';
      n.append(el('span', 'spacer-label', 'space'));
      const open = () => openSpacer(b);
      n.addEventListener('click', open);
      n.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
      });
      n.draggable = true;
      n.addEventListener('dragstart', (e) => {
        state.drag = b.id;
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', b.id);
        state.gap.style.width = b.width + 'px';
        state.gap.style.height = '120px';
        setTimeout(() => n.classList.add('dragging'), 0);
      });
      n.addEventListener('dragend', () => {
        n.classList.remove('dragging');
        cleanupDrag();
      });
    }
    return n;
  }

  function openSpacer(b) {
    const dlg = $('#bookDialog');
    dlg.replaceChildren();
    const form = el('form', 'dlg-form settings');
    form.append(el('h2', 'dlg-title', 'Space between books'));
    form.append(el('p', 'muted', 'A blank gap on the shelf. Use it to separate groups of books. Drag it on the shelf, or use the buttons below.'));
    const label = el('span', 'field-label', 'Width: ' + b.width + ' px');
    const w = el('input');
    w.type = 'range'; w.min = 8; w.max = 320; w.value = b.width;
    w.addEventListener('input', () => {
      b.width = Number(w.value);
      label.textContent = 'Width: ' + b.width + ' px';
      // resize live while sliding
      document.querySelectorAll('.row .spacer').forEach((n) => { if (n.dataset.id === b.id) n.style.width = b.width + 'px'; });
    });
    const f = el('label', 'field'); f.append(label, w);
    form.append(f);

    const step = (d) => {
      const loc = locate(b.id);
      if (!loc) return;
      const j = loc.index + d;
      if (j < 0 || j >= loc.shelf.books.length) return;
      [loc.shelf.books[loc.index], loc.shelf.books[j]] = [loc.shelf.books[j], loc.shelf.books[loc.index]];
      commit();
    };
    const btns = el('div', 'btn-row');
    const done = el('button', 'btn primary', 'Done');
    done.type = 'submit';
    const left = el('button', 'btn', '\u25c0 Move left');
    left.type = 'button';
    left.addEventListener('click', () => step(-1));
    const right = el('button', 'btn', 'Move right \u25b6');
    right.type = 'button';
    right.addEventListener('click', () => step(1));
    const del = el('button', 'btn danger', 'Remove space');
    del.type = 'button';
    del.addEventListener('click', () => {
      const loc = locate(b.id);
      if (loc) loc.shelf.books.splice(loc.index, 1);
      commit();
      dlg.close();
    });
    btns.append(done, left, right, el('span', 'spacer-fill'), del);
    form.append(btns);
    form.addEventListener('submit', (e) => { e.preventDefault(); commit(); dlg.close(); });
    dlg.addEventListener('close', () => { if (state.edit) commit(); }, { once: true });
    dlg.append(form);
    dlg.showModal();
  }

  /* --------------------------- Drag and drop --------------------------- */

  function cleanupDrag() {
    state.drag = null;
    state.gap.remove();
  }

  function wireRow(row) {
    row.addEventListener('dragover', (e) => {
      if (!state.drag) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      const books = [...row.querySelectorAll('.slot:not(.dragging)')];
      let idx = 0;
      for (const b of books) {
        const r = b.getBoundingClientRect();
        if (e.clientX > r.left + r.width / 2) idx++;
      }
      const ref = books[idx] || row.querySelector('.add-book') || null;
      if (state.gap.parentNode !== row || state.gap.nextSibling !== ref) row.insertBefore(state.gap, ref);
    });

    row.addEventListener('dragleave', (e) => {
      if (!row.contains(e.relatedTarget)) state.gap.remove();
    });

    row.addEventListener('drop', (e) => {
      if (!state.drag) return;
      e.preventDefault();
      let idx = 0;
      for (const n of row.children) {
        if (n === state.gap) break;
        if (n.classList.contains('slot') && !n.classList.contains('dragging')) idx++;
      }
      const id = state.drag;
      cleanupDrag();
      moveBook(id, row.dataset.shelf, idx);
    });
  }

  function moveBook(id, shelfId, idx) {
    const loc = locate(id);
    const target = state.data.shelves.find((s) => s.id === shelfId);
    if (!loc || !target) return;
    loc.shelf.books.splice(loc.index, 1);
    target.books.splice(Math.min(idx, target.books.length), 0, loc.book);
    commit();
  }

  /* ------------------------------ Shelves ------------------------------ */

  function addShelf() {
    const name = scrub(prompt('Name for the new shelf?', 'New shelf'));
    if (!name) return;
    state.data.shelves.push({ id: uid(), name, books: [] });
    commit();
  }
  function renameShelf(shelf) {
    const name = scrub(prompt('Rename shelf:', shelf.name));
    if (!name) return;
    shelf.name = name;
    commit();
  }
  function moveShelf(i, d) {
    const j = i + d;
    const a = state.data.shelves;
    if (j < 0 || j >= a.length) return;
    [a[i], a[j]] = [a[j], a[i]];
    commit();
  }
  function deleteShelf(shelf) {
    const n = countBooks(shelf);
    const msg = n
      ? `Delete the shelf "${shelf.name}" and the ${n} book${n === 1 ? '' : 's'} on it?`
      : `Delete the empty shelf "${shelf.name}"?`;
    if (!confirm(msg)) return;
    state.data.shelves = state.data.shelves.filter((s) => s.id !== shelf.id);
    commit();
  }

  /* --------------------------- Book dialog ----------------------------- */

  function field(label, control) {
    const l = el('label', 'field');
    l.append(el('span', 'field-label', label), control);
    return l;
  }

  function paintCover(c, b) {
    c.style.setProperty('--c', b.color);
    c.style.setProperty('--fg', contrast(b.color));
    c.querySelector('.cover-title').textContent = b.title || 'Untitled';
    c.querySelector('.cover-author').textContent = b.author || '';
  }
  function makeCover(b) {
    const c = el('div', 'cover');
    c.append(el('div', 'cover-title'), el('div', 'cover-rule'), el('div', 'cover-author'));
    paintCover(c, b);
    return c;
  }

  function openBook(src, shelfId, isNew) {
    const dlg = $('#bookDialog');
    dlg.replaceChildren();
    const work = { ...src };

    const inner = el('div', 'dlg-inner');
    const close = el('button', 'dlg-close', '\u00d7');
    close.type = 'button';
    close.setAttribute('aria-label', 'Close');
    close.addEventListener('click', () => dlg.close());

    const side = el('div', 'dlg-side');
    const cover = makeCover(work);
    side.append(cover);

    const main = el('div', 'dlg-main');
    inner.append(close, side, main);
    dlg.append(inner);

    if (!state.edit) {
      /* ---- read-only view ---- */
      main.append(el('h2', 'dlg-title', work.title));
      if (work.author) main.append(el('p', 'dlg-author', 'by ' + work.author));
      if (work.series) main.append(el('p', 'dlg-series', work.series));
      const meta = el('div', 'dlg-meta');
      if (work.status) meta.append(el('span', 'status-tag status-' + work.status.toLowerCase().replace(/\s+/g, '-'), work.status));
      if (work.rating) {
        const s = el('span', 'stars', '\u2605'.repeat(work.rating) + '\u2606'.repeat(5 - work.rating));
        s.setAttribute('aria-label', `${work.rating} out of 5 stars`);
        meta.append(s);
      }
      if (work.date) meta.append(el('span', null, 'Finished ' + formatDate(work.date)));
      if (work.narrator) meta.append(el('span', null, 'Narrated by ' + work.narrator));
      if (meta.children.length) main.append(meta);
      main.append(el('div', work.review ? 'review' : 'review muted', work.review || 'No review yet.'));
    } else {
      /* ---- owner edit form ---- */
      let targetShelf = shelfId;
      const form = el('form', 'dlg-form');

      const tIn = el('input');
      tIn.type = 'text'; tIn.value = work.title; tIn.maxLength = 120; tIn.required = true;
      tIn.addEventListener('input', () => { work.title = tIn.value; paintCover(cover, work); });
      const aIn = el('input');
      aIn.type = 'text'; aIn.value = work.author; aIn.maxLength = 120;
      aIn.addEventListener('input', () => { work.author = aIn.value; paintCover(cover, work); });
      form.append(field('Title', tIn), field('Author', aIn));

      const serIn = el('input');
      serIn.type = 'text'; serIn.value = work.series; serIn.maxLength = 120;
      serIn.placeholder = 'e.g. The Empyrean, Book 1';
      serIn.addEventListener('input', () => { work.series = serIn.value; });
      const narIn = el('input');
      narIn.type = 'text'; narIn.value = work.narrator; narIn.maxLength = 160;
      narIn.addEventListener('input', () => { work.narrator = narIn.value; });
      const stSel = el('select');
      [''].concat(STATUSES).forEach((v) => {
        const o = el('option', null, v || '(none)');
        o.value = v;
        if (v === work.status) o.selected = true;
        stSel.append(o);
      });
      stSel.addEventListener('change', () => { work.status = stSel.value; });
      const extra = el('div', 'two');
      extra.append(field('Series', serIn), field('Narrator', narIn));
      form.append(extra, field('Status', stSel));

      // color
      const cRow = el('div', 'color-row');
      const cIn = el('input');
      cIn.type = 'color'; cIn.value = work.color;
      const setColor = (c) => { work.color = c; cIn.value = c; paintCover(cover, work); };
      cIn.addEventListener('input', () => setColor(cIn.value));
      cRow.append(cIn);
      PALETTE.forEach((c) => {
        const s = el('button', 'swatch');
        s.type = 'button'; s.style.background = c; s.title = c;
        s.setAttribute('aria-label', 'Use color ' + c);
        s.addEventListener('click', () => setColor(c));
        cRow.append(s);
      });
      form.append(field('Book color', cRow));

      // rating
      const stars = el('div', 'stars-edit');
      const paintStars = () => [...stars.children].forEach((s, i) => s.classList.toggle('on', i < work.rating));
      for (let i = 1; i <= 5; i++) {
        const s = el('button', 'star', '\u2605');
        s.type = 'button';
        s.setAttribute('aria-label', `${i} star${i > 1 ? 's' : ''}`);
        s.addEventListener('click', () => { work.rating = work.rating === i ? 0 : i; paintStars(); });
        stars.append(s);
      }
      paintStars();
      form.append(field('Rating', stars));

      // review
      const rIn = el('textarea');
      rIn.value = work.review; rIn.rows = 7; rIn.placeholder = 'What did you think?';
      rIn.addEventListener('input', () => { work.review = rIn.value; });
      form.append(field('Description / review', rIn));

      // size
      const wIn = el('input');
      wIn.type = 'range'; wIn.min = 28; wIn.max = 72; wIn.value = work.width;
      wIn.addEventListener('input', () => { work.width = Number(wIn.value); });
      const hIn = el('input');
      hIn.type = 'range'; hIn.min = 140; hIn.max = 240; hIn.value = work.height;
      hIn.addEventListener('input', () => { work.height = Number(hIn.value); });
      const sizes = el('div', 'two');
      sizes.append(field('Thickness', wIn), field('Height', hIn));
      form.append(sizes);

      // shelf
      const sel = el('select');
      state.data.shelves.forEach((s) => {
        const o = el('option', null, s.name);
        o.value = s.id;
        if (s.id === targetShelf) o.selected = true;
        sel.append(o);
      });
      sel.addEventListener('change', () => { targetShelf = sel.value; });
      form.append(field('Shelf', sel));

      // buttons
      const btns = el('div', 'btn-row');
      const save = el('button', 'btn primary', 'Save');
      save.type = 'submit';
      const cancel = el('button', 'btn', 'Cancel');
      cancel.type = 'button';
      cancel.addEventListener('click', () => dlg.close());
      btns.append(save, cancel);

      if (!isNew) {
        const step = (d) => {
          const loc = locate(work.id);
          if (!loc) return;
          const j = loc.index + d;
          const arr = loc.shelf.books;
          if (j < 0 || j >= arr.length) return;
          [arr[loc.index], arr[j]] = [arr[j], arr[loc.index]];
          commit();
        };
        const left = el('button', 'btn', '\u25c0 Move left');
        left.type = 'button';
        left.addEventListener('click', () => step(-1));
        const right = el('button', 'btn', 'Move right \u25b6');
        right.type = 'button';
        right.addEventListener('click', () => step(1));
        const del = el('button', 'btn danger', 'Delete');
        del.type = 'button';
        del.addEventListener('click', () => {
          if (!confirm(`Remove "${work.title || 'this book'}" from your shelf?`)) return;
          const loc = locate(work.id);
          if (loc) loc.shelf.books.splice(loc.index, 1);
          commit();
          dlg.close();
        });
        btns.append(left, right, el('span', 'spacer'), del);
      }
      form.append(btns);

      form.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!work.title.trim()) { tIn.focus(); return; }
        const clean = normBook({ ...work, title: work.title.trim() });
        const target = state.data.shelves.find((s) => s.id === targetShelf);
        if (isNew) {
          target.books.push(clean);
        } else {
          const loc = locate(work.id);
          if (loc) {
            Object.assign(loc.book, clean);
            if (loc.shelf.id !== targetShelf) {
              loc.shelf.books.splice(loc.index, 1);
              target.books.push(loc.book);
            }
          }
        }
        commit();
        dlg.close();
      });

      main.append(form);
    }

    dlg.showModal();
    if (state.edit) { const first = dlg.querySelector('input[type="text"]'); if (first && isNew) first.focus(); }
  }

  /* ------------------------ Export / import / publish ------------------ */

  function exportJSON() {
    const blob = new Blob([JSON.stringify(state.data, null, 2) + '\n'], { type: 'application/json' });
    const a = el('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'data.json';
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    toast('Downloaded data.json \u2014 upload it to your repo to publish.');
  }

  function importJSON(file) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = normalize(JSON.parse(String(reader.result).replace(/^\uFEFF/, '')));
        if (!confirm('Replace your current shelves with the imported file?')) return;
        state.data = parsed;
        commit();
        toast('Imported.');
      } catch (e) {
        toast('That file is not valid bookshelf JSON.');
      }
    };
    reader.readAsText(file);
  }

  function guessRepo() {
    const m = location.hostname.match(/^(.+)\.github\.io$/);
    if (!m) return { owner: '', repo: '' };
    const seg = location.pathname.split('/').filter(Boolean)[0];
    return { owner: m[1], repo: seg && !/\.html?$/i.test(seg) ? seg : location.hostname };
  }
  function getGH() {
    let st = {};
    try { st = JSON.parse(localStorage.getItem(LS.gh)) || {}; } catch (e) { st = {}; }
    const g = guessRepo();
    return {
      owner: st.owner || g.owner,
      repo: st.repo || g.repo,
      branch: st.branch || 'main',
      path: st.path || 'data.json',
      token: st.token || '',
    };
  }

  function openSettings(msg) {
    const dlg = $('#settingsDialog');
    dlg.replaceChildren();
    const s = getGH();
    const form = el('form', 'dlg-form settings');
    form.append(el('h2', 'dlg-title', 'Publish settings'));
    form.append(el('p', 'muted',
      msg || 'Publishing commits data.json to your GitHub repo using a personal access token (fine-grained, Contents: read & write, this repo only). The token is stored in this browser only.'));
    const inputs = {};
    [
      ['owner', 'GitHub username'],
      ['repo', 'Repository name'],
      ['branch', 'Branch'],
      ['path', 'Data file path'],
      ['token', 'Personal access token'],
    ].forEach(([k, label]) => {
      const i = el('input');
      i.type = k === 'token' ? 'password' : 'text';
      i.value = s[k] || '';
      i.autocomplete = 'off';
      i.spellcheck = false;
      inputs[k] = i;
      form.append(field(label, i));
    });
    const btns = el('div', 'btn-row');
    const save = el('button', 'btn primary', 'Save');
    save.type = 'submit';
    const cancel = el('button', 'btn', 'Cancel');
    cancel.type = 'button';
    cancel.addEventListener('click', () => dlg.close());
    btns.append(save, cancel);
    form.append(btns);
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const out = {};
      Object.keys(inputs).forEach((k) => { out[k] = inputs[k].value.trim(); });
      try { localStorage.setItem(LS.gh, JSON.stringify(out)); } catch (err) { /* ignore */ }
      dlg.close();
      toast('Settings saved.');
    });
    dlg.append(form);
    dlg.showModal();
  }

  const b64 = (str) => {
    const bytes = new TextEncoder().encode(str);
    let bin = '';
    bytes.forEach((b) => { bin += String.fromCharCode(b); });
    return btoa(bin);
  };
  async function ghError(r) {
    let m = '';
    try { m = (await r.json()).message; } catch (e) { /* ignore */ }
    return `${r.status} ${m || r.statusText}`;
  }

  async function publish() {
    const s = getGH();
    if (!s.token || !s.owner || !s.repo) {
      openSettings('Add your GitHub details and a token first, then click Publish again.');
      return;
    }
    const btn = $('#publishBtn');
    btn.disabled = true;
    btn.textContent = 'Publishing\u2026';
    try {
      const path = s.path.split('/').map(encodeURIComponent).join('/');
      const url = `https://api.github.com/repos/${encodeURIComponent(s.owner)}/${encodeURIComponent(s.repo)}/contents/${path}`;
      const headers = {
        Authorization: `Bearer ${s.token}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      };
      let sha;
      const cur = await fetch(`${url}?ref=${encodeURIComponent(s.branch)}`, { headers });
      if (cur.ok) {
        const info = await cur.json();
        sha = info.sha;
        // If the file on GitHub was changed somewhere else (for example Muse
        // added a book), don't silently overwrite it with this browser's draft.
        let remote = null;
        try {
          let raw = new TextDecoder().decode(
            Uint8Array.from(atob(String(info.content || '').replace(/\s/g, '')), (c) => c.charCodeAt(0))
          );
          if (raw.charCodeAt(0) === 0xfeff) raw = raw.slice(1);
          remote = JSON.stringify(normalize(JSON.parse(raw)));
        } catch (e) { /* could not compare; carry on */ }
        if (remote && remote !== state.baseline && remote !== JSON.stringify(state.data)) {
          const go = confirm(
            'The bookshelf on GitHub has changed since you loaded this page (for example, books added by Muse).\n\n' +
            'Publishing now will overwrite those changes.\n\n' +
            'Press Cancel, then use "Reload live" to pull in the latest version and redo your edits. Press OK to overwrite anyway.'
          );
          if (!go) { toast('Publish cancelled.'); return; }
        }
      } else if (cur.status !== 404) throw new Error(await ghError(cur));

      const body = {
        message: 'Update bookshelf',
        content: b64(JSON.stringify(state.data, null, 2) + '\n'),
        branch: s.branch,
      };
      if (sha) body.sha = sha;
      const put = await fetch(url, {
        method: 'PUT',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!put.ok) throw new Error(await ghError(put));

      state.baseline = JSON.stringify(state.data);
      try { localStorage.setItem(LS.base, state.baseline); } catch (e) { /* ignore */ }
      updateDirty();
      toast('Published! The live site updates in about a minute.');
    } catch (err) {
      toast('Publish failed: ' + err.message);
    } finally {
      btn.disabled = false;
      btn.textContent = 'Publish';
    }
  }

  /* -------------------------------- Toast ------------------------------ */

  let toastTimer;
  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 5000);
  }

  /* --------------------------------- Init ------------------------------ */

  function init() {
    // Click the dark backdrop to close a dialog
    ['#bookDialog', '#settingsDialog'].forEach((sel) => {
      const d = $(sel);
      d.addEventListener('click', (e) => { if (e.target === d) d.close(); });
    });

    // Bind safely: if index.html is an older copy missing a button, skip it
    // instead of crashing the whole page.
    const on = (sel, evt, fn) => { const n = $(sel); if (n) n.addEventListener(evt, fn); };
    if (OWNER) {
      state.edit = true;
      const tb = $('#toolbar'); if (tb) tb.hidden = false;
      const et = $('#editToggle'); if (et) et.checked = true;
      on('#editToggle', 'change', (e) => { state.edit = e.target.checked; render(); });
      on('#addShelfBtn', 'click', addShelf);
      on('#publishBtn', 'click', publish);
      on('#reloadBtn', 'click', () => {
        if (isDirty() && !confirm('Discard your unpublished changes and reload the live bookshelf?')) return;
        try { localStorage.removeItem(LS.draft); localStorage.removeItem(LS.base); } catch (e) { /* ignore */ }
        load().then(() => toast('Reloaded from the live site.'));
      });
      on('#exportBtn', 'click', exportJSON);
      on('#importBtn', 'click', () => $('#importFile').click());
      on('#importFile', 'change', (e) => {
        if (e.target.files[0]) importJSON(e.target.files[0]);
        e.target.value = '';
      });
      on('#settingsBtn', 'click', () => openSettings());
      on('#siteTitle', 'click', () => {
        if (!state.edit) return;
        const t = scrub(prompt('Page title:', state.data.title));
        if (t) { state.data.title = t; commit(); }
      });
    }

    load();
  }

  init();
})();
