// Particle Physics Animations
import { BaseAnimation } from './base-animation.js';

// Brownian Motion Simulation
export class BrownianMotion extends BaseAnimation {
    constructor(ctx) {
        super(ctx);
        this.animationType = 'brownian-motion';
        this.particles = [];
        this.particleCount = 15;
        this.speed = 1;
        this.temperature = 1;
        this.showTrails = false;
        this.showVelocityVectors = false;
        this.showTemperatureHeatmap = false;
        this.showVelocityDistribution = false;
        this.showMeanFreePath = false;
        this.particleSize = 4;
        this.collisionCount = 0;
        this.meanFreePath = 0;
        this.velocityData = [];
        
        this.initializeParticles();
    }
    
    initializeParticles() {
        this.particles = [];
        for (let i = 0; i < this.particleCount; i++) {
            const vx = (Math.random() - 0.5) * 2;
            const vy = (Math.random() - 0.5) * 2;
            const velocity = Math.sqrt(vx * vx + vy * vy);
            
            this.particles.push({
                x: Math.random() * this.ctx.canvas.width,
                y: Math.random() * this.ctx.canvas.height,
                vx: vx,
                vy: vy,
                velocity: velocity,
                trail: [],
                lastCollisionTime: 0,
                distanceTraveled: 0
            });
        }
    }
    
    setParticleCount(count) {
        this.particleCount = count;
        this.initializeParticles();
    }
    
    setSpeed(speed) {
        this.speed = speed;
    }
    
    setTemperature(temp) {
        this.temperature = temp;
    }
    
    setShowTrails(show) {
        this.showTrails = show;
        if (!show) {
            this.particles.forEach(p => p.trail = []);
        }
    }
    
    setShowVelocityVectors(show) {
        this.showVelocityVectors = show;
    }
    
    setShowTemperatureHeatmap(show) {
        this.showTemperatureHeatmap = show;
    }
    
    setShowVelocityDistribution(show) {
        this.showVelocityDistribution = show;
    }
    
    setShowMeanFreePath(show) {
        this.showMeanFreePath = show;
    }
    
    setParticleSize(size) {
        this.particleSize = size;
    }
    
    reset() {
        this.time = 0;
        this.collisionCount = 0;
        this.velocityData = [];
        this.initializeParticles();
    }
    
    update(deltaTime) {
        this.time += deltaTime;
        const dt = (deltaTime / 1000) * this.speed * 2; // Standardized time step scaling
        
        // Store old positions for collision detection
        const oldPositions = this.particles.map(p => ({ x: p.x, y: p.y }));
        
        this.particles.forEach((particle, index) => {
            // Add random motion based on temperature (Brownian motion)
            particle.vx += (Math.random() - 0.5) * this.temperature * 0.1;
            particle.vy += (Math.random() - 0.5) * this.temperature * 0.1;
            
            // Apply damping
            particle.vx *= 0.99;
            particle.vy *= 0.99;
            
            // Update position
            const oldX = particle.x;
            const oldY = particle.y;
            particle.x += particle.vx * dt * 50;
            particle.y += particle.vy * dt * 50;
            
            // Update velocity magnitude
            particle.velocity = Math.sqrt(particle.vx * particle.vx + particle.vy * particle.vy);
            
            // Update distance traveled for mean free path
            particle.distanceTraveled += Math.sqrt(
                (particle.x - oldX) * (particle.x - oldX) + 
                (particle.y - oldY) * (particle.y - oldY)
            );
            
            // Bounce off walls
            if (particle.x < 0 || particle.x > this.ctx.canvas.width) {
                particle.vx *= -0.8;
                particle.x = Math.max(0, Math.min(this.ctx.canvas.width, particle.x));
                this.collisionCount++;
                particle.lastCollisionTime = this.time;
            }
            if (particle.y < 0 || particle.y > this.ctx.canvas.height) {
                particle.vy *= -0.8;
                particle.y = Math.max(0, Math.min(this.ctx.canvas.height, particle.y));
                this.collisionCount++;
                particle.lastCollisionTime = this.time;
            }
            
            // Check particle-to-particle collisions
            for (let j = index + 1; j < this.particles.length; j++) {
                const other = this.particles[j];
                const dx = particle.x - other.x;
                const dy = particle.y - other.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < this.particleSize * 2) {
                    // Simple elastic collision
                    const angle = Math.atan2(dy, dx);
                    const speed1 = Math.sqrt(particle.vx * particle.vx + particle.vy * particle.vy);
                    const speed2 = Math.sqrt(other.vx * other.vx + other.vy * other.vy);
                    
                    // Swap velocities
                    const tempVx = particle.vx;
                    const tempVy = particle.vy;
                    particle.vx = other.vx;
                    particle.vy = other.vy;
                    other.vx = tempVx;
                    other.vy = tempVy;
                    
                    this.collisionCount++;
                    particle.lastCollisionTime = this.time;
                    other.lastCollisionTime = this.time;
                    
                    // Separate particles
                    const overlap = this.particleSize * 2 - distance;
                    const moveX = (overlap * dx) / distance / 2;
                    const moveY = (overlap * dy) / distance / 2;
                    particle.x += moveX;
                    particle.y += moveY;
                    other.x -= moveX;
                    other.y -= moveY;
                }
            }
            
            // Update trail

        });
        
        // Update velocity distribution data
        if (this.showVelocityDistribution) {
            this.velocityData.push(...this.particles.map(p => p.velocity));
            if (this.velocityData.length > 1000) {
                this.velocityData = this.velocityData.slice(-500);
            }
        }
        
