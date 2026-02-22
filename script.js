const profile = {
  herName: "Alya Batrisyia",
  yourName: "Nabil Zikri",
  anniversary: "12-12-2021",
  songUrl:
    "https://m.soundcloud.com/alya-batrisyia-248196262/2021a2?ref=sms&p=i&c=1&si=9FFF39989F0C49D0A895177DE3D4CD26&utm_source=sms&utm_medium=message&utm_campaign=social_sharing"
};

const INTRO_STORAGE_KEY = "alya_intro_accepted_v1";
const VISUAL_MODE_STORAGE_KEY = "alya_visual_mode_v1";
const PRIVACY_STORAGE_KEY = "alya_privacy_mode_v1";
const NO_BUTTON_STATES = ["No", "Are you sure?", "Really?", "Last chance", "Yes"];
const VISUAL_MODE = { high: "visual-high", smooth: "visual-smooth" };
const DAILY_MESSAGES = [
  "You are my favorite part of every day.",
  "Still choosing you, forever.",
  "I adore you more than yesterday.",
  "Home is wherever you smile.",
  "You make ordinary days feel golden."
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

function setupVisualMode() {
  const toggleButton = document.getElementById("toggleVisualMode");
  const prefersSmoothDefault = navigator.userAgent.includes("Windows");
  const storedMode = localStorage.getItem(VISUAL_MODE_STORAGE_KEY);
  let currentMode = storedMode || (prefersSmoothDefault ? VISUAL_MODE.smooth : VISUAL_MODE.high);

  const applyMode = (mode) => {
    currentMode = mode;
    document.body.classList.remove(VISUAL_MODE.high, VISUAL_MODE.smooth);
    document.body.classList.add(mode);
    localStorage.setItem(VISUAL_MODE_STORAGE_KEY, mode);
    if (toggleButton) {
      toggleButton.textContent =
        mode === VISUAL_MODE.smooth ? "Switch to High Visual" : "Switch to Smooth Visual";
    }
  };

  applyMode(currentMode);

  if (toggleButton) {
    toggleButton.addEventListener("click", () => {
      applyMode(currentMode === VISUAL_MODE.smooth ? VISUAL_MODE.high : VISUAL_MODE.smooth);
    });
  }
}

function setupPrivacyToggle() {
  const togglePrivacyButton = document.getElementById("togglePrivacy");
  if (!togglePrivacyButton) return;

  const stored = localStorage.getItem(PRIVACY_STORAGE_KEY) === "true";

  const applyPrivacy = (hidden) => {
    document.body.classList.toggle("privacy-hidden", hidden);
    localStorage.setItem(PRIVACY_STORAGE_KEY, hidden ? "true" : "false");
    togglePrivacyButton.textContent = hidden ? "Show Private Page" : "Hide for Privacy";
  };

  applyPrivacy(stored);
  togglePrivacyButton.addEventListener("click", () => {
    applyPrivacy(!document.body.classList.contains("privacy-hidden"));
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

  if (!introGate || !yesButton || !noButton) {
    document.body.classList.remove("intro-locked");
    document.body.classList.add("intro-unlocked");
    return;
  }

  let noStep = 0;
  const finalNoIndex = NO_BUTTON_STATES.length - 1;

  const resetIntroButtons = () => {
    noStep = 0;
    noButton.textContent = NO_BUTTON_STATES[0];
    noButton.classList.remove("is-yes");
    noButton.removeAttribute("aria-label");
    yesButton.style.setProperty("--yes-scale", "1");
  };

  const setYesScale = (step) => {
    const scale = Math.min(1 + step * 0.13, 1.78);
    yesButton.style.setProperty("--yes-scale", scale.toFixed(2));
  };

  const unlockExperience = async () => {
    document.body.classList.remove("intro-locked");
    document.body.classList.add("intro-unlocked");
    localStorage.setItem(INTRO_STORAGE_KEY, "yes");
    triggerHeartBurst(heartBurst);

    window.setTimeout(() => {
      introGate.hidden = true;
      const primaryAction = document.getElementById("playSong");
      if (primaryAction) primaryAction.focus();
    }, 430);

    await songControls.playLocalSong({ fromStart: false, allowFallback: false });
  };

  const showIntroAgain = () => {
    localStorage.removeItem(INTRO_STORAGE_KEY);
    songControls.pauseSong();
    resetIntroButtons();
    introGate.hidden = false;
    document.body.classList.remove("intro-unlocked");
    document.body.classList.add("intro-locked");
    window.scrollTo({ top: 0, behavior: "smooth" });
    yesButton.focus();
  };

  if (replayIntro) {
    replayIntro.addEventListener("click", showIntroAgain);
  }

  if (localStorage.getItem(INTRO_STORAGE_KEY) === "yes") {
    introGate.hidden = true;
    document.body.classList.remove("intro-locked");
    document.body.classList.add("intro-unlocked");
    return;
  }

  yesButton.addEventListener("click", unlockExperience);

  noButton.addEventListener("click", () => {
    if (noStep >= finalNoIndex) {
      unlockExperience();
      return;
    }

    noStep = Math.min(noStep + 1, finalNoIndex);
    noButton.textContent = NO_BUTTON_STATES[noStep];
    setYesScale(noStep);

    if (noStep >= finalNoIndex) {
      noButton.classList.add("is-yes");
      noButton.setAttribute("aria-label", "Yes, forever");
    }
  });
}

bindProfileFields();
setupDailyDetails();
setupVisualMode();
setupPrivacyToggle();
setupPhotoFallbacks();
const songControls = setupSongControls();
setupIntroGate(songControls);
