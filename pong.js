// Get the HTML canvas element and its 2D rendering context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game state variables
let gameRunning = false;
let playerName = 'Guest';
let gameStartTime = null;
let currentGameScore = { player: 0, ai: 0 };

// Game state object containing all game entities and their properties
const game = {
    // Player paddle configuration (left side)
    player: {
        x: 10,                              // X position from left edge
        y: canvas.height / 2 - 50,          // Y position (centered vertically)
        width: 10,                          // Paddle width in pixels
        height: 100,                        // Paddle height in pixels
        speed: 5                            // Movement speed per frame
    },
    // AI paddle configuration (right side)
    ai: {
        x: canvas.width - 20,               // X position from right edge
        y: canvas.height / 2 - 50,          // Y position (centered vertically)
        width: 10,                          // Paddle width in pixels
        height: 100,                        // Paddle height in pixels
        speed: 3                            // Movement speed per frame (slower than player)
    },
    // Ball configuration
    ball: {
        x: canvas.width / 2,                // X position (center of canvas)
        y: canvas.height / 2,               // Y position (center of canvas)
        radius: 9.6,                        // Ball radius in pixels (20% larger: 8 * 1.2)
        speedX: 4,                          // Horizontal velocity
        speedY: 3                           // Vertical velocity
    },
    // Score tracking
    score: {
        player: 0,                          // Player's current score
        ai: 0                               // AI's current score
    }
};

// Object to track which keys are currently pressed
let keys = {};

/**
 * Draws a white rectangle on the canvas
 * @param {number} x - X coordinate of top-left corner
 * @param {number} y - Y coordinate of top-left corner
 * @param {number} width - Width of the rectangle
 * @param {number} height - Height of the rectangle
 */
function drawRect(x, y, width, height) {
    ctx.fillStyle = '#fff';                 // Set fill color to white
    ctx.fillRect(x, y, width, height);      // Draw filled rectangle
}

/**
 * Draws a high-resolution realistic 3D ball with enhanced gradient shading
 * @param {number} x - X coordinate of center
 * @param {number} y - Y coordinate of center
 * @param {number} radius - Radius of the ball
 */
function draw3DBall(x, y, radius) {
    // Save current context state for high-quality rendering
    ctx.save();
    
    // Enable anti-aliasing for smoother curves
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    
    // Create primary radial gradient for 3D sphere effect with finer color stops
    const gradient = ctx.createRadialGradient(
        x - radius * 0.35, y - radius * 0.35, 0,    // Inner circle (highlight position)
        x, y, radius                                 // Outer circle (full ball)
    );
    
    // Enhanced gradient with more color stops for smoother shading
    gradient.addColorStop(0, '#ffffff');           // Bright highlight at top-left
    gradient.addColorStop(0.15, '#f8f8f8');        // Very light transition
    gradient.addColorStop(0.35, '#e8e8e8');        // Light gray
    gradient.addColorStop(0.6, '#d0d0d0');         // Medium-light gray
    gradient.addColorStop(0.8, '#b0b0b0');         // Medium gray main body
    gradient.addColorStop(0.95, '#909090');        // Darker gray
    gradient.addColorStop(1, '#707070');           // Dark shadow at edges
    
    // Draw main ball with enhanced gradient
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
    
    // Add multiple rim shadows for enhanced depth
    ctx.strokeStyle = '#555555';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(x, y, radius - 0.5, 0, Math.PI * 2);
    ctx.stroke();
    
    // Inner rim for extra definition
    ctx.strokeStyle = '#777777';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.arc(x, y, radius - 1.5, 0, Math.PI * 2);
    ctx.stroke();
    
    // Primary bright highlight spot for glossy effect
    const highlightGradient = ctx.createRadialGradient(
        x - radius * 0.45, y - radius * 0.45, 0,
        x - radius * 0.45, y - radius * 0.45, radius * 0.4
    );
    highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
    highlightGradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.6)');
    highlightGradient.addColorStop(0.7, 'rgba(255, 255, 255, 0.2)');
    highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    
    ctx.fillStyle = highlightGradient;
    ctx.beginPath();
    ctx.arc(x - radius * 0.45, y - radius * 0.45, radius * 0.4, 0, Math.PI * 2);
    ctx.fill();
    
    // Secondary smaller highlight for extra sparkle
    const sparkleGradient = ctx.createRadialGradient(
        x - radius * 0.25, y - radius * 0.25, 0,
        x - radius * 0.25, y - radius * 0.25, radius * 0.15
    );
    sparkleGradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    sparkleGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.8)');
    sparkleGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    
    ctx.fillStyle = sparkleGradient;
    ctx.beginPath();
    ctx.arc(x - radius * 0.25, y - radius * 0.25, radius * 0.15, 0, Math.PI * 2);
    ctx.fill();
    
    // Add subtle reflection on the opposite side
    const reflectionGradient = ctx.createRadialGradient(
        x + radius * 0.6, y + radius * 0.6, 0,
        x + radius * 0.6, y + radius * 0.6, radius * 0.2
    );
    reflectionGradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
    reflectionGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    
    ctx.fillStyle = reflectionGradient;
    ctx.beginPath();
    ctx.arc(x + radius * 0.6, y + radius * 0.6, radius * 0.2, 0, Math.PI * 2);
    ctx.fill();
    
    // Restore context state
    ctx.restore();
}

