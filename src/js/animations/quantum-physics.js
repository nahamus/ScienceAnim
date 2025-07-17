
export class WaveParticleDuality {
    constructor(ctx) {
        this.ctx = ctx;
        this.canvas = ctx.canvas;
        
        // Quantum properties
        this.mode = 'wave'; // 'wave', 'particle', 'superposition', 'measurement'
        this.photonEnergy = 5.0; // eV
        this.wavelength = 150; // nm
        this.speed = 1.0;
        this.time = 0;
        
        // Wave function properties
        this.waveFunction = [];
        this.amplitude = 50;
        this.frequency = 1.0;
        this.phase = 0;
        this.wavePhase = 0;
        
        // Particle properties
        this.particleX = 100;
        this.particleY = 300;
        this.particleVelocity = { x: 8, y: 0 };
        this.particleSize = 8;
        
        // Interference properties
        this.slits = [
            { x: 400, y: 250, width: 20, height: 100 },
            { x: 400, y: 350, width: 20, height: 100 }
        ];
        this.interferencePattern = [];
        this.screenX = 600;
        
        // Measurement properties
        this.measurementCount = 0;
        this.measurementResults = [];
        this.showMeasurement = false;
        
        // Display options
        this.showWaveFunction = true;
        this.showParticlePosition = true;
        this.showInterference = true;
        this.showMeasurementEffect = false;

        
        this.initializeWaveFunction();
        this.initializeInterferencePattern();
    }
    
    setMode(mode) {
        this.mode = mode;
        this.reset();
    }
    
    setSpeed(speed) {
        this.speed = speed;
    }
    
    setPhotonEnergy(energy) {
        this.photonEnergy = energy;
        this.wavelength = 1240 / energy; // E = hc/λ, simplified
        this.initializeWaveFunction();
        this.initializeInterferencePattern();
    }
    
    setWavelength(wavelength) {
        this.wavelength = wavelength;
        this.photonEnergy = 1240 / wavelength; // E = hc/λ, simplified
        this.initializeWaveFunction();
        this.initializeInterferencePattern();
    }
    
    setShowWaveFunction(show) {
        this.showWaveFunction = show;
    }
    
    setShowParticlePosition(show) {
        this.showParticlePosition = show;
    }
    
    setShowInterference(show) {
        this.showInterference = show;
    }
    
    setShowMeasurementEffect(show) {
        this.showMeasurementEffect = show;
    }
    

    
    performMeasurement() {
        this.measurementCount++;
        this.showMeasurement = true;
        
        // Simulate measurement collapse
        if (this.mode === 'superposition') {
            const random = Math.random();
            if (random < 0.5) {
                this.mode = 'particle';
            } else {
                this.mode = 'wave';
            }
        }
        
        // Record measurement result
        this.measurementResults.push({
            time: this.time,
            mode: this.mode,
            position: { x: this.particleX, y: this.particleY }
        });
        
        // Force measurement effect to show regardless of checkbox
        this.showMeasurementEffect = true;
        
        setTimeout(() => {
            this.showMeasurement = false;
            this.showMeasurementEffect = false;
        }, 3000);
    }
    
    reset() {
        this.time = 0;
        this.phase = 0;
        this.wavePhase = 0;
        this.particleX = 100;
        this.particleY = 300;
        this.measurementCount = 0;
        this.measurementResults = [];
        this.showMeasurement = false;
        this.initializeWaveFunction();
        this.initializeInterferencePattern();
    }
    
    initializeWaveFunction() {
        this.waveFunction = [];
        const numPoints = 150;
        for (let i = 0; i < numPoints; i++) {
            const x = (i / numPoints) * this.canvas.width;
            
            // Create a clean sinusoidal wave function
            const wave = this.amplitude * Math.sin(2 * Math.PI * x / this.wavelength + this.phase);
            
            const y = this.canvas.height / 2 + wave;
            this.waveFunction.push({ x, y });
        }
    }
    
