// ── CURSOR
const cursor = document.getElementById('cursor');

document.addEventListener('mousemove', e => {
  cursor.style.left = e.clientX + 'px';
  cursor.style.top  = e.clientY + 'px';
});

// cursor hover effect
document.querySelectorAll('a, .grid-item, button').forEach(el => {
  el.addEventListener('mouseenter', () => cursor.classList.add('expanded'));
  el.addEventListener('mouseleave', () => cursor.classList.remove('expanded'));
});

// cursor თეთრი — მუქ სექციებზე
document.querySelectorAll('#contact, footer').forEach(el => {
  el.addEventListener('mouseenter', () => {
    cursor.style.background = 'tramparent';
    cursor.style.color = '#f5f4f0';
  });
  el.addEventListener('mouseleave', () => {
    cursor.style.background = 'tramparent';
    cursor.style.color = '#0a0a0a';
  });
});

// ── NAV SCROLL
window.addEventListener('scroll', () => {
  document.getElementById('nav').classList.toggle('scrolled', window.scrollY > 40);
});

// ── REVEAL ON SCROLL
const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) entry.target.classList.add('visible');
  });
}, { threshold: 0.12 });

document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

// ── LIGHTBOX
const lightbox    = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightbox-img');

function openLightbox(src) {
  lightboxImg.src = src;
  lightbox.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  lightbox.classList.remove('active');
  lightboxImg.src = '';
  document.body.style.overflow = '';
}

document.querySelectorAll('.grid-item img').forEach(img => {
  img.addEventListener('click', () => openLightbox(img.src));
});

document.getElementById('lightbox-overlay').addEventListener('click', closeLightbox);
document.getElementById('lightbox-close').addEventListener('click', closeLightbox);
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeLightbox();
});
