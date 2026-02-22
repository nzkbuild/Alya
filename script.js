const profile = {
  herName: "Your Girlfriend",
  yourName: "Your Name",
  anniversary: "2024-06-12",
  songUrl: ""
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
