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

  const fallbackDate = new Date(normalized);
  if (!Number.isNaN(fallbackDate.getTime())) return fallbackDate;

  const dayMonthYear = normalized.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (!dayMonthYear) return null;

  const [, day, month, year] = dayMonthYear;
  const isoDate = new Date(`${year}-${month}-${day}T00:00:00`);
  return Number.isNaN(isoDate.getTime()) ? null : isoDate;
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
  const dayCounterEl = document.getElementById("dayCounter");
  const anniversaryDate = parseAnniversary(profile.anniversary);

  if (messageEl) {
    const dayIndex =
      Math.floor(Date.now() / 86400000) % DAILY_MESSAGES.length;
    messageEl.textContent = DAILY_MESSAGES[Math.abs(dayIndex)];
  }

  if (dayCounterEl && anniversaryDate) {
    const today = new Date();
    const midnightToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const midnightStart = new Date(
      anniversaryDate.getFullYear(),
      anniversaryDate.getMonth(),
      anniversaryDate.getDate()
    );
    const diff = midnightToday.getTime() - midnightStart.getTime();
    const days = Math.max(0, Math.floor(diff / 86400000));
    dayCounterEl.textContent = `${days.toLocaleString()} days`;
  }
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
    const explicitType = node.getAttribute("data-timeline-date");
    if (explicitType === "today") {
      node.textContent = formatDate(new Date());
      return;
    }

    if (!anniversaryDate) return;

    const offsetRaw = node.getAttribute("data-timeline-offset-days");
    const offsetDays = Number.parseInt(offsetRaw || "0", 10);
    const offset = Number.isNaN(offsetDays) ? 0 : offsetDays;
    const milestoneDate = new Date(anniversaryDate);
    milestoneDate.setDate(milestoneDate.getDate() + offset);
    node.textContent = formatDate(milestoneDate);
  });
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
<text x='50%' y='50%' fill='#e8b4bb' font-family='sans-serif' font-size='28' text-anchor='middle'>Add assets/images/photo-${slot}.jpg</text>
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

  galleryItems.forEach((item, index) => {
    item.card.tabIndex = 0;
    item.card.setAttribute("role", "button");
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

function setupSongControls() {
  const playButton = document.getElementById("playSong");
  const replayButton = document.getElementById("replaySong");
  const statusEl = document.getElementById("songStatus");
  const audio = document.getElementById("ourSong");

  const setStatus = (text) => {
    if (statusEl) statusEl.textContent = `Song status: ${text}`;
  };

  const updatePlayButton = () => {
    if (!playButton) return;
    playButton.textContent = audio && !audio.paused ? "Pause Our Song" : "Play Our Song";
  };

  const openFallbackUrl = () => {
    if (!profile.songUrl.trim()) return;
    window.open(profile.songUrl, "_blank", "noopener,noreferrer");
  };

  const playLocalSong = async ({ fromStart = false, allowFallback = true } = {}) => {
    if (!audio) {
      if (allowFallback) openFallbackUrl();
      setStatus("fallback link opened");
      return false;
    }

    if (fromStart) audio.currentTime = 0;
    try {
      await audio.play();
      setStatus("now playing");
      updatePlayButton();
      return true;
    } catch {
      if (allowFallback) {
        openFallbackUrl();
        setStatus("audio blocked, opened fallback");
      } else {
        setStatus("tap play once to enable audio");
      }
      updatePlayButton();
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
  }

  if (playButton) {
    playButton.addEventListener("click", async () => {
      if (audio && !audio.paused) {
        pauseSong();
        return;
      }
      await playLocalSong({ fromStart: false, allowFallback: true });
    });
  }

  if (replayButton) {
    replayButton.addEventListener("click", async () => {
      await playLocalSong({ fromStart: true, allowFallback: true });
    });
  }

  setStatus("paused");
  updatePlayButton();
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

    await songControls.playLocalSong({ fromStart: false, allowFallback: false });
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
setupDailyDetails();
setupTimelineDates();
setupPhotoFallbacks();
setupGalleryLightbox();
const songControls = setupSongControls();
setupIntroGate(songControls);
