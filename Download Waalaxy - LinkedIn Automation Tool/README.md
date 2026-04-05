# 🚀 Waalaxy — LinkedIn Automation Tool

**Unlimited LinkedIn automation — AI-powered outreach, contact discovery, multi-step campaigns, CRM pipeline, recruiter quick-contact, and email drafting. Zero limitations.**

> The most powerful LinkedIn networking tool. Open source. No subscriptions. No tokens. No coins.

---

## ✨ Features

### 🎯 Core Automation
- **Unlimited outreach** — No daily quotas, coins, or subscription gates
- **Human-like interactions** — Random delays, mouse offsets, per-character typing
- **Multi-step campaigns** — 8 pre-built sequence templates (Visit → Connect → Message → Email)
- **Priority queue engine** — Configurable daily safety limits

### 📧 Enhanced Contact Discovery
- **Real-time email/phone extraction** — Scrapes visible contact info from LinkedIn profiles
- **Pattern-based email generation** — 12 work email patterns + 5 personal email patterns
- **150+ company domain database** — Instant domain resolution for major companies
- **Confidence scoring** — Every email rated by discovery confidence
- **Work vs. Personal separation** — Clearly tagged email types

### 💼 Recruiter Quick-Contact Panel
- **Floating contact button** on LinkedIn job pages
- **One-click email compose** — Opens Gmail/Outlook with pre-filled tailored message
- **Work & personal email** for recruiters
- **LinkedIn message** direct link
- **Phone call** link
- **Copy all contact info** in one click

### 🤖 AI Email Engine (Auto Gmail-inspired)
- **12 built-in templates** — Cold outreach, job application, follow-up, referral request, alumni connection, and more
- **6 tone presets** — Professional, Casual, Enthusiastic, Concise, Empathetic, Confident
- **OpenAI GPT integration** — Context-aware drafting using your own API key
- **Smart template fallback** — Works perfectly without an API key
- **Subject line generation** — AI-powered or template-based
- **LinkedIn message drafting** — Short messages and connection notes (300 char limit)

### 📤 Email Composer
- **Gmail** — One-click compose with pre-filled fields
- **Outlook** — Personal and Outlook 365 (work) support
- **Yahoo Mail** support
- **Default email client** (mailto:)
- **Copy draft** — Formatted for any email client

### 📋 CRM Pipeline
- **7-stage pipeline** — New → Contacted → Connected → Replied → Meeting → Won → Lost
- **Tags & Notes** — Organize leads with custom tags and notes
- **Activity timeline** — Full action history per lead
- **Auto-advancement** — Leads auto-move when actions complete
- **Bulk operations** — Tag and move multiple leads at once

### 📢 Campaign Manager
- **Campaign lifecycle** — Draft → Active → Paused → Completed
- **CSV import** — Import leads from any spreadsheet
- **Search import** — Import directly from LinkedIn search results
- **Analytics** — Response rate, sent count, completion tracking
- **Progress bars** — Visual campaign progress

### 🎨 Premium Sidebar UI
- **Dark glassmorphism** theme with gradient accents
- **6-tab layout** — Dashboard, Campaigns, Pipeline, Contacts, Outreach, Email
- **Real-time stats** — Leads, campaigns, response rate, daily counters
- **Settings panel** — Profile, AI config, automation limits

---

## 🛠 Installation

### Option 1: Download the packaged extension (Recommended)

1. **Download** the `Download Waalaxy - LinkedIn Automation Tool.zip` file from this repository

2. **Unzip** the file to a folder on your computer

3. **Open Chrome** and navigate to `chrome://extensions/`

4. **Enable Developer Mode** (toggle in top-right corner)

5. **Click "Load unpacked"** and select the unzipped folder

6. **Pin the extension** — Click the puzzle piece icon in Chrome toolbar and pin Waalaxy

7. **Navigate to LinkedIn** — The extension activates automatically

### Option 2: Clone from source

1. **Clone this repository:**
   ```bash
   git clone https://github.com/MaxmilliamOkafor/Waalaxy---LinkedIn-Automation-Tool.git
   ```

2. **Open Chrome** and navigate to `chrome://extensions/`

3. **Enable Developer Mode** (toggle in top-right corner)

4. **Click "Load unpacked"** and select the cloned directory

5. **Pin the extension** — Click the puzzle piece icon in Chrome toolbar and pin Waalaxy

6. **Navigate to LinkedIn** — The extension activates automatically

---

## 📁 Project Structure

```
Waalaxy---LinkedIn-Automation-Tool/
├── manifest.json           # Chrome MV3 manifest
├── background.js           # Service worker (40+ message types)
├── content.js              # Content script (overlays, panels, badge)
├── content.css             # Content script styles
├── sidebar.html            # Side panel UI
├── sidebar.css             # Premium dark theme
├── sidebar.js              # Sidebar controller
├── popup.html              # Extension popup
├── popup.css               # Popup styles
├── popup.js                # Popup controller
├── icons/                  # Extension icons (16, 32, 48, 128)
└── lib/
    ├── utils.js             # Shared utilities
    ├── storage-manager.js   # Chrome storage manager
    ├── profile-scraper.js   # LinkedIn page scraping
    ├── contact-finder.js    # Email/phone discovery
    ├── linkedin-actions.js  # Human-like LinkedIn interactions
    ├── automation-engine.js # Queue-based automation engine
    ├── sequence-runner.js   # Multi-step campaign sequences
    ├── crm-manager.js       # 7-stage CRM pipeline
    ├── campaign-manager.js  # Campaign lifecycle management
    ├── ai-email-engine.js   # AI drafting engine
    └── email-composer.js    # Email service integration
```

---

## ⚙️ Configuration

### AI Drafting (Optional)
1. Open sidebar → Settings (⚙️)
2. Enter your **OpenAI API Key** (sk-...)
3. Select model: GPT-4o Mini (fast) or GPT-4o (best)
4. Choose default tone and email service

> The AI engine works without an API key using smart template-based drafting.

### Your Profile
Fill in your name, title, company, email, phone, and LinkedIn URL in Settings. This information is used to personalize outreach messages.

### Safety Limits
Adjust daily limits for connections (default: 80), messages (default: 120), and visits (default: 150). These are safety measures to avoid LinkedIn restrictions — not artificial limitations.

---

## 🚀 Usage

### Quick Start
1. **Visit a LinkedIn profile** — Contact info overlay appears automatically
2. **Click the Waalaxy badge** — Opens the sidebar
3. **Save leads** — Click "Save Lead" or use the popup's Quick Save
4. **Draft messages** — Use the Outreach tab for AI-powered LinkedIn messages
5. **Compose emails** — Use the Email tab for full email drafting with one-click send

### Campaigns
1. **Create a campaign** → Name it → Select a sequence template → Add leads
2. **Launch** — The automation engine processes actions with human-like timing
3. **Monitor** — Watch progress in the dashboard and campaign cards

### Recruiter Contact (Job Pages)
1. **Visit any LinkedIn job page**
2. **Click the ✉️ Contact button** next to the recruiter's profile
3. **Choose your outreach method** — Work email, personal email, LinkedIn message, or phone

---

## 🔒 Privacy & Security

- **100% local execution** — No data leaves your browser
- **No external servers** — All processing runs in Chrome's extension sandbox
- **No tracking** — Zero analytics, telemetry, or data collection
- **Your API key stays local** — OpenAI key stored in chrome.storage.local only
- **Open source** — Audit the code yourself

---

## 📄 License

MIT License — Use freely, modify, and distribute.

---

**Built with ❤️ for LinkedIn power users who refuse to be limited.**
