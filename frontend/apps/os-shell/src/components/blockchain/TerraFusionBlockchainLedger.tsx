/**
 * TerraFusion Ledger Evidence
 * Contract, node, and transaction claims require governed ledger evidence.
 */

import { TerraSphere } from '@/components/brand/TerraSphere';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent as CardBody, CardHeader } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import React, { useState } from 'react';

interface SmartContract {
  id: string;
  name: string;
  type: 'GOVERNANCE' | 'TREASURY' | 'PROPERTY_DEED' | 'TAX_COLLECTION' | 'VOTING' | 'COMPLIANCE';
  status: 'DEPLOYED' | 'PENDING' | 'TESTING' | 'AUDITING' | 'FAILED';
  version: string;
  gasUsed: number;
  gasLimit: number;
  address: string;
  deploymentDate: string;
  transactionCount: number;
  complianceLevel: 'FISMA_HIGH' | 'SOC2_TYPE2' | 'GOVERNMENT_GRADE';
  auditScore: number;
}

interface BlockchainNode {
  id: string;
  name: string;
  type: 'VALIDATOR' | 'FULL_NODE' | 'ARCHIVE_NODE' | 'GOVERNMENT_NODE';
  status: 'ONLINE' | 'SYNCING' | 'OFFLINE' | 'MAINTENANCE';
  location: string;
  blockHeight: number;
  hashRate: number;
  stakingAmount: number;
  uptime: number;
  governmentCertified: boolean;
}

interface GovernmentTransaction {
  id: string;
  type:
    | 'PROPERTY_TRANSFER'
    | 'TAX_PAYMENT'
    | 'GOVERNMENT_DISBURSEMENT'
    | 'VOTING_RECORD'
    | 'PERMIT_ISSUANCE';
  from: string;
  to: string;
  amount: number;
  status: 'CONFIRMED' | 'PENDING' | 'FAILED';
  blockNumber: number;
  timestamp: string;
  gasUsed: number;
  complianceVerified: boolean;
  auditTrail: string[];
}

interface BlockchainLedgerProps {
  className?: string;
}

