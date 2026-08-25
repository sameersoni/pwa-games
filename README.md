# Game Hub — PWA Games for iPad

A collection of browser-based games for kids, designed as a Progressive Web App (PWA) for iPad.

## Games

### 🎈 Balloon Pop
Tap the balloon showing the correct letter or number before it flies away. Supports letters, numbers, vowels, and mixed modes.

### 🚀 Shape Kitchen
Run a galactic diner — cook alien orders by adding the right shapes and counts to the pot.

### 🔤 Word Search
Find hidden words across 100 sectors while exploring progressively challenging word-search levels.

### 👅 Tongue Twister
Practice tongue twisters across 30 levels and improve speaking speed and accuracy.

## Usage

Open `index.html` in a browser to reach the game hub, then tap a game to play.

To use offline on iPad: open in Safari → Share → **Add to Home Screen**.

## Structure

```
index.html        # Game hub landing page
common.css        # Shared layout and browser styles
common.js         # Shared storage and service-worker setup
js/word-trail.js  # Word Search game controller
js/hub.js          # Game hub controller
js/balloon-pop.js  # Balloon Pop game controller
js/shape-kitchen.js# Shape Kitchen game controller
js/twist-master.js # Tongue Twister game controller
balloon-pop.html  # Balloon Pop game
shape-kitchen.html# Shape Kitchen game
word-trail.html    # Word Search game
twist-master.html   # Tongue Twister game
manifest.json     # PWA manifest
sw.js             # Service worker (offline caching)
icons/icon.svg    # App icon
```
