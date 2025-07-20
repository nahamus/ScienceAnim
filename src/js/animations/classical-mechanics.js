// Classical Mechanics Animations
import { BaseAnimation } from './base-animation.js';

// Pendulum Simulation
export class Pendulum extends BaseAnimation {
    constructor(ctx) {
        super(ctx);
        this.length = 120;
        this.angle = Math.PI / 4; // 45 degrees
        this.angularVelocity = 0;
        this.gravity = 1;
        this.damping = 0.01;
        this.speed = 1;
        this.mass = 1.0; // New: bob mass
        this.showPath = false;
        this.showVelocityVectors = false; // New: show velocity vectors
        this.showForceVectors = false; // New: show force vectors
        this.showEnergyInfo = false; // New: show energy information
        this.showPhaseSpace = false; // New: show phase space plot
        this.path = [];
        this.phaseSpaceData = []; // New: store phase space data
        this.energyHistory = []; // New: store energy data
        this.initialAngle = Math.PI / 4;
        this.maxAmplitude = Math.PI / 4; // Track maximum amplitude
        this.periods = []; // Track periods
        this.lastZeroCrossing = 0; // For period calculation
        this.crossingCount = 0; // Count zero crossings
    }
    
    setLength(length) {
        this.length = length;
    }
    
    setSpeed(speed) {
        this.speed = speed;
    }
    
    setInitialAngle(angle) {
        this.initialAngle = angle * Math.PI / 180;
        this.angle = this.initialAngle;
    }
    
    setGravity(gravity) {
        this.gravity = gravity;
    }
    
    setDamping(damping) {
        this.damping = damping;
    }
    
    setShowPath(show) {
        this.showPath = show;
        if (!show) this.path = [];
    }
    
    setMass(mass) {
        this.mass = mass;
    }
    
    setShowVelocityVectors(show) {
        this.showVelocityVectors = show;
    }
    
    setShowForceVectors(show) {
        this.showForceVectors = show;
    }
    
    setShowEnergyInfo(show) {
        this.showEnergyInfo = show;
    }
    
    setShowPhaseSpace(show) {
        this.showPhaseSpace = show;
        if (!show) this.phaseSpaceData = [];
    }
    
    reset() {
        this.angle = this.initialAngle;
        this.angularVelocity = 0;
        this.time = 0;
        this.path = [];
        this.phaseSpaceData = [];
        this.energyHistory = [];
        this.maxAmplitude = Math.abs(this.initialAngle);
        this.periods = [];
        this.lastZeroCrossing = 0;
        this.crossingCount = 0;
    }
    
    update(deltaTime) {
        this.time += deltaTime;
        const dt = (deltaTime / 1000) * this.speed * 3; // Reduced scaling for moderate speed
        
        // Pendulum physics with enhanced air resistance modeling
        const acceleration = -(this.gravity * 9.8) / (this.length / 100) * Math.sin(this.angle);
        
        // Enhanced air resistance: velocity-dependent damping
        const velocityMagnitude = Math.abs(this.angularVelocity);
        const airResistanceForce = this.damping * velocityMagnitude * velocityMagnitude;
        const dampingAcceleration = -Math.sign(this.angularVelocity) * airResistanceForce;
        
        this.angularVelocity += (acceleration + dampingAcceleration) * dt;
        this.angle += this.angularVelocity * dt;
        
        // Track maximum amplitude
        this.maxAmplitude = Math.max(this.maxAmplitude, Math.abs(this.angle));
        
        // Period calculation (zero crossing detection)
        if (this.angle * this.angularVelocity < 0 && this.angularVelocity > 0) {
            // Positive zero crossing
            if (this.crossingCount > 0) {
                const period = this.time - this.lastZeroCrossing;
                this.periods.push(period);
                if (this.periods.length > 10) {
                    this.periods.shift();
                }
            }
            this.lastZeroCrossing = this.time;
            this.crossingCount++;
        }
        
        // Update path
        if (this.showPath) {
            const x = this.ctx.canvas.width / 2 + this.length * Math.sin(this.angle);
            const y = this.ctx.canvas.height / 2 + this.length * Math.cos(this.angle);
            this.path.push({ x, y });
            if (this.path.length > 100) {
                this.path.shift();
            }
        }
        
        // Update phase space data
        if (this.showPhaseSpace) {
            this.phaseSpaceData.push({ angle: this.angle, velocity: this.angularVelocity });
            if (this.phaseSpaceData.length > 200) {
                this.phaseSpaceData.shift();
            }
        }
        
        // Update energy history
        if (this.showEnergyInfo) {
            const kineticEnergy = 0.5 * this.mass * this.length * this.length * this.angularVelocity * this.angularVelocity;
            const potentialEnergy = this.mass * this.gravity * 9.8 * this.length * (1 - Math.cos(this.angle));
            this.energyHistory.push({ kinetic: kineticEnergy, potential: potentialEnergy, total: kineticEnergy + potentialEnergy });
            if (this.energyHistory.length > 100) {
                this.energyHistory.shift();
            }
        }
    }
    
