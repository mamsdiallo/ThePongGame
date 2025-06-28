# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a vanilla JavaScript implementation of the classic Pong game using HTML5 Canvas. The project serves as a learning exercise for Claude Code development and demonstrates basic 2D game programming concepts.

## Running the Project

**Primary method**: Open `index.html` directly in any modern web browser - no build process or server required.

**Alternative (for development)**: Use a simple HTTP server if needed:
- Python: `python -m http.server 8000`
- Node.js: `npx serve .`

## Code Architecture

The project uses a simple single-file architecture with all game logic contained in `pong.js`:

### Core Game Object Structure
- `game.player` - Left paddle (human-controlled)
- `game.ai` - Right paddle (AI-controlled) 
- `game.ball` - Ball physics and position
- `game.score` - Score tracking for both players

### Key Systems
- **Rendering**: Canvas-based drawing with separate functions for rectangles, circles, and dashed lines
- **Input**: Dual control scheme supporting both arrow keys and mouse wheel
- **AI**: Simple tracking algorithm with deadzone for realistic behavior
- **Physics**: Basic collision detection with paddle angle effects on ball trajectory

## Game Controls
- **Arrow Keys**: Up/Down arrows to move player paddle
- **Mouse Wheel**: Scroll up/down to move player paddle (2x speed)
- **Quit Game**: ESC or Q key to exit with confirmation dialog

## Development Notes

- No build system, package manager, or dependencies required
- All code is vanilla JavaScript with extensive commenting
- Game loop uses `requestAnimationFrame` for smooth 60fps rendering
- Canvas size is fixed at 800x400 pixels
- AI difficulty is controlled by `game.ai.speed` (currently 3) and deadzone of 35 pixels

## File Structure

```
index.html  - HTML page with canvas and score display
pong.js     - Complete game implementation  
README.md   - Project objectives and controls reference
DEVBOOK     - Development activity log
```

## Code Quality Standards

The existing codebase demonstrates:
- Comprehensive inline documentation with JSDoc-style comments
- Consistent naming conventions using camelCase
- Proper separation of concerns (rendering, physics, input)
- Clean function organization with single responsibilities

When making changes, maintain the same commenting style and code organization patterns.