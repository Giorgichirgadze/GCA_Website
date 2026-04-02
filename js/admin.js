const ownerInput = document.getElementById('gh-owner');
const repoInput = document.getElementById('gh-repo');
const branchInput = document.getElementById('gh-branch');
const tokenInput = document.getElementById('gh-token');

const titleInput = document.getElementById('p-title');
const locationInput = document.getElementById('p-location');
const descriptionInput = document.getElementById('p-description');
const photosInput = document.getElementById('p-photos');

const projectsListEl = document.getElementById('projects-list');
const statusAuth = document.getElementById('status-auth');
const statusForm = document.getElementById('status-form');
const statusPublish = document.getElementById('status-publish');

const addProjectBtn = document.getElementById('add-project-btn');
const clearFormBtn = document.getElementById('clear-form-btn');
const publishBtn = document.getElementById('publish-btn');
const reloadBtn = document.getElementById('reload-btn');

const GITHUB_CFG_STORAGE_KEY = 'gca_admin_cfg_v2';
let projects = [];

function setStatus(el, text) {
  el.textContent = text;
}

function saveGithubConfig() {
  const cfg = {
    owner: ownerInput.value.trim(),
    repo: repoInput.value.trim(),
    branch: branchInput.value.trim(),
    token: tokenInput.value.trim()
  };
  try {
    const serialized = JSON.stringify(cfg);
    localStorage.setItem(GITHUB_CFG_STORAGE_KEY, serialized);
    sessionStorage.setItem(GITHUB_CFG_STORAGE_KEY, serialized);
  } catch {}
}

function applyGithubConfig(cfg) {
  if (!cfg) return;
  if (cfg.owner) ownerInput.value = cfg.owner;
  if (cfg.repo) repoInput.value = cfg.repo;
  if (cfg.branch) branchInput.value = cfg.branch;
  if (cfg.token) tokenInput.value = cfg.token;
}

function inferGithubConfigFromLocation() {
  try {
    const host = window.location.hostname || '';
    const path = window.location.pathname || '';
    const isGithubPages = host.endsWith('.github.io');
    const firstPathSegment = path.split('/').filter(Boolean)[0] || '';
    if (!isGithubPages || !firstPathSegment) return null;
    const owner = host.split('.')[0];
    const repo = firstPathSegment;
    return { owner, repo, branch: 'main', token: '' };
  } catch {
    return null;
  }
}

function loadGithubConfig() {
  try {
    const raw = localStorage.getItem(GITHUB_CFG_STORAGE_KEY) || sessionStorage.getItem(GITHUB_CFG_STORAGE_KEY);
    if (raw) {
      applyGithubConfig(JSON.parse(raw));
      return true;
    }
  } catch {}
  return false;
}

function hydrateGithubConfig() {
  const hasSaved = loadGithubConfig();
  if (!hasSaved) {
    const inferred = inferGithubConfigFromLocation();
    applyGithubConfig(inferred);
    if (inferred) saveGithubConfig();
  }
  if (!branchInput.value.trim()) {
    branchInput.value = 'main';
    saveGithubConfig();
  }
}

ownerInput.addEventListener('input', saveGithubConfig);
repoInput.addEventListener('input', saveGithubConfig);
branchInput.addEventListener('input', saveGithubConfig);
tokenInput.addEventListener('input', saveGithubConfig);
window.addEventListener('beforeunload', saveGithubConfig);

function clearForm() {
  titleInput.value = '';
  locationInput.value = '';
  descriptionInput.value = '';
  photosInput.value = '';
}

