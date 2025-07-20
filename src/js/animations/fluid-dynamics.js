// Fluid Flow Simulation
import { BaseAnimation } from './base-animation.js';

export class FluidFlow extends BaseAnimation {
    constructor(ctx) {
        super(ctx);
        this.animationType = 'fluid-flow';
        this.particles = [];
        this.obstacles = [];
        this.flowRate = 1;
        this.viscosity = 1;
        this.reynoldsNumber = 100;
        this.visualizationMode = 'particles';
        this.maxParticles = 100;
        this.flowType = 'Laminar';
        this.mouseX = 0;
        this.mouseY = 0;
        this.mouseInfluence = 40;
        
        this.initializeParticles();
        this.initializeObstacles();
        this.setupMouseInteraction();
    }
    
    setupMouseInteraction() {
        const canvas = this.ctx.canvas;
        canvas.addEventListener('mousemove', (e) => {
            const rect = canvas.getBoundingClientRect();
            this.mouseX = e.clientX - rect.left;
            this.mouseY = e.clientY - rect.top;
        });
        
        canvas.addEventListener('mouseleave', () => {
            this.mouseX = -1000;
            this.mouseY = -1000;
        });
        
        // Add touch event listeners for mobile support
        canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const rect = canvas.getBoundingClientRect();
            const touch = e.touches[0];
            this.mouseX = touch.clientX - rect.left;
            this.mouseY = touch.clientY - rect.top;
        });
        
        canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const rect = canvas.getBoundingClientRect();
            const touch = e.touches[0];
            this.mouseX = touch.clientX - rect.left;
            this.mouseY = touch.clientY - rect.top;
        });
        
        canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.mouseX = -1000;
            this.mouseY = -1000;
        });
    }
    
    initializeParticles() {
        this.particles = [];
        for (let i = 0; i < this.maxParticles; i++) {
            this.particles.push({
                x: -50 + Math.random() * 100, // Start from left side
                y: 50 + Math.random() * (this.ctx.canvas.height - 100),
                vx: this.flowRate * (1 + Math.random() * 0.3),
                vy: (Math.random() - 0.5) * 0.3,
                size: 3 + Math.random() * 2,
                color: `hsl(${200 + Math.random() * 60}, 70%, 60%)`,
                life: 0
            });
        }
    }
    
    initializeObstacles() {
        this.obstacles = [
            // Porous sponge in the middle top
            { x: 400, y: 80, width: 80, height: 100, type: 'porous' },
            // Solid building in the middle bottom
            { x: 400, y: 420, width: 100, height: 120, type: 'solid' }
        ];
    }
    
    setFlowRate(rate) {
        this.flowRate = rate;
        this.updateReynoldsNumber();
    }
    
    setViscosity(visc) {
        this.viscosity = visc;
        this.updateReynoldsNumber();
    }
    
    setReynoldsNumber(re) {
        this.reynoldsNumber = re;
        this.updateFlowType();
    }
    
    setVisualizationMode(mode) {
        this.visualizationMode = mode;
    }
    
    updateReynoldsNumber() {
        // Simplified Reynolds number calculation
        this.reynoldsNumber = Math.round((this.flowRate * 50) / this.viscosity);
        this.updateFlowType();
    }
    
    updateFlowType() {
        if (this.reynoldsNumber < 2300) {
            this.flowType = 'Laminar';
        } else if (this.reynoldsNumber < 4000) {
            this.flowType = 'Transitional';
        } else {
            this.flowType = 'Turbulent';
        }
    }
    
    reset() {
        this.time = 0;
        this.initializeParticles();
    }
    
    update(deltaTime) {
        this.time += deltaTime;
        
        this.particles.forEach((particle, index) => {
            // Apply flow field
            const flowVelocity = this.calculateFlowVelocity(particle.x, particle.y);
            
            // Add turbulence based on Reynolds number
            const turbulence = this.flowType === 'Turbulent' ? 
                (Math.random() - 0.5) * 2 * this.flowRate : 0;
            
            // Add enhanced mouse interaction with stronger effect
            const dx = this.mouseX - particle.x;
            const dy = this.mouseY - particle.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Start with flow velocity
            particle.vx = flowVelocity.x + turbulence;
            particle.vy = flowVelocity.y + turbulence;
            
            // Apply mouse influence on top of flow velocity
            if (distance < this.mouseInfluence && distance > 0) {
                const force = (this.mouseInfluence - distance) / this.mouseInfluence;
                // Gentler mouse influence
                particle.vx += (dx / distance) * force * 1.2;
                particle.vy += (dy / distance) * force * 1.2;
                
                // Add subtle randomness
                particle.vx += (Math.random() - 0.5) * force * 0.2;
                particle.vy += (Math.random() - 0.5) * force * 0.2;
            }
            
            // Apply viscosity damping
            particle.vx *= (1 - this.viscosity * 0.01);
            particle.vy *= (1 - this.viscosity * 0.01);
            
            // Update position
            particle.x += particle.vx * deltaTime * 0.1;
            particle.y += particle.vy * deltaTime * 0.1;
            particle.life += deltaTime;
            
            // Reset particles that go off screen or get stuck
            if (particle.x > this.ctx.canvas.width + 50 || 
                particle.x < -50 || 
                particle.y < -50 || 
                particle.y > this.ctx.canvas.height + 50 ||
                particle.life > 10000) {
                this.resetParticle(particle);
            }
        });
    }
    
    resetParticle(particle) {
        particle.x = -50 + Math.random() * 100;
        particle.y = 50 + Math.random() * (this.ctx.canvas.height - 100);
        particle.vx = this.flowRate * (1 + Math.random() * 0.3);
        particle.vy = (Math.random() - 0.5) * 0.3;
        particle.life = 0;
    }
    
    calculateFlowVelocity(x, y) {
        let vx = this.flowRate;
        let vy = 0;
        
        // Check for obstacle interactions
        this.obstacles.forEach(obstacle => {
            if (x > obstacle.x && x < obstacle.x + obstacle.width &&
                y > obstacle.y && y < obstacle.y + obstacle.height) {
                
                if (obstacle.type === 'porous') {
                    // Porous material: slow down the flow but allow it to continue
                    vx *= 0.3; // Slow down to 30% of original speed
                    vy *= 0.3;
                    
                    // Add some small random variation to simulate porous flow
                    vx += (Math.random() - 0.5) * this.flowRate * 0.1;
                    vy += (Math.random() - 0.5) * this.flowRate * 0.1;
                } else if (obstacle.type === 'solid') {
                    // Solid material: completely block the flow
                    vx = (Math.random() - 0.5) * this.flowRate * 0.5;
                    vy = (Math.random() - 0.5) * this.flowRate * 0.5;
                }
            }
        });
        
        // Add some vertical variation based on y position
        const centerY = this.ctx.canvas.height / 2;
        const distanceFromCenter = Math.abs(y - centerY);
        const maxVariation = this.flowRate * 0.2;
        vy += (y - centerY) / centerY * maxVariation;
        
        // Add mouse interaction effects to all visualization modes
        if (this.mouseX > 0 && this.mouseY > 0) {
            const dx = this.mouseX - x;
            const dy = this.mouseY - y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < this.mouseInfluence && distance > 0) {
                const force = (this.mouseInfluence - distance) / this.mouseInfluence;
                // Apply mouse influence to velocity field
                vx += (dx / distance) * force * 1.2;
                vy += (dy / distance) * force * 1.2;
            }
        }
        
        return { x: vx, y: vy };
    }
    
    render() {
        this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
        
        // Draw background
        this.drawBackground();
        
        // Draw obstacles
        this.drawObstacles();
        
        // Draw based on visualization mode
        switch (this.visualizationMode) {
            case 'particles':
                this.drawParticles();
                break;
            case 'streamlines':
                this.drawStreamlines();
                break;
            case 'velocity':
                this.drawVelocityField();
                break;
            case 'pressure':
                this.drawPressureField();
                break;
        }
        
        // Draw flow information
        this.drawFlowInfo();
        
        // Add real-world analogy for beginners
        this.drawRealWorldAnalogy();
        
        // Draw mouse interaction indicator
        this.drawMouseIndicator();
    }
    
    drawBackground() {
        // Modern gradient background with enhanced styling
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.ctx.canvas.height);
        gradient.addColorStop(0, '#E8F4FD');
        gradient.addColorStop(0.3, '#D1E7FF');
        gradient.addColorStop(0.7, '#B8D4F8');
        gradient.addColorStop(1, '#A3C4F0');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
        
        // Add subtle grid pattern for depth
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.lineWidth = 1;
        this.ctx.setLineDash([20, 20]);
        
        for (let x = 0; x < this.ctx.canvas.width; x += 40) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.ctx.canvas.height);
            this.ctx.stroke();
        }
        
        for (let y = 0; y < this.ctx.canvas.height; y += 40) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.ctx.canvas.width, y);
            this.ctx.stroke();
        }
        
        this.ctx.setLineDash([]);
    }
    
    drawObstacles() {
        this.obstacles.forEach(obstacle => {
            switch (obstacle.type) {
                case 'porous':
                    this.drawPorousObject(obstacle);
                    break;
                case 'solid':
                    this.drawSolidObject(obstacle);
                    break;
            }
        });
    }
    
    drawPorousObject(obstacle) {
        // Enhanced porous sponge-like object with modern styling
        
        // Add shadow for depth
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        this.ctx.shadowBlur = 8;
        this.ctx.shadowOffsetX = 2;
        this.ctx.shadowOffsetY = 2;
        
        // Create gradient for sponge
        const spongeGradient = this.ctx.createLinearGradient(
            obstacle.x, obstacle.y, 
            obstacle.x + obstacle.width, obstacle.y + obstacle.height
        );
        spongeGradient.addColorStop(0, 'rgba(255, 182, 193, 0.95)');
        spongeGradient.addColorStop(0.5, 'rgba(255, 150, 150, 0.9)');
        spongeGradient.addColorStop(1, 'rgba(255, 182, 193, 0.95)');
        
        this.ctx.fillStyle = spongeGradient;
        this.ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        
        // Reset shadow
        this.ctx.shadowBlur = 0;
        this.ctx.shadowOffsetX = 0;
        this.ctx.shadowOffsetY = 0;
        
        // Enhanced porous holes with gradient
        for (let row = 0; row < 4; row++) {
            for (let col = 0; col < 6; col++) {
                const holeX = obstacle.x + 10 + col * 12;
                const holeY = obstacle.y + 15 + row * 20;
                
                // Create gradient for each hole
                const holeGradient = this.ctx.createRadialGradient(
                    holeX, holeY, 0, holeX, holeY, 4
                );
                holeGradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
                holeGradient.addColorStop(1, 'rgba(255, 255, 255, 0.6)');
                
                this.ctx.fillStyle = holeGradient;
                this.ctx.beginPath();
                this.ctx.arc(holeX, holeY, 4, 0, Math.PI * 2);
                this.ctx.fill();
            }
        }
        
        // Enhanced sponge texture lines with gradient
        this.ctx.strokeStyle = 'rgba(255, 150, 150, 0.8)';
        this.ctx.lineWidth = 2;
        this.ctx.lineCap = 'round';
        for (let i = 0; i < obstacle.height; i += 15) {
            this.ctx.beginPath();
            this.ctx.moveTo(obstacle.x, obstacle.y + i);
            this.ctx.lineTo(obstacle.x + obstacle.width, obstacle.y + i);
            this.ctx.stroke();
        }
        
        // Enhanced outline with gradient
        const outlineGradient = this.ctx.createLinearGradient(
            obstacle.x, obstacle.y, 
            obstacle.x + obstacle.width, obstacle.y + obstacle.height
        );
        outlineGradient.addColorStop(0, 'rgba(255, 100, 100, 0.9)');
        outlineGradient.addColorStop(0.5, 'rgba(255, 80, 80, 0.95)');
        outlineGradient.addColorStop(1, 'rgba(255, 100, 100, 0.9)');
        
        this.ctx.strokeStyle = outlineGradient;
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        
        // Enhanced label with modern styling
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.font = 'bold 16px Inter, Arial, sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('🧽 Porous Sponge', obstacle.x + obstacle.width/2, obstacle.y + obstacle.height/2 + 6);
    }
    
    drawTree(obstacle) {
        // Draw tree trunk
        this.ctx.fillStyle = 'rgba(139, 69, 19, 0.9)';
        this.ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        
        // Draw tree bark texture
        this.ctx.strokeStyle = 'rgba(101, 67, 33, 0.8)';
        this.ctx.lineWidth = 2;
        for (let i = 0; i < obstacle.height; i += 15) {
            this.ctx.beginPath();
            this.ctx.moveTo(obstacle.x, obstacle.y + i);
            this.ctx.lineTo(obstacle.x + obstacle.width, obstacle.y + i);
            this.ctx.stroke();
        }
        
        // Draw tree foliage
        this.ctx.fillStyle = 'rgba(34, 139, 34, 0.8)';
        this.ctx.beginPath();
        this.ctx.arc(obstacle.x + obstacle.width/2, obstacle.y - 10, 25, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Add label
        this.ctx.fillStyle = '#000000';
        this.ctx.font = 'bold 12px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('🌳 Tree', obstacle.x + obstacle.width/2, obstacle.y + obstacle.height/2 + 4);
    }
    
    drawSolidObject(obstacle) {
        // Enhanced solid, dense object with modern styling
        
        // Add shadow for depth
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
        this.ctx.shadowBlur = 10;
        this.ctx.shadowOffsetX = 3;
        this.ctx.shadowOffsetY = 3;
        
        // Create gradient for solid block
        const blockGradient = this.ctx.createLinearGradient(
            obstacle.x, obstacle.y, 
            obstacle.x + obstacle.width, obstacle.y + obstacle.height
        );
        blockGradient.addColorStop(0, 'rgba(120, 120, 120, 0.95)');
        blockGradient.addColorStop(0.3, 'rgba(105, 105, 105, 0.95)');
        blockGradient.addColorStop(0.7, 'rgba(90, 90, 90, 0.95)');
        blockGradient.addColorStop(1, 'rgba(75, 75, 75, 0.95)');
        
        this.ctx.fillStyle = blockGradient;
        this.ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        
        // Reset shadow
        this.ctx.shadowBlur = 0;
        this.ctx.shadowOffsetX = 0;
        this.ctx.shadowOffsetY = 0;
        
        // Enhanced solid texture lines with gradient
        this.ctx.strokeStyle = 'rgba(80, 80, 80, 0.9)';
        this.ctx.lineWidth = 2;
        this.ctx.lineCap = 'round';
        for (let i = 0; i < obstacle.height; i += 20) {
            this.ctx.beginPath();
            this.ctx.moveTo(obstacle.x, obstacle.y + i);
            this.ctx.lineTo(obstacle.x + obstacle.width, obstacle.y + i);
            this.ctx.stroke();
        }
        
        // Enhanced vertical texture lines
        for (let i = 0; i < obstacle.width; i += 25) {
            this.ctx.beginPath();
            this.ctx.moveTo(obstacle.x + i, obstacle.y);
            this.ctx.lineTo(obstacle.x + i, obstacle.y + obstacle.height);
            this.ctx.stroke();
        }
        
        // Enhanced solid outline with gradient
        const outlineGradient = this.ctx.createLinearGradient(
            obstacle.x, obstacle.y, 
            obstacle.x + obstacle.width, obstacle.y + obstacle.height
        );
        outlineGradient.addColorStop(0, 'rgba(50, 50, 50, 0.95)');
        outlineGradient.addColorStop(0.5, 'rgba(30, 30, 30, 0.98)');
        outlineGradient.addColorStop(1, 'rgba(50, 50, 50, 0.95)');
        
        this.ctx.strokeStyle = outlineGradient;
        this.ctx.lineWidth = 4;
        this.ctx.strokeRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        
        // Enhanced label with modern styling
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.font = 'bold 16px Inter, Arial, sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('🪨 Solid Block', obstacle.x + obstacle.width/2, obstacle.y + obstacle.height/2 + 6);
    }
    
    drawPillar(obstacle) {
        // Draw pillar base
        this.ctx.fillStyle = 'rgba(192, 192, 192, 0.9)';
        this.ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        
        // Draw pillar texture (brick pattern)
        this.ctx.strokeStyle = 'rgba(160, 160, 160, 0.8)';
        this.ctx.lineWidth = 1;
        for (let i = 0; i < obstacle.height; i += 12) {
            this.ctx.beginPath();
            this.ctx.moveTo(obstacle.x, obstacle.y + i);
            this.ctx.lineTo(obstacle.x + obstacle.width, obstacle.y + i);
            this.ctx.stroke();
        }
        
        // Draw pillar cap
        this.ctx.fillStyle = 'rgba(220, 220, 220, 0.9)';
        this.ctx.fillRect(obstacle.x - 5, obstacle.y - 5, obstacle.width + 10, 10);
        
        // Add label
        this.ctx.fillStyle = '#000000';
        this.ctx.font = 'bold 12px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('🏛️ Pillar', obstacle.x + obstacle.width/2, obstacle.y + obstacle.height/2 + 4);
    }
    
    drawBoulder(obstacle) {
        // Draw a large boulder with irregular shape
        this.ctx.fillStyle = 'rgba(128, 128, 128, 0.9)';
        this.ctx.beginPath();
        this.ctx.ellipse(obstacle.x + obstacle.width/2, obstacle.y + obstacle.height/2, 
                         obstacle.width/2 + 5, obstacle.height/2 + 3, 0.3, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Add boulder texture and shading
        this.ctx.strokeStyle = 'rgba(90, 90, 90, 0.8)';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(obstacle.x + 15, obstacle.y + 10, 8, 0, Math.PI * 2);
        this.ctx.stroke();
        this.ctx.beginPath();
        this.ctx.arc(obstacle.x + 35, obstacle.y + 25, 6, 0, Math.PI * 2);
        this.ctx.stroke();
        
        // Add label
        this.ctx.fillStyle = '#000000';
        this.ctx.font = 'bold 12px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('🪨 Boulder', obstacle.x + obstacle.width/2, obstacle.y + obstacle.height/2 + 4);
    }
    
    drawParticles() {
        this.particles.forEach(particle => {
            // Calculate velocity for color intensity
            const velocity = Math.sqrt(particle.vx * particle.vx + particle.vy * particle.vy);
            const maxVelocity = this.flowRate * 2;
            const intensity = Math.min(velocity / maxVelocity, 1);
            
            // Check if particle is being affected by mouse
            const dx = this.mouseX - particle.x;
            const dy = this.mouseY - particle.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const isMouseAffected = distance < this.mouseInfluence && distance > 0;
            
            // Enhanced dynamic color based on velocity and mouse interaction
            let hue, saturation, lightness, glowColor;
            if (isMouseAffected) {
                // Particles affected by mouse get a purple color with glow
                hue = 270 + Math.random() * 30; // Purple range
                saturation = 80;
                lightness = 60;
                glowColor = `rgba(147, 112, 219, ${intensity * 0.6})`;
            } else {
                // Normal blue to cyan gradient
                hue = 200 + intensity * 60;
                saturation = 70 + intensity * 30;
                lightness = 60 - intensity * 20;
                glowColor = `rgba(135, 206, 250, ${intensity * 0.4})`;
            }
            
            const particleColor = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
            
            // Enhanced glow effect for fast particles
            if (velocity > this.flowRate * 0.8) {
                this.ctx.shadowColor = glowColor;
                this.ctx.shadowBlur = 10;
                this.ctx.fillStyle = particleColor;
                this.ctx.beginPath();
                this.ctx.arc(particle.x, particle.y, particle.size + 2, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.shadowBlur = 0;
            }
            
            // Draw main particle with gradient
            const gradient = this.ctx.createRadialGradient(
                particle.x - particle.size * 0.3, particle.y - particle.size * 0.3, 0,
                particle.x, particle.y, particle.size
            );
            gradient.addColorStop(0, `hsl(${hue}, ${saturation}%, ${lightness + 20}%)`);
            gradient.addColorStop(0.7, particleColor);
            gradient.addColorStop(1, `hsl(${hue}, ${saturation}%, ${lightness - 20}%)`);
            
            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Enhanced speed trails for fast particles
            if (velocity > this.flowRate * 0.5) {
                const trailGradient = this.ctx.createLinearGradient(
                    particle.x, particle.y,
                    particle.x - particle.vx * 0.5, particle.y - particle.vy * 0.5
                );
                trailGradient.addColorStop(0, `hsla(${hue}, ${saturation}%, ${lightness}%, ${intensity * 0.8})`);
                trailGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
                
                this.ctx.strokeStyle = trailGradient;
                this.ctx.lineWidth = Math.max(2, velocity * 2);
                this.ctx.lineCap = 'round';
                this.ctx.beginPath();
                this.ctx.moveTo(particle.x, particle.y);
                this.ctx.lineTo(particle.x - particle.vx * 0.5, particle.y - particle.vy * 0.5);
                this.ctx.stroke();
            }
            
            // Add enhanced trail for mouse-affected particles
            if (isMouseAffected) {
                this.ctx.strokeStyle = `rgba(147, 112, 219, 0.8)`;
                this.ctx.lineWidth = 3;
                this.ctx.lineCap = 'round';
                this.ctx.beginPath();
                this.ctx.moveTo(particle.x, particle.y);
                this.ctx.lineTo(particle.x - particle.vx * 0.8, particle.y - particle.vy * 0.8);
                this.ctx.stroke();
            }
        });
    }
    
    drawStreamlines() {
        // Enhanced streamline visualization with realistic flow patterns
        const streamlineCount = 15;
        const pointsPerStreamline = 100;
        
        for (let i = 0; i < streamlineCount; i++) {
            // Start streamlines at different heights
            const startY = 50 + (i * (this.ctx.canvas.height - 100)) / (streamlineCount - 1);
            let x = 0;
            let y = startY;
            
            this.ctx.beginPath();
            this.ctx.moveTo(x, y);
            
            // Draw streamline with varying opacity and thickness based on velocity
            for (let j = 0; j < pointsPerStreamline; j++) {
                const velocity = this.calculateFlowVelocity(x, y);
                const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
                
                // Calculate next point with some randomness for realistic flow
                const nextX = x + velocity.x * 8 + (Math.random() - 0.5) * 2;
                const nextY = y + velocity.y * 8 + (Math.random() - 0.5) * 2;
                
                // Check if this point is affected by mouse
                const dx = this.mouseX - x;
                const dy = this.mouseY - y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const isMouseAffected = distance < this.mouseInfluence && distance > 0;
                
                // Vary line properties based on speed and mouse interaction
                const opacity = Math.min(0.8, 0.3 + speed * 0.5);
                const lineWidth = Math.max(1, speed * 2);
                
                // Use purple color for mouse-affected areas, blue for normal
                if (isMouseAffected) {
                    this.ctx.strokeStyle = `rgba(147, 112, 219, ${opacity})`;
                    this.ctx.lineWidth = lineWidth + 1; // Slightly thicker for mouse-affected areas
                } else {
                    this.ctx.strokeStyle = `rgba(0, 100, 200, ${opacity})`;
                    this.ctx.lineWidth = lineWidth;
                }
                
                this.ctx.lineTo(nextX, nextY);
                
                x = nextX;
                y = nextY;
                
                // Stop if streamline goes off screen
                if (x > this.ctx.canvas.width || x < 0 || y < 0 || y > this.ctx.canvas.height) {
                    break;
                }
            }
            
            this.ctx.stroke();
        }
        
        // Add flow direction indicators (small arrows)
        for (let x = 100; x < this.ctx.canvas.width - 100; x += 80) {
            for (let y = 100; y < this.ctx.canvas.height - 100; y += 60) {
                const velocity = this.calculateFlowVelocity(x, y);
                const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
                
                if (speed > 0.1) {
                    // Check if this arrow is affected by mouse
                    const dx = this.mouseX - x;
                    const dy = this.mouseY - y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    const isMouseAffected = distance < this.mouseInfluence && distance > 0;
                    
                    // Draw arrow
                    const angle = Math.atan2(velocity.y, velocity.x);
                    const arrowLength = Math.min(15, speed * 10);
                    
                    // Use purple for mouse-affected arrows, blue for normal
                    if (isMouseAffected) {
                        this.ctx.strokeStyle = `rgba(147, 112, 219, ${Math.min(0.9, speed + 0.3)})`;
                        this.ctx.lineWidth = 3; // Thicker for mouse-affected arrows
                    } else {
                        this.ctx.strokeStyle = `rgba(0, 150, 255, ${Math.min(0.8, speed)})`;
                        this.ctx.lineWidth = 2;
                    }
                    
                    this.ctx.beginPath();
                    this.ctx.moveTo(x, y);
                    this.ctx.lineTo(x + Math.cos(angle) * arrowLength, y + Math.sin(angle) * arrowLength);
                    this.ctx.stroke();
                    
                    // Draw arrowhead
                    this.ctx.beginPath();
                    this.ctx.moveTo(x + Math.cos(angle) * arrowLength, y + Math.sin(angle) * arrowLength);
                    this.ctx.lineTo(x + Math.cos(angle) * arrowLength - Math.cos(angle - 0.5) * 5, 
                                  y + Math.sin(angle) * arrowLength - Math.sin(angle - 0.5) * 5);
                    this.ctx.lineTo(x + Math.cos(angle) * arrowLength - Math.cos(angle + 0.5) * 5, 
                                  y + Math.sin(angle) * arrowLength - Math.sin(angle + 0.5) * 5);
                    this.ctx.closePath();
                    
                    if (isMouseAffected) {
                        this.ctx.fillStyle = `rgba(147, 112, 219, ${Math.min(0.9, speed + 0.3)})`;
                    } else {
                        this.ctx.fillStyle = `rgba(0, 150, 255, ${Math.min(0.8, speed)})`;
                    }
                    this.ctx.fill();
                }
            }
        }
        
        // Add streamline labels with enhanced styling
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        this.ctx.font = 'bold 16px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('🌊 Streamlines', this.ctx.canvas.width / 2, 30);
        
        // Add explanation
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.font = '12px Arial';
        this.ctx.fillText('Lines show fluid flow direction', this.ctx.canvas.width / 2, 50);
    }
    
    drawVelocityField() {
        // Enhanced velocity field with dynamic arrows and color coding
        for (let x = 60; x < this.ctx.canvas.width - 60; x += 50) {
            for (let y = 60; y < this.ctx.canvas.height - 60; y += 50) {
                const velocity = this.calculateFlowVelocity(x, y);
                const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
                
                if (speed > 0.1) {
                    // Color code based on speed (blue = slow, red = fast)
                    const hue = 240 - Math.min(180, speed * 100); // Blue to red
                    const saturation = 80;
                    const lightness = 60;
                    const color = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
                    
                    // Arrow length and thickness based on speed
                    const arrowLength = Math.min(25, speed * 15);
                    const lineWidth = Math.max(1, speed * 3);
                    
                    this.ctx.strokeStyle = color;
                    this.ctx.lineWidth = lineWidth;
                    this.ctx.beginPath();
                    this.ctx.moveTo(x, y);
                    this.ctx.lineTo(x + velocity.x * arrowLength, y + velocity.y * arrowLength);
                    this.ctx.stroke();
                    
                    // Draw arrowhead
                    const angle = Math.atan2(velocity.y, velocity.x);
                    this.ctx.beginPath();
                    this.ctx.moveTo(x + velocity.x * arrowLength, y + velocity.y * arrowLength);
                    this.ctx.lineTo(x + velocity.x * arrowLength - Math.cos(angle - 0.5) * 6, 
                                  y + velocity.y * arrowLength - Math.sin(angle - 0.5) * 6);
                    this.ctx.lineTo(x + velocity.x * arrowLength - Math.cos(angle + 0.5) * 6, 
                                  y + velocity.y * arrowLength - Math.sin(angle + 0.5) * 6);
                    this.ctx.closePath();
                    this.ctx.fillStyle = color;
                    this.ctx.fill();
                    
                    // Add speed indicator dot
                    this.ctx.fillStyle = color;
                    this.ctx.beginPath();
                    this.ctx.arc(x, y, Math.max(2, speed * 3), 0, Math.PI * 2);
                    this.ctx.fill();
                }
            }
        }
        
        // Add velocity field label with enhanced styling
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        this.ctx.font = 'bold 16px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('⚡ Velocity Field', this.ctx.canvas.width / 2, 30);
        
        // Add color legend
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.font = '12px Arial';
        this.ctx.fillText('Blue = Slow, Red = Fast', this.ctx.canvas.width / 2, 50);
    }
    
    drawPressureField() {
        // Enhanced pressure field with gradient visualization
        for (let x = 0; x < this.ctx.canvas.width; x += 20) {
            for (let y = 0; y < this.ctx.canvas.height; y += 20) {
                const velocity = this.calculateFlowVelocity(x, y);
                const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
                
                // Calculate pressure (inverse relationship with velocity)
                const pressure = Math.max(0, 1 - speed * 0.3);
                
                // Color code: Blue = high pressure, Red = low pressure (more subtle)
                const blue = Math.floor(200 * pressure);
                const red = Math.floor(100 * (1 - pressure));
                const green = Math.floor(50 * pressure);
                const color = `rgba(${red}, ${green}, ${blue}, ${0.2 + pressure * 0.2})`;
                
                this.ctx.fillStyle = color;
                this.ctx.fillRect(x, y, 20, 20);
            }
        }
        
        // Add pressure contours (lines of equal pressure)
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        this.ctx.lineWidth = 1;
        
        for (let pressure = 0.2; pressure <= 0.8; pressure += 0.2) {
            this.ctx.beginPath();
            let firstPoint = true;
            
            for (let x = 0; x < this.ctx.canvas.width; x += 10) {
                for (let y = 0; y < this.ctx.canvas.height; y += 10) {
                    const velocity = this.calculateFlowVelocity(x, y);
                    const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
                    const currentPressure = Math.max(0, 1 - speed * 0.3);
                    
                    if (Math.abs(currentPressure - pressure) < 0.05) {
                        if (firstPoint) {
                            this.ctx.moveTo(x, y);
                            firstPoint = false;
                        } else {
                            this.ctx.lineTo(x, y);
                        }
                    }
                }
            }
            this.ctx.stroke();
        }
        
        // Add pressure field label with enhanced styling
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        this.ctx.font = 'bold 16px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('💨 Pressure Field', this.ctx.canvas.width / 2, 30);
        
        // Add color legend
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.font = '12px Arial';
        this.ctx.fillText('Blue = High Pressure, Red = Low Pressure', this.ctx.canvas.width / 2, 50);
    }
    
    drawFlowInfo() {
        // Modern flow info panel with enhanced styling
        const panelX = 20;
        const panelY = 20;
        const panelWidth = 300;
        const panelHeight = 140;
        
        // Enhanced panel background with shadow and gradient
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(panelX + 4, panelY + 4, panelWidth, panelHeight);
        
        const gradient = this.ctx.createLinearGradient(panelX, panelY, panelX, panelY + panelHeight);
        gradient.addColorStop(0, 'rgba(26, 26, 46, 0.98)');
        gradient.addColorStop(0.3, 'rgba(26, 26, 46, 0.95)');
        gradient.addColorStop(0.7, 'rgba(26, 26, 46, 0.92)');
        gradient.addColorStop(1, 'rgba(26, 26, 46, 0.88)');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(panelX, panelY, panelWidth, panelHeight);
        
        // Enhanced border with rounded corners and gradient
        this.ctx.shadowColor = '#4ECDC4';
        this.ctx.shadowBlur = 8;
        this.ctx.lineWidth = 2;
        
        // Create gradient border
        const borderGradient = this.ctx.createLinearGradient(
            panelX, panelY, 
            panelX + panelWidth, panelY + panelHeight
        );
        borderGradient.addColorStop(0, '#4ECDC4');
        borderGradient.addColorStop(0.5, '#2ECC71');
        borderGradient.addColorStop(1, '#4ECDC4');
        
        this.ctx.strokeStyle = borderGradient;
        this.ctx.strokeRect(panelX, panelY, panelWidth, panelHeight);
        this.ctx.shadowBlur = 0;
        
        // Add inner highlight for 3D effect
        const innerGradient = this.ctx.createLinearGradient(panelX, panelY, panelX, panelY + 30);
        innerGradient.addColorStop(0, 'rgba(78, 205, 196, 0.1)');
        innerGradient.addColorStop(1, 'rgba(78, 205, 196, 0)');
        this.ctx.fillStyle = innerGradient;
        this.ctx.fillRect(panelX, panelY, panelWidth, 30);
        
        // Modern title with crisp font rendering
        this.ctx.fillStyle = '#4ECDC4';
        this.ctx.font = 'bold 18px Inter, Arial, sans-serif';
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('🌊 Fluid Flow Simulation', panelX + 15, panelY + 22);
        
        // Enhanced stats with modern styling
        this.ctx.font = '14px Inter, Arial, sans-serif';
        this.ctx.textBaseline = 'middle';
        
        this.ctx.fillStyle = '#4ECDC4';
        this.ctx.fillText(`🚀 Flow Rate: ${this.flowRate.toFixed(1)}`, panelX + 15, panelY + 45);
        this.ctx.fillText(`💧 Viscosity: ${this.viscosity.toFixed(1)}`, panelX + 15, panelY + 62);
        this.ctx.fillText(`📊 Reynolds Number: ${this.reynoldsNumber}`, panelX + 15, panelY + 79);
        this.ctx.fillText(`🔄 Flow Type: ${this.flowType}`, panelX + 15, panelY + 96);
        
        // Enhanced flow type indicator with modern colors
        const flowTypeColor = this.flowType === 'Laminar' ? '#4CAF50' : 
                             this.flowType === 'Transitional' ? '#FF9800' : '#F44336';
        this.ctx.fillStyle = flowTypeColor;
        this.ctx.font = 'bold 14px Inter, Arial, sans-serif';
        this.ctx.fillText(`● ${this.flowType}`, panelX + 15, panelY + 113);
        
        // Add performance indicator
        const efficiency = Math.min(100, (this.flowRate / 3) * 100);
        const efficiencyColor = efficiency > 80 ? '#4ECDC4' : efficiency > 60 ? '#F39C12' : '#FF6B6B';
        this.ctx.fillStyle = efficiencyColor;
        this.ctx.fillText(`🎯 Flow Efficiency: ${efficiency.toFixed(0)}%`, panelX + 15, panelY + 130);
    }
    
    drawRealWorldAnalogy() {
        // Modern analogy panel with enhanced styling
        const panelX = this.ctx.canvas.width - 290;
        const panelY = 20;
        const panelWidth = 270;
        const panelHeight = 100;
        
        // Enhanced panel background with shadow and gradient
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(panelX + 4, panelY + 4, panelWidth, panelHeight);
        
        const gradient = this.ctx.createLinearGradient(panelX, panelY, panelX, panelY + panelHeight);
        gradient.addColorStop(0, 'rgba(26, 26, 46, 0.98)');
        gradient.addColorStop(0.3, 'rgba(26, 26, 46, 0.95)');
        gradient.addColorStop(0.7, 'rgba(26, 26, 46, 0.92)');
        gradient.addColorStop(1, 'rgba(26, 26, 46, 0.88)');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(panelX, panelY, panelWidth, panelHeight);
        
        // Enhanced border with gradient
        this.ctx.shadowColor = '#FFD700';
        this.ctx.shadowBlur = 8;
        this.ctx.lineWidth = 2;
        
        // Create gradient border
        const borderGradient = this.ctx.createLinearGradient(
            panelX, panelY, 
            panelX + panelWidth, panelY + panelHeight
        );
        borderGradient.addColorStop(0, '#FFD700');
        borderGradient.addColorStop(0.5, '#FFA500');
        borderGradient.addColorStop(1, '#FFD700');
        
        this.ctx.strokeStyle = borderGradient;
        this.ctx.strokeRect(panelX, panelY, panelWidth, panelHeight);
        this.ctx.shadowBlur = 0;
        
        // Add inner highlight for 3D effect
        const innerGradient = this.ctx.createLinearGradient(panelX, panelY, panelX, panelY + 30);
        innerGradient.addColorStop(0, 'rgba(255, 215, 0, 0.1)');
        innerGradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
        this.ctx.fillStyle = innerGradient;
        this.ctx.fillRect(panelX, panelY, panelWidth, 30);
        
        // Modern title with crisp font rendering
        this.ctx.fillStyle = '#FFD700';
        this.ctx.font = 'bold 16px Inter, Arial, sans-serif';
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('💡 Real-World Examples:', panelX + 15, panelY + 22);
        
        // Enhanced examples with modern styling
        this.ctx.font = '13px Inter, Arial, sans-serif';
        this.ctx.textBaseline = 'middle';
        
        this.ctx.fillStyle = '#4ECDC4';
        this.ctx.fillText('🧽 Sponge: water flows through', panelX + 15, panelY + 45);
        this.ctx.fillText('🪨 Rock: water flows around', panelX + 15, panelY + 62);
        this.ctx.fillText('🌊 River: natural flow patterns', panelX + 15, panelY + 79);
        this.ctx.fillText('🏊 Pool: controlled fluid motion', panelX + 15, panelY + 96);
    }
    
    drawMouseIndicator() {
        if (this.mouseX > 0 && this.mouseY > 0) {
            // Draw mouse influence circle with purple/blue theme
            this.ctx.strokeStyle = 'rgba(147, 112, 219, 0.8)'; // Medium purple
            this.ctx.lineWidth = 3;
            this.ctx.beginPath();
            this.ctx.arc(this.mouseX, this.mouseY, this.mouseInfluence, 0, Math.PI * 2);
            this.ctx.stroke();
            
            // Draw inner ring for stronger visual effect
            this.ctx.strokeStyle = 'rgba(138, 43, 226, 0.6)'; // Blue violet
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.arc(this.mouseX, this.mouseY, this.mouseInfluence * 0.6, 0, Math.PI * 2);
            this.ctx.stroke();
            
            // Draw mouse position with purple dot
            this.ctx.fillStyle = 'rgba(147, 112, 219, 0.9)';
            this.ctx.beginPath();
            this.ctx.arc(this.mouseX, this.mouseY, 4, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Add white border to make it stand out
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.arc(this.mouseX, this.mouseY, 4, 0, Math.PI * 2);
            this.ctx.stroke();
            
            // Add interaction hint with enhanced visibility
            this.ctx.fillStyle = '#000000';
            this.ctx.font = 'bold 14px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('Move mouse to interact!', this.mouseX, this.mouseY - 25);
            
            // Add a subtle glow effect
            this.ctx.shadowColor = 'rgba(147, 112, 219, 0.5)';
            this.ctx.shadowBlur = 10;
            this.ctx.beginPath();
            this.ctx.arc(this.mouseX, this.mouseY, this.mouseInfluence * 0.3, 0, Math.PI * 2);
            this.ctx.fillStyle = 'rgba(147, 112, 219, 0.1)';
            this.ctx.fill();
            this.ctx.shadowBlur = 0; // Reset shadow
        }
    }
    
    adjustColor(color, amount) {
        // Simple color adjustment for gradients
        if (color.startsWith('#')) {
            const hex = color.replace('#', '');
            const r = Math.max(0, Math.min(255, parseInt(hex.substr(0, 2), 16) + amount));
            const g = Math.max(0, Math.min(255, parseInt(hex.substr(2, 2), 16) + amount));
            const b = Math.max(0, Math.min(255, parseInt(hex.substr(4, 2), 16) + amount));
            return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
        }
        return color;
    }
    
    getStats() {
        const avgVelocity = this.particles.reduce((sum, p) => sum + Math.sqrt(p.vx * p.vx + p.vy * p.vy), 0) / this.particles.length;
        return {
            flowRate: this.flowRate,
            viscosity: this.viscosity,
            reynoldsNumber: this.reynoldsNumber,
            flowType: this.flowType,
            averageVelocity: avgVelocity,
            time: this.time
        };
    }
}

// Bernoulli's Principle Simulation
export class Bernoulli extends BaseAnimation {
    constructor(ctx) {
        super(ctx);
        this.animationType = 'bernoulli';
        this.particles = [];
        this.pipeWidth = 50;
        this.fluidDensity = 1;
        this.pressureDifference = 1;
        this.visualizationMode = 'basic';
        this.maxParticles = 80;
        
        this.initializeParticles();
    }
    
    initializeParticles() {
        this.particles = [];
        // Create more particles for continuous flow
        for (let i = 0; i < this.maxParticles * 2; i++) {
            this.particles.push({
                x: -100 - Math.random() * 200, // Start further back for continuous flow
                y: 250 + Math.random() * 100,
                vx: this.pressureDifference * (1 + Math.random() * 0.2),
                vy: (Math.random() - 0.5) * 0.2,
                size: 2 + Math.random() * 2, // Smaller particles
                color: `hsl(${220 + Math.random() * 40}, 80%, 60%)`,
                life: 0,
                currentSection: 'left',
                opacity: 0.7 + Math.random() * 0.3 // Varying opacity for depth
            });
        }
    }
    
    setPipeWidth(width) {
        this.pipeWidth = width;
    }
    
    setFluidDensity(density) {
        this.fluidDensity = density;
    }
    
    setPressureDifference(pressure) {
        this.pressureDifference = pressure;
    }
    
    setVisualizationMode(mode) {
        this.visualizationMode = mode;
    }
    
    reset() {
        this.time = 0;
        this.initializeParticles();
    }
    
    update(deltaTime) {
        this.time += deltaTime;
        
        // Maintain continuous flow by adding new particles
        this.maintainContinuousFlow(deltaTime);
        
        this.particles.forEach((particle, index) => {
            // Calculate velocity based on position with smooth transitions
            let baseVelocity = this.pressureDifference * (1 + Math.random() * 0.2);
            let velocityMultiplier = 1.0;
            
            // Smooth velocity transitions based on position
            if (particle.x < 300) {
                // Left wide section - slow
                velocityMultiplier = 0.6;
            } else if (particle.x >= 300 && particle.x < 350) {
                // Transition to narrow - gradually speed up
                const transitionProgress = (particle.x - 300) / 50;
                velocityMultiplier = 0.6 + (1.8 - 0.6) * transitionProgress;
            } else if (particle.x >= 350 && particle.x < 450) {
                // Narrow section - fast
                velocityMultiplier = 1.8;
            } else if (particle.x >= 450 && particle.x < 500) {
                // Transition to wide - gradually slow down
                const transitionProgress = (particle.x - 450) / 50;
                velocityMultiplier = 1.8 - (1.8 - 0.6) * transitionProgress;
            } else {
                // Right wide section - slow
                velocityMultiplier = 0.6;
            }
            
            // Apply velocity with gradual transition
            particle.vx = baseVelocity * velocityMultiplier;
            
            // Add slight turbulence in transitions
            if ((particle.x >= 300 && particle.x < 350) || (particle.x >= 450 && particle.x < 500)) {
                particle.vx += (Math.random() - 0.5) * 0.5;
            }
            
            // Update position
            particle.x += particle.vx * deltaTime * 0.1;
            particle.y += particle.vy * deltaTime * 0.1;
            
            // Constrain particles to pipe boundaries
            this.constrainParticleToPipe(particle);
            
            particle.life += deltaTime;
            
            // Remove particles that go off screen
            if (particle.x > this.ctx.canvas.width + 100 || 
                particle.x < -300 || 
                particle.y < 100 || 
                particle.y > 500 ||
                particle.life > 12000) {
                // Remove particle instead of resetting
                this.particles.splice(index, 1);
            }
        });
    }
    
    maintainContinuousFlow(deltaTime) {
        // Calculate target number of particles based on flow rate
        const targetParticles = this.maxParticles * 2;
        const currentParticles = this.particles.length;
        
        // Add new particles if we're below target
        if (currentParticles < targetParticles) {
            const particlesToAdd = Math.min(targetParticles - currentParticles, 2);
            
            for (let i = 0; i < particlesToAdd; i++) {
                this.addNewParticle();
            }
        }
    }
    
    addNewParticle() {
        // Add particle at the left edge with staggered timing
        const staggerOffset = Math.random() * 150; // Stagger entry points
        
        this.particles.push({
            x: -200 - staggerOffset,
            y: 250 + Math.random() * 100,
            vx: this.pressureDifference * (1 + Math.random() * 0.2),
            vy: (Math.random() - 0.5) * 0.2,
            size: 2 + Math.random() * 2,
            color: `hsl(${220 + Math.random() * 40}, 80%, 60%)`,
            life: 0,
            currentSection: 'left',
            opacity: 0.7 + Math.random() * 0.3
        });
    }
    
    constrainParticleToPipe(particle) {
        // Calculate pipe boundaries based on x position
        let topBoundary, bottomBoundary;
        
        if (particle.x < 300) {
            // Left wide section
            topBoundary = 200;
            bottomBoundary = 400;
        } else if (particle.x >= 300 && particle.x < 350) {
            // Transition to narrow
            const transitionProgress = (particle.x - 300) / 50;
            topBoundary = 200 + transitionProgress * 50;
            bottomBoundary = 400 - transitionProgress * 50;
        } else if (particle.x >= 350 && particle.x < 450) {
            // Narrow section
            topBoundary = 250;
            bottomBoundary = 350;
        } else if (particle.x >= 450 && particle.x < 500) {
            // Transition to wide
            const transitionProgress = (particle.x - 450) / 50;
            topBoundary = 250 - transitionProgress * 50;
            bottomBoundary = 350 + transitionProgress * 50;
        } else {
            // Right wide section
            topBoundary = 200;
            bottomBoundary = 400;
        }
        
        // Add some margin to keep particles away from walls
        const margin = 10;
        topBoundary += margin;
        bottomBoundary -= margin;
        
        // Constrain particle to pipe boundaries
        if (particle.y < topBoundary) {
            particle.y = topBoundary;
            particle.vy = Math.abs(particle.vy) * 0.5; // Bounce off top wall
        } else if (particle.y > bottomBoundary) {
            particle.y = bottomBoundary;
            particle.vy = -Math.abs(particle.vy) * 0.5; // Bounce off bottom wall
        }
        
        // Add slight random vertical movement to simulate fluid flow
        if (Math.random() < 0.1) {
            particle.vy += (Math.random() - 0.5) * 0.3;
        }
        
        // Dampen vertical velocity to keep particles flowing horizontally
        particle.vy *= 0.95;
    }
    
    resetParticle(particle) {
        particle.x = -100 - Math.random() * 200; // Reset further back for continuous flow
        particle.y = 250 + Math.random() * 100;
        particle.vx = this.pressureDifference * (1 + Math.random() * 0.2);
        particle.vy = (Math.random() - 0.5) * 0.2;
        particle.life = 0;
        particle.currentSection = 'left';
        particle.opacity = 0.7 + Math.random() * 0.3;
    }
    
    render() {
        this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
        
        // Draw pipe system
        this.drawPipeSystem();
        
        // Draw particles
        this.drawParticles();
        
        // Draw based on visualization mode
        switch (this.visualizationMode) {
            case 'pressure':
                this.drawPressureAnalysis();
                break;
            case 'velocity':
                this.drawVelocityAnalysis();
                break;
            case 'energy':
                this.drawEnergyAnalysis();
                break;
        }
        
        // Draw Bernoulli information
        this.drawBernoulliInfo();
        
        // Add real-world analogy for beginners
        this.drawBernoulliRealWorldAnalogy();
    }
    
    drawPipeSystem() {
        // Single continuous pipe with smooth transitions
        const pipeWidth = 200; // Wide sections
        const narrowWidth = 100; // Narrow section
        const transitionLength = 50; // Smooth transition length
        
        // Add shadow for depth
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        this.ctx.shadowBlur = 10;
        this.ctx.shadowOffsetX = 2;
        this.ctx.shadowOffsetY = 2;
        
        // Create single continuous pipe path
        this.ctx.beginPath();
        
        // Left wide section (0 to 300)
        this.ctx.moveTo(0, 200);
        this.ctx.lineTo(300, 200);
        
        // Transition to narrow section (300 to 350)
        this.ctx.lineTo(350, 250);
        
        // Narrow section (350 to 450)
        this.ctx.lineTo(450, 250);
        
        // Transition to wide section (450 to 500)
        this.ctx.lineTo(500, 200);
        
        // Right wide section (500 to end)
        this.ctx.lineTo(this.ctx.canvas.width, 200);
        
        // Bottom of pipe (mirror of top)
        this.ctx.lineTo(this.ctx.canvas.width, 400);
        this.ctx.lineTo(500, 400);
        this.ctx.lineTo(450, 350);
        this.ctx.lineTo(350, 350);
        this.ctx.lineTo(300, 400);
        this.ctx.lineTo(0, 400);
        this.ctx.closePath();
        
        // Create gradient for the entire pipe
        const pipeGradient = this.ctx.createLinearGradient(0, 200, this.ctx.canvas.width, 400);
        pipeGradient.addColorStop(0, 'rgba(135, 206, 250, 0.6)');
        pipeGradient.addColorStop(0.3, 'rgba(70, 130, 180, 0.5)');
        pipeGradient.addColorStop(0.4, 'rgba(255, 140, 0, 0.6)');
        pipeGradient.addColorStop(0.6, 'rgba(255, 69, 0, 0.7)');
        pipeGradient.addColorStop(0.7, 'rgba(255, 140, 0, 0.6)');
        pipeGradient.addColorStop(0.8, 'rgba(70, 130, 180, 0.5)');
        pipeGradient.addColorStop(1, 'rgba(135, 206, 250, 0.6)');
        
        this.ctx.fillStyle = pipeGradient;
        this.ctx.fill();
        
        // Single border for the entire pipe
        this.ctx.strokeStyle = 'rgba(70, 130, 180, 0.9)';
        this.ctx.lineWidth = 3;
        this.ctx.stroke();
        
        // Reset shadow
        this.ctx.shadowBlur = 0;
        this.ctx.shadowOffsetX = 0;
        this.ctx.shadowOffsetY = 0;
        
        // Section labels with better positioning
        this.ctx.fillStyle = '#1a1a2e';
        this.ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
        this.ctx.shadowBlur = 2;
        this.ctx.font = 'bold 16px Inter, Arial, sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Wide Section (Slow)', 150, 180);
        this.ctx.fillText('Narrow Section (Fast)', 400, 180);
        this.ctx.fillText('Wide Section (Slow)', 650, 180);
        
        // Speed indicators
        this.ctx.fillStyle = '#0066CC';
        this.ctx.font = 'bold 14px Inter, Arial, sans-serif';
        this.ctx.fillText('SLOW', 150, 160);
        this.ctx.fillText('SLOW', 650, 160);
        
        this.ctx.fillStyle = '#FF6600';
        this.ctx.fillText('FAST', 400, 160);
        
        // Flow direction arrows
        this.ctx.strokeStyle = '#0066CC';
        this.ctx.lineWidth = 3;
        this.ctx.fillStyle = '#0066CC';
        
        // Left section arrows
        for (let y = 220; y < 380; y += 30) {
            this.drawEnhancedArrow(50, y, 100, y, '#0066CC');
        }
        
        // Middle section arrows (faster flow)
        this.ctx.strokeStyle = '#FF6600';
        this.ctx.fillStyle = '#FF6600';
        for (let y = 270; y < 330; y += 15) {
            this.drawEnhancedArrow(360, y, 440, y, '#FF6600');
        }
        
        // Right section arrows
        this.ctx.strokeStyle = '#0066CC';
        this.ctx.fillStyle = '#0066CC';
        for (let y = 220; y < 380; y += 30) {
            this.drawEnhancedArrow(700, y, 750, y, '#0066CC');
        }
    }
    
    drawEnhancedArrow(x1, y1, x2, y2, color) {
        const headLength = 12;
        const angle = Math.atan2(y2 - y1, x2 - x1);
        
        // Add glow effect for enhanced arrows
        this.ctx.shadowColor = color;
        this.ctx.shadowBlur = 6;
        
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 4;
        this.ctx.lineCap = 'round';
        this.ctx.beginPath();
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(x2, y2);
        this.ctx.stroke();
        
        // Enhanced arrowhead with gradient
        const gradient = this.ctx.createLinearGradient(x2, y2, x2 - headLength, y2);
        gradient.addColorStop(0, color);
        gradient.addColorStop(1, this.adjustColor(color, -30));
        
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.moveTo(x2, y2);
        this.ctx.lineTo(x2 - headLength * Math.cos(angle - Math.PI / 6), y2 - headLength * Math.sin(angle - Math.PI / 6));
        this.ctx.lineTo(x2 - headLength * Math.cos(angle + Math.PI / 6), y2 - headLength * Math.sin(angle + Math.PI / 6));
        this.ctx.closePath();
        this.ctx.fill();
        
        // Reset shadow
        this.ctx.shadowBlur = 0;
    }
    
    adjustColor(color, amount) {
        // Simple color adjustment for gradients
        if (color.startsWith('#')) {
            const hex = color.replace('#', '');
            const r = Math.max(0, Math.min(255, parseInt(hex.substr(0, 2), 16) + amount));
            const g = Math.max(0, Math.min(255, parseInt(hex.substr(2, 2), 16) + amount));
            const b = Math.max(0, Math.min(255, parseInt(hex.substr(4, 2), 16) + amount));
            return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
        }
        return color;
    }
    
    drawArrow(x1, y1, x2, y2, color) {
        const headLength = 10;
        const angle = Math.atan2(y2 - y1, x2 - x1);
        
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(x2, y2);
        this.ctx.stroke();
        
        // Draw arrowhead
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.moveTo(x2, y2);
        this.ctx.lineTo(x2 - headLength * Math.cos(angle - Math.PI / 6), y2 - headLength * Math.sin(angle - Math.PI / 6));
        this.ctx.lineTo(x2 - headLength * Math.cos(angle + Math.PI / 6), y2 - headLength * Math.sin(angle + Math.PI / 6));
        this.ctx.closePath();
        this.ctx.fill();
    }
    
    drawParticles() {
        this.particles.forEach(particle => {
            // Calculate velocity for visual effects
            const velocity = Math.sqrt(particle.vx * particle.vx + particle.vy * particle.vy);
            const maxVelocity = this.pressureDifference * 2;
            const intensity = Math.min(velocity / maxVelocity, 1);
            
            // Enhanced dynamic color based on velocity and position
            let color, trailColor, glowColor;
            if (particle.x > 300 && particle.x < 500) {
                // Constricted section - orange/red for fast
                const hue = 20 + intensity * 40; // Orange to red
                color = `hsl(${hue}, 85%, 60%)`;
                trailColor = `rgba(255, 140, 0, ${intensity * 0.6})`;
                glowColor = `rgba(255, 69, 0, ${intensity * 0.4})`;
            } else {
                // Wide sections - blue for slow
                const hue = 220 - intensity * 30;
                color = `hsl(${hue}, 80%, 60%)`;
                trailColor = `rgba(70, 130, 180, ${intensity * 0.5})`;
                glowColor = `rgba(135, 206, 250, ${intensity * 0.3})`;
            }
            
            // Apply particle opacity
            const alpha = particle.opacity || 0.8;
            color = color.replace('hsl(', 'hsla(').replace(')', `, ${alpha})`);
            
            // Subtle glow effect for all particles
            this.ctx.shadowColor = glowColor;
            this.ctx.shadowBlur = 4;
            
            // Draw main particle with enhanced gradient
            const gradient = this.ctx.createRadialGradient(
                particle.x - particle.size * 0.3, particle.y - particle.size * 0.3, 0,
                particle.x, particle.y, particle.size * 1.5
            );
            gradient.addColorStop(0, this.adjustColor(color, 40));
            gradient.addColorStop(0.6, color);
            gradient.addColorStop(1, this.adjustColor(color, -30));
            
            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Enhanced speed trails for faster particles
            if (velocity > this.pressureDifference * 0.3) {
                const trailLength = Math.max(2, velocity * 2);
                const trailGradient = this.ctx.createLinearGradient(
                    particle.x, particle.y,
                    particle.x - particle.vx * 0.4, particle.y - particle.vy * 0.4
                );
                trailGradient.addColorStop(0, trailColor);
                trailGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
                
                this.ctx.strokeStyle = trailGradient;
                this.ctx.lineWidth = Math.max(1, velocity * 1.5);
                this.ctx.lineCap = 'round';
                this.ctx.beginPath();
                this.ctx.moveTo(particle.x, particle.y);
                this.ctx.lineTo(particle.x - particle.vx * 0.4, particle.y - particle.vy * 0.4);
                this.ctx.stroke();
            }
            
            // Velocity indicators for very fast particles in narrow section
            if (particle.x > 350 && particle.x < 450 && velocity > this.pressureDifference * 1.0) {
                this.ctx.strokeStyle = '#FF6600';
                this.ctx.lineWidth = 2;
                this.ctx.setLineDash([6, 3]);
                this.ctx.lineCap = 'round';
                this.ctx.beginPath();
                this.ctx.moveTo(particle.x, particle.y);
                this.ctx.lineTo(particle.x + particle.vx * 0.3, particle.y + particle.vy * 0.3);
                this.ctx.stroke();
                this.ctx.setLineDash([]);
            }
            
            // Reset shadow
            this.ctx.shadowBlur = 0;
        });
    }
    
    drawPressureAnalysis() {
        // Simple pressure analysis for beginners
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(10, 10, 300, 100);
        
        this.ctx.fillStyle = 'white';
        this.ctx.font = 'bold 16px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText('📊 Pressure Analysis', 20, 30);
        
        this.ctx.font = '14px Arial';
        this.ctx.fillText('High Pressure (Red)', 20, 50);
        this.ctx.fillText('Low Pressure (Green)', 20, 70);
        this.ctx.fillText('💡 Narrow section = lower pressure', 20, 90);
    }
    
    drawVelocityAnalysis() {
        // Simple velocity analysis for beginners
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(10, 10, 300, 100);
        
        this.ctx.fillStyle = 'white';
        this.ctx.font = 'bold 16px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText('⚡ Velocity Analysis', 20, 30);
        
        this.ctx.font = '14px Arial';
        this.ctx.fillText('Slow (Blue arrows)', 20, 50);
        this.ctx.fillText('Fast (Orange arrows)', 20, 70);
        this.ctx.fillText('💡 Narrow section = faster flow', 20, 90);
    }
    
    drawEnergyAnalysis() {
        // Simple energy analysis for beginners
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(10, 10, 300, 100);
        
        this.ctx.fillStyle = 'white';
        this.ctx.font = 'bold 16px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText('⚡ Energy Analysis', 20, 30);
        
        this.ctx.font = '14px Arial';
        this.ctx.fillText('Pressure + Kinetic = Constant', 20, 50);
        this.ctx.fillText('When speed increases, pressure decreases', 20, 70);
        this.ctx.fillText('💡 Total energy is conserved', 20, 90);
    }
    
    drawBernoulliInfo() {
        // Modern Bernoulli info panel with enhanced styling
        const panelX = 20;
        const panelY = 450;
        const panelWidth = 320;
        const panelHeight = 120;
        
        // Enhanced panel background with shadow and gradient
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(panelX + 4, panelY + 4, panelWidth, panelHeight);
        
        const gradient = this.ctx.createLinearGradient(panelX, panelY, panelX, panelY + panelHeight);
        gradient.addColorStop(0, 'rgba(26, 26, 46, 0.98)');
        gradient.addColorStop(0.3, 'rgba(26, 26, 46, 0.95)');
        gradient.addColorStop(0.7, 'rgba(26, 26, 46, 0.92)');
        gradient.addColorStop(1, 'rgba(26, 26, 46, 0.88)');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(panelX, panelY, panelWidth, panelHeight);
        
        // Enhanced border with rounded corners and gradient
        this.ctx.shadowColor = '#4ECDC4';
        this.ctx.shadowBlur = 8;
        this.ctx.lineWidth = 2;
        
        // Create gradient border
        const borderGradient = this.ctx.createLinearGradient(
            panelX, panelY, 
            panelX + panelWidth, panelY + panelHeight
        );
        borderGradient.addColorStop(0, '#4ECDC4');
        borderGradient.addColorStop(0.5, '#2ECC71');
        borderGradient.addColorStop(1, '#4ECDC4');
        
        this.ctx.strokeStyle = borderGradient;
        this.ctx.strokeRect(panelX, panelY, panelWidth, panelHeight);
        this.ctx.shadowBlur = 0;
        
        // Add inner highlight for 3D effect
        const innerGradient = this.ctx.createLinearGradient(panelX, panelY, panelX, panelY + 30);
        innerGradient.addColorStop(0, 'rgba(78, 205, 196, 0.1)');
        innerGradient.addColorStop(1, 'rgba(78, 205, 196, 0)');
        this.ctx.fillStyle = innerGradient;
        this.ctx.fillRect(panelX, panelY, panelWidth, 30);
        
        // Modern title with crisp font rendering
        this.ctx.fillStyle = '#4ECDC4';
        this.ctx.font = 'bold 18px Inter, Arial, sans-serif';
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('⚡ Bernoulli\'s Principle', panelX + 15, panelY + 22);
        
        // Enhanced stats with modern styling
        this.ctx.font = '14px Inter, Arial, sans-serif';
        this.ctx.textBaseline = 'middle';
        
        this.ctx.fillStyle = '#4ECDC4';
        this.ctx.fillText(`🚀 Speed: ${this.pressureDifference.toFixed(1)}`, panelX + 15, panelY + 45);
        this.ctx.fillText(`📏 Width: ${this.pipeWidth}`, panelX + 15, panelY + 62);
        this.ctx.fillText(`💧 Density: ${this.fluidDensity.toFixed(1)}`, panelX + 15, panelY + 79);
        
        // Enhanced principle explanation with modern colors
        this.ctx.fillStyle = '#FFD700';
        this.ctx.font = 'bold 13px Inter, Arial, sans-serif';
        this.ctx.fillText('💡 Faster flow = Lower pressure', panelX + 15, panelY + 96);
        this.ctx.fillText('🔍 Watch particles speed up!', panelX + 15, panelY + 113);
        
        // Add performance indicator
        const efficiency = Math.min(100, (this.pressureDifference / 2) * 100);
        const efficiencyColor = efficiency > 80 ? '#4ECDC4' : efficiency > 60 ? '#F39C12' : '#FF6B6B';
        this.ctx.fillStyle = efficiencyColor;
        this.ctx.fillText(`🎯 Flow Efficiency: ${efficiency.toFixed(0)}%`, panelX + 15, panelY + 130);
    }
    
    drawBernoulliRealWorldAnalogy() {
        // Modern analogy panel with enhanced styling
        const panelX = this.ctx.canvas.width - 290;
        const panelY = 20;
        const panelWidth = 270;
        const panelHeight = 100;
        
        // Enhanced panel background with shadow and gradient
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(panelX + 4, panelY + 4, panelWidth, panelHeight);
        
        const gradient = this.ctx.createLinearGradient(panelX, panelY, panelX, panelY + panelHeight);
        gradient.addColorStop(0, 'rgba(26, 26, 46, 0.98)');
        gradient.addColorStop(0.3, 'rgba(26, 26, 46, 0.95)');
        gradient.addColorStop(0.7, 'rgba(26, 26, 46, 0.92)');
        gradient.addColorStop(1, 'rgba(26, 26, 46, 0.88)');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(panelX, panelY, panelWidth, panelHeight);
        
        // Enhanced border with gradient
        this.ctx.shadowColor = '#FFD700';
        this.ctx.shadowBlur = 8;
        this.ctx.lineWidth = 2;
        
        // Create gradient border
        const borderGradient = this.ctx.createLinearGradient(
            panelX, panelY, 
            panelX + panelWidth, panelY + panelHeight
        );
        borderGradient.addColorStop(0, '#FFD700');
        borderGradient.addColorStop(0.5, '#FFA500');
        borderGradient.addColorStop(1, '#FFD700');
        
        this.ctx.strokeStyle = borderGradient;
        this.ctx.strokeRect(panelX, panelY, panelWidth, panelHeight);
        this.ctx.shadowBlur = 0;
        
        // Add inner highlight for 3D effect
        const innerGradient = this.ctx.createLinearGradient(panelX, panelY, panelX, panelY + 30);
        innerGradient.addColorStop(0, 'rgba(255, 215, 0, 0.1)');
        innerGradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
        this.ctx.fillStyle = innerGradient;
        this.ctx.fillRect(panelX, panelY, panelWidth, 30);
        
        // Modern title with crisp font rendering
        this.ctx.fillStyle = '#FFD700';
        this.ctx.font = 'bold 16px Inter, Arial, sans-serif';
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('💡 Real-World Examples:', panelX + 15, panelY + 22);
        
        // Enhanced examples with modern styling
        this.ctx.font = '13px Inter, Arial, sans-serif';
        this.ctx.textBaseline = 'middle';
        
        this.ctx.fillStyle = '#4ECDC4';
        this.ctx.fillText('🚿 Garden hose: narrow = faster', panelX + 15, panelY + 45);
        this.ctx.fillText('✈️ Airplane wings: curved = lift', panelX + 15, panelY + 62);
        this.ctx.fillText('🏥 Venturi meters: flow measurement', panelX + 15, panelY + 79);
        this.ctx.fillText('🩸 Blood flow: artery constriction', panelX + 15, panelY + 96);
    }
    
    getStats() {
        return {
            pipeWidth: this.pipeWidth,
            fluidDensity: this.fluidDensity,
            pressureDifference: this.pressureDifference,
            velocityRatio: 1.5,
            energyConservation: '✓',
            time: this.time
        };
    }
}