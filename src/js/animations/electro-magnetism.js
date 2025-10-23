

// Electric Fields Simulation - Simplified
import { BaseAnimation } from './base-animation.js';

export class ElectricFields extends BaseAnimation {
    constructor(ctx) {
        super(ctx);
        this.charges = [];
        this.testParticles = [];
        this.fieldStrength = 1.0;
        this.speed = 1.0;
        this.particleCount = 20;
        this.showFieldLines = true;
        this.showParticles = true;
        this.showForceArrows = false;
        this.showAnalytics = true; // Enable analytics by default for electric fields
        
        this.initializeTestParticles();
        this.initializeDefaultCharges();
    }
    
    initializeTestParticles() {
        this.testParticles = [];
        for (let i = 0; i < this.particleCount; i++) {
            this.testParticles.push({
                x: Math.random() * this.ctx.canvas.width,
                y: Math.random() * this.ctx.canvas.height,
                vx: 0,
                vy: 0,
                trail: [],
                maxTrailLength: 30
            });
        }
    }
    
    initializeDefaultCharges() {
        // Add some default charges to make the animation interesting
        this.addChargeAtPosition('positive', this.ctx.canvas.width * 0.3, this.ctx.canvas.height * 0.5);
        this.addChargeAtPosition('negative', this.ctx.canvas.width * 0.7, this.ctx.canvas.height * 0.5);
    }
    
    setSpeed(speed) {
        this.speed = speed;
    }
    
    setFieldStrength(strength) {
        this.fieldStrength = strength;
    }
    
    setParticleCount(count) {
        this.particleCount = count;
        this.initializeTestParticles();
    }
    setShowAnalytics(show) {
        this.showAnalytics = show;
    }
    addChargeAtPosition(type, x, y) {
        const charge = {
            x: x,
            y: y,
            type: type, // 'positive' or 'negative'
            magnitude: 1,
            color: type === 'positive' ? '#ff6b6b' : '#667eea'
        };
        this.charges.push(charge);
    }
    
    clearCharges() {
        this.charges = [];
        this.initializeDefaultCharges(); // Re-add default charges after clearing
    }
    
    reset() {
        this.time = 0;
        this.charges = [];
        this.initializeTestParticles();
        this.initializeDefaultCharges();
    }
    
    calculateElectricField(x, y) {
        let ex = 0, ey = 0;
        const k = 500; // Simplified Coulomb's constant
        
        this.charges.forEach(charge => {
            const dx = x - charge.x;
            const dy = y - charge.y;
            const r = Math.sqrt(dx * dx + dy * dy);
            
            if (r > 10) { // Avoid division by zero
                const force = k * charge.magnitude * this.fieldStrength / (r * r);
                const sign = charge.type === 'positive' ? 1 : -1;
                ex += sign * force * dx / r;
                ey += sign * force * dy / r;
            }
        });
        
        return { ex, ey };
    }
    
    update(deltaTime) {
        const dt = (deltaTime / 1000) * this.speed * 20; // Much faster animation
        this.time += dt;
        
        this.testParticles.forEach(particle => {
            const field = this.calculateElectricField(particle.x, particle.y);
            
            // Apply electric force (simplified)
            particle.vx += field.ex * dt * 0.5;
            particle.vy += field.ey * dt * 0.5;
            
            // Add damping to prevent chaos
            particle.vx *= 0.95;
            particle.vy *= 0.95;
            
            // Limit maximum speed
            const speed = Math.sqrt(particle.vx * particle.vx + particle.vy * particle.vy);
            if (speed > 100) {
                particle.vx *= 0.8;
                particle.vy *= 0.8;
            }
            
            // Update position
            particle.x += particle.vx * dt;
            particle.y += particle.vy * dt;
            
            // Add to trail
            particle.trail.push({ x: particle.x, y: particle.y });
            if (particle.trail.length > particle.maxTrailLength) {
                particle.trail.shift();
            }
            
            // Wrap around edges
            if (particle.x < 0) particle.x = this.ctx.canvas.width;
            if (particle.x > this.ctx.canvas.width) particle.x = 0;
            if (particle.y < 0) particle.y = this.ctx.canvas.height;
            if (particle.y > this.ctx.canvas.height) particle.y = 0;
        });
    }
    
