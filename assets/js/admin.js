/* ===================================================
   PORTFOLIO ADMIN — JAVASCRIPT
   Uses GitHub API to read/write data.json
=================================================== */

let GH_TOKEN = '', GH_OWNER = '', GH_REPO = '';
let currentData = null;
let fileSha = '';
let currentSection = 'basic';

const API = 'https://api.github.com';

/* ===== LOGIN ===== */
async function handleLogin() {
  const btn = document.getElementById('loginBtn');
  const err = document.getElementById('loginError');
  GH_OWNER = document.getElementById('loginOwner').value.trim();
  GH_REPO  = document.getElementById('loginRepo').value.trim();
  GH_TOKEN = document.getElementById('loginToken').value.trim();

  if (!GH_OWNER || !GH_REPO || !GH_TOKEN) {
    err.textContent = 'Please fill in all fields.'; return;
  }

  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Connecting...';
  btn.disabled = true;
  err.textContent = '';

  try {
    const result = await fetchDataJson();
    if (!result) throw new Error('Could not load data.json from repo.');
    currentData = result;
    sessionStorage.setItem('gh_token', GH_TOKEN);
    sessionStorage.setItem('gh_owner', GH_OWNER);
    sessionStorage.setItem('gh_repo', GH_REPO);
    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('adminPanel').classList.remove('hidden');
    renderSection('basic');
  } catch (e) {
    err.textContent = 'Failed: ' + (e.message || 'Invalid token or repo not found.');
  } finally {
    btn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Connect & Edit';
    btn.disabled = false;
  }
}

async function fetchDataJson() {
  const url = `${API}/repos/${GH_OWNER}/${GH_REPO}/contents/data.json`;
  const res = await fetch(url, { headers: authHeaders() });
  if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);
  const json = await res.json();
  fileSha = json.sha;
  const content = atob(json.content.replace(/\n/g, ''));
  return JSON.parse(decodeURIComponent(escape(content)));
}

function authHeaders() {
  return {
    'Authorization': `token ${GH_TOKEN}`,
    'Content-Type': 'application/json',
    'Accept': 'application/vnd.github.v3+json'
  };
}

/* ===== SESSION RESTORE ===== */
window.addEventListener('DOMContentLoaded', () => {
  const t = sessionStorage.getItem('gh_token');
  const o = sessionStorage.getItem('gh_owner');
  const r = sessionStorage.getItem('gh_repo');
  if (t && o && r) {
    document.getElementById('loginToken').value = t;
    document.getElementById('loginOwner').value = o;
    document.getElementById('loginRepo').value = r;
    handleLogin();
  }
});

function handleLogout() {
  sessionStorage.clear();
  location.reload();
}

/* ===== SAVE & DEPLOY ===== */
async function saveChanges() {
  const btn = document.getElementById('saveBtn');
  const status = document.getElementById('saveStatus');

  collectCurrentSection();

  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
  btn.disabled = true;
  status.textContent = '';
  status.className = 'save-status';

  try {
    const content = unescape(encodeURIComponent(JSON.stringify(currentData, null, 2)));
    const encoded = btoa(content);

    const res = await fetch(`${API}/repos/${GH_OWNER}/${GH_REPO}/contents/data.json`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify({
        message: '✏️ Update portfolio via Admin Panel',
        content: encoded,
        sha: fileSha
      })
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Save failed');
    }

    const result = await res.json();
    fileSha = result.content.sha;

    status.textContent = '✅ Saved & deploying...';
    status.className = 'save-status success';
    showToast('Saved successfully! Site will update in ~1 minute.', 'success');
  } catch (e) {
    status.textContent = '❌ ' + e.message;
    status.className = 'save-status error';
    showToast('Error: ' + e.message, 'error');
  } finally {
    btn.innerHTML = '<i class="fas fa-save"></i> Save & Deploy';
    btn.disabled = false;
  }
}

