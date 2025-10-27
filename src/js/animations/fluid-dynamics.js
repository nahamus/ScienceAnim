// Fluid Flow Simulation with Pipe System
import { BaseAnimation } from './base-animation.js';

export class FluidFlow extends BaseAnimation {
    constructor(ctx) {
        super(ctx);
        this.animationType = 'fluid-flow';
        this.particles = [];
        this.flowRate = 1;
        this.viscosity = 1;
        this.reynoldsNumber = 100;
        this.visualizationMode = 'particles';
        this.maxParticles = 150;
        this.flowType = 'Laminar';
        this.time = 0;
        
        // Pipe system properties
        this.pipeWidth = 120;
        this.pipeHeight = 80;
        this.pipeSpacing = 80; // Increased from 60 to provide more space
        this.topPipeY = 160; // Moved down from 120 to provide more space for upper banner
        this.bottomPipeY = 320;
        this.pipeLength = 600;
        this.pipeStartX = 50;
        
        // Porous material inserts (not entire pipes)
        this.topPipeMaterial = {
            x: this.pipeStartX + 200,
            y: this.topPipeY + 10,
            width: 150,
            height: this.pipeHeight - 20,
            porosity: 0.7, // High porosity
            type: 'porous'
        };
        
        this.bottomPipeMaterial = {
            x: this.pipeStartX + 200,
            y: this.bottomPipeY + 10,
            width: 150,
            height: this.pipeHeight - 20,
            porosity: 0.3, // Low porosity
            type: 'less-porous'
        };
        
        this.initializeParticles();
        this.updateReynoldsNumber();
    }
    
    initializeParticles() {
        this.particles = [];
        
        // Create particles for top pipe with better distribution
        for (let i = 0; i < this.maxParticles / 2; i++) {
            this.particles.push({
                x: this.pipeStartX + (i * 8) + Math.random() * 20, // Spread particles evenly
                y: this.topPipeY + this.pipeHeight/2 + (Math.random() - 0.5) * (this.pipeHeight - 30),
                vx: this.flowRate * 2 + Math.random() * this.flowRate,
                vy: (Math.random() - 0.5) * 0.3,
                size: 1.5 + Math.random() * 1, // Smaller particles
                color: `hsl(${200 + Math.random() * 40}, 85%, 65%)`,
                life: 0,
                pipe: 'top',
                trail: [] // Add trail history
            });
        }
        
        // Create particles for bottom pipe with better distribution
        for (let i = 0; i < this.maxParticles / 2; i++) {
            this.particles.push({
                x: this.pipeStartX + (i * 8) + Math.random() * 20, // Spread particles evenly
                y: this.bottomPipeY + this.pipeHeight/2 + (Math.random() - 0.5) * (this.pipeHeight - 30),
                vx: this.flowRate * 2 + Math.random() * this.flowRate,
                vy: (Math.random() - 0.5) * 0.3,
                size: 1.5 + Math.random() * 1, // Smaller particles
                color: `hsl(${220 + Math.random() * 40}, 85%, 65%)`,
                life: 0,
                pipe: 'bottom',
                trail: [] // Add trail history
            });
        }
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
        // More realistic Reynolds number calculation with enhanced visibility
        // Re = (ρ × V × D) / μ
        // where ρ = density (kg/m³), V = velocity (m/s), D = characteristic length (m), μ = viscosity (Pa·s)
        
        const fluidDensity = 1000; // Water density in kg/m³
        const characteristicLength = 0.08; // Pipe height in meters
        const velocity = this.flowRate * 0.1; // Convert to m/s
        const viscosity = this.viscosity * 0.001; // Convert to Pa·s (water viscosity ~0.001 Pa·s)
        
        this.reynoldsNumber = Math.round((fluidDensity * velocity * characteristicLength) / viscosity);
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
        super.update(deltaTime); // Call parent update to handle standardized controls
        
        this.time += deltaTime;
        
        this.particles.forEach((particle, index) => {
            // Determine which pipe the particle is in
            const isInTopPipe = particle.y >= this.topPipeY && particle.y <= this.topPipeY + this.pipeHeight;
            const isInBottomPipe = particle.y >= this.bottomPipeY && particle.y <= this.bottomPipeY + this.pipeHeight;
            
            // Check if particle is within pipe bounds
            const isInPipe = particle.x >= this.pipeStartX && particle.x <= this.pipeStartX + this.pipeLength;
            
            // Check if particle is in a material insert
            const isInTopMaterial = isInTopPipe && 
                particle.x >= this.topPipeMaterial.x && 
                particle.x <= this.topPipeMaterial.x + this.topPipeMaterial.width;
            
            const isInBottomMaterial = isInBottomPipe && 
                particle.x >= this.bottomPipeMaterial.x && 
                particle.x <= this.bottomPipeMaterial.x + this.bottomPipeMaterial.width;
            
            // Set base velocity
            let baseVelocity = this.flowRate * 2; // Ensure minimum velocity
            
            if (isInPipe && (isInTopPipe || isInBottomPipe)) {
                // Particle is in a pipe
                if (isInTopMaterial || isInBottomMaterial) {
                    // Particle is in a material insert - apply porosity effects
                    const material = isInTopMaterial ? this.topPipeMaterial : this.bottomPipeMaterial;
                    
                    // Apply porosity effect - higher porosity = slower flow
                    const porosityFactor = 1 - (1 - material.porosity) * 0.6; // Reduced effect for better flow
                    particle.vx = baseVelocity * porosityFactor * (1 + Math.random() * 0.2);
                    
                    // Enhanced turbulence based on Reynolds number and porosity
                    let turbulence = 0;
                    if (this.flowType === 'Turbulent') {
                        turbulence = (Math.random() - 0.5) * baseVelocity * (1 - material.porosity) * 3.0; // Increased turbulence
                    } else if (this.flowType === 'Transitional') {
                        turbulence = (Math.random() - 0.5) * baseVelocity * (1 - material.porosity) * 1.5; // Moderate turbulence
                    }
                    particle.vx += turbulence;
                    
                    // Add vertical movement to simulate porous flow patterns
                    particle.vy += (Math.random() - 0.5) * 0.5 * (1 - material.porosity);
                    
                } else {
                    // Particle is in pipe but not in material - normal flow
                    particle.vx = baseVelocity * (1 + Math.random() * 0.3);
                    particle.vy = (Math.random() - 0.5) * 0.2;
                    
                    // Add Reynolds number effects to clear sections too
                    if (this.flowType === 'Turbulent') {
                        particle.vx += (Math.random() - 0.5) * baseVelocity * 2.0; // Strong turbulence
                        particle.vy += (Math.random() - 0.5) * baseVelocity * 0.5; // Vertical turbulence
                    } else if (this.flowType === 'Transitional') {
                        particle.vx += (Math.random() - 0.5) * baseVelocity * 1.0; // Moderate turbulence
                        particle.vy += (Math.random() - 0.5) * baseVelocity * 0.3; // Light vertical turbulence
                    }
                }
                
                // Enhanced viscosity damping - much more visible effect
                const viscosityFactor = 1 - (this.viscosity * 0.1); // Increased from 0.02 to 0.1 (5x stronger)
                particle.vx *= viscosityFactor;
                particle.vy *= viscosityFactor;
                
            } else {
                // Particle is outside pipes - normal flow
                particle.vx = baseVelocity * (1 + Math.random() * 0.3);
                particle.vy = (Math.random() - 0.5) * 0.2;
                
                // Add Reynolds number effects outside pipes too
                if (this.flowType === 'Turbulent') {
                    particle.vx += (Math.random() - 0.5) * baseVelocity * 1.5;
                    particle.vy += (Math.random() - 0.5) * baseVelocity * 0.4;
                } else if (this.flowType === 'Transitional') {
                    particle.vx += (Math.random() - 0.5) * baseVelocity * 0.8;
                    particle.vy += (Math.random() - 0.5) * baseVelocity * 0.2;
                }
                
                // Apply viscosity damping outside pipes too
                const viscosityFactor = 1 - (this.viscosity * 0.1); // Increased from 0.02 to 0.1
                particle.vx *= viscosityFactor;
                particle.vy *= viscosityFactor;
            }
            
            // Update trail history (keep last 5 positions for smooth trail)
            if (!particle.trail) particle.trail = [];
            particle.trail.push({ x: particle.x, y: particle.y });
            if (particle.trail.length > 5) {
                particle.trail.shift();
            }
            
            // Update position with proper time scaling
            particle.x += particle.vx * deltaTime * 0.05; // Increased time scaling
            particle.y += particle.vy * deltaTime * 0.05;
            particle.life += deltaTime;
            
            // Constrain particles to their respective pipes
            this.constrainParticleToPipe(particle);
            
            // Remove particles that go off screen (less aggressive removal)
            if (particle.x > this.ctx.canvas.width + 100 || 
                particle.x < -100 || 
                particle.y < 100 || 
                particle.y > this.ctx.canvas.height + 100 ||
                particle.life > 20000) { // Increased life time even more
                // Remove particle instead of resetting
                this.particles.splice(index, 1);
            }
        });
        
        // Maintain continuous flow by adding new particles
        this.maintainContinuousFlow(deltaTime);
    }
    
