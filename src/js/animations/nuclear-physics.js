
import { BaseAnimation } from './base-animation.js';

export class NuclearReactions extends BaseAnimation {
    constructor(ctx) {
        super(ctx);
        this.canvas = ctx.canvas;
        this.speed = 1;
        this.mode = 'fission'; // fission, fusion
        this.neutronEnergy = 1.0;
        this.temperature = 1.0;

        
        // Nuclear particles
        this.nuclei = [];
        this.neutrons = [];
        this.fissionProducts = [];
        this.fusionProducts = [];
        this.energyParticles = [];
        this.reactingParticles = [];
        this.shockwaves = [];
        
        // Statistics
        this.energyReleased = 0;
        this.neutronsProduced = 0;
        this.chainReactions = 0;
        this.fissionCount = 0;
        this.fusionCount = 0;
        
        // Chain reaction state
        this.chainStarted = false;
        

        
        // Click interaction
        this.setupClickEvents();
        this.initializeNuclei();
    }
    
    setupClickEvents() {
        this.canvas.addEventListener('click', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            // Start reacting particle movement for all modes
            this.reactingParticles.forEach(particle => {
                if (!particle.moving) {
                    // Find the target atom for this particle
                    this.findTargetForParticle(particle);
                    particle.moving = true;
                }
            });
        });
        
        // Add touch event listener for mobile support
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const rect = this.canvas.getBoundingClientRect();
            const touch = e.touches[0];
            const x = touch.clientX - rect.left;
            const y = touch.clientY - rect.top;
            