function renderProjects() {
  if (!projects.length) {
    projectsListEl.innerHTML = '<div class="project-sub">სია ცარიელია</div>';
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
    row.querySelector('button').addEventListener('click', () => {
      projects.splice(index, 1);
      renderProjects();
      setStatus(statusForm, 'პროექტი წაიშალა სიიდან');
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

function readPhotos() {
  return Array.from(photosInput.files || []);
}

function normalizeText(value) {
  return (value || '').trim().toLowerCase();
}

function findExistingProjectIndex(title, location) {
  const targetTitle = normalizeText(title);
  const targetLocation = normalizeText(location);
  return projects.findIndex(project =>
    normalizeText(project.title) === targetTitle &&
    normalizeText(project.location) === targetLocation
  );
}

function mergePhotoPaths(existingPhotos, newPhotos) {
  const seen = new Set(existingPhotos || []);
  const merged = [...(existingPhotos || [])];
  (newPhotos || []).forEach(path => {
    if (!seen.has(path)) {
      seen.add(path);
      merged.push(path);
    }
  });
  return merged;
}

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

function sanitizeFileName(name) {
  return name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9.\-_]/g, '');
}

async function uploadImages(cfg, files) {
  const uploadedPaths = [];
  for (let i = 0; i < files.length; i += 1) {
    const file = files[i];
    const cleanName = sanitizeFileName(file.name);
    const stamp = Date.now();
    const targetPath = `images/uploads/${stamp}-${i}-${cleanName}`;
    const buffer = await file.arrayBuffer();
    const content = arrayBufferToBase64(buffer);
    await githubRequest(cfg, targetPath, 'PUT', {
      message: `upload ${targetPath}`,
      content,
      branch: cfg.branch
    });
    uploadedPaths.push(targetPath);
  }
  return uploadedPaths;
}

async function publishProjects(cfg) {
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

addProjectBtn.addEventListener('click', async () => {
  try {
    setStatus(statusForm, '');
    const title = titleInput.value.trim();
    const location = locationInput.value.trim();
    const description = descriptionInput.value.trim();
    const selectedPhotos = readPhotos();

    if (!title || !location) {
      throw new Error('სათაური და ლოკაცია აუცილებელია');
    }
    if (!selectedPhotos.length) {
      throw new Error('მინიმუმ 1 ფოტო უნდა ატვირთო');
    }

    const cfg = requireGithubConfig();
    await verifyRepoAccess(cfg);
    saveGithubConfig();
    setStatus(statusAuth, 'GitHub კავშირი დადასტურდა');
    setStatus(statusForm, 'ფოტოები იტვირთება GitHub-ზე...');
    const uploadedPaths = await uploadImages(cfg, selectedPhotos);

    const existingProjectIndex = findExistingProjectIndex(title, location);
    if (existingProjectIndex >= 0) {
      const existingProject = projects[existingProjectIndex];
      existingProject.photos = mergePhotoPaths(existingProject.photos, uploadedPaths);
      if (description) {
        existingProject.description = description;
      }
    } else {
      if (!description) {
        throw new Error('ახალი პროექტისთვის აღწერა აუცილებელია');
      }
      projects.unshift({
        title,
        location,
        description,
        photos: uploadedPaths
      });
    }

    renderProjects();
    clearForm();
    if (existingProjectIndex >= 0) {
      setStatus(statusForm, 'ფოტოები დაემატა უკვე არსებულ პროექტს. ახლა დააჭირე "GitHub-ზე გამოქვეყნება"');
    } else {
      setStatus(statusForm, 'პროექტი დაემატა სიაში. ახლა დააჭირე "GitHub-ზე გამოქვეყნება"');
    }
  } catch (error) {
    setStatus(statusForm, formatGithubError(error));
  }
});

clearFormBtn.addEventListener('click', () => {
  clearForm();
  setStatus(statusForm, 'ფორმა გასუფთავდა');
});

reloadBtn.addEventListener('click', async () => {
  try {
    await loadProjects();
    setStatus(statusPublish, 'საწყისი მონაცემები ჩაიტვირთა');
  } catch (error) {
    setStatus(statusPublish, error.message);
  }
});

publishBtn.addEventListener('click', async () => {
  try {
    const cfg = requireGithubConfig();
    await verifyRepoAccess(cfg);
    saveGithubConfig();
    setStatus(statusAuth, 'GitHub კავშირი დადასტურდა');
    setStatus(statusPublish, 'projects.json ინახება GitHub-ზე...');
    await publishProjects(cfg);
    setStatus(statusPublish, 'წარმატებით გამოქვეყნდა. საიტი განახლდება commit-ის შემდეგ.');
  } catch (error) {
    setStatus(statusPublish, formatGithubError(error));
  }
});

hydrateGithubConfig();

loadProjects()
  .then(() => {
    const cfg = getGithubConfig();
    if (cfg.owner && cfg.repo && cfg.token) {
      setStatus(statusAuth, 'GitHub კავშირი დამახსოვრებულია');
    } else {
      setStatus(statusAuth, 'GitHub კავშირი ავტომატურად დაიმახსოვრება ერთხელ შევსების შემდეგ');
    }
  })
  .catch(error => setStatus(statusAuth, error.message));