/**
 * Draws the center line divider with dashed pattern
 */
function drawDashedLine() {
    ctx.setLineDash([5, 15]);               // Set dash pattern: 5px line, 15px gap
    ctx.beginPath();                        // Start new path
    ctx.moveTo(canvas.width / 2, 0);        // Move to top center
    ctx.lineTo(canvas.width / 2, canvas.height); // Draw line to bottom center
    ctx.strokeStyle = '#fff';               // Set stroke color to white
    ctx.stroke();                           // Draw the line
    ctx.setLineDash([]);                    // Reset to solid line
}

/**
 * Main rendering function - draws all game elements
 */
function render() {
    // Clear the entire canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw all game elements
    drawDashedLine();                       // Center divider line
    drawRect(game.player.x, game.player.y, game.player.width, game.player.height); // Player paddle
    drawRect(game.ai.x, game.ai.y, game.ai.width, game.ai.height);                 // AI paddle
    draw3DBall(game.ball.x, game.ball.y, game.ball.radius);                       // 3D Ball
}

/**
 * Updates player paddle position based on keyboard input
 */
function updatePlayerPaddle() {
    // Move up if arrow up is pressed and paddle won't go off screen
    if (keys['ArrowUp'] && game.player.y > 0) {
        game.player.y -= game.player.speed;
    }
    // Move down if arrow down is pressed and paddle won't go off screen
    if (keys['ArrowDown'] && game.player.y < canvas.height - game.player.height) {
        game.player.y += game.player.speed;
    }
}

/**
 * Updates AI paddle position using simple tracking algorithm
 */
function updateAIPaddle() {
    // Calculate center positions for paddle and ball
    const paddleCenter = game.ai.y + game.ai.height / 2;
    const ballCenter = game.ball.y;
    
    // Move AI paddle towards ball with deadzone for realistic behavior
    if (paddleCenter < ballCenter - 35) {      // Ball is significantly below paddle
        game.ai.y += game.ai.speed;            // Move down
    } else if (paddleCenter > ballCenter + 35) { // Ball is significantly above paddle
        game.ai.y -= game.ai.speed;            // Move up
    }
    
    // Keep AI paddle within screen bounds
    if (game.ai.y < 0) game.ai.y = 0;
    if (game.ai.y > canvas.height - game.ai.height) {
        game.ai.y = canvas.height - game.ai.height;
    }
}

/**
 * Updates ball position and handles all collision detection
 */
