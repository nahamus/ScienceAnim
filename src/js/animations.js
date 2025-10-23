import { BrownianMotion, Diffusion, GasLaws } from './animations/particle-physics.js';
import { Pendulum, OrbitalMotion, CollisionPhysics, FrictionInclinedPlanes } from './animations/classical-mechanics.js';
import { SoundWaves, WavePropagation } from './animations/wave-phenomena.js';
import { ElectricFields, MagneticFields, DiodeTransistor } from './animations/electro-magnetism.js';
import { WaveParticleDuality } from './animations/quantum-physics.js';
import { NuclearReactions } from './animations/nuclear-physics.js';
import { FluidFlow, Bernoulli } from './animations/fluid-dynamics.js';
import { NeuralNetwork, MemoryManagement } from './animations/computer-science.js';
import { Blockchain } from './animations/blockchain.js';

// Main animations controller
export class ScientificAnimations {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.currentAnimation = 'brownian';
        this.isRunning = true;
        this.lastTime = 0;
        
        // Initialize animations
        this.brownianMotion = new BrownianMotion(this.ctx);
        this.pendulum = new Pendulum(this.ctx);
        this.diffusion = new Diffusion(this.ctx);
        this.waves = new WavePropagation(this.ctx);
        this.orbital = new OrbitalMotion(this.ctx);
        this.electricFields = new ElectricFields(this.ctx);

        this.gasLaws = new GasLaws(this.ctx);
        this.collisions = new CollisionPhysics(this.ctx);
        this.friction = new FrictionInclinedPlanes(this.ctx);

        this.magneticFields = new MagneticFields(this.ctx);
        this.waveParticleDuality = new WaveParticleDuality(this.ctx);
        this.nuclearReactions = new NuclearReactions(this.ctx);
        
        // Initialize fluid dynamics
        this.fluidFlow = new FluidFlow(this.ctx);
        this.bernoulli = new Bernoulli(this.ctx);
        
        // Initialize sound waves
        this.soundWaves = new SoundWaves(this.ctx);
        
        // Initialize diode and transistor
        this.diodeTransistor = new DiodeTransistor(this.ctx);
        
        // Initialize computer science animations
        this.neuralNetwork = new NeuralNetwork(this.ctx);
        this.memoryManagement = new MemoryManagement(this.ctx);
        this.blockchain = new Blockchain(this.ctx);
        
        this.setupEventListeners();
        this.resizeCanvas();
        
        // Initialize all control panels with default values after a short delay
        setTimeout(() => {
            this.initializeWaveControls();
            this.initializeSoundWavesControls();
            this.initializeDiodeTransistorControls();
        }, 100);
        
