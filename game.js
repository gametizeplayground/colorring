class ColorRingGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.ui = document.getElementById('ui');
        
        this.gameState = 'menu'; // menu, playing, gameOverDelay, gameOver
        this.score = 0;
        this.bestScore = localStorage.getItem('colorRingBestScore') || 0;
        this.gameOverDelay = 0;
        this.isGameOverTriggered = false;
        this.combo = 0;
        this.maxCombo = 0;
        
        // Background music
        this.backgroundMusic = new Audio('assets/soundtrack.MP3');
        this.backgroundMusic.loop = true;
        this.backgroundMusic.volume = 0.7; // Set volume to 70%
        
        // Preload music to ensure it's ready
        this.backgroundMusic.load();
        
        // Initialize music button state
        this.updateMusicButton();
        
        this.ball = {
            x: 0,
            y: 0,
            radius: 20,
            color: '#FF6B35',
            angle: 0,
            orbitRadius: 150,
            trail: []
        };
        
        this.rings = [];
        this.ringSpeed = 6; // Start speed: 15 units/sec
        this.maxRingSpeed = 10; // Cap speed at 12 units/sec
        this.speedIncrement = 0.2; // +0.6 units/sec per hit
        this.ringSpawnTimer = 0;
        this.ringSpawnInterval = 80; // Spawn more frequently since they start further away
        this.particles = [];
        this.burstParticles = [];
        this.scorePopups = [];
        
        this.colors = ['#FF6B35', '#FFD93D', '#6BCF7F', '#4D96FF', '#FF6B9D'];
        this.currentColorIndex = 0;
        
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.isDragging = false;
        
        this.stars = [];
        this.starTrails = [];
        this.createStars();
        
        this.setupCanvas();
        this.setupEventListeners();
        this.canvas.classList.add('menu-cursor');
        this.updateUI();
        this.gameLoop();
    }
    
    setupCanvas() {
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
    }
    
    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.centerX = this.canvas.width / 2;
        this.centerY = (this.canvas.height / 2) + 50; // Move gameplay elements down by 80px
    }
    
    createStars() {
        for (let i = 0; i < 100; i++) {
            this.stars.push({
                x: Math.random() * window.innerWidth,
                y: Math.random() * window.innerHeight,
                z: Math.random() * 2000, // Depth from 0 to 2000
                size: Math.random() * 3 + 1, // Different star sizes
                opacity: Math.random() * 0.8 + 0.2,
                speed: Math.random() * 2 + 1, // Faster movement
                color: Math.random() > 0.8 ? '#FFFFFF' : '#E6E6FA' // Some stars slightly blue
            });
        }
    }
    
    createBurstEffect(x, y, color, count = 15) {
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 * i) / count;
            const speed = Math.random() * 4 + 3;
            this.burstParticles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                color: color,
                life: 45,
                maxLife: 45,
                size: Math.random() * 5 + 3
            });
        }
    }
    
    createScorePopup(x, y, points, color, combo = 0) {
        this.scorePopups.push({
            x: x,
            y: y,
            points: points,
            color: color, // Store the color of the matched segment
            combo: combo, // Store combo count
            life: 90,
            maxLife: 90,
            vy: -2 // Float upward
        });
    }
    
    createBallExplosion(x, y) {
        for (let i = 0; i < 25; i++) {
            const angle = (Math.PI * 2 * i) / 25;
            const speed = Math.random() * 4 + 3;
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                color: this.ball.color,
                life: 90,
                maxLife: 90,
                size: Math.random() * 6 + 3
            });
        }
    }
    
    shakeRing(ring) {
        ring.shake = 30; // Shake for 30 frames
        ring.shakeIntensity = 15; // Initial shake intensity
    }
    
    setupEventListeners() {
        // Touch events
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            this.touchStartX = touch.clientX;
            this.touchStartY = touch.clientY;
            this.isDragging = true;
        });
        
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (this.isDragging && this.gameState === 'playing') {
                const touch = e.touches[0];
                const deltaX = touch.clientX - this.touchStartX;
                this.ball.angle += deltaX * 0.01;
                this.touchStartX = touch.clientX;
                this.touchStartY = touch.clientY;
            }
        });
        
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.isDragging = false;
        });
        
        // Mouse events for desktop
        this.canvas.addEventListener('mousedown', (e) => {
            this.touchStartX = e.clientX;
            this.touchStartY = e.clientY;
            this.isDragging = true;
        });
        
        this.canvas.addEventListener('mousemove', (e) => {
            if (this.isDragging && this.gameState === 'playing') {
                const deltaX = e.clientX - this.touchStartX;
                this.ball.angle += deltaX * 0.01;
                this.touchStartX = e.clientX;
                this.touchStartY = e.clientY;
            }
        });
        
        this.canvas.addEventListener('mouseup', () => {
            this.isDragging = false;
        });
        
        // Start game on any click/touch
        this.canvas.addEventListener('click', () => {
            if (this.gameState === 'menu') {
                this.startGame();
            }
        });
        
        this.canvas.addEventListener('touchstart', (e) => {
            if (this.gameState === 'menu') {
                e.preventDefault();
                this.startGame();
            }
        });
        
        document.getElementById('restartBtn').addEventListener('click', () => {
            this.restartGame();
        });
        
        document.getElementById('closeBtn').addEventListener('click', () => {
            document.getElementById('howToPlay').style.display = 'none';
        });
        
        // Music control button
        document.getElementById('musicControl').addEventListener('click', () => {
            this.toggleMusic();
            this.updateMusicButton();
        });
        
        // Show how to play on first visit
        if (!localStorage.getItem('colorRingFirstVisit')) {
            localStorage.setItem('colorRingFirstVisit', 'true');
            document.getElementById('howToPlay').style.display = 'block';
        }
    }
    
    startGame() {
        this.gameState = 'playing';
        this.score = 0;
        this.rings = [];
        this.particles = [];
        this.burstParticles = [];
        this.scorePopups = [];
        this.ringSpawnTimer = 0;
        this.ringSpawnInterval = 80; // Reset spawn interval
        this.currentColorIndex = 0;
        this.ringSpeed = 6; // Reset to start speed
        this.ball.color = this.colors[this.currentColorIndex];
        this.ball.angle = 0;
        this.ball.trail = []; // Reset trail
        this.isGameOverTriggered = false;
        this.combo = 0;
        this.maxCombo = 0;
        
        document.getElementById('handDemo').style.display = 'none';
        document.getElementById('startScreenElements').style.display = 'none';
        document.getElementById('gameOver').style.display = 'none';
        
        // Start background music
        this.backgroundMusic.play().catch(error => {
            console.log('Music autoplay blocked:', error);
        });
        
        // Update music button state
        this.updateMusicButton();
        
        // Change title to show score
        const gameTitle = document.getElementById('gameTitle');
        gameTitle.classList.add('gameMode');
        gameTitle.querySelector('.titleColor').textContent = '0';
        gameTitle.querySelector('.titleRing').style.display = 'none';
        
        this.canvas.classList.remove('menu-cursor');
        // Keep cursor visible during gameplay
        this.updateUI();
    }
    
    restartGame() {
        this.gameState = 'menu';
        document.getElementById('handDemo').style.display = 'block';
        document.getElementById('startScreenElements').style.display = 'block';
        document.getElementById('gameOver').style.display = 'none';
        
        // Restore original title
        const gameTitle = document.getElementById('gameTitle');
        gameTitle.classList.remove('gameMode');
        gameTitle.querySelector('.titleColor').textContent = 'COLOUR';
        gameTitle.querySelector('.titleRing').style.display = 'block';
        
        // Reset cursor to menu state
        this.canvas.classList.add('menu-cursor');
        this.isGameOverTriggered = false;
        
        // Hide combo counter when returning to menu
        const comboCounter = document.getElementById('comboCounter');
        if (comboCounter) {
            comboCounter.style.display = 'none';
        }
        
        // Pause background music when returning to menu
        this.backgroundMusic.pause();
        this.backgroundMusic.currentTime = 0; // Reset to beginning
        this.updateMusicButton(); // Update button state
        
        this.startGame();
    }
    
    spawnRing() {
        const ring = {
            segments: this.generateRingSegments(),
            z: 1000, // Start much further away
            radius: 150,
            thickness: 20,
            speed: this.ringSpeed,
            shake: 0, // Shake effect counter
            shakeIntensity: 0 // Current shake intensity
        };
        this.rings.push(ring);
    }
    
    generateRingSegments() {
        // Determine segment count based on score
        let segmentCount;
        if (this.score > 10) {
            // Score > 10: Randomize between 2, 3, or 4 segments
            segmentCount = Math.floor(Math.random() * 3) + 2;
        } else {
            // Score <= 10: Always 2 segments for easier gameplay
            segmentCount = 2;
        }
        
        const segments = [];
        const colors = [...this.colors];
        
        // Always ensure the ball's current color is included
        const ballColor = this.ball.color;
        const ringColors = [ballColor]; // Start with ball's color
        
        // Remove ball color from available colors to avoid duplicates
        const remainingColors = colors.filter(color => color !== ballColor);
        
        // Fill remaining segments with other colors
        for (let i = 1; i < segmentCount; i++) {
            if (remainingColors.length > 0) {
                const randomIndex = Math.floor(Math.random() * remainingColors.length);
                const color = remainingColors.splice(randomIndex, 1)[0];
                ringColors.push(color);
            }
        }
        
        // Shuffle the colors so ball color isn't always in the same position
        for (let i = ringColors.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [ringColors[i], ringColors[j]] = [ringColors[j], ringColors[i]];
        }
        
        // Generate non-equal segment ratios
        const ratios = this.generateNonEqualRatios(segmentCount);
        
        // Create segments with the selected colors and ratios
        let currentAngle = 0;
        for (let i = 0; i < segmentCount; i++) {
            const segmentAngle = (ratios[i] / 100) * Math.PI * 2;
            const startAngle = currentAngle;
            const endAngle = currentAngle + segmentAngle;
            
            segments.push({
                startAngle,
                endAngle,
                color: ringColors[i]
            });
            
            currentAngle = endAngle;
        }
        
        return segments;
    }
    
    generateNonEqualRatios(segmentCount) {
        const ratios = [];
        
        if (segmentCount === 2) {
            // 2 segments: 80:20, 70:30, 60:40
            const options = [[80, 20], [70, 30], [60, 40]];
            return options[Math.floor(Math.random() * options.length)];
        } else if (segmentCount === 3) {
            // 3 segments: 50:30:20, 40:35:25, 45:30:25
            const options = [[50, 30, 20], [40, 35, 25], [45, 30, 25]];
            return options[Math.floor(Math.random() * options.length)];
        } else if (segmentCount === 4) {
            // 4 segments: 40:30:20:10, 35:25:25:15, 30:25:25:20
            const options = [[40, 30, 20, 10], [35, 25, 25, 15], [30, 25, 25, 20]];
            return options[Math.floor(Math.random() * options.length)];
        }
        
        // Fallback to equal segments if something goes wrong
        const equalRatio = 100 / segmentCount;
        for (let i = 0; i < segmentCount; i++) {
            ratios.push(equalRatio);
        }
        return ratios;
    }
    
    update() {
        // Always update star field (background effect) regardless of game state
        this.updateStars();
        this.updateStarTrails();
        
        if (this.gameState === 'menu') return;
        
        // Update ball position
        this.ball.x = this.centerX + Math.cos(this.ball.angle) * this.ball.orbitRadius;
        this.ball.y = this.centerY + Math.sin(this.ball.angle) * this.ball.orbitRadius;
        
        // Update fluid trail with elasticity
        this.updateFluidTrail();
        
        // Update particles
        this.updateParticles();
        this.updateBurstParticles();
        this.updateScorePopups();
        
        // Handle game over delay
        if (this.gameState === 'gameOverDelay') {
            this.gameOverDelay--;
            if (this.gameOverDelay <= 0) {
                this.gameOver();
                return;
            }
        }
        
        // Only update game logic if playing
        if (this.gameState !== 'playing') return;
        
        // Spawn rings
        this.ringSpawnTimer++;
        if (this.ringSpawnTimer >= this.ringSpawnInterval) {
            this.spawnRing();
            this.ringSpawnTimer = 0;
            this.ringSpawnInterval = Math.max(60, this.ringSpawnInterval - 0.5); // Gradual decrease
        }
        
        // Update rings
        for (let i = this.rings.length - 1; i >= 0; i--) {
            const ring = this.rings[i];
            ring.z -= ring.speed;
            
            // Check collision when ring reaches the ball's orbit level
            if (ring.z <= 150 && ring.z > 130) {
                if (this.checkCollision(ring)) {
                    // Find which segment the ball is hitting
                    const ballAngle = Math.atan2(this.ball.y - this.centerY, this.ball.x - this.centerX);
                    let normalizedAngle = ballAngle;
                    if (normalizedAngle < 0) normalizedAngle += Math.PI * 2;
                    
                    const hitSegment = ring.segments.find(seg => {
                        let startAngle = seg.startAngle;
                        let endAngle = seg.endAngle;
                        
                        // Handle angle wrapping
                        if (startAngle > endAngle) {
                            return normalizedAngle >= startAngle || normalizedAngle <= endAngle;
                        } else {
                            return normalizedAngle >= startAngle && normalizedAngle <= endAngle;
                        }
                    });
                    
                    if (hitSegment && hitSegment.color === this.ball.color) {
                        // Success - correct color hit
                        this.combo++;
                        this.maxCombo = Math.max(this.maxCombo, this.combo);
                        
                        // Calculate combo bonus points
                        const basePoints = 1;
                        const comboBonus = Math.floor(this.combo / 3); // Bonus every 3 hits
                        const totalPoints = basePoints + comboBonus;
                        
                        this.score += totalPoints;
                        this.rings.splice(i, 1);
                        
                        // Create burst effect at ball position
                        this.createBurstEffect(this.ball.x, this.ball.y, this.ball.color, 20);
                        
                                // Create combo score popup with bonus points
        this.createScorePopup(this.ball.x, this.ball.y, totalPoints, hitSegment.color, this.combo);
        
        // Change ball color to match the next ring's available colors
        this.changeBallColorToMatchNextRing();
        
        // Increase difficulty with speed ramp
        this.ringSpeed = Math.min(this.ringSpeed + this.speedIncrement, this.maxRingSpeed);
        
        this.updateUI();
        this.updateComboDisplay();
        continue;
                    } else if (!this.isGameOverTriggered) {
                        // Game over - wrong color hit (only trigger once)
                        this.isGameOverTriggered = true;
                        this.combo = 0; // Reset combo on miss
                        this.updateComboDisplay(); // Hide combo counter
                        this.createBallExplosion(this.ball.x, this.ball.y);
                        
                        // Shake the ring that was hit
                        this.shakeRing(ring);
                        
                        // Delay game over to show effects
                        this.gameOverDelay = 60; // 60 frames = 1 second at 60fps
                        this.gameState = 'gameOverDelay';
                        return;
                    }
                }
            }
            
            // Remove rings that are too close
            if (ring.z < 100) {
                this.rings.splice(i, 1);
            }
        }
    }
    
    changeBallColorToMatchNextRing() {
        // Get all available colors from the next ring (if it exists)
        if (this.rings.length > 0) {
            const nextRing = this.rings[0];
            const availableColors = nextRing.segments.map(seg => seg.color);
            
            // Find a color that's available in the next ring
            const matchingColor = availableColors.find(color => color !== this.ball.color);
            if (matchingColor) {
                this.ball.color = matchingColor;
            } else {
                // If no matching color found, pick a random one from available colors
                this.ball.color = availableColors[Math.floor(Math.random() * availableColors.length)];
            }
        } else {
            // If no rings exist, cycle through colors normally
            this.currentColorIndex = (this.currentColorIndex + 1) % this.colors.length;
            this.ball.color = this.colors[this.currentColorIndex];
        }
    }
    
    updateStarTrails() {
        // Update existing star trails
        for (let i = this.starTrails.length - 1; i >= 0; i--) {
            const trail = this.starTrails[i];
            trail.life--;
            if (trail.life <= 0) {
                this.starTrails.splice(i, 1);
            }
        }
        
        // Add new star trails randomly
        if (Math.random() < 0.1) {
            const star = this.stars[Math.floor(Math.random() * this.stars.length)];
            this.starTrails.push({
                x: star.x,
                y: star.y,
                life: 30,
                maxLife: 30,
                opacity: star.opacity
            });
        }
    }
    
    updateStars() {
        // Update star positions to create backward motion effect
        for (let i = this.stars.length - 1; i >= 0; i--) {
            const star = this.stars[i];
            
            // Move stars backward (toward player) based on their z-depth
            star.z -= star.speed;
            
            // If star goes behind the player, reset it to the far distance
            if (star.z < 1) {
                star.z = 2000;
                star.x = Math.random() * window.innerWidth;
                star.y = Math.random() * window.innerHeight;
            }
            
            // Calculate screen position based on z-depth (perspective)
            const scale = 1000 / star.z;
            star.screenX = this.centerX + (star.x - this.centerX) * scale;
            star.screenY = this.centerY + (star.y - this.centerY) * scale;
            
            // Calculate star size and opacity based on depth
            star.screenSize = star.size * scale;
            star.screenOpacity = Math.min(1, (2000 - star.z) / 1000);
        }
    }
    
    updateParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.vy += 0.1; // Gravity
            particle.life--;
            
            if (particle.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }
    
    updateBurstParticles() {
        for (let i = this.burstParticles.length - 1; i >= 0; i--) {
            const particle = this.burstParticles[i];
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.vx *= 0.98; // Friction
            particle.vy *= 0.98;
            particle.life--;
            
            if (particle.life <= 0) {
                this.burstParticles.splice(i, 1);
            }
        }
    }
    
    updateScorePopups() {
        for (let i = this.scorePopups.length - 1; i >= 0; i--) {
            const popup = this.scorePopups[i];
            popup.y += popup.vy;
            popup.life--;
            
            if (popup.life <= 0) {
                this.scorePopups.splice(i, 1);
            }
        }
    }
    
    updateFluidTrail() {
        const maxTrailLength = 150; // Fixed number of trail segments for smooth curve
        const trailSpacing = 8; // Distance between trail points
        
        // Track previous position and angle for velocity calculation
        if (this.ball.prevX === undefined) {
            this.ball.prevX = this.ball.x;
            this.ball.prevY = this.ball.y;
            this.ball.prevAngle = this.ball.angle;
        }
        
        // Calculate ball's velocity and angular velocity
        const velocityX = this.ball.x - this.ball.prevX;
        const velocityY = this.ball.y - this.ball.prevY;
        const velocity = Math.sqrt(velocityX * velocityX + velocityY * velocityY);
        
        let dAngle = this.ball.angle - this.ball.prevAngle;
        if (dAngle > Math.PI) dAngle -= Math.PI * 2;
        if (dAngle < -Math.PI) dAngle += Math.PI * 2;
        
        // Store current values for next frame
        this.ball.prevX = this.ball.x;
        this.ball.prevY = this.ball.y;
        this.ball.prevAngle = this.ball.angle;
        
        // Initialize trail if empty
        if (this.ball.trail.length === 0) {
            for (let i = 0; i < maxTrailLength; i++) {
                this.ball.trail.push({
                    x: this.ball.x,
                    y: this.ball.y,
                    angle: this.ball.angle
                });
            }
        }
        
        // Always update trail - it's a continuous tail
        // Shift trail points: move each point to the position of the previous one
        for (let i = this.ball.trail.length - 1; i > 0; i--) {
            this.ball.trail[i].x = this.ball.trail[i - 1].x;
            this.ball.trail[i].y = this.ball.trail[i - 1].y;
            this.ball.trail[i].angle = this.ball.trail[i - 1].angle;
        }
        
        // Set first trail point to current ball position
        this.ball.trail[0].x = this.ball.x;
        this.ball.trail[0].y = this.ball.y;
        this.ball.trail[0].angle = this.ball.angle;
        
        // Position trail points to create natural tail behavior
        for (let i = 1; i < this.ball.trail.length; i++) {
            const prevPoint = this.ball.trail[i - 1];
            const currentPoint = this.ball.trail[i];
            
            // Calculate the direction from center to ball (radial direction)
            const ballAngle = Math.atan2(this.ball.y - this.centerY, this.ball.x - this.centerX);
            
            // Calculate the direction away from center (tail direction)
            // The ball is always moving toward the center, so tail extends away from center
            const tailAngle = ballAngle; // Same direction as ball's position from center
            
            // Calculate target position for this trail segment
            let targetX, targetY;
            
            if (velocity > 0.1) {
                // Moving: create engine fire trail that flows behind the ball
                const segmentDistance = i * trailSpacing;
                
                // The ball is traveling toward the center, so the trail flows backward
                // Calculate the direction opposite to the ball's movement (backward direction)
                const backwardAngle = ballAngle; // Same direction as ball's position from center
                
                // Add subtle curve based on rotation, but keep it minimal
                const rotationCurve = dAngle * 0.2; // Very subtle rotation effect
                
                // Apply curvature more toward the front of the trail
                // Use a curve that peaks very early and then flattens out
                const curvePeak = Math.min(i / 10, 1); // Peak at segment 10 (much earlier), then flatten
                const curveIntensity = Math.sin(curvePeak * Math.PI) * 0.8; // Sine wave for smooth curve
                const finalAngle = backwardAngle + (rotationCurve * curveIntensity);
                
                // Position each segment directly behind the ball along the backward direction
                targetX = this.ball.x + Math.cos(finalAngle) * segmentDistance;
                targetY = this.ball.y + Math.sin(finalAngle) * segmentDistance;
            } else {
                // Stationary: straight line behind the ball
                const segmentDistance = i * trailSpacing;
                targetX = this.ball.x + Math.cos(ballAngle) * segmentDistance;
                targetY = this.ball.y + Math.sin(ballAngle) * segmentDistance;
            }
            
            // Enhanced smooth interpolation with variable factors
            const baseLerpFactor = 0.6; // Increased base interpolation
            const distanceFactor = 1 - (i / this.ball.trail.length); // Closer points move faster
            const lerpFactor = baseLerpFactor * distanceFactor;
            
            currentPoint.x += (targetX - currentPoint.x) * lerpFactor;
            currentPoint.y += (targetY - currentPoint.y) * lerpFactor;
        }
    }
    
    checkCollision(ring) {
        const hitPlaneZ = 150;
        const scale = hitPlaneZ / ring.z;
        const scaledRadius = ring.radius * scale;
        
        // Check if ball touches the ring edge (within thickness)
        const distanceFromCenter = Math.sqrt(
            Math.pow(this.ball.x - this.centerX, 2) + 
            Math.pow(this.ball.y - this.centerY, 2)
        );
        
        const ringInnerRadius = scaledRadius - ring.thickness * scale;
        const ringOuterRadius = scaledRadius + ring.thickness * scale;
        
        // Ball must touch the ring edge to register a hit
        return distanceFromCenter >= ringInnerRadius && distanceFromCenter <= ringOuterRadius;
    }
    
    gameOver() {
        this.gameState = 'gameOver';
        
        if (this.score > this.bestScore) {
            this.bestScore = this.score;
            localStorage.setItem('colorRingBestScore', this.bestScore);
        }
        
        // Pause background music when game over
        this.backgroundMusic.pause();
        this.backgroundMusic.currentTime = 0; // Reset to beginning
        this.updateMusicButton(); // Update button state
        
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('bestScore').textContent = this.bestScore;
        document.getElementById('gameOver').style.display = 'block';
        this.updateUI();
    }
    
    render() {
        // Clear canvas completely - no trail effects
        this.ctx.fillStyle = '#0f0f23';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Always draw stars and star trails (background effect for all screens)
        this.drawStars();
        this.drawStarTrails();
        
        // Only draw game elements if not in menu state
        if (this.gameState !== 'menu') {
            // Draw rings
            this.drawRings();
            
            // Only draw ball and trail if not in game over delay
            if (this.gameState !== 'gameOverDelay') {
                // Draw fluid trail
                this.drawFluidTrail();
                
                // Draw ball
                this.drawBall();
            }
            
            // Draw particles
            this.drawParticles();
            this.drawBurstParticles();
            this.drawScorePopups();
            
            // Draw center point
            this.drawCenter();
        }
    }
    
    drawStars() {
        this.stars.forEach(star => {
            // Only draw stars that are in front of the player
            if (star.z > 0) {
                this.ctx.globalAlpha = star.screenOpacity * star.opacity;
                this.ctx.fillStyle = star.color;
                
                // Draw star with glow effect
                this.ctx.shadowColor = star.color;
                this.ctx.shadowBlur = star.screenSize * 2;
                
                // Draw star as a circle for better appearance
                this.ctx.beginPath();
                this.ctx.arc(star.screenX, star.screenY, star.screenSize, 0, Math.PI * 2);
                this.ctx.fill();
                
                // Reset shadow
                this.ctx.shadowBlur = 0;
            }
        });
        this.ctx.globalAlpha = 1;
    }
    
    drawStarTrails() {
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        this.starTrails.forEach(trail => {
            const alpha = trail.life / trail.maxLife;
            this.ctx.globalAlpha = alpha * trail.opacity;
            
            // Draw trail with glow effect
            this.ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
            this.ctx.shadowBlur = 4;
            this.ctx.fillRect(trail.x, trail.y, 3, 3);
            this.ctx.shadowBlur = 0;
        });
        this.ctx.globalAlpha = 1;
    }
    
    drawRings() {
        this.rings.forEach(ring => {
            const scale = 150 / ring.z;
            const scaledRadius = ring.radius * scale;
            const scaledThickness = ring.thickness * scale;
            
            // Apply shake effect if active
            let shakeOffsetX = 0;
            let shakeOffsetY = 0;
            if (ring.shake > 0) {
                const shakeProgress = ring.shake / 30; // Normalize to 0-1
                const currentIntensity = ring.shakeIntensity * shakeProgress;
                shakeOffsetX = (Math.random() - 0.5) * currentIntensity;
                shakeOffsetY = (Math.random() - 0.5) * currentIntensity;
                
                // Update shake
                ring.shake--;
                ring.shakeIntensity *= 0.95; // Gradually reduce intensity
            }
            
            // Draw ring segments with solid colors - fully visible
            ring.segments.forEach(segment => {
                // Solid color stroke only
                this.ctx.strokeStyle = segment.color;
                this.ctx.lineWidth = scaledThickness;
                this.ctx.lineCap = 'round';
                this.ctx.beginPath();
                this.ctx.arc(this.centerX + shakeOffsetX, this.centerY + shakeOffsetY, scaledRadius, 
                    segment.startAngle, segment.endAngle);
                this.ctx.stroke();
            });
        });
    }
    
    drawFluidTrail() {
        if (this.ball.trail.length < 2) return;
        const ballColor = this.ball.color;
        
        // Build left/right edge arrays for closed ribbon
        const leftEdge = [];
        const rightEdge = [];
        const n = this.ball.trail.length;
        
        for (let i = 0; i < n; i++) {
            const p = this.ball.trail[i];
            const progress = i / (n - 1);
            
            // Dynamic width profile: narrow at front, wide at center, narrow at end
            let widthMultiplier;
            if (progress < 0.3) {
                // Front 30%: narrow to normal (0.5 -> 1.0)
                widthMultiplier = 0.5 + (progress / 0.3) * 0.5;
            } else if (progress < 0.7) {
                // Center 40%: full width (1.0)
                widthMultiplier = 1.0;
            } else {
                // End 30%: normal to narrow (1.0 -> 0.3)
                widthMultiplier = 1.0 - ((progress - 0.7) / 0.3) * 0.7;
            }
            
            const baseWidth = this.ball.radius * widthMultiplier;
            
            // Local tangent
            const pn = this.ball.trail[Math.min(i + 1, n - 1)];
            const pp = this.ball.trail[Math.max(i - 1, 0)];
            const tx = pn.x - pp.x;
            const ty = pn.y - pp.y;
            const len = Math.hypot(tx, ty) || 1;
            const nx = -ty / len;
            const ny = tx / len;
            leftEdge.push({ x: p.x - nx * baseWidth, y: p.y - ny * baseWidth });
            rightEdge.push({ x: p.x + nx * baseWidth, y: p.y + ny * baseWidth });
        }
        
        // Soft glow underlay (3 expanding layers)
        for (let g = 3; g >= 1; g--) {
            const a = 0.06 * g;
            this.ctx.fillStyle = `${ballColor}${Math.floor(a * 255).toString(16).padStart(2, '0')}`;
            this.ctx.beginPath();
            this.ctx.moveTo(leftEdge[0].x, leftEdge[0].y);
            for (let i = 1; i < n; i++) this.ctx.lineTo(leftEdge[i].x, leftEdge[i].y);
            for (let i = n - 1; i >= 0; i--) this.ctx.lineTo(rightEdge[i].x, rightEdge[i].y);
            this.ctx.closePath();
            this.ctx.fill();
            // Expand for next glow layer
            for (let i = 0; i < n; i++) {
                const cx = (leftEdge[i].x + rightEdge[i].x) * 0.5;
                const cy = (leftEdge[i].y + rightEdge[i].y) * 0.5;
                const dx = leftEdge[i].x - cx;
                const dy = leftEdge[i].y - cy;
                leftEdge[i].x = cx + dx * 1.05; leftEdge[i].y = cy + dy * 1.05;
                rightEdge[i].x = cx - dx * 1.05; rightEdge[i].y = cy - dy * 1.05;
            }
        }
        
        // Draw smooth, continuous trail with dynamic transparency like the image
        this.ctx.beginPath();
        
        // Start from the right edge and go backward
        this.ctx.moveTo(rightEdge[n - 1].x, rightEdge[n - 1].y);
        
        // Draw the right edge backward
        for (let i = n - 1; i >= 0; i--) {
            this.ctx.lineTo(rightEdge[i].x, rightEdge[i].y);
        }
        
        // Connect to left edge and draw forward
        this.ctx.lineTo(leftEdge[0].x, leftEdge[0].y);
        
        // Draw the left edge forward
        for (let i = 0; i < n; i++) {
            this.ctx.lineTo(leftEdge[i].x, leftEdge[i].y);
        }
        
        this.ctx.closePath();
        
        // Create gradient for transparency: transparent at front, solid at middle/end
        const gradient = this.ctx.createLinearGradient(
            leftEdge[0].x, leftEdge[0].y,  // Start at ball (front)
            leftEdge[n - 1].x, leftEdge[n - 1].y  // End at trail tip
        );
        
        // Front: transparent (0% opacity)
        gradient.addColorStop(0, `${ballColor}00`);
        // Quick transition to semi-transparent
        gradient.addColorStop(0.1, `${ballColor}40`);
        // Semi-transparent
        gradient.addColorStop(0.2, `${ballColor}80`);
        // Solid
        gradient.addColorStop(0.4, ballColor);
        // End: gradually fade
        gradient.addColorStop(0.8, `${ballColor}80`);
        gradient.addColorStop(1, `${ballColor}20`);
        
        this.ctx.fillStyle = gradient;
        this.ctx.fill();
    }
    
    drawBall() {
        // Draw the ball as a solid color
        this.ctx.fillStyle = this.ball.color;
        this.ctx.beginPath();
        this.ctx.arc(this.ball.x, this.ball.y, this.ball.radius, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    lightenColor(color, amount) {
        const num = parseInt(color.replace("#", ""), 16);
        const amt = Math.round(2.55 * amount * 10);
        const R = (num >> 16) + amt;
        const G = (num >> 8 & 0x00FF) + amt;
        const B = (num & 0x0000FF) + amt;   
        return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
            (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
            (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
    }
    
    darkenColor(color, amount) {
        const num = parseInt(color.replace("#", ""), 16);
        const amt = Math.round(2.55 * amount * 100);
        const R = (num >> 16) - amt;
        const G = (num >> 8 & 0x00FF) - amt;
        const B = (num & 0x0000FF) - amt;
        return "#" + (0x1000000 + (R > 255 ? 255 : R < 0 ? 0 : R) * 0x10000 +
            (G > 255 ? G < 1 ? 0 : G : 255) * 0x100 +
            (B > 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
    }
    
    drawParticles() {
        this.particles.forEach(particle => {
            const alpha = particle.life / particle.maxLife;
            this.ctx.globalAlpha = alpha;
            this.ctx.fillStyle = particle.color;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size * alpha, 0, Math.PI * 2);
            this.ctx.fill();
        });
        this.ctx.globalAlpha = 1;
    }
    
    drawBurstParticles() {
        this.burstParticles.forEach(particle => {
            const alpha = particle.life / particle.maxLife;
            this.ctx.globalAlpha = alpha;
            this.ctx.fillStyle = particle.color;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size * alpha, 0, Math.PI * 2);
            this.ctx.fill();
        });
        this.ctx.globalAlpha = 1;
    }
    
    drawScorePopups() {
        this.scorePopups.forEach(popup => {
            const alpha = popup.life / popup.maxLife;
            
            this.ctx.globalAlpha = alpha;
            this.ctx.fillStyle = popup.color || '#FFD700'; // Use segment color or fallback to gold
            this.ctx.strokeStyle = '#333';
            this.ctx.lineWidth = 3; // Thicker outline
            this.ctx.font = 'bold 32px Arial'; // Larger font size
            this.ctx.textAlign = 'center';
            
            const text = `+${popup.points}`;
            
            // Draw text outline
            this.ctx.strokeText(text, popup.x, popup.y);
            
            // Draw text fill
            this.ctx.fillText(text, popup.x, popup.y);
            
            // Draw combo indicator if combo > 1
            if (popup.combo > 1) {
                this.ctx.font = 'bold 20px Arial';
                this.ctx.fillStyle = '#FFD700'; // Gold color for combo text
                this.ctx.strokeStyle = '#333';
                this.ctx.lineWidth = 2;
                
                const comboText = `${popup.combo}x COMBO!`;
                
                // Draw combo text below the points
                this.ctx.strokeText(comboText, popup.x, popup.y + 25);
                this.ctx.fillText(comboText, popup.x, popup.y + 25);
            }
        });
        this.ctx.globalAlpha = 1;
    }
    
    drawCenter() {
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.beginPath();
        this.ctx.arc(this.centerX, this.centerY, 5, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    updateUI() {
        // Update score in title when in game mode
        if (this.gameState === 'playing') {
            const titleColor = document.getElementById('gameTitle').querySelector('.titleColor');
            if (titleColor) {
                titleColor.textContent = this.score;
            }
        }
        
        // Update only the best score number, keep the image intact
        const trophyElement = document.getElementById('trophy');
        const trophyImage = trophyElement.querySelector('img');
        const scoreSpan = trophyElement.querySelector('span');
        
        if (scoreSpan) {
            scoreSpan.textContent = this.bestScore;
        } else {
            // If no span exists, create one after the image
            trophyElement.innerHTML = `<img src="assets/score.png" alt="Score" class="trophy-icon"> <span>${this.bestScore}</span>`;
        }
    }
    
    updateComboDisplay() {
        const comboCounter = document.getElementById('comboCounter');
        const comboValue = document.getElementById('comboValue');
        
        if (this.combo > 1) {
            comboCounter.style.display = 'block';
            comboValue.textContent = this.combo;
        } else {
            comboCounter.style.display = 'none';
        }
    }
    
    toggleMusic() {
        if (this.backgroundMusic.paused) {
            this.backgroundMusic.play().catch(error => {
                console.log('Music play failed:', error);
            });
        } else {
            this.backgroundMusic.pause();
        }
    }
    
    setMusicVolume(volume) {
        this.backgroundMusic.volume = Math.max(0, Math.min(1, volume));
    }
    
    updateMusicButton() {
        const musicBtn = document.getElementById('musicControl');
        if (this.backgroundMusic.paused) {
            musicBtn.classList.add('muted');
        } else {
            musicBtn.classList.remove('muted');
        }
    }
    
    gameLoop() {
        this.update();
        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Initialize game when page loads
window.addEventListener('load', () => {
    new ColorRingGame();
});
