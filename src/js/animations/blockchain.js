// Blockchain Animation - Enhanced with Realistic Concepts
export class Blockchain {
    constructor(ctx) {
        this.ctx = ctx;
        this.canvas = ctx.canvas;
        
        // Blockchain properties
        this.blocks = [];
        this.pendingTransactions = [];
        this.miners = [];
        this.networkNodes = [];
        this.consensus = 'proof-of-work';
        
        // Animation properties
        this.speed = 1.0;
        // Block hashes are always visible
        this.showHashes = true;
        // Network and auto mining are always enabled
        this.showNetwork = true;
        this.autoMine = true;
        
        // Enhanced visual properties - improved sizing and positioning
        this.blockWidth = 160; // Increased for better text spacing
        this.blockHeight = 110; // Increased height for better text layout
        this.blockSpacing = 40; // Increased spacing
        this.chainStartX = 40; // Pushed to the left
        this.chainStartY = 180; // Moved up for better balance
        this.maxBlocksVisible = 12;
        this.scrollOffset = 0;
        
        // Realistic mining properties
        this.difficulty = 4;
        this.targetHash = '0'.repeat(this.difficulty);
        this.currentNonce = 0;
        this.miningBlock = null;
        this.isMining = false;
        this.blockReward = 50; // Block reward in tokens
        this.transactionFee = 0.1; // Transaction fee
        
        // Dynamic difficulty adjustment
        this.targetBlockTime = 10000; // 10 seconds target
        this.difficultyAdjustmentInterval = 10; // Adjust every 10 blocks
        this.lastDifficultyAdjustment = 0;
        this.blockTimes = []; // Track block times for difficulty adjustment
        
        // Network properties - improved positioning
        this.nodeCount = 8; // More nodes for realistic network
        this.nodeRadius = 25; // Slightly larger nodes
        this.networkCenterX = 0;
        this.networkCenterY = 0;
        
        // Dynamic network properties
        this.maxNodes = 8; // Reduced for cleaner demo
        this.minNodes = 6; // Minimum number of nodes
        this.nodeJoinInterval = 10000; // Increased time between joins
        this.nodeLeaveInterval = 15000; // Increased time between leaves
        this.lastNodeJoin = 0;
        this.lastNodeLeave = 0;
        this.nodeJoinParticles = [];
        this.nodeLeaveParticles = [];
        this.nodeRedistributionTimer = 0;
        this.redistributionInterval = 2000; // Time to wait before redistributing nodes
        
        // Enhanced transaction properties
        this.transactionTypes = ['transfer', 'smart_contract', 'token_mint', 'stake'];
        this.transactionColors = {
            transfer: '#4CAF50',
            smart_contract: '#2196F3',
            token_mint: '#FF9800',
            stake: '#9C27B0'
        };
        
        // Animation state
        this.animationPhase = 'idle';
        this.phaseTime = 0;
        this.phaseDuration = 3.0;
        this.guidedMode = true;
        this.phaseSteps = ['mining_success', 'validation', 'propagation', 'consensus', 'finalization'];
        this.currentStep = 0;
        this.stepDuration = 0.2; // Reduced for faster transitions
        
        // Enhanced particles and effects
        this.miningParticles = [];
        this.validationParticles = [];
        this.networkParticles = [];
        this.propagationArrows = [];
        this.contractExecutionParticles = [];
        this.blockCreationParticles = [];
        this.hashCalculationParticles = [];
        this.consensusParticles = [];
        this.finalizationParticles = [];
        this.rewardParticles = []; // New: block reward particles
        this.rejectionParticles = []; // New: block rejection particles
        
        // Visual effects
        this.blockGlow = 0;
        this.miningGlow = 0;
        this.networkPulse = 0;
        this.chainPulse = 0; // New: chain pulse effect
        
        // Enhanced statistics
        this.totalBlocks = 0;
        this.totalTransactions = 0;
        this.totalRewards = 0;
        this.consensusTime = 0;
        this.networkHashrate = 0;
        this.averageBlockTime = 0;
        this.lastBlockTimes = []; // Track last 10 block times
        
        // Mining success tracking
        this.successfulMiner = null; // Track which miner found the block
        this.minerBlockConnection = null; // Visual connection between miner and block
        this.minerRewardDisplay = null; // Display miner's reward
        
        // Animation timing
        this.lastBlockTime = 0;
        this.blockInterval = 3000; // 3 seconds for more realistic timing
        
        // Mining cycle control
        this.isStartingMining = false; // Prevent multiple mining start attempts
        
        // Consensus tracking
        this.consensusCompleted = false;
        this.consensusDecisions = 0;
        
        this.initializeBlockchain();
        this.initializeNetwork();
        this.startGenesisBlock();
    }
    
    initializeBlockchain() {
        // Create genesis block with realistic blockchain data
        const genesisBlock = {
            index: 0,
            timestamp: Date.now(),
            transactions: [
                { 
                    id: 'genesis_1',
                    from: 'Genesis', 
                    to: 'Alice', 
                    amount: 1000, 
                    type: 'token_mint', 
                    color: '#FF9800',
                    fee: 0,
                    description: 'Initial token distribution'
                },
                { 
                    id: 'genesis_2',
                    from: 'Genesis', 
                    to: 'Bob', 
                    amount: 500, 
                    type: 'token_mint', 
                    color: '#FF9800',
                    fee: 0,
                    description: 'Initial token distribution'
                },
                { 
                    id: 'genesis_3',
                    from: 'Genesis', 
                    to: 'Charlie', 
                    amount: 250, 
                    type: 'token_mint', 
                    color: '#FF9800',
                    fee: 0,
                    description: 'Initial token distribution'
                }
            ],
            previousHash: '0000000000000000000000000000000000000000000000000000000000000000',
            hash: '',
            nonce: 0,
            merkleRoot: '',
            isGenesis: true,
            creationTime: 0,
            glowIntensity: 1.0,
            blockReward: 0, // Genesis has no reward
            totalFees: 0
        };
        
        genesisBlock.merkleRoot = this.calculateMerkleRoot(genesisBlock.transactions);
        genesisBlock.hash = this.calculateBlockHash(genesisBlock);
        
        this.blocks.push(genesisBlock);
        this.totalBlocks = 1;
        this.totalTransactions = 3;
        
        // Add realistic pending transactions
        this.addPendingTransaction('Alice', 'Bob', 50, 'transfer', 'Payment for services');
        this.addPendingTransaction('Bob', 'Charlie', 25, 'transfer', 'Coffee payment');
        this.addPendingTransaction('Alice', 'Contract', 10, 'smart_contract', 'DeFi interaction');
        this.addPendingTransaction('Charlie', 'Staking', 100, 'stake', 'Staking tokens');
        this.addPendingTransaction('Bob', 'David', 15, 'transfer', 'Lunch payment');
        
        // Initialize dynamic transaction generation
        this.lastTransactionTime = Date.now();
        this.transactionInterval = 3000; // Generate new transaction every 3 seconds
        this.transactionTypes = ['transfer', 'smart_contract', 'token_mint', 'stake', 'swap', 'liquidity'];
        this.transactionColors = {
            transfer: '#4CAF50',
            smart_contract: '#2196F3',
            token_mint: '#FF9800',
            stake: '#9C27B0',
            swap: '#E91E63',
            liquidity: '#00BCD4'
        };
        this.users = ['Alice', 'Bob', 'Charlie', 'David', 'Eve', 'Frank', 'Grace', 'Henry', 'Ivy', 'Jack'];
        this.contracts = ['DeFi_Protocol', 'DEX_Exchange', 'Lending_Pool', 'Staking_Contract', 'Yield_Farm'];
    }
    
    initializeNetwork() {
        const canvasWidth = this.ctx.canvas.width;
        const canvasHeight = this.ctx.canvas.height;
        
        this.networkCenterX = canvasWidth - 250; // Moved further from edge
        this.networkCenterY = canvasHeight - 200; // Moved down more for better spacing
        
        // Create network nodes with enhanced design
        this.networkNodes = [];
        this.nextNodeId = 1; // Track the next available node ID
        for (let i = 0; i < this.nodeCount; i++) {
            const angle = (i / this.nodeCount) * 2 * Math.PI;
            const radius = 120; // Increased radius for better spacing
            const x = this.networkCenterX + Math.cos(angle) * radius;
            const y = this.networkCenterY + Math.sin(angle) * radius;
            
            this.networkNodes.push({
                id: this.nextNodeId++,
                x: x,
                y: y,
                isMining: false,
                isValidating: false,
                lastBlock: null,
                connectionStrength: Math.random() * 0.5 + 0.5,
                color: `hsl(${i * 60}, 80%, 65%)`,
                pulseIntensity: 0,
                isActive: false
            });
        }
        
        // Create miners
        this.miners = this.networkNodes.slice(0, 3);
        this.miners.forEach(miner => {
            miner.isMining = true;
            miner.currentNonce = 0;
            miner.targetHash = this.targetHash;
            miner.isActive = true;
        });
    }
    
    startGenesisBlock() {
        setTimeout(() => {
            this.startMining();
        }, 1000); // Reduced from 3000ms
    }
    
    startGuidedBlockAddition(block) {
        this.guidedBlock = block;
        this.currentStep = 0;
        this.phaseTime = 0;
        this.animationPhase = 'mining_success';
        
        // Reset network nodes for guided mode
        this.networkNodes.forEach(node => {
            node.isValidating = false;
            node.consensusReached = false;
            node.pulseIntensity = 1.0;
            node.color = '#2196F3'; // Blue for mining success
        });
        

        
        // Add phase indicator
        this.guidedPhaseIndicator = {
            text: 'Mining Success',
            alpha: 1.0,
            pulseIntensity: 1.0,
            color: '#00FF88', // Bright green for mining success
            y: 100 // Y position
        };
        
        // Continue to next step after a delay
        setTimeout(() => this.nextGuidedStep(), 1000);
    }
    
    nextGuidedStep() {
        // Safety check - if no guided block, exit
        if (!this.guidedBlock) {
            this.animationPhase = 'idle';
            this.guidedPhaseIndicator = null;
            return;
        }
        
        this.currentStep++;
        this.phaseTime = 0;
        

        
        if (this.currentStep >= this.phaseSteps.length) {
            // Wait for consensus to complete before checking
            if (this.animationPhase === 'consensus' && !this.consensusCompleted) {
                // Consensus is still in progress, wait a bit more
                setTimeout(() => this.nextGuidedStep(), 500);
                return;
            }
            
            // Check if consensus was reached before finalizing
            const consensusNodes = this.networkNodes.filter(node => node.consensusReached);
            const consensusThreshold = this.networkNodes.length * 0.6;
            
            if (consensusNodes.length >= consensusThreshold) {
                // Consensus reached, finalize the block
                this.finalizeBlock();
            } else {
                // Consensus not reached, call finalization step to handle rejection
                this.startFinalizationStep();
            }
            return;
        }
        
        // Start the current phase
        const currentPhase = this.phaseSteps[this.currentStep - 1];
        
        switch (currentPhase) {
            case 'validation':
                this.startValidationStep();
                break;
            case 'propagation':
                this.startPropagationStep();
                break;
            case 'consensus':
                this.startConsensusStep();
                break;
            case 'finalization':
                this.startFinalizationStep();
                break;
        }
        
        // Continue to next step - use shorter duration
        setTimeout(() => this.nextGuidedStep(), 1500); // Reduced to 1.5 seconds for faster transitions
    }
    
    startValidationStep() {
        // Simulate network validation with enhanced visual effects
        this.networkNodes.forEach(node => {
            node.isValidating = true;
            node.pulseIntensity = 1.0;
            node.color = '#FF6B35'; // Orange for validation
        });
        
        // Create validation particles with distinct color
        this.createValidationParticles();
        
        // Add phase indicator
        this.guidedPhaseIndicator = {
            text: 'VALIDATION',
            color: '#FF6B35',
            alpha: 1.0,
            y: 100
        };
    }
    
    startPropagationStep() {
        // Create propagation arrows with enhanced visibility
        // this.createPropagationArrows(); // Disabled arrows
        
        // Create broadcast particles with distinct color
        this.createBroadcastParticles();
        
        // Change node colors to blue for propagation
        this.networkNodes.forEach(node => {
            node.color = '#4A90E2'; // Blue for propagation
            node.pulseIntensity = 0.8;
        });
        
        // Simulate network propagation with latency
        this.broadcastBlockWithLatency();
        
        // Add phase indicator
        this.guidedPhaseIndicator = {
            text: 'PROPAGATION',
            color: '#4A90E2',
            alpha: 1.0,
            y: 100
        };
    }
    
    startConsensusStep() {
        
        // Simulate consensus mechanism with network latency
        this.consensusCompleted = false; // Track consensus completion
        this.consensusDecisions = 0; // Track how many nodes have decided
        
        this.networkNodes.forEach((node, index) => {
            node.isValidating = false;
            node.pulseIntensity = 1.2;
            node.color = '#9C27B0'; // Purple for consensus
            
            // Simulate network latency for consensus with realistic probability
            const latency = Math.random() * 800 + 200; // 200-1000ms latency
            const consensusProbability = 0.7; // 70% chance of reaching consensus
            
            setTimeout(() => {
                // Only some nodes reach consensus (more realistic)
                if (Math.random() < consensusProbability) {
                    node.consensusReached = true;
                    node.pulseIntensity = 1.5;
                } else {
                    node.consensusReached = false;
                    node.pulseIntensity = 0.5;
                }
                
                // Track consensus completion
                this.consensusDecisions++;
                
                if (this.consensusDecisions >= this.networkNodes.length) {
                    this.consensusCompleted = true;
                }
            }, latency);
        });
        
        // Create consensus particles with distinct color
        this.createConsensusParticles();
        
        // Add phase indicator
        this.guidedPhaseIndicator = {
            text: 'CONSENSUS',
            color: '#9C27B0',
            alpha: 1.0,
            y: 100
        };
    }
    
    simulateNetworkLatency(callback, minDelay = 100, maxDelay = 1000) {
        // Simulate realistic network latency
        const latency = Math.random() * (maxDelay - minDelay) + minDelay;
        setTimeout(callback, latency);
    }
    
    broadcastBlockWithLatency() {
        // Simulate realistic network propagation with latency
        this.networkNodes.forEach((node, index) => {
            const latency = Math.random() * 700 + 100; // 100-800ms latency
            
            setTimeout(() => {
                node.receivedBlock = true;
                node.isValidating = true;
                node.pulseIntensity = 1.0;
                
                // Create propagation particles for this node
                this.createNodePropagationParticles(node);
            }, latency);
        });
    }
    
