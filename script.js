(function () {
  "use strict";

  var LANG_KEY = "khatt-lang";
  var FIRST_TOUCH_KEY = "khatt-first-touch";
  var VISITOR_KEY = "khatt-visitor-id";
  var DEFAULT_FORM_ENDPOINT = "https://formsubmit.co/ajax/info@khattcapital.com";
  var html = document.documentElement;
  var params = new URLSearchParams(window.location.search || "");

  function currentLang() {
    return html.getAttribute("data-lang") === "ru" ? "ru" : "en";
  }

  function storageGet(key) {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      return null;
    }
  }

  function storageSet(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      /* localStorage unavailable — silently ignore */
    }
  }

  function getStoredLang() {
    return storageGet(LANG_KEY);
  }

  function storeLang(lang) {
    storageSet(LANG_KEY, lang);
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

  function sourceLabel(source, lang) {
    var labels = {
      email: { en: "Email invitation", ru: "Приглашение по email" },
      instagram: { en: "Instagram application", ru: "Заявка из Instagram" },
      tiktok: { en: "TikTok application", ru: "Заявка из TikTok" },
      linkedin: { en: "LinkedIn application", ru: "Заявка из LinkedIn" },
      whatsapp: { en: "WhatsApp invitation", ru: "Приглашение в WhatsApp" },
      partner: { en: "Partner referral", ru: "Рекомендация партнёра" },
      direct: { en: "Direct application", ru: "Прямая заявка" }
    };
    var key = (source || "direct").toLowerCase();
    return (labels[key] || labels.direct)[lang];
  }

  function currentSource() {
    return (params.get("utm_source") || params.get("source") || "direct").toLowerCase();
  }

  function updateDynamicLanguage(lang) {
    document.querySelectorAll("[data-source-label]").forEach(function (el) {
      el.textContent = sourceLabel(currentSource(), lang);
    });

    var company = params.get("company") || params.get("company_name") || "";
    document.querySelectorAll("[data-prefilled-company]").forEach(function (el) {
      if (!company) {
        el.hidden = true;
        el.textContent = "";
        return;
      }
      el.hidden = false;
      el.textContent = lang === "ru" ? "Заявка для: " + company : "Application for: " + company;
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
    html.setAttribute("data-lang", lang);
    applyLanguageToSelects(lang);
    updateDynamicLanguage(lang);
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

  /* Send every agency CTA to the conversion-focused application page. */
  document.querySelectorAll('a[href="/for-agencies#apply"], a[href="for-agencies.html#apply"], a[href="/for-agencies.html#apply"]').forEach(function (link) {
    link.setAttribute("href", "/apply" + (window.location.search || ""));
  });

  /* Sticky header shrink-on-scroll. */
  var header = document.getElementById("site-header");
  if (header) {
    var onScroll = function () {
      if (window.scrollY > 12) header.classList.add("is-scrolled");
      else header.classList.remove("is-scrolled");
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* Active nav highlighting for same-page anchors. */
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

  /* Mobile navigation overlay. */
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
      if (e.key === "Escape") {
        closeMobileNav();
        return;
      }
      if (e.key !== "Tab") return;
      var focusable = focusableIn(mobileNav);
      if (!focusable.length) return;
      var first = focusable[0];
      var last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    });
    window.addEventListener("resize", function () {
      if (!mobileNav.hidden && window.matchMedia("(min-width: 1024px)").matches) {
        closeMobileNav();
      }
    });
  }

  document.querySelectorAll("[data-mobile-link]").forEach(function (el) {
    el.addEventListener("click", closeMobileNav);
  });

  function cssEscape(s) {
    return String(s).replace(/([^a-zA-Z0-9_-])/g, "\\$1");
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

  function isValidUrl(value) {
    if (!value) return true;
    try {
      var url = new URL(value.indexOf("http") === 0 ? value : "https://" + value);
      return Boolean(url.hostname);
    } catch (e) {
      return false;
    }
  }

  function randomId(length) {
    var chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    var out = "";
    var bytes = new Uint8Array(length);
    if (window.crypto && window.crypto.getRandomValues) {
      window.crypto.getRandomValues(bytes);
      for (var i = 0; i < length; i += 1) out += chars[bytes[i] % chars.length];
      return out;
    }
    for (var j = 0; j < length; j += 1) out += chars[Math.floor(Math.random() * chars.length)];
    return out;
  }

  function getVisitorId() {
    var existing = storageGet(VISITOR_KEY);
    if (existing) return existing;
    var created = "KH-V-" + randomId(12);
    storageSet(VISITOR_KEY, created);
    return created;
  }

  function makeApplicationReference() {
    var now = new Date();
    var y = String(now.getUTCFullYear());
    var m = String(now.getUTCMonth() + 1).padStart(2, "0");
    var d = String(now.getUTCDate()).padStart(2, "0");
    return "KH-" + y + m + d + "-" + randomId(6);
  }

  function readFirstTouch() {
    var stored = storageGet(FIRST_TOUCH_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        /* ignore malformed storage */
      }
    }
    var created = {
      at: new Date().toISOString(),
      url: window.location.href,
      referrer: document.referrer || "",
      source: currentSource(),
      medium: params.get("utm_medium") || "",
      campaign: params.get("utm_campaign") || ""
    };
    storageSet(FIRST_TOUCH_KEY, JSON.stringify(created));
    return created;
  }

  var firstTouch = readFirstTouch();

  function ensureHidden(form, name) {
    var input = form.querySelector('input[name="' + cssEscape(name) + '"]');
    if (!input) {
      input = document.createElement("input");
      input.type = "hidden";
      input.name = name;
      form.appendChild(input);
    }
    return input;
  }

  function setHidden(form, name, value) {
    ensureHidden(form, name).value = value == null ? "" : String(value);
  }

  function prefillForm(form) {
    var prefill = {
      contactPerson: params.get("contact") || params.get("name"),
      email: params.get("email"),
      whatsapp: params.get("whatsapp") || params.get("phone"),
      companyName: params.get("company") || params.get("company_name"),
      country: params.get("country"),
      website: params.get("website")
    };

    Object.keys(prefill).forEach(function (name) {
      var value = prefill[name];
      if (!value) return;
      var field = form.elements[name];
      if (field && !field.value) field.value = value;
    });
  }

  function addTrackingFields(form) {
    var now = new Date().toISOString();
    var names = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "gclid", "fbclid", "ttclid", "li_fat_id"];
    names.forEach(function (name) {
      setHidden(form, name, params.get(name) || "");
    });
    setHidden(form, "outreach_ref", params.get("outreach_ref") || params.get("ref") || "");
    setHidden(form, "visitor_id", getVisitorId());
    setHidden(form, "first_touch_at", firstTouch.at || "");
    setHidden(form, "first_touch_url", firstTouch.url || "");
    setHidden(form, "first_touch_referrer", firstTouch.referrer || "");
    setHidden(form, "last_touch_at", now);
    setHidden(form, "landing_url", window.location.href);
    setHidden(form, "page_path", window.location.pathname);
    setHidden(form, "browser_language", navigator.language || "");
    setHidden(form, "form_language", currentLang());
    setHidden(form, "submitted_at", now);
    setHidden(form, "source_label", sourceLabel(currentSource(), "en"));
  }

  function selectedValue(form, name) {
    var field = form.elements[name];
    return field ? String(field.value || "") : "";
  }

  function scoreApplication(form) {
    var score = 0;
    if (selectedValue(form, "licence")) score += 10;

    var maps = {
      yearsOperating: { "10_plus": 15, "5_9": 12, "2_4": 6, "under_2": 2 },
      annualGmv: { "5m_plus": 20, "1m_5m": 15, "250k_1m": 8, "under_250k": 3 },
      monthlyTravelers: { "1000_plus": 15, "300_999": 12, "100_299": 7, "under_100": 3 },
      requestedFacility: { "1m_plus": 8, "250k_1m": 10, "50k_250k": 8, "under_50k": 4 },
      supplierDeadline: { "0_30": 10, "31_60": 7, "61_90": 4, "planning": 1 },
      supplierEvidence: { "yes": 10, "partial": 5, "no": 0 },
      customerDeposits: { "yes": 10, "partial": 5, "no": 0 }
    };

    Object.keys(maps).forEach(function (name) {
      score += maps[name][selectedValue(form, name)] || 0;
    });

    var grade = score >= 75 ? "A" : score >= 50 ? "B" : "C";
    var priority = score >= 75 ? "HOT" : score >= 50 ? "WARM" : "NURTURE";
    return { score: score, grade: grade, priority: priority };
  }

  function appendSelectLabels(form, formData) {
    form.querySelectorAll("select[name]").forEach(function (select) {
      if (!select.value || !select.selectedOptions || !select.selectedOptions[0]) return;
      formData.append(select.name + "_label", select.selectedOptions[0].textContent.trim());
    });
  }

  function buildFallbackBody(form, lang) {
    var lines = [];
    Array.prototype.forEach.call(form.elements, function (el) {
      if (!el.name || el.type === "hidden" || el.type === "submit" || el.type === "button" || el.name === "_honey") return;
      var value = el.type === "checkbox" ? (el.checked ? "Yes" : "No") : (el.value || "").trim();
      if (!value) return;
      var label = fieldLabel(form, el.name, lang);
      if (el.tagName === "SELECT" && el.selectedOptions && el.selectedOptions[0]) value = el.selectedOptions[0].textContent.trim();
      lines.push(label + ": " + value);
    });
    return lines.join("\n");
  }

  function trackLeadEvent(form, result) {
    var payload = {
      event: "khatt_lead_submitted",
      form_name: form.dataset.formName || "website-lead-form",
      lead_kind: form.dataset.leadKind || "general",
      lead_score: result.score,
      lead_grade: result.grade,
      lead_priority: result.priority,
      source: currentSource()
    };
    if (Array.isArray(window.dataLayer)) window.dataLayer.push(payload);
    if (typeof window.fbq === "function") window.fbq("track", "Lead", { content_name: payload.form_name, value: result.score, currency: "USD" });
    if (window.ttq && typeof window.ttq.track === "function") window.ttq.track("SubmitForm", { content_name: payload.form_name, value: result.score, currency: "USD" });
  }

  document.querySelectorAll("form.js-lead-form").forEach(function (form) {
    var statusBox = form.querySelector(".form-status");
    var submitBtn = form.querySelector('button[type="submit"]');
    var submitLock = false;
    var applicationRef = makeApplicationReference();

    prefillForm(form);
    addTrackingFields(form);
    setHidden(form, "application_reference", applicationRef);

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (submitLock) return;

      var lang = currentLang();
      clearFormErrors(form);
      if (statusBox) {
        statusBox.hidden = true;
        statusBox.textContent = "";
      }

      var ok = true;
      var firstInvalid = null;

      Array.prototype.forEach.call(form.elements, function (el) {
        if (!el.name || el.type === "hidden" || el.type === "submit" || el.type === "button" || el.name === "_honey") return;
        var isCheckbox = el.type === "checkbox";
        var value = isCheckbox ? (el.checked ? el.value || "Yes" : "") : (el.value || "").trim();
        var label = fieldLabel(form, el.name, lang);

        if (el.hasAttribute("required") && !value) {
          ok = false;
          setFieldError(form, el.name, lang === "ru" ? label + " — обязательное поле." : label + " is required.");
          if (!firstInvalid) firstInvalid = el;
          return;
        }
        if (el.type === "email" && value && !isValidEmail(value)) {
          ok = false;
          setFieldError(form, el.name, lang === "ru" ? "Введите корректный email-адрес." : "Enter a valid email address.");
          if (!firstInvalid) firstInvalid = el;
          return;
        }
        if (el.type === "url" && value && !isValidUrl(value)) {
          ok = false;
          setFieldError(form, el.name, lang === "ru" ? "Введите корректный адрес сайта." : "Enter a valid website address.");
          if (!firstInvalid) firstInvalid = el;
        }
      });

      if (!ok) {
        if (firstInvalid) firstInvalid.focus();
        return;
      }

      submitLock = true;
      if (submitBtn) submitBtn.classList.add("btn--loading");

      addTrackingFields(form);
      var result = scoreApplication(form);
      setHidden(form, "lead_score", result.score);
      setHidden(form, "lead_grade", result.grade);
      setHidden(form, "lead_priority", result.priority);
      setHidden(form, "application_reference", applicationRef);

      var formData = new FormData(form);
      appendSelectLabels(form, formData);
      var subject = lang === "ru" ? form.dataset.subjectRu : form.dataset.subjectEn;
      formData.append("_subject", (subject || "KHATT CAPITAL application") + " · " + result.priority + " · " + applicationRef);
      formData.append("_template", "table");
      formData.append("_captcha", "false");
      formData.append("_replyto", selectedValue(form, "email"));
      formData.append("_autoresponse", lang === "ru"
        ? "KHATT CAPITAL получила вашу предварительную заявку " + applicationRef + ". Это подтверждение получения, а не оферта или обязательство предоставить финансирование."
        : "KHATT CAPITAL received your preliminary application " + applicationRef + ". This confirms receipt only and is not an offer or financing commitment.");

      var endpoint = form.dataset.endpoint || DEFAULT_FORM_ENDPOINT;

      fetch(endpoint, {
        method: "POST",
        body: formData,
        headers: { "Accept": "application/json" }
      })
        .then(function (response) {
          return response.json().catch(function () { return {}; }).then(function (body) {
            if (!response.ok || body.success === false || body.success === "false") {
              throw new Error(body.message || "Submission failed");
            }
            return body;
          });
        })
        .then(function () {
          trackLeadEvent(form, result);
          var formBody = form.querySelector("[data-form-body]");
          var successPanel = form.querySelector("[data-form-success]");
          var refOutput = form.querySelector("[data-application-ref]");
          if (refOutput) refOutput.textContent = applicationRef;
          if (formBody && successPanel) {
            formBody.hidden = true;
            successPanel.hidden = false;
            successPanel.scrollIntoView({ behavior: "smooth", block: "center" });
          } else if (statusBox) {
            statusBox.hidden = false;
            statusBox.className = "form-status success";
            statusBox.textContent = lang === "ru" ? "Заявка получена. Номер: " + applicationRef : "Application received. Reference: " + applicationRef;
          }
          form.reset();
        })
        .catch(function () {
          if (statusBox) {
            var body = buildFallbackBody(form, lang);
            var fallbackSubject = (subject || "KHATT CAPITAL application") + " · " + applicationRef;
            var href = "mailto:info@khattcapital.com?subject=" + encodeURIComponent(fallbackSubject) + "&body=" + encodeURIComponent(body);
            statusBox.hidden = false;
            statusBox.className = "form-status error";
            statusBox.innerHTML = lang === "ru"
              ? 'Не удалось отправить форму. <a href="' + href + '">Отправить заявку по email</a>.'
              : 'The form could not be submitted. <a href="' + href + '">Send the application by email</a>.';
          }
        })
        .finally(function () {
          submitLock = false;
          if (submitBtn) submitBtn.classList.remove("btn--loading");
        });
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
