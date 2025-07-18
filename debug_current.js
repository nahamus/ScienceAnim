// Debug script to test blockchain animation
import { Blockchain } from './src/js/animations/blockchain.js';

// Create a canvas element
const canvas = document.createElement('canvas');
canvas.width = 800;
canvas.height = 600;
document.body.appendChild(canvas);

// Get the context
const ctx = canvas.getContext('2d');

// Create blockchain instance
const blockchain = new Blockchain(ctx);

// Test the blockchain
console.log('Blockchain created:', blockchain);
console.log('Initial blocks:', blockchain.blocks.length);
console.log('Initial pending transactions:', blockchain.pendingTransactions.length);

// Test mining
blockchain.startMining();
console.log('Mining started:', blockchain.isMining);

// Test difficulty change
blockchain.setDifficulty(2);
console.log('Difficulty changed to 2');

// Test speed change
blockchain.setSpeed(2.0);
console.log('Speed changed to 2.0');

// Test controls
blockchain.setShowHashes(true);
blockchain.setShowMining(true);
blockchain.setShowNetwork(true);
blockchain.setAutoMine(true);

console.log('All controls set successfully');

// Test update and render
blockchain.update(0.016); // 16ms delta time
blockchain.render();
console.log('Update and render completed');

// Test stats
const stats = blockchain.getStats();
console.log('Stats:', stats); 