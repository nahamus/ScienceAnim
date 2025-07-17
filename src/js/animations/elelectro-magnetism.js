

// Electric Fields Simulation - Simplified
export class ElectricFields {
    constructor(ctx) {
        this.ctx = ctx;
        this.charges = [];
        this.testParticles = [];
        this.fieldStrength = 1.0;
        this.speed = 1.0;
        this.particleCount = 20;
        this.showFieldLines = true;
        this.showParticles = true;
        this.showForceArrows = false;
        this.showAnalytics = true; // Enable analytics by default for electric fields
        this.time = 0;
        
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
        // Draw elegant labels on the canvas
        this.ctx.save();
        
        // Set up text styling
        this.ctx.font = 'bold 18px Inter';
        this.ctx.textRenderingOptimization = 'optimizeLegibility';
        this.ctx.textAlign = 'center';
        
        // Draw animation type label
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
        this.ctx.shadowBlur = 2;
        this.ctx.fillText('Electric Fields', this.ctx.canvas.width / 2, 30);
        
        // Draw mathematical formulas
        this.ctx.font = '14px Inter';
        this.ctx.textRenderingOptimization = 'optimizeLegibility';
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        this.ctx.fillText(`E = kQ/r²`, 
                          this.ctx.canvas.width / 2, 50);
        
        // Draw Coulomb's law
        this.ctx.fillText(`F = kq₁q₂/r²`, 
                          this.ctx.canvas.width / 2, 70);
        
        // Draw field superposition
        this.ctx.fillText(`E = ΣEᵢ`, 
                          this.ctx.canvas.width / 2, 90);
        
        // Reset shadow
        this.ctx.shadowBlur = 0;
        this.ctx.restore();
    }
}

