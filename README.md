# Navneet Gunda — Portfolio Website

A creative, interactive portfolio with a built-in admin panel to update all content without touching code.

---

## 🌐 Live URL (after deployment)

**`https://GundaNavneet.github.io/gundanavneet_portfilos/`**

---

## 🚀 One-Time Setup (10 minutes)

### Step 1 — Create GitHub Repository

1. Go to https://github.com/new
2. Repository name: `gundanavneet_portfilos`
3. Set to **Public**
4. Click **Create repository**

### Step 2 — Push this folder to GitHub

Open terminal in this folder and run:

```bash
git init
git add .
git commit -m "🚀 Initial portfolio setup"
git branch -M main
git remote add origin https://github.com/GundaNavneet/gundanavneet_portfilos.git
git push -u origin main
```

### Step 3 — Enable GitHub Pages

1. Go to your repo → **Settings** → **Pages**
2. Source: **Deploy from a branch**
3. Branch: `main` / `/ (root)`
4. Click **Save**

✅ Your site will be live at:
**`https://GundaNavneet.github.io/gundanavneet_portfilos/`**

(Takes ~1-2 minutes for first deployment)

---

## ✏️ Editing Your Portfolio

### Step 1 — Generate a GitHub Personal Access Token

1. Go to https://github.com/settings/tokens
2. Click **Generate new token (classic)**
3. Name: `Portfolio Admin`
4. Check scope: ✅ **repo**
5. Click **Generate token** — copy it (you won't see it again)

### Step 2 — Open the Admin Panel

Go to: `https://GundaNavneet.github.io/gundanavneet_portfilos/admin.html`

Or locally: open `admin.html` in your browser.

### Step 3 — Login & Edit

- Enter your GitHub token
- Edit any section: Basic Info, Picture, Experience, Skills, Projects, Certifications, Education
- Click **Save & Deploy**
- Site updates automatically in ~1 minute

---

## 📁 File Structure

```
gundanavneet_portfilos/
├── index.html          ← Main portfolio page
├── admin.html          ← Admin edit panel
├── data.json           ← All your content (edited via admin panel)
├── assets/
│   ├── css/
│   │   ├── style.css   ← Portfolio styles
│   │   └── admin.css   ← Admin panel styles
│   └── js/
│       ├── main.js     ← Portfolio logic
│       └── admin.js    ← Admin logic (GitHub API)
└── README.md
```

---

## 🔒 Security Note

- Your GitHub token is stored **only in your browser session** (sessionStorage)
- It is **never committed** to the repo
- Anyone can view your portfolio, but only you (with the token) can edit it

---

Built with ❤️ | Dark Glassmorphism Theme | GitHub Pages Hosted
