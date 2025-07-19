
// Wave Propagation Simulation
export class WavePropagation {
    constructor(ctx) {
        this.ctx = ctx;
        this.waveType = 'transverse';
        this.speed = 1;
        this.frequency = 1;
        this.amplitude = 50;
        this.wavelength = 150;
        this.showAnalytics = false;
        this.time = 0;
        this.particles = [];
        this.waveSpeed = 0; // Calculated from frequency and wavelength
        this.energy = 0; // Wave energy
        
        this.initializeParticles();
        this.calculateWaveParameters();
    }
    
    initializeParticles() {
        this.particles = [];
        const particleCount = 80; // Increased for smoother waves
        for (let i = 0; i < particleCount; i++) {
            this.particles.push({
                x: (i / particleCount) * this.ctx.canvas.width,
                y: this.ctx.canvas.height / 2,
                originalY: this.ctx.canvas.height / 2,
                originalX: (i / particleCount) * this.ctx.canvas.width,
                vx: 0,
                vy: 0,
                index: i
            });
        }
    }
    
    calculateWaveParameters() {
        // Calculate wave speed: v = f × λ
        this.waveSpeed = this.frequency * this.wavelength;
        // Calculate wave energy (proportional to amplitude^2 and frequency^2)
        this.energy = 0.5 * this.amplitude * this.amplitude * this.frequency * this.frequency;
    }
    
    setWaveType(type) {
        this.waveType = type;
        
        // Reset all parameters to default values when changing wave type
        this.speed = 1;
        this.frequency = 1;
        this.amplitude = 50;
        this.wavelength = 150;
        this.showAnalytics = false;
        this.time = 0;
        
        // Reinitialize particles
        this.initializeParticles();
        
        // Recalculate wave parameters
        this.calculateWaveParameters();
        
        // Reset all controls to default values
        const speedSlider = document.getElementById('waveSpeed');
        const frequencySlider = document.getElementById('waveFrequency');
        const amplitudeSlider = document.getElementById('waveAmplitude');
        const waveTypeSelect = document.getElementById('waveType');
        const analyticsCheckbox = document.getElementById('waveShowAnalytics');
        
        if (speedSlider) {
            speedSlider.value = this.speed;
            document.getElementById('waveSpeedValue').textContent = this.speed + 'x';
        }
        
        if (frequencySlider) {
            frequencySlider.value = this.frequency;
            document.getElementById('waveFrequencyValue').textContent = this.frequency;
        }
        
        if (amplitudeSlider) {
            amplitudeSlider.value = this.amplitude;
            document.getElementById('waveAmplitudeValue').textContent = this.amplitude;
        }
        
        if (waveTypeSelect) {
            waveTypeSelect.value = this.waveType;
        }
        
        if (analyticsCheckbox) {
            analyticsCheckbox.checked = this.showAnalytics;
        }
    }
    
    setSpeed(speed) {
        this.speed = speed;
        // Don't recalculate wave parameters when user changes speed
        // this.calculateWaveParameters();
    }
    
    setFrequency(freq) {
        this.frequency = freq;
        this.calculateWaveParameters();
    }
    
    setAmplitude(amp) {
        this.amplitude = amp;
        this.calculateWaveParameters();
    }
    
    setWavelength(wavelength) {
        this.wavelength = wavelength;
        this.calculateWaveParameters();
    }
    
    setShowAnalytics(show) {
        this.showAnalytics = show;
    }
    
    reset() {
        // Reset all parameters to initial state
        this.waveType = 'transverse';
        this.speed = 1;
        this.frequency = 1;
        this.amplitude = 50;
        this.wavelength = 150;
        this.showAnalytics = false;
        this.time = 0;
        
        // Reinitialize particles
        this.initializeParticles();
        
        // Recalculate wave parameters
        this.calculateWaveParameters();
        
        // Reset controls to match the reset state
        const speedSlider = document.getElementById('waveSpeed');
        const frequencySlider = document.getElementById('waveFrequency');
        const amplitudeSlider = document.getElementById('waveAmplitude');
        const waveTypeSelect = document.getElementById('waveType');
        const analyticsCheckbox = document.getElementById('waveShowAnalytics');
        
        if (speedSlider) {
            speedSlider.value = this.speed;
            document.getElementById('waveSpeedValue').textContent = this.speed + 'x';
        }
        
        if (frequencySlider) {
            frequencySlider.value = this.frequency;
            document.getElementById('waveFrequencyValue').textContent = this.frequency;
        }
        
        if (amplitudeSlider) {
            amplitudeSlider.value = this.amplitude;
            document.getElementById('waveAmplitudeValue').textContent = this.amplitude;
        }
        
        if (waveTypeSelect) {
            waveTypeSelect.value = this.waveType;
        }
        
        if (analyticsCheckbox) {
            analyticsCheckbox.checked = this.showAnalytics;
        }
    }
    