    createNodePropagationParticles(node) {
        for (let i = 0; i < 5; i++) {
            this.networkParticles.push({
                x: node.x,
                y: node.y,
                vx: (Math.random() - 0.5) * 80,
                vy: (Math.random() - 0.5) * 80,
                life: 1.5,
                maxLife: 1.5,
                color: '#4A90E2', // Blue for propagation
                size: 3
            });
        }
    }
    
    startFinalizationStep() {
        
        // Prepare for finalization with enhanced effects
        this.networkNodes.forEach(node => {
            node.pulseIntensity = 1.5;
            node.color = '#4CAF50'; // Green for finalization
        });
        
        // Validate consensus reached
        const consensusNodes = this.networkNodes.filter(node => node.consensusReached);
        const consensusThreshold = this.networkNodes.length * 0.6; // 60% consensus threshold
        
        if (consensusNodes.length >= consensusThreshold) {
            // Consensus reached, proceed with finalization
            this.createFinalizationParticles();
            
            // Add phase indicator
            this.guidedPhaseIndicator = {
                text: 'Block Finalized',
                alpha: 1.0,
                pulseIntensity: 1.0,
                color: '#4CAF50', // Green for finalization
                y: 100 // Y position
            };
            
            // Continue to next step - use shorter duration
            setTimeout(() => this.nextGuidedStep(), 1000); // Reduced to 1 second for faster finalization
        } else {
            // Consensus not reached, reject the block
            
            // Create rejection particles
            this.createRejectionParticles();
            
            // Add rejection phase indicator
            this.guidedPhaseIndicator = {
                text: 'BLOCK REJECTED',
                alpha: 1.0,
                pulseIntensity: 1.0,
                color: '#FF5722', // Red for rejection
                y: 100 // Y position
            };
            
            // Reset network nodes to default colors and states
            this.networkNodes.forEach(node => {
                node.consensusReached = false;
                node.isValidating = false;
                node.pulseIntensity = 1.0;
                node.color = '#2196F3'; // Default blue
            });
            
            // Clear guided mode state and restart mining after a delay
            setTimeout(() => {
                this.guidedBlock = null;
                this.guidedPhaseIndicator = null;
                this.animationPhase = 'idle';
                this.currentStep = 0;
                
                // Restart mining process
                this.startMining();
            }, 1000); // Reduced to 1 second for faster restart
        }
    }
    
    addNodeToNetwork() {
        if (this.networkNodes.length >= this.maxNodes) return;
        
        // Calculate optimal position for new node
        const targetPosition = this.calculateOptimalNodePosition();
        
        // Start from outside the canvas
        const startX = this.networkCenterX + Math.cos(targetPosition.angle) * 300;
        const startY = this.networkCenterY + Math.sin(targetPosition.angle) * 300;
        
        const newNode = {
            id: this.nextNodeId++,
            x: startX,
            y: startY,
            targetX: targetPosition.x,
            targetY: targetPosition.y,
            isMining: false,
            isValidating: false,
            lastBlock: null,
            connectionStrength: Math.random() * 0.5 + 0.5,
            color: `hsl(${this.networkNodes.length * 60}, 80%, 65%)`,
            pulseIntensity: 0,
            isActive: false,
            isJoining: true,
            joinProgress: 0,
            joinSpeed: 0.08
        };
        
        this.networkNodes.push(newNode);
        
        // Create join particles
        this.createNodeJoinParticles(startX, startY);
        
        // Schedule redistribution after node joins
        this.scheduleNodeRedistribution();
    }
    
    removeNodeFromNetwork() {
        if (this.networkNodes.length <= this.minNodes) return;
        
        // Find a non-mining node to remove
        const removableNodes = this.networkNodes.filter(node => !node.isMining);
        if (removableNodes.length === 0) return;
        
        const nodeToRemove = removableNodes[Math.floor(Math.random() * removableNodes.length)];
        const index = this.networkNodes.indexOf(nodeToRemove);
        
        if (index !== -1) {
            nodeToRemove.isLeaving = true;
            nodeToRemove.leaveProgress = 0;
            nodeToRemove.leaveSpeed = 0.12;
            
            // Create leave particles
            this.createNodeLeaveParticles(nodeToRemove.x, nodeToRemove.y);
            
            // Remove the node after animation
            setTimeout(() => {
                this.networkNodes.splice(index, 1);
                // Schedule redistribution after node leaves
                this.scheduleNodeRedistribution();
            }, 1000);
        }
    }
    
