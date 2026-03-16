// ── HIGHLIGHT ACTIVE NAV LINK ──
document.addEventListener('DOMContentLoaded', function () {
  const page = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.remove('act');
    if (btn.getAttribute('href') === page) btn.classList.add('act');
  });
});