    update(deltaTime) {
        // Slow down longitudinal waves for better visibility
        const speedMultiplier = this.waveType === 'longitudinal' ? 1 : 5;
        const dt = (deltaTime / 1000) * this.speed * speedMultiplier;
        this.time += dt;
        
        this.particles.forEach((particle, index) => {
            const phase = (particle.x / this.wavelength) * 2 * Math.PI;
            const timePhase = this.time * this.frequency * 2 * Math.PI;
            
            let displacement = 0;
            let velocity = 0;
            
            switch (this.waveType) {
                case 'transverse':
                    displacement = this.amplitude * Math.sin(phase - timePhase);
                    velocity = -this.amplitude * this.frequency * 2 * Math.PI * Math.cos(phase - timePhase);
                    particle.y = particle.originalY + displacement;
                    particle.vy = velocity;
                    break;

                case 'longitudinal':
                    // Longitudinal wave: particles move horizontally along wave direction
                    // Use smaller amplitude for more visible movement
                    const longitudinalAmplitude = this.amplitude * 0.5;
                    displacement = longitudinalAmplitude * Math.sin(phase - timePhase);
                    velocity = -longitudinalAmplitude * this.frequency * 2 * Math.PI * Math.cos(phase - timePhase);
                    particle.x = particle.originalX + displacement;
                    particle.y = particle.originalY; // Keep vertical position constant
                    particle.vx = velocity;
                    particle.vy = 0;
                    // Store displacement for spring visualization
                    particle.displacement = displacement;
                    break;
                case 'interference':
                    const wave1 = this.amplitude * Math.sin(phase - timePhase);
                    const wave2 = this.amplitude * Math.sin(phase + timePhase);
                    displacement = wave1 + wave2;
                    velocity = -this.amplitude * this.frequency * 2 * Math.PI * 
                              (Math.cos(phase - timePhase) - Math.cos(phase + timePhase));
                    particle.y = particle.originalY + displacement;
                    particle.vy = velocity;
                    break;
                case 'standing':
                    displacement = this.amplitude * Math.sin(phase) * Math.cos(timePhase);
                    velocity = -this.amplitude * this.frequency * 2 * Math.PI * Math.sin(phase) * Math.sin(timePhase);
                    particle.y = particle.originalY + displacement;
                    particle.vy = velocity;
                    break;
            }
        });
    }
    
    render() {
        // Draw grid and scale markers
        this.drawGrid();
        
        // Draw waveform based on wave type
        if (this.waveType === 'longitudinal') {
            this.drawLongitudinalWaveform();
        } else {
        this.drawEnhancedWaveform();
        }
        
        // Always draw particles with velocity-based coloring
        this.drawParticles();
        
        // Draw wave direction indicator
        this.drawWaveDirection();
        
        // Draw canvas labels
        this.drawCanvasLabels();
        
        // Draw analytics if enabled
        if (this.showAnalytics) {
            this.drawVelocityVectors();
            this.drawWaveInfo();
            this.drawEnergyVisualization();
        }
    }
    