    maintainContinuousFlow(deltaTime) {
        // Calculate target number of particles based on flow rate
        const targetParticles = this.maxParticles;
        const currentParticles = this.particles.length;
        
        // Add new particles more aggressively to maintain continuous flow
        if (currentParticles < targetParticles) {
            const particlesToAdd = Math.min(targetParticles - currentParticles, 2); // Add 2 at once
            
            for (let i = 0; i < particlesToAdd; i++) {
                this.addNewParticle();
            }
        }
        
        // Also add particles periodically to ensure continuous flow
        if (Math.random() < 0.15) { // 15% chance each frame for more frequent addition
            this.addNewParticle();
        }
    }
    
    addNewParticle() {
        // Add particle at the left edge with staggered timing
        const staggerOffset = Math.random() * 100; // Stagger entry points
        const pipeChoice = Math.random() < 0.5 ? 'top' : 'bottom';
        
        this.particles.push({
            x: this.pipeStartX - 50 - staggerOffset,
            y: pipeChoice === 'top' ? 
                this.topPipeY + this.pipeHeight/2 + (Math.random() - 0.5) * (this.pipeHeight - 30) :
                this.bottomPipeY + this.pipeHeight/2 + (Math.random() - 0.5) * (this.pipeHeight - 30),
            vx: this.flowRate * 2 + Math.random() * this.flowRate,
            vy: (Math.random() - 0.5) * 0.3,
            size: 1.5 + Math.random() * 1,
            color: `hsl(${220 + Math.random() * 40}, 80%, 60%)`,
            life: 0,
            pipe: pipeChoice,
            opacity: 0.7 + Math.random() * 0.3,
            trail: [] // Add trail history
        });
    }
    
    constrainParticleToPipe(particle) {
        const isInTopPipe = particle.y >= this.topPipeY && particle.y <= this.topPipeY + this.pipeHeight;
        const isInBottomPipe = particle.y >= this.bottomPipeY && particle.y <= this.bottomPipeY + this.pipeHeight;
        
        // Keep particles within their pipe boundaries
        if (isInTopPipe) {
            if (particle.y < this.topPipeY + 10) particle.y = this.topPipeY + 10;
            if (particle.y > this.topPipeY + this.pipeHeight - 10) particle.y = this.topPipeY + this.pipeHeight - 10;
        } else if (isInBottomPipe) {
            if (particle.y < this.bottomPipeY + 10) particle.y = this.bottomPipeY + 10;
            if (particle.y > this.bottomPipeY + this.pipeHeight - 10) particle.y = this.bottomPipeY + this.pipeHeight - 10;
        }
    }
    
    resetParticle(particle) {
        if (particle.pipe === 'top') {
            particle.x = this.pipeStartX - 10 - Math.random() * 20; // Reset to just before pipe
            particle.y = this.topPipeY + this.pipeHeight/2 + (Math.random() - 0.5) * (this.pipeHeight - 30);
        } else {
            particle.x = this.pipeStartX - 10 - Math.random() * 20; // Reset to just before pipe
            particle.y = this.bottomPipeY + this.pipeHeight/2 + (Math.random() - 0.5) * (this.pipeHeight - 30);
        }
        particle.vx = this.flowRate * 2 + Math.random() * this.flowRate;
        particle.vy = (Math.random() - 0.5) * 0.3;
        particle.size = 1.5 + Math.random() * 1; // Maintain smaller size
        particle.life = 0;
    }
    
