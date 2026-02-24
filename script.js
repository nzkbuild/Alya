const profile = {
  herName: "Alya Batrisyia",
  yourName: "Nabil Zikri",
  anniversary: "12-12-2021",
  songUrl:
    "https://m.soundcloud.com/alya-batrisyia-248196262/2021a2?ref=sms&p=i&c=1&si=9FFF39989F0C49D0A895177DE3D4CD26&utm_source=sms&utm_medium=message&utm_campaign=social_sharing"
};

const INTRO_STORAGE_KEY = "alya_intro_accepted_v1";
const NO_BUTTON_STATES = ["No", "Are you sure?", "Really?", "Last chance", "Yes"];
const DAILY_MESSAGES = [
  "You are my favorite part of every day.",
  "I still choose you in every version of tomorrow.",
  "With you, ordinary evenings feel cinematic.",
  "Home keeps following your smile.",
  "You make time feel softer and brighter."
];

function parseAnniversary(rawValue) {
  const normalized = String(rawValue || "").trim();
  if (!normalized) return null;

  const dayMonthYear = normalized.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (dayMonthYear) {
    const [, day, month, year] = dayMonthYear;
    const isoDate = new Date(`${year}-${month}-${day}T00:00:00`);
    return Number.isNaN(isoDate.getTime()) ? null : isoDate;
  }

  const fallbackDate = new Date(normalized);
  return Number.isNaN(fallbackDate.getTime()) ? null : fallbackDate;
}

function atMidnight(dateValue) {
  return new Date(dateValue.getFullYear(), dateValue.getMonth(), dateValue.getDate());
}

function getTogetherDayCount(startDate, endDate = new Date()) {
  if (!startDate) return 0;

  const start = atMidnight(startDate);
  const end = atMidnight(endDate);
  const diff = end.getTime() - start.getTime();
  return Math.max(0, Math.floor(diff / 86400000));
}

function getCalendarDifference(startDate, endDate = new Date()) {
  if (!startDate) return { years: 0, months: 0, days: 0 };

  const start = atMidnight(startDate);
  const end = atMidnight(endDate);
  if (end.getTime() < start.getTime()) return { years: 0, months: 0, days: 0 };

  let years = end.getFullYear() - start.getFullYear();
  let months = end.getMonth() - start.getMonth();
  let days = end.getDate() - start.getDate();

  if (days < 0) {
    const daysInPreviousMonth = new Date(end.getFullYear(), end.getMonth(), 0).getDate();
    days += daysInPreviousMonth;
    months -= 1;
  }

  if (months < 0) {
    months += 12;
    years -= 1;
  }

  return {
    years: Math.max(0, years),
    months: Math.max(0, months),
    days: Math.max(0, days)
  };
}

function bindProfileFields() {
  document.querySelectorAll("[data-bind]").forEach((field) => {
    const key = field.getAttribute("data-bind");
    if (!key || !(key in profile)) return;

    if (key === "anniversary") {
      const date = parseAnniversary(profile.anniversary);
      field.textContent = date
        ? date.toLocaleDateString(undefined, {
            year: "numeric",
            month: "long",
            day: "numeric"
          })
        : profile.anniversary;
      return;
    }

    field.textContent = profile[key];
  });
}

function setupDailyDetails() {
  const messageEl = document.getElementById("dailyMessage");

  if (messageEl) {
    const dayIndex =
      Math.floor(Date.now() / 86400000) % DAILY_MESSAGES.length;
    messageEl.textContent = DAILY_MESSAGES[Math.abs(dayIndex)];
  }
}

