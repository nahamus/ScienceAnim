
// Wave Propagation Simulation
import { BaseAnimation } from './base-animation.js';

export class WavePropagation extends BaseAnimation {
    constructor(ctx) {
        super(ctx);
        this.animationType = 'wave-propagation';
        this.waveType = 'transverse';
        this.speed = 1;
        this.frequency = 1;
        this.amplitude = 50;
        this.wavelength = 150;
        this.showAnalytics = false;
        this.particles = [];
        this.waveSpeed = 0; // Calculated from frequency and wavelength
        this.energy = 0; // Wave energy
        
        this.initializeParticles();
        this.calculateWaveParameters();
    }
    
    initializeParticles() {
        this.particles = [];
        const particleCount = 80; // Reduced particles for cleaner visualization
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
        
        // Don't reset parameters - keep current values
        // Just reinitialize particles with new wave type and restart time
        this.time = 0;
        this.initializeParticles();
        
        // Recalculate wave parameters
        this.calculateWaveParameters();
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
        // Don't call super.update() to avoid double time increment
        // Use deltaTime directly - speed multiplier is already applied by main controller
        const dt = (deltaTime / 1000) * this.speed;
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
        // Draw wavelength markers with half-pixel alignment for crisp lines
        this.ctx.strokeStyle = 'rgba(100, 100, 100, 0.3)';
        this.ctx.lineWidth = 1;
        this.ctx.lineCap = 'butt';
        this.ctx.setLineDash([5, 5]);
        for (let x = 0; x < this.ctx.canvas.width; x += this.wavelength) {
            const px = Math.round(x) + 0.5;
            this.ctx.beginPath();
            this.ctx.moveTo(px, 0.5);
            this.ctx.lineTo(px, this.ctx.canvas.height - 0.5);
            this.ctx.stroke();
        }
        this.ctx.setLineDash([]);
        // Draw amplitude markers
        const centerY = this.ctx.canvas.height / 2;
        this.ctx.strokeStyle = 'rgba(100, 100, 100, 0.2)';
        this.ctx.lineWidth = 1;
        for (let y = centerY - this.amplitude; y <= centerY + this.amplitude; y += this.amplitude / 2) {
            const py = Math.round(y) + 0.5;
            this.ctx.beginPath();
            this.ctx.moveTo(0.5, py);
            this.ctx.lineTo(this.ctx.canvas.width - 0.5, py);
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
        this.ctx.lineWidth = 3;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        
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
    }
    
    drawLongitudinalWaveform() {
        if (this.particles.length < 2) return;
        
        const centerY = this.ctx.canvas.height / 2;
        const springRadius = 20;
        
        // Draw a slinky-like spring with multiple coils
        this.ctx.strokeStyle = '#667eea';
        this.ctx.lineWidth = 3;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        
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
        
        // Draw wave direction arrows
        this.drawLongitudinalWaveDirection();
    }
    
    drawLongitudinalWaveDirection() {
        const centerY = this.ctx.canvas.height / 2;
        const waveSpeed = this.frequency * this.wavelength;
        const arrowX = 50 + (this.time * waveSpeed * 0.1) % 100;
        
        const y = Math.round(centerY) + 0.5;
        const ax = Math.round(arrowX) + 0.5;

        // Draw horizontal arrow (crisp)
        this.ctx.beginPath();
        this.ctx.strokeStyle = '#ff6b6b';
        this.ctx.lineWidth = 2;
        this.ctx.lineCap = 'round';
        this.ctx.moveTo(ax, y);
        this.ctx.lineTo(ax + 30, y);
        this.ctx.stroke();
        
        // Arrowhead
        this.ctx.beginPath();
        this.ctx.fillStyle = '#ff6b6b';
        this.ctx.moveTo(ax + 30.5, y);
        this.ctx.lineTo(ax + 25.5, y - 5);
        this.ctx.lineTo(ax + 25.5, y + 5);
        this.ctx.closePath();
        this.ctx.fill();
    }
    
    drawCanvasLabels() {
        const waveTypeLabel = this.waveType.charAt(0).toUpperCase() + this.waveType.slice(1) + ' Wave';
        this.drawLabels(
            waveTypeLabel,
            `v = f×λ = ${this.waveSpeed.toFixed(1)} px/s  |  y = A sin(2π(ft-x/λ))  |  E ∝ A²f²`
        );
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
            
            // Draw crisp particle using rect aligned to pixel grid for sharper look
            const px = Math.round(particle.x) + 0.5;
            const py = Math.round(particle.y) + 0.5;
            this.ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
            this.ctx.beginPath();
            this.ctx.arc(px, py, particleSize, 0, Math.PI * 2);
            this.ctx.fill();
            // Thin stroke for definition
            this.ctx.strokeStyle = 'rgba(255,255,255,0.9)';
            this.ctx.lineWidth = 0.75;
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

                const sx = Math.round(particle.x) + 0.5;
                const sy = Math.round(particle.y) + 0.5;
                const ex = Math.round(endX) + 0.5;
                const ey = Math.round(endY) + 0.5;
                
                this.ctx.beginPath();
                this.ctx.strokeStyle = '#ff6b6b';
                this.ctx.lineWidth = 1.5;
                this.ctx.lineCap = 'round';
                this.ctx.moveTo(sx, sy);
                this.ctx.lineTo(ex, ey);
                this.ctx.stroke();
                
                // Arrowhead
                const angle = Math.atan2(particle.vy, particle.vx);
                this.ctx.beginPath();
                this.ctx.fillStyle = '#ff6b6b';
                this.ctx.moveTo(ex, ey);
                this.ctx.lineTo(ex - 6 * Math.cos(angle - Math.PI / 6), ey - 6 * Math.sin(angle - Math.PI / 6));
                this.ctx.lineTo(ex - 6 * Math.cos(angle + Math.PI / 6), ey - 6 * Math.sin(angle + Math.PI / 6));
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

            const y = 50.5;
            const ax = Math.round(arrowX) + 0.5;
            
            this.ctx.beginPath();
            this.ctx.strokeStyle = '#ff6b6b';
            this.ctx.lineWidth = 2;
            this.ctx.lineCap = 'round';
            this.ctx.moveTo(ax, y);
            this.ctx.lineTo(ax + 20, y);
            this.ctx.stroke();
            
            // Arrowhead
            this.ctx.beginPath();
            this.ctx.fillStyle = '#ff6b6b';
            this.ctx.moveTo(ax + 20.5, y);
            this.ctx.lineTo(ax + 15.5, y - 5);
            this.ctx.lineTo(ax + 15.5, y + 5);
            this.ctx.closePath();
            this.ctx.fill();
        }
    }
    