/* ===== NAVIGATION ===== */
function showSection(section, el) {
  event.preventDefault();
  collectCurrentSection();
  currentSection = section;
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  if (el) el.classList.add('active');
  const titles = {
    basic: 'Basic Info', picture: 'Profile Picture', experience: 'Experience',
    skills: 'Skills', projects: 'Projects', certifications: 'Certifications',
    education: 'Education', blog: 'Blog Posts', stats: 'Stats & Numbers'
  };
  document.getElementById('topbarTitle').textContent = titles[section] || section;
  renderSection(section);
  if (window.innerWidth < 768) document.getElementById('sidebar').classList.remove('open');
}

function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
}

/* ===== RENDER SECTIONS ===== */
function renderSection(section) {
  const content = document.getElementById('adminContent');
  const map = {
    basic: renderBasicSection,
    picture: renderPictureSection,
    experience: renderExperienceSection,
    skills: renderSkillsSection,
    projects: renderProjectsSection,
    certifications: renderCertsSection,
    education: renderEducationSection,
    blog: renderBlogSection,
    stats: renderStatsSection
  };
  content.innerHTML = '';
  if (map[section]) map[section]();

  document.querySelectorAll('.section-panel').forEach(p => p.classList.remove('active'));
  const panel = document.getElementById(`panel-${section}`);
  if (panel) panel.classList.add('active');
}

/* ===== COLLECT CURRENT SECTION DATA ===== */
function collectCurrentSection() {
  const collectors = {
    basic: collectBasic,
    stats: collectStats
  };
  if (collectors[currentSection]) collectors[currentSection]();
}

/* ===== BASIC INFO ===== */
function renderBasicSection() {
  const b = currentData.basic;
  const c = document.getElementById('adminContent');
  c.innerHTML = `
    <div class="panel-header">
      <h2>Basic Information</h2>
      <p>Your name, title, bio, location and social links.</p>
    </div>
    <div class="edit-card">
      <div class="edit-card-header">
        <div class="edit-card-title"><i class="fas fa-user"></i> Personal Details</div>
      </div>
      <div class="form-grid">
        <div class="form-group">
          <label>Full Name</label>
          <input type="text" id="f_name" value="${esc(b.name)}"/>
        </div>
        <div class="form-group">
          <label>Job Title</label>
          <input type="text" id="f_title" value="${esc(b.title)}"/>
        </div>
        <div class="form-group">
          <label>Company</label>
          <input type="text" id="f_company" value="${esc(b.company)}"/>
        </div>
        <div class="form-group">
          <label>Location</label>
          <input type="text" id="f_location" value="${esc(b.location)}"/>
        </div>
        <div class="form-group">
          <label>Email</label>
          <input type="email" id="f_email" value="${esc(b.email)}"/>
        </div>
        <div class="form-group">
          <label>Phone</label>
          <input type="text" id="f_phone" value="${esc(b.phone)}"/>
        </div>
        <div class="form-group full">
          <label>Bio / About</label>
          <textarea id="f_bio" rows="5">${esc(b.bio)}</textarea>
        </div>
        <div class="form-group full">
          <label>Resume URL (Google Drive link or direct PDF URL)</label>
          <input type="url" id="f_resume" value="${esc(b.resume || '')}"/>
        </div>
      </div>
    </div>
    <div class="edit-card">
      <div class="edit-card-header">
        <div class="edit-card-title"><i class="fas fa-share-alt"></i> Social Links</div>
      </div>
      <div class="form-grid">
        <div class="form-group">
          <label><i class="fab fa-linkedin" style="color:#0a66c2"></i> LinkedIn URL</label>
          <input type="url" id="f_linkedin" value="${esc(b.social.linkedin)}"/>
        </div>
        <div class="form-group">
          <label><i class="fab fa-github"></i> GitHub URL</label>
          <input type="url" id="f_github" value="${esc(b.social.github)}"/>
        </div>
        <div class="form-group">
          <label><i class="fab fa-twitter" style="color:#1da1f2"></i> Twitter URL</label>
          <input type="url" id="f_twitter" value="${esc(b.social.twitter || '')}"/>
        </div>
        <div class="form-group">
          <label><i class="fas fa-globe" style="color:var(--cyan)"></i> Personal Website</label>
          <input type="url" id="f_website" value="${esc(b.social.website || '')}"/>
        </div>
      </div>
    </div>
  `;
}

