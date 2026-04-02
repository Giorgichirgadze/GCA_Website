<<<<<<< HEAD
// ── NAV SCROLL
=======
>>>>>>> a67e297 (local backup before syncing origin)
window.addEventListener('scroll', () => {
  document.getElementById('nav').classList.toggle('scrolled', window.scrollY > 40);
});

<<<<<<< HEAD
// ── REVEAL ON SCROLL
const observer = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
}, { threshold: 0.12 });

document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

// ── LIGHTBOX
const lightbox      = document.getElementById('lightbox');
const lbImg         = document.getElementById('lightbox-img');
const lbTitle       = document.getElementById('lightbox-title');
const lbLocation    = document.getElementById('lightbox-location');
const lbDescription = document.getElementById('lightbox-description');
const lbCounter     = document.getElementById('lightbox-counter');
const lbPrev        = document.getElementById('lb-prev');
const lbNext        = document.getElementById('lb-next');

let photos  = [];
let current = 0;

function openGallery(item) {
  photos  = item.dataset.photos.split(',').map(p => p.trim());
  current = 0;
  lbTitle.textContent       = item.dataset.title;
  lbLocation.textContent    = item.dataset.location;
=======
const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
    }
  });
}, { threshold: 0.12 });

const lightbox = document.getElementById('lightbox');
const lbImg = document.getElementById('lightbox-img');
const lbTitle = document.getElementById('lightbox-title');
const lbLocation = document.getElementById('lightbox-location');
const lbDescription = document.getElementById('lightbox-description');
const lbCounter = document.getElementById('lightbox-counter');
const lbPrev = document.getElementById('lb-prev');
const lbNext = document.getElementById('lb-next');
const projectsGrid = document.getElementById('projects-grid');

let photos = [];
let current = 0;

function buildProjectCard(project, index) {
  const item = document.createElement('div');
  const primaryPhoto = project.photos?.[0] || '';
  const delay = (index % 4) * 0.04;

  item.className = 'grid-item reveal';
  item.style.transitionDelay = `${delay}s`;
  item.dataset.photos = (project.photos || []).join(',');
  item.dataset.title = project.title || '';
  item.dataset.location = project.location || '';
  item.dataset.description = project.description || '';

  item.innerHTML = `
    <img src="${primaryPhoto}" alt="${project.title || ''}"/>
    <div class="grid-overlay">
      <h3>${project.title || ''}</h3>
      <div class="overlay-bottom">
        <span>${project.location || ''}</span>
        <span class="photo-count">${(project.photos || []).length} photo</span>
      </div>
    </div>
  `;

  item.addEventListener('click', () => openGallery(item));
  observer.observe(item);
  return item;
}

async function loadProjects() {
  try {
    const response = await fetch('data/projects.json', { cache: 'no-store' });
    if (!response.ok) {
      throw new Error('Failed to load data/projects.json');
    }

    const projects = await response.json();
    projectsGrid.innerHTML = '';
    projects.forEach((project, index) => {
      projectsGrid.appendChild(buildProjectCard(project, index));
    });
  } catch (error) {
    projectsGrid.innerHTML = '<div class="reveal visible">Projects could not be loaded.</div>';
  }
}

function openGallery(item) {
  photos = (item.dataset.photos || '').split(',').map(p => p.trim()).filter(Boolean);
  current = 0;
  lbTitle.textContent = item.dataset.title || '';
  lbLocation.textContent = item.dataset.location || '';
>>>>>>> a67e297 (local backup before syncing origin)
  lbDescription.textContent = item.dataset.description || '';
  showPhoto(0);
  lightbox.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function showPhoto(index) {
<<<<<<< HEAD
=======
  if (!photos.length) return;
>>>>>>> a67e297 (local backup before syncing origin)
  lbImg.classList.add('fade');
  setTimeout(() => {
    lbImg.src = photos[index];
    lbImg.classList.remove('fade');
  }, 200);
  lbCounter.textContent = photos.length > 1 ? `${index + 1} / ${photos.length}` : '';
  lbPrev.disabled = index === 0;
  lbNext.disabled = index === photos.length - 1;
}

function closeLightbox() {
  lightbox.classList.remove('active');
  document.body.style.overflow = '';
<<<<<<< HEAD
  setTimeout(() => { lbImg.src = ''; }, 300);
}

document.querySelectorAll('.grid-item').forEach(item => {
  item.addEventListener('click', () => openGallery(item));
});

lbPrev.addEventListener('click', e => {
  e.stopPropagation();
  if (current > 0) showPhoto(--current);
});
lbNext.addEventListener('click', e => {
  e.stopPropagation();
=======
  setTimeout(() => {
    lbImg.src = '';
  }, 300);
}

lbPrev.addEventListener('click', event => {
  event.stopPropagation();
  if (current > 0) showPhoto(--current);
});

lbNext.addEventListener('click', event => {
  event.stopPropagation();
>>>>>>> a67e297 (local backup before syncing origin)
  if (current < photos.length - 1) showPhoto(++current);
});

document.getElementById('lightbox-overlay').addEventListener('click', closeLightbox);
document.getElementById('lightbox-close').addEventListener('click', closeLightbox);

<<<<<<< HEAD
document.addEventListener('keydown', e => {
  if (!lightbox.classList.contains('active')) return;
  if (e.key === 'Escape')     closeLightbox();
  if (e.key === 'ArrowRight' && current < photos.length - 1) showPhoto(++current);
  if (e.key === 'ArrowLeft'  && current > 0)                 showPhoto(--current);
});

=======
document.addEventListener('keydown', event => {
  if (!lightbox.classList.contains('active')) return;
  if (event.key === 'Escape') closeLightbox();
  if (event.key === 'ArrowRight' && current < photos.length - 1) showPhoto(++current);
  if (event.key === 'ArrowLeft' && current > 0) showPhoto(--current);
});

document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
loadProjects();

>>>>>>> a67e297 (local backup before syncing origin)