    drawWaveInfo() {
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
        this.ctx.shadowBlur = 2;
        this.ctx.font = '14px Inter';
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
        
        // Reset shadow
        this.ctx.shadowBlur = 0;
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
export class SoundWaves extends BaseAnimation {
    constructor(ctx) {
        super(ctx);
        this.animationType = 'wave-propagation';
        this.particles = [];
        this.frequency = 2; // Hz (even lower frequency for easier observation)
        this.amplitude = 50; // Percentage
        this.waveSpeed = 343; // m/s (speed of sound in air)
        this.particleCount = 80; // Much more particles for dense wave visualization
        this.waveType = 'transverse'; // 'transverse', 'longitudinal', 'combined'
        this.showPressure = true;
        this.animationSpeed = 1.0;
        
        // Source and receiver properties
        this.sourceX = 100;
        this.sourceY = this.ctx.canvas.height / 2;
        this.receiverX = this.ctx.canvas.width - 100;
        this.receiverY = this.ctx.canvas.height / 2;
        this.showSourceReceiver = true;
        this.sourceActive = true;
        this.pulses = [];
        this.pulseDuration = 15; // much longer duration to ensure wave reaches receiver
        
        // Control button properties - using standardized controls from BaseAnimation
        
        this.initializeParticles();
        
        // Musical note frequencies (Hz)
        this.musicalNotes = {
            'C4': 261.63,
            'D4': 293.66,
            'E4': 329.63,
            'F4': 349.23,
            'G4': 392.00,
            'A4': 440.00,
            'B4': 493.88,
            'C5': 523.25
        };
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
                size: 2 + Math.random() * 1,
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
    
    setMusicalNote(note) {
        if (this.musicalNotes[note]) {
            this.frequency = this.musicalNotes[note];
        }
    }
    
    setInstrumentPreset(instrument) {
        switch (instrument) {
            case 'guitar':
                this.frequency = 82.41; // Low E string
                this.amplitude = 60;
                this.waveType = 'transverse';
                break;
            case 'piano':
                this.frequency = 440.00; // A4
                this.amplitude = 70;
                this.waveType = 'transverse';
                break;
            case 'flute':
                this.frequency = 523.25; // C5
                this.amplitude = 50;
                this.waveType = 'longitudinal';
                break;
            case 'drum':
                this.frequency = 100; // Low frequency
                this.amplitude = 80;
                this.waveType = 'combined';
                break;
        }
    }
    
    triggerWavePulse() {
        const pulse = {
            startTime: this.time, // Use animation time instead of Date.now()
            duration: 20.0, // 20 seconds in animation time - much longer to reach receiver
            active: true
        };
        this.pulses.push(pulse);
    }
    
    reset() {
        this.time = 0;
        this.pulses = [];
        this.initializeParticles();
        super.reset(); // Call parent reset to handle standardized controls
    }
    
    update(deltaTime) {
        super.update(deltaTime); // Call parent update to handle standardized controls
        
        this.time += deltaTime * this.animationSpeed;
        
        // Automatically trigger wave pulses when animation is playing
        if (this.isPlaying && this.pulses.length === 0) {
            this.triggerWavePulse();
        }
        
        // Update pulses - remove expired ones
        this.pulses = this.pulses.filter(pulse => {
            const elapsed = (this.time - pulse.startTime) / 1000; // Convert to seconds
            return elapsed < pulse.duration;
        });
        
        const wavelength = (this.waveSpeed / this.frequency) * 0.3; // Scale down for better visualization
        const angularFrequency = 2 * Math.PI * this.frequency;
        const amplitude = (this.amplitude / 100) * 60; // Moderate amplitude for clear wave pattern
        
        this.particles.forEach((particle, index) => {
            // Check if any pulse is active
            let waveActive = false;
            let wavePhase = 0;
            let isInWavePacket = false;
            let wavePacketStart = 0;
            let wavePacketLength = 150;
            let elapsed = 0;
            
            this.pulses.forEach(pulse => {
                elapsed = (this.time - pulse.startTime) / 1000; // Convert to seconds
                
                // Check if pulse is active
                if (elapsed >= 0 && elapsed <= pulse.duration) {
                    waveActive = true;
                    
                    // Calculate wave packet properties - make it much more visible
                    wavePacketLength = 150; // Fixed length in pixels for better visibility
                    const waveFrontPosition = this.sourceX + (elapsed * this.waveSpeed * 0.1); // Slower wave front position
                    
                    // Check if wave has reached the receiver for collapsing effect
                    const hasReachedReceiver = waveFrontPosition >= this.receiverX;
                    
                    let wavePacketEnd;
                    if (hasReachedReceiver) {
                        // Wave collapsing effect: trailing edge extends to receiver
                        wavePacketStart = Math.max(this.sourceX - 50, waveFrontPosition - wavePacketLength) + 100;
                        wavePacketEnd = this.receiverX; // Trailing edge goes all the way to receiver
                    } else {
                        // Normal wave packet - allow it to reach the receiver
                        wavePacketStart = Math.max(this.sourceX - 50, waveFrontPosition - wavePacketLength) + 100;
                        wavePacketEnd = Math.min(this.receiverX, waveFrontPosition) + 100;
                    }
                    
                    // Check if particle is within the wave packet
                    if (particle.originalX >= wavePacketStart && particle.originalX <= wavePacketEnd) {
                        isInWavePacket = true;
                        
                        // Calculate phase within the wave packet
                        const positionInPacket = (particle.originalX - wavePacketStart) / wavePacketLength;
                        const wavePosition = positionInPacket * 3; // 3 wavelengths in the packet for better visibility
                        const timePhase = elapsed * this.frequency * 2 * Math.PI;
                        wavePhase = wavePosition * 2 * Math.PI - timePhase;
                    }
                }
            });
            
            if (waveActive && isInWavePacket) {
                // Update particle trail history
                if (!particle.trail) particle.trail = [];
                particle.trail.push({ x: particle.x, y: particle.y });
                if (particle.trail.length > 8) {
                    particle.trail.shift();
                }
                
                // Wave motion within the packet
                if (this.waveType === 'transverse' || this.waveType === 'combined') {
                    // Transverse wave motion - create proper sinusoidal wave pattern
                    particle.x = particle.originalX;
                    
                    // Create sinusoidal wave with proper phase relationship
                    const wavePosition = (particle.originalX - wavePacketStart) / wavePacketLength;
                    const spatialPhase = wavePosition * 3 * 2 * Math.PI; // 3 wavelengths in packet
                    const temporalPhase = elapsed * this.frequency * 2 * Math.PI;
                    const totalPhase = spatialPhase - temporalPhase;
                    
                    particle.y = particle.originalY + amplitude * Math.sin(totalPhase);
                    particle.vy = amplitude * angularFrequency * Math.cos(totalPhase) * 0.1; // Slower motion
                    particle.vx = 0;
                }
                
                if (this.waveType === 'longitudinal' || this.waveType === 'combined') {
                    // Longitudinal wave motion - create proper compression/rarefaction pattern
                    particle.y = particle.originalY;
                    
                    // Create sinusoidal wave with proper phase relationship for longitudinal waves
                    const wavePosition = (particle.originalX - wavePacketStart) / wavePacketLength;
                    const spatialPhase = wavePosition * 3 * 2 * Math.PI; // 3 wavelengths in packet
                    const temporalPhase = elapsed * this.frequency * 2 * Math.PI;
                    const totalPhase = spatialPhase - temporalPhase;
                    
                    // Horizontal displacement for compression/rarefaction
                    particle.x = particle.originalX + amplitude * 0.4 * Math.sin(totalPhase);
                    particle.vx = amplitude * 0.4 * angularFrequency * Math.cos(totalPhase) * 0.1; // Slower motion
                    particle.vy = 0;
                    
                    // Calculate pressure for compression/rarefaction visualization
                    particle.pressure = Math.sin(totalPhase);
                }
                
                } else {
                // Reset particle to original position when no wave packet is present
                particle.y = particle.originalY;
                particle.x = particle.originalX;
                particle.vy = 0;
                particle.vx = 0;
                particle.pressure = 0;
                particle.trail = []; // Clear trail when no wave
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
            // No wave is active - animation is paused
        }
        
        // Always show info panels
        this.drawSoundInfo();
        
        // Draw wave packet boundaries if wave is active
        this.drawWavePacketBoundaries();
        
    }
    
    drawBackground() {
        // Draw subtle gradient background
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.ctx.canvas.height);
        gradient.addColorStop(0, '#1a1a2e');
        gradient.addColorStop(1, '#16213e');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
        
        // Draw subtle wave direction indicators
        this.ctx.strokeStyle = 'rgba(100, 149, 237, 0.3)';
        this.ctx.lineWidth = 1;
        this.ctx.setLineDash([20, 10]);
        
        // Draw horizontal reference line
            this.ctx.beginPath();
        this.ctx.moveTo(this.sourceX, this.sourceY);
        this.ctx.lineTo(this.receiverX, this.receiverY);
            this.ctx.stroke();
        
        // Add wave direction arrows
        const arrowSpacing = 100;
        for (let x = this.sourceX + 50; x < this.receiverX - 50; x += arrowSpacing) {
            const y = this.sourceY;
            this.ctx.beginPath();
            this.ctx.moveTo(x, y - 5);
            this.ctx.lineTo(x + 15, y);
            this.ctx.lineTo(x, y + 5);
            this.ctx.stroke();
        }
        
        this.ctx.setLineDash([]);
    }
    
    drawTransverseWave() {
        // Draw particle trails first (behind particles)
        this.particles.forEach(particle => {
            if (particle.trail && particle.trail.length > 1) {
        this.ctx.beginPath();
                this.ctx.moveTo(particle.trail[0].x, particle.trail[0].y);
                for (let i = 1; i < particle.trail.length; i++) {
                    this.ctx.lineTo(particle.trail[i].x, particle.trail[i].y);
                }
                this.ctx.strokeStyle = `rgba(100, 149, 237, ${0.4 * (particle.trail.length / 8)})`;
                this.ctx.lineWidth = 2;
                this.ctx.lineCap = 'round';
                this.ctx.lineJoin = 'round';
                this.ctx.stroke();
            }
        });
        
        // Draw wave envelope
        this.ctx.strokeStyle = 'rgba(100, 149, 237, 0.8)';
        this.ctx.lineWidth = 3; // Moderate line thickness
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        this.ctx.beginPath();
        
        // Draw smooth curve through particles
        this.drawSmoothWave();
        this.ctx.stroke();
        
        // Add a subtle background line for depth
        this.ctx.strokeStyle = 'rgba(100, 149, 237, 0.3)';
        this.ctx.lineWidth = 6; // Background line
        this.ctx.beginPath();
        this.drawSmoothWave();
        this.ctx.stroke();
        
        // Draw larger, more visible particles
        this.particles.forEach(particle => {
            const velocity = Math.sqrt(particle.vx * particle.vx + particle.vy * particle.vy);
            const intensity = Math.min(velocity * 50, 1);
            
            // Color based on frequency and amplitude
            const frequencyHue = (this.frequency / 20) * 360; // Map frequency to hue
            const amplitudeSat = Math.min(this.amplitude / 50, 1) * 100; // Map amplitude to saturation
            const color = `hsl(${frequencyHue}, ${amplitudeSat}%, 70%)`;
            
            // Draw larger particle with glow effect
                this.ctx.shadowColor = color;
            this.ctx.shadowBlur = 6;
                this.ctx.fillStyle = color;
                this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size * (1 + intensity * 0.2), 0, Math.PI * 2); // Smaller particles
                this.ctx.fill();
            
            // Reset shadow
                this.ctx.shadowBlur = 0;
        });
    }
    
    drawLongitudinalWave() {
        // Draw wave envelope for longitudinal waves
        this.ctx.strokeStyle = 'rgba(255, 100, 0, 0.8)';
        this.ctx.lineWidth = 3; // Moderate line thickness
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        this.ctx.beginPath();
        
        // Draw smooth curve through particles for longitudinal wave
        this.drawSmoothWave();
        this.ctx.stroke();
        
        // Add a subtle background line for depth
        this.ctx.strokeStyle = 'rgba(255, 100, 0, 0.3)';
        this.ctx.lineWidth = 6; // Background line
        this.ctx.beginPath();
        this.drawSmoothWave();
        this.ctx.stroke();
        
        // Draw particles with compression/rarefaction visualization
        this.particles.forEach(particle => {
            const pressure = particle.pressure || 0;
            const intensity = Math.abs(pressure);
            
            // Color based on pressure (red for compression, blue for rarefaction)
            let color;
            if (pressure > 0) {
                // High pressure (compression) - red
                color = `hsl(0, 80%, 60%)`;
            } else {
                // Low pressure (rarefaction) - blue
                color = `hsl(240, 80%, 60%)`;
            }
            
            // Draw particle with size based on pressure
            const particleSize = particle.size + intensity * 1.5;
            this.ctx.fillStyle = color;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particleSize, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Add compression/rarefaction indicators
            if (intensity > 0.3) {
                this.ctx.strokeStyle = color;
                this.ctx.lineWidth = 2;
                this.ctx.beginPath();
                
                if (pressure > 0) {
                    // Compression - particles closer together
                    this.ctx.moveTo(particle.x - 8, particle.y - 5);
                    this.ctx.lineTo(particle.x - 8, particle.y + 5);
                    this.ctx.moveTo(particle.x + 8, particle.y - 5);
                    this.ctx.lineTo(particle.x + 8, particle.y + 5);
                } else {
                    // Rarefaction - particles farther apart
                    this.ctx.moveTo(particle.x - 12, particle.y - 3);
                    this.ctx.lineTo(particle.x - 12, particle.y + 3);
                    this.ctx.moveTo(particle.x + 12, particle.y - 3);
                    this.ctx.lineTo(particle.x + 12, particle.y + 3);
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
        // Compact info panel
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(10, 10, 200, 60);
        
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 12px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText('🔊 Sound Wave', 20, 25);
        
        this.ctx.font = '11px Arial';
        this.ctx.fillText(`${this.waveType} • ${this.frequency}Hz • ${this.amplitude}%`, 20, 40);
        this.ctx.fillText(`λ: ${(this.waveSpeed / this.frequency).toFixed(1)}m • v: ${this.waveSpeed}m/s`, 20, 55);
    }
    
    drawSmoothWave() {
        // Draw smooth curve through particles using quadratic Bezier curves
        const particles = this.particles.filter(p => p.x > 0 && p.y > 0); // Filter out hidden particles
        
        if (particles.length < 2) return;
        
        // Start at first particle
        this.ctx.moveTo(particles[0].x, particles[0].y);
        
        // Draw smooth curve through remaining particles
        for (let i = 1; i < particles.length - 1; i++) {
            const current = particles[i];
            const next = particles[i + 1];
            
            // Calculate control point for smooth curve
            const cp1x = current.x + (next.x - particles[i - 1].x) * 0.2;
            const cp1y = current.y + (next.y - particles[i - 1].y) * 0.2;
            
            // Use quadratic curve for smooth interpolation
            this.ctx.quadraticCurveTo(cp1x, cp1y, (current.x + next.x) / 2, (current.y + next.y) / 2);
        }
        
        // End at last particle
        if (particles.length > 1) {
            this.ctx.lineTo(particles[particles.length - 1].x, particles[particles.length - 1].y);
        }
    }
    
    
    drawWavePacketBoundaries() {
        // Draw wave packet boundaries if wave is active
        this.pulses.forEach(pulse => {
            const elapsed = (this.time - pulse.startTime) / 1000;
            
            if (elapsed >= 0 && elapsed <= pulse.duration) {
                const wavePacketLength = 150; // Fixed length in pixels for better visibility
                const waveFrontPosition = this.sourceX + (elapsed * this.waveSpeed * 0.1);
                
                // Check if wave has reached the receiver for collapsing effect
                const hasReachedReceiver = waveFrontPosition >= this.receiverX;
                
                let wavePacketStart, wavePacketEnd;
                if (hasReachedReceiver) {
                    // Wave collapsing effect: trailing edge extends to receiver
                    wavePacketStart = Math.max(this.sourceX - 50, waveFrontPosition - wavePacketLength) + 100;
                    wavePacketEnd = this.receiverX; // Trailing edge goes all the way to receiver
        } else {
                    // Normal wave packet - allow it to reach the receiver
                    wavePacketStart = Math.max(this.sourceX - 50, waveFrontPosition - wavePacketLength) + 100;
                    wavePacketEnd = Math.min(this.receiverX, waveFrontPosition) + 100;
                }
                
                // Draw wave packet boundaries - make them more prominent
                this.ctx.strokeStyle = 'rgba(255, 255, 0, 0.9)';
                this.ctx.lineWidth = 3;
                this.ctx.setLineDash([8, 4]);
                
                // Leading edge (wave front)
                this.ctx.beginPath();
                this.ctx.moveTo(wavePacketEnd, this.sourceY - 50);
                this.ctx.lineTo(wavePacketEnd, this.sourceY + 50);
                this.ctx.stroke();
                
                // Trailing edge
                this.ctx.beginPath();
                this.ctx.moveTo(wavePacketStart, this.sourceY - 50);
                this.ctx.lineTo(wavePacketStart, this.sourceY + 50);
                this.ctx.stroke();
                
                // Wave packet label
                this.ctx.fillStyle = 'rgba(255, 255, 0, 0.8)';
                this.ctx.font = 'bold 10px Arial';
                this.ctx.textAlign = 'center';
                if (hasReachedReceiver) {
                    this.ctx.fillText('Wave Collapsing', (wavePacketStart + wavePacketEnd) / 2, this.sourceY - 40);
                } else {
                    this.ctx.fillText('Wave Packet', (wavePacketStart + wavePacketEnd) / 2, this.sourceY - 40);
                }
                
                this.ctx.setLineDash([]);
            }
        });
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