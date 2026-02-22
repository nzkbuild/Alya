const profile = {
  herName: "Alya Batrisyia",
  yourName: "Nabil Zikri",
  anniversary: "12-12-2021",
  songUrl: "https://m.soundcloud.com/alya-batrisyia-248196262/2021a2?ref=sms&p=i&c=1&si=9FFF39989F0C49D0A895177DE3D4CD26&utm_source=sms&utm_medium=message&utm_campaign=social_sharing"
};

const INTRO_STORAGE_KEY = "alya_intro_accepted_v1";
const NO_BUTTON_STATES = ["No", "Are you sure?", "Really?", "Last chance", "Yes"];

function parseAnniversary(rawValue) {
  const normalized = String(rawValue || "").trim();
  if (!normalized) return null;

  const defaultDate = new Date(normalized);
  if (!Number.isNaN(defaultDate.getTime())) {
    return defaultDate;
  }

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

function setupSongControls() {
  const songButton = document.getElementById("playSong");
  const audio = document.getElementById("ourSong");

  if (!songButton) return { playLocalSong: async () => false };

  const updateSongButton = () => {
    if (audio && !audio.paused) {
      songButton.textContent = "Pause Our Song";
    } else {
      songButton.textContent = "Play Our Song";
    }
  };

  const playLocalSong = async () => {
    if (!audio) return false;
    try {
      await audio.play();
      updateSongButton();
      return true;
    } catch {
      updateSongButton();
      return false;
    }
  };

  const pauseLocalSong = () => {
    if (!audio) return;
    audio.pause();
    updateSongButton();
  };

  if (audio) {
    audio.addEventListener("ended", updateSongButton);
    audio.addEventListener("pause", updateSongButton);
    audio.addEventListener("play", updateSongButton);
  }

  songButton.addEventListener("click", async () => {
    if (audio) {
      if (!audio.paused) {
        pauseLocalSong();
        return;
      }

      const played = await playLocalSong();
      if (!played && profile.songUrl.trim()) {
        window.open(profile.songUrl, "_blank", "noopener,noreferrer");
      }
      return;
    }

    if (profile.songUrl.trim()) {
      window.open(profile.songUrl, "_blank", "noopener,noreferrer");
      return;
    }

    alert("No local song found and no fallback URL configured.");
  });

  updateSongButton();
  return { playLocalSong };
}

function triggerHeartBurst(container) {
  if (!container) return;

  container.innerHTML = "";
  const heartCount = 18;

  for (let i = 0; i < heartCount; i += 1) {
    const heart = document.createElement("span");
    const offsetX = Math.round((Math.random() - 0.5) * 260);
    const offsetY = Math.round(-80 - Math.random() * 220);
    const scale = (0.65 + Math.random() * 1.15).toFixed(2);
    heart.style.setProperty("--burst-x", `${offsetX}px`);
    heart.style.setProperty("--burst-y", `${offsetY}px`);
    heart.style.setProperty("--burst-scale", scale);
    heart.textContent = Math.random() > 0.25 ? "♡" : "♥";
    container.appendChild(heart);
  }

  window.setTimeout(() => {
    container.innerHTML = "";
  }, 900);
}

function setupIntroGate(playLocalSong) {
  const introGate = document.getElementById("introGate");
  const yesButton = document.getElementById("yesBtn");
  const noButton = document.getElementById("noBtn");
  const heartBurst = document.getElementById("heartBurst");
  const siteShell = document.getElementById("siteShell");

  if (!introGate || !yesButton || !noButton || !siteShell) {
    document.body.classList.remove("intro-locked");
    document.body.classList.add("intro-unlocked");
    return;
  }

  let noStep = 0;
  const finalNoIndex = NO_BUTTON_STATES.length - 1;

  const setYesScale = (step) => {
    const scale = Math.min(1 + step * 0.13, 1.78);
    yesButton.style.setProperty("--yes-scale", scale.toFixed(2));
  };

  const unlockExperience = async (attemptAutoPlay) => {
    document.body.classList.remove("intro-locked");
    document.body.classList.add("intro-unlocked");
    localStorage.setItem(INTRO_STORAGE_KEY, "yes");

    triggerHeartBurst(heartBurst);

    window.setTimeout(() => {
      introGate.setAttribute("hidden", "hidden");
      const primaryAction = document.getElementById("playSong");
      if (primaryAction) primaryAction.focus();
    }, 430);

    if (attemptAutoPlay) {
      await playLocalSong();
    }
  };

  if (localStorage.getItem(INTRO_STORAGE_KEY) === "yes") {
    document.body.classList.remove("intro-locked");
    document.body.classList.add("intro-unlocked");
    introGate.setAttribute("hidden", "hidden");
    return;
  }

  const bumpNoState = () => {
    noStep = Math.min(noStep + 1, finalNoIndex);
    noButton.textContent = NO_BUTTON_STATES[noStep];
    setYesScale(noStep);

    if (noStep >= finalNoIndex) {
      noButton.classList.add("is-yes");
      noButton.setAttribute("aria-label", "Yes, forever");
    }
  };

  yesButton.addEventListener("click", () => {
    unlockExperience(true);
  });

  noButton.addEventListener("click", () => {
    if (noStep >= finalNoIndex) {
      unlockExperience(true);
      return;
    }

    bumpNoState();
  });
}

bindProfileFields();
const { playLocalSong } = setupSongControls();
setupIntroGate(playLocalSong);
