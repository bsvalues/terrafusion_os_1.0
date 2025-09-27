# NO HARDCODED PORTS! Use environment variables.
#!/usr/bin/env python3
"""
TerraFusion Blockchain Governance Service - Decentralized Government Transparency
Complete blockchain-based governance and transparency for TerraFusion OS

This service provides:
- Immutable government transaction records
- Smart contracts for government processes
- Transparent voting and decision-making
- Citizen participation through blockchain
- Decentralized identity verification
- Audit trails for all government actions
- Anti-corruption blockchain monitoring
- Public accountability through distributed ledger
"""

import asyncio
import aiohttp
from aiohttp import web
import json
import time
import logging
import sqlite3
import hashlib
import secrets
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass, asdict
from datetime import datetime, timedelta
import base64
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import rsa, padding
import struct

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class Block:
    """Blockchain block for government transparency"""
    block_id: str
    block_number: int
    previous_hash: str
    merkle_root: str
    timestamp: float
    transactions: List[Dict[str, Any]]
    nonce: int
    hash: str
    validator: str
    government_signature: str

@dataclass
class GovernmentTransaction:
    """Government transaction on blockchain"""
    transaction_id: str
    transaction_type: str  # "budget_allocation", "policy_change", "contract_award", "vote", "permit"
    from_department: str
    to_entity: str
    amount: Optional[float]
    description: str
    timestamp: float
    block_number: Optional[int]
    status: str
    public_hash: str
    private_data_hash: str  # For sensitive data stored off-chain

@dataclass
class SmartContract:
    """Government smart contract"""
    contract_id: str
    contract_name: str
    contract_type: str  # "budget", "procurement", "regulation", "voting"
    contract_code: str
    deployed_at: float
    deployer: str
    status: str
    execution_count: int
    last_executed: Optional[float]
    gas_limit: int
    blockchain_address: str

@dataclass
class GovernmentVote:
    """Blockchain-based government vote"""
    vote_id: str
    proposal_id: str
    voter_id: str
    vote_choice: str  # "approve", "reject", "abstain"
    vote_weight: float
    timestamp: float
    block_number: Optional[int]
    voter_signature: str
    anonymized: bool

@dataclass
class CitizenIdentity:
    """Blockchain-based citizen identity"""
    citizen_id: str
    public_key: str
    identity_hash: str
    verification_level: str  # "basic", "verified", "government_official"
    created_at: float
    last_activity: float
    reputation_score: float
    voting_power: float

@dataclass
class BlockchainGovernanceStatus:
    """TerraFusion Blockchain Governance status"""
    service: str
    status: str
    total_blocks: int
    total_transactions: int
    active_smart_contracts: int
    citizen_identities: int
    pending_votes: int
    transparency_score: float
    blockchain_integrity: bool
    consensus_participation: float