        // Calculate mean free path
        if (this.showMeanFreePath && this.collisionCount > 0) {
            const totalDistance = this.particles.reduce((sum, p) => sum + p.distanceTraveled, 0);
            this.meanFreePath = totalDistance / this.collisionCount;
        }
    }
    
    render() {
        // Draw temperature heatmap
        if (this.showTemperatureHeatmap) {
            this.drawTemperatureHeatmap();
        }
        
        // Draw velocity distribution
        if (this.showVelocityDistribution) {
            this.drawVelocityDistribution();
        }
        
        // Draw mean free path info
        if (this.showMeanFreePath) {
            this.drawMeanFreePathInfo();
        }
        
        this.particles.forEach(particle => {
            // Draw particle with velocity-based color
            this.ctx.beginPath();
            this.ctx.fillStyle = this.getVelocityColor(particle.velocity);
            this.ctx.arc(particle.x, particle.y, this.particleSize, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Add particle border
            this.ctx.strokeStyle = '#fff';
            this.ctx.lineWidth = 1;
            this.ctx.stroke();
        });
        
        // Draw canvas labels
        this.drawBrownianLabels();
    }
    
    getVelocityColor(velocity) {
        // Color particles based on velocity (red = fast, blue = slow)
        const maxVelocity = 3;
        const normalizedVelocity = Math.min(velocity / maxVelocity, 1);
        
        if (normalizedVelocity < 0.5) {
            // Blue to green
            const t = normalizedVelocity * 2;
            return `rgb(0, ${Math.floor(255 * t)}, ${Math.floor(255 * (1 - t))})`;
        } else {
            // Green to red
            const t = (normalizedVelocity - 0.5) * 2;
            return `rgb(${Math.floor(255 * t)}, ${Math.floor(255 * (1 - t))}, 0)`;
        }
    }
    
    drawTemperatureHeatmap() {
        const gridSize = 20;
        const cols = Math.ceil(this.ctx.canvas.width / gridSize);
        const rows = Math.ceil(this.ctx.canvas.height / gridSize);
        
        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                const centerX = j * gridSize + gridSize / 2;
                const centerY = i * gridSize + gridSize / 2;
                
                // Calculate local temperature based on nearby particles
                let localTemp = 0;
                let particleCount = 0;
                
                this.particles.forEach(particle => {
                    const dx = particle.x - centerX;
                    const dy = particle.y - centerY;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    if (distance < gridSize) {
                        localTemp += particle.velocity;
                        particleCount++;
                    }
                });
                
                if (particleCount > 0) {
                    localTemp /= particleCount;
                    const alpha = Math.min(localTemp / 3, 0.3);
                    this.ctx.fillStyle = `rgba(255, 100, 100, ${alpha})`;
                    this.ctx.fillRect(j * gridSize, i * gridSize, gridSize, gridSize);
                }
            }
        }
    }
    
    drawVelocityDistribution() {
        const graphWidth = 200;
        const graphHeight = 100;
        const graphX = this.ctx.canvas.width - graphWidth - 20;
        const graphY = 120; // Moved down to avoid overlap with main labels
        
        // Background
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        this.ctx.fillRect(graphX, graphY, graphWidth, graphHeight);
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(graphX, graphY, graphWidth, graphHeight);
        
        if (this.velocityData.length > 0) {
            // Create histogram
            const bins = 20;
            const histogram = new Array(bins).fill(0);
            const maxVelocity = Math.max(...this.velocityData);
            
            this.velocityData.forEach(velocity => {
                const binIndex = Math.floor((velocity / maxVelocity) * (bins - 1));
                if (binIndex >= 0 && binIndex < bins) {
                    histogram[binIndex]++;
                }
            });
            
            // Draw histogram
            const maxCount = Math.max(...histogram);
            const barWidth = graphWidth / bins;
            
            this.ctx.fillStyle = '#4ECDC4';
            for (let i = 0; i < bins; i++) {
                const barHeight = (histogram[i] / maxCount) * (graphHeight - 20);
                this.ctx.fillRect(
                    graphX + i * barWidth + 2, 
                    graphY + graphHeight - 10 - barHeight, 
                    barWidth - 4, 
                    barHeight
                );
            }
        }
        
        // Labels
        this.ctx.fillStyle = '#333';
        this.ctx.font = '14px Inter';
        this.ctx.textRenderingOptimization = 'optimizeLegibility';
        this.ctx.textRenderingOptimization = 'optimizeLegibility';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Velocity Distribution', graphX + graphWidth / 2, graphY - 5);
    }
    
    drawMeanFreePathInfo() {
        const infoX = 20;
        const infoY = 120; // Moved down to avoid overlap with main labels
        
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        this.ctx.fillRect(infoX, infoY, 200, 80);
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(infoX, infoY, 200, 80);
        
        this.ctx.fillStyle = '#333';
        this.ctx.font = '14px Inter';
        this.ctx.textRenderingOptimization = 'optimizeLegibility';
        this.ctx.textRenderingOptimization = 'optimizeLegibility';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`Collisions: ${this.collisionCount}`, infoX + 10, infoY + 20);
        this.ctx.fillText(`Mean Free Path: ${this.meanFreePath.toFixed(1)}`, infoX + 10, infoY + 40);
        this.ctx.fillText(`Temperature: ${this.temperature.toFixed(1)}`, infoX + 10, infoY + 60);
    }
    
    getStats() {
        const avgSpeed = this.particles.reduce((sum, p) => 
            sum + Math.sqrt(p.vx * p.vx + p.vy * p.vy), 0) / this.particles.length;
        
        return {
            particleCount: this.particles.length,
            avgSpeed: avgSpeed,
            time: this.time,
            collisionCount: this.collisionCount,
            meanFreePath: this.meanFreePath,
            temperature: this.temperature
        };
    }
    
    drawBrownianLabels() {
        this.drawLabels(
            'Brownian Motion',
            '⟨v²⟩ = 3kBT/m  |  λ = 1/(√2πd²n)  |  D = kBT/(6πηr)'
        );
    }
}

// Diffusion Simulation
export class Diffusion extends BaseAnimation {
    constructor(ctx) {
        super(ctx);
        this.animationType = 'diffusion';
        this.particles = [];
        this.particleCount = 200;
        this.speed = 1;
        this.diffusionRate = 1;
        this.concentrationGradient = 1;
        this.showConcentration = true; // Default to showing concentration
        this.particleSize = 4;
        this.concentrationMap = [];
        this.diffusionStarted = false; // New: control when diffusion starts
        this.showConcentrationProfile = true; // New: show concentration profile
        this.showParticleTrails = false; // New: show particle trails
        
        this.initializeParticles();
        this.initializeConcentrationMap();
    }
    
    initializeParticles() {
        this.particles = [];
        const startRegion = this.ctx.canvas.width * 0.2; // Concentrated in left 20%
        
        for (let i = 0; i < this.particleCount; i++) {
            this.particles.push({
                x: Math.random() * startRegion, // Start in concentrated region
                y: Math.random() * this.ctx.canvas.height,
                vx: 0,
                vy: 0,
                color: '#FF6B6B', // Consistent red color for better visibility
                trail: [] // New: store trail positions
            });
        }
    }
    
    initializeConcentrationMap() {
        this.concentrationMap = [];
        const gridSize = 15; // Smaller grid for better resolution
        const cols = Math.ceil(this.ctx.canvas.width / gridSize);
        const rows = Math.ceil(this.ctx.canvas.height / gridSize);
        
        for (let i = 0; i < rows; i++) {
            this.concentrationMap[i] = [];
            for (let j = 0; j < cols; j++) {
                // Gentler concentration gradient - high on left, low on right
                const x = j / cols;
                this.concentrationMap[i][j] = Math.max(0, 1 - x * 1.5); // Gentler gradient
            }
        }
    }
    
    setParticleCount(count) {
        this.particleCount = count;
        this.initializeParticles();
    }
    
    setSpeed(speed) {
        this.speed = speed;
    }
    
    setDiffusionRate(rate) {
        this.diffusionRate = rate;
    }
    
    setConcentrationGradient(gradient) {
        this.concentrationGradient = gradient;
        this.initializeConcentrationMap();
    }
    
    setParticleSize(size) {
        this.particleSize = size;
    }
    
    setShowConcentration(show) {
        this.showConcentration = show;
    }
    
    setShowConcentrationProfile(show) {
        this.showConcentrationProfile = show;
    }
    
    setShowParticleTrails(show) {
        this.showParticleTrails = show;
    }
    