    drawGrid() {
        // Draw wavelength markers
        this.ctx.strokeStyle = 'rgba(100, 100, 100, 0.3)';
        this.ctx.lineWidth = 1;
        this.ctx.setLineDash([5, 5]);
        
        for (let x = 0; x < this.ctx.canvas.width; x += this.wavelength) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.ctx.canvas.height);
            this.ctx.stroke();
        }
        this.ctx.setLineDash([]);
        
        // Draw amplitude markers
        const centerY = this.ctx.canvas.height / 2;
        this.ctx.strokeStyle = 'rgba(100, 100, 100, 0.2)';
        this.ctx.lineWidth = 1;
        for (let y = centerY - this.amplitude; y <= centerY + this.amplitude; y += this.amplitude / 2) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.ctx.canvas.width, y);
            this.ctx.stroke();
        }
    }
    
    drawEnhancedWaveform() {
        this.ctx.beginPath();
        
        // Create gradient for waveform
        const gradient = this.ctx.createLinearGradient(0, 0, this.ctx.canvas.width, 0);
        gradient.addColorStop(0, '#667eea');
        gradient.addColorStop(0.5, '#764ba2');
        gradient.addColorStop(1, '#667eea');
        
        this.ctx.strokeStyle = gradient;
        this.ctx.lineWidth = 4;
        
        // Create smooth waveform with dense interpolation
        if (this.particles.length > 1) {
            const startX = this.particles[0].x;
            const endX = this.particles[this.particles.length - 1].x;
            const numPoints = 300; // Even denser sampling
            
            // For transverse waves, draw vertical waveform
            this.ctx.moveTo(startX, this.particles[0].y);
            
            for (let i = 1; i < numPoints; i++) {
                const t = i / (numPoints - 1);
                const x = startX + t * (endX - startX);
                
                // Find the corresponding y value by interpolating between particles
                const particleIndex = t * (this.particles.length - 1);
                const lowIndex = Math.floor(particleIndex);
                const highIndex = Math.min(lowIndex + 1, this.particles.length - 1);
                const fraction = particleIndex - lowIndex;
                
                const lowY = this.particles[lowIndex].y;
                const highY = this.particles[highIndex].y;
                const y = lowY + fraction * (highY - lowY);
                
                this.ctx.lineTo(x, y);
            }
        }
        this.ctx.stroke();
        
        // Add glow effect
        this.ctx.shadowColor = '#667eea';
        this.ctx.shadowBlur = 10;
        this.ctx.stroke();
        this.ctx.shadowBlur = 0;
    }
    
    drawLongitudinalWaveform() {
        if (this.particles.length < 2) return;
        
        const centerY = this.ctx.canvas.height / 2;
        const springRadius = 20;
        
        // Draw a slinky-like spring with multiple coils
        this.ctx.strokeStyle = '#667eea';
        this.ctx.lineWidth = 4;
        
        // Create a continuous spring path
        this.ctx.beginPath();
        this.ctx.moveTo(this.particles[0].x, centerY);
        
        // Draw smooth spring coils along the entire length
        const totalLength = this.particles[this.particles.length - 1].x - this.particles[0].x;
        const numPoints = 200; // Much more points for smooth curve
        
        for (let i = 0; i <= numPoints; i++) {
            const t = i / numPoints;
            const x = this.particles[0].x + t * totalLength;
            
            // Calculate wave displacement at this position
            const phase = (x / this.wavelength) * 2 * Math.PI;
            const timePhase = this.time * this.frequency * 2 * Math.PI;
            const waveDisplacement = this.amplitude * Math.sin(phase - timePhase);
            
            // Add smooth spring coil offset
            const coilOffset = Math.sin(t * Math.PI * 8) * springRadius; // More coils for smoothness
            
            // Combine wave displacement with spring coil
            const y = centerY + coilOffset + waveDisplacement * 0.3;
            
            this.ctx.lineTo(x, y);
        }
        
        this.ctx.stroke();
        
        // Add glow effect
        this.ctx.shadowColor = '#667eea';
        this.ctx.shadowBlur = 10;
        this.ctx.stroke();
        this.ctx.shadowBlur = 0;
        
        // Draw wave direction arrows
        this.drawLongitudinalWaveDirection();
    }
    
    drawLongitudinalWaveDirection() {
        const centerY = this.ctx.canvas.height / 2;
        const waveSpeed = this.frequency * this.wavelength;
        const arrowX = 50 + (this.time * waveSpeed * 0.1) % 100;
        
        // Draw horizontal arrow
        this.ctx.beginPath();
        this.ctx.strokeStyle = '#ff6b6b';
        this.ctx.lineWidth = 3;
        this.ctx.moveTo(arrowX, centerY);
        this.ctx.lineTo(arrowX + 30, centerY);
        this.ctx.stroke();
        
        // Arrowhead
        this.ctx.beginPath();
        this.ctx.fillStyle = '#ff6b6b';
        this.ctx.moveTo(arrowX + 30, centerY);
        this.ctx.lineTo(arrowX + 25, centerY - 5);
        this.ctx.lineTo(arrowX + 25, centerY + 5);
        this.ctx.closePath();
        this.ctx.fill();
    }
    
    drawCanvasLabels() {
        // Draw elegant labels on the canvas
        this.ctx.save();
        
        // Set up text styling
        this.ctx.font = 'bold 18px Inter';
        this.ctx.textRenderingOptimization = 'optimizeLegibility';
        this.ctx.textAlign = 'center';
        
        // Draw wave type label
        const waveTypeLabel = this.waveType.charAt(0).toUpperCase() + this.waveType.slice(1) + ' Wave';
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        this.ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
        this.ctx.shadowBlur = 2;
        this.ctx.fillText(waveTypeLabel, this.ctx.canvas.width / 2, 25);
        
        // Draw mathematical formulas in a more compact format
        this.ctx.font = '12px Inter';
        this.ctx.textRenderingOptimization = 'optimizeLegibility';
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillText(`v = f×λ = ${this.waveSpeed.toFixed(1)} px/s  |  y = A sin(2π(ft-x/λ))  |  E ∝ A²f²`, 
                          this.ctx.canvas.width / 2, 45);
        
        // Reset shadow
        this.ctx.shadowBlur = 0;
        this.ctx.restore();
    }
    
    drawParticles() {
        this.particles.forEach(particle => {
            // Calculate velocity magnitude for coloring
            const velocity = Math.sqrt(particle.vx * particle.vx + particle.vy * particle.vy);
            const maxVelocity = this.amplitude * this.frequency * 2 * Math.PI;
            const velocityRatio = Math.min(velocity / maxVelocity, 1);
            
            // Color based on velocity (blue = slow, red = fast)
            const r = Math.floor(100 + velocityRatio * 155);
            const g = Math.floor(100 + (1 - velocityRatio) * 100);
            const b = Math.floor(200 + velocityRatio * 55);
            
            // Make particles larger for longitudinal waves
            const particleSize = this.waveType === 'longitudinal' ? 8 : 5;
            
            this.ctx.beginPath();
            this.ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
            this.ctx.arc(particle.x, particle.y, particleSize, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Add highlight
            this.ctx.beginPath();
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
            this.ctx.arc(particle.x - 1, particle.y - 1, particleSize * 0.4, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.strokeStyle = '#fff';
            this.ctx.lineWidth = 1;
            this.ctx.stroke();
        });
    }
    
    drawVelocityVectors() {
        this.particles.forEach(particle => {
            const velocity = Math.sqrt(particle.vx * particle.vx + particle.vy * particle.vy);
            if (velocity > 1) {
                const scale = 0.1;
                const endX = particle.x + particle.vx * scale;
                const endY = particle.y + particle.vy * scale;
                
                this.ctx.beginPath();
                this.ctx.strokeStyle = '#ff6b6b';
                this.ctx.lineWidth = 2;
                this.ctx.moveTo(particle.x, particle.y);
                this.ctx.lineTo(endX, endY);
                this.ctx.stroke();
                
                // Arrowhead
                const angle = Math.atan2(particle.vy, particle.vx);
                this.ctx.beginPath();
                this.ctx.fillStyle = '#ff6b6b';
                this.ctx.moveTo(endX, endY);
                this.ctx.lineTo(endX - 6 * Math.cos(angle - Math.PI / 6), endY - 6 * Math.sin(angle - Math.PI / 6));
                this.ctx.lineTo(endX - 6 * Math.cos(angle + Math.PI / 6), endY - 6 * Math.sin(angle + Math.PI / 6));
                this.ctx.closePath();
                this.ctx.fill();
            }
        });
    }
    
    drawWaveDirection() {
        if (this.waveType !== 'standing') {
            // Animated wave direction indicator - move at wave speed
            const waveSpeed = this.frequency * this.wavelength;
            const arrowX = 50 + (this.time * waveSpeed * 0.1) % 100;
            
            this.ctx.beginPath();
            this.ctx.strokeStyle = '#ff6b6b';
            this.ctx.lineWidth = 3;
            this.ctx.moveTo(arrowX, 50);
            this.ctx.lineTo(arrowX + 20, 50);
            this.ctx.stroke();
            
            // Arrowhead
            this.ctx.beginPath();
            this.ctx.fillStyle = '#ff6b6b';
            this.ctx.moveTo(arrowX + 20, 50);
            this.ctx.lineTo(arrowX + 15, 45);
            this.ctx.lineTo(arrowX + 15, 55);
            this.ctx.closePath();
            this.ctx.fill();
        }
    }
    
    drawWaveInfo() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.font = '14px Inter';
        this.ctx.textRenderingOptimization = 'optimizeLegibility';
        this.ctx.textAlign = 'left';
        
        let y = 120; // Moved down to avoid overlap with main labels
        this.ctx.fillText(`Wave Type: ${this.waveType.charAt(0).toUpperCase() + this.waveType.slice(1)}`, 10, y);
        y += 20;
        this.ctx.fillText(`Frequency: ${this.frequency.toFixed(1)} Hz`, 10, y);
        y += 20;
        this.ctx.fillText(`Wavelength: ${this.wavelength.toFixed(0)} px`, 10, y);
        y += 20;
        this.ctx.fillText(`Amplitude: ${this.amplitude.toFixed(0)} px`, 10, y);
        y += 20;
        this.ctx.fillText(`Wave Speed: ${this.waveSpeed.toFixed(1)} px/s`, 10, y);
        y += 20;
        this.ctx.fillText(`Energy: ${this.energy.toFixed(1)}`, 10, y);
        y += 30;
        
        // Wave equation
        this.ctx.fillText(`Wave Equation: y = A sin(kx - ωt)`, 10, y);
        y += 20;
        this.ctx.fillText(`where: k = 2π/λ, ω = 2πf`, 10, y);
    }
    
    drawEnergyVisualization() {
        // Draw energy bar
        const barWidth = 200;
        const barHeight = 20;
        const barX = this.ctx.canvas.width - barWidth - 20;
        const barY = 120; // Moved down to avoid overlap with main labels
        
        // Background
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.fillRect(barX, barY, barWidth, barHeight);
        
        // Energy level
        const maxEnergy = 0.5 * 100 * 100 * 3 * 3; // Max possible energy
        const energyRatio = Math.min(this.energy / maxEnergy, 1);
        const energyWidth = barWidth * energyRatio;
        
        // Gradient for energy bar
        const energyGradient = this.ctx.createLinearGradient(barX, barY, barX + energyWidth, barY);
        energyGradient.addColorStop(0, '#4CAF50');
        energyGradient.addColorStop(1, '#FF9800');
        
        this.ctx.fillStyle = energyGradient;
        this.ctx.fillRect(barX, barY, energyWidth, barHeight);
        
        // Label
        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 14px Inter';
        this.ctx.textRenderingOptimization = 'optimizeLegibility';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(`Energy: ${this.energy.toFixed(1)}`, barX + barWidth / 2, barY + 15);
    }
    
    getStats() {
        return {
            waveType: this.waveType.charAt(0).toUpperCase() + this.waveType.slice(1),
            frequency: this.frequency.toFixed(1),
            wavelength: this.wavelength.toFixed(0),
            amplitude: this.amplitude.toFixed(0),
            waveSpeed: this.waveSpeed.toFixed(1),
            energy: this.energy.toFixed(1),
            time: this.time.toFixed(1)
        };
    }
}

