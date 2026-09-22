const STORAGE_KEY = 'github-gist-tokens';
const BIN_STORAGE_KEY = 'github-gist-tokens-bin';
const SAVED_GISTS_KEY = 'github-gist-saved';
const BIN_GISTS_KEY = 'github-gist-saved-bin';
const TOKENS_COLLAPSED_KEY = 'github-gist-tokens-collapsed';
const GISTS_COLLAPSED_KEY = 'github-gist-gists-collapsed';

const form = document.getElementById('form');
const nameInput = document.getElementById('name');
const tokenInput = document.getElementById('token');
const submitBtn = document.getElementById('submitBtn');
const statusEl = document.getElementById('status');
const listEl = document.getElementById('gistsList');
const tokenListEl = document.getElementById('tokenList');
const savedTokensSection = document.getElementById('savedTokensSection');
const savedTokensArrow = document.getElementById('savedTokensArrow');
const savedGistsSection = document.getElementById('savedGistsSection');
const savedGistsArrow = document.getElementById('savedGistsArrow');
const savedGistsListEl = document.getElementById('savedGistsList');
const gistsSection = document.getElementById('gistsSection');
const gistsCountEl = document.getElementById('gistsCount');
const clearGistsBtn = document.getElementById('clearGistsBtn');
const deleteModal = document.getElementById('deleteModal');
const deleteModalMessage = document.getElementById('deleteModalMessage');
const deleteModalCancel = document.getElementById('deleteModalCancel');
const deleteModalConfirm = document.getElementById('deleteModalConfirm');
const optionsBtn = document.getElementById('optionsBtn');
const optionsDropdown = document.getElementById('optionsDropdown');
const openBinBtn = document.getElementById('openBinBtn');
const binCount = document.getElementById('binCount');
const openGistBinBtn = document.getElementById('openGistBinBtn');
const gistBinCountEl = document.getElementById('gistBinCount');
const binModal = document.getElementById('binModal');
const binList = document.getElementById('binList');
const binEmpty = document.getElementById('binEmpty');
const binModalClose = document.getElementById('binModalClose');
const binModalCloseBtn = document.getElementById('binModalCloseBtn');
const unsaveModal = document.getElementById('unsaveModal');
const unsaveModalCancel = document.getElementById('unsaveModalCancel');
const unsaveModalConfirm = document.getElementById('unsaveModalConfirm');
const gistBinModal = document.getElementById('gistBinModal');
const gistBinList = document.getElementById('gistBinList');
const gistBinEmpty = document.getElementById('gistBinEmpty');
const gistBinModalClose = document.getElementById('gistBinModalClose');
const gistBinModalCloseBtn = document.getElementById('gistBinModalCloseBtn');

function openDeleteModal(label, tokenIdToDelete) {
  deleteModal.dataset.pendingId = tokenIdToDelete;
  deleteModalMessage.textContent = `Remove "${label}" from saved tokens?`;
  deleteModal.classList.add('is-open');
  deleteModal.setAttribute('aria-hidden', 'false');
}

function closeDeleteModal() {
  deleteModal.classList.remove('is-open');
  deleteModal.setAttribute('aria-hidden', 'true');
  delete deleteModal.dataset.pendingId;
}

deleteModalCancel.addEventListener('click', closeDeleteModal);
deleteModal.addEventListener('click', (e) => {
  if (e.target === deleteModal) closeDeleteModal();
});
deleteModalConfirm.addEventListener('click', () => {
  const id = deleteModal.dataset.pendingId;
  if (!id) return;
  const tokens = getStoredTokens();
  const entry = tokens.find((t) => t.id === id);
  closeDeleteModal();
  if (!entry) return;
  const next = tokens.filter((t) => t.id !== id);
  setStoredTokens(next);
  const bin = getBinTokens();
  bin.push(entry);
  setBinTokens(bin);
  updateBinCount();
  renderSavedTokens();
  showStatus('Token moved to bin.', 'success');
});