    drawStandardBackground() {
        // Standard background matching other animations
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.ctx.canvas.height);
        gradient.addColorStop(0, '#1a1a2e');
        gradient.addColorStop(1, '#16213e');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    }
    
    render() {
        // Draw standardized background (matching other animations)
        this.drawStandardBackground();
        
        // Draw pipe system
        this.drawPipeSystem();
        
        // Draw mode-specific background effects
        this.drawModeSpecificEffects();
        
        // Draw particles
        this.drawParticles();
        
        // Draw based on visualization mode
        switch (this.visualizationMode) {
            case 'pressure':
                this.drawPressureAnalysis();
                this.drawPressureGradients();
                break;
            case 'velocity':
                this.drawVelocityAnalysis();
                this.drawVelocityField();
                break;
            case 'porosity':
                this.drawPorosityAnalysis();
                this.drawPorosityFlowPatterns();
                break;
            default:
                // Default particle flow - no additional analysis
                break;
        }
        
        // Draw flow info (removed for cleaner look)
        // this.drawFlowInfo();
        
        // Add real-world analogy for beginners
        this.drawRealWorldAnalogy();
        
        // Draw mouse interaction indicator
        this.drawMouseIndicator();
    }
    
    drawPipeSystem() {
        // Draw two parallel pipes with material inserts
        
        // Draw pipes
        this.drawPipe(this.pipeStartX, this.topPipeY, this.pipeLength, this.pipeHeight, '', '#3498DB');
        this.drawPipe(this.pipeStartX, this.bottomPipeY, this.pipeLength, this.pipeHeight, '', '#3498DB');
        
        // Draw material inserts
        this.drawMaterialInsert(this.topPipeMaterial, '', 'high');
        this.drawMaterialInsert(this.bottomPipeMaterial, '', 'low');
        
        // Draw pipe labels below pipes
        this.drawPipeLabels();
    }
    
    drawPipe(x, y, length, height, label, color) {
        // Modern translucent pipe styling
        const pipeGradient = this.ctx.createLinearGradient(x, y, x, y + height);
        pipeGradient.addColorStop(0, 'rgba(70, 130, 180, 0.25)'); // Light blue translucent
        pipeGradient.addColorStop(0.5, 'rgba(100, 149, 237, 0.15)'); // Cornflower blue translucent
        pipeGradient.addColorStop(1, 'rgba(70, 130, 180, 0.25)'); // Light blue translucent
        
        // Draw pipe body with rounded corners
        this.ctx.fillStyle = pipeGradient;
        this.ctx.beginPath();
        this.ctx.roundRect(x, y, length, height, 8);
        this.ctx.fill();
        
        // Add subtle inner glow for glass effect
        const glowGradient = this.ctx.createLinearGradient(x, y, x, y + height / 2);
        glowGradient.addColorStop(0, 'rgba(255, 255, 255, 0.15)');
        glowGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        this.ctx.fillStyle = glowGradient;
        this.ctx.beginPath();
        this.ctx.roundRect(x + 2, y + 2, length - 4, height / 2 - 2, 6);
        this.ctx.fill();
        
        // Draw pipe border with crisp line
        this.ctx.strokeStyle = 'rgba(100, 149, 237, 0.6)';
        this.ctx.lineWidth = 1.5;
            this.ctx.beginPath();
        this.ctx.roundRect(x, y, length, height, 8);
            this.ctx.stroke();
        
        // Add subtle inner border
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        this.ctx.lineWidth = 1;
            this.ctx.beginPath();
        this.ctx.roundRect(x + 3, y + 3, length - 6, height - 6, 6);
            this.ctx.stroke();
        
        // Only show pipe labels if they're important (removed for cleaner look)
        // Add subtle texture dots for industrial look
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        for (let i = 0; i < 5; i++) {
            const dotX = x + 20 + i * (length - 40) / 4;
            const dotY = y + height / 2;
        this.ctx.beginPath();
            this.ctx.arc(dotX, dotY, 1, 0, Math.PI * 2);
        this.ctx.fill();
        }
    }
    
    drawMaterialInsert(material, label, porosityType) {
        const { x, y, width, height } = material;
        
        // Enhanced material styling with texture and depth
        const materialGradient = this.ctx.createLinearGradient(x, y, x + width, y);
        if (porosityType === 'high') {
            // High porosity - sandy/porous texture
            materialGradient.addColorStop(0, '#D4A574'); // Sandy brown
            materialGradient.addColorStop(0.3, '#CD853F'); // Peru brown
            materialGradient.addColorStop(0.7, '#B8860B'); // Dark goldenrod
            materialGradient.addColorStop(1, '#D4A574'); // Sandy brown
        } else {
            // Low porosity - dense material
            materialGradient.addColorStop(0, '#696969'); // Dim gray
            materialGradient.addColorStop(0.3, '#556B2F'); // Dark olive green
            materialGradient.addColorStop(0.7, '#2F4F4F'); // Dark slate gray
            materialGradient.addColorStop(1, '#696969'); // Dim gray
        }
        
        // Add depth shadow
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
        this.ctx.shadowBlur = 6;
        this.ctx.shadowOffsetX = 1;
        this.ctx.shadowOffsetY = 1;
        
        // Draw material body with rounded corners
        this.ctx.fillStyle = materialGradient;
        this.ctx.beginPath();
        this.ctx.roundRect(x, y, width, height, 6);
        this.ctx.fill();
        
        // Reset shadow
        this.ctx.shadowBlur = 0;
        this.ctx.shadowOffsetX = 0;
        this.ctx.shadowOffsetY = 0;
        
        // Add texture pattern based on porosity
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        if (porosityType === 'high') {
            // Sandy texture - more dots for high porosity
            for (let i = 0; i < 12; i++) {
                for (let j = 0; j < 3; j++) {
                    const dotX = x + 10 + i * (width - 20) / 11;
                    const dotY = y + 8 + j * (height - 16) / 2;
            this.ctx.beginPath();
                    this.ctx.arc(dotX, dotY, 0.8, 0, Math.PI * 2);
                    this.ctx.fill();
                }
            }
        } else {
            // Dense texture - fewer, larger dots
            for (let i = 0; i < 8; i++) {
                for (let j = 0; j < 2; j++) {
                    const dotX = x + 15 + i * (width - 30) / 7;
                    const dotY = y + 10 + j * (height - 20) / 1;
            this.ctx.beginPath();
                    this.ctx.arc(dotX, dotY, 1.2, 0, Math.PI * 2);
                    this.ctx.fill();
                }
            }
        }
        
        // Add material border
        this.ctx.strokeStyle = porosityType === 'high' ? '#8B4513' : '#2F4F4F';
        this.ctx.lineWidth = 2;
            this.ctx.beginPath();
        this.ctx.roundRect(x, y, width, height, 6);
            this.ctx.stroke();
        
        // Add inner highlight
        const highlightGradient = this.ctx.createLinearGradient(x, y, x, y + height);
        highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
        highlightGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.1)');
        highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0.05)');
        
        this.ctx.fillStyle = highlightGradient;
        this.ctx.beginPath();
        this.ctx.roundRect(x + 2, y + 2, width - 4, height - 4, 4);
        this.ctx.fill();
        
        // Simple porosity indicator - just a few dots above the material
        this.ctx.fillStyle = porosityType === 'high' ? '#FF8C00' : '#228B22';
        const indicatorY = y - 8;
        const numDots = porosityType === 'high' ? 6 : 4;
        const dotSpacing = 8;
        
        for (let i = 0; i < numDots; i++) {
            const dotX = x + (width - (numDots - 1) * dotSpacing) / 2 + i * dotSpacing;
            this.ctx.beginPath();
            this.ctx.arc(dotX, indicatorY, 1.5, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }
    
    drawPorousTexture(x, y, length, height, porosity, color) {
        // Draw porous material texture based on porosity
        const holeSize = 3 + (1 - porosity) * 4; // More porous = smaller holes
        const holeSpacing = 8 + porosity * 12; // More porous = more holes
        
        this.ctx.fillStyle = `${color}80`;
        
        for (let row = 0; row < height; row += holeSpacing) {
            for (let col = 0; col < length; col += holeSpacing) {
                if (Math.random() < porosity) { // More porous = more holes
                this.ctx.beginPath();
                    this.ctx.arc(x + col + Math.random() * 4, 
                                y + row + Math.random() * 4, 
                                holeSize * Math.random(), 0, Math.PI * 2);
                this.ctx.fill();
                }
            }
        }
    }
    
    drawPipeLabels() {
        // Draw labels below each pipe
        this.ctx.font = 'bold 14px Arial, sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'top';
        
        // Top pipe label
        const topLabelY = this.topPipeY + this.pipeHeight + 15;
        const topLabelX = this.pipeStartX + this.pipeLength / 2;
        
        // Top pipe label background
        const topLabelWidth = this.ctx.measureText('High Porosity Pipe').width + 20;
        const labelHeight = 25;
        
        // Top pipe label gradient
        const topLabelGradient = this.ctx.createLinearGradient(
            topLabelX - topLabelWidth/2, topLabelY, 
            topLabelX + topLabelWidth/2, topLabelY + labelHeight
        );
        topLabelGradient.addColorStop(0, '#E67E22'); // Orange
        topLabelGradient.addColorStop(1, '#D35400'); // Dark orange
        
        this.ctx.fillStyle = topLabelGradient;
                this.ctx.beginPath();
        this.ctx.roundRect(topLabelX - topLabelWidth/2, topLabelY, topLabelWidth, labelHeight, 12);
        this.ctx.fill();
        
        // Top pipe label border
        this.ctx.strokeStyle = '#A04000';
        this.ctx.lineWidth = 1;
                this.ctx.beginPath();
        this.ctx.roundRect(topLabelX - topLabelWidth/2, topLabelY, topLabelWidth, labelHeight, 12);
                this.ctx.stroke();
        
        // Top pipe label text with outline for better contrast
        this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.lineWidth = 3;
        this.ctx.strokeText('High Porosity Pipe', topLabelX, topLabelY + 5);
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.fillText('High Porosity Pipe', topLabelX, topLabelY + 5);
        
        // Bottom pipe label
        const bottomLabelY = this.bottomPipeY + this.pipeHeight + 15;
        const bottomLabelX = this.pipeStartX + this.pipeLength / 2;
        
        // Bottom pipe label background
        const bottomLabelWidth = this.ctx.measureText('Low Porosity Pipe').width + 20;
        
        // Bottom pipe label gradient
        const bottomLabelGradient = this.ctx.createLinearGradient(
            bottomLabelX - bottomLabelWidth/2, bottomLabelY, 
            bottomLabelX + bottomLabelWidth/2, bottomLabelY + labelHeight
        );
        bottomLabelGradient.addColorStop(0, '#27AE60'); // Green
        bottomLabelGradient.addColorStop(1, '#229954'); // Dark green
        
        this.ctx.fillStyle = bottomLabelGradient;
        this.ctx.beginPath();
        this.ctx.roundRect(bottomLabelX - bottomLabelWidth/2, bottomLabelY, bottomLabelWidth, labelHeight, 12);
        this.ctx.fill();
        
        // Bottom pipe label border
        this.ctx.strokeStyle = '#1E8449';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.roundRect(bottomLabelX - bottomLabelWidth/2, bottomLabelY, bottomLabelWidth, labelHeight, 12);
        this.ctx.stroke();
        
        // Bottom pipe label text with outline for better contrast
        this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.lineWidth = 3;
        this.ctx.strokeText('Low Porosity Pipe', bottomLabelX, bottomLabelY + 5);
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.fillText('Low Porosity Pipe', bottomLabelX, bottomLabelY + 5);
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
            // Draw particle trail first (behind the particle)
            if (particle.trail && particle.trail.length > 1) {
                this.ctx.beginPath();
                this.ctx.moveTo(particle.trail[0].x, particle.trail[0].y);
                for (let i = 1; i < particle.trail.length; i++) {
                    this.ctx.lineTo(particle.trail[i].x, particle.trail[i].y);
                }
                this.ctx.strokeStyle = `rgba(100, 149, 237, ${0.3 * (particle.trail.length / 5)})`;
                this.ctx.lineWidth = 1;
                this.ctx.lineCap = 'round';
                this.ctx.lineJoin = 'round';
                this.ctx.stroke();
            }
            
            // Calculate velocity for visual effects
            const velocity = Math.sqrt(particle.vx * particle.vx + particle.vy * particle.vy);
            const maxVelocity = this.flowRate * 4;
            const intensity = Math.min(velocity / maxVelocity, 1);
            
            // Check if particle is in a material insert using exact boundaries
            const isInTopMaterial = particle.y >= this.topPipeMaterial.y && 
                particle.y <= this.topPipeMaterial.y + this.topPipeMaterial.height &&
                particle.x >= this.topPipeMaterial.x && 
                particle.x <= this.topPipeMaterial.x + this.topPipeMaterial.width;
            
            const isInBottomMaterial = particle.y >= this.bottomPipeMaterial.y && 
                particle.y <= this.bottomPipeMaterial.y + this.bottomPipeMaterial.height &&
                particle.x >= this.bottomPipeMaterial.x && 
                particle.x <= this.bottomPipeMaterial.x + this.bottomPipeMaterial.width;
            
            // Enhanced dynamic color based on velocity and position
            let color, trailColor, glowColor;
            
            // Different visual effects based on visualization mode
            switch (this.visualizationMode) {
                case 'pressure':
                    // Pressure mode: Red/orange for high pressure (porous), blue for low pressure (clear)
                    if (isInTopMaterial || isInBottomMaterial) {
                        // High pressure in porous materials - red/orange
                        const pressureHue = 0 + intensity * 30; // Red to orange
                        color = `hsl(${pressureHue}, 90%, 70%)`;
                        trailColor = `rgba(255, 69, 0, ${intensity * 0.6})`;
                        glowColor = `rgba(255, 0, 0, ${intensity * 0.4})`;
                    } else {
                        // Low pressure in clear sections - blue
                        const pressureHue = 210 - intensity * 20;
                        color = `hsl(${pressureHue}, 85%, 70%)`;
                        trailColor = `rgba(70, 130, 180, ${intensity * 0.4})`;
                        glowColor = `rgba(135, 206, 250, ${intensity * 0.3})`;
                    }
                    break;
                    
                case 'velocity':
                    // Velocity mode: Bright colors for fast, dim for slow
                    if (isInTopMaterial || isInBottomMaterial) {
                        // Slow velocity in porous materials - dim orange
                        const velocityHue = 30 + intensity * 20;
                        color = `hsl(${velocityHue}, 70%, ${50 + intensity * 20}%)`;
                        trailColor = `rgba(255, 140, 0, ${intensity * 0.3})`;
                        glowColor = `rgba(255, 69, 0, ${intensity * 0.2})`;
                    } else {
                        // Fast velocity in clear sections - bright blue
                        const velocityHue = 200 + intensity * 20;
                        color = `hsl(${velocityHue}, 90%, ${60 + intensity * 30}%)`;
                        trailColor = `rgba(70, 130, 180, ${intensity * 0.6})`;
                        glowColor = `rgba(135, 206, 250, ${intensity * 0.5})`;
                    }
                    break;
                    
                case 'porosity':
                    // Porosity mode: Green for high porosity, purple for low porosity
                    if (isInTopMaterial) {
                        // High porosity material - green
                        const porosityHue = 120 + intensity * 20;
                        color = `hsl(${porosityHue}, 85%, 70%)`;
                        trailColor = `rgba(34, 139, 34, ${intensity * 0.5})`;
                        glowColor = `rgba(50, 205, 50, ${intensity * 0.4})`;
                    } else if (isInBottomMaterial) {
                        // Low porosity material - purple
                        const porosityHue = 280 + intensity * 20;
                        color = `hsl(${porosityHue}, 85%, 70%)`;
                        trailColor = `rgba(128, 0, 128, ${intensity * 0.5})`;
                        glowColor = `rgba(147, 112, 219, ${intensity * 0.4})`;
                    } else {
                        // Clear sections - neutral blue
                        const porosityHue = 210 - intensity * 20;
                        color = `hsl(${porosityHue}, 85%, 70%)`;
                        trailColor = `rgba(70, 130, 180, ${intensity * 0.4})`;
                        glowColor = `rgba(135, 206, 250, ${intensity * 0.3})`;
                    }
                    break;
                    
                default:
                    // Default particle flow mode
                    if (isInTopMaterial || isInBottomMaterial) {
                        // Material section - orange/red for slower flow through porous material
                        const hue = 15 + intensity * 30; // Orange to red
                        color = `hsl(${hue}, 90%, 70%)`;
                        trailColor = `rgba(255, 140, 0, ${intensity * 0.4})`;
                        glowColor = `rgba(255, 69, 0, ${intensity * 0.3})`;
                    } else {
                        // Clear pipe sections - blue for normal flow
                        const hue = 210 - intensity * 20;
                        color = `hsl(${hue}, 85%, 70%)`;
                        trailColor = `rgba(70, 130, 180, ${intensity * 0.4})`;
                        glowColor = `rgba(135, 206, 250, ${intensity * 0.3})`;
                    }
                    break;
            }
            
            // Enhanced glow effect for all particles
            this.ctx.shadowColor = glowColor;
            this.ctx.shadowBlur = 6;
            
            // Draw main particle with enhanced gradient
            const gradient = this.ctx.createRadialGradient(
                particle.x - particle.size * 0.2, particle.y - particle.size * 0.2, 0,
                particle.x, particle.y, particle.size * 1.2
            );
            gradient.addColorStop(0, this.adjustColor(color, 50)); // Brighter center
            gradient.addColorStop(0.7, color);
            gradient.addColorStop(1, this.adjustColor(color, -40)); // Darker edge
            
            this.ctx.fillStyle = gradient;
                    this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.ctx.fill();
                    
            // Add subtle highlight
            this.ctx.fillStyle = `rgba(255, 255, 255, 0.6)`;
                    this.ctx.beginPath();
            this.ctx.arc(particle.x - particle.size * 0.3, particle.y - particle.size * 0.3, particle.size * 0.4, 0, Math.PI * 2);
                    this.ctx.fill();
                    
            // Enhanced speed trails for faster particles
            if (velocity > this.flowRate * 0.8) {
                const trailGradient = this.ctx.createLinearGradient(
                    particle.x, particle.y,
                    particle.x - particle.vx * 0.3, particle.y - particle.vy * 0.3
                );
                trailGradient.addColorStop(0, trailColor);
                trailGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
                
                this.ctx.strokeStyle = trailGradient;
                this.ctx.lineWidth = Math.max(0.5, velocity * 0.8);
                this.ctx.lineCap = 'round';
                    this.ctx.beginPath();
                this.ctx.moveTo(particle.x, particle.y);
                this.ctx.lineTo(particle.x - particle.vx * 0.3, particle.y - particle.vy * 0.3);
                this.ctx.stroke();
            }
            
            // Reset shadow for next particle
            this.ctx.shadowBlur = 0;
        });
    }
    
    drawPressureAnalysis() {
        // Modern pressure analysis panel with enhanced styling
        const panelX = 20;
        const panelY = this.ctx.canvas.height - 140; // Position from bottom
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
        this.ctx.shadowColor = '#E74C3C';
        this.ctx.shadowBlur = 8;
        this.ctx.lineWidth = 2;
        
        // Create gradient border
        const borderGradient = this.ctx.createLinearGradient(
            panelX, panelY, 
            panelX + panelWidth, panelY + panelHeight
        );
        borderGradient.addColorStop(0, '#E74C3C');
        borderGradient.addColorStop(0.5, '#C0392B');
        borderGradient.addColorStop(1, '#E74C3C');
        
        this.ctx.strokeStyle = borderGradient;
        this.ctx.strokeRect(panelX, panelY, panelWidth, panelHeight);
        this.ctx.shadowBlur = 0;
        
        // Add inner highlight for 3D effect
        const innerGradient = this.ctx.createLinearGradient(panelX, panelY, panelX, panelY + 30);
        innerGradient.addColorStop(0, 'rgba(231, 76, 60, 0.1)');
        innerGradient.addColorStop(1, 'rgba(231, 76, 60, 0)');
        this.ctx.fillStyle = innerGradient;
        this.ctx.fillRect(panelX, panelY, panelWidth, 30);
        
        // Modern title with crisp font rendering
        this.ctx.fillStyle = '#E74C3C';
        this.ctx.font = 'bold 16px Inter, Arial, sans-serif';
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('📊 Pressure Analysis', panelX + 15, panelY + 22);
        
        // Enhanced stats with modern styling
        this.ctx.font = '13px Inter, Arial, sans-serif';
        this.ctx.textBaseline = 'middle';
        
        this.ctx.fillStyle = '#E74C3C';
        this.ctx.fillText(`🔴 High Pressure: Porous Material`, panelX + 15, panelY + 45);
        this.ctx.fillText(`🟢 Low Pressure: Clear Sections`, panelX + 15, panelY + 62);
        this.ctx.fillText(`📏 Pressure Drop: ${(this.topPipeMaterial.porosity * 100).toFixed(0)}%`, panelX + 15, panelY + 79);
        
        // Enhanced pressure explanation with modern colors
        this.ctx.fillStyle = '#FFD700';
        this.ctx.font = 'bold 12px Inter, Arial, sans-serif';
        this.ctx.fillText('💡 Porous materials create pressure resistance', panelX + 15, panelY + 96);
        this.ctx.fillText('🔍 Watch pressure build up in materials!', panelX + 15, panelY + 113);
        
        // Add pressure indicator
        const pressureRatio = this.topPipeMaterial.porosity / this.bottomPipeMaterial.porosity;
        const pressureColor = pressureRatio > 2 ? '#E74C3C' : pressureRatio > 1.5 ? '#F39C12' : '#27AE60';
        this.ctx.fillStyle = pressureColor;
        this.ctx.fillText(`🎯 Pressure Ratio: ${pressureRatio.toFixed(1)}x`, panelX + 15, panelY + 130);
    }
    
    drawVelocityAnalysis() {
        // Modern velocity analysis panel with enhanced styling
        const panelX = 20;
        const panelY = this.ctx.canvas.height - 140; // Position from bottom
        const panelWidth = 320;
        const panelHeight = 120; // Reduced height since we removed duplicate content
        
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
        this.ctx.shadowColor = '#3498DB';
        this.ctx.shadowBlur = 8;
        this.ctx.lineWidth = 2;
        
        // Create gradient border
        const borderGradient = this.ctx.createLinearGradient(
            panelX, panelY, 
            panelX + panelWidth, panelY + panelHeight
        );
        borderGradient.addColorStop(0, '#3498DB');
        borderGradient.addColorStop(0.5, '#2980B9');
        borderGradient.addColorStop(1, '#3498DB');
        
        this.ctx.strokeStyle = borderGradient;
        this.ctx.strokeRect(panelX, panelY, panelWidth, panelHeight);
        this.ctx.shadowBlur = 0;
        
        // Add inner highlight for 3D effect
        const innerGradient = this.ctx.createLinearGradient(panelX, panelY, panelX, panelY + 30);
        innerGradient.addColorStop(0, 'rgba(52, 152, 219, 0.1)');
        innerGradient.addColorStop(1, 'rgba(52, 152, 219, 0)');
        this.ctx.fillStyle = innerGradient;
        this.ctx.fillRect(panelX, panelY, panelWidth, 30);
        
        // Modern title with crisp font rendering
        this.ctx.fillStyle = '#3498DB';
        this.ctx.font = 'bold 16px Inter, Arial, sans-serif';
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('⚡ Velocity Analysis', panelX + 15, panelY + 22);
        
        // Enhanced stats with modern styling
        this.ctx.font = '13px Inter, Arial, sans-serif';
        this.ctx.textBaseline = 'middle';
        
        this.ctx.fillStyle = '#3498DB';
        this.ctx.fillText(`🔵 Fast Flow: Clear Sections`, panelX + 15, panelY + 45);
        this.ctx.fillText(`🟠 Slow Flow: Porous Material`, panelX + 15, panelY + 62);
        
        // Add prominent viscosity indicator
        const viscosityEffect = this.viscosity * 0.1; // Same factor as in particle update
        const viscosityColor = viscosityEffect > 0.5 ? '#E74C3C' : viscosityEffect > 0.2 ? '#F39C12' : '#27AE60';
        this.ctx.fillStyle = viscosityColor;
        this.ctx.fillText(`🛢️ Viscosity Effect: ${(viscosityEffect * 100).toFixed(0)}%`, panelX + 15, panelY + 79);
        
        // Enhanced velocity explanation with modern colors
        this.ctx.fillStyle = '#FFD700';
        this.ctx.font = 'bold 12px Inter, Arial, sans-serif';
        this.ctx.fillText('💡 Porosity reduces flow velocity', panelX + 15, panelY + 96);
        this.ctx.fillText('🔍 Watch particles slow in materials!', panelX + 15, panelY + 113);
        
        // Add velocity indicator
        const velocityRatio = this.bottomPipeMaterial.porosity / this.topPipeMaterial.porosity;
        const velocityColor = velocityRatio > 2 ? '#27AE60' : velocityRatio > 1.5 ? '#F39C12' : '#E74C3C';
        this.ctx.fillStyle = velocityColor;
        this.ctx.fillText(`🎯 Velocity Ratio: ${velocityRatio.toFixed(1)}x`, panelX + 15, panelY + 130);
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
    
    drawFlowInfo() {
        // Modern info panel background
        this.ctx.fillStyle = 'rgba(26, 26, 46, 0.9)';
        this.ctx.fillRect(10, this.ctx.canvas.height - 100, 280, 90);
        
        // Border
        this.ctx.strokeStyle = '#4ECDC4';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(10, this.ctx.canvas.height - 100, 280, 90);
        
        // Modern text styling
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 14px Inter';
        this.ctx.textRenderingOptimization = 'optimizeLegibility';
        this.ctx.textAlign = 'left';
        
        let y = this.ctx.canvas.height - 80;
        this.ctx.fillText(`Flow Rate: ${this.flowRate.toFixed(1)}`, 20, y);
        y += 18;
        this.ctx.fillText(`Flow Type: ${this.flowType}`, 20, y);
        y += 18;
        
        // Porosity comparison
        this.ctx.fillStyle = '#FF6B6B';
        this.ctx.fillText(`High Porosity: ${Math.round(this.topPipeMaterial.porosity * 100)}%`, 20, y);
        y += 18;
        this.ctx.fillStyle = '#4ECDC4';
        this.ctx.fillText(`Low Porosity: ${Math.round(this.bottomPipeMaterial.porosity * 100)}%`, 20, y);
        
        // Physics explanation
        this.ctx.fillStyle = '#96CEB4';
        this.ctx.font = '12px Inter';
        this.ctx.fillText('💡 Higher porosity = slower flow', 20, this.ctx.canvas.height - 20);
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
        const viscosityEffect = this.viscosity * 0.1; // Same factor as in particle update
        const velocityRatio = this.bottomPipeMaterial.porosity / this.topPipeMaterial.porosity;
        
        return {
            flowRate: this.flowRate,
            viscosity: this.viscosity,
            reynoldsNumber: this.reynoldsNumber,
            flowType: this.flowType,
            averageVelocity: avgVelocity,
            viscosityEffect: viscosityEffect,
            velocityRatio: velocityRatio,
            topPorosity: this.topPipeMaterial.porosity,
            bottomPorosity: this.bottomPipeMaterial.porosity,
            time: this.time
        };
    }
    
    drawPorosityAnalysis() {
        // Modern porosity analysis panel with enhanced styling
        const panelX = 20;
        const panelY = this.ctx.canvas.height - 140; // Position from bottom
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
        this.ctx.font = 'bold 16px Inter, Arial, sans-serif';
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('⚡ Porosity Analysis', panelX + 15, panelY + 22);
        
        // Enhanced stats with modern styling
        this.ctx.font = '13px Inter, Arial, sans-serif';
        this.ctx.textBaseline = 'middle';
        
        this.ctx.fillStyle = '#4ECDC4';
        this.ctx.fillText(`🚀 High Porosity: ${Math.round(this.topPipeMaterial.porosity * 100)}%`, panelX + 15, panelY + 45);
        this.ctx.fillText(`📏 Low Porosity: ${Math.round(this.bottomPipeMaterial.porosity * 100)}%`, panelX + 15, panelY + 62);
        this.ctx.fillText(`💧 Porosity Difference: ${Math.round((this.topPipeMaterial.porosity - this.bottomPipeMaterial.porosity) * 100)}%`, panelX + 15, panelY + 79);
        
        // Enhanced porosity explanation with modern colors
        this.ctx.fillStyle = '#FFD700';
        this.ctx.font = 'bold 12px Inter, Arial, sans-serif';
        this.ctx.fillText('💡 Higher porosity = slower flow', panelX + 15, panelY + 96);
        this.ctx.fillText('🔍 Watch particles slow down!', panelX + 15, panelY + 113);
        
        // Add performance indicator
        const efficiency = Math.min(100, (this.topPipeMaterial.porosity / 0.7) * 100);
        const efficiencyColor = efficiency > 80 ? '#4ECDC4' : efficiency > 60 ? '#F39C12' : '#FF6B6B';
        this.ctx.fillStyle = efficiencyColor;
        this.ctx.fillText(`🎯 Porosity Efficiency: ${efficiency.toFixed(0)}%`, panelX + 15, panelY + 130);
    }
    
    drawModeSpecificEffects() {
        // Draw background effects based on visualization mode
        switch (this.visualizationMode) {
            case 'pressure':
                this.drawPressureBackground();
                break;
            case 'velocity':
                this.drawVelocityBackground();
                break;
            case 'porosity':
                this.drawPorosityBackground();
                break;
        }
    }
    
    drawPressureBackground() {
        // Draw pressure gradient background - darker in porous materials
        const gradient = this.ctx.createLinearGradient(0, 0, this.ctx.canvas.width, 0);
        gradient.addColorStop(0, 'rgba(255, 0, 0, 0.05)'); // Low pressure
        gradient.addColorStop(0.3, 'rgba(255, 0, 0, 0.1)'); // Medium pressure
        gradient.addColorStop(0.5, 'rgba(255, 0, 0, 0.15)'); // High pressure in porous
        gradient.addColorStop(0.7, 'rgba(255, 0, 0, 0.1)'); // Medium pressure
        gradient.addColorStop(1, 'rgba(255, 0, 0, 0.05)'); // Low pressure
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, this.topPipeMaterial.y, this.ctx.canvas.width, this.topPipeMaterial.height);
        this.ctx.fillRect(0, this.bottomPipeMaterial.y, this.ctx.canvas.width, this.bottomPipeMaterial.height);
        
        // Add pressure arrows pointing into porous materials
        this.drawPressureArrows();
    }
    
    drawVelocityBackground() {
        // Draw velocity field background - flow lines
        this.ctx.strokeStyle = 'rgba(52, 152, 219, 0.3)';
        this.ctx.lineWidth = 1;
        this.ctx.setLineDash([5, 5]);
        
        // Draw flow lines in clear sections
        for (let y = this.topPipeY + 10; y < this.topPipeY + this.pipeHeight - 10; y += 20) {
            this.ctx.beginPath();
            this.ctx.moveTo(50, y);
            this.ctx.lineTo(this.ctx.canvas.width - 50, y);
            this.ctx.stroke();
        }
        
        for (let y = this.bottomPipeY + 10; y < this.bottomPipeY + this.pipeHeight - 10; y += 20) {
            this.ctx.beginPath();
            this.ctx.moveTo(50, y);
            this.ctx.lineTo(this.ctx.canvas.width - 50, y);
            this.ctx.stroke();
        }
        
        this.ctx.setLineDash([]);
    }
    
    drawPorosityBackground() {
        // Draw porosity pattern background
        this.ctx.fillStyle = 'rgba(34, 139, 34, 0.1)'; // Green for high porosity
        this.ctx.fillRect(this.topPipeMaterial.x, this.topPipeMaterial.y, 
                         this.topPipeMaterial.width, this.topPipeMaterial.height);
        
        this.ctx.fillStyle = 'rgba(128, 0, 128, 0.1)'; // Purple for low porosity
        this.ctx.fillRect(this.bottomPipeMaterial.x, this.bottomPipeMaterial.y, 
                         this.bottomPipeMaterial.width, this.bottomPipeMaterial.height);
        
        // Add porosity texture patterns
        this.drawPorosityTexture();
    }
    
    drawPressureArrows() {
        // Draw pressure arrows pointing into porous materials
        this.ctx.strokeStyle = 'rgba(255, 0, 0, 0.6)';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([3, 3]);
        
        // Arrows pointing into top porous material
        for (let x = this.topPipeMaterial.x + 20; x < this.topPipeMaterial.x + this.topPipeMaterial.width - 20; x += 40) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, this.topPipeMaterial.y - 10);
            this.ctx.lineTo(x, this.topPipeMaterial.y + 5);
            this.ctx.stroke();
            
            // Arrow head
            this.ctx.beginPath();
            this.ctx.moveTo(x - 3, this.topPipeMaterial.y + 2);
            this.ctx.lineTo(x, this.topPipeMaterial.y + 5);
            this.ctx.lineTo(x + 3, this.topPipeMaterial.y + 2);
            this.ctx.stroke();
        }
        
        // Arrows pointing into bottom porous material
        for (let x = this.bottomPipeMaterial.x + 20; x < this.bottomPipeMaterial.x + this.bottomPipeMaterial.width - 20; x += 40) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, this.bottomPipeMaterial.y + this.bottomPipeMaterial.height + 10);
            this.ctx.lineTo(x, this.bottomPipeMaterial.y + this.bottomPipeMaterial.height - 5);
            this.ctx.stroke();
            
            // Arrow head
            this.ctx.beginPath();
            this.ctx.moveTo(x - 3, this.bottomPipeMaterial.y + this.bottomPipeMaterial.height - 2);
            this.ctx.lineTo(x, this.bottomPipeMaterial.y + this.bottomPipeMaterial.height - 5);
            this.ctx.lineTo(x + 3, this.bottomPipeMaterial.y + this.bottomPipeMaterial.height - 2);
            this.ctx.stroke();
        }
        
        this.ctx.setLineDash([]);
    }
    
    drawPorosityTexture() {
        // Draw texture patterns for porosity visualization
        this.ctx.fillStyle = 'rgba(34, 139, 34, 0.3)';
        
        // High porosity texture - many small dots
        for (let i = 0; i < 20; i++) {
            for (let j = 0; j < 4; j++) {
                const x = this.topPipeMaterial.x + 10 + i * (this.topPipeMaterial.width - 20) / 19;
                const y = this.topPipeMaterial.y + 8 + j * (this.topPipeMaterial.height - 16) / 3;
                this.ctx.beginPath();
                this.ctx.arc(x, y, 1, 0, Math.PI * 2);
                this.ctx.fill();
            }
        }
        
        this.ctx.fillStyle = 'rgba(128, 0, 128, 0.3)';
        
        // Low porosity texture - fewer, larger dots
        for (let i = 0; i < 12; i++) {
            for (let j = 0; j < 2; j++) {
                const x = this.bottomPipeMaterial.x + 15 + i * (this.bottomPipeMaterial.width - 30) / 11;
                const y = this.bottomPipeMaterial.y + 10 + j * (this.bottomPipeMaterial.height - 20) / 1;
                this.ctx.beginPath();
                this.ctx.arc(x, y, 1.5, 0, Math.PI * 2);
                this.ctx.fill();
            }
        }
    }
    
    drawPressureGradients() {
        // Draw pressure gradient lines across the pipes
        this.ctx.strokeStyle = 'rgba(255, 0, 0, 0.4)';
        this.ctx.lineWidth = 1;
        this.ctx.setLineDash([2, 4]);
        
        // Pressure lines in porous materials
        for (let x = this.topPipeMaterial.x; x < this.topPipeMaterial.x + this.topPipeMaterial.width; x += 30) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, this.topPipeMaterial.y);
            this.ctx.lineTo(x, this.topPipeMaterial.y + this.topPipeMaterial.height);
            this.ctx.stroke();
        }
        
        for (let x = this.bottomPipeMaterial.x; x < this.bottomPipeMaterial.x + this.bottomPipeMaterial.width; x += 30) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, this.bottomPipeMaterial.y);
            this.ctx.lineTo(x, this.bottomPipeMaterial.y + this.bottomPipeMaterial.height);
            this.ctx.stroke();
        }
        
        this.ctx.setLineDash([]);
    }
    
    drawVelocityField() {
        // Draw velocity field vectors
        this.ctx.strokeStyle = 'rgba(52, 152, 219, 0.6)';
        this.ctx.lineWidth = 1;
        
        // Velocity vectors in clear sections
        for (let x = 100; x < this.ctx.canvas.width - 100; x += 60) {
            for (let y = this.topPipeY + 10; y < this.topPipeY + this.pipeHeight - 10; y += 30) {
                if (x < this.topPipeMaterial.x || x > this.topPipeMaterial.x + this.topPipeMaterial.width) {
                    this.ctx.beginPath();
                    this.ctx.moveTo(x, y);
                    this.ctx.lineTo(x + 20, y);
                    this.ctx.stroke();
                    
                    // Arrow head
                    this.ctx.beginPath();
                    this.ctx.moveTo(x + 15, y - 2);
                    this.ctx.lineTo(x + 20, y);
                    this.ctx.lineTo(x + 15, y + 2);
                    this.ctx.stroke();
                }
            }
            
            for (let y = this.bottomPipeY + 10; y < this.bottomPipeY + this.pipeHeight - 10; y += 30) {
                if (x < this.bottomPipeMaterial.x || x > this.bottomPipeMaterial.x + this.bottomPipeMaterial.width) {
                    this.ctx.beginPath();
                    this.ctx.moveTo(x, y);
                    this.ctx.lineTo(x + 20, y);
                    this.ctx.stroke();
                    
                    // Arrow head
                    this.ctx.beginPath();
                    this.ctx.moveTo(x + 15, y - 2);
                    this.ctx.lineTo(x + 20, y);
                    this.ctx.lineTo(x + 15, y + 2);
                    this.ctx.stroke();
                }
            }
        }
    }
    
    drawPorosityFlowPatterns() {
        // Draw flow patterns specific to porosity
        this.ctx.strokeStyle = 'rgba(34, 139, 34, 0.5)';
        this.ctx.lineWidth = 1;
        this.ctx.setLineDash([3, 3]);
        
        // High porosity flow patterns - curved lines
        for (let i = 0; i < 5; i++) {
            const startY = this.topPipeMaterial.y + 10 + i * (this.topPipeMaterial.height - 20) / 4;
            this.ctx.beginPath();
            this.ctx.moveTo(this.topPipeMaterial.x, startY);
            
            // Curved path through porous material
            for (let x = this.topPipeMaterial.x; x < this.topPipeMaterial.x + this.topPipeMaterial.width; x += 10) {
                const y = startY + Math.sin((x - this.topPipeMaterial.x) / 50) * 5;
                this.ctx.lineTo(x, y);
            }
            this.ctx.stroke();
        }
        
        this.ctx.strokeStyle = 'rgba(128, 0, 128, 0.5)';
        
        // Low porosity flow patterns - straight lines
        for (let i = 0; i < 3; i++) {
            const startY = this.bottomPipeMaterial.y + 10 + i * (this.bottomPipeMaterial.height - 20) / 2;
            this.ctx.beginPath();
            this.ctx.moveTo(this.bottomPipeMaterial.x, startY);
            this.ctx.lineTo(this.bottomPipeMaterial.x + this.bottomPipeMaterial.width, startY);
            this.ctx.stroke();
        }
        
        this.ctx.setLineDash([]);
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
        
        // Add pipe system properties for Bernoulli
        this.pipeStartX = 50;
        this.pipeEndX = 750;
        
        this.initializeParticles();
    }
    
    initializeParticles() {
        this.particles = [];
        // Create particles starting closer to the visible area for immediate flow
        for (let i = 0; i < this.maxParticles; i++) {
            this.particles.push({
                x: 50 + Math.random() * 200, // Start closer to visible area
                y: 250 + Math.random() * 100,
                vx: this.pressureDifference * (1 + Math.random() * 0.2),
                vy: (Math.random() - 0.5) * 0.2,
                size: 2 + Math.random() * 2, // Smaller particles
                color: `hsl(${220 + Math.random() * 40}, 80%, 60%)`,
                life: 0,
                currentSection: 'left',
                opacity: 0.7 + Math.random() * 0.3, // Varying opacity for depth
                trail: [] // Add trail history
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
        super.update(deltaTime); // Call parent update to handle standardized controls
        
        this.time += deltaTime;
        
        // Maintain continuous flow by adding new particles
        this.maintainContinuousFlow(deltaTime);
        
        this.particles.forEach((particle, index) => {
            // Calculate velocity based on Bernoulli's principle
            let baseVelocity = this.pressureDifference * (1 + Math.random() * 0.2);
            let velocityMultiplier = 1.0;
            
            // Bernoulli's equation: P + ½ρv² + ρgh = constant
            // For horizontal flow: P + ½ρv² = constant
            // Therefore: v² ∝ 1/A (where A is cross-sectional area)
            
            // Smooth velocity transitions based on position
            if (particle.x < 300) {
                // Left wide section - slow velocity
                velocityMultiplier = 0.6;
            } else if (particle.x >= 300 && particle.x < 350) {
                // Transition to narrow - gradually speed up
                const transitionProgress = (particle.x - 300) / 50;
                velocityMultiplier = 0.6 + (1.8 - 0.6) * transitionProgress;
            } else if (particle.x >= 350 && particle.x < 450) {
                // Narrow section - fast velocity (Bernoulli effect)
                velocityMultiplier = 1.8;
            } else if (particle.x >= 450 && particle.x < 500) {
                // Transition to wide - gradually slow down
                const transitionProgress = (particle.x - 450) / 50;
                velocityMultiplier = 1.8 - (1.8 - 0.6) * transitionProgress;
            } else {
                // Right wide section - slow velocity
                velocityMultiplier = 0.6;
            }
            
            // Apply velocity with gradual transition
            particle.vx = baseVelocity * velocityMultiplier;
            
            // Add slight turbulence in transitions (realistic fluid behavior)
            if ((particle.x >= 300 && particle.x < 350) || (particle.x >= 450 && particle.x < 500)) {
                particle.vx += (Math.random() - 0.5) * 0.5;
            }
            
            // Update trail history (keep last 5 positions for smooth trail)
            if (!particle.trail) particle.trail = [];
            particle.trail.push({ x: particle.x, y: particle.y });
            if (particle.trail.length > 5) {
                particle.trail.shift();
            }
            
            // Update position
            particle.x += particle.vx * deltaTime * 0.1;
            particle.y += particle.vy * deltaTime * 0.1;
            
            // Constrain particles to pipe boundaries
            this.constrainParticleToPipe(particle);
            
            particle.life += deltaTime;
            
            // Remove particles that go off screen (less aggressive removal)
            if (particle.x > this.ctx.canvas.width + 100 || 
                particle.x < -100 || 
                particle.y < 100 || 
                particle.y > this.ctx.canvas.height + 100 ||
                particle.life > 20000) { // Increased life time even more
                // Remove particle instead of resetting
                this.particles.splice(index, 1);
            }
        });
    }
    
    maintainContinuousFlow(deltaTime) {
        // Calculate target number of particles based on flow rate
        const targetParticles = this.maxParticles;
        const currentParticles = this.particles.length;
        
        // Add new particles more aggressively to maintain continuous flow
        if (currentParticles < targetParticles) {
            const particlesToAdd = Math.min(targetParticles - currentParticles, 2); // Add 2 at once
            
            for (let i = 0; i < particlesToAdd; i++) {
                this.addNewParticle();
            }
        }
        
        // Also add particles periodically to ensure continuous flow
        if (Math.random() < 0.15) { // 15% chance each frame for more frequent addition
            this.addNewParticle();
        }
    }
    
    addNewParticle() {
        // Add particle closer to the visible area for immediate flow
        const staggerOffset = Math.random() * 100; // Reduced stagger for closer entry
        
        this.particles.push({
            x: this.pipeStartX - 50 - staggerOffset,
            y: 250 + Math.random() * 100,
            vx: this.pressureDifference * (1 + Math.random() * 0.2),
            vy: (Math.random() - 0.5) * 0.2,
            size: 2 + Math.random() * 2,
            color: `hsl(${220 + Math.random() * 40}, 80%, 60%)`,
            life: 0,
            currentSection: 'left',
            opacity: 0.7 + Math.random() * 0.3,
            trail: [] // Add trail history
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
    
    drawStandardBackground() {
        // Standard background matching other animations
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.ctx.canvas.height);
        gradient.addColorStop(0, '#1a1a2e');
        gradient.addColorStop(1, '#16213e');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    }
    
    render() {
        // Draw standardized background (matching other animations)
        this.drawStandardBackground();
        
        // Draw pipe system
        this.drawPipeSystem();
        
        // Draw particles
        this.drawParticles();
        
        // Draw Bernoulli information
        this.drawBernoulliInfo();
        
        // Add real-world analogy for beginners
        this.drawBernoulliRealWorldAnalogy();
        
        // Draw canvas labels
        this.drawBernoulliLabels();
    }
    
    drawPipeSystem() {
        // Single continuous pipe with smooth transitions
        const pipeWidth = 200; // Wide sections
        const narrowWidth = 100; // Narrow section
        const transitionLength = 50; // Smooth transition length
        
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
        
        // Modern translucent gradient with pressure/velocity zones
        // Blue = High pressure, Low velocity (wide sections)
        // Red/Orange = Low pressure, High velocity (narrow section)
        const pipeGradient = this.ctx.createLinearGradient(0, 200, this.ctx.canvas.width, 400);
        pipeGradient.addColorStop(0, 'rgba(70, 130, 237, 0.35)'); // Blue - high pressure
        pipeGradient.addColorStop(0.35, 'rgba(70, 130, 237, 0.35)'); // Blue
        pipeGradient.addColorStop(0.42, 'rgba(255, 140, 60, 0.4)'); // Transition to orange
        pipeGradient.addColorStop(0.5, 'rgba(255, 100, 50, 0.45)'); // Red/Orange - low pressure, high velocity
        pipeGradient.addColorStop(0.58, 'rgba(255, 140, 60, 0.4)'); // Transition back
        pipeGradient.addColorStop(0.65, 'rgba(70, 130, 237, 0.35)'); // Blue - high pressure
        pipeGradient.addColorStop(1, 'rgba(70, 130, 237, 0.35)'); // Blue
        
        this.ctx.fillStyle = pipeGradient;
        this.ctx.fill();
        
        // Crisp border
        this.ctx.strokeStyle = 'rgba(100, 149, 237, 0.7)';
        this.ctx.lineWidth = 1.5;
        this.ctx.stroke();
        
        // Section labels with high contrast
        this.ctx.font = 'bold 14px Arial, sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.shadowBlur = 0;
        
        // Left section label
        this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.9)';
        this.ctx.lineWidth = 3;
        this.ctx.strokeText('High Pressure', 150, 180);
        this.ctx.strokeText('Low Velocity', 150, 198);
        this.ctx.fillStyle = '#4682FF';
        this.ctx.fillText('High Pressure', 150, 180);
        this.ctx.fillText('Low Velocity', 150, 198);
        
        // Middle section label
        this.ctx.strokeText('Low Pressure', 400, 230);
        this.ctx.strokeText('High Velocity', 400, 248);
        this.ctx.fillStyle = '#FF6432';
        this.ctx.fillText('Low Pressure', 400, 230);
        this.ctx.fillText('High Velocity', 400, 248);
        
        // Right section label
        this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.9)';
        this.ctx.strokeText('High Pressure', 650, 180);
        this.ctx.strokeText('Low Velocity', 650, 198);
        this.ctx.fillStyle = '#4682FF';
        this.ctx.fillText('High Pressure', 650, 180);
        this.ctx.fillText('Low Velocity', 650, 198);
        
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
        
        // Draw visual gauges for pressure and velocity
        this.drawPressureVelocityGauges();
    }
    
    drawPressureVelocityGauges() {
        // Pressure gauge (left side - high pressure)
        const leftGaugeX = 150;
        const leftGaugeY = 450;
        this.drawGauge(leftGaugeX, leftGaugeY, 'Pressure', 0.8, '#4682FF');
        
        // Velocity gauge (left side - low velocity)
        this.drawGauge(leftGaugeX + 120, leftGaugeY, 'Velocity', 0.3, '#4682FF');
        
        // Pressure gauge (middle - low pressure)
        const midGaugeX = 400;
        const midGaugeY = 450;
        this.drawGauge(midGaugeX, midGaugeY, 'Pressure', 0.3, '#FF6432');
        
        // Velocity gauge (middle - high velocity)
        this.drawGauge(midGaugeX + 120, midGaugeY, 'Velocity', 0.9, '#FF6432');
        
        // Pressure gauge (right side - high pressure)
        const rightGaugeX = 650;
        const rightGaugeY = 450;
        this.drawGauge(rightGaugeX, rightGaugeY, 'Pressure', 0.8, '#4682FF');
        
        // Velocity gauge (right side - low velocity)
        this.drawGauge(rightGaugeX + 120, rightGaugeY, 'Velocity', 0.3, '#4682FF');
    }
    
    drawGauge(x, y, label, value, color) {
        const width = 80;
        const height = 15;
        const radius = 3;
        
        // Gauge background
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        this.ctx.beginPath();
        this.ctx.roundRect(x - width/2, y, width, height, radius);
        this.ctx.fill();
        
        // Gauge fill
        const fillWidth = width * value;
        const gradient = this.ctx.createLinearGradient(x - width/2, y, x - width/2 + fillWidth, y);
        gradient.addColorStop(0, color);
        gradient.addColorStop(1, this.adjustColor(color, 30));
        
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.roundRect(x - width/2, y, fillWidth, height, radius);
        this.ctx.fill();
        
        // Gauge border
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.roundRect(x - width/2, y, width, height, radius);
        this.ctx.stroke();
        
        // Label
        this.ctx.font = 'bold 11px Arial, sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.9)';
        this.ctx.lineWidth = 2.5;
        this.ctx.strokeText(label, x, y - 3);
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.fillText(label, x, y - 3);
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
        // Enhanced particle rendering with energy-based coloring
        this.particles.forEach(particle => {
            // Validate particle properties to prevent NaN errors
            if (!particle || typeof particle.x !== 'number' || typeof particle.y !== 'number' || 
                isNaN(particle.x) || isNaN(particle.y)) {
                return; // Skip invalid particles
            }
            
            // Draw particle trail first (behind the particle)
            if (particle.trail && particle.trail.length > 1) {
                this.ctx.beginPath();
                this.ctx.moveTo(particle.trail[0].x, particle.trail[0].y);
                for (let i = 1; i < particle.trail.length; i++) {
                    this.ctx.lineTo(particle.trail[i].x, particle.trail[i].y);
                }
                this.ctx.strokeStyle = `rgba(100, 149, 237, ${0.3 * (particle.trail.length / 5)})`;
                this.ctx.lineWidth = 1;
                this.ctx.lineCap = 'round';
                this.ctx.lineJoin = 'round';
                this.ctx.stroke();
            }
            
            // Check if particle is in narrow section (Bernoulli effect)
            let energyLevel = 0.5; // Default energy level
            let particleColor = particle.color;
            
            if (particle.x >= 350 && particle.x < 450) {
                // Narrow section - high energy (Bernoulli effect)
                energyLevel = 1.0;
                particleColor = `hsl(${200 + Math.random() * 40}, 90%, 70%)`; // Bright blue
            } else if (particle.x >= 300 && particle.x < 350) {
                // Transition to narrow - medium energy
                const transitionProgress = (particle.x - 300) / 50;
                energyLevel = 0.5 + transitionProgress * 0.5;
                particleColor = `hsl(${220 + Math.random() * 30}, 85%, 65%)`; // Medium blue
            } else if (particle.x >= 450 && particle.x < 500) {
                // Transition from narrow - medium energy
                const transitionProgress = (particle.x - 450) / 50;
                energyLevel = 1.0 - transitionProgress * 0.5;
                particleColor = `hsl(${220 + Math.random() * 30}, 85%, 65%)`; // Medium blue
            } else {
                // Wide sections - low energy
                energyLevel = 0.5;
                particleColor = `hsl(${240 + Math.random() * 20}, 80%, 60%)`; // Darker blue
            }
            
            // Create gradient for particle based on energy level
            const gradient = this.ctx.createRadialGradient(
                particle.x, particle.y, 0,
                particle.x, particle.y, particle.size
            );
            
            // Energy mode for Bernoulli: Green for high energy, purple for low energy
            if (energyLevel > 0.8) {
                gradient.addColorStop(0, '#4ECDC4'); // Bright cyan for high energy
                gradient.addColorStop(1, '#2ECC71'); // Green for high energy
            } else if (energyLevel > 0.6) {
                gradient.addColorStop(0, '#3498DB'); // Blue for medium energy
                gradient.addColorStop(1, '#2980B9'); // Darker blue
            } else {
                gradient.addColorStop(0, '#9B59B6'); // Purple for low energy
                gradient.addColorStop(1, '#8E44AD'); // Darker purple
            }
            
            // Draw particle with enhanced styling
            this.ctx.fillStyle = gradient;
            this.ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
            this.ctx.shadowBlur = 4;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Add glow effect for high-energy particles
            if (energyLevel > 0.8) {
                this.ctx.shadowColor = '#4ECDC4';
                this.ctx.shadowBlur = 8;
                this.ctx.beginPath();
                this.ctx.arc(particle.x, particle.y, particle.size * 1.5, 0, Math.PI * 2);
                this.ctx.stroke();
            }
            
            // Reset shadow
            this.ctx.shadowBlur = 0;
        });
    }
    
    drawPressureAnalysis() {
        // Modern pressure analysis panel with enhanced styling
        const panelX = 20;
        const panelY = this.ctx.canvas.height - 140; // Position from bottom
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
        this.ctx.shadowColor = '#E74C3C';
        this.ctx.shadowBlur = 8;
        this.ctx.lineWidth = 2;
        
        // Create gradient border
        const borderGradient = this.ctx.createLinearGradient(
            panelX, panelY, 
            panelX + panelWidth, panelY + panelHeight
        );
        borderGradient.addColorStop(0, '#E74C3C');
        borderGradient.addColorStop(0.5, '#C0392B');
        borderGradient.addColorStop(1, '#E74C3C');
        
        this.ctx.strokeStyle = borderGradient;
        this.ctx.strokeRect(panelX, panelY, panelWidth, panelHeight);
        this.ctx.shadowBlur = 0;
        
        // Add inner highlight for 3D effect
        const innerGradient = this.ctx.createLinearGradient(panelX, panelY, panelX, panelY + 30);
        innerGradient.addColorStop(0, 'rgba(231, 76, 60, 0.1)');
        innerGradient.addColorStop(1, 'rgba(231, 76, 60, 0)');
        this.ctx.fillStyle = innerGradient;
        this.ctx.fillRect(panelX, panelY, panelWidth, 30);
        
        // Modern title with crisp font rendering
        this.ctx.fillStyle = '#E74C3C';
        this.ctx.font = 'bold 16px Inter, Arial, sans-serif';
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('📊 Pressure Analysis', panelX + 15, panelY + 22);
        
        // Enhanced stats with modern styling
        this.ctx.font = '13px Inter, Arial, sans-serif';
        this.ctx.textBaseline = 'middle';
        
        this.ctx.fillStyle = '#E74C3C';
        this.ctx.fillText(`🔴 High Pressure: Porous Material`, panelX + 15, panelY + 45);
        this.ctx.fillText(`🟢 Low Pressure: Clear Sections`, panelX + 15, panelY + 62);
        this.ctx.fillText(`📏 Pressure Drop: ${(this.topPipeMaterial.porosity * 100).toFixed(0)}%`, panelX + 15, panelY + 79);
        
        // Enhanced pressure explanation with modern colors
        this.ctx.fillStyle = '#FFD700';
        this.ctx.font = 'bold 12px Inter, Arial, sans-serif';
        this.ctx.fillText('💡 Porous materials create pressure resistance', panelX + 15, panelY + 96);
        this.ctx.fillText('🔍 Watch pressure build up in materials!', panelX + 15, panelY + 113);
        
        // Add pressure indicator
        const pressureRatio = this.topPipeMaterial.porosity / this.bottomPipeMaterial.porosity;
        const pressureColor = pressureRatio > 2 ? '#E74C3C' : pressureRatio > 1.5 ? '#F39C12' : '#27AE60';
        this.ctx.fillStyle = pressureColor;
        this.ctx.fillText(`🎯 Pressure Ratio: ${pressureRatio.toFixed(1)}x`, panelX + 15, panelY + 130);
    }
    
    drawVelocityAnalysis() {
        // Modern velocity analysis panel with enhanced styling
        const panelX = 20;
        const panelY = this.ctx.canvas.height - 140; // Position from bottom
        const panelWidth = 320;
        const panelHeight = 120; // Reduced height since we removed duplicate content
        
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
        this.ctx.shadowColor = '#3498DB';
        this.ctx.shadowBlur = 8;
        this.ctx.lineWidth = 2;
        
        // Create gradient border
        const borderGradient = this.ctx.createLinearGradient(
            panelX, panelY, 
            panelX + panelWidth, panelY + panelHeight
        );
        borderGradient.addColorStop(0, '#3498DB');
        borderGradient.addColorStop(0.5, '#2980B9');
        borderGradient.addColorStop(1, '#3498DB');
        
        this.ctx.strokeStyle = borderGradient;
        this.ctx.strokeRect(panelX, panelY, panelWidth, panelHeight);
        this.ctx.shadowBlur = 0;
        
        // Add inner highlight for 3D effect
        const innerGradient = this.ctx.createLinearGradient(panelX, panelY, panelX, panelY + 30);
        innerGradient.addColorStop(0, 'rgba(52, 152, 219, 0.1)');
        innerGradient.addColorStop(1, 'rgba(52, 152, 219, 0)');
        this.ctx.fillStyle = innerGradient;
        this.ctx.fillRect(panelX, panelY, panelWidth, 30);
        
        // Modern title with crisp font rendering
        this.ctx.fillStyle = '#3498DB';
        this.ctx.font = 'bold 16px Inter, Arial, sans-serif';
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('⚡ Velocity Analysis', panelX + 15, panelY + 22);
        
        // Enhanced stats with modern styling
        this.ctx.font = '13px Inter, Arial, sans-serif';
        this.ctx.textBaseline = 'middle';
        
        this.ctx.fillStyle = '#3498DB';
        this.ctx.fillText(`🔵 Fast Flow: Clear Sections`, panelX + 15, panelY + 45);
        this.ctx.fillText(`🟠 Slow Flow: Porous Material`, panelX + 15, panelY + 62);
        
        // Add prominent viscosity indicator
        const viscosityEffect = this.viscosity * 0.1; // Same factor as in particle update
        const viscosityColor = viscosityEffect > 0.5 ? '#E74C3C' : viscosityEffect > 0.2 ? '#F39C12' : '#27AE60';
        this.ctx.fillStyle = viscosityColor;
        this.ctx.fillText(`🛢️ Viscosity Effect: ${(viscosityEffect * 100).toFixed(0)}%`, panelX + 15, panelY + 79);
        
        // Enhanced velocity explanation with modern colors
        this.ctx.fillStyle = '#FFD700';
        this.ctx.font = 'bold 12px Inter, Arial, sans-serif';
        this.ctx.fillText('💡 Porosity reduces flow velocity', panelX + 15, panelY + 96);
        this.ctx.fillText('🔍 Watch particles slow in materials!', panelX + 15, panelY + 113);
        
        // Add velocity indicator
        const velocityRatio = this.bottomPipeMaterial.porosity / this.topPipeMaterial.porosity;
        const velocityColor = velocityRatio > 2 ? '#27AE60' : velocityRatio > 1.5 ? '#F39C12' : '#E74C3C';
        this.ctx.fillStyle = velocityColor;
        this.ctx.fillText(`🎯 Velocity Ratio: ${velocityRatio.toFixed(1)}x`, panelX + 15, panelY + 130);
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
        const panelY = 20;
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
        this.ctx.fillText(`⚡ Velocity Ratio: 1.8x`, panelX + 15, panelY + 62);
        this.ctx.fillText(`💧 Flow Rate: ${this.particles.length}/80`, panelX + 15, panelY + 79);
        
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
            pressureDifference: this.pressureDifference,
            velocityRatio: 1.8, // Enhanced velocity ratio in narrow section
            energyConservation: '✓',
            particleCount: this.particles.length,
            maxParticles: this.maxParticles,
            flowEfficiency: Math.min(100, (this.pressureDifference / 2) * 100),
            time: this.time
        };
    }
    
    drawBernoulliLabels() {
        this.drawLabels(
            'Bernoulli\'s Principle',
            'P + ½ρv² + ρgh = constant  |  v² ∝ 1/A  |  ΔP = ½ρ(v₂² - v₁²)'
        );
    }
}