// Sound Waves Simulation
export class SoundWaves {
    constructor(ctx) {
        this.ctx = ctx;
        this.particles = [];
        this.frequency = 5; // Hz (low frequency for visualization)
        this.amplitude = 50; // Percentage
        this.waveSpeed = 343; // m/s (speed of sound in air)
        this.particleCount = 15;
        this.waveType = 'transverse'; // 'transverse', 'longitudinal', 'combined'
        this.showPressure = true;
        this.animationSpeed = 1.0;
        this.time = 0;
        
        // Source and receiver properties
        this.sourceX = 100;
        this.sourceY = this.ctx.canvas.height / 2;
        this.receiverX = this.ctx.canvas.width - 100;
        this.receiverY = this.ctx.canvas.height / 2;
        this.showSourceReceiver = true;
        this.sourceActive = true;
        this.pulses = [];
        this.pulseDuration = 2; // number of wavelengths to show
        
        this.initializeParticles();
        this.setupClickEvents();
    }
    
    setupClickEvents() {
        // Add click event listener to canvas for triggering wave pulses
        this.ctx.canvas.addEventListener('click', (e) => {
            const rect = this.ctx.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            // Check if click is near the source
            const distanceFromSource = Math.sqrt((x - this.sourceX) ** 2 + (y - this.sourceY) ** 2);
            if (distanceFromSource < 50) {
                this.triggerWavePulse();
            }
        });
        
        // Add touch event listener for mobile support
        this.ctx.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const rect = this.ctx.canvas.getBoundingClientRect();
            const touch = e.touches[0];
            const x = touch.clientX - rect.left;
            const y = touch.clientY - rect.top;
            
            // Check if touch is near the source
            const distanceFromSource = Math.sqrt((x - this.sourceX) ** 2 + (y - this.sourceY) ** 2);
            if (distanceFromSource < 50) {
                this.triggerWavePulse();
            }
        });
    }
    
    initializeParticles() {
        this.particles = [];
        const spacing = this.ctx.canvas.width / this.particleCount;
        
        for (let i = 0; i < this.particleCount; i++) {
            this.particles.push({
                x: i * spacing,
                originalX: i * spacing,
                y: this.ctx.canvas.height / 2,
                originalY: this.ctx.canvas.height / 2,
                vx: 0,
                vy: 0,
                size: 4 + Math.random() * 2,
                color: `hsl(${200 + Math.random() * 60}, 70%, 60%)`,
                pressure: 0,
                life: 0
            });
        }
    }
    
    setFrequency(freq) {
        this.frequency = freq;
    }
    
    setAmplitude(amp) {
        this.amplitude = amp;
    }
    
    setWaveSpeed(speed) {
        this.waveSpeed = speed;
    }
    
    setParticleCount(count) {
        this.particleCount = count;
        this.initializeParticles();
    }
    
    setWaveType(type) {
        this.waveType = type;
    }
    
    setShowPressure(show) {
        this.showPressure = show;
    }
    
    setAnimationSpeed(speed) {
        this.animationSpeed = speed;
    }
    
    setShowSourceReceiver(show) {
        this.showSourceReceiver = show;
    }
    
    setSourceActive(active) {
        this.sourceActive = active;
    }
    
    setSourcePosition(x, y) {
        this.sourceX = x;
        this.sourceY = y;
    }
    
    setReceiverPosition(x, y) {
        this.receiverX = x;
        this.receiverY = y;
    }
    
    triggerWavePulse() {
        const pulse = {
            startTime: this.time, // Use animation time instead of Date.now()
            duration: 5.0, // 5 seconds in animation time - longer to ensure wave reaches receiver
            active: true
        };
        this.pulses.push(pulse);
    }
    
    reset() {
        this.time = 0;
        this.pulses = [];
        this.initializeParticles();
    }
    
    update(deltaTime) {
        this.time += deltaTime * this.animationSpeed;
        
        // Update pulses - remove expired ones
        this.pulses = this.pulses.filter(pulse => {
            const elapsed = (this.time - pulse.startTime) / 1000; // Convert to seconds
            return elapsed < pulse.duration;
        });
        
        const wavelength = (this.waveSpeed / this.frequency) * 0.5; // Scale down for visualization but not too much
        const angularFrequency = 2 * Math.PI * this.frequency;
        const amplitude = (this.amplitude / 100) * 50; // Scale amplitude
        
        this.particles.forEach((particle, index) => {
            // Check if any pulse is active
            let waveActive = false;
            let pulsePhase = 0;
            let waveProgress = 0; // How far the wave front has traveled (0 to 1)
            

            
            this.pulses.forEach(pulse => {
                const elapsed = (this.time - pulse.startTime) / 1000; // Convert to seconds
                const pulseDuration = pulse.duration;
                
                // Check if pulse is active
                if (elapsed >= 0 && elapsed <= pulseDuration) {
                    waveActive = true;
                    
                    // Calculate how far the wave front has traveled - ensure it reaches receiver within pulse duration
                    const totalDistance = this.receiverX - this.sourceX; // Total distance to travel
                    const pulseDuration = pulse.duration; // Duration in seconds
                    
                    // Calculate required wave speed to reach receiver within pulse duration
                    const requiredSpeed = totalDistance / pulseDuration; // pixels per second
                    const waveSpeedScale = requiredSpeed / this.waveSpeed; // Scale factor to match required speed
                    
                    const waveTravelDistance = elapsed * (this.waveSpeed * waveSpeedScale); // Scale for visualization
                    
                    // Calculate wave front progress (0 to 1) - ensure wave reaches receiver
                    waveProgress = Math.min(waveTravelDistance / totalDistance, 1.0);
                    
                    // Calculate phase for this particle based on its position within the wave packet
                    const particleDistance = waveProgress * totalDistance;
                    pulsePhase = (particleDistance / wavelength) * 2 * Math.PI;
                }
            });
            
            if (waveActive) {
                // Calculate wave packet properties
                const wavePacketWidth = 6 * wavelength; // Wave packet spans 6 wavelengths for better visibility
                
                // Calculate wave packet start position - ensure it starts at source and moves forward
                const wavePacketStart = this.sourceX + (this.receiverX - this.sourceX) * waveProgress;
                const wavePacketEnd = Math.min(this.receiverX, wavePacketStart + wavePacketWidth);
                

                
                // Calculate this particle's position within the wave packet
                const particlePositionInPacket = (index / (this.particleCount - 1)) * (wavePacketEnd - wavePacketStart);
                let particleX = wavePacketStart + particlePositionInPacket;
                
                // Ensure particle is within the wave packet bounds
                if (particleX < wavePacketStart) particleX = wavePacketStart;
                if (particleX > wavePacketEnd) particleX = wavePacketEnd;
                
                // Only show particles that are within the wave packet bounds and between source and receiver
                if (particleX >= this.sourceX && particleX <= this.receiverX && particleX >= wavePacketStart && particleX <= wavePacketEnd) {
                    // Convert amplitude from percentage to actual displacement - make it more visible
                    const amplitudeDisplacement = (this.amplitude / 100) * 120; // Scale amplitude to reasonable pixel values
                    
                    if (this.waveType === 'transverse' || this.waveType === 'combined') {
                        // Transverse wave motion - particle moves horizontally and oscillates vertically
                        particle.x = particleX;
                        particle.y = particle.originalY + amplitudeDisplacement * Math.sin(pulsePhase + (index * 0.2));
                        particle.vy = amplitudeDisplacement * 2 * Math.PI * Math.cos(pulsePhase + (index * 0.2)) * this.animationSpeed * 0.001;
                    }
                    
                    if (this.waveType === 'longitudinal' || this.waveType === 'combined') {
                        // Longitudinal wave motion - particle oscillates around its traveling position
                        particle.x = particleX + amplitudeDisplacement * 0.1 * Math.sin(pulsePhase + (index * 0.2));
                        particle.vx = amplitudeDisplacement * 0.1 * 2 * Math.PI * Math.cos(pulsePhase + (index * 0.2)) * this.animationSpeed * 0.001;
                    }
                    
                    // Calculate pressure for longitudinal waves
                    if (this.waveType === 'longitudinal' || this.waveType === 'combined') {
                        particle.pressure = Math.sin(pulsePhase + (index * 0.2));
                    }
                } else {
                    // Hide particles outside the wave packet
                    particle.x = -100;
                    particle.y = -100;
                    particle.vy = 0;
                    particle.vx = 0;
                    particle.pressure = 0;
                }
            } else {
                // Reset particle to original position when no pulse is active
                particle.y = particle.originalY;
                particle.x = particle.originalX;
                particle.vy = 0;
                particle.vx = 0;
                particle.pressure = 0;
            }
            
            particle.life += deltaTime;
        });
    }
    
    render() {
        this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
        
        // Always draw background and source/receiver
        this.drawBackground();
        if (this.showSourceReceiver) {
            this.drawSourceAndReceiver();
        }
        
        // Draw wave if pulses are active
        if (this.pulses && this.pulses.length > 0) {
            switch (this.waveType) {
                case 'transverse':
                    this.drawTransverseWave();
                    break;
                case 'longitudinal':
                    this.drawLongitudinalWave();
                    break;
                case 'combined':
                    this.drawCombinedWave();
                    break;
            }
        } else {
            // Show instruction when no wave is active
            this.drawInstruction();
        }
        
        // Always show info panels
        this.drawSoundInfo();
        this.drawRealWorldAnalogy();
    }
    
    drawInstruction() {
        // Draw instruction to click on source
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(this.ctx.canvas.width / 2 - 200, this.ctx.canvas.height / 2 - 40, 400, 80);
        
        this.ctx.fillStyle = 'white';
        this.ctx.font = 'bold 16px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('🎵 Click the red source to trigger a sound wave!', this.ctx.canvas.width / 2, this.ctx.canvas.height / 2 - 10);
        this.ctx.font = '14px Arial';
        this.ctx.fillText('Watch the wave propagate from source to receiver', this.ctx.canvas.width / 2, this.ctx.canvas.height / 2 + 10);
        this.ctx.fillText('Adjust controls to see different wave behaviors', this.ctx.canvas.width / 2, this.ctx.canvas.height / 2 + 30);
    }
    
    drawBackground() {
        // Draw subtle grid
        this.ctx.strokeStyle = 'rgba(200, 200, 200, 0.2)';
        this.ctx.lineWidth = 1;
        
        // Vertical lines
        for (let x = 0; x < this.ctx.canvas.width; x += 50) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.ctx.canvas.height);
            this.ctx.stroke();
        }
        
        // Horizontal lines
        for (let y = 0; y < this.ctx.canvas.height; y += 50) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.ctx.canvas.width, y);
            this.ctx.stroke();
        }
    }
    
    drawTransverseWave() {
        // Draw wave line
        this.ctx.strokeStyle = '#0066CC';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        
        this.particles.forEach((particle, index) => {
            if (index === 0) {
                this.ctx.moveTo(particle.x, particle.y);
            } else {
                this.ctx.lineTo(particle.x, particle.y);
            }
        });
        this.ctx.stroke();
        
        // Draw particles
        this.particles.forEach(particle => {
            const velocity = Math.sqrt(particle.vx * particle.vx + particle.vy * particle.vy);
            const intensity = Math.min(velocity * 100, 1);
            
            // Color based on velocity
            const hue = 200 + intensity * 60;
            const color = `hsl(${hue}, 80%, 60%)`;
            
            this.ctx.fillStyle = color;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Add glow for fast particles
            if (intensity > 0.5) {
                this.ctx.shadowColor = color;
                this.ctx.shadowBlur = 8;
                this.ctx.fillStyle = color;
                this.ctx.beginPath();
                this.ctx.arc(particle.x, particle.y, particle.size + 2, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.shadowBlur = 0;
            }
        });
        

    }
    
    drawLongitudinalWave() {
        // Draw air molecules as particles with enhanced pressure visualization
        this.particles.forEach(particle => {
            const pressure = particle.pressure;
            const intensity = Math.abs(pressure);
            
            // Color based on pressure (orange for high, cyan for low)
            let color;
            if (pressure > 0) {
                // High pressure (compression) - subtle orange
                color = `hsl(30, 80%, 60%)`;
            } else {
                // Low pressure (rarefaction) - subtle cyan
                color = `hsl(180, 60%, 60%)`;
            }
            
            // Draw particle with size based on pressure
            const particleSize = particle.size + intensity * 5;
            this.ctx.fillStyle = color;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particleSize, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Add glow effect for high pressure particles
            if (intensity > 0.5) {
                this.ctx.shadowColor = color;
                this.ctx.shadowBlur = 8;
                this.ctx.fillStyle = color;
                this.ctx.beginPath();
                this.ctx.arc(particle.x, particle.y, particleSize + 2, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.shadowBlur = 0;
            }
            
            // Add pressure indicator arrows
            if (this.showPressure && intensity > 0.2) {
                this.ctx.strokeStyle = color;
                this.ctx.lineWidth = 3;
                this.ctx.beginPath();
                
                if (pressure > 0) {
                    // Compression arrows pointing inward
                    this.ctx.moveTo(particle.x - 15, particle.y);
                    this.ctx.lineTo(particle.x - 5, particle.y);
                    this.ctx.moveTo(particle.x + 5, particle.y);
                    this.ctx.lineTo(particle.x + 15, particle.y);
                } else {
                    // Rarefaction arrows pointing outward
                    this.ctx.moveTo(particle.x - 5, particle.y);
                    this.ctx.lineTo(particle.x - 15, particle.y);
                    this.ctx.moveTo(particle.x + 15, particle.y);
                    this.ctx.lineTo(particle.x + 5, particle.y);
                }
                this.ctx.stroke();
            }
        });
        
        // Draw pressure zones
        if (this.showPressure) {
            this.drawPressureZones();
        }
    }
    
    drawCombinedWave() {
        // Draw transverse wave as the main wave
        this.drawTransverseWave();
        
        // Draw longitudinal components as pressure indicators
        if (this.showPressure) {
            this.drawPressureZones();
        }
        
        // Draw longitudinal particles as small indicators
        this.particles.forEach(particle => {
            const pressure = particle.pressure;
            const intensity = Math.abs(pressure);
            
            if (intensity > 0.3) {
                // Color based on pressure (red for high, blue for low)
                let color;
                if (pressure > 0) {
                    color = `hsl(0, 80%, 60%)`; // Red for compression
                } else {
                    color = `hsl(240, 80%, 60%)`; // Blue for rarefaction
                }
                
                this.ctx.fillStyle = color;
                this.ctx.beginPath();
                this.ctx.arc(particle.x, particle.y + 30, 3, 0, Math.PI * 2);
                this.ctx.fill();
            }
        });
    }
    
    drawPressureZones() {
        // Draw pressure zones that move with the wave - using more subtle colors
        const wavelength = this.waveSpeed / this.frequency;
        const waveSpeed = this.waveSpeed;
        const frequency = this.frequency;
        
        // Calculate wave position based on time
        const wavePosition = (this.time * 0.001 * waveSpeed) % wavelength;
        
        // Draw compression and rarefaction zones that move with the wave - only between source and receiver
        const zoneHeight = 80; // Reduced height for pressure zones
        const zoneY = this.sourceY - zoneHeight / 2; // Center zones vertically on the wave path
        
        for (let x = this.sourceX; x <= this.receiverX; x += wavelength / 4) {
            const relativeX = (x - wavePosition) % wavelength;
            const phase = (2 * Math.PI * relativeX) / wavelength;
            const pressure = Math.sin(phase);
            
            if (pressure > 0.5) {
                // High pressure zone (compression) - subtle orange/amber
                this.ctx.fillStyle = 'rgba(255, 165, 0, 0.2)';
                this.ctx.fillRect(x, zoneY, wavelength / 4, zoneHeight);
                
                // Add subtle border
                this.ctx.strokeStyle = 'rgba(255, 165, 0, 0.3)';
                this.ctx.lineWidth = 1;
                this.ctx.strokeRect(x, zoneY, wavelength / 4, zoneHeight);
                
                // Add subtle compression label
                this.ctx.fillStyle = 'rgba(255, 165, 0, 0.7)';
                this.ctx.font = '10px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText('C', x + wavelength / 8, zoneY + 15);
            } else if (pressure < -0.5) {
                // Low pressure zone (rarefaction) - subtle cyan/teal
                this.ctx.fillStyle = 'rgba(0, 128, 128, 0.2)';
                this.ctx.fillRect(x, zoneY, wavelength / 4, zoneHeight);
                
                // Add subtle border
                this.ctx.strokeStyle = 'rgba(0, 128, 128, 0.3)';
                this.ctx.lineWidth = 1;
                this.ctx.strokeRect(x, zoneY, wavelength / 4, zoneHeight);
                
                // Add subtle rarefaction label
                this.ctx.fillStyle = 'rgba(0, 128, 128, 0.7)';
                this.ctx.font = '10px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText('R', x + wavelength / 8, zoneY + 15);
            }
        }
        

    }
    
        
    drawSourceAndReceiver() {
        // Draw clickable area indicator (for debugging)
        this.ctx.strokeStyle = 'rgba(255, 255, 0, 0.3)';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(this.sourceX, this.sourceY, 50, 0, Math.PI * 2);
        this.ctx.stroke();
        
        // Draw source (speaker/microphone)
        this.ctx.fillStyle = this.sourceActive ? '#FF6B6B' : '#666666';
        this.ctx.beginPath();
        this.ctx.arc(this.sourceX, this.sourceY, 25, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Add speaker cone effect when active
        if (this.sourceActive) {
            this.ctx.strokeStyle = '#FF6B6B';
            this.ctx.lineWidth = 3;
            this.ctx.beginPath();
            this.ctx.arc(this.sourceX, this.sourceY, 35, 0, Math.PI * 2);
            this.ctx.stroke();
            
            // Add pulsing effect
            const pulse = Math.sin(this.time * 0.01) * 0.3 + 0.7;
            this.ctx.fillStyle = `rgba(255, 107, 107, ${pulse * 0.3})`;
            this.ctx.beginPath();
            this.ctx.arc(this.sourceX, this.sourceY, 40, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        // Draw receiver (ear/microphone)
        this.ctx.fillStyle = '#4ECDC4';
        this.ctx.beginPath();
        this.ctx.arc(this.receiverX, this.receiverY, 20, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Add receiver cone
        this.ctx.strokeStyle = '#4ECDC4';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(this.receiverX, this.receiverY, 30, 0, Math.PI * 2);
        this.ctx.stroke();
        
        // Draw labels with improved styling
        // Add text shadow for better visibility
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
        this.ctx.shadowBlur = 3;
        this.ctx.shadowOffsetX = 1;
        this.ctx.shadowOffsetY = 1;
        
        // Source label
        this.ctx.fillStyle = '#FF6B6B'; // Match source color
        this.ctx.font = 'bold 16px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('🎤 Source', this.sourceX, this.sourceY + 50);
        
        // Receiver label
        this.ctx.fillStyle = '#4ECDC4'; // Match receiver color
        this.ctx.fillText('👂 Receiver', this.receiverX, this.receiverY + 50);
        
        // Reset shadow
        this.ctx.shadowBlur = 0;
        this.ctx.shadowOffsetX = 0;
        this.ctx.shadowOffsetY = 0;
        
        // Draw wave direction arrow
        this.ctx.strokeStyle = '#FFD93D';
        this.ctx.lineWidth = 3;
        this.ctx.setLineDash([10, 5]);
        this.ctx.beginPath();
        this.ctx.moveTo(this.sourceX + 40, this.sourceY);
        this.ctx.lineTo(this.receiverX - 30, this.receiverY);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
        
        // Add arrowhead
        this.ctx.fillStyle = '#FFD93D';
        this.ctx.beginPath();
        this.ctx.moveTo(this.receiverX - 30, this.receiverY);
        this.ctx.lineTo(this.receiverX - 40, this.receiverY - 5);
        this.ctx.lineTo(this.receiverX - 40, this.receiverY + 5);
        this.ctx.closePath();
        this.ctx.fill();
    }
    
    drawSoundInfo() {
        // Simple info panel
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(10, 10, 320, 180);
        
        this.ctx.fillStyle = 'white';
        this.ctx.font = 'bold 16px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText('🎵 Sound Wave Properties', 20, 30);
        
        this.ctx.font = '14px Arial';
        this.ctx.fillText(`Frequency: ${this.frequency} Hz`, 20, 50);
        this.ctx.fillText(`Wavelength: ${(this.waveSpeed / this.frequency).toFixed(1)} m`, 20, 70);
        this.ctx.fillText(`Wave Speed: ${this.waveSpeed} m/s`, 20, 90);
        // Calculate the actual visual speed being used
        const totalDistance = this.receiverX - this.sourceX;
        const pulseDuration = 5.0; // Default pulse duration
        const visualSpeed = totalDistance / pulseDuration;
        this.ctx.fillText(`Visual Speed: ${visualSpeed.toFixed(1)} px/s`, 20, 110);
        this.ctx.fillText(`Amplitude: ${this.amplitude}%`, 20, 130);
        this.ctx.fillText(`Wave Type: ${this.waveType}`, 20, 150);
        this.ctx.fillText(`Particles: ${this.particleCount}`, 20, 170);
    }
    
    drawRealWorldAnalogy() {
        // Simple analogy panel
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(this.ctx.canvas.width - 280, 10, 270, 140);
        
        this.ctx.fillStyle = 'white';
        this.ctx.font = 'bold 14px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText('💡 Real-World Examples:', this.ctx.canvas.width - 270, 30);
        
        this.ctx.font = '12px Arial';
        if (this.waveType === 'transverse') {
            this.ctx.fillText('🎸 Guitar/violin strings', this.ctx.canvas.width - 270, 50);
            this.ctx.fillText('🌊 Ocean surface waves', this.ctx.canvas.width - 270, 70);
            this.ctx.fillText('📡 Electromagnetic waves', this.ctx.canvas.width - 270, 90);
            this.ctx.fillText('🎪 Jump rope motion', this.ctx.canvas.width - 270, 110);
        } else if (this.waveType === 'longitudinal') {
            this.ctx.fillText('🔊 Sound waves in air', this.ctx.canvas.width - 270, 50);
            this.ctx.fillText('🎤 Speaker diaphragm', this.ctx.canvas.width - 270, 70);
            this.ctx.fillText('💨 Air compression waves', this.ctx.canvas.width - 270, 90);
            this.ctx.fillText('🌊 Seismic P-waves', this.ctx.canvas.width - 270, 110);
        } else {
            this.ctx.fillText('🎵 Complex wave patterns', this.ctx.canvas.width - 270, 50);
            this.ctx.fillText('🔊 Multiple wave types', this.ctx.canvas.width - 270, 70);
            this.ctx.fillText('📡 Combined phenomena', this.ctx.canvas.width - 270, 90);
            this.ctx.fillText('🎼 Musical instruments', this.ctx.canvas.width - 270, 110);
        }
    }
    
    getStats() {
        return {
            waveType: this.waveType,
            frequency: this.frequency,
            wavelength: this.waveSpeed / this.frequency,
            waveSpeed: this.waveSpeed,
            amplitude: this.amplitude,
            particleCount: this.particleCount,
            time: this.time
        };
    }
}