function updateBall() {
    // Move ball according to its velocity
    game.ball.x += game.ball.speedX;
    game.ball.y += game.ball.speedY;
    
    // Bounce off top and bottom walls
    if (game.ball.y <= game.ball.radius || game.ball.y >= canvas.height - game.ball.radius) {
        game.ball.speedY = -game.ball.speedY;  // Reverse vertical direction
    }
    
    // Check collision with player paddle (left side)
    if (game.ball.x <= game.player.x + game.player.width &&
        game.ball.y >= game.player.y &&
        game.ball.y <= game.player.y + game.player.height &&
        game.ball.speedX < 0) {                // Only if ball is moving left
        
        game.ball.speedX = -game.ball.speedX;  // Reverse horizontal direction
        
        // Add angle based on where ball hits paddle (adds spin effect)
        const relativeIntersectY = (game.player.y + game.player.height / 2) - game.ball.y;
        game.ball.speedY = -relativeIntersectY * 0.1;
    }
    
    // Check collision with AI paddle (right side)
    if (game.ball.x >= game.ai.x &&
        game.ball.y >= game.ai.y &&
        game.ball.y <= game.ai.y + game.ai.height &&
        game.ball.speedX > 0) {                // Only if ball is moving right
        
        game.ball.speedX = -game.ball.speedX;  // Reverse horizontal direction
        
        // Add angle based on where ball hits paddle (adds spin effect)
        const relativeIntersectY = (game.ai.y + game.ai.height / 2) - game.ball.y;
        game.ball.speedY = -relativeIntersectY * 0.1;
    }
    
    // Check if ball went off left side (AI scores)
    if (game.ball.x < 0) {
        game.score.ai++;                       // Increment AI score
        document.getElementById('aiScore').textContent = game.score.ai; // Update display
        resetBall();                           // Reset ball position
        
        // Check for game over condition (AI reaches 10 points)
        if (game.score.ai >= 10) {
            setTimeout(() => endGame(), 1000);  // End game after 1 second delay
        }
    }
    
    // Check if ball went off right side (Player scores)
    if (game.ball.x > canvas.width) {
        game.score.player++;                   // Increment player score
        document.getElementById('playerScore').textContent = game.score.player; // Update display
        resetBall();                           // Reset ball position
        
        // Check for game over condition (Player reaches 10 points)
        if (game.score.player >= 10) {
            setTimeout(() => endGame(), 1000);  // End game after 1 second delay
        }
    }
}

/**
 * Resets ball to center position with random trajectory
 */
function resetBall() {
    game.ball.x = canvas.width / 2;           // Center horizontally
    game.ball.y = canvas.height / 2;          // Center vertically
    game.ball.speedX = -game.ball.speedX;     // Reverse horizontal direction
    game.ball.speedY = Math.random() * 6 - 3; // Random vertical speed (-3 to 3)
}

/**
 * Main game loop - runs every frame
 */
function gameLoop() {
    if (!gameRunning) return;                 // Stop loop if game not running
    
    updatePlayerPaddle();                     // Update player position
    updateAIPaddle();                         // Update AI position
    updateBall();                             // Update ball position and collisions
    render();                                 // Draw everything
    requestAnimationFrame(gameLoop);          // Schedule next frame
}

// Event listener for key press events
document.addEventListener('keydown', (e) => {
    keys[e.key] = true;                       // Mark key as pressed
    
    // Handle quit keys (Escape or Q) - only during gameplay
    if ((e.key === 'Escape' || e.key === 'q' || e.key === 'Q') && gameRunning) {
        // End current game and show leaderboard
        if (confirm('Are you sure you want to quit the current game?')) {
            endGame();
        }
    }
    
    // Handle leaderboard toggle (L key) - only during gameplay
    if ((e.key === 'l' || e.key === 'L') && gameRunning) {
        const leaderboardDiv = document.querySelector('.leaderboard');
        leaderboardDiv.style.display = leaderboardDiv.style.display === 'none' ? 'block' : 'none';
    }
});

// Event listener for key release events
document.addEventListener('keyup', (e) => {
    keys[e.key] = false;                      // Mark key as released
});

// Event listener for mouse wheel events (alternative control)
canvas.addEventListener('wheel', (e) => {
    e.preventDefault();                       // Prevent page scrolling
    
    // Scroll up - move paddle up
    if (e.deltaY < 0 && game.player.y > 0) {
        game.player.y -= game.player.speed * 2; // Double speed for responsiveness
    }
    // Scroll down - move paddle down
    if (e.deltaY > 0 && game.player.y < canvas.height - game.player.height) {
        game.player.y += game.player.speed * 2; // Double speed for responsiveness
    }
});