function collectBasic() {
  if (!currentData) return;
  const b = currentData.basic;
  b.name     = val('f_name');
  b.title    = val('f_title');
  b.company  = val('f_company');
  b.location = val('f_location');
  b.email    = val('f_email');
  b.phone    = val('f_phone');
  b.bio      = val('f_bio');
  b.resume   = val('f_resume');
  b.social.linkedin = val('f_linkedin');
  b.social.github   = val('f_github');
  b.social.twitter  = val('f_twitter');
  b.social.website  = val('f_website');
}

/* ===== PROFILE PICTURE ===== */
function renderPictureSection() {
  const b = currentData.basic;
  const c = document.getElementById('adminContent');
  c.innerHTML = `
    <div class="panel-header">
      <h2>Profile Picture</h2>
      <p>Upload your profile photo. It will be saved as base64 in your portfolio.</p>
    </div>
    <div class="edit-card">
      <div class="picture-section">
        <div class="picture-preview" id="picturePreview">
          ${b.profile_picture
            ? `<img src="${b.profile_picture}" alt="Profile"/>`
            : getInitials(b.name)}
        </div>
        <div class="picture-actions">
          <div class="upload-area" onclick="document.getElementById('fileInput').click()">
            <i class="fas fa-cloud-upload-alt"></i>
            <p>Click to upload photo</p>
            <small>JPG, PNG, WEBP · Max 2MB · Will be resized to 400×400</small>
          </div>
          <input type="file" id="fileInput" accept="image/*" style="display:none" onchange="handleImageUpload(event)"/>
          ${b.profile_picture ? `<button class="btn btn-danger btn-sm" onclick="removeProfilePic()"><i class="fas fa-trash"></i> Remove Photo</button>` : ''}
        </div>
      </div>
    </div>
  `;
}

function handleImageUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  if (file.size > 2 * 1024 * 1024) { showToast('Image too large. Max 2MB.', 'error'); return; }

  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const size = 400;
      canvas.width = canvas.height = size;
      const ctx = canvas.getContext('2d');
      const scale = Math.max(size / img.width, size / img.height);
      const w = img.width * scale, h = img.height * scale;
      ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      currentData.basic.profile_picture = dataUrl;
      const preview = document.getElementById('picturePreview');
      preview.innerHTML = `<img src="${dataUrl}" alt="Profile"/>`;
      showToast('Photo ready. Click Save & Deploy.', 'success');
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function removeProfilePic() {
  currentData.basic.profile_picture = '';
  renderPictureSection();
  showToast('Photo removed.', 'info');
}

/* ===== EXPERIENCE ===== */
function renderExperienceSection() {
  const c = document.getElementById('adminContent');
  c.innerHTML = `
    <div class="panel-header">
      <h2>Work Experience</h2>
      <p>Add, edit or remove your work history.</p>
    </div>
    <div id="expList">
      ${currentData.experience.map((e, i) => buildExpCard(e, i)).join('')}
    </div>
    <button class="add-btn" onclick="addExperience()"><i class="fas fa-plus"></i> Add Experience</button>
  `;
}

function buildExpCard(e, i) {
  const highlights = (e.highlights || []).join('\n');
  return `
    <div class="list-item" id="expCard_${i}">
      <div class="list-item-header">
        <div>
          <div class="list-item-title">${esc(e.title)} @ ${esc(e.company)}</div>
          <div class="list-item-subtitle">${e.start_date} – ${e.current ? 'Present' : e.end_date}</div>
        </div>
        <div class="list-item-actions">
          <button class="icon-btn-sm danger" onclick="removeExperience(${i})"><i class="fas fa-trash"></i></button>
        </div>
      </div>
      <div class="form-grid">
        <div class="form-group"><label>Job Title</label><input type="text" id="exp_title_${i}" value="${esc(e.title)}"/></div>
        <div class="form-group"><label>Company</label><input type="text" id="exp_company_${i}" value="${esc(e.company)}"/></div>
        <div class="form-group"><label>Location</label><input type="text" id="exp_location_${i}" value="${esc(e.location)}"/></div>
        <div class="form-group"><label>Start Date</label><input type="month" id="exp_start_${i}" value="${e.start_date}"/></div>
        <div class="form-group"><label>End Date</label><input type="month" id="exp_end_${i}" value="${e.end_date || ''}" ${e.current ? 'disabled' : ''}/></div>
        <div class="form-group" style="align-self:end">
          <div class="checkbox-row">
            <input type="checkbox" id="exp_current_${i}" ${e.current ? 'checked' : ''} onchange="toggleCurrentJob(${i})"/>
            <label for="exp_current_${i}">Currently working here</label>
          </div>
        </div>
        <div class="form-group full"><label>Description</label><textarea id="exp_desc_${i}" rows="3">${esc(e.description)}</textarea></div>
        <div class="form-group full"><label>Highlights (one per line)</label><textarea id="exp_highlights_${i}" rows="4">${highlights}</textarea></div>
      </div>
      <button class="btn btn-outline btn-sm" onclick="saveExperience(${i})" style="margin-top:12px"><i class="fas fa-check"></i> Apply Changes</button>
    </div>
  `;
}