    initializeInterferencePattern() {
        this.interferencePattern = [];
        const screenHeight = 300; // Reduced to match new detection screen height
        const centerY = this.canvas.height / 2;
        
        // Define slit positions for vertical slits
        const slit1X = 390; // Center of left slit
        const slit2X = 410; // Center of right slit
        const slitY = 300;   // Y position of slits (center)
        const screenX = this.screenX;
        
        for (let y = 0; y < screenHeight; y += 8) {
            const screenY = centerY - screenHeight/2 + y;
            let intensity = 0;
            
            // Calculate path difference from each slit
            const distance1 = Math.sqrt(Math.pow(screenX - slit1X, 2) + Math.pow(screenY - slitY, 2));
            const distance2 = Math.sqrt(Math.pow(screenX - slit2X, 2) + Math.pow(screenY - slitY, 2));
            
            // Calculate phase difference
            const pathDifference = distance2 - distance1;
            const phaseDifference = 2 * Math.PI * pathDifference / this.wavelength;
            
            // Calculate interference intensity
            const amplitude1 = 1 / Math.sqrt(distance1);
            const amplitude2 = 1 / Math.sqrt(distance2);
            
            // Total amplitude with interference
            const totalAmplitude = amplitude1 + amplitude2 * Math.cos(phaseDifference);
            intensity = Math.abs(totalAmplitude);
            
            this.interferencePattern.push({
                x: screenX,
                y: screenY,
                intensity: intensity
            });
        }
    }
    
    update(deltaTime) {
        const dt = (deltaTime / 1000) * this.speed * 5; // Increased multiplier for better responsiveness
        this.time += dt;
        this.phase += dt * this.frequency;
        
        // Only update wave function when needed (not every frame)
        if (this.mode === 'wave' || this.mode === 'superposition') {
            // Update wave function points efficiently
            this.waveFunction.forEach((point, i) => {
                const x = point.x;
                
                // Check if wave is blocked by the barrier
                if (x >= 380 && x <= 420) {
                    // Inside barrier - wave is blocked except at slits
                    // Check if this x position corresponds to a slit
                    const slit1X = 390; // Left slit center
                    const slit2X = 410; // Right slit center
                    const slitWidth = 10;
                    
                    // Check if this x position is within either slit
                    const distanceFromSlit1 = Math.abs(x - slit1X);
                    const distanceFromSlit2 = Math.abs(x - slit2X);
                    
                    if (distanceFromSlit1 < slitWidth / 2 || distanceFromSlit2 < slitWidth / 2) {
                        // Wave passes through slit
                        const wave = this.amplitude * Math.sin(2 * Math.PI * x / this.wavelength - this.phase);
                        point.y = this.canvas.height / 2 + wave;
                    } else {
                        // Wave is blocked by barrier - make it invisible
                        point.y = -1000; // Move off-screen
                    }
                } else {
                    // Outside barrier - normal wave propagation
                    const wave = this.amplitude * Math.sin(2 * Math.PI * x / this.wavelength - this.phase);
                    point.y = this.canvas.height / 2 + wave;
                }
            });
        }
        
        // Update particle position with more realistic movement
        if (this.mode === 'particle' || this.mode === 'superposition') {
            this.particleX += this.particleVelocity.x * dt;
            
            // Add some vertical oscillation for particle
            this.particleY = 300 + Math.sin(this.time * 3) * 20;
            
            // Reset particle when it reaches the screen
            if (this.particleX > this.screenX - 50) {
                this.particleX = 100;
            }
        }
        
        // Only update interference pattern when needed and less frequently
        if (this.showInterference && (this.mode === 'wave' || this.mode === 'superposition')) {
            // Update interference pattern less frequently for better performance
            if (Math.floor(this.time * 10) % 3 === 0) { // Update every 3rd frame at 10fps
        this.initializeInterferencePattern();
            }
        }
        
        // Add wave propagation effect
        if (this.mode === 'wave' || this.mode === 'superposition') {
            this.wavePhase += dt * 2;
        }
    }
    
    render() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw background grid
        this.drawGrid();
        
        // Draw slits
        this.drawSlits();
        
        // Draw detection screen
        this.drawDetectionScreen();
        