function openUnsaveModal(gistId) {
  unsaveModal.dataset.pendingGistId = gistId;
  unsaveModal.classList.add('is-open');
  unsaveModal.setAttribute('aria-hidden', 'false');
}

function closeUnsaveModal() {
  unsaveModal.classList.remove('is-open');
  unsaveModal.setAttribute('aria-hidden', 'true');
  delete unsaveModal.dataset.pendingGistId;
}

unsaveModalCancel.addEventListener('click', closeUnsaveModal);
unsaveModal.addEventListener('click', (e) => {
  if (e.target === unsaveModal) closeUnsaveModal();
});
unsaveModalConfirm.addEventListener('click', () => {
  const id = unsaveModal.dataset.pendingGistId;
  if (!id) return;
  closeUnsaveModal();
  const saved = getSavedGists();
  const entry = saved.find((s) => s.id === id);
  if (!entry) return;
  const next = saved.filter((s) => s.id !== id);
  setSavedGists(next);
  const binGists = getBinGists();
  binGists.push(entry);
  setBinGists(binGists);
  updateGistBinCount();
  renderSavedGists();
  if (gistsSection.classList.contains('is-visible')) {
    const card = listEl.querySelector(`.gist-card[data-gist-id="${id}"]`);
    if (card) {
      const btn = card.querySelector('.save-gist-btn');
      const savedBadge = card.querySelector('.saved-badge');
      if (btn) {
        btn.innerHTML = saveIconSvg('unsaved');
        btn.classList.remove('is-saved');
        btn.title = 'Save gist';
        btn.setAttribute('aria-label', 'Save gist');
      }
      if (savedBadge) savedBadge.remove();
    }
  }
  showStatus('Gist moved to bin.', 'success');
});

function setGistsLoaded(loaded, count) {
  if (loaded) {
    savedTokensSection.classList.add('is-hidden');
    savedGistsSection.classList.add('is-hidden');
    gistsSection.classList.add('is-visible');
    gistsCountEl.textContent = count != null ? `Found ${count} gist${count === 1 ? '' : 's'}.` : '';
  } else {
    savedTokensSection.classList.remove('is-hidden');
    savedGistsSection.classList.remove('is-hidden');
    gistsSection.classList.remove('is-visible');
    listEl.innerHTML = '';
    gistsCountEl.textContent = '';
    renderSavedGists();
  }
}

clearGistsBtn.addEventListener('click', () => {
  setGistsLoaded(false);
  showStatus('', '');
  nameInput.value = '';
  tokenInput.value = '';
  renderSavedGists();
});

function getTokensCollapsed() {
  return localStorage.getItem(TOKENS_COLLAPSED_KEY) === 'true';
}

function setTokensCollapsed(collapsed) {
  localStorage.setItem(TOKENS_COLLAPSED_KEY, collapsed ? 'true' : 'false');
}

function getGistsCollapsed() {
  return localStorage.getItem(GISTS_COLLAPSED_KEY) === 'true';
}

function setGistsCollapsed(collapsed) {
  localStorage.setItem(GISTS_COLLAPSED_KEY, collapsed ? 'true' : 'false');
}

function applyTokensCollapsed() {
  const collapsed = getTokensCollapsed();
  if (collapsed) {
    savedTokensSection.classList.add('is-collapsed');
    savedTokensArrow.setAttribute('aria-expanded', 'false');
  } else {
    savedTokensSection.classList.remove('is-collapsed');
    savedTokensArrow.setAttribute('aria-expanded', 'true');
  }
}

function applyGistsCollapsed() {
  const collapsed = getGistsCollapsed();
  if (collapsed) {
    savedGistsSection.classList.add('is-collapsed');
    savedGistsArrow.setAttribute('aria-expanded', 'false');
  } else {
    savedGistsSection.classList.remove('is-collapsed');
    savedGistsArrow.setAttribute('aria-expanded', 'true');
  }
}

savedTokensArrow.addEventListener('click', () => {
  const collapsed = !getTokensCollapsed();
  setTokensCollapsed(collapsed);
  applyTokensCollapsed();
});