function saveExperience(i) {
  const e = currentData.experience[i];
  e.title       = val(`exp_title_${i}`);
  e.company     = val(`exp_company_${i}`);
  e.location    = val(`exp_location_${i}`);
  e.start_date  = val(`exp_start_${i}`);
  e.end_date    = val(`exp_end_${i}`);
  e.current     = document.getElementById(`exp_current_${i}`)?.checked || false;
  e.description = val(`exp_desc_${i}`);
  e.highlights  = val(`exp_highlights_${i}`).split('\n').filter(Boolean);
  showToast('Experience updated. Save & Deploy when ready.', 'info');
}

function toggleCurrentJob(i) {
  const endInput = document.getElementById(`exp_end_${i}`);
  endInput.disabled = document.getElementById(`exp_current_${i}`).checked;
}

function addExperience() {
  const newId = Date.now();
  currentData.experience.unshift({
    id: newId, title: 'New Role', company: 'Company', location: '',
    start_date: '', end_date: '', current: false,
    description: '', highlights: []
  });
  renderExperienceSection();
  showToast('New experience added. Fill in the details.', 'info');
}

function removeExperience(i) {
  if (!confirm('Remove this experience entry?')) return;
  currentData.experience.splice(i, 1);
  renderExperienceSection();
}

/* ===== SKILLS ===== */
function renderSkillsSection() {
  const c = document.getElementById('adminContent');
  const cats = Object.entries(currentData.skills);
  c.innerHTML = `
    <div class="panel-header">
      <h2>Skills & Technologies</h2>
      <p>Manage skill categories and proficiency levels.</p>
    </div>
    ${cats.map(([cat, items], ci) => `
      <div class="edit-card" id="skillCat_${ci}">
        <div class="edit-card-header">
          <div class="edit-card-title"><i class="fas fa-layer-group"></i>
            <input type="text" id="catName_${ci}" value="${esc(cat)}" style="background:transparent;border:none;border-bottom:1px solid var(--border);border-radius:0;padding:4px 0;font-weight:700;font-size:1rem;width:200px"/>
          </div>
          <button class="btn btn-danger btn-sm" onclick="removeCategory('${esc(cat)}')"><i class="fas fa-trash"></i> Remove Category</button>
        </div>
        <div id="skillsList_${ci}">
          ${items.map((s, si) => `
            <div class="skill-row" id="skillRow_${ci}_${si}">
              <input type="text" id="skillName_${ci}_${si}" value="${esc(s.name)}" placeholder="Skill name"/>
              <input type="number" id="skillLevel_${ci}_${si}" min="0" max="100" value="${s.level}" style="text-align:center"/>
              <button class="skill-delete" onclick="removeSkill('${esc(cat)}', ${si})"><i class="fas fa-times"></i></button>
            </div>
          `).join('')}
        </div>
        <button class="btn btn-outline btn-sm" style="margin-top:12px" onclick="addSkill('${esc(cat)}', ${ci})"><i class="fas fa-plus"></i> Add Skill</button>
        <button class="btn btn-sm" style="margin-top:12px;margin-left:8px;background:var(--cyan-dim);color:var(--cyan)" onclick="saveCategory(${ci}, '${esc(cat)}')"><i class="fas fa-check"></i> Apply</button>
      </div>
    `).join('')}
    <div class="edit-card">
      <div class="edit-card-title" style="margin-bottom:12px"><i class="fas fa-plus-circle" style="color:var(--cyan)"></i> Add New Category</div>
      <div class="add-category-row">
        <input type="text" id="newCatName" placeholder="Category name (e.g. DevOps Tools)"/>
        <button class="btn btn-primary btn-sm" onclick="addCategory()"><i class="fas fa-plus"></i> Add</button>
      </div>
    </div>
  `;
}