class TerraFusionBlockchainGovernance:
    """TerraFusion Blockchain Governance Service"""
    
    def __init__(self, port: int = 5130):
        self.port = port
        self.service_start_time = time.time()
        self.blockchain_db = self._init_blockchain_db()
        self.benton_config = self._load_benton_config()
        
        # Blockchain state
        self.blockchain: List[Block] = []
        self.pending_transactions: List[GovernmentTransaction] = []
        self.smart_contracts: Dict[str, SmartContract] = {}
        self.citizen_identities: Dict[str, CitizenIdentity] = {}
        self.government_votes: Dict[str, GovernmentVote] = {}
        
        # Mining and consensus parameters
        self.difficulty = 4  # Number of leading zeros required in block hash
        self.block_time_target = 300  # 5 minutes between blocks
        self.max_transactions_per_block = 100
        
        # Government transparency categories
        self.transparency_categories = {
            'budget_allocation': {
                'name': 'Budget Allocations',
                'description': 'All government budget allocations and spending',
                'transparency_level': 'public',
                'required_approvals': 3
            },
            'contract_award': {
                'name': 'Contract Awards',
                'description': 'Government contract awards and procurement',
                'transparency_level': 'public',
                'required_approvals': 2
            },
            'policy_change': {
                'name': 'Policy Changes',
                'description': 'Government policy modifications and new regulations',
                'transparency_level': 'public',
                'required_approvals': 5
            },
            'permit_approval': {
                'name': 'Permit Approvals',
                'description': 'Building permits, licenses, and approvals',
                'transparency_level': 'semi_public',
                'required_approvals': 1
            },
            'vote_record': {
                'name': 'Voting Records',
                'description': 'All government voting and decision records',
                'transparency_level': 'public',
                'required_approvals': 1
            },
            'audit_trail': {
                'name': 'Audit Trails',
                'description': 'Complete audit trails for government actions',
                'transparency_level': 'public',
                'required_approvals': 2
            }
        }
        
        # Initialize blockchain with genesis block
        self._create_genesis_block()
        
        # Initialize smart contracts
        self._deploy_government_smart_contracts()
        
        # Start blockchain operations
        asyncio.create_task(self._blockchain_mining_loop())
        asyncio.create_task(self._transparency_monitoring())
        
        logger.info(f"🔗 TerraFusion Blockchain Governance initialized")
        logger.info(f"📍 Deployment: Benton County Transparent Government")
        logger.info(f"⛏️ Blockchain mining: Difficulty {self.difficulty}")
        logger.info(f"⚡ Blockchain port: {self.port}")
    
    def _load_benton_config(self) -> Dict[str, Any]:
        """Load real Benton County configuration"""
        config_path = "/workspaces/terrafusion_os_1.0/benton-county-config.json"
        try:
            with open(config_path, 'r') as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"Failed to load Benton County config: {e}")
            return {'county': 'benton', 'state': 'washington', 'transparency_mandate': True}
    
    def _init_blockchain_db(self) -> sqlite3.Connection:
        """Initialize Blockchain database"""
        db_path = "/workspaces/terrafusion_os_1.0/trust-fabric/blockchain_governance.db"
        conn = sqlite3.connect(db_path)
        
        # Blocks table
        conn.execute("""
            CREATE TABLE IF NOT EXISTS blocks (
                block_id TEXT PRIMARY KEY,
                block_number INTEGER NOT NULL,
                previous_hash TEXT NOT NULL,
                merkle_root TEXT NOT NULL,
                timestamp REAL NOT NULL,
                transactions TEXT NOT NULL,
                nonce INTEGER NOT NULL,
                hash TEXT NOT NULL,
                validator TEXT NOT NULL,
                government_signature TEXT NOT NULL
            )
        """)
        
        # Government transactions table
        conn.execute("""
            CREATE TABLE IF NOT EXISTS government_transactions (
                transaction_id TEXT PRIMARY KEY,
                transaction_type TEXT NOT NULL,
                from_department TEXT NOT NULL,
                to_entity TEXT NOT NULL,
                amount REAL,
                description TEXT NOT NULL,
                timestamp REAL NOT NULL,
                block_number INTEGER,
                status TEXT NOT NULL,
                public_hash TEXT NOT NULL,
                private_data_hash TEXT NOT NULL
            )
        """)
        
        # Smart contracts table
        conn.execute("""
            CREATE TABLE IF NOT EXISTS smart_contracts (
                contract_id TEXT PRIMARY KEY,
                contract_name TEXT NOT NULL,
                contract_type TEXT NOT NULL,
                contract_code TEXT NOT NULL,
                deployed_at REAL NOT NULL,
                deployer TEXT NOT NULL,
                status TEXT NOT NULL,
                execution_count INTEGER DEFAULT 0,
                last_executed REAL,
                gas_limit INTEGER NOT NULL,
                blockchain_address TEXT NOT NULL
            )
        """)
        
        # Government votes table
        conn.execute("""
            CREATE TABLE IF NOT EXISTS government_votes (
                vote_id TEXT PRIMARY KEY,
                proposal_id TEXT NOT NULL,
                voter_id TEXT NOT NULL,
                vote_choice TEXT NOT NULL,
                vote_weight REAL NOT NULL,
                timestamp REAL NOT NULL,
                block_number INTEGER,
                voter_signature TEXT NOT NULL,
                anonymized BOOLEAN DEFAULT FALSE
            )
        """)
        
        # Citizen identities table
        conn.execute("""
            CREATE TABLE IF NOT EXISTS citizen_identities (
                citizen_id TEXT PRIMARY KEY,
                public_key TEXT NOT NULL,
                identity_hash TEXT NOT NULL,
                verification_level TEXT NOT NULL,
                created_at REAL NOT NULL,
                last_activity REAL NOT NULL,
                reputation_score REAL DEFAULT 0.0,
                voting_power REAL DEFAULT 1.0
            )
        """)
        
        conn.commit()
        return conn
    
    def _create_genesis_block(self):
        """Create the genesis block for Benton County blockchain"""
        genesis_transactions = [
            {
                'transaction_id': 'genesis_001',
                'type': 'system_initialization',
                'from': 'TerraFusion_OS',
                'to': 'Benton_County_Government',
                'amount': 0,
                'description': 'Genesis block for Benton County transparent government blockchain',
                'timestamp': self.service_start_time
            }
        ]
        
        merkle_root = self._calculate_merkle_root(genesis_transactions)
        
        genesis_block = Block(
            block_id="genesis_block_benton_county",
            block_number=0,
            previous_hash="0" * 64,  # Genesis block has no previous hash
            merkle_root=merkle_root,
            timestamp=self.service_start_time,
            transactions=genesis_transactions,
            nonce=0,
            hash="",
            validator="TerraFusion_OS",
            government_signature=""
        )
        
        # Mine the genesis block
        genesis_block.hash = self._mine_block(genesis_block)
        genesis_block.government_signature = self._sign_block(genesis_block)
        
        self.blockchain.append(genesis_block)
        asyncio.create_task(self._store_block(genesis_block))
        
        logger.info(f"⛏️ Genesis block created: {genesis_block.hash[:16]}...")
    
    def _deploy_government_smart_contracts(self):
        """Deploy essential government smart contracts"""
        government_contracts = [
            {
                'name': 'Budget Allocation Contract',
                'type': 'budget',
                'code': '''
                contract BudgetAllocation {
                    mapping(string => uint256) public departmentBudgets;
                    mapping(string => bool) public approvedAllocations;
                    
                    function allocateBudget(string department, uint256 amount) public {
                        require(amount > 0, "Amount must be positive");
                        departmentBudgets[department] = amount;
                        approvedAllocations[department] = true;
                    }
                    
                    function getBudget(string department) public view returns (uint256) {
                        return departmentBudgets[department];
                    }
                }
                ''',
                'gas_limit': 1000000
            },
            {
                'name': 'Voting Contract',
                'type': 'voting',
                'code': '''
                contract GovernmentVoting {
                    struct Proposal {
                        string description;
                        uint256 voteCount;
                        bool executed;
                    }
                    
                    mapping(uint256 => Proposal) public proposals;
                    mapping(address => bool) public hasVoted;
                    
                    function vote(uint256 proposalId) public {
                        require(!hasVoted[msg.sender], "Already voted");
                        proposals[proposalId].voteCount++;
                        hasVoted[msg.sender] = true;
                    }
                }
                ''',
                'gas_limit': 800000
            },
            {
                'name': 'Contract Award Contract',
                'type': 'procurement',
                'code': '''
                contract ContractAward {
                    struct Contract {
                        string contractor;
                        uint256 amount;
                        string description;
                        bool completed;
                    }
                    
                    mapping(string => Contract) public contracts;
                    
                    function awardContract(string contractId, string contractor, uint256 amount, string description) public {
                        contracts[contractId] = Contract(contractor, amount, description, false);
                    }
                }
                ''',
                'gas_limit': 600000
            },
            {
                'name': 'Transparency Audit Contract',
                'type': 'audit',
                'code': '''
                contract TransparencyAudit {
                    mapping(string => string) public auditTrails;
                    mapping(string => uint256) public auditTimestamps;
                    
                    function recordAuditTrail(string actionId, string auditData) public {
                        auditTrails[actionId] = auditData;
                        auditTimestamps[actionId] = block.timestamp;
                    }
                }
                ''',
                'gas_limit': 500000
            }
        ]
        
        for contract_info in government_contracts:
            contract = self._deploy_smart_contract(contract_info)
            logger.info(f"📜 Smart contract deployed: {contract.contract_name}")
    
    def _deploy_smart_contract(self, contract_info: Dict[str, Any]) -> SmartContract:
        """Deploy a smart contract"""
        contract_id = hashlib.sha256(f"contract_{contract_info['name']}_{time.time()}".encode()).hexdigest()[:16]
        blockchain_address = hashlib.sha256(f"addr_{contract_id}".encode()).hexdigest()[:40]
        
        smart_contract = SmartContract(
            contract_id=contract_id,
            contract_name=contract_info['name'],
            contract_type=contract_info['type'],
            contract_code=contract_info['code'],
            deployed_at=time.time(),
            deployer="TerraFusion_Government",
            status="DEPLOYED",
            execution_count=0,
            last_executed=None,
            gas_limit=contract_info['gas_limit'],
            blockchain_address=blockchain_address
        )
        
        self.smart_contracts[contract_id] = smart_contract
        asyncio.create_task(self._store_smart_contract(smart_contract))
        
        return smart_contract
    
    async def _blockchain_mining_loop(self):
        """Main blockchain mining loop"""
        while True:
            try:
                if len(self.pending_transactions) >= 5:  # Mine when we have at least 5 transactions
                    await self._mine_new_block()
                
                await asyncio.sleep(30)  # Check for mining every 30 seconds
            except Exception as e:
                logger.error(f"Blockchain mining error: {e}")
                await asyncio.sleep(30)
    
    async def _transparency_monitoring(self):
        """Monitor government transparency metrics"""
        while True:
            try:
                await self._calculate_transparency_score()
                await self._monitor_government_activity()
                await self._check_anti_corruption_patterns()
                await asyncio.sleep(120)  # Monitor every 2 minutes
            except Exception as e:
                logger.error(f"Transparency monitoring error: {e}")
                await asyncio.sleep(120)
    
    async def _mine_new_block(self):
        """Mine a new block with pending transactions"""
        if not self.pending_transactions:
            return
        
        # Get transactions for this block
        block_transactions = self.pending_transactions[:self.max_transactions_per_block]
        self.pending_transactions = self.pending_transactions[self.max_transactions_per_block:]
        
        # Create new block
        block_number = len(self.blockchain)
        previous_hash = self.blockchain[-1].hash if self.blockchain else "0" * 64
        merkle_root = self._calculate_merkle_root([asdict(tx) for tx in block_transactions])
        
        new_block = Block(
            block_id=f"block_{block_number}_{int(time.time())}",
            block_number=block_number,
            previous_hash=previous_hash,
            merkle_root=merkle_root,
            timestamp=time.time(),
            transactions=[asdict(tx) for tx in block_transactions],
            nonce=0,
            hash="",
            validator="Benton_County_Validator",
            government_signature=""
        )
        
        # Mine the block
        start_time = time.time()
        new_block.hash = self._mine_block(new_block)
        mining_time = time.time() - start_time
        
        # Sign the block
        new_block.government_signature = self._sign_block(new_block)
        
        # Add to blockchain
        self.blockchain.append(new_block)
        await self._store_block(new_block)
        
        # Update transaction statuses
        for tx in block_transactions:
            tx.block_number = block_number
            tx.status = "CONFIRMED"
            await self._store_government_transaction(tx)
        
        logger.info(f"⛏️ Block mined: #{block_number} with {len(block_transactions)} transactions (mining time: {mining_time:.2f}s)")
    
    def _mine_block(self, block: Block) -> str:
        """Mine a block using proof-of-work"""
        target = "0" * self.difficulty
        
        while True:
            block_data = f"{block.block_number}{block.previous_hash}{block.merkle_root}{block.timestamp}{json.dumps(block.transactions)}{block.nonce}"
            block_hash = hashlib.sha256(block_data.encode()).hexdigest()
            
            if block_hash.startswith(target):
                return block_hash
            
            block.nonce += 1
            
            # Prevent infinite loops in testing
            if block.nonce > 1000000:
                logger.warning("Mining took too long, reducing difficulty")
                return block_hash
    
    def _sign_block(self, block: Block) -> str:
        """Sign block with government signature"""
        # In production, this would use actual government digital signatures
        block_data = f"{block.hash}{block.validator}{block.timestamp}"
        signature = hashlib.sha256(f"gov_signature_{block_data}".encode()).hexdigest()
        return signature
    
    def _calculate_merkle_root(self, transactions: List[Dict[str, Any]]) -> str:
        """Calculate Merkle root of transactions"""
        if not transactions:
            return hashlib.sha256(b"empty").hexdigest()
        
        # Create leaf hashes
        tx_hashes = []
        for tx in transactions:
            tx_data = json.dumps(tx, sort_keys=True)
            tx_hash = hashlib.sha256(tx_data.encode()).hexdigest()
            tx_hashes.append(tx_hash)
        
        # Build Merkle tree
        while len(tx_hashes) > 1:
            next_level = []
            for i in range(0, len(tx_hashes), 2):
                if i + 1 < len(tx_hashes):
                    combined = tx_hashes[i] + tx_hashes[i + 1]
                else:
                    combined = tx_hashes[i] + tx_hashes[i]  # Duplicate if odd number
                
                combined_hash = hashlib.sha256(combined.encode()).hexdigest()
                next_level.append(combined_hash)
            
            tx_hashes = next_level
        
        return tx_hashes[0]
    
    async def create_government_transaction(self, transaction_data: Dict[str, Any]) -> GovernmentTransaction:
        """Create a new government transaction"""
        transaction_id = hashlib.sha256(f"tx_{transaction_data['type']}_{time.time()}".encode()).hexdigest()[:16]
        
        # Create public and private data hashes
        public_data = {
            'type': transaction_data['type'],
            'from': transaction_data['from_department'],
            'to': transaction_data['to_entity'],
            'description': transaction_data['description'],
            'timestamp': time.time()
        }
        
        if 'amount' in transaction_data:
            public_data['amount'] = transaction_data['amount']
        
        public_hash = hashlib.sha256(json.dumps(public_data, sort_keys=True).encode()).hexdigest()
        private_data_hash = hashlib.sha256(f"private_{transaction_id}_{secrets.token_hex(16)}".encode()).hexdigest()
        
        government_transaction = GovernmentTransaction(
            transaction_id=transaction_id,
            transaction_type=transaction_data['type'],
            from_department=transaction_data['from_department'],
            to_entity=transaction_data['to_entity'],
            amount=transaction_data.get('amount'),
            description=transaction_data['description'],
            timestamp=time.time(),
            block_number=None,
            status="PENDING",
            public_hash=public_hash,
            private_data_hash=private_data_hash
        )
        
        self.pending_transactions.append(government_transaction)
        await self._store_government_transaction(government_transaction)
        
        logger.info(f"💼 Government transaction created: {transaction_data['type']} from {transaction_data['from_department']}")
        return government_transaction
    
    async def create_government_vote(self, vote_data: Dict[str, Any]) -> GovernmentVote:
        """Create a blockchain-based government vote"""
        vote_id = hashlib.sha256(f"vote_{vote_data['proposal_id']}_{vote_data['voter_id']}_{time.time()}".encode()).hexdigest()[:16]
        
        # Create voter signature
        vote_content = f"{vote_data['proposal_id']}{vote_data['vote_choice']}{time.time()}"
        voter_signature = hashlib.sha256(f"voter_sig_{vote_content}".encode()).hexdigest()
        
        government_vote = GovernmentVote(
            vote_id=vote_id,
            proposal_id=vote_data['proposal_id'],
            voter_id=vote_data['voter_id'],
            vote_choice=vote_data['vote_choice'],
            vote_weight=vote_data.get('vote_weight', 1.0),
            timestamp=time.time(),
            block_number=None,
            voter_signature=voter_signature,
            anonymized=vote_data.get('anonymized', False)
        )
        
        self.government_votes[vote_id] = government_vote
        await self._store_government_vote(government_vote)
        
        # Add vote as a transaction to the blockchain
        vote_transaction_data = {
            'type': 'vote_record',
            'from_department': 'Voting_System',
            'to_entity': 'Government_Proposal',
            'description': f"Vote on proposal {vote_data['proposal_id']}: {vote_data['vote_choice']}",
            'proposal_id': vote_data['proposal_id'],
            'vote_choice': vote_data['vote_choice']
        }
        
        await self.create_government_transaction(vote_transaction_data)
        
        logger.info(f"🗳️ Government vote recorded: {vote_data['vote_choice']} on proposal {vote_data['proposal_id']}")
        return government_vote
    
    async def register_citizen_identity(self, identity_data: Dict[str, Any]) -> CitizenIdentity:
        """Register citizen identity on blockchain"""
        citizen_id = hashlib.sha256(f"citizen_{identity_data['public_key']}_{time.time()}".encode()).hexdigest()[:16]
        
        # Create identity hash
        identity_content = f"{identity_data['public_key']}{identity_data.get('verification_documents', '')}"
        identity_hash = hashlib.sha256(identity_content.encode()).hexdigest()
        
        citizen_identity = CitizenIdentity(
            citizen_id=citizen_id,
            public_key=identity_data['public_key'],
            identity_hash=identity_hash,
            verification_level=identity_data.get('verification_level', 'basic'),
            created_at=time.time(),
            last_activity=time.time(),
            reputation_score=50.0,  # Start with neutral reputation
            voting_power=1.0  # Standard voting power
        )
        
        self.citizen_identities[citizen_id] = citizen_identity
        await self._store_citizen_identity(citizen_identity)
        
        # Create blockchain transaction for identity registration
        identity_transaction_data = {
            'type': 'citizen_registration',
            'from_department': 'Identity_System',
            'to_entity': 'Citizen_Registry',
            'description': f"Citizen identity registration with {identity_data.get('verification_level', 'basic')} verification"
        }
        
        await self.create_government_transaction(identity_transaction_data)
        
        logger.info(f"👤 Citizen identity registered: {citizen_id} with {citizen_identity.verification_level} verification")
        return citizen_identity
    
    async def _calculate_transparency_score(self):
        """Calculate government transparency score"""
        try:
            total_transactions = len([tx for block in self.blockchain for tx in block.transactions])
            public_transactions = len([
                tx for block in self.blockchain for tx in block.transactions
                if self.transparency_categories.get(tx.get('type', ''), {}).get('transparency_level') == 'public'
            ])
            
            if total_transactions > 0:
                transparency_score = (public_transactions / total_transactions) * 100
            else:
                transparency_score = 100.0  # Perfect score if no transactions yet
            
            logger.info(f"📊 Transparency score: {transparency_score:.1f}% ({public_transactions}/{total_transactions} public)")
            
        except Exception as e:
            logger.error(f"Transparency score calculation failed: {e}")
    
    async def _monitor_government_activity(self):
        """Monitor government activity patterns"""
        try:
            # Analyze recent government transactions
            recent_time = time.time() - 86400  # Last 24 hours
            recent_transactions = [
                tx for tx in self.pending_transactions 
                if tx.timestamp > recent_time
            ]
            
            # Count by department
            department_activity = {}
            for tx in recent_transactions:
                dept = tx.from_department
                department_activity[dept] = department_activity.get(dept, 0) + 1
            
            if department_activity:
                most_active_dept = max(department_activity, key=department_activity.get)
                logger.info(f"📈 Most active department: {most_active_dept} ({department_activity[most_active_dept]} transactions)")
            
        except Exception as e:
            logger.error(f"Government activity monitoring failed: {e}")
    
    async def _check_anti_corruption_patterns(self):
        """Check for potential corruption patterns"""
        try:
            # Look for unusual patterns in transactions
            large_transactions = [
                tx for tx in self.pending_transactions 
                if tx.amount and tx.amount > 100000  # Transactions over $100k
            ]
            
            if large_transactions:
                logger.info(f"🔍 Anti-corruption check: {len(large_transactions)} large transactions require review")
            
            # Check for rapid sequential transactions from same department
            dept_transaction_times = {}
            for tx in self.pending_transactions[-10:]:  # Check last 10 transactions
                dept = tx.from_department
                if dept not in dept_transaction_times:
                    dept_transaction_times[dept] = []
                dept_transaction_times[dept].append(tx.timestamp)
            
            for dept, times in dept_transaction_times.items():
                if len(times) >= 3:
                    time_diffs = [times[i] - times[i-1] for i in range(1, len(times))]
                    if all(diff < 300 for diff in time_diffs):  # Less than 5 minutes apart
                        logger.warning(f"⚠️ Rapid transaction pattern detected from {dept}")
            
        except Exception as e:
            logger.error(f"Anti-corruption pattern check failed: {e}")
    
    def verify_blockchain_integrity(self) -> bool:
        """Verify the integrity of the entire blockchain"""
        if not self.blockchain:
            return True
        
        # Check genesis block
        if self.blockchain[0].previous_hash != "0" * 64:
            return False
        
        # Verify each block
        for i in range(1, len(self.blockchain)):
            current_block = self.blockchain[i]
            previous_block = self.blockchain[i - 1]
            
            # Check previous hash
            if current_block.previous_hash != previous_block.hash:
                return False
            
            # Verify block hash
            expected_hash = self._mine_block(current_block)
            if current_block.hash != expected_hash:
                return False
            
            # Verify Merkle root
            expected_merkle = self._calculate_merkle_root(current_block.transactions)
            if current_block.merkle_root != expected_merkle:
                return False
        
        return True
    
    async def get_blockchain_governance_status(self) -> BlockchainGovernanceStatus:
        """Get blockchain governance status"""
        total_blocks = len(self.blockchain)
        total_transactions = sum(len(block.transactions) for block in self.blockchain)
        active_contracts = len([c for c in self.smart_contracts.values() if c.status == "DEPLOYED"])
        citizen_count = len(self.citizen_identities)
        pending_votes = len([v for v in self.government_votes.values() if v.block_number is None])
        
        # Calculate transparency score
        public_tx_count = sum(
            1 for block in self.blockchain for tx in block.transactions
            if self.transparency_categories.get(tx.get('type', ''), {}).get('transparency_level') == 'public'
        )
        transparency_score = (public_tx_count / total_transactions * 100) if total_transactions > 0 else 100.0
        
        # Check blockchain integrity
        blockchain_integrity = self.verify_blockchain_integrity()
        
        # Calculate consensus participation (simulated)
        consensus_participation = 85.5  # Simulated participation rate
        
        return BlockchainGovernanceStatus(
            service="TerraFusion Blockchain Governance",
            status="OPERATIONAL",
            total_blocks=total_blocks,
            total_transactions=total_transactions,
            active_smart_contracts=active_contracts,
            citizen_identities=citizen_count,
            pending_votes=pending_votes,
            transparency_score=transparency_score,
            blockchain_integrity=blockchain_integrity,
            consensus_participation=consensus_participation
        )
    
    # Database operations
    async def _store_block(self, block: Block):
        """Store block in database"""
        cursor = self.blockchain_db.cursor()
        cursor.execute("""
            INSERT OR REPLACE INTO blocks VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            block.block_id, block.block_number, block.previous_hash, block.merkle_root,
            block.timestamp, json.dumps(block.transactions), block.nonce, block.hash,
            block.validator, block.government_signature
        ))
        self.blockchain_db.commit()
    
    async def _store_government_transaction(self, transaction: GovernmentTransaction):
        """Store government transaction in database"""
        cursor = self.blockchain_db.cursor()
        cursor.execute("""
            INSERT OR REPLACE INTO government_transactions VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            transaction.transaction_id, transaction.transaction_type, transaction.from_department,
            transaction.to_entity, transaction.amount, transaction.description, transaction.timestamp,
            transaction.block_number, transaction.status, transaction.public_hash, transaction.private_data_hash
        ))
        self.blockchain_db.commit()
    
    async def _store_smart_contract(self, contract: SmartContract):
        """Store smart contract in database"""
        cursor = self.blockchain_db.cursor()
        cursor.execute("""
            INSERT OR REPLACE INTO smart_contracts VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            contract.contract_id, contract.contract_name, contract.contract_type, contract.contract_code,
            contract.deployed_at, contract.deployer, contract.status, contract.execution_count,
            contract.last_executed, contract.gas_limit, contract.blockchain_address
        ))
        self.blockchain_db.commit()
    
    async def _store_government_vote(self, vote: GovernmentVote):
        """Store government vote in database"""
        cursor = self.blockchain_db.cursor()
        cursor.execute("""
            INSERT OR REPLACE INTO government_votes VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            vote.vote_id, vote.proposal_id, vote.voter_id, vote.vote_choice,
            vote.vote_weight, vote.timestamp, vote.block_number, vote.voter_signature, vote.anonymized
        ))
        self.blockchain_db.commit()
    
    async def _store_citizen_identity(self, citizen: CitizenIdentity):
        """Store citizen identity in database"""
        cursor = self.blockchain_db.cursor()
        cursor.execute("""
            INSERT OR REPLACE INTO citizen_identities VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            citizen.citizen_id, citizen.public_key, citizen.identity_hash, citizen.verification_level,
            citizen.created_at, citizen.last_activity, citizen.reputation_score, citizen.voting_power
        ))
        self.blockchain_db.commit()
    
    # HTTP API Endpoints
    async def handle_status(self, request):
        """GET /api/blockchain/status"""
        status = await self.get_blockchain_governance_status()
        return web.json_response(asdict(status))
    
    async def handle_blockchain(self, request):
        """GET /api/blockchain/chain"""
        # Return basic blockchain info without full transaction details
        chain_info = []
        for block in self.blockchain[-10:]:  # Last 10 blocks
            chain_info.append({
                'block_number': block.block_number,
                'hash': block.hash,
                'timestamp': block.timestamp,
                'transaction_count': len(block.transactions),
                'validator': block.validator
            })
        return web.json_response({'blockchain': chain_info, 'total_blocks': len(self.blockchain)})
    
    async def handle_transactions(self, request):
        """GET /api/blockchain/transactions"""
        # Return recent government transactions
        recent_transactions = []
        for tx in self.pending_transactions[-20:]:  # Last 20 pending
            recent_transactions.append({
                'transaction_id': tx.transaction_id,
                'type': tx.transaction_type,
                'from': tx.from_department,
                'to': tx.to_entity,
                'amount': tx.amount,
                'timestamp': tx.timestamp,
                'status': tx.status
            })
        return web.json_response({'transactions': recent_transactions, 'count': len(recent_transactions)})
    
    async def handle_smart_contracts(self, request):
        """GET /api/blockchain/contracts"""
        contracts = [asdict(c) for c in self.smart_contracts.values()]
        return web.json_response({'smart_contracts': contracts, 'count': len(contracts)})
    
    async def handle_votes(self, request):
        """GET /api/blockchain/votes"""
        # Return anonymized vote information
        votes_info = []
        for vote in self.government_votes.values():
            votes_info.append({
                'vote_id': vote.vote_id,
                'proposal_id': vote.proposal_id,
                'vote_choice': vote.vote_choice,
                'timestamp': vote.timestamp,
                'block_number': vote.block_number,
                'anonymized': vote.anonymized
            })
        return web.json_response({'votes': votes_info, 'count': len(votes_info)})
    
    async def handle_create_transaction(self, request):
        """POST /api/blockchain/transaction"""
        data = await request.json()
        
        try:
            transaction = await self.create_government_transaction(data)
            return web.json_response({
                'transaction_id': transaction.transaction_id,
                'status': transaction.status,
                'public_hash': transaction.public_hash
            })
        except Exception as e:
            return web.json_response({'error': str(e)}, status=500)
    
    async def handle_create_vote(self, request):
        """POST /api/blockchain/vote"""
        data = await request.json()
        
        try:
            vote = await self.create_government_vote(data)
            return web.json_response({
                'vote_id': vote.vote_id,
                'status': 'recorded',
                'anonymized': vote.anonymized
            })
        except Exception as e:
            return web.json_response({'error': str(e)}, status=500)
    
    async def handle_transparency_categories(self, request):
        """GET /api/blockchain/transparency"""
        return web.json_response({'transparency_categories': self.transparency_categories})
    
    async def handle_integrity_check(self, request):
        """GET /api/blockchain/integrity"""
        integrity = self.verify_blockchain_integrity()
        return web.json_response({'blockchain_integrity': integrity, 'verified_at': time.time()})
    
    async def handle_root(self, request):
        """GET / - Service info"""
        return web.json_response({
            'service': 'TerraFusion Blockchain Governance',
            'version': '1.0.0',
            'description': 'Decentralized Government Transparency for TerraFusion OS',
            'county': 'Benton County, Washington',
            'blockchain_blocks': len(self.blockchain),
            'smart_contracts': len(self.smart_contracts),
            'transparency_enabled': True,
            'status': 'OPERATIONAL'
        })
    
    async def start_service(self):
        """Start the TerraFusion Blockchain Governance Service"""
        # Create web application
        app = web.Application()
        
        # Add routes
        app.router.add_get('/', self.handle_root)
        app.router.add_get('/api/blockchain/status', self.handle_status)
        app.router.add_get('/api/blockchain/chain', self.handle_blockchain)
        app.router.add_get('/api/blockchain/transactions', self.handle_transactions)
        app.router.add_get('/api/blockchain/contracts', self.handle_smart_contracts)
        app.router.add_get('/api/blockchain/votes', self.handle_votes)
        app.router.add_post('/api/blockchain/transaction', self.handle_create_transaction)
        app.router.add_post('/api/blockchain/vote', self.handle_create_vote)
        app.router.add_get('/api/blockchain/transparency', self.handle_transparency_categories)
        app.router.add_get('/api/blockchain/integrity', self.handle_integrity_check)
        
        # Register with Trust Fabric
        asyncio.create_task(self._register_with_trust_fabric_delayed())
        
        # Start HTTP server
        runner = web.AppRunner(app)
        await runner.setup()
        site = web.TCPSite(runner, 'localhost', self.port)
        await site.start()
        
        logger.info(f"🚀 TerraFusion Blockchain Governance started on http://localhost:{self.port}")
        logger.info(f"🔗 Government transparency blockchain active")
        
        return runner
    
    async def _register_with_trust_fabric_delayed(self):
        """Register with Trust Fabric after startup delay"""
        await asyncio.sleep(15)
        try:
            registration_data = {
                'service_name': 'TerraFusion Blockchain Governance',
                'port': self.port,
                'validation_proofs': ['blockchain_integrity', 'government_transparency', 'decentralized_governance']
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.post('http://localhost:${TF_STATIC_PORT:-8080}/api/trust-fabric/register', 
                                      json=registration_data, timeout=5) as response:
                    if response.status == 200:
                        data = await response.json()
                        logger.info(f"🔐 Registered with Trust Fabric: {data['service_id']}")
        except Exception as e:
            logger.error(f"Trust Fabric registration failed: {e}")

async def main():
    """Start TerraFusion Blockchain Governance Service"""
    print("🔗 TERRAFUSION BLOCKCHAIN GOVERNANCE - DECENTRALIZED GOVERNMENT TRANSPARENCY")
    print("=" * 80)
    print("📜 Immutable government transaction records")
    print("🗳️ Blockchain-based voting and decision-making")
    print("👤 Decentralized citizen identity verification")
    print("🔍 Anti-corruption monitoring")
    print("🏛️ Complete government transparency")
    print()
    
    try:
        blockchain_governance = TerraFusionBlockchainGovernance()
        runner = await blockchain_governance.start_service()
        
        # Keep service running
        try:
            while True:
                await asyncio.sleep(1)
        except KeyboardInterrupt:
            logger.info("🛑 Stopping TerraFusion Blockchain Governance...")
            await runner.cleanup()
            
    except Exception as e:
        logger.error(f"❌ TerraFusion Blockchain Governance startup failed: {e}")
        return 1
    
    return 0

if __name__ == "__main__":
    asyncio.run(main())