function setupTogetherSpotlight() {
  const spotlight = document.querySelector(".together-spotlight");
  const daysValue = document.getElementById("togetherDaysValue");
  if (!spotlight || !daysValue) return;

  const yearsValue = document.getElementById("togetherYears");
  const monthsValue = document.getElementById("togetherMonths");
  const extraDaysValue = document.getElementById("togetherExtraDays");
  const anniversaryDate = parseAnniversary(profile.anniversary);
  if (!anniversaryDate) return;

  const totalDays = getTogetherDayCount(anniversaryDate);
  const duration = getCalendarDifference(anniversaryDate);

  if (yearsValue) yearsValue.textContent = duration.years.toLocaleString();
  if (monthsValue) monthsValue.textContent = duration.months.toLocaleString();
  if (extraDaysValue) extraDaysValue.textContent = duration.days.toLocaleString();

  const renderDays = (value) => {
    const safeValue = Math.max(0, Math.round(value));
    daysValue.textContent = safeValue.toLocaleString();
  };

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReducedMotion) {
    renderDays(totalDays);
    spotlight.classList.add("is-live");
    return;
  }

  let started = false;
  const startCounter = () => {
    if (started) return;
    started = true;

    const durationMs = 1700;
    const startTime = performance.now();
    const easing = (t) => 1 - Math.pow(1 - t, 3);

    const tick = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / durationMs);
      renderDays(totalDays * easing(progress));

      if (progress < 1) {
        window.requestAnimationFrame(tick);
      } else {
        spotlight.classList.add("is-live");
      }
    };

    window.requestAnimationFrame(tick);
  };

  if (!("IntersectionObserver" in window)) {
    startCounter();
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        startCounter();
        observer.disconnect();
      });
    },
    { root: null, threshold: 0.4, rootMargin: "0px 0px -10% 0px" }
  );

  observer.observe(spotlight);
}

function setupLetterReveal() {
  const letterSection = document.getElementById("letter");
  const letterCard = document.getElementById("letterCard");
  const letterSealPanel = document.getElementById("letterSealPanel");
  const letterBody = document.getElementById("letterBody");
  const openButton = document.getElementById("openLetterBtn");
  const unsealButton = document.getElementById("letterUnsealBtn");
  const resealButton = document.getElementById("letterResealBtn");

  if (!letterSection || !letterCard || !letterSealPanel || !letterBody) return;

  const openingTriggers = [openButton, unsealButton].filter(Boolean);
  let isOpen = false;

  const getHeaderOffset = () => {
    const value = window
      .getComputedStyle(document.documentElement)
      .getPropertyValue("--header-offset");
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 84;
  };

  const scrollToLetter = () => {
    const offset = getHeaderOffset() + 10;
    const top = Math.max(
      0,
      letterSection.getBoundingClientRect().top +
        (window.scrollY || window.pageYOffset || 0) -
        offset
    );
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    window.scrollTo({ top, behavior: prefersReducedMotion ? "auto" : "smooth" });
  };

  const setOpenState = (open) => {
    isOpen = open;
    letterCard.classList.toggle("is-open", open);
    letterCard.setAttribute("data-letter-state", open ? "open" : "sealed");
    letterSealPanel.setAttribute("aria-hidden", open ? "true" : "false");
    letterBody.setAttribute("aria-hidden", open ? "false" : "true");
    if (open) {
      letterSealPanel.setAttribute("inert", "");
      letterBody.removeAttribute("inert");
    } else {
      letterSealPanel.removeAttribute("inert");
      letterBody.setAttribute("inert", "");
    }
    openingTriggers.forEach((trigger) => {
      trigger.setAttribute("aria-expanded", open ? "true" : "false");
    });
    if (unsealButton) {
      unsealButton.disabled = open;
      unsealButton.tabIndex = open ? -1 : 0;
    }
    if (resealButton) {
      resealButton.setAttribute("aria-expanded", open ? "true" : "false");
      resealButton.disabled = !open;
      resealButton.tabIndex = open ? 0 : -1;
    }
  };

  const openLetter = () => {
    if (!isOpen) {
      setOpenState(true);
    }
    scrollToLetter();
  };

  // Always start sealed on load; open only via explicit user action.
  setOpenState(false);

  if (openButton) {
    openButton.addEventListener("click", openLetter);
  }

  if (unsealButton) {
    unsealButton.addEventListener("click", openLetter);
  }

  if (resealButton) {
    resealButton.addEventListener("click", () => {
      if (!isOpen) return;
      setOpenState(false);
      if (unsealButton) {
        unsealButton.focus();
      }
    });
  }

  document.querySelectorAll("a[href='#letter']").forEach((anchor) => {
    anchor.addEventListener("click", () => {
      if (!isOpen) {
        setOpenState(true);
      }
    });
  });
}

