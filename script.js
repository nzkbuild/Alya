const profile = {
  herName: "Alya Batrisyia",
  yourName: "Nabil Zikri",
  anniversary: "12-12-2021",
  songUrl: "https://m.soundcloud.com/alya-batrisyia-248196262/2021a2?ref=sms&p=i&c=1&si=9FFF39989F0C49D0A895177DE3D4CD26&utm_source=sms&utm_medium=message&utm_campaign=social_sharing"
};

function bindProfileFields() {
  const fields = document.querySelectorAll("[data-bind]");
  fields.forEach((field) => {
    const key = field.getAttribute("data-bind");
    if (!key || !(key in profile)) return;

    if (key === "anniversary") {
      const date = new Date(profile.anniversary);
      field.textContent = Number.isNaN(date.getTime())
        ? profile.anniversary
        : date.toLocaleDateString(undefined, {
            year: "numeric",
            month: "long",
            day: "numeric"
          });
      return;
    }

    field.textContent = profile[key];
  });
}

function setupSongButton() {
  const songButton = document.getElementById("playSong");
  if (!songButton) return;

  songButton.addEventListener("click", () => {
    if (profile.songUrl.trim()) {
      window.open(profile.songUrl, "_blank", "noopener,noreferrer");
      return;
    }

    alert("Add your song URL in script.js to enable this button.");
  });
}

bindProfileFields();
setupSongButton();