savedGistsArrow.addEventListener('click', () => {
  const collapsed = !getGistsCollapsed();
  setGistsCollapsed(collapsed);
  applyGistsCollapsed();
});

function getStoredTokens() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const data = raw ? JSON.parse(raw) : [];
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function setStoredTokens(tokens) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tokens));
}

function getBinTokens() {
  try {
    const raw = localStorage.getItem(BIN_STORAGE_KEY);
    const data = raw ? JSON.parse(raw) : [];
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function setBinTokens(tokens) {
  localStorage.setItem(BIN_STORAGE_KEY, JSON.stringify(tokens));
}

function getSavedGists() {
  try {
    const raw = localStorage.getItem(SAVED_GISTS_KEY);
    const data = raw ? JSON.parse(raw) : [];
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function setSavedGists(gists) {
  localStorage.setItem(SAVED_GISTS_KEY, JSON.stringify(gists));
}

function getBinGists() {
  try {
    const raw = localStorage.getItem(BIN_GISTS_KEY);
    const data = raw ? JSON.parse(raw) : [];
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function setBinGists(gists) {
  localStorage.setItem(BIN_GISTS_KEY, JSON.stringify(gists));
}

function updateGistBinCount() {
  const n = getBinGists().length;
  gistBinCountEl.textContent = n > 0 ? String(n) : '';
}

function renderSavedGists() {
  const saved = getSavedGists();
  if (!saved.length) {
    savedGistsListEl.innerHTML = '<p class="empty-state" style="padding: 1rem 0;">No saved gists yet. Save gists from the list when you fetch them.</p>';
    return;
  }
  savedGistsListEl.innerHTML = saved
    .map((g) => {
      const desc = (g.description && g.description.trim()) || '';
      const fileList = (g.files && g.files.trim()) || '—';
      const created = g.created_at ? new Date(g.created_at).toLocaleString() : '';
      const url = g.html_url || '#';
      const isPublic = g.public === true;
      return `
        <article class="gist-card" data-gist-id="${g.id}">
          <div class="gist-header">
            <a class="gist-link" href="${escapeHtml(url)}" target="_blank" rel="noopener">${escapeHtml(g.id)}</a>
            <span class="badge ${isPublic ? 'public' : 'private'}">${isPublic ? 'Public' : 'Private'}</span>
            <span class="badge saved-badge">Saved</span>
            <button type="button" class="save-gist-btn is-saved saved-gist-unsave" data-gist-id="${g.id}" title="Unsave" aria-label="Unsave">${saveIconSvg('saved')}</button>
          </div>
          <div class="gist-desc ${!desc ? 'empty' : ''}">${escapeHtml(desc) || 'No description'}</div>
          <div class="gist-files"><span>${escapeHtml(fileList)}</span></div>
          <div class="gist-meta">Created ${escapeHtml(created)}</div>
        </article>
      `;
    })
    .join('');

  savedGistsListEl.querySelectorAll('.saved-gist-unsave').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      openUnsaveModal(btn.dataset.gistId);
    });
  });
}

function updateBinCount() {
  const n = getBinTokens().length;
  binCount.textContent = n > 0 ? String(n) : '';
}

function closeOptionsDropdown() {
  optionsDropdown.classList.remove('is-open');
  optionsBtn.setAttribute('aria-expanded', 'false');
}

optionsBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  const open = optionsDropdown.classList.toggle('is-open');
  optionsBtn.setAttribute('aria-expanded', open);
});

document.addEventListener('click', (e) => {
  if (!e.target.closest('.options-wrap')) closeOptionsDropdown();
});
optionsDropdown.addEventListener('click', (e) => e.stopPropagation());

openBinBtn.addEventListener('click', () => {
  closeOptionsDropdown();
  openBinModal();
});

openGistBinBtn.addEventListener('click', () => {
  closeOptionsDropdown();
  openGistBinModal();
});

