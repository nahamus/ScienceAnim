import { ScientificAnimations } from './animations.js';

// Initialize the application when the page loads
document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('animationCanvas');
    new ScientificAnimations(canvas);
    
    // Initialize controls panel toggle
    initializeControlsToggle();
});

// Controls panel toggle functionality
function initializeControlsToggle() {
    const controlsPanel = document.querySelector('.controls-panel');
    const toggleButton = document.querySelector('.controls-toggle');
    
    if (!controlsPanel || !toggleButton) return;
    
    // Check if user has a preference stored
    const isCollapsed = localStorage.getItem('controlsCollapsed') === 'true';
    
    if (isCollapsed) {
        controlsPanel.classList.add('collapsed');
    }
    
    toggleButton.addEventListener('click', () => {
        const isCurrentlyCollapsed = controlsPanel.classList.contains('collapsed');
        
        if (isCurrentlyCollapsed) {
            // Expand the panel
            controlsPanel.classList.remove('collapsed');
            localStorage.setItem('controlsCollapsed', 'false');
        } else {
            // Collapse the panel
            controlsPanel.classList.add('collapsed');
            localStorage.setItem('controlsCollapsed', 'true');
        }
    });
    
    // Add keyboard shortcut (Ctrl/Cmd + T)
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 't') {
            e.preventDefault();
            toggleButton.click();
        }
    });
} 