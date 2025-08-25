# Color Ring - Mobile HTML5 Game

A mobile-first HTML5 game where you control a colored ball orbiting the center while avoiding approaching rings. Match the ball's color with the correct ring segment to score points!

## Features

- **Mobile-First Design**: Optimized for touch devices with responsive controls
- **3D Depth Effect**: Rings approach with realistic depth of field
- **Color Matching**: Ball changes color after each successful hit
- **Progressive Difficulty**: Game speed increases as you score more points
- **Touch Controls**: Drag left/right to rotate the ball
- **Score Tracking**: Local storage for best score persistence
- **Beautiful Visuals**: Glowing effects, particle trails, and starry background

## How to Play

1. **Objective**: Hit the colored wall matching the ball's color
2. **Controls**: Drag left/right on the screen to rotate the ball
3. **Scoring**: +1 point for each successful color match
4. **Game Over**: Hitting the wrong color segment ends the game

## Game Mechanics

- The ball orbits around the center in a circular path
- Rings approach from the distance with 3D perspective
- Each ring has 2-4 colored segments
- The ball must align with a segment of the same color when the ring reaches the hit plane
- After a successful hit, the ball changes to the next color in the sequence
- Game speed increases with each successful hit

## Installation & Running

1. **Download**: Clone or download this repository
2. **Open**: Simply open `index.html` in a modern web browser
3. **Play**: Click "START GAME" to begin
4. **Mobile**: For best experience, open on a mobile device or use browser dev tools to simulate mobile

## Browser Compatibility

- Chrome (recommended)
- Firefox
- Safari
- Edge
- Mobile browsers (iOS Safari, Chrome Mobile)

## Controls

- **Touch/Mouse**: Drag left/right to rotate the ball
- **Start Button**: Begin a new game
- **Restart Button**: Play again after game over
- **Close Button**: Dismiss the how-to-play instructions

## Technical Details

- **Canvas 2D**: Uses HTML5 Canvas for smooth graphics
- **Touch Events**: Optimized for mobile touch input
- **Responsive Design**: Adapts to any screen size
- **Local Storage**: Saves best score between sessions
- **60 FPS**: Smooth animation using requestAnimationFrame

## File Structure

```
Color Ring/
├── index.html      # Main HTML file with UI and styling
├── game.js         # Core game logic and mechanics
└── README.md       # This file
```

## Development

The game is built with vanilla JavaScript and HTML5 Canvas. No external dependencies or build tools required. Simply edit the files and refresh the browser to see changes.

## License

This project is open source and available under the MIT License.

---

**Enjoy playing Color Ring!** 🎮✨