function openBinModal() {
  renderBinContents();
  binModal.classList.add('is-open');
  binModal.setAttribute('aria-hidden', 'false');
}

function closeBinModal() {
  binModal.classList.remove('is-open');
  binModal.setAttribute('aria-hidden', 'true');
}

binModalClose.addEventListener('click', closeBinModal);
binModalCloseBtn.addEventListener('click', closeBinModal);
binModal.addEventListener('click', (e) => {
  if (e.target === binModal) closeBinModal();
});

function renderBinContents() {
  const bin = getBinTokens();
  binEmpty.classList.toggle('is-visible', bin.length === 0);
  binList.innerHTML = bin
    .map((t) => {
      const displayName = (t.name && t.name.trim()) || 'Unnamed';
      const masked = maskToken(t.token);
      return `
        <div class="bin-item" data-id="${t.id}">
          <span class="bin-item-name">${escapeHtml(displayName)}</span>
          <span class="bin-item-masked">${masked}</span>
          <div class="bin-item-actions">
            <button type="button" class="btn-secondary bin-delete-permanent" data-id="${t.id}">Delete permanently</button>
            <button type="button" class="bin-restore" data-id="${t.id}">Restore</button>
          </div>
        </div>
      `;
    })
    .join('');

  binList.querySelectorAll('.bin-restore').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.dataset.id;
      const bin = getBinTokens();
      const entry = bin.find((t) => t.id === id);
      if (!entry) return;
      const main = getStoredTokens();
      main.push(entry);
      setStoredTokens(main);
      setBinTokens(bin.filter((t) => t.id !== id));
      updateBinCount();
      renderSavedTokens();
      renderBinContents();
      showStatus('Token restored.', 'success');
    });
  });

  binList.querySelectorAll('.bin-delete-permanent').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.dataset.id;
      const bin = getBinTokens().filter((t) => t.id !== id);
      setBinTokens(bin);
      updateBinCount();
      renderBinContents();
      showStatus('Token deleted permanently.', 'success');
    });
  });
}

function openGistBinModal() {
  renderGistBinContents();
  gistBinModal.classList.add('is-open');
  gistBinModal.setAttribute('aria-hidden', 'false');
}

function closeGistBinModal() {
  gistBinModal.classList.remove('is-open');
  gistBinModal.setAttribute('aria-hidden', 'true');
}

gistBinModalClose.addEventListener('click', closeGistBinModal);
gistBinModalCloseBtn.addEventListener('click', closeGistBinModal);
gistBinModal.addEventListener('click', (e) => {
  if (e.target === gistBinModal) closeGistBinModal();
});

function renderGistBinContents() {
  const bin = getBinGists();
  gistBinEmpty.classList.toggle('is-visible', bin.length === 0);
  gistBinList.innerHTML = bin
    .map((g) => {
      const desc = (g.description && g.description.trim()) || 'No description';
      const created = g.created_at ? new Date(g.created_at).toLocaleString() : '';
      return `
        <div class="bin-item gist-bin-item" data-gist-id="${g.id}">
          <span class="bin-item-name">${escapeHtml(g.id)}</span>
          <span class="bin-item-desc">${escapeHtml(desc.slice(0, 60))}${desc.length > 60 ? '…' : ''}</span>
          <span class="bin-item-meta">${escapeHtml(created)}</span>
          <div class="bin-item-actions">
            <button type="button" class="btn-secondary bin-gist-delete-permanent" data-gist-id="${g.id}">Delete permanently</button>
            <button type="button" class="bin-gist-restore" data-gist-id="${g.id}">Restore</button>
          </div>
        </div>
      `;
    })
    .join('');

  gistBinList.querySelectorAll('.bin-gist-restore').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.dataset.gistId;
      const bin = getBinGists();
      const entry = bin.find((g) => g.id === id);
      if (!entry) return;
      const saved = getSavedGists();
      saved.push(entry);
      setSavedGists(saved);
      setBinGists(bin.filter((g) => g.id !== id));
      updateGistBinCount();
      renderSavedGists();
      renderGistBinContents();
      showStatus('Gist restored.', 'success');
    });
  });

  gistBinList.querySelectorAll('.bin-gist-delete-permanent').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.dataset.gistId;
      const bin = getBinGists().filter((g) => g.id !== id);
      setBinGists(bin);
      updateGistBinCount();
      renderGistBinContents();
      showStatus('Gist deleted permanently.', 'success');
    });
  });
}