        // Draw based on current mode
        switch (this.mode) {
            case 'wave':
                this.renderWaveMode();
                break;
            case 'particle':
                this.renderParticleMode();
                break;
            case 'superposition':
                this.renderSuperpositionMode();
                break;
            case 'measurement':
                this.renderMeasurementMode();
                break;
        }
        
        // Draw interference pattern (only if enabled and in wave/superposition modes)
        if (this.showInterference && (this.mode === 'wave' || this.mode === 'superposition')) {
            this.drawInterferencePattern();
        }
        
        // Draw measurement effect
        if (this.showMeasurement) {
            this.drawMeasurementEffect();
        }
        
        // Draw canvas labels
        this.drawQuantumLabels();
        
        // Draw descriptive labels
        this.drawDescriptiveLabels();
    }
    
    drawGrid() {
        // Draw a very subtle grid for reference
        this.ctx.strokeStyle = 'rgba(100, 100, 100, 0.1)';
        this.ctx.lineWidth = 0.5;
        
        // Vertical lines (less frequent)
        for (let x = 0; x < this.canvas.width; x += 100) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }
        
        // Horizontal lines (less frequent)
        for (let y = 0; y < this.canvas.height; y += 100) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }
    }
    
    drawSlits() {
        // Draw main barrier with gradient for depth
        const gradient = this.ctx.createLinearGradient(380, 0, 420, 0);
        gradient.addColorStop(0, '#2c3e50');
        gradient.addColorStop(0.5, '#34495e');
        gradient.addColorStop(1, '#2c3e50');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(380, 0, 40, this.canvas.height);
        
        // Add subtle shadow for depth
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        this.ctx.shadowBlur = 4;
        this.ctx.shadowOffsetX = 2;
        this.ctx.fillRect(380, 0, 40, this.canvas.height);
        this.ctx.shadowBlur = 0;
        this.ctx.shadowOffsetX = 0;
        
        // Cut out vertical slits with rounded corners
        this.ctx.clearRect(385, 200, 10, 200); // Left slit
        this.ctx.clearRect(405, 200, 10, 200); // Right slit
        
        // Draw sharp slit borders with better contrast
        this.ctx.strokeStyle = '#1a1a1a';
        this.ctx.lineWidth = 3;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        
        // Left slit border
        this.ctx.beginPath();
        this.ctx.moveTo(385, 200);
        this.ctx.lineTo(385, 400);
        this.ctx.stroke();
        this.ctx.beginPath();
        this.ctx.moveTo(395, 200);
        this.ctx.lineTo(395, 400);
        this.ctx.stroke();
        
        // Right slit border
        this.ctx.beginPath();
        this.ctx.moveTo(405, 200);
        this.ctx.lineTo(405, 400);
        this.ctx.stroke();
        this.ctx.beginPath();
        this.ctx.moveTo(415, 200);
        this.ctx.lineTo(415, 400);
        this.ctx.stroke();
        
        // Add inner highlight for slit edges
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.moveTo(386, 200);
        this.ctx.lineTo(386, 400);
        this.ctx.stroke();
        this.ctx.beginPath();
        this.ctx.moveTo(414, 200);
        this.ctx.lineTo(414, 400);
        this.ctx.stroke();
        
        // Add barrier label
        this.ctx.fillStyle = '#2c3e50';
        this.ctx.font = 'bold 12px Arial';
        this.ctx.textRenderingOptimization = 'optimizeLegibility';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Barrier', 400, 190);
        
        // Add arrows showing wave approach with improved styling
        this.ctx.strokeStyle = '#4CAF50';
        this.ctx.lineWidth = 3;
        this.ctx.lineCap = 'round';
        this.ctx.beginPath();
        this.ctx.moveTo(350, 300);
        this.ctx.lineTo(380, 300);
        this.ctx.stroke();
        
        // Arrow head with better shape
        this.ctx.beginPath();
        this.ctx.moveTo(375, 295);
        this.ctx.lineTo(380, 300);
        this.ctx.lineTo(375, 305);
        this.ctx.closePath();
        this.ctx.fillStyle = '#4CAF50';
        this.ctx.fill();
        
        // Add arrow label
        this.ctx.fillStyle = '#4CAF50';
        this.ctx.font = 'bold 10px Arial';
        this.ctx.textRenderingOptimization = 'optimizeLegibility';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Wave', 365, 290);
    }
    
    drawDetectionScreen() {
        // Draw detection screen with reduced height to make more space
        const pulse = Math.sin(this.time * 2) * 0.3 + 0.7;
        this.ctx.fillStyle = `rgba(200, 200, 255, ${0.6 * pulse})`;
        this.ctx.fillRect(this.screenX - 8, 150, 16, 300);
        
        // Draw screen border
        this.ctx.strokeStyle = '#0066cc';
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(this.screenX - 8, 150, 16, 300);
        
        // Add pulsing effect for wave/superposition modes
        if (this.mode === 'wave' || this.mode === 'superposition') {
            const activePulse = Math.sin(this.time * 4) * 0.4 + 0.6;
            this.ctx.fillStyle = `rgba(100, 150, 255, ${activePulse * 0.3})`;
            this.ctx.fillRect(this.screenX - 10, 150, 20, 300);
        }
        
        // Small detection screen label
        this.ctx.fillStyle = '#000000';
        this.ctx.font = 'bold 12px Arial';
        this.ctx.textRenderingOptimization = 'optimizeLegibility';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Screen', this.screenX, 145);
        

        
        // Draw detection zones
        this.ctx.strokeStyle = 'rgba(0, 102, 204, 0.5)';
        this.ctx.lineWidth = 1;
        for (let i = 0; i < 6; i++) {
            const y = 170 + i * 45;
            this.ctx.beginPath();
            this.ctx.moveTo(this.screenX - 8, y);
            this.ctx.lineTo(this.screenX + 8, y);
            this.ctx.stroke();
        }
    }
    
    renderWaveMode() {
        if (!this.showWaveFunction) return;
        
        // Draw wave function with barrier interaction
        this.ctx.strokeStyle = '#4CAF50';
        this.ctx.lineWidth = 3;
        
        // Draw wave before barrier
        this.ctx.beginPath();
        let started = false;
        for (let i = 0; i < this.waveFunction.length; i++) {
            const point = this.waveFunction[i];
            if (point.x < 380) {
                if (!started) {
                    this.ctx.moveTo(point.x, point.y);
                    started = true;
                } else {
                    this.ctx.lineTo(point.x, point.y);
                }
            } else {
                break;
            }
        }
        this.ctx.stroke();
        
        // Draw wave after barrier
        this.ctx.beginPath();
        started = false;
        for (let i = 0; i < this.waveFunction.length; i++) {
            const point = this.waveFunction[i];
            if (point.x > 420) {
                if (!started) {
                this.ctx.moveTo(point.x, point.y);
                    started = true;
            } else {
                this.ctx.lineTo(point.x, point.y);
                }
            }
        }
        this.ctx.stroke();
        
        // Draw wave particles
        this.ctx.fillStyle = '#4CAF50';
        for (let i = 0; i < this.waveFunction.length; i += 5) {
            const point = this.waveFunction[i];
            this.ctx.beginPath();
            this.ctx.arc(point.x, point.y, 3, 0, Math.PI * 2);
            this.ctx.fill();
        }
        

        
        // Add wave direction arrows (moved to avoid overlap)
        this.ctx.strokeStyle = '#4CAF50';
        this.ctx.lineWidth = 2;
        for (let i = 0; i < 3; i++) {
            const x = 150 + i * 120;
            this.ctx.beginPath();
            this.ctx.moveTo(x, 350);
            this.ctx.lineTo(x + 20, 350);
            this.ctx.stroke();
            
            // Arrow head
            this.ctx.beginPath();
            this.ctx.moveTo(x + 15, 345);
            this.ctx.lineTo(x + 20, 350);
            this.ctx.lineTo(x + 15, 355);
            this.ctx.stroke();
        }
    }
    
    renderWaveModeWithoutLabel() {
        if (!this.showWaveFunction) return;
        
        // Draw wave function with barrier interaction
        this.ctx.strokeStyle = '#4CAF50';
        this.ctx.lineWidth = 3;
        
        // Draw wave before barrier
        this.ctx.beginPath();
        let started = false;
        for (let i = 0; i < this.waveFunction.length; i++) {
            const point = this.waveFunction[i];
            if (point.x < 380) {
                if (!started) {
                    this.ctx.moveTo(point.x, point.y);
                    started = true;
                } else {
                    this.ctx.lineTo(point.x, point.y);
                }
            } else {
                break;
            }
        }
        this.ctx.stroke();
        
        // Draw wave after barrier
        this.ctx.beginPath();
        started = false;
        for (let i = 0; i < this.waveFunction.length; i++) {
            const point = this.waveFunction[i];
            if (point.x > 420) {
                if (!started) {
                this.ctx.moveTo(point.x, point.y);
                    started = true;
            } else {
                this.ctx.lineTo(point.x, point.y);
                }
            }
        }
        this.ctx.stroke();
        
        // Draw wave particles
        this.ctx.fillStyle = '#4CAF50';
        for (let i = 0; i < this.waveFunction.length; i += 5) {
            const point = this.waveFunction[i];
            this.ctx.beginPath();
            this.ctx.arc(point.x, point.y, 3, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        // Add wave direction arrows (moved to avoid overlap)
        this.ctx.strokeStyle = '#4CAF50';
        this.ctx.lineWidth = 2;
        for (let i = 0; i < 3; i++) {
            const x = 150 + i * 120;
            this.ctx.beginPath();
            this.ctx.moveTo(x, 350);
            this.ctx.lineTo(x + 20, 350);
            this.ctx.stroke();
            
            // Arrow head
            this.ctx.beginPath();
            this.ctx.moveTo(x + 15, 345);
            this.ctx.lineTo(x + 20, 350);
            this.ctx.lineTo(x + 15, 355);
            this.ctx.stroke();
        }
    }
    
    renderParticleMode() {
        if (!this.showParticlePosition) return;
        
        // Draw particle
        this.ctx.fillStyle = '#FF5722';
        this.ctx.beginPath();
        this.ctx.arc(this.particleX, this.particleY, this.particleSize, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Draw particle trail
        this.ctx.strokeStyle = 'rgba(255, 87, 34, 0.5)';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(this.particleX - 50, this.particleY);
        this.ctx.lineTo(this.particleX + 50, this.particleY);
        this.ctx.stroke();
        

    }
    
    renderParticleModeWithoutLabel() {
        if (!this.showParticlePosition) return;
        
        // Draw particle
        this.ctx.fillStyle = '#FF5722';
        this.ctx.beginPath();
        this.ctx.arc(this.particleX, this.particleY, this.particleSize, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Draw particle trail
        this.ctx.strokeStyle = 'rgba(255, 87, 34, 0.5)';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(this.particleX - 50, this.particleY);
        this.ctx.lineTo(this.particleX + 50, this.particleY);
        this.ctx.stroke();
    }
    
    renderSuperpositionMode() {
        // Draw both wave and particle aspects without their labels
        this.renderWaveModeWithoutLabel();
        this.renderParticleModeWithoutLabel();
        

    }
    
    renderMeasurementMode() {
        this.renderParticleModeWithoutLabel();
        
        // Draw measurement apparatus
        this.ctx.strokeStyle = '#FF9800';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.moveTo(this.particleX, this.particleY - 30);
        this.ctx.lineTo(this.particleX, this.particleY + 30);
        this.ctx.stroke();
        

    }
    
    drawInterferencePattern() {
        // Draw interference pattern with better visibility and animation
        for (let i = 0; i < this.interferencePattern.length; i++) {
            const point = this.interferencePattern[i];
            const intensity = Math.min(point.intensity * 3, 1); // Increased intensity
            const alpha = Math.min(intensity, 0.9);
            
            // Add time-based animation
            const timeOffset = this.time * 2 + i * 0.1;
            const animatedIntensity = intensity * (0.7 + 0.3 * Math.sin(timeOffset));
            
            // Use different colors for bright and dark fringes
            if (intensity > 0.2) {
                this.ctx.fillStyle = `rgba(156, 39, 176, ${animatedIntensity})`; // Purple for bright fringes
            } else {
                this.ctx.fillStyle = `rgba(0, 0, 0, ${animatedIntensity * 0.3})`; // Dark for destructive interference
            }
            
            // Draw larger, more visible dots
            const dotSize = Math.max(6, animatedIntensity * 12);
            this.ctx.fillRect(point.x - dotSize/2, point.y - dotSize/2, dotSize, dotSize);
        }
        
        // Add animated detection dots
        if (this.mode === 'wave' || this.mode === 'superposition') {
            this.ctx.fillStyle = '#FFD700';
            for (let i = 0; i < 5; i++) {
                const y = 170 + i * 50;
                const x = this.screenX + 8;
                const pulse = Math.sin(this.time * 3 + i) * 0.5 + 0.5;
                this.ctx.globalAlpha = pulse;
                this.ctx.beginPath();
                this.ctx.arc(x, y, 4, 0, Math.PI * 2);
                this.ctx.fill();
            }
            this.ctx.globalAlpha = 1;
        }
        

        
        // Add wave arrows to slits with animation
        this.ctx.strokeStyle = '#9C27B0';
        this.ctx.lineWidth = 2;
        
        // Animated wave arrows
        const arrowPulse = Math.sin(this.time * 2) * 0.3 + 0.7;
        this.ctx.globalAlpha = arrowPulse;
        
        // From left slit
        this.ctx.beginPath();
        this.ctx.moveTo(390, 300);
        this.ctx.lineTo(this.screenX, 200);
        this.ctx.stroke();
        
        // From right slit
        this.ctx.beginPath();
        this.ctx.moveTo(410, 300);
        this.ctx.lineTo(this.screenX, 400);
        this.ctx.stroke();
        
        this.ctx.globalAlpha = 1;
        

    }
    
    drawMeasurementEffect() {
        // More dramatic flash effect with pulsing
        const pulse = Math.sin(this.time * 8) * 0.3 + 0.7;
        this.ctx.fillStyle = `rgba(255, 255, 0, ${0.4 * pulse})`;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Add particle collapse animation
        this.ctx.fillStyle = '#FF5722';
        this.ctx.beginPath();
        this.ctx.arc(this.particleX, this.particleY, 15 + Math.sin(this.time * 10) * 5, 0, Math.PI * 2);
        this.ctx.fill();
        

    }
    
    drawQuantumInfo() {
        // Draw quantum information panel
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(10, 120, 350, 200); // Increased height to accommodate formulas
        
        // Draw formulas at the top of the panel
        this.ctx.fillStyle = '#E74C3C';
        this.ctx.font = 'bold 16px Arial';
        this.ctx.textRenderingOptimization = 'optimizeLegibility';
        this.ctx.textAlign = 'left';
        this.ctx.fillText('E = hf', 20, 140);
        this.ctx.fillText('λ = h/p', 20, 160);
        this.ctx.fillText('ΔxΔp ≥ ℏ/2', 20, 180);
        
        // Draw separator line
        this.ctx.strokeStyle = '#FFFFFF';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.moveTo(20, 190);
        this.ctx.lineTo(340, 190);
        this.ctx.stroke();
        
        // Draw current values
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = '14px Arial';
        this.ctx.textRenderingOptimization = 'optimizeLegibility';
        this.ctx.fillText(`Mode: ${this.mode.toUpperCase()}`, 20, 210);
        this.ctx.fillText(`Energy: ${this.photonEnergy.toFixed(1)} eV`, 20, 230);
        this.ctx.fillText(`Wavelength: ${this.wavelength.toFixed(0)} nm`, 20, 250);
        this.ctx.fillText(`Measurements: ${this.measurementCount}`, 20, 270);
        this.ctx.fillText(`Time: ${this.time.toFixed(1)}s`, 20, 290);
        
        // Add mode-specific descriptions
        this.ctx.font = 'bold 12px Arial';
        this.ctx.textRenderingOptimization = 'optimizeLegibility';
        this.ctx.fillStyle = '#FFFF00';
        switch(this.mode) {
            case 'wave':
                this.ctx.fillText('Wave Behavior: Light behaves as a wave', 20, 315);
                this.ctx.fillText('creating interference patterns', 20, 330);
                break;
            case 'particle':
                this.ctx.fillText('Particle Behavior: Light behaves as', 20, 315);
                this.ctx.fillText('discrete particles with definite position', 20, 330);
                break;
            case 'superposition':
                this.ctx.fillText('Superposition: Light exists in both', 20, 315);
                this.ctx.fillText('wave and particle states until measured', 20, 330);
                break;
            case 'measurement':
                this.ctx.fillText('Measurement: Observing the system', 20, 315);
                this.ctx.fillText('forces it to choose wave OR particle', 20, 330);
                break;
        }
    }
    
    getStats() {
        return {
            mode: this.mode,
            photonEnergy: this.photonEnergy.toFixed(1),
            wavelength: this.wavelength.toFixed(0),
            measurementCount: this.measurementCount,
            time: this.time.toFixed(1)
        };
    }
    
    drawQuantumLabels() {
        // Draw elegant labels on the canvas
        this.ctx.save();
        
        // Set up text styling
        this.ctx.font = 'bold 16px Inter';
        this.ctx.textRenderingOptimization = 'optimizeLegibility';
        this.ctx.textAlign = 'center';
        
        // Draw animation type label only (formulas moved to info panel)
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        this.ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
        this.ctx.shadowBlur = 2;
        this.ctx.fillText('Wave-Particle Duality', this.ctx.canvas.width / 2, 25);
        
        // Reset shadow
        this.ctx.shadowBlur = 0;
        this.ctx.restore();
    }
    
    drawDescriptiveLabels() {
        // Draw descriptive labels in the bottom-right corner
        this.ctx.save();
        
        // Set up text styling
        this.ctx.font = 'bold 13px Inter';
        this.ctx.textRenderingOptimization = 'optimizeLegibility';
        this.ctx.textAlign = 'left';
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.shadowColor = 'rgba(255, 255, 255, 0.6)';
        this.ctx.shadowBlur = 1;
        
        const startX = this.ctx.canvas.width - 200;
        const startY = this.ctx.canvas.height - 120;
        const lineHeight = 16;
        
        // Draw mode-specific descriptions
        switch(this.mode) {
            case 'wave':
                this.ctx.fillText('Wave Behavior:', startX, startY);
                this.ctx.fillText('• Light travels as waves', startX, startY + lineHeight);
                this.ctx.fillText('• Creates interference pattern', startX, startY + lineHeight * 2);
                this.ctx.fillText('• Shows wave-like properties', startX, startY + lineHeight * 3);
                break;
            case 'particle':
                this.ctx.fillText('Particle Behavior:', startX, startY);
                this.ctx.fillText('• Light travels as particles', startX, startY + lineHeight);
                this.ctx.fillText('• Hits screen at specific points', startX, startY + lineHeight * 2);
                this.ctx.fillText('• Shows particle-like properties', startX, startY + lineHeight * 3);
                break;
            case 'superposition':
                this.ctx.fillText('Quantum Superposition:', startX, startY);
                this.ctx.fillText('• Light exists in both states', startX, startY + lineHeight);
                this.ctx.fillText('• Wave + Particle simultaneously', startX, startY + lineHeight * 2);
                this.ctx.fillText('• Until measured (collapsed)', startX, startY + lineHeight * 3);
                break;
            case 'measurement':
                this.ctx.fillText('Measurement Effect:', startX, startY);
                this.ctx.fillText('• Observation forces a choice', startX, startY + lineHeight);
                this.ctx.fillText('• Wave OR Particle behavior', startX, startY + lineHeight * 2);
                this.ctx.fillText('• Quantum mystery revealed', startX, startY + lineHeight * 3);
                break;
        }
        
        // Reset shadow
        this.ctx.shadowBlur = 0;
        this.ctx.restore();
    }
}