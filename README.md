# Scientific Animations

An interactive web application featuring real-time scientific simulations for educational purposes. Built with modern web technologies and optimized for development with hot reloading.

🌐 **Live Demo**: [https://nahamus.github.io/ScienceAnim/](https://nahamus.github.io/ScienceAnim/)

## 🎨 **Label Visibility Guidelines**

### **Font Color Standards:**
```javascript
// Dark backgrounds
this.ctx.fillStyle = '#ffffff';
this.ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';

// Light backgrounds  
this.ctx.fillStyle = '#1a1a2e';
this.ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
```

### **Smart Base Animation Class**
The base animation class automatically detects animation type and applies appropriate colors:
```javascript
// Check for animations with transparent/light backgrounds that need dark text
if (this.constructor.name === 'FluidFlow' || 
    this.constructor.name === 'Bernoulli' ||
    this.constructor.name === 'BrownianMotion' || 
    this.constructor.name === 'Diffusion' || 
    this.constructor.name === 'GasLaws' ||
    this.constructor.name === 'Pendulum' ||
    this.constructor.name === 'OrbitalMotion' ||
    this.constructor.name === 'CollisionPhysics' ||
    this.constructor.name === 'FrictionInclinedPlanes' ||
    this.constructor.name === 'WaveParticleDuality' ||
    this.constructor.name === 'WavePropagation') {
    textColor = '#1a1a2e'; // Dark text for transparent/light backgrounds
    shadowColor = 'rgba(255, 255, 255, 0.8)'; // White shadow
}
```

### **⚠️ IMPORTANT: Always Check Label Visibility**
When adding new animations or modifying existing ones:
1. **Test label visibility** against the animation background
2. **Use appropriate font colors** with shadows for contrast
3. **Test on different screen sizes and brightness levels**

### **Common Issues to Avoid:**
- ❌ White text on white/light backgrounds
- ❌ Dark text on dark backgrounds  
- ❌ Low contrast text without shadows

### **Best Practices:**
- ✅ Always use text shadows for better readability
- ✅ Test visibility across different monitor brightness levels
- ✅ Use the base animation class's smart color detection
- ✅ Consider accessibility standards for color contrast

## Features

### 🧪 **Particle Physics**
- **Brownian Motion**: Random particle movement with temperature effects
- **Diffusion**: Concentration gradient visualization with Fick's laws
- **Gas Laws**: Pressure, volume, and temperature relationships

### ⚡ **Classical Mechanics**
- **Simple Pendulum**: Realistic physics with gravity and damping
- **Orbital Motion**: Planetary motion with gravitational forces
- **Collision Physics**: Momentum and energy conservation
- **Friction & Inclined Planes**: Force analysis and motion

### 🌊 **Wave Phenomena**
- **Wave Propagation**: Transverse, longitudinal, and combined waves
- **Sound Waves**: Wave packet visualization with interactive controls
- **Wave Interference**: Constructive and destructive interference patterns

### 🧲 **Electromagnetism**
- **Electric Fields**: Charge interactions and field visualization
- **Magnetic Fields**: Magnetic field lines and interactions
- **Diode & Transistor**: Semiconductor behavior simulation

### 🧠 **Computer Science**
- **Neural Networks**: Machine learning with decision boundaries
- **Memory Management**: Program execution with stack/heap visualization
- **Blockchain**: Cryptocurrency mining and network simulation

### 🌊 **Fluid Dynamics**
- **Fluid Flow**: Viscosity and Reynolds number effects
- **Bernoulli's Principle**: Pressure-velocity relationships

### ⚛️ **Quantum & Nuclear Physics**
- **Wave-Particle Duality**: Quantum behavior demonstration
- **Nuclear Physics**: Radioactive decay and nuclear reactions

## Project Structure

```
ScienceAnim/
├── src/
│   ├── index.html                    # Main HTML file
│   ├── styles/
│   │   └── main.css                  # All styles and responsive design
│   └── js/
│       ├── main.js                   # Application entry point
│       ├── animations.js             # Main animations controller
│       └── animations/
│           ├── base-animation.js     # Base animation class
│           ├── particle-physics.js   # Brownian, Diffusion, Gas Laws
│           ├── classical-mechanics.js # Pendulum, Orbital, Collision, Friction
│           ├── wave-phenomena.js     # Wave Propagation, Sound Waves
│           ├── electro-magnetism.js  # Electric/Magnetic Fields, Diode/Transistor
│           ├── computer-science.js   # Neural Networks, Memory Management
│           ├── blockchain.js         # Blockchain simulation
│           ├── fluid-dynamics.js     # Fluid Flow, Bernoulli's Principle
│           ├── nuclear-physics.js    # Nuclear decay simulation
│           └── quantum-physics.js    # Wave-Particle Duality
├── dist/                             # Build output (generated)
├── package.json                        # Dependencies and scripts
├── vite.config.js                    # Vite configuration
├── .gitignore                        # Git ignore rules
├── .prettierrc                       # Code formatting rules
├── .eslintrc.json                    # Code linting rules
└── README.md                         # This file
```

## Getting Started

### Prerequisites
- Node.js (version 16 or higher)
- npm or yarn package manager

### Installation

1. **Clone or download the project**
   ```bash
   git clone https://github.com/nahamus/ScienceAnim.git
   cd ScienceAnim
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   The application will automatically open at `http://localhost:5173` (Vite default port)

### Development Workflow

The project is set up with modern development tools for the best experience:

- **Hot Reloading**: Changes to HTML, CSS, or JavaScript automatically refresh the browser
- **Fast Build**: Vite provides extremely fast development server and build times
- **Code Quality**: ESLint and Prettier ensure consistent code formatting
- **Modern JavaScript**: Full ES6+ support with modules

### Available Scripts

```bash
# Start development server with hot reloading
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code for errors
npm run lint

# Format code with Prettier
npm run format
```

## 🚀 Deployment

### GitHub Pages Deployment

This project is automatically deployed to GitHub Pages using the `gh-pages` branch. Follow these steps to deploy your changes:

#### **1. Prepare for Deployment**
```bash
# Make sure all changes are committed
git add .
git commit -m "Your commit message"
```

#### **2. Deploy to GitHub Pages**
```bash
# Switch to the gh-pages branch
git checkout gh-pages

# Merge latest changes from develop
git merge develop

# Push to GitHub Pages
git push origin gh-pages

# Switch back to develop branch
git checkout develop
```

#### **3. Handle Merge Conflicts (if any)**
If you encounter merge conflicts during deployment:
```bash
# Pull latest changes from remote
git pull origin gh-pages --allow-unrelated-histories

# Resolve conflicts manually or use:
git checkout --ours <conflicted-file>
git add <conflicted-file>

# Commit the merge
git commit -m "Merge develop into gh-pages for deployment"

# Push the changes
git push origin gh-pages
```

#### **4. Verify Deployment**
- Visit: [https://nahamus.github.io/ScienceAnim/](https://nahamus.github.io/ScienceAnim/)
- Check that all animations are working correctly
- Test responsive design on different devices

### **Deployment Notes**
- **Branch**: Uses `gh-pages` branch for deployment
- **Build**: No build step required - deploys source files directly
- **Updates**: Changes are live immediately after push
- **Custom Domain**: Can be configured in repository settings

## 🆕 Recent Improvements

### **Enhanced User Experience**
- **Simplified Controls**: Streamlined animation controls for better usability
- **On-Canvas Controls**: Interactive play/pause/reset buttons for key animations
- **Responsive Design**: Improved mobile and tablet experience
- **Better Visuals**: Enhanced particle rendering and wave visualization

### **Code Quality**
- **ESLint & Prettier**: Automated code formatting and linting
- **Modular Architecture**: Separated animation classes for better maintainability
- **Performance**: Optimized rendering and animation loops
- **Accessibility**: Improved contrast and keyboard navigation

### **New Features**
- **Sound Waves**: Wave packet visualization with interactive controls
- **Program Execution**: Memory management simulation with step-by-step execution
- **Blockchain**: Cryptocurrency mining simulation with network visualization
- **Neural Networks**: Machine learning visualization with decision boundaries

## Development Best Practices

### Code Organization
- **Modular Structure**: Each animation is a separate class for maintainability
- **ES6 Modules**: Clean import/export structure
- **Separation of Concerns**: UI, logic, and styling are properly separated

### Performance Optimization
- **Canvas Rendering**: Efficient 2D canvas for smooth animations
- **RequestAnimationFrame**: Optimized animation loop
- **Program Execution**: Proper cleanup and resource management

### Responsive Design
- **Mobile-First**: Responsive layout that works on all devices
- **Flexible Grid**: CSS Grid for adaptive layouts
- **Touch-Friendly**: Optimized controls for touch devices

## Customization

### Adding New Animations
1. Create a new class in `src/js/animations.js`
2. Implement `update()`, `render()`, and `getStats()` methods
3. Add controls to the HTML
4. Update the main controller to handle the new animation

### Styling
- All styles are in `src/styles/main.css`
- Uses CSS custom properties for easy theming
- Responsive breakpoints for different screen sizes

### Configuration
- Animation parameters can be adjusted in the respective classes
- Vite configuration in `vite.config.js` for build optimization
- ESLint and Prettier configurations for code quality

## Browser Support

- **Modern Browsers**: Chrome, Firefox, Safari, Edge (latest versions)
- **Mobile Browsers**: iOS Safari, Chrome Mobile
- **Features Used**: Canvas API, ES6 Modules, CSS Grid, Flexbox

## Performance

- **60 FPS Animations**: Smooth, optimized rendering
- **Efficient Algorithms**: Optimized physics calculations
- **Program Execution**: Proper cleanup and resource management
- **Fast Loading**: Minimal bundle size with Vite

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run `npm run lint` and `npm run format`
5. Test your changes
6. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Educational Value

This application is designed for:
- **Physics Education**: Demonstrates fundamental physics concepts
- **Interactive Learning**: Hands-on exploration of scientific principles
- **Visual Learning**: Visual representation of abstract concepts
- **Parameter Experimentation**: Safe environment to test different scenarios

Perfect for students, teachers, and anyone interested in understanding scientific phenomena through interactive simulations. 