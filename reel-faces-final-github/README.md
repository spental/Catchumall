# Reel Faces

Reel Faces is a GitHub Pages-ready fishing game where **every fish always uses the same image file**. The score is based on the **total weight** of all fish caught in a timed round.

## How the image works
This version does **not** ask players to upload a photo. The provided fish-person artwork is included as the fixed catch.

Instead, the game always uses:

`assets/catch.png`

Every catch shows the full fish-person illustration. If you want to change the catch later, replace that image file with another using the same filename.

## Features
- Fixed catch image for every fish
- Tap or click fish to catch them
- Weight-based scoring
- Best catch tracking
- High score stored on the device
- Installable as a PWA on phone or desktop

## GitHub Setup
1. Create a GitHub repository.
2. Upload all files in this folder to the repository root.
3. Make sure `assets/catch.png` is included.
4. In **Settings > Pages**, enable GitHub Pages from the `main` branch and `/root`.
5. Open the site URL and test it in a browser.

## Notes
- High score is currently stored in the browser using localStorage.
- To change the face image later, replace `assets/catch.png` and re-upload it to GitHub.
- Future upgrades can include shared leaderboards, sound effects, boss fish, or tournaments.
