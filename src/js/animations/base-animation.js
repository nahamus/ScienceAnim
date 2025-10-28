// Base Animation Class
// Contains common functionality shared across all animation classes

export class BaseAnimation {
    constructor(ctx) {
        this.ctx = ctx;
        this.animationType = 'default'; // Default animation type
        
        // Standardized control system
        this.isPlaying = false; // Default to paused - user must press Play to start
        this.speedMultiplier = 1; // 0.5x, 1x, 2x, 4x speed
        this.speedCycle = [0.5, 1, 2, 4]; // Speed cycle for the speed button
        this.speedCycleIndex = 1; // Start at 1x speed (index 1)
        this.time = 0; // Time counter for animations and effects
        
        // Control button definitions with Program Execution styling
        this.controlButtons = [
            { id: 'playPause', label: '⏸', x: 20, y: 20, width: 35, height: 30, tooltip: 'Play/Pause' },
            { id: 'reset', label: '⟲', x: 60, y: 20, width: 35, height: 30, tooltip: 'Reset' },
            { id: 'speed', label: '⚡', x: 100, y: 20, width: 35, height: 30, tooltip: 'Speed' }
        ];
        this.hoveredButton = null;
        this.lastButtonClickTime = 0; // For debouncing rapid taps
    }
    
    /**
     * Draw labels on the canvas with consistent styling
     * @param {string} title - The animation title to display
     * @param {string} formulas - Mathematical formulas to display
     * @param {number} titleY - Y position for title (default: 70)
     * @param {number} formulasY - Y position for formulas (default: 90)
     */
    drawLabels(title, formulas, titleY = 70, formulasY = 90) {
        this.ctx.save();
        
        // Scale text for device pixel ratio for crisper rendering
        const dpr = (window && window.devicePixelRatio) ? window.devicePixelRatio : 1;
        this.ctx.scale(1, 1); // keep geometry as-is; font sizes adjusted below
        const titleFontSize = Math.round(16 * (dpr > 1 ? 1.0 : 1));
        const formulaFontSize = Math.round(12 * (dpr > 1 ? 1.0 : 1));

        // Set up text styling
        this.ctx.font = `bold ${titleFontSize}px Inter`;
        this.ctx.textAlign = 'center';
        
        // Determine background type and set appropriate colors
        // Most animations use dark backgrounds, so default to white text
        let textColor = '#ffffff';
        let shadowColor = 'rgba(0, 0, 0, 0.8)';
        
        // Check for animations with transparent/light backgrounds that need dark text
        // Use animationType property instead of constructor.name for reliability
        if (this.animationType === 'fluid-flow' || 
            this.animationType === 'bernoulli' ||
            this.animationType === 'brownian-motion' || 
            this.animationType === 'diffusion' || 
            this.animationType === 'gas-laws' ||
            this.animationType === 'pendulum' ||
            this.animationType === 'orbital-motion' ||
            this.animationType === 'wave-particle-duality' ||
            this.animationType === 'wave-propagation') {
            textColor = '#1a1a2e'; // Dark text for transparent/light backgrounds
            shadowColor = 'rgba(255, 255, 255, 0.8)'; // White shadow
        }
        
        // Add high-contrast outline for legibility on varied backgrounds
        const outlineColor = (textColor === '#ffffff') ? 'rgba(0,0,0,0.9)' : 'rgba(255,255,255,0.9)';
        this.ctx.lineWidth = 3;
        this.ctx.strokeStyle = outlineColor;
        this.ctx.shadowColor = shadowColor;
        this.ctx.shadowBlur = 2;

        // Draw animation type label
        this.ctx.fillStyle = textColor;
        this.ctx.strokeText(title, this.ctx.canvas.width / 2, titleY);
        this.ctx.fillText(title, this.ctx.canvas.width / 2, titleY);
        
        // Draw mathematical formulas in a more compact format
        this.ctx.font = `${formulaFontSize}px Inter`;
        this.ctx.fillStyle = textColor;
        this.ctx.strokeStyle = outlineColor;
        this.ctx.shadowColor = shadowColor;
        this.ctx.strokeText(formulas, this.ctx.canvas.width / 2, formulasY);
        this.ctx.fillText(formulas, this.ctx.canvas.width / 2, formulasY);
        
        // Reset shadow
        this.ctx.shadowBlur = 0;
        this.ctx.restore();
    }
    