export const TerraFusionBlockchainLedger: React.FC<BlockchainLedgerProps> = ({
  className = '',
}) => {
  const [smartContracts] = useState<SmartContract[]>([]);
  const [blockchainNodes] = useState<BlockchainNode[]>([]);
  const [recentTransactions] = useState<GovernmentTransaction[]>([]);

  const networkMetrics = {
    totalContracts: smartContracts.length,
    activeNodes: blockchainNodes.filter((node) => node.status === 'ONLINE').length,
    networkHashRate: blockchainNodes.reduce((sum, node) => sum + node.hashRate, 0),
    totalTransactions: smartContracts.reduce(
      (sum, contract) => sum + contract.transactionCount,
      0
    ),
    complianceScore:
      smartContracts.length > 0
        ? smartContracts.reduce((sum, contract) => sum + contract.auditScore, 0) /
          smartContracts.length
        : 0,
  };

  const getContractTypeColor = (type: SmartContract['type']) => {
    switch (type) {
      case 'GOVERNANCE':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'TREASURY':
        return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'PROPERTY_DEED':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'TAX_COLLECTION':
        return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
      case 'VOTING':
        return 'bg-red-500/20 text-red-300 border-red-500/30';
      case 'COMPLIANCE':
        return 'bg-terra-cyan/20 text-terra-cyan border-terra-cyan/30';
    }
  };

  const getStatusColor = (
    status: SmartContract['status'] | BlockchainNode['status'] | GovernmentTransaction['status']
  ) => {
    switch (status) {
      case 'DEPLOYED':
      case 'ONLINE':
      case 'CONFIRMED':
        return 'bg-green-500 text-white';
      case 'PENDING':
      case 'SYNCING':
        return 'bg-yellow-500 text-terra-midnight';
      case 'TESTING':
        return 'bg-blue-500 text-white';
      case 'AUDITING':
        return 'bg-purple-500 text-white';
      case 'MAINTENANCE':
        return 'bg-gray-500 text-white';
      case 'FAILED':
      case 'OFFLINE':
        return 'bg-red-500 text-white';
    }
  };

  const formatAddress = (address: string) => `${address.slice(0, 6)}...${address.slice(-4)}`;

  return (
    <div
      className={`min-h-screen bg-gradient-to-br from-terra-midnight via-terra-slate to-terra-midnight p-6 ${className}`}
    >
      <div className='text-center mb-8'>
        <div className='flex items-center justify-center gap-6 mb-4'>
          <TerraSphere size='lg' variant='quantum' />
          <h1 className='text-4xl font-bold text-terra-cyan glow-text'>Ledger Evidence</h1>
        </div>
        <p className='text-lg text-terra-blue/80 mb-6'>
          Smart contracts, nodes, and transactions appear only from governed ledger evidence.
        </p>

        <div className='flex justify-center gap-8 mb-8'>
          <div className='text-center'>
            <div className='text-3xl font-bold text-terra-cyan'>
              {networkMetrics.totalContracts}
            </div>
            <div className='text-sm text-terra-blue/70'>Verified Contracts</div>
          </div>
          <div className='text-center'>
            <div className='text-3xl font-bold text-green-400'>{networkMetrics.activeNodes}</div>
            <div className='text-sm text-terra-blue/70'>Verified Nodes</div>
          </div>
          <div className='text-center'>
            <div className='text-3xl font-bold text-blue-400'>
              {networkMetrics.networkHashRate.toFixed(1)} TH/s
            </div>
            <div className='text-sm text-terra-blue/70'>Hash Rate</div>
          </div>
          <div className='text-center'>
            <div className='text-3xl font-bold text-purple-400'>
              {networkMetrics.complianceScore.toFixed(1)}%
            </div>
            <div className='text-sm text-terra-blue/70'>Compliance Score</div>
          </div>
        </div>
      </div>

      <div className='mb-8'>
        <h2 className='text-2xl font-semibold text-terra-cyan mb-4 flex items-center gap-3'>
          <TerraSphere size='sm' variant='pulse' />
          Smart Contracts
        </h2>
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
          {smartContracts.length === 0 ? (
            <Card className='terra-glass border-terra-cyan/20 lg:col-span-2'>
              <CardBody className='text-terra-blue/80'>
                No smart contracts are displayed because no governed ledger feed has returned
                contract address, version, deployment, audit, and transaction evidence.
              </CardBody>
            </Card>
          ) : (
            smartContracts.map((contract) => (
              <Card key={contract.id} className='terra-glass border-terra-cyan/20'>
                <CardHeader className='pb-3'>
                  <div className='flex justify-between items-start'>
                    <div>
                      <h3 className='text-lg font-semibold text-terra-cyan mb-1'>
                        {contract.name}
                      </h3>
                      <div className='flex gap-2 mb-2'>
                        <Badge className={getContractTypeColor(contract.type)} variant='outline'>
                          {contract.type}
                        </Badge>
                        <Badge className={getStatusColor(contract.status)} variant='secondary'>
                          {contract.status}
                        </Badge>
                      </div>
                      <div className='text-sm text-terra-blue/70'>
                        {formatAddress(contract.address)}
                      </div>
                    </div>
                    <div className='text-right text-sm'>
                      <div className='text-terra-blue/70'>Audit Score</div>
                      <div className='text-terra-cyan font-semibold'>
                        {contract.auditScore.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardBody>
                  <Progress value={(contract.gasUsed / contract.gasLimit) * 100} className='h-2' />
                </CardBody>
              </Card>
            ))
          )}
        </div>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        <Card className='terra-glass border-terra-cyan/20'>
          <CardHeader>
            <h2 className='text-2xl font-semibold text-terra-cyan'>Ledger Nodes</h2>
          </CardHeader>
          <CardBody className='space-y-4'>
            {blockchainNodes.length === 0 ? (
              <div className='text-terra-blue/80'>
                No ledger nodes are displayed because no governed node feed has returned block
                height, hash rate, uptime, certification, and location evidence.
              </div>
            ) : (
              blockchainNodes.map((node) => (
                <div key={node.id} className='terra-glass p-4 rounded-lg border border-terra-cyan/10'>
                  <div className='flex justify-between'>
                    <div>
                      <h3 className='text-lg font-semibold text-terra-cyan'>{node.name}</h3>
                      <div className='text-sm text-terra-blue/70'>{node.location}</div>
                    </div>
                    <Badge className={getStatusColor(node.status)} variant='secondary'>
                      {node.status}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </CardBody>
        </Card>

        <Card className='terra-glass border-terra-cyan/20'>
          <CardHeader>
            <h2 className='text-2xl font-semibold text-terra-cyan'>Recent Transactions</h2>
          </CardHeader>
          <CardBody className='space-y-4'>
            {recentTransactions.length === 0 ? (
              <div className='text-terra-blue/80'>
                No transactions are displayed because no governed transaction feed has returned
                transaction id, block, timestamp, parties, status, and audit trail evidence.
              </div>
            ) : (
              recentTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className='terra-glass p-4 rounded-lg border border-terra-cyan/10'
                >
                  <div className='flex justify-between'>
                    <div>
                      <h3 className='text-lg font-semibold text-terra-cyan'>
                        {transaction.type}
                      </h3>
                      <div className='text-sm text-terra-blue/70'>
                        Block {transaction.blockNumber}
                      </div>
                    </div>
                    <Badge className={getStatusColor(transaction.status)} variant='secondary'>
                      {transaction.status}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
};

export default TerraFusionBlockchainLedger;