        this.animate();
    }
    
    setupEventListeners() {
        // Category header clicks
        document.querySelectorAll('.category-header').forEach(header => {
            const setExpanded = (el, expanded) => {
                try { el.setAttribute('aria-expanded', String(expanded)); } catch {}
            };

            header.addEventListener('click', (e) => {
                const categoryItem = e.currentTarget.closest('.category-item');
                const category = categoryItem.dataset.category;
                const sideNav = document.querySelector('.side-navigation');
                const mainContent = document.querySelector('.main-content');
                
                // If navigation is collapsed, expand it and don't switch animations
                if (sideNav.classList.contains('collapsed')) {
                    sideNav.classList.remove('collapsed');
                    mainContent.classList.remove('nav-collapsed');
                    setExpanded(header, true);
                    return;
                }
                
                // Close all other categories
                document.querySelectorAll('.category-item').forEach(item => {
                    if (item !== categoryItem) {
                        item.classList.remove('active');
                        const h = item.querySelector('.category-header');
                        if (h) setExpanded(h, false);
                    }
                });
                
                // Toggle current category
                categoryItem.classList.toggle('active');
                setExpanded(header, categoryItem.classList.contains('active'));
                
                // If this category is now active, switch to its first animation
                if (categoryItem.classList.contains('active')) {
                    const firstAnimation = categoryItem.querySelector('.submenu-item');
                    if (firstAnimation && !firstAnimation.classList.contains('active')) {
                        this.switchAnimation(firstAnimation.dataset.animation);
                    }
                }
            });
            // Keyboard support
            header.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    header.click();
                }
            });
        });

        // Submenu item clicks
        document.querySelectorAll('.submenu-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const animation = e.currentTarget.dataset.animation;
                
                // Remove active class from all submenu items
                document.querySelectorAll('.submenu-item').forEach(subItem => {
                    subItem.classList.remove('active');
                });
                
                // Add active class to clicked item
                e.currentTarget.classList.add('active');
                
                // Switch to the selected animation
                this.switchAnimation(animation);
            });
        });

        // Navigation toggle (collapse/expand)
        const navToggleBtn = document.querySelector('.nav-toggle-btn');
        const sideNav = document.querySelector('.side-navigation');
        const mainContent = document.querySelector('.main-content');
        const controlsPanel = document.querySelector('.controls-panel');
        const controlsToggle = document.querySelector('.controls-toggle');
        const controlsBackdrop = document.getElementById('controlsBackdrop');
        
        if (navToggleBtn) {
            navToggleBtn.addEventListener('click', () => {
                const willCollapse = !sideNav.classList.contains('collapsed');
                sideNav.classList.toggle('collapsed');
                mainContent.classList.toggle('nav-collapsed');
                // Persist state
                try { localStorage.setItem('sideNavCollapsed', String(willCollapse)); } catch {}
                try { localStorage.setItem('sideNavUserToggled', 'true'); } catch {}
                // Clear mobile-open state when collapsing on desktop
                if (willCollapse) {
                    sideNav.classList.remove('open');
                    const mobileNavToggle = document.getElementById('mobileNavToggle');
                    if (mobileNavToggle) mobileNavToggle.classList.remove('open');
                }
                // Toggle aria-expanded on the button for a11y
                try {
                    const expanded = !willCollapse;
                    navToggleBtn.setAttribute('aria-expanded', String(expanded));
                } catch {}
            });
            // Initialize aria-expanded
            navToggleBtn.setAttribute('aria-expanded', String(!sideNav.classList.contains('collapsed')));
        }
        // Controls overlay open/close
        const openControls = () => {
            if (!controlsPanel || !controlsBackdrop) return;
            controlsPanel.classList.remove('collapsed');
            controlsBackdrop.classList.add('active');
        };
        const closeControls = () => {
            if (!controlsPanel || !controlsBackdrop) return;
            controlsPanel.classList.add('collapsed');
            controlsBackdrop.classList.remove('active');
        };
        if (controlsToggle) {
            controlsToggle.addEventListener('click', (e) => {
                e.preventDefault();
                if (e.stopImmediatePropagation) e.stopImmediatePropagation();
                else e.stopPropagation();
                openControls();
            });
        }
        if (controlsBackdrop) {
            controlsBackdrop.addEventListener('click', closeControls);
        }
        const applyBtn = document.getElementById('controlsApplyBtn');
        const cancelBtn = document.getElementById('controlsCancelBtn');
        if (applyBtn) applyBtn.addEventListener('click', closeControls);
        if (cancelBtn) cancelBtn.addEventListener('click', closeControls);

        // Mobile navigation toggle
        const mobileNavToggle = document.getElementById('mobileNavToggle');
        const navBackdrop = document.getElementById('navBackdrop');
        
        if (mobileNavToggle && sideNav) {
            const closeMobileNav = () => {
                mobileNavToggle.classList.remove('open');
                sideNav.classList.remove('open');
            };

            mobileNavToggle.addEventListener('click', () => {
                mobileNavToggle.classList.toggle('open');
                sideNav.classList.toggle('open');
                // When opening mobile nav, ensure desktop collapsed is cleared for consistency
                if (sideNav.classList.contains('open')) {
                    sideNav.classList.remove('collapsed');
                    mainContent.classList.remove('nav-collapsed');
                    try { localStorage.setItem('sideNavCollapsed', 'false'); } catch {}
                }
                try { localStorage.setItem('sideNavUserToggled', 'true'); } catch {}
            });
            
            // Close on backdrop click and Esc key
            if (navBackdrop) {
                navBackdrop.addEventListener('click', () => closeMobileNav());
            }
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && sideNav.classList.contains('open')) {
                    closeMobileNav();
                }
            });
        }

        // Close mobile nav when clicking outside
        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 768) {
                if (!e.target.closest('.side-navigation') && 
                    !e.target.closest('.mobile-nav-toggle')) {
                    if (mobileNavToggle && sideNav) {
                        mobileNavToggle.classList.remove('open');
                        sideNav.classList.remove('open');
                    }
                }
            }
        });

        
        // Control buttons (optional presence)
        const playPauseBtnEl = document.getElementById('playPauseBtn');
        if (playPauseBtnEl) {
            playPauseBtnEl.addEventListener('click', () => {
                this.togglePlayPause();
            });
        }
        const resetBtnEl = document.getElementById('resetBtn');
        if (resetBtnEl) {
            resetBtnEl.addEventListener('click', () => {
                this.resetAnimation();
            });
        }
        // Learn More button (now in stats area)
        const learnMoreBtnEl = document.getElementById('learnMoreBtn');
        if (learnMoreBtnEl) {
            learnMoreBtnEl.addEventListener('click', () => {
                this.showScienceExplanation();
            });
        }
        
        // Modal close button
        document.getElementById('closeModal').addEventListener('click', () => {
            this.closeModal();
        });
        
        // Close modal when clicking outside
        document.getElementById('scienceModal').addEventListener('click', (e) => {
            if (e.target.id === 'scienceModal') {
                this.closeModal();
            }
        });
        
        // Close modal with Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
            }
        });
        
        // Responsive side nav layout helper
        const applySideNavLayout = () => {
            const width = window.innerWidth || document.documentElement.clientWidth;
            const userToggled = (() => { try { return localStorage.getItem('sideNavUserToggled') === 'true'; } catch { return false; } })();
            if (width <= 768) {
                // Mobile overlay mode - no layout offset
                sideNav.classList.remove('collapsed');
                mainContent.classList.remove('nav-collapsed');
                sideNav.classList.remove('open');
                return;
            }
            if (!userToggled) {
                if (width < 1200) {
                    sideNav.classList.add('collapsed');
                    mainContent.classList.add('nav-collapsed');
                    try { localStorage.setItem('sideNavCollapsed', 'true'); } catch {}
                } else {
                    sideNav.classList.remove('collapsed');
                    mainContent.classList.remove('nav-collapsed');
                    try { localStorage.setItem('sideNavCollapsed', 'false'); } catch {}
                }
            }
        };

        // Restore persisted side nav collapsed state and last animation
        try {
            const collapsed = localStorage.getItem('sideNavCollapsed');
            if (collapsed === 'true') {
                sideNav.classList.add('collapsed');
                mainContent.classList.add('nav-collapsed');
            }
            const lastAnimation = localStorage.getItem('lastAnimation');
            if (lastAnimation) {
                // Defer to ensure DOM is ready
                setTimeout(() => this.switchAnimation(lastAnimation), 0);
            }
        } catch {}

        // Apply responsive layout once on load
        applySideNavLayout();

        // Brownian Motion Controls
        this.setupSliderControl('particleCount', 'particleCountValue', (value) => {
            this.brownianMotion.setParticleCount(parseInt(value));
        });
        
        this.setupSliderControl('speed', 'speedValue', (value) => {
            this.brownianMotion.setSpeed(parseFloat(value));
        });
        
        this.setupSliderControl('temperature', 'temperatureValue', (value) => {
            this.brownianMotion.setTemperature(parseFloat(value));
        });
        
        this.setupSliderControl('brownianParticleSize', 'brownianParticleSizeValue', (value) => {
            this.brownianMotion.setParticleSize(parseInt(value));
        });
        
        document.getElementById('brownianVisualizationMode').addEventListener('change', (e) => {
            this.updateBrownianVisualization(e.target.value);
        });
        
        // Initialize Brownian visualization mode
        this.updateBrownianVisualization('basic');
        
        // Pendulum Controls
        this.setupSliderControl('pendulumLength', 'pendulumLengthValue', (value) => {
            this.pendulum.setLength(parseInt(value));
        });
        
        this.setupSliderControl('pendulumSpeed', 'pendulumSpeedValue', (value) => {
            this.pendulum.setSpeed(parseFloat(value));
        });
        
        this.setupSliderControl('initialAngle', 'initialAngleValue', (value) => {
            this.pendulum.setInitialAngle(parseFloat(value));
        });
        
        this.setupSliderControl('gravity', 'gravityValue', (value) => {
            this.pendulum.setGravity(parseFloat(value));
        });
        
        this.setupSliderControl('damping', 'dampingValue', (value) => {
            this.pendulum.setDamping(parseFloat(value));
        });
        
        document.getElementById('pendulumVisualizationMode').addEventListener('change', (e) => {
            this.updatePendulumVisualization(e.target.value);
        });
        
        // Initialize pendulum visualization mode
        this.updatePendulumVisualization('basic');
        
        // Diffusion Controls
        this.setupSliderControl('diffusionParticles', 'diffusionParticlesValue', (value) => {
            this.diffusion.setParticleCount(parseInt(value));
        });
        
        this.setupSliderControl('diffusionSpeed', 'diffusionSpeedValue', (value) => {
            this.diffusion.setSpeed(parseFloat(value));
        });
        
        this.setupSliderControl('diffusionRate', 'diffusionRateValue', (value) => {
            this.diffusion.setDiffusionRate(parseFloat(value));
        });
        
        this.setupSliderControl('concentrationGradient', 'concentrationGradientValue', (value) => {
            this.diffusion.setConcentrationGradient(parseFloat(value));
        });
        
        this.setupSliderControl('diffusionParticleSize', 'diffusionParticleSizeValue', (value) => {
            this.diffusion.setParticleSize(parseInt(value));
        });
        
        document.getElementById('diffusionVisualizationMode').addEventListener('change', (e) => {
            this.updateDiffusionVisualization(e.target.value);
        });
        
        // Remove the start diffusion button event listener since the button was removed
        // Diffusion will now start on canvas click/touch
        
        // Initialize diffusion visualization mode
        this.updateDiffusionVisualization('basic');
        
        // Wave Controls
        const waveTypeElement = document.getElementById('waveType');
        if (waveTypeElement) {
            waveTypeElement.addEventListener('change', (e) => {
                e.stopPropagation(); // Prevent event bubbling
                e.preventDefault(); // Prevent default behavior
            this.waves.setWaveType(e.target.value);
        });
        }
        
        this.setupSliderControl('waveSpeed', 'waveSpeedValue', (value) => {
            this.waves.setSpeed(parseFloat(value));
        });
        
        this.setupSliderControl('waveFrequency', 'waveFrequencyValue', (value) => {
            this.waves.setFrequency(parseFloat(value));
        });
        
        this.setupSliderControl('waveAmplitude', 'waveAmplitudeValue', (value) => {
            this.waves.setAmplitude(parseFloat(value));
        });
        
        const waveShowAnalyticsElement = document.getElementById('waveShowAnalytics');
        if (waveShowAnalyticsElement) {
            waveShowAnalyticsElement.addEventListener('change', (e) => {
            this.waves.setShowAnalytics(e.target.checked);
        });
        }
        
        // Sound Waves Controls
        this.setupSliderControl('soundFrequency', 'soundFrequencyValue', (value) => {
            this.soundWaves.setFrequency(parseInt(value));
        });
        
        this.setupSliderControl('soundAmplitude', 'soundAmplitudeValue', (value) => {
            this.soundWaves.setAmplitude(parseInt(value));
        });
        
        this.setupSliderControl('soundSpeed', 'soundSpeedValue', (value) => {
            this.soundWaves.setWaveSpeed(parseInt(value));
        });
        
        this.setupSliderControl('soundParticles', 'soundParticlesValue', (value) => {
            this.soundWaves.setParticleCount(parseInt(value));
        });
        
        this.setupSliderControl('soundAnimationSpeed', 'soundAnimationSpeedValue', (value) => {
            this.soundWaves.setAnimationSpeed(parseFloat(value));
        });
        
        // Sound waves select and checkbox controls
        const soundWaveTypeSelect = document.getElementById('soundWaveType');
        if (soundWaveTypeSelect) {
            soundWaveTypeSelect.addEventListener('change', (e) => {
                this.soundWaves.setWaveType(e.target.value);
            });
        }
        
        // Orbital Motion Controls
        this.setupSliderControl('orbitalSpeed', 'orbitalSpeedValue', (value) => {
            this.orbital.setSpeed(parseFloat(value));
        });
        
        this.setupSliderControl('eccentricity', 'eccentricityValue', (value) => {
            this.orbital.setEccentricity(parseFloat(value));
        });
        
        this.setupSliderControl('semiMajorAxis', 'semiMajorAxisValue', (value) => {
            this.orbital.setSemiMajorAxis(parseInt(value));
        });
        
        this.setupSliderControl('centralMass', 'centralMassValue', (value) => {
            this.orbital.setCentralMass(parseFloat(value));
        });
        
        document.getElementById('orbitalVisualizationMode').addEventListener('change', (e) => {
            this.updateOrbitalVisualization(e.target.value);
        });
        
        // Initialize orbital visualization mode
        this.updateOrbitalVisualization('basic');
        
        // Electric Fields Controls
        this.setupSliderControl('efSpeed', 'efSpeedValue', (value) => {
            this.electricFields.setSpeed(parseFloat(value));
        });
        
        this.setupSliderControl('efFieldStrength', 'efFieldStrengthValue', (value) => {
            this.electricFields.setFieldStrength(parseFloat(value));
        });
        
        this.setupSliderControl('efParticleCount', 'efParticleCountValue', (value) => {
            this.electricFields.setParticleCount(parseInt(value));
        });
        
        // Removed addChargeBtn and clearChargesBtn event listeners
        

        
        // Magnetic Fields Controls
        this.setupSliderControl('magneticSpeed', 'magneticSpeedValue', (value) => {
            this.magneticFields.setSpeed(parseFloat(value));
        });
        
        this.setupSliderControl('magneticFieldStrength', 'magneticFieldStrengthValue', (value) => {
            this.magneticFields.setFieldStrength(parseFloat(value));
        });
        
        this.setupSliderControl('magneticParticleCount', 'magneticParticleCountValue', (value) => {
            this.magneticFields.setParticleCount(parseInt(value));
        });
        
        document.getElementById('magneticShowFieldLines').addEventListener('change', (e) => {
            this.magneticFields.setShowFieldLines(e.target.checked);
        });
        

        

        
        // Removed addMagnetBtn and clearMagnetsBtn event listeners
        
        // Canvas click for adding charges, magnets, toggling switch, starting diffusion, and neural network testing
        this.canvas.addEventListener('click', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            if (this.currentAnimation === 'electric-fields') {
                const chargeType = document.getElementById('efChargeType').value;
                this.electricFields.addChargeAtPosition(chargeType, x, y);
            } else if (this.currentAnimation === 'magnetic-fields') {
                // Add complete magnet with both poles
                this.magneticFields.addMagnetAtPosition(x, y);

            } else if (this.currentAnimation === 'diffusion' && !this.diffusion.diffusionStarted) {
                this.diffusion.startDiffusion();
            } else if (this.currentAnimation === 'sound-waves') {
                const sx = this.soundWaves.sourceX;
                const sy = this.soundWaves.sourceY;
                const distance = Math.sqrt((x - sx) ** 2 + (y - sy) ** 2);
                if (distance <= 50) {
                    this.soundWaves.triggerWavePulse();
                }
            } else if (this.currentAnimation === 'neural-network') {
                this.neuralNetwork.handleCanvasClick(x, y);
            } else if (this.currentAnimation === 'memory-management' && this.memoryManagement) {
                this.memoryManagement.handleClick(x, y);
            }
        });
        
        // Gas Laws Controls
        this.setupSliderControl('gasSpeed', 'gasSpeedValue', (value) => {
            this.gasLaws.setSpeed(parseFloat(value));
        });
        
        this.setupSliderControl('gasParticleCount', 'gasParticleCountValue', (value) => {
            this.gasLaws.setParticleCount(parseInt(value));
        });
        
        this.setupSliderControl('gasTemperature', 'gasTemperatureValue', (value) => {
            this.gasLaws.setTemperature(parseInt(value));
        });
        
        this.setupSliderControl('gasVolume', 'gasVolumeValue', (value) => {
            this.gasLaws.setVolume(parseInt(value));
        });
        
        this.setupSliderControl('gasPressure', 'gasPressureValue', (value) => {
            this.gasLaws.setPressure(parseFloat(value));
        });
        
        document.getElementById('gasVisualizationMode').addEventListener('change', (e) => {
            this.updateGasVisualization(e.target.value);
        });
        
        document.getElementById('lawType').addEventListener('change', (e) => {
            this.gasLaws.setLawType(e.target.value);
        });
        
        // Initialize gas visualization mode
        this.updateGasVisualization('basic');
        

        
        // Collision Physics Controls
        this.setupSliderControl('collisionSpeed', 'collisionSpeedValue', (value) => {
            this.collisions.setSpeed(parseFloat(value));
        });
        
        this.setupSliderControl('ballCount', 'ballCountValue', (value) => {
            this.collisions.setBallCount(parseInt(value));
        });
        
        this.setupSliderControl('restitution', 'restitutionValue', (value) => {
            this.collisions.setRestitution(parseFloat(value));
        });
        

        
        this.setupSliderControl('collisionGravity', 'collisionGravityValue', (value) => {
            this.collisions.setGravity(parseFloat(value));
        });
        
        // Analytics are always enabled for collision physics
        
        document.getElementById('collisionType').addEventListener('change', (e) => {
            this.collisions.setCollisionType(e.target.value);
        });
        
        // Friction & Inclined Planes Controls
        this.setupSliderControl('frictionSpeed', 'frictionSpeedValue', (value) => {
            this.friction.setSpeed(parseFloat(value));
        });
        
        this.setupSliderControl('inclineAngle', 'inclineAngleValue', (value) => {
            this.friction.setInclineAngle(parseFloat(value));
        });
        
        this.setupSliderControl('objectMass', 'objectMassValue', (value) => {
            this.friction.setObjectMass(parseInt(value));
        });
        
        this.setupSliderControl('frictionGravity', 'frictionGravityValue', (value) => {
            this.friction.setGravity(parseFloat(value));
        });
        
        // Analytics are always enabled for friction physics
        
        this.setupSliderControl('frictionCoefficient', 'frictionCoefficientValue', (value) => {
            this.friction.setFrictionCoefficient(parseFloat(value));
        });
        

        
        // Window resize
        window.addEventListener('resize', () => {
            // Auto-resize canvas
            this.resizeCanvas();
            // Auto-adjust nav layout if user hasn't explicitly toggled
            const sideNav = document.querySelector('.side-navigation');
            const mainContent = document.querySelector('.main-content');
            if (sideNav && mainContent) {
                const userToggled = (() => { try { return localStorage.getItem('sideNavUserToggled') === 'true'; } catch { return false; } })();
                if (!userToggled) {
                    const width = window.innerWidth || document.documentElement.clientWidth;
                    if (width <= 768) {
                        sideNav.classList.remove('collapsed');
                        mainContent.classList.remove('nav-collapsed');
                    } else if (width < 1200) {
                        sideNav.classList.add('collapsed');
                        mainContent.classList.add('nav-collapsed');
                    } else {
                        sideNav.classList.remove('collapsed');
                        mainContent.classList.remove('nav-collapsed');
                    }
                }
            }
        });
        
        // Comprehensive touch event handling for mobile support
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const rect = this.canvas.getBoundingClientRect();
            const touch = e.touches[0];
            const x = touch.clientX - rect.left;
            const y = touch.clientY - rect.top;
            
            // Handle different animations based on current animation
            if (this.currentAnimation === 'diffusion' && !this.diffusion.diffusionStarted) {
                this.diffusion.startDiffusion();
            } else if (this.currentAnimation === 'electric-fields') {
                const chargeType = document.getElementById('efChargeType').value;
                this.electricFields.addChargeAtPosition(chargeType, x, y);
            } else if (this.currentAnimation === 'magnetic-fields') {
                // Add complete magnet with both poles
                this.magneticFields.addMagnetAtPosition(x, y);
            } else if (this.currentAnimation === 'sound-waves') {
                const sx = this.soundWaves.sourceX;
                const sy = this.soundWaves.sourceY;
                const distance = Math.sqrt((x - sx) ** 2 + (y - sy) ** 2);
                if (distance <= 50) {
                    this.soundWaves.triggerWavePulse();
                }
            } else if (this.currentAnimation === 'neural-network') {
                this.neuralNetwork.handleCanvasClick(x, y);
            } else if (this.currentAnimation === 'memory-management' && this.memoryManagement) {
                this.memoryManagement.handleClick(x, y);
            } else if (this.currentAnimation === 'nuclear-reactions') {
                // Start reacting particle movement for nuclear reactions
                this.nuclearReactions.reactingParticles.forEach(particle => {
                    if (!particle.moving) {
                        this.nuclearReactions.findTargetForParticle(particle);
                        particle.moving = true;
                    }
                });
            }
        });
        
        // Prevent default touch behaviors that might interfere
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
        });
        
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
        });
        

        
        // Wave-Particle Duality Controls
        document.getElementById('dualityMode').addEventListener('change', (e) => {
            this.waveParticleDuality.setMode(e.target.value);
            this.updateDualityControls(e.target.value);
        });
        
        this.setupSliderControl('dualitySpeed', 'dualitySpeedValue', (value) => {
            this.waveParticleDuality.setSpeed(parseFloat(value));
        });
        
        this.setupSliderControl('dualityEnergy', 'dualityEnergyValue', (value) => {
            this.waveParticleDuality.setPhotonEnergy(parseFloat(value));
        });
        
        this.setupSliderControl('dualityWavelength', 'dualityWavelengthValue', (value) => {
            this.waveParticleDuality.setWavelength(parseFloat(value));
        });
        

        

        
        document.getElementById('performMeasurementBtn').addEventListener('click', () => {
            this.waveParticleDuality.performMeasurement();
        });
        
        // Removed resetDualityBtn event listener - main Reset button handles this
        
        // Initialize duality controls based on current mode
        const initialMode = document.getElementById('dualityMode').value;
        this.updateDualityControls(initialMode);
        
        this.setupSliderControl('nuclearSpeed', 'nuclearSpeedValue', (value) => {
            this.nuclearReactions.setSpeed(parseFloat(value));
        });
        
        this.setupSliderControl('neutronEnergy', 'neutronEnergyValue', (value) => {
            this.nuclearReactions.setNeutronEnergy(parseFloat(value));
        });
        
        this.setupSliderControl('nuclearTemperature', 'nuclearTemperatureValue', (value) => {
            this.nuclearReactions.setTemperature(parseFloat(value));
        });
        
        document.getElementById('nuclearMode').addEventListener('change', (e) => {
            this.nuclearReactions.setMode(e.target.value);
        });
        
        // Fluid Flow Controls
        this.setupSliderControl('fluidSpeed', 'fluidSpeedValue', (value) => {
            this.fluidFlow.setFlowRate(parseFloat(value));
        });
        
        this.setupSliderControl('flowRate', 'flowRateValue', (value) => {
            this.fluidFlow.setFlowRate(parseFloat(value));
        });
        
        this.setupSliderControl('viscosity', 'viscosityValue', (value) => {
            this.fluidFlow.setViscosity(parseFloat(value));
        });
        
        this.setupSliderControl('reynoldsNumber', 'reynoldsNumberValue', (value) => {
            this.fluidFlow.setReynoldsNumber(parseInt(value));
        });
        
        document.getElementById('fluidVisualizationMode').addEventListener('change', (e) => {
            this.fluidFlow.setVisualizationMode(e.target.value);
        });
        
        // Bernoulli's Principle Controls
        this.setupSliderControl('pressureDifference', 'pressureDifferenceValue', (value) => {
            this.bernoulli.setPressureDifference(parseFloat(value));
        });
        
        // Sound Waves Controls
        this.setupSliderControl('soundAnimationSpeed', 'soundAnimationSpeedValue', (value) => {
            this.soundWaves.setAnimationSpeed(parseFloat(value));
        });
        
        this.setupSliderControl('soundFrequency', 'soundFrequencyValue', (value) => {
            this.soundWaves.setFrequency(parseInt(value));
        });
        
        this.setupSliderControl('soundAmplitude', 'soundAmplitudeValue', (value) => {
            this.soundWaves.setAmplitude(parseInt(value));
        });
        
        this.setupSliderControl('soundSpeed', 'soundSpeedValue', (value) => {
            this.soundWaves.setWaveSpeed(parseInt(value));
        });
        
        this.setupSliderControl('soundParticles', 'soundParticlesValue', (value) => {
            this.soundWaves.setParticleCount(parseInt(value));
        });
        
        document.getElementById('soundWaveType').addEventListener('change', (e) => {
            this.soundWaves.setWaveType(e.target.value);
        });
        
        this.canvas.addEventListener('click', (e) => {
            if (this.currentAnimation === 'sound-waves') {
                const rect = this.canvas.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                const sx = this.soundWaves.sourceX;
                const sy = this.soundWaves.sourceY;
                const distance = Math.sqrt((x - sx) ** 2 + (y - sy) ** 2);
                if (distance <= 50) { // Increased click radius from 30 to 50 pixels
                    this.soundWaves.triggerWavePulse();
                }
            }
        });

        // Diode & Transistor Controls
        const componentTypeSelect = document.getElementById('diodeComponentType');
        const biasTypeSelect = document.getElementById('diodeBiasType');
        
        if (componentTypeSelect) {
            componentTypeSelect.addEventListener('change', (e) => {
                if (this.diodeTransistor) {
                    this.diodeTransistor.setComponentType(e.target.value);
                }
            });
        }
        
        if (biasTypeSelect) {
            biasTypeSelect.addEventListener('change', (e) => {
                if (this.diodeTransistor) {
                    this.diodeTransistor.setBiasType(e.target.value);
                }
            });
        }
        
        this.setupSliderControl('diodeInputVoltage', 'diodeInputVoltageValue', (value) => {
            if (this.diodeTransistor) {
                this.diodeTransistor.setInputVoltage(parseFloat(value));
            }
        });
        
        this.setupSliderControl('diodeBaseVoltage', 'diodeBaseVoltageValue', (value) => {
            if (this.diodeTransistor) {
                this.diodeTransistor.setBaseVoltage(parseFloat(value));
            }
        });
        
        this.setupSliderControl('diodeAnimationSpeed', 'diodeAnimationSpeedValue', (value) => {
            if (this.diodeTransistor) {
                this.diodeTransistor.setAnimationSpeed(parseFloat(value));
            }
        });
        
        // Neural Network Controls
        this.setupSliderControl('neuralLearningRate', 'neuralLearningRateValue', (value) => {
            if (this.neuralNetwork) {
                this.neuralNetwork.setLearningRate(parseFloat(value));
            }
        });
        
        this.setupSliderControl('neuralSpeed', 'neuralSpeedValue', (value) => {
            if (this.neuralNetwork) {
                this.neuralNetwork.setSpeed(parseFloat(value));
            }
        });
        
        // Memory Management Controls
        this.setupSliderControl('memorySpeed', 'memorySpeedValue', (value) => {
            if (this.memoryManagement) {
                this.memoryManagement.setAnimationSpeed(parseFloat(value));
            }
        });
        
        // Show Program Output toggle
        const showOutputCheckbox = document.getElementById('showOutput');
        if (showOutputCheckbox && this.memoryManagement) {
            showOutputCheckbox.checked = this.memoryManagement.showOutput;
            showOutputCheckbox.addEventListener('change', (e) => {
                this.memoryManagement.setShowOutput(e.target.checked);
            });
        }

        // Blockchain Controls
        this.setupSliderControl('blockchainSpeed', 'blockchainSpeedValue', (value) => {
            if (this.blockchain) {
                this.blockchain.setSpeed(parseFloat(value));
            }
        });
        
        this.setupSliderControl('blockchainDifficulty', 'blockchainDifficultyValue', (value) => {
            if (this.blockchain) {
                this.blockchain.setDifficulty(parseInt(value));
            }
        });
        

        

        


        // Neural Network Mode Selector
        const neuralMode = document.getElementById('neuralMode');
        if (neuralMode) {
            neuralMode.addEventListener('change', (e) => {
                if (this.neuralNetwork) {
                    const isTesting = e.target.value === 'testing';
                    this.neuralNetwork.setTestingMode(isTesting);
                    
                    // Set appropriate defaults for each mode
                    if (isTesting) {
                        this.neuralNetwork.setShowWeights(true);
                        this.neuralNetwork.setShowGradients(false);
                        this.neuralNetwork.setShowLoss(false);
                        this.neuralNetwork.setAutoTrain(false);
                    } else {
                        this.neuralNetwork.setShowWeights(true);
                        this.neuralNetwork.setShowGradients(false);
                        this.neuralNetwork.setShowLoss(true);
                        this.neuralNetwork.setAutoTrain(true);
                    }
                }
            });
        }
        

    }
    
    setupSliderControl(sliderId, valueId, callback) {
        const slider = document.getElementById(sliderId);
        const valueDisplay = document.getElementById(valueId);
        
        if (!slider) {
            console.warn(`Slider not found: ${sliderId}`);
            return;
        }
        
        if (!valueDisplay) {
            console.warn(`Value display not found: ${valueId}`);
            return;
        }
        
        const formatAndApply = (val) => {
            const raw = typeof val === 'string' ? val : String(val);
            const parsedNum = Number(raw);
            const customUnit = valueDisplay.dataset.unit || slider.dataset.unit || '';
            const decimalsAttr = valueDisplay.dataset.decimals || slider.dataset.decimals;
            const decimals = decimalsAttr !== undefined ? Number(decimalsAttr) : undefined;
            const fallbackUnit = sliderId.includes('Speed') ? 'x' : 
                        sliderId.includes('Angle') ? '°' : 
                        sliderId.includes('Length') ? '' : 
                        sliderId.includes('Wavelength') ? ' px' :
                        sliderId.includes('Frequency') ? ' Hz' : 
                        sliderId.includes('gasTemperature') ? 'K' : 
                        sliderId.includes('frictionCoefficient') ? '' : 
                        sliderId.includes('Voltage') ? 'V' : '';
            const unit = customUnit || fallbackUnit;
            const displayVal = !Number.isNaN(parsedNum) && decimals !== undefined
                ? parsedNum.toFixed(decimals)
                : raw;
            valueDisplay.textContent = displayVal + unit;
            callback(raw);
        };

        slider.addEventListener('input', (e) => {
            formatAndApply(e.target.value);
        });

        // Initialize display and underlying value on load
        formatAndApply(slider.value);
    }
    
    updateDualityControls(mode) {
        const performMeasurementBtn = document.getElementById('performMeasurementBtn');
        
        // Show measurement button only for superposition and measurement modes
        if (mode === 'superposition' || mode === 'measurement') {
            performMeasurementBtn.style.display = 'inline-block';
        } else {
            performMeasurementBtn.style.display = 'none';
        }
    }
    
    updateBrownianVisualization(mode) {
        // Reset all visualization options
        this.brownianMotion.setShowTemperatureHeatmap(false);
        this.brownianMotion.setShowVelocityDistribution(false);
        this.brownianMotion.setShowMeanFreePath(false);
        
        // Enable features based on mode
        switch(mode) {
            case 'basic':
                // Just basic particle motion, no extra visualizations
                break;
            case 'heatmap':
                this.brownianMotion.setShowTemperatureHeatmap(true);
                break;
            case 'advanced':
                // Show all advanced features
                this.brownianMotion.setShowTemperatureHeatmap(true);
                this.brownianMotion.setShowVelocityDistribution(true);
                this.brownianMotion.setShowMeanFreePath(true);
                break;
        }
    }
    
    updateDiffusionVisualization(mode) {
        const diffusion = this.diffusion;
        
        switch (mode) {
            case 'basic':
                diffusion.setShowConcentration(false);
                diffusion.setShowConcentrationProfile(false);
                diffusion.setShowParticleTrails(false);
                break;
            case 'heatmap':
                diffusion.setShowConcentration(true);
                diffusion.setShowConcentrationProfile(false);
                diffusion.setShowParticleTrails(false);
                break;
            case 'profile':
                diffusion.setShowConcentration(false);
                diffusion.setShowConcentrationProfile(true);
                diffusion.setShowParticleTrails(false);
                break;
            case 'advanced':
                diffusion.setShowConcentration(true);
                diffusion.setShowConcentrationProfile(true);
                diffusion.setShowParticleTrails(true);
                break;
        }
    }
    
    updateGasVisualization(mode) {
        const gasLaws = this.gasLaws;
        
        switch (mode) {
            case 'basic':
                gasLaws.setShowPressureGauge(true);
                gasLaws.setShowPressureHeatmap(false);
                gasLaws.setShowVelocityDistribution(false);
                gasLaws.setShowGasLawGraph(false);
                gasLaws.setShowParticleCollisions(false);
                break;
            case 'pressure':
                gasLaws.setShowPressureGauge(true);
                gasLaws.setShowPressureHeatmap(true);
                gasLaws.setShowVelocityDistribution(false);
                gasLaws.setShowGasLawGraph(true);
                gasLaws.setShowParticleCollisions(false);
                break;
            case 'advanced':
                gasLaws.setShowPressureGauge(true);
                gasLaws.setShowPressureHeatmap(true);
                gasLaws.setShowVelocityDistribution(true);
                gasLaws.setShowGasLawGraph(true);
                gasLaws.setShowParticleCollisions(true);
                break;
        }
    }
    
    updatePendulumVisualization(mode) {
        const pendulum = this.pendulum;
        
        switch (mode) {
            case 'basic':
                pendulum.setShowPath(false);
                pendulum.setShowVelocityVectors(false);
                pendulum.setShowForceVectors(true);
                pendulum.setShowEnergyInfo(false);
                pendulum.setShowPhaseSpace(false);
                break;
            case 'vectors':
                pendulum.setShowPath(false);
                pendulum.setShowVelocityVectors(true);
                pendulum.setShowForceVectors(true);
                pendulum.setShowEnergyInfo(false);
                pendulum.setShowPhaseSpace(false);
                break;
            case 'advanced':
                pendulum.setShowPath(true);
                pendulum.setShowVelocityVectors(true);
                pendulum.setShowForceVectors(true);
                pendulum.setShowEnergyInfo(true);
                pendulum.setShowPhaseSpace(true);
                break;
        }
    }
    
    updateOrbitalVisualization(mode) {
        switch(mode) {
            case 'basic':
                this.orbital.setShowOrbitPath(true);
                this.orbital.setShowVelocityVector(false);
                this.orbital.setShowKeplerInfo(false);
                break;
            case 'advanced':
                this.orbital.setShowOrbitPath(true);
                this.orbital.setShowVelocityVector(true);
                this.orbital.setShowKeplerInfo(true);
                break;
        }
    }
    
    switchCategory(category) {
        
        // Update category buttons
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        const categoryBtn = document.querySelector(`[data-category="${category}"]`);
        if (categoryBtn) {
            categoryBtn.classList.add('active');
        }
        
        // Hide all animation groups
        document.querySelectorAll('.animation-group').forEach(group => {
            group.classList.remove('active');
        });
        
        // Show current category's animations
        const animationGroup = document.getElementById(`${category}-animations`);
        if (animationGroup) {
            animationGroup.classList.add('active');
        }
        
        // Switch to first available animation in category
        const firstAnimation = document.querySelector(`#${category}-animations .nav-btn:not(.disabled)`);
        if (firstAnimation) {
            this.switchAnimation(firstAnimation.dataset.animation);
        } else {
            console.warn('No available animations found for category:', category);
        }
    }
    
    switchAnimation(animationType) {
        if (animationType === this.currentAnimation) {
            return;
        }
        
        // Update active submenu item
        document.querySelectorAll('.submenu-item').forEach(item => {
            item.classList.remove('active');
        });
        
        const activeItem = document.querySelector(`[data-animation="${animationType}"]`);
        if (activeItem) {
            activeItem.classList.add('active');
            
            // Ensure the parent category is active
            const categoryItem = activeItem.closest('.category-item');
            if (categoryItem) {
                // Close all other categories
                document.querySelectorAll('.category-item').forEach(item => {
                    if (item !== categoryItem) {
                        item.classList.remove('active');
                    }
                });
                
                // Open the parent category
                categoryItem.classList.add('active');
            }
        }
        

        
        // Hide all control panels
        document.querySelectorAll('.animation-controls').forEach(panel => {
            panel.style.display = 'none';
        });
        
        // Show current control panel
        const controlPanel = document.getElementById(`${animationType}-controls`);
        if (controlPanel) {
            controlPanel.style.display = 'block';
        }
        
        // Hide all info panels
        document.querySelectorAll('.animation-info').forEach(panel => {
            panel.style.display = 'none';
        });
        
        // Show current info panel
        const infoPanel = document.getElementById(`${animationType}-info`);
        if (infoPanel) {
            infoPanel.style.display = 'block';
        }
        
        this.currentAnimation = animationType;
        try { localStorage.setItem('lastAnimation', animationType); } catch {}
        this.resetAnimation();
        
        // Initialize wave controls if switching to waves animation
        if (animationType === 'waves') {
            this.initializeWaveControls();
        }
        
        // Initialize sound waves controls if switching to sound-waves animation
        if (animationType === 'sound-waves') {
            this.initializeSoundWavesControls();
        }
        
        // Initialize diode-transistor controls if switching to diode-transistor animation
        if (animationType === 'diode-transistor') {
            // Wait for the control panel to be visible before initializing
            setTimeout(() => {
                this.initializeDiodeTransistorControls();
            }, 50);
        }
        
        // Initialize memory management animation if switching to memory-management animation
        if (animationType === 'memory-management') {
            // Ensure memory management starts immediately
            setTimeout(() => {
                if (this.memoryManagement) {
                    this.memoryManagement.startExecution();
                }
            }, 100);
        }
        

    }
    
    initializeWaveControls() {
        // Synchronize control values with wave parameters
        const speedSlider = document.getElementById('waveSpeed');
        const frequencySlider = document.getElementById('waveFrequency');
        const amplitudeSlider = document.getElementById('waveAmplitude');
        
        if (speedSlider && this.waves) {
            speedSlider.value = this.waves.speed;
            document.getElementById('waveSpeedValue').textContent = this.waves.speed + 'x';
        }
        
        if (frequencySlider && this.waves) {
            frequencySlider.value = this.waves.frequency;
            document.getElementById('waveFrequencyValue').textContent = this.waves.frequency;
        }
        
        if (amplitudeSlider && this.waves) {
            amplitudeSlider.value = this.waves.amplitude;
            document.getElementById('waveAmplitudeValue').textContent = this.waves.amplitude;
        }
        
        // Recalculate wave parameters to ensure they're correct
        if (this.waves) {
            this.waves.calculateWaveParameters();
        }
    }
    
    initializeSoundWavesControls() {
        
        // Synchronize control values with sound waves parameters
        const frequencySlider = document.getElementById('soundFrequency');
        const amplitudeSlider = document.getElementById('soundAmplitude');
        const speedSlider = document.getElementById('soundSpeed');
        const particlesSlider = document.getElementById('soundParticles');
        const animationSpeedSlider = document.getElementById('soundAnimationSpeed');
        const waveTypeSelect = document.getElementById('soundWaveType');
        
        if (frequencySlider && this.soundWaves) {
            frequencySlider.value = this.soundWaves.frequency;
            document.getElementById('soundFrequencyValue').textContent = this.soundWaves.frequency + ' Hz';
        }
        
        if (amplitudeSlider && this.soundWaves) {
            amplitudeSlider.value = this.soundWaves.amplitude;
            document.getElementById('soundAmplitudeValue').textContent = this.soundWaves.amplitude + '%';
        }
        
        if (speedSlider && this.soundWaves) {
            speedSlider.value = this.soundWaves.waveSpeed;
            document.getElementById('soundSpeedValue').textContent = this.soundWaves.waveSpeed + ' m/s';
        }
        
        if (particlesSlider && this.soundWaves) {
            particlesSlider.value = this.soundWaves.particleCount;
            document.getElementById('soundParticlesValue').textContent = this.soundWaves.particleCount;
        }
        
        if (animationSpeedSlider && this.soundWaves) {
            animationSpeedSlider.value = this.soundWaves.animationSpeed;
            document.getElementById('soundAnimationSpeedValue').textContent = this.soundWaves.animationSpeed + 'x';
        }
        
        if (waveTypeSelect && this.soundWaves) {
            waveTypeSelect.value = this.soundWaves.waveType;
        }
    }
    
    initializeDiodeTransistorControls() {
        const componentTypeSelect = document.getElementById('diodeComponentType');
        const biasTypeSelect = document.getElementById('diodeBiasType');
        
        if (componentTypeSelect && this.diodeTransistor) {
            componentTypeSelect.value = this.diodeTransistor.componentType;
            componentTypeSelect.dispatchEvent(new Event('change'));
        }
        if (biasTypeSelect && this.diodeTransistor) {
            biasTypeSelect.value = this.diodeTransistor.biasType;
            biasTypeSelect.dispatchEvent(new Event('change'));
        }
    }
    
    togglePlayPause() {
        this.isRunning = !this.isRunning;
        const btn = document.getElementById('playPauseBtn');
        btn.textContent = this.isRunning ? 'Pause' : 'Play';
    }
    
    resetAnimation() {
        switch(this.currentAnimation) {
            case 'brownian':
                this.brownianMotion.reset();
                break;
            case 'pendulum':
                this.pendulum.reset();
                break;
            case 'diffusion':
                this.diffusion.reset();
                break;
            case 'waves':
                this.waves.reset();
                break;
            case 'orbital':
                this.orbital.reset();
                break;
            case 'electric-fields':
                this.electricFields.reset();
                break;
            case 'gas-laws':
                this.gasLaws.reset();
                break;
            case 'collisions':
                this.collisions.reset();
                break;
            case 'friction':
                this.friction.reset();
                break;

            case 'magnetic-fields':
                this.magneticFields.reset();
                break;

            case 'wave-particle-duality':
                this.waveParticleDuality.reset();
                break;   
            case 'nuclear-reactions':
                this.nuclearReactions.reset();
                break;
            case 'fluid-flow':
                this.fluidFlow.reset();
                break;
            case 'bernoulli':
                this.bernoulli.reset();
                break;
            case 'sound-waves':
                this.soundWaves.reset();
                break;
            case 'diode-transistor':
                this.diodeTransistor.reset();
                break;
            case 'neural-network':
                this.neuralNetwork.reset();
                break;
            case 'memory-management':
                this.memoryManagement.reset();
                break;
            case 'blockchain':
                this.blockchain.reset();
                break;
        }
    }
    
    resizeCanvas() {
        const container = this.canvas.parentElement;
        // Account for padding: container has 20px padding, animation-container has 20px padding
        const availableWidth = container ? container.clientWidth - 40 : 800; // 20px padding on each side
        const maxWidth = Math.max(availableWidth, 800); // Minimum width of 800px
        
        // Maintain 4:3 aspect ratio with minimum height
        this.canvas.width = maxWidth;
        this.canvas.height = Math.max(maxWidth / 1.333, 400); // 4:3 aspect ratio (1.333) with min height of 400px
        
        // Update source and receiver positions for sound waves
        if (this.soundWaves) {
            this.soundWaves.setSourcePosition(100, this.canvas.height / 2);
            this.soundWaves.setReceiverPosition(this.canvas.width - 100, this.canvas.height / 2);
        }
        
        // Resize neural network to center it on the new canvas size
        if (this.neuralNetwork) {
            this.neuralNetwork.resize();
        }
        
        // Initialize neural network if it hasn't been initialized yet
        if (this.neuralNetwork && this.neuralNetwork.neurons.length === 0) {
            this.neuralNetwork.initializeNetwork();
        }
    }
    
    animate(currentTime = 0) {
        if (!this.isRunning) {
            requestAnimationFrame((time) => this.animate(time));
            return;
        }
        
        // Initialize lastTime on first frame
        if (this.lastTime === undefined) {
            this.lastTime = currentTime;
        }
        
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Update and render current animation
        switch(this.currentAnimation) {
            case 'brownian':
                this.brownianMotion.update(deltaTime);
                this.brownianMotion.render();
                this.updateBrownianStats();
                break;
            case 'pendulum':
                this.pendulum.update(deltaTime);
                this.pendulum.render();
                this.updatePendulumStats();
                break;
            case 'diffusion':
                this.diffusion.update(deltaTime);
                this.diffusion.render();
                this.updateDiffusionStats();
                break;
            case 'waves':
                this.waves.update(deltaTime);
                this.waves.render();
                this.updateWaveStats();
                break;
            case 'orbital':
                this.orbital.update(deltaTime);
                this.orbital.render();
                this.updateOrbitalStats();
                break;
            case 'electric-fields':
                this.electricFields.update(deltaTime);
                this.electricFields.render();
                this.updateElectricFieldsStats();
                break;
            case 'gas-laws':
                this.gasLaws.update(deltaTime);
                this.gasLaws.render();
                this.updateGasLawsStats();
                break;
            case 'collisions':
                this.collisions.update(deltaTime);
                this.collisions.render();
                this.updateCollisionStats();
                break;
            case 'friction':
                this.friction.update(deltaTime);
                this.friction.render();
                this.updateFrictionStats();
                break;

            case 'magnetic-fields':
                this.magneticFields.update(deltaTime);
                this.magneticFields.render();
                this.updateMagneticFieldsStats();
                break;

            case 'wave-particle-duality':
                this.waveParticleDuality.update(deltaTime);
                this.waveParticleDuality.render();
                this.updateWaveParticleDualityStats();
                break;
            case 'nuclear-reactions':
                this.nuclearReactions.update(deltaTime);
                this.nuclearReactions.render();
                break;
            case 'fluid-flow':
                if (this.fluidFlow) {
                    this.fluidFlow.update(deltaTime);
                    this.fluidFlow.render();
                    this.updateFluidFlowStats();
                }
                break;
            case 'bernoulli':
                if (this.bernoulli) {
                    this.bernoulli.update(deltaTime);
                    this.bernoulli.render();
                    this.updateBernoulliStats();
                }
                break;
            case 'sound-waves':
                if (this.soundWaves) {
                    this.soundWaves.update(deltaTime);
                    this.soundWaves.render();
                    this.updateSoundWavesStats();
                }
                break;
            case 'diode-transistor':
                if (this.diodeTransistor) {
                    this.diodeTransistor.update(deltaTime);
                    this.diodeTransistor.render();
                    this.updateDiodeTransistorStats();
                }
                break;
            case 'neural-network':
                if (this.neuralNetwork) {
                    this.neuralNetwork.update(deltaTime);
                    this.neuralNetwork.render();
                    this.updateNeuralNetworkStats();
                }
                break;
            case 'memory-management':
                if (this.memoryManagement) {
                    this.memoryManagement.update(deltaTime);
                    this.memoryManagement.render();
                    this.updateMemoryManagementStats();
                }
                break;
            case 'blockchain':
                if (this.blockchain) {
                    this.blockchain.update(deltaTime);
                    this.blockchain.render();
                    this.updateBlockchainStats();
                } else {
                    console.error('Blockchain instance not found!');
                }
                break;
        }
        
        requestAnimationFrame((time) => this.animate(time));
    }
    
    // Unified stats update system
    updateStats(animationName, elementMappings) {
        const animation = this[animationName];
        if (!animation) return;
        
        const stats = animation.getStats();
        
        Object.entries(elementMappings).forEach(([elementId, config]) => {
            const element = document.getElementById(elementId);
            if (element) {
                const value = this.getNestedValue(stats, config.path);
                element.textContent = this.formatValue(value, config);
            }
        });
    }
    
    getNestedValue(obj, path) {
        return path.split('.').reduce((current, key) => {
            return current && current[key] !== undefined ? current[key] : null;
        }, obj);
    }
    
    formatValue(value, config) {
        if (value === null || value === undefined) {
            return config.fallback !== undefined ? config.fallback.toString() : '';
        }
        
        const { format, suffix, prefix, decimalPlaces, transform } = config;
        
        // Apply transform function if provided
        if (transform && typeof transform === 'function') {
            value = transform(value);
        }
        
        if (format === 'time') {
            return (value / 1000).toFixed(1) + 's';
        }
        
        if (format === 'angle') {
            return value.toFixed(decimalPlaces || 1) + '°';
        }
        
        if (format === 'percentage') {
            return value.toFixed(decimalPlaces || 1) + '%';
        }
        
        if (format === 'unit') {
            return value + (suffix || '');
        }
        
        if (format === 'decimal') {
            return value.toFixed(decimalPlaces || 2);
        }
        
        if (format === 'boolean') {
            return value ? 'Active' : 'Hidden';
        }
        
        if (format === 'capitalize') {
            return value.charAt(0).toUpperCase() + value.slice(1);
        }
        
        if (format === 'uppercase') {
            return value.toString().toUpperCase();
        }
        
        return value.toString();
    }
    
    updateBrownianStats() {
        this.updateStats('brownianMotion', {
            'activeParticles': { path: 'particleCount' },
            'avgSpeed': { path: 'avgSpeed', format: 'decimal', decimalPlaces: 2 },
            'simTime': { path: 'time', format: 'time' },
            'brownianCollisionCount': { path: 'collisionCount' },
            'brownianMeanFreePath': { path: 'meanFreePath', format: 'decimal', decimalPlaces: 1 },
            'brownianTemperature': { path: 'temperature', format: 'decimal', decimalPlaces: 1 }
        });
    }
    
    updatePendulumStats() {
        this.updateStats('pendulum', {
            'currentAngle': { path: 'angle', format: 'angle', decimalPlaces: 1 },
            'angularVelocity': { path: 'angularVelocity', format: 'decimal', decimalPlaces: 2 },
            'period': { path: 'theoreticalPeriod', format: 'unit', suffix: 's', decimalPlaces: 2 },
            'pendulumTime': { path: 'time', format: 'time' },
            'pendulumAirResistance': { path: 'airResistanceForce', format: 'decimal', decimalPlaces: 3 },
            'pendulumDamping': { path: 'dampingCoefficient', format: 'decimal', decimalPlaces: 3 }
        });
    }
    
    updateDiffusionStats() {
        this.updateStats('diffusion', {
            'diffusionParticleCount': { path: 'particleCount' },
            'diffusionAvgSpeed': { path: 'avgSpeed', format: 'decimal', decimalPlaces: 2 },
            'concentrationSpread': { path: 'concentrationSpread', format: 'decimal', decimalPlaces: 2 },
            'diffusionTime': { path: 'time', format: 'time' }
        });
    }
    

    
    updateWaveStats() {
        this.updateStats('waves', {
            'currentWaveType': { path: 'waveType' },
            'currentFrequency': { path: 'frequency', format: 'unit', suffix: ' Hz' },
            'currentWavelength': { path: 'wavelength', format: 'unit', suffix: ' px' },
            'currentAmplitude': { path: 'amplitude', format: 'unit', suffix: ' px' },
            'currentWaveSpeed': { path: 'waveSpeed', format: 'unit', suffix: ' px/s' },
            'currentWaveEnergy': { path: 'energy' },
            'wavesTime': { path: 'time', format: 'unit', suffix: 's' }
        });
    }
    
    updateOrbitalStats() {
        this.updateStats('orbital', {
            'orbitalPeriod': { path: 'period', format: 'unit', suffix: 's', decimalPlaces: 2 },
            'orbitalSpeed': { path: 'speed', format: 'decimal', decimalPlaces: 2 },
            'orbitalDistance': { path: 'distance', format: 'decimal', decimalPlaces: 1 },
            'orbitalTime': { path: 'time', format: 'time' },
            'orbitalEccentricity': { path: 'eccentricity', format: 'decimal', decimalPlaces: 2 }
        });
    }
    
    updateElectricFieldsStats() {
        this.updateStats('electricFields', {
            'activeCharges': { path: 'chargeCount' },
            'stat-efParticleCount': { path: 'particleCount' },
            'stat-efFieldStrength': { path: 'fieldStrength' },
            'efTime': { path: 'time', format: 'unit', suffix: 's' }
        });
    }
    
    updateGasLawsStats() {
        this.updateStats('gasLaws', {
            'stat-gasParticleCount': { path: 'particleCount' },
            'stat-gasTemperature': { path: 'temperature', format: 'unit', suffix: 'K' },
            'stat-gasPressure': { path: 'pressure', format: 'decimal', decimalPlaces: 2 },
            'stat-gasVolume': { path: 'volume' }
        });
    }
    

    
    updateCollisionStats() {
        this.updateStats('collisions', {
            'collisionBallCount': { path: 'ballCount' },
            'collisionMomentum': { path: 'totalMomentum', format: 'decimal', decimalPlaces: 1 },
            'collisionEnergy': { path: 'totalEnergy', format: 'decimal', decimalPlaces: 1 },
            'collisionCount': { path: 'collisionCount' }
        });
    }
    
    updateFrictionStats() {
        this.updateStats('friction', {
            'frictionSurface': { path: 'surfaceType' },
            'frictionAngle': { path: 'inclineAngle', format: 'angle' },
            'frictionNetForce': { path: 'netForce', format: 'decimal', decimalPlaces: 1 },
            'frictionAcceleration': { path: 'acceleration', format: 'decimal', decimalPlaces: 2 }
        });
    }
    

    
    updateMagneticFieldsStats() {
        this.updateStats('magneticFields', {
            'stat-magneticFieldStrength': { path: 'fieldStrength' },
            'stat-magneticParticleCount': { path: 'particleCount' },
            'magneticTime': { path: 'time', format: 'unit', suffix: 's' }
        });
    }
    

    
    updateWaveParticleDualityStats() {
        this.updateStats('waveParticleDuality', {
            'currentDualityMode': { path: 'mode' },
            'currentPhotonEnergy': { path: 'photonEnergy', format: 'unit', suffix: ' eV' },
            'currentDualityWavelength': { path: 'wavelength', format: 'unit', suffix: ' nm' },
            'waveFunctionStatus': { path: 'showWaveFunction', format: 'boolean' },
            'interferenceStatus': { path: 'showInterference', format: 'boolean' },
            'measurementCount': { path: 'measurementCount' },
            'dualityTime': { path: 'time', format: 'unit', suffix: 's' }
        });
    }
    
    updateFluidFlowStats() {
        this.updateStats('fluidFlow', {
            'fluidFlowRate': { path: 'flowRate', format: 'decimal', decimalPlaces: 1 },
            'fluidViscosity': { path: 'viscosity', format: 'decimal', decimalPlaces: 1 },
            'stat-reynoldsNumber': { path: 'reynoldsNumber' },
            'flowType': { path: 'flowType' },
            'averageVelocity': { path: 'averageVelocity', format: 'decimal', decimalPlaces: 2 },
            'viscosityEffect': { path: 'viscosityEffect', format: 'percentage', decimalPlaces: 0 },
            'velocityRatio': { path: 'velocityRatio', format: 'decimal', decimalPlaces: 1 },
            'topPorosity': { path: 'topPorosity', format: 'percentage', decimalPlaces: 0 },
            'bottomPorosity': { path: 'bottomPorosity', format: 'percentage', decimalPlaces: 0 },
            'fluidTime': { path: 'time', format: 'time' }
        });
    }
    
    updateBernoulliStats() {
        this.updateStats('bernoulli', {
            'bernoulliPressureDiff': { path: 'pressureDifference', format: 'decimal', decimalPlaces: 1 },
            'velocityRatio': { path: 'velocityRatio', format: 'decimal', decimalPlaces: 1 },
            'energyConservation': { path: 'energyConservation' },
            'particleCount': { path: 'particleCount' },
            'maxParticles': { path: 'maxParticles' },
            'flowEfficiency': { path: 'flowEfficiency', format: 'percentage' },
            'bernoulliTime': { path: 'time', format: 'time' }
        });
    }
    
    updateSoundWavesStats() {
        this.updateStats('soundWaves', {
            'soundWaveTypeDisplay': { path: 'waveType', format: 'capitalize' },
            'stat-soundFrequency': { path: 'frequency', format: 'unit', suffix: ' Hz' },
            'soundWavelength': { path: 'wavelength', format: 'unit', suffix: ' m', decimalPlaces: 2 },
            'soundWaveSpeed': { path: 'waveSpeed', format: 'unit', suffix: ' m/s' },
            'stat-soundAmplitude': { path: 'amplitude', format: 'percentage' },
            'soundParticleCount': { path: 'particleCount' },
            'soundTime': { path: 'time', format: 'time' }
        });
    }
    
    updateDiodeTransistorStats() {
        this.updateStats('diodeTransistor', {
            'diodeComponentTypeDisplay': { path: 'componentType', format: 'uppercase' },
            'diodeBiasTypeDisplay': { path: 'biasType', format: 'uppercase' },
            'diodeInputVoltageDisplay': { path: 'inputVoltage', format: 'unit', suffix: 'V' },
            'diodeBaseVoltageDisplay': { path: 'baseVoltage', format: 'unit', suffix: 'V' },
            'diodeCurrent': { path: 'current', format: 'unit', suffix: 'mA', decimalPlaces: 1 },
            'diodePower': { path: 'power', format: 'unit', suffix: 'mW', decimalPlaces: 1 },
            'diodeStatus': { path: 'isActive', format: 'boolean' },
            'diodeTemperature': { path: 'temperature', format: 'unit', suffix: '°C' },
            'diodeTime': { path: 'time', format: 'time' }
        });
        
        // Show/hide base voltage stat based on component type
        const baseVoltageStat = document.getElementById('baseVoltageStat');
        if (baseVoltageStat) {
            const stats = this.diodeTransistor.getStats();
            baseVoltageStat.style.display = (stats.componentType === 'npn' || stats.componentType === 'pnp') ? 'block' : 'none';
        }
    }
    
    updateNeuralNetworkStats() {
        this.updateStats('neuralNetwork', {
            'neuralEpoch': { path: 'epoch' },
            'neuralLoss': { path: 'currentLoss', format: 'decimal', decimalPlaces: 4 },
            'neuralAccuracy': { path: 'currentAccuracy', format: 'percentage', decimalPlaces: 1 },
            'neuralLearningRate': { path: 'learningRate' },
            'neuralSpeed': { path: 'speed', format: 'unit', suffix: 'x', decimalPlaces: 1 },
            'neuralPhase': { path: 'animationPhase' },
            'neuralDataIndex': { path: 'trainingDataIndex' }
        });
    }
    
    showScienceExplanation() {
        const modal = document.getElementById('scienceModal');
        const modalTitle = document.getElementById('modalTitle');
        const modalContent = document.getElementById('modalContent');
        
        // Get content based on current animation
        const content = this.getScienceContent();
        
        // Update modal content
        modalTitle.textContent = content.title;
        modalContent.innerHTML = content.html;
        
        // Show modal
        modal.style.display = 'block';
    }
    
    closeModal() {
        const modal = document.getElementById('scienceModal');
        modal.style.display = 'none';
    }
    
    getCurrentAnimationState() {
        const state = {
            animation: this.currentAnimation,
            controls: {},
            stats: {}
        };
        
        // Get current control values and stats based on animation type
        switch(this.currentAnimation) {
            case 'brownian':
                state.controls = {
                    particleCount: document.getElementById('brownianParticleCount')?.value || '15',
                    temperature: document.getElementById('brownianTemperature')?.value || '1.0',
                    speed: document.getElementById('brownianSpeed')?.value || '1.0'
                };
                state.stats = this.brownianMotion?.getStats() || {};
                break;
            case 'pendulum':
                state.controls = {
                    length: document.getElementById('pendulumLength')?.value || '100',
                    gravity: document.getElementById('pendulumGravity')?.value || '9.8',
                    damping: document.getElementById('pendulumDamping')?.value || '0.01'
                };
                state.stats = this.pendulum?.getStats() || {};
                break;
            case 'waves':
                state.controls = {
                    waveType: document.getElementById('waveType')?.value || 'transverse',
                    frequency: document.getElementById('waveFrequency')?.value || '1.0',
                    amplitude: document.getElementById('waveAmplitude')?.value || '50'
                };
                state.stats = this.wavePropagation?.getStats() || {};
                break;
            case 'electric-fields':
                state.controls = {
                    fieldStrength: document.getElementById('efFieldStrength')?.value || '1.0',
                    particleCount: document.getElementById('efParticleCount')?.value || '20'
                };
                state.stats = this.electricFields?.getStats() || {};
                break;
            case 'magnetic-fields':
                state.controls = {
                    fieldStrength: document.getElementById('magneticFieldStrength')?.value || '1.0',
                    particleCount: document.getElementById('magneticParticleCount')?.value || '15'
                };
                state.stats = this.magneticFields?.getStats() || {};
                break;
            case 'gas-laws':
                state.controls = {
                    temperature: document.getElementById('gasTemperature')?.value || '300',
                    pressure: document.getElementById('gasPressure')?.value || '1.0',
                    volume: document.getElementById('gasVolume')?.value || '300'
                };
                state.stats = this.gasLaws?.getStats() || {};
                break;
            case 'collisions':
                state.controls = {
                    ballCount: document.getElementById('ballCount')?.value || '5',
                    restitution: document.getElementById('restitution')?.value || '0.8',
                    gravity: document.getElementById('collisionGravity')?.value || '9.8'
                };
                state.stats = this.collisions?.getStats() || {};
                break;
            case 'friction':
                state.controls = {
                    angle: document.getElementById('inclineAngle')?.value || '20',
                    frictionCoefficient: document.getElementById('frictionCoefficient')?.value || '0.3',
                    mass: document.getElementById('objectMass')?.value || '1'
                };
                state.stats = this.friction?.getStats() || {};
                break;

            case 'wave-particle-duality':
                state.controls = {
                    mode: document.getElementById('dualityMode')?.value || 'wave',
                    energy: document.getElementById('dualityEnergy')?.value || '5.0',
                    wavelength: document.getElementById('dualityWavelength')?.value || '150'
                };
                state.stats = this.waveParticleDuality?.getStats() || {};
                break;
            case 'sound-waves':
                state.controls = {
                    waveType: document.getElementById('soundWaveType')?.value || 'transverse',
                    frequency: document.getElementById('soundFrequency')?.value || '5',
                    amplitude: document.getElementById('soundAmplitude')?.value || '50',
                    waveSpeed: document.getElementById('soundSpeed')?.value || '343',
                    particleCount: document.getElementById('soundParticles')?.value || '15',
                    animationSpeed: document.getElementById('soundAnimationSpeed')?.value || '1.0'
                };
                state.stats = this.soundWaves?.getStats() || {};
                break;
            case 'diode-transistor':
                state.controls = {
                    componentType: document.getElementById('diodeComponentType')?.value || 'diode',
                    biasType: document.getElementById('diodeBiasType')?.value || 'forward',
                    inputVoltage: document.getElementById('diodeInputVoltage')?.value || '5',
                    baseVoltage: document.getElementById('diodeBaseVoltage')?.value || '0.7',
                    animationSpeed: document.getElementById('diodeAnimationSpeed')?.value || '1.0'
                };
                state.stats = this.diodeTransistor?.getStats() || {};
                break;
            case 'neural-network':
                state.controls = {
                    learningRate: document.getElementById('neuralLearningRate')?.value || '0.1',
                    speed: document.getElementById('neuralSpeed')?.value || '1.0',
                    mode: document.getElementById('neuralMode')?.value || 'training'
                };
                state.stats = this.neuralNetwork?.getStats() || {};
                break;
            case 'memory-management':
                state.controls = {
                    mode: document.getElementById('memoryMode')?.value || 'random',
                    retentionRate: document.getElementById('retentionRate')?.value || '0.5',
                    decayRate: document.getElementById('decayRate')?.value || '0.1'
                };
                state.stats = this.memoryManagement?.getStats() || {};
                break;
        }
        
        return state;
    }
    
    getScienceContent() {
        switch (this.currentAnimation) {
            case 'brownian':
                return {
                    title: 'Brownian Motion - Random Particle Movement',
                    html: `
                        <div class="science-content">
                            <h3>What is Brownian Motion?</h3>
                            <p>Brownian motion is the random, erratic movement of particles suspended in a fluid (liquid or gas) caused by collisions with fast-moving molecules in the surrounding medium. This phenomenon was first observed by botanist Robert Brown in 1827 when studying pollen grains in water.</p>
                            
                            <h3>Key Scientific Concepts</h3>
                            <ul>
                                <li><strong>Molecular Motion:</strong> All particles are in constant motion due to thermal energy</li>
                                <li><strong>Random Walk:</strong> Each collision changes the particle's direction randomly</li>
                                <li><strong>Temperature Dependence:</strong> Higher temperature = faster molecular motion = more vigorous Brownian motion</li>
                                <li><strong>Particle Size Effect:</strong> Smaller particles show more dramatic Brownian motion</li>
                            </ul>
                            
                            <h3>What You Should Observe</h3>
                            <ul>
                                <li>Particles moving in seemingly random directions</li>
                                <li>No predictable path - each particle follows a "random walk"</li>
                                <li>Particles occasionally changing direction due to collisions</li>
                                <li>Faster movement at higher temperatures</li>
                                <li>Different colored particles for easy tracking</li>
                            </ul>
                            
                            <h3>Real-World Applications</h3>
                            <ul>
                                <li>Diffusion of molecules in cells</li>
                                <li>Particle movement in air pollution</li>
                                <li>Understanding molecular motion in chemistry</li>
                                <li>Brownian motion in financial markets</li>
                            </ul>
                            
                            <h3>Mathematical Description</h3>
                            <p>The mean squared displacement (MSD) of a Brownian particle follows: <strong>MSD = 6Dt</strong>, where D is the diffusion coefficient and t is time. This relationship shows that the average distance a particle travels increases with the square root of time.</p>
                        </div>
                    `
                };
            case 'sound-waves':
                return {
                    title: 'Sound Waves - Wave Propagation',
                    html: `
                        <div class="science-content">
                            <h3>What are Sound Waves?</h3>
                            <p>Sound waves are mechanical waves that propagate through a medium (like air, water, or solids) by causing particles to vibrate. They are longitudinal waves, meaning the particles move back and forth in the same direction as the wave travels.</p>
                            
                            <h3>Key Scientific Concepts</h3>
                            <ul>
                                <li><strong>Longitudinal Waves:</strong> Particles oscillate parallel to wave direction</li>
                                <li><strong>Transverse Waves:</strong> Particles oscillate perpendicular to wave direction</li>
                                <li><strong>Compression & Rarefaction:</strong> High and low pressure regions in the medium</li>
                                <li><strong>Wave Speed:</strong> v = fλ, where f is frequency and λ is wavelength</li>
                                <li><strong>Amplitude:</strong> Maximum displacement of particles from equilibrium</li>
                            </ul>
                            
                            <h3>What You Should Observe</h3>
                            <ul>
                                <li>Wave pulse traveling from source to receiver</li>
                                <li>Particles moving as the wave passes through</li>
                                <li>Compression zones (orange) and rarefaction zones (cyan)</li>
                                <li>Different wave types: transverse, longitudinal, and combined</li>
                                <li>Wave speed and frequency effects on propagation</li>
                            </ul>
                            
                            <h3>Wave Types Explained</h3>
                            <ul>
                                <li><strong>Transverse:</strong> Like waves on a string - particles move up and down</li>
                                <li><strong>Longitudinal:</strong> Like sound in air - particles move back and forth</li>
                                <li><strong>Combined:</strong> Shows both transverse and longitudinal components</li>
                            </ul>
                            
                            <h3>Real-World Applications</h3>
                            <ul>
                                <li>Musical instruments and sound production</li>
                                <li>Ultrasound imaging in medicine</li>
                                <li>Seismic waves in earthquake detection</li>
                                <li>Sonar and underwater communication</li>
                                <li>Acoustic engineering and noise control</li>
                            </ul>
                            
                            <h3>Mathematical Description</h3>
                            <p>For a sound wave: <strong>v = √(B/ρ)</strong>, where v is wave speed, B is bulk modulus, and ρ is density. The frequency determines pitch, while amplitude determines loudness. The relationship <strong>v = fλ</strong> connects speed, frequency, and wavelength.</p>
                        </div>
                    `
                };
            case 'diode-transistor':
                return {
                    title: 'Diode & Transistor - Electronic Components',
                    html: `
                        <div class="science-content">
                            <h3>What are Diodes and Transistors?</h3>
                            <p>Diodes and transistors are fundamental electronic components that control the flow of electrical current. Diodes allow current to flow in one direction only, while transistors can amplify signals and act as electronic switches.</p>
                            
                            <h3>Key Scientific Concepts</h3>
                            <ul>
                                <li><strong>Semiconductor Physics:</strong> Materials with conductivity between conductors and insulators</li>
                                <li><strong>P-N Junction:</strong> Boundary between P-type (holes) and N-type (electrons) materials</li>
                                <li><strong>Forward Bias:</strong> Positive voltage applied to P-side, negative to N-side</li>
                                <li><strong>Reverse Bias:</strong> Opposite voltage polarity blocks current flow</li>
                                <li><strong>Transistor Amplification:</strong> Small base current controls large collector current</li>
                                <li><strong>Particle Flow:</strong> Electrons and holes flow in opposite directions but contribute to current in the same direction</li>
                            </ul>
                            
                            <h3>What You Should Observe</h3>
                            <ul>
                                <li><strong>Electrons (blue circles):</strong> Move from N-type to P-type material during forward bias</li>
                                <li><strong>Holes (red outlined circles):</strong> Move from P-type to N-type material during forward bias</li>
                                <li><strong>Current Flow:</strong> Only occurs in forward bias conditions with sufficient voltage</li>
                                <li><strong>Voltage Drop:</strong> ~0.7V across diode in forward bias</li>
                                <li><strong>Transistor Control:</strong> Base voltage controls collector current amplification</li>
                                <li><strong>Energy Visualization:</strong> Pulsating circles represent electromagnetic field and power dissipation</li>
                            </ul>
                            
                            <h3>Component Behavior</h3>
                            <ul>
                                <li><strong>Diode Forward Bias:</strong> Current flows when voltage > 0.7V, voltage drop ~0.7V</li>
                                <li><strong>Diode Reverse Bias:</strong> No current flow, acts as insulator</li>
                                <li><strong>NPN Transistor:</strong> Electron flow from emitter to collector, base controls amplification</li>
                                <li><strong>PNP Transistor:</strong> Hole flow from emitter to collector, base controls amplification</li>
                                <li><strong>Amplification Factor:</strong> β = Ic/Ib (collector current / base current) ≈ 100</li>
                            </ul>
                            
                            <h3>Particle Physics</h3>
                            <ul>
                                <li><strong>Electrons:</strong> Filled blue circles representing negative charge carriers</li>
                                <li><strong>Holes:</strong> Red outlined circles representing positive charge carriers (absence of electrons)</li>
                                <li><strong>Flow Direction:</strong> Electrons and holes move in opposite directions but both contribute to conventional current flow</li>
                                <li><strong>Energy Levels:</strong> Particles move faster and glow brighter with higher voltage</li>
                            </ul>
                            
                            <h3>Real-World Applications</h3>
                            <ul>
                                <li>Rectifiers in power supplies</li>
                                <li>Amplifiers in audio systems</li>
                                <li>Digital logic circuits</li>
                                <li>Voltage regulators</li>
                                <li>Radio frequency circuits</li>
                                <li>Computer processors and memory</li>
                            </ul>
                            
                            <h3>Mathematical Description</h3>
                            <p>For a diode: <strong>I = I₀(e^(V/Vₜ) - 1)</strong>, where I is current, V is voltage, and Vₜ is thermal voltage (~26mV at room temperature). For a transistor: <strong>Ic = β × Ib</strong>, where β is the current gain factor (typically 50-200).</p>
                            
                            <h3>Interactive Features</h3>
                            <ul>
                                <li>Switch between diode, NPN, and PNP transistor modes</li>
                                <li>Adjust input voltage to see current flow changes</li>
                                <li>Control base voltage for transistor amplification</li>
                                <li>Observe different bias conditions (forward, reverse, off)</li>
                                <li>Watch real-time current and power calculations</li>
                            </ul>
                        </div>
                    `
                };
            case 'pendulum':
                return {
                    title: 'Simple Pendulum - Harmonic Oscillation',
                    html: `
                        <div class="science-content">
                            <h3>What is a Simple Pendulum?</h3>
                            <p>A simple pendulum consists of a point mass (bob) suspended from a fixed point by a massless, inextensible string. When displaced from its equilibrium position, it oscillates back and forth under the influence of gravity.</p>
                            
                            <h3>Key Scientific Concepts</h3>
                            <ul>
                                <li><strong>Simple Harmonic Motion:</strong> For small angles, the motion is approximately simple harmonic</li>
                                <li><strong>Period Formula:</strong> T = 2π√(L/g), where L is length and g is gravitational acceleration</li>
                                <li><strong>Energy Conservation:</strong> Kinetic and potential energy continuously convert between each other</li>
                                <li><strong>Damping:</strong> Air resistance causes the amplitude to gradually decrease</li>
                            </ul>
                            
                            <h3>What You Should Observe</h3>
                            <ul>
                                <li>Regular back-and-forth oscillation</li>
                                <li>Period remains constant regardless of amplitude (for small angles)</li>
                                <li>Longer pendulum = longer period</li>
                                <li>Gradual decrease in amplitude due to air resistance</li>
                                <li>Maximum speed at the bottom, zero speed at the extremes</li>
                            </ul>
                            
                            <h3>Energy Transformations</h3>
                            <ul>
                                <li><strong>At extremes:</strong> Maximum potential energy, zero kinetic energy</li>
                                <li><strong>At bottom:</strong> Maximum kinetic energy, minimum potential energy</li>
                                <li><strong>Total energy:</strong> Gradually decreases due to air resistance</li>
                            </ul>
                            
                            <h3>Real-World Applications</h3>
                            <ul>
                                <li>Clock mechanisms (grandfather clocks)</li>
                                <li>Seismometers for earthquake detection</li>
                                <li>Metronomes for musical timing</li>
                                <li>Amusement park rides</li>
                            </ul>
                        </div>
                    `
                };
            case 'waves':
                return {
                    title: 'Wave Propagation - Energy Transfer',
                    html: `
                        <div class="science-content">
                            <h3>What are Waves?</h3>
                            <p>Waves are disturbances that transfer energy through a medium without transferring matter. They can be mechanical (requiring a medium) or electromagnetic (can travel through vacuum).</p>
                            
                            <h3>Key Scientific Concepts</h3>
                            <ul>
                                <li><strong>Transverse Waves:</strong> Particles move perpendicular to wave direction (like water waves)</li>
                                <li><strong>Longitudinal Waves:</strong> Particles move parallel to wave direction (like sound waves)</li>
                                <li><strong>Wave Properties:</strong> Amplitude, frequency, wavelength, and speed</li>
                                <li><strong>Wave Equation:</strong> v = fλ (speed = frequency × wavelength)</li>
                                <li><strong>Interference:</strong> Waves can add together or cancel each other out</li>
                            </ul>
                            
                            <h3>What You Should Observe</h3>
                            <ul>
                                <li>Regular, repeating pattern of disturbance</li>
                                <li>Waves traveling at constant speed</li>
                                <li>Different wave types (transverse vs longitudinal)</li>
                                <li>Interference patterns when waves overlap</li>
                                <li>Energy transfer without matter movement</li>
                            </ul>
                            
                            <h3>Wave Characteristics</h3>
                            <ul>
                                <li><strong>Amplitude:</strong> Maximum displacement from equilibrium</li>
                                <li><strong>Frequency:</strong> Number of complete cycles per second (Hz)</li>
                                <li><strong>Wavelength:</strong> Distance between consecutive identical points</li>
                                <li><strong>Period:</strong> Time for one complete cycle</li>
                            </ul>
                            
                            <h3>Real-World Applications</h3>
                            <ul>
                                <li>Sound waves in air and water</li>
                                <li>Light waves and electromagnetic radiation</li>
                                <li>Earthquake waves (seismic waves)</li>
                                <li>Radio waves for communication</li>
                                <li>Ocean waves and tides</li>
                            </ul>
                        </div>
                    `
                };
            case 'diffusion':
                return {
                    title: 'Diffusion - Particle Spread',
                    html: `
                        <div class="science-content">
                            <h3>What is Diffusion?</h3>
                            <p>Diffusion is the process by which particles spread from regions of high concentration to regions of low concentration, driven by random molecular motion. This is a fundamental process in nature that leads to the uniform distribution of particles.</p>
                            
                            <h3>Key Scientific Concepts</h3>
                            <ul>
                                <li><strong>Fick's First Law:</strong> J = -D∇C (flux is proportional to concentration gradient)</li>
                                <li><strong>Concentration Gradient:</strong> Difference in concentration between regions</li>
                                <li><strong>Diffusion Coefficient:</strong> Measure of how quickly particles diffuse</li>
                                <li><strong>Temperature Effect:</strong> Higher temperature increases diffusion rate</li>
                                <li><strong>Particle Size:</strong> Smaller particles diffuse faster</li>
                            </ul>
                            
                            <h3>What You Should Observe</h3>
                            <ul>
                                <li>Particles spreading from concentrated areas</li>
                                <li>Gradual mixing of different particle types</li>
                                <li>Faster diffusion at higher temperatures</li>
                                <li>Concentration gradient decreasing over time</li>
                                <li>Eventually uniform distribution</li>
                            </ul>
                            
                            <h3>Diffusion Process</h3>
                            <ul>
                                <li><strong>Initial State:</strong> High concentration in one region</li>
                                <li><strong>Random Motion:</strong> Particles move randomly due to thermal energy</li>
                                <li><strong>Net Movement:</strong> More particles move from high to low concentration</li>
                                <li><strong>Equilibrium:</strong> Eventually uniform concentration throughout</li>
                            </ul>
                            
                            <h3>Real-World Applications</h3>
                            <ul>
                                <li>Oxygen diffusion in lungs</li>
                                <li>Nutrient absorption in cells</li>
                                <li>Perfume spreading in air</li>
                                <li>Salt dissolving in water</li>
                                <li>Heat conduction in materials</li>
                            </ul>
                        </div>
                    `
                };
            case 'orbital':
                return {
                    title: 'Orbital Motion - Gravitational Dynamics',
                    html: `
                        <div class="science-content">
                            <h3>What is Orbital Motion?</h3>
                            <p>Orbital motion describes the path of one object around another under the influence of gravity. This fundamental concept explains planetary orbits, satellite motion, and many other celestial phenomena.</p>
                            
                            <h3>Key Scientific Concepts</h3>
                            <ul>
                                <li><strong>Kepler's Laws:</strong> Three laws describing planetary motion</li>
                                <li><strong>Gravitational Force:</strong> F = GMm/r² (inverse square law)</li>
                                <li><strong>Orbital Velocity:</strong> v = √(GM/r) for circular orbits</li>
                                <li><strong>Eccentricity:</strong> Measure of how elliptical an orbit is (0 = circular, 1 = parabolic)</li>
                                <li><strong>Conservation of Angular Momentum:</strong> Orbital angular momentum remains constant</li>
                            </ul>
                            
                            <h3>What You Should Observe</h3>
                            <ul>
                                <li>Elliptical or circular paths around central mass</li>
                                <li>Faster motion when closer to the center (Kepler's Second Law)</li>
                                <li>Slower motion when farther from the center</li>
                                <li>Different orbital shapes based on eccentricity</li>
                                <li>Consistent orbital period for same central mass</li>
                            </ul>
                            
                            <h3>Kepler's Three Laws</h3>
                            <ol>
                                <li><strong>First Law:</strong> Orbits are ellipses with the central mass at one focus</li>
                                <li><strong>Second Law:</strong> Equal areas are swept in equal times (faster when closer)</li>
                                <li><strong>Third Law:</strong> Orbital period squared is proportional to semi-major axis cubed</li>
                            </ol>
                            
                            <h3>Real-World Applications</h3>
                            <ul>
                                <li>Planetary orbits around the Sun</li>
                                <li>Satellite orbits around Earth</li>
                                <li>Electron orbits in atoms (Bohr model)</li>
                                <li>Binary star systems</li>
                                <li>Spacecraft trajectories</li>
                            </ul>
                        </div>
                    `
                };
            case 'electric-fields':
                return {
                    title: 'Electric Fields - Charged Particle Interactions',
                    html: `
                        <div class="science-content">
                            <h3>What are Electric Fields?</h3>
                            <p>Electric fields are regions of space around charged particles where other charges experience forces. They are invisible but can be visualized through their effects on test charges and field lines.</p>
                            
                            <h3>Key Scientific Concepts</h3>
                            <ul>
                                <li><strong>Coulomb's Law:</strong> F = kq₁q₂/r² (force between charges)</li>
                                <li><strong>Electric Field:</strong> E = F/q (force per unit charge)</li>
                                <li><strong>Field Lines:</strong> Imaginary lines showing field direction</li>
                                <li><strong>Superposition:</strong> Total field is sum of individual fields</li>
                                <li><strong>Conservation of Charge:</strong> Net charge remains constant</li>
                            </ul>
                            
                            <h3>What You Should Observe</h3>
                            <ul>
                                <li>Test particles moving along field lines</li>
                                <li>Positive particles repelled by positive charges</li>
                                <li>Negative particles attracted to positive charges</li>
                                <li>Field strength decreases with distance</li>
                                <li>Complex field patterns with multiple charges</li>
                            </ul>
                            
                            <h3>Field Properties</h3>
                            <ul>
                                <li><strong>Direction:</strong> Field lines point away from positive, toward negative</li>
                                <li><strong>Strength:</strong> Closer lines indicate stronger fields</li>
                                <li><strong>Superposition:</strong> Fields add vectorially</li>
                                <li><strong>Conservative:</strong> Work done is path-independent</li>
                            </ul>
                            
                            <h3>Real-World Applications</h3>
                            <ul>
                                <li>Electrostatic precipitators</li>
                                <li>Capacitors and electronic circuits</li>
                                <li>Lightning and atmospheric electricity</li>
                                <li>Particle accelerators</li>
                                <li>Electron microscopes</li>
                            </ul>
                        </div>
                    `
                };
            case 'gas-laws':
                return {
                    title: 'Gas Laws - Pressure, Volume, Temperature Relationships',
                    html: `
                        <div class="science-content">
                            <h3>What are Gas Laws?</h3>
                            <p>Gas laws describe the relationships between pressure, volume, temperature, and amount of gas. These fundamental laws help us understand how gases behave under different conditions.</p>
                            
                            <h3>Key Scientific Concepts</h3>
                            <ul>
                                <li><strong>Boyle's Law:</strong> P₁V₁ = P₂V₂ (inverse relationship between pressure and volume)</li>
                                <li><strong>Charles's Law:</strong> V₁/T₁ = V₂/T₂ (direct relationship between volume and temperature)</li>
                                <li><strong>Gay-Lussac's Law:</strong> P₁/T₁ = P₂/T₂ (direct relationship between pressure and temperature)</li>
                                <li><strong>Combined Gas Law:</strong> P₁V₁/T₁ = P₂V₂/T₂</li>
                                <li><strong>Ideal Gas Law:</strong> PV = nRT (universal gas law)</li>
                            </ul>
                            
                            <h3>What You Should Observe</h3>
                            <ul>
                                <li>Particles moving faster at higher temperatures</li>
                                <li>More frequent collisions at higher pressure</li>
                                <li>Particles spreading out in larger volumes</li>
                                <li>Pressure changes with volume and temperature</li>
                                <li>Random motion of gas particles</li>
                            </ul>
                            
                            <h3>Gas Law Relationships</h3>
                            <ul>
                                <li><strong>Boyle's Law:</strong> Decrease volume → increase pressure</li>
                                <li><strong>Charles's Law:</strong> Increase temperature → increase volume</li>
                                <li><strong>Gay-Lussac's Law:</strong> Increase temperature → increase pressure</li>
                                <li><strong>Avogadro's Law:</strong> More particles → larger volume</li>
                            </ul>
                            
                            <h3>Real-World Applications</h3>
                            <ul>
                                <li>Internal combustion engines</li>
                                <li>Refrigeration and air conditioning</li>
                                <li>Weather and atmospheric pressure</li>
                                <li>Scuba diving and pressure changes</li>
                                <li>Hot air balloons</li>
                            </ul>
                        </div>
                    `
                };
            case 'collisions':
                return {
                    title: 'Collision Physics - Momentum and Energy Conservation',
                    html: `
                        <div class="science-content">
                            <h3>What are Collisions?</h3>
                            <p>Collisions are interactions between objects that result in changes in their motion. Understanding collisions involves principles of momentum conservation and energy transfer.</p>
                            
                            <h3>Key Scientific Concepts</h3>
                            <ul>
                                <li><strong>Momentum Conservation:</strong> Total momentum before = total momentum after</li>
                                <li><strong>Elastic Collisions:</strong> Kinetic energy is conserved</li>
                                <li><strong>Inelastic Collisions:</strong> Some kinetic energy is lost</li>
                                <li><strong>Impulse:</strong> Change in momentum = force × time</li>
                                <li><strong>Coefficient of Restitution:</strong> Measure of collision elasticity</li>
                            </ul>
                            
                            <h3>What You Should Observe</h3>
                            <ul>
                                <li>Objects changing direction after collision</li>
                                <li>Speed changes based on collision type</li>
                                <li>Energy transfer between objects</li>
                                <li>Momentum conservation in all collisions</li>
                                <li>Different outcomes for elastic vs inelastic collisions</li>
                            </ul>
                            
                            <h3>Collision Types</h3>
                            <ul>
                                <li><strong>Elastic:</strong> Perfect bounce, energy conserved</li>
                                <li><strong>Inelastic:</strong> Objects stick together, energy lost</li>
                                <li><strong>Partially Elastic:</strong> Some energy lost, some bounce</li>
                                <li><strong>Explosive:</strong> Energy added, objects separate</li>
                            </ul>
                            
                            <h3>Real-World Applications</h3>
                            <ul>
                                <li>Car crash safety design</li>
                                <li>Sports equipment design</li>
                                <li>Particle physics experiments</li>
                                <li>Billiards and pool</li>
                                <li>Rocket propulsion</li>
                            </ul>
                        </div>
                    `
                };
            case 'friction':
                return {
                    title: 'Friction & Inclined Planes - Force Analysis',
                    html: `
                        <div class="science-content">
                            <h3>What is Friction?</h3>
                            <p>Friction is a force that opposes the relative motion of objects in contact. On inclined planes, friction plays a crucial role in determining whether objects slide or remain stationary.</p>
                            
                            <h3>Key Scientific Concepts</h3>
                            <ul>
                                <li><strong>Static Friction:</strong> Prevents motion when object is at rest</li>
                                <li><strong>Kinetic Friction:</strong> Opposes motion when object is sliding</li>
                                <li><strong>Friction Force:</strong> f = μN (coefficient × normal force)</li>
                                <li><strong>Normal Force:</strong> Component of weight perpendicular to surface</li>
                                <li><strong>Net Force:</strong> Determines acceleration down the incline</li>
                            </ul>
                            
                            <h3>What You Should Observe</h3>
                            <ul>
                                <li>Objects sliding down inclined surfaces</li>
                                <li>Different sliding speeds based on friction</li>
                                <li>Objects stopping when friction is high</li>
                                <li>Force vectors showing gravity and friction</li>
                                <li>Acceleration changes with angle and friction</li>
                            </ul>
                            
                            <h3>Force Analysis</h3>
                            <ul>
                                <li><strong>Gravity Component:</strong> mg sin(θ) down the incline</li>
                                <li><strong>Normal Force:</strong> mg cos(θ) perpendicular to surface</li>
                                <li><strong>Friction Force:</strong> μmg cos(θ) opposing motion</li>
                                <li><strong>Net Force:</strong> mg sin(θ) - μmg cos(θ)</li>
                            </ul>
                            
                            <h3>Real-World Applications</h3>
                            <ul>
                                <li>Vehicle braking systems</li>
                                <li>Walking and running mechanics</li>
                                <li>Rock climbing and mountaineering</li>
                                <li>Industrial conveyor systems</li>
                                <li>Sports equipment design</li>
                            </ul>
                        </div>
                    `
                };
            case 'magnetic-fields':
                return {
                    title: 'Magnetic Fields - Magnetic Force Interactions',
                    html: `
                        <div class="science-content">
                            <h3>What are Magnetic Fields?</h3>
                            <p>Magnetic fields are regions of space around magnets where magnetic materials and moving charges experience forces. They are fundamental to electromagnetism and many modern technologies.</p>
                            
                            <h3>Key Scientific Concepts</h3>
                            <ul>
                                <li><strong>Magnetic Force:</strong> F = qvB sin(θ) on moving charges</li>
                                <li><strong>Field Lines:</strong> Imaginary lines showing field direction</li>
                                <li><strong>Right-Hand Rule:</strong> Determines force direction on moving charges</li>
                                <li><strong>Field Strength:</strong> Measured in Tesla (T) or Gauss</li>
                                <li><strong>Superposition:</strong> Total field is sum of individual fields</li>
                            </ul>
                            
                            <h3>What You Should Observe</h3>
                            <ul>
                                <li>Charged particles moving in curved paths</li>
                                <li>Different motion for positive vs negative charges</li>
                                <li>Circular motion in uniform magnetic fields</li>
                                <li>Field lines showing magnetic field direction</li>
                                <li>Force perpendicular to both velocity and field</li>
                            </ul>
                            
                            <h3>Magnetic Field Properties</h3>
                            <ul>
                                <li><strong>Direction:</strong> Field lines point from north to south pole</li>
                                <li><strong>Strength:</strong> Decreases with distance from magnet</li>
                                <li><strong>Force Direction:</strong> Perpendicular to both velocity and field</li>
                                <li><strong>No Work:</strong> Magnetic force does no work on charges</li>
                            </ul>
                            
                            <h3>Real-World Applications</h3>
                            <ul>
                                <li>Electric motors and generators</li>
                                <li>Magnetic resonance imaging (MRI)</li>
                                <li>Particle accelerators</li>
                                <li>Magnetic levitation trains</li>
                                <li>Compass navigation</li>
                            </ul>
                        </div>
                    `
                };
            case 'wave-particle-duality':
                return {
                    title: 'Wave-Particle Duality - Quantum Mechanics',
                    html: `
                        <div class="science-content">
                            <h3>What is Wave-Particle Duality?</h3>
                            <p>Wave-particle duality is a fundamental concept in quantum mechanics where particles exhibit both wave-like and particle-like properties depending on how we observe them. This challenges our classical understanding of matter.</p>
                            
                            <h3>Key Scientific Concepts</h3>
                            <ul>
                                <li><strong>De Broglie Wavelength:</strong> λ = h/p (wavelength = Planck's constant/momentum)</li>
                                <li><strong>Wave Function:</strong> Mathematical description of quantum state</li>
                                <li><strong>Superposition:</strong> Particles can exist in multiple states simultaneously</li>
                                <li><strong>Measurement Effect:</strong> Observation affects the system</li>
                                <li><strong>Interference:</strong> Wave-like behavior in experiments</li>
                            </ul>
                            
                            <h3>What You Should Observe</h3>
                            <ul>
                                <li>Wave-like interference patterns</li>
                                <li>Particle-like discrete measurements</li>
                                <li>Superposition of states</li>
                                <li>Measurement affecting the system</li>
                                <li>Dual behavior depending on observation method</li>
                            </ul>
                            
                            <h3>Quantum Phenomena</h3>
                            <ul>
                                <li><strong>Double-Slit Experiment:</strong> Shows both wave and particle behavior</li>
                                <li><strong>Uncertainty Principle:</strong> Can't know position and momentum precisely</li>
                                <li><strong>Quantum Tunneling:</strong> Particles can pass through barriers</li>
                                <li><strong>Entanglement:</strong> Particles can be correlated across distance</li>
                            </ul>
                            
                            <h3>Real-World Applications</h3>
                            <ul>
                                <li>Electron microscopes</li>
                                <li>Quantum computing</li>
                                <li>Quantum cryptography</li>
                                <li>Semiconductor technology</li>
                                <li>Quantum sensors</li>
                            </ul>
                        </div>
                    `
                };
            case 'nuclear-reactions':
                return {
                    title: 'Nuclear Reactions - Fission and Fusion',
                    html: `
                        <div class="science-content">
                            <h3>What are Nuclear Reactions?</h3>
                            <p>Nuclear reactions involve changes in the nucleus of atoms, releasing or absorbing tremendous amounts of energy. Fission (splitting) and fusion (combining) are the two main types of nuclear reactions.</p>
                            
                            <h3>Key Scientific Concepts</h3>
                            <ul>
                                <li><strong>Nuclear Fission:</strong> Heavy nucleus splits into lighter nuclei + energy</li>
                                <li><strong>Nuclear Fusion:</strong> Light nuclei combine to form heavier nucleus + energy</li>
                                <li><strong>Mass-Energy Equivalence:</strong> E = mc² (Einstein's equation)</li>
                                <li><strong>Chain Reaction:</strong> Neutrons from one fission trigger more fissions</li>
                                <li><strong>Critical Mass:</strong> Minimum mass needed for sustained chain reaction</li>
                            </ul>
                            
                            <h3>What You Should Observe</h3>
                            <ul>
                                <li>Nuclei splitting or combining</li>
                                <li>Energy release in the form of particles</li>
                                <li>Neutrons triggering additional reactions</li>
                                <li>Chain reactions spreading through material</li>
                                <li>Different reaction rates based on conditions</li>
                            </ul>
                            
                            <h3>Nuclear Processes</h3>
                            <ul>
                                <li><strong>Fission:</strong> Uranium-235 + neutron → lighter nuclei + 2-3 neutrons + energy</li>
                                <li><strong>Fusion:</strong> Hydrogen nuclei → Helium + energy (like in stars)</li>
                                <li><strong>Radioactive Decay:</strong> Unstable nuclei emit particles</li>
                                <li><strong>Neutron Capture:</strong> Nuclei absorb neutrons</li>
                            </ul>
                            
                            <h3>Real-World Applications</h3>
                            <ul>
                                <li>Nuclear power plants</li>
                                <li>Nuclear weapons</li>
                                <li>Medical radiation therapy</li>
                                <li>Radioactive dating</li>
                                <li>Fusion power research</li>
                            </ul>
                        </div>
                    `
                };
            case 'fluid-flow':
                return {
                    title: 'Fluid Flow - Enhanced Viscosity & Porosity Effects',
                    html: `
                        <div class="science-content">
                            <h3>What is Fluid Flow?</h3>
                            <p>Fluid flow describes how liquids and gases move through space and porous materials. This enhanced simulation demonstrates realistic fluid dynamics with visible viscosity effects, Reynolds number transitions, and porous media flow patterns.</p>
                            
                            <h3>Key Scientific Concepts</h3>
                            <ul>
                                <li><strong>Laminar Flow:</strong> Smooth, parallel streamlines with no mixing between layers (Re < 2300)</li>
                                <li><strong>Turbulent Flow:</strong> Chaotic, swirling motion with rapid mixing (Re > 4000)</li>
                                <li><strong>Reynolds Number:</strong> Re = ρvL/μ - determines flow regime and transition points</li>
                                <li><strong>Enhanced Viscosity Effects:</strong> Internal friction that visibly slows particle movement</li>
                                <li><strong>Porous Media Flow:</strong> Fluid movement through materials with different porosity levels</li>
                                <li><strong>Darcy's Law:</strong> Flow rate through porous media depends on permeability and pressure gradient</li>
                            </ul>
                            
                            <h3>What You Should Observe</h3>
                            <ul>
                                <li><strong>Viscosity Effects:</strong> Particles move much slower with high viscosity (5x enhanced visibility)</li>
                                <li><strong>Flow Regimes:</strong> Smooth laminar flow vs chaotic turbulent flow based on Reynolds number</li>
                                <li><strong>Porosity Effects:</strong> Particles slow down significantly in porous materials</li>
                                <li><strong>Visualization Modes:</strong> Different analysis panels show pressure, velocity, and porosity effects</li>
                                <li><strong>Real-time Statistics:</strong> Live updates of Reynolds number, flow type, and viscosity effects</li>
                            </ul>
                            
                            <h3>Enhanced Features</h3>
                            <ul>
                                <li><strong>Visible Viscosity:</strong> 5x stronger effect makes viscosity changes clearly observable</li>
                                <li><strong>Reynolds Number Display:</strong> Real-time calculation and color-coded flow type indicators</li>
                                <li><strong>Porosity Analysis:</strong> Comparison between high and low porosity materials</li>
                                <li><strong>Velocity Analysis:</strong> Shows how porosity affects flow velocity</li>
                                <li><strong>Pressure Analysis:</strong> Demonstrates pressure build-up in porous materials</li>
                                <li><strong>Clean UI:</strong> Removed redundant information for better focus</li>
                            </ul>
                            
                            <h3>Flow Regimes & Transitions</h3>
                            <ul>
                                <li><strong>Laminar (Re < 2300):</strong> Green indicator - smooth, predictable flow</li>
                                <li><strong>Transitional (2300 < Re < 4000):</strong> Orange indicator - unstable, mixed flow</li>
                                <li><strong>Turbulent (Re > 4000):</strong> Red indicator - chaotic, highly mixed flow</li>
                                <li><strong>Viscosity Impact:</strong> High viscosity = lower Reynolds number = more laminar flow</li>
                                <li><strong>Flow Rate Impact:</strong> High flow rate = higher Reynolds number = more turbulent flow</li>
                            </ul>
                            
                            <h3>Porous Media Physics</h3>
                            <ul>
                                <li><strong>High Porosity Material:</strong> More open spaces, particles flow through more easily</li>
                                <li><strong>Low Porosity Material:</strong> Fewer open spaces, particles slow down significantly</li>
                                <li><strong>Velocity Ratio:</strong> Shows the speed difference between materials</li>
                                <li><strong>Pressure Build-up:</strong> Porous materials create resistance and pressure gradients</li>
                                <li><strong>Flow Patterns:</strong> Particles follow tortuous paths through porous structures</li>
                            </ul>
                            
                            <h3>Interactive Controls</h3>
                            <ul>
                                <li><strong>Flow Rate Slider:</strong> Adjusts particle speed and Reynolds number</li>
                                <li><strong>Viscosity Slider:</strong> Controls internal friction (now 5x more visible)</li>
                                <li><strong>Visualization Modes:</strong> Switch between particle flow, pressure, velocity, and porosity analysis</li>
                                <li><strong>Real-time Feedback:</strong> Watch statistics update as you adjust parameters</li>
                            </ul>
                            
                            <h3>Real-World Applications</h3>
                            <ul>
                                <li><strong>Groundwater Flow:</strong> Water movement through soil and rock formations</li>
                                <li><strong>Oil Reservoir Engineering:</strong> Petroleum flow through porous rock</li>
                                <li><strong>Blood Flow:</strong> Circulation through capillaries and tissue</li>
                                <li><strong>Air Filtration:</strong> Gas flow through filter materials</li>
                                <li><strong>Chemical Processing:</strong> Fluid flow through catalyst beds</li>
                                <li><strong>Geothermal Systems:</strong> Heat transfer in porous media</li>
                            </ul>
                            
                            <h3>Mathematical Foundation</h3>
                            <ul>
                                <li><strong>Reynolds Number:</strong> Re = (ρ × V × D) / μ where ρ=density, V=velocity, D=characteristic length, μ=viscosity</li>
                                <li><strong>Viscosity Effect:</strong> velocity_factor = 1 - (viscosity × 0.1) - 5x enhanced for visibility</li>
                                <li><strong>Porosity Factor:</strong> porosity_factor = 1 - (1 - porosity) × 0.6</li>
                                <li><strong>Darcy's Law:</strong> Q = -kA(ΔP/ΔL)/μ where k=permeability, A=cross-sectional area</li>
                            </ul>
                            
                            <h3>Educational Value</h3>
                            <ul>
                                <li><strong>Visual Learning:</strong> See abstract concepts like viscosity and Reynolds number in action</li>
                                <li><strong>Parameter Relationships:</strong> Understand how flow rate, viscosity, and porosity interact</li>
                                <li><strong>Real-time Analysis:</strong> Watch statistics update as you experiment with controls</li>
                                <li><strong>Multiple Perspectives:</strong> Different visualization modes show various aspects of fluid dynamics</li>
                                <li><strong>Scientific Accuracy:</strong> Based on real fluid dynamics equations and principles</li>
                            </ul>
                        </div>
                    `
                };
            case 'bernoulli':
                return {
                    title: "Bernoulli's Principle - Energy Conservation in Fluids",
                    html: `
                        <div class="science-content">
                            <h3>What is Bernoulli's Principle?</h3>
                            <p>Bernoulli's principle states that in a flowing fluid, an increase in velocity is accompanied by a decrease in pressure. This is a consequence of energy conservation in fluid flow. Our enhanced simulation demonstrates this with continuous particle flow and realistic velocity transitions.</p>
                            
                            <h3>Key Scientific Concepts</h3>
                            <ul>
                                <li><strong>Bernoulli's Equation:</strong> P + ½ρv² + ρgh = constant</li>
                                <li><strong>Energy Conservation:</strong> Total energy remains constant along a streamline</li>
                                <li><strong>Pressure-Velocity Trade-off:</strong> Higher velocity = lower pressure</li>
                                <li><strong>Continuity Equation:</strong> A₁v₁ = A₂v₂ (mass conservation)</li>
                                <li><strong>Venturi Effect:</strong> Pressure drop in constricted flow</li>
                                <li><strong>Enhanced Particle System:</strong> Continuous flow with 80 particles maintained</li>
                            </ul>
                            
                            <h3>What You Should Observe</h3>
                            <ul>
                                <li><strong>Continuous Particle Flow:</strong> Steady stream without gaps or stops</li>
                                <li><strong>Velocity Transitions:</strong> Smooth speed changes through pipe constriction</li>
                                <li><strong>Bernoulli Effect:</strong> Particles speed up 1.8x in narrow section</li>
                                <li><strong>Energy Conservation:</strong> Total energy maintained throughout flow</li>
                                <li><strong>Pressure Changes:</strong> Lower pressure in high-velocity regions</li>
                                <li><strong>Flow Efficiency:</strong> Optimized particle management system</li>
                            </ul>
                            
                            <h3>Enhanced Simulation Features</h3>
                            <ul>
                                <li><strong>Continuous Flow:</strong> Particles added continuously to maintain steady stream</li>
                                <li><strong>Smart Particle Management:</strong> 80 particles with optimized addition/removal</li>
                                <li><strong>Realistic Transitions:</strong> Gradual velocity changes in pipe constrictions</li>
                                <li><strong>Energy Visualization:</strong> Color-coded particles show energy distribution</li>
                                <li><strong>Flow Efficiency:</strong> Real-time calculation of flow performance</li>
                            </ul>
                            
                            <h3>Energy Components</h3>
                            <ul>
                                <li><strong>Pressure Energy:</strong> P (work done by pressure)</li>
                                <li><strong>Kinetic Energy:</strong> ½ρv² (energy of motion)</li>
                                <li><strong>Potential Energy:</strong> ρgh (gravitational energy)</li>
                                <li><strong>Total Energy:</strong> Sum remains constant</li>
                                <li><strong>Flow Efficiency:</strong> Percentage of optimal flow achieved</li>
                            </ul>
                            
                            <h3>Real-World Applications</h3>
                            <ul>
                                <li><strong>Airplane Wings:</strong> Curved upper surface creates lift</li>
                                <li><strong>Carburetors:</strong> Fuel mixing through pressure differences</li>
                                <li><strong>Venturi Meters:</strong> Flow measurement using pressure drop</li>
                                <li><strong>Spray Bottles:</strong> Atomization through constricted flow</li>
                                <li><strong>Blood Flow:</strong> Arterial constriction effects</li>
                                <li><strong>Wind Tunnels:</strong> Aerodynamic testing</li>
                            </ul>
                            
                            <h3>Technical Implementation</h3>
                            <ul>
                                <li><strong>Particle System:</strong> 80 particles with continuous addition</li>
                                <li><strong>Velocity Calculation:</strong> Based on cross-sectional area changes</li>
                                <li><strong>Energy Conservation:</strong> Maintained through velocity-pressure relationship</li>
                                <li><strong>Flow Monitoring:</strong> Real-time particle count and efficiency tracking</li>
                            </ul>
                        </div>
                    `
                };
                        case 'neural-network':
                return {
                    title: 'Neural Network Training - Object Recognition',
                    html: `
                        <div class="science-content">
                            <h3>What are Neural Networks?</h3>
                            <p>Neural networks are computational models inspired by biological neurons in the brain. They consist of interconnected nodes (neurons) organized in layers that process information and learn patterns from data. This animation demonstrates how neural networks learn to recognize and classify different geometric objects.</p>
                            
                            <h3>Key Scientific Concepts</h3>
                            <ul>
                                <li><strong>Artificial Neurons:</strong> Mathematical functions that receive inputs, apply weights, and produce outputs. Each neuron computes: output = σ(Σ(inputs × weights) + bias)</li>
                                <li><strong>Network Architecture:</strong> Input layer (2 neurons) → Hidden layer 1 (4 neurons) → Hidden layer 2 (3 neurons) → Output layer (1 neuron)</li>
                            </ul>
                            
                            <h3>Why This Architecture?</h3>
                            <ul>
                                <li><strong>2 Input Neurons:</strong> Perfect for our 2-feature problem (symmetry, edges)</li>
                                <li><strong>4 Hidden Neurons:</strong> Provides enough capacity to learn non-linear patterns without overfitting</li>
                                <li><strong>3 Hidden Neurons:</strong> Allows further feature refinement and abstraction</li>
                                <li><strong>1 Output Neuron:</strong> Binary classification (simple vs complex objects)</li>
                            </ul>
                            
                            <h3>Layer Size Effects</h3>
                            <ul>
                                <li><strong>Too Few Neurons:</strong> Network can't learn complex patterns (underfitting)</li>
                                <li><strong>Too Many Neurons:</strong> Network memorizes training data (overfitting)</li>
                                <li><strong>Optimal Size:</strong> Balances learning capacity with generalization</li>
                                <li><strong>Our Choice:</strong> 4→3 hidden layers provide sufficient complexity for this task</li>
                            </ul>
                                <li><strong>Weights & Biases:</strong> Numerical values that determine connection strength and neuron activation thresholds</li>
                                <li><strong>Sigmoid Activation:</strong> σ(x) = 1/(1 + e^(-x)) - transforms any input to a value between 0 and 1</li>
                                <li><strong>Backpropagation:</strong> Algorithm that calculates how much each weight should change to reduce prediction errors</li>
                                <li><strong>Learning Rate:</strong> Controls how big weight updates are during training</li>
                            </ul>
                            
                            <h3>Training Process Explained</h3>
                            <ol>
                                <li><strong>Forward Propagation:</strong> Input features flow through the network, each neuron computes its output using weights and activation function</li>
                                <li><strong>Loss Calculation:</strong> Compare network output with target value using Mean Squared Error: Loss = (target - output)²</li>
                                <li><strong>Backward Propagation:</strong> Calculate error gradients for each weight using chain rule of calculus</li>
                                <li><strong>Weight Updates:</strong> Adjust weights using gradient descent: Δw = learning_rate × gradient</li>
                            </ol>
                            
                            <h3>Object Recognition Task</h3>
                            <p>This network learns to classify geometric objects based on their complexity using 2 features:</p>
                            <ul>
                                <li><strong>Feature 1 - Symmetry Score (0-1):</strong> How symmetrical the object is (high = simple)</li>
                                <li><strong>Feature 2 - Edge Complexity (0-1):</strong> How many edges/corners the object has (high = complex)</li>
                                <li><strong>Simple Objects:</strong> Circle [0.9,0.1], Square [0.8,0.3] → Output: 0 (classified as simple)</li>
                                <li><strong>Complex Objects:</strong> Triangle [0.6,0.5], Star [0.3,0.9] → Output: 1 (classified as complex)</li>
                            </ul>
                            
                            <h3>What You Should Observe</h3>
                            <ul>
                                <li><strong>Training Mode:</strong> Watch data flow forward (blue particles), errors flow backward (red particles), and weights update (flashing connections)</li>
                                <li><strong>Testing Mode:</strong> See how the trained network processes new inputs and makes predictions with confidence scores</li>
                                <li><strong>Visual Indicators:</strong> Active neurons pulse, weight changes are highlighted, and prediction accuracy improves over time</li>
                                <li><strong>Object Context:</strong> Each training example shows the actual geometric object being learned</li>
                            </ul>
                            
                            <h3>Mathematical Foundation</h3>
                            <ul>
                                <li><strong>Neuron Output:</strong> y = σ(w₁x₁ + w₂x₂ + ... + wₙxₙ + b)</li>
                                <li><strong>Loss Function:</strong> L = (y_target - y_predicted)²</li>
                                <li><strong>Weight Update:</strong> w_new = w_old - α × ∂L/∂w</li>
                                <li><strong>Gradient Calculation:</strong> ∂L/∂w = ∂L/∂y × ∂y/∂w (chain rule)</li>
                            </ul>
                            
                            <h3>Real-World Applications</h3>
                            <ul>
                                <li><strong>Computer Vision:</strong> Image classification, object detection, facial recognition</li>
                                <li><strong>Natural Language Processing:</strong> Text classification, language translation, chatbots</li>
                                <li><strong>Speech Recognition:</strong> Voice assistants, transcription services</li>
                                <li><strong>Autonomous Systems:</strong> Self-driving cars, robotics, drones</li>
                                <li><strong>Medical Diagnosis:</strong> Disease detection, medical image analysis</li>
                                <li><strong>Financial Analysis:</strong> Fraud detection, stock prediction, risk assessment</li>
                            </ul>
                            
                            <h3>Educational Insights</h3>
                            <ul>
                                <li><strong>Learning Process:</strong> Neural networks learn by adjusting weights to minimize prediction errors</li>
                                <li><strong>Feature Learning:</strong> Hidden layers automatically learn useful features from raw input data</li>
                                <li><strong>Generalization:</strong> Well-trained networks can make accurate predictions on unseen data</li>
                                <li><strong>Overfitting:</strong> Networks can memorize training data instead of learning general patterns</li>
                                <li><strong>Hyperparameters:</strong> Learning rate, network architecture, and activation functions affect training success</li>
                            </ul>
                            
                            <h3>Interactive Features</h3>
                            <ul>
                                <li><strong>Training Mode:</strong> Watch the network learn through forward/backward propagation cycles</li>
                                <li><strong>Testing Mode:</strong> Test the trained network on different objects and see predictions</li>
                                <li><strong>Parameter Control:</strong> Adjust learning rate and animation speed to observe different training behaviors</li>
                                <li><strong>Visual Feedback:</strong> See real-time loss, accuracy, and confidence metrics</li>
                            </ul>
                            
                            <h3>Advanced Concepts</h3>
                            <ul>
                                <li><strong>Gradient Descent:</strong> Optimization algorithm that finds the best weights by following the steepest descent</li>
                                <li><strong>Vanishing Gradients:</strong> Problem where gradients become very small in deep networks</li>
                                <li><strong>Regularization:</strong> Techniques to prevent overfitting (dropout, weight decay)</li>
                                <li><strong>Batch Processing:</strong> Training on multiple examples simultaneously for better gradient estimates</li>
                                <li><strong>Transfer Learning:</strong> Using pre-trained networks for new tasks</li>
                            </ul>
                        </div>
                    `
                };
            case 'sound-waves':
                return {
                    title: 'Sound Waves - Wave Propagation in Air',
                    html: `
                        <div class="science-content">
                            <h3>What are Sound Waves?</h3>
                            <p>Sound waves are longitudinal mechanical waves that travel through a medium (like air, water, or solids) by compressing and rarefying the particles of the medium. These waves carry energy and information, allowing us to hear sounds.</p>
                            
                            <h3>Key Scientific Concepts</h3>
                            <ul>
                                <li><strong>Longitudinal Waves:</strong> Particles oscillate parallel to wave direction (compression and rarefaction)</li>
                                <li><strong>Transverse Waves:</strong> Particles oscillate perpendicular to wave direction (like guitar strings)</li>
                                <li><strong>Wave Properties:</strong> Frequency (pitch), amplitude (loudness), wavelength, and speed</li>
                                <li><strong>Wave Equation:</strong> v = fλ (speed = frequency × wavelength)</li>
                                <li><strong>Pressure Variations:</strong> High pressure (compression) and low pressure (rarefaction) zones</li>
                            </ul>
                            
                            <h3>What You Should Observe</h3>
                            <ul>
                                <li><strong>Transverse Mode:</strong> Particles moving up and down like a guitar string</li>
                                <li><strong>Longitudinal Mode:</strong> Particles moving back and forth in the direction of wave travel</li>
                                <li><strong>Pressure Zones:</strong> Red areas (compression) and blue areas (rarefaction) in longitudinal waves</li>
                                <li><strong>Wave Speed:</strong> How fast the wave pattern travels through the medium</li>
                                <li><strong>Frequency Effect:</strong> Higher frequency = shorter wavelength = higher pitch</li>
                            </ul>
                            
                            <h3>Wave Characteristics</h3>
                            <ul>
                                <li><strong>Frequency (f):</strong> Number of complete cycles per second (Hz) - determines pitch</li>
                                <li><strong>Amplitude (A):</strong> Maximum displacement from equilibrium - determines loudness</li>
                                <li><strong>Wavelength (λ):</strong> Distance between consecutive identical points</li>
                                <li><strong>Wave Speed (v):</strong> How fast the wave travels through the medium</li>
                                <li><strong>Period (T):</strong> Time for one complete cycle (T = 1/f)</li>
                            </ul>
                            
                            <h3>Real-World Applications</h3>
                            <ul>
                                <li>Musical instruments (guitar strings, air columns)</li>
                                <li>Human speech and hearing</li>
                <li>Ultrasound imaging in medicine</li>
                                <li>Sonar for underwater detection</li>
                                <li>Acoustic engineering and sound design</li>
                                <li>Earthquake detection (seismic waves)</li>
                            </ul>
                            
                            <h3>Mathematical Relationships</h3>
                            <ul>
                                <li><strong>Wave Equation:</strong> v = fλ (speed = frequency × wavelength)</li>
                                <li><strong>Period and Frequency:</strong> T = 1/f (period = 1/frequency)</li>
                                <li><strong>Energy:</strong> E ∝ A²f² (energy proportional to amplitude² × frequency²)</li>
                                <li><strong>Intensity:</strong> I ∝ A² (intensity proportional to amplitude squared)</li>
                            </ul>
                            
                            <h3>Wave Types Comparison</h3>
                            <ul>
                                <li><strong>Transverse Waves:</strong> Guitar strings, water waves, light waves</li>
                                <li><strong>Longitudinal Waves:</strong> Sound waves in air, seismic P-waves</li>
                                <li><strong>Combined Waves:</strong> Complex wave patterns with both components</li>
                            </ul>
                        </div>
                    `
                };
            case 'neural-network':
                return {
                    title: 'Neural Network Training - Object Recognition',
                    html: `
                        <div class="science-content">
                            <h3>What are Neural Networks?</h3>
                            <p>Neural networks are computational models inspired by biological neurons in the brain. They consist of interconnected nodes (neurons) organized in layers that process information and learn patterns from data. This animation demonstrates how neural networks learn to recognize and classify different geometric objects.</p>
                            
                            <h3>Key Scientific Concepts</h3>
                            <ul>
                                <li><strong>Artificial Neurons:</strong> Mathematical functions that receive inputs, apply weights, and produce outputs. Each neuron computes: output = σ(Σ(inputs × weights) + bias)</li>
                                <li><strong>Network Architecture:</strong> Input layer (2 neurons) → Hidden layer 1 (4 neurons) → Hidden layer 2 (3 neurons) → Output layer (1 neuron)</li>
                            </ul>
                            
                            <h3>Why This Architecture?</h3>
                            <ul>
                                <li><strong>2 Input Neurons:</strong> Perfect for our 2-feature problem (symmetry, edges)</li>
                                <li><strong>4 Hidden Neurons:</strong> Provides enough capacity to learn non-linear patterns without overfitting</li>
                                <li><strong>3 Hidden Neurons:</strong> Allows further feature refinement and abstraction</li>
                                <li><strong>1 Output Neuron:</strong> Binary classification (simple vs complex objects)</li>
                            </ul>
                            
                            <h3>Layer Size Effects</h3>
                            <ul>
                                <li><strong>Too Few Neurons:</strong> Network can't learn complex patterns (underfitting)</li>
                                <li><strong>Too Many Neurons:</strong> Network memorizes training data (overfitting)</li>
                                <li><strong>Optimal Size:</strong> Balances learning capacity with generalization</li>
                                <li><strong>Our Choice:</strong> 4→3 hidden layers provide sufficient complexity for this task</li>
                            </ul>
                                <li><strong>Weights & Biases:</strong> Numerical values that determine connection strength and neuron activation thresholds</li>
                                <li><strong>Sigmoid Activation:</strong> σ(x) = 1/(1 + e^(-x)) - transforms any input to a value between 0 and 1</li>
                                <li><strong>Backpropagation:</strong> Algorithm that calculates how much each weight should change to reduce prediction errors</li>
                                <li><strong>Learning Rate:</strong> Controls how big weight updates are during training</li>
                            </ul>
                            
                            <h3>Training Process Explained</h3>
                            <ol>
                                <li><strong>Forward Propagation:</strong> Input features flow through the network, each neuron computes its output using weights and activation function</li>
                                <li><strong>Loss Calculation:</strong> Compare network output with target value using Mean Squared Error: Loss = (target - output)²</li>
                                <li><strong>Backward Propagation:</strong> Calculate error gradients for each weight using chain rule of calculus</li>
                                <li><strong>Weight Updates:</strong> Adjust weights using gradient descent: Δw = learning_rate × gradient</li>
                            </ol>
                            
                            <h3>Object Recognition Task</h3>
                            <p>This network learns to classify geometric objects based on their complexity using 2 features:</p>
                            <ul>
                                <li><strong>Feature 1 - Symmetry Score (0-1):</strong> How symmetrical the object is (high = simple)</li>
                                <li><strong>Feature 2 - Edge Complexity (0-1):</strong> How many edges/corners the object has (high = complex)</li>
                                <li><strong>Simple Objects:</strong> Circle [0.9,0.1], Square [0.8,0.3] → Output: 0 (classified as simple)</li>
                                <li><strong>Complex Objects:</strong> Triangle [0.6,0.5], Star [0.3,0.9] → Output: 1 (classified as complex)</li>
                            </ul>
                            
                            <h3>What You Should Observe</h3>
                            <ul>
                                <li><strong>Training Mode:</strong> Watch data flow forward (blue particles), errors flow backward (red particles), and weights update (flashing connections)</li>
                                <li><strong>Testing Mode:</strong> See how the trained network processes new inputs and makes predictions with confidence scores</li>
                                <li><strong>Visual Indicators:</strong> Active neurons pulse, weight changes are highlighted, and prediction accuracy improves over time</li>
                                <li><strong>Object Context:</strong> Each training example shows the actual geometric object being learned</li>
                            </ul>
                            
                            <h3>Mathematical Foundation</h3>
                            <ul>
                                <li><strong>Neuron Output:</strong> y = σ(w₁x₁ + w₂x₂ + ... + wₙxₙ + b)</li>
                                <li><strong>Loss Function:</strong> L = (y_target - y_predicted)²</li>
                                <li><strong>Weight Update:</strong> w_new = w_old - α × ∂L/∂w</li>
                                <li><strong>Gradient Calculation:</strong> ∂L/∂w = ∂L/∂y × ∂y/∂w (chain rule)</li>
                            </ul>
                            
                            <h3>Real-World Applications</h3>
                            <ul>
                                <li><strong>Computer Vision:</strong> Image classification, object detection, facial recognition</li>
                                <li><strong>Natural Language Processing:</strong> Text classification, language translation, chatbots</li>
                                <li><strong>Speech Recognition:</strong> Voice assistants, transcription services</li>
                                <li><strong>Autonomous Systems:</strong> Self-driving cars, robotics, drones</li>
                                <li><strong>Medical Diagnosis:</strong> Disease detection, medical image analysis</li>
                                <li><strong>Financial Analysis:</strong> Fraud detection, stock prediction, risk assessment</li>
                            </ul>
                            
                            <h3>Educational Insights</h3>
                            <ul>
                                <li><strong>Learning Process:</strong> Neural networks learn by adjusting weights to minimize prediction errors</li>
                                <li><strong>Feature Learning:</strong> Hidden layers automatically learn useful features from raw input data</li>
                                <li><strong>Generalization:</strong> Well-trained networks can make accurate predictions on unseen data</li>
                                <li><strong>Overfitting:</strong> Networks can memorize training data instead of learning general patterns</li>
                                <li><strong>Hyperparameters:</strong> Learning rate, network architecture, and activation functions affect training success</li>
                            </ul>
                            
                            <h3>Interactive Features</h3>
                            <ul>
                                <li><strong>Training Mode:</strong> Watch the network learn through forward/backward propagation cycles</li>
                                <li><strong>Testing Mode:</strong> Test the trained network on different objects and see predictions</li>
                                <li><strong>Parameter Control:</strong> Adjust learning rate and animation speed to observe different training behaviors</li>
                                <li><strong>Visual Feedback:</strong> See real-time loss, accuracy, and confidence metrics</li>
                            </ul>
                            
                            <h3>Advanced Concepts</h3>
                            <ul>
                                <li><strong>Gradient Descent:</strong> Optimization algorithm that finds the best weights by following the steepest descent</li>
                                <li><strong>Vanishing Gradients:</strong> Problem where gradients become very small in deep networks</li>
                                <li><strong>Regularization:</strong> Techniques to prevent overfitting (dropout, weight decay)</li>
                                <li><strong>Batch Processing:</strong> Training on multiple examples simultaneously for better gradient estimates</li>
                                <li><strong>Transfer Learning:</strong> Using pre-trained networks for new tasks</li>
                            </ul>
                        </div>
                    `
                };
            case 'memory-management':
                return {
                    title: 'Program Execution - Code, Memory, and Data Flow',
                    html: `
                        <div class="science-content">
                            <h3>What is Program Execution?</h3>
                            <p>Program execution is the process by which a computer runs code, manages memory, and processes data. This animation visualizes how a real program is executed, showing the flow of control, function calls, memory allocation and deallocation, and the movement of data between stack and heap. It provides a unique window into what happens "under the hood" when a computer runs software.</p>
                            <h3>Key Concepts Demonstrated</h3>
                            <ul>
                                <li><strong>Code Execution:</strong> Step-by-step execution of a real program, including function calls and returns</li>
                                <li><strong>Call Stack Visualization:</strong> See how function calls create stack frames and how the stack grows and shrinks</li>
                                <li><strong>Heap Memory Management:</strong> Watch memory blocks being allocated (malloc) and freed (free), and observe fragmentation and memory usage</li>
                                <li><strong>Data Flow:</strong> Visualize how data moves between functions, stack, and heap during program execution</li>
                                <li><strong>Garbage Collection:</strong> Observe how unreachable memory is detected and cleaned up (if enabled)</li>
                                <li><strong>Performance Metrics:</strong> Track memory usage, allocation/deallocation counts, fragmentation, and efficiency</li>
                            </ul>
                            <h3>What You Should Observe</h3>
                            <ul>
                                <li>How function calls and returns affect the call stack</li>
                                <li>How memory is allocated and deallocated on the heap</li>
                                <li>How data is passed between functions and stored in memory</li>
                                <li>How memory fragmentation and leaks can occur</li>
                                <li>How the program completes its execution and cleans up resources</li>
                            </ul>
                            <h3>Real-World Applications</h3>
                            <ul>
                                <li>Understanding how operating systems and programming languages manage memory</li>
                                <li>Debugging and optimizing software for performance and reliability</li>
                                <li>Learning about stack overflows, memory leaks, and efficient resource management</li>
                                <li>Building better software by understanding what happens at runtime</li>
                            </ul>
                            <h3>Interactive Features</h3>
                            <ul>
                                <li>Step through program execution or watch it run automatically</li>
                                <li>View real-time statistics and performance metrics</li>
                                <li>Observe visual effects for memory allocation, deallocation, and data flow</li>
                                <li>Toggle output and statistics panels for deeper insights</li>
                            </ul>
                        </div>
                    `
                };
            case 'blockchain':
                return {
                    title: 'Blockchain - Distributed Ledger Technology',
                    html: `
                        <div class="science-content">
                            <h3>What is Blockchain?</h3>
                            <p>Blockchain is a distributed ledger technology that enables secure, transparent, and tamper-resistant record-keeping across a network of computers. Each block contains a list of transactions, and blocks are linked together in a chain using cryptographic hashes, creating an immutable record of all transactions.</p>
                            
                            <h3>Key Scientific Concepts</h3>
                            <ul>
                                <li><strong>Cryptographic Hashing:</strong> Mathematical function that converts data into a fixed-size string (hash) - any change in data produces a completely different hash</li>
                                <li><strong>Proof of Work:</strong> Consensus mechanism where miners solve complex mathematical puzzles to validate transactions and create new blocks</li>
                                <li><strong>Distributed Network:</strong> Multiple nodes maintain identical copies of the blockchain, ensuring redundancy and security</li>
                                <li><strong>Merkle Trees:</strong> Data structure that efficiently verifies transaction integrity by creating a single hash from multiple transactions</li>
                                <li><strong>Difficulty Adjustment:</strong> Network automatically adjusts mining difficulty to maintain consistent block creation rate</li>
                            </ul>
                            
                            <h3>Block Structure</h3>
                            <ul>
                                <li><strong>Block Header:</strong> Contains metadata including previous block hash, timestamp, nonce, and Merkle root</li>
                                <li><strong>Transactions:</strong> List of validated transactions waiting to be included in the block</li>
                                <li><strong>Nonce:</strong> Number that miners change to find a hash meeting the difficulty requirement</li>
                                <li><strong>Hash:</strong> Unique fingerprint of the block's content - any change invalidates the hash</li>
                                <li><strong>Previous Hash:</strong> Links each block to its predecessor, creating the chain</li>
                            </ul>
                            
                            <h3>Mining Process Explained</h3>
                            <ol>
                                <li><strong>Transaction Collection:</strong> Network collects pending transactions into a candidate block</li>
                                <li><strong>Hash Calculation:</strong> Block header is hashed using SHA-256 algorithm</li>
                                <li><strong>Difficulty Check:</strong> Hash must start with a specific number of zeros (target)</li>
                                <li><strong>Nonce Increment:</strong> If hash doesn't meet target, nonce is incremented and process repeats</li>
                                <li><strong>Block Discovery:</strong> When valid hash is found, block is broadcast to network</li>
                                <li><strong>Network Validation:</strong> Other nodes verify the block and add it to their chain</li>
                            </ol>
                            
                            <h3>What You Should Observe</h3>
                            <ul>
                                <li><strong>Modern Block Design:</strong> Rounded blocks with gradients, inner highlights, and modern typography</li>
                                <li><strong>Enhanced Mining Process:</strong> Watch miners (orange nodes with pulsing rings) working to find valid hashes</li>
                                <li><strong>Successful Miner Zoom:</strong> The successful miner node pulses and zooms to draw attention</li>
                                <li><strong>Dynamic Transaction Blocks:</strong> Transactions fade over time, show age indicators, and have priority colors</li>
                                <li><strong>Block Creation:</strong> See new blocks being added to the chain with celebration particles</li>
                                <li><strong>Network Propagation:</strong> Observe animated arrows showing blocks spreading through the network</li>
                                <li><strong>Transaction Flow:</strong> Watch pending transactions being included in blocks with real-time updates</li>
                                <li><strong>Difficulty Effects:</strong> Lower difficulty = faster mining, higher difficulty = slower mining</li>
                                <li><strong>Dynamic Network:</strong> Nodes join and leave the network automatically with enhanced visual effects</li>
                                <li><strong>Block Hashes:</strong> Always visible with modern monospace font (truncated for readability)</li>
                                <li><strong>Consensus Process:</strong> Watch network nodes reach agreement during guided mode</li>
                                <li><strong>Block Rejection:</strong> See blocks rejected with red particles when consensus fails (60% threshold)</li>
                                <li><strong>Transparent Info Panel:</strong> Network status panel with reduced opacity for better integration</li>
                            </ul>
                            
                            <h3>Block Rejection & Consensus</h3>
                            <p>In guided mode (difficulty 2+), the network implements a realistic consensus mechanism:</p>
                            <ul>
                                <li><strong>Consensus Threshold:</strong> 60% of network nodes must agree to accept a block</li>
                                <li><strong>Rejection Process:</strong> If consensus fails, the block is rejected with visual feedback</li>
                                <li><strong>Red Particles:</strong> Rejection particles appear around the mining block position</li>
                                <li><strong>Automatic Recovery:</strong> Mining automatically restarts after rejection</li>
                                <li><strong>Network Reset:</strong> All nodes return to default state after rejection</li>
                                <li><strong>Statistics Update:</strong> Phase indicator shows consensus percentage and rejection status</li>
                            </ul>
                            
                            <h3>Guided Mode (Difficulty 2+)</h3>
                            <p>When mining difficulty is set to 2 or higher, the simulation automatically activates a step-by-step guided mode that walks you through the entire block addition process:</p>
                            <ol>
                                <li><strong>Mining Success:</strong> Block is successfully mined with valid hash</li>
                                <li><strong>Validation:</strong> Network nodes validate the block's transactions and hash</li>
                                <li><strong>Propagation:</strong> Block spreads through the network via peer-to-peer communication</li>
                                <li><strong>Consensus:</strong> Network reaches agreement on block validity (requires 60% of nodes)</li>
                                <li><strong>Finalization:</strong> Block is permanently added to the blockchain OR rejected if consensus fails</li>
                            </ol>
                            <p><strong>Consensus Mechanism:</strong> The network requires 60% of nodes to reach consensus. If consensus fails, the block is rejected and mining restarts automatically.</p>
                            <p><strong>Note:</strong> For difficulty levels 1, blocks are added directly without guided mode for faster simulation.</p>
                            
                            <h3>Cryptographic Security</h3>
                            <ul>
                                <li><strong>Hash Function:</strong> SHA-256 produces 256-bit hashes - practically impossible to reverse</li>
                                <li><strong>Chain Integrity:</strong> Changing any block invalidates all subsequent blocks</li>
                                <li><strong>Immutability:</strong> Once added, blocks cannot be modified without detection</li>
                                <li><strong>Digital Signatures:</strong> Transactions are cryptographically signed to prevent forgery</li>
                                <li><strong>51% Attack Resistance:</strong> Network security depends on honest majority of computing power</li>
                            </ul>
                            
                            <h3>Network Architecture</h3>
                            <ul>
                                <li><strong>Full Nodes:</strong> Store complete blockchain and validate all transactions</li>
                                <li><strong>Mining Nodes:</strong> Specialized nodes that create new blocks through proof of work</li>
                                <li><strong>Light Nodes:</strong> Store only block headers for efficiency</li>
                                <li><strong>Peer-to-Peer:</strong> Direct communication between nodes without central authority</li>
                                <li><strong>Fork Resolution:</strong> Network automatically chooses the longest valid chain</li>
                            </ul>
                            
                            <h3>Mathematical Foundation</h3>
                            <ul>
                                <li><strong>Hash Function:</strong> H(x) = SHA-256(block_header) - deterministic and collision-resistant</li>
                                <li><strong>Difficulty Target:</strong> T = 2^(256-D) where D is difficulty level</li>
                                <li><strong>Mining Probability:</strong> P = T/2^256 - probability of finding valid hash in one attempt</li>
                                <li><strong>Expected Time:</strong> E[T] = 1/P attempts to find valid block</li>
                                <li><strong>Hashrate:</strong> H = attempts_per_second × network_size</li>
                            </ul>
                            
                            <h3>Real-World Applications</h3>
                            <ul>
                                <li><strong>Cryptocurrencies:</strong> Bitcoin, Ethereum, and other digital currencies</li>
                                <li><strong>Smart Contracts:</strong> Self-executing contracts with predefined conditions</li>
                                <li><strong>Supply Chain:</strong> Transparent tracking of goods from source to consumer</li>
                                <li><strong>Digital Identity:</strong> Secure, decentralized identity management</li>
                                <li><strong>Voting Systems:</strong> Tamper-resistant electronic voting</li>
                                <li><strong>Decentralized Finance (DeFi):</strong> Financial services without intermediaries</li>
                                <li><strong>NFTs:</strong> Non-fungible tokens for digital asset ownership</li>
                            </ul>
                            
                            <h3>Visual Enhancements</h3>
                            <ul>
                                <li><strong>Modern Block Design:</strong> Rounded corners, gradient backgrounds, inner highlights, and enhanced typography</li>
                                <li><strong>Golden Genesis Block:</strong> Special golden gradient to distinguish the first block</li>
                                <li><strong>Enhanced Node Design:</strong> Multi-stop gradients, gradient borders, and inner highlights for depth</li>
                                <li><strong>Successful Miner Zoom:</strong> Pulsing zoom effect (0.7x-1.3x) with additional rings for emphasis</li>
                                <li><strong>Dynamic Transaction Display:</strong> Age-based fading, priority indicators, and real-time updates</li>
                                <li><strong>Transaction Priority Colors:</strong> Green (High), Orange (Medium), Red (Low) based on fees</li>
                                <li><strong>Pulsing New Transactions:</strong> Fresh transactions have animated borders for 5 seconds</li>
                                <li><strong>Transparent Info Panel:</strong> Reduced opacity (75%-55%) with text shadows for readability</li>
                                <li><strong>Enhanced Typography:</strong> Modern fonts, better spacing, and improved readability</li>
                                <li><strong>Realistic Transaction Aging:</strong> Transactions expire after 30 seconds with visual feedback</li>
                            </ul>
                            
                            <h3>Interactive Features</h3>
                            <ul>
                                <li><strong>Mining Difficulty (1-8):</strong> Control how hard it is to mine blocks - affects block creation speed and guided mode activation</li>
                                <li><strong>Simulation Speed (0.1x-3x):</strong> Control how fast the entire simulation runs</li>
                                <li><strong>Auto Mining:</strong> Always enabled - simulation continuously mines new blocks</li>
                                <li><strong>Network Visualization:</strong> Always visible - watch nodes join, leave, and validate blocks</li>
                                <li><strong>Block Hashes:</strong> Always visible with modern monospace font (truncated for readability)</li>
                                <li><strong>Real-time Statistics:</strong> Monitor blocks, transactions, hashrate, network status, and current phase</li>
                                <li><strong>Guided Mode:</strong> Automatically activates for difficulty 2+ with step-by-step process visualization</li>
                            </ul>
                            
                            <h3>Dynamic Transaction System</h3>
                            <ul>
                                <li><strong>Real-time Generation:</strong> 1-4 new transactions every 1.5-3.5 seconds</li>
                                <li><strong>Transaction Types:</strong> Transfer, Smart Contract, Token Mint, Stake, Swap, Liquidity</li>
                                <li><strong>Dynamic Fees:</strong> Fees vary based on transaction type and complexity</li>
                                <li><strong>Age-based Fading:</strong> Transactions fade over 30 seconds with visual feedback</li>
                                <li><strong>Priority System:</strong> High/Medium/Low priority based on fee amounts</li>
                                <li><strong>Automatic Expiration:</strong> Transactions older than 30 seconds are removed</li>
                                <li><strong>Random Failures:</strong> 10% chance of low-fee transactions being rejected</li>
                                <li><strong>Mempool Management:</strong> Maximum 100 transactions with fee-based replacement</li>
                                <li><strong>Realistic Descriptions:</strong> Dynamic transaction descriptions for each type</li>
                                <li><strong>Visual Age Indicators:</strong> "Xs ago" display instead of absolute timestamps</li>
                            </ul>
                            
                            <h3>Advanced Concepts</h3>
                            <ul>
                                <li><strong>Consensus Mechanisms:</strong> Proof of Work, Proof of Stake, Delegated Proof of Stake</li>
                                <li><strong>Forking:</strong> Temporary chain splits that resolve through consensus</li>
                                <li><strong>Mempool:</strong> Pool of unconfirmed transactions waiting to be mined</li>
                                <li><strong>Block Rewards:</strong> Incentive system for miners to secure the network</li>
                                <li><strong>Transaction Fees:</strong> Additional incentive for miners to prioritize transactions</li>
                                <li><strong>Lightning Network:</strong> Layer 2 scaling solution for faster, cheaper transactions</li>
                            </ul>
                            
                            <h3>Security Considerations</h3>
                            <ul>
                                <li><strong>Double Spending:</strong> Prevented through consensus and transaction ordering</li>
                                <li><strong>Sybil Attacks:</strong> Mitigated through proof of work cost</li>
                                <li><strong>51% Attacks:</strong> Theoretical but economically unfeasible for large networks</li>
                                <li><strong>Quantum Resistance:</strong> Future consideration for post-quantum cryptography</li>
                                <li><strong>Privacy:</strong> Techniques like zero-knowledge proofs for transaction privacy</li>
                            </ul>
                            
                            <h3>Current Control Panel</h3>
                            <ul>
                                <li><strong>Mining Difficulty:</strong> Set to 1-8 (default: 4) - controls mining speed and guided mode activation</li>
                                <li><strong>Simulation Speed:</strong> Set to 0.1x-3x (default: 1.0x) - controls overall animation speed</li>
                                <li><strong>Reset Button:</strong> Resets the entire simulation to initial state</li>
                            </ul>
                            
                            <h3>Always Active Features</h3>
                            <ul>
                                <li><strong>Auto Mining:</strong> Continuously mines new blocks</li>
                                <li><strong>Network Visualization:</strong> Shows all nodes and their activities</li>
                                <li><strong>Block Hashes:</strong> Always visible in blocks (truncated for readability)</li>
                                <li><strong>Real-time Statistics:</strong> Live updates of all blockchain metrics</li>
                            </ul>
                            
                            <h3>Educational Insights</h3>
                            <ul>
                                <li><strong>Decentralization:</strong> No single point of failure or control</li>
                                <li><strong>Transparency:</strong> All transactions are publicly verifiable</li>
                                <li><strong>Immutability:</strong> Historical record cannot be altered</li>
                                <li><strong>Trustlessness:</strong> Participants don't need to trust each other, only the protocol</li>
                                <li><strong>Incentive Alignment:</strong> Economic incentives ensure network security and participation</li>
                            </ul>
                        </div>
                    `
                };
            default:
                return {
                    title: 'Animation Information',
                    html: '<p>Select an animation to learn more about the physics concepts it demonstrates.</p>'
                };
        }
    }
    
    updateMemoryManagementStats() {
        this.updateStats('memoryManagement', {
            'memoryBuildings': { path: 'totalHeapUsed', fallback: 0 },
            'memoryAllocated': { path: 'totalHeapUsed', fallback: 0 },
            'memoryGCCycles': { path: 'gcCycles', fallback: 0 },
            'memoryEfficiency': { 
                path: 'fragmentation', 
                format: 'percentage', 
                decimalPlaces: 1,
                transform: (value) => value ? (100 - value) : 100
            }
        });
    }
    
    updateBlockchainStats() {
        this.updateStats('blockchain', {
            'blockchainBlocks': { path: 'blocks', fallback: 0 },
            'blockchainTransactions': { path: 'transactions', fallback: 0 },
            'blockchainPending': { path: 'pending', fallback: 0 },
            'blockchainDifficulty': { path: 'difficulty', fallback: 0 },
            'blockchainHashrate': { path: 'hashrate', format: 'unit', suffix: ' H/s', fallback: 0 },
            'blockchainMiners': { path: 'miners', fallback: 0 },
            'blockchainNodes': { path: 'nodes', fallback: 0 },
            'blockchainMining': { path: 'isMining', format: 'boolean' }
        });
        
        // Update phase with consensus information
        const phaseElement = document.getElementById('blockchainPhase');
        if (phaseElement) {
            const stats = this.blockchain.getStats();
            let phaseText = stats.phase || 'idle';
            if (stats.phase === 'finalization' && stats.consensusPercentage !== undefined) {
                if (stats.consensusReached) {
                    phaseText = `Finalization (${stats.consensusPercentage}% consensus)`;
                } else {
                    phaseText = `Rejection (${stats.consensusPercentage}% < ${stats.consensusThreshold}%)`;
                }
            }
            phaseElement.textContent = phaseText;
        }
    }
}