    /**
     * Update stats display elements if they exist
     * @param {Object} stats - The stats object
     * @param {Object} elementMappings - Mapping of stat keys to element IDs
     */
    updateStatsWithElements(stats, elementMappings) {
        Object.entries(elementMappings).forEach(([key, elementId]) => {
            const element = document.getElementById(elementId);
            if (element && stats[key] !== undefined) {
                element.textContent = stats[key];
            }
        });
    }
    
    /**
     * Common reset functionality
     */
    reset() {
        this.time = 0;
    }
    
    /**
     * Common update method stub
     */
    update(deltaTime) {
        this.time += deltaTime;
    }
    
    /**
     * Common render method stub
     */
    render() {
        // Override in subclasses
    }
    
    /**
     * Common getStats method stub
     */
    getStats() {
        return {
            time: this.time || 0
        };
    }
    
    /**
     * Standardized control button rendering with Program Execution styling
     */
    drawControlButtons() {
        // Detect mobile devices and adjust button size accordingly
        const isMobile = window.innerWidth <= 768 || ('ontouchstart' in window);
        const buttonWidth = isMobile ? 50 : 35;  // Larger buttons on mobile
        const buttonHeight = isMobile ? 40 : 30; // Larger buttons on mobile
        const buttonSpacing = isMobile ? 55 : 40; // More spacing on mobile
        
        // Calculate dynamic button positions to ensure they stay within canvas bounds
        const totalButtonWidth = this.controlButtons.length * buttonSpacing + (this.controlButtons.length - 1) * 5;
        const maxX = this.ctx.canvas.width - totalButtonWidth - 10;
        const startX = Math.min(20, maxX);
        
        for (let i = 0; i < this.controlButtons.length; i++) {
            const button = this.controlButtons[i];
            const isHovered = this.hoveredButton === button.id;
            
            // Update button dimensions for mobile
            button.width = buttonWidth;
            button.height = buttonHeight;
            
            // Update button position dynamically
            button.x = startX + i * buttonSpacing;
            
            // Button background with gradient
            const bgGradient = this.ctx.createLinearGradient(button.x, button.y, button.x, button.y + button.height);
            if (isHovered) {
                bgGradient.addColorStop(0, '#5a9fd4');
                bgGradient.addColorStop(1, '#4a8fc4');
            } else {
                bgGradient.addColorStop(0, '#3a5f84');
                bgGradient.addColorStop(1, '#2a4f74');
            }
            this.ctx.fillStyle = bgGradient;
            this.roundRect(button.x, button.y, button.width, button.height, 6);
            this.ctx.fill();
            
            // Button border with pulsating effect for play button when running
            if (button.id === 'playPause' && this.isPlaying) {
                // Pulsating border effect
                const pulseIntensity = 0.5 + 0.5 * Math.sin(this.time * 0.01); // Pulsating between 0.5 and 1.0
                this.ctx.strokeStyle = `rgba(74, 175, 244, ${pulseIntensity})`; // Bright blue with pulsing opacity
                this.ctx.lineWidth = 2 + pulseIntensity; // Thicker border that pulses
            } else {
                // Normal border
                this.ctx.strokeStyle = isHovered ? '#7eb3d9' : '#4a6f94';
                this.ctx.lineWidth = 1.5;
            }
            this.roundRect(button.x, button.y, button.width, button.height, 6);
            this.ctx.stroke();
            
            // Button icon/label
            this.ctx.fillStyle = '#ffffff';
            const fontSize = isMobile ? 'bold 18px Arial' : 'bold 16px Arial';
            this.ctx.font = fontSize;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            
            // Special handling for play/pause button
            if (button.id === 'playPause') {
                this.ctx.fillText(this.isPlaying ? '⏸' : '▶', button.x + button.width / 2, button.y + button.height / 2);
            } else if (button.id === 'speed') {
                const speedFontSize = isMobile ? 'bold 13px Arial' : 'bold 11px Arial';
                this.ctx.font = speedFontSize;
                // Format speed display properly for 0.5x
                const speedText = this.speedMultiplier === 0.5 ? '0.5x' : `${this.speedMultiplier}x`;
                this.ctx.fillText(speedText, button.x + button.width / 2, button.y + button.height / 2);
            } else {
                this.ctx.fillText(button.label, button.x + button.width / 2, button.y + button.height / 2);
            }
            
            // Tooltip on hover
            if (isHovered) {
                const tooltipX = button.x + button.width / 2;
                const tooltipY = button.y + button.height + 8;
                
                // Tooltip background
                this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
                const tooltipWidth = this.ctx.measureText(button.tooltip).width + 12;
                this.ctx.fillRect(tooltipX - tooltipWidth / 2, tooltipY, tooltipWidth, 20);
                
                // Tooltip text
                this.ctx.fillStyle = '#ffffff';
                this.ctx.font = '10px Arial';
                this.ctx.fillText(button.tooltip, tooltipX, tooltipY + 10);
            }
        }
    }
    
    /**
     * Handle button click events
     * @param {number} x - Click X coordinate
     * @param {number} y - Click Y coordinate
     * @returns {boolean} - True if a button was clicked
     */
    handleButtonClick(x, y) {
        // Debounce rapid taps (especially important for mobile)
        const currentTime = Date.now();
        if (currentTime - this.lastButtonClickTime < 300) { // 300ms debounce
            return false;
        }
        
        for (const button of this.controlButtons) {
            if (x >= button.x && x <= button.x + button.width &&
                y >= button.y && y <= button.y + button.height) {
                this.lastButtonClickTime = currentTime;
                this.handleControlAction(button.id);
                return true;
            }
        }
        return false;
    }
    
    /**
     * Handle control actions
     * @param {string} action - The action to perform
     */
    handleControlAction(action) {
        switch (action) {
            case 'playPause':
                this.isPlaying = !this.isPlaying;
                break;
            case 'reset':
                this.isPlaying = false; // Stay paused after reset - user must press Play
                this.speedMultiplier = 1;
                this.speedCycleIndex = 1; // Reset to 1x speed (index 1)
                this.reset();
                break;
            case 'speed':
                this.speedCycleIndex = (this.speedCycleIndex + 1) % this.speedCycle.length;
                this.speedMultiplier = this.speedCycle[this.speedCycleIndex];
                break;
        }
    }
    
    /**
     * Handle mouse movement for hover effects
     * @param {number} x - Mouse X coordinate
     * @param {number} y - Mouse Y coordinate
     */
    handleMouseMove(x, y) {
        this.hoveredButton = null;
        for (const button of this.controlButtons) {
            if (x >= button.x && x <= button.x + button.width &&
                y >= button.y && y <= button.y + button.height) {
                this.hoveredButton = button.id;
                break;
            }
        }
    }
    
    /**
     * Get the current speed multiplier for animations
     * @returns {number} - Speed multiplier
     */
    getSpeedMultiplier() {
        return this.speedMultiplier;
    }
    
    /**
     * Check if animation is currently playing
     * @returns {boolean} - True if playing
     */
    isAnimationPlaying() {
        return this.isPlaying;
    }
    
    /**
     * Draw rounded rectangle path
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {number} width - Width
     * @param {number} height - Height
     * @param {number} radius - Corner radius
     */
    roundRect(x, y, width, height, radius) {
        this.ctx.beginPath();
        this.ctx.moveTo(x + radius, y);
        this.ctx.lineTo(x + width - radius, y);
        this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        this.ctx.lineTo(x + width, y + height - radius);
        this.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        this.ctx.lineTo(x + radius, y + height);
        this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        this.ctx.lineTo(x, y + radius);
        this.ctx.quadraticCurveTo(x, y, x + radius, y);
        this.ctx.closePath();
    }
} 