/* ===================================================
   NAVNEET GUNDA PORTFOLIO — MAIN JAVASCRIPT
=================================================== */

const DATA_URL = './data.json';
let portfolioData = null;

/* ===== INIT ===== */
document.addEventListener('DOMContentLoaded', async () => {
  initParticles();
  initNavbar();
  initHamburger();
  AOS.init({ duration: 700, once: true, offset: 80 });
  await loadData();
  initTyped();
});

/* ===== LOAD DATA ===== */
async function loadData() {
  try {
    const res = await fetch(DATA_URL + '?t=' + Date.now());
    portfolioData = await res.json();
    renderAll();
  } catch (e) {
    console.error('Failed to load data.json', e);
  }
}

/* ===== RENDER ALL ===== */
function renderAll() {
  renderBasic();
  renderExperience();
  renderSkills();
  renderProjects();
  renderCertifications();
  renderEducation();
  renderContact();
}

/* ===== BASIC INFO ===== */
function renderBasic() {
  const b = portfolioData.basic;
  const s = portfolioData.stats;

  document.title = `${b.name} | ${b.title}`;
  setText('heroName', b.name);
  setText('heroBio', b.bio.substring(0, 120) + '...');
  setText('aboutBio', b.bio);
  setText('aboutLocation', b.location);
  setText('aboutCompany', b.title + ' @ ' + b.company);
  setAttr('aboutLinkedin', 'href', b.social.linkedin);
  setAttr('contactEmail', 'href', `mailto:${b.email}`);
  setText('contactEmailVal', b.email);
  setText('footerName', b.name);

  // Email in detail
  const emailEl = document.getElementById('aboutEmail');
  if (emailEl) emailEl.textContent = b.email;

  // Stats
  setText('statYears', (s.years_experience || 5) + '+');
  setText('statProjects', (s.projects_completed || 20) + '+');
  setText('statCerts', s.certifications || 3);
  setText('statClouds', s.clouds_managed || 2);

  // Profile picture
  const img = document.getElementById('profileImg');
  const initials = document.getElementById('avatarInitials');
  if (b.profile_picture) {
    img.src = b.profile_picture;
    img.style.display = 'block';
    initials.style.display = 'none';
  } else {
    img.style.display = 'none';
    initials.style.display = 'flex';
    const parts = b.name.split(' ');
    initials.textContent = parts.map(p => p[0]).join('').substring(0, 2).toUpperCase();
  }

  // Social links
  const heroSocials = document.getElementById('heroSocials');
  if (heroSocials) {
    heroSocials.innerHTML = buildSocials(b.social, true);
  }
  const footerSocials = document.getElementById('footerSocials');
  if (footerSocials) {
    footerSocials.innerHTML = buildSocials(b.social, false);
  }

  // Resume button
  const resumeBtn = document.getElementById('resumeBtn');
  if (resumeBtn && b.resume) {
    resumeBtn.href = b.resume;
    resumeBtn.style.display = 'inline-flex';
  }
}

function buildSocials(social, large) {
  const map = {
    linkedin: { icon: 'fab fa-linkedin-in', url: social.linkedin, label: 'LinkedIn' },
    github:   { icon: 'fab fa-github',      url: social.github,   label: 'GitHub'   },
    twitter:  { icon: 'fab fa-twitter',      url: social.twitter,  label: 'Twitter'  },
    website:  { icon: 'fas fa-globe',        url: social.website,  label: 'Website'  }
  };
  return Object.values(map)
    .filter(s => s.url)
    .map(s => large
      ? `<a href="${s.url}" target="_blank" class="social-icon" title="${s.label}"><i class="${s.icon}"></i></a>`
      : `<a href="${s.url}" target="_blank" title="${s.label}"><i class="${s.icon}"></i></a>`
    ).join('');
}

