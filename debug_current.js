// Debug current neural network state
function sigmoid(x) { 
    return 1 / (1 + Math.exp(-x)); 
}
function sigmoidDerivative(x) { return x * (1 - x); }

// Simpler network: 2-2-1 with small random weights
const weights = [
    [[0.1, -0.2], [0.3, 0.1]],  // Input to hidden (2x2)
    [[0.2], [-0.1]]               // Hidden to output (2x1)
];
const biases = [
    [0.1, -0.1],  // Hidden layer biases
    [0.05]        // Output layer bias
];
const trainingData = [
    { input: [0.9, 0.1], output: [0], object: 'circle' },
    { input: [0.8, 0.3], output: [0], object: 'square' },
    { input: [0.6, 0.5], output: [1], object: 'triangle' },
    { input: [0.3, 0.9], output: [1], object: 'star' }
];

function forwardPropagate(inputs) {
    let activations = [inputs];
    let current = inputs;
    for (let l = 0; l < weights.length; l++) {
        let next = [];
        for (let j = 0; j < weights[l][0].length; j++) {
            let sum = biases[l][j];
            for (let i = 0; i < current.length; i++) {
                sum += current[i] * weights[l][i][j];
            }
            next.push(sigmoid(sum));
        }
        activations.push(next);
        current = next;
    }
    return activations;
}

function backwardPropagate(activations, targets) {
    let deltas = [];
    // Output layer delta
    let output = activations[activations.length - 1];
    let delta = [];
    for (let i = 0; i < output.length; i++) {
        delta.push((targets[i] - output[i]) * sigmoidDerivative(output[i]));
    }
    deltas.unshift(delta);
    // Hidden layers
    for (let l = weights.length - 1; l > 0; l--) {
        let layer = activations[l];
        let nextDelta = [];
        for (let i = 0; i < layer.length; i++) {
            let error = 0;
            for (let j = 0; j < deltas[0].length; j++) {
                error += deltas[0][j] * weights[l][i][j];
            }
            nextDelta.push(error * sigmoidDerivative(layer[i]));
        }
        deltas.unshift(nextDelta);
    }
    return deltas;
}

function updateWeights(activations, deltas, learningRate) {
    for (let l = 0; l < weights.length; l++) {
        for (let i = 0; i < weights[l].length; i++) {
            for (let j = 0; j < weights[l][0].length; j++) {
                weights[l][i][j] += learningRate * deltas[l][j] * activations[l][i];
            }
        }
        for (let j = 0; j < biases[l].length; j++) {
            biases[l][j] += learningRate * deltas[l][j];
        }
    }
}

// Training the neural network
const learningRate = 0.1;
for (let epoch = 0; epoch < 100; epoch++) {
    for (let dataIndex = 0; dataIndex < trainingData.length; dataIndex++) {
        const data = trainingData[dataIndex];
        const activations = forwardPropagate(data.input);
        const deltas = backwardPropagate(activations, data.output);
        updateWeights(activations, deltas, learningRate);
    }
} 