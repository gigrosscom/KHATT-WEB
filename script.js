(function () {
  "use strict";

  var LANG_KEY = "khatt-lang";
  var html = document.documentElement;

  function currentLang() {
    return html.getAttribute("data-lang") === "ru" ? "ru" : "en";
  }

  /* ------------------------------------------------------------------
   * Language switching — same convention as the production site:
   * plain DOM elements marked data-lang="en"/"ru", toggled via [hidden].
   * ------------------------------------------------------------------ */

  function getStoredLang() {
    try {
      return localStorage.getItem(LANG_KEY);
    } catch (e) {
      return null;
    }
  }
  function storeLang(lang) {
    try {
      localStorage.setItem(LANG_KEY, lang);
    } catch (e) {
      /* localStorage unavailable — silently ignore */
    }
  }
  function detectInitialLang() {
    var stored = getStoredLang();
    if (stored === "en" || stored === "ru") return stored;
    var nav = (navigator.language || navigator.userLanguage || "").toLowerCase();
    return nav.indexOf("ru") === 0 ? "ru" : "en";
  }

  function applyLanguageToSelects(lang) {
    document.querySelectorAll("select").forEach(function (select) {
      Array.prototype.forEach.call(select.options, function (opt) {
        var text = lang === "ru" ? opt.dataset.ru : opt.dataset.en;
        if (text) opt.textContent = text;
      });
    });
  }

  function setLang(lang, opts) {
    opts = opts || {};
    if (lang !== "en" && lang !== "ru") lang = "en";

    document.querySelectorAll("[data-lang]:not(html)").forEach(function (el) {
      el.hidden = el.getAttribute("data-lang") !== lang;
    });
    document.querySelectorAll("[data-set-lang]").forEach(function (btn) {
      btn.setAttribute("aria-pressed", btn.getAttribute("data-set-lang") === lang ? "true" : "false");
    });

    html.setAttribute("lang", lang);
    applyLanguageToSelects(lang);
    if (!opts.skipStore) storeLang(lang);
  }

  document.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-set-lang]");
    if (!btn) return;
    var hash = window.location.hash;
    setLang(btn.getAttribute("data-set-lang"));
    if (hash) window.location.hash = hash;
  });

  setLang(detectInitialLang(), { skipStore: true });

  /* ------------------------------------------------------------------
   * Sticky header shrink-on-scroll
   * ------------------------------------------------------------------ */
  var header = document.getElementById("site-header");
  if (header) {
    var onScroll = function () {
      if (window.scrollY > 12) header.classList.add("is-scrolled");
      else header.classList.remove("is-scrolled");
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* ------------------------------------------------------------------
   * Active nav highlighting (same-page anchors only)
   * ------------------------------------------------------------------ */
  var navLinks = Array.prototype.slice.call(document.querySelectorAll("a[data-nav]"));
  var sections = navLinks
    .map(function (a) {
      var href = a.getAttribute("href") || "";
      if (href.indexOf("#") !== 0) return null;
      return document.getElementById(href.slice(1));
    })
    .filter(Boolean);

  if ("IntersectionObserver" in window && sections.length) {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var id = entry.target.id;
          navLinks.forEach(function (a) {
            a.classList.toggle("is-active", a.getAttribute("href") === "#" + id);
          });
        });
      },
      { rootMargin: "-40% 0px -55% 0px", threshold: 0 }
    );
    sections.forEach(function (s) { observer.observe(s); });
  }

  /* ------------------------------------------------------------------
   * Mobile nav overlay
   * ------------------------------------------------------------------ */
  var hamburgerBtn = document.getElementById("hamburger-btn");
  var mobileNav = document.getElementById("mobile-nav");
  var mobileNavClose = document.getElementById("mobile-nav-close");

  function focusableIn(el) {
    return Array.prototype.slice
      .call(el.querySelectorAll('a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])'))
      .filter(function (n) { return n.offsetParent !== null; });
  }

  function closeMobileNav() {
    if (!mobileNav || mobileNav.hidden) return;
    mobileNav.hidden = true;
    if (hamburgerBtn) hamburgerBtn.setAttribute("aria-expanded", "false");
    document.body.classList.remove("nav-open");
    if (hamburgerBtn) hamburgerBtn.focus();
  }
  if (hamburgerBtn && mobileNav && mobileNavClose) {
    function openMobileNav() {
      mobileNav.hidden = false;
      hamburgerBtn.setAttribute("aria-expanded", "true");
      document.body.classList.add("nav-open");
      mobileNavClose.focus();
    }
    hamburgerBtn.addEventListener("click", openMobileNav);
    mobileNavClose.addEventListener("click", closeMobileNav);
    mobileNav.addEventListener("keydown", function (e) {
      if (e.key === "Escape") { closeMobileNav(); return; }
      if (e.key !== "Tab") return;
      /* Focus trap: keep keyboard focus inside the open overlay. */
      var focusable = focusableIn(mobileNav);
      if (!focusable.length) return;
      var first = focusable[0];
      var last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault(); last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault(); first.focus();
      }
    });
    /* Close the overlay if the viewport grows to desktop while it is open. */
    window.addEventListener("resize", function () {
      if (!mobileNav.hidden && window.matchMedia("(min-width: 1024px)").matches) {
        closeMobileNav();
      }
    });
  }
  document.querySelectorAll("[data-mobile-link]").forEach(function (el) {
    el.addEventListener("click", closeMobileNav);
  });

  /* ------------------------------------------------------------------
   * Generic lead-capture form handler.
   *
   * Any <form class="js-lead-form" data-subject-en="…" data-subject-ru="…">
   * gets client-side validation + a mailto: submit, built generically from
   * its own fields/labels — used by the Agencies, Suppliers and Banks &
   * Capital pages so the logic lives in one place instead of three copies.
   * No backend yet, matching the rest of the site's forms.
   * ------------------------------------------------------------------ */
  function cssEscape(s) {
    return s.replace(/([^a-zA-Z0-9_-])/g, "\\$1");
  }

  function fieldLabel(form, name, lang) {
    var wrapper = form.querySelector('[data-field="' + cssEscape(name) + '"]');
    if (!wrapper) return name;
    var label = wrapper.querySelector("label");
    if (!label) return name;
    var span = label.querySelector('[data-lang="' + lang + '"]') || label;
    return span.textContent.replace(/\*/g, "").trim();
  }

  function fieldWrapper(form, name) {
    return form.querySelector('[data-field="' + cssEscape(name) + '"]');
  }

  function clearFormErrors(form) {
    form.querySelectorAll(".form-field.has-error").forEach(function (el) {
      el.classList.remove("has-error");
    });
    form.querySelectorAll(".error-msg").forEach(function (el) {
      el.textContent = "";
    });
  }

  function setFieldError(form, name, message) {
    var wrapper = fieldWrapper(form, name);
    if (!wrapper) return;
    wrapper.classList.add("has-error");
    var msgEl = wrapper.querySelector(".error-msg");
    if (msgEl) msgEl.textContent = message;
  }

  function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  document.querySelectorAll("form.js-lead-form").forEach(function (form) {
    var statusBox = form.querySelector(".form-status");
    var submitBtn = form.querySelector('button[type="submit"]');
    var submitLock = false;

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (submitLock) return;

      var lang = currentLang();
      clearFormErrors(form);
      if (statusBox) statusBox.hidden = true;

      var ok = true;
      var firstInvalid = null;
      var lines = [];

      Array.prototype.forEach.call(form.elements, function (el) {
        if (!el.name || el.type === "submit" || el.type === "button") return;
        var value = (el.value || "").trim();
        var label = fieldLabel(form, el.name, lang);

        if (el.hasAttribute("required") && !value) {
          ok = false;
          setFieldError(
            form,
            el.name,
            lang === "ru" ? label + " — обязательное поле." : label + " is required."
          );
          if (!firstInvalid) firstInvalid = el;
          return;
        }
        if (el.type === "email" && value && !isValidEmail(value)) {
          ok = false;
          setFieldError(
            form,
            el.name,
            lang === "ru" ? "Введите корректный email-адрес." : "Enter a valid email address."
          );
          if (!firstInvalid) firstInvalid = el;
          return;
        }
        if (el.tagName === "SELECT" && el.selectedOptions && el.selectedOptions[0]) {
          lines.push(label + ": " + el.selectedOptions[0].textContent.trim());
        } else if (value) {
          lines.push(label + ": " + value);
        }
      });

      if (!ok) {
        if (firstInvalid) firstInvalid.focus();
        return;
      }

      submitLock = true;
      if (submitBtn) submitBtn.classList.add("btn--loading");

      var subject = lang === "ru" ? form.dataset.subjectRu : form.dataset.subjectEn;

      window.setTimeout(function () {
        window.location.href =
          "mailto:info@khattcapital.com?subject=" +
          encodeURIComponent(subject || "KHATT Capital") +
          "&body=" +
          encodeURIComponent(lines.join("\n"));

        submitLock = false;
        if (submitBtn) submitBtn.classList.remove("btn--loading");
        if (statusBox) {
          statusBox.hidden = false;
          statusBox.className = "form-status success";
          statusBox.textContent =
            lang === "ru"
              ? "Спасибо, мы свяжемся с вами в ближайшее время."
              : "Thank you — we'll be in touch soon.";
        }
      }, 500);
    });

    form.addEventListener("input", function (e) {
      var wrapper = e.target.closest(".form-field.has-error");
      if (wrapper) {
        wrapper.classList.remove("has-error");
        var msgEl = wrapper.querySelector(".error-msg");
        if (msgEl) msgEl.textContent = "";
      }
    });
  });
})();
