/* =========================================================================
   You-Lab — Animations system
   4 moduli: hero sequence · card reveal on scroll · counter · typing
   Tutti rispettano prefers-reduced-motion.
   ========================================================================= */
(function() {
  'use strict';

  var prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* -----------------------------------------------------------------------
     Modulo 1 — Hero text sequence
     Elementi con classe .anim-hero-item appaiono in sequenza staggered.
     opacity 0/translateY(16px) → opacity 1/translateY(0).
     Duration 500ms, ease-out, stagger 150ms tra elementi.
     ----------------------------------------------------------------------- */
  function initHeroSequence() {
    var items = document.querySelectorAll('.anim-hero-item');
    if (!items.length) return;

    items.forEach(function(el, i) {
      if (prefersReducedMotion) {
        el.style.opacity = '1';
        return;
      }
      el.style.opacity = '0';
      el.style.transform = 'translateY(16px)';
      el.style.transition = 'opacity 500ms ease-out, transform 500ms ease-out';
      setTimeout(function() {
        el.style.opacity = '1';
        el.style.transform = 'translateY(0)';
      }, 100 + i * 150);
    });
  }

  /* -----------------------------------------------------------------------
     Modulo 2 — Card reveal on scroll
     Elementi con classe .anim-card partono opacity 0/translateY(24px).
     IntersectionObserver (threshold 0.15): al trigger sequenza staggered
     80ms tra card siblings, duration 400ms ease-out.
     ----------------------------------------------------------------------- */
  function initCardReveal() {
    var cards = document.querySelectorAll('.anim-card');
    if (!cards.length) return;

    if (prefersReducedMotion) {
      cards.forEach(function(el) {
        el.style.opacity = '1';
        el.style.transform = 'none';
      });
      return;
    }

    cards.forEach(function(el) {
      el.style.opacity = '0';
      el.style.transform = 'translateY(24px)';
      el.style.transition = 'opacity 400ms ease-out, transform 400ms ease-out';
    });

    if (!('IntersectionObserver' in window)) {
      cards.forEach(function(el) {
        el.style.opacity = '1';
        el.style.transform = 'translateY(0)';
      });
      return;
    }

    var io = new IntersectionObserver(function(entries, observer) {
      entries.forEach(function(entry) {
        if (!entry.isIntersecting) return;
        var parent = entry.target.parentElement;
        var siblings = parent ? parent.querySelectorAll('.anim-card') : [entry.target];
        var idx = Array.prototype.indexOf.call(siblings, entry.target);
        setTimeout(function() {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
        }, Math.max(0, idx) * 80);
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });

    cards.forEach(function(el) { io.observe(el); });
  }

  /* -----------------------------------------------------------------------
     Modulo 3 — Counter animation
     Elementi con classe .anim-counter e attributo data-target="20".
     Suffisso opzionale via data-suffix="+".
     Al trigger IntersectionObserver: conta da 0 al target in 800ms,
     easing ease-out cubic.
     ----------------------------------------------------------------------- */
  function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }

  function animateCounter(el) {
    var target = parseInt(el.getAttribute('data-target'), 10) || 0;
    var suffix = el.getAttribute('data-suffix') || '';
    var duration = 800;

    if (prefersReducedMotion) {
      el.textContent = target + suffix;
      return;
    }

    var start = null;
    function tick(now) {
      if (start === null) start = now;
      var elapsed = now - start;
      var progress = Math.min(elapsed / duration, 1);
      var value = Math.round(target * easeOutCubic(progress));
      el.textContent = value + suffix;
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  function initCounters() {
    var counters = document.querySelectorAll('.anim-counter');
    if (!counters.length) return;

    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
      counters.forEach(animateCounter);
      return;
    }

    counters.forEach(function(el) {
      el.textContent = '0' + (el.getAttribute('data-suffix') || '');
    });

    var io = new IntersectionObserver(function(entries, observer) {
      entries.forEach(function(entry) {
        if (!entry.isIntersecting) return;
        animateCounter(entry.target);
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.3 });

    counters.forEach(function(el) { io.observe(el); });
  }

  /* -----------------------------------------------------------------------
     Modulo 4 — Typing effect (solo you-mans.html)
     Elemento con id #typing-name: il testo si scrive lettera per lettera,
     40ms per carattere. Cursore | che lampeggia ogni 500ms (blink cycle
     1000ms), scompare dopo 1.5s dal completamento. Attivazione dopo
     300ms dal caricamento.
     ----------------------------------------------------------------------- */
  function injectTypingStyles() {
    if (document.getElementById('anim-typing-styles')) return;
    var style = document.createElement('style');
    style.id = 'anim-typing-styles';
    style.textContent =
      '@keyframes anim-blink { 0%, 50% { opacity: 1; } 51%, 100% { opacity: 0; } }' +
      '.anim-typing-cursor { display: inline-block; margin-left: 2px; animation: anim-blink 1s step-end infinite; font-weight: 400; }';
    document.head.appendChild(style);
  }

  function initTyping() {
    var el = document.getElementById('typing-name');
    if (!el) return;

    var fullText = el.textContent.trim();
    if (!fullText) return;

    if (prefersReducedMotion) return;

    injectTypingStyles();
    el.textContent = '';

    var cursor = document.createElement('span');
    cursor.className = 'anim-typing-cursor';
    cursor.textContent = '|';
    cursor.setAttribute('aria-hidden', 'true');
    el.appendChild(cursor);

    var i = 0;
    setTimeout(function step() {
      if (i < fullText.length) {
        var ch = document.createTextNode(fullText.charAt(i));
        el.insertBefore(ch, cursor);
        i++;
        setTimeout(step, 40);
      } else {
        setTimeout(function() {
          cursor.style.transition = 'opacity 300ms ease-out';
          cursor.style.animation = 'none';
          cursor.style.opacity = '0';
          setTimeout(function() {
            if (cursor.parentNode) cursor.parentNode.removeChild(cursor);
          }, 350);
        }, 1500);
      }
    }, 300);
  }

  /* ----------------------------------------------------------------------- */
  function init() {
    initHeroSequence();
    initCardReveal();
    initCounters();
    initTyping();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