/**
 * Leaderboard management system
 */
const leaderboard = {
    // Get leaderboard data from localStorage
    getData() {
        const data = localStorage.getItem('pongLeaderboard');
        return data ? JSON.parse(data) : [];
    },
    
    // Save leaderboard data to localStorage
    saveData(data) {
        localStorage.setItem('pongLeaderboard', JSON.stringify(data));
    },
    
    // Add a new score entry
    addScore(name, score, duration) {
        const scores = this.getData();
        scores.push({
            name: name,
            score: score,
            duration: duration,
            date: new Date().toLocaleDateString()
        });
        
        // Sort by score (descending), then by duration (ascending for tie-breaking)
        scores.sort((a, b) => {
            if (b.score !== a.score) return b.score - a.score;
            return a.duration - b.duration;
        });
        
        // Keep only top 10 scores
        const topScores = scores.slice(0, 10);
        this.saveData(topScores);
        this.updateDisplay();
        return topScores;
    },
    
    // Update the leaderboard display
    updateDisplay() {
        const scores = this.getData();
        const leaderboardList = document.getElementById('leaderboardList');
        
        if (scores.length === 0) {
            leaderboardList.innerHTML = '<li>No scores yet</li>';
            return;
        }
        
        leaderboardList.innerHTML = scores.map((score, index) => {
            const minutes = Math.floor(score.duration / 60);
            const seconds = (score.duration % 60).toFixed(1);
            const timeStr = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
            
            return `<li><strong>${score.name}</strong> - ${score.score} pts (${timeStr})</li>`;
        }).join('');
    }
};

/**
 * Game initialization and flow control
 */
function startGame() {
    const nameInput = document.getElementById('playerNameInput');
    const enteredName = nameInput.value.trim();
    
    // Set player name
    playerName = enteredName || 'Guest';
    document.getElementById('playerName').textContent = playerName;
    
    // Hide modal and show game
    document.getElementById('nameModal').classList.add('hidden');
    document.getElementById('gameCanvas').classList.remove('hidden');
    document.getElementById('gameControls').classList.remove('hidden');
    
    // Reset game state
    resetGameState();
    gameRunning = true;
    gameStartTime = Date.now();
    
    // Start the game loop
    gameLoop();
}

/**
 * Reset all game elements to initial state
 */
function resetGameState() {
    // Reset scores
    game.score.player = 0;
    game.score.ai = 0;
    currentGameScore = { player: 0, ai: 0 };
    
    // Update score display
    document.getElementById('playerScore').textContent = game.score.player;
    document.getElementById('aiScore').textContent = game.score.ai;
    
    // Reset ball position
    game.ball.x = canvas.width / 2;
    game.ball.y = canvas.height / 2;
    game.ball.speedX = 4;
    game.ball.speedY = 3;
    
    // Reset paddle positions
    game.player.y = canvas.height / 2 - 50;
    game.ai.y = canvas.height / 2 - 50;
}

/**
 * Handle game over and add score to leaderboard
 */
function endGame() {
    gameRunning = false;
    const gameEndTime = Date.now();
    const gameDuration = (gameEndTime - gameStartTime) / 1000; // Convert to seconds
    
    // Determine final score (player's score)
    const finalScore = game.score.player;
    
    // Add to leaderboard
    leaderboard.addScore(playerName, finalScore, gameDuration);
    
    // Show game over message
    setTimeout(() => {
        const message = `Game Over!\n${playerName} scored ${finalScore} points\nTime played: ${gameDuration.toFixed(1)} seconds\n\nPress OK to play again.`;
        if (confirm(message)) {
            // Show name input again for new game
            document.getElementById('nameModal').classList.remove('hidden');
            document.getElementById('gameCanvas').classList.add('hidden');
            document.getElementById('gameControls').classList.add('hidden');
            document.getElementById('playerNameInput').value = playerName; // Pre-fill current name
        }
    }, 500);
}

// Initialize leaderboard display on page load
leaderboard.updateDisplay();

// Allow Enter key to start game from name input
document.getElementById('playerNameInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        startGame();
    }
});