function saveCategory(ci, oldCat) {
  const newName = val(`catName_${ci}`);
  const items = currentData.skills[oldCat] || [];
  const catKeys = Object.keys(currentData.skills);
  const newSkills = {};
  catKeys.forEach((k, i) => {
    const name = i === ci ? newName : k;
    if (i === ci) {
      const updatedItems = items.map((s, si) => ({
        name: val(`skillName_${ci}_${si}`) || s.name,
        level: parseInt(val(`skillLevel_${ci}_${si}`)) || s.level
      }));
      newSkills[name] = updatedItems;
    } else {
      newSkills[name] = currentData.skills[k];
    }
  });
  currentData.skills = newSkills;
  renderSkillsSection();
  showToast('Skills updated.', 'info');
}

function addSkill(cat, ci) {
  if (!currentData.skills[cat]) currentData.skills[cat] = [];
  currentData.skills[cat].push({ name: 'New Skill', level: 70 });
  renderSkillsSection();
}

function removeSkill(cat, si) {
  currentData.skills[cat].splice(si, 1);
  renderSkillsSection();
}

function removeCategory(cat) {
  if (!confirm(`Remove category "${cat}"?`)) return;
  delete currentData.skills[cat];
  renderSkillsSection();
}

function addCategory() {
  const name = val('newCatName').trim();
  if (!name) return;
  currentData.skills[name] = [];
  renderSkillsSection();
}

/* ===== PROJECTS ===== */
function renderProjectsSection() {
  const c = document.getElementById('adminContent');
  c.innerHTML = `
    <div class="panel-header">
      <h2>Projects</h2>
      <p>Showcase your work and personal projects.</p>
    </div>
    <div id="projectsList">
      ${currentData.projects.map((p, i) => buildProjectCard(p, i)).join('')}
    </div>
    <button class="add-btn" onclick="addProject()"><i class="fas fa-plus"></i> Add Project</button>
  `;
}

function buildProjectCard(p, i) {
  return `
    <div class="list-item">
      <div class="list-item-header">
        <div>
          <div class="list-item-title">${esc(p.title)}</div>
          <div class="list-item-subtitle">${(p.tech || []).slice(0, 3).join(', ')}</div>
        </div>
        <button class="icon-btn-sm danger" onclick="removeProject(${i})"><i class="fas fa-trash"></i></button>
      </div>
      <div class="form-grid">
        <div class="form-group full"><label>Title</label><input type="text" id="proj_title_${i}" value="${esc(p.title)}"/></div>
        <div class="form-group full"><label>Description</label><textarea id="proj_desc_${i}" rows="3">${esc(p.description)}</textarea></div>
        <div class="form-group"><label>Start Date</label><input type="month" id="proj_start_${i}" value="${p.start_date || ''}"/></div>
        <div class="form-group"><label>End Date</label><input type="month" id="proj_end_${i}" value="${p.end_date || ''}"/></div>
        <div class="form-group"><label>GitHub URL</label><input type="url" id="proj_github_${i}" value="${esc(p.github_url || '')}"/></div>
        <div class="form-group"><label>Live URL</label><input type="url" id="proj_live_${i}" value="${esc(p.live_url || '')}"/></div>
        <div class="form-group full">
          <label>Technologies (press Enter to add)</label>
          <div class="tags-input" id="techTags_${i}">
            ${(p.tech || []).map(t => `<span class="tag">${esc(t)}<span class="tag-remove" onclick="removeTag(${i},'${esc(t)}')">&times;</span></span>`).join('')}
            <input class="tag-input-field" placeholder="Add tech..." onkeydown="addTag(event, ${i})"/>
          </div>
        </div>
      </div>
      <button class="btn btn-outline btn-sm" onclick="saveProject(${i})" style="margin-top:12px"><i class="fas fa-check"></i> Apply Changes</button>
    </div>
  `;
}