/* ===== EXPERIENCE ===== */
function renderExperience() {
  const container = document.getElementById('experienceTimeline');
  if (!container || !portfolioData.experience) return;

  container.innerHTML = portfolioData.experience.map((exp, i) => `
    <div class="timeline-item" data-aos="fade-up" data-aos-delay="${i * 100}">
      <div class="timeline-header">
        <div>
          <div class="timeline-role">${exp.title}</div>
          <div class="timeline-company"><i class="fas fa-building"></i> ${exp.company} · ${exp.location}</div>
        </div>
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
          ${exp.current ? '<span class="current-badge">🟢 Current</span>' : ''}
          <span class="timeline-period">${formatDate(exp.start_date)} → ${exp.current ? 'Present' : formatDate(exp.end_date)}</span>
        </div>
      </div>
      <p class="timeline-desc">${exp.description}</p>
      ${exp.highlights && exp.highlights.length ? `
        <ul class="timeline-highlights">
          ${exp.highlights.map(h => `<li>${h}</li>`).join('')}
        </ul>` : ''}
    </div>
  `).join('');
}

/* ===== SKILLS ===== */
function renderSkills() {
  const container = document.getElementById('skillsGrid');
  if (!container || !portfolioData.skills) return;

  container.innerHTML = Object.entries(portfolioData.skills).map(([cat, items], i) => `
    <div class="skill-category" data-aos="fade-up" data-aos-delay="${i * 80}">
      <div class="skill-cat-title">${cat}</div>
      ${items.map(skill => `
        <div class="skill-item">
          <div class="skill-info">
            <span class="skill-name">${skill.name}</span>
            <span class="skill-percent">${skill.level}%</span>
          </div>
          <div class="skill-bar">
            <div class="skill-fill" data-level="${skill.level}"></div>
          </div>
        </div>
      `).join('')}
    </div>
  `).join('');

  // Animate skill bars when visible
  animateSkillBars();
}

function animateSkillBars() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const fills = entry.target.querySelectorAll('.skill-fill');
        fills.forEach(fill => {
          setTimeout(() => {
            fill.style.width = fill.dataset.level + '%';
          }, 200);
        });
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.3 });

  document.querySelectorAll('.skill-category').forEach(el => observer.observe(el));
}

/* ===== PROJECTS ===== */
const PROJECT_ICONS = ['🚀', '🌊', '⚡', '🛡️', '🔧', '🎯', '🌐', '📊'];

function renderProjects() {
  const container = document.getElementById('projectsGrid');
  if (!container || !portfolioData.projects) return;

  container.innerHTML = portfolioData.projects.map((p, i) => `
    <div class="project-card" data-aos="fade-up" data-aos-delay="${i * 100}">
      <div class="project-icon">${PROJECT_ICONS[i % PROJECT_ICONS.length]}</div>
      <div class="project-title">${p.title}</div>
      <div class="project-dates"><i class="fas fa-calendar"></i> ${formatDate(p.start_date)} – ${formatDate(p.end_date) || 'Ongoing'}</div>
      <p class="project-desc">${p.description}</p>
      <div class="project-tech">
        ${p.tech.map(t => `<span class="tech-tag">${t}</span>`).join('')}
      </div>
      <div class="project-links">
        ${p.github_url ? `<a href="${p.github_url}" target="_blank" class="project-link"><i class="fab fa-github"></i> Code</a>` : ''}
        ${p.live_url ? `<a href="${p.live_url}" target="_blank" class="project-link"><i class="fas fa-external-link-alt"></i> Live</a>` : ''}
        ${!p.github_url && !p.live_url ? '<span class="project-link" style="opacity:.4"><i class="fas fa-lock"></i> Private</span>' : ''}
      </div>
    </div>
  `).join('');
}

/* ===== CERTIFICATIONS ===== */
function renderCertifications() {
  const container = document.getElementById('certsGrid');
  if (!container || !portfolioData.certifications) return;

  container.innerHTML = portfolioData.certifications.map((c, i) => `
    <div class="cert-card" data-aos="fade-up" data-aos-delay="${i * 80}">
      <div class="cert-icon">🏆</div>
      <div class="cert-info">
        <div class="cert-name">${c.name}</div>
        <div class="cert-issuer">${c.issuer}</div>
        <div class="cert-date"><i class="fas fa-calendar-check"></i> ${formatDate(c.date)}</div>
        ${c.credential_url ? `<a href="${c.credential_url}" target="_blank" class="cert-link"><i class="fas fa-external-link-alt"></i> View Credential</a>` : ''}
      </div>
    </div>
  `).join('');
}