function maskToken(token) {
  if (!token || token.length < 8) return '••••••••';
  return token.slice(0, 4) + '•'.repeat(Math.min(20, token.length - 4));
}

function renderSavedTokens() {
  const tokens = getStoredTokens();
  if (!tokens.length) {
    tokenListEl.innerHTML = '<p class="empty-state" style="padding: 1rem 0;">No saved tokens yet. Tokens are added when you fetch gists.</p>';
    return;
  }
  tokenListEl.innerHTML = tokens
    .map((t) => {
      const displayName = (t.name && t.name.trim()) || 'Unnamed';
      const masked = maskToken(t.token);
      return `
        <div class="token-row" data-id="${t.id}">
          <span class="name">${escapeHtml(displayName)}</span>
          <span class="masked">${masked}</span>
          <div class="actions">
            <button type="button" class="btn-secondary btn-danger delete-token" data-id="${t.id}">Delete</button>
          </div>
        </div>
      `;
    })
    .join('');

  tokenListEl.querySelectorAll('.token-row').forEach((row) => {
    row.addEventListener('click', async (e) => {
      if (e.target.closest('.delete-token')) return;
      const entry = tokens.find((t) => t.id === row.dataset.id);
      if (!entry) return;
      nameInput.value = entry.name || '';
      tokenInput.value = entry.token;
      setLoading(true);
      listEl.innerHTML = '';
      try {
        const gists = await fetchAllGists(entry.token);
        setGistsLoaded(true, gists.length);
        showStatus('', '');
        renderGists(gists);
      } catch (err) {
        showStatus(err.message || 'Failed to fetch gists.', 'error');
      } finally {
        setLoading(false);
      }
    });
  });

  tokenListEl.querySelectorAll('.delete-token').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.dataset.id;
      const entry = tokens.find((t) => t.id === id);
      const label = entry ? (entry.name || 'Unnamed') : 'this token';
      openDeleteModal(label, id);
    });
  });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function showStatus(message, type) {
  statusEl.textContent = message;
  statusEl.className = 'status ' + (type || '');
  statusEl.style.display = message ? 'block' : 'none';
}

function setLoading(loading) {
  submitBtn.disabled = loading;
  if (loading) showStatus('Loading gists…', 'loading');
}

function saveTokenAfterFetch(token, name) {
  const tokens = getStoredTokens();
  const existing = tokens.find((t) => t.token === token);
  if (existing) {
    if (name && name.trim()) existing.name = name.trim();
    setStoredTokens(tokens);
    return;
  }
  const displayName = (name && name.trim()) || `Token ${tokens.length + 1}`;
  const id = crypto.randomUUID ? crypto.randomUUID() : 'id-' + Date.now();
  tokens.push({ id, name: displayName, token });
  setStoredTokens(tokens);
}

async function fetchAllGists(token) {
  const gists = [];
  let page = 1;
  const perPage = 100;

  while (true) {
    const url = `https://api.github.com/gists?per_page=${perPage}&page=${page}`;
    const res = await fetch(url, {
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `HTTP ${res.status}: ${res.statusText}`);
    }

    const data = await res.json();
    gists.push(...data);
    if (data.length < perPage) break;
    page++;
  }

  return gists;
}

function saveIconSvg(state) {
  const isSaved = state === 'saved';
  return `<svg class="save-gist-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>`;
}