function saveProject(i) {
  const p = currentData.projects[i];
  p.title       = val(`proj_title_${i}`);
  p.description = val(`proj_desc_${i}`);
  p.start_date  = val(`proj_start_${i}`);
  p.end_date    = val(`proj_end_${i}`);
  p.github_url  = val(`proj_github_${i}`);
  p.live_url    = val(`proj_live_${i}`);
  showToast('Project updated. Save & Deploy when ready.', 'info');
}

function addProject() {
  currentData.projects.unshift({
    id: Date.now(), title: 'New Project', description: '',
    tech: [], start_date: '', end_date: '', github_url: '', live_url: '', image: ''
  });
  renderProjectsSection();
}

function removeProject(i) {
  if (!confirm('Remove this project?')) return;
  currentData.projects.splice(i, 1);
  renderProjectsSection();
}

function addTag(e, i) {
  if (e.key !== 'Enter' && e.key !== ',') return;
  e.preventDefault();
  const input = e.target;
  const val = input.value.trim();
  if (!val) return;
  if (!currentData.projects[i].tech) currentData.projects[i].tech = [];
  currentData.projects[i].tech.push(val);
  input.value = '';
  renderProjectsSection();
}

function removeTag(i, tag) {
  currentData.projects[i].tech = currentData.projects[i].tech.filter(t => t !== tag);
  renderProjectsSection();
}

/* ===== CERTIFICATIONS ===== */
function renderCertsSection() {
  const c = document.getElementById('adminContent');
  c.innerHTML = `
    <div class="panel-header">
      <h2>Certifications</h2>
      <p>Add your professional certifications.</p>
    </div>
    <div id="certsList">
      ${currentData.certifications.map((cert, i) => buildCertCard(cert, i)).join('')}
    </div>
    <button class="add-btn" onclick="addCert()"><i class="fas fa-plus"></i> Add Certification</button>
  `;
}

function buildCertCard(cert, i) {
  return `
    <div class="list-item">
      <div class="list-item-header">
        <div>
          <div class="list-item-title">${esc(cert.name)}</div>
          <div class="list-item-subtitle">${esc(cert.issuer)} · ${cert.date}</div>
        </div>
        <button class="icon-btn-sm danger" onclick="removeCert(${i})"><i class="fas fa-trash"></i></button>
      </div>
      <div class="form-grid">
        <div class="form-group full"><label>Certification Name</label><input type="text" id="cert_name_${i}" value="${esc(cert.name)}"/></div>
        <div class="form-group"><label>Issuer</label><input type="text" id="cert_issuer_${i}" value="${esc(cert.issuer)}"/></div>
        <div class="form-group"><label>Date</label><input type="month" id="cert_date_${i}" value="${cert.date}"/></div>
        <div class="form-group"><label>Credential ID</label><input type="text" id="cert_id_${i}" value="${esc(cert.credential_id || '')}"/></div>
        <div class="form-group"><label>Credential URL</label><input type="url" id="cert_url_${i}" value="${esc(cert.credential_url || '')}"/></div>
      </div>
      <button class="btn btn-outline btn-sm" onclick="saveCert(${i})" style="margin-top:12px"><i class="fas fa-check"></i> Apply Changes</button>
    </div>
  `;
}

function saveCert(i) {
  const c = currentData.certifications[i];
  c.name          = val(`cert_name_${i}`);
  c.issuer        = val(`cert_issuer_${i}`);
  c.date          = val(`cert_date_${i}`);
  c.credential_id = val(`cert_id_${i}`);
  c.credential_url= val(`cert_url_${i}`);
  showToast('Certification updated.', 'info');
}

function addCert() {
  currentData.certifications.push({ id: Date.now(), name: 'New Certification', issuer: '', date: '', credential_id: '', credential_url: '', icon: 'default' });
  renderCertsSection();
}

function removeCert(i) {
  if (!confirm('Remove this certification?')) return;
  currentData.certifications.splice(i, 1);
  renderCertsSection();
}