/* ===== EDUCATION ===== */
function renderEducation() {
  const container = document.getElementById('educationList');
  if (!container || !portfolioData.education) return;

  container.innerHTML = portfolioData.education.map((e, i) => `
    <div class="edu-card" data-aos="fade-up" data-aos-delay="${i * 80}">
      <div class="edu-icon">🎓</div>
      <div>
        <div class="edu-degree">${e.degree}</div>
        <div class="edu-field">${e.field}</div>
        <div class="edu-institution">${e.institution} · ${e.location}</div>
        <div class="edu-meta">${e.start_year} – ${e.end_year} ${e.grade ? '· ' + e.grade : ''}</div>
      </div>
    </div>
  `).join('');
}

/* ===== CONTACT ===== */
function renderContact() {
  const b = portfolioData.basic;
  const emailEl = document.getElementById('contactEmail');
  if (emailEl && b.email) {
    emailEl.href = `mailto:${b.email}`;
    document.getElementById('contactEmailVal').textContent = b.email;
  }
}

/* ===== TYPED EFFECT ===== */
function initTyped() {
  const el = document.getElementById('typedText');
  if (!el || !portfolioData) return;

  const b = portfolioData.basic;
  const words = [
    b.title,
    'Cloud Architect',
    'Azure Expert',
    'CI/CD Engineer',
    'Automation Enthusiast'
  ];

  let wordIdx = 0, charIdx = 0, isDeleting = false;

  function type() {
    const word = words[wordIdx];
    el.textContent = isDeleting
      ? word.substring(0, charIdx--)
      : word.substring(0, charIdx++);

    let delay = isDeleting ? 60 : 100;

    if (!isDeleting && charIdx > word.length) {
      delay = 2000; isDeleting = true;
    } else if (isDeleting && charIdx < 0) {
      isDeleting = false; charIdx = 0;
      wordIdx = (wordIdx + 1) % words.length;
      delay = 400;
    }

    setTimeout(type, delay);
  }

  setTimeout(type, 1000);
}

/* ===== NAVBAR ===== */
function initNavbar() {
  const navbar = document.getElementById('navbar');
  const links = document.querySelectorAll('.nav-link');

  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 50);
    updateActiveLink(links);
  });

  links.forEach(link => {
    link.addEventListener('click', () => {
      document.getElementById('navLinks').classList.remove('open');
    });
  });
}

function updateActiveLink(links) {
  const scrollPos = window.scrollY + 100;
  const sections = document.querySelectorAll('section[id]');
  let current = '';

  sections.forEach(section => {
    if (section.offsetTop <= scrollPos) current = section.id;
  });

  links.forEach(link => {
    link.classList.toggle('active', link.getAttribute('href') === '#' + current);
  });
}

/* ===== HAMBURGER ===== */
function initHamburger() {
  const btn = document.getElementById('hamburger');
  const nav = document.getElementById('navLinks');
  if (!btn) return;

  btn.addEventListener('click', () => {
    nav.classList.toggle('open');
    btn.classList.toggle('open');
  });
}

/* ===== PARTICLES ===== */
function initParticles() {
  if (typeof particlesJS === 'undefined') return;
  particlesJS('particles-js', {
    particles: {
      number: { value: 60, density: { enable: true, value_area: 900 } },
      color: { value: ['#00d4ff', '#7c3aed', '#f97316'] },
      shape: { type: 'circle' },
      opacity: { value: 0.25, random: true, anim: { enable: true, speed: 0.5, opacity_min: 0.05, sync: false } },
      size: { value: 2.5, random: true },
      line_linked: { enable: true, distance: 140, color: '#00d4ff', opacity: 0.08, width: 1 },
      move: { enable: true, speed: 1.2, direction: 'none', random: true, straight: false, out_mode: 'out' }
    },
    interactivity: {
      detect_on: 'canvas',
      events: { onhover: { enable: true, mode: 'grab' }, onclick: { enable: true, mode: 'push' } },
      modes: { grab: { distance: 160, line_linked: { opacity: 0.3 } }, push: { particles_nb: 3 } }
    },
    retina_detect: true
  });
}

/* ===== UTILS ===== */
function setText(id, val) {
  const el = document.getElementById(id);
  if (el && val !== undefined && val !== null) el.textContent = val;
}

function setAttr(id, attr, val) {
  const el = document.getElementById(id);
  if (el && val) el.setAttribute(attr, val);
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const [y, m] = dateStr.split('-');
  if (!m) return y;
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${months[parseInt(m) - 1]} ${y}`;
}
