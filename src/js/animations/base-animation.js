// Base Animation Class
// Contains common functionality shared across all animation classes

export class BaseAnimation {
    constructor(ctx) {
        this.ctx = ctx;
        this.animationType = 'default'; // Default animation type
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
} 