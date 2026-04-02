/* ── DOM ── */
const ownerInput = document.getElementById('gh-owner');
const repoInput = document.getElementById('gh-repo');
const branchInput = document.getElementById('gh-branch');
const tokenInput = document.getElementById('gh-token');

const titleInput = document.getElementById('p-title');
const locationInput = document.getElementById('p-location');
const descriptionInput = document.getElementById('p-description');
const photosInput = document.getElementById('p-photos');
const photoDrop = document.getElementById('photo-drop');
const photoPreviewsEl = document.getElementById('photo-previews');
const photoCountEl = document.getElementById('photo-count');

const progressWrap = document.getElementById('progress-wrap');
const progressFill = document.getElementById('progress-fill');
const progressText = document.getElementById('progress-text');

const projectsListEl = document.getElementById('projects-list');
const statusAuth = document.getElementById('status-auth');
const statusForm = document.getElementById('status-form');
const statusPublish = document.getElementById('status-publish');

const uploadGalleryBtn = document.getElementById('upload-gallery-btn');
const clearFormBtn = document.getElementById('clear-form-btn');
const reloadBtn = document.getElementById('reload-btn');

let projects = [];
let selectedFiles = [];

/* ── STATUS ── */
function setStatus(el, text) {
  el.textContent = text;
}

/* ── GITHUB CONFIG ── */
function saveGithubConfig() {
  const cfg = {
    owner: ownerInput.value.trim(),
    repo: repoInput.value.trim(),
    branch: branchInput.value.trim(),
    token: tokenInput.value.trim()
  };
  try {
    localStorage.setItem('gca_admin_cfg', JSON.stringify(cfg));
  } catch {}
}

function loadGithubConfig() {
  try {
    const raw = localStorage.getItem('gca_admin_cfg');
    if (!raw) return;
    const cfg = JSON.parse(raw);
    if (cfg.owner) ownerInput.value = cfg.owner;
    if (cfg.repo) repoInput.value = cfg.repo;
    if (cfg.branch) branchInput.value = cfg.branch;
    if (cfg.token) tokenInput.value = cfg.token;
  } catch {}
}

ownerInput.addEventListener('input', saveGithubConfig);
repoInput.addEventListener('input', saveGithubConfig);
branchInput.addEventListener('input', saveGithubConfig);
tokenInput.addEventListener('input', saveGithubConfig);

function getGithubConfig() {
  return {
    owner: ownerInput.value.trim(),
    repo: repoInput.value.trim(),
    branch: branchInput.value.trim() || 'main',
    token: tokenInput.value.trim()
  };
}

function requireGithubConfig() {
  const cfg = getGithubConfig();
  if (!cfg.owner || !cfg.repo || !cfg.token) {
    throw new Error('Owner, Repo და Token აუცილებელია');
  }
  return cfg;
}

/* ── PHOTO SELECTION & PREVIEW ── */
function addFiles(newFiles) {
  for (const file of newFiles) {
    if (file.type.startsWith('image/')) {
      selectedFiles.push(file);
    }
  }
  renderPhotoPreviews();
}

function removeFile(index) {
  selectedFiles.splice(index, 1);
  renderPhotoPreviews();
}

function renderPhotoPreviews() {
  photoPreviewsEl.innerHTML = '';
  photoCountEl.textContent = selectedFiles.length
    ? `არჩეულია ${selectedFiles.length} ფოტო`
    : '';

  selectedFiles.forEach((file, i) => {
    const thumb = document.createElement('div');
    thumb.className = 'photo-thumb';

    const img = document.createElement('img');
    img.src = URL.createObjectURL(file);
    img.onload = () => URL.revokeObjectURL(img.src);

    const removeBtn = document.createElement('button');
    removeBtn.className = 'remove-photo';
    removeBtn.textContent = '✕';
    removeBtn.type = 'button';
    removeBtn.addEventListener('click', () => removeFile(i));

    thumb.appendChild(img);
    thumb.appendChild(removeBtn);
    photoPreviewsEl.appendChild(thumb);
  });
}

