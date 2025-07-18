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
        this.showHashes = true;
        this.showMining = true;
        this.showNetwork = true;
        this.autoMine = true;
        
        // Enhanced visual properties
        this.blockWidth = 140; // Slightly larger for better readability
        this.blockHeight = 90;
        this.blockSpacing = 30;
        this.chainStartX = 60;
        this.chainStartY = 200; // Moved up for better balance
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
        
        // Network properties
        this.nodeCount = 8; // More nodes for realistic network
        this.nodeRadius = 20;
        this.networkCenterX = 0;
        this.networkCenterY = 0;
        
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
        this.phaseSteps = ['mining', 'validation', 'propagation', 'consensus', 'finalization'];
        this.currentStep = 0;
        this.stepDuration = 0.3; // Slightly longer for better understanding
        
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
        
        // Animation timing
        this.lastBlockTime = 0;
        this.blockInterval = 3000; // 3 seconds for more realistic timing
        
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
    }
    
    initializeNetwork() {
        const canvasWidth = this.ctx.canvas.width;
        const canvasHeight = this.ctx.canvas.height;
        
        this.networkCenterX = canvasWidth - 250;
        this.networkCenterY = canvasHeight - 150; // Moved down from canvasHeight / 2
        
        // Create network nodes with enhanced design
        this.networkNodes = [];
        for (let i = 0; i < this.nodeCount; i++) {
            const angle = (i / this.nodeCount) * 2 * Math.PI;
            const radius = 100;
            const x = this.networkCenterX + Math.cos(angle) * radius;
            const y = this.networkCenterY + Math.sin(angle) * radius;
            
            this.networkNodes.push({
                id: i,
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
        this.isMining = false;
        this.miningBlock = null;
        this.currentStep = 0;
        this.phaseTime = 0;
        this.blockGlow = 1.0;
        
        // Store the block for the guided process
        this.guidedBlock = block;
        
        // Start with mining success
        this.animationPhase = 'mining_success';
        this.createMiningSuccessParticles();
        
        // Progress through steps
        setTimeout(() => this.nextGuidedStep(), this.stepDuration * 1000);
    }
    
    nextGuidedStep() {
        this.currentStep++;
        this.phaseTime = 0;
        
        if (this.currentStep >= this.phaseSteps.length) {
            // Finalize the block
            this.finalizeBlock();
            return;
        }
        
        this.animationPhase = this.phaseSteps[this.currentStep];
        
        // Create step-specific effects
        switch (this.animationPhase) {
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
        
        // Continue to next step
        setTimeout(() => this.nextGuidedStep(), this.stepDuration * 1000);
    }
    
    startValidationStep() {
        // Simulate network validation
        this.networkNodes.forEach(node => {
            node.isValidating = true;
            node.pulseIntensity = 1.0;
        });
        
        // Create validation particles
        this.createValidationParticles();
    }
    
    startPropagationStep() {
        // Create propagation arrows
        this.createPropagationArrows();
        
        // Create broadcast particles
        this.createBroadcastParticles();
    }
    
    startConsensusStep() {
        // Simulate consensus mechanism
        this.networkNodes.forEach(node => {
            node.isValidating = false;
            node.pulseIntensity = 0.8;
        });
        
        // Create consensus particles
        this.createConsensusParticles();
    }
    
    startFinalizationStep() {
        // Prepare for finalization
        this.networkNodes.forEach(node => {
            node.pulseIntensity = 1.0;
        });
        
        // Create finalization particles
        this.createFinalizationParticles();
    }
    
    finalizeBlockDirectly(block) {
        // Add block to chain immediately (no guided mode)
        this.blocks.push(block);
        this.totalBlocks++;
        
        // Remove mined transactions from pending
        block.transactions.forEach(tx => {
            const index = this.pendingTransactions.findIndex(p => p.id === tx.id);
            if (index !== -1) {
                this.pendingTransactions.splice(index, 1);
            }
        });
        
        // Execute smart contracts if any
        this.executeSmartContracts(block);
        
        // Add new pending transaction
        this.addPendingTransaction('Charlie', 'David', 5, 'transfer');
        
        // Create celebration particles
        this.createBlockCreationParticles();
        
        // Reset mining state
        this.miningBlock = null;
        this.isMining = false;
        this.animationPhase = 'idle';
        
        // Start mining next block immediately for very low difficulty
        const nextBlockDelay = Math.max(5, 50 - (this.difficulty * 20)); // Very fast for low difficulty
        setTimeout(() => {
            this.startMining();
        }, nextBlockDelay);
    }
    
    finalizeBlock() {
        // Add block to chain
        this.blocks.push(this.guidedBlock);
        this.totalBlocks++;
        
        // Calculate block time for statistics
        const blockTime = Date.now() - this.guidedBlock.timestamp;
        this.lastBlockTimes.push(blockTime);
        if (this.lastBlockTimes.length > 10) {
            this.lastBlockTimes.shift();
        }
        this.averageBlockTime = this.lastBlockTimes.reduce((sum, time) => sum + time, 0) / this.lastBlockTimes.length;
        
        // Remove mined transactions from pending
        this.guidedBlock.transactions.forEach(tx => {
            const index = this.pendingTransactions.findIndex(p => p.id === tx.id);
            if (index !== -1) {
                this.pendingTransactions.splice(index, 1);
            }
        });
        
        // Add block reward to successful miner (simplified)
        this.totalRewards += this.guidedBlock.blockReward + this.guidedBlock.totalFees;
        
        // Execute smart contracts if any
        this.executeSmartContracts(this.guidedBlock);
        
        // Create reward particles
        this.createRewardParticles();
        
        // Add new pending transaction
        this.addPendingTransaction('Charlie', 'David', 5, 'transfer', 'Micro payment');
        
        // Create celebration particles
        this.createBlockCreationParticles();
        
        // Reset guided mode
        this.guidedBlock = null;
        this.currentStep = 0;
        this.animationPhase = 'idle';
        
        // Start mining next block after delay - much faster for lower difficulty
        const baseDelay = 200; // Reduced from 500ms
        const difficultyReduction = this.difficulty * 50; // More aggressive reduction
        const nextBlockDelay = Math.max(10, baseDelay - difficultyReduction); // Minimum 10ms delay
        setTimeout(() => {
            this.startMining();
        }, nextBlockDelay);
    }
    
    addPendingTransaction(from, to, amount, type, description = '') {
        const transaction = {
            id: `tx_${this.pendingTransactions.length}_${Date.now()}`,
            from: from,
            to: to,
            amount: amount,
            type: type,
            timestamp: Date.now(),
            status: 'pending',
            color: this.transactionColors[type],
            fee: this.transactionFee,
            description: description,
            nonce: this.pendingTransactions.length // Simple nonce for demo
        };
        
        this.pendingTransactions.push(transaction);
        this.totalTransactions++;
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
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        
        const hexHash = Math.abs(hash).toString(16).padStart(8, '0');
        return hexHash.repeat(8);
    }
    
    startMining() {
        if (this.isMining || this.pendingTransactions.length === 0) return;
        
        this.isMining = true;
        this.animationPhase = 'mining';
        this.phaseTime = 0;
        this.miningGlow = 1.0;
        
        // Create new block with realistic data
        const lastBlock = this.blocks[this.blocks.length - 1];
        const selectedTransactions = this.pendingTransactions.slice(0, 3); // Select up to 3 transactions
        
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
    }
    
    mineBlock() {
        if (!this.isMining || !this.miningBlock) return;
        
        // Calculate dynamic difficulty based on number of blocks
        const baseDifficulty = this.difficulty;
        const blockCount = this.blocks.length;
        const dynamicDifficulty = Math.min(8, baseDifficulty + Math.floor(blockCount / 5)); // Increase difficulty every 5 blocks, max 8
        
        // Update target hash for dynamic difficulty
        const dynamicTargetHash = '0'.repeat(dynamicDifficulty);
        
        // Calculate mining speed based on dynamic difficulty and animation speed
        // Much more aggressive mining for faster block creation
        const baseMiningSpeed = 1;
        // Much less aggressive difficulty scaling
        const difficultyMultiplier = Math.max(0.1, dynamicDifficulty * 0.1); // Very gentle scaling
        const speedMultiplier = this.speed; // Apply animation speed
        const effectiveMiningSpeed = baseMiningSpeed / difficultyMultiplier * speedMultiplier;
        
        // Simulate mining by trying different nonces
        // Try many more nonces per frame for much faster block creation
        const baseNoncesPerFrame = 200; // Much higher base rate
        const noncesToTry = Math.max(10, Math.floor(baseNoncesPerFrame / difficultyMultiplier * speedMultiplier));
        
        for (let i = 0; i < noncesToTry; i++) {
            this.miningBlock.nonce++;
            this.miningBlock.hash = this.calculateBlockHash(this.miningBlock);
            
            // Check if hash meets dynamic difficulty requirement
            if (this.miningBlock.hash.startsWith(dynamicTargetHash)) {
                // Block mined successfully
                this.miningBlock.creationTime = Date.now();
                this.miningBlock.glowIntensity = 1.0;
                
                // For very low difficulty, skip guided mode for faster block creation
                if (dynamicDifficulty <= 3) {
                    this.finalizeBlockDirectly(this.miningBlock);
                } else {
                    // Start guided step-by-step process
                    this.startGuidedBlockAddition(this.miningBlock);
                }
                
                return; // Exit the loop since we found a valid hash
            }
        }
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
                blockX += 60; // Add extra space for ellipses
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
        this.createPropagationArrows();
        
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
                blockX += 60; // Add extra space for ellipses
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
                blockX += 60; // Add extra space for ellipses
            }
        }
        
        const blockY = this.chainStartY + this.blockHeight / 2;
        
        this.networkNodes.forEach(node => {
            for (let i = 0; i < 6; i++) {
                this.networkParticles.push({
                    x: blockX,
                    y: blockY,
                    targetX: node.x,
                    targetY: node.y,
                    vx: 0,
                    vy: 0,
                    life: 2.5,
                    maxLife: 2.5,
                    color: '#4CAF50',
                    size: 4
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
                contractX += 60; // Add extra space for ellipses
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
            for (let i = 0; i < 8; i++) {
                this.validationParticles.push({
                    x: node.x,
                    y: node.y,
                    vx: (Math.random() - 0.5) * 100,
                    vy: (Math.random() - 0.5) * 100,
                    life: 2.0,
                    maxLife: 2.0,
                    color: '#4CAF50',
                    size: 3
                });
            }
        });
    }
    
    createConsensusParticles() {
        this.networkNodes.forEach(node => {
            for (let i = 0; i < 6; i++) {
                this.consensusParticles.push({
                    x: node.x,
                    y: node.y,
                    vx: (Math.random() - 0.5) * 120,
                    vy: (Math.random() - 0.5) * 120,
                    life: 2.5,
                    maxLife: 2.5,
                    color: '#FF9800',
                    size: 4
                });
            }
        });
    }
    
    createFinalizationParticles() {
        this.networkNodes.forEach(node => {
            for (let i = 0; i < 10; i++) {
                this.finalizationParticles.push({
                    x: node.x,
                    y: node.y,
                    vx: (Math.random() - 0.5) * 150,
                    vy: (Math.random() - 0.5) * 150,
                    life: 3.0,
                    maxLife: 3.0,
                    color: '#9C27B0',
                    size: 5
                });
            }
        });
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
            particle.vy += 40 * deltaTime; // Gravity effect
        });
    }
    
    setSpeed(speed) {
        this.speed = speed;
    }
    
    setShowHashes(show) {
        this.showHashes = show;
    }
    
    setShowMining(show) {
        this.showMining = show;
    }
    
    setShowNetwork(show) {
        this.showNetwork = show;
    }
    
    setAutoMine(auto) {
        this.autoMine = auto;
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
        deltaTime *= this.speed;
        
        // Update animation phase
        this.phaseTime += deltaTime;
        
        // Update visual effects
        this.blockGlow = Math.max(0, this.blockGlow - deltaTime * 2);
        this.miningGlow = Math.max(0, this.miningGlow - deltaTime * 1.5);
        this.networkPulse = (this.networkPulse + deltaTime * 3) % (2 * Math.PI);
        
        // Mine block if mining
        if (this.isMining && this.miningBlock) {
            this.mineBlock();
        }
        
        // Update all particle types
        this.updateMiningParticles(deltaTime);
        this.updateNetworkParticles(deltaTime);
        this.updateContractExecutionParticles(deltaTime);
        this.updateBlockCreationParticles(deltaTime);
        this.updatePropagationArrows(deltaTime);
        this.updateValidationParticles(deltaTime);
        this.updateConsensusParticles(deltaTime);
        this.updateFinalizationParticles(deltaTime);
        this.updateRewardParticles(deltaTime);
        
        // Create new particles
        this.createMiningParticles();
        
        // Update network validation
        this.networkNodes.forEach(node => {
            if (node.isValidating && this.phaseTime > 1.5) {
                node.isValidating = false;
                node.pulseIntensity = 0;
            }
            node.pulseIntensity = Math.max(0, node.pulseIntensity - deltaTime * 2);
        });
        
        // Update block glow
        this.blocks.forEach(block => {
            if (block.glowIntensity > 0) {
                block.glowIntensity = Math.max(0, block.glowIntensity - deltaTime * 1.5);
            }
        });
        
        // Update statistics
        // Calculate hashrate based on difficulty, speed, and number of miners
        const baseHashrate = 1200;
        const difficultyMultiplier = Math.pow(2, this.difficulty - 1);
        const speedMultiplier = this.speed;
        const effectiveHashrate = Math.floor(baseHashrate / difficultyMultiplier * speedMultiplier);
        this.networkHashrate = this.miners.length * effectiveHashrate;
    }
    
    drawBlockchain() {
        // Calculate which blocks to show: genesis, block 1, and last two blocks
        const totalBlocks = this.blocks.length;
        let visibleBlocks = [];
        
        if (totalBlocks <= 4) {
            // If 4 or fewer blocks, show all of them
            visibleBlocks = this.blocks;
        } else {
            // Show genesis, block 1, and last two blocks
            visibleBlocks = [
                this.blocks[0], // Genesis block
                this.blocks[1], // Block 1
                ...this.blocks.slice(-2) // Last two blocks
            ];
        }
        
        // Calculate background width based on visible blocks
        const visibleWidth = visibleBlocks.length * (this.blockWidth + this.blockSpacing);
        
        // Draw chain background with gradient
        const gradient = this.ctx.createLinearGradient(this.chainStartX - 30, this.chainStartY - 30, 
                                                     this.chainStartX + visibleWidth + 30, 
                                                     this.chainStartY + this.blockHeight + 30);
        gradient.addColorStop(0, 'rgba(33, 150, 243, 0.1)');
        gradient.addColorStop(1, 'rgba(76, 175, 80, 0.1)');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(this.chainStartX - 30, this.chainStartY - 30, 
                         visibleWidth + 60, 
                         this.blockHeight + 60);
        
        // Draw blocks with enhanced design
        visibleBlocks.forEach((block, visibleIndex) => {
            let x = this.chainStartX + visibleIndex * (this.blockWidth + this.blockSpacing);
            const y = this.chainStartY;
            
            // Add extra space for ellipses if this is after block 1 and there are more than 4 blocks
            if (totalBlocks > 4 && visibleIndex >= 2) {
                x += 60; // Add extra space for ellipses after block 1
            }
            
            // Block glow effect
            if (block.glowIntensity > 0) {
                this.ctx.shadowColor = '#4CAF50';
                this.ctx.shadowBlur = 20 * block.glowIntensity;
            }
            
            // Block background with gradient
            const blockGradient = this.ctx.createLinearGradient(x, y, x + this.blockWidth, y + this.blockHeight);
            if (block.isGenesis) {
                blockGradient.addColorStop(0, '#4CAF50');
                blockGradient.addColorStop(1, '#45A049');
            } else {
                blockGradient.addColorStop(0, '#2196F3');
                blockGradient.addColorStop(1, '#1976D2');
            }
            this.ctx.fillStyle = blockGradient;
            this.ctx.fillRect(x, y, this.blockWidth, this.blockHeight);
            
            // Block border with enhanced styling
            this.ctx.strokeStyle = '#fff';
            this.ctx.lineWidth = 3;
            this.ctx.strokeRect(x, y, this.blockWidth, this.blockHeight);
            
            // Reset shadow
            this.ctx.shadowBlur = 0;
            
            // Block content with improved typography and structure
            this.ctx.fillStyle = '#fff';
            this.ctx.font = 'bold 16px Inter';
            this.ctx.textAlign = 'left';
            
            const title = block.isGenesis ? 'Genesis' : `Block #${block.index}`;
            this.ctx.fillText(title, x + 12, y + 22);
            
            this.ctx.font = '12px Inter';
            this.ctx.fillText(`Tx: ${block.transactions.length}`, x + 12, y + 40);
            this.ctx.fillText(`Nonce: ${block.nonce}`, x + 12, y + 55);
            
            // Show reward and fees for non-genesis blocks
            if (!block.isGenesis) {
                this.ctx.fillText(`Reward: ${block.blockReward}`, x + 12, y + 70);
                this.ctx.fillText(`Fees: ${block.totalFees.toFixed(1)}`, x + 12, y + 85);
            }
            
            if (this.showHashes) {
                this.ctx.font = '8px monospace';
                this.ctx.fillText(`Hash: ${block.hash.substring(0, 12)}...`, x + 12, y + 78);
            }
            
            // Draw connection to next block with enhanced styling
            if (visibleIndex < visibleBlocks.length - 1) {
                const nextBlock = visibleBlocks[visibleIndex + 1];
                let nextX = this.chainStartX + (visibleIndex + 1) * (this.blockWidth + this.blockSpacing);
                
                // Add extra space for ellipses if next block is after block 1 and there are more than 4 blocks
                if (totalBlocks > 4 && visibleIndex >= 1) {
                    nextX += 60; // Add extra space for ellipses after block 1
                }
                
                this.ctx.strokeStyle = '#fff';
                this.ctx.lineWidth = 4;
                this.ctx.lineCap = 'round';
                this.ctx.beginPath();
                this.ctx.moveTo(x + this.blockWidth, y + this.blockHeight / 2);
                this.ctx.lineTo(nextX, y + this.blockHeight / 2);
                this.ctx.stroke();
                
                // Enhanced arrow
                this.ctx.fillStyle = '#fff';
                this.ctx.beginPath();
                this.ctx.moveTo(nextX - 12, y + this.blockHeight / 2 - 6);
                this.ctx.lineTo(nextX, y + this.blockHeight / 2);
                this.ctx.lineTo(nextX - 12, y + this.blockHeight / 2 + 6);
                this.ctx.fill();
            }
        });
        
        // Draw ellipses if there are hidden blocks
        if (totalBlocks > 4) {
            // Calculate position for ellipses (between block 1 and last two blocks)
            const ellipsesX = this.chainStartX + 2 * (this.blockWidth + this.blockSpacing) + 30; // Centered in the extra space
            const ellipsesY = this.chainStartY + this.blockHeight / 2;
            
            // Draw ellipses with enhanced styling
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            this.ctx.font = 'bold 24px Inter';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('⋯', ellipsesX, ellipsesY + 8);
            
            // Add a subtle glow to ellipses
            this.ctx.shadowColor = 'rgba(255, 255, 255, 0.5)';
            this.ctx.shadowBlur = 10;
            this.ctx.fillText('⋯', ellipsesX, ellipsesY + 8);
            this.ctx.shadowBlur = 0;
            
            // Show count of hidden blocks
            const hiddenCount = totalBlocks - 4;
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            this.ctx.font = '12px Inter';
            this.ctx.fillText(`+${hiddenCount} blocks`, ellipsesX, ellipsesY + 25);
        }
        
        // Draw mining block with enhanced design
        if (this.miningBlock) {
            let x = this.chainStartX + visibleBlocks.length * (this.blockWidth + this.blockSpacing);
            
            // Add extra space for ellipses if there are more than 4 blocks
            if (totalBlocks > 4) {
                x += 60; // Add extra space for ellipses
            }
            
            const y = this.chainStartY;
            
            // Mining glow effect
            if (this.miningGlow > 0) {
                this.ctx.shadowColor = '#FF9800';
                this.ctx.shadowBlur = 25 * this.miningGlow;
            }
            
            // Mining block background with gradient
            const miningGradient = this.ctx.createLinearGradient(x, y, x + this.blockWidth, y + this.blockHeight);
            miningGradient.addColorStop(0, '#FF9800');
            miningGradient.addColorStop(1, '#F57C00');
            this.ctx.fillStyle = miningGradient;
            this.ctx.fillRect(x, y, this.blockWidth, this.blockHeight);
            
            // Mining block border
            this.ctx.strokeStyle = '#fff';
            this.ctx.lineWidth = 3;
            this.ctx.strokeRect(x, y, this.blockWidth, this.blockHeight);
            
            // Reset shadow
            this.ctx.shadowBlur = 0;
            
            // Mining block content with improved typography
            this.ctx.fillStyle = '#fff';
            this.ctx.font = 'bold 16px Inter';
            this.ctx.textAlign = 'left';
            this.ctx.fillText('Mining...', x + 12, y + 22);
            
            // Calculate dynamic difficulty for display
            const baseDifficulty = this.difficulty;
            const blockCount = this.blocks.length;
            const dynamicDifficulty = Math.min(8, baseDifficulty + Math.floor(blockCount / 5));
            const dynamicTargetHash = '0'.repeat(dynamicDifficulty);
            
            this.ctx.font = '12px Inter';
            this.ctx.fillText(`Nonce: ${this.miningBlock.nonce}`, x + 12, y + 40);
            this.ctx.fillText(`Target: ${dynamicTargetHash}`, x + 12, y + 55);
            this.ctx.fillText(`Reward: ${this.blockReward}`, x + 12, y + 70);
            this.ctx.fillText(`Fees: ${this.miningBlock.totalFees.toFixed(1)}`, x + 12, y + 85);
            
            if (this.showHashes) {
                this.ctx.font = '8px monospace';
                this.ctx.fillText(`Hash: ${this.miningBlock.hash.substring(0, 12)}...`, x + 12, y + 78);
            }
            
            // Mining progress indicator
            const progress = (this.miningBlock.nonce % 100) / 100;
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            this.ctx.fillRect(x + 12, y + 95, 96, 6);
            this.ctx.fillStyle = '#FF9800';
            this.ctx.fillRect(x + 12, y + 95, 96 * progress, 6);
        }
    }
    
    drawNetwork() {
        if (!this.showNetwork) return;
        
        // Draw network background with gradient
        const networkGradient = this.ctx.createRadialGradient(this.networkCenterX, this.networkCenterY, 0, 
                                                             this.networkCenterX, this.networkCenterY, 150);
        networkGradient.addColorStop(0, 'rgba(33, 150, 243, 0.1)');
        networkGradient.addColorStop(1, 'rgba(33, 150, 243, 0.05)');
        this.ctx.fillStyle = networkGradient;
        this.ctx.fillRect(this.networkCenterX - 150, this.networkCenterY - 150, 300, 300);
        
        // Draw connections between nodes with pulse effect
        this.ctx.strokeStyle = `rgba(255, 255, 255, ${0.3 + 0.2 * Math.sin(this.networkPulse)})`;
        this.ctx.lineWidth = 2;
        
        for (let i = 0; i < this.networkNodes.length; i++) {
            for (let j = i + 1; j < this.networkNodes.length; j++) {
                const node1 = this.networkNodes[i];
                const node2 = this.networkNodes[j];
                
                this.ctx.beginPath();
                this.ctx.moveTo(node1.x, node1.y);
                this.ctx.lineTo(node2.x, node2.y);
                this.ctx.stroke();
            }
        }
        
        // Draw nodes with enhanced design
        this.networkNodes.forEach(node => {
            // Node pulse effect
            const pulseRadius = this.nodeRadius + 5 * node.pulseIntensity * Math.sin(this.networkPulse * 2);
            
            // Node background with gradient
            const nodeGradient = this.ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, this.nodeRadius);
            nodeGradient.addColorStop(0, node.color);
            // For HSL colors, use a slightly darker version
            if (node.color.startsWith('hsl')) {
                const hslMatch = node.color.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
                if (hslMatch) {
                    const h = hslMatch[1];
                    const s = hslMatch[2];
                    const l = Math.max(0, parseInt(hslMatch[3]) - 20);
                    nodeGradient.addColorStop(1, `hsl(${h}, ${s}%, ${l}%)`);
                } else {
                    nodeGradient.addColorStop(1, node.color);
                }
            } else {
                nodeGradient.addColorStop(1, this.adjustColor(node.color, -20));
            }
            this.ctx.fillStyle = nodeGradient;
            this.ctx.beginPath();
            this.ctx.arc(node.x, node.y, this.nodeRadius, 0, 2 * Math.PI);
            this.ctx.fill();
            
            // Node border
            this.ctx.strokeStyle = '#fff';
            this.ctx.lineWidth = 3;
            this.ctx.stroke();
            
            // Node status indicators
            if (node.isMining) {
                this.ctx.strokeStyle = '#FF9800';
                this.ctx.lineWidth = 4;
                this.ctx.beginPath();
                this.ctx.arc(node.x, node.y, this.nodeRadius + 8, 0, 2 * Math.PI);
                this.ctx.stroke();
            }
            
            if (node.isValidating) {
                this.ctx.strokeStyle = '#4CAF50';
                this.ctx.lineWidth = 4;
                this.ctx.beginPath();
                this.ctx.arc(node.x, node.y, this.nodeRadius + 12, 0, 2 * Math.PI);
                this.ctx.stroke();
            }
            
            // Node label
            this.ctx.fillStyle = '#fff';
            this.ctx.font = 'bold 11px Inter';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(`Node ${node.id}`, node.x, node.y + 4);
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
    
    drawTransactions() {
        const startX = 50;
        const startY = 80;
        const txWidth = 200; // Increased width for more info
        const txHeight = 100; // Increased height
        
        // Draw pending transactions with enhanced design
        this.pendingTransactions.slice(0, 3).forEach((tx, index) => {
            const x = startX + index * (txWidth + 25);
            const y = startY;
            
            // Transaction background with gradient
            const txGradient = this.ctx.createLinearGradient(x, y, x + txWidth, y + txHeight);
            txGradient.addColorStop(0, tx.color);
            txGradient.addColorStop(1, this.adjustColor(tx.color, -30));
            this.ctx.fillStyle = txGradient;
            this.ctx.fillRect(x, y, txWidth, txHeight);
            
            // Transaction border
            this.ctx.strokeStyle = '#fff';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(x, y, txWidth, txHeight);
            
            // Transaction content
            this.ctx.fillStyle = '#fff';
            this.ctx.font = 'bold 12px Inter';
            this.ctx.textAlign = 'left';
            this.ctx.fillText(`${tx.from} → ${tx.to}`, x + 10, y + 18);
            
            this.ctx.font = '11px Inter';
            this.ctx.fillText(`Amount: ${tx.amount}`, x + 10, y + 35);
            this.ctx.fillText(`Type: ${tx.type}`, x + 10, y + 50);
            this.ctx.fillText(`Fee: ${tx.fee}`, x + 10, y + 65);
            this.ctx.fillText(`Status: ${tx.status}`, x + 10, y + 80);
            
            // Show description if available
            if (tx.description) {
                this.ctx.font = '9px Inter';
                this.ctx.fillText(tx.description.substring(0, 20), x + 10, y + 95);
            }
        });
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
    
    drawStatistics() {
        const statsX = 50;
        const statsY = this.ctx.canvas.height - 160;
        
        // Statistics background with gradient
        const statsGradient = this.ctx.createLinearGradient(statsX, statsY, statsX, statsY + 130);
        statsGradient.addColorStop(0, 'rgba(0, 0, 0, 0.9)');
        statsGradient.addColorStop(1, 'rgba(0, 0, 0, 0.7)');
        this.ctx.fillStyle = statsGradient;
        this.ctx.fillRect(statsX, statsY, 320, 130);
        
        // Statistics border
        this.ctx.strokeStyle = '#2196F3';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(statsX, statsY, 320, 130);
        
        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 13px Inter';
        this.ctx.textAlign = 'left';
        
        this.ctx.fillText(`Blocks: ${this.totalBlocks}`, statsX + 15, statsY + 25);
        this.ctx.fillText(`Transactions: ${this.totalTransactions}`, statsX + 15, statsY + 45);
        this.ctx.fillText(`Pending: ${this.pendingTransactions.length}`, statsX + 15, statsY + 65);
        
        // Calculate and display dynamic difficulty
        const baseDifficulty = this.difficulty;
        const blockCount = this.blocks.length;
        const dynamicDifficulty = Math.min(8, baseDifficulty + Math.floor(blockCount / 5));
        this.ctx.fillText(`Difficulty: ${dynamicDifficulty}`, statsX + 15, statsY + 85);
        
        this.ctx.fillText(`Hashrate: ${this.networkHashrate} H/s`, statsX + 15, statsY + 105);
        this.ctx.fillText(`Miners: ${this.miners.length}`, statsX + 15, statsY + 125);
        
        // Add new statistics
        this.ctx.fillText(`Total Rewards: ${this.totalRewards.toFixed(1)}`, statsX + 15, statsY + 145);
        this.ctx.fillText(`Avg Block Time: ${(this.averageBlockTime / 1000).toFixed(1)}s`, statsX + 15, statsY + 165);
    }
    
    drawPhaseIndicator() {
        const phaseX = this.ctx.canvas.width - 220;
        const phaseY = 80;
        
        // Phase indicator background with gradient
        const phaseGradient = this.ctx.createLinearGradient(phaseX, phaseY, phaseX, phaseY + 90);
        phaseGradient.addColorStop(0, 'rgba(0, 0, 0, 0.9)');
        phaseGradient.addColorStop(1, 'rgba(0, 0, 0, 0.7)');
        this.ctx.fillStyle = phaseGradient;
        this.ctx.fillRect(phaseX, phaseY, 200, 90);
        
        // Phase indicator border
        this.ctx.strokeStyle = '#FF9800';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(phaseX, phaseY, 200, 90);
        
        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 14px Inter';
        this.ctx.textAlign = 'left';
        
        const phaseText = this.animationPhase.charAt(0).toUpperCase() + this.animationPhase.slice(1).replace('_', ' ');
        this.ctx.fillText(`Phase: ${phaseText}`, phaseX + 15, phaseY + 25);
        
        if (this.guidedMode && this.guidedBlock) {
            this.ctx.font = '12px Inter';
            this.ctx.fillText(`Step: ${this.currentStep + 1}/${this.phaseSteps.length}`, phaseX + 15, phaseY + 45);
            this.ctx.fillText(`Block: #${this.guidedBlock.index}`, phaseX + 15, phaseY + 60);
            this.ctx.fillText(`Time: ${this.phaseTime.toFixed(1)}s`, phaseX + 15, phaseY + 75);
        } else if (this.miningBlock) {
            this.ctx.font = '12px Inter';
            this.ctx.fillText(`Nonce: ${this.miningBlock.nonce}`, phaseX + 15, phaseY + 45);
            this.ctx.fillText(`Target: ${this.targetHash}`, phaseX + 15, phaseY + 60);
        }
    }
    
    render() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
        
        // Draw components
        this.drawBlockchain();
        this.drawNetwork();
        this.drawTransactions();
        this.drawParticles();
        this.drawPropagationArrows();
        this.drawStatistics();
        this.drawPhaseIndicator();
    }
    
    getStats() {
        // Calculate dynamic difficulty
        const baseDifficulty = this.difficulty;
        const blockCount = this.blocks.length;
        const dynamicDifficulty = Math.min(8, baseDifficulty + Math.floor(blockCount / 5));
        
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
            averageBlockTime: this.averageBlockTime / 1000
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
        this.guidedBlock = null;
        this.currentStep = 0;
        this.totalBlocks = 0;
        this.totalTransactions = 0;
        
        // Reset difficulty and target hash
        this.difficulty = 4;
        this.targetHash = '0'.repeat(this.difficulty);
        
        this.initializeBlockchain();
        this.initializeNetwork();
        this.startGenesisBlock();
    }
} 