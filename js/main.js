/**
 * MoneyWise Hub — Core JavaScript
 * Handles navigation, animations, newsletter form, and analytics
 */

(function () {
  'use strict';

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

  // --- Navbar scroll effect ---
  const navbar = document.getElementById('navbar');
  let lastScroll = 0;

  window.addEventListener('scroll', function () {
    const currentScroll = window.pageYOffset;

    if (navbar) {
      if (currentScroll > 50) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
    }

    lastScroll = currentScroll;
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

      // Your actual Mailchimp values
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

      // Timeout fallback (10 seconds)
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
      }, 10000);
    });
  }

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function showFormMessage(form, message, type) {
    // Remove existing message
    var existing = form.parentElement.querySelector('.form-message');
    if (existing) existing.remove();

    var msgEl = document.createElement('p');
    msgEl.className = 'form-message';
    msgEl.textContent = message;
    msgEl.style.cssText = 'text-align:center; margin-top:12px; font-size:0.9rem; position:relative; z-index:1; padding:8px 16px; border-radius:8px;';

    if (type === 'success') {
      msgEl.style.color = '#22c55e';
      msgEl.style.background = 'rgba(34,197,94,0.1)';
    } else {
      msgEl.style.color = '#ef4444';
      msgEl.style.background = 'rgba(239,68,68,0.1)';
    }

    form.parentElement.appendChild(msgEl);

    setTimeout(function () {
      if (msgEl.parentElement) msgEl.remove();
    }, 5000);
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

  // --- Active nav link highlighting ---
  function updateActiveNav() {
    var sections = document.querySelectorAll('section[id]');
    var navLinks = document.querySelectorAll('.nav__link');
    var scrollPos = window.pageYOffset + 100;

    sections.forEach(function (section) {
      var top = section.offsetTop;
      var height = section.offsetHeight;
      var id = section.getAttribute('id');

      if (scrollPos >= top && scrollPos < top + height) {
        navLinks.forEach(function (link) {
          link.classList.remove('active');
          if (link.getAttribute('href') === '/#' + id || link.getAttribute('href') === '#' + id) {
            link.classList.add('active');
          }
        });
      }
    });
  }

  window.addEventListener('scroll', updateActiveNav, { passive: true });

})();