    render() {
        const centerX = this.ctx.canvas.width / 2;
        const centerY = this.ctx.canvas.height * 0.3; // Move pendulum higher up
        const bobX = centerX + this.length * Math.sin(this.angle);
        const bobY = centerY + this.length * Math.cos(this.angle);
        
        // Calculate energy for color coding
        const kineticEnergy = 0.5 * this.mass * this.length * this.length * this.angularVelocity * this.angularVelocity;
        const potentialEnergy = this.mass * this.gravity * 9.8 * this.length * (1 - Math.cos(this.angle));
        const totalEnergy = kineticEnergy + potentialEnergy;
        const energyRatio = kineticEnergy / totalEnergy;
        
        // Draw phase space plot
        if (this.showPhaseSpace) {
            this.drawPhaseSpacePlot();
        }
        
        // Draw energy bar
        if (this.showEnergyInfo) {
            this.drawEnergyBar();
        }
        
        // Draw path with energy-based color
        if (this.showPath && this.path.length > 1) {
            this.ctx.beginPath();
            this.ctx.strokeStyle = `hsl(${200 + energyRatio * 60}, 70%, 50%, 0.6)`;
            this.ctx.lineWidth = 3;
            this.ctx.moveTo(this.path[0].x, this.path[0].y);
            for (let i = 1; i < this.path.length; i++) {
                this.ctx.lineTo(this.path[i].x, this.path[i].y);
            }
            this.ctx.stroke();
        }
        
        // Draw enhanced pivot
        this.ctx.beginPath();
        this.ctx.fillStyle = '#2c3e50';
        this.ctx.arc(centerX, centerY, 8, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.strokeStyle = '#34495e';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        
        // Draw pivot shadow
        this.ctx.beginPath();
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.arc(centerX + 2, centerY + 2, 8, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Draw string with shadow
        this.ctx.beginPath();
        this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.lineWidth = 3;
        this.ctx.moveTo(centerX + 1, centerY + 1);
        this.ctx.lineTo(bobX + 1, bobY + 1);
        this.ctx.stroke();
        
        this.ctx.beginPath();
        this.ctx.strokeStyle = '#34495e';
        this.ctx.lineWidth = 2;
        this.ctx.moveTo(centerX, centerY);
        this.ctx.lineTo(bobX, bobY);
        this.ctx.stroke();
        
        // Draw force vectors
        if (this.showForceVectors) {
            this.drawForceVectors(centerX, centerY, bobX, bobY);
        }
        
        // Draw velocity vector
        if (this.showVelocityVectors) {
            this.drawVelocityVector(bobX, bobY);
        }
        
        // Draw enhanced bob with energy-based color
        const bobColor = `hsl(${200 + energyRatio * 60}, 70%, 50%)`;
        
        // Bob shadow
        this.ctx.beginPath();
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.arc(bobX + 2, bobY + 2, 18, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Bob main
        this.ctx.beginPath();
        this.ctx.fillStyle = bobColor;
        this.ctx.arc(bobX, bobY, 18, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Bob highlight
        this.ctx.beginPath();
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.arc(bobX - 5, bobY - 5, 6, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Bob border
        this.ctx.strokeStyle = '#2c3e50';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        
        // Draw pendulum info
        if (this.showEnergyInfo) {
            this.drawPendulumInfo();
        }
        
        // Draw canvas labels
        this.drawPendulumLabels();
    }
    
    drawForceVectors(centerX, centerY, bobX, bobY) {
        // Gravity force vector
        const gravityForce = this.mass * this.gravity * 9.8;
        const gravityLength = 50; // Increased from 30
        
        this.ctx.beginPath();
        this.ctx.strokeStyle = '#e74c3c';
        this.ctx.lineWidth = 3;
        this.ctx.moveTo(bobX, bobY);
        this.ctx.lineTo(bobX, bobY + gravityLength);
        this.ctx.stroke();
        
        // Arrow head for gravity
        this.ctx.beginPath();
        this.ctx.moveTo(bobX, bobY + gravityLength);
        this.ctx.lineTo(bobX - 6, bobY + gravityLength - 10);
        this.ctx.lineTo(bobX + 6, bobY + gravityLength - 10);
        this.ctx.closePath();
        this.ctx.fillStyle = '#e74c3c';
        this.ctx.fill();
        
        // Gravity force label
        this.ctx.fillStyle = '#e74c3c';
        this.ctx.font = 'bold 14px Inter';
        this.ctx.textRenderingOptimization = 'optimizeLegibility';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Fg', bobX + 15, bobY + gravityLength / 2);
        
        // Tension force vector (along the string)
        const tensionLength = 40; // Increased from 25
        const tensionX = bobX - centerX;
        const tensionY = bobY - centerY;
        const tensionMagnitude = Math.sqrt(tensionX * tensionX + tensionY * tensionY);
        
        if (tensionMagnitude > 0) {
            const unitX = tensionX / tensionMagnitude;
            const unitY = tensionY / tensionMagnitude;
            
            this.ctx.beginPath();
            this.ctx.strokeStyle = '#3498db';
            this.ctx.lineWidth = 3;
            this.ctx.moveTo(bobX, bobY);
            this.ctx.lineTo(bobX - unitX * tensionLength, bobY - unitY * tensionLength);
            this.ctx.stroke();
            
            // Arrow head for tension
            this.ctx.beginPath();
            this.ctx.moveTo(bobX - unitX * tensionLength, bobY - unitY * tensionLength);
            this.ctx.lineTo(bobX - unitX * tensionLength + unitY * 6, bobY - unitY * tensionLength - unitX * 6);
            this.ctx.lineTo(bobX - unitX * tensionLength - unitY * 6, bobY - unitY * tensionLength + unitX * 6);
            this.ctx.closePath();
            this.ctx.fillStyle = '#3498db';
            this.ctx.fill();
            
            // Tension force label
            this.ctx.fillStyle = '#3498db';
            this.ctx.font = 'bold 14px Inter';
        this.ctx.textRenderingOptimization = 'optimizeLegibility';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('T', bobX - unitX * tensionLength / 2 + 15, bobY - unitY * tensionLength / 2 - 10);
        }
        
        // Air resistance force vector (if damping is significant)
        if (this.damping > 0.001 && Math.abs(this.angularVelocity) > 0.1) {
            const velocityX = this.length * this.angularVelocity * Math.cos(this.angle);
            const velocityY = -this.length * this.angularVelocity * Math.sin(this.angle);
            const velocityMagnitude = Math.sqrt(velocityX * velocityX + velocityY * velocityY);
            
            if (velocityMagnitude > 0) {
                const airResistanceForce = this.damping * velocityMagnitude * velocityMagnitude;
                const airResistanceLength = Math.min(airResistanceForce * 2, 30); // Scale for visibility
                
                const unitVX = velocityX / velocityMagnitude;
                const unitVY = velocityY / velocityMagnitude;
                
                this.ctx.beginPath();
                this.ctx.strokeStyle = '#e67e22';
                this.ctx.lineWidth = 2;
                this.ctx.moveTo(bobX, bobY);
                this.ctx.lineTo(bobX - unitVX * airResistanceLength, bobY - unitVY * airResistanceLength);
                this.ctx.stroke();
                
                // Arrow head for air resistance
                this.ctx.beginPath();
                this.ctx.moveTo(bobX - unitVX * airResistanceLength, bobY - unitVY * airResistanceLength);
                this.ctx.lineTo(bobX - unitVX * airResistanceLength + unitVY * 4, bobY - unitVY * airResistanceLength - unitVX * 4);
                this.ctx.lineTo(bobX - unitVX * airResistanceLength - unitVY * 4, bobY - unitVY * airResistanceLength + unitVX * 4);
                this.ctx.closePath();
                this.ctx.fillStyle = '#e67e22';
                this.ctx.fill();
                
                // Air resistance force label
                this.ctx.fillStyle = '#e67e22';
                this.ctx.font = 'bold 12px Inter';
        this.ctx.textRenderingOptimization = 'optimizeLegibility';
                this.ctx.textAlign = 'center';
                this.ctx.fillText('Fd', bobX - unitVX * airResistanceLength / 2 - 10, bobY - unitVY * airResistanceLength / 2 - 5);
            }
        }
    }
    
    drawVelocityVector(bobX, bobY) {
        const velocityX = this.length * this.angularVelocity * Math.cos(this.angle);
        const velocityY = -this.length * this.angularVelocity * Math.sin(this.angle);
        const velocityMagnitude = Math.sqrt(velocityX * velocityX + velocityY * velocityY);
        
        if (velocityMagnitude > 0.1) {
            const scale = 20 / velocityMagnitude;
            const scaledVX = velocityX * scale;
            const scaledVY = velocityY * scale;
            
            this.ctx.beginPath();
            this.ctx.strokeStyle = '#f39c12';
            this.ctx.lineWidth = 3;
            this.ctx.moveTo(bobX, bobY);
            this.ctx.lineTo(bobX + scaledVX, bobY + scaledVY);
            this.ctx.stroke();
            
            // Arrow head
            this.ctx.beginPath();
            this.ctx.moveTo(bobX + scaledVX, bobY + scaledVY);
            this.ctx.lineTo(bobX + scaledVX - scaledVY * 0.3, bobY + scaledVY + scaledVX * 0.3);
            this.ctx.lineTo(bobX + scaledVX + scaledVY * 0.3, bobY + scaledVY - scaledVX * 0.3);
            this.ctx.closePath();
            this.ctx.fillStyle = '#f39c12';
            this.ctx.fill();
        }
    }
    
    drawEnergyBar() {
        const barWidth = 200;
        const barHeight = 20;
        const barX = 20;
        const barY = 20;
        
        // Background
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        this.ctx.fillRect(barX, barY, barWidth, barHeight);
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(barX, barY, barWidth, barHeight);
        
        // Calculate current energies
        const kineticEnergy = 0.5 * this.mass * this.length * this.length * this.angularVelocity * this.angularVelocity;
        const potentialEnergy = this.mass * this.gravity * 9.8 * this.length * (1 - Math.cos(this.angle));
        const totalEnergy = kineticEnergy + potentialEnergy;
        
        if (totalEnergy > 0) {
            const kineticRatio = kineticEnergy / totalEnergy;
            const potentialRatio = potentialEnergy / totalEnergy;
            
            // Kinetic energy (orange)
            this.ctx.fillStyle = '#f39c12';
            this.ctx.fillRect(barX, barY, barWidth * kineticRatio, barHeight);
            
            // Potential energy (blue)
            this.ctx.fillStyle = '#3498db';
            this.ctx.fillRect(barX + barWidth * kineticRatio, barY, barWidth * potentialRatio, barHeight);
        }
        
        // Labels
        this.ctx.fillStyle = '#333';
        this.ctx.font = '14px Inter';
        this.ctx.textRenderingOptimization = 'optimizeLegibility';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Energy', barX + barWidth / 2, barY - 5);
        this.ctx.fillText('K', barX + 10, barY + 15);
        this.ctx.fillText('P', barX + barWidth - 10, barY + 15);
    }
    
    drawPhaseSpacePlot() {
        const plotWidth = 200;
        const plotHeight = 150;
        const plotX = this.ctx.canvas.width - plotWidth - 20;
        const plotY = 20;
        
        // Background
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        this.ctx.fillRect(plotX, plotY, plotWidth, plotHeight);
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(plotX, plotY, plotWidth, plotHeight);
        
        if (this.phaseSpaceData.length > 1) {
            // Find data ranges
            const angles = this.phaseSpaceData.map(d => d.angle);
            const velocities = this.phaseSpaceData.map(d => d.velocity);
            const minAngle = Math.min(...angles);
            const maxAngle = Math.max(...angles);
            const minVel = Math.min(...velocities);
            const maxVel = Math.max(...velocities);
            
            // Draw phase space trajectory
            this.ctx.beginPath();
            this.ctx.strokeStyle = '#9b59b6';
            this.ctx.lineWidth = 2;
            
            for (let i = 0; i < this.phaseSpaceData.length; i++) {
                const x = plotX + ((this.phaseSpaceData[i].angle - minAngle) / (maxAngle - minAngle)) * plotWidth;
                const y = plotY + plotHeight - ((this.phaseSpaceData[i].velocity - minVel) / (maxVel - minVel)) * plotHeight;
                
                if (i === 0) {
                    this.ctx.moveTo(x, y);
                } else {
                    this.ctx.lineTo(x, y);
                }
            }
            this.ctx.stroke();
        }
        
        // Labels
        this.ctx.fillStyle = '#333';
        this.ctx.font = '14px Inter';
        this.ctx.textRenderingOptimization = 'optimizeLegibility';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Phase Space', plotX + plotWidth / 2, plotY - 5);
        this.ctx.fillText('θ', plotX + plotWidth / 2, plotY + plotHeight + 15);
        this.ctx.fillText('ω', plotX - 10, plotY + plotHeight / 2);
    }
    
    drawPendulumInfo() {
        const infoX = 20;
        const infoY = 60;
        
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
        this.ctx.shadowBlur = 2;
        this.ctx.font = '14px Inter';
        this.ctx.textRenderingOptimization = 'optimizeLegibility';
        this.ctx.textAlign = 'left';
        
        let y = infoY;
        this.ctx.fillText(`Angle: ${(this.angle * 180 / Math.PI).toFixed(1)}°`, infoX, y);
        y += 20;
        this.ctx.fillText(`Angular Velocity: ${this.angularVelocity.toFixed(2)} rad/s`, infoX, y);
        y += 20;
        
        const kineticEnergy = 0.5 * this.mass * this.length * this.length * this.angularVelocity * this.angularVelocity;
        const potentialEnergy = this.mass * this.gravity * 9.8 * this.length * (1 - Math.cos(this.angle));
        this.ctx.fillText(`Kinetic Energy: ${kineticEnergy.toFixed(1)} J`, infoX, y);
        y += 20;
        this.ctx.fillText(`Potential Energy: ${potentialEnergy.toFixed(1)} J`, infoX, y);
        y += 20;
        this.ctx.fillText(`Total Energy: ${(kineticEnergy + potentialEnergy).toFixed(1)} J`, infoX, y);
        y += 20;
        
        // Period information
        if (this.periods.length > 0) {
            const avgPeriod = this.periods.reduce((sum, p) => sum + p, 0) / this.periods.length;
            this.ctx.fillText(`Measured Period: ${avgPeriod.toFixed(2)} s`, infoX, y);
            y += 20;
        }
        
        const theoreticalPeriod = 2 * Math.PI * Math.sqrt(this.length / (this.gravity * 9.8));
        this.ctx.fillText(`Theoretical Period: ${theoreticalPeriod.toFixed(2)} s`, infoX, y);
        y += 20;
        this.ctx.fillText(`Max Amplitude: ${(this.maxAmplitude * 180 / Math.PI).toFixed(1)}°`, infoX, y);
        y += 20;
        
        // Air resistance information
        const velocityMagnitude = Math.abs(this.angularVelocity);
        const airResistanceForce = this.damping * velocityMagnitude * velocityMagnitude;
        this.ctx.fillText(`Air Resistance: ${airResistanceForce.toFixed(3)} N`, infoX, y);
        y += 20;
        this.ctx.fillText(`Damping Coefficient: ${this.damping.toFixed(3)}`, infoX, y);
        
        // Reset shadow
        this.ctx.shadowBlur = 0;
    }
    
    getStats() {
        const theoreticalPeriod = 2 * Math.PI * Math.sqrt(this.length / (this.gravity * 9.8));
        const kineticEnergy = 0.5 * this.mass * this.length * this.length * this.angularVelocity * this.angularVelocity;
        const potentialEnergy = this.mass * this.gravity * 9.8 * this.length * (1 - Math.cos(this.angle));
        const velocityMagnitude = Math.abs(this.angularVelocity);
        const airResistanceForce = this.damping * velocityMagnitude * velocityMagnitude;
        
        return {
            angle: this.angle * 180 / Math.PI,
            angularVelocity: this.angularVelocity,
            theoreticalPeriod: theoreticalPeriod,
            measuredPeriod: this.periods.length > 0 ? this.periods.reduce((sum, p) => sum + p, 0) / this.periods.length : 0,
            kineticEnergy: kineticEnergy,
            potentialEnergy: potentialEnergy,
            totalEnergy: kineticEnergy + potentialEnergy,
            maxAmplitude: this.maxAmplitude * 180 / Math.PI,
            airResistanceForce: airResistanceForce,
            dampingCoefficient: this.damping,
            time: this.time
        };
    }
    
    drawPendulumLabels() {
        this.drawLabels(
            'Simple Pendulum',
            'T = 2π√(L/g)  |  θ̈ + (g/L)sin(θ) = 0  |  E = ½mL²θ̇² + mgL(1-cos(θ))'
        );
    }
}

// Orbital Motion Simulation
export class OrbitalMotion extends BaseAnimation {
    constructor(ctx) {
        super(ctx);
        this.centerX = 400;
        this.centerY = 300;
        this.semiMajorAxis = 200;
        this.eccentricity = 0.2;
        this.centralMass = 1.0;
        this.speed = 1.0;
        this.angle = 0;
        this.showOrbitPath = true;
        this.showVelocityVector = false;
        this.showKeplerInfo = false;
        
        // Calculate orbital parameters
        this.calculateOrbitalParameters();
    }
    
    calculateOrbitalParameters() {
        // Calculate semi-minor axis from eccentricity
        this.semiMinorAxis = this.semiMajorAxis * Math.sqrt(1 - this.eccentricity * this.eccentricity);
        
        // Calculate focal distance
        this.focalDistance = this.semiMajorAxis * this.eccentricity;
        
        // Calculate orbital period (Kepler's Third Law)
        this.period = 2 * Math.PI * Math.sqrt(Math.pow(this.semiMajorAxis, 3) / this.centralMass);
        
        // Calculate angular velocity
        this.angularVelocity = 2 * Math.PI / this.period;
        
        // Store orbit path points
        this.orbitPath = [];
        for (let i = 0; i <= 360; i += 2) {
            const angle = (i * Math.PI) / 180;
            const r = this.semiMajorAxis * (1 - this.eccentricity * this.eccentricity) / 
                     (1 + this.eccentricity * Math.cos(angle));
            const x = this.centerX + r * Math.cos(angle);
            const y = this.centerY + r * Math.sin(angle);
            this.orbitPath.push({ x, y });
        }
    }
    
    setSpeed(speed) {
        this.speed = speed;
    }
    
    setEccentricity(eccentricity) {
        this.eccentricity = eccentricity;
        this.calculateOrbitalParameters();
    }
    
    setSemiMajorAxis(axis) {
        this.semiMajorAxis = axis;
        this.calculateOrbitalParameters();
    }
    
    setCentralMass(mass) {
        this.centralMass = mass;
        this.calculateOrbitalParameters();
    }
    
    setShowOrbitPath(show) {
        this.showOrbitPath = show;
    }
    
    setShowVelocityVector(show) {
        this.showVelocityVector = show;
    }
    
    setShowKeplerInfo(show) {
        this.showKeplerInfo = show;
    }
    
    reset() {
        this.time = 0;
        this.angle = 0;
    }
    
    update(deltaTime) {
        this.time += deltaTime;
        const dt = (deltaTime / 1000) * this.speed * 2; // Standardized time step scaling
        
        // Update orbital angle
        this.angle += this.angularVelocity * dt * 100;
        if (this.angle > 2 * Math.PI) {
            this.angle -= 2 * Math.PI;
        }
        
        // Calculate current position
        const r = this.semiMajorAxis * (1 - this.eccentricity * this.eccentricity) / 
                 (1 + this.eccentricity * Math.cos(this.angle));
        this.currentX = this.centerX + r * Math.cos(this.angle);
        this.currentY = this.centerY + r * Math.sin(this.angle);
        
        // Calculate velocity components
        const velocity = this.angularVelocity * r;
        this.velocityX = -velocity * Math.sin(this.angle);
        this.velocityY = velocity * Math.cos(this.angle);
        
        // Calculate orbital energy
        const kineticEnergy = 0.5 * velocity * velocity;
        const potentialEnergy = -this.centralMass / r;
        this.totalEnergy = kineticEnergy + potentialEnergy;
        
        // Track perigee and apogee
        if (r < this.perigee || this.perigee === undefined) {
            this.perigee = r;
        }
        if (r > this.apogee || this.apogee === undefined) {
            this.apogee = r;
        }
    }
    
    render() {
        // Draw central mass
        this.ctx.beginPath();
        this.ctx.fillStyle = '#FFD700';
        this.ctx.arc(this.centerX, this.centerY, 15, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Add glow effect
        this.ctx.beginPath();
        this.ctx.fillStyle = 'rgba(255, 215, 0, 0.3)';
        this.ctx.arc(this.centerX, this.centerY, 25, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Draw orbit path
        if (this.showOrbitPath && this.orbitPath.length > 1) {
            this.ctx.beginPath();
            this.ctx.strokeStyle = 'rgba(100, 100, 100, 0.5)';
            this.ctx.lineWidth = 1;
            this.ctx.moveTo(this.orbitPath[0].x, this.orbitPath[0].y);
            for (let i = 1; i < this.orbitPath.length; i++) {
                this.ctx.lineTo(this.orbitPath[i].x, this.orbitPath[i].y);
            }
            this.ctx.stroke();
        }
        
        // Draw orbiting object
        this.ctx.beginPath();
        this.ctx.fillStyle = '#4ECDC4';
        this.ctx.arc(this.currentX, this.currentY, 8, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Add shadow
        this.ctx.beginPath();
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        this.ctx.arc(this.currentX + 2, this.currentY + 2, 8, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Draw velocity vector with enhanced visualization
        if (this.showVelocityVector) {
            const vectorLength = 40;
            const velocity = Math.sqrt(this.velocityX * this.velocityX + this.velocityY * this.velocityY);
            const normalizedVX = this.velocityX / velocity;
            const normalizedVY = this.velocityY / velocity;
            
            // Draw velocity vector
            this.ctx.beginPath();
            this.ctx.strokeStyle = '#FF6B6B';
            this.ctx.lineWidth = 3;
            this.ctx.moveTo(this.currentX, this.currentY);
            this.ctx.lineTo(
                this.currentX + normalizedVX * vectorLength,
                this.currentY + normalizedVY * vectorLength
            );
            this.ctx.stroke();
            
            // Draw arrowhead
            this.ctx.beginPath();
            this.ctx.fillStyle = '#FF6B6B';
            const angle = Math.atan2(this.velocityY, this.velocityX);
            const arrowLength = 10;
            this.ctx.moveTo(
                this.currentX + normalizedVX * vectorLength,
                this.currentY + normalizedVY * vectorLength
            );
            this.ctx.lineTo(
                this.currentX + normalizedVX * vectorLength - arrowLength * Math.cos(angle - Math.PI / 6),
                this.currentY + normalizedVY * vectorLength - arrowLength * Math.sin(angle - Math.PI / 6)
            );
            this.ctx.lineTo(
                this.currentX + normalizedVX * vectorLength - arrowLength * Math.cos(angle + Math.PI / 6),
                this.currentY + normalizedVY * vectorLength - arrowLength * Math.sin(angle + Math.PI / 6)
            );
            this.ctx.closePath();
            this.ctx.fill();
            
            // Draw velocity label
            this.ctx.fillStyle = '#FF6B6B';
            this.ctx.font = 'bold 14px Inter';
        this.ctx.textRenderingOptimization = 'optimizeLegibility';
            this.ctx.fillText(`v = ${velocity.toFixed(1)}`, 
                this.currentX + normalizedVX * (vectorLength + 15),
                this.currentY + normalizedVY * (vectorLength + 15));
        }
        
        // Draw perigee and apogee markers
        if (this.showKeplerInfo && this.perigee && this.apogee) {
            // Perigee marker (closest point)
            const perigeeAngle = 0; // Perigee is at angle 0
            const perigeeX = this.centerX + this.perigee * Math.cos(perigeeAngle);
            const perigeeY = this.centerY + this.perigee * Math.sin(perigeeAngle);
            
            this.ctx.beginPath();
            this.ctx.strokeStyle = '#2ECC71';
            this.ctx.lineWidth = 2;
            this.ctx.arc(perigeeX, perigeeY, 12, 0, Math.PI * 2);
            this.ctx.stroke();
            this.ctx.fillStyle = '#2ECC71';
            this.ctx.font = 'bold 12px Inter';
        this.ctx.textRenderingOptimization = 'optimizeLegibility';
            this.ctx.fillText('P', perigeeX - 3, perigeeY + 3);
            
            // Apogee marker (farthest point)
            const apogeeAngle = Math.PI; // Apogee is at angle π
            const apogeeX = this.centerX + this.apogee * Math.cos(apogeeAngle);
            const apogeeY = this.centerY + this.apogee * Math.sin(apogeeAngle);
            
            this.ctx.beginPath();
            this.ctx.strokeStyle = '#E74C3C';
            this.ctx.lineWidth = 2;
            this.ctx.arc(apogeeX, apogeeY, 12, 0, Math.PI * 2);
            this.ctx.stroke();
            this.ctx.fillStyle = '#E74C3C';
            this.ctx.font = 'bold 12px Inter';
        this.ctx.textRenderingOptimization = 'optimizeLegibility';
            this.ctx.fillText('A', apogeeX - 3, apogeeY + 3);
        }
        
        // Draw Kepler's laws information
        if (this.showKeplerInfo) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            this.ctx.font = '14px Inter';
        this.ctx.textRenderingOptimization = 'optimizeLegibility';
            this.ctx.textAlign = 'left';
            
            // Position text on the right side to avoid cutoff
            const textX = this.ctx.canvas.width - 250;
            const startY = 30;
            
            this.ctx.fillText(`Kepler's 1st Law: Elliptical orbit (e = ${this.eccentricity.toFixed(2)})`, textX, startY);
            this.ctx.fillText(`Kepler's 2nd Law: Equal areas in equal times`, textX, startY + 20);
            this.ctx.fillText(`Kepler's 3rd Law: T^2 ∝ a^3 (T = ${this.period.toFixed(1)}s)`, textX, startY + 40);
            
            // Add orbital mechanics details
            if (this.perigee && this.apogee) {
                this.ctx.fillText(`Perigee: ${this.perigee.toFixed(0)}px`, textX, startY + 60);
                this.ctx.fillText(`Apogee: ${this.apogee.toFixed(0)}px`, textX, startY + 80);
                this.ctx.fillText(`Semi-major axis: ${this.semiMajorAxis}px`, textX, startY + 100);
            }
            
            // Show current orbital position info
            const currentDistance = Math.sqrt(
                Math.pow(this.currentX - this.centerX, 2) + 
                Math.pow(this.currentY - this.centerY, 2)
            );
            const currentSpeed = Math.sqrt(this.velocityX * this.velocityX + this.velocityY * this.velocityY);
            this.ctx.fillText(`Current distance: ${currentDistance.toFixed(0)}px`, textX, startY + 120);
            this.ctx.fillText(`Current speed: ${currentSpeed.toFixed(1)}`, textX, startY + 140);
            
            // Show orbital energy
            if (this.totalEnergy !== undefined) {
                this.ctx.fillText(`Total energy: ${this.totalEnergy.toFixed(1)}`, textX, startY + 160);
            }
        }
        
        // Draw canvas labels
        this.drawOrbitalLabels();
    }
    
    getStats() {
        const distance = Math.sqrt(
            Math.pow(this.currentX - this.centerX, 2) + 
            Math.pow(this.currentY - this.centerY, 2)
        );
        const speed = Math.sqrt(this.velocityX * this.velocityX + this.velocityY * this.velocityY);
        
        return {
            period: this.period,
            speed: speed,
            distance: distance,
            eccentricity: this.eccentricity,
            perigee: this.perigee,
            apogee: this.apogee,
            semiMajorAxis: this.semiMajorAxis,
            totalEnergy: this.totalEnergy,
            time: this.time
        };
    }
    
    drawOrbitalLabels() {
        this.drawLabels(
            'Orbital Motion',
            'r = a(1-e²)/(1+ecos(θ))  |  T² ∝ a³  |  E = ½mv² - GMm/r'
        );
    }
}


// Collision Physics Simulation
export class CollisionPhysics extends BaseAnimation {
    constructor(ctx) {
        super(ctx);
        this.balls = [];
        this.ballCount = 5;
        this.restitution = 0.8;
        this.gravity = 0.5;
        this.speed = 1.0;
        this.showAnalytics = false;
        this.collisionType = 'elastic';
        this.collisionCount = 0;
        this.collisionEffects = []; // Track collision effects for visual feedback
        
        this.initializeBalls();
    }
    
    setSpeed(speed) {
        this.speed = speed;
    }
    
    setBallCount(count) {
        this.ballCount = count;
        this.initializeBalls();
    }
    
    setRestitution(restitution) {
        this.restitution = restitution;
    }
    

    
    setGravity(gravity) {
        this.gravity = gravity;
    }
    
    setShowAnalytics(show) {
        this.showAnalytics = show;
    }
    
    setCollisionType(type) {
        this.collisionType = type;
        this.initializeBalls();
    }
    
    initializeBalls() {
        this.balls = [];
        
        if (this.collisionType === 'head-on') {
            // Head-on collision: two balls moving toward each other
            const canvasWidth = this.ctx.canvas.width;
            const canvasHeight = this.ctx.canvas.height;
            this.balls = [
                {
                    x: canvasWidth * 0.25,
                    y: canvasHeight * 0.5,
                    vx: 80,
                    vy: 0,
                    radius: 20,
                    mass: 2
                },
                {
                    x: canvasWidth * 0.75,
                    y: canvasHeight * 0.5,
                    vx: -80,
                    vy: 0,
                    radius: 20,
                    mass: 2
                }
            ];
        } else if (this.collisionType === 'elastic') {
            // Multiple balls with elastic collisions - respect ball count
            const canvasWidth = this.ctx.canvas.width;
            const canvasHeight = this.ctx.canvas.height;
            const positions = [
                {x: canvasWidth * 0.2, y: canvasHeight * 0.25}, {x: canvasWidth * 0.8, y: canvasHeight * 0.25},
                {x: canvasWidth * 0.2, y: canvasHeight * 0.5}, {x: canvasWidth * 0.8, y: canvasHeight * 0.5},
                {x: canvasWidth * 0.5, y: canvasHeight * 0.375}, {x: canvasWidth * 0.375, y: canvasHeight * 0.2}, {x: canvasWidth * 0.625, y: canvasHeight * 0.55},
                {x: canvasWidth * 0.25, y: canvasHeight * 0.55}, {x: canvasWidth * 0.75, y: canvasHeight * 0.2}
            ];
            
            for (let i = 0; i < Math.min(this.ballCount, positions.length); i++) {
                const pos = positions[i];
                this.balls.push({
                    x: pos.x,
                    y: pos.y,
                    vx: (Math.random() - 0.5) * 120,
                    vy: (Math.random() - 0.5) * 120,
                    radius: 15 + Math.random() * 10,
                    mass: 1 + Math.random() * 2
                });
            }
        } else if (this.collisionType === 'inelastic') {
            // Inelastic collisions with energy loss
            const canvasWidth = this.ctx.canvas.width;
            const canvasHeight = this.ctx.canvas.height;
            const positions = [
                {x: canvasWidth * 0.25, y: canvasHeight * 0.25}, {x: canvasWidth * 0.75, y: canvasHeight * 0.25},
                {x: canvasWidth * 0.25, y: canvasHeight * 0.5}, {x: canvasWidth * 0.75, y: canvasHeight * 0.5},
                {x: canvasWidth * 0.5, y: canvasHeight * 0.375}
            ];
            
            for (let i = 0; i < Math.min(this.ballCount, positions.length); i++) {
                const pos = positions[i];
                this.balls.push({
                    x: pos.x,
                    y: pos.y,
                    vx: (Math.random() - 0.5) * 100,
                    vy: (Math.random() - 0.5) * 100,
                    radius: 18 + Math.random() * 8,
                    mass: 1.5 + Math.random() * 1.5
                });
            }
        } else if (this.collisionType === 'mixed') {
            // Mixed collision types with varying properties
            const canvasWidth = this.ctx.canvas.width;
            const canvasHeight = this.ctx.canvas.height;
            const positions = [
                {x: canvasWidth * 0.2, y: canvasHeight * 0.2}, {x: canvasWidth * 0.8, y: canvasHeight * 0.2},
                {x: canvasWidth * 0.2, y: canvasHeight * 0.55}, {x: canvasWidth * 0.8, y: canvasHeight * 0.55},
                {x: canvasWidth * 0.5, y: canvasHeight * 0.375}, {x: canvasWidth * 0.375, y: canvasHeight * 0.3}, {x: canvasWidth * 0.625, y: canvasHeight * 0.45}
            ];
            
            for (let i = 0; i < Math.min(this.ballCount, positions.length); i++) {
                const pos = positions[i];
                this.balls.push({
                    x: pos.x,
                    y: pos.y,
                    vx: (Math.random() - 0.5) * 110,
                    vy: (Math.random() - 0.5) * 110,
                    radius: 12 + Math.random() * 12,
                    mass: 0.8 + Math.random() * 2.4
                });
            }
        } else if (this.collisionType === 'cascade') {
            // Cascade collision - balls in a line
            const canvasWidth = this.ctx.canvas.width;
            const canvasHeight = this.ctx.canvas.height;
            const spacing = canvasWidth * 0.075;
            const startX = canvasWidth * 0.125;
            const y = canvasHeight * 0.375;
            
            for (let i = 0; i < Math.min(this.ballCount, 8); i++) {
                this.balls.push({
                    x: startX + i * spacing,
                    y: y,
                    vx: i === 0 ? 100 : 0, // Only first ball moves
                    vy: 0,
                    radius: 15,
                    mass: 1.5
                });
            }
        }
        
        // Reset collision count
        this.collisionCount = 0;
        this.lastCollision = null;
    }
    
    reset() {
        this.collisionCount = 0;
        this.collisionEffects = [];
        this.initializeBalls();
    }
    
    update(deltaTime) {
        const dt = (deltaTime / 1000) * this.speed * 5; // Fixed time step calculation
        
        // Update collision effects
        this.collisionEffects = this.collisionEffects.filter(effect => {
            effect.time += dt;
            return effect.time < effect.maxTime;
        });
        
        // Update ball positions
        this.balls.forEach(ball => {
            ball.x += ball.vx * dt;
            ball.y += ball.vy * dt;
            
            // Apply gravity
            ball.vy += this.gravity * 9.8 * dt;
            
            // Apply minimal friction for stability
            ball.vx *= (1 - 0.02 * dt);
            ball.vy *= (1 - 0.02 * dt);
            
            // Bounce off canvas boundaries with energy loss
            if (ball.x - ball.radius < 0 || ball.x + ball.radius > this.ctx.canvas.width) {
                ball.vx *= -this.restitution;
                ball.x = Math.max(ball.radius, Math.min(this.ctx.canvas.width - ball.radius, ball.x));
                
                // Add wall collision effect
                this.collisionEffects.push({
                    x: ball.x,
                    y: ball.y,
                    time: 0,
                    maxTime: 0.3,
                    type: 'wall'
                });
            }
            
            if (ball.y - ball.radius < 0 || ball.y + ball.radius > this.ctx.canvas.height) {
                ball.vy *= -this.restitution;
                ball.y = Math.max(ball.radius, Math.min(this.ctx.canvas.height - ball.radius, ball.y));
                
                // Add wall collision effect
                this.collisionEffects.push({
                    x: ball.x,
                    y: ball.y,
                    time: 0,
                    maxTime: 0.3,
                    type: 'wall'
                });
            }
        });
        
        // Check for collisions between balls
        for (let i = 0; i < this.balls.length; i++) {
            for (let j = i + 1; j < this.balls.length; j++) {
                this.checkCollision(this.balls[i], this.balls[j]);
            }
        }
    }
    
    checkCollision(ball1, ball2) {
        const dx = ball2.x - ball1.x;
        const dy = ball2.y - ball1.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
                    
        if (distance < ball1.radius + ball2.radius) {
            this.collisionCount++;
            
            // Add collision effect for visual feedback
            this.collisionEffects.push({
                x: (ball1.x + ball2.x) / 2,
                y: (ball1.y + ball2.y) / 2,
                time: 0,
                maxTime: 0.5,
                type: 'ball'
            });
            
            // Normalize collision vector
            const nx = dx / distance;
            const ny = dy / distance;
            
            // Relative velocity
            const dvx = ball2.vx - ball1.vx;
            const dvy = ball2.vy - ball1.vy;
            const relativeVelocity = dvx * nx + dvy * ny;
            
            // Don't resolve if balls are moving apart
            if (relativeVelocity > 0) return;
            
            // Calculate impulse based on collision type
            let effectiveRestitution = this.restitution;
            if (this.collisionType === 'inelastic') {
                effectiveRestitution = 0.3; // More energy loss
            } else if (this.collisionType === 'mixed') {
                effectiveRestitution = 0.5 + Math.random() * 0.3; // Variable energy loss
            }
            
            // Calculate impulse
            const impulse = -(1 + effectiveRestitution) * relativeVelocity / 
                           (1/ball1.mass + 1/ball2.mass);
            
            // Update velocities
            ball1.vx -= (impulse * nx) / ball1.mass;
            ball1.vy -= (impulse * ny) / ball1.mass;
            ball2.vx += (impulse * nx) / ball2.mass;
            ball2.vy += (impulse * ny) / ball2.mass;
            
            // Separate balls to prevent sticking
            const overlap = ball1.radius + ball2.radius - distance;
            const separationX = nx * overlap * 0.5;
            const separationY = ny * overlap * 0.5;
            
            ball1.x -= separationX;
            ball1.y -= separationY;
            ball2.x += separationX;
            ball2.y += separationY;
            
            // Track collision energy
            const preCollisionEnergy = 0.5 * ball1.mass * (ball1.vx * ball1.vx + ball1.vy * ball1.vy) +
                                      0.5 * ball2.mass * (ball2.vx * ball2.vx + ball2.vy * ball2.vy);
            
            // Store collision data for analysis
            this.lastCollision = {
                ball1: { mass: ball1.mass, velocity: Math.sqrt(ball1.vx * ball1.vx + ball1.vy * ball1.vy) },
                ball2: { mass: ball2.mass, velocity: Math.sqrt(ball2.vx * ball2.vx + ball2.vy * ball2.vy) },
                energy: preCollisionEnergy,
                restitution: effectiveRestitution
            };
        }
    }
    
    render() {
        // Draw modern gradient background using full canvas
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.ctx.canvas.height);
        gradient.addColorStop(0, '#1a1a2e');
        gradient.addColorStop(1, '#16213e');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
        
        // Draw enhanced collision effects with modern styling
        this.collisionEffects.forEach(effect => {
            const alpha = 1 - (effect.time / effect.maxTime);
            const radius = 40 * (1 - effect.time / effect.maxTime);
            
            if (effect.type === 'ball') {
                // Modern ball collision effect with multiple rings
                for (let i = 0; i < 3; i++) {
                    const ringRadius = radius * (0.3 + i * 0.3);
                    const ringAlpha = alpha * (1 - i * 0.3);
                    
                    this.ctx.beginPath();
                    this.ctx.strokeStyle = `rgba(255, 107, 107, ${ringAlpha})`;
                    this.ctx.lineWidth = 3 - i;
                    this.ctx.arc(effect.x, effect.y, ringRadius, 0, Math.PI * 2);
                    this.ctx.stroke();
                }
                
                // Add sparkle effect
                for (let i = 0; i < 8; i++) {
                    const angle = (i * Math.PI * 2) / 8;
                    const sparkleX = effect.x + Math.cos(angle) * radius * 0.8;
                    const sparkleY = effect.y + Math.sin(angle) * radius * 0.8;
                    
                    this.ctx.beginPath();
                    this.ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.8})`;
                    this.ctx.arc(sparkleX, sparkleY, 2, 0, Math.PI * 2);
                    this.ctx.fill();
                }
            } else if (effect.type === 'wall') {
                // Modern wall collision effect
                this.ctx.beginPath();
                this.ctx.strokeStyle = `rgba(100, 150, 255, ${alpha})`;
                this.ctx.lineWidth = 4;
                this.ctx.arc(effect.x, effect.y, radius * 0.7, 0, Math.PI * 2);
                this.ctx.stroke();
                
                // Add ripple effect
                this.ctx.beginPath();
                this.ctx.strokeStyle = `rgba(100, 150, 255, ${alpha * 0.5})`;
                this.ctx.lineWidth = 2;
                this.ctx.arc(effect.x, effect.y, radius * 0.4, 0, Math.PI * 2);
                this.ctx.stroke();
            }
        });
        
        // Draw enhanced balls with modern styling
        this.balls.forEach((ball, index) => {
            // Create gradient for each ball based on velocity
            const velocity = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
            const normalizedVelocity = Math.min(velocity / 100, 1);
            
            // Dynamic color based on velocity and ball index
            const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'];
            const baseColor = colors[index % colors.length];
            
            // Ball shadow with modern blur effect
            this.ctx.beginPath();
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
            this.ctx.arc(ball.x + 3, ball.y + 3, ball.radius, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Ball gradient
            const gradient = this.ctx.createRadialGradient(
                ball.x - ball.radius * 0.3, ball.y - ball.radius * 0.3, 0,
                ball.x, ball.y, ball.radius
            );
            gradient.addColorStop(0, baseColor);
            gradient.addColorStop(0.7, baseColor);
            gradient.addColorStop(1, '#1a1a2e');
            
            // Ball main with gradient
            this.ctx.beginPath();
            this.ctx.fillStyle = gradient;
            this.ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Ball highlight with velocity-based intensity
            this.ctx.beginPath();
            this.ctx.fillStyle = `rgba(255, 255, 255, ${0.3 + normalizedVelocity * 0.4})`;
            this.ctx.arc(ball.x - ball.radius * 0.3, ball.y - ball.radius * 0.3, ball.radius * 0.5, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Ball border with velocity-based color
            this.ctx.strokeStyle = normalizedVelocity > 0.5 ? '#FFD700' : '#333';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
            
            // Draw enhanced momentum vectors with modern styling
            if (this.showAnalytics) {
                const velocity = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
                if (velocity > 1) { // Only show vectors for moving balls
                    const vectorLength = 50;
                    const normalizedVX = ball.vx / velocity;
                    const normalizedVY = ball.vy / velocity;
                    
                    // Vector glow effect
                this.ctx.beginPath();
                    this.ctx.strokeStyle = `rgba(78, 205, 196, 0.3)`;
                    this.ctx.lineWidth = 6;
                this.ctx.moveTo(ball.x, ball.y);
                    this.ctx.lineTo(ball.x + normalizedVX * vectorLength, ball.y + normalizedVY * vectorLength);
                this.ctx.stroke();
                
                    // Main momentum vector
                this.ctx.beginPath();
                    this.ctx.strokeStyle = '#4ECDC4';
                    this.ctx.lineWidth = 3;
                    this.ctx.moveTo(ball.x, ball.y);
                    this.ctx.lineTo(ball.x + normalizedVX * vectorLength, ball.y + normalizedVY * vectorLength);
                    this.ctx.stroke();
                    
                    // Arrowhead with gradient
                    const angle = Math.atan2(ball.vy, ball.vx);
                    const arrowLength = 12;
                    this.ctx.beginPath();
                    this.ctx.fillStyle = '#4ECDC4';
                    this.ctx.moveTo(ball.x + normalizedVX * vectorLength, ball.y + normalizedVY * vectorLength);
                    this.ctx.lineTo(ball.x + normalizedVX * vectorLength - arrowLength * Math.cos(angle - Math.PI / 6),
                                  ball.y + normalizedVY * vectorLength - arrowLength * Math.sin(angle - Math.PI / 6));
                    this.ctx.lineTo(ball.x + normalizedVX * vectorLength - arrowLength * Math.cos(angle + Math.PI / 6),
                                  ball.y + normalizedVY * vectorLength - arrowLength * Math.sin(angle + Math.PI / 6));
                this.ctx.closePath();
                this.ctx.fill();
                    
                    // Velocity magnitude label with background
                    const labelX = ball.x + normalizedVX * (vectorLength + 20);
                    const labelY = ball.y + normalizedVY * (vectorLength + 20);
                    
                    // Label background
                    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                    this.ctx.fillRect(labelX - 25, labelY - 8, 50, 16);
                    
                    // Label text
                    this.ctx.fillStyle = '#4ECDC4';
                    this.ctx.font = 'bold 13px Inter';
        this.ctx.textRenderingOptimization = 'optimizeLegibility';
                    this.ctx.textAlign = 'center';
                    this.ctx.fillText(`v = ${velocity.toFixed(1)}`, labelX, labelY + 3);
                }
            }
        });
        
        // Draw collision info
        if (this.showAnalytics) {
            this.drawCollisionInfo();
        }
        
        // Draw canvas labels
        this.drawCollisionLabels();
    }
    
    drawCollisionInfo() {
        // Modern info panel background with responsive sizing
        const canvasWidth = this.ctx.canvas.width;
        const canvasHeight = this.ctx.canvas.height;
        
        // Calculate responsive panel size (20% of canvas width, max 300px)
        const panelWidth = Math.min(canvasWidth * 0.2, 300);
        const panelHeight = Math.min(canvasHeight * 0.25, 250);
        const panelX = 10;
        const panelY = 10;
        
        this.ctx.fillStyle = 'rgba(26, 26, 46, 0.9)';
        this.ctx.fillRect(panelX, panelY, panelWidth, panelHeight);
        this.ctx.strokeStyle = '#4ECDC4';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(panelX, panelY, panelWidth, panelHeight);
        
        this.ctx.font = 'bold 18px Inter';
        this.ctx.textRenderingOptimization = 'optimizeLegibility';
        this.ctx.textAlign = 'left';
        
        let y = panelY + 25;
        this.ctx.fillStyle = '#4ECDC4';
        this.ctx.fillText(`Collision Physics`, panelX + 10, y);
        y += 25;
        
        this.ctx.font = '14px Inter';
        this.ctx.textRenderingOptimization = 'optimizeLegibility';
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.fillText(`Scenario: ${this.collisionType}`, panelX + 10, y);
        y += 20;
        this.ctx.fillText(`Bounciness: ${this.restitution}`, panelX + 10, y);
        y += 20;
        this.ctx.fillText(`Collisions: ${this.collisionCount}`, panelX + 10, y);
        y += 20;
        this.ctx.fillText(`Objects: ${this.balls.length}`, panelX + 10, y);
        y += 25;
        
        // Show last collision analysis with modern styling
        if (this.lastCollision) {
            this.ctx.fillStyle = '#FFD700';
            this.ctx.font = 'bold 14px Inter';
        this.ctx.textRenderingOptimization = 'optimizeLegibility';
            this.ctx.fillText(`Last Collision Analysis:`, panelX + 10, y);
            y += 20;
            
            this.ctx.font = '13px Inter';
        this.ctx.textRenderingOptimization = 'optimizeLegibility';
            this.ctx.fillStyle = '#FF6B6B';
            this.ctx.fillText(`  Ball 1: m=${this.lastCollision.ball1.mass}, v=${this.lastCollision.ball1.velocity.toFixed(1)}`, panelX + 10, y);
            y += 15;
            this.ctx.fillStyle = '#4ECDC4';
            this.ctx.fillText(`  Ball 2: m=${this.lastCollision.ball2.mass}, v=${this.lastCollision.ball2.velocity.toFixed(1)}`, panelX + 10, y);
            y += 15;
            this.ctx.fillStyle = '#FFEAA7';
            this.ctx.fillText(`  Energy: ${this.lastCollision.energy.toFixed(1)}`, panelX + 10, y);
            y += 15;
            this.ctx.fillStyle = '#DDA0DD';
            this.ctx.fillText(`  Effective e: ${this.lastCollision.restitution.toFixed(2)}`, panelX + 10, y);
            y += 25;
        }
        
        // Physics principles with modern styling
        this.ctx.fillStyle = '#4ECDC4';
        this.ctx.font = 'bold 14px Inter';
        this.ctx.textRenderingOptimization = 'optimizeLegibility';
        this.ctx.fillText(`Physics Principles:`, panelX + 10, y);
        y += 20;
        
        this.ctx.font = '13px Inter';
        this.ctx.textRenderingOptimization = 'optimizeLegibility';
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.fillText(`  • Momentum conservation`, panelX + 10, y);
        y += 15;
        this.ctx.fillText(`  • Energy transfer in collisions`, panelX + 10, y);
        y += 15;
        this.ctx.fillText(`  • Impulse = Force × Time`, panelX + 10, y);
        y += 15;
        this.ctx.fillStyle = '#96CEB4';
        this.ctx.fillText(`  • Elastic: e = 1 (energy conserved)`, panelX + 10, y);
        y += 15;
        this.ctx.fillStyle = '#FF6B6B';
        this.ctx.fillText(`  • Inelastic: e < 1 (energy lost)`, panelX + 10, y);
    }
    
    getStats() {
        let totalMomentum = 0;
        let totalEnergy = 0;
        
        this.balls.forEach(ball => {
            const momentum = ball.mass * Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
            const energy = 0.5 * ball.mass * (ball.vx * ball.vx + ball.vy * ball.vy);
            totalMomentum += momentum;
            totalEnergy += energy;
        });
        
        return {
            ballCount: this.balls.length,
            totalMomentum: totalMomentum,
            totalEnergy: totalEnergy,
            collisionCount: this.collisionCount
        };
    }
    
    drawCollisionLabels() {
        this.drawLabels(
            'Collision Physics',
            'p = mv  |  Σp = constant  |  KE = ½mv²'
        );
    }
}

// Friction & Inclined Planes Simulation
export class FrictionInclinedPlanes extends BaseAnimation {
    constructor(ctx) {
        super(ctx);
        this.object = {
            x: 100,
            y: 200,
            vx: 0,
            vy: 0
        };
        this.inclineAngle = 20;
        this.frictionCoefficient = 0.3;
        this.objectMass = 5;
        this.initialVelocity = 0; // Start from rest by default
        this.gravity = 1.0;
        this.speed = 1.0;
        this.showAnalytics = false;
        
        this.resetObject();
    }
    
    setSpeed(speed) {
        this.speed = speed;
    }
    
    setInclineAngle(angle) {
        this.inclineAngle = angle;
        this.resetObject();
    }
    
    setFrictionCoefficient(coefficient) {
        this.frictionCoefficient = coefficient;
    }
    
    setObjectMass(mass) {
        this.objectMass = mass;
    }
    
    setInitialVelocity(velocity) {
        this.initialVelocity = velocity;
        this.resetObject();
    }
    
    setGravity(gravity) {
        this.gravity = gravity;
    }
    
    setShowAnalytics(show) {
        this.showAnalytics = show;
    }
    

    
    resetObject() {
        const canvasWidth = this.ctx.canvas.width;
        const canvasHeight = this.ctx.canvas.height;
        const startX = canvasWidth * 0.125;
        
        // Position object a bit down the incline (about 5% of the incline length)
        const offsetDistance = canvasWidth * 0.75 * 0.05; // 5% of incline length
        this.object.x = startX + offsetDistance;
        
        // Calculate adjusted start position based on current angle
        const angleRad = this.inclineAngle * Math.PI / 180;
        const inclineLength = canvasWidth * 0.75;
        const startY = canvasHeight * 0.5;
        const endY = startY + inclineLength * Math.sin(angleRad);
        const maxEndY = canvasHeight * 0.95;
        const verticalOffset = Math.max(0, endY - maxEndY);
        const adjustedStartY = startY - verticalOffset;
        
        // Scale object size with mass for positioning
        const objectSize = Math.max(12, Math.min(25, 12 + this.objectMass * 2));
        this.object.y = adjustedStartY + offsetDistance * Math.tan(angleRad) - objectSize - 18 * Math.cos(angleRad);
        this.object.vx = this.initialVelocity * Math.cos(angleRad);
        this.object.vy = 0;
    }
    
    reset() {
        this.resetObject();
    }
    
    update(deltaTime) {
        const dt = (deltaTime / 1000) * this.speed * 3; // Increased speed multiplier for more engaging motion
        const angleRad = this.inclineAngle * Math.PI / 180;
        
        // Calculate forces
        const weight = this.objectMass * this.gravity * 9.8;
        const normalForce = weight * Math.cos(angleRad);
        const parallelForce = weight * Math.sin(angleRad);
        const frictionForce = this.frictionCoefficient * normalForce;

        let netForce = 0;
        if (Math.abs(this.object.vx) < 1e-4) {
            // Object is at rest
            if (Math.abs(parallelForce) > frictionForce) {
                // Static friction is overcome, object starts moving
                netForce = parallelForce - Math.sign(parallelForce) * frictionForce;
            } else {
                // Static friction holds object in place
                netForce = 0;
                this.object.vx = 0;
            }
        } else {
            // Object is moving, use kinetic friction (always opposes motion)
            netForce = parallelForce - Math.sign(this.object.vx) * frictionForce;
        }
        const acceleration = netForce / this.objectMass;
        
        // Enhanced acceleration scaling for more dramatic effect with higher angles
        const angleEffect = Math.sin(angleRad) * 1.5; // Amplify the angle effect
        const enhancedAcceleration = acceleration * (1 + angleEffect);
        
        // Update velocity
        this.object.vx += enhancedAcceleration * dt;
        
        // Update position
        this.object.x += this.object.vx * dt;
        
        // Calculate incline length and end position with adjusted start
        const canvasWidth = this.ctx.canvas.width;
        const canvasHeight = this.ctx.canvas.height;
        const inclineLength = canvasWidth * 0.75;
        const startX = canvasWidth * 0.125;
        const startY = canvasHeight * 0.5;
        const endX = startX + inclineLength * Math.cos(angleRad);
        const endY = startY + inclineLength * Math.sin(angleRad);
        
        // Calculate how much to move the incline up to keep it within bounds
        const maxEndY = canvasHeight * 0.95;
        const verticalOffset = Math.max(0, endY - maxEndY);
        const adjustedStartY = startY - verticalOffset;
        
        // Constrain object to stay within the incline
        if (this.object.x > endX) {
            this.object.x = endX;
            this.object.vx = 0;
        }
        
        // Position object ON TOP of the incline surface (not embedded)
        // Scale object size with mass for positioning
        const objectSize = Math.max(12, Math.min(25, 12 + this.objectMass * 2));
        this.object.y = adjustedStartY + (this.object.x - startX) * Math.tan(angleRad) - objectSize - 18 * Math.cos(angleRad);
    }
    
    render() {
        // Draw modern gradient background using full canvas
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.ctx.canvas.height);
        gradient.addColorStop(0, '#1a1a2e');
        gradient.addColorStop(1, '#16213e');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
        
        const angleRad = this.inclineAngle * Math.PI / 180;
        // Use canvas dimensions for incline positioning
        const canvasWidth = this.ctx.canvas.width;
        const canvasHeight = this.ctx.canvas.height;
        const inclineLength = canvasWidth * 0.75;
        const startX = canvasWidth * 0.125;
        const startY = canvasHeight * 0.5;
        const endX = startX + inclineLength * Math.cos(angleRad);
        const endY = startY + inclineLength * Math.sin(angleRad);
        
        // Calculate how much to move the incline up to keep it within bounds
        const maxEndY = canvasHeight * 0.95;
        const verticalOffset = Math.max(0, endY - maxEndY);
        const adjustedStartY = startY - verticalOffset;
        const adjustedEndY = endY - verticalOffset;
        // Scale object size with mass (minimum 12, maximum 25)
        const objectSize = Math.max(12, Math.min(25, 12 + this.objectMass * 2));

        // Draw subtle grid/ruler along the incline
        this.ctx.save();
        this.ctx.strokeStyle = 'rgba(80,80,80,0.25)';
        this.ctx.lineWidth = 1;
        for (let i = 0; i <= inclineLength; i += 40) {
            const x = startX + i * Math.cos(angleRad);
            const y = adjustedStartY + i * Math.sin(angleRad);
            this.ctx.beginPath();
            this.ctx.moveTo(x, y);
            this.ctx.lineTo(x - 8 * Math.sin(angleRad), y + 8 * Math.cos(angleRad));
            this.ctx.stroke();
        }
        this.ctx.restore();

        // Draw enhanced incline surface with modern styling
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.moveTo(startX, adjustedStartY);
        this.ctx.lineTo(endX, adjustedEndY);
        this.ctx.lineTo(endX + 20 * Math.sin(angleRad), adjustedEndY - 20 * Math.cos(angleRad));
        this.ctx.lineTo(startX + 20 * Math.sin(angleRad), adjustedStartY - 20 * Math.cos(angleRad));
        this.ctx.closePath();
        
        // Modern surface colors - use generic surface appearance
        const surfaceColor = '#f5f5f5';
        const textureColor = '#757575';
        
        // Main surface fill
        this.ctx.fillStyle = surfaceColor;
        this.ctx.fill();
        
        // Enhanced gradient shading
        const surfaceGradient = this.ctx.createLinearGradient(startX, adjustedStartY, endX, adjustedEndY);
        surfaceGradient.addColorStop(0, 'rgba(255,255,255,0.3)');
        surfaceGradient.addColorStop(0.5, 'rgba(255,255,255,0.1)');
        surfaceGradient.addColorStop(1, 'rgba(0,0,0,0.2)');
        this.ctx.fillStyle = surfaceGradient;
        this.ctx.fill();
        
        // Enhanced texture pattern
        this.ctx.strokeStyle = textureColor;
        this.ctx.lineWidth = 1.5;
        for (let i = 0; i < inclineLength; i += 20) {
            const x = startX + i * Math.cos(angleRad);
            const y = adjustedStartY + i * Math.sin(angleRad);
            this.ctx.beginPath();
            this.ctx.moveTo(x, y);
            this.ctx.lineTo(x + 15 * Math.sin(angleRad), y - 15 * Math.cos(angleRad));
            this.ctx.stroke();
        }
        this.ctx.restore();
            
        // Draw angle indicator (arc/protractor)
        this.ctx.save();
        this.ctx.strokeStyle = '#4ECDC4';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
        this.ctx.arc(startX, adjustedStartY, 38, 0, angleRad, false);
            this.ctx.stroke();
        // Angle label
        this.ctx.fillStyle = '#4ECDC4';
        this.ctx.font = 'bold 18px Inter';
        this.ctx.textRenderingOptimization = 'optimizeLegibility';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`${this.inclineAngle}°`, startX + 44 * Math.cos(angleRad / 2), adjustedStartY + 44 * Math.sin(angleRad / 2));
        this.ctx.restore();

        // Draw enhanced object with modern styling
        this.ctx.save();
        this.ctx.translate(this.object.x, this.object.y);
        this.ctx.rotate(angleRad);
        
        // Enhanced 3D shadow effect
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
        this.ctx.fillRect(-objectSize + 4, -objectSize + 4, objectSize * 2, objectSize * 2);
        
        // Modern gradient for the object
        const objectGradient = this.ctx.createLinearGradient(-objectSize, -objectSize, objectSize, objectSize);
        objectGradient.addColorStop(0, '#ff6b6b');
        objectGradient.addColorStop(0.7, '#ee5a52');
        objectGradient.addColorStop(1, '#c62828');
        
        // Main object body
        this.ctx.fillStyle = objectGradient;
        this.ctx.fillRect(-objectSize, -objectSize, objectSize * 2, objectSize * 2);
        
        // Enhanced highlight effect
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        this.ctx.fillRect(-objectSize, -objectSize, objectSize * 2, objectSize * 0.6);
        
        // Modern border
        this.ctx.strokeStyle = '#2c3e50';
        this.ctx.lineWidth = 2.5;
        this.ctx.strokeRect(-objectSize, -objectSize, objectSize * 2, objectSize * 2);
        
        this.ctx.restore();

        // Draw analytics if enabled
        if (this.showAnalytics) {
            this.drawForceVectors();
            this.drawFrictionInfo();
        }
        
        // Draw canvas labels
        this.drawFrictionLabels();
    }
    
    drawForceVectors() {
        const angleRad = this.inclineAngle * Math.PI / 180;
        const weight = this.objectMass * this.gravity * 9.8;
        const normalForce = weight * Math.cos(angleRad);
        const parallelForce = weight * Math.sin(angleRad);
        const frictionForce = this.frictionCoefficient * normalForce;
        const netForce = (Math.abs(this.object.vx) < 1e-4 && Math.abs(parallelForce) <= frictionForce)
            ? 0
            : parallelForce - Math.sign(this.object.vx || parallelForce) * frictionForce;
        // Scale object size with mass for force vectors
        const objectSize = Math.max(12, Math.min(25, 12 + this.objectMass * 2));
        const x = this.object.x;
        const y = this.object.y;

        // Helper to draw an arrow
        const drawArrow = (fromX, fromY, dx, dy, color, label) => {
            const len = Math.sqrt(dx * dx + dy * dy);
            if (len < 1) return; // Reduced minimum threshold
            const normDX = dx / len;
            const normDY = dy / len;
            const arrowLen = Math.max(50, Math.min(120, len));
            const endX = fromX + normDX * arrowLen;
            const endY = fromY + normDY * arrowLen;
            this.ctx.save();
            this.ctx.beginPath();
            this.ctx.moveTo(fromX, fromY);
            this.ctx.lineTo(endX, endY);
            this.ctx.strokeStyle = color;
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
            // Arrowhead
            this.ctx.beginPath();
            this.ctx.moveTo(endX, endY);
            this.ctx.lineTo(endX - 12 * normDX - 8 * normDY, endY - 12 * normDY + 8 * normDX);
            this.ctx.lineTo(endX - 12 * normDX + 8 * normDY, endY - 12 * normDY - 8 * normDX);
            this.ctx.lineTo(endX, endY);
            this.ctx.fillStyle = color;
            this.ctx.fill();
            // Label
            this.ctx.font = 'bold 14px Inter';
        this.ctx.textRenderingOptimization = 'optimizeLegibility';
            this.ctx.fillStyle = color;
            this.ctx.textAlign = 'left';
            this.ctx.fillText(label, endX + 15, endY + 4);
            this.ctx.restore();
        };

        // Gravity (downward) - Dark Blue
        drawArrow(x, y, 0, weight * 0.12, '#1565C0', 'mg');
        
        // Parallel component of gravity (down the incline) - Orange
        drawArrow(x, y, parallelForce * Math.cos(angleRad) * 0.12, parallelForce * Math.sin(angleRad) * 0.12, '#FF8C00', `mg sin(${this.inclineAngle}°)`);
        
        // Friction (opposes motion, along incline) - Dark Red
        let frictionDir = -1;
        if (Math.abs(this.object.vx) < 1e-4) {
            frictionDir = -Math.sign(parallelForce);
        } else {
            frictionDir = -Math.sign(this.object.vx);
        }
        // Ensure friction force is always visible with minimum length
        const frictionMagnitude = Math.max(frictionForce * 0.12, 20);
        drawArrow(x, y, frictionDir * frictionMagnitude * Math.cos(angleRad), frictionDir * frictionMagnitude * Math.sin(angleRad), '#C62828', 'f');
        
        // Net force (along incline) - Dark Purple
        if (Math.abs(netForce) > 0.1) {
            drawArrow(x, y, netForce * Math.cos(angleRad) * 0.12, netForce * Math.sin(angleRad) * 0.12, '#6A1B9A', 'Fₙₑₜ');
        }
    }
    
    drawFrictionInfo() {
        const angleRad = this.inclineAngle * Math.PI / 180;
        const weight = this.objectMass * this.gravity * 9.8;
        const normalForce = weight * Math.cos(angleRad);
        const parallelForce = weight * Math.sin(angleRad);
        const frictionForce = this.frictionCoefficient * normalForce;
        const netForce = parallelForce - frictionForce;
        const acceleration = netForce / this.objectMass;
        
        // Modern info panel background
        this.ctx.fillStyle = 'rgba(26, 26, 46, 0.9)';
        this.ctx.fillRect(10, 10, 280, 120);
        
        // Border
        this.ctx.strokeStyle = '#4ECDC4';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(10, 10, 280, 120);
        
        // Modern text styling
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 18px Inter';
        this.ctx.textRenderingOptimization = 'optimizeLegibility';
        this.ctx.textAlign = 'left';
        
        let y = 35;
        this.ctx.fillText(`Friction: ${this.frictionCoefficient.toFixed(2)}`, 20, y);
        y += 25;
        this.ctx.fillText(`Angle: ${this.inclineAngle}°`, 20, y);
        y += 25;
        this.ctx.fillText(`Net Force: ${netForce.toFixed(1)} N`, 20, y);
        y += 25;
        this.ctx.fillText(`Acceleration: ${acceleration.toFixed(2)} m/s²`, 20, y);
    }
    
    getStats() {
        const angleRad = this.inclineAngle * Math.PI / 180;
        const weight = this.objectMass * this.gravity * 9.8;
        const normalForce = weight * Math.cos(angleRad);
        const parallelForce = weight * Math.sin(angleRad);
        const frictionForce = this.frictionCoefficient * normalForce;
        const netForce = parallelForce - frictionForce;
        const acceleration = netForce / this.objectMass;
        
        return {
            frictionCoefficient: this.frictionCoefficient,
            inclineAngle: this.inclineAngle,
            netForce: netForce,
            acceleration: acceleration
        };
    }
    
    drawFrictionLabels() {
        this.drawLabels(
            'Friction & Inclined Planes',
            'F = μN  |  F∥ = mg sin θ  |  N = mg cos θ'
        );
    }
}