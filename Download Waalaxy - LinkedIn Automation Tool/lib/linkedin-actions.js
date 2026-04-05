/**
 * Waalaxy LinkedIn Automation Tool — LinkedIn Actions
 * Performs human-like interactions on LinkedIn pages.
 * Random delays, mouse offsets, per-character typing to avoid detection.
 */

const LinkedInActions = {
  /**
   * Execute a queued automation action
   */
  async execute(action) {
    const type = action.type || action.actionType;
    switch (type) {
      case 'visit': return this.visitProfile(action.profileUrl || action.url);
      case 'connect': return this.sendConnectionRequest(action.profileUrl || action.url, action.note);
      case 'message': return this.sendMessage(action.profileUrl || action.url, action.message);
      case 'follow': return this.followProfile();
      case 'endorse': return this.endorseSkills();
      case 'withdraw': return this.withdrawConnection();
      case 'like': return this.likePost(action.postSelector);
      case 'comment': return this.commentOnPost(action.comment, action.postSelector);
      case 'view': return this.viewProfile();
      default: throw new Error(`Unknown action type: ${type}`);
    }
  },

  // ─── Human-Like Helpers ─────────────────────

  async _humanClick(element) {
    if (!element) throw new Error('Element not found for click');
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    await this._sleep(300 + Math.random() * 500);
    
    const rect = element.getBoundingClientRect();
    const x = rect.left + rect.width * (0.3 + Math.random() * 0.4);
    const y = rect.top + rect.height * (0.3 + Math.random() * 0.4);

    element.dispatchEvent(new MouseEvent('mouseover', { bubbles: true, clientX: x, clientY: y }));
    await this._sleep(100 + Math.random() * 200);
    element.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, clientX: x, clientY: y }));
    await this._sleep(50 + Math.random() * 100);
    element.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, clientX: x, clientY: y }));
    element.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: x, clientY: y }));
    element.click();
    await this._sleep(200 + Math.random() * 300);
  },

  async _humanType(element, text) {
    if (!element) throw new Error('Element not found for typing');
    element.focus();
    await this._sleep(200 + Math.random() * 300);

    // Clear existing content
    if (element.getAttribute('contenteditable') === 'true') {
      element.innerHTML = '';
    } else {
      element.value = '';
    }

    for (const char of text) {
      const keyDelay = 30 + Math.random() * 80;
      element.dispatchEvent(new KeyboardEvent('keydown', { key: char, bubbles: true }));
      
      if (element.getAttribute('contenteditable') === 'true') {
        element.textContent += char;
      } else {
        element.value += char;
      }

      element.dispatchEvent(new InputEvent('input', { data: char, inputType: 'insertText', bubbles: true }));
      element.dispatchEvent(new KeyboardEvent('keyup', { key: char, bubbles: true }));
      await this._sleep(keyDelay);

      // Random pause for thinking
      if (Math.random() < 0.05) {
        await this._sleep(300 + Math.random() * 700);
      }
    }
  },

  async _sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
  },

  _querySelector(selectors) {
    for (const sel of (Array.isArray(selectors) ? selectors : [selectors])) {
      try {
        const el = document.querySelector(sel);
        if (el) return el;
      } catch (e) { /* skip */ }
    }
    return null;
  },

  // ─── Actions ─────────────────────────────────

  async visitProfile(url) {
    if (url && !window.location.href.includes(url.split('?')[0])) {
      window.location.href = url;
      await this._sleep(3000 + Math.random() * 3000);
    }

    // Natural scrolling
    const totalScroll = document.body.scrollHeight * 0.6;
    const steps = 5 + Math.floor(Math.random() * 5);
    for (let i = 0; i < steps; i++) {
      window.scrollBy({ top: totalScroll / steps, behavior: 'smooth' });
      await this._sleep(500 + Math.random() * 1500);
    }

    await this._sleep(1000 + Math.random() * 2000);
    return { success: true, action: 'visit' };
  },

  async viewProfile() {
    return this.visitProfile(null);
  },

  async sendConnectionRequest(url, note) {
    // Navigate if needed
    if (url && !window.location.href.includes(url.split('?')[0])) {
      window.location.href = url;
      await this._sleep(3000 + Math.random() * 2000);
    }

    // Find Connect button
    const connectBtn = this._querySelector([
      'button.pvs-profile-actions__action[aria-label*="Connect"]',
      'button[aria-label*="Connect"]',
      '.pv-top-card-v2-ctas button[aria-label*="Connect"]',
      'button.artdeco-button--primary:not([aria-label*="Follow"]):not([aria-label*="Message"])'
    ]);

    if (!connectBtn) {
      // Try "More" dropdown
      const moreBtn = this._querySelector([
        'button[aria-label="More actions"]',
        'button.artdeco-dropdown__trigger'
      ]);
      if (moreBtn) {
        await this._humanClick(moreBtn);
        await this._sleep(500 + Math.random() * 500);
        const connectItem = this._querySelector([
          'div[aria-label*="Connect"] span',
          '.artdeco-dropdown__item:has(span:contains("Connect"))',
          'li.artdeco-dropdown__item button'
        ]);
        if (connectItem) {
          await this._humanClick(connectItem);
          await this._sleep(500);
        } else {
          return { success: false, error: 'Connect option not found in dropdown' };
        }
      } else {
        return { success: false, error: 'Connect button not found' };
      }
    } else {
      await this._humanClick(connectBtn);
    }

    await this._sleep(1000 + Math.random() * 1000);

    // Add note if provided
    if (note) {
      const addNoteBtn = this._querySelector([
        'button[aria-label="Add a note"]',
        'button.artdeco-button--secondary:has(span:contains("Add a note"))',
        'button:has(span:contains("Add a note"))'
      ]);

      if (addNoteBtn) {
        await this._humanClick(addNoteBtn);
        await this._sleep(500 + Math.random() * 500);

        const noteField = this._querySelector([
          'textarea[name="message"]',
          'textarea#custom-message',
          '.connect-button-send-invite__custom-message textarea',
          'textarea.artdeco-text-input--input'
        ]);

        if (noteField) {
          const truncatedNote = note.substring(0, 300);
          await this._humanType(noteField, truncatedNote);
          await this._sleep(300);
        }
      }
    }

    // Click send
    const sendBtn = this._querySelector([
      'button[aria-label="Send invitation"]',
      'button[aria-label="Send now"]',
      'button.artdeco-button--primary:has(span:contains("Send"))',
      'button.ml1'
    ]);

    if (sendBtn) {
      await this._humanClick(sendBtn);
      await this._sleep(500);
      return { success: true, action: 'connect' };
    }

    return { success: false, error: 'Send button not found' };
  },

  async sendMessage(url, message) {
    if (!message) return { success: false, error: 'No message provided' };

    if (url && !window.location.href.includes(url.split('?')[0])) {
      window.location.href = url;
      await this._sleep(3000 + Math.random() * 2000);
    }

    // Click Message button
    const msgBtn = this._querySelector([
      'button[aria-label*="Message"]',
      'a.message-anywhere-button',
      '.pv-top-card-v2-ctas button:has(span:contains("Message"))',
      'button.pvs-profile-actions__action:has(span:contains("Message"))'
    ]);

    if (!msgBtn) return { success: false, error: 'Message button not found' };

    await this._humanClick(msgBtn);
    await this._sleep(1500 + Math.random() * 1500);

    // Type message
    const msgInput = this._querySelector([
      '.msg-form__contenteditable[contenteditable="true"]',
      'div[aria-label="Write a message…"]',
      'div[role="textbox"][contenteditable="true"]',
      '.msg-form__msg-content-container div[contenteditable="true"]'
    ]);

    if (!msgInput) return { success: false, error: 'Message input not found' };

    await this._humanType(msgInput, message);
    await this._sleep(500 + Math.random() * 500);

    // Click send
    const sendBtn = this._querySelector([
      'button.msg-form__send-button',
      'button[type="submit"][aria-label*="Send"]',
      'button.msg-form__send-btn'
    ]);

    if (sendBtn) {
      await this._humanClick(sendBtn);
      await this._sleep(500);
      return { success: true, action: 'message' };
    }

    return { success: false, error: 'Send button not found' };
  },

  async followProfile() {
    const followBtn = this._querySelector([
      'button[aria-label*="Follow"]',
      'button:has(span:contains("Follow"))',
      '.follow-button'
    ]);

    if (!followBtn) return { success: false, error: 'Follow button not found' };

    await this._humanClick(followBtn);
    return { success: true, action: 'follow' };
  },

  async endorseSkills() {
    const endorseBtns = document.querySelectorAll(
      'button.artdeco-button--secondary[aria-label*="Endorse"], ' +
      '.pv-skill-entity__featured-endorse-button-shared'
    );

    if (endorseBtns.length === 0) return { success: false, error: 'No endorsement buttons found' };

    // Endorse top 3 skills
    let endorsed = 0;
    for (let i = 0; i < Math.min(3, endorseBtns.length); i++) {
      try {
        await this._humanClick(endorseBtns[i]);
        endorsed++;
        await this._sleep(800 + Math.random() * 1200);
      } catch (e) { /* skip */ }
    }

    return { success: endorsed > 0, action: 'endorse', count: endorsed };
  },

  async withdrawConnection() {
    const moreBtn = this._querySelector([
      'button[aria-label="More actions"]',
      'button.artdeco-dropdown__trigger'
    ]);

    if (!moreBtn) return { success: false, error: 'More button not found' };

    await this._humanClick(moreBtn);
    await this._sleep(500);

    const withdrawItem = this._querySelector([
      'div[aria-label*="Remove connection"]',
      'li.artdeco-dropdown__item:has(span:contains("Remove"))'
    ]);

    if (!withdrawItem) return { success: false, error: 'Withdraw option not found' };

    await this._humanClick(withdrawItem);
    await this._sleep(500);

    const confirmBtn = this._querySelector([
      'button[data-test-dialog-primary-btn]',
      'button.artdeco-button--primary:has(span:contains("Remove"))'
    ]);

    if (confirmBtn) {
      await this._humanClick(confirmBtn);
      return { success: true, action: 'withdraw' };
    }

    return { success: false, error: 'Confirm button not found' };
  },

  async likePost(postSelector) {
    const likeBtn = postSelector
      ? document.querySelector(`${postSelector} button[aria-label*="Like"]`)
      : this._querySelector([
          'button[aria-label*="Like"][aria-pressed="false"]',
          '.feed-shared-social-action-bar button:first-child'
        ]);

    if (!likeBtn) return { success: false, error: 'Like button not found' };

    await this._humanClick(likeBtn);
    return { success: true, action: 'like' };
  },

  async commentOnPost(comment, postSelector) {
    if (!comment) return { success: false, error: 'No comment provided' };

    const commentBtn = postSelector
      ? document.querySelector(`${postSelector} button[aria-label*="Comment"]`)
      : this._querySelector([
          'button[aria-label*="Comment"]',
          '.feed-shared-social-action-bar button:nth-child(2)'
        ]);

    if (!commentBtn) return { success: false, error: 'Comment button not found' };

    await this._humanClick(commentBtn);
    await this._sleep(1000 + Math.random() * 1000);

    const commentInput = this._querySelector([
      '.comments-comment-box__form div[contenteditable="true"]',
      'div[data-placeholder="Add a comment…"]',
      '.ql-editor[contenteditable="true"]'
    ]);

    if (!commentInput) return { success: false, error: 'Comment input not found' };

    await this._humanType(commentInput, comment);
    await this._sleep(500);

    const postBtn = this._querySelector([
      'button.comments-comment-box__submit-button',
      'button[aria-label="Post comment"]',
      'button[data-control-name="comment_submit"]'
    ]);

    if (postBtn) {
      await this._humanClick(postBtn);
      return { success: true, action: 'comment' };
    }

    return { success: false, error: 'Post comment button not found' };
  },

  /**
   * Scrape search results for bulk import
   */
  scrapeSearchResults() {
    return (typeof ProfileScraper !== 'undefined')
      ? ProfileScraper.extractSearchResults()
      : [];
  }
};

if (typeof window !== 'undefined') window.LinkedInActions = LinkedInActions;