// Magnetic Fields Simulation - Simplified
export class MagneticFields {
    constructor(ctx) {
        this.ctx = ctx;
        this.speed = 1.0;
        this.fieldStrength = 1.0;
        this.particleCount = 15;
        this.showFieldLines = true;
        this.showParticles = true;
        this.showForceArrows = false;
        this.time = 0;
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
        // Start with one simple magnet in the center
        this.magnets = [
            {
                x: this.ctx.canvas.width / 2,
                y: this.ctx.canvas.height / 2,
                strength: this.fieldStrength,
                color: '#ff6b6b'
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
    
    setShowForceArrows(show) {
        this.showForceArrows = show;
    }
    
    addMagnetAtPosition(x, y) {
        this.magnets.push({
            x: x,
            y: y,
            strength: this.fieldStrength,
            color: '#ff6b6b'
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
                // Simple uniform field pointing upward from each magnet
                const fieldStrength = magnet.strength / (1 + distance / 100);
                By += fieldStrength; // Upward field
            }
        });
        
        return { Bx, By };
    }
    
    update(deltaTime) {
        const dt = (deltaTime / 1000) * this.speed * 3;
        this.time += dt;
        
        this.particles.forEach(particle => {
            // Calculate magnetic field at particle position
            const field = this.calculateMagneticField(particle.x, particle.y);
            
            // Simple Lorentz force: F = q(v × B)
            // Since B points upward, force is perpendicular to velocity
            const forceX = particle.charge * particle.vy * field.By;
            const forceY = -particle.charge * particle.vx * field.By;
        
        // Update velocity
            particle.vx += forceX * dt;
            particle.vy += forceY * dt;
            
            // Add some damping to prevent particles from going too fast
            const speed = Math.sqrt(particle.vx * particle.vx + particle.vy * particle.vy);
            if (speed > 150) {
                particle.vx *= 0.95;
                particle.vy *= 0.95;
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
        // Draw field lines (simplified)
        if (this.showFieldLines) {
            this.drawFieldLines();
        }
        
        // Draw magnets
        this.drawMagnets();
        
        // Draw particles
            this.drawParticles();
        
        // Draw force arrows
        if (this.showForceArrows) {
            this.drawForceArrows();
        }
        
        // Draw canvas labels
        this.drawMagneticLabels();
    }
    
    drawFieldLines() {
        const spacing = 40;
        
        for (let x = spacing; x < this.ctx.canvas.width; x += spacing) {
            for (let y = spacing; y < this.ctx.canvas.height; y += spacing) {
                const field = this.calculateMagneticField(x, y);
                const magnitude = Math.sqrt(field.Bx * field.Bx + field.By * field.By);
                
                if (magnitude > 0.1) {
                    // Draw simple upward arrows
                    this.ctx.beginPath();
                    this.ctx.strokeStyle = `rgba(255, 107, 107, ${Math.min(magnitude, 1)})`;
            this.ctx.lineWidth = 2;
                    this.ctx.moveTo(x, y);
                    this.ctx.lineTo(x, y - 20);
                    this.ctx.stroke();
                    
                    // Arrowhead
            this.ctx.beginPath();
                    this.ctx.fillStyle = `rgba(255, 107, 107, ${Math.min(magnitude, 1)})`;
                    this.ctx.moveTo(x, y - 20);
                    this.ctx.lineTo(x - 4, y - 16);
                    this.ctx.lineTo(x + 4, y - 16);
                    this.ctx.closePath();
                    this.ctx.fill();
                }
            }
        }
    }
    
    drawMagnets() {
        this.magnets.forEach((magnet, index) => {
            // Draw magnet as a simple circle
            this.ctx.beginPath();
            this.ctx.fillStyle = magnet.color;
            this.ctx.arc(magnet.x, magnet.y, 10, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Draw N/S labels
            this.ctx.fillStyle = '#fff';
            this.ctx.font = 'bold 14px Inter';
        this.ctx.textRenderingOptimization = 'optimizeLegibility';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('N', magnet.x, magnet.y + 4);
        });
    }
    
    drawParticles() {
        this.particles.forEach(particle => {
            // Draw trail
            if (particle.trail.length > 1) {
                this.ctx.beginPath();
                this.ctx.strokeStyle = particle.charge > 0 ? 'rgba(255, 100, 100, 0.4)' : 'rgba(100, 100, 255, 0.4)';
                this.ctx.lineWidth = 2;
                this.ctx.moveTo(particle.trail[0].x, particle.trail[0].y);
                particle.trail.forEach(point => {
                    this.ctx.lineTo(point.x, point.y);
                });
            this.ctx.stroke();
            }
            
            // Draw particle
            this.ctx.beginPath();
            this.ctx.fillStyle = particle.charge > 0 ? '#ff6b6b' : '#667eea';
            this.ctx.arc(particle.x, particle.y, 5, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Draw charge symbol
            this.ctx.fillStyle = '#fff';
            this.ctx.font = 'bold 12px Inter';
        this.ctx.textRenderingOptimization = 'optimizeLegibility';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(particle.charge > 0 ? '+' : '−', particle.x, particle.y + 3);
        });
    }
    
    drawForceArrows() {
        this.particles.forEach(particle => {
            const field = this.calculateMagneticField(particle.x, particle.y);
            const forceX = particle.charge * particle.vy * field.By;
            const forceY = -particle.charge * particle.vx * field.By;
            const forceMagnitude = Math.sqrt(forceX * forceX + forceY * forceY);
            
            if (forceMagnitude > 5) {
                const scale = 0.2;
                const endX = particle.x + forceX * scale;
                const endY = particle.y + forceY * scale;
                
                this.ctx.beginPath();
                this.ctx.strokeStyle = '#ff9800';
                this.ctx.lineWidth = 3;
                this.ctx.moveTo(particle.x, particle.y);
                this.ctx.lineTo(endX, endY);
                this.ctx.stroke();
                
                // Arrowhead
                const angle = Math.atan2(forceY, forceX);
                this.ctx.beginPath();
                this.ctx.fillStyle = '#ff9800';
                this.ctx.moveTo(endX, endY);
                this.ctx.lineTo(endX - 8 * Math.cos(angle - Math.PI / 6), endY - 8 * Math.sin(angle - Math.PI / 6));
                this.ctx.lineTo(endX - 8 * Math.cos(angle + Math.PI / 6), endY - 8 * Math.sin(angle + Math.PI / 6));
                this.ctx.closePath();
                this.ctx.fill();
            }
        });
    }
    
    drawInfo() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.font = '14px Inter';
        this.ctx.textRenderingOptimization = 'optimizeLegibility';
        this.ctx.textAlign = 'left';
        
        this.ctx.fillText(`Magnets: ${this.magnets.length}`, 10, 30);
        this.ctx.fillText(`Particles: ${this.particles.length}`, 10, 50);
        this.ctx.fillText(`Field Strength: ${this.fieldStrength.toFixed(1)}`, 10, 70);
        
        // Simple explanation with dark background for visibility
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(5, this.ctx.canvas.height - 50, 350, 40);
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        this.ctx.font = '14px Inter';
        this.ctx.textRenderingOptimization = 'optimizeLegibility';
        this.ctx.textRenderingOptimization = 'optimizeLegibility';
        this.ctx.fillText('Red = Positive charge, Blue = Negative charge', 10, this.ctx.canvas.height - 40);
        this.ctx.fillText('Click to add magnets, particles spiral around them', 10, this.ctx.canvas.height - 20);
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
        // Draw elegant labels on the canvas
        this.ctx.save();
        
        // Set up text styling
        this.ctx.font = 'bold 18px Inter';
        this.ctx.textRenderingOptimization = 'optimizeLegibility';
        this.ctx.textAlign = 'center';
        
        // Draw animation type label
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        this.ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
        this.ctx.shadowBlur = 2;
        this.ctx.fillText('Magnetic Fields', this.ctx.canvas.width / 2, 30);
        
        // Draw mathematical formulas
        this.ctx.font = '14px Inter';
        this.ctx.textRenderingOptimization = 'optimizeLegibility';
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillText(`F = q(v × B)`, 
                          this.ctx.canvas.width / 2, 50);
        
        // Draw Lorentz force
        this.ctx.fillText(`F = qvB sin θ`, 
                          this.ctx.canvas.width / 2, 70);
        
        // Draw magnetic field
        this.ctx.fillText(`B = μ₀I/2πr`, 
                          this.ctx.canvas.width / 2, 90);
        
        // Reset shadow
        this.ctx.shadowBlur = 0;
        this.ctx.restore();
    }
}

export class DiodeTransistor {
    constructor(ctx) {
        this.ctx = ctx;
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
        this.time = 0;
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
        this.ctx.lineTo(x - 8, y - 4);
        this.ctx.lineTo(x - 8, y + 4);
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