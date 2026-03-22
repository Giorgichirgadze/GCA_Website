// ── NAV SCROLL
window.addEventListener('scroll', () => {
  document.getElementById('nav').classList.toggle('scrolled', window.scrollY > 40);
});

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
  lbDescription.textContent = item.dataset.description || '';
  showPhoto(0);
  lightbox.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function showPhoto(index) {
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
  if (current < photos.length - 1) showPhoto(++current);
});

document.getElementById('lightbox-overlay').addEventListener('click', closeLightbox);
document.getElementById('lightbox-close').addEventListener('click', closeLightbox);

document.addEventListener('keydown', e => {
  if (!lightbox.classList.contains('active')) return;
  if (e.key === 'Escape')     closeLightbox();
  if (e.key === 'ArrowRight' && current < photos.length - 1) showPhoto(++current);
  if (e.key === 'ArrowLeft'  && current > 0)                 showPhoto(--current);
});

