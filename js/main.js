(function () {
  "use strict";

  var WA_NUMBER = "201027208126";
  var WA_MSG = {
    en: "Hello Samah Elkassem, I would like to book a fashion consultation.",
    ar: "مرحباً سماح القاسم، أرغب في حجز استشارة لتصميم فستان."
  };
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* =========================================================
     I18N
     ========================================================= */
  var LANG_KEY = "se-lang";
  var currentLang = "en";

  function t(key) {
    var dict = window.I18N[currentLang] || {};
    return dict[key] != null ? dict[key] : (window.I18N.en[key] || "");
  }

  function applyLang(lang, refresh) {
    if (!window.I18N[lang]) lang = "en";
    currentLang = lang;
    var html = document.documentElement;
    html.setAttribute("lang", lang);
    html.setAttribute("dir", lang === "ar" ? "rtl" : "ltr");

    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      el.textContent = t(el.getAttribute("data-i18n"));
    });
    document.querySelectorAll("[data-i18n-html]").forEach(function (el) {
      el.innerHTML = t(el.getAttribute("data-i18n-html"));
    });
    document.querySelectorAll("[data-i18n-aria]").forEach(function (el) {
      el.setAttribute("aria-label", t(el.getAttribute("data-i18n-aria")));
    });
    document.querySelectorAll("[data-i18n-placeholder]").forEach(function (el) {
      el.setAttribute("placeholder", t(el.getAttribute("data-i18n-placeholder")));
    });
    document.querySelectorAll("[data-i18n-alt]").forEach(function (el) {
      el.setAttribute("alt", t(el.getAttribute("data-i18n-alt")));
    });

    document.title = t("meta.title");
    var md = document.querySelector('meta[name="description"]');
    if (md) md.setAttribute("content", t("meta.description"));

    updateWhatsAppLinks();

    try { localStorage.setItem(LANG_KEY, lang); } catch (e) {}

    if (refresh && window.ScrollTrigger) {
      requestAnimationFrame(function () { window.ScrollTrigger.refresh(); });
    }
  }

  function updateWhatsAppLinks() {
    var base = "https://wa.me/" + WA_NUMBER + "?text=" + encodeURIComponent(WA_MSG[currentLang]);
    ["waFloat", "waTextLink", "waFooterLink"].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.setAttribute("href", base);
    });
  }

  function initLang() {
    var saved = "en";
    try { saved = localStorage.getItem(LANG_KEY) || "en"; } catch (e) {}
    applyLang(saved, false);

    function toggle() {
      var y = window.scrollY;
      applyLang(currentLang === "en" ? "ar" : "en", true);
      window.scrollTo(0, y);
    }
    ["langSwitch", "langSwitchMobile", "langSwitchFooter"].forEach(function (id) {
      var b = document.getElementById(id);
      if (b) b.addEventListener("click", toggle);
    });
  }

  /* =========================================================
     NAVIGATION
     ========================================================= */
  function initNav() {
    var nav = document.getElementById("navbar");
    var burger = document.getElementById("navBurger");
    var menu = document.getElementById("mobileMenu");

    function onScroll() {
      if (window.scrollY > 40) nav.classList.add("is-scrolled");
      else nav.classList.remove("is-scrolled");
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    function closeMenu() {
      menu.classList.remove("is-open");
      menu.setAttribute("aria-hidden", "true");
      burger.setAttribute("aria-expanded", "false");
      burger.setAttribute("aria-label", t("nav.menuOpen"));
      document.body.classList.remove("is-locked");
    }
    function openMenu() {
      menu.classList.add("is-open");
      menu.setAttribute("aria-hidden", "false");
      burger.setAttribute("aria-expanded", "true");
      burger.setAttribute("aria-label", t("nav.menuClose"));
      document.body.classList.add("is-locked");
    }
    burger.addEventListener("click", function () {
      if (menu.classList.contains("is-open")) closeMenu(); else openMenu();
    });
    menu.querySelectorAll("[data-nav]").forEach(function (a) {
      a.addEventListener("click", closeMenu);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && menu.classList.contains("is-open")) closeMenu();
    });

    // active section indicator
    var links = Array.prototype.slice.call(document.querySelectorAll(".nav__link[data-nav]"));
    var sections = links.map(function (l) {
      return document.querySelector(l.getAttribute("href"));
    });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          var id = "#" + en.target.id;
          links.forEach(function (l) {
            l.classList.toggle("is-active", l.getAttribute("href") === id);
          });
        }
      });
    }, { rootMargin: "-45% 0px -50% 0px", threshold: 0 });
    sections.forEach(function (s) { if (s) io.observe(s); });
  }

  /* =========================================================
     REVEAL ON SCROLL
     ========================================================= */
  function initReveal() {
    var els = document.querySelectorAll(".reveal, .img-mask");
    if (reduceMotion) {
      els.forEach(function (el) { el.classList.add("is-visible"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add("is-visible");
          io.unobserve(en.target);
        }
      });
    }, { rootMargin: "0px 0px -12% 0px", threshold: 0.12 });
    els.forEach(function (el) { io.observe(el); });
  }

  /* =========================================================
     HERO FRAME SEQUENCE
     ========================================================= */
  var FRAME_COUNT = 192;
  function frameSrc(i) {
    return "assets/frames/frame-" + String(i + 1).padStart(3, "0") + ".webp";
  }

  function initHero(onFirstFrame) {
    var canvas = document.getElementById("heroCanvas");
    var ctx = canvas.getContext("2d", { alpha: false });
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var images = new Array(FRAME_COUNT);
    var loaded = new Array(FRAME_COUNT).fill(false);
    var lastDrawn = -1;
    var firstFired = false;

    function resize() {
      var w = canvas.clientWidth, h = canvas.clientHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      draw(lastDrawn < 0 ? 0 : lastDrawn, true);
    }

    function nearestLoaded(index) {
      if (loaded[index]) return index;
      for (var d = 1; d < FRAME_COUNT; d++) {
        if (index - d >= 0 && loaded[index - d]) return index - d;
        if (index + d < FRAME_COUNT && loaded[index + d]) return index + d;
      }
      return -1;
    }

    function draw(index, force) {
      index = Math.max(0, Math.min(FRAME_COUNT - 1, Math.round(index)));
      var use = loaded[index] ? index : nearestLoaded(index);
      if (use < 0) return;
      if (!force && use === lastDrawn) return;
      lastDrawn = use;
      var img = images[use];
      var cw = canvas.width, ch = canvas.height;
      var iw = img.naturalWidth, ih = img.naturalHeight;
      var scale = Math.max(cw / iw, ch / ih);
      var dw = iw * scale, dh = ih * scale;
      var dx = (cw - dw) / 2, dy = (ch - dh) / 2;
      ctx.drawImage(img, dx, dy, dw, dh);
    }

    function loadFrame(i, cb) {
      if (images[i]) { if (cb) cb(); return; }
      var img = new Image();
      img.decoding = "async";
      img.onload = function () {
        loaded[i] = true;
        if (!firstFired && i === 0) {
          firstFired = true;
          resize();
          if (onFirstFrame) onFirstFrame();
        }
        if (i >= lastDrawn - 2 && i <= lastDrawn + 2) draw(lastDrawn, true);
        if (cb) cb();
      };
      img.onerror = function () { if (cb) cb(); };
      img.src = frameSrc(i);
      images[i] = img;
    }

    // Load frame 0 first, then essential batch, then the rest progressively.
    loadFrame(0, function () {
      var essential = 24;
      var queue = [];
      for (var i = 1; i < FRAME_COUNT; i++) queue.push(i);
      var concurrency = 6;
      var active = 0, ptr = 0;
      function pump() {
        while (active < concurrency && ptr < queue.length) {
          active++;
          loadFrame(queue[ptr++], function () { active--; pump(); });
        }
      }
      // prioritise essential frames first, then the rest
      queue.sort(function (a, b) {
        var ea = a <= essential ? 0 : 1, eb = b <= essential ? 0 : 1;
        return ea - eb || a - b;
      });
      pump();
    });

    window.addEventListener("resize", resize, { passive: true });

    // stage overlays
    var stageIntro = document.querySelector(".hero__stage--intro");
    var stageMid = document.querySelector(".hero__stage--mid");
    var stageEnd = document.querySelector(".hero__stage--end");
    var cue = document.querySelector(".hero__scroll-cue");

    function clamp(v) { return Math.max(0, Math.min(1, v)); }
    function seg(p, a, b) { return clamp((p - a) / (b - a)); }

    function setStage(el, o) {
      if (!el) return;
      el.style.opacity = o.toFixed(3);
      el.style.pointerEvents = o > 0.5 ? "auto" : "none";
    }

    function updateStages(p) {
      // intro visible then fades
      setStage(stageIntro, 1 - seg(p, 0.10, 0.20));
      // mid quote
      var midIn = seg(p, 0.40, 0.47);
      var midOut = seg(p, 0.60, 0.68);
      setStage(stageMid, midIn * (1 - midOut));
      // end quote
      setStage(stageEnd, seg(p, 0.83, 0.92));
      if (cue) cue.style.opacity = (1 - seg(p, 0.02, 0.10)).toFixed(2);
    }

    if (reduceMotion || !window.gsap) {
      // Static strong frame + connect scroll fallback
      loadFrame(Math.round(FRAME_COUNT * 0.62));
      loadFrame(FRAME_COUNT - 1);
      if (reduceMotion) {
        setStage(stageIntro, 1);
        return;
      }
      // GSAP missing: plain scroll fallback
      var hero = document.querySelector(".hero");
      window.addEventListener("scroll", function () {
        var rect = hero.getBoundingClientRect();
        var total = hero.offsetHeight - window.innerHeight;
        var p = clamp(-rect.top / total);
        draw(p * (FRAME_COUNT - 1));
        updateStages(p);
      }, { passive: true });
      updateStages(0);
      return;
    }

    // GSAP ScrollTrigger drives the sequence (CSS sticky handles pinning)
    var state = { f: 0 };
    window.gsap.to(state, {
      f: FRAME_COUNT - 1,
      ease: "none",
      scrollTrigger: {
        trigger: ".hero",
        start: "top top",
        end: "bottom bottom",
        scrub: 0.4,
        onUpdate: function (self) {
          draw(state.f);
          updateStages(self.progress);
        }
      }
    });
    updateStages(0);
  }

  /* =========================================================
     PROCESS THREAD
     ========================================================= */
  function initProcessThread() {
    var fill = document.getElementById("processThread");
    if (!fill) return;
    if (reduceMotion || !window.gsap) { fill.style.height = "100%"; return; }
    window.gsap.to(fill, {
      height: "100%",
      ease: "none",
      scrollTrigger: {
        trigger: ".process__list",
        start: "top 70%",
        end: "bottom 70%",
        scrub: 0.5
      }
    });
  }

  /* =========================================================
     GALLERY LIGHTBOX
     ========================================================= */
  function initLightbox() {
    var items = Array.prototype.slice.call(document.querySelectorAll(".gallery__item"));
    if (!items.length) return;
    var lb = document.getElementById("lightbox");
    var lbImg = document.getElementById("lbImg");
    var btnClose = document.getElementById("lbClose");
    var btnPrev = document.getElementById("lbPrev");
    var btnNext = document.getElementById("lbNext");
    var idx = 0, lastFocus = null;

    var slides = items.map(function (it) {
      var img = it.querySelector("img");
      return { src: img.getAttribute("src"), alt: img.getAttribute("alt") };
    });

    function show(i) {
      idx = (i + slides.length) % slides.length;
      lbImg.setAttribute("src", slides[idx].src);
      lbImg.setAttribute("alt", slides[idx].alt || "");
    }
    function open(i) {
      lastFocus = document.activeElement;
      show(i);
      lb.classList.add("is-open");
      lb.setAttribute("aria-hidden", "false");
      document.body.classList.add("is-locked");
      btnClose.focus();
    }
    function close() {
      lb.classList.remove("is-open");
      lb.setAttribute("aria-hidden", "true");
      document.body.classList.remove("is-locked");
      if (lastFocus) lastFocus.focus();
    }

    items.forEach(function (it, i) {
      it.addEventListener("click", function () { open(i); });
    });
    btnClose.addEventListener("click", close);
    btnNext.addEventListener("click", function () { show(idx + 1); });
    btnPrev.addEventListener("click", function () { show(idx - 1); });
    lb.addEventListener("click", function (e) { if (e.target === lb) close(); });

    document.addEventListener("keydown", function (e) {
      if (!lb.classList.contains("is-open")) return;
      var rtl = document.documentElement.getAttribute("dir") === "rtl";
      if (e.key === "Escape") close();
      else if (e.key === "ArrowRight") show(idx + (rtl ? -1 : 1));
      else if (e.key === "ArrowLeft") show(idx + (rtl ? 1 : -1));
      else if (e.key === "Tab") { e.preventDefault(); } // trap within controls
    });

    // touch swipe
    var sx = 0;
    lb.addEventListener("touchstart", function (e) { sx = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener("touchend", function (e) {
      var dx = e.changedTouches[0].clientX - sx;
      var rtl = document.documentElement.getAttribute("dir") === "rtl";
      if (Math.abs(dx) > 45) show(idx + (dx < 0 ? (rtl ? -1 : 1) : (rtl ? 1 : -1)));
    }, { passive: true });
  }

  /* =========================================================
     CONTACT FORM -> WHATSAPP
     ========================================================= */
  function initForm() {
    var form = document.getElementById("bookingForm");
    if (!form) return;
    var statusEl = document.getElementById("formStatus");

    function setErr(name, msgKey) {
      var span = form.querySelector('[data-err="' + name + '"]');
      var field = span ? span.closest(".field") : null;
      if (span) span.textContent = msgKey ? t(msgKey) : "";
      if (field) field.classList.toggle("has-error", !!msgKey);
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      statusEl.textContent = "";
      statusEl.classList.remove("is-error");

      var name = form.name.value.trim();
      var phone = form.phone.value.trim();
      var occasionSel = form.occasion;
      var occasion = occasionSel.value;
      var date = form.date.value;
      var message = form.message.value.trim();

      var ok = true;
      if (!name) { setErr("name", "form.errName"); ok = false; } else setErr("name", null);
      if (!phone || phone.replace(/[^\d]/g, "").length < 7) { setErr("phone", "form.errPhone"); ok = false; } else setErr("phone", null);
      if (!occasion) { setErr("occasion", "form.errOccasion"); ok = false; } else setErr("occasion", null);

      if (!ok) {
        statusEl.textContent = t("form.errGeneric");
        statusEl.classList.add("is-error");
        var firstErr = form.querySelector(".has-error input, .has-error select");
        if (firstErr) firstErr.focus();
        return;
      }

      var occasionLabel = occasionSel.options[occasionSel.selectedIndex].textContent.trim();
      var lines;
      if (currentLang === "ar") {
        lines = [
          "طلب استشارة جديد:",
          "الاسم: " + name,
          "الهاتف: " + phone,
          "المناسبة: " + occasionLabel
        ];
        if (date) lines.push("الموعد المفضل: " + date);
        if (message) lines.push("الرسالة: " + message);
      } else {
        lines = [
          "New consultation request:",
          "Name: " + name,
          "Phone: " + phone,
          "Occasion: " + occasionLabel
        ];
        if (date) lines.push("Preferred date: " + date);
        if (message) lines.push("Message: " + message);
      }
      var url = "https://wa.me/" + WA_NUMBER + "?text=" + encodeURIComponent(lines.join("\n"));
      statusEl.textContent = t("form.success");
      window.open(url, "_blank");
    });

    // clear error on input
    form.querySelectorAll("input, select, textarea").forEach(function (el) {
      el.addEventListener("input", function () {
        var field = el.closest(".field");
        if (field && field.classList.contains("has-error")) {
          field.classList.remove("has-error");
          var span = field.querySelector(".field__err");
          if (span) span.textContent = "";
        }
      });
    });
  }

  /* =========================================================
     LOADER
     ========================================================= */
  function hideLoader() {
    var l = document.getElementById("loader");
    if (l && !l.classList.contains("is-done")) l.classList.add("is-done");
  }

  /* =========================================================
     BOOT
     ========================================================= */
  function boot() {
    if (window.gsap && window.ScrollTrigger) {
      window.gsap.registerPlugin(window.ScrollTrigger);
    }
    initLang();
    initNav();
    initReveal();
    initForm();
    initLightbox();
    initProcessThread();

    var loaderHidden = false;
    function doHide() { if (!loaderHidden) { loaderHidden = true; hideLoader(); } }

    initHero(function () {
      // first frame ready — allow loader to finish its stitch/logo animation (~2.6s)
      var elapsed = Date.now() - bootTime;
      var wait = Math.max(0, 2600 - elapsed);
      setTimeout(doHide, wait);
    });

    // absolute fallback so the loader can never trap the visitor
    setTimeout(doHide, 3400);

    if (window.ScrollTrigger) {
      window.addEventListener("load", function () {
        setTimeout(function () { window.ScrollTrigger.refresh(); }, 200);
      });
    }
  }

  var bootTime = Date.now();
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