/* file input */
photoDrop.addEventListener('click', () => photosInput.click());
photosInput.addEventListener('change', () => {
  addFiles(Array.from(photosInput.files));
  photosInput.value = '';
});

/* drag & drop */
photoDrop.addEventListener('dragover', e => {
  e.preventDefault();
  photoDrop.classList.add('dragover');
});
photoDrop.addEventListener('dragleave', () => {
  photoDrop.classList.remove('dragover');
});
photoDrop.addEventListener('drop', e => {
  e.preventDefault();
  photoDrop.classList.remove('dragover');
  addFiles(Array.from(e.dataTransfer.files));
});

/* ── FORM CLEAR ── */
function clearForm() {
  titleInput.value = '';
  locationInput.value = '';
  descriptionInput.value = '';
  photosInput.value = '';
  selectedFiles = [];
  renderPhotoPreviews();
  hideProgress();
}

/* ── PROGRESS ── */
function showProgress(text, percent) {
  progressWrap.classList.add('active');
  progressText.textContent = text;
  progressFill.style.width = percent + '%';
}

function hideProgress() {
  progressWrap.classList.remove('active');
  progressFill.style.width = '0%';
  progressText.textContent = '';
}

/* ── PROJECTS LIST ── */
function renderProjects() {
  if (!projects.length) {
    projectsListEl.innerHTML = '<div class="project-sub">გალერეები ცარიელია</div>';
    return;
  }

  projectsListEl.innerHTML = '';
  projects.forEach((project, index) => {
    const row = document.createElement('div');
    row.className = 'project-item';
    row.innerHTML = `
      <div class="project-meta">
        <div class="project-title">${project.title}</div>
        <div class="project-sub">${project.location} • ${project.photos.length} ფოტო</div>
      </div>
      <button type="button" data-index="${index}">წაშლა</button>
    `;
    row.querySelector('button').addEventListener('click', async () => {
      if (!confirm(`წავშალოთ "${project.title}"?`)) return;
      projects.splice(index, 1);
      renderProjects();
      try {
        const cfg = requireGithubConfig();
        await saveProjectsJson(cfg);
        setStatus(statusPublish, 'გალერეა წაიშალა და JSON განახლდა');
      } catch (err) {
        setStatus(statusPublish, 'წაიშალა სიიდან, მაგრამ JSON ვერ განახლდა: ' + err.message);
      }
    });
    projectsListEl.appendChild(row);
  });
}

async function loadProjects() {
  const response = await fetch('../data/projects.json', { cache: 'no-store' });
  if (!response.ok) throw new Error('projects.json ვერ ჩაიტვირთა');
  projects = await response.json();
  renderProjects();
}

/* ── GITHUB API ── */
function arrayBufferToBase64(buffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}

function textToBase64(text) {
  return btoa(unescape(encodeURIComponent(text)));
}

async function githubRequest(cfg, path, method = 'GET', body) {
  const url = `https://api.github.com/repos/${cfg.owner}/${cfg.repo}/contents/${path}`;
  const response = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${cfg.token}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json'
    },
    body: body ? JSON.stringify(body) : undefined
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.message || 'GitHub მოთხოვნა ჩავარდა');
  }
  return payload;
}

function formatGithubError(error) {
  const message = error?.message || 'GitHub მოთხოვნა ჩავარდა';
  if (message.includes('Resource not accessible by personal access token')) {
    return 'Token-ს არ აქვს წვდომა ამ repo-ზე. შეამოწმე: 1) Owner/Repo სწორია 2) Token-ს აქვს Contents Read and Write 3) თუ Organization-ია, SSO ავტორიზაცია ჩართულია.';
  }
  if (message.includes('Not Found')) {
    return 'Repo ვერ მოიძებნა. გადაამოწმე Owner და Repo ზუსტად.';
  }
  if (message.includes('Bad credentials')) {
    return 'Token არასწორია ან გაუქმებულია.';
  }
  return message;
}

async function verifyRepoAccess(cfg) {
  const response = await fetch(`https://api.github.com/repos/${cfg.owner}/${cfg.repo}`, {
    headers: {
      Authorization: `Bearer ${cfg.token}`,
      Accept: 'application/vnd.github+json'
    }
  });
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.message || 'Repo წვდომა ვერ დადასტურდა');
  }
}

