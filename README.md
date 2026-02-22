# Girlfriend Exclusive Site

A static, luxury-cute one-page website designed for GitHub Pages.

## Quick customize

1. Open `script.js`.
2. Edit:
   - `herName`
   - `yourName`
   - `anniversary`
   - `songUrl` (optional)

## Local preview

Open `index.html` directly in your browser, or run a local static server.

## Deploy on GitHub Pages

1. Create a new GitHub repo.
2. From this folder (`girlfriend-exclusive-site`), run:

```powershell
git init
git add .
git commit -m "Initial exclusive site"
git branch -M main
git remote add origin https://github.com/<your-username>/<repo-name>.git
git push -u origin main
```

3. In GitHub repo settings:
   - Go to `Settings` -> `Pages`.
   - Set `Source` to `GitHub Actions`.

The included workflow (`.github/workflows/deploy-pages.yml`) will deploy automatically on each push to `main`.