    render() {
        // Modern dark gradient background
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.ctx.canvas.height);
        gradient.addColorStop(0, '#181c2b');
        gradient.addColorStop(1, '#232946');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);

        // Show analytics (field lines, particles, force arrows) if enabled
        if (this.showAnalytics) {
            this.drawFieldLines();
            this.drawParticles();
            this.drawForceArrows();
        }
        // Always show charges
        this.drawCharges();
        
        // Draw canvas labels
        this.drawElectricLabels();
    }
    
    drawFieldLines() {
        const spacing = 30; // Reduced spacing for more field lines
        
        for (let x = spacing; x < this.ctx.canvas.width; x += spacing) {
            for (let y = spacing; y < this.ctx.canvas.height; y += spacing) {
                const field = this.calculateElectricField(x, y);
                const magnitude = Math.sqrt(field.ex * field.ex + field.ey * field.ey);
                
                if (magnitude > 0.1) { // Lower threshold to show more field lines
                    const angle = Math.atan2(field.ey, field.ex);
                    const intensity = Math.min(magnitude / 50, 1); // Adjusted intensity scaling
                    
                    this.ctx.beginPath();
                    this.ctx.strokeStyle = `rgba(102, 126, 234, ${intensity})`;
                    this.ctx.lineWidth = 2;
                    this.ctx.moveTo(x, y);
                    this.ctx.lineTo(
                        x + 25 * Math.cos(angle), // Longer arrows
                        y + 25 * Math.sin(angle)
                    );
                    this.ctx.stroke();
                    
                    // Arrowhead
                    this.ctx.beginPath();
                    this.ctx.fillStyle = `rgba(102, 126, 234, ${intensity})`;
                    this.ctx.moveTo(
                        x + 25 * Math.cos(angle),
                        y + 25 * Math.sin(angle)
                    );
                    this.ctx.lineTo(
                        x + 20 * Math.cos(angle - Math.PI / 6),
                        y + 20 * Math.sin(angle - Math.PI / 6)
                    );
                    this.ctx.lineTo(
                        x + 20 * Math.cos(angle + Math.PI / 6),
                        y + 20 * Math.sin(angle + Math.PI / 6)
                    );
                    this.ctx.closePath();
                    this.ctx.fill();
                }
            }
        }
    }
    
    drawCharges() {
        this.charges.forEach(charge => {
            // Modern gradient charge with glow effect
            const gradient = this.ctx.createRadialGradient(
                charge.x - 8, charge.y - 8, 0,
                charge.x, charge.y, 20
            );
            
            if (charge.type === 'positive') {
                gradient.addColorStop(0, '#ff6b6b');
                gradient.addColorStop(0.7, '#ff4757');
                gradient.addColorStop(1, '#ff3838');
            } else {
                gradient.addColorStop(0, '#667eea');
                gradient.addColorStop(0.7, '#5f6fd8');
                gradient.addColorStop(1, '#5352ed');
            }
            
            // Glow effect
            this.ctx.beginPath();
            this.ctx.fillStyle = charge.type === 'positive' ? 'rgba(255, 107, 107, 0.3)' : 'rgba(102, 126, 234, 0.3)';
            this.ctx.arc(charge.x, charge.y, 18, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Main charge circle
            this.ctx.beginPath();
            this.ctx.fillStyle = gradient;
            this.ctx.arc(charge.x, charge.y, 12, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Modern shadow
            this.ctx.beginPath();
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
            this.ctx.arc(charge.x + 2, charge.y + 2, 12, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Charge symbol with modern styling
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = 'bold 20px Inter';
        this.ctx.textRenderingOptimization = 'optimizeLegibility';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(charge.type === 'positive' ? '+' : '−', charge.x, charge.y);
        });
    }
    
    drawParticles() {
        this.testParticles.forEach(particle => {
            // Modern particle trail with gradient
            if (particle.trail.length > 1) {
                this.ctx.beginPath();
                const gradient = this.ctx.createLinearGradient(
                    particle.trail[0].x, particle.trail[0].y,
                    particle.x, particle.y
                );
                gradient.addColorStop(0, 'rgba(255, 255, 255, 0.1)');
                gradient.addColorStop(1, 'rgba(255, 255, 255, 0.6)');
                this.ctx.strokeStyle = gradient;
                this.ctx.lineWidth = 3;
                this.ctx.lineCap = 'round';
                this.ctx.moveTo(particle.trail[0].x, particle.trail[0].y);
                particle.trail.forEach(point => {
                    this.ctx.lineTo(point.x, point.y);
                });
                this.ctx.stroke();
            }
            
            // Modern particle with glow and gradient
            const particleGradient = this.ctx.createRadialGradient(
                particle.x - 3, particle.y - 3, 0,
                particle.x, particle.y, 8
            );
            particleGradient.addColorStop(0, '#ffffff');
            particleGradient.addColorStop(0.7, '#f8f9fa');
            particleGradient.addColorStop(1, '#e9ecef');
            
            // Glow effect
            this.ctx.beginPath();
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
            this.ctx.arc(particle.x, particle.y, 8, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Main particle
            this.ctx.beginPath();
            this.ctx.fillStyle = particleGradient;
            this.ctx.arc(particle.x, particle.y, 4, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Modern shadow
            this.ctx.beginPath();
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
            this.ctx.arc(particle.x + 1, particle.y + 1, 4, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }
    
    drawForceArrows() {
        this.testParticles.forEach(particle => {
            const field = this.calculateElectricField(particle.x, particle.y);
            const forceMagnitude = Math.sqrt(field.ex * field.ex + field.ey * field.ey);
            
            if (forceMagnitude > 5) {
                const scale = 0.8;
                const endX = particle.x + field.ex * scale;
                const endY = particle.y + field.ey * scale;
                
                // Modern force arrow with gradient and glow
                const arrowGradient = this.ctx.createLinearGradient(
                    particle.x, particle.y, endX, endY
                );
                arrowGradient.addColorStop(0, '#ff6b35');
                arrowGradient.addColorStop(1, '#ff8c42');
                
                // Glow effect
                this.ctx.beginPath();
                this.ctx.strokeStyle = 'rgba(255, 107, 53, 0.4)';
                this.ctx.lineWidth = 6;
                this.ctx.lineCap = 'round';
                this.ctx.moveTo(particle.x, particle.y);
                this.ctx.lineTo(endX, endY);
                this.ctx.stroke();
                
                // Main arrow
                this.ctx.beginPath();
                this.ctx.strokeStyle = arrowGradient;
                this.ctx.lineWidth = 3;
                this.ctx.lineCap = 'round';
                this.ctx.moveTo(particle.x, particle.y);
                this.ctx.lineTo(endX, endY);
                this.ctx.stroke();
                
                // Modern arrowhead
                const angle = Math.atan2(field.ey, field.ex);
                this.ctx.beginPath();
                this.ctx.fillStyle = arrowGradient;
                this.ctx.moveTo(endX, endY);
                this.ctx.lineTo(
                    endX - 10 * Math.cos(angle - Math.PI / 6),
                    endY - 10 * Math.sin(angle - Math.PI / 6)
                );
                this.ctx.lineTo(
                    endX - 10 * Math.cos(angle + Math.PI / 6),
                    endY - 10 * Math.sin(angle + Math.PI / 6)
                );
                this.ctx.closePath();
                this.ctx.fill();
            }
        });
    }
    
    drawInfo() {
        // Modern analytics panel with gradient background
        const panelWidth = 200;
        const panelHeight = 120;
        const panelX = this.ctx.canvas.width - panelWidth - 20;
        const panelY = 20;
        
        // Panel background with gradient
        const panelGradient = this.ctx.createLinearGradient(panelX, panelY, panelX, panelY + panelHeight);
        panelGradient.addColorStop(0, 'rgba(24, 28, 43, 0.95)');
        panelGradient.addColorStop(1, 'rgba(35, 41, 70, 0.95)');
        
        this.ctx.fillStyle = panelGradient;
        this.ctx.fillRect(panelX, panelY, panelWidth, panelHeight);
        
        // Panel border with glow
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(panelX, panelY, panelWidth, panelHeight);
        
        // Panel title
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 18px Inter';
        this.ctx.textRenderingOptimization = 'optimizeLegibility';
        this.ctx.textAlign = 'left';
        this.ctx.fillText('Electric Field Analytics', panelX + 15, panelY + 25);
        
        // Analytics data with modern styling
        this.ctx.fillStyle = '#e9ecef';
        this.ctx.font = '14px Inter';
        this.ctx.textRenderingOptimization = 'optimizeLegibility';
        this.ctx.fillText(`Charges: ${this.charges.length}`, panelX + 15, panelY + 45);
        this.ctx.fillText(`Particles: ${this.testParticles.length}`, panelX + 15, panelY + 65);
        this.ctx.fillText(`Field Strength: ${this.fieldStrength.toFixed(1)}`, panelX + 15, panelY + 85);
        
        // Modern explanation at bottom with dark background for visibility
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(5, this.ctx.canvas.height - 50, 300, 40);
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        this.ctx.font = '14px Inter';
        this.ctx.textRenderingOptimization = 'optimizeLegibility';
        this.ctx.textAlign = 'left';
        this.ctx.fillText('🔴 Positive (+)  🔵 Negative (−)', 10, this.ctx.canvas.height - 40);
        this.ctx.fillText('Click canvas to add charges', 10, this.ctx.canvas.height - 20);
    }
    
    getStats() {
        return {
            chargeCount: this.charges.length,
            particleCount: this.testParticles.length,
            fieldStrength: this.fieldStrength.toFixed(1),
            time: this.time.toFixed(1)
        };
    }
    
    drawElectricLabels() {
        this.drawLabels(
            'Electric Fields',
            'E = kQ/r²  |  F = kq₁q₂/r²  |  E = ΣEᵢ'
        );
        
        // Draw test particle explanation banner
        this.drawTestParticleBanner();
    }
    
    drawTestParticleBanner() {
        // Create banner background with gradient
        const bannerWidth = 320;
        const bannerHeight = 40;
        const bannerX = 10;
        const bannerY = this.ctx.canvas.height - 55;
        
        // Banner background with gradient
        const bannerGradient = this.ctx.createLinearGradient(bannerX, bannerY, bannerX, bannerY + bannerHeight);
        bannerGradient.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
        bannerGradient.addColorStop(1, 'rgba(240, 240, 240, 0.95)');
        
        this.ctx.fillStyle = bannerGradient;
        this.ctx.fillRect(bannerX, bannerY, bannerWidth, bannerHeight);
        
        // Banner border with glow
        this.ctx.shadowColor = 'rgba(102, 126, 234, 0.6)';
        this.ctx.shadowBlur = 4;
        this.ctx.strokeStyle = 'rgba(102, 126, 234, 0.8)';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(bannerX, bannerY, bannerWidth, bannerHeight);
        this.ctx.shadowBlur = 0;
        
        // Banner text
        this.ctx.fillStyle = '#1a1a2e';
        this.ctx.font = 'bold 13px Inter, Arial, sans-serif';
        this.ctx.textRenderingOptimization = 'optimizeLegibility';
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('White particles = Test charges (positive)', bannerX + 12, bannerY + bannerHeight/2);
        
        // Add small test charge icon with glow
        this.ctx.beginPath();
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        this.ctx.arc(bannerX + 290, bannerY + bannerHeight/2, 6, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.beginPath();
        this.ctx.fillStyle = '#ffffff';
        this.ctx.arc(bannerX + 290, bannerY + bannerHeight/2, 3, 0, Math.PI * 2);
        this.ctx.fill();
    }
}

// Magnetic Fields Simulation - Simplified
export class MagneticFields extends BaseAnimation {
    constructor(ctx) {
        super(ctx);
        this.speed = 0.5; // Slower default speed
        this.fieldStrength = 3.0; // Increased field strength for more visible effect
        this.particleCount = 15;
        this.showFieldLines = true;
        this.showParticles = true;
        this.animationOffset = 0;
        this.magnets = [];
        this.particles = [];
        
        this.initializeParticles();
        this.initializeDefaultMagnets();
    }
    
    initializeParticles() {
        this.particles = [];
        for (let i = 0; i < this.particleCount; i++) {
            this.particles.push({
                x: Math.random() * this.ctx.canvas.width,
                y: Math.random() * this.ctx.canvas.height,
                vx: (Math.random() - 0.5) * 80,
                vy: (Math.random() - 0.5) * 80,
                charge: Math.random() > 0.5 ? 1 : -1, // Simple +1 or -1
                trail: [],
                maxTrailLength: 30
            });
        }
    }
    
    initializeDefaultMagnets() {
        // Start with one complete magnet in the center
        const centerX = this.ctx.canvas.width / 2;
        const centerY = this.ctx.canvas.height / 2;
        const magnetLength = 50;
        
        this.magnets = [
            {
                x: centerX,
                y: centerY - magnetLength/2, // North pole
                strength: this.fieldStrength,
                pole: 'north',
                color: '#ff6b6b',
                isPartOfMagnet: true,
                magnetId: 1
            },
            {
                x: centerX,
                y: centerY + magnetLength/2, // South pole
                strength: this.fieldStrength,
                pole: 'south',
                color: '#667eea',
                isPartOfMagnet: true,
                magnetId: 1
            }
        ];
    }
    
    setSpeed(speed) {
        this.speed = speed;
    }
    
    setFieldStrength(strength) {
        this.fieldStrength = strength;
        this.magnets.forEach(magnet => {
            magnet.strength = strength;
        });
    }
    
    setParticleCount(count) {
        this.particleCount = count;
        this.initializeParticles();
    }
    
    setShowFieldLines(show) {
        this.showFieldLines = show;
    }
    
    setShowParticles(show) {
        this.showParticles = show;
    }
    

    
    addMagnetAtPosition(x, y) {
        // Add a complete magnet with both poles
        // North pole at the top, South pole at the bottom
        const magnetLength = 50; // Increased distance between poles
        
        this.magnets.push({
            x: x,
            y: y - magnetLength/2, // North pole
            strength: this.fieldStrength,
            pole: 'north',
            color: '#ff6b6b',
            isPartOfMagnet: true,
            magnetId: this.magnets.length
        });
        
        this.magnets.push({
            x: x,
            y: y + magnetLength/2, // South pole
            strength: this.fieldStrength,
            pole: 'south',
            color: '#667eea',
            isPartOfMagnet: true,
            magnetId: this.magnets.length - 1 // Same magnet ID
        });
    }
    
    clearMagnets() {
        this.magnets = [];
    }
    
    reset() {
        this.time = 0;
        this.clearMagnets();
        this.initializeDefaultMagnets();
        this.initializeParticles();
    }
    
    calculateMagneticField(x, y) {
        let Bx = 0, By = 0;
        
        this.magnets.forEach(magnet => {
            const dx = x - magnet.x;
            const dy = y - magnet.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 10) {
                // Field strength decreases with distance
                const fieldStrength = magnet.strength / (1 + distance / 100);
                
                // Calculate unit vector from magnet to point
                const unitX = dx / distance;
                const unitY = dy / distance;
                
                // Field direction depends on pole
                if (magnet.pole === 'north') {
                    // North pole: field points AWAY from magnet (outward)
                    Bx += fieldStrength * unitX;
                    By += fieldStrength * unitY;
                } else {
                    // South pole: field points TOWARD magnet (inward)
                    Bx -= fieldStrength * unitX;
                    By -= fieldStrength * unitY;
                }
            }
        });
        
        return { Bx, By };
    }
    
    update(deltaTime) {
        const dt = (deltaTime / 1000) * this.speed * 3;
        this.time += dt;
        
        // Update animation offset for field lines
        this.animationOffset = (this.time * 0.5) % 1;
        
        this.particles.forEach(particle => {
            // Calculate magnetic field at particle position
            const field = this.calculateMagneticField(particle.x, particle.y);
            const fieldMagnitude = Math.sqrt(field.Bx * field.Bx + field.By * field.By);
            
            // Enhanced Lorentz force with field strength scaling
            // F = q(v × B) - force is perpendicular to both velocity and magnetic field
            const forceX = particle.charge * (particle.vy * field.Bx - particle.vx * field.By) * 8.0;
            const forceY = particle.charge * (particle.vx * field.By - particle.vy * field.Bx) * 8.0;
            
            // Scale force based on field strength for more realistic behavior
            const forceScale = Math.min(1.0, fieldMagnitude / 2.0);
            const scaledForceX = forceX * forceScale;
            const scaledForceY = forceY * forceScale;
        
        // Update velocity with enhanced physics
            particle.vx += scaledForceX * dt;
            particle.vy += scaledForceY * dt;
            
            // Enhanced damping based on field strength
            const speed = Math.sqrt(particle.vx * particle.vx + particle.vy * particle.vy);
            const dampingFactor = fieldMagnitude > 0.5 ? 0.98 : 0.95; // Less damping in strong fields
            
            if (speed > 120) {
                particle.vx *= dampingFactor;
                particle.vy *= dampingFactor;
            }
        
        // Update position
            particle.x += particle.vx * dt;
            particle.y += particle.vy * dt;
            
            // Enhanced trail with charge-based properties
            particle.trail.push({ 
                x: particle.x, 
                y: particle.y,
                fieldStrength: fieldMagnitude // Store field strength for trail coloring
            });
            if (particle.trail.length > particle.maxTrailLength) {
                particle.trail.shift();
            }
            
            // Wrap around edges with momentum preservation
            if (particle.x < 0) {
                particle.x = this.ctx.canvas.width;
                particle.vx *= 0.8; // Slight energy loss at boundaries
            }
            if (particle.x > this.ctx.canvas.width) {
                particle.x = 0;
                particle.vx *= 0.8;
            }
            if (particle.y < 0) {
                particle.y = this.ctx.canvas.height;
                particle.vy *= 0.8;
            }
            if (particle.y > this.ctx.canvas.height) {
                particle.y = 0;
                particle.vy *= 0.8;
            }
        });
    }
    
    render() {
        // Enhanced modern background with gradient
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.ctx.canvas.height);
        gradient.addColorStop(0, '#1a1a2e');
        gradient.addColorStop(1, '#16213e');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
        
        // Draw enhanced field lines
        if (this.showFieldLines) {
            this.drawFieldLines();
        }
        
        // Draw enhanced magnets
        this.drawMagnets();
        
        // Draw enhanced particles
        this.drawParticles();
        

        
        // Draw canvas labels
        this.drawMagneticLabels();
    }
    
    drawFieldLines() {
        if (this.magnets.length === 0) return;
        
        // Draw combined field lines that show the actual magnetic field
        this.drawCombinedFieldLines();
        
        // Draw interaction field lines between magnets
        this.drawInteractionFieldLines();
    }
    
    drawCombinedFieldLines() {
        // Draw field lines that represent the combined field from all magnets
        const numLines = 24; // More field lines for better coverage
        const lineLength = 150;
        
        // Create a grid of starting points
        const gridSize = 8;
        const stepX = this.ctx.canvas.width / gridSize;
        const stepY = this.ctx.canvas.height / gridSize;
        
        for (let i = 0; i < gridSize; i++) {
            for (let j = 0; j < gridSize; j++) {
                const startX = i * stepX + stepX / 2;
                const startY = j * stepY + stepY / 2;
                
                // Draw field line from this point
                this.drawCombinedFieldLine(startX, startY, lineLength);
            }
        }
    }
    
    drawCombinedFieldLine(startX, startY, lineLength) {
        const numSteps = 20;
        const stepSize = lineLength / numSteps;
        
        let currentX = startX;
        let currentY = startY;
        
        // Progressive drawing
        const drawProgress = Math.min(1, this.animationOffset / 1.0);
        const maxSteps = Math.floor(numSteps * drawProgress);
        
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        this.ctx.lineWidth = 1;
        this.ctx.lineCap = 'round';
        
        this.ctx.beginPath();
        this.ctx.moveTo(currentX, currentY);
        
        for (let step = 0; step < maxSteps; step++) {
            // Calculate magnetic field at current position
            const field = this.calculateMagneticField(currentX, currentY);
            const fieldMagnitude = Math.sqrt(field.Bx * field.Bx + field.By * field.By);
            
            if (fieldMagnitude > 0.1) {
                // Normalize field direction
                const fieldDirX = field.Bx / fieldMagnitude;
                const fieldDirY = field.By / fieldMagnitude;
                
                // Move in field direction
                currentX += fieldDirX * stepSize;
                currentY += fieldDirY * stepSize;
                
                this.ctx.lineTo(currentX, currentY);
            } else {
                break; // Stop if field is too weak
            }
        }
        
        this.ctx.stroke();
        
        // Draw arrowhead at the end
        if (maxSteps > 5) {
            const field = this.calculateMagneticField(currentX, currentY);
            const fieldMagnitude = Math.sqrt(field.Bx * field.Bx + field.By * field.By);
            
            if (fieldMagnitude > 0.1) {
                const fieldDirX = field.Bx / fieldMagnitude;
                const fieldDirY = field.By / fieldMagnitude;
                const angle = Math.atan2(fieldDirY, fieldDirX);
                
                this.drawSimpleArrowhead(currentX, currentY, angle, 'combined');
            }
        }
    }
    
    drawMagnetFieldLines(northPole, southPole) {
        // Calculate magnet properties
        const magnetLength = Math.sqrt(
            Math.pow(southPole.x - northPole.x, 2) + 
            Math.pow(southPole.y - northPole.y, 2)
        );
        const magnetAngle = Math.atan2(southPole.y - northPole.y, southPole.x - northPole.x);
        
        // Draw field lines in a simple, clean pattern
        this.drawSimpleFieldLines(northPole, southPole, magnetLength, magnetAngle);
    }
    
    drawSimpleFieldLines(northPole, southPole, magnetLength, magnetAngle) {
        // Number of field lines
        const numLines = 12;
        
        // Draw field lines radiating from North pole
        for (let i = 0; i < numLines; i++) {
            const angle = (i / numLines) * Math.PI * 2;
            this.drawRadiatingFieldLine(northPole, angle, 'north');
        }
        
        // Draw field lines converging to South pole
        for (let i = 0; i < numLines; i++) {
            const angle = (i / numLines) * Math.PI * 2;
            this.drawRadiatingFieldLine(southPole, angle, 'south');
        }
    }
    
    drawRadiatingFieldLine(pole, angle, poleType) {
        let lineLength = 120;
        
        let startX, startY, endX, endY;
        
        if (poleType === 'north') {
            // North pole: lines radiate outward from pole (slightly longer for better visibility)
            lineLength = 140;
            startX = pole.x;
            startY = pole.y;
            endX = startX + Math.cos(angle) * lineLength;
            endY = startY + Math.sin(angle) * lineLength;
        } else {
            // South pole: lines converge inward to pole
            endX = pole.x;
            endY = pole.y;
            startX = endX + Math.cos(angle) * lineLength;
            startY = endY + Math.sin(angle) * lineLength;
        }
        
        // Progressive drawing
        const drawProgress = Math.min(1, this.animationOffset / 1.0);
        const currentEndX = startX + (endX - startX) * drawProgress;
        const currentEndY = startY + (endY - startY) * drawProgress;
        
        // Line styling based on pole type
        const lineColor = poleType === 'north' ? 'rgba(255, 107, 107, 0.8)' : 'rgba(102, 126, 234, 0.7)';
        const lineWidth = poleType === 'north' ? 2.5 : 2;
        
        // Draw the field line
        this.ctx.strokeStyle = lineColor;
        this.ctx.lineWidth = lineWidth;
        this.ctx.lineCap = 'round';
        this.ctx.beginPath();
        this.ctx.moveTo(startX, startY);
        this.ctx.lineTo(currentEndX, currentEndY);
        this.ctx.stroke();
        
        // Draw arrowhead for direction
        if (drawProgress >= 0.7) {
            this.drawSimpleArrowhead(currentEndX, currentEndY, angle, poleType);
        }
    }
    
    drawSimpleArrowhead(x, y, angle, poleType) {
        const arrowLength = 20; // Increased from 10 to 20
        const arrowAngle = Math.PI / 6;
        
        // For North pole: arrows point outward (away from pole)
        // For South pole: arrows point inward (towards pole)
        const direction = poleType === 'north' ? angle : angle;
        
        // Calculate arrow points - attach to the line end
        const tipX = x;
        const tipY = y;
        
        const leftX = x - Math.cos(direction + arrowAngle) * arrowLength * 0.6;
        const leftY = y - Math.sin(direction + arrowAngle) * arrowLength * 0.6;
        
        const rightX = x - Math.cos(direction - arrowAngle) * arrowLength * 0.6;
        const rightY = y - Math.sin(direction - arrowAngle) * arrowLength * 0.6;
        
        // Arrow color with enhanced visibility
        let arrowColor;
        if (poleType === 'north') {
            arrowColor = 'rgba(255, 107, 107, 1.0)';
        } else if (poleType === 'south') {
            arrowColor = 'rgba(102, 126, 234, 1.0)';
        } else {
            // Combined field - use white color
            arrowColor = 'rgba(255, 255, 255, 0.8)';
        }
        
        // Add shadow for better visibility
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        this.ctx.shadowBlur = 2;
        
        this.ctx.fillStyle = arrowColor;
        this.ctx.beginPath();
        this.ctx.moveTo(tipX, tipY);
        this.ctx.lineTo(leftX, leftY);
        this.ctx.lineTo(rightX, rightY);
        this.ctx.closePath();
        this.ctx.fill();
        
        // Reset shadow
        this.ctx.shadowBlur = 0;
    }
    

    
    drawInteractionFieldLines() {
        // Get all North and South poles
        const northPoles = this.magnets.filter(m => m.pole === 'north');
        const southPoles = this.magnets.filter(m => m.pole === 'south');
        
        // Draw field lines between different magnets
        northPoles.forEach(northPole => {
            southPoles.forEach(southPole => {
                // Only draw if they're from different magnets
                if (northPole.magnetId !== southPole.magnetId) {
                    const distance = Math.sqrt(
                        Math.pow(northPole.x - southPole.x, 2) + 
                        Math.pow(northPole.y - southPole.y, 2)
                    );
                    
                    // Only draw if magnets are reasonably close
                    if (distance < 200 && distance > 60) {
                        this.drawInteractionFieldLine(northPole, southPole);
                    }
                }
            });
        });
    }
    
    drawInteractionFieldLine(northPole, southPole) {
        const animationOffset = (this.time * 0.3) % 1; // Slower animation for interaction lines
        
        // Calculate the angle between the poles
        const angle = Math.atan2(southPole.y - northPole.y, southPole.x - northPole.x);
        
        // Draw a simple straight line between poles for interactions
        const startX = northPole.x;
        const startY = northPole.y;
        const endX = southPole.x;
        const endY = southPole.y;
        
        // Animate the field line drawing
        const animatedLength = 1 * animationOffset;
        
        // Calculate the actual end point based on animation
        const actualEndX = startX + (endX - startX) * animatedLength;
        const actualEndY = startY + (endY - startY) * animatedLength;
        
        // Draw the interaction line
        this.ctx.shadowColor = 'rgba(255, 255, 255, 0.4)';
        this.ctx.shadowBlur = 3;
        this.ctx.strokeStyle = `rgba(255, 255, 255, 0.6)`;
        this.ctx.lineWidth = 3;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        
        this.ctx.beginPath();
        this.ctx.moveTo(startX, startY);
        this.ctx.lineTo(actualEndX, actualEndY);
        this.ctx.stroke();
        
        // Reset shadow
        this.ctx.shadowBlur = 0;
        
        // Draw arrowhead at the end if animation is far enough
        if (animatedLength > 0.1) {
            const arrowAngle = Math.atan2(actualEndY - startY, actualEndX - startX);
            const arrowLength = 20; // Increased from 10 to 20
            
            this.ctx.beginPath();
            this.ctx.fillStyle = 'rgba(255, 255, 255, 1.0)'; // Increased opacity
            this.ctx.moveTo(actualEndX, actualEndY);
            this.ctx.lineTo(actualEndX - arrowLength * Math.cos(arrowAngle - Math.PI / 6), 
                           actualEndY - arrowLength * Math.sin(arrowAngle - Math.PI / 6));
            this.ctx.lineTo(actualEndX - arrowLength * Math.cos(arrowAngle + Math.PI / 6), 
                           actualEndY - arrowLength * Math.sin(arrowAngle + Math.PI / 6));
            this.ctx.closePath();
            this.ctx.fill();
        }
    }
    
    drawMagnets() {
        // Group magnets by magnetId to draw complete magnets
        const magnetGroups = {};
        this.magnets.forEach(magnet => {
            if (!magnetGroups[magnet.magnetId]) {
                magnetGroups[magnet.magnetId] = [];
            }
            magnetGroups[magnet.magnetId].push(magnet);
        });
        
        // Draw each complete magnet
        Object.values(magnetGroups).forEach(magnetGroup => {
            if (magnetGroup.length === 2) {
                const northPole = magnetGroup.find(m => m.pole === 'north');
                const southPole = magnetGroup.find(m => m.pole === 'south');
                
                if (northPole && southPole) {
                    // Draw magnet body with enhanced design
                    this.drawMagnetBody(northPole, southPole);
                }
            }
        });
        
        // Individual poles are now drawn as part of the bar magnet
    }
    
    drawMagnetBody(northPole, southPole) {
        // Calculate magnet properties
        const magnetLength = Math.sqrt(
            Math.pow(southPole.x - northPole.x, 2) + 
            Math.pow(southPole.y - northPole.y, 2)
        );
        const magnetAngle = Math.atan2(southPole.y - northPole.y, southPole.x - northPole.x);
        const magnetWidth = 20;
        
        // Create bar magnet shape
        const halfWidth = magnetWidth / 2;
        const corners = [
            // Top-left
            { x: northPole.x - halfWidth * Math.cos(magnetAngle + Math.PI/2), 
              y: northPole.y - halfWidth * Math.sin(magnetAngle + Math.PI/2) },
            // Top-right
            { x: northPole.x + halfWidth * Math.cos(magnetAngle + Math.PI/2), 
              y: northPole.y + halfWidth * Math.sin(magnetAngle + Math.PI/2) },
            // Bottom-right
            { x: southPole.x + halfWidth * Math.cos(magnetAngle + Math.PI/2), 
              y: southPole.y + halfWidth * Math.sin(magnetAngle + Math.PI/2) },
            // Bottom-left
            { x: southPole.x - halfWidth * Math.cos(magnetAngle + Math.PI/2), 
              y: southPole.y - halfWidth * Math.sin(magnetAngle + Math.PI/2) }
        ];
        
        // Draw magnet shadow
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.beginPath();
        this.ctx.moveTo(corners[0].x + 3, corners[0].y + 3);
        this.ctx.lineTo(corners[1].x + 3, corners[1].y + 3);
        this.ctx.lineTo(corners[2].x + 3, corners[2].y + 3);
        this.ctx.lineTo(corners[3].x + 3, corners[3].y + 3);
        this.ctx.closePath();
        this.ctx.fill();
        
        // Create gradient for bar magnet
        const magnetGradient = this.ctx.createLinearGradient(
            northPole.x, northPole.y, southPole.x, southPole.y
        );
        magnetGradient.addColorStop(0, '#ff6b6b');      // North pole (red)
        magnetGradient.addColorStop(0.3, '#ff8a65');    // Red-orange
        magnetGradient.addColorStop(0.5, '#8b5cf6');    // Purple (middle)
        magnetGradient.addColorStop(0.7, '#667eea');    // Blue
        magnetGradient.addColorStop(1, '#5352ed');      // South pole (blue)
        
        // Draw main magnet body
        this.ctx.fillStyle = magnetGradient;
        this.ctx.beginPath();
        this.ctx.moveTo(corners[0].x, corners[0].y);
        this.ctx.lineTo(corners[1].x, corners[1].y);
        this.ctx.lineTo(corners[2].x, corners[2].y);
        this.ctx.lineTo(corners[3].x, corners[3].y);
        this.ctx.closePath();
        this.ctx.fill();
        
        // Draw magnet border
        this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(corners[0].x, corners[0].y);
        this.ctx.lineTo(corners[1].x, corners[1].y);
        this.ctx.lineTo(corners[2].x, corners[2].y);
        this.ctx.lineTo(corners[3].x, corners[3].y);
        this.ctx.closePath();
        this.ctx.stroke();
        
        // Draw highlight
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.moveTo(corners[0].x, corners[0].y);
        this.ctx.lineTo(corners[1].x, corners[1].y);
        this.ctx.stroke();
        
        // Draw pole indicators
        this.drawPoleIndicator(northPole, 'N', '#ff3838');
        this.drawPoleIndicator(southPole, 'S', '#5352ed');
    }
    
    drawPoleIndicator(pole, label, color) {
        const indicatorRadius = 8;
        
        // Pole indicator background
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.arc(pole.x, pole.y, indicatorRadius, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Pole indicator border
        this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.arc(pole.x, pole.y, indicatorRadius, 0, Math.PI * 2);
        this.ctx.stroke();
        
        // Pole label
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 12px Inter, Arial, sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        this.ctx.shadowBlur = 1;
        this.ctx.fillText(label, pole.x, pole.y);
        this.ctx.shadowBlur = 0;
    }
    
    drawMagnetPole(magnet) {
        // Enhanced pole design with multiple layers
        const poleRadius = 18;
        const innerRadius = 12;
        
        // Outer glow
        this.ctx.shadowColor = magnet.pole === 'north' ? 'rgba(255, 107, 107, 0.6)' : 'rgba(102, 126, 234, 0.6)';
        this.ctx.shadowBlur = 12;
        this.ctx.beginPath();
        this.ctx.fillStyle = magnet.pole === 'north' ? 'rgba(255, 107, 107, 0.4)' : 'rgba(102, 126, 234, 0.4)';
        this.ctx.arc(magnet.x, magnet.y, poleRadius, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Reset shadow
        this.ctx.shadowBlur = 0;
        
        // Main pole gradient
        const poleGradient = this.ctx.createRadialGradient(
            magnet.x - 6, magnet.y - 6, 0,
            magnet.x, magnet.y, innerRadius
        );
        
        if (magnet.pole === 'north') {
            poleGradient.addColorStop(0, '#ff6b6b');
            poleGradient.addColorStop(0.6, '#ff4757');
            poleGradient.addColorStop(1, '#ff3838');
        } else {
            poleGradient.addColorStop(0, '#667eea');
            poleGradient.addColorStop(0.6, '#5f6fd8');
            poleGradient.addColorStop(1, '#5352ed');
        }
        
        // Main pole circle
        this.ctx.beginPath();
        this.ctx.fillStyle = poleGradient;
        this.ctx.arc(magnet.x, magnet.y, innerRadius, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Pole shadow
        this.ctx.beginPath();
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.arc(magnet.x + 2, magnet.y + 2, innerRadius, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Pole highlight
        this.ctx.beginPath();
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.arc(magnet.x - 3, magnet.y - 3, 4, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Enhanced pole label
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 18px Inter, Arial, sans-serif';
        this.ctx.textRenderingOptimization = 'optimizeLegibility';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        this.ctx.shadowBlur = 2;
        this.ctx.fillText(magnet.pole === 'north' ? 'N' : 'S', magnet.x, magnet.y);
        this.ctx.shadowBlur = 0;
    }
    
    drawParticles() {
        this.particles.forEach(particle => {
            // Calculate current field strength for enhanced visualization
            const field = this.calculateMagneticField(particle.x, particle.y);
            const fieldMagnitude = Math.sqrt(field.Bx * field.Bx + field.By * field.By);
            
            // Enhanced particle trail with field strength-based coloring
            if (particle.trail.length > 1) {
                this.ctx.beginPath();
                const trailGradient = this.ctx.createLinearGradient(
                    particle.trail[0].x, particle.trail[0].y,
                    particle.x, particle.y
                );
                
                // Trail color based on charge and field strength
                const trailOpacity = Math.min(0.8, 0.3 + fieldMagnitude * 0.5);
                if (particle.charge > 0) {
                    trailGradient.addColorStop(0, `rgba(255, 100, 100, ${trailOpacity * 0.3})`);
                    trailGradient.addColorStop(1, `rgba(255, 100, 100, ${trailOpacity})`);
                } else {
                    trailGradient.addColorStop(0, `rgba(100, 100, 255, ${trailOpacity * 0.3})`);
                    trailGradient.addColorStop(1, `rgba(100, 100, 255, ${trailOpacity})`);
                }
                
                this.ctx.strokeStyle = trailGradient;
                this.ctx.lineWidth = 2 + fieldMagnitude * 2; // Thicker trail in strong fields
                this.ctx.lineCap = 'round';
                this.ctx.moveTo(particle.trail[0].x, particle.trail[0].y);
                particle.trail.forEach(point => {
                    this.ctx.lineTo(point.x, point.y);
                });
                this.ctx.stroke();
            }
            
            // Enhanced particle with field strength-based effects
            const particleSize = 5 + fieldMagnitude * 3; // Larger particles in strong fields
            const particleGradient = this.ctx.createRadialGradient(
                particle.x - particleSize/2, particle.y - particleSize/2, 0,
                particle.x, particle.y, particleSize
            );
            
            if (particle.charge > 0) {
                particleGradient.addColorStop(0, '#ff8a65');
                particleGradient.addColorStop(0.7, '#ff6b6b');
                particleGradient.addColorStop(1, '#ff4757');
            } else {
                particleGradient.addColorStop(0, '#8b9dc3');
                particleGradient.addColorStop(0.7, '#667eea');
                particleGradient.addColorStop(1, '#5f6fd8');
            }
            
            // Enhanced glow effect based on field strength
            const glowIntensity = Math.min(12, 6 + fieldMagnitude * 10);
            this.ctx.shadowColor = particle.charge > 0 ? 'rgba(255, 107, 107, 0.8)' : 'rgba(102, 126, 234, 0.8)';
            this.ctx.shadowBlur = glowIntensity;
            this.ctx.beginPath();
            this.ctx.fillStyle = particleGradient;
            this.ctx.arc(particle.x, particle.y, particleSize, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Reset shadow
            this.ctx.shadowBlur = 0;
            
            // Enhanced shadow
            this.ctx.beginPath();
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            this.ctx.arc(particle.x + 1, particle.y + 1, particleSize, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Enhanced charge symbol with field strength-based styling
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = `bold ${12 + fieldMagnitude * 4}px Inter, Arial, sans-serif`;
            this.ctx.textRenderingOptimization = 'optimizeLegibility';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(particle.charge > 0 ? '+' : '−', particle.x, particle.y);
            
            // Add velocity indicator in strong fields
            if (fieldMagnitude > 1.0) {
                const speed = Math.sqrt(particle.vx * particle.vx + particle.vy * particle.vy);
                const velocityAngle = Math.atan2(particle.vy, particle.vx);
                
                // Draw velocity arrow
                this.ctx.strokeStyle = particle.charge > 0 ? '#ff6b6b' : '#667eea';
                this.ctx.lineWidth = 1;
                this.ctx.beginPath();
                this.ctx.moveTo(particle.x, particle.y);
                this.ctx.lineTo(
                    particle.x + Math.cos(velocityAngle) * speed * 0.1,
                    particle.y + Math.sin(velocityAngle) * speed * 0.1
                );
                this.ctx.stroke();
            }
        });
    }
    

    
    drawInfo() {
        // Enhanced modern info panel with gradient background
        const panelWidth = 200;
        const panelHeight = 120;
        const panelX = this.ctx.canvas.width - panelWidth - 20;
        const panelY = 20;
        
        // Panel background with gradient
        const panelGradient = this.ctx.createLinearGradient(panelX, panelY, panelX, panelY + panelHeight);
        panelGradient.addColorStop(0, 'rgba(24, 28, 43, 0.95)');
        panelGradient.addColorStop(1, 'rgba(35, 41, 70, 0.95)');
        
        this.ctx.fillStyle = panelGradient;
        this.ctx.fillRect(panelX, panelY, panelWidth, panelHeight);
        
        // Panel border with glow
        this.ctx.strokeStyle = 'rgba(255, 107, 107, 0.5)';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(panelX, panelY, panelWidth, panelHeight);
        
        // Panel title
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 18px Inter';
        this.ctx.textRenderingOptimization = 'optimizeLegibility';
        this.ctx.textAlign = 'left';
        this.ctx.fillText('Magnetic Field Analytics', panelX + 15, panelY + 25);
        
        // Analytics data with modern styling
        this.ctx.fillStyle = '#e9ecef';
        this.ctx.font = '14px Inter';
        this.ctx.textRenderingOptimization = 'optimizeLegibility';
        this.ctx.fillText(`Magnets: ${this.magnets.length}`, panelX + 15, panelY + 45);
        this.ctx.fillText(`Particles: ${this.particles.length}`, panelX + 15, panelY + 65);
        this.ctx.fillText(`Field Strength: ${this.fieldStrength.toFixed(1)}`, panelX + 15, panelY + 85);
        
        // Enhanced explanation banner at bottom
        const bannerWidth = 380;
        const bannerHeight = 45;
        const bannerX = 10;
        const bannerY = this.ctx.canvas.height - 60;
        
        // Banner background with gradient
        const bannerGradient = this.ctx.createLinearGradient(bannerX, bannerY, bannerX, bannerY + bannerHeight);
        bannerGradient.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
        bannerGradient.addColorStop(1, 'rgba(240, 240, 240, 0.95)');
        
        this.ctx.fillStyle = bannerGradient;
        this.ctx.fillRect(bannerX, bannerY, bannerWidth, bannerHeight);
        
        // Banner border
        this.ctx.strokeStyle = 'rgba(255, 107, 107, 0.6)';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(bannerX, bannerY, bannerWidth, bannerHeight);
        
        // Banner text
        this.ctx.fillStyle = '#1a1a2e';
        this.ctx.font = 'bold 13px Inter, Arial, sans-serif';
        this.ctx.textRenderingOptimization = 'optimizeLegibility';
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('Red particles = Positive charge, Blue particles = Negative charge', bannerX + 12, bannerY + bannerHeight/2 - 8);
        this.ctx.fillText('Click to add magnets, particles spiral around magnetic field lines', bannerX + 12, bannerY + bannerHeight/2 + 8);
    }
    
    getStats() {
        return {
            magnetCount: this.magnets.length,
            particleCount: this.particles.length,
            fieldStrength: this.fieldStrength.toFixed(1),
            time: this.time.toFixed(1)
        };
    }
    
    drawMagneticLabels() {
        // Draw custom labels with better visibility
        this.ctx.save();
        
        // Set up text styling
        this.ctx.font = 'bold 18px Inter, Arial, sans-serif';
        this.ctx.textRenderingOptimization = 'optimizeLegibility';
        this.ctx.textAlign = 'center';
        
        // Draw animation title with better contrast
        this.ctx.fillStyle = '#ffffff';
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
        this.ctx.shadowBlur = 3;
        this.ctx.fillText('Magnetic Fields', this.ctx.canvas.width / 2, 30);
        
        // Draw mathematical formulas
        this.ctx.font = '14px Inter, Arial, sans-serif';
        this.ctx.fillStyle = '#ffffff';
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
        this.ctx.shadowBlur = 2;
        this.ctx.fillText('F = q(v × B)  |  F = qvB sin θ  |  B = μ₀I/2πr', this.ctx.canvas.width / 2, 50);
        
        // Reset shadow
        this.ctx.shadowBlur = 0;
        this.ctx.restore();
        
        // Draw interaction and magnet explanation banner
        this.drawMagneticBanner();
    }
    
    drawMagneticBanner() {
        // Create banner background with modern dark theme
        const bannerWidth = 450;
        const bannerHeight = 60;
        const bannerX = 15;
        const bannerY = this.ctx.canvas.height - 75;
        
        // Banner background with dark gradient
        const bannerGradient = this.ctx.createLinearGradient(bannerX, bannerY, bannerX, bannerY + bannerHeight);
        bannerGradient.addColorStop(0, 'rgba(26, 26, 46, 0.95)');
        bannerGradient.addColorStop(1, 'rgba(22, 33, 62, 0.95)');
        
        this.ctx.fillStyle = bannerGradient;
        this.ctx.fillRect(bannerX, bannerY, bannerWidth, bannerHeight);
        
        // Banner border with subtle glow
        this.ctx.shadowColor = 'rgba(255, 107, 107, 0.3)';
        this.ctx.shadowBlur = 2;
        this.ctx.strokeStyle = 'rgba(255, 107, 107, 0.6)';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(bannerX, bannerY, bannerWidth, bannerHeight);
        this.ctx.shadowBlur = 0;
        
        // Banner text with better contrast
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 14px Inter, Arial, sans-serif';
        this.ctx.textRenderingOptimization = 'optimizeLegibility';
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('Click to add complete magnets (N-S pairs)', bannerX + 15, bannerY + bannerHeight/2 - 10);
        
        this.ctx.font = '12px Inter, Arial, sans-serif';
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        this.ctx.fillText('Red particles = Positive charge, Blue particles = Negative charge', bannerX + 15, bannerY + bannerHeight/2 + 10);
        
        // Add magnet icon with better styling
        const iconX = bannerX + 400;
        const iconY = bannerY + bannerHeight/2;
        
        // Magnet icon background
        this.ctx.beginPath();
        this.ctx.fillStyle = 'rgba(255, 107, 107, 0.2)';
        this.ctx.arc(iconX, iconY, 8, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Magnet icon
        this.ctx.beginPath();
        this.ctx.fillStyle = '#ff6b6b';
        this.ctx.arc(iconX, iconY, 4, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Add N label to magnet icon
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 10px Inter, Arial, sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('N', iconX, iconY);
    }
}

export class DiodeTransistor extends BaseAnimation {
    constructor(ctx) {
        super(ctx);
        this.componentType = 'diode'; // 'diode', 'npn', 'pnp'
        this.biasType = 'forward'; // 'forward', 'reverse', 'off'
        this.inputVoltage = 5; // Volts
        this.baseVoltage = 0.7; // Volts for transistor
        this.current = 0; // mA
        this.power = 0; // mW
        this.temperature = 25; // Celsius
        this.showElectrons = true;
        this.showCurrent = true;
        this.showVoltage = true;
        this.animationSpeed = 1.0;
        this.isActive = false;
        
        // Scientific accuracy notes:
        // - Diode: P-N junction with proper forward/reverse bias behavior
        // - NPN: N-P-N with electron flow from emitter to collector
        // - PNP: P-N-P with hole flow from emitter to collector
        // - Current calculations use realistic transistor parameters (beta values)
        // - Voltage drops follow standard semiconductor physics
        
        // Component positions
        this.componentX = this.ctx.canvas.width / 2;
        this.componentY = this.ctx.canvas.height / 2;
        this.batteryX = this.componentX - 250;
        this.batteryY = this.componentY;
        this.loadX = this.componentX + 250;
        this.loadY = this.componentY;
        
        // Enhanced particle systems
        this.electrons = [];
        this.holes = [];
        this.sparks = [];
        this.energyWaves = [];
        this.initializeParticles();
        
        // Visual effects
        this.glowIntensity = 0;
        this.pulsePhase = 0;
        this.energyParticles = [];
    }
    
    initializeParticles() {
        this.electrons = [];
        this.holes = [];
        this.sparks = [];
        this.energyWaves = [];
        this.energyParticles = [];
        
        // Create electron particles for N-type material (right side of diode)
        for (let i = 0; i < 30; i++) {
            this.electrons.push({
                x: this.componentX + 50 + Math.random() * 100, // N-region (cathode)
                y: this.componentY - 40 + Math.random() * 80,
                vx: 0,
                vy: 0,
                size: 3.5 + Math.random() * 1.2, // Slightly larger electrons
                color: '#00AAFF',
                glow: 0,
                trail: [],
                active: false
            });
        }
        
        // Create hole particles for P-type material (left side of diode)
        for (let i = 0; i < 30; i++) {
            this.holes.push({
                x: this.componentX - 150 + Math.random() * 100, // P-region (anode)
                y: this.componentY - 40 + Math.random() * 80,
                vx: 0,
                vy: 0,
                size: 3.5 + Math.random() * 1.2, // Slightly larger holes
                color: '#FF4444',
                glow: 0,
                trail: [],
                active: false
            });
        }
        
        // Create energy particles
        for (let i = 0; i < 15; i++) {
            this.energyParticles.push({
                x: this.componentX - 100 + Math.random() * 200,
                y: this.componentY - 60 + Math.random() * 120,
                vx: (Math.random() - 0.5) * 2,
                vy: (Math.random() - 0.5) * 2,
                size: 1.8 + Math.random() * 0.7,
                color: '#FFFF00',
                life: 1.0,
                decay: 0.02
            });
        }
    }
    
    setComponentType(type) {
        this.componentType = type;
        this.initializeParticles();
        this.calculateCurrent();
        
        // Force immediate visual update
        this.time = 0; // Reset animation time for immediate effect
    }
    
    setBiasType(bias) {
        this.biasType = bias;
        this.calculateCurrent();
        
        // Force immediate visual update
        this.time = 0; // Reset animation time for immediate effect
    }
    
    setInputVoltage(voltage) {
        this.inputVoltage = voltage;
        this.calculateCurrent();
        
        // Force immediate visual update
        this.time = 0; // Reset animation time for immediate effect
    }
    
    setBaseVoltage(voltage) {
        this.baseVoltage = voltage;
        this.calculateCurrent();
        
        // Force immediate visual update
        this.time = 0; // Reset animation time for immediate effect
    }
    
    setShowElectrons(show) {
        this.showElectrons = show;
    }
    
    setShowCurrent(show) {
        this.showCurrent = show;
    }
    
    setShowVoltage(show) {
        this.showVoltage = show;
    }
    
    setAnimationSpeed(speed) {
        this.animationSpeed = speed;
    }
    
    calculateCurrent() {
        if (this.componentType === 'diode') {
            if (this.biasType === 'forward' && this.inputVoltage > 0.7) {
                // Diode forward current: exponential relationship with voltage
                const voltageDrop = this.inputVoltage - 0.7;
                this.current = Math.exp(voltageDrop * 2) * 5; // Exponential current increase
                this.power = this.current * 0.7;
                this.isActive = true;
                this.temperature = 25 + this.current * 0.5;
            } else if (this.biasType === 'reverse') {
                // Diode reverse leakage current (very small)
                this.current = 0.001; // 1μA leakage
                this.power = this.current * this.inputVoltage;
                this.isActive = false;
                this.temperature = 25;
            } else {
                this.current = 0;
                this.power = 0;
                this.isActive = false;
                this.temperature = 25;
            }
        } else if (this.componentType === 'npn') {
            if (this.biasType === 'forward' && this.baseVoltage > 0.7) {
                // NPN transistor: base current controls collector current
                const baseCurrent = (this.baseVoltage - 0.7) * 10; // Base current
                const beta = 100; // Current gain (typical value)
                this.current = baseCurrent * beta; // Collector current
                this.power = this.current * this.inputVoltage;
                this.isActive = true;
                this.temperature = 25 + this.current * 0.3;
            } else {
                this.current = 0;
                this.power = 0;
                this.isActive = false;
                this.temperature = 25;
            }
        } else if (this.componentType === 'pnp') {
            if (this.biasType === 'forward' && this.baseVoltage > 0.7) {
                // PNP transistor: base current controls collector current (negative voltages)
                const baseCurrent = (this.baseVoltage - 0.7) * 8; // Base current
                const beta = 80; // Current gain (slightly lower for PNP)
                this.current = baseCurrent * beta; // Collector current
                this.power = this.current * this.inputVoltage;
                this.isActive = true;
                this.temperature = 25 + this.current * 0.4;
            } else {
                this.current = 0;
                this.power = 0;
                this.isActive = false;
                this.temperature = 25;
            }
        }
    }
    
    reset() {
        this.time = 0;
        this.current = 0;
        this.power = 0;
        this.isActive = false;
        this.glowIntensity = 0;
        this.pulsePhase = 0;
        this.initializeParticles();
    }
    
    update(deltaTime) {
        this.time += deltaTime * this.animationSpeed;
        this.calculateCurrent();
        
        // Update glow and pulse effects
        this.glowIntensity = this.isActive ? Math.sin(this.time * 0.005) * 0.3 + 0.7 : 0;
        this.pulsePhase = this.time * 0.01;
        
        // Update particle movement based on component type
        if (this.isActive && this.showElectrons) {
            if (this.componentType === 'diode') {
                // Diode: show both electrons and holes
                this.updateDiodeParticles();
            } else if (this.componentType === 'npn') {
                // NPN: emphasize electron flow from emitter to collector
                this.updateNPNParticles();
            } else if (this.componentType === 'pnp') {
                // PNP: emphasize hole flow from emitter to collector
                this.updatePNPParticles();
            }
        }
        
        // Update energy particles
        this.energyParticles.forEach(particle => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.life -= particle.decay;
            
            // Bounce off boundaries
            if (particle.x < 0 || particle.x > this.ctx.canvas.width) particle.vx *= -1;
            if (particle.y < 0 || particle.y > this.ctx.canvas.height) particle.vy *= -1;
            
            // Reset when life is over
            if (particle.life <= 0) {
                particle.x = this.componentX - 100 + Math.random() * 200;
                particle.y = this.componentY - 60 + Math.random() * 120;
                particle.life = 1.0;
            }
        });
        
        // Add sparks when current is high
        if (this.isActive && this.current > 10 && Math.random() < 0.1) {
            this.sparks.push({
                x: this.componentX + Math.random() * 100 - 50,
                y: this.componentY + Math.random() * 60 - 30,
                vx: (Math.random() - 0.5) * 10,
                vy: (Math.random() - 0.5) * 10,
                life: 1.0,
                color: '#FFFF00'
            });
        }
        
        // Update sparks
        this.sparks.forEach((spark, index) => {
            spark.x += spark.vx;
            spark.y += spark.vy;
            spark.life -= 0.05;
            if (spark.life <= 0) {
                this.sparks.splice(index, 1);
            }
        });
    }
    
    render() {
        this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
        
        this.drawBackground();
        this.drawEnergyField();
        this.drawBattery();
        this.drawComponent();
        this.drawLoad();
        this.drawParticles();
        this.drawSparks();
        this.drawCurrentFlow();
        this.drawInfo();
        this.drawInstructions();
    }
    
    drawBackground() {
        // Create dynamic dark sci-fi background with animated gradient
        const time = this.time * 0.001;
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.ctx.canvas.height);
        gradient.addColorStop(0, `hsl(${240 + Math.sin(time) * 10}, 70%, 15%)`);
        gradient.addColorStop(1, `hsl(${250 + Math.cos(time) * 10}, 80%, 10%)`);
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
        
        // Draw animated circuit board pattern
        this.ctx.strokeStyle = `rgba(0, 255, 255, ${0.1 + Math.sin(time * 2) * 0.05})`;
        this.ctx.lineWidth = 1;
        
        // Horizontal lines with pulse effect
        for (let y = 0; y < this.ctx.canvas.height; y += 40) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y + Math.sin(time + y * 0.01) * 2);
            this.ctx.lineTo(this.ctx.canvas.width, y + Math.sin(time + y * 0.01) * 2);
            this.ctx.stroke();
        }
        
        // Vertical lines with pulse effect
        for (let x = 0; x < this.ctx.canvas.width; x += 40) {
            this.ctx.beginPath();
            this.ctx.moveTo(x + Math.cos(time + x * 0.01) * 2, 0);
            this.ctx.lineTo(x + Math.cos(time + x * 0.01) * 2, this.ctx.canvas.height);
            this.ctx.stroke();
        }
        
        // Add floating energy particles in background
        for (let i = 0; i < 20; i++) {
            const x = (i * 37) % this.ctx.canvas.width;
            const y = (i * 23) % this.ctx.canvas.height;
            const alpha = 0.1 + Math.sin(time * 3 + i) * 0.05;
            this.ctx.fillStyle = `rgba(0, 255, 255, ${alpha})`;
            this.ctx.beginPath();
            this.ctx.arc(x, y, 1, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }
    
    drawEnergyField() {
        if (this.isActive) {
            const time = this.time * 0.001;
            
            // Draw multiple energy field layers with different effects
            for (let i = 0; i < 3; i++) {
                const radius = 120 + i * 30;
                const alpha = (this.glowIntensity * 0.2) / (i + 1);
                const pulse = Math.sin(time * 5 + i) * 0.1;
                
                const gradient = this.ctx.createRadialGradient(
                    this.componentX, this.componentY, 0,
                    this.componentX, this.componentY, radius
                );
                gradient.addColorStop(0, `rgba(0, 255, 255, ${alpha + pulse})`);
                gradient.addColorStop(0.7, `rgba(0, 255, 255, ${alpha * 0.3})`);
                gradient.addColorStop(1, 'rgba(0, 255, 255, 0)');
                
                this.ctx.fillStyle = gradient;
                this.ctx.fillRect(this.componentX - radius, this.componentY - radius, radius * 2, radius * 2);
            }
            
            // Draw energy waves radiating from component
            for (let i = 0; i < 5; i++) {
                const waveRadius = 50 + i * 20 + Math.sin(time * 3 + i) * 10;
                const waveAlpha = (0.3 - i * 0.05) * this.glowIntensity;
                
                this.ctx.strokeStyle = `rgba(0, 255, 255, ${waveAlpha})`;
                this.ctx.lineWidth = 2;
                this.ctx.beginPath();
                this.ctx.arc(this.componentX, this.componentY, waveRadius, 0, Math.PI * 2);
                this.ctx.stroke();
            }
        }
    }
    
    drawBattery() {
        const time = this.time * 0.001;
        
        // Draw battery with enhanced glow effect when active
        const glowColor = this.isActive ? `rgba(76, 175, 80, ${0.8 + this.glowIntensity * 0.2})` : '#4CAF50';
        this.ctx.fillStyle = glowColor;
        this.ctx.fillRect(this.batteryX - 25, this.batteryY - 35, 50, 70);
        
        // Add metallic shine with animation
        this.ctx.fillStyle = `rgba(255, 255, 255, ${0.3 + Math.sin(time * 2) * 0.1})`;
        this.ctx.fillRect(this.batteryX - 20, this.batteryY - 30, 40, 5);
        
        // Draw battery terminals with enhanced metallic effect
        this.ctx.fillStyle = '#888';
        this.ctx.fillRect(this.batteryX - 8, this.batteryY - 45, 16, 12);
        this.ctx.fillRect(this.batteryX - 8, this.batteryY + 33, 16, 12);
        
        // Add terminal shine
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        this.ctx.fillRect(this.batteryX - 6, this.batteryY - 43, 12, 3);
        this.ctx.fillRect(this.batteryX - 6, this.batteryY + 35, 12, 3);
        
        // Draw voltage label with pulsing glow
        const labelGlow = this.isActive ? Math.sin(time * 3) * 0.3 + 0.7 : 0.7;
        this.ctx.fillStyle = this.isActive ? `rgba(255, 255, 0, ${labelGlow})` : 'white';
        this.ctx.font = 'bold 16px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(`${this.inputVoltage}V`, this.batteryX, this.batteryY + 60);
        
        // Draw polarity with enhanced colors and glow
        this.ctx.fillStyle = this.isActive ? `rgba(255, 102, 102, ${0.8 + this.glowIntensity})` : '#FF6666';
        this.ctx.font = 'bold 20px Arial';
        this.ctx.fillText('+', this.batteryX - 20, this.batteryY - 5);
        
        this.ctx.fillStyle = this.isActive ? `rgba(102, 102, 255, ${0.8 + this.glowIntensity})` : '#6666FF';
        this.ctx.fillText('-', this.batteryX + 20, this.batteryY + 15);
        
        // Add energy indicator when active
        if (this.isActive) {
            this.ctx.fillStyle = `rgba(0, 255, 0, ${this.glowIntensity})`;
            this.ctx.beginPath();
            this.ctx.arc(this.batteryX, this.batteryY, 30, 0, Math.PI * 2);
            this.ctx.stroke();
        }
    }
    
    drawComponent() {
        if (this.componentType === 'diode') {
            this.drawDiode();
        } else {
            this.drawTransistor();
        }
    }
    
    drawDiode() {
        const time = this.time * 0.001;
        const x = this.componentX;
        const y = this.componentY;
        const size = 40;
        
        // Determine visual state based on bias type
        const isForward = this.biasType === 'forward';
        const isReverse = this.biasType === 'reverse';
        const glow = this.isActive ? this.glowIntensity : 0;
        
        // Enhanced glow effects with pulsing
        const pulseEffect = Math.sin(time * 3) * 0.2;
        const glowColor = isForward ? '#00FF00' : isReverse ? '#FF0000' : '#FFFF00';
        const glowIntensity = isForward ? glow * (1 + pulseEffect) : isReverse ? glow * 0.3 : 0;
        
        // Apply enhanced shadow effect
        this.ctx.shadowColor = this.isActive ? glowColor : 'transparent';
        this.ctx.shadowBlur = this.isActive ? 15 + glowIntensity * 10 : 0;
        
        // Draw diode symbol with enhanced styling
        const symbolColor = this.isActive ? `rgba(255, 255, 0, ${0.9 + glowIntensity})` : '#FFFFFF';
        
        // Triangle (anode) with gradient effect
        this.ctx.fillStyle = symbolColor;
        this.ctx.beginPath();
        this.ctx.moveTo(x - size, y);
        this.ctx.lineTo(x - size/3, y - size/2);
        this.ctx.lineTo(x - size/3, y + size/2);
        this.ctx.closePath();
        this.ctx.fill();
        
        // Add metallic shine to triangle
        if (this.isActive) {
            this.ctx.fillStyle = `rgba(255, 255, 255, ${0.3 + pulseEffect})`;
            this.ctx.beginPath();
            this.ctx.moveTo(x - size + 5, y - size/3);
            this.ctx.lineTo(x - size/3, y);
            this.ctx.lineTo(x - size + 5, y + size/3);
            this.ctx.closePath();
            this.ctx.fill();
        }
        
        // Bar (cathode) with enhanced styling
        this.ctx.strokeStyle = symbolColor;
        this.ctx.lineWidth = 8;
        this.ctx.beginPath();
        this.ctx.moveTo(x + size/3, y - size/2);
        this.ctx.lineTo(x + size/3, y + size/2);
        this.ctx.stroke();
        
        // Leads with enhanced styling
        this.ctx.strokeStyle = symbolColor;
        this.ctx.lineWidth = 6;
        this.ctx.beginPath();
        this.ctx.moveTo(x - size - 25, y);
        this.ctx.lineTo(x - size, y);
        this.ctx.moveTo(x + size/3 + 25, y);
        this.ctx.lineTo(x + size/3, y);
        this.ctx.stroke();
        
        this.ctx.shadowBlur = 0;
        
        // Enhanced labels with better positioning
        this.drawComponentLabel('DIODE', x, y + size + 35, time);
        this.drawBiasIndicator(this.biasType, x, y - size - 25, glowIntensity);
        
        // Enhanced current flow indicators with animation
        if (this.isActive) {
            if (isForward) {
                this.drawCurrentFlow(x - size - 45, x + size/3 + 45, y, y, 'forward', glow);
                this.drawVoltageDrop(x, y - size/2 - 15, '0.7V', glow);
            } else if (isReverse) {
                this.drawCurrentFlow(x - size - 45, x + size/3 + 45, y, y, 'reverse', glow);
                this.drawVoltageDrop(x, y - size/2 - 15, 'BLOCKED', glow);
            }
        }
        
        // Add junction glow effect for forward bias
        if (this.isActive && isForward) {
            this.ctx.fillStyle = `rgba(0, 255, 0, ${0.3 + pulseEffect})`;
            this.ctx.beginPath();
            this.ctx.arc(x - size/3, y, 8, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }
    
    drawTransistor() {
        const time = this.time * 0.001;
        const x = this.componentX;
        const y = this.componentY;
        const radius = 35;
        const leadLength = 25;
        
        // Determine visual state based on bias type
        const isForward = this.biasType === 'forward';
        const isReverse = this.biasType === 'reverse';
        const glow = this.isActive ? this.glowIntensity : 0;
        
        // Enhanced glow effects with pulsing
        const pulseEffect = Math.sin(time * 3) * 0.2;
        const glowColor = isForward ? '#00FF00' : isReverse ? '#FF0000' : '#FFFF00';
        const glowIntensity = isForward ? glow * (1 + pulseEffect) : isReverse ? glow * 0.3 : 0;
        
        // Apply enhanced shadow effect
        this.ctx.shadowColor = this.isActive ? glowColor : 'transparent';
        this.ctx.shadowBlur = this.isActive ? 15 + glowIntensity * 10 : 0;
        
        // Draw transistor symbol with enhanced styling
        const symbolColor = this.isActive ? `rgba(255, 255, 0, ${0.9 + glowIntensity})` : '#FFFFFF';
        
        // Circle (transistor body) with enhanced styling
        this.ctx.strokeStyle = symbolColor;
        this.ctx.lineWidth = 6;
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, 2 * Math.PI);
        this.ctx.stroke();
        
        // Add inner glow for active state
        if (this.isActive) {
            this.ctx.fillStyle = `rgba(255, 255, 0, ${0.1 + pulseEffect})`;
            this.ctx.beginPath();
            this.ctx.arc(x, y, radius - 2, 0, 2 * Math.PI);
            this.ctx.fill();
        }
        
        // Enhanced leads with better styling
        this.ctx.lineWidth = 6;
        this.drawTransistorLeads(x, y, radius, leadLength, symbolColor);
        
        // Enhanced emitter arrow
        this.drawEmitterArrow(x, y, radius, symbolColor);
        
        // Enhanced lead labels
        this.drawLeadLabels(x, y, radius, leadLength, symbolColor);
        
        this.ctx.shadowBlur = 0;
        
        // Enhanced labels with better positioning
        this.drawComponentLabel(this.componentType.toUpperCase(), x, y + radius + leadLength + 55, time);
        this.drawBiasIndicator(this.biasType, x, y - radius - leadLength - 35, glowIntensity);
        
        // Enhanced current flow indicators with voltage drops
        if (this.isActive) {
            if (isForward) {
                // Different current flow direction for NPN vs PNP
                if (this.componentType === 'npn') {
                    // NPN: electrons flow from emitter to collector
                    this.drawCurrentFlow(x, x, y + radius + leadLength + 25, y - radius - leadLength - 25, 'forward', glow);
                    this.drawVoltageDrop(x, y - radius - 15, 'Vbe: 0.7V', glow);
                    this.drawVoltageDrop(x, y + radius + 15, 'Vce: 0.2V', glow);
                } else if (this.componentType === 'pnp') {
                    // PNP: holes flow from emitter to collector
                    this.drawCurrentFlow(x, x, y - radius - leadLength - 25, y + radius + leadLength + 25, 'forward', glow);
                    this.drawVoltageDrop(x, y - radius - 15, 'Vbe: -0.7V', glow);
                    this.drawVoltageDrop(x, y + radius + 15, 'Vce: -0.2V', glow);
                }
            } else if (isReverse) {
                this.drawCurrentFlow(x, x, y - radius - leadLength - 25, y + radius + leadLength + 25, 'reverse', glow);
                this.drawVoltageDrop(x, y - radius - 15, 'BLOCKED', glow);
            }
        }
        
        // Add base current indicator for forward bias
        if (this.isActive && isForward) {
            const baseCurrentColor = this.componentType === 'npn' ? 
                `rgba(0, 255, 255, ${0.5 + pulseEffect})` : 
                `rgba(255, 100, 100, ${0.5 + pulseEffect})`;
            
            this.ctx.strokeStyle = baseCurrentColor;
            this.ctx.lineWidth = 2;
            this.ctx.setLineDash([3, 3]);
            this.ctx.beginPath();
            this.ctx.moveTo(x - radius - leadLength - 10, y);
            this.ctx.lineTo(x - radius, y);
            this.ctx.stroke();
            this.ctx.setLineDash([]);
        }
        
        // Add transistor type indicator
        if (this.isActive) {
            const typeColor = this.componentType === 'npn' ? '#00AAFF' : '#FF4444';
            this.ctx.fillStyle = `rgba(0, 0, 0, 0.7)`;
            this.ctx.fillRect(x - 30, y - radius - 45, 60, 20);
            this.ctx.fillStyle = typeColor;
            this.ctx.font = 'bold 10px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(this.componentType.toUpperCase(), x, y - radius - 35);
        }
    }
    
    // Helper methods for drawing components
    drawComponentLabel(text, x, y, time) {
        const labelGlow = this.isActive ? Math.sin(time * 2) * 0.3 + 0.7 : 0.7;
        this.ctx.fillStyle = this.isActive ? `rgba(255, 255, 0, ${labelGlow})` : 'white';
        this.ctx.font = 'bold 18px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(text, x, y);
    }
    
    drawBiasIndicator(biasType, x, y, glowIntensity) {
        const biasText = biasType.toUpperCase();
        const biasColor = biasType === 'forward' ? '#00FF00' : 
                         biasType === 'reverse' ? '#FF0000' : '#FFFF00';
        this.ctx.fillStyle = this.isActive ? `rgba(0, 255, 0, ${0.8 + glowIntensity})` : biasColor;
        this.ctx.font = 'bold 14px Arial';
        this.ctx.fillText(biasText, x, y);
    }
    
    drawCurrentFlow(x1, x2, y1, y2, type, glow) {
        const isForward = type === 'forward';
        const color = isForward ? `rgba(0, 255, 255, ${glow})` : `rgba(255, 0, 0, ${glow * 0.5})`;
        const dash = isForward ? [5, 5] : [3, 3];
        
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash(dash);
        this.ctx.beginPath();
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(x2, y2);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
    }
    
    drawTransistorLeads(x, y, radius, leadLength, color) {
        this.ctx.strokeStyle = color;
        
        // Collector lead (top)
        this.ctx.beginPath();
        this.ctx.moveTo(x, y - radius);
        this.ctx.lineTo(x, y - radius - leadLength);
        this.ctx.stroke();
        
        // Base lead (middle)
        this.ctx.beginPath();
        this.ctx.moveTo(x - radius, y);
        this.ctx.lineTo(x - radius - leadLength, y);
        this.ctx.stroke();
        
        // Emitter lead (bottom)
        this.ctx.beginPath();
        this.ctx.moveTo(x, y + radius);
        this.ctx.lineTo(x, y + radius + leadLength);
        this.ctx.stroke();
    }
    
    drawEmitterArrow(x, y, radius, color) {
        this.ctx.fillStyle = color;
        
        if (this.componentType === 'npn') {
            // NPN: arrow pointing outward from emitter (electron flow)
            this.ctx.beginPath();
            this.ctx.moveTo(x - 8, y + radius - 15);
            this.ctx.lineTo(x + 8, y + radius - 15);
            this.ctx.lineTo(x, y + radius - 5);
            this.ctx.closePath();
            this.ctx.fill();
        } else if (this.componentType === 'pnp') {
            // PNP: arrow pointing inward to emitter (hole flow)
            this.ctx.beginPath();
            this.ctx.moveTo(x - 8, y + radius + 5);
            this.ctx.lineTo(x + 8, y + radius + 5);
            this.ctx.lineTo(x, y + radius + 15);
            this.ctx.closePath();
            this.ctx.fill();
        }
    }
    
    drawLeadLabels(x, y, radius, leadLength, color) {
        this.ctx.fillStyle = color;
        this.ctx.font = 'bold 16px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('C', x, y - radius - leadLength - 10);
        this.ctx.fillText('B', x - radius - leadLength - 10, y);
        this.ctx.fillText('E', x, y + radius + leadLength + 20);
    }
    
    drawVoltageDrop(x, y, text, glow) {
        this.ctx.fillStyle = `rgba(255, 255, 0, ${0.8 + glow})`;
        this.ctx.font = 'bold 10px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(text, x, y);
    }
    
    updateDiodeParticles() {
        // Diode: show electrons and holes moving in opposite directions during forward bias
        // Electrons: N-side (cathode) to P-side (anode) - right to left
        // Holes: P-side (anode) to N-side (cathode) - left to right
        // Both contribute to current flow in the same direction
        this.electrons.forEach((electron, index) => {
            if (this.biasType === 'forward') {
                // Electrons flow from N-side (cathode) to P-side (anode) - right to left
                electron.vx = -3 + Math.sin(this.time * 0.02 + index * 0.5) * 1.5;
                electron.vy = Math.sin(this.time * 0.03 + index) * 0.5;
                electron.x += electron.vx;
                electron.y += electron.vy;
                electron.glow = Math.sin(this.time * 0.1 + index) * 0.5 + 0.5;
                
                electron.trail.push({x: electron.x, y: electron.y, alpha: 1.0});
                if (electron.trail.length > 5) electron.trail.shift();
                
                if (electron.x < this.componentX - 200) {
                    electron.x = this.componentX + 100;
                    electron.y = this.componentY - 40 + Math.random() * 80;
                }
            } else if (this.biasType === 'reverse') {
                // Minimal reverse leakage current
                electron.vx = 0.1 + Math.sin(this.time * 0.01 + index * 0.5) * 0.05;
                electron.vy = Math.sin(this.time * 0.02 + index) * 0.1;
                electron.x += electron.vx;
                electron.y += electron.vy;
                electron.glow = 0.1;
                
                electron.trail.push({x: electron.x, y: electron.y, alpha: 0.3});
                if (electron.trail.length > 3) electron.trail.shift();
                
                if (electron.x > this.componentX + 200) {
                    electron.x = this.componentX - 100;
                    electron.y = this.componentY - 40 + Math.random() * 80;
                }
            } else {
                electron.vx = 0; electron.vy = 0; electron.glow = 0; electron.trail = [];
            }
        });
        
        this.holes.forEach((hole, index) => {
            if (this.biasType === 'forward') {
                // Holes flow from P-side (anode) to N-side (cathode) - left to right
                hole.vx = 2.5 + Math.sin(this.time * 0.02 + index * 0.5) * 1.2;
                hole.vy = Math.sin(this.time * 0.03 + index) * 0.5;
                hole.x += hole.vx;
                hole.y += hole.vy;
                hole.glow = Math.sin(this.time * 0.1 + index) * 0.5 + 0.5;
                
                hole.trail.push({x: hole.x, y: hole.y, alpha: 1.0});
                if (hole.trail.length > 5) hole.trail.shift();
                
                if (hole.x > this.componentX + 200) {
                    hole.x = this.componentX - 100;
                    hole.y = this.componentY - 40 + Math.random() * 80;
                }
            } else if (this.biasType === 'reverse') {
                // Minimal reverse leakage current
                hole.vx = 0.1 + Math.sin(this.time * 0.01 + index * 0.5) * 0.05;
                hole.vy = Math.sin(this.time * 0.02 + index) * 0.1;
                hole.x += hole.vx;
                hole.y += hole.vy;
                hole.glow = 0.1;
                
                hole.trail.push({x: hole.x, y: hole.y, alpha: 0.3});
                if (hole.trail.length > 3) hole.trail.shift();
                
                if (hole.x > this.componentX + 200) {
                    hole.x = this.componentX - 100;
                    hole.y = this.componentY - 40 + Math.random() * 80;
                }
            } else {
                hole.vx = 0; hole.vy = 0; hole.glow = 0; hole.trail = [];
            }
        });
    }
    
    updateNPNParticles() {
        // NPN: emphasize electron flow from emitter to collector
        // Base voltage affects particle speed and intensity
        const baseVoltageEffect = Math.max(0, (this.baseVoltage - 0.7) / 0.3); // 0 to 1 scale
        const speedMultiplier = 1 + baseVoltageEffect * 2; // 1x to 3x speed
        
        this.electrons.forEach((electron, index) => {
            if (this.biasType === 'forward' && this.baseVoltage > 0.7) {
                // Electrons flow from emitter (bottom) to collector (top)
                electron.vx = Math.sin(this.time * 0.02 + index * 0.5) * 1.0 * speedMultiplier;
                electron.vy = (-4 + Math.sin(this.time * 0.03 + index) * 1.0) * speedMultiplier;
                electron.x += electron.vx;
                electron.y += electron.vy;
                electron.glow = (Math.sin(this.time * 0.1 + index) * 0.5 + 0.5) * (0.5 + baseVoltageEffect * 0.5);
                
                electron.trail.push({x: electron.x, y: electron.y, alpha: 1.0});
                if (electron.trail.length > 8) electron.trail.shift();
                
                if (electron.y < this.componentY - 150) {
                    electron.x = this.componentX - 40 + Math.random() * 80;
                    electron.y = this.componentY + 100;
                }
            } else {
                electron.vx = 0; electron.vy = 0; electron.glow = 0; electron.trail = [];
            }
        });
        
        // Minimal hole movement for NPN
        this.holes.forEach((hole, index) => {
            hole.vx = 0; hole.vy = 0; hole.glow = 0; hole.trail = [];
        });
    }
    
    updatePNPParticles() {
        // PNP: emphasize hole flow from emitter to collector
        // Base voltage affects particle speed and intensity
        const baseVoltageEffect = Math.max(0, (this.baseVoltage - 0.7) / 0.3); // 0 to 1 scale
        const speedMultiplier = 1 + baseVoltageEffect * 2; // 1x to 3x speed
        
        this.holes.forEach((hole, index) => {
            if (this.biasType === 'forward' && this.baseVoltage > 0.7) {
                // Holes flow from emitter (top) to collector (bottom)
                hole.vx = Math.sin(this.time * 0.02 + index * 0.5) * 1.0 * speedMultiplier;
                hole.vy = (4 + Math.sin(this.time * 0.03 + index) * 1.0) * speedMultiplier;
                hole.x += hole.vx;
                hole.y += hole.vy;
                hole.glow = (Math.sin(this.time * 0.1 + index) * 0.5 + 0.5) * (0.5 + baseVoltageEffect * 0.5);
                
                hole.trail.push({x: hole.x, y: hole.y, alpha: 1.0});
                if (hole.trail.length > 8) hole.trail.shift();
                
                if (hole.y > this.componentY + 150) {
                    hole.x = this.componentX - 40 + Math.random() * 80;
                    hole.y = this.componentY - 100;
                }
            } else {
                hole.vx = 0; hole.vy = 0; hole.glow = 0; hole.trail = [];
            }
        });
        
        // Minimal electron movement for PNP
        this.electrons.forEach((electron, index) => {
            electron.vx = 0; electron.vy = 0; electron.glow = 0; electron.trail = [];
        });
    }
    
    drawLoad() {
        const time = this.time * 0.001;
        
        // Draw load (light bulb) with enhanced glow effect and animation
        const bulbGlow = this.isActive ? this.glowIntensity : 0;
        const pulseEffect = this.isActive ? Math.sin(time * 3) * 0.1 : 0;
        const bulbColor = this.isActive ? `rgba(255, 255, 0, ${0.8 + bulbGlow * 0.2 + pulseEffect})` : '#666';
        
        // Draw outer glow when active
        if (this.isActive) {
            this.ctx.shadowColor = '#FFFF00';
            this.ctx.shadowBlur = 30 + this.glowIntensity * 20;
            this.ctx.fillStyle = `rgba(255, 255, 0, ${0.3 + this.glowIntensity * 0.2})`;
            this.ctx.beginPath();
            this.ctx.arc(this.loadX, this.loadY, 45, 0, 2 * Math.PI);
            this.ctx.fill();
            this.ctx.shadowBlur = 0;
        }
        
        // Draw main bulb
        this.ctx.fillStyle = bulbColor;
        this.ctx.beginPath();
        this.ctx.arc(this.loadX, this.loadY, 35, 0, 2 * Math.PI);
        this.ctx.fill();
        
        // Add metallic shine to bulb
        this.ctx.fillStyle = `rgba(255, 255, 255, ${0.4 + Math.sin(time * 2) * 0.1})`;
        this.ctx.beginPath();
        this.ctx.arc(this.loadX - 10, this.loadY - 15, 8, 0, Math.PI);
        this.ctx.fill();
        
        // Draw bulb base with enhanced metallic effect
        this.ctx.fillStyle = '#444';
        this.ctx.fillRect(this.loadX - 18, this.loadY + 35, 36, 25);
        
        // Add metallic shine to base with animation
        this.ctx.fillStyle = `rgba(255, 255, 255, ${0.3 + Math.sin(time * 2) * 0.1})`;
        this.ctx.fillRect(this.loadX - 15, this.loadY + 37, 30, 5);
        
        // Draw filament with enhanced effect and glow
        this.ctx.strokeStyle = this.isActive ? `rgba(255, 170, 0, ${0.8 + this.glowIntensity})` : '#999';
        this.ctx.lineWidth = 3;
        this.ctx.shadowColor = this.isActive ? '#FFAA00' : 'transparent';
        this.ctx.shadowBlur = this.isActive ? 5 : 0;
        
        // Main filament
        this.ctx.beginPath();
        this.ctx.moveTo(this.loadX - 12, this.loadY);
        this.ctx.lineTo(this.loadX + 12, this.loadY);
        this.ctx.stroke();
        
        // Add additional filament lines when active with animation
        if (this.isActive) {
            const filamentPulse = Math.sin(time * 4) * 0.2 + 0.8;
            this.ctx.strokeStyle = `rgba(255, 170, 0, ${0.8 + this.glowIntensity * filamentPulse})`;
            
            this.ctx.beginPath();
            this.ctx.moveTo(this.loadX - 8, this.loadY - 5);
            this.ctx.lineTo(this.loadX + 8, this.loadY - 5);
            this.ctx.stroke();
            
            this.ctx.beginPath();
            this.ctx.moveTo(this.loadX - 8, this.loadY + 5);
            this.ctx.lineTo(this.loadX + 8, this.loadY + 5);
            this.ctx.stroke();
        }
        
        this.ctx.shadowBlur = 0;
        
        // Draw load label with pulsing glow
        const labelGlow = this.isActive ? Math.sin(time * 2) * 0.3 + 0.7 : 0.7;
        this.ctx.fillStyle = this.isActive ? `rgba(255, 255, 0, ${labelGlow})` : 'white';
        this.ctx.font = 'bold 16px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('LOAD', this.loadX, this.loadY + 80);
        
        // Add power indicator with enhanced styling
        if (this.isActive) {
            this.ctx.fillStyle = `rgba(0, 255, 0, ${0.8 + this.glowIntensity})`;
            this.ctx.font = 'bold 12px Arial';
            this.ctx.fillText(`${this.power.toFixed(1)}mW`, this.loadX, this.loadY - 60);
            
            // Add energy waves radiating from bulb
            for (let i = 0; i < 3; i++) {
                const waveRadius = 50 + i * 15 + Math.sin(time * 2 + i) * 5;
                const waveAlpha = (0.2 - i * 0.05) * this.glowIntensity;
                this.ctx.strokeStyle = `rgba(255, 255, 0, ${waveAlpha})`;
                this.ctx.lineWidth = 1;
                this.ctx.beginPath();
                this.ctx.arc(this.loadX, this.loadY, waveRadius, 0, Math.PI * 2);
                this.ctx.stroke();
            }
        }
    }
    
    drawParticles() {
        if (!this.showElectrons) return;
        
        const time = this.time * 0.001;
        
        // Draw electron trails with enhanced effects (filled circles)
        this.electrons.forEach(electron => {
            if (electron.trail.length > 0) {
                electron.trail.forEach((trailPoint, index) => {
                    const alpha = trailPoint.alpha * (index / electron.trail.length) * 0.6;
                    const pulse = Math.sin(time * 4 + index) * 0.2 + 0.8;
                    this.ctx.fillStyle = `rgba(0, 170, 255, ${alpha * pulse})`;
                    this.ctx.beginPath();
                    this.ctx.arc(trailPoint.x, trailPoint.y, electron.size * 0.6, 0, Math.PI * 2);
                    this.ctx.fill();
                });
            }
        });
        
        // Draw hole trails with enhanced effects (empty circles)
        this.holes.forEach(hole => {
            if (hole.trail.length > 0) {
                hole.trail.forEach((trailPoint, index) => {
                    const alpha = trailPoint.alpha * (index / hole.trail.length) * 0.6;
                    const pulse = Math.sin(time * 4 + index) * 0.2 + 0.8;
                    this.ctx.strokeStyle = `rgba(255, 68, 68, ${alpha * pulse})`;
                    this.ctx.lineWidth = 1;
                    this.ctx.beginPath();
                    this.ctx.arc(trailPoint.x, trailPoint.y, hole.size * 0.6, 0, Math.PI * 2);
                    this.ctx.stroke();
                });
            }
        });
        
        // Draw electrons with enhanced glow effect and standard symbol (filled circle)
        this.electrons.forEach(electron => {
            const glowIntensity = electron.glow * 0.4;
            const pulse = Math.sin(time * 3 + electron.x * 0.01) * 0.3 + 0.7;
            
            // Outer glow
            this.ctx.shadowColor = '#00AAFF';
            this.ctx.shadowBlur = glowIntensity * 15;
            this.ctx.fillStyle = `rgba(0, 170, 255, ${0.8 * pulse})`;
            this.ctx.beginPath();
            this.ctx.arc(electron.x, electron.y, electron.size * 1.2, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Core electron circle (filled - standard notation)
            this.ctx.shadowBlur = 0;
            this.ctx.fillStyle = electron.color;
            this.ctx.beginPath();
            this.ctx.arc(electron.x, electron.y, electron.size, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Inner highlight
            this.ctx.fillStyle = `rgba(255, 255, 255, ${0.6 * pulse})`;
            this.ctx.beginPath();
            this.ctx.arc(electron.x - 2, electron.y - 2, electron.size * 0.3, 0, Math.PI * 2);
            this.ctx.fill();
        });
        
        // Draw holes with enhanced glow effect and standard symbol (empty circle)
        this.holes.forEach(hole => {
            const glowIntensity = hole.glow * 0.4;
            const pulse = Math.sin(time * 3 + hole.x * 0.01) * 0.3 + 0.7;
            
            // Subtle outer glow for holes (not filling the circle)
            this.ctx.shadowColor = '#FF4444';
            this.ctx.shadowBlur = glowIntensity * 8;
            
            // Core hole circle (empty - standard notation)
            this.ctx.strokeStyle = hole.color;
            this.ctx.lineWidth = 0.5; // Very thin line for smaller holes
            this.ctx.beginPath();
            this.ctx.arc(hole.x, hole.y, hole.size, 0, Math.PI * 2);
            this.ctx.stroke();
            
            this.ctx.shadowBlur = 0;
            
            // Optional: small center dot to show it's a hole (not an empty space)
            this.ctx.fillStyle = `rgba(255, 68, 68, ${0.3 * pulse})`;
            this.ctx.beginPath();
            this.ctx.arc(hole.x, hole.y, hole.size * 0.2, 0, Math.PI * 2);
            this.ctx.fill();
        });
        
        // Draw energy particles with enhanced effects
        this.energyParticles.forEach(particle => {
            const pulse = Math.sin(time * 5 + particle.x * 0.01) * 0.3 + 0.7;
            this.ctx.fillStyle = `rgba(255, 255, 0, ${particle.life * pulse})`;
            this.ctx.shadowColor = '#FFFF00';
            this.ctx.shadowBlur = particle.life * 10;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.shadowBlur = 0;
        });
    }
    
    drawSparks() {
        // Draw sparks when current is high
        this.sparks.forEach(spark => {
            this.ctx.fillStyle = `rgba(255, 255, 0, ${spark.life})`;
            this.ctx.beginPath();
            this.ctx.arc(spark.x, spark.y, 2, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }
    
    drawCurrentFlow() {
        if (!this.showCurrent || !this.isActive) return;
        
        const time = this.time * 0.001;
        
        // Draw current flow with enhanced effects and animation
        this.ctx.strokeStyle = `rgba(255, 255, 0, ${0.8 + this.glowIntensity})`;
        this.ctx.lineWidth = 4;
        this.ctx.setLineDash([15, 8]);
        
        // Add glow effect to current flow
        this.ctx.shadowColor = '#FFFF00';
        this.ctx.shadowBlur = 10 + this.glowIntensity * 10;
        
        // Battery to component with animated dash pattern
        const dashOffset = Math.sin(time * 3) * 5;
        this.ctx.setLineDash([15 + dashOffset, 8 - dashOffset]);
        this.ctx.beginPath();
        this.ctx.moveTo(this.batteryX + 25, this.batteryY);
        this.ctx.lineTo(this.componentX - 90, this.componentY);
        this.ctx.stroke();
        
        // Component to load with animated dash pattern
        this.ctx.setLineDash([15 - dashOffset, 8 + dashOffset]);
        this.ctx.beginPath();
        this.ctx.moveTo(this.componentX + 90, this.componentY);
        this.ctx.lineTo(this.loadX - 35, this.loadY);
        this.ctx.stroke();
        
        this.ctx.setLineDash([]);
        this.ctx.shadowBlur = 0;
        
        // Draw animated current arrows with pulsing effect
        const arrowOffset = Math.sin(time * 2) * 5;
        const arrowGlow = Math.sin(time * 4) * 0.3 + 0.7;
        this.drawArrow(this.batteryX + 35 + arrowOffset, this.batteryY, 12, 0, `rgba(255, 255, 0, ${arrowGlow})`);
        this.drawArrow(this.componentX + 100 + arrowOffset, this.componentY, 12, 0, `rgba(255, 255, 0, ${arrowGlow})`);
        
        // Draw current intensity indicator with animation
        const intensity = Math.min(this.current / 20, 1);
        const pulseIntensity = intensity * (0.3 + Math.sin(time * 5) * 0.1);
        this.ctx.fillStyle = `rgba(255, 255, 0, ${pulseIntensity})`;
        this.ctx.fillRect(this.componentX - 100, this.componentY - 10, 200, 20);
        
        // Add energy particles along the current path
        for (let i = 0; i < 5; i++) {
            const particleProgress = (time * 0.5 + i * 0.2) % 1;
            const particleX = this.batteryX + 25 + (this.componentX - 90 - this.batteryX - 25) * particleProgress;
            const particleY = this.batteryY + Math.sin(time * 3 + i) * 3;
            
            this.ctx.fillStyle = `rgba(255, 255, 0, ${0.6 + Math.sin(time * 4 + i) * 0.2})`;
            this.ctx.beginPath();
            this.ctx.arc(particleX, particleY, 2, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        // Voltage drop indicators are already shown on the component symbol
    }
    
    drawArrow(x, y, dx, dy, color) {
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.moveTo(x, y);
        this.ctx.lineTo(x - 16, y - 8); // Increased from 8,4 to 16,8
        this.ctx.lineTo(x - 16, y + 8); // Increased from 8,4 to 16,8
        this.ctx.closePath();
        this.ctx.fill();
    }
    
    drawInfo() {
        // Draw info panel
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(10, 10, 300, 200);
        
        this.ctx.fillStyle = 'white';
        this.ctx.font = 'bold 16px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText('🔌 Diode & Transistor', 20, 30);
        
        this.ctx.font = '14px Arial';
        this.ctx.fillText(`Component: ${this.componentType.toUpperCase()}`, 20, 50);
        this.ctx.fillText(`Bias: ${this.biasType.toUpperCase()}`, 20, 70);
        this.ctx.fillText(`Input Voltage: ${this.inputVoltage}V`, 20, 90);
        
        if (this.componentType === 'npn' || this.componentType === 'pnp') {
            this.ctx.fillText(`Base Voltage: ${this.baseVoltage}V`, 20, 110);
        }
        
        this.ctx.fillText(`Current: ${this.current.toFixed(1)}mA`, 20, 130);
        this.ctx.fillText(`Power: ${this.power.toFixed(1)}mW`, 20, 150);
        this.ctx.fillText(`Status: ${this.isActive ? 'ACTIVE' : 'INACTIVE'}`, 20, 170);
        this.ctx.fillText(`Temperature: ${this.temperature}°C`, 20, 190);
    }
    
    drawInstructions() {
        // Draw instruction panel with color legend
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        this.ctx.fillRect(this.ctx.canvas.width - 320, 10, 310, 180);
        
        this.ctx.fillStyle = 'white';
        this.ctx.font = 'bold 16px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText('🔌 Particle Legend:', this.ctx.canvas.width - 310, 30);
        
        // Draw color-coded legend
        this.ctx.font = 'bold 14px Arial';
        
        // Blue particles (Electrons) - filled circle
        this.ctx.fillStyle = '#00AAFF';
        this.ctx.beginPath();
        this.ctx.arc(this.ctx.canvas.width - 300, 50, 2.5, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.fillStyle = 'white';
        this.ctx.font = '12px Arial';
        this.ctx.fillText('Electrons (filled circle)', this.ctx.canvas.width - 285, 55);
        
        // Red particles (Holes) - empty circle
        this.ctx.strokeStyle = '#FF4444';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(this.ctx.canvas.width - 300, 70, 2.5, 0, Math.PI * 2);
        this.ctx.stroke();
        this.ctx.fillStyle = 'white';
        this.ctx.font = '12px Arial';
        this.ctx.fillText('Holes (empty circle)', this.ctx.canvas.width - 285, 75);
        
        // Yellow particles (Energy)
        this.ctx.fillStyle = '#FFFF00';
        this.ctx.beginPath();
        this.ctx.arc(this.ctx.canvas.width - 300, 90, 2.5, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.fillStyle = 'white';
        this.ctx.font = '12px Arial';
        this.ctx.fillText('Energy Carriers', this.ctx.canvas.width - 285, 95);
        
        // Yellow arrows (Current flow)
        this.ctx.fillStyle = '#FFFF00';
        this.ctx.beginPath();
        this.ctx.moveTo(this.ctx.canvas.width - 300, 110);
        this.ctx.lineTo(this.ctx.canvas.width - 290, 110);
        this.ctx.lineTo(this.ctx.canvas.width - 292, 108);
        this.ctx.lineTo(this.ctx.canvas.width - 290, 110);
        this.ctx.lineTo(this.ctx.canvas.width - 292, 112);
        this.ctx.fill();
        this.ctx.fillStyle = 'white';
        this.ctx.font = '12px Arial';
        this.ctx.fillText('Current Flow', this.ctx.canvas.width - 285, 115);
        
        // Component behavior
        this.ctx.fillStyle = 'white';
        this.ctx.font = 'bold 12px Arial';
        this.ctx.fillText('💡 Behavior:', this.ctx.canvas.width - 310, 140);
        
        this.ctx.font = '11px Arial';
        if (this.componentType === 'diode') {
            this.ctx.fillText('• Forward bias: Electrons flow, light on', this.ctx.canvas.width - 310, 155);
            this.ctx.fillText('• Reverse bias: No flow, light off', this.ctx.canvas.width - 310, 170);
        } else {
            this.ctx.fillText('• Base controls collector current', this.ctx.canvas.width - 310, 155);
            this.ctx.fillText('• Small base = Large collector', this.ctx.canvas.width - 310, 170);
        }
    }
    
    getStats() {
        return {
            componentType: this.componentType,
            biasType: this.biasType,
            inputVoltage: this.inputVoltage,
            baseVoltage: this.baseVoltage,
            current: this.current,
            power: this.power,
            temperature: this.temperature,
            isActive: this.isActive,
            time: this.time
        };
    }
}