    createNodeJoinParticles(x, y) {
        for (let i = 0; i < 15; i++) {
            this.nodeJoinParticles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 200,
                vy: (Math.random() - 0.5) * 200,
                life: 2.0,
                maxLife: 2.0,
                color: '#4CAF50',
                size: 4
            });
        }
    }
    
    createNodeLeaveParticles(x, y) {
        for (let i = 0; i < 12; i++) {
            this.nodeLeaveParticles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 180,
                vy: (Math.random() - 0.5) * 180,
                life: 2.5,
                maxLife: 2.5,
                color: '#FF5722',
                size: 3
            });
        }
    }
    
    updateNodeJoinParticles(deltaTime) {
        this.nodeJoinParticles.forEach((particle, index) => {
            particle.life -= deltaTime;
            
            if (particle.life <= 0) {
                this.nodeJoinParticles.splice(index, 1);
                return;
            }
            
            particle.x += particle.vx * deltaTime;
            particle.y += particle.vy * deltaTime;
            particle.vy += 20 * deltaTime; // Gravity
        });
    }
    
    updateNodeLeaveParticles(deltaTime) {
        this.nodeLeaveParticles.forEach((particle, index) => {
            particle.life -= deltaTime;
            
            if (particle.life <= 0) {
                this.nodeLeaveParticles.splice(index, 1);
                return;
            }
            
            particle.x += particle.vx * deltaTime;
            particle.y += particle.vy * deltaTime;
            particle.vy += 25 * deltaTime; // Gravity
        });
    }
    
    calculateOptimalNodePosition() {
        const radius = 120;
        const nodeCount = this.networkNodes.length;
        
        // Calculate evenly spaced positions around the circle
        const angleStep = (2 * Math.PI) / this.maxNodes;
        const targetIndex = nodeCount;
        const angle = targetIndex * angleStep;
        
        const x = this.networkCenterX + Math.cos(angle) * radius;
        const y = this.networkCenterY + Math.sin(angle) * radius;
        
        return { x, y, angle };
    }
    
    scheduleNodeRedistribution() {
        // Reset redistribution timer
        this.nodeRedistributionTimer = 0;
    }
    
    redistributeNodes() {
        const radius = 120;
        const nodeCount = this.networkNodes.length;
        
        if (nodeCount === 0) return;
        
        // Calculate evenly spaced positions
        const angleStep = (2 * Math.PI) / this.maxNodes;
        
        this.networkNodes.forEach((node, index) => {
            if (!node.isJoining && !node.isLeaving) {
                const targetAngle = index * angleStep;
                const targetX = this.networkCenterX + Math.cos(targetAngle) * radius;
                const targetY = this.networkCenterY + Math.sin(targetAngle) * radius;
                
                // Smoothly move to new position
                node.targetX = targetX;
                node.targetY = targetY;
                node.isMoving = true;
                node.moveSpeed = 0.10;
                node.moveProgress = 0;
            }
        });
    }
    
    finalizeBlockDirectly(block) {
        
        // Add the block to the chain
        this.blocks.push(block);
        this.totalBlocks++;
        

        
        // Update total transactions
        this.totalTransactions += block.transactions.length;
        
        // Create celebration particles
        this.createBlockCreationParticles();
        
        // Execute smart contracts in the block
        this.executeSmartContracts(block);
        
        // Broadcast the new block to the network
        this.broadcastBlock();
        
        // Create reward particles for the successful miner
        this.createRewardParticles();
        
        // Clear the successful miner's pulsating effect
        if (this.successfulMiner) {
            this.successfulMiner.pulseIntensity = 0;
            this.successfulMiner.color = this.successfulMiner.originalColor || `hsl(${this.miners.indexOf(this.successfulMiner) * 60}, 80%, 65%)`;
        }
        this.successfulMiner = null;
        this.minerBlockConnection = null;
        this.minerRewardDisplay = null;
        

        
        // Start mining the next block after a delay
        setTimeout(() => {
            console.log(`[DIRECT BLOCK] 🔄 Starting mining for next block`);
            this.startMining();
        }, 2000);
    }
    
    finalizeBlock() {
        
        if (!this.guidedBlock) {
            return;
        }
        
        // Add the block to the chain
        this.blocks.push(this.guidedBlock);
        this.totalBlocks++;
        

        
        // Update total transactions
        this.totalTransactions += this.guidedBlock.transactions.length;
        
        // Create celebration particles
        this.createBlockCreationParticles();
        
        // Execute smart contracts in the block
        this.executeSmartContracts(this.guidedBlock);
        
        // Broadcast the new block to the network
        this.broadcastBlock();
        
        // Create reward particles for the successful miner
        this.createRewardParticles();
        
        // Clear the successful miner's pulsating effect
        if (this.successfulMiner) {
            this.successfulMiner.pulseIntensity = 0;
            this.successfulMiner.color = this.successfulMiner.originalColor || `hsl(${this.miners.indexOf(this.successfulMiner) * 60}, 80%, 65%)`;
        }
        this.successfulMiner = null;
        this.minerBlockConnection = null;
        this.minerRewardDisplay = null;
        
        // Clear guided mode state
        this.guidedBlock = null;
        this.guidedPhaseIndicator = null;
        this.animationPhase = 'idle';
        this.currentStep = 0;
        

        // Start mining the next block after a delay
        setTimeout(() => {
            this.startMining();
        }, 2000);
    }
    
    generateNewTransactions() {
        const currentTime = Date.now();
        
        // Generate new transactions periodically
        if (currentTime - this.lastTransactionTime > this.transactionInterval) {
            // Generate 1-4 transactions at a time (more dynamic)
            const numTransactions = Math.floor(Math.random() * 4) + 1;
            
            for (let i = 0; i < numTransactions; i++) {
                const randomTx = this.generateRandomTransaction();
                this.addPendingTransaction(
                    randomTx.from,
                    randomTx.to,
                    randomTx.amount,
                    randomTx.type,
                    randomTx.description,
                    randomTx.fee
                );
            }
            
            this.lastTransactionTime = currentTime;
            
            // More dynamic interval (1.5-3.5 seconds)
            this.transactionInterval = 1500 + Math.random() * 2000;
        }
        
        // Remove expired transactions (simulate real mempool behavior)
        this.pendingTransactions = this.pendingTransactions.filter(tx => {
            const age = currentTime - tx.timestamp;
            // Remove transactions older than 30 seconds (simplified)
            return age < 30000;
        });
        
        // Add some random transaction failures (realistic)
        if (Math.random() < 0.1 && this.pendingTransactions.length > 0) {
            // Randomly remove a low-fee transaction (simulate rejection)
            const lowFeeIndex = this.pendingTransactions.findIndex(tx => tx.fee < this.transactionFee * 0.5);
            if (lowFeeIndex > -1) {
                this.pendingTransactions.splice(lowFeeIndex, 1);
            }
        }
    }
    
    generateRandomTransaction() {
        const type = this.transactionTypes[Math.floor(Math.random() * this.transactionTypes.length)];
        let from, to, amount, description;
        
        switch (type) {
            case 'transfer':
                from = this.users[Math.floor(Math.random() * this.users.length)];
                to = this.users[Math.floor(Math.random() * this.users.length)];
                while (to === from) {
                    to = this.users[Math.floor(Math.random() * this.users.length)];
                }
                amount = Math.floor(Math.random() * 200) + 5; // 5-205 tokens
                description = this.getRandomTransferDescription();
                break;
                
            case 'smart_contract':
                from = this.users[Math.floor(Math.random() * this.users.length)];
                to = this.contracts[Math.floor(Math.random() * this.contracts.length)];
                amount = Math.floor(Math.random() * 50) + 1; // 1-51 tokens
                description = this.getRandomContractDescription();
                break;
                
            case 'token_mint':
                from = 'System';
                to = this.users[Math.floor(Math.random() * this.users.length)];
                amount = Math.floor(Math.random() * 100) + 10; // 10-110 tokens
                description = 'Token minting';
                break;
                
            case 'stake':
                from = this.users[Math.floor(Math.random() * this.users.length)];
                to = 'Staking_Contract';
                amount = Math.floor(Math.random() * 150) + 20; // 20-170 tokens
                description = 'Staking tokens for rewards';
                break;
                
            case 'swap':
                from = this.users[Math.floor(Math.random() * this.users.length)];
                to = 'DEX_Exchange';
                amount = Math.floor(Math.random() * 80) + 5; // 5-85 tokens
                description = 'Token swap on DEX';
                break;
                
            case 'liquidity':
                from = this.users[Math.floor(Math.random() * this.users.length)];
                to = 'Liquidity_Pool';
                amount = Math.floor(Math.random() * 120) + 15; // 15-135 tokens
                description = 'Adding liquidity to pool';
                break;
        }
        
        // Dynamic fee based on transaction type and amount
        let fee = this.transactionFee;
        if (type === 'smart_contract' || type === 'swap') {
            fee = this.transactionFee * 2; // Higher fees for complex transactions
        } else if (type === 'liquidity') {
            fee = this.transactionFee * 1.5; // Medium fees for liquidity operations
        }
        
        return { from, to, amount, type, description, fee };
    }
    
    getRandomTransferDescription() {
        const descriptions = [
            'Payment for services',
            'Coffee payment',
            'Lunch payment',
            'Rent payment',
            'Grocery payment',
            'Gas payment',
            'Movie tickets',
            'Restaurant bill',
            'Shopping payment',
            'Transportation fee'
        ];
        return descriptions[Math.floor(Math.random() * descriptions.length)];
    }
    
    getRandomContractDescription() {
        const descriptions = [
            'DeFi interaction',
            'Yield farming',
            'Lending operation',
            'Borrowing funds',
            'Collateral deposit',
            'Interest payment',
            'Protocol interaction',
            'Smart contract call',
            'Automated trading',
            'Liquidation protection'
        ];
        return descriptions[Math.floor(Math.random() * descriptions.length)];
    }
    
    addPendingTransaction(from, to, amount, type, description = '', fee = null) {
        // Validate transaction before adding
        const tx = {
            id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            from: from,
            to: to,
            amount: amount,
            type: type,
            color: this.transactionColors[type] || '#4CAF50',
            fee: fee || this.transactionFee,
            description: description,
            timestamp: Date.now()
        };
        
        // Validate transaction
        if (!this.validateTransaction(tx)) {
            return false;
        }
        
        // Check mempool size (simplified)
        if (this.pendingTransactions.length >= 100) {
            // Remove lowest fee transaction if mempool is full
            this.pendingTransactions.sort((a, b) => b.fee - a.fee);
            this.pendingTransactions.pop();
        }
        
        this.pendingTransactions.push(tx);
        this.totalTransactions++;
        
        return true;
    }
    
    selectTransactionsForBlock() {
        // Select transactions based on fee priority (realistic)
        const sortedTransactions = [...this.pendingTransactions].sort((a, b) => b.fee - a.fee);
        
        // Dynamic block size based on transaction count (3-6 transactions)
        const maxTransactions = Math.min(6, Math.max(3, Math.floor(this.pendingTransactions.length / 2)));
        let selectedTransactions = sortedTransactions.slice(0, maxTransactions);
        
        // If no pending transactions, create a default transaction to keep mining active
        if (selectedTransactions.length === 0) {
            selectedTransactions = [{
                id: `default_${Date.now()}`,
                from: 'System',
                to: 'Miner',
                amount: 0,
                type: 'transfer',
                color: '#9E9E9E',
                fee: 0,
                description: 'Empty block reward'
            }];
        }
        
        // Remove selected transactions from pending pool
        selectedTransactions.forEach(tx => {
            const index = this.pendingTransactions.indexOf(tx);
            if (index > -1) {
                this.pendingTransactions.splice(index, 1);
            }
        });
        
        return selectedTransactions;
    }
    
    calculateMerkleRoot(transactions) {
        if (transactions.length === 0) return '';
        
        let hashes = transactions.map(tx => this.hashString(JSON.stringify(tx)));
        
        while (hashes.length > 1) {
            const newHashes = [];
            for (let i = 0; i < hashes.length; i += 2) {
                const left = hashes[i];
                const right = i + 1 < hashes.length ? hashes[i + 1] : left;
                newHashes.push(this.hashString(left + right));
            }
            hashes = newHashes;
        }
        
        return hashes[0];
    }
    
    calculateBlockHash(block) {
        const blockString = JSON.stringify({
            index: block.index,
            timestamp: block.timestamp,
            transactions: block.transactions,
            previousHash: block.previousHash,
            merkleRoot: block.merkleRoot,
            nonce: block.nonce
        });
        
        return this.hashString(blockString);
    }
    
    hashString(str) {
        // Improved hash function that's more realistic
        let hash = 0;
        const prime = 31;
        const mod = 1e9 + 7;
        
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash * prime) % mod + char) % mod;
        }
        
        // Convert to hex and ensure consistent length
        const hexHash = Math.abs(hash).toString(16).padStart(8, '0');
        return hexHash.repeat(8); // 64-character hash
    }
    
    validateBlock(block) {
        // Validate block structure and content
        if (!block || typeof block.index !== 'number') {
            return false;
        }
        if (!block.transactions || !Array.isArray(block.transactions)) {
            return false;
        }
        if (!block.previousHash || typeof block.previousHash !== 'string') {
            return false;
        }
        if (typeof block.nonce !== 'number') {
            return false;
        }
        
        // Validate block index
        if (block.index !== this.blocks.length) {
            return false;
        }
        
        // Validate previous hash (except for genesis)
        if (block.index > 0) {
            const lastBlock = this.blocks[this.blocks.length - 1];
            if (block.previousHash !== lastBlock.hash) {
                return false;
            }
        }
        
        // Allow empty blocks (remove transaction length validation)
        // if (block.transactions.length === 0) return false;
        
        // Validate block size (simplified)
        const blockSize = JSON.stringify(block).length;
        if (blockSize > 1000000) {
            return false;
        }
        
        // Validate hash
        const calculatedHash = this.calculateBlockHash(block);
        if (block.hash !== calculatedHash) {
            return false;
        }
        
        return true;
    }
    
    validateTransaction(tx) {
        // Validate transaction structure
        if (!tx || typeof tx.id !== 'string') return false;
        if (!tx.from || !tx.to || typeof tx.amount !== 'number') return false;
        if (tx.amount <= 0) return false;
        if (typeof tx.fee !== 'number' || tx.fee < 0) return false;
        
        // Check for double spending (simplified)
        const existingTx = this.pendingTransactions.find(t => t.id === tx.id);
        if (existingTx) return false;
        
        return true;
    }
    
    startMining() {
        if (this.isMining || this.guidedBlock || this.isStartingMining) {
            return;
        }
        
        this.isStartingMining = true;
        this.isMining = true;
        this.animationPhase = 'mining';
        this.phaseTime = 0;
        this.miningGlow = 1.0;
        
        // Create new block with realistic data
        const lastBlock = this.blocks[this.blocks.length - 1];
        const selectedTransactions = this.selectTransactionsForBlock(); // Select transactions based on fee priority
        
        // Calculate total fees from selected transactions
        const totalFees = selectedTransactions.reduce((sum, tx) => sum + tx.fee, 0);
        
        const newBlock = {
            index: lastBlock.index + 1,
            timestamp: Date.now(),
            transactions: selectedTransactions,
            previousHash: lastBlock.hash,
            hash: '',
            nonce: 0,
            merkleRoot: '',
            isGenesis: false,
            creationTime: 0,
            glowIntensity: 0,
            blockReward: this.blockReward, // Block reward for miner
            totalFees: totalFees // Total transaction fees
        };
        
        newBlock.merkleRoot = this.calculateMerkleRoot(newBlock.transactions);
        this.miningBlock = newBlock;
        
        // Start mining on all miners with different starting nonces
        this.miners.forEach((miner, index) => {
            miner.currentNonce = Math.floor(Math.random() * 1000) + (index * 1000);
            miner.isMining = true;
            miner.pulseIntensity = 1.0;
            miner.lastHashRate = 0;
        });
        
        // Create mining start particles
        this.createMiningStartParticles();
        
        // Reset the flag after a short delay to allow the mining cycle to start
        setTimeout(() => {
            this.isStartingMining = false;
        }, 100);
    }
    
    adjustDifficulty() {
        // Adjust difficulty based on recent block times
        if (this.blocks.length % this.difficultyAdjustmentInterval !== 0) return;
        
        if (this.blockTimes.length < this.difficultyAdjustmentInterval) return;
        
        const averageBlockTime = this.blockTimes.reduce((sum, time) => sum + time, 0) / this.blockTimes.length;
        const timeRatio = averageBlockTime / this.targetBlockTime;
        
        // Adjust difficulty based on time ratio
        if (timeRatio > 1.2) {
            // Blocks are taking too long, decrease difficulty
            this.difficulty = Math.max(1, this.difficulty - 1);
        } else if (timeRatio < 0.8) {
            // Blocks are too fast, increase difficulty
            this.difficulty = Math.min(8, this.difficulty + 1);
        }
        
        // Update target hash
        this.targetHash = '0'.repeat(this.difficulty);
        
        // Clear block times for next adjustment
        this.blockTimes = [];
        

    }
    
    mineBlock() {
        if (!this.isMining || !this.miningBlock || this.guidedBlock) {
            return;
        }
        
        // Ensure mining block index is current
        const expectedIndex = this.blocks.length;
        if (this.miningBlock.index !== expectedIndex) {
            
            // Create a fresh mining block with correct index and previous hash
            const lastBlock = this.blocks[this.blocks.length - 1];
            const selectedTransactions = this.selectTransactionsForBlock();
            const totalFees = selectedTransactions.reduce((sum, tx) => sum + tx.fee, 0);
            
            this.miningBlock = {
                index: expectedIndex,
                timestamp: Date.now(),
                transactions: selectedTransactions,
                previousHash: lastBlock.hash,
                hash: '',
                nonce: 0,
                merkleRoot: this.calculateMerkleRoot(selectedTransactions),
                isGenesis: false,
                creationTime: 0,
                glowIntensity: 0,
                blockReward: this.blockReward,
                totalFees: totalFees
            };
            

        }
        
        // Use dynamic difficulty
        const targetHash = '0'.repeat(this.difficulty);
        
        // Calculate mining speed based on difficulty and animation speed
        const baseNoncesPerFrame = 500; // Increased from 200 to 500 for faster mining
        const difficultyMultiplier = Math.max(0.1, (9 - this.difficulty) * 0.8); // Increased multiplier for faster mining
        const speedMultiplier = this.speed;
        const noncesToTry = Math.max(50, Math.floor(baseNoncesPerFrame * difficultyMultiplier * speedMultiplier));
        
        // Update network hashrate
        this.networkHashrate = this.miners.length * noncesToTry * 60; // H/s
        
        for (let i = 0; i < noncesToTry; i++) {
            this.miningBlock.nonce++;
            this.miningBlock.hash = this.calculateBlockHash(this.miningBlock);
            
            // Check if hash meets difficulty requirement
            if (this.miningBlock.hash.startsWith(targetHash)) {
                // Validate the block before accepting it
                if (!this.validateBlock(this.miningBlock)) {
                    return;
                }
                
                // Determine which miner found the block (simplified)
                const successfulMinerIndex = Math.floor(Math.random() * this.miners.length);
                this.successfulMiner = this.miners[successfulMinerIndex];
                
                // Store original color for restoration
                if (!this.successfulMiner.originalColor) {
                    this.successfulMiner.originalColor = this.successfulMiner.color;
                }
                
                // Create beaming/bouncing effect around successful miner (no arrow)
                this.successfulMiner.pulseIntensity = 2.0;
                this.successfulMiner.color = '#00FF88'; // Bright green for success
                
                // Block mined successfully
                this.miningBlock.creationTime = Date.now();
                this.miningBlock.glowIntensity = 1.0;
                
                // Record block time for difficulty adjustment
                const blockTime = this.miningBlock.creationTime - this.lastBlockTime;
                this.blockTimes.push(blockTime);
                this.lastBlockTime = this.miningBlock.creationTime;
                
                // Adjust difficulty if needed
                this.adjustDifficulty();
                
                // Enable guided mode for all difficulty levels
                // Start guided step-by-step process
                this.startGuidedBlockAddition(this.miningBlock);
                
                return; // Exit the loop since we found a valid hash
            }
        }
    }
    
    createMinerBlockConnection() {
        if (!this.successfulMiner || !this.miningBlock) return;
        
        // Calculate block position
        const totalBlocks = this.blocks.length;
        let blockX;
        
        if (totalBlocks <= 4) {
            const visibleIndex = totalBlocks;
            blockX = this.chainStartX + visibleIndex * (this.blockWidth + this.blockSpacing) + this.blockWidth / 2;
        } else {
            const visibleBlocks = [this.blocks[0], this.blocks[1], ...this.blocks.slice(-2)];
            const visibleIndex = visibleBlocks.length;
            blockX = this.chainStartX + visibleIndex * (this.blockWidth + this.blockSpacing) + this.blockWidth / 2;
            
            if (totalBlocks > 4) {
                blockX += 80;
            }
        }
        
        const blockY = this.chainStartY + this.blockHeight / 2;
        
        // Create connection between miner and block
        this.minerBlockConnection = {
            startX: this.successfulMiner.x,
            startY: this.successfulMiner.y,
            endX: blockX,
            endY: blockY,
            progress: 0,
            speed: 0.02,
            color: '#00FF88', // Bright green for success - better visibility
            width: 3,
            alpha: 1.0,
            pulseIntensity: 1.0
        };
        
        // Create reward display
        this.minerRewardDisplay = {
            x: this.successfulMiner.x,
            y: this.successfulMiner.y - 40,
            text: `+${this.blockReward + this.miningBlock.totalFees} tokens`,
            color: '#1E3A8A', // Dark blue for better visibility on white background
            alpha: 1.0,
            life: 3.0,
            maxLife: 3.0,
            velocity: -30 // Move upward
        };
    }
    
    createMiningStartParticles() {
        this.miners.forEach(miner => {
            for (let i = 0; i < 8; i++) {
                this.miningParticles.push({
                    x: miner.x,
                    y: miner.y,
                    vx: (Math.random() - 0.5) * 80,
                    vy: (Math.random() - 0.5) * 80,
                    life: 2.0,
                    maxLife: 2.0,
                    color: '#FF9800',
                    size: 3,
                    type: 'mining_start'
                });
            }
        });
    }
    
    createBlockCreationParticles() {
        const lastBlock = this.blocks[this.blocks.length - 1];
        // Calculate position based on new block layout
        const totalBlocks = this.blocks.length;
        let blockX;
        
        if (totalBlocks <= 4) {
            // If 4 or fewer blocks, position based on actual index
            const visibleIndex = totalBlocks - 1;
            blockX = this.chainStartX + visibleIndex * (this.blockWidth + this.blockSpacing) + this.blockWidth / 2;
        } else {
            // For the last two blocks, position at the end of the visible chain
            const visibleBlocks = [this.blocks[0], this.blocks[1], ...this.blocks.slice(-2)];
            const visibleIndex = visibleBlocks.length - 1;
            blockX = this.chainStartX + visibleIndex * (this.blockWidth + this.blockSpacing) + this.blockWidth / 2;
            
            // Add extra space for ellipses if there are more than 4 blocks
            if (totalBlocks > 4) {
                blockX += 80; // Updated space for ellipses
            }
        }
        
        const blockY = this.chainStartY + this.blockHeight / 2;
        
        for (let i = 0; i < 20; i++) {
            this.blockCreationParticles.push({
                x: blockX,
                y: blockY,
                vx: (Math.random() - 0.5) * 150,
                vy: (Math.random() - 0.5) * 150,
                life: 3.0,
                maxLife: 3.0,
                color: '#4CAF50',
                size: 4,
                type: 'block_creation'
            });
        }
    }
    
    broadcastBlock() {
        // Simulate network broadcast
        this.networkNodes.forEach(node => {
            node.isValidating = true;
            node.lastBlock = this.blocks[this.blocks.length - 1];
            node.pulseIntensity = 1.0;
        });
        
        // Create animated propagation arrows
        // this.createPropagationArrows(); // Disabled arrows
        
        // Create broadcast particles
        this.createBroadcastParticles();
    }
    
    createPropagationArrows() {
        const lastBlock = this.blocks[this.blocks.length - 1];
        // Calculate position based on new block layout
        const totalBlocks = this.blocks.length;
        let blockX;
        
        if (totalBlocks <= 4) {
            // If 4 or fewer blocks, position based on actual index
            const visibleIndex = totalBlocks - 1;
            blockX = this.chainStartX + visibleIndex * (this.blockWidth + this.blockSpacing) + this.blockWidth / 2;
        } else {
            // For the last two blocks, position at the end of the visible chain
            const visibleBlocks = [this.blocks[0], this.blocks[1], ...this.blocks.slice(-2)];
            const visibleIndex = visibleBlocks.length - 1;
            blockX = this.chainStartX + visibleIndex * (this.blockWidth + this.blockSpacing) + this.blockWidth / 2;
            
            // Add extra space for ellipses if there are more than 4 blocks
            if (totalBlocks > 4) {
                blockX += 80; // Updated space for ellipses
            }
        }
        
        const blockY = this.chainStartY + this.blockHeight / 2;
        
        this.networkNodes.forEach(node => {
            this.propagationArrows.push({
                startX: blockX,
                startY: blockY,
                endX: node.x,
                endY: node.y,
                progress: 0,
                speed: 0.03,
                color: '#4CAF50',
                width: 4,
                alpha: 1.0
            });
        });
    }
    
    createBroadcastParticles() {
        this.networkNodes.forEach(node => {
            for (let i = 0; i < 8; i++) {
                this.networkParticles.push({
                    x: node.x,
                    y: node.y,
                    vx: (Math.random() - 0.5) * 100,
                    vy: (Math.random() - 0.5) * 100,
                    life: 1.8,
                    maxLife: 1.8,
                    color: '#4A90E2', // Blue for propagation
                    size: 3
                });
            }
        });
    }
    
    updateNetworkParticles(deltaTime) {
        this.networkParticles.forEach((particle, index) => {
            particle.life -= deltaTime;
            
            if (particle.life <= 0) {
                this.networkParticles.splice(index, 1);
                return;
            }
            
            // Move towards target
            const dx = particle.targetX - particle.x;
            const dy = particle.targetY - particle.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 1) {
                particle.vx = (dx / distance) * 120;
                particle.vy = (dy / distance) * 120;
            }
            
            particle.x += particle.vx * deltaTime;
            particle.y += particle.vy * deltaTime;
        });
    }
    
    createMiningParticles() {
        if (!this.isMining) return;
        
        // Adjust particle creation rate based on speed
        const particleRate = 0.4 * this.speed;
        
        this.miners.forEach(miner => {
            if (Math.random() < particleRate) {
                this.miningParticles.push({
                    x: miner.x,
                    y: miner.y,
                    vx: (Math.random() - 0.5) * 60,
                    vy: (Math.random() - 0.5) * 60,
                    life: 1.5,
                    maxLife: 1.5,
                    color: '#FF9800',
                    size: 3,
                    type: 'mining'
                });
            }
        });
    }
    
    createMiningSuccessParticles() {
        this.miners.forEach(miner => {
            for (let i = 0; i < 12; i++) {
                this.miningParticles.push({
                    x: miner.x,
                    y: miner.y,
                    vx: (Math.random() - 0.5) * 250,
                    vy: (Math.random() - 0.5) * 250,
                    life: 4.0,
                    maxLife: 4.0,
                    color: '#4CAF50',
                    size: 5,
                    type: 'success'
                });
            }
        });
    }
    
    executeSmartContracts(block) {
        block.transactions.forEach(tx => {
            if (tx.type === 'smart_contract') {
                this.createSmartContractExecution(tx);
            }
        });
    }
    
    createSmartContractExecution(tx) {
        // Calculate position based on new block layout
        const totalBlocks = this.blocks.length;
        let contractX;
        
        if (totalBlocks <= 4) {
            // If 4 or fewer blocks, position based on actual index
            const visibleIndex = totalBlocks - 1;
            contractX = this.chainStartX + visibleIndex * (this.blockWidth + this.blockSpacing) + this.blockWidth / 2;
        } else {
            // For the last two blocks, position at the end of the visible chain
            const visibleBlocks = [this.blocks[0], this.blocks[1], ...this.blocks.slice(-2)];
            const visibleIndex = visibleBlocks.length - 1;
            contractX = this.chainStartX + visibleIndex * (this.blockWidth + this.blockSpacing) + this.blockWidth / 2;
            
            // Add extra space for ellipses if there are more than 4 blocks
            if (totalBlocks > 4) {
                contractX += 80; // Updated space for ellipses
            }
        }
        
        const contractY = this.chainStartY + this.blockHeight / 2;
        
        for (let i = 0; i < 15; i++) {
            this.contractExecutionParticles.push({
                x: contractX,
                y: contractY,
                vx: (Math.random() - 0.5) * 140,
                vy: (Math.random() - 0.5) * 140,
                life: 2.5,
                maxLife: 2.5,
                color: '#2196F3',
                size: 4
            });
        }
    }
    
    createValidationParticles() {
        this.networkNodes.forEach(node => {
            for (let i = 0; i < 10; i++) {
                this.validationParticles.push({
                    x: node.x,
                    y: node.y,
                    vx: (Math.random() - 0.5) * 150,
                    vy: (Math.random() - 0.5) * 150,
                    life: 2.0,
                    maxLife: 2.0,
                    color: '#FF6B35', // Orange for validation
                    size: 4
                });
            }
        });
    }
    
    createConsensusParticles() {
        this.networkNodes.forEach(node => {
            for (let i = 0; i < 12; i++) {
                this.consensusParticles.push({
                    x: node.x,
                    y: node.y,
                    vx: (Math.random() - 0.5) * 120,
                    vy: (Math.random() - 0.5) * 120,
                    life: 2.5,
                    maxLife: 2.5,
                    color: '#9C27B0', // Purple for consensus
                    size: 5
                });
            }
        });
    }
    
    createFinalizationParticles() {
        // Create finalization particles around the last block
        const lastBlock = this.blocks[this.blocks.length - 1];
        const totalBlocks = this.blocks.length;
        let blockX;
        
        if (totalBlocks <= 4) {
            const visibleIndex = totalBlocks - 1;
            blockX = this.chainStartX + visibleIndex * (this.blockWidth + this.blockSpacing) + this.blockWidth / 2;
        } else {
            const visibleBlocks = [this.blocks[0], this.blocks[1], ...this.blocks.slice(-2)];
            const visibleIndex = visibleBlocks.length - 1;
            blockX = this.chainStartX + visibleIndex * (this.blockWidth + this.blockSpacing) + this.blockWidth / 2;
            
            if (totalBlocks > 4) {
                blockX += 80;
            }
        }
        
        const blockY = this.chainStartY + this.blockHeight / 2;
        
        for (let i = 0; i < 15; i++) {
            this.finalizationParticles.push({
                x: blockX,
                y: blockY,
                vx: (Math.random() - 0.5) * 120,
                vy: (Math.random() - 0.5) * 120,
                life: 2.5,
                maxLife: 2.5,
                color: '#4CAF50',
                size: 3
            });
        }
    }
    
    createRewardParticles() {
        // Create reward particles around the last block
        const lastBlock = this.blocks[this.blocks.length - 1];
        const totalBlocks = this.blocks.length;
        let blockX;
        
        if (totalBlocks <= 4) {
            const visibleIndex = totalBlocks - 1;
            blockX = this.chainStartX + visibleIndex * (this.blockWidth + this.blockSpacing) + this.blockWidth / 2;
        } else {
            const visibleBlocks = [this.blocks[0], this.blocks[1], ...this.blocks.slice(-2)];
            const visibleIndex = visibleBlocks.length - 1;
            blockX = this.chainStartX + visibleIndex * (this.blockWidth + this.blockSpacing) + this.blockWidth / 2;
            
            if (totalBlocks > 4) {
                blockX += 80;
            }
        }
        
        const blockY = this.chainStartY + this.blockHeight / 2;
        
        for (let i = 0; i < 12; i++) {
            this.rewardParticles.push({
                x: blockX,
                y: blockY,
                vx: (Math.random() - 0.5) * 100,
                vy: (Math.random() - 0.5) * 100,
                life: 3.0,
                maxLife: 3.0,
                color: '#FFD700', // Gold color for rewards
                size: 4
            });
        }
    }
    
    updateMiningParticles(deltaTime) {
        this.miningParticles.forEach((particle, index) => {
            particle.life -= deltaTime;
            
            if (particle.life <= 0) {
                this.miningParticles.splice(index, 1);
                return;
            }
            
            particle.x += particle.vx * deltaTime;
            particle.y += particle.vy * deltaTime;
            particle.vy += 25 * deltaTime; // Gravity
        });
    }
    
    updateBlockCreationParticles(deltaTime) {
        this.blockCreationParticles.forEach((particle, index) => {
            particle.life -= deltaTime;
            
            if (particle.life <= 0) {
                this.blockCreationParticles.splice(index, 1);
                return;
            }
            
            particle.x += particle.vx * deltaTime;
            particle.y += particle.vy * deltaTime;
            particle.vy += 30 * deltaTime;
        });
    }
    
    updateContractExecutionParticles(deltaTime) {
        this.contractExecutionParticles.forEach((particle, index) => {
            particle.life -= deltaTime;
            
            if (particle.life <= 0) {
                this.contractExecutionParticles.splice(index, 1);
                return;
            }
            
            particle.x += particle.vx * deltaTime;
            particle.y += particle.vy * deltaTime;
            particle.vy += 30 * deltaTime;
        });
    }
    
    updatePropagationArrows(deltaTime) {
        this.propagationArrows.forEach((arrow, index) => {
            arrow.progress += arrow.speed;
            
            if (arrow.progress >= 1) {
                this.propagationArrows.splice(index, 1);
                return;
            }
        });
    }
    
    updateValidationParticles(deltaTime) {
        this.validationParticles.forEach((particle, index) => {
            particle.life -= deltaTime;
            
            if (particle.life <= 0) {
                this.validationParticles.splice(index, 1);
                return;
            }
            
            particle.x += particle.vx * deltaTime;
            particle.y += particle.vy * deltaTime;
            particle.vy += 20 * deltaTime; // Gravity
        });
    }
    
    updateConsensusParticles(deltaTime) {
        this.consensusParticles.forEach((particle, index) => {
            particle.life -= deltaTime;
            
            if (particle.life <= 0) {
                this.consensusParticles.splice(index, 1);
                return;
            }
            
            particle.x += particle.vx * deltaTime;
            particle.y += particle.vy * deltaTime;
            particle.vy += 25 * deltaTime; // Gravity
        });
    }
    
    updateFinalizationParticles(deltaTime) {
        this.finalizationParticles.forEach((particle, index) => {
            particle.life -= deltaTime;
            
            if (particle.life <= 0) {
                this.finalizationParticles.splice(index, 1);
                return;
            }
            
            particle.x += particle.vx * deltaTime;
            particle.y += particle.vy * deltaTime;
            particle.vy += 30 * deltaTime; // Gravity
        });
    }
    
    updateRewardParticles(deltaTime) {
        this.rewardParticles.forEach((particle, index) => {
            particle.life -= deltaTime;
            
            if (particle.life <= 0) {
                this.rewardParticles.splice(index, 1);
                return;
            }
            
            particle.x += particle.vx * deltaTime;
            particle.y += particle.vy * deltaTime;
            particle.vy += 30 * deltaTime; // Gravity
        });
    }
    
    updateRejectionParticles(deltaTime) {
        this.rejectionParticles.forEach((particle, index) => {
            particle.life -= deltaTime;
            
            if (particle.life <= 0) {
                this.rejectionParticles.splice(index, 1);
                return;
            }
            
            particle.x += particle.vx * deltaTime;
            particle.y += particle.vy * deltaTime;
            particle.vy += 40 * deltaTime; // Stronger gravity for rejection
        });
    }
    
    setSpeed(speed) {
        this.speed = speed;
    }
    

    

    

    
    setDifficulty(difficulty) {
        this.difficulty = difficulty;
        this.targetHash = '0'.repeat(this.difficulty);
        
        // Update all miners with new difficulty
        this.miners.forEach(miner => {
            miner.targetHash = this.targetHash;
        });
        
        // If currently mining, update the mining block target
        if (this.miningBlock) {
            this.miningBlock.hash = this.calculateBlockHash(this.miningBlock);
        }
    }
    
    update(deltaTime) {
        // Store original deltaTime for animations
        const animationDeltaTime = deltaTime;
        
        // Apply speed only to mining-related operations
        const miningDeltaTime = deltaTime * this.speed;
        
        // Update animation phase (use original deltaTime for consistent animations)
        this.phaseTime += animationDeltaTime;
        
        // Update visual effects (use original deltaTime for consistent animations)
        this.blockGlow = Math.max(0, this.blockGlow - animationDeltaTime * 2);
        this.miningGlow = Math.max(0, this.miningGlow - animationDeltaTime * 1.5);
        this.networkPulse = (this.networkPulse + animationDeltaTime * 3) % (2 * Math.PI);
        
        // Update dynamic network nodes (use original deltaTime for consistent movement)
        this.updateDynamicNodes(animationDeltaTime);
        
        // Mine block if mining (use mining deltaTime for speed control)
        if (this.isMining && this.miningBlock) {
            this.mineBlock();
        }
        
        // Update all particle types (use original deltaTime for consistent animations)
        this.updateMiningParticles(animationDeltaTime);
        this.updateNetworkParticles(animationDeltaTime);
        this.updateContractExecutionParticles(animationDeltaTime);
        this.updateBlockCreationParticles(animationDeltaTime);
        // this.updatePropagationArrows(animationDeltaTime); // Disabled arrows
        this.updateValidationParticles(animationDeltaTime);
        this.updateConsensusParticles(animationDeltaTime);
        this.updateFinalizationParticles(animationDeltaTime);
        this.updateRewardParticles(animationDeltaTime);
        this.updateRejectionParticles(animationDeltaTime);
        this.updateNodeJoinParticles(animationDeltaTime);
        this.updateNodeLeaveParticles(animationDeltaTime);
        
        // Create new particles
        this.createMiningParticles();
        
        // Generate new transactions periodically
        this.generateNewTransactions();
        
        // Update network validation (use original deltaTime for consistent animations)
        this.networkNodes.forEach(node => {
            if (node.isValidating && this.phaseTime > 1.5) {
                node.isValidating = false;
                node.pulseIntensity = 0;
            }
            node.pulseIntensity = Math.max(0, node.pulseIntensity - animationDeltaTime * 2);
        });
        
        // Update block glow (use original deltaTime for consistent animations)
        this.blocks.forEach(block => {
            if (block.glowIntensity > 0) {
                block.glowIntensity = Math.max(0, block.glowIntensity - animationDeltaTime * 1.5);
            }
        });
        
        // Update statistics
        // Calculate hashrate based on user difficulty, speed, and number of miners
        const baseHashrate = 1200;
        const difficultyMultiplier = Math.pow(2, this.difficulty - 1);
        const speedMultiplier = this.speed;
        const effectiveHashrate = Math.floor(baseHashrate / difficultyMultiplier * speedMultiplier);
        this.networkHashrate = this.miners.length * effectiveHashrate;
        
        // Update mining block glow if it exists (use original deltaTime for consistent animations)
        if (this.miningBlock && this.miningBlock.glowIntensity > 0) {
            this.miningBlock.glowIntensity = Math.max(0, this.miningBlock.glowIntensity - animationDeltaTime * 1.5);
        }
    }
    
    updateDynamicNodes(deltaTime) {
        const currentTime = Date.now();
        
        // Update redistribution timer
        this.nodeRedistributionTimer += deltaTime;
        
        // Check if it's time to redistribute nodes
        if (this.nodeRedistributionTimer > this.redistributionInterval) {
            this.redistributeNodes();
            this.nodeRedistributionTimer = 0;
        }
        
        // Check if it's time to add a new node
        if (currentTime - this.lastNodeJoin > this.nodeJoinInterval && this.networkNodes.length < this.maxNodes) {
            this.addNodeToNetwork();
            this.lastNodeJoin = currentTime;
        }
        
        // Check if it's time to remove a node
        if (currentTime - this.lastNodeLeave > this.nodeLeaveInterval && this.networkNodes.length > this.minNodes) {
            this.removeNodeFromNetwork();
            this.lastNodeLeave = currentTime;
        }
        
        // Update joining nodes
        this.networkNodes.forEach(node => {
            if (node.isJoining) {
                node.joinProgress += node.joinSpeed;
                
                if (node.joinProgress >= 1) {
                    node.x = node.targetX;
                    node.y = node.targetY;
                    node.isJoining = false;
                    node.isActive = true;
                } else {
                    node.x = node.x + (node.targetX - node.x) * node.joinSpeed;
                    node.y = node.y + (node.targetY - node.y) * node.joinSpeed;
                }
            }
            
            // Update leaving nodes
            if (node.isLeaving) {
                node.leaveProgress += node.leaveSpeed;
                
                if (node.leaveProgress >= 1) {
                    // Node will be removed in the timeout
                } else {
                    // Move node away from center
                    const angle = Math.atan2(node.y - this.networkCenterY, node.x - this.networkCenterX);
                    node.x += Math.cos(angle) * 5;
                    node.y += Math.sin(angle) * 5;
                }
            }
            
            // Update moving nodes (redistribution)
            if (node.isMoving) {
                node.moveProgress += node.moveSpeed;
                
                if (node.moveProgress >= 1) {
                    node.x = node.targetX;
                    node.y = node.targetY;
                    node.isMoving = false;
                } else {
                    node.x = node.x + (node.targetX - node.x) * node.moveSpeed;
                    node.y = node.y + (node.targetY - node.y) * node.moveSpeed;
                }
            }
        });
    }
    
    drawBlockchain() {
        // Calculate which blocks to show: genesis, block 1, and last block
        const totalBlocks = this.blocks.length;
        let visibleBlocks = [];
        
        if (totalBlocks <= 3) {
            // If 3 or fewer blocks, show all of them
            visibleBlocks = this.blocks;
        } else {
            // Show genesis, block 1, and last block only
            visibleBlocks = [
                this.blocks[0], // Genesis block
                this.blocks[1], // Block 1
                this.blocks[totalBlocks - 1] // Last block only
            ];
        }
        
        // Calculate background width based on visible blocks
        const visibleWidth = visibleBlocks.length * (this.blockWidth + this.blockSpacing);
        
        // Draw chain background with enhanced gradient
        const gradient = this.ctx.createLinearGradient(this.chainStartX - 40, this.chainStartY - 40, 
                                                     this.chainStartX + visibleWidth + 40, 
                                                     this.chainStartY + this.blockHeight + 40);
        gradient.addColorStop(0, 'rgba(33, 150, 243, 0.15)');
        gradient.addColorStop(0.5, 'rgba(76, 175, 80, 0.1)');
        gradient.addColorStop(1, 'rgba(33, 150, 243, 0.15)');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(this.chainStartX - 40, this.chainStartY - 40, 
                         visibleWidth + 80, 
                         this.blockHeight + 80);
        
        // Draw blocks with enhanced design
        visibleBlocks.forEach((block, visibleIndex) => {
            let x = this.chainStartX + visibleIndex * (this.blockWidth + this.blockSpacing);
            const y = this.chainStartY;
            
            // Add extra space for ellipses if this is after block 1 and there are more than 3 blocks
            if (totalBlocks > 3 && visibleIndex >= 2) {
                x += 40; // Space for ellipses
            }
            
            // Enhanced block glow effect with modern styling
            if (block.glowIntensity > 0) {
                this.ctx.shadowColor = block.isGenesis ? '#4CAF50' : '#2196F3';
                this.ctx.shadowBlur = 40 * block.glowIntensity;
                this.ctx.shadowOffsetX = 0;
                this.ctx.shadowOffsetY = 0;
            }
            
            // Modern block background with enhanced gradient and depth
            const blockGradient = this.ctx.createLinearGradient(x, y, x + this.blockWidth, y + this.blockHeight);
            if (block.isGenesis) {
                // Genesis block - special golden gradient
                blockGradient.addColorStop(0, '#FFD700');
                blockGradient.addColorStop(0.3, '#FFC107');
                blockGradient.addColorStop(0.7, '#FFB300');
                blockGradient.addColorStop(1, '#FF8F00');
            } else {
                // Regular blocks - modern blue gradient
                blockGradient.addColorStop(0, '#42A5F5');
                blockGradient.addColorStop(0.3, '#2196F3');
                blockGradient.addColorStop(0.7, '#1976D2');
                blockGradient.addColorStop(1, '#1565C0');
            }
            this.ctx.fillStyle = blockGradient;
            
            // Draw rounded rectangle for modern look
            this.roundRect(x, y, this.blockWidth, this.blockHeight, 12);
            this.ctx.fill();
            
            // Modern block border with gradient and glow
            const borderGradient = this.ctx.createLinearGradient(x, y, x + this.blockWidth, y + this.blockHeight);
            borderGradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
            borderGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.4)');
            borderGradient.addColorStop(1, 'rgba(255, 255, 255, 0.2)');
            
            this.ctx.strokeStyle = borderGradient;
            this.ctx.lineWidth = 3;
            this.ctx.lineCap = 'round';
            this.ctx.lineJoin = 'round';
            this.roundRect(x, y, this.blockWidth, this.blockHeight, 12);
            this.ctx.stroke();
            
            // Add inner highlight for depth
            const highlightGradient = this.ctx.createLinearGradient(x, y, x, y + this.blockHeight);
            highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
            highlightGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.1)');
            highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
            this.ctx.fillStyle = highlightGradient;
            this.roundRect(x + 2, y + 2, this.blockWidth - 4, this.blockHeight / 3, 10);
            this.ctx.fill();
            
            // Reset shadow
            this.ctx.shadowBlur = 0;
            
            // Modern block content with enhanced typography and styling
            this.ctx.textAlign = 'left';
            
            // Block title with modern styling
            const title = block.isGenesis ? 'Genesis' : `Block #${block.index}`;
            this.ctx.font = 'bold 20px Inter, Arial, sans-serif';
            this.ctx.fillStyle = '#ffffff';
            this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
            this.ctx.shadowBlur = 2;
            this.ctx.fillText(title, x + 12, y + 28);
            this.ctx.shadowBlur = 0;
            
            // Transaction count with icon
            this.ctx.font = 'bold 16px Inter, Arial, sans-serif';
            this.ctx.fillStyle = '#ffffff';
            this.ctx.fillText(`📦 ${block.transactions.length} tx`, x + 12, y + 48);
            
            // Nonce with modern styling
            this.ctx.font = '14px Inter, Arial, sans-serif';
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            this.ctx.fillText(`Nonce: ${block.nonce.toLocaleString()}`, x + 12, y + 65);
            
            // Show reward and fees for non-genesis blocks with better spacing
            if (!block.isGenesis) {
                this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
                this.ctx.fillText(`💰 ${block.blockReward} | 💸 ${block.totalFees.toFixed(1)}`, x + 12, y + 82);
            }
            
            // Hash with modern monospace styling
            if (this.showHashes) {
                this.ctx.font = '11px "JetBrains Mono", "Fira Code", monospace';
                this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
                this.ctx.fillText(`🔗 ${block.hash.substring(0, 12)}...`, x + 12, y + 100);
            }
            
            // Draw connection to next block with enhanced styling
            if (visibleIndex < visibleBlocks.length - 1) {
                const nextBlock = visibleBlocks[visibleIndex + 1];
                let nextX = this.chainStartX + (visibleIndex + 1) * (this.blockWidth + this.blockSpacing);
                
                // Check if we need to show ellipses instead of arrow
                const shouldShowEllipses = totalBlocks > 3 && visibleIndex === 1;
                
                if (shouldShowEllipses) {
                    // Draw ellipses instead of arrow
                    const ellipsesX = x + this.blockWidth + 20;
                    const ellipsesY = y + this.blockHeight / 2;
                    
                    // Draw ellipses with arrow color (only once)
                    this.ctx.fillStyle = '#4CAF50';
                    this.ctx.font = 'bold 28px Inter, Arial, sans-serif';
                    this.ctx.textAlign = 'center';
                    this.ctx.fillText('⋯', ellipsesX, ellipsesY + 10);
                    
                    // Show count of hidden blocks
                    const hiddenCount = totalBlocks - 3;
                    this.ctx.fillStyle = '#666666';
                    this.ctx.font = '13px Inter, Arial, sans-serif';
                    this.ctx.fillText(`+${hiddenCount} blocks`, ellipsesX + 25, ellipsesY + 30);
                    
                    // Draw connection line to the last block (skip the ellipses)
                    const lastBlockX = this.chainStartX + (visibleBlocks.length - 1) * (this.blockWidth + this.blockSpacing);
                    const connectionGradient = this.ctx.createLinearGradient(ellipsesX + 30, y + this.blockHeight / 2, 
                                                                           lastBlockX, y + this.blockHeight / 2);
                    connectionGradient.addColorStop(0, '#ffffff');
                    connectionGradient.addColorStop(0.5, '#4CAF50');
                    connectionGradient.addColorStop(1, '#ffffff');
                    
                    this.ctx.strokeStyle = connectionGradient;
                    this.ctx.lineWidth = 6;
                    this.ctx.lineCap = 'round';
                    this.ctx.beginPath();
                    this.ctx.moveTo(ellipsesX + 30, y + this.blockHeight / 2);
                    this.ctx.lineTo(lastBlockX, y + this.blockHeight / 2);
                    this.ctx.stroke();
                    
                    // Enhanced arrow to the last block
                    this.ctx.fillStyle = '#4CAF50';
                    this.ctx.beginPath();
                    this.ctx.moveTo(lastBlockX - 15, y + this.blockHeight / 2 - 8);
                    this.ctx.lineTo(lastBlockX, y + this.blockHeight / 2);
                    this.ctx.lineTo(lastBlockX - 15, y + this.blockHeight / 2 + 8);
                    this.ctx.fill();
                } else {
                    // Normal connection with arrow
                    const connectionGradient = this.ctx.createLinearGradient(x + this.blockWidth, y + this.blockHeight / 2, 
                                                                           nextX, y + this.blockHeight / 2);
                    connectionGradient.addColorStop(0, '#ffffff');
                    connectionGradient.addColorStop(0.5, '#4CAF50');
                    connectionGradient.addColorStop(1, '#ffffff');
                    
                    this.ctx.strokeStyle = connectionGradient;
                    this.ctx.lineWidth = 6;
                    this.ctx.lineCap = 'round';
                    this.ctx.beginPath();
                    this.ctx.moveTo(x + this.blockWidth, y + this.blockHeight / 2);
                    this.ctx.lineTo(nextX, y + this.blockHeight / 2);
                    this.ctx.stroke();
                    
                    // Enhanced arrow with better visibility
                    this.ctx.fillStyle = '#4CAF50';
                    this.ctx.beginPath();
                    this.ctx.moveTo(nextX - 15, y + this.blockHeight / 2 - 8);
                    this.ctx.lineTo(nextX, y + this.blockHeight / 2);
                    this.ctx.lineTo(nextX - 15, y + this.blockHeight / 2 + 8);
                    this.ctx.fill();
                }
            }
        });
        

        
        // Draw mining block with enhanced design and better positioning
        if (this.miningBlock) {
            let x = this.chainStartX + visibleBlocks.length * (this.blockWidth + this.blockSpacing);
            
            // Add gap between last block and mining block
            x += 30; // Additional gap
            
            // Ensure mining block is visible on screen
            const maxX = this.ctx.canvas.width - this.blockWidth - 50;
            if (x > maxX) {
                x = maxX;
            }
            
            const y = this.chainStartY;
            
            // Enhanced mining glow effect with pulsing animation
            if (this.miningGlow > 0) {
                this.ctx.shadowColor = '#FF9800';
                this.ctx.shadowBlur = 50 * this.miningGlow;
                this.ctx.shadowOffsetX = 0;
                this.ctx.shadowOffsetY = 0;
            }
            
            // Modern mining block background with enhanced gradient
            const miningGradient = this.ctx.createLinearGradient(x, y, x + this.blockWidth, y + this.blockHeight);
            miningGradient.addColorStop(0, '#FFB74D');
            miningGradient.addColorStop(0.3, '#FF9800');
            miningGradient.addColorStop(0.7, '#F57C00');
            miningGradient.addColorStop(1, '#E65100');
            this.ctx.fillStyle = miningGradient;
            
            // Draw rounded rectangle for mining block
            this.roundRect(x, y, this.blockWidth, this.blockHeight, 12);
            this.ctx.fill();
            
            // Mining block border with animated glow
            const miningBorderGradient = this.ctx.createLinearGradient(x, y, x + this.blockWidth, y + this.blockHeight);
            miningBorderGradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
            miningBorderGradient.addColorStop(0.5, 'rgba(255, 193, 7, 0.6)');
            miningBorderGradient.addColorStop(1, 'rgba(255, 152, 0, 0.8)');
            
            this.ctx.strokeStyle = miningBorderGradient;
            this.ctx.lineWidth = 4;
            this.ctx.lineCap = 'round';
            this.ctx.lineJoin = 'round';
            this.roundRect(x, y, this.blockWidth, this.blockHeight, 12);
            this.ctx.stroke();
            
            // Add mining-specific inner highlight
            const miningHighlightGradient = this.ctx.createLinearGradient(x, y, x, y + this.blockHeight);
            miningHighlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
            miningHighlightGradient.addColorStop(0.5, 'rgba(255, 193, 7, 0.2)');
            miningHighlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
            this.ctx.fillStyle = miningHighlightGradient;
            this.roundRect(x + 2, y + 2, this.blockWidth - 4, this.blockHeight / 3, 10);
            this.ctx.fill();
            
            // Reset shadow
            this.ctx.shadowBlur = 0;
            
            // Modern mining block content with enhanced styling
            this.ctx.textAlign = 'left';
            
            // Mining title with animated effect
            this.ctx.font = 'bold 20px Inter, Arial, sans-serif';
            this.ctx.fillStyle = '#ffffff';
            this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
            this.ctx.shadowBlur = 2;
            this.ctx.fillText('⛏️ Mining...', x + 12, y + 28);
            this.ctx.shadowBlur = 0;
            
            // Nonce with modern formatting
            this.ctx.font = 'bold 16px Inter, Arial, sans-serif';
            this.ctx.fillStyle = '#ffffff';
            this.ctx.fillText(`🔢 ${this.miningBlock.nonce.toLocaleString()}`, x + 12, y + 48);
            
            // Target hash with modern styling
            this.ctx.font = '14px Inter, Arial, sans-serif';
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            this.ctx.fillText(`🎯 ${this.targetHash}`, x + 12, y + 65);
            
            // Reward and fees with icons
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            this.ctx.fillText(`💰 ${this.blockReward} | 💸 ${this.miningBlock.totalFees.toFixed(1)}`, x + 12, y + 82);
            
            // Hash with modern monospace styling
            if (this.showHashes) {
                this.ctx.font = '11px "JetBrains Mono", "Fira Code", monospace';
                this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
                this.ctx.fillText(`🔗 ${this.miningBlock.hash.substring(0, 12)}...`, x + 12, y + 100);
            }
            
            // Modern mining progress indicator with enhanced styling
            const progress = (this.miningBlock.nonce % 100) / 100;
            
            // Progress bar background with rounded corners
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
            this.roundRect(x + 12, y + 105, 110, 10, 5);
            this.ctx.fill();
            
            // Progress bar fill with gradient
            const progressGradient = this.ctx.createLinearGradient(x + 12, y + 105, x + 12 + 110 * progress, y + 105);
            progressGradient.addColorStop(0, '#FFB74D');
            progressGradient.addColorStop(0.5, '#FF9800');
            progressGradient.addColorStop(1, '#F57C00');
            this.ctx.fillStyle = progressGradient;
            this.roundRect(x + 12, y + 105, 110 * progress, 10, 5);
            this.ctx.fill();
            
            // Progress bar border
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
            this.ctx.lineWidth = 1;
            this.roundRect(x + 12, y + 105, 110, 10, 5);
            this.ctx.stroke();
        }
    }
    
    drawNetwork() {
        if (!this.showNetwork) return;
        
        // Draw network background with enhanced gradient
        const networkGradient = this.ctx.createRadialGradient(this.networkCenterX, this.networkCenterY, 0, 
                                                             this.networkCenterX, this.networkCenterY, 180);
        networkGradient.addColorStop(0, 'rgba(33, 150, 243, 0.15)');
        networkGradient.addColorStop(0.7, 'rgba(33, 150, 243, 0.08)');
        networkGradient.addColorStop(1, 'rgba(33, 150, 243, 0.03)');
        this.ctx.fillStyle = networkGradient;
        this.ctx.fillRect(this.networkCenterX - 180, this.networkCenterY - 180, 360, 360);
        
        // Draw connections between nodes with enhanced pulse effect
        this.ctx.strokeStyle = `rgba(255, 255, 255, ${0.4 + 0.3 * Math.sin(this.networkPulse)})`;
        this.ctx.lineWidth = 3;
        this.ctx.lineCap = 'round';
        
        for (let i = 0; i < this.networkNodes.length; i++) {
            for (let j = i + 1; j < this.networkNodes.length; j++) {
                const node1 = this.networkNodes[i];
                const node2 = this.networkNodes[j];
                
                // Calculate distance for connection strength
                const dx = node2.x - node1.x;
                const dy = node2.y - node1.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                // Only draw connections between nearby nodes
                if (distance < 200) {
                    this.ctx.beginPath();
                    this.ctx.moveTo(node1.x, node1.y);
                    this.ctx.lineTo(node2.x, node2.y);
                    this.ctx.stroke();
                }
            }
        }
        
        // Draw nodes with enhanced design
        this.networkNodes.forEach(node => {
            // Skip nodes that are leaving
            if (node.isLeaving) {
                // Draw leaving node with fade effect
                this.ctx.globalAlpha = 1 - node.leaveProgress;
            }
            
            // Node pulse effect with enhanced visibility
            const pulseRadius = this.nodeRadius + 8 * node.pulseIntensity * Math.sin(this.networkPulse * 2);
            
            // Modern node background with enhanced gradient and depth
            const nodeGradient = this.ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, this.nodeRadius);
            
            // Enhanced color handling for different node types
            let primaryColor, secondaryColor;
            if (node.color.startsWith('hsl')) {
                const hslMatch = node.color.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
                if (hslMatch) {
                    const h = hslMatch[1];
                    const s = hslMatch[2];
                    const l = parseInt(hslMatch[3]);
                    primaryColor = `hsl(${h}, ${s}%, ${l}%)`;
                    secondaryColor = `hsl(${h}, ${s}%, ${Math.max(0, l - 30)}%)`;
                } else {
                    primaryColor = node.color;
                    secondaryColor = node.color;
                }
            } else {
                primaryColor = node.color;
                secondaryColor = this.adjustColor(node.color, -30);
            }
            
            nodeGradient.addColorStop(0, primaryColor);
            nodeGradient.addColorStop(0.7, secondaryColor);
            nodeGradient.addColorStop(1, this.adjustColor(secondaryColor, -20));
            
            this.ctx.fillStyle = nodeGradient;
            this.ctx.beginPath();
            this.ctx.arc(node.x, node.y, this.nodeRadius, 0, 2 * Math.PI);
            this.ctx.fill();
            
            // Modern node border with gradient
            const borderGradient = this.ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, this.nodeRadius);
            borderGradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
            borderGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.6)');
            borderGradient.addColorStop(1, 'rgba(255, 255, 255, 0.3)');
            
            this.ctx.strokeStyle = borderGradient;
            this.ctx.lineWidth = 3;
            this.ctx.lineCap = 'round';
            this.ctx.beginPath();
            this.ctx.arc(node.x, node.y, this.nodeRadius, 0, 2 * Math.PI);
            this.ctx.stroke();
            
            // Add inner highlight for depth
            const highlightGradient = this.ctx.createRadialGradient(
                node.x - this.nodeRadius * 0.3, 
                node.y - this.nodeRadius * 0.3, 
                0, 
                node.x, 
                node.y, 
                this.nodeRadius * 0.8
            );
            highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
            highlightGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.1)');
            highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
            this.ctx.fillStyle = highlightGradient;
            this.ctx.beginPath();
            this.ctx.arc(node.x, node.y, this.nodeRadius * 0.8, 0, 2 * Math.PI);
            this.ctx.fill();
            
            // Special highlighting for successful miner with enhanced styling and zoom effect
            if (node === this.successfulMiner) {
                // Create pulsing zoom effect for successful miner
                const zoomPulse = Math.sin(this.networkPulse * 2) * 0.3 + 1.0; // Pulsing between 0.7x and 1.3x
                const zoomedRadius = this.nodeRadius * zoomPulse;
                
                // Draw success glow with enhanced effect and zoom
                this.ctx.shadowColor = '#00FF88';
                this.ctx.shadowBlur = 25 * zoomPulse;
                this.ctx.fillStyle = 'rgba(0, 255, 136, 0.3)';
                this.ctx.beginPath();
                this.ctx.arc(node.x, node.y, zoomedRadius + 15, 0, 2 * Math.PI);
                this.ctx.fill();
                
                // Draw success ring with gradient and zoom
                const successGradient = this.ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, zoomedRadius + 20);
                successGradient.addColorStop(0, '#00FF88');
                successGradient.addColorStop(0.5, '#00E676');
                successGradient.addColorStop(1, '#00C853');
                
                this.ctx.strokeStyle = successGradient;
                this.ctx.lineWidth = 4 * zoomPulse;
                this.ctx.lineCap = 'round';
                this.ctx.beginPath();
                this.ctx.arc(node.x, node.y, zoomedRadius + 18, 0, 2 * Math.PI);
                this.ctx.stroke();
                
                // Draw additional pulsing rings for extra emphasis
                const ringPulse = Math.sin(this.networkPulse * 3) * 0.5 + 0.5;
                this.ctx.strokeStyle = `rgba(0, 255, 136, ${0.6 + ringPulse * 0.4})`;
                this.ctx.lineWidth = 2;
                this.ctx.beginPath();
                this.ctx.arc(node.x, node.y, zoomedRadius + 25, 0, 2 * Math.PI);
                this.ctx.stroke();
                
                this.ctx.strokeStyle = `rgba(0, 255, 136, ${0.4 + ringPulse * 0.3})`;
                this.ctx.lineWidth = 1.5;
                this.ctx.beginPath();
                this.ctx.arc(node.x, node.y, zoomedRadius + 32, 0, 2 * Math.PI);
                this.ctx.stroke();
                
                this.ctx.shadowBlur = 0;
                
                // Draw the actual node with zoom effect
                const nodeGradient = this.ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, zoomedRadius);
                
                // Enhanced color handling for successful miner
                let primaryColor, secondaryColor;
                if (node.color.startsWith('hsl')) {
                    const hslMatch = node.color.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
                    if (hslMatch) {
                        const h = hslMatch[1];
                        const s = hslMatch[2];
                        const l = parseInt(hslMatch[3]);
                        primaryColor = `hsl(${h}, ${s}%, ${l}%)`;
                        secondaryColor = `hsl(${h}, ${s}%, ${Math.max(0, l - 30)}%)`;
                    } else {
                        primaryColor = node.color;
                        secondaryColor = node.color;
                    }
                } else {
                    primaryColor = node.color;
                    secondaryColor = this.adjustColor(node.color, -30);
                }
                
                nodeGradient.addColorStop(0, primaryColor);
                nodeGradient.addColorStop(0.7, secondaryColor);
                nodeGradient.addColorStop(1, this.adjustColor(secondaryColor, -20));
                
                this.ctx.fillStyle = nodeGradient;
                this.ctx.beginPath();
                this.ctx.arc(node.x, node.y, zoomedRadius, 0, 2 * Math.PI);
                this.ctx.fill();
                
                // Modern node border with gradient and zoom
                const borderGradient = this.ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, zoomedRadius);
                borderGradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
                borderGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.6)');
                borderGradient.addColorStop(1, 'rgba(255, 255, 255, 0.3)');
                
                this.ctx.strokeStyle = borderGradient;
                this.ctx.lineWidth = 3 * zoomPulse;
                this.ctx.lineCap = 'round';
                this.ctx.beginPath();
                this.ctx.arc(node.x, node.y, zoomedRadius, 0, 2 * Math.PI);
                this.ctx.stroke();
                
                // Add inner highlight for depth with zoom
                const highlightGradient = this.ctx.createRadialGradient(
                    node.x - zoomedRadius * 0.3, 
                    node.y - zoomedRadius * 0.3, 
                    0, 
                    node.x, 
                    node.y, 
                    zoomedRadius * 0.8
                );
                highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
                highlightGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.1)');
                highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
                this.ctx.fillStyle = highlightGradient;
                this.ctx.beginPath();
                this.ctx.arc(node.x, node.y, zoomedRadius * 0.8, 0, 2 * Math.PI);
                this.ctx.fill();
                
                // Enhanced node label with zoom effect
                this.ctx.textAlign = 'center';
                this.ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
                this.ctx.shadowBlur = 2;
                this.ctx.shadowOffsetX = 1;
                this.ctx.shadowOffsetY = 1;
                
                this.ctx.fillStyle = '#ffffff';
                this.ctx.font = `${Math.floor(11 * zoomPulse)}px Inter, Arial, sans-serif`;
                this.ctx.fillText(`Node ${node.id}`, node.x, node.y + 5 * zoomPulse);
                
                this.ctx.shadowBlur = 0;
                this.ctx.shadowOffsetX = 0;
                this.ctx.shadowOffsetY = 0;
                
                // Skip the regular node drawing for successful miner since we've drawn it with zoom
                // Reset alpha for next node
                this.ctx.globalAlpha = 1;
                return; // Use return instead of continue in forEach
            }
            
            // Enhanced node status indicators with modern styling
            if (node.isMining) {
                // Mining indicator - multiple rings with enhanced pulsing effect
                const miningPulse = Math.sin(this.networkPulse * 3) * 0.5 + 0.5;
                
                // Outer mining ring with glow effect
                this.ctx.shadowColor = '#FF9800';
                this.ctx.shadowBlur = 15;
                this.ctx.strokeStyle = `rgba(255, 152, 0, ${0.9 + miningPulse * 0.1})`;
                this.ctx.lineWidth = 5;
                this.ctx.lineCap = 'round';
                this.ctx.beginPath();
                this.ctx.arc(node.x, node.y, this.nodeRadius + 18, 0, 2 * Math.PI);
                this.ctx.stroke();
                
                // Middle mining ring with enhanced visibility
                this.ctx.shadowBlur = 8;
                this.ctx.strokeStyle = `rgba(255, 235, 59, ${0.8 + miningPulse * 0.2})`;
                this.ctx.lineWidth = 4;
                this.ctx.beginPath();
                this.ctx.arc(node.x, node.y, this.nodeRadius + 14, 0, 2 * Math.PI);
                this.ctx.stroke();
                
                // Inner mining ring with bright glow
                this.ctx.shadowBlur = 12;
                this.ctx.strokeStyle = `rgba(255, 193, 7, ${0.95 + miningPulse * 0.05})`;
                this.ctx.lineWidth = 3;
                this.ctx.beginPath();
                this.ctx.arc(node.x, node.y, this.nodeRadius + 10, 0, 2 * Math.PI);
                this.ctx.stroke();
                
                // Reset shadow
                this.ctx.shadowBlur = 0;
                
                // Mining particles around the node
                for (let i = 0; i < 6; i++) {
                    const angle = (i / 6) * 2 * Math.PI + this.networkPulse * 2;
                    const radius = this.nodeRadius + 25 + Math.sin(this.networkPulse * 4 + i) * 5;
                    const particleX = node.x + Math.cos(angle) * radius;
                    const particleY = node.y + Math.sin(angle) * radius;
                    
                    this.ctx.fillStyle = `rgba(255, 152, 0, ${0.7 + Math.sin(this.networkPulse * 3 + i) * 0.3})`;
                    this.ctx.beginPath();
                    this.ctx.arc(particleX, particleY, 3, 0, 2 * Math.PI);
                    this.ctx.fill();
                }
            }
            
            if (node.isValidating) {
                // Validation indicator with glow effect
                this.ctx.shadowColor = '#4CAF50';
                this.ctx.shadowBlur = 10;
                this.ctx.strokeStyle = '#4CAF50';
                this.ctx.lineWidth = 4;
                this.ctx.lineCap = 'round';
                this.ctx.beginPath();
                this.ctx.arc(node.x, node.y, this.nodeRadius + 16, 0, 2 * Math.PI);
                this.ctx.stroke();
                this.ctx.shadowBlur = 0;
            }
            
            // Special indicator for joining nodes with enhanced styling
            if (node.isJoining) {
                this.ctx.shadowColor = '#4CAF50';
                this.ctx.shadowBlur = 12;
                this.ctx.strokeStyle = '#4CAF50';
                this.ctx.lineWidth = 5;
                this.ctx.lineCap = 'round';
                this.ctx.beginPath();
                this.ctx.arc(node.x, node.y, this.nodeRadius + 22, 0, 2 * Math.PI);
                this.ctx.stroke();
                this.ctx.shadowBlur = 0;
            }
            
            // Special indicator for moving nodes (redistribution) with enhanced styling
            if (node.isMoving) {
                this.ctx.shadowColor = '#2196F3';
                this.ctx.shadowBlur = 8;
                this.ctx.strokeStyle = '#2196F3';
                this.ctx.lineWidth = 4;
                this.ctx.lineCap = 'round';
                this.ctx.beginPath();
                this.ctx.arc(node.x, node.y, this.nodeRadius + 20, 0, 2 * Math.PI);
                this.ctx.stroke();
                this.ctx.shadowBlur = 0;
            }
            
            // Modern node label with enhanced styling
            this.ctx.textAlign = 'center';
            
            // Add text shadow for better readability
            this.ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
            this.ctx.shadowBlur = 2;
            this.ctx.shadowOffsetX = 1;
            this.ctx.shadowOffsetY = 1;
            
            // Node label with modern typography
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = '11px Inter, Arial, sans-serif';
            this.ctx.fillText(`Node ${node.id}`, node.x, node.y + 5);
            
            // Reset shadow
            this.ctx.shadowBlur = 0;
            this.ctx.shadowOffsetX = 0;
            this.ctx.shadowOffsetY = 0;
            
            // Reset alpha for next node
            this.ctx.globalAlpha = 1;
        });
    }
    
    adjustColor(color, amount) {
        // Handle HSL colors (which are used for network nodes)
        if (color.startsWith('hsl')) {
            return color; // Return original color for HSL
        }
        
        // Handle hex colors
        if (color.startsWith('#')) {
            const hex = color.replace('#', '');
            if (hex.length === 6) {
                const r = Math.max(0, Math.min(255, parseInt(hex.substr(0, 2), 16) + amount));
                const g = Math.max(0, Math.min(255, parseInt(hex.substr(2, 2), 16) + amount));
                const b = Math.max(0, Math.min(255, parseInt(hex.substr(4, 2), 16) + amount));
                return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
            }
        }
        
        return color; // Return original color if not a valid hex
    }
    
    roundRect(x, y, width, height, radius) {
        this.ctx.beginPath();
        this.ctx.moveTo(x + radius, y);
        this.ctx.lineTo(x + width - radius, y);
        this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        this.ctx.lineTo(x + width, y + height - radius);
        this.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        this.ctx.lineTo(x + radius, y + height);
        this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        this.ctx.lineTo(x, y + radius);
        this.ctx.quadraticCurveTo(x, y, x + radius, y);
        this.ctx.closePath();
    }
    
    drawTransactions() {
        const startX = 60;
        const startY = 40; // Moved up to avoid overlap with blockchain
        const txWidth = 220; // Increased width for more info
        const txHeight = 120; // Increased height
        const currentTime = Date.now();
        
        // Draw pending transactions with enhanced design and dynamic updates
        this.pendingTransactions.slice(0, 3).forEach((tx, index) => {
            const x = startX + index * (txWidth + 30);
            const y = startY;
            
            // Calculate transaction age for visual effects
            const age = currentTime - tx.timestamp;
            const ageSeconds = Math.floor(age / 1000);
            const ageOpacity = Math.max(0.6, 1 - (age / 30000)); // Fade out over 30 seconds
            
            // Dynamic gradient based on transaction age and type
            const txGradient = this.ctx.createLinearGradient(x, y, x + txWidth, y + txHeight);
            if (age > 20000) {
                // Older transactions - more muted colors
                txGradient.addColorStop(0, '#4B5563');
                txGradient.addColorStop(0.3, '#6B7280');
                txGradient.addColorStop(0.7, '#374151');
                txGradient.addColorStop(1, '#1F2937');
            } else {
                // Fresh transactions - vibrant colors
                txGradient.addColorStop(0, '#6A4C93');
                txGradient.addColorStop(0.3, '#8B5CF6');
                txGradient.addColorStop(0.7, '#7C3AED');
                txGradient.addColorStop(1, '#5B21B6');
            }
            this.ctx.fillStyle = txGradient;
            
            // Apply age-based opacity
            this.ctx.globalAlpha = ageOpacity;
            
            // Draw rounded rectangle for transactions
            this.roundRect(x, y, txWidth, txHeight, 12);
            this.ctx.fill();
            
            // Enhanced transaction border with dynamic glow effect
            const borderColor = age > 20000 ? '#9CA3AF' : '#E0E7FF';
            this.ctx.strokeStyle = borderColor;
            this.ctx.lineWidth = 2;
            this.ctx.shadowColor = age > 20000 ? '#6B7280' : '#8B5CF6';
            this.ctx.shadowBlur = 8;
            this.ctx.stroke();
            this.ctx.shadowBlur = 0;
            
            // Reset opacity for text
            this.ctx.globalAlpha = 1;
            
            // Transaction content with improved typography and dynamic info
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = 'bold 14px Inter, Arial, sans-serif';
            this.ctx.textAlign = 'left';
            this.ctx.fillText(`${tx.from} → ${tx.to}`, x + 15, y + 25);
            
            this.ctx.font = '12px Inter, Arial, sans-serif';
            this.ctx.fillText(`Amount: ${tx.amount} tokens`, x + 15, y + 45);
            this.ctx.fillText(`Type: ${tx.type.replace('_', ' ')}`, x + 15, y + 60);
            this.ctx.fillText(`Fee: ${tx.fee.toFixed(1)} tokens`, x + 15, y + 75);
            
            // Dynamic time display with age indicator
            const timeText = ageSeconds < 60 ? `${ageSeconds}s ago` : `${Math.floor(ageSeconds / 60)}m ago`;
            this.ctx.fillText(`Age: ${timeText}`, x + 15, y + 90);
            
            // Priority indicator based on fee
            const priorityColor = tx.fee > this.transactionFee * 1.5 ? '#10B981' : 
                                tx.fee > this.transactionFee ? '#F59E0B' : '#EF4444';
            this.ctx.fillStyle = priorityColor;
            this.ctx.fillText(`Priority: ${tx.fee > this.transactionFee * 1.5 ? 'High' : 
                             tx.fee > this.transactionFee ? 'Medium' : 'Low'}`, x + 15, y + 105);
            
            // Show description if available with better spacing
            if (tx.description) {
                this.ctx.font = '10px Inter, Arial, sans-serif';
                this.ctx.fillStyle = '#E0E7FF';
                const desc = tx.description.length > 25 ? tx.description.substring(0, 22) + '...' : tx.description;
                this.ctx.fillText(desc, x + 15, y + 118);
            }
            
            // Add pulsing effect for new transactions (first 5 seconds)
            if (age < 5000) {
                const pulse = Math.sin(currentTime * 0.01) * 0.3 + 0.7;
                this.ctx.strokeStyle = `rgba(139, 92, 246, ${pulse})`;
                this.ctx.lineWidth = 3;
                this.ctx.lineCap = 'round';
                this.roundRect(x, y, txWidth, txHeight, 12);
                this.ctx.stroke();
            }
        });
        
        // Reset global alpha
        this.ctx.globalAlpha = 1;
    }
    
    drawParticles() {
        // Draw mining particles
        this.miningParticles.forEach(particle => {
            this.ctx.fillStyle = particle.color;
            this.ctx.globalAlpha = particle.life / particle.maxLife;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, 2 * Math.PI);
            this.ctx.fill();
        });
        this.ctx.globalAlpha = 1;
        
        // Draw network particles
        this.networkParticles.forEach(particle => {
            this.ctx.fillStyle = particle.color;
            this.ctx.globalAlpha = particle.life / particle.maxLife;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, 2 * Math.PI);
            this.ctx.fill();
        });
        this.ctx.globalAlpha = 1;
        
        // Draw contract execution particles
        this.contractExecutionParticles.forEach(particle => {
            this.ctx.fillStyle = particle.color;
            this.ctx.globalAlpha = particle.life / particle.maxLife;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, 2 * Math.PI);
            this.ctx.fill();
        });
        this.ctx.globalAlpha = 1;
        
        // Draw block creation particles
        this.blockCreationParticles.forEach(particle => {
            this.ctx.fillStyle = particle.color;
            this.ctx.globalAlpha = particle.life / particle.maxLife;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, 2 * Math.PI);
            this.ctx.fill();
        });
        this.ctx.globalAlpha = 1;
        
        // Draw validation particles
        this.validationParticles.forEach(particle => {
            this.ctx.fillStyle = particle.color;
            this.ctx.globalAlpha = particle.life / particle.maxLife;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, 2 * Math.PI);
            this.ctx.fill();
        });
        this.ctx.globalAlpha = 1;
        
        // Draw consensus particles
        this.consensusParticles.forEach(particle => {
            this.ctx.fillStyle = particle.color;
            this.ctx.globalAlpha = particle.life / particle.maxLife;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, 2 * Math.PI);
            this.ctx.fill();
        });
        this.ctx.globalAlpha = 1;
        
        // Draw finalization particles
        this.finalizationParticles.forEach(particle => {
            this.ctx.fillStyle = particle.color;
            this.ctx.globalAlpha = particle.life / particle.maxLife;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, 2 * Math.PI);
            this.ctx.fill();
        });
        this.ctx.globalAlpha = 1;
        
        // Draw reward particles
        this.rewardParticles.forEach(particle => {
            this.ctx.fillStyle = particle.color;
            this.ctx.globalAlpha = particle.life / particle.maxLife;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, 2 * Math.PI);
            this.ctx.fill();
        });
        this.ctx.globalAlpha = 1;
        
        // Draw node join particles
        this.nodeJoinParticles.forEach(particle => {
            this.ctx.fillStyle = particle.color;
            this.ctx.globalAlpha = particle.life / particle.maxLife;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, 2 * Math.PI);
            this.ctx.fill();
        });
        this.ctx.globalAlpha = 1;
        
        // Draw node leave particles
        this.nodeLeaveParticles.forEach(particle => {
            this.ctx.fillStyle = particle.color;
            this.ctx.globalAlpha = particle.life / particle.maxLife;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, 2 * Math.PI);
            this.ctx.fill();
        });
        this.ctx.globalAlpha = 1;
        
        // Draw rejection particles
        this.rejectionParticles.forEach(particle => {
            this.ctx.fillStyle = particle.color;
            this.ctx.globalAlpha = particle.life / particle.maxLife;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, 2 * Math.PI);
            this.ctx.fill();
        });
        this.ctx.globalAlpha = 1;
    }
    
    drawPropagationArrows() {
        this.propagationArrows.forEach(arrow => {
            const currentX = arrow.startX + (arrow.endX - arrow.startX) * arrow.progress;
            const currentY = arrow.startY + (arrow.endY - arrow.startY) * arrow.progress;
            
            // Draw arrow line with glow
            this.ctx.shadowColor = arrow.color;
            this.ctx.shadowBlur = 8;
            this.ctx.strokeStyle = arrow.color;
            this.ctx.lineWidth = arrow.width;
            this.ctx.lineCap = 'round';
            this.ctx.beginPath();
            this.ctx.moveTo(arrow.startX, arrow.startY);
            this.ctx.lineTo(currentX, currentY);
            this.ctx.stroke();
            
            // Draw arrow head
            const angle = Math.atan2(arrow.endY - arrow.startY, arrow.endX - arrow.startX);
            const headLength = 12;
            const headAngle = Math.PI / 6;
            
            this.ctx.beginPath();
            this.ctx.moveTo(currentX, currentY);
            this.ctx.lineTo(
                currentX - headLength * Math.cos(angle - headAngle),
                currentY - headLength * Math.sin(angle - headAngle)
            );
            this.ctx.moveTo(currentX, currentY);
            this.ctx.lineTo(
                currentX - headLength * Math.cos(angle + headAngle),
                currentY - headLength * Math.sin(angle + headAngle)
            );
            this.ctx.stroke();
            
            // Reset shadow
            this.ctx.shadowBlur = 0;
        });
    }
    
    drawUnifiedInfoPanel() {
        const panelX = 60;
        const panelY = this.ctx.canvas.height - 200;
        const panelWidth = 340; // Slightly wider for better layout
        const panelHeight = 180;
        
        // Unified info panel background with enhanced transparency
        const panelGradient = this.ctx.createLinearGradient(panelX, panelY, panelX, panelY + panelHeight);
        panelGradient.addColorStop(0, 'rgba(0, 0, 0, 0.75)');
        panelGradient.addColorStop(0.7, 'rgba(0, 0, 0, 0.65)');
        panelGradient.addColorStop(1, 'rgba(0, 0, 0, 0.55)');
        this.ctx.fillStyle = panelGradient;
        this.ctx.fillRect(panelX, panelY, panelWidth, panelHeight);
        
        // Enhanced panel border with transparency
        this.ctx.strokeStyle = 'rgba(33, 150, 243, 0.8)';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(panelX, panelY, panelWidth, panelHeight);
        
        // Enhanced text styling with better contrast for transparency
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 16px Inter, Arial, sans-serif';
        this.ctx.textAlign = 'left';
        
        // Add text shadow for better readability on transparent background
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
        this.ctx.shadowBlur = 2;
        this.ctx.shadowOffsetX = 1;
        this.ctx.shadowOffsetY = 1;
        
        // Title
        this.ctx.fillText('Blockchain Network Status', panelX + 15, panelY + 25);
        
        // Phase information with better formatting
        const phaseText = this.animationPhase.charAt(0).toUpperCase() + this.animationPhase.slice(1).replace('_', ' ');
        this.ctx.font = '14px Inter, Arial, sans-serif';
        this.ctx.fillText(`Current Phase: ${phaseText}`, panelX + 15, panelY + 45);
        
        // Key statistics (left column)
        this.ctx.font = '12px Inter, Arial, sans-serif';
        this.ctx.fillText(`Total Blocks: ${this.totalBlocks}`, panelX + 15, panelY + 65);
        this.ctx.fillText(`Total Transactions: ${this.totalTransactions}`, panelX + 15, panelY + 80);
        this.ctx.fillText(`Pending Transactions: ${this.pendingTransactions.length}`, panelX + 15, panelY + 95);
        
        // Dynamic difficulty display
        this.ctx.fillText(`Current Difficulty: ${this.difficulty}`, panelX + 15, panelY + 110);
        
        // Right column - mining info
        if (this.miningBlock) {
            this.ctx.fillText(`Current Nonce: ${this.miningBlock.nonce.toLocaleString()}`, panelX + 170, panelY + 65);
            this.ctx.fillText(`Target Hash: ${this.targetHash}`, panelX + 170, panelY + 80);
            this.ctx.fillText(`Network Hashrate: ${this.networkHashrate.toLocaleString()} H/s`, panelX + 170, panelY + 95);
            this.ctx.fillText(`Active Miners: ${this.miners.length}`, panelX + 170, panelY + 110);
        } else if (this.guidedMode && this.guidedBlock) {
            this.ctx.fillText(`Process Step: ${this.currentStep + 1}/${this.phaseSteps.length}`, panelX + 170, panelY + 65);
            this.ctx.fillText(`Block #${this.guidedBlock.index}`, panelX + 170, panelY + 80);
            this.ctx.fillText(`Phase Time: ${this.phaseTime.toFixed(1)}s`, panelX + 170, panelY + 95);
            this.ctx.fillText(`Total Rewards: ${this.totalRewards.toFixed(1)}`, panelX + 170, panelY + 110);
        }
        
        // Bottom row - additional info
        this.ctx.fillText(`Average Block Time: ${(this.averageBlockTime / 1000).toFixed(1)}s`, panelX + 15, panelY + 130);
        this.ctx.fillText(`Network Nodes: ${this.networkNodes.length}`, panelX + 170, panelY + 130);
        
        // Consensus information
        if (this.guidedMode && this.guidedBlock) {
            const consensusNodes = this.networkNodes.filter(node => node.consensusReached);
            const consensusPercentage = (consensusNodes.length / this.networkNodes.length * 100).toFixed(0);
            this.ctx.fillText(`Consensus: ${consensusPercentage}%`, panelX + 15, panelY + 150);
        }
        
        // Progress indicator for guided mode
        if (this.guidedMode && this.guidedBlock) {
            const progress = (this.currentStep + 1) / this.phaseSteps.length;
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            this.ctx.fillRect(panelX + 15, panelY + 150, 310, 6);
            this.ctx.fillStyle = '#4CAF50';
            this.ctx.fillRect(panelX + 15, panelY + 150, 310 * progress, 6);
        }
        
        // Reset shadow for clean rendering
        this.ctx.shadowBlur = 0;
        this.ctx.shadowOffsetX = 0;
        this.ctx.shadowOffsetY = 0;
    }
    
    render() {
        // Clear canvas and fill with dark background
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
        
        // Draw components
        this.drawBlockchain();
        this.drawNetwork();
        this.drawTransactions();
        this.drawParticles();
        // this.drawPropagationArrows(); // Disabled arrows
        this.drawMinerRewardDisplay(); // Draw miner reward display
        this.drawUnifiedInfoPanel();
        
        // Draw guided phase indicator if in guided mode
        if (this.guidedPhaseIndicator) {
            this.drawGuidedPhaseIndicator();
        }
        
        // Draw miner reward display if active
        if (this.minerRewardDisplay) {
            this.drawMinerRewardDisplay();
        }
    }
    
    drawGuidedPhaseIndicator() {
        if (!this.guidedPhaseIndicator) return;
        
        const centerX = this.ctx.canvas.width / 2;
        const y = this.guidedPhaseIndicator.y || 100; // Default y position if not set
        const color = this.guidedPhaseIndicator.color || '#00FF88'; // Default color if not set
        
        // Set font first to measure text accurately
        this.ctx.font = 'bold 22px Inter, Arial, sans-serif';
        this.ctx.textAlign = 'center';
        
        // Draw background banner with better sizing
        const textWidth = this.ctx.measureText(this.guidedPhaseIndicator.text).width;
        const bannerWidth = Math.max(textWidth + 80, 300); // Minimum width of 300px
        const bannerHeight = 60;
        
        // Ensure we have valid coordinates for the gradient
        const gradientStartX = centerX - bannerWidth / 2;
        const gradientStartY = y - bannerHeight / 2;
        const gradientEndX = centerX + bannerWidth / 2;
        const gradientEndY = y + bannerHeight / 2;
        
        // Check for valid coordinates
        if (isFinite(gradientStartX) && isFinite(gradientStartY) && 
            isFinite(gradientEndX) && isFinite(gradientEndY)) {
            
            // Create gradient background
            const gradient = this.ctx.createLinearGradient(
                gradientStartX, gradientStartY,
                gradientEndX, gradientEndY
            );
            gradient.addColorStop(0, 'rgba(0, 0, 0, 0.9)');
            gradient.addColorStop(0.5, 'rgba(20, 20, 20, 0.95)');
            gradient.addColorStop(1, 'rgba(0, 0, 0, 0.9)');
            
            // Draw rounded rectangle background
            this.ctx.fillStyle = gradient;
            this.roundRect(centerX - bannerWidth / 2, y - bannerHeight / 2, bannerWidth, bannerHeight, 15);
            this.ctx.fill();
            
            // Draw enhanced border with glow
            this.ctx.strokeStyle = color;
            this.ctx.lineWidth = 4;
            this.ctx.shadowColor = color;
            this.ctx.shadowBlur = 15;
            this.ctx.stroke();
            this.ctx.shadowBlur = 0;
            
            // Draw inner border for depth
            this.ctx.strokeStyle = `rgba(255, 255, 255, 0.3)`;
            this.ctx.lineWidth = 1;
            this.roundRect(centerX - bannerWidth / 2 + 2, y - bannerHeight / 2 + 2, bannerWidth - 4, bannerHeight - 4, 13);
            this.ctx.stroke();
            
            // Draw text with enhanced styling
            this.ctx.fillStyle = color;
            this.ctx.font = 'bold 22px Inter, Arial, sans-serif';
            this.ctx.textAlign = 'center';
            
            // Add text shadow for better readability
            this.ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
            this.ctx.shadowBlur = 4;
            this.ctx.shadowOffsetX = 1;
            this.ctx.shadowOffsetY = 1;
            this.ctx.fillText(this.guidedPhaseIndicator.text, centerX, y + 8);
            
            // Reset shadow
            this.ctx.shadowBlur = 0;
            this.ctx.shadowOffsetX = 0;
            this.ctx.shadowOffsetY = 0;
            
            // Add pulsing effect
            this.guidedPhaseIndicator.alpha = 0.8 + 0.2 * Math.sin(Date.now() * 0.005);
            this.ctx.globalAlpha = this.guidedPhaseIndicator.alpha;
            this.ctx.globalAlpha = 1.0; // Reset
        }
    }
    
    getStats() {
        // Calculate dynamic difficulty
        const baseDifficulty = this.difficulty;
        const blockCount = this.blocks.length;
        const dynamicDifficulty = Math.min(8, baseDifficulty + Math.floor(blockCount / 5));
        
        // Calculate consensus statistics
        const consensusNodes = this.networkNodes.filter(node => node.consensusReached);
        const consensusThreshold = this.networkNodes.length * 0.6;
        const consensusPercentage = this.networkNodes.length > 0 ? 
            Math.round((consensusNodes.length / this.networkNodes.length) * 100) : 0;
        
        return {
            blocks: this.totalBlocks,
            transactions: this.totalTransactions,
            pending: this.pendingTransactions.length,
            difficulty: dynamicDifficulty,
            hashrate: this.networkHashrate,
            miners: this.miners.length,
            nodes: this.networkNodes.length,
            phase: this.animationPhase,
            isMining: this.isMining,
            totalRewards: this.totalRewards,
            averageBlockTime: this.averageBlockTime / 1000,
            consensusPercentage: consensusPercentage,
            consensusThreshold: Math.round(consensusThreshold * 100 / this.networkNodes.length),
            consensusReached: consensusNodes.length >= consensusThreshold
        };
    }
    
    reset() {
        this.blocks = [];
        this.pendingTransactions = [];
        this.miningBlock = null;
        this.isMining = false;
        this.animationPhase = 'idle';
        this.phaseTime = 0;
        this.miningParticles = [];
        this.validationParticles = [];
        this.networkParticles = [];
        this.propagationArrows = [];
        this.contractExecutionParticles = [];
        this.blockCreationParticles = [];
        this.consensusParticles = [];
        this.finalizationParticles = [];
        this.rewardParticles = [];
        this.rejectionParticles = [];
        this.nodeJoinParticles = [];
        this.nodeLeaveParticles = [];
        this.guidedBlock = null;
        this.currentStep = 0;
        this.totalBlocks = 0;
        this.totalTransactions = 0;
        this.guidedPhaseIndicator = null; // Clear guided phase indicator
        
        // Reset miner tracking
        this.successfulMiner = null;
        this.minerBlockConnection = null;
        this.minerRewardDisplay = null;
        
        // Reset dynamic network properties
        this.lastNodeJoin = 0;
        this.lastNodeLeave = 0;
        this.nodeRedistributionTimer = 0;
        this.nextNodeId = 1; // Reset node ID counter
        
        // Reset difficulty adjustment properties
        this.blockTimes = [];
        this.lastDifficultyAdjustment = 0;
        this.lastBlockTime = 0;
        
        // Reset to default settings
        this.difficulty = 4;
        this.targetHash = '0'.repeat(this.difficulty);
        this.speed = 1.0;
        // Block hashes are always visible
        this.showHashes = true;
        // Network and auto mining are always enabled
        this.showNetwork = true;
        this.autoMine = true;
        
        // Reset control values in the UI
        this.resetControls();
        
        this.initializeBlockchain();
        this.initializeNetwork();
        this.startGenesisBlock();
    }
    
    resetControls() {
        // Reset difficulty slider
        const difficultySlider = document.getElementById('blockchainDifficulty');
        const difficultyValue = document.getElementById('blockchainDifficultyValue');
        if (difficultySlider && difficultyValue) {
            difficultySlider.value = this.difficulty;
            difficultyValue.textContent = this.difficulty;
        }
        
        // Reset speed slider
        const speedSlider = document.getElementById('blockchainSpeed');
        const speedValue = document.getElementById('blockchainSpeedValue');
        if (speedSlider && speedValue) {
            speedSlider.value = this.speed;
            speedValue.textContent = this.speed + 'x';
        }
    }
    
    drawMinerBlockConnection() {
        if (!this.minerBlockConnection) return;
        
        const connection = this.minerBlockConnection;
        
        // Update connection progress
        connection.progress += connection.speed;
        if (connection.progress > 1) {
            connection.progress = 1;
        }
        
        // Calculate current position
        const currentX = connection.startX + (connection.endX - connection.startX) * connection.progress;
        const currentY = connection.startY + (connection.endY - connection.startY) * connection.progress;
        
        // Draw connection line
        this.ctx.strokeStyle = connection.color;
        this.ctx.lineWidth = connection.width;
        this.ctx.globalAlpha = connection.alpha;
        
        // Add glow effect
        this.ctx.shadowColor = connection.color;
        this.ctx.shadowBlur = 10;
        
        this.ctx.beginPath();
        this.ctx.moveTo(connection.startX, connection.startY);
        this.ctx.lineTo(currentX, currentY);
        this.ctx.stroke();
        
        // Draw arrow head at current position
        const angle = Math.atan2(connection.endY - connection.startY, connection.endX - connection.startX);
        const headLength = 15;
        const headAngle = Math.PI / 6;
        
        this.ctx.beginPath();
        this.ctx.moveTo(currentX, currentY);
        this.ctx.lineTo(
            currentX - headLength * Math.cos(angle - headAngle),
            currentY - headLength * Math.sin(angle - headAngle)
        );
        this.ctx.moveTo(currentX, currentY);
        this.ctx.lineTo(
            currentX - headLength * Math.cos(angle + headAngle),
            currentY - headLength * Math.sin(angle + headAngle)
        );
        this.ctx.stroke();
        
        // Reset shadow
        this.ctx.shadowBlur = 0;
        this.ctx.globalAlpha = 1.0;
        
        // Add pulsing effect
        connection.pulseIntensity = 0.8 + 0.2 * Math.sin(Date.now() * 0.01);
    }
    
    drawMinerRewardDisplay() {
        if (!this.minerRewardDisplay) return;
        
        const reward = this.minerRewardDisplay;
        
        // Update reward display
        reward.life -= 0.016; // 60 FPS
        reward.y += reward.velocity * 0.016;
        reward.alpha = reward.life / reward.maxLife;
        
        if (reward.life <= 0) {
            this.minerRewardDisplay = null;
            return;
        }
        
        // Draw reward text
        this.ctx.fillStyle = reward.color;
        this.ctx.globalAlpha = reward.alpha;
        this.ctx.font = 'bold 14px Inter, Arial, sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(reward.text, reward.x, reward.y);
        
        // Add glow effect
        this.ctx.shadowColor = reward.color;
        this.ctx.shadowBlur = 8;
        this.ctx.fillText(reward.text, reward.x, reward.y);
        this.ctx.shadowBlur = 0;
        
        this.ctx.globalAlpha = 1.0;
    }
    
    createRejectionParticles() {
        // Create rejection particles around the mining block position
        const totalBlocks = this.blocks.length;
        let blockX;

        if (totalBlocks <= 4) {
            const visibleIndex = totalBlocks;
            blockX = this.chainStartX + visibleIndex * (this.blockWidth + this.blockSpacing) + this.blockWidth / 2;
        } else {
            const visibleBlocks = [this.blocks[0], this.blocks[1], ...this.blocks.slice(-2)];
            const visibleIndex = visibleBlocks.length;
            blockX = this.chainStartX + visibleIndex * (this.blockWidth + this.blockSpacing) + this.blockWidth / 2;

            if (totalBlocks > 4) {
                blockX += 80;
            }
        }

        const blockY = this.chainStartY + this.blockHeight / 2;

        for (let i = 0; i < 20; i++) {
            this.rejectionParticles.push({
                x: blockX,
                y: blockY,
                vx: (Math.random() - 0.5) * 150,
                vy: (Math.random() - 0.5) * 150,
                life: 2.5,
                maxLife: 2.5,
                color: '#FF5722', // Red for rejection
                size: 5
            });
        }
    }
} 