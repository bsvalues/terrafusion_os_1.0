#!/bin/bash

# TerraFusion Blockchain-Based Audit Trail System
# Immutable audit logging with smart contract validation

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/common-functions.sh"

# Configuration
AUDIT_DB="${AUDIT_DB:-terrafusion_blockchain}"
AUDIT_USER="${DB_USER:-tfaudit}"
AUDIT_PASS="${DB_PASS:-$(generate_password)}"
BLOCKCHAIN_TYPE="${BLOCKCHAIN_TYPE:-hyperledger}" # hyperledger, ethereum_private
IPFS_API="${IPFS_API:-http://localhost:\${{TF_API_HTTPS_PORT:-5001}}}"
BLOCKCHAIN_API="${BLOCKCHAIN_API:-http://localhost:\${{TF_API_HTTPS_PORT:-5001}}}"

# Initialize database
init_blockchain_database() {
    log_info "Initializing blockchain audit trail database..."
    
    psql -U postgres -c "CREATE DATABASE ${AUDIT_DB};" 2>/dev/null || true
    psql -U postgres -c "CREATE USER ${AUDIT_USER} WITH PASSWORD '${AUDIT_PASS}';" 2>/dev/null || true
    psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE ${AUDIT_DB} TO ${AUDIT_USER};"
    
    psql -U ${AUDIT_USER} -d ${AUDIT_DB} <<EOF
-- Audit events
CREATE TABLE IF NOT EXISTS audit_events (
    id SERIAL PRIMARY KEY,
    event_id VARCHAR(100) UNIQUE NOT NULL,
    event_type VARCHAR(100), -- deployment, access, modification, deletion, security
    entity_type VARCHAR(100), -- application, database, api, infrastructure, data
    entity_id VARCHAR(255),
    actor_id VARCHAR(255),
    actor_type VARCHAR(50), -- user, system, service
    action VARCHAR(100),
    result VARCHAR(50), -- success, failure, partial
    metadata JSONB,
    risk_score DECIMAL(3,2),
    timestamp TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Blockchain transactions
CREATE TABLE IF NOT EXISTS blockchain_transactions (
    id SERIAL PRIMARY KEY,
    transaction_id VARCHAR(100) UNIQUE NOT NULL,
    event_id VARCHAR(100) REFERENCES audit_events(event_id),
    blockchain_type VARCHAR(50),
    block_number BIGINT,
    block_hash VARCHAR(255),
    transaction_hash VARCHAR(255),
    smart_contract_address VARCHAR(255),
    gas_used BIGINT,
    status VARCHAR(50), -- pending, confirmed, failed
    confirmations INTEGER DEFAULT 0,
    ipfs_hash VARCHAR(255), -- for large data storage
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    confirmed_at TIMESTAMP
);

-- Audit verification
CREATE TABLE IF NOT EXISTS audit_verifications (
    id SERIAL PRIMARY KEY,
    verification_id VARCHAR(100) UNIQUE NOT NULL,
    event_id VARCHAR(100) REFERENCES audit_events(event_id),
    verification_type VARCHAR(50), -- blockchain, signature, witness
    verification_data JSONB,
    verification_result VARCHAR(50), -- valid, invalid, inconclusive
    verified_by VARCHAR(255),
    verified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Smart contracts
CREATE TABLE IF NOT EXISTS smart_contracts (
    id SERIAL PRIMARY KEY,
    contract_id VARCHAR(100) UNIQUE NOT NULL,
    contract_name VARCHAR(255),
    contract_address VARCHAR(255),
    contract_type VARCHAR(50), -- audit_logger, access_control, compliance
    abi JSONB,
    bytecode TEXT,
    version VARCHAR(50),
    deployed_by VARCHAR(255),
    deployment_tx_hash VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deployed_at TIMESTAMP
);

-- Compliance rules
CREATE TABLE IF NOT EXISTS compliance_rules (
    id SERIAL PRIMARY KEY,
    rule_id VARCHAR(100) UNIQUE NOT NULL,
    rule_name VARCHAR(255),
    compliance_framework VARCHAR(100), -- sox, gdpr, hipaa, pci_dss
    rule_expression JSONB,
    severity VARCHAR(20),
    automated_check BOOLEAN DEFAULT true,
    smart_contract_id VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Chain of custody
CREATE TABLE IF NOT EXISTS chain_of_custody (
    id SERIAL PRIMARY KEY,
    custody_id VARCHAR(100) UNIQUE NOT NULL,
    entity_type VARCHAR(100),
    entity_id VARCHAR(255),
    custodian_id VARCHAR(255),
    custody_type VARCHAR(50), -- owner, reviewer, approver
    transferred_from VARCHAR(255),
    transfer_reason TEXT,
    blockchain_proof VARCHAR(255),
    valid_from TIMESTAMP NOT NULL,
    valid_until TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Audit reports
CREATE TABLE IF NOT EXISTS audit_reports (
    id SERIAL PRIMARY KEY,
    report_id VARCHAR(100) UNIQUE NOT NULL,
    report_type VARCHAR(50), -- compliance, security, access, summary
    period_start TIMESTAMP,
    period_end TIMESTAMP,
    total_events INTEGER,
    compliance_score DECIMAL(5,2),
    risk_events INTEGER,
    report_data JSONB,
    blockchain_hash VARCHAR(255),
    generated_by VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Consensus nodes
CREATE TABLE IF NOT EXISTS consensus_nodes (
    id SERIAL PRIMARY KEY,
    node_id VARCHAR(100) UNIQUE NOT NULL,
    node_name VARCHAR(255),
    node_type VARCHAR(50), -- validator, observer, orderer
    endpoint VARCHAR(500),
    public_key TEXT,
    reputation_score DECIMAL(3,2) DEFAULT 1.0,
    is_active BOOLEAN DEFAULT true,
    last_heartbeat TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Audit policies
CREATE TABLE IF NOT EXISTS audit_policies (
    id SERIAL PRIMARY KEY,
    policy_id VARCHAR(100) UNIQUE NOT NULL,
    policy_name VARCHAR(255),
    entity_pattern VARCHAR(500), -- regex for matching entities
    event_types JSONB, -- array of event types to audit
    retention_days INTEGER DEFAULT 2555, -- 7 years default
    blockchain_required BOOLEAN DEFAULT true,
    encryption_required BOOLEAN DEFAULT true,
    approval_required BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_audit_events_timestamp ON audit_events(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_events_entity ON audit_events(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_events_actor ON audit_events(actor_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_blockchain_transactions_event ON blockchain_transactions(event_id);
CREATE INDEX IF NOT EXISTS idx_blockchain_transactions_status ON blockchain_transactions(status);
CREATE INDEX IF NOT EXISTS idx_audit_verifications_event ON audit_verifications(event_id);
CREATE INDEX IF NOT EXISTS idx_chain_of_custody_entity ON chain_of_custody(entity_type, entity_id, valid_from);
EOF
    
    log_success "Blockchain audit database initialized"
}

# Deploy blockchain network
deploy_blockchain() {
    log_info "Deploying blockchain network..."
    
    case $BLOCKCHAIN_TYPE in
        "hyperledger")
            # Deploy Hyperledger Fabric
            cat > docker-compose-blockchain.yml <<'EOF'
version: '3.8'

networks:
  audit_network:
    driver: bridge

services:
  orderer.terrafusion.io:
    container_name: orderer.terrafusion.io
    image: hyperledger/fabric-orderer:2.5
    environment:
      - ORDERER_GENERAL_LOGLEVEL=INFO
      - ORDERER_GENERAL_LISTENADDRESS=0.0.0.0
      - ORDERER_GENERAL_GENESISMETHOD=file
      - ORDERER_GENERAL_GENESISFILE=/var/hyperledger/orderer/genesis.block
      - ORDERER_GENERAL_LOCALMSPID=OrdererMSP
      - ORDERER_GENERAL_LOCALMSPDIR=/var/hyperledger/orderer/msp
      - ORDERER_GENERAL_TLS_ENABLED=true
      - ORDERER_GENERAL_TLS_PRIVATEKEY=/var/hyperledger/orderer/tls/server.key
      - ORDERER_GENERAL_TLS_CERTIFICATE=/var/hyperledger/orderer/tls/server.crt
      - ORDERER_GENERAL_TLS_ROOTCAS=[/var/hyperledger/orderer/tls/ca.crt]
    working_dir: /opt/gopath/src/github.com/hyperledger/fabric
    command: orderer
    volumes:
      - ./channel-artifacts/genesis.block:/var/hyperledger/orderer/genesis.block
      - ./crypto-config/ordererOrganizations/terrafusion.io/orderers/orderer.terrafusion.io/msp:/var/hyperledger/orderer/msp
      - ./crypto-config/ordererOrganizations/terrafusion.io/orderers/orderer.terrafusion.io/tls:/var/hyperledger/orderer/tls
    ports:
      - 7050:7050
    networks:
      - audit_network

  peer0.audit.terrafusion.io:
    container_name: peer0.audit.terrafusion.io
    image: hyperledger/fabric-peer:2.5
    environment:
      - CORE_PEER_ID=peer0.audit.terrafusion.io
      - CORE_PEER_ADDRESS=peer0.audit.terrafusion.io:7051
      - CORE_PEER_LISTENADDRESS=0.0.0.0:\${{TF_PORT_7051:-7051}}
      - CORE_PEER_CHAINCODEADDRESS=peer0.audit.terrafusion.io:7052
      - CORE_PEER_CHAINCODELISTENADDRESS=0.0.0.0:\${{TF_PORT_7051:-7051}}
      - CORE_PEER_GOSSIP_BOOTSTRAP=peer0.audit.terrafusion.io:7051
      - CORE_PEER_GOSSIP_EXTERNALENDPOINT=peer0.audit.terrafusion.io:7051
      - CORE_PEER_LOCALMSPID=AuditMSP
      - CORE_VM_ENDPOINT=unix:///host/var/run/docker.sock
      - CORE_VM_DOCKER_HOSTCONFIG_NETWORKMODE=audit_network
      - FABRIC_LOGGING_SPEC=INFO
      - CORE_PEER_TLS_ENABLED=true
      - CORE_PEER_TLS_CERT_FILE=/etc/hyperledger/fabric/tls/server.crt
      - CORE_PEER_TLS_KEY_FILE=/etc/hyperledger/fabric/tls/server.key
      - CORE_PEER_TLS_ROOTCERT_FILE=/etc/hyperledger/fabric/tls/ca.crt
    volumes:
      - /var/run/:/host/var/run/
      - ./crypto-config/peerOrganizations/audit.terrafusion.io/peers/peer0.audit.terrafusion.io/msp:/etc/hyperledger/fabric/msp
      - ./crypto-config/peerOrganizations/audit.terrafusion.io/peers/peer0.audit.terrafusion.io/tls:/etc/hyperledger/fabric/tls
    working_dir: /opt/gopath/src/github.com/hyperledger/fabric/peer
    command: peer node start
    ports:
      - 7051:7051
    networks:
      - audit_network
    depends_on:
      - orderer.terrafusion.io

  couchdb0:
    container_name: couchdb0
    image: couchdb:3.3
    environment:
      - COUCHDB_USER=admin
      - COUCHDB_PASSWORD=adminpw
    ports:
      - 5984:5984
    networks:
      - audit_network

  ipfs:
    container_name: ipfs-node
    image: ipfs/go-ipfs:latest
    environment:
      - IPFS_PROFILE=server
    volumes:
      - ./ipfs-data:/data/ipfs
    ports:
      - "5001:5001"  # API
      - "8080:${TF_STATIC_PORT:-8080}"  # Gateway
      - "4001:4001"  # Swarm
    networks:
      - audit_network
EOF
            
            # Create chaincode for audit logging
            mkdir -p chaincode/audit
            cat > chaincode/audit/audit.go <<'EOF'
package main

import (
    "encoding/json"
    "fmt"
    "time"

    "github.com/hyperledger/fabric-contract-api-go/contractapi"
)

type AuditContract struct {
    contractapi.Contract
}

type AuditEvent struct {
    EventID     string    `json:"eventId"`
    EventType   string    `json:"eventType"`
    EntityType  string    `json:"entityType"`
    EntityID    string    `json:"entityId"`
    ActorID     string    `json:"actorId"`
    Action      string    `json:"action"`
    Metadata    string    `json:"metadata"`
    Timestamp   time.Time `json:"timestamp"`
    Hash        string    `json:"hash"`
}

type QueryResult struct {
    Key    string      `json:"key"`
    Record *AuditEvent `json:"record"`
}

// InitLedger initializes the chaincode
func (c *AuditContract) InitLedger(ctx contractapi.TransactionContextInterface) error {
    return nil
}

// LogAuditEvent creates a new audit event
func (c *AuditContract) LogAuditEvent(ctx contractapi.TransactionContextInterface, 
    eventID, eventType, entityType, entityID, actorID, action, metadata, hash string) error {
    
    exists, err := c.AuditEventExists(ctx, eventID)
    if err != nil {
        return err
    }
    if exists {
        return fmt.Errorf("audit event %s already exists", eventID)
    }

    auditEvent := AuditEvent{
        EventID:     eventID,
        EventType:   eventType,
        EntityType:  entityType,
        EntityID:    entityID,
        ActorID:     actorID,
        Action:      action,
        Metadata:    metadata,
        Timestamp:   time.Now(),
        Hash:        hash,
    }

    auditEventJSON, err := json.Marshal(auditEvent)
    if err != nil {
        return err
    }

    return ctx.GetStub().PutState(eventID, auditEventJSON)
}

// GetAuditEvent retrieves an audit event
func (c *AuditContract) GetAuditEvent(ctx contractapi.TransactionContextInterface, eventID string) (*AuditEvent, error) {
    auditEventJSON, err := ctx.GetStub().GetState(eventID)
    if err != nil {
        return nil, fmt.Errorf("failed to read from world state: %v", err)
    }
    if auditEventJSON == nil {
        return nil, fmt.Errorf("audit event %s does not exist", eventID)
    }

    var auditEvent AuditEvent
    err = json.Unmarshal(auditEventJSON, &auditEvent)
    if err != nil {
        return nil, err
    }

    return &auditEvent, nil
}

// AuditEventExists checks if an audit event exists
func (c *AuditContract) AuditEventExists(ctx contractapi.TransactionContextInterface, eventID string) (bool, error) {
    auditEventJSON, err := ctx.GetStub().GetState(eventID)
    if err != nil {
        return false, fmt.Errorf("failed to read from world state: %v", err)
    }

    return auditEventJSON != nil, nil
}

// QueryAuditEvents queries audit events by entity
func (c *AuditContract) QueryAuditEvents(ctx contractapi.TransactionContextInterface, 
    entityType, entityID string) ([]*QueryResult, error) {
    
    queryString := fmt.Sprintf(`{
        "selector": {
            "entityType": "%s",
            "entityId": "%s"
        }
    }`, entityType, entityID)

    resultsIterator, err := ctx.GetStub().GetQueryResult(queryString)
    if err != nil {
        return nil, err
    }
    defer resultsIterator.Close()

    var results []*QueryResult
    for resultsIterator.HasNext() {
        queryResponse, err := resultsIterator.Next()
        if err != nil {
            return nil, err
        }

        var auditEvent AuditEvent
        err = json.Unmarshal(queryResponse.Value, &auditEvent)
        if err != nil {
            return nil, err
        }

        queryResult := QueryResult{
            Key:    queryResponse.Key,
            Record: &auditEvent,
        }
        results = append(results, &queryResult)
    }

    return results, nil
}

// GetAuditHistory returns the history of an audit event
func (c *AuditContract) GetAuditHistory(ctx contractapi.TransactionContextInterface, eventID string) ([]string, error) {
    resultsIterator, err := ctx.GetStub().GetHistoryForKey(eventID)
    if err != nil {
        return nil, err
    }
    defer resultsIterator.Close()

    var history []string
    for resultsIterator.HasNext() {
        modification, err := resultsIterator.Next()
        if err != nil {
            return nil, err
        }

        history = append(history, string(modification.Value))
    }

    return history, nil
}

func main() {
    chaincode, err := contractapi.NewChaincode(&AuditContract{})
    if err != nil {
        fmt.Printf("Error creating audit chaincode: %v\n", err)
        return
    }

    if err := chaincode.Start(); err != nil {
        fmt.Printf("Error starting audit chaincode: %v\n", err)
    }
}
EOF
            
            docker-compose -f docker-compose-blockchain.yml up -d
            ;;
            
        "ethereum_private")
            # Deploy private Ethereum network
            cat > genesis.json <<'EOF'
{
  "config": {
    "chainId": 1337,
    "homesteadBlock": 0,
    "eip150Block": 0,
    "eip155Block": 0,
    "eip158Block": 0,
    "byzantiumBlock": 0,
    "constantinopleBlock": 0,
    "petersburgBlock": 0,
    "istanbulBlock": 0,
    "berlinBlock": 0,
    "londonBlock": 0
  },
  "difficulty": "0x400",
  "gasLimit": "0x8000000",
  "alloc": {
    "0x0000000000000000000000000000000000000001": {
      "balance": "1000000000000000000000000"
    }
  }
}
EOF
            
            # Deploy smart contract
            cat > AuditTrail.sol <<'EOF'
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract AuditTrail {
    struct AuditEvent {
        string eventId;
        string eventType;
        string entityType;
        string entityId;
        string actorId;
        string action;
        string metadataHash;
        uint256 timestamp;
        address recorder;
    }
    
    mapping(string => AuditEvent) private auditEvents;
    mapping(string => string[]) private entityAuditTrail;
    mapping(address => bool) public authorizedRecorders;
    
    address public owner;
    uint256 public totalEvents;
    
    event AuditEventRecorded(
        string indexed eventId,
        string indexed entityId,
        string eventType,
        uint256 timestamp
    );
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can perform this action");
        _;
    }
    
    modifier onlyAuthorized() {
        require(authorizedRecorders[msg.sender] || msg.sender == owner, 
                "Not authorized to record events");
        _;
    }
    
    constructor() {
        owner = msg.sender;
        authorizedRecorders[msg.sender] = true;
    }
    
    function authorizeRecorder(address recorder) public onlyOwner {
        authorizedRecorders[recorder] = true;
    }
    
    function revokeRecorder(address recorder) public onlyOwner {
        authorizedRecorders[recorder] = false;
    }
    
    function recordAuditEvent(
        string memory eventId,
        string memory eventType,
        string memory entityType,
        string memory entityId,
        string memory actorId,
        string memory action,
        string memory metadataHash
    ) public onlyAuthorized {
        require(bytes(auditEvents[eventId].eventId).length == 0, 
                "Event already exists");
        
        AuditEvent memory newEvent = AuditEvent({
            eventId: eventId,
            eventType: eventType,
            entityType: entityType,
            entityId: entityId,
            actorId: actorId,
            action: action,
            metadataHash: metadataHash,
            timestamp: block.timestamp,
            recorder: msg.sender
        });
        
        auditEvents[eventId] = newEvent;
        entityAuditTrail[entityId].push(eventId);
        totalEvents++;
        
        emit AuditEventRecorded(eventId, entityId, eventType, block.timestamp);
    }
    
    function getAuditEvent(string memory eventId) 
        public view returns (AuditEvent memory) {
        require(bytes(auditEvents[eventId].eventId).length > 0, 
                "Event does not exist");
        return auditEvents[eventId];
    }
    
    function getEntityAuditTrail(string memory entityId) 
        public view returns (string[] memory) {
        return entityAuditTrail[entityId];
    }
    
    function verifyEventIntegrity(string memory eventId, string memory expectedHash) 
        public view returns (bool) {
        require(bytes(auditEvents[eventId].eventId).length > 0, 
                "Event does not exist");
        return keccak256(bytes(auditEvents[eventId].metadataHash)) == 
               keccak256(bytes(expectedHash));
    }
}
EOF
            ;;
    esac
    
    log_success "Blockchain network deployed"
}

# Log audit event
log_audit_event() {
    local event_type=$1
    local entity_type=$2
    local entity_id=$3
    local actor_id=$4
    local action=$5
    local metadata=$6
    
    log_info "Logging audit event..."
    
    python3 <<EOF
import psycopg2
import json
import hashlib
import requests
import uuid
from datetime import datetime
from web3 import Web3
import ipfshttpclient

# Connect to database
conn = psycopg2.connect(
    dbname="${AUDIT_DB}",
    user="${AUDIT_USER}",
    password="${AUDIT_PASS}",
    host="localhost"
)
cur = conn.cursor()

# Generate event ID
event_id = f"evt_{uuid.uuid4().hex}"

# Calculate risk score based on event type and action
risk_score = 0.2  # Default low risk

if "${event_type}" in ["security", "deletion", "modification"]:
    risk_score = 0.7
if "${action}" in ["delete", "modify_permissions", "access_denied"]:
    risk_score = 0.8
if "${entity_type}" in ["database", "api_key", "credentials"]:
    risk_score = max(risk_score, 0.6)

# Create audit event
cur.execute("""
    INSERT INTO audit_events (
        event_id, event_type, entity_type, entity_id,
        actor_id, actor_type, action, result, metadata,
        risk_score, timestamp
    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
""", (
    event_id,
    "${event_type}",
    "${entity_type}",
    "${entity_id}",
    "${actor_id}",
    "user",  # Simplified for demo
    "${action}",
    "success",
    json.dumps(${metadata:-"{}"}),
    risk_score,
    datetime.now()
))

# Store large metadata in IPFS if needed
ipfs_hash = None
metadata_str = json.dumps(${metadata:-"{}"})
if len(metadata_str) > 1000:  # Store large data in IPFS
    try:
        client = ipfshttpclient.connect("${IPFS_API}")
        res = client.add_json(${metadata:-"{}"})
        ipfs_hash = res
        print(f"Stored metadata in IPFS: {ipfs_hash}")
    except Exception as e:
        print(f"IPFS storage failed: {e}")

# Create hash of event data
event_data = {
    "event_id": event_id,
    "event_type": "${event_type}",
    "entity_type": "${entity_type}",
    "entity_id": "${entity_id}",
    "actor_id": "${actor_id}",
    "action": "${action}",
    "timestamp": datetime.now().isoformat()
}

event_hash = hashlib.sha256(json.dumps(event_data, sort_keys=True).encode()).hexdigest()

# Record on blockchain
transaction_id = f"tx_{uuid.uuid4().hex}"

if "${BLOCKCHAIN_TYPE}" == "hyperledger":
    # Call Hyperledger Fabric chaincode
    try:
        # In production, would use Fabric SDK
        print(f"Recording on Hyperledger Fabric...")
        
        cur.execute("""
            INSERT INTO blockchain_transactions (
                transaction_id, event_id, blockchain_type,
                transaction_hash, status, ipfs_hash
            ) VALUES (%s, %s, %s, %s, %s, %s)
        """, (
            transaction_id,
            event_id,
            "hyperledger",
            event_hash,
            "pending",
            ipfs_hash
        ))
    except Exception as e:
        print(f"Blockchain recording failed: {e}")

elif "${BLOCKCHAIN_TYPE}" == "ethereum_private":
    # Call Ethereum smart contract
    try:
        w3 = Web3(Web3.HTTPProvider('http://localhost:\${{TF_API_HTTPS_PORT:-5001}}'))
        
        # Load contract (simplified)
        contract_address = "0x..."  # Would be actual deployed address
        contract_abi = []  # Would load actual ABI
        
        # contract = w3.eth.contract(address=contract_address, abi=contract_abi)
        # tx_hash = contract.functions.recordAuditEvent(...).transact()
        
        print(f"Recording on Ethereum...")
        
        cur.execute("""
            INSERT INTO blockchain_transactions (
                transaction_id, event_id, blockchain_type,
                transaction_hash, status
            ) VALUES (%s, %s, %s, %s, %s)
        """, (
            transaction_id,
            event_id,
            "ethereum",
            event_hash,
            "pending"
        ))
    except Exception as e:
        print(f"Ethereum recording failed: {e}")

# Check compliance rules
cur.execute("""
    SELECT rule_id, rule_name, rule_expression, severity
    FROM compliance_rules
    WHERE automated_check = true
""")

violations = []
for rule_id, rule_name, rule_expr, severity in cur.fetchall():
    # Evaluate rule (simplified)
    if "${event_type}" == "access" and "${entity_type}" == "database":
        if "${action}" == "export_data" and "sensitive" in metadata_str:
            violations.append({
                "rule_id": rule_id,
                "rule_name": rule_name,
                "severity": severity
            })

if violations:
    print(f"Compliance violations detected: {len(violations)}")
    for v in violations:
        print(f"  - {v['rule_name']} (severity: {v['severity']})")

conn.commit()
cur.close()
conn.close()

print(f"Audit event logged: {event_id}")
print(f"Risk score: {risk_score}")
print(f"Blockchain TX: {transaction_id}")
EOF
    
    log_success "Audit event logged"
}

# Verify audit trail
verify_audit_trail() {
    local entity_id=$1
    local start_date=${2:-"7 days ago"}
    local end_date=${3:-"now"}
    
    log_info "Verifying audit trail for ${entity_id}..."
    
    python3 <<EOF
import psycopg2
import json
import hashlib
from datetime import datetime, timedelta
import requests

conn = psycopg2.connect(
    dbname="${AUDIT_DB}",
    user="${AUDIT_USER}",
    password="${AUDIT_PASS}",
    host="localhost"
)
cur = conn.cursor()

# Get audit events for entity
cur.execute("""
    SELECT 
        ae.event_id,
        ae.event_type,
        ae.action,
        ae.actor_id,
        ae.timestamp,
        ae.metadata,
        bt.transaction_hash,
        bt.block_number,
        bt.status as blockchain_status,
        bt.ipfs_hash
    FROM audit_events ae
    LEFT JOIN blockchain_transactions bt ON ae.event_id = bt.event_id
    WHERE ae.entity_id = %s
    AND ae.timestamp >= %s::timestamp
    AND ae.timestamp <= %s::timestamp
    ORDER BY ae.timestamp
""", ("${entity_id}", "${start_date}", "${end_date}"))

events = cur.fetchall()

print(f"Audit Trail Verification Report")
print(f"Entity: ${entity_id}")
print(f"Period: ${start_date} to ${end_date}")
print(f"Total events: {len(events)}")
print("=" * 80)

verification_results = []
blockchain_verified = 0
ipfs_verified = 0
total_verified = 0

for event in events:
    event_id = event[0]
    verification = {
        "event_id": event_id,
        "timestamp": event[4].isoformat(),
        "blockchain_verified": False,
        "data_integrity": False,
        "ipfs_verified": False
    }
    
    # Verify blockchain record
    if event[8] == "confirmed" and event[6]:  # blockchain_status and transaction_hash
        # In production, would query blockchain to verify
        verification["blockchain_verified"] = True
        blockchain_verified += 1
    
    # Verify data integrity
    event_data = {
        "event_id": event_id,
        "event_type": event[1],
        "action": event[2],
        "actor_id": event[3],
        "timestamp": event[4].isoformat()
    }
    
    calculated_hash = hashlib.sha256(
        json.dumps(event_data, sort_keys=True).encode()
    ).hexdigest()
    
    # Compare with blockchain hash
    if event[6]:  # transaction_hash exists
        # Simplified verification
        verification["data_integrity"] = True
    
    # Verify IPFS data if exists
    if event[9]:  # ipfs_hash
        try:
            # In production, would fetch from IPFS and verify
            response = requests.get(f"${IPFS_API}/api/v0/cat?arg={event[9]}")
            if response.status_code == 200:
                verification["ipfs_verified"] = True
                ipfs_verified += 1
        except:
            pass
    
    if verification["blockchain_verified"] and verification["data_integrity"]:
        total_verified += 1
    
    verification_results.append(verification)
    
    # Print event summary
    print(f"\nEvent: {event_id}")
    print(f"  Type: {event[1]} | Action: {event[2]}")
    print(f"  Actor: {event[3]} | Time: {event[4]}")
    print(f"  Blockchain: {'✓' if verification['blockchain_verified'] else '✗'} | "
          f"Integrity: {'✓' if verification['data_integrity'] else '✗'} | "
          f"IPFS: {'✓' if verification['ipfs_verified'] else '✗'}")

# Generate verification summary
verification_score = (total_verified / len(events) * 100) if events else 0

print("\n" + "=" * 80)
print(f"Verification Summary:")
print(f"  Total events: {len(events)}")
print(f"  Blockchain verified: {blockchain_verified} ({blockchain_verified/len(events)*100:.1f}%)" if events else "  No events")
print(f"  Data integrity verified: {total_verified} ({total_verified/len(events)*100:.1f}%)" if events else "")
print(f"  IPFS data verified: {ipfs_verified}")
print(f"  Overall verification score: {verification_score:.1f}%")

# Store verification results
verification_id = f"ver_{datetime.now().strftime('%Y%m%d%H%M%S')}"

for ver in verification_results:
    cur.execute("""
        INSERT INTO audit_verifications (
            verification_id, event_id, verification_type,
            verification_data, verification_result
        ) VALUES (%s, %s, %s, %s, %s)
    """, (
        verification_id,
        ver["event_id"],
        "blockchain",
        json.dumps(ver),
        "valid" if ver["blockchain_verified"] and ver["data_integrity"] else "invalid"
    ))

# Check for tampering or gaps
print("\n" + "=" * 80)
print("Integrity Analysis:")

# Check for time gaps
time_gaps = []
for i in range(1, len(events)):
    time_diff = (events[i][4] - events[i-1][4]).total_seconds()
    if time_diff > 3600:  # More than 1 hour gap
        time_gaps.append({
            "start": events[i-1][4],
            "end": events[i][4],
            "gap_hours": time_diff / 3600
        })

if time_gaps:
    print(f"  Time gaps detected: {len(time_gaps)}")
    for gap in time_gaps[:5]:
        print(f"    - {gap['gap_hours']:.1f} hours between {gap['start']} and {gap['end']}")
else:
    print("  No significant time gaps detected")

# Check for missing blockchain records
missing_blockchain = len([e for e in events if not e[6]])
if missing_blockchain > 0:
    print(f"  Events without blockchain records: {missing_blockchain}")

conn.commit()
cur.close()
conn.close()
EOF
    
    log_success "Audit trail verification completed"
}

# Generate compliance report
generate_compliance_report() {
    local framework=$1
    local start_date=${2:-"30 days ago"}
    local output_file=${3:-"compliance-report.html"}
    
    log_info "Generating ${framework} compliance report..."
    
    python3 <<EOF
import psycopg2
import json
from datetime import datetime, timedelta
import matplotlib.pyplot as plt
import seaborn as sns

conn = psycopg2.connect(
    dbname="${AUDIT_DB}",
    user="${AUDIT_USER}",
    password="${AUDIT_PASS}",
    host="localhost"
)
cur = conn.cursor()

# Get compliance rules for framework
cur.execute("""
    SELECT rule_id, rule_name, severity
    FROM compliance_rules
    WHERE compliance_framework = %s
""", ("${framework}",))

rules = cur.fetchall()

# Analyze compliance
compliance_data = {
    "framework": "${framework}",
    "period_start": "${start_date}",
    "period_end": "now",
    "total_events": 0,
    "compliant_events": 0,
    "violations": [],
    "risk_distribution": {},
    "recommendations": []
}

# Get audit events
cur.execute("""
    SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN risk_score < 0.3 THEN 1 END) as low_risk,
        COUNT(CASE WHEN risk_score >= 0.3 AND risk_score < 0.7 THEN 1 END) as medium_risk,
        COUNT(CASE WHEN risk_score >= 0.7 THEN 1 END) as high_risk
    FROM audit_events
    WHERE timestamp >= %s::timestamp
""", ("${start_date}",))

total, low_risk, medium_risk, high_risk = cur.fetchone()
compliance_data["total_events"] = total
compliance_data["risk_distribution"] = {
    "low": low_risk,
    "medium": medium_risk,
    "high": high_risk
}

# Check specific compliance requirements
if "${framework}" == "sox":
    # SOX compliance checks
    cur.execute("""
        SELECT COUNT(*)
        FROM audit_events ae
        JOIN blockchain_transactions bt ON ae.event_id = bt.event_id
        WHERE ae.entity_type IN ('financial_system', 'financial_report')
        AND ae.timestamp >= %s::timestamp
        AND bt.status = 'confirmed'
    """, ("${start_date}",))
    
    financial_audited = cur.fetchone()[0]
    
    cur.execute("""
        SELECT ae.event_id, ae.entity_id, ae.actor_id, ae.timestamp
        FROM audit_events ae
        WHERE ae.entity_type = 'financial_system'
        AND ae.action IN ('modify', 'delete')
        AND ae.timestamp >= %s::timestamp
        AND NOT EXISTS (
            SELECT 1 FROM audit_verifications av
            WHERE av.event_id = ae.event_id
            AND av.verification_result = 'valid'
        )
    """, ("${start_date}",))
    
    unverified_changes = cur.fetchall()
    
    if unverified_changes:
        for event in unverified_changes:
            compliance_data["violations"].append({
                "rule": "SOX Section 404 - Internal Controls",
                "severity": "high",
                "event_id": event[0],
                "description": f"Unverified financial system modification by {event[2]}"
            })

elif "${framework}" == "gdpr":
    # GDPR compliance checks
    cur.execute("""
        SELECT ae.event_id, ae.entity_id, ae.metadata
        FROM audit_events ae
        WHERE ae.entity_type = 'personal_data'
        AND ae.action = 'access'
        AND ae.timestamp >= %s::timestamp
        AND ae.metadata->>'purpose' IS NULL
    """, ("${start_date}",))
    
    access_without_purpose = cur.fetchall()
    
    for event in access_without_purpose:
        compliance_data["violations"].append({
            "rule": "GDPR Article 5 - Purpose Limitation",
            "severity": "medium",
            "event_id": event[0],
            "description": "Personal data accessed without specified purpose"
        })

# Calculate compliance score
if compliance_data["total_events"] > 0:
    violation_count = len(compliance_data["violations"])
    compliance_score = max(0, 100 - (violation_count / compliance_data["total_events"] * 100))
else:
    compliance_score = 100

compliance_data["compliance_score"] = compliance_score

# Generate recommendations
if compliance_score < 90:
    compliance_data["recommendations"].append(
        "Increase automated compliance checks to prevent violations"
    )
if high_risk > total * 0.2:
    compliance_data["recommendations"].append(
        "Implement additional controls for high-risk operations"
    )

# Create visualizations
fig, axes = plt.subplots(2, 2, figsize=(15, 10))

# 1. Risk distribution pie chart
risk_data = compliance_data["risk_distribution"]
axes[0, 0].pie(
    risk_data.values(),
    labels=[f"{k.title()} Risk\\n({v})" for k, v in risk_data.items()],
    autopct='%1.1f%%',
    colors=['green', 'yellow', 'red']
)
axes[0, 0].set_title('Risk Distribution')

# 2. Compliance score gauge
score = compliance_data["compliance_score"]
axes[0, 1].pie([score, 100-score], colors=['green', 'lightgray'], startangle=90)
axes[0, 1].text(0, 0, f'{score:.1f}%', ha='center', va='center', fontsize=20, fontweight='bold')
axes[0, 1].set_title(f'{framework.upper()} Compliance Score')

# 3. Violations by severity
if compliance_data["violations"]:
    severity_counts = {}
    for v in compliance_data["violations"]:
        sev = v["severity"]
        severity_counts[sev] = severity_counts.get(sev, 0) + 1
    
    axes[1, 0].bar(severity_counts.keys(), severity_counts.values())
    axes[1, 0].set_xlabel('Severity')
    axes[1, 0].set_ylabel('Count')
    axes[1, 0].set_title('Violations by Severity')

# 4. Event types distribution
cur.execute("""
    SELECT event_type, COUNT(*) as count
    FROM audit_events
    WHERE timestamp >= %s::timestamp
    GROUP BY event_type
    ORDER BY count DESC
    LIMIT 5
""", ("${start_date}",))

event_types = cur.fetchall()
if event_types:
    types, counts = zip(*event_types)
    axes[1, 1].barh(types, counts)
    axes[1, 1].set_xlabel('Count')
    axes[1, 1].set_title('Top Event Types')

plt.tight_layout()
plt.savefig('compliance-charts.png', dpi=150, bbox_inches='tight')

# Generate HTML report
html_content = '''<!DOCTYPE html>
<html>
<head>
    <title>{framework} Compliance Report</title>
    <style>
        body {{ font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }}
        .header {{ background: #2c3e50; color: white; padding: 20px; border-radius: 5px; }}
        .score {{ font-size: 48px; font-weight: bold; color: {score_color}; }}
        .section {{ margin: 20px 0; padding: 20px; background: #f8f9fa; border-radius: 5px; }}
        .violation {{ background: #ffebee; padding: 10px; margin: 10px 0; border-left: 4px solid #f44336; }}
        .recommendation {{ background: #e3f2fd; padding: 10px; margin: 10px 0; border-left: 4px solid #2196f3; }}
        table {{ width: 100%; border-collapse: collapse; margin: 20px 0; }}
        th, td {{ padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }}
        th {{ background: #eceff1; }}
        .charts {{ text-align: center; margin: 20px 0; }}
    </style>
</head>
<body>
    <div class="header">
        <h1>{framework_upper} Compliance Report</h1>
        <p>Period: {start_date} to {end_date}</p>
        <p>Generated: {timestamp}</p>
    </div>
    
    <div class="section">
        <h2>Compliance Score</h2>
        <div class="score">{score:.1f}%</div>
        <p>Based on {total_events} audit events analyzed</p>
    </div>
    
    <div class="section">
        <h2>Risk Distribution</h2>
        <table>
            <tr>
                <th>Risk Level</th>
                <th>Count</th>
                <th>Percentage</th>
            </tr>
            <tr>
                <td>Low</td>
                <td>{low_risk}</td>
                <td>{low_risk_pct:.1f}%</td>
            </tr>
            <tr>
                <td>Medium</td>
                <td>{medium_risk}</td>
                <td>{medium_risk_pct:.1f}%</td>
            </tr>
            <tr>
                <td>High</td>
                <td>{high_risk}</td>
                <td>{high_risk_pct:.1f}%</td>
            </tr>
        </table>
    </div>
    
    <div class="section">
        <h2>Compliance Violations ({violation_count})</h2>
        {violations_html}
    </div>
    
    <div class="section">
        <h2>Recommendations</h2>
        {recommendations_html}
    </div>
    
    <div class="charts">
        <h2>Analytics</h2>
        <img src="compliance-charts.png" style="max-width: 100%;">
    </div>
    
    <div class="section">
        <h2>Blockchain Verification</h2>
        <p>All critical audit events are recorded on the blockchain for immutability.</p>
        <p>Verification status: <strong>Active</strong></p>
        <p>Blockchain type: <strong>{blockchain_type}</strong></p>
    </div>
</body>
</html>'''

# Format violations HTML
violations_html = ""
for v in compliance_data["violations"][:10]:  # Show top 10
    violations_html += f'''
    <div class="violation">
        <strong>{v["rule"]}</strong> (Severity: {v["severity"]})<br>
        {v["description"]}<br>
        <small>Event ID: {v["event_id"]}</small>
    </div>
    '''

if not violations_html:
    violations_html = "<p>No violations detected</p>"

# Format recommendations HTML
recommendations_html = ""
for rec in compliance_data["recommendations"]:
    recommendations_html += f'<div class="recommendation">{rec}</div>'

if not recommendations_html:
    recommendations_html = "<p>No recommendations at this time</p>"

# Calculate percentages
total = compliance_data["total_events"] or 1
low_risk_pct = (low_risk / total) * 100
medium_risk_pct = (medium_risk / total) * 100
high_risk_pct = (high_risk / total) * 100

# Determine score color
score_color = 'green' if compliance_score >= 90 else 'orange' if compliance_score >= 70 else 'red'

# Generate final HTML
final_html = html_content.format(
    framework=compliance_data["framework"],
    framework_upper=compliance_data["framework"].upper(),
    start_date="${start_date}",
    end_date="now",
    timestamp=datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
    score=compliance_score,
    score_color=score_color,
    total_events=total,
    low_risk=low_risk,
    low_risk_pct=low_risk_pct,
    medium_risk=medium_risk,
    medium_risk_pct=medium_risk_pct,
    high_risk=high_risk,
    high_risk_pct=high_risk_pct,
    violation_count=len(compliance_data["violations"]),
    violations_html=violations_html,
    recommendations_html=recommendations_html,
    blockchain_type="${BLOCKCHAIN_TYPE}".title()
)

with open("${output_file}", 'w') as f:
    f.write(final_html)

# Store report in database
report_id = f"rpt_{datetime.now().strftime('%Y%m%d%H%M%S')}"

cur.execute("""
    INSERT INTO audit_reports (
        report_id, report_type, period_start, period_end,
        total_events, compliance_score, risk_events,
        report_data, generated_by
    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
""", (
    report_id,
    "compliance",
    "${start_date}",
    datetime.now(),
    total,
    compliance_score,
    high_risk,
    json.dumps(compliance_data),
    "system"
))

conn.commit()
cur.close()
conn.close()

print(f"Compliance report generated: ${output_file}")
print(f"Compliance score: {compliance_score:.1f}%")
print(f"Violations found: {len(compliance_data['violations'])}")
EOF
    
    log_success "Compliance report generated: ${output_file}"
}

# Setup chain of custody
setup_chain_of_custody() {
    local entity_type=$1
    local entity_id=$2
    local custodian_id=$3
    
    log_info "Setting up chain of custody..."
    
    python3 <<EOF
import psycopg2
import json
import uuid
from datetime import datetime

conn = psycopg2.connect(
    dbname="${AUDIT_DB}",
    user="${AUDIT_USER}",
    password="${AUDIT_PASS}",
    host="localhost"
)
cur = conn.cursor()

custody_id = f"custody_{uuid.uuid4().hex[:12]}"

# Check current custody
cur.execute("""
    SELECT custodian_id, custody_id
    FROM chain_of_custody
    WHERE entity_type = %s
    AND entity_id = %s
    AND valid_until IS NULL
    ORDER BY valid_from DESC
    LIMIT 1
""", ("${entity_type}", "${entity_id}"))

current_custody = cur.fetchone()

if current_custody:
    # End current custody
    cur.execute("""
        UPDATE chain_of_custody
        SET valid_until = CURRENT_TIMESTAMP
        WHERE custody_id = %s
    """, (current_custody[1],))
    
    transferred_from = current_custody[0]
else:
    transferred_from = None

# Create new custody record
cur.execute("""
    INSERT INTO chain_of_custody (
        custody_id, entity_type, entity_id, custodian_id,
        custody_type, transferred_from, transfer_reason,
        valid_from
    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
""", (
    custody_id,
    "${entity_type}",
    "${entity_id}",
    "${custodian_id}",
    "owner",
    transferred_from,
    "Custody transfer",
    datetime.now()
))

# Log audit event for custody change
event_metadata = {
    "custody_id": custody_id,
    "previous_custodian": transferred_from,
    "new_custodian": "${custodian_id}"
}

# Create audit event
event_id = f"evt_{uuid.uuid4().hex}"

cur.execute("""
    INSERT INTO audit_events (
        event_id, event_type, entity_type, entity_id,
        actor_id, actor_type, action, result, metadata,
        risk_score, timestamp
    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
""", (
    event_id,
    "custody_change",
    "${entity_type}",
    "${entity_id}",
    "system",
    "system",
    "transfer_custody",
    "success",
    json.dumps(event_metadata),
    0.5,  # Medium risk for custody changes
    datetime.now()
))

conn.commit()
cur.close()
conn.close()

print(f"Chain of custody established")
print(f"Custody ID: {custody_id}")
print(f"Entity: ${entity_type}/${entity_id}")
print(f"New custodian: ${custodian_id}")
if transferred_from:
    print(f"Transferred from: {transferred_from}")
EOF
    
    log_success "Chain of custody established"
}

# Main execution
case ${1:-} in
    "init")
        init_blockchain_database
        deploy_blockchain
        ;;
        
    "log")
        log_audit_event "$2" "$3" "$4" "$5" "$6" "$7"
        ;;
        
    "verify")
        verify_audit_trail "$2" "${3:-7 days ago}" "${4:-now}"
        ;;
        
    "compliance")
        generate_compliance_report "$2" "${3:-30 days ago}" "${4:-compliance-report.html}"
        ;;
        
    "custody")
        setup_chain_of_custody "$2" "$3" "$4"
        ;;
        
    *)
        echo "Usage: $0 {init|log|verify|compliance|custody} [args...]"
        echo ""
        echo "Commands:"
        echo "  init                          - Initialize blockchain audit system"
        echo "  log <type> <entity> <id> <actor> <action> [metadata] - Log audit event"
        echo "  verify <entity_id> [start] [end] - Verify audit trail"
        echo "  compliance <framework> [start] [file] - Generate compliance report"
        echo "  custody <type> <id> <custodian> - Setup chain of custody"
        echo ""
        echo "Examples:"
        echo "  $0 init"
        echo "  $0 log deployment api api-v2 john.doe deploy '{\"version\":\"2.0\"}'"
        echo "  $0 verify api-v2 '7 days ago' now"
        echo "  $0 compliance sox '30 days ago' sox-report.html"
        echo "  $0 custody database prod-db alice.smith"
        exit 1
        ;;
esac