function setupTimelineDates() {
  const timelineDates = document.querySelectorAll(".timeline-date");
  if (!timelineDates.length) return;

  const anniversaryDate = parseAnniversary(profile.anniversary);
  const formatDate = (dateValue) =>
    dateValue.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric"
    });

  timelineDates.forEach((node) => {
    const explicitDate = node.getAttribute("data-timeline-date");
    if (explicitDate) {
      if (explicitDate === "today") {
        node.textContent = formatDate(new Date());
        return;
      }

      const parsedDate = parseAnniversary(explicitDate) || new Date(explicitDate);
      if (!Number.isNaN(parsedDate.getTime())) {
        node.textContent = formatDate(parsedDate);
      }
      return;
    }

    if (!node.hasAttribute("data-timeline-offset-days")) return;
    if (!anniversaryDate) return;

    const offsetRaw = node.getAttribute("data-timeline-offset-days");
    const offsetDays = Number.parseInt(offsetRaw || "0", 10);
    const offset = Number.isNaN(offsetDays) ? 0 : offsetDays;
    const milestoneDate = new Date(anniversaryDate);
    milestoneDate.setDate(milestoneDate.getDate() + offset);
    node.textContent = formatDate(milestoneDate);
  });
}

function setupTimelineEntrance() {
  const timeline = document.querySelector(".moments-timeline");
  if (!timeline) return;

  const items = Array.from(timeline.querySelectorAll(".timeline-item"));
  items.forEach((item, index) => {
    item.style.setProperty("--timeline-stagger", String(index));
  });

  const reveal = () => {
    timeline.classList.add("is-revealed");
  };

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReducedMotion || !("IntersectionObserver" in window)) {
    reveal();
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        reveal();
        observer.disconnect();
      });
    },
    {
      root: null,
      threshold: 0.35,
      rootMargin: "0px 0px -12% 0px"
    }
  );

  observer.observe(timeline);
}

