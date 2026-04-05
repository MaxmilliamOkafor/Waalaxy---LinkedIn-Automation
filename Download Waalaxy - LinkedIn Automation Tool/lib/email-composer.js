/**
 * Waalaxy LinkedIn Automation Tool — Email Composer
 * Handles opening compose windows in Gmail, Outlook, or default mail client
 * with pre-filled recipient, subject, and body.
 */

const EmailComposer = {
  /**
   * Open Gmail compose with pre-filled fields
   */
  composeGmail({ to, subject = '', body = '', cc = '', bcc = '' }) {
    const params = new URLSearchParams();
    if (to) params.set('to', to);
    if (cc) params.set('cc', cc);
    if (bcc) params.set('bcc', bcc);
    if (subject) params.set('su', subject);
    if (body) params.set('body', body);
    
    const url = `https://mail.google.com/mail/?view=cm&${params.toString()}`;
    window.open(url, '_blank');
    return { success: true, service: 'gmail', url };
  },

  /**
   * Open Outlook Web compose
   */
  composeOutlook({ to, subject = '', body = '' }) {
    const params = new URLSearchParams();
    if (to) params.set('to', to);
    if (subject) params.set('subject', subject);
    if (body) params.set('body', body);
    
    const url = `https://outlook.live.com/mail/0/deeplink/compose?${params.toString()}`;
    window.open(url, '_blank');
    return { success: true, service: 'outlook', url };
  },

  /**
   * Open Outlook 365 (work) compose
   */
  composeOutlook365({ to, subject = '', body = '' }) {
    const params = new URLSearchParams();
    if (to) params.set('to', to);
    if (subject) params.set('subject', subject);
    if (body) params.set('body', body);

    const url = `https://outlook.office.com/mail/deeplink/compose?${params.toString()}`;
    window.open(url, '_blank');
    return { success: true, service: 'outlook365', url };
  },

  /**
   * Open Yahoo Mail compose
   */
  composeYahoo({ to, subject = '', body = '' }) {
    const url = `https://compose.mail.yahoo.com/?to=${encodeURIComponent(to || '')}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(url, '_blank');
    return { success: true, service: 'yahoo', url };
  },

  /**
   * Open default mail client via mailto:
   */
  composeMailto({ to, subject = '', body = '', cc = '', bcc = '' }) {
    let mailto = `mailto:${to || ''}?`;
    const params = [];
    if (subject) params.push(`subject=${encodeURIComponent(subject)}`);
    if (body) params.push(`body=${encodeURIComponent(body)}`);
    if (cc) params.push(`cc=${encodeURIComponent(cc)}`);
    if (bcc) params.push(`bcc=${encodeURIComponent(bcc)}`);
    mailto += params.join('&');

    window.open(mailto, '_self');
    return { success: true, service: 'mailto', url: mailto };
  },

  /**
   * Compose via any supported service
   */
  compose(service, options) {
    switch (service) {
      case 'gmail': return this.composeGmail(options);
      case 'outlook': return this.composeOutlook(options);
      case 'outlook365': return this.composeOutlook365(options);
      case 'yahoo': return this.composeYahoo(options);
      case 'mailto':
      default: return this.composeMailto(options);
    }
  },

  /**
   * Get available email services
   */
  getServices() {
    return [
      { id: 'gmail', name: 'Gmail', icon: '📧', color: '#EA4335' },
      { id: 'outlook', name: 'Outlook', icon: '📬', color: '#0078D4' },
      { id: 'outlook365', name: 'Outlook 365', icon: '💼', color: '#0078D4' },
      { id: 'yahoo', name: 'Yahoo Mail', icon: '📨', color: '#6001D2' },
      { id: 'mailto', name: 'Default Email', icon: '✉️', color: '#666' }
    ];
  },

  /**
   * Format an email draft as a string for copying
   */
  formatDraft({ to, subject, body, cc, bcc }) {
    let formatted = '';
    if (to) formatted += `To: ${to}\n`;
    if (cc) formatted += `Cc: ${cc}\n`;
    if (bcc) formatted += `Bcc: ${bcc}\n`;
    if (subject) formatted += `Subject: ${subject}\n`;
    formatted += `\n${body || ''}`;
    return formatted;
  },

  /**
   * Build a phone call link
   */
  buildCallLink(phone) {
    return `tel:${phone.replace(/[^\d+]/g, '')}`;
  },

  /**
   * Open phone dialer
   */
  callPhone(phone) {
    const link = this.buildCallLink(phone);
    window.open(link, '_self');
    return { success: true, phone, link };
  }
};

if (typeof self !== 'undefined') self.EmailComposer = EmailComposer;
if (typeof window !== 'undefined') window.EmailComposer = EmailComposer;
