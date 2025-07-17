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
    const toggleText = toggleButton.querySelector('.toggle-text');
    
    if (isCollapsed) {
        controlsPanel.classList.add('collapsed');
        if (toggleText) toggleText.textContent = 'Settings';
    } else {
        if (toggleText) toggleText.textContent = 'Hide';
    }
    
    toggleButton.addEventListener('click', () => {
        const isCurrentlyCollapsed = controlsPanel.classList.contains('collapsed');
        const toggleText = toggleButton.querySelector('.toggle-text');
        
        if (isCurrentlyCollapsed) {
            // Expand the panel
            controlsPanel.classList.remove('collapsed');
            localStorage.setItem('controlsCollapsed', 'false');
            if (toggleText) toggleText.textContent = 'Hide';
        } else {
            // Collapse the panel
            controlsPanel.classList.add('collapsed');
            localStorage.setItem('controlsCollapsed', 'true');
            if (toggleText) toggleText.textContent = 'Settings';
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