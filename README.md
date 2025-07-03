# Animal Behavior Agent - Savanna Simulation

A sophisticated 3D animal behavior simulation that creates a dynamic savanna ecosystem with AI-powered animals exhibiting realistic behaviors, social interactions, and survival instincts.

## 🌍 Overview

This application simulates a living savanna ecosystem where animals interact with each other and their environment in real-time. Each animal has unique personalities, daily routines, and decision-making capabilities powered by Large Language Models (LLMs). The simulation features realistic terrain generation, weather cycles, hunting behaviors, social dynamics, and breeding systems.


## Installation
1. Clone or download this repository
2. Open a terminal in the project directory
3. Start a local HTTP server:
   ```bash
   python3 -m http.server
   ```
4. Open your browser and navigate to `http://localhost:8000`

## Setup
1. Enter your OpenAI API key in the control panel
2. Choose your preferred AI provider (OpenAI or Gemini)
3. Click "Start Simulation" to begin


## 🦁 Features

### Animal Behavior System
- **AI-Powered Decision Making**: Each animal uses LLM APIs (OpenAI, Anthropic, Google) to make contextual decisions
- **Personality Traits**: Unique personalities with traits like aggression, energy, sociability, intelligence, and leadership
- **Daily Routines**: Animals follow realistic daily schedules based on time of day and their species
- **Social Interactions**: Complex relationship systems between animals with memory of past interactions
- **Herd Behavior**: Group dynamics for herd animals with leadership and formation patterns

### Ecosystem Simulation
- **Diverse Animal Species**: Lions, elephants, giraffes, zebras, hyenas, meerkats, and gazelles
- **Predator-Prey Dynamics**: Realistic hunting and escape behaviors
- **Terrain Generation**: Procedurally generated savanna landscape with different biomes
- **Weather & Time System**: Dynamic day/night cycles affecting animal behavior
- **Resource Management**: Food, water, and energy systems for survival

### Interactive Features
- **3D Visualization**: Real-time 3D rendering using Three.js
- **Camera Controls**: Multiple viewing modes (free camera, animal perspective, facility view)
- **Real-time Monitoring**: Live activity logs and animal status tracking
- **Speed Control**: Adjustable simulation speed (1x to 10x)
- **Animal Selection**: Click on animals to view detailed information

### Technical Capabilities
- **LLM Integration**: Support for multiple AI providers (OpenAI GPT, Anthropic Claude, Google Gemini)
- **Memory Systems**: Short-term and long-term memory for animals
- **Breeding System**: Reproduction mechanics with genetic traits
- **Pathfinding**: Intelligent movement and navigation
- **Performance Optimization**: LOD (Level of Detail) terrain rendering

## 🚀 Getting Started

### Prerequisites
- Modern web browser with WebGL support
- API key from one of the supported LLM providers:
  - OpenAI (GPT-3.5-turbo)
  - Anthropic (Claude-3-Haiku)
  - Google (Gemini Pro)

### Installation
1. Clone or download this repository
2. Open `index.html` in your web browser
3. Configure your API key in the control panel
4. Click "Start" to begin the simulation

### API Configuration
1. Select your preferred API provider from the dropdown
2. Enter your API key in the password field
3. Click "Set" to save the configuration
4. The API key is stored locally for convenience

## 🎮 Controls

### Simulation Controls
- **Start/Pause**: Control simulation state
- **Speed**: Adjust simulation speed (1x, 2x, 5x, 10x)
- **Time Display**: Shows current in-game time

### Camera Controls
- **Free Camera**: WASD to move, mouse to look around
- **Animal View**: Follow individual animals
- **Facility View**: Focus on terrain features
- **Zoom**: +/- buttons to adjust camera distance
- **Reset**: Return to overview position

### Visualization
- **Terrain Network**: Toggle path visualization
- **Activity Log**: Monitor animal behaviors in real-time
- **Animal Info**: Click animals for detailed status

## 🏗️ Architecture

### Core Components
- **`main.js`**: Main simulation loop and initialization
- **`agent.js`**: Animal behavior and AI decision-making
- **`terrain.js`**: Procedural terrain generation
- **`character.js`**: 3D model rendering
- **`config.js`**: Animal personalities and simulation settings
- **`panel.js`**: UI management and controls

### AI Integration
The simulation uses LLM APIs to generate realistic animal thoughts and decisions:
- Context-aware prompts based on environment and situation
- Personality-driven responses
- Memory integration for consistent behavior
- Fallback systems for offline operation

### Performance Features
- Chunk-based terrain rendering with LOD
- Efficient 3D model management
- Optimized AI call frequency
- Memory management for long-running simulations

## 🎯 Use Cases

- **Educational**: Learn about animal behavior and ecosystem dynamics
- **Research**: Study AI-driven autonomous agents
- **Entertainment**: Interactive wildlife simulation
- **Development**: Framework for AI behavior systems

## 🔧 Customization

### Adding New Animals
1. Define animal type in `config.js`
2. Add personality traits and behaviors
3. Configure movement patterns and abilities
4. Set up predator-prey relationships

### Modifying Terrain
1. Adjust terrain generation parameters in `terrain.js`
2. Modify biome distributions
3. Add new terrain types and features

### Behavior Tuning
1. Modify personality traits in `config.js`
2. Adjust AI prompt templates in `agent.js`
3. Fine-tune movement and interaction parameters

## 🐛 Troubleshooting

### Common Issues
- **API Errors**: Verify API key and provider selection
- **Performance**: Reduce simulation speed or animal count
- **Display Issues**: Check WebGL support in browser
- **Memory**: Refresh page for long-running simulations

### Browser Compatibility
- Chrome/Chromium (recommended)
- Firefox
- Safari
- Edge

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues, feature requests, or pull requests.

## 📊 Technical Specifications

- **Framework**: Vanilla JavaScript with Three.js
- **AI**: LLM API integration (OpenAI, Anthropic, Google)
- **Graphics**: WebGL via Three.js
- **Terrain**: Procedural generation with noise functions
- **Physics**: Custom movement and collision systems
- **Memory**: Local storage for settings and API keys

---

Experience the complexity and beauty of a living ecosystem where every animal has a mind of its own! 🦁🐘🦒