function renderGists(gists) {
  if (!gists.length) {
    listEl.innerHTML = '<div class="empty-state">No gists found for this account.</div>';
    return;
  }

  const savedIds = new Set(getSavedGists().map((s) => s.id));

  listEl.innerHTML = gists
    .map((g) => {
      const desc = g.description && g.description.trim();
      const files = Object.keys(g.files || {});
      const fileList = files.length ? files.join(', ') : '—';
      const isPublic = g.public === true;
      const isSaved = savedIds.has(g.id);
      const saveDataUrl = escapeHtml(g.html_url || '');
      const saveDataDesc = escapeHtml((desc || '').slice(0, 200));
      const saveDataFiles = escapeHtml(fileList.slice(0, 150));
      const saveDataPublic = isPublic ? 'true' : 'false';

      return `
        <article class="gist-card" data-gist-id="${g.id}">
          <div class="gist-header">
            <a class="gist-link" href="${g.html_url}" target="_blank" rel="noopener">${g.id}</a>
            <span class="badge ${isPublic ? 'public' : 'private'}">${isPublic ? 'Public' : 'Private'}</span>
            ${isSaved ? '<span class="badge saved-badge">Saved</span>' : ''}
            <button type="button" class="save-gist-btn ${isSaved ? 'is-saved' : ''}" data-gist-id="${g.id}" data-gist-url="${saveDataUrl}" data-gist-desc="${saveDataDesc}" data-gist-created="${g.created_at}" data-gist-files="${saveDataFiles}" data-gist-public="${saveDataPublic}" title="${isSaved ? 'Saved' : 'Save gist'}" aria-label="${isSaved ? 'Saved' : 'Save gist'}">${isSaved ? saveIconSvg('saved') : saveIconSvg('unsaved')}</button>
          </div>
          <div class="gist-desc ${!desc ? 'empty' : ''}">${desc || 'No description'}</div>
          <div class="gist-files"><span>${fileList}</span></div>
          <div class="gist-meta">Created ${new Date(g.created_at).toLocaleString()}</div>
        </article>
      `;
    })
    .join('');

  listEl.querySelectorAll('.save-gist-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const id = btn.dataset.gistId;
      const saved = getSavedGists();
      const card = btn.closest('.gist-card');
      const header = card && card.querySelector('.gist-header');
      const savedBadge = header && header.querySelector('.saved-badge');

      if (btn.classList.contains('is-saved')) {
        openUnsaveModal(id);
      } else {
        if (saved.some((s) => s.id === id)) return;
        saved.push({
          id,
          html_url: btn.dataset.gistUrl,
          description: btn.dataset.gistDesc || '',
          created_at: btn.dataset.gistCreated,
          files: btn.dataset.gistFiles || '—',
          public: btn.dataset.gistPublic === 'true',
        });
        setSavedGists(saved);
        const binGists = getBinGists().filter((g) => g.id !== id);
        setBinGists(binGists);
        updateGistBinCount();
        if (gistBinModal.classList.contains('is-open')) renderGistBinContents();
        btn.innerHTML = saveIconSvg('saved');
        btn.classList.add('is-saved');
        btn.title = 'Unsave';
        btn.setAttribute('aria-label', 'Unsave');
        if (header) {
          const badge = document.createElement('span');
          badge.className = 'badge saved-badge';
          badge.textContent = 'Saved';
          btn.parentNode.insertBefore(badge, btn);
        }
        showStatus('Gist saved.', 'success');
      }
    });
  });
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const token = tokenInput.value.trim();
  if (!token) {
    showStatus('Please enter a GitHub token.', 'error');
    return;
  }

  setLoading(true);
  listEl.innerHTML = '';

  try {
    const gists = await fetchAllGists(token);
    saveTokenAfterFetch(token, nameInput.value.trim());
    renderSavedTokens();
    setGistsLoaded(true, gists.length);
    showStatus('', '');
    renderGists(gists);
  } catch (err) {
    showStatus(err.message || 'Failed to fetch gists.', 'error');
  } finally {
    setLoading(false);
  }
});

updateBinCount();
updateGistBinCount();
applyTokensCollapsed();
applyGistsCollapsed();
renderSavedTokens();
renderSavedGists();