            // Start reacting particle movement for all modes
            this.reactingParticles.forEach(particle => {
                if (!particle.moving) {
                    // Find the target atom for this particle
                    this.findTargetForParticle(particle);
                    particle.moving = true;
                }
            });
        });
    }
    
    initializeNuclei() {
        this.nuclei = [];
        this.neutrons = [];
        this.fissionProducts = [];
        this.fusionProducts = [];
        this.energyParticles = [];
        this.reactingParticles = [];
        
        // Create initial nuclei based on mode
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        if (this.mode === 'chain') {
            // Chain reaction mode: 3x3 grid of uranium atoms for chain reactions
            const gridSpacing = 40;
            const gridSize = 3; // 3x3 grid
            
            for (let row = 0; row < gridSize; row++) {
                for (let col = 0; col < gridSize; col++) {
                    const x = centerX + (col - 1) * gridSpacing;
                    const y = centerY + (row - 1) * gridSpacing;
                    
                    this.nuclei.push({
                        x: x,
                        y: y,
                        type: 'uranium',
                        protons: 92,
                        neutrons: 143,
                        mass: 235,
                        radius: 8,
                        color: '#FF6B35',
                        stability: 0.8,
                        fissioned: false,
                        visible: true,
                        time: 0
                    });
                }
            }
            
            // Add neutron as reacting particle
            this.reactingParticles.push({
                x: centerX - 150,
                y: centerY,
                targetX: centerX,
                targetY: centerY,
                type: 'neutron',
                radius: 12, // Much larger for better visibility
                color: '#9C27B0',
                speed: 80,
                moving: false,
                life: 10
            });
        } else if (this.mode === 'fission') {
            // Single fission demonstration
                            this.nuclei.push({
                    x: centerX,
                    y: centerY,
                    type: 'uranium',
                    protons: 92,
                    neutrons: 143,
                    mass: 235,
                    radius: 30, // Much larger than hydrogen atoms for proportion
                    color: '#FF6B35',
                    stability: 0.8,
                    fissioned: false,
                    visible: true,
                    time: 0
                });
            
            // Add neutron as reacting particle
            this.reactingParticles.push({
                x: centerX - 150,
                y: centerY,
                targetX: centerX,
                targetY: centerY,
                type: 'neutron',
                radius: 12, // Much larger for better visibility
                color: '#9C27B0',
                speed: 80,
                moving: false,
                life: 10
            });
        } else if (this.mode === 'fusion') {
            // Single fusion demonstration with deuterium (H-2) and tritium (H-3)
            // Only create the tritium nucleus - deuterium will be the reacting particle
            this.nuclei.push({
                x: centerX + 60,
                y: centerY,
                type: 'tritium',
                protons: 1,
                neutrons: 2,
                mass: 3,
                radius: 20, // Even bigger for better visibility
                color: '#4CAF50',
                stability: 0.9,
                fused: false,
                visible: true,
                time: 0
            });
            
            // Add deuterium as reacting particle (this will be the moving H-2)
            this.reactingParticles.push({
                x: centerX - 60,
                y: centerY,
                targetX: centerX + 60,
                targetY: centerY,
                type: 'deuterium',
                radius: 20, // Same size as nucleus for consistency
                color: '#4CAF50',
                speed: 60,
                moving: false,
                life: 10
            });

        }
    }
    
    setSpeed(speed) {
        this.speed = speed;
    }
    
    setMode(mode) {
        this.mode = mode;
        this.chainStarted = false;
        this.reset();
    }
    
    setNeutronEnergy(energy) {
        this.neutronEnergy = energy;
        // Update neutron speeds based on energy
        this.neutrons.forEach(neutron => {
            const speed = 50 + energy * 100;
            const angle = Math.atan2(neutron.vy, neutron.vx);
            neutron.vx = Math.cos(angle) * speed;
            neutron.vy = Math.sin(angle) * speed;
        });
    }
    
    setTemperature(temp) {
        this.temperature = temp;
        // Temperature affects reaction intensity - more energy particles and faster reactions
    }
    

    
    reset() {
        this.time = 0;
        this.energyReleased = 0;
        this.neutronsProduced = 0;
        this.chainReactions = 0;
        this.fissionCount = 0;
        this.fusionCount = 0;
        this.initializeNuclei();
    }
    
    update(deltaTime) {
        this.time += deltaTime * this.speed * 0.001;
        
        // Update nuclei
        this.nuclei.forEach(nucleus => {
            nucleus.time += deltaTime * this.speed * 0.001;
            
            // No random events - only reactions through reacting particles
        });
        
        // Update neutrons
        this.neutrons.forEach(neutron => {
            neutron.x += neutron.vx * deltaTime * this.speed * 0.001;
            neutron.y += neutron.vy * deltaTime * this.speed * 0.001;
            
            // Slow down reaction product neutrons over time
            if (neutron.isReactionProduct) {
                neutron.vx *= 0.99;
                neutron.vy *= 0.99;
                
                // Keep neutrons within canvas bounds
                if (neutron.x < neutron.radius) {
                    neutron.x = neutron.radius;
                    neutron.vx = Math.abs(neutron.vx) * 0.5;
                }
                if (neutron.x > this.canvas.width - neutron.radius) {
                    neutron.x = this.canvas.width - neutron.radius;
                    neutron.vx = -Math.abs(neutron.vx) * 0.5;
                }
                if (neutron.y < neutron.radius) {
                    neutron.y = neutron.radius;
                    neutron.vy = Math.abs(neutron.vy) * 0.5;
                }
                if (neutron.y > this.canvas.height - neutron.radius) {
                    neutron.y = this.canvas.height - neutron.radius;
                    neutron.vy = -Math.abs(neutron.vy) * 0.5;
                }
            } else {
                // Only decrease life for non-reaction product neutrons
                neutron.life -= deltaTime * this.speed * 0.001;
            }
            
            // Check for neutron capture - enhanced chain reaction
            this.nuclei.forEach(nucleus => {
                if (nucleus.type === 'uranium' && !nucleus.fissioned) {
                    const distance = Math.sqrt((neutron.x - nucleus.x) ** 2 + (neutron.y - nucleus.y) ** 2);
                    if (distance < nucleus.radius + 15) { // Increased detection radius
                        this.triggerFission(nucleus);
                        if (!neutron.isReactionProduct) {
                            neutron.life = 0; // Only remove non-reaction product neutrons
                        }
                        this.chainReactions++;
                        
                        // Enhanced chain reaction - spawn more neutrons
                        const additionalNeutrons = 2 + Math.floor(Math.random() * 3); // More neutrons
                        for (let i = 0; i < additionalNeutrons; i++) {
                            this.spawnReactionNeutronAt(nucleus.x, nucleus.y);
                        }
                    }
                }
            });
        });
        
        // Remove dead neutrons - keep reaction product neutrons permanently
        this.neutrons = this.neutrons.filter(neutron => {
            if (neutron.isReactionProduct) {
                return true; // Keep reaction product neutrons permanently
            }
            // For non-reaction product neutrons, keep them visible longer
            return neutron.life > -10;
        });
        
        // Update fission products
        this.fissionProducts.forEach(product => {
            product.x += product.vx * deltaTime * this.speed * 0.001;
            product.y += product.vy * deltaTime * this.speed * 0.001;
            // Slow down the products over time
            product.vx *= 0.99;
            product.vy *= 0.99;
            // Don't remove products - let them stay visible
        });
        
        // Update fusion products
        this.fusionProducts.forEach(product => {
            product.x += product.vx * deltaTime * this.speed * 0.001;
            product.y += product.vy * deltaTime * this.speed * 0.001;
            // Slow down the products over time
            product.vx *= 0.99;
            product.vy *= 0.99;
            // Don't remove products - let them stay visible
        });
        
        // Update reacting particles
        this.reactingParticles.forEach(particle => {
            if (particle.moving) {
                // Calculate direction to target
                const dx = particle.targetX - particle.x;
                const dy = particle.targetY - particle.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance > 5) {
                    // Move toward target with some randomness
                    const speed = particle.speed * deltaTime * this.speed * 0.001;
                    
                    // Add slight randomness to make it more realistic
                    const randomAngle = (Math.random() - 0.5) * 0.1; // Small random angle
                    const angle = Math.atan2(dy, dx) + randomAngle;
                    
                    particle.x += Math.cos(angle) * speed;
                    particle.y += Math.sin(angle) * speed;
                    
                    // Check if particle has moved too far from target (missed)
                    const newDistance = Math.sqrt((particle.x - particle.targetX) ** 2 + (particle.y - particle.targetY) ** 2);
                    if (newDistance > distance + 20) {
                        // Particle missed the target
                        particle.life = 0;
                    }
                } else {
                    // Collision occurred - trigger reaction
                    this.handleReactionCollision(particle);
                    particle.life = 0; // Remove the particle
                }
            }
        });
        this.reactingParticles = this.reactingParticles.filter(particle => particle.life > 0);
        
        // Update energy particles
        this.energyParticles.forEach(particle => {
            particle.x += particle.vx * deltaTime * this.speed * 0.001;
            particle.y += particle.vy * deltaTime * this.speed * 0.001;
            // Slow down energy particles over time but keep them visible
            particle.vx *= 0.98;
            particle.vy *= 0.98;
            particle.life -= deltaTime * this.speed * 0.001;
            particle.radius += deltaTime * this.speed * 0.001 * 5; // Slower expansion
        });
        // Keep energy particles visible longer - only remove after much longer time
        this.energyParticles = this.energyParticles.filter(particle => particle.life > -10);
        
        // Update shockwaves
        this.shockwaves.forEach(wave => {
            wave.radius += wave.speed * deltaTime * this.speed * 0.001;
            wave.life -= deltaTime * this.speed * 0.001 * 0.5; // Fade out over time
        });
        
        // Remove dead shockwaves
        this.shockwaves = this.shockwaves.filter(wave => wave.life > 0);
        
        // Description stays until reset - no timer
        
        // No automatic neutron spawning - only use pre-drawn reacting particles
    }
    
    triggerFission(nucleus) {
        nucleus.fissioned = true;
        nucleus.visible = false; // Hide the uranium atom after fission
        this.fissionCount++;
        this.energyReleased += 200 * this.temperature; // MeV - affected by temperature
        
        // Create fission products
        const angle = Math.random() * Math.PI * 2;
        const speed = (50 + Math.random() * 100) * this.temperature;
        
        // First fission product (lighter) - Krypton-92
        this.fissionProducts.push({
            x: nucleus.x,
            y: nucleus.y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            mass: 92,
            protons: 36,
            neutrons: 56,
            color: '#FF9800',
            radius: 8,
            life: 8 // Longer life for better visibility
        });
        
        // Second fission product (heavier) - Barium-141
        this.fissionProducts.push({
            x: nucleus.x,
            y: nucleus.y,
            vx: Math.cos(angle + Math.PI) * speed,
            vy: Math.sin(angle + Math.PI) * speed,
            mass: 141,
            protons: 56,
            neutrons: 85,
            color: '#E91E63',
            radius: 9,
            life: 8 // Longer life for better visibility
        });
        
        // Spawn neutrons as fission products - affected by temperature
        const neutronCount = Math.floor(1 + Math.random() * 2 + this.temperature * 0.5); // Fewer neutrons for single reactions
        for (let i = 0; i < neutronCount; i++) {
            this.spawnReactionNeutronAt(nucleus.x, nucleus.y);
        }
        
        // Create moderate energy release explosion - affected by temperature
        const energyParticleCount = Math.floor(8 * this.temperature); // Reduced from 20
        const colors = ['#FFD700', '#FF6B35', '#FF8C00']; // Fewer colors
        
        for (let i = 0; i < energyParticleCount; i++) {
            const angle = (i / energyParticleCount) * Math.PI * 2;
            const speed = (25 + Math.random() * 35) * this.temperature; // Reduced speed
            const radius = 2 + Math.random() * 4; // Smaller particles
            const life = 10 + Math.random() * 8; // Shorter life
            
            this.energyParticles.push({
                x: nucleus.x,
                y: nucleus.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                color: colors[Math.floor(Math.random() * colors.length)],
                radius: radius,
                life: life,
                originalRadius: radius,
                pulse: Math.random() * Math.PI * 2 // For pulsing effect
            });
        }
        
        // Add smaller shockwave effect
        this.shockwaves.push({
            x: nucleus.x,
            y: nucleus.y,
            radius: 0,
            maxRadius: 80 * this.temperature, // Reduced from 150
            speed: 120 * this.temperature, // Reduced from 200
            life: 0.8, // Shorter life
            color: 'rgba(255, 215, 0, 0.2)' // Less opacity
        });
    }
    
    triggerFusion(nucleus) {
        nucleus.fused = true;
        nucleus.visible = false; // Hide the hydrogen atoms after fusion
        
        // Also hide the deuterium nucleus (the reacting particle's source)
        this.nuclei.forEach(hNucleus => {
            if (hNucleus.type === 'deuterium' && !hNucleus.fused) {
                hNucleus.visible = false;
            }
        });
        
        this.fusionCount++;
        this.energyReleased += 17.6 * this.temperature; // MeV for deuterium-tritium fusion - affected by temperature
        
        // Create helium nucleus - Helium-4
        this.fusionProducts.push({
            x: nucleus.x,
            y: nucleus.y,
            vx: (Math.random() - 0.5) * 40 * this.temperature,
            vy: (Math.random() - 0.5) * 40 * this.temperature,
            mass: 4,
            protons: 2,
            neutrons: 2,
            color: '#2196F3',
            radius: 25, // Even larger radius for better visibility
            life: 8 // Longer life for better visibility
        });
        
        // Spawn neutron as fusion product (scientifically accurate for D-T fusion)
        this.spawnReactionNeutronAt(nucleus.x, nucleus.y);
        
        // Create moderate fusion energy release - affected by temperature
        const energyParticleCount = Math.floor(6 * this.temperature); // Reduced from 15
        const colors = ['#FFEB3B', '#FFD700', '#FFA500']; // Fewer colors
        
        for (let i = 0; i < energyParticleCount; i++) {
            const angle = (i / energyParticleCount) * Math.PI * 2;
            const speed = (20 + Math.random() * 30) * this.temperature; // Reduced speed
            const radius = 4 + Math.random() * 6; // Smaller particles
            const life = 8 + Math.random() * 6; // Shorter life
            
            this.energyParticles.push({
                x: nucleus.x,
                y: nucleus.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                color: colors[Math.floor(Math.random() * colors.length)],
                radius: radius,
                life: life,
                originalRadius: radius,
                pulse: Math.random() * Math.PI * 2 // For pulsing effect
            });
        }
        
        // Add smaller fusion shockwave effect
        this.shockwaves.push({
            x: nucleus.x,
            y: nucleus.y,
            radius: 0,
            maxRadius: 60 * this.temperature, // Reduced from 120
            speed: 100 * this.temperature, // Reduced from 180
            life: 0.7, // Shorter life
            color: 'rgba(255, 235, 59, 0.25)' // Less opacity
        });
    }
    
    spawnNeutron() {
        const angle = Math.random() * Math.PI * 2;
        const radius = 100;
        const x = this.canvas.width / 2 + Math.cos(angle) * radius;
        const y = this.canvas.height / 2 + Math.sin(angle) * radius;
        this.spawnNeutronAt(x, y);
    }
    
    spawnNeutronAt(x, y) {
        const angle = Math.random() * Math.PI * 2;
        const speed = (30 + Math.random() * 40) * this.neutronEnergy; // Speed affected by neutron energy
        
        this.neutrons.push({
            x: x,
            y: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            color: '#9C27B0',
            radius: 4, // Slightly larger for better visibility
            life: 15, // Regular lifetime for chain reaction neutrons
            isReactionProduct: false // Not a reaction product
        });
        
        this.neutronsProduced++;
    }
    
    spawnReactionNeutronAt(x, y) {
        const angle = Math.random() * Math.PI * 2;
        const speed = (30 + Math.random() * 40) * this.neutronEnergy; // Speed affected by neutron energy
        
        this.neutrons.push({
            x: x,
            y: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            color: '#9C27B0',
            radius: 4, // Slightly larger for better visibility
            life: Infinity, // Permanent lifetime for reaction products
            isReactionProduct: true // Mark as reaction product
        });
        
        this.neutronsProduced++;
    }
    
    findTargetForParticle(particle) {
        if (particle.type === 'neutron') {
            // Find the closest uranium nucleus
            let closestNucleus = null;
            let closestDistance = Infinity;
            
            this.nuclei.forEach(nucleus => {
                if (nucleus.type === 'uranium' && !nucleus.fissioned) {
                    const distance = Math.sqrt((particle.x - nucleus.x) ** 2 + (particle.y - nucleus.y) ** 2);
                    if (distance < closestDistance) {
                        closestDistance = distance;
                        closestNucleus = nucleus;
                    }
                }
            });
            
            if (closestNucleus) {
                particle.targetX = closestNucleus.x;
                particle.targetY = closestNucleus.y;
                particle.targetNucleus = closestNucleus;
            }
        } else if (particle.type === 'deuterium') {
            // Find the closest tritium nucleus for fusion
            let closestNucleus = null;
            let closestDistance = Infinity;
            
            this.nuclei.forEach(nucleus => {
                if (nucleus.type === 'tritium' && !nucleus.fused) {
                    const distance = Math.sqrt((particle.x - nucleus.x) ** 2 + (particle.y - nucleus.y) ** 2);
                    if (distance < closestDistance) {
                        closestDistance = distance;
                        closestNucleus = nucleus;
                    }
                }
            });
            
            if (closestNucleus) {
                particle.targetX = closestNucleus.x;
                particle.targetY = closestNucleus.y;
                particle.targetNucleus = closestNucleus;
            }
        }
    }
    
    handleReactionCollision(particle) {
        if (particle.type === 'neutron' && particle.targetNucleus) {
            const distance = Math.sqrt((particle.x - particle.targetNucleus.x) ** 2 + (particle.y - particle.targetNucleus.y) ** 2);
            if (distance < particle.targetNucleus.radius + 10) {
                this.triggerFission(particle.targetNucleus);
            }
        } else if (particle.type === 'deuterium' && particle.targetNucleus) {
            const distance = Math.sqrt((particle.x - particle.targetNucleus.x) ** 2 + (particle.y - particle.targetNucleus.y) ** 2);
            if (distance < particle.targetNucleus.radius + 10) {
                // Trigger fusion for the target tritium nucleus only
                if (particle.targetNucleus.type === 'tritium' && !particle.targetNucleus.fused) {
                    this.triggerFusion(particle.targetNucleus);
                }
            }
        }
    }
    
    render() {
        // Clear canvas
        this.ctx.fillStyle = '#1a1a1a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw background grid
        this.drawGrid();
        
        // Draw shockwaves (behind all particles)
        this.shockwaves.forEach(wave => {
            this.ctx.save();
            this.ctx.globalAlpha = Math.max(0, wave.life);
            this.ctx.strokeStyle = wave.color;
            this.ctx.lineWidth = 8;
            this.ctx.shadowColor = wave.color;
            this.ctx.shadowBlur = 30;
            this.ctx.beginPath();
            this.ctx.arc(wave.x, wave.y, wave.radius, 0, Math.PI * 2);
            this.ctx.stroke();
            this.ctx.restore();
        });
        
        // Draw energy particles
        this.energyParticles.forEach(particle => {
            this.ctx.save();
            // Keep particles visible even when life is negative
            this.ctx.globalAlpha = Math.max(0.3, particle.life / 2);
            this.ctx.fillStyle = particle.color;
            this.ctx.shadowColor = particle.color;
            this.ctx.shadowBlur = 10;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        });
        
        // Draw fission products
        this.fissionProducts.forEach(product => {
            this.ctx.save();
            this.ctx.globalAlpha = 1.0; // Always fully visible
            this.ctx.fillStyle = product.color;
            this.ctx.shadowColor = product.color;
            this.ctx.shadowBlur = 8;
            this.ctx.beginPath();
            this.ctx.arc(product.x, product.y, product.radius, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Draw fission product label
            this.ctx.globalAlpha = 1.0;
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.font = 'bold 14px Arial';
        this.ctx.textRenderingOptimization = 'optimizeLegibility';
            this.ctx.textAlign = 'center';
            this.ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
            this.ctx.shadowBlur = 2;
            
            // Determine element symbol based on protons
            let elementSymbol = '';
            if (product.protons === 36) {
                elementSymbol = 'Kr'; // Krypton-92
            } else if (product.protons === 56) {
                elementSymbol = 'Ba'; // Barium-141
            } else {
                elementSymbol = 'X'; // Unknown fission product
            }
            
            this.ctx.fillText(elementSymbol, product.x, product.y + 2);
            this.ctx.font = '12px Arial';
        this.ctx.textRenderingOptimization = 'optimizeLegibility';
            this.ctx.fillText(`${product.mass}`, product.x, product.y + product.radius + 10);
            this.ctx.restore();
        });
        
        // Draw fusion products
        this.fusionProducts.forEach(product => {
            this.ctx.save();
            this.ctx.globalAlpha = 1.0; // Always fully visible
            this.ctx.fillStyle = product.color;
            this.ctx.shadowColor = product.color;
            this.ctx.shadowBlur = 8;
            this.ctx.beginPath();
            this.ctx.arc(product.x, product.y, product.radius, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Draw fusion product label (Helium)
            this.ctx.globalAlpha = 1.0;
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.font = 'bold 14px Arial';
        this.ctx.textRenderingOptimization = 'optimizeLegibility';
            this.ctx.textAlign = 'center';
            this.ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
            this.ctx.fillText('He', product.x, product.y + 2);
            this.ctx.font = '12px Arial';
        this.ctx.textRenderingOptimization = 'optimizeLegibility';
            this.ctx.fillText(`${product.mass}`, product.x, product.y + product.radius + 10);
            this.ctx.restore();
        });
        
        // Draw neutrons
        this.neutrons.forEach(neutron => {
            this.ctx.save();
            // Reaction product neutrons are always fully visible
            if (neutron.isReactionProduct) {
                this.ctx.globalAlpha = 1.0;
            } else {
                // Keep other neutrons visible even when life is negative
                this.ctx.globalAlpha = Math.max(0.4, neutron.life / 5);
            }
            this.ctx.fillStyle = neutron.color;
            this.ctx.shadowColor = neutron.color;
            this.ctx.shadowBlur = 8;
            this.ctx.beginPath();
            this.ctx.arc(neutron.x, neutron.y, neutron.radius, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Draw neutron label
            if (neutron.isReactionProduct) {
                this.ctx.globalAlpha = 1.0;
            } else {
                this.ctx.globalAlpha = Math.max(0.4, neutron.life / 5);
            }
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.font = 'bold 12px Arial';
        this.ctx.textRenderingOptimization = 'optimizeLegibility';
            this.ctx.textAlign = 'center';
            this.ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
            this.ctx.shadowBlur = 2;
            this.ctx.fillText('n', neutron.x, neutron.y + 3);
            this.ctx.restore();
        });
        
        // Draw reacting particles
        this.reactingParticles.forEach(particle => {
            this.ctx.save();
            
            // Draw trail if moving
            if (particle.moving) {
                this.ctx.strokeStyle = particle.color;
                this.ctx.lineWidth = 2;
                this.ctx.globalAlpha = 0.6;
                this.ctx.beginPath();
                this.ctx.moveTo(particle.x, particle.y);
                // Draw a short trail in the direction of movement
                const dx = particle.targetX - particle.x;
                const dy = particle.targetY - particle.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance > 0) {
                    this.ctx.lineTo(particle.x - (dx / distance) * 15, particle.y - (dy / distance) * 15);
                }
                this.ctx.stroke();
                this.ctx.globalAlpha = 1;
            }
            
            this.ctx.fillStyle = particle.color;
            this.ctx.shadowColor = particle.color;
            this.ctx.shadowBlur = 10;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Draw particle label
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.font = 'bold 12px Arial';
        this.ctx.textRenderingOptimization = 'optimizeLegibility';
            this.ctx.textAlign = 'center';
            this.ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
            this.ctx.shadowBlur = 2;
            
            if (particle.type === 'neutron') {
                this.ctx.fillText('n', particle.x, particle.y + 3);
            } else if (particle.type === 'deuterium') {
                this.ctx.fillText('²H', particle.x, particle.y + 3);
            }
            
            // No click indicator needed since you can click anywhere
            
            this.ctx.restore();
        });
        
        // Draw nuclei
        this.nuclei.forEach(nucleus => {
            if (nucleus.visible !== false) { // Only draw visible nuclei
                if (this.mode === 'fission' && nucleus.type === 'uranium') {
                    this.drawNucleus(nucleus);
                    this.drawClickIndicator(nucleus);
                } else if (this.mode === 'fusion' && (nucleus.type === 'deuterium' || nucleus.type === 'tritium')) {
                    this.drawNucleus(nucleus);
                    this.drawClickIndicator(nucleus);
                } else if (this.mode === 'chain' && nucleus.type === 'uranium') {
                    this.drawNucleus(nucleus);
                    this.drawClickIndicator(nucleus);
                }
            }
        });
        
        // Draw labels
        this.drawNuclearLabels();
        

    }
    
    drawGrid() {
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.lineWidth = 1;
        
        const gridSize = 50;
        for (let x = 0; x < this.canvas.width; x += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }
        
        for (let y = 0; y < this.canvas.height; y += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }
    }
    
    drawNucleus(nucleus) {
        // Draw nucleus with enhanced visual representation
        this.ctx.save();
        
        // Outer glow
        this.ctx.shadowColor = nucleus.color;
        this.ctx.shadowBlur = 15;
        this.ctx.fillStyle = nucleus.color;
        this.ctx.beginPath();
        this.ctx.arc(nucleus.x, nucleus.y, nucleus.radius, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Inner core with gradient effect
        this.ctx.shadowBlur = 0;
        const gradient = this.ctx.createRadialGradient(
            nucleus.x, nucleus.y, 0,
            nucleus.x, nucleus.y, nucleus.radius * 0.6
        );
        gradient.addColorStop(0, '#FFFFFF');
        gradient.addColorStop(1, nucleus.color);
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(nucleus.x, nucleus.y, nucleus.radius * 0.6, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Enhanced nucleon representation
        this.ctx.fillStyle = '#000000';
        const nucleonCount = Math.min(nucleus.protons + nucleus.neutrons, 12);
        for (let i = 0; i < nucleonCount; i++) {
            const angle = (i / nucleonCount) * Math.PI * 2;
            const radius = nucleus.radius * 0.4;
            const x = nucleus.x + Math.cos(angle) * radius;
            const y = nucleus.y + Math.sin(angle) * radius;
            
            // Draw nucleon with small glow
            this.ctx.save();
            this.ctx.shadowColor = '#000000';
            this.ctx.shadowBlur = 1;
            this.ctx.beginPath();
            this.ctx.arc(x, y, 1.5, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        }
        
        this.ctx.restore();
        
        // Draw element symbol and details with enhanced styling
        this.ctx.save();
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
        this.ctx.shadowBlur = 2;
        
        // Element symbol with background circle
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.beginPath();
        this.ctx.arc(nucleus.x, nucleus.y + 2, 8, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = 'bold 14px Arial';
        this.ctx.textRenderingOptimization = 'optimizeLegibility';
        this.ctx.textAlign = 'center';
        let elementSymbol = '';
        if (nucleus.type === 'uranium') {
            elementSymbol = 'U';
        } else if (nucleus.type === 'deuterium') {
            elementSymbol = '²H';
        } else if (nucleus.type === 'tritium') {
            elementSymbol = '³H';
        }
        this.ctx.fillText(elementSymbol, nucleus.x, nucleus.y + 5);
        
        // Mass number with background
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        this.ctx.fillRect(nucleus.x - 15, nucleus.y + nucleus.radius + 5, 30, 12);
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = 'bold 11px Arial';
        this.ctx.textRenderingOptimization = 'optimizeLegibility';
        this.ctx.fillText(`${nucleus.mass}`, nucleus.x, nucleus.y + nucleus.radius + 14);
        
        // Proton/neutron count with background
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.fillRect(nucleus.x - 25, nucleus.y + nucleus.radius + 15, 50, 10);
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = '9px Arial';
        this.ctx.textRenderingOptimization = 'optimizeLegibility';
        this.ctx.fillText(`${nucleus.protons}p, ${nucleus.neutrons}n`, nucleus.x, nucleus.y + nucleus.radius + 23);
        
        this.ctx.restore();
    }
    
    drawClickIndicator(nucleus) {
        // Draw pulsing ring to indicate clickability
        if ((this.mode === 'fission' && nucleus.type === 'uranium' && !nucleus.fissioned) ||
            (this.mode === 'fusion' && (nucleus.type === 'deuterium' || nucleus.type === 'tritium') && !nucleus.fused)) {
            
            this.ctx.save();
            const pulse = Math.sin(this.time * 3) * 0.3 + 0.7;
            this.ctx.strokeStyle = `rgba(255, 255, 255, ${pulse * 0.6})`;
            this.ctx.lineWidth = 2;
            this.ctx.setLineDash([5, 5]);
            this.ctx.beginPath();
            this.ctx.arc(nucleus.x, nucleus.y, nucleus.radius + 8, 0, Math.PI * 2);
            this.ctx.stroke();
            this.ctx.restore();
        }
    }
    
    drawNuclearLabels() {
        let title, formulas;
        
        if (this.mode === 'fission') {
            title = 'Nuclear Fission';
            formulas = '²³⁵U + ¹n → ⁹²Kr + ¹⁴¹Ba + 3¹n + 200 MeV';
        } else if (this.mode === 'fusion') {
            title = 'Nuclear Fusion';
            formulas = '²H + ³H → ⁴He + ¹n + 17.6 MeV';
        } else if (this.mode === 'chain') {
            title = 'Chain Reaction';
            formulas = '²³⁵U + ¹n → ⁹²Kr + ¹⁴¹Ba + 3¹n + 200 MeV';
        } else {
            title = 'Nuclear Binding Energy';
            formulas = 'E = mc²';
        }
        
        this.drawLabels(title, formulas);
    }
    

    
    getStats() {
        return {
            mode: this.mode,
            energyReleased: this.energyReleased.toFixed(1),
            neutronsProduced: this.neutronsProduced,
            chainReactions: this.chainReactions,
            fissionCount: this.fissionCount,
            fusionCount: this.fusionCount,
            temperature: this.temperature.toFixed(1),
            time: this.time.toFixed(1)
        };
    }

}