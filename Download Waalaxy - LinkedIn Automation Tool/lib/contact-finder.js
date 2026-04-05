/**
 * Waalaxy LinkedIn Automation Tool — Enhanced Contact Finder
 * Multi-strategy email/phone discovery: LinkedIn scraping + pattern generation + confidence scoring.
 * Zero API limitations — everything runs locally.
 */

const ContactFinder = {
  /**
   * Common email patterns
   * {f} = first name, {l} = last name, {fi} = first initial, {li} = last initial
   */
  PATTERNS: [
    { pattern: '{f}.{l}@{d}',       label: 'first.last',       confidence: 0.90 },
    { pattern: '{f}{l}@{d}',         label: 'firstlast',        confidence: 0.75 },
    { pattern: '{fi}{l}@{d}',        label: 'flast',            confidence: 0.65 },
    { pattern: '{f}@{d}',            label: 'first',            confidence: 0.55 },
    { pattern: '{f}_{l}@{d}',        label: 'first_last',       confidence: 0.50 },
    { pattern: '{f}-{l}@{d}',        label: 'first-last',       confidence: 0.45 },
    { pattern: '{l}.{f}@{d}',        label: 'last.first',       confidence: 0.40 },
    { pattern: '{l}{f}@{d}',         label: 'lastfirst',        confidence: 0.35 },
    { pattern: '{fi}.{l}@{d}',       label: 'f.last',           confidence: 0.35 },
    { pattern: '{l}@{d}',            label: 'last',             confidence: 0.30 },
    { pattern: '{f}{li}@{d}',        label: 'firstl',           confidence: 0.30 },
    { pattern: '{fi}{li}@{d}',       label: 'fl',               confidence: 0.20 }
  ],

  /**
   * Personal email domain patterns for guessing personal emails
   */
  PERSONAL_PATTERNS: [
    { pattern: '{f}.{l}@gmail.com',       label: 'gmail first.last',    confidence: 0.25 },
    { pattern: '{f}{l}@gmail.com',         label: 'gmail firstlast',     confidence: 0.20 },
    { pattern: '{f}.{l}@outlook.com',      label: 'outlook first.last',  confidence: 0.15 },
    { pattern: '{f}{l}@yahoo.com',         label: 'yahoo firstlast',     confidence: 0.10 },
    { pattern: '{f}.{l}@hotmail.com',      label: 'hotmail first.last',  confidence: 0.10 }
  ],

  /**
   * Known company -> domain mapping (150+ companies)
   */
  KNOWN_DOMAINS: {
    'google': 'google.com', 'alphabet': 'google.com',
    'microsoft': 'microsoft.com', 'apple': 'apple.com',
    'amazon': 'amazon.com', 'aws': 'amazon.com',
    'meta': 'meta.com', 'facebook': 'meta.com',
    'netflix': 'netflix.com', 'salesforce': 'salesforce.com',
    'oracle': 'oracle.com', 'ibm': 'ibm.com',
    'tesla': 'tesla.com', 'uber': 'uber.com',
    'airbnb': 'airbnb.com', 'stripe': 'stripe.com',
    'shopify': 'shopify.com', 'spotify': 'spotify.com',
    'linkedin': 'linkedin.com', 'twitter': 'x.com',
    'snap': 'snap.com', 'snapchat': 'snap.com',
    'tiktok': 'tiktok.com', 'bytedance': 'bytedance.com',
    'adobe': 'adobe.com', 'intel': 'intel.com',
    'nvidia': 'nvidia.com', 'samsung': 'samsung.com',
    'dell': 'dell.com', 'hp': 'hp.com',
    'cisco': 'cisco.com', 'vmware': 'vmware.com',
    'slack': 'slack.com', 'zoom': 'zoom.us',
    'dropbox': 'dropbox.com', 'square': 'squareup.com',
    'paypal': 'paypal.com', 'deloitte': 'deloitte.com',
    'mckinsey': 'mckinsey.com', 'bcg': 'bcg.com',
    'bain': 'bain.com', 'accenture': 'accenture.com',
    'kpmg': 'kpmg.com', 'pwc': 'pwc.com', 'ey': 'ey.com',
    'goldman sachs': 'gs.com', 'jp morgan': 'jpmorgan.com',
    'jpmorgan': 'jpmorgan.com', 'morgan stanley': 'morganstanley.com',
    'bank of america': 'bofa.com', 'wells fargo': 'wellsfargo.com',
    'citigroup': 'citi.com', 'hsbc': 'hsbc.com',
    'barclays': 'barclays.com', 'ubs': 'ubs.com',
    'credit suisse': 'credit-suisse.com',
    'deutsche bank': 'db.com', 'bnp paribas': 'bnpparibas.com',
    'blackrock': 'blackrock.com', 'blackstone': 'blackstone.com',
    'citadel': 'citadel.com', 'bridgewater': 'bridgewater.com',
    'two sigma': 'twosigma.com', 'jane street': 'janestreet.com',
    'palantir': 'palantir.com', 'databricks': 'databricks.com',
    'snowflake': 'snowflake.com', 'cloudflare': 'cloudflare.com',
    'twilio': 'twilio.com', 'okta': 'okta.com',
    'crowdstrike': 'crowdstrike.com', 'palo alto networks': 'paloaltonetworks.com',
    'servicenow': 'servicenow.com', 'workday': 'workday.com',
    'atlassian': 'atlassian.com', 'figma': 'figma.com',
    'notion': 'makenotion.com', 'canva': 'canva.com',
    'coinbase': 'coinbase.com', 'robinhood': 'robinhood.com',
    'plaid': 'plaid.com', 'chime': 'chime.com',
    'openai': 'openai.com', 'anthropic': 'anthropic.com',
    'deepmind': 'deepmind.com', 'cohere': 'cohere.com',
    'hugging face': 'huggingface.co', 'stability ai': 'stability.ai',
    'mongodb': 'mongodb.com', 'elastic': 'elastic.co',
    'hashicorp': 'hashicorp.com', 'docker': 'docker.com',
    'github': 'github.com', 'gitlab': 'gitlab.com',
    'vercel': 'vercel.com', 'netlify': 'netlify.com',
    'supabase': 'supabase.com', 'postman': 'postman.com',
    'pinterest': 'pinterest.com', 'reddit': 'reddit.com',
    'discord': 'discord.com', 'bumble': 'bumble.com',
    'lyft': 'lyft.com', 'doordash': 'doordash.com',
    'instacart': 'instacart.com', 'grubhub': 'grubhub.com',
    'peloton': 'onepeloton.com', 'lululemon': 'lululemon.com',
    'nike': 'nike.com', 'adidas': 'adidas.com',
    'coca cola': 'coca-cola.com', 'pepsi': 'pepsico.com',
    'procter gamble': 'pg.com', 'p&g': 'pg.com',
    'johnson johnson': 'jnj.com', 'j&j': 'jnj.com',
    'pfizer': 'pfizer.com', 'moderna': 'modernatx.com',
    'boeing': 'boeing.com', 'lockheed martin': 'lmco.com',
    'spacex': 'spacex.com', 'northrop grumman': 'northropgrumman.com',
    'raytheon': 'rtx.com', 'general electric': 'ge.com',
    'siemens': 'siemens.com', 'philips': 'philips.com',
    'sony': 'sony.com', 'toyota': 'toyota.com',
    'bmw': 'bmw.com', 'mercedes': 'mercedes-benz.com',
    'volkswagen': 'volkswagen.com', 'ford': 'ford.com',
    'general motors': 'gm.com', 'stellantis': 'stellantis.com',
    'rivian': 'rivian.com', 'lucid': 'lucidmotors.com'
  },

  /**
   * Generate work email addresses for a contact
   */
  generateWorkEmails(firstName, lastName, company, companyUrl) {
    if (!firstName || !company) return [];

    const f = firstName.toLowerCase().replace(/[^a-z]/g, '');
    const l = (lastName || '').toLowerCase().replace(/[^a-z]/g, '');
    const fi = f.charAt(0);
    const li = l ? l.charAt(0) : '';
    const domain = this._resolveDomain(company, companyUrl);

    if (!domain || domain.includes('linkedin.com')) return [];

    return this.PATTERNS
      .filter(({ pattern }) => !(!l && pattern.includes('{l}')))
      .map(({ pattern, label, confidence }) => ({
        email: pattern
          .replace('{f}', f).replace('{l}', l)
          .replace('{fi}', fi).replace('{li}', li)
          .replace('{d}', domain),
        pattern: label,
        confidence: Math.round(confidence * 100),
        domain,
        type: 'work',
        source: 'pattern'
      }));
  },

  /**
   * Generate personal email guesses
   */
  generatePersonalEmails(firstName, lastName) {
    if (!firstName) return [];

    const f = firstName.toLowerCase().replace(/[^a-z]/g, '');
    const l = (lastName || '').toLowerCase().replace(/[^a-z]/g, '');
    const fi = f.charAt(0);
    const li = l ? l.charAt(0) : '';

    return this.PERSONAL_PATTERNS
      .filter(({ pattern }) => !(!l && pattern.includes('{l}')))
      .map(({ pattern, label, confidence }) => ({
        email: pattern
          .replace('{f}', f).replace('{l}', l)
          .replace('{fi}', fi).replace('{li}', li),
        pattern: label,
        confidence: Math.round(confidence * 100),
        type: 'personal',
        source: 'pattern'
      }));
  },

  /**
   * Resolve company name to domain
   */
  _resolveDomain(company, companyUrl) {
    const companyLower = company.toLowerCase().trim();

    // Check known companies
    for (const [name, domain] of Object.entries(this.KNOWN_DOMAINS)) {
      if (companyLower.includes(name)) return domain;
    }

    // Extract from LinkedIn company URL
    if (companyUrl && companyUrl.includes('linkedin.com/company/')) {
      const slug = companyUrl.split('/company/')[1]?.split(/[/?]/)[0] || '';
      if (slug) return slug.replace(/-/g, '') + '.com';
    }

    // Clean company name into domain guess
    return companyLower
      .replace(/\b(inc|llc|ltd|corp|co|group|holdings|international|solutions|technologies|technology|consulting|services|partners|associates|agency|labs?|studio|digital|global|enterprises)\b\.?/gi, '')
      .replace(/[^a-z0-9]/g, '')
      .trim() + '.com';
  },

  /**
   * Merge scraped emails with generated patterns, deduped and sorted by confidence
   */
  mergeContacts(scrapedEmails, workEmails, personalEmails) {
    const all = [];
    const seen = new Set();

    // Scraped emails get highest confidence (verified)
    (scrapedEmails || []).forEach(email => {
      const lower = (typeof email === 'string' ? email : email.email || '').toLowerCase();
      if (!seen.has(lower) && lower) {
        seen.add(lower);
        // Detect if personal or work
        const isPersonal = /gmail|yahoo|hotmail|outlook|icloud|proton|aol/i.test(lower);
        all.push({
          email: lower,
          pattern: 'verified',
          confidence: 100,
          type: isPersonal ? 'personal' : 'work',
          source: 'linkedin'
        });
      }
    });

    // Work emails
    (workEmails || []).forEach(entry => {
      if (!seen.has(entry.email)) {
        seen.add(entry.email);
        all.push(entry);
      }
    });

    // Personal emails
    (personalEmails || []).forEach(entry => {
      if (!seen.has(entry.email)) {
        seen.add(entry.email);
        all.push(entry);
      }
    });

    all.sort((a, b) => b.confidence - a.confidence);
    return all;
  },

  /**
   * Get all contact info for a profile — main entry point
   */
  findContacts(profileData) {
    const workEmails = this.generateWorkEmails(
      profileData.firstName,
      profileData.lastName,
      profileData.company,
      profileData.companyUrl
    );

    const personalEmails = this.generatePersonalEmails(
      profileData.firstName,
      profileData.lastName
    );

    const allEmails = this.mergeContacts(profileData.emails, workEmails, personalEmails);

    return {
      emails: allEmails,
      phones: (profileData.phones || []).map(p => ({
        phone: typeof p === 'string' ? p : p.phone,
        source: 'linkedin',
        confidence: 100
      })),
      websites: profileData.websites || [],
      workEmails: allEmails.filter(e => e.type === 'work'),
      personalEmails: allEmails.filter(e => e.type === 'personal'),
      verifiedEmails: allEmails.filter(e => e.source === 'linkedin'),
      topWorkEmail: allEmails.find(e => e.type === 'work') || null,
      topPersonalEmail: allEmails.find(e => e.type === 'personal') || null
    };
  },

  /**
   * Find recruiter contacts from a job listing
   */
  findRecruiterContacts(recruiterData, jobData) {
    if (!recruiterData || !recruiterData.name) return null;

    const nameParts = recruiterData.name.split(' ').filter(Boolean);
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';
    const company = jobData.company || '';
    const companyUrl = jobData.companyUrl || '';

    const workEmails = this.generateWorkEmails(firstName, lastName, company, companyUrl);
    const personalEmails = this.generatePersonalEmails(firstName, lastName);
    const allEmails = this.mergeContacts([], workEmails, personalEmails);

    return {
      name: recruiterData.name,
      title: recruiterData.title,
      linkedinUrl: recruiterData.linkedinUrl,
      profileImage: recruiterData.profileImage,
      emails: allEmails,
      workEmails: allEmails.filter(e => e.type === 'work'),
      personalEmails: allEmails.filter(e => e.type === 'personal'),
      topWorkEmail: allEmails.find(e => e.type === 'work') || null,
      topPersonalEmail: allEmails.find(e => e.type === 'personal') || null,
      phones: []
    };
  }
};

if (typeof window !== 'undefined') window.ContactFinder = ContactFinder;