/* ===== EDUCATION ===== */
function renderEducationSection() {
  const c = document.getElementById('adminContent');
  c.innerHTML = `
    <div class="panel-header">
      <h2>Education</h2>
      <p>Your academic background.</p>
    </div>
    <div id="eduList">
      ${currentData.education.map((e, i) => buildEduCard(e, i)).join('')}
    </div>
    <button class="add-btn" onclick="addEducation()"><i class="fas fa-plus"></i> Add Education</button>
  `;
}

function buildEduCard(e, i) {
  return `
    <div class="list-item">
      <div class="list-item-header">
        <div>
          <div class="list-item-title">${esc(e.degree)}</div>
          <div class="list-item-subtitle">${esc(e.institution)}</div>
        </div>
        <button class="icon-btn-sm danger" onclick="removeEducation(${i})"><i class="fas fa-trash"></i></button>
      </div>
      <div class="form-grid">
        <div class="form-group"><label>Degree</label><input type="text" id="edu_degree_${i}" value="${esc(e.degree)}"/></div>
        <div class="form-group"><label>Field of Study</label><input type="text" id="edu_field_${i}" value="${esc(e.field)}"/></div>
        <div class="form-group full"><label>Institution</label><input type="text" id="edu_inst_${i}" value="${esc(e.institution)}"/></div>
        <div class="form-group"><label>Location</label><input type="text" id="edu_loc_${i}" value="${esc(e.location)}"/></div>
        <div class="form-group"><label>Grade / GPA</label><input type="text" id="edu_grade_${i}" value="${esc(e.grade || '')}"/></div>
        <div class="form-group"><label>Start Year</label><input type="text" id="edu_start_${i}" value="${esc(e.start_year)}"/></div>
        <div class="form-group"><label>End Year</label><input type="text" id="edu_end_${i}" value="${esc(e.end_year)}"/></div>
      </div>
      <button class="btn btn-outline btn-sm" onclick="saveEducation(${i})" style="margin-top:12px"><i class="fas fa-check"></i> Apply Changes</button>
    </div>
  `;
}

function saveEducation(i) {
  const e = currentData.education[i];
  e.degree      = val(`edu_degree_${i}`);
  e.field       = val(`edu_field_${i}`);
  e.institution = val(`edu_inst_${i}`);
  e.location    = val(`edu_loc_${i}`);
  e.grade       = val(`edu_grade_${i}`);
  e.start_year  = val(`edu_start_${i}`);
  e.end_year    = val(`edu_end_${i}`);
  showToast('Education updated.', 'info');
}

function addEducation() {
  currentData.education.push({ id: Date.now(), degree: '', field: '', institution: '', location: '', start_year: '', end_year: '', grade: '' });
  renderEducationSection();
}

function removeEducation(i) {
  if (!confirm('Remove this education entry?')) return;
  currentData.education.splice(i, 1);
  renderEducationSection();
}

/* ===== BLOG ===== */
function renderBlogSection() {
  if (!currentData.blog) currentData.blog = [];
  const c = document.getElementById('adminContent');
  c.innerHTML = `
    <div class="panel-header">
      <h2>Blog Posts</h2>
      <p>Add, edit or remove your personal blog posts.</p>
    </div>
    <div id="blogList">
      ${currentData.blog.map((post, i) => buildBlogCard(post, i)).join('')}
    </div>
    <button class="add-btn" onclick="addBlogPost()"><i class="fas fa-plus"></i> Add Blog Post</button>
  `;
}