    startDiffusion() {
        this.diffusionStarted = true;
    }
    
    reset() {
        this.time = 0;
        this.diffusionStarted = false;
        this.initializeParticles();
    }
    
    update(deltaTime) {
        this.time += deltaTime;
        const dt = (deltaTime / 1000) * this.speed * 20; // Much faster animation
        
        // Only update particles if diffusion has started
        if (!this.diffusionStarted) return;
        
        this.particles.forEach(particle => {
            // Check if particle coordinates are valid before updating
            if (!isFinite(particle.x) || !isFinite(particle.y) || 
                isNaN(particle.x) || isNaN(particle.y)) {
                // Reset invalid particle to a valid position
                particle.x = Math.random() * this.ctx.canvas.width * 0.2;
                particle.y = Math.random() * this.ctx.canvas.height;
                particle.vx = 0;
                particle.vy = 0;
                return;
            }
            
            // Add random diffusion motion
            particle.vx += (Math.random() - 0.5) * this.diffusionRate * 0.5;
            particle.vy += (Math.random() - 0.5) * this.diffusionRate * 0.5;
            
            // Apply concentration gradient force (particles move from high to low concentration)
            const gridX = Math.floor(particle.x / 15);
            const gridY = Math.floor(particle.y / 15);
            if (gridX > 0 && gridX < this.concentrationMap[0].length - 1 && 
                gridY >= 0 && gridY < this.concentrationMap.length) {
                const concentrationDiff = this.concentrationMap[gridY]?.[gridX] - this.concentrationMap[gridY]?.[gridX + 1];
                // Reduce gradient force over time to allow for uniform distribution
                const timeFactor = Math.max(0.1, 1 - (this.time / 10000)); // Gradually reduce force
                particle.vx += concentrationDiff * 0.1 * timeFactor; // Weaker, time-dependent gradient force
            }
            
            // Apply damping
            particle.vx *= 0.98;
            particle.vy *= 0.98;
            
            // Update position
            particle.x += particle.vx * dt * 30;
            particle.y += particle.vy * dt * 30;
            
            // Update particle trail
            if (this.showParticleTrails) {
                particle.trail.push({ x: particle.x, y: particle.y });
                if (particle.trail.length > 20) {
                    particle.trail.shift();
                }
            }
            
            // Realistic boundary conditions - particles stay within canvas
            if (particle.x < 0) {
                particle.x = 0;
                particle.vx *= -0.5; // Bounce with energy loss
            }
            if (particle.x > this.ctx.canvas.width) {
                particle.x = this.ctx.canvas.width;
                particle.vx *= -0.5; // Bounce with energy loss
            }
            if (particle.y < 0) {
                particle.y = 0;
                particle.vy *= -0.5; // Bounce with energy loss
            }
            if (particle.y > this.ctx.canvas.height) {
                particle.y = this.ctx.canvas.height;
                particle.vy *= -0.5; // Bounce with energy loss
            }
            
            // Final validation check
            if (!isFinite(particle.x) || !isFinite(particle.y) || 
                isNaN(particle.x) || isNaN(particle.y)) {
                // Reset if still invalid after update
                particle.x = Math.random() * this.ctx.canvas.width * 0.2;
                particle.y = Math.random() * this.ctx.canvas.height;
                particle.vx = 0;
                particle.vy = 0;
            }
        });
    }
    