async function getFileSha(cfg, path) {
  try {
    const result = await githubRequest(cfg, `${path}?ref=${encodeURIComponent(cfg.branch)}`);
    return result.sha;
  } catch {
    return null;
  }
}

/* ── ახალი საქაღალდის ნომრის პოვნა ── */
function getNextFolderNumber() {
  let maxNum = 0;
  for (const proj of projects) {
    for (const photo of (proj.photos || [])) {
      const match = photo.match(/^images\/(?:f|g)(\d+)\//);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    }
  }
  return maxNum + 1;
}

/* ── ერთიანი ატვირთვა ── */
async function uploadGallery() {
  setStatus(statusForm, '');

  const title = titleInput.value.trim();
  const location = locationInput.value.trim();
  const description = descriptionInput.value.trim();

  if (!title || !location) {
    throw new Error('სათაური და ლოკაცია აუცილებელია');
  }
  if (!selectedFiles.length) {
    throw new Error('მინიმუმ 1 ფოტო უნდა აირჩიო');
  }

  const cfg = requireGithubConfig();

  /* 1. GitHub კავშირის შემოწმება */
  showProgress('GitHub კავშირის შემოწმება...', 5);
  await verifyRepoAccess(cfg);
  setStatus(statusAuth, 'GitHub კავშირი დადასტურდა');

  /* 2. საქაღალდის ნომერი */
  const folderNum = getNextFolderNumber();
  const folderPath = `images/g${folderNum}`;
  const photoPaths = [];
  const total = selectedFiles.length;

  /* 3. ფოტოების ატვირთვა */
  for (let i = 0; i < total; i++) {
    const file = selectedFiles[i];
    const ext = file.name.split('.').pop().toLowerCase() || 'jpg';
    const targetPath = `${folderPath}/${i + 1}.${ext}`;

    showProgress(`ფოტო ${i + 1}/${total} იტვირთება...`, 10 + ((i / total) * 75));

    const buffer = await file.arrayBuffer();
    const content = arrayBufferToBase64(buffer);
    await githubRequest(cfg, targetPath, 'PUT', {
      message: `add ${targetPath}`,
      content,
      branch: cfg.branch
    });
    photoPaths.push(targetPath);
  }

  /* 4. projects.json განახლება */
  showProgress('projects.json ინახება...', 90);

  projects.unshift({
    title,
    location,
    description,
    photos: photoPaths
  });

  await saveProjectsJson(cfg);

  showProgress('დასრულდა!', 100);
  return folderNum;
}

async function saveProjectsJson(cfg) {
  const path = 'data/projects.json';
  const content = JSON.stringify(projects, null, 2);
  const sha = await getFileSha(cfg, path);
  await githubRequest(cfg, path, 'PUT', {
    message: 'update projects data',
    content: textToBase64(content),
    branch: cfg.branch,
    ...(sha ? { sha } : {})
  });
}

/* ── EVENT LISTENERS ── */
uploadGalleryBtn.addEventListener('click', async () => {
  try {
    uploadGalleryBtn.disabled = true;
    const folderNum = await uploadGallery();
    renderProjects();
    clearForm();
    setStatus(statusForm, `✅ გალერეა g${folderNum} წარმატებით აიტვირთა!`);
  } catch (error) {
    setStatus(statusForm, '❌ ' + formatGithubError(error));
    hideProgress();
  } finally {
    uploadGalleryBtn.disabled = false;
  }
});

clearFormBtn.addEventListener('click', () => {
  clearForm();
  setStatus(statusForm, 'ფორმა გასუფთავდა');
});

reloadBtn.addEventListener('click', async () => {
  try {
    await loadProjects();
    setStatus(statusPublish, 'მონაცემები განახლდა');
  } catch (error) {
    setStatus(statusPublish, error.message);
  }
});

/* ── INIT ── */
loadProjects()
  .then(() => setStatus(statusAuth, 'შეავსე GitHub Owner/Repo/Token და დაიწყე გალერეის შექმნა'))
  .catch(error => setStatus(statusAuth, error.message));

loadGithubConfig();