function buildBlogCard(post, i) {
  const tags = (post.tags || []).join(', ');
  return `
    <div class="list-item" id="blogCard_${i}">
      <div class="list-item-header">
        <div>
          <div class="list-item-title">${esc(post.title)}</div>
          <div class="list-item-subtitle">${post.date || ''} ${post.read_time ? '· ' + esc(post.read_time) : ''}</div>
        </div>
        <button class="icon-btn-sm danger" onclick="removeBlogPost(${i})"><i class="fas fa-trash"></i></button>
      </div>
      <div class="form-grid">
        <div class="form-group full"><label>Title</label><input type="text" id="blog_title_${i}" value="${esc(post.title)}"/></div>
        <div class="form-group full"><label>Excerpt / Summary</label><textarea id="blog_excerpt_${i}" rows="3">${esc(post.excerpt)}</textarea></div>
        <div class="form-group"><label>Date</label><input type="date" id="blog_date_${i}" value="${post.date || ''}"/></div>
        <div class="form-group"><label>Read Time (e.g. 5 min read)</label><input type="text" id="blog_readtime_${i}" value="${esc(post.read_time || '')}"/></div>
        <div class="form-group full"><label>Blog Post URL (Medium, Dev.to, Hashnode, etc.)</label><input type="url" id="blog_url_${i}" value="${esc(post.url || '')}" placeholder="https://medium.com/@you/your-post"/></div>
        <div class="form-group full"><label>Tags (comma-separated)</label><input type="text" id="blog_tags_${i}" value="${esc(tags)}" placeholder="Kubernetes, DevOps, Azure"/></div>
      </div>
      <button class="btn btn-outline btn-sm" onclick="saveBlogPost(${i})" style="margin-top:12px"><i class="fas fa-check"></i> Apply Changes</button>
    </div>
  `;
}

function saveBlogPost(i) {
  const post = currentData.blog[i];
  post.title     = val(`blog_title_${i}`);
  post.excerpt   = val(`blog_excerpt_${i}`);
  post.date      = val(`blog_date_${i}`);
  post.read_time = val(`blog_readtime_${i}`);
  post.url       = val(`blog_url_${i}`);
  post.tags      = val(`blog_tags_${i}`).split(',').map(t => t.trim()).filter(Boolean);
  showToast('Blog post updated. Save & Deploy when ready.', 'info');
}

function addBlogPost() {
  if (!currentData.blog) currentData.blog = [];
  currentData.blog.unshift({
    id: Date.now(), title: 'New Blog Post', excerpt: '',
    date: new Date().toISOString().split('T')[0],
    read_time: '5 min read', tags: [], url: ''
  });
  renderBlogSection();
  showToast('New blog post added. Fill in the details.', 'info');
}

function removeBlogPost(i) {
  if (!confirm('Remove this blog post?')) return;
  currentData.blog.splice(i, 1);
  renderBlogSection();
}

/* ===== STATS ===== */
function renderStatsSection() {
  const s = currentData.stats;
  const c = document.getElementById('adminContent');
  c.innerHTML = `
    <div class="panel-header">
      <h2>Stats & Numbers</h2>
      <p>The headline numbers shown in your About section.</p>
    </div>
    <div class="edit-card">
      <div class="form-grid">
        <div class="form-group">
          <label>Years of Experience</label>
          <input type="number" id="s_years" value="${s.years_experience}"/>
        </div>
        <div class="form-group">
          <label>Projects Completed</label>
          <input type="number" id="s_projects" value="${s.projects_completed}"/>
        </div>
        <div class="form-group">
          <label>Certifications Count</label>
          <input type="number" id="s_certs" value="${s.certifications}"/>
        </div>
        <div class="form-group">
          <label>Cloud Platforms</label>
          <input type="number" id="s_clouds" value="${s.clouds_managed}"/>
        </div>
      </div>
    </div>
  `;
}

function collectStats() {
  if (!currentData) return;
  currentData.stats.years_experience  = parseInt(val('s_years'))   || currentData.stats.years_experience;
  currentData.stats.projects_completed= parseInt(val('s_projects')) || currentData.stats.projects_completed;
  currentData.stats.certifications    = parseInt(val('s_certs'))    || currentData.stats.certifications;
  currentData.stats.clouds_managed    = parseInt(val('s_clouds'))   || currentData.stats.clouds_managed;
}

/* ===== UTILS ===== */
function val(id) {
  const el = document.getElementById(id);
  return el ? el.value : '';
}

function esc(str) {
  if (!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function getInitials(name) {
  if (!name) return 'NG';
  return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
}

function togglePassword(id) {
  const el = document.getElementById(id);
  el.type = el.type === 'password' ? 'text' : 'password';
}

function showToast(message, type = 'info') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = `toast ${type} show`;
  setTimeout(() => { toast.className = 'toast'; }, 3500);
}
