(function () {
  "use strict";

  var LANG_KEY = "khatt-lang";
  var html = document.documentElement;

  function currentLang() {
    return html.getAttribute("data-lang") === "ru" ? "ru" : "en";
  }

  /* ------------------------------------------------------------------
   * Language switching
   * All translatable blocks are plain DOM elements marked with
   * data-lang="en"/"ru" and use the native `hidden` attribute — so the
   * static markup already renders full EN copy with zero JavaScript.
   * This function just toggles which language's blocks are hidden.
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
      /* localStorage unavailable (private mode etc.) — silently ignore */
    }
  }

  function detectInitialLang() {
    var stored = getStoredLang();
    if (stored === "en" || stored === "ru") return stored;
    var nav = (navigator.language || navigator.userLanguage || "").toLowerCase();
    return nav.indexOf("ru") === 0 ? "ru" : "en";
  }

  function applyLanguageToForm(lang) {
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
    applyLanguageToForm(lang);
    if (!opts.skipStore) storeLang(lang);
  }

  document.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-set-lang]");
    if (!btn) return;
    // Preserve current anchor section (spec 2.4 language switcher requirement).
    var hash = window.location.hash;
    setLang(btn.getAttribute("data-set-lang"));
    if (hash) {
      window.location.hash = hash;
    }
  });

  // Initial language (auto-detect on first visit, then persisted); avoids
  // depending on JS for the *content itself* — this only decides which of
  // the two already-rendered languages is shown first.
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
   * Active section highlighting in nav
   * ------------------------------------------------------------------ */
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('a[data-nav]'));
  var sections = navLinks
    .map(function (a) {
      var id = a.getAttribute("href").replace("#", "");
      return document.getElementById(id);
    })
    .filter(Boolean);

  if ("IntersectionObserver" in window && sections.length) {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var id = entry.target.id;
          navLinks.forEach(function (a) {
            var match = a.getAttribute("href") === "#" + id;
            a.classList.toggle("is-active", match);
          });
        });
      },
      { rootMargin: "-40% 0px -55% 0px", threshold: 0 }
    );
    sections.forEach(function (s) {
      observer.observe(s);
    });
  }

  /* ------------------------------------------------------------------
   * Mobile nav overlay
   * ------------------------------------------------------------------ */
  var hamburgerBtn = document.getElementById("hamburger-btn");
  var mobileNav = document.getElementById("mobile-nav");
  var mobileNavClose = document.getElementById("mobile-nav-close");

  function closeMobileNav() {
    if (!mobileNav) return;
    mobileNav.hidden = true;
    if (hamburgerBtn) hamburgerBtn.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
    if (hamburgerBtn) hamburgerBtn.focus();
  }

  if (hamburgerBtn && mobileNav && mobileNavClose) {
    function openMobileNav() {
      mobileNav.hidden = false;
      hamburgerBtn.setAttribute("aria-expanded", "true");
      document.body.style.overflow = "hidden";
      mobileNavClose.focus();
    }
    hamburgerBtn.addEventListener("click", openMobileNav);
    mobileNavClose.addEventListener("click", closeMobileNav);
    mobileNav.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeMobileNav();
    });
  }
  document.querySelectorAll("[data-mobile-link]").forEach(function (el) {
    el.addEventListener("click", closeMobileNav);
  });

  /* ------------------------------------------------------------------
   * "Apply now" dialog (present on index.html only; other pages link
   * back to it, so every step below is guarded on `dialog` existing).
   * ------------------------------------------------------------------ */
  var dialog = document.getElementById("book-call-dialog");
  if (dialog) {
  var dialogCloseBtn = document.getElementById("dialog-close-btn");
  var lastTrigger = null;

  function openDialog(trigger) {
    lastTrigger = trigger || null;
    if (typeof dialog.showModal === "function") {
      dialog.showModal();
    } else {
      // Very old browsers without <dialog> support: graceful fallback.
      dialog.setAttribute("open", "");
    }
  }
  function closeDialog() {
    if (typeof dialog.close === "function" && dialog.open) {
      dialog.close();
    } else {
      dialog.removeAttribute("open");
    }
    if (lastTrigger && typeof lastTrigger.focus === "function") lastTrigger.focus();
  }

  document.querySelectorAll("[data-open-dialog]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      openDialog(btn);
      closeMobileNav();
    });
  });
  dialogCloseBtn.addEventListener("click", closeDialog);
  document.querySelectorAll("[data-close-dialog]").forEach(function (btn) {
    btn.addEventListener("click", closeDialog);
  });
  dialog.addEventListener("click", function (e) {
    // Click on the ::backdrop registers as a click on the dialog element itself.
    if (e.target === dialog) closeDialog();
  });
  dialog.addEventListener("cancel", function () {
    // native Escape-to-close: nothing extra needed, but keep trigger focus return.
  });
  dialog.addEventListener("close", function () {
    if (lastTrigger && typeof lastTrigger.focus === "function") lastTrigger.focus();
  });

  /* ------------------------------------------------------------------
   * "Apply now" form: client-side validation + mailto submit.
   *
   * There is no form backend (no Formspree/API key etc.) — see HTML
   * comment above the dialog markup. Building the mailto: link and
   * redirecting to it is the deliberate, low-tech lead-gen mechanism
   * for this pass; swap `buildMailtoUrl` + the submit handler below for
   * a real fetch() POST once a backend endpoint exists.
   * ------------------------------------------------------------------ */
  var form = document.getElementById("book-call-form");
  var submitBtn = document.getElementById("book-call-submit");
  var statusBox = document.getElementById("form-status");

  var requiredFields = [
    { name: "company", labelEn: "Operator company name", labelRu: "Название компании-оператора" },
    { name: "license", labelEn: "License number", labelRu: "Номер лицензии" },
    { name: "contactPerson", labelEn: "Contact person", labelRu: "Контактное лицо" },
    { name: "email", labelEn: "Email", labelRu: "Email" },
    { name: "phone", labelEn: "Phone", labelRu: "Телефон" }
  ];

  function fieldWrapper(name) {
    return form.querySelector('[data-field="' + cssEscape(name) + '"]');
  }
  function cssEscape(s) {
    return s.replace(/([^a-zA-Z0-9_-])/g, "\\$1");
  }

  function clearErrors() {
    form.querySelectorAll(".form-field.has-error").forEach(function (el) {
      el.classList.remove("has-error");
    });
    form.querySelectorAll(".error-msg").forEach(function (el) {
      el.textContent = "";
    });
  }

  function setError(name, message) {
    var wrapper = fieldWrapper(name);
    if (!wrapper) return;
    wrapper.classList.add("has-error");
    var msgEl = wrapper.querySelector(".error-msg");
    if (msgEl) msgEl.textContent = message;
  }

  function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  function validate() {
    clearErrors();
    var lang = currentLang();
    var firstInvalid = null;
    var ok = true;

    requiredFields.forEach(function (field) {
      var input = form.elements[field.name];
      var value = (input.value || "").trim();
      var label = lang === "ru" ? field.labelRu : field.labelEn;
      if (!value) {
        ok = false;
        var msg =
          lang === "ru"
            ? label + " — обязательное поле."
            : label + " is required.";
        setError(field.name, msg);
        if (!firstInvalid) firstInvalid = input;
        return;
      }
      if (field.name === "email" && !isValidEmail(value)) {
        ok = false;
        var emailMsg =
          lang === "ru"
            ? "Введите корректный email-адрес."
            : "Enter a valid email address.";
        setError(field.name, emailMsg);
        if (!firstInvalid) firstInvalid = input;
      }
    });

    if (firstInvalid) firstInvalid.focus();
    return ok;
  }

  function buildMailtoUrl(data, lang) {
    var subject =
      lang === "ru"
        ? "Заявка на финансирование — " + data.company
        : "Application — " + data.company;

    var lines =
      lang === "ru"
        ? [
            "Название компании-оператора: " + data.company,
            "Номер лицензии: " + data.license,
            "Аккредитация Nusuk/Maqam: " + (data.nusuk || "—"),
            "Контактное лицо: " + data.contactPerson,
            "Email: " + data.email,
            "Телефон: " + data.phone,
            "Предпочитаемый язык связи: " + data.preferredLanguage,
            "Ориентировочный размер facility: " + (data.facilitySizeLabel || "—"),
            "Сообщение: " + (data.message || "—")
          ]
        : [
            "Operator company name: " + data.company,
            "License number: " + data.license,
            "Nusuk/Maqam accreditation: " + (data.nusuk || "—"),
            "Contact person: " + data.contactPerson,
            "Email: " + data.email,
            "Phone: " + data.phone,
            "Preferred language of contact: " + data.preferredLanguage,
            "Estimated facility size: " + (data.facilitySizeLabel || "—"),
            "Message: " + (data.message || "—")
          ];

    var body = lines.join("\n");
    return (
      "mailto:info@khattcapital.com" +
      "?subject=" + encodeURIComponent(subject) +
      "&body=" + encodeURIComponent(body)
    );
  }

  function collectFormData() {
    var facilitySelect = form.elements["facilitySize"];
    var facilityLabel = "";
    if (facilitySelect && facilitySelect.selectedOptions && facilitySelect.selectedOptions[0]) {
      facilityLabel = facilitySelect.selectedOptions[0].textContent.trim();
    }
    return {
      company: form.elements["company"].value.trim(),
      license: form.elements["license"].value.trim(),
      nusuk: form.elements["nusuk"].value.trim(),
      contactPerson: form.elements["contactPerson"].value.trim(),
      email: form.elements["email"].value.trim(),
      phone: form.elements["phone"].value.trim(),
      preferredLanguage: form.elements["preferredLanguage"].value,
      facilitySizeLabel: facilityLabel,
      message: form.elements["message"].value.trim()
    };
  }

  function showStatus(type, message) {
    statusBox.hidden = false;
    statusBox.className = "form-status " + type;
    statusBox.textContent = message;
  }

  function setLoading(isLoading) {
    submitBtn.disabled = isLoading;
    submitBtn.classList.toggle("btn--loading", isLoading);
  }

  var submitLock = false;

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (submitLock) return; // double-click / double-submit guard

    statusBox.hidden = true;
    if (!validate()) return;

    submitLock = true;
    setLoading(true);

    var lang = currentLang();
    var data = collectFormData();

    // Short artificial delay so the loading/spinner state (spec 2.4) is
    // perceivable, then hand off to the user's email client via mailto.
    window.setTimeout(function () {
      var mailtoUrl = buildMailtoUrl(data, lang);
      window.location.href = mailtoUrl;

      setLoading(false);
      submitLock = false;

      var successMsg =
        lang === "ru"
          ? "Спасибо, мы свяжемся с вами в ближайшее время."
          : "Thank you — we'll be in touch soon.";
      showStatus("success", successMsg);
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
  } // end if (dialog)

  /* ------------------------------------------------------------------
   * "For Investors" interest form (investors.html only).
   * ------------------------------------------------------------------ */
  var investorForm = document.getElementById("investor-form");
  if (investorForm) {
    var investorStatusBox = document.getElementById("investor-form-status");
    var investorSubmitBtn = document.getElementById("investor-form-submit");
    var investorRequiredFields = [
      { name: "name", labelEn: "Name", labelRu: "Имя" },
      { name: "organization", labelEn: "Organization / fund", labelRu: "Организация / фонд" },
      { name: "email", labelEn: "Email", labelRu: "Email" }
    ];
    var investorSubmitLock = false;

    function investorFieldWrapper(name) {
      return investorForm.querySelector('[data-field="' + name.replace(/([^a-zA-Z0-9_-])/g, "\\$1") + '"]');
    }
    function investorClearErrors() {
      investorForm.querySelectorAll(".form-field.has-error").forEach(function (el) {
        el.classList.remove("has-error");
      });
      investorForm.querySelectorAll(".error-msg").forEach(function (el) {
        el.textContent = "";
      });
    }
    function investorSetError(name, message) {
      var wrapper = investorFieldWrapper(name);
      if (!wrapper) return;
      wrapper.classList.add("has-error");
      var msgEl = wrapper.querySelector(".error-msg");
      if (msgEl) msgEl.textContent = message;
    }
    function investorValidate() {
      investorClearErrors();
      var lang = currentLang();
      var firstInvalid = null;
      var ok = true;
      investorRequiredFields.forEach(function (field) {
        var input = investorForm.elements[field.name];
        var value = (input.value || "").trim();
        var label = lang === "ru" ? field.labelRu : field.labelEn;
        if (!value) {
          ok = false;
          investorSetError(field.name, lang === "ru" ? label + " — обязательное поле." : label + " is required.");
          if (!firstInvalid) firstInvalid = input;
          return;
        }
        if (field.name === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          ok = false;
          investorSetError(field.name, lang === "ru" ? "Введите корректный email-адрес." : "Enter a valid email address.");
          if (!firstInvalid) firstInvalid = input;
        }
      });
      if (firstInvalid) firstInvalid.focus();
      return ok;
    }
    function investorShowStatus(type, message) {
      investorStatusBox.hidden = false;
      investorStatusBox.className = "form-status " + type;
      investorStatusBox.textContent = message;
    }

    investorForm.addEventListener("submit", function (e) {
      e.preventDefault();
      if (investorSubmitLock) return;
      investorStatusBox.hidden = true;
      if (!investorValidate()) return;

      investorSubmitLock = true;
      investorSubmitBtn.disabled = true;

      var lang = currentLang();
      var name = investorForm.elements["name"].value.trim();
      var organization = investorForm.elements["organization"].value.trim();
      var email = investorForm.elements["email"].value.trim();
      var investorType = investorForm.elements["investorType"] ? investorForm.elements["investorType"].value : "";
      var ticketSize = investorForm.elements["ticketSize"] ? investorForm.elements["ticketSize"].value.trim() : "";
      var message = investorForm.elements["message"] ? investorForm.elements["message"].value.trim() : "";

      var subject = lang === "ru" ? "Интерес инвестора — " + organization : "Investor interest — " + organization;
      var lines =
        lang === "ru"
          ? [
              "Имя: " + name,
              "Организация / фонд: " + organization,
              "Email: " + email,
              "Тип инвестора: " + (investorType || "—"),
              "Ориентировочный чек: " + (ticketSize || "—"),
              "Сообщение: " + (message || "—")
            ]
          : [
              "Name: " + name,
              "Organization / fund: " + organization,
              "Email: " + email,
              "Investor type: " + (investorType || "—"),
              "Indicative ticket size: " + (ticketSize || "—"),
              "Message: " + (message || "—")
            ];

      window.setTimeout(function () {
        window.location.href =
          "mailto:info@khattcapital.com?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(lines.join("\n"));
        investorSubmitBtn.disabled = false;
        investorSubmitLock = false;
        investorShowStatus(
          "success",
          lang === "ru" ? "Спасибо, мы свяжемся с вами в ближайшее время." : "Thank you — we'll be in touch soon."
        );
      }, 500);
    });

    investorForm.addEventListener("input", function (e) {
      var wrapper = e.target.closest(".form-field.has-error");
      if (wrapper) {
        wrapper.classList.remove("has-error");
        var msgEl = wrapper.querySelector(".error-msg");
        if (msgEl) msgEl.textContent = "";
      }
    });
  }
})();
