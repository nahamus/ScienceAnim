# Scientific Animations

An interactive web application featuring real-time scientific simulations for educational purposes. Built with modern web technologies and optimized for development with hot reloading.

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

### 🧪 Brownian Motion Simulation
- **Interactive Controls**: Adjust particle count, animation speed, temperature, and trail visibility
- **Real-time Statistics**: Track active particles, average speed, and simulation time
- **Color-coded Particles**: Each particle has a unique color for easy tracking
- **Physics-based Movement**: Realistic random motion with temperature effects

### ⏰ Simple Pendulum Simulation
- **Realistic Physics**: Accurate pendulum motion with gravity and damping
- **Customizable Parameters**: Adjust length, speed, initial angle, gravity, and damping
- **Path Visualization**: Optional trail showing pendulum's motion path
- **Period Calculation**: Real-time period calculation based on length and gravity

### 🌊 Diffusion Simulation
- **Concentration Gradients**: Particles move from high to low concentration areas
- **Heatmap Visualization**: Optional concentration heatmap overlay
- **Fick's Laws**: Demonstrates diffusion principles
- **Interactive Controls**: Adjust particle count, speed, diffusion rate, and gradient

### 🌊 Wave Propagation Simulation
- **Multiple Wave Types**: Transverse, longitudinal, interference, and standing waves
- **Real-time Parameters**: Adjust frequency, amplitude, wavelength, and speed
- **Visualization Options**: Toggle waveform and particle displays
- **Educational Value**: Demonstrates wave physics concepts

## Project Structure

```
scientific-animations/
├── src/
│   ├── index.html          # Main HTML file
│   ├── styles/
│   │   └── main.css        # All styles and responsive design
│   └── js/
│       ├── main.js         # Application entry point
│       └── animations.js   # All simulation classes and logic
├── public/                 # Static assets (if any)
├── dist/                   # Build output (generated)
├── package.json            # Dependencies and scripts
├── vite.config.js          # Vite configuration
├── .gitignore             # Git ignore rules
├── .prettierrc            # Code formatting rules
├── .eslintrc.json         # Code linting rules
└── README.md              # This file
```

## Getting Started

### Prerequisites
- Node.js (version 16 or higher)
- npm or yarn package manager

### Installation

1. **Clone or download the project**
   ```bash
   git clone <repository-url>
   cd scientific-animations
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
   The application will automatically open at `http://localhost:3000`

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

This project is deployed to GitHub Pages using the `gh-pages` branch. Follow these steps to deploy your changes:

#### **1. Prepare for Deployment**
```bash
# Make sure all changes are committed
git add .
git commit -m "Your commit message"
```

#### **2. Build the Project**
```bash
# Build the project for production
npm run build
```

#### **3. Deploy to GitHub Pages**
```bash
# Switch to the gh-pages branch
git checkout gh-pages

# Copy built files to root directory (Windows)
xcopy dist\* . /E /Y

# For Linux/Mac users, use:
# cp -r dist/* .

# Add and commit the built files
git add .
git commit -m "Deploy built version with latest changes"

# Push to GitHub Pages
git push origin gh-pages

# Switch back to develop branch
git checkout develop
```

#### **4. Handle Merge Conflicts (if needed)**
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

#### **5. Verify Deployment**
- Visit: [https://nahamus.github.io/ScienceAnim/](https://nahamus.github.io/ScienceAnim/)
- Check that all animations are working correctly
- Test responsive design on different devices
- Clear browser cache if changes don't appear immediately

### **Deployment Notes**
- **Branch**: Uses `gh-pages` branch for deployment
- **Build Required**: Must run `npm run build` before deployment
- **Built Files**: Deploy the contents of the `dist/` folder
- **Updates**: Changes are live immediately after push
- **Cache**: GitHub Pages may take 1-2 minutes to update

### **Troubleshooting**
- **Changes not visible**: Clear browser cache or wait 1-2 minutes
- **Build errors**: Check for syntax errors in source files
- **Merge conflicts**: Use `git checkout --ours` for config files
- **404 errors**: Ensure `index.html` is in the root of gh-pages branch

### **Quick Deployment Script**
For faster deployment, you can create a batch file (Windows) or shell script:

**deploy.bat** (Windows):
```batch
@echo off
echo Building project...
npm run build
echo Switching to gh-pages branch...
git checkout gh-pages
echo Copying built files...
xcopy dist\* . /E /Y
echo Committing changes...
git add .
git commit -m "Deploy built version with latest changes"
echo Pushing to GitHub Pages...
git push origin gh-pages
echo Switching back to develop...
git checkout develop
echo Deployment complete!
```

**deploy.sh** (Linux/Mac):
```bash
#!/bin/bash
echo "Building project..."
npm run build
echo "Switching to gh-pages branch..."
git checkout gh-pages
echo "Copying built files..."
cp -r dist/* .
echo "Committing changes..."
git add .
git commit -m "Deploy built version with latest changes"
echo "Pushing to GitHub Pages..."
git push origin gh-pages
echo "Switching back to develop..."
git checkout develop
echo "Deployment complete!"
```

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