function placeholderPhoto(slot) {
  const svg = `
<svg xmlns='http://www.w3.org/2000/svg' width='800' height='600'>
<defs>
<linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>
<stop offset='0' stop-color='#2b2121'/>
<stop offset='1' stop-color='#3a2c2c'/>
</linearGradient>
</defs>
<rect width='100%' height='100%' fill='url(#g)'/>
<text x='50%' y='50%' fill='#e8b4bb' font-family='sans-serif' font-size='28' text-anchor='middle'>Missing image for slot ${slot}</text>
</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function setupPhotoFallbacks() {
  document.querySelectorAll("[data-photo-slot]").forEach((img) => {
    const slot = img.getAttribute("data-photo-slot");
    img.addEventListener("error", () => {
      img.classList.add("missing-photo");
      img.src = placeholderPhoto(slot);
    });
  });
}

function setupGalleryLightbox() {
  const cards = Array.from(document.querySelectorAll(".gallery-card"));
  const lightbox = document.getElementById("galleryLightbox");
  const lightboxImage = document.getElementById("lightboxImage");
  const lightboxCaption = document.getElementById("lightboxCaption");
  const closeButton = document.getElementById("lightboxClose");
  const prevButton = document.getElementById("lightboxPrev");
  const nextButton = document.getElementById("lightboxNext");

  if (!cards.length || !lightbox || !lightboxImage || !lightboxCaption) return;

  let activeIndex = -1;
  let lastTrigger = null;

  const galleryItems = cards
    .map((card) => {
      const image = card.querySelector("img");
      const caption = card.querySelector("figcaption");
      if (!image) return null;
      return {
        src: image.currentSrc || image.src,
        alt: image.alt || "Gallery image",
        caption: caption ? caption.textContent || "" : "",
        card
      };
    })
    .filter(Boolean);

  if (!galleryItems.length) return;

  const renderLightbox = () => {
    const current = galleryItems[activeIndex];
    if (!current) return;
    lightboxImage.src = current.src;
    lightboxImage.alt = current.alt;
    lightboxCaption.textContent = current.caption;
  };

  const setLightboxOpen = (isOpen) => {
    lightbox.classList.toggle("is-open", isOpen);
    lightbox.setAttribute("aria-hidden", isOpen ? "false" : "true");
    document.body.classList.toggle("lightbox-open", isOpen);
  };

  const openLightbox = (index, triggerEl) => {
    activeIndex = index;
    lastTrigger = triggerEl || null;
    renderLightbox();
    setLightboxOpen(true);
    if (closeButton) closeButton.focus();
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
    activeIndex = -1;
    if (lastTrigger && typeof lastTrigger.focus === "function") {
      lastTrigger.focus();
    }
  };

  const move = (direction) => {
    if (!lightbox.classList.contains("is-open")) return;
    activeIndex = (activeIndex + direction + galleryItems.length) % galleryItems.length;
    renderLightbox();
  };

  let touchStartX = 0;
  let touchStartY = 0;
  if (lightboxImage) {
    lightboxImage.addEventListener(
      "touchstart",
      (event) => {
        const touch = event.changedTouches[0];
        if (!touch) return;
        touchStartX = touch.clientX;
        touchStartY = touch.clientY;
      },
      { passive: true }
    );

    lightboxImage.addEventListener(
      "touchend",
      (event) => {
        if (!lightbox.classList.contains("is-open")) return;
        const touch = event.changedTouches[0];
        if (!touch) return;
        const deltaX = touch.clientX - touchStartX;
        const deltaY = touch.clientY - touchStartY;
        if (Math.abs(deltaX) < 46 || Math.abs(deltaY) > 88) return;
        move(deltaX < 0 ? 1 : -1);
      },
      { passive: true }
    );
  }

  galleryItems.forEach((item, index) => {
    item.card.tabIndex = 0;
    item.card.setAttribute("role", "button");
    item.card.setAttribute("aria-haspopup", "dialog");
    item.card.setAttribute("aria-label", `Open image ${index + 1} of ${galleryItems.length}`);

    item.card.addEventListener("click", () => openLightbox(index, item.card));
    item.card.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      openLightbox(index, item.card);
    });
  });

  if (closeButton) closeButton.addEventListener("click", closeLightbox);
  if (prevButton) prevButton.addEventListener("click", () => move(-1));
  if (nextButton) nextButton.addEventListener("click", () => move(1));

  lightbox.addEventListener("click", (event) => {
    if (event.target === lightbox) closeLightbox();
  });

  document.addEventListener("keydown", (event) => {
    if (!lightbox.classList.contains("is-open")) return;
    if (event.key === "Tab") {
      const focusable = Array.from(
        lightbox.querySelectorAll("button, [href], [tabindex]:not([tabindex='-1'])")
      ).filter((node) => !node.hasAttribute("disabled"));
      if (!focusable.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
        return;
      }

      if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
        return;
      }
    }

    if (event.key === "Escape") {
      event.preventDefault();
      closeLightbox();
      return;
    }
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      move(-1);
      return;
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      move(1);
    }
  });
}

function setupResponsiveOffsets() {
  const root = document.documentElement;
  const header = document.querySelector(".site-header");
  const mobileNav = document.querySelector(".mobile-nav");
  if (!header && !mobileNav) return;

  let rafId = 0;

  const syncOffsets = () => {
    rafId = 0;
    const headerHeight = header ? Math.ceil(header.getBoundingClientRect().height) : 0;
    const mobileNavStyles = mobileNav ? window.getComputedStyle(mobileNav) : null;
    const mobileNavVisible = mobileNav && mobileNavStyles && mobileNavStyles.display !== "none";
    const mobileNavHeight = mobileNavVisible ? Math.ceil(mobileNav.getBoundingClientRect().height) : 0;

    root.style.setProperty("--header-offset", `${Math.max(74, headerHeight)}px`);
    root.style.setProperty("--mobile-nav-offset", `${mobileNavHeight}px`);
  };

  const queueSync = () => {
    if (rafId) return;
    rafId = window.requestAnimationFrame(syncOffsets);
  };

  if ("ResizeObserver" in window) {
    const observer = new ResizeObserver(queueSync);
    if (header) observer.observe(header);
    if (mobileNav) observer.observe(mobileNav);
  }

  window.addEventListener("resize", queueSync, { passive: true });
  window.addEventListener("orientationchange", queueSync, { passive: true });
  queueSync();
}

function setupSectionNavHighlight() {
  const sections = Array.from(document.querySelectorAll("main section[id]"));
  if (!sections.length) return;

  const navLinks = Array.from(
    document.querySelectorAll(".nav-links a[href^='#'], .mobile-nav a[href^='#']")
  );
  if (!navLinks.length) return;

  let activeId = "";
  const doc = document.documentElement;

  const setActive = (id) => {
    if (!id || activeId === id) return;
    activeId = id;

    navLinks.forEach((link) => {
      const linkId = link.getAttribute("href")?.replace("#", "");
      const isActive = linkId === id;
      link.classList.toggle("is-active", isActive);
      if (isActive) {
        link.setAttribute("aria-current", "page");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  };

  const getHeaderOffset = () => {
    const value = window.getComputedStyle(doc).getPropertyValue("--header-offset");
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 84;
  };

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const scrollBehavior = prefersReducedMotion ? "auto" : "smooth";
  let ticking = false;

  const pickActiveByScroll = () => {
    const scrollTop = window.scrollY || window.pageYOffset || 0;
    const viewportBottom = scrollTop + window.innerHeight;
    const docHeight = Math.max(document.body.scrollHeight, doc.scrollHeight);
    const lastSection = sections[sections.length - 1];
    const nearBottom = viewportBottom >= docHeight - 2;
    if (nearBottom) {
      setActive(lastSection.id);
      return;
    }

    const marker = scrollTop + getHeaderOffset() + 18;
    let candidateId = sections[0].id;
    for (let i = 0; i < sections.length; i += 1) {
      if (sections[i].offsetTop <= marker) {
        candidateId = sections[i].id;
      }
    }
    setActive(candidateId);
  };

  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(() => {
      pickActiveByScroll();
      ticking = false;
    });
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);

  navLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      const id = link.getAttribute("href")?.replace("#", "");
      if (!id) return;
      const target = document.getElementById(id);
      if (!target) return;

      event.preventDefault();
      setActive(id);
      const offset = getHeaderOffset() + 8;
      const targetTop = Math.max(
        0,
        target.getBoundingClientRect().top + (window.scrollY || window.pageYOffset || 0) - offset
      );
      window.scrollTo({ top: targetTop, behavior: scrollBehavior });

      if (window.history && typeof window.history.replaceState === "function") {
        const cleanUrl = `${window.location.pathname}${window.location.search}`;
        window.history.replaceState(null, "", cleanUrl);
      }
    });
  });

  pickActiveByScroll();
}

function setupTopOnReload() {
  if ("scrollRestoration" in window.history) {
    window.history.scrollRestoration = "manual";
  }

  const navigationEntry = performance.getEntriesByType("navigation")[0];
  const isReload = navigationEntry && navigationEntry.type === "reload";
  if (!isReload) return;

  window.requestAnimationFrame(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  });
}

function setupScrollProgress() {
  const progressBar = document.getElementById("scrollProgressBar");
  if (!progressBar) return;

  const doc = document.documentElement;
  let ticking = false;

  const updateProgress = () => {
    ticking = false;
    const scrollTop = window.scrollY || doc.scrollTop || 0;
    const scrollRange = Math.max(1, doc.scrollHeight - window.innerHeight);
    const progress = Math.min(1, Math.max(0, scrollTop / scrollRange));
    progressBar.style.transform = `scaleX(${progress.toFixed(4)})`;
  };

  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(updateProgress);
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  updateProgress();
}

function setupBackToTop() {
  const button = document.getElementById("backToTop");
  if (!button) return;

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const behavior = prefersReducedMotion ? "auto" : "smooth";
  let ticking = false;

  const toggleVisibility = () => {
    ticking = false;
    const threshold = Math.max(360, Math.round(window.innerHeight * 0.72));
    const shouldShow = window.scrollY > threshold;
    button.classList.toggle("is-visible", shouldShow);
    button.setAttribute("aria-hidden", shouldShow ? "false" : "true");
  };

  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(toggleVisibility);
  };

  button.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior });
  });

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  toggleVisibility();
}

function setupSongControls() {
  const playButton = document.getElementById("playSong");
  const replayButton = document.getElementById("replaySong");
  const statusEl = document.getElementById("songStatus");
  const audio = document.getElementById("ourSong");
  let localPlaybackUnavailable = false;

  if (audio) {
    audio.setAttribute("playsinline", "");
    audio.setAttribute("webkit-playsinline", "true");
    audio.preload = "metadata";
  }

  const setStatus = (text) => {
    if (statusEl) statusEl.textContent = `Song status: ${text}`;
  };

  const updateReplayButton = () => {
    if (!replayButton) return;
    replayButton.textContent = localPlaybackUnavailable ? "Open Song Link" : "Replay from start";
  };

  const updatePlayButton = () => {
    if (!playButton) return;
    if (localPlaybackUnavailable) {
      playButton.textContent = "Open Song Link";
      return;
    }
    playButton.textContent = audio && !audio.paused ? "Pause Our Song" : "Play Our Song";
  };

  const markLocalPlaybackUnavailable = () => {
    localPlaybackUnavailable = true;
    updatePlayButton();
    updateReplayButton();
  };

  const openFallbackUrl = () => {
    const url = profile.songUrl.trim();
    if (!url) return false;
    const popup = window.open(url, "_blank", "noopener,noreferrer");
    if (!popup) {
      window.location.href = url;
    }
    return true;
  };

  const isUnsupportedError = (error) => {
    const name = String(error?.name || "");
    return name === "NotSupportedError" || name === "AbortError";
  };

  const playLocalSong = async ({ fromStart = false, allowFallback = true } = {}) => {
    if (!audio || localPlaybackUnavailable) {
      if (allowFallback && openFallbackUrl()) {
        setStatus("fallback link opened");
      } else {
        setStatus("song link unavailable");
      }
      return false;
    }

    if (fromStart) {
      audio.currentTime = 0;
    }

    try {
      await audio.play();
      setStatus("now playing");
      updatePlayButton();
      updateReplayButton();
      return true;
    } catch (error) {
      if (audio.error || isUnsupportedError(error)) {
        markLocalPlaybackUnavailable();
      }

      if (allowFallback) {
        if (openFallbackUrl()) {
          setStatus("local audio unavailable, opened song link");
        } else {
          setStatus("local audio unavailable");
        }
      } else {
        setStatus("tap play once to enable audio");
      }
      updatePlayButton();
      updateReplayButton();
      return false;
    }
  };

  const pauseSong = () => {
    if (!audio) return;
    audio.pause();
    setStatus("paused");
    updatePlayButton();
  };

  if (audio) {
    audio.addEventListener("play", () => {
      setStatus("now playing");
      updatePlayButton();
    });
    audio.addEventListener("pause", () => {
      if (audio.currentTime < audio.duration) setStatus("paused");
      updatePlayButton();
    });
    audio.addEventListener("ended", () => {
      setStatus("ended");
      updatePlayButton();
    });
    audio.addEventListener("error", () => {
      markLocalPlaybackUnavailable();
      setStatus("local audio unavailable, use song link");
    });
  }

  if (playButton) {
    playButton.addEventListener("click", async () => {
      if (localPlaybackUnavailable) {
        if (openFallbackUrl()) setStatus("opened song link");
        return;
      }
      if (audio && !audio.paused) {
        pauseSong();
        return;
      }
      await playLocalSong({ fromStart: false, allowFallback: true });
    });
  }

  if (replayButton) {
    replayButton.addEventListener("click", async () => {
      if (localPlaybackUnavailable) {
        if (openFallbackUrl()) setStatus("opened song link");
        return;
      }
      await playLocalSong({ fromStart: true, allowFallback: true });
    });
  }

  setStatus("paused");
  updatePlayButton();
  updateReplayButton();
  return { playLocalSong, pauseSong };
}

function triggerHeartBurst(container) {
  if (!container) return;
  container.innerHTML = "";

  for (let i = 0; i < 18; i += 1) {
    const heart = document.createElement("span");
    heart.style.setProperty("--burst-x", `${Math.round((Math.random() - 0.5) * 260)}px`);
    heart.style.setProperty("--burst-y", `${Math.round(-80 - Math.random() * 220)}px`);
    heart.style.setProperty("--burst-scale", (0.65 + Math.random() * 1.15).toFixed(2));
    heart.textContent = Math.random() > 0.25 ? "♡" : "♥";
    container.appendChild(heart);
  }

  window.setTimeout(() => {
    container.innerHTML = "";
  }, 900);
}

function setupIntroGate(songControls) {
  const introGate = document.getElementById("introGate");
  const yesButton = document.getElementById("yesBtn");
  const noButton = document.getElementById("noBtn");
  const replayIntro = document.getElementById("replayIntro");
  const heartBurst = document.getElementById("heartBurst");
  const introHint = document.querySelector(".intro-hint");
  const siteShell = document.getElementById("siteShell");
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (!introGate || !yesButton || !noButton) {
    document.body.classList.remove("intro-locked");
    document.body.classList.add("intro-unlocked");
    return;
  }

  let noStep = 0;
  let isUnlocking = false;
  const finalNoIndex = NO_BUTTON_STATES.length - 1;
  const defaultHintText = introHint ? introHint.textContent : "";
  const noHintMessages = [
    "Pick carefully. There is a correct answer.",
    "Still no? Try reading the room.",
    "No pressure, but the yes button looks better.",
    "One more tap and this turns into yes."
  ];

  const setShellInteractive = (isInteractive) => {
    if (!siteShell) return;
    if (isInteractive) {
      siteShell.removeAttribute("inert");
      return;
    }
    siteShell.setAttribute("inert", "");
  };

  const setReplayState = (isIntroOpen) => {
    if (!replayIntro) return;
    replayIntro.disabled = isIntroOpen;
    replayIntro.setAttribute("aria-disabled", isIntroOpen ? "true" : "false");
    replayIntro.textContent = isIntroOpen ? "Intro Active" : "Replay Intro";
  };

  const resetIntroButtons = () => {
    noStep = 0;
    isUnlocking = false;
    noButton.textContent = NO_BUTTON_STATES[0];
    noButton.classList.remove("is-yes");
    noButton.removeAttribute("aria-label");
    yesButton.disabled = false;
    noButton.disabled = false;
    yesButton.style.setProperty("--yes-scale", "1");
    if (introHint) introHint.textContent = defaultHintText;
  };

  const setYesScale = (step) => {
    const scale = Math.min(1 + step * 0.13, 1.78);
    yesButton.style.setProperty("--yes-scale", scale.toFixed(2));
  };

  const enterIntroState = () => {
    resetIntroButtons();
    introGate.hidden = false;
    document.body.classList.remove("intro-unlocked");
    document.body.classList.add("intro-locked");
    setShellInteractive(false);
    setReplayState(true);
  };

  const unlockExperience = async () => {
    if (isUnlocking || document.body.classList.contains("intro-unlocked")) return;
    isUnlocking = true;
    yesButton.disabled = true;
    noButton.disabled = true;

    document.body.classList.remove("intro-locked");
    document.body.classList.add("intro-unlocked");
    localStorage.setItem(INTRO_STORAGE_KEY, "yes");
    setShellInteractive(true);
    setReplayState(false);
    triggerHeartBurst(heartBurst);

    const hideDelay = prefersReducedMotion ? 0 : 430;
    window.setTimeout(() => {
      introGate.hidden = true;
      const primaryAction = document.getElementById("playSong");
      if (primaryAction) primaryAction.focus();
    }, hideDelay);

    await songControls.playLocalSong({ fromStart: false, allowFallback: true });
  };

  const showIntroAgain = () => {
    if (document.body.classList.contains("intro-locked")) return;

    localStorage.removeItem(INTRO_STORAGE_KEY);
    songControls.pauseSong();
    enterIntroState();
    const behavior = prefersReducedMotion ? "auto" : "smooth";
    window.scrollTo({ top: 0, behavior });
    yesButton.focus();
  };

  yesButton.addEventListener("click", unlockExperience);

  noButton.addEventListener("click", () => {
    if (isUnlocking) return;
    if (noStep >= finalNoIndex) {
      unlockExperience();
      return;
    }

    noStep = Math.min(noStep + 1, finalNoIndex);
    noButton.textContent = NO_BUTTON_STATES[noStep];
    setYesScale(noStep);
    if (introHint) {
      introHint.textContent =
        noHintMessages[Math.min(noStep, noHintMessages.length - 1)] || defaultHintText;
    }

    if (noStep >= finalNoIndex) {
      noButton.classList.add("is-yes");
      noButton.setAttribute("aria-label", "Yes, forever");
    }
  });

  if (replayIntro) {
    replayIntro.addEventListener("click", showIntroAgain);
  }

  if (localStorage.getItem(INTRO_STORAGE_KEY) === "yes") {
    introGate.hidden = true;
    document.body.classList.remove("intro-locked");
    document.body.classList.add("intro-unlocked");
    setShellInteractive(true);
    setReplayState(false);
    return;
  }

  enterIntroState();
}

bindProfileFields();
setupTopOnReload();
setupResponsiveOffsets();
setupScrollProgress();
setupDailyDetails();
setupLetterReveal();
setupTogetherSpotlight();
setupTimelineDates();
setupTimelineEntrance();
setupPhotoFallbacks();
setupGalleryLightbox();
setupSectionNavHighlight();
setupBackToTop();
const songControls = setupSongControls();
setupIntroGate(songControls);