    render() {
        // Draw enhanced concentration heatmap with modern gradient
        if (this.showConcentration) {
            const gridSize = 15;
            for (let i = 0; i < this.concentrationMap.length; i++) {
                for (let j = 0; j < this.concentrationMap[i].length; j++) {
                    const concentration = this.concentrationMap[i][j];
                    const alpha = concentration * 0.8; // Enhanced visibility
                    
                    // Create gradient for each grid cell
                    const gradient = this.ctx.createLinearGradient(
                        j * gridSize, i * gridSize,
                        (j + 1) * gridSize, (i + 1) * gridSize
                    );
                    gradient.addColorStop(0, `rgba(102, 126, 234, ${alpha * 0.8})`);
                    gradient.addColorStop(0.5, `rgba(118, 75, 162, ${alpha})`);
                    gradient.addColorStop(1, `rgba(102, 126, 234, ${alpha * 0.6})`);
                    
                    this.ctx.fillStyle = gradient;
                    this.ctx.fillRect(j * gridSize, i * gridSize, gridSize, gridSize);
                    
                    // Add subtle border for grid definition
                    this.ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.1})`;
                    this.ctx.lineWidth = 0.5;
                    this.ctx.strokeRect(j * gridSize, i * gridSize, gridSize, gridSize);
                }
            }
        }
        
        // Draw enhanced particle trails with gradient
        if (this.showParticleTrails) {
            this.particles.forEach(particle => {
                if (particle.trail.length > 1) {
                    // Create gradient trail
                    const gradient = this.ctx.createLinearGradient(
                        particle.trail[0].x, particle.trail[0].y,
                        particle.trail[particle.trail.length - 1].x, 
                        particle.trail[particle.trail.length - 1].y
                    );
                    gradient.addColorStop(0, 'rgba(255, 107, 107, 0.8)');
                    gradient.addColorStop(0.5, 'rgba(255, 107, 107, 0.4)');
                    gradient.addColorStop(1, 'rgba(255, 107, 107, 0.1)');
                    
                    this.ctx.beginPath();
                    this.ctx.strokeStyle = gradient;
                    this.ctx.lineWidth = 2;
                    this.ctx.lineCap = 'round';
                    this.ctx.moveTo(particle.trail[0].x, particle.trail[0].y);
                    for (let i = 1; i < particle.trail.length; i++) {
                        this.ctx.lineTo(particle.trail[i].x, particle.trail[i].y);
                    }
                    this.ctx.stroke();
                }
            });
        }
        
        // Draw particles with modern enhanced styling
        this.particles.forEach(particle => {
            // Check if particle coordinates are valid
            if (!isFinite(particle.x) || !isFinite(particle.y) || 
                isNaN(particle.x) || isNaN(particle.y)) {
                return; // Skip invalid particles
            }
            
            // Calculate particle velocity for dynamic effects
            const velocity = Math.sqrt(particle.vx * particle.vx + particle.vy * particle.vy);
            const velocityFactor = Math.min(velocity / 5, 1); // Normalize velocity
            
            // Enhanced glow effect based on velocity
            this.ctx.shadowColor = `rgba(255, 107, 107, ${0.4 + velocityFactor * 0.3})`;
            this.ctx.shadowBlur = 12 + velocityFactor * 8;
            
            // Create dynamic gradient based on velocity
            const gradient = this.ctx.createRadialGradient(
                particle.x, particle.y, 0,
                particle.x, particle.y, this.particleSize * (1 + velocityFactor * 0.3)
            );
            
            // Dynamic colors based on velocity
            const baseColor = velocityFactor > 0.5 ? 255 : 200;
            const alpha = 0.9 + velocityFactor * 0.1;
            
            gradient.addColorStop(0, `rgba(${baseColor}, 107, 107, ${alpha})`);
            gradient.addColorStop(0.6, `rgba(255, 107, 107, ${0.8 - velocityFactor * 0.2})`);
            gradient.addColorStop(1, `rgba(255, 107, 107, 0.4)`);
            
            this.ctx.beginPath();
            this.ctx.fillStyle = gradient;
            this.ctx.arc(particle.x, particle.y, this.particleSize * (1 + velocityFactor * 0.2), 0, Math.PI * 2);
            this.ctx.fill();
            
            // Enhanced border with velocity-based opacity
            this.ctx.shadowBlur = 0;
            this.ctx.strokeStyle = `rgba(255, 255, 255, ${0.9 + velocityFactor * 0.1})`;
            this.ctx.lineWidth = 1.5;
            this.ctx.stroke();
            
            // Add inner highlight for depth
            this.ctx.beginPath();
            this.ctx.fillStyle = `rgba(255, 255, 255, ${0.3 + velocityFactor * 0.2})`;
            this.ctx.arc(particle.x - this.particleSize * 0.3, particle.y - this.particleSize * 0.3, 
                         this.particleSize * 0.3, 0, Math.PI * 2);
            this.ctx.fill();
        });
        
        // Draw concentration profile
        if (this.showConcentrationProfile) {
            this.drawConcentrationProfile();
        }
        
        // Draw start barrier if diffusion hasn't started
        if (!this.diffusionStarted) {
            this.drawStartBarrier();
        }
        
        // Draw canvas labels
        this.drawDiffusionLabels();
    }
    
    drawConcentrationProfile() {
        const profileHeight = 100;
        const profileY = this.ctx.canvas.height - profileHeight - 25;
        const profileWidth = this.ctx.canvas.width - 50;
        
        // Enhanced background with glassmorphism effect
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        this.ctx.fillRect(25, profileY, profileWidth, profileHeight);
        
        // Add subtle border and shadow
        this.ctx.strokeStyle = 'rgba(102, 126, 234, 0.3)';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(25, profileY, profileWidth, profileHeight);
        
        // Add inner shadow effect
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
        this.ctx.fillRect(27, profileY + 2, profileWidth - 4, profileHeight - 4);
        
        // Calculate concentration profile
        const bins = 50;
        const binWidth = profileWidth / bins;
        const concentrationProfile = new Array(bins).fill(0);
        
        this.particles.forEach(particle => {
            const binIndex = Math.floor((particle.x / this.ctx.canvas.width) * bins);
            if (binIndex >= 0 && binIndex < bins) {
                concentrationProfile[binIndex]++;
            }
        });
        
        // Normalize to fit in profile height
        const maxConcentration = Math.max(...concentrationProfile);
        const scale = (profileHeight - 20) / Math.max(maxConcentration, 1);
        
        // Draw enhanced concentration profile with gradient
        const gradient = this.ctx.createLinearGradient(25, profileY, 25 + profileWidth, profileY);
        gradient.addColorStop(0, '#FF6B6B');
        gradient.addColorStop(0.5, '#667eea');
        gradient.addColorStop(1, '#764ba2');
        
        this.ctx.strokeStyle = gradient;
        this.ctx.lineWidth = 3;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        this.ctx.beginPath();
        this.ctx.moveTo(25, profileY + profileHeight - 15);
        
        for (let i = 0; i < bins; i++) {
            const x = 25 + i * binWidth;
            const y = profileY + profileHeight - 15 - (concentrationProfile[i] * scale);
            this.ctx.lineTo(x, y);
        }
        this.ctx.stroke();
        
        // Add area fill under the curve
        this.ctx.fillStyle = 'rgba(255, 107, 107, 0.2)';
        this.ctx.beginPath();
        this.ctx.moveTo(25, profileY + profileHeight - 15);
        for (let i = 0; i < bins; i++) {
            const x = 25 + i * binWidth;
            const y = profileY + profileHeight - 15 - (concentrationProfile[i] * scale);
            this.ctx.lineTo(x, y);
        }
        this.ctx.lineTo(25 + profileWidth, profileY + profileHeight - 15);
        this.ctx.closePath();
        this.ctx.fill();
        
        // Enhanced labels with better styling
        this.ctx.fillStyle = '#333';
        this.ctx.font = 'bold 16px Inter';
        this.ctx.textRenderingOptimization = 'optimizeLegibility';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Concentration Profile', this.ctx.canvas.width / 2, profileY - 8);
        
        // Add gradient text effect for labels
        const labelGradient = this.ctx.createLinearGradient(30, profileY + 15, this.ctx.canvas.width - 30, profileY + 15);
        labelGradient.addColorStop(0, '#FF6B6B');
        labelGradient.addColorStop(1, '#764ba2');
        
        this.ctx.fillStyle = labelGradient;
        this.ctx.font = 'bold 14px Inter';
        this.ctx.fillText('High Concentration', 35, profileY + 20);
        this.ctx.fillText('Low Concentration', this.ctx.canvas.width - 35, profileY + 20);
    }
    
    drawStartBarrier() {
        // Draw enhanced barrier with gradient and glow
        const barrierX = this.ctx.canvas.width * 0.2;
        
        // Create gradient for barrier
        const barrierGradient = this.ctx.createLinearGradient(barrierX - 2, 0, barrierX + 2, 0);
        barrierGradient.addColorStop(0, 'rgba(255, 0, 0, 0.8)');
        barrierGradient.addColorStop(0.5, 'rgba(255, 107, 107, 1)');
        barrierGradient.addColorStop(1, 'rgba(255, 0, 0, 0.8)');
        
        this.ctx.strokeStyle = barrierGradient;
        this.ctx.lineWidth = 4;
        this.ctx.setLineDash([15, 8]);
        this.ctx.lineCap = 'round';
        
        // Add glow effect
        this.ctx.shadowColor = 'rgba(255, 0, 0, 0.6)';
        this.ctx.shadowBlur = 10;
        
        this.ctx.beginPath();
        this.ctx.moveTo(barrierX, 0);
        this.ctx.lineTo(barrierX, this.ctx.canvas.height);
        this.ctx.stroke();
        
        this.ctx.setLineDash([]);
        this.ctx.shadowBlur = 0;
        
        // Enhanced instruction text with modern styling
        const text = 'Click or tap to start diffusion';
        const textWidth = this.ctx.measureText(text).width;
        
        // Create glassmorphism background
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        this.ctx.fillRect(this.ctx.canvas.width / 2 - textWidth / 2 - 20, 
                         this.ctx.canvas.height - 60, textWidth + 40, 40);
        
        // Add border and shadow
        this.ctx.strokeStyle = 'rgba(102, 126, 234, 0.3)';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(this.ctx.canvas.width / 2 - textWidth / 2 - 20, 
                           this.ctx.canvas.height - 60, textWidth + 40, 40);
        
        // Add gradient text
        const textGradient = this.ctx.createLinearGradient(
            this.ctx.canvas.width / 2 - textWidth / 2, this.ctx.canvas.height - 50,
            this.ctx.canvas.width / 2 + textWidth / 2, this.ctx.canvas.height - 50
        );
        textGradient.addColorStop(0, '#667eea');
        textGradient.addColorStop(1, '#764ba2');
        
        this.ctx.fillStyle = textGradient;
        this.ctx.font = 'bold 18px Inter';
        this.ctx.textRenderingOptimization = 'optimizeLegibility';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(text, this.ctx.canvas.width / 2, this.ctx.canvas.height - 35);
    }
    
    getStats() {
        const avgSpeed = this.particles.reduce((sum, p) => 
            sum + Math.sqrt(p.vx * p.vx + p.vy * p.vy), 0) / this.particles.length;
        
        // Calculate concentration spread
        const leftParticles = this.particles.filter(p => p.x < this.ctx.canvas.width / 2).length;
        const rightParticles = this.particles.length - leftParticles;
        const concentrationSpread = Math.abs(leftParticles - rightParticles) / this.particles.length;
        
        return {
            particleCount: this.particles.length,
            avgSpeed: avgSpeed,
            concentrationSpread: concentrationSpread,
            time: this.time
        };
    }
    
    drawDiffusionLabels() {
        this.drawLabels(
            'Particle Diffusion',
            '∂c/∂t = D∇²c  |  J = -D∇c  |  D = kBT/(6πηr)'
        );
    }
}

// Gas Laws Simulation
export class GasLaws extends BaseAnimation {
    constructor(ctx) {
        super(ctx);
        this.animationType = 'gas-laws';
        this.particles = [];
        this.particleCount = 50;
        this.temperature = 300; // Kelvin
        this.volume = 300; // Container height
        this.pressure = 1.0; // External pressure
        this.speed = 1.0;
        this.showPressureGauge = true;
        this.showParticleTrails = false;
        this.showGasLaws = false;
        this.showPressureHeatmap = false;
        this.showVelocityDistribution = false;
        this.showGasLawGraph = false;
        this.showParticleCollisions = false;
        this.lawType = 'boyle';
        this.containerWidth = 200;
        this.containerX = 300;
        this.pistonY = 400 - this.volume;
        this.collisionCount = 0;
        this.velocityData = [];
        this.pressureHistory = [];
        this.volumeHistory = [];
        this.temperatureHistory = [];
        this.initialConditions = {
            pressure: 1.0,
            volume: 300,
            temperature: 300
        };
        
        this.initializeParticles();
    }
    
    initializeParticles() {
        this.particles = [];
        for (let i = 0; i < this.particleCount; i++) {
            this.particles.push({
                x: this.containerX + Math.random() * this.containerWidth,
                y: this.pistonY + this.volume + Math.random() * (this.volume * 0.8),
                vx: (Math.random() - 0.5) * this.temperature * 0.1,
                vy: (Math.random() - 0.5) * this.temperature * 0.1
            });
        }
    }
    
    setSpeed(speed) {
        this.speed = speed;
    }
    
    setParticleCount(count) {
        this.particleCount = count;
        this.initializeParticles();
    }
    
    setTemperature(temp) {
        this.temperature = temp;
        // Adjust particle velocities based on temperature
        this.particles.forEach(particle => {
            const speedFactor = Math.sqrt(temp / 300);
            particle.vx *= speedFactor;
            particle.vy *= speedFactor;
        });
    }
    
    setVolume(vol) {
        this.volume = vol;
        this.pistonY = 400 - this.volume;
        // Adjust particle positions to stay in container
        this.particles.forEach(particle => {
            if (particle.y > this.pistonY + this.volume) {
                particle.y = this.pistonY + this.volume - 10;
            }
        });
    }
    
    setPressure(pressure) {
        this.pressure = pressure;
    }
    
    setShowPressureGauge(show) {
        this.showPressureGauge = show;
    }
    
    setShowPressureHeatmap(show) {
        this.showPressureHeatmap = show;
    }
    
    setShowVelocityDistribution(show) {
        this.showVelocityDistribution = show;
    }
    
    setShowGasLawGraph(show) {
        this.showGasLawGraph = show;
    }
    
    setShowParticleCollisions(show) {
        this.showParticleCollisions = show;
    }
    
    setLawType(law) {
        this.lawType = law;
        // Reset to initial conditions when changing law
        this.pressure = this.initialConditions.pressure;
        this.volume = this.initialConditions.volume;
        this.temperature = this.initialConditions.temperature;
        this.pistonY = 400 - this.volume;
        this.reset();
    }
    
    reset() {
        this.time = 0;
        this.collisionCount = 0;
        this.velocityData = [];
        this.pressureHistory = [];
        this.volumeHistory = [];
        this.temperatureHistory = [];
        this.initializeParticles();
    }
    
    update(deltaTime) {
        this.time += deltaTime;
        const dt = (deltaTime / 1000) * this.speed * 2; // Standardized time step scaling
        
        // Update particles with collision detection
        this.particles.forEach((particle, index) => {
            // Update position
            particle.x += particle.vx * dt * 30;
            particle.y += particle.vy * dt * 30;
            
            // Bounce off container walls
            if (particle.x < this.containerX || particle.x > this.containerX + this.containerWidth) {
                particle.vx *= -0.8;
                particle.x = Math.max(this.containerX, Math.min(this.containerX + this.containerWidth, particle.x));
                this.collisionCount++;
            }
            
            // Bounce off piston and bottom
            if (particle.y < this.pistonY || particle.y > this.pistonY + this.volume) {
                particle.vy *= -0.8;
                particle.y = Math.max(this.pistonY, Math.min(this.pistonY + this.volume, particle.y));
                this.collisionCount++;
            }
            
            // Particle-to-particle collisions
            if (this.showParticleCollisions) {
                for (let j = index + 1; j < this.particles.length; j++) {
                    const other = this.particles[j];
                    const dx = particle.x - other.x;
                    const dy = particle.y - other.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    if (distance < 6) { // Collision radius
                        // Simple elastic collision
                        const tempVx = particle.vx;
                        const tempVy = particle.vy;
                        particle.vx = other.vx;
                        particle.vy = other.vy;
                        other.vx = tempVx;
                        other.vy = tempVy;
                        
                        this.collisionCount++;
                        
                        // Separate particles
                        const overlap = 6 - distance;
                        const moveX = (overlap * dx) / distance / 2;
                        const moveY = (overlap * dy) / distance / 2;
                        particle.x += moveX;
                        particle.y += moveY;
                        other.x -= moveX;
                        other.y -= moveY;
                    }
                }
            }
            

        });
        
        // Update velocity distribution data
        if (this.showVelocityDistribution) {
            this.velocityData.push(...this.particles.map(p => Math.sqrt(p.vx * p.vx + p.vy * p.vy)));
            if (this.velocityData.length > 1000) {
                this.velocityData = this.velocityData.slice(-500);
            }
        }
        
        // Update history data for graphs (always collect data)
        const currentPressure = this.calculatePressure();
        this.pressureHistory.push(currentPressure);
        this.volumeHistory.push(this.volume);
        this.temperatureHistory.push(this.temperature);
        
        if (this.pressureHistory.length > 100) {
            this.pressureHistory.shift();
            this.volumeHistory.shift();
            this.temperatureHistory.shift();
        }
        
        // Calculate and apply pressure effects
        this.calculatePressure();
    }
    
    calculatePressure() {
        // Calculate pressure based on particle collisions and container volume
        const particleDensity = this.particles.length / (this.containerWidth * this.volume);
        const avgSpeed = this.particles.reduce((sum, p) => 
            sum + Math.sqrt(p.vx * p.vx + p.vy * p.vy), 0) / this.particles.length;
        
        // Pressure is proportional to particle density and average kinetic energy
        const calculatedPressure = particleDensity * avgSpeed * avgSpeed * 0.01;
        
        // Apply gas law relationships based on current law type
        this.applyGasLaw();
        
        // Adjust piston position based on pressure difference
        const pressureDiff = calculatedPressure - this.pressure;
        this.pistonY += pressureDiff * 0.1;
        this.pistonY = Math.max(100, Math.min(350, this.pistonY)); // Limit piston movement
        this.volume = 400 - this.pistonY;
        
        return calculatedPressure;
    }
    
    applyGasLaw() {
        switch(this.lawType) {
            case 'boyle':
                // Boyle's Law: P₁V₁ = P₂V₂ (constant temperature)
                const boyleConstant = this.initialConditions.pressure * this.initialConditions.volume;
                if (this.volume !== this.initialConditions.volume) {
                    this.pressure = boyleConstant / this.volume;
                }
                break;
                
            case 'charles':
                // Charles's Law: V₁/T₁ = V₂/T₂ (constant pressure)
                const charlesConstant = this.initialConditions.volume / this.initialConditions.temperature;
                if (this.temperature !== this.initialConditions.temperature) {
                    this.volume = charlesConstant * this.temperature;
                    this.pistonY = 400 - this.volume;
                }
                break;
                
            case 'gay-lussac':
                // Gay-Lussac's Law: P₁/T₁ = P₂/T₂ (constant volume)
                const gayLussacConstant = this.initialConditions.pressure / this.initialConditions.temperature;
                if (this.temperature !== this.initialConditions.temperature) {
                    this.pressure = gayLussacConstant * this.temperature;
                }
                break;
                
            case 'combined':
                // Combined Gas Law: P₁V₁/T₁ = P₂V₂/T₂
                const combinedConstant = (this.initialConditions.pressure * this.initialConditions.volume) / this.initialConditions.temperature;
                if (this.volume !== this.initialConditions.volume || this.temperature !== this.initialConditions.temperature) {
                    this.pressure = (combinedConstant * this.temperature) / this.volume;
                }
                break;
        }
    }
    
    render() {
        // Draw pressure heatmap
        if (this.showPressureHeatmap) {
            this.drawPressureHeatmap();
        }
        
        // Draw velocity distribution
        if (this.showVelocityDistribution) {
            this.drawVelocityDistribution();
        }
        
        // Draw gas law graph
        if (this.showGasLawGraph) {
            this.drawGasLawGraph();
        }
        
        // Draw enhanced container with better visual design
        this.drawEnhancedContainer();
        
        // Draw particles with temperature-based coloring
            this.particles.forEach(particle => {
            // Draw particle with temperature-based color
                this.ctx.beginPath();
            this.ctx.fillStyle = this.getTemperatureColor(particle);
            this.ctx.arc(particle.x, particle.y, 3, 0, Math.PI * 2);
                this.ctx.fill();
            
            // Add particle border
            this.ctx.strokeStyle = '#fff';
            this.ctx.lineWidth = 1;
            this.ctx.stroke();
        });
        
        // Draw pressure gauge
        if (this.showPressureGauge) {
            this.drawPressureGauge();
        }
        
        // Draw law description and formula on canvas
        this.drawLawDescription();
        
        // Draw canvas labels
        this.drawGasLabels();
    }
    
    drawEnhancedContainer() {
        // Draw container with gradient and better styling
        const gradient = this.ctx.createLinearGradient(
            this.containerX, this.pistonY, 
            this.containerX + this.containerWidth, this.pistonY + this.volume
        );
        gradient.addColorStop(0, 'rgba(200, 220, 255, 0.1)');
        gradient.addColorStop(1, 'rgba(150, 180, 255, 0.2)');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(this.containerX, this.pistonY, this.containerWidth, this.volume);
        
        // Draw container border
        this.ctx.strokeStyle = '#2C3E50';
        this.ctx.lineWidth = 4;
        this.ctx.strokeRect(this.containerX, this.pistonY, this.containerWidth, this.volume);
        
        // Draw piston with enhanced styling
        this.ctx.fillStyle = '#34495E';
        this.ctx.fillRect(this.containerX - 8, this.pistonY - 15, this.containerWidth + 16, 30);
        
        // Piston border
        this.ctx.strokeStyle = '#2C3E50';
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(this.containerX - 8, this.pistonY - 15, this.containerWidth + 16, 30);
        
        // Piston handle
        this.ctx.fillStyle = '#E74C3C';
        this.ctx.fillRect(this.containerX + this.containerWidth/2 - 15, this.pistonY - 25, 30, 10);
        
        // Add labels
        this.ctx.fillStyle = '#2C3E50';
        this.ctx.font = 'bold 18px Inter';
        this.ctx.textRenderingOptimization = 'optimizeLegibility';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('GAS', this.containerX + this.containerWidth/2, this.pistonY + this.volume/2);
        
        // Volume indicator
        this.ctx.font = '14px Inter';
        this.ctx.textRenderingOptimization = 'optimizeLegibility';
        this.ctx.fillStyle = '#7F8C8D';
        this.ctx.fillText(`Volume: ${this.volume}`, this.containerX + this.containerWidth/2, this.pistonY + this.volume + 25);
    }
    
    drawLawDescription() {
        const canvasWidth = this.ctx.canvas.width;
        const canvasHeight = this.ctx.canvas.height;
        
        // Position the description panel on the right side (reduced width to avoid overlap)
        const panelX = canvasWidth - 220;
        const panelY = 20;
        const panelWidth = 200;
        const panelHeight = 220;
        
        // Background panel
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        this.ctx.fillRect(panelX, panelY, panelWidth, panelHeight);
        this.ctx.strokeStyle = '#2C3E50';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(panelX, panelY, panelWidth, panelHeight);
        
        this.ctx.fillStyle = '#2C3E50';
        this.ctx.font = 'bold 18px Inter';
        this.ctx.textRenderingOptimization = 'optimizeLegibility';
        this.ctx.textAlign = 'left';
        
        let y = panelY + 30;
        
        // Law title
        const lawNames = {
            'boyle': "Boyle's Law",
            'charles': "Charles's Law", 
            'gay-lussac': "Gay-Lussac's Law",
            'combined': "Combined Gas Law"
        };
        
        this.ctx.fillText(lawNames[this.lawType], panelX + 10, y);
        y += 30;
        
        // Formula
        this.ctx.font = 'bold 18px Inter';
        this.ctx.textRenderingOptimization = 'optimizeLegibility';
        this.ctx.fillStyle = '#E74C3C';
        
        switch(this.lawType) {
            case 'boyle':
                this.ctx.fillText('P₁V₁ = P₂V₂', panelX + 10, y);
                y += 25;
                this.ctx.font = '14px Inter';
        this.ctx.textRenderingOptimization = 'optimizeLegibility';
                this.ctx.fillStyle = '#7F8C8D';
                this.ctx.fillText('At constant temperature', panelX + 10, y);
                y += 18;
                this.ctx.fillText('Pressure ∝ 1/Volume', panelX + 10, y);
                break;
            case 'charles':
                this.ctx.fillText('V₁/T₁ = V₂/T₂', panelX + 10, y);
                y += 25;
                this.ctx.font = '14px Inter';
        this.ctx.textRenderingOptimization = 'optimizeLegibility';
                this.ctx.fillStyle = '#7F8C8D';
                this.ctx.fillText('At constant pressure', panelX + 10, y);
                y += 18;
                this.ctx.fillText('Volume ∝ Temperature', panelX + 10, y);
                break;
            case 'gay-lussac':
                this.ctx.fillText('P₁/T₁ = P₂/T₂', panelX + 10, y);
                y += 25;
                this.ctx.font = '14px Inter';
        this.ctx.textRenderingOptimization = 'optimizeLegibility';
                this.ctx.fillStyle = '#7F8C8D';
                this.ctx.fillText('At constant volume', panelX + 10, y);
                y += 18;
                this.ctx.fillText('Pressure ∝ Temperature', panelX + 10, y);
                break;
            case 'combined':
                this.ctx.fillText('P₁V₁/T₁ = P₂V₂/T₂', panelX + 10, y);
                y += 25;
                this.ctx.font = '14px Inter';
        this.ctx.textRenderingOptimization = 'optimizeLegibility';
                this.ctx.fillStyle = '#7F8C8D';
                this.ctx.fillText('Combines all three laws', panelX + 10, y);
                y += 18;
                this.ctx.fillText('PV/T = constant', panelX + 10, y);
                break;
        }
        
        // Current values
        y += 30;
        this.ctx.font = 'bold 14px Inter';
        this.ctx.textRenderingOptimization = 'optimizeLegibility';
        this.ctx.fillStyle = '#2C3E50';
        this.ctx.fillText('Current Values:', panelX + 10, y);
        y += 20;
        
        this.ctx.font = '13px Inter';
        this.ctx.textRenderingOptimization = 'optimizeLegibility';
        this.ctx.fillStyle = '#7F8C8D';
        this.ctx.fillText(`P = ${this.pressure.toFixed(2)} atm`, panelX + 10, y);
        y += 16;
        this.ctx.fillText(`V = ${this.volume.toFixed(0)} units`, panelX + 10, y);
        y += 16;
        this.ctx.fillText(`T = ${this.temperature} K`, panelX + 10, y);
    }
    
    getTemperatureColor(particle) {
        const velocity = Math.sqrt(particle.vx * particle.vx + particle.vy * particle.vy);
        const maxVelocity = this.temperature * 0.2;
        const normalizedVelocity = Math.min(velocity / maxVelocity, 1);
        
        if (normalizedVelocity < 0.5) {
            // Blue to green
            const t = normalizedVelocity * 2;
            return `rgb(0, ${Math.floor(255 * t)}, ${Math.floor(255 * (1 - t))})`;
        } else {
            // Green to red
            const t = (normalizedVelocity - 0.5) * 2;
            return `rgb(${Math.floor(255 * t)}, ${Math.floor(255 * (1 - t))}, 0)`;
        }
    }
    
    drawPressureGauge() {
        const gaugeX = 50;
        const gaugeY = 150; // Moved down to avoid overlap with main labels
        const gaugeRadius = 30;
        
        // Draw gauge background
        this.ctx.beginPath();
        this.ctx.fillStyle = '#f0f0f0';
        this.ctx.arc(gaugeX, gaugeY, gaugeRadius, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        
        // Calculate pressure value (0-1 scale)
        const particleDensity = this.particles.length / (this.containerWidth * this.volume);
        const avgSpeed = this.particles.reduce((sum, p) => 
            sum + Math.sqrt(p.vx * p.vx + p.vy * p.vy), 0) / this.particles.length;
        
        // Use the actual pressure value from gas law calculations
        const pressureValue = Math.min(this.pressure / 2.0, 1.0); // Scale to 0-1 range
        
        // Draw pressure needle
        const angle = -Math.PI/2 + pressureValue * Math.PI;
        this.ctx.beginPath();
        this.ctx.strokeStyle = '#FF6B6B';
        this.ctx.lineWidth = 3;
        this.ctx.moveTo(gaugeX, gaugeY);
        this.ctx.lineTo(
            gaugeX + Math.cos(angle) * (gaugeRadius - 5),
            gaugeY + Math.sin(angle) * (gaugeRadius - 5)
        );
        this.ctx.stroke();
        
        // Draw pressure label
        this.ctx.fillStyle = '#333';
        this.ctx.font = '14px Inter';
        this.ctx.textRenderingOptimization = 'optimizeLegibility';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Pressure', gaugeX, gaugeY + gaugeRadius + 15);
        this.ctx.fillText(pressureValue.toFixed(2), gaugeX, gaugeY + gaugeRadius + 30);
    }
    
    drawPressureHeatmap() {
        const gridSize = 15;
        const cols = Math.ceil(this.containerWidth / gridSize);
        const rows = Math.ceil(this.volume / gridSize);
        
        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                const centerX = this.containerX + j * gridSize + gridSize / 2;
                const centerY = this.pistonY + i * gridSize + gridSize / 2;
                
                // Calculate local pressure based on nearby particles
                let localPressure = 0;
                let particleCount = 0;
                
                this.particles.forEach(particle => {
                    const dx = particle.x - centerX;
                    const dy = particle.y - centerY;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    if (distance < gridSize) {
                        const velocity = Math.sqrt(particle.vx * particle.vx + particle.vy * particle.vy);
                        localPressure += velocity * velocity;
                        particleCount++;
                    }
                });
                
                if (particleCount > 0) {
                    localPressure /= particleCount;
                    const alpha = Math.min(localPressure / 100, 0.4);
                    this.ctx.fillStyle = `rgba(255, 100, 100, ${alpha})`;
                    this.ctx.fillRect(
                        this.containerX + j * gridSize, 
                        this.pistonY + i * gridSize, 
                        gridSize, 
                        gridSize
                    );
                }
            }
        }
    }
    
    drawVelocityDistribution() {
        const graphWidth = 200;
        const graphHeight = 100;
        const graphX = this.ctx.canvas.width - graphWidth - 20;
        const graphY = 120; // Moved down to avoid overlap with main labels
        
        // Background
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        this.ctx.fillRect(graphX, graphY, graphWidth, graphHeight);
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(graphX, graphY, graphWidth, graphHeight);
        
        if (this.velocityData.length > 0) {
            // Create histogram
            const bins = 20;
            const histogram = new Array(bins).fill(0);
            const maxVelocity = Math.max(...this.velocityData);
            
            this.velocityData.forEach(velocity => {
                const binIndex = Math.floor((velocity / maxVelocity) * (bins - 1));
                if (binIndex >= 0 && binIndex < bins) {
                    histogram[binIndex]++;
                }
            });
            
            // Draw histogram
            const maxCount = Math.max(...histogram);
            const barWidth = graphWidth / bins;
            
            this.ctx.fillStyle = '#4ECDC4';
            for (let i = 0; i < bins; i++) {
                const barHeight = (histogram[i] / maxCount) * (graphHeight - 20);
                this.ctx.fillRect(
                    graphX + i * barWidth + 2, 
                    graphY + graphHeight - 10 - barHeight, 
                    barWidth - 4, 
                    barHeight
                );
            }
        }
        
        // Labels
        this.ctx.fillStyle = '#333';
        this.ctx.font = '14px Inter';
        this.ctx.textRenderingOptimization = 'optimizeLegibility';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Velocity Distribution', graphX + graphWidth / 2, graphY - 5);
    }
    
    drawGasLawGraph() {
        const graphWidth = 300;
        const graphHeight = 150;
        const graphX = 20;
        const graphY = this.ctx.canvas.height - graphHeight - 20;
        
        // Background
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        this.ctx.fillRect(graphX, graphY, graphWidth, graphHeight);
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(graphX, graphY, graphWidth, graphHeight);
        
        if (this.pressureHistory.length > 1) {
            // Calculate data ranges for proper scaling
            const maxPressure = Math.max(...this.pressureHistory);
            const minPressure = Math.min(...this.pressureHistory);
            const maxVolume = Math.max(...this.volumeHistory);
            const minVolume = Math.min(...this.volumeHistory);
            const maxTemp = Math.max(...this.temperatureHistory);
            const minTemp = Math.min(...this.temperatureHistory);
            
            // Draw graph based on current law type
            this.ctx.strokeStyle = '#FF6B6B';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            
            for (let i = 0; i < this.pressureHistory.length; i++) {
                let x, y;
                
                switch(this.lawType) {
                    case 'boyle':
                        // P vs V (inverse relationship)
                        x = graphX + ((this.volumeHistory[i] - minVolume) / (maxVolume - minVolume)) * graphWidth;
                        y = graphY + graphHeight - ((this.pressureHistory[i] - minPressure) / (maxPressure - minPressure)) * graphHeight;
                        break;
                    case 'charles':
                        // V vs T (linear relationship)
                        x = graphX + ((this.temperatureHistory[i] - minTemp) / (maxTemp - minTemp)) * graphWidth;
                        y = graphY + graphHeight - ((this.volumeHistory[i] - minVolume) / (maxVolume - minVolume)) * graphHeight;
                        break;
                    case 'gay-lussac':
                        // P vs T (linear relationship)
                        x = graphX + ((this.temperatureHistory[i] - minTemp) / (maxTemp - minTemp)) * graphWidth;
                        y = graphY + graphHeight - ((this.pressureHistory[i] - minPressure) / (maxPressure - minPressure)) * graphHeight;
                        break;
                    default:
                        x = graphX + (i / this.pressureHistory.length) * graphWidth;
                        y = graphY + graphHeight - ((this.pressureHistory[i] - minPressure) / (maxPressure - minPressure)) * graphHeight;
                }
                
                // Ensure coordinates are within graph bounds
                x = Math.max(graphX, Math.min(graphX + graphWidth, x));
                y = Math.max(graphY, Math.min(graphY + graphHeight, y));
                
                if (i === 0) {
                    this.ctx.moveTo(x, y);
                } else {
                    this.ctx.lineTo(x, y);
                }
            }
            this.ctx.stroke();
            
            // Draw data points
            this.ctx.fillStyle = '#FF6B6B';
            for (let i = 0; i < this.pressureHistory.length; i += 5) { // Draw every 5th point
                let x, y;
                
                switch(this.lawType) {
                    case 'boyle':
                        x = graphX + ((this.volumeHistory[i] - minVolume) / (maxVolume - minVolume)) * graphWidth;
                        y = graphY + graphHeight - ((this.pressureHistory[i] - minPressure) / (maxPressure - minPressure)) * graphHeight;
                        break;
                    case 'charles':
                        x = graphX + ((this.temperatureHistory[i] - minTemp) / (maxTemp - minTemp)) * graphWidth;
                        y = graphY + graphHeight - ((this.volumeHistory[i] - minVolume) / (maxVolume - minVolume)) * graphHeight;
                        break;
                    case 'gay-lussac':
                        x = graphX + ((this.temperatureHistory[i] - minTemp) / (maxTemp - minTemp)) * graphWidth;
                        y = graphY + graphHeight - ((this.pressureHistory[i] - minPressure) / (maxPressure - minPressure)) * graphHeight;
                        break;
                    default:
                        x = graphX + (i / this.pressureHistory.length) * graphWidth;
                        y = graphY + graphHeight - ((this.pressureHistory[i] - minPressure) / (maxPressure - minPressure)) * graphHeight;
                }
                
                x = Math.max(graphX, Math.min(graphX + graphWidth, x));
                y = Math.max(graphY, Math.min(graphY + graphHeight, y));
                
                this.ctx.beginPath();
                this.ctx.arc(x, y, 2, 0, Math.PI * 2);
                this.ctx.fill();
            }
        }
        
        // Labels
        this.ctx.fillStyle = '#333';
        this.ctx.font = '14px Inter';
        this.ctx.textRenderingOptimization = 'optimizeLegibility';
        this.ctx.textAlign = 'center';
        
        let xLabel, yLabel;
        switch(this.lawType) {
            case 'boyle':
                xLabel = 'Volume';
                yLabel = 'Pressure';
                break;
            case 'charles':
                xLabel = 'Temperature (K)';
                yLabel = 'Volume';
                break;
            case 'gay-lussac':
                xLabel = 'Temperature (K)';
                yLabel = 'Pressure';
                break;
            default:
                xLabel = 'Time';
                yLabel = 'Pressure';
        }
        
        this.ctx.fillText(`${yLabel} vs ${xLabel}`, graphX + graphWidth / 2, graphY - 5);
    }
    
    getStats() {
        const particleDensity = this.particles.length / (this.containerWidth * this.volume);
        const avgSpeed = this.particles.reduce((sum, p) => 
            sum + Math.sqrt(p.vx * p.vx + p.vy * p.vy), 0) / this.particles.length;
        const calculatedPressure = particleDensity * avgSpeed * avgSpeed * 0.01;
        
        return {
            particleCount: this.particles.length,
            temperature: this.temperature,
            pressure: calculatedPressure,
            volume: Math.round(this.volume),
            collisionCount: this.collisionCount,
            lawType: this.lawType
        };
    }
    
    drawGasLabels() {
        this.drawLabels('Gas Laws', '');
    }
}