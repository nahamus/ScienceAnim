// Base Animation Class
// Contains common functionality shared across all animation classes

export class BaseAnimation {
    constructor(ctx) {
        this.ctx = ctx;
    }
    
    /**
     * Draw labels on the canvas with consistent styling
     * @param {string} title - The animation title to display
     * @param {string} formulas - Mathematical formulas to display
     * @param {number} titleY - Y position for title (default: 25)
     * @param {number} formulasY - Y position for formulas (default: 45)
     */
    drawLabels(title, formulas, titleY = 25, formulasY = 45) {
        this.ctx.save();
        
        // Set up text styling
        this.ctx.font = 'bold 16px Inter';
        this.ctx.textRenderingOptimization = 'optimizeLegibility';
        this.ctx.textAlign = 'center';
        
        // Determine background type and set appropriate colors
        // Most animations use dark backgrounds, so default to white text
        let textColor = '#ffffff';
        let shadowColor = 'rgba(0, 0, 0, 0.8)';
        
        // Check for animations with transparent/light backgrounds that need dark text
        if (this.constructor.name === 'FluidFlow' || 
            this.constructor.name === 'Bernoulli' ||
            this.constructor.name === 'BrownianMotion' || 
            this.constructor.name === 'Diffusion' || 
            this.constructor.name === 'GasLaws' ||
            this.constructor.name === 'Pendulum' ||
            this.constructor.name === 'OrbitalMotion' ||
            this.constructor.name === 'WaveParticleDuality' ||
            this.constructor.name === 'WavePropagation') {
            textColor = '#1a1a2e'; // Dark text for transparent/light backgrounds
            shadowColor = 'rgba(255, 255, 255, 0.8)'; // White shadow
        }
        
        // Draw animation type label
        this.ctx.fillStyle = textColor;
        this.ctx.shadowColor = shadowColor;
        this.ctx.shadowBlur = 2;
        this.ctx.fillText(title, this.ctx.canvas.width / 2, titleY);
        
        // Draw mathematical formulas in a more compact format
        this.ctx.font = '12px Inter';
        this.ctx.textRenderingOptimization = 'optimizeLegibility';
        this.ctx.fillStyle = textColor;
        this.ctx.shadowColor = shadowColor;
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
} 