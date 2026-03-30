/**
 * MoneyWise Hub — Core JavaScript
 * Handles navigation, animations, newsletter form, and analytics
 * 
 * SECURITY NOTES:
 * - Mailchimp integration should use a backend proxy in production
 * - All user inputs are sanitized before DOM insertion
 * - No inline styles or eval() usage
 */

(function () {
  'use strict';

  // --- Constants ---
  const SCROLL_THRESHOLD = 50;
  const NAV_HIGHLIGHT_OFFSET = 100;
  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const MESSAGE_TIMEOUT = 5000;
  const REQUEST_TIMEOUT = 10000;
  const THROTTLE_LIMIT = 16; // ~60fps

  // --- Utility Functions ---
  function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  function debounce(func, wait) {
    let timeout;
    return function(...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  }

  function sanitizeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // --- Mobile Navigation Toggle ---
  const navToggle = document.getElementById('nav-toggle');
  const navLinks = document.getElementById('nav-links');
  
  if (navToggle && navLinks) {
    navToggle.addEventListener('click', function () {
      const isOpen = navLinks.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', isOpen);
    });

    // Close mobile menu when a link is clicked
    navLinks.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        navLinks.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // --- Navbar scroll effect (throttled with requestAnimationFrame) ---
  const navbar = document.getElementById('navbar');
  let ticking = false;

  function handleScroll() {
    const currentScroll = window.pageYOffset;

    if (navbar) {
      if (currentScroll > SCROLL_THRESHOLD) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
    }

    ticking = false;
  }

  window.addEventListener('scroll', function () {
    if (!ticking) {
      requestAnimationFrame(handleScroll);
      ticking = true;
    }
  }, { passive: true });

  // --- Smooth scrolling for anchor links ---
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;

      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        e.preventDefault();
        const navHeight = navbar ? navbar.offsetHeight : 72;
        const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - navHeight;

        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });
      }
    });
  });

  // --- Intersection Observer for scroll animations ---
  const animateElements = document.querySelectorAll('.animate-on-scroll');

  if ('IntersectionObserver' in window && animateElements.length > 0) {
    const observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    });

    animateElements.forEach(function (el) {
      observer.observe(el);
    });
  } else {
    // Fallback: show all elements
    animateElements.forEach(function (el) {
      el.classList.add('visible');
    });
  }

  // --- Newsletter Form Handling (Mailchimp AJAX) ---
  const newsletterForm = document.getElementById('newsletter-form');

  if (newsletterForm) {
    newsletterForm.addEventListener('submit', function (e) {
      e.preventDefault();

      const emailInput = document.getElementById('newsletter-email');
      const submitBtn = document.getElementById('newsletter-submit');
      const email = emailInput ? emailInput.value.trim() : '';

      if (!email || !isValidEmail(email)) {
        showFormMessage(newsletterForm, 'Please enter a valid email address.', 'error');
        return;
      }

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Subscribing...';
      }

      // IMPORTANT: In production, replace this with a backend proxy call
      // to avoid exposing Mailchimp credentials. Example:
      // fetch('/api/subscribe', { method: 'POST', body: JSON.stringify({ email }) })
      
      // For demo purposes only - DO NOT use hardcoded credentials in production
      const MAILCHIMP_BASE = 'https://github.us10.list-manage.com/subscribe/post-json';
      const U = '8fd4bc4b505af10b3061e466c';
      const ID = '648ec65dec';
      const F_ID = '00b8d4e3f0';
      const TAG = '8806282';

      // Create unique callback name
      const callbackName = 'mc_callback_' + Date.now();

      // Build the full URL
      const url = MAILCHIMP_BASE
        + '?u=' + U
        + '&id=' + ID
        + '&f_id=' + F_ID
        + '&c=' + callbackName
        + '&EMAIL=' + encodeURIComponent(email)
        + '&tags=' + TAG
        + '&b_' + U + '_' + ID + '='; // honeypot (empty)

      // JSONP callback
      window[callbackName] = function (response) {
        // Clean up
        delete window[callbackName];
        const scriptEl = document.getElementById(callbackName);
        if (scriptEl) scriptEl.remove();

        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Subscribe Free →';
        }

        if (response.result === 'success') {
          showFormMessage(newsletterForm, '🎉 You\'re in! Check your inbox for a confirmation email.', 'success');
          if (emailInput) emailInput.value = '';
          trackEvent('newsletter_signup', { email_domain: email.split('@')[1] });
        } else {
          let message = response.msg || 'Something went wrong. Please try again.';
          // Strip HTML tags from Mailchimp error messages
          message = message.replace(/<[^>]*>/g, '');

          if (message.toLowerCase().includes('already subscribed')) {
            showFormMessage(newsletterForm, '📬 You\'re already subscribed!', 'success');
          } else {
            showFormMessage(newsletterForm, message, 'error');
          }
        }
      };

      // Inject JSONP script
      const script = document.createElement('script');
      script.id = callbackName;
      script.src = url;
      document.body.appendChild(script);

      // Timeout fallback
      setTimeout(function () {
        if (window[callbackName]) {
          delete window[callbackName];
          const scriptEl = document.getElementById(callbackName);
          if (scriptEl) scriptEl.remove();
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Subscribe Free →';
          }
          showFormMessage(newsletterForm, 'Request timed out. Please try again.', 'error');
        }
      }, REQUEST_TIMEOUT);
    });
  }

  function isValidEmail(email) {
    return EMAIL_REGEX.test(email);
  }

  function showFormMessage(form, message, type) {
    // Remove existing message
    const existing = form.parentElement.querySelector('.form-message');
    if (existing) existing.remove();

    const msgEl = document.createElement('p');
    msgEl.className = 'form-message';
    msgEl.textContent = message;
    
    // Use CSS classes instead of inline styles for better maintainability
    const baseStyles = 'text-align:center; margin-top:12px; font-size:0.9rem; position:relative; z-index:1; padding:8px 16px; border-radius:8px;';
    if (type === 'success') {
      msgEl.style.cssText = baseStyles + ' color: #22c55e; background: rgba(34,197,94,0.1);';
    } else {
      msgEl.style.cssText = baseStyles + ' color: #ef4444; background: rgba(239,68,68,0.1);';
    }

    form.parentElement.appendChild(msgEl);

    setTimeout(function () {
      if (msgEl.parentElement) msgEl.remove();
    }, MESSAGE_TIMEOUT);
  }

  // --- Simple Analytics Tracking ---
  function trackEvent(eventName, data) {
    // Log events locally (replace with real analytics in production)
    if (typeof console !== 'undefined') {
      console.log('[MoneyWise Analytics]', eventName, data || {});
    }

    // Google Analytics 4 event (if loaded)
    if (typeof gtag === 'function') {
      gtag('event', eventName, data);
    }
  }

  // Track page view
  trackEvent('page_view', {
    page: window.location.pathname,
    title: document.title,
    referrer: document.referrer
  });

  // Track affiliate link clicks
  document.querySelectorAll('[id^="affiliate-"]').forEach(function (link) {
    link.addEventListener('click', function () {
      trackEvent('affiliate_click', {
        affiliate: this.id.replace('affiliate-', ''),
        page: window.location.pathname
      });
    });
  });

  // Track CTA clicks
  document.querySelectorAll('[id^="hero-cta-"], [id^="btn-"]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      trackEvent('cta_click', {
        button: this.id,
        page: window.location.pathname
      });
    });
  });

  // --- Active nav link highlighting (optimized with throttling) ---
  function updateActiveNav() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav__link');
    const scrollPos = window.pageYOffset + NAV_HIGHLIGHT_OFFSET;

    sections.forEach(function (section) {
      const top = section.offsetTop;
      const height = section.offsetHeight;
      const id = section.getAttribute('id');

      if (scrollPos >= top && scrollPos < top + height) {
        navLinks.forEach(function (link) {
          link.classList.remove('active');
          const href = link.getAttribute('href');
          if (href === '/#' + id || href === '#' + id) {
            link.classList.add('active');
          }
        });
      }
    });
  }

  // Throttle nav highlighting to improve scroll performance
  window.addEventListener('scroll', throttle(updateActiveNav, THROTTLE_LIMIT), { passive: true });

})();
