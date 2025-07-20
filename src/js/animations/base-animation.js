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
        
        // Draw animation type label
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        this.ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
        this.ctx.shadowBlur = 2;
        this.ctx.fillText(title, this.ctx.canvas.width / 2, titleY);
        
        // Draw mathematical formulas in a more compact format
        this.ctx.font = '12px Inter';
        this.ctx.textRenderingOptimization = 'optimizeLegibility';
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
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