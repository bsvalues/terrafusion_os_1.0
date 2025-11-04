"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Link,
  Shield,
  Coins,
  FileText,
  Users,
  TrendingUp,
  CheckCircle,
  Clock,
  Warning,
  Zap,
  Globe,
  Lock,
 } from '@mui/icons-material'

interface BlockchainTransaction {
  id: string
  hash: string
  type: "assessment" | "transfer" | "verification" | "audit" | "payment"
  from: string
  to: string
  amount?: number
  timestamp: string
  blockNumber: number
  gasUsed: number
  status: "pending" | "confirmed" | "failed"
  confirmations: number
  data: any
}

interface SmartContract {
  id: string
  name: string
  address: string
  type: "assessment" | "escrow" | "governance" | "oracle" | "nft"
  version: string
  deployedAt: string
  gasUsed: number
  interactions: number
  status: "active" | "paused" | "deprecated"
  verified: boolean
}

interface NFTProperty {
  id: string
  tokenId: number
  parcelNumber: string
  address: string
  owner: string
  assessedValue: number
  lastTransfer: string
  metadata: {
    images: string[]
    documents: string[]
    assessments: string[]
    certificates: string[]
  }
  royalties: number
  transferHistory: number
}

export default function BlockchainIntegration() {
  const [transactions, setTransactions] = useState<BlockchainTransaction[]>([])
  const [contracts, setContracts] = useState<SmartContract[]>([])
  const [nftProperties, setNftProperties] = useState<NFTProperty[]>([])
  const [networkStats, setNetworkStats] = useState({
    blockHeight: 0,
    totalTransactions: 0,
    activeContracts: 0,
    totalValueLocked: 0,
    gasPrice: 0,
    networkHashRate: 0,
  })

  useEffect(() => {
    const mockTransactions: BlockchainTransaction[] = [
      {
        id: "tx-001",
        hash: "0x1a2b3c4d5e6f7890abcdef1234567890abcdef1234567890abcdef1234567890",
        type: "assessment",
        from: "0x742d35Cc6634C0532925a3b8D4C0532925a3b8D4",
        to: "0x8ba1f109551bD432803012645Hac136c22c501e",
        timestamp: "2025-01-10 14:32:15",
        blockNumber: 18547892,
        gasUsed: 125000,
        status: "confirmed",
        confirmations: 12,
        data: { parcelId: "362301-100045", assessedValue: 485000 },
      },
      {
        id: "tx-002",
        hash: "0x2b3c4d5e6f7890abcdef1234567890abcdef1234567890abcdef1234567890ab",
        type: "verification",
        from: "0x8ba1f109551bD432803012645Hac136c22c501e",
        to: "0x742d35Cc6634C0532925a3b8D4C0532925a3b8D4",
        timestamp: "2025-01-10 14:28:42",
        blockNumber: 18547891,
        gasUsed: 85000,
        status: "confirmed",
        confirmations: 13,
        data: { verificationId: "ver-001", result: "approved" },
      },
      {
        id: "tx-003",
        hash: "0x3c4d5e6f7890abcdef1234567890abcdef1234567890abcdef1234567890abcd",
        type: "payment",
        from: "0x742d35Cc6634C0532925a3b8D4C0532925a3b8D4",
        to: "0x9cb2f210662cE543814023756Iad247d33d602f",
        amount: 2500,
        timestamp: "2025-01-10 14:25:18",
        blockNumber: 18547890,
        gasUsed: 21000,
        status: "pending",
        confirmations: 0,
        data: { paymentType: "assessment_fee", invoiceId: "inv-001" },
      },
    ]

    const mockContracts: SmartContract[] = [
      {
        id: "contract-001",
        name: "PropertyAssessmentRegistry",
        address: "0x1234567890abcdef1234567890abcdef12345678",
        type: "assessment",
        version: "v2.1.0",
        deployedAt: "2025-01-01",
        gasUsed: 2500000,
        interactions: 15847,
        status: "active",
        verified: true,
      },
      {
        id: "contract-002",
        name: "AssessmentEscrow",
        address: "0x2345678901bcdef1234567890abcdef123456789",
        type: "escrow",
        version: "v1.8.2",
        deployedAt: "2025-01-01",
        gasUsed: 1800000,
        interactions: 8923,
        status: "active",
        verified: true,
      },
      {
        id: "contract-003",
        name: "PropertyNFT",
        address: "0x3456789012cdef1234567890abcdef1234567890",
        type: "nft",
        version: "v3.0.1",
        deployedAt: "2025-01-01",
        gasUsed: 3200000,
        interactions: 4567,
        status: "active",
        verified: true,
      },
    ]

    const mockNFTProperties: NFTProperty[] = [
      {
        id: "nft-001",
        tokenId: 1001,
        parcelNumber: "362301-100045",
        address: "123 Wine Country Rd, Prosser, WA",
        owner: "0x742d35Cc6634C0532925a3b8D4C0532925a3b8D4",
        assessedValue: 485000,
        lastTransfer: "2025-01-08",
        metadata: {
          images: ["exterior.jpg", "interior.jpg", "aerial.jpg"],
          documents: ["deed.pdf", "survey.pdf", "inspection.pdf"],
          assessments: ["2025_assessment.json", "2024_assessment.json"],
          certificates: ["energy_cert.pdf", "safety_cert.pdf"],
        },
        royalties: 2.5,
        transferHistory: 3,
      },
      {
        id: "nft-002",
        tokenId: 1002,
        parcelNumber: "362301-200078",
        address: "456 River View Dr, Richland, WA",
        owner: "0x8ba1f109551bD432803012645Hac136c22c501e",
        assessedValue: 325000,
        lastTransfer: "2025-01-05",
        metadata: {
          images: ["front.jpg", "back.jpg", "side.jpg"],
          documents: ["title.pdf", "plat.pdf"],
          assessments: ["2025_assessment.json"],
          certificates: ["flood_cert.pdf"],
        },
        royalties: 1.8,
        transferHistory: 1,
      },
    ]

    setTransactions(mockTransactions)
    setContracts(mockContracts)
    setNftProperties(mockNFTProperties)

    setNetworkStats({
      blockHeight: 18547892,
      totalTransactions: 2847392,
      activeContracts: mockContracts.filter((c) => c.status === "active").length,
      totalValueLocked: 125000000,
      gasPrice: 25,
      networkHashRate: 847392,
    })
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
      case "active":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "failed":
      case "deprecated":
        return "bg-red-100 text-red-800"
      case "paused":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "confirmed":
      case "active":
        return <CheckCircle className="h-4 w-4" />
      case "pending":
        return <Clock className="h-4 w-4" />
      case "failed":
      case "deprecated":
        return <Warning className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "assessment":
        return <FileText className="h-4 w-4" />
      case "transfer":
      case "payment":
        return <Coins className="h-4 w-4" />
      case "verification":
        return <Shield className="h-4 w-4" />
      case "audit":
        return <Users className="h-4 w-4" />
      case "escrow":
        return <Lock className="h-4 w-4" />
      case "nft":
        return <TrendingUp className="h-4 w-4" />
      default:
        return <Link className="h-4 w-4" />
    }
  }

  const formatHash = (hash: string) => {
    return `${hash.slice(0, 6)}...${hash.slice(-4)}`
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div><>

          <h1 className="text-3xl font-bold">Blockchain Integration</h1>
          <p
</> className="text-gray-600">Decentralized property assessment and verification</p>
        </div>
        <div className="flex items-center gap-4">
          <Badge className="bg-blue-100 text-blue-800"><>

            <Link className="h-4 w-4 mr-1" />
            Blockchain: ACTIVE
          </Badge>
          <Button
</>>
            <Zap className="h-4 w-4 mr-2" />
            New Transaction
          </Button>
        </div>
      </div>

      {/* Network Status */}
      <Alert className="border-blue-200 bg-blue-50">
        <Globe className="h-4 w-4" /><>

        <AlertTitle>Terrafusion Blockchain Network</AlertTitle>
        <AlertDescription
</>>
          Decentralized property assessment network operating at block height{" "}
          {networkStats.blockHeight.toLocaleString()} with {networkStats.totalTransactions.toLocaleString()} total
          transactions. Network hash rate: {networkStats.networkHashRate.toLocaleString()} TH/s.
        </AlertDescription>
      </Alert>

      {/* Network Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Link className="h-8 w-8 text-blue-600" />
              <div className="text-right"><>

                <div className="text-2xl font-bold">{networkStats.blockHeight.toLocaleString()}</div>
                <div
</> className="text-sm text-gray-600">Block Height</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <TrendingUp className="h-8 w-8 text-green-600" />
              <div className="text-right"><>

                <div className="text-2xl font-bold">{(networkStats.totalTransactions / 1000000).toFixed(1)}M</div>
                <div
</> className="text-sm text-gray-600">Total Transactions</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <FileText className="h-8 w-8 text-purple-600" />
              <div className="text-right"><>

                <div className="text-2xl font-bold">{networkStats.activeContracts}</div>
                <div
</> className="text-sm text-gray-600">Active Contracts</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Coins className="h-8 w-8 text-orange-600" />
              <div className="text-right"><>

                <div className="text-2xl font-bold">${(networkStats.totalValueLocked / 1000000).toFixed(1)}M</div>
                <div
</> className="text-sm text-gray-600">Total Value Locked</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Zap className="h-8 w-8 text-yellow-600" />
              <div className="text-right"><>

                <div className="text-2xl font-bold">{networkStats.gasPrice}</div>
                <div
</> className="text-sm text-gray-600">Gas Price (Gwei)</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Shield className="h-8 w-8 text-red-600" />
              <div className="text-right"><>

                <div className="text-2xl font-bold">{(networkStats.networkHashRate / 1000).toFixed(1)}K</div>
                <div
</> className="text-sm text-gray-600">Hash Rate (TH/s)</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="transactions" className="w-full">
        <TabsList className="grid w-full grid-cols-4"><>

          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger
</> value="contracts">Smart Contracts</TabsTrigger><>

          <TabsTrigger value="nft">Property NFTs</TabsTrigger>
          <TabsTrigger
</> value="governance">Governance</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader><>

              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription
</>>Latest blockchain transactions on the Terrafusion network</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {transactions.map((tx) => (
                  <div key={tx.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3">
                        {getTypeIcon(tx.type)}
                        <div><>

                          <div className="font-medium capitalize">{tx.type} Transaction</div>
                          <div
</> className="text-sm text-gray-600 font-mono">{formatHash(tx.hash)}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(tx.status)}>
                          {getStatusIcon(tx.status)}
                          <span className="ml-1">{tx.status.toUpperCase()}</span>
                        </Badge>
                        {tx.confirmations > 0 && <Badge variant="outline">{tx.confirmations} confirmations</Badge>}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div><>

                        <span className="text-gray-600">From:</span>
                        <div
</> className="font-mono">{formatAddress(tx.from)}</div>
                      </div>
                      <div><>

                        <span className="text-gray-600">To:</span>
                        <div
</> className="font-mono">{formatAddress(tx.to)}</div>
                      </div>
                      <div><>

                        <span className="text-gray-600">Block:</span>
                        <div
</> className="font-mono">{tx.blockNumber.toLocaleString()}</div>
                      </div>
                      <div><>

                        <span className="text-gray-600">Gas Used:</span>
                        <div
</> className="font-mono">{tx.gasUsed.toLocaleString()}</div>
                      </div>
                    </div>

                    {tx.amount && (
                      <div className="mt-3 text-sm"><>

                        <span className="text-gray-600">Amount:</span>
                        <span
</> className="font-bold text-green-600 ml-2">${tx.amount.toLocaleString()}</span>
                      </div>
                    )}<>


                    <div className="mt-3 text-xs text-gray-500">{new Date(tx.timestamp).toLocaleString()}</div>

                    <div
</> className="flex gap-2 mt-3"><>

                      <Button size="sm" variant="outline">
                        View Details
                      </Button>
                      <Button
</> size="sm" variant="outline">
                        View on Explorer
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contracts" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {contracts.map((contract) => (
              <Card key={contract.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between"><>

                    <div className="flex items-center gap-3">
                      {getTypeIcon(contract.type)}
                      {contract.name}
                    </div>
                    <div
</> className="flex items-center gap-2">
                      <Badge className={getStatusColor(contract.status)}>{contract.status.toUpperCase()}</Badge>
                      {contract.verified && <Badge className="bg-green-100 text-green-800">VERIFIED</Badge>}
                    </div>
                  </CardTitle>
                  <CardDescription>
                    <div className="font-mono text-xs">{formatAddress(contract.address)}</div>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div><>

                        <span className="text-gray-600">Version:</span>
                        <div
</> className="font-medium">{contract.version}</div>
                      </div>
                      <div><>

                        <span className="text-gray-600">Deployed:</span>
                        <div
</> className="font-medium">{new Date(contract.deployedAt).toLocaleDateString()}</div>
                      </div>
                      <div><>

                        <span className="text-gray-600">Gas Used:</span>
                        <div
</> className="font-medium">{contract.gasUsed.toLocaleString()}</div>
                      </div>
                      <div><>

                        <span className="text-gray-600">Interactions:</span>
                        <div
</> className="font-medium">{contract.interactions.toLocaleString()}</div>
                      </div>
                    </div>

                    <div><>

                      <div className="text-sm text-gray-600 mb-1">Contract Type</div>
                      <Badge
</> variant="outline" className="capitalize">
                        {contract.type.replace("_", " ")}
                      </Badge>
                    </div>

                    <div className="flex gap-2"><>

                      <Button size="sm" variant="outline">
                        View Source
                      </Button>
                      <Button
</> size="sm" variant="outline">
                        Interact
                      </Button>
                      <Button size="sm" variant="outline">
                        Analytics
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="nft" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {nftProperties.map((nft) => (
              <Card key={nft.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div><>

                      <div>Property NFT #{nft.tokenId}</div>
                      <div
</> className="text-sm font-normal text-gray-600">{nft.parcelNumber}</div>
                    </div>
                    <Badge className="bg-purple-100 text-purple-800">NFT</Badge>
                  </CardTitle>
                  <CardDescription>{nft.address}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div><>

                        <span className="text-gray-600">Owner:</span>
                        <div
</> className="font-mono">{formatAddress(nft.owner)}</div>
                      </div>
                      <div><>

                        <span className="text-gray-600">Assessed Value:</span>
                        <div
</> className="font-bold text-green-600">${nft.assessedValue.toLocaleString()}</div>
                      </div>
                      <div><>

                        <span className="text-gray-600">Last Transfer:</span>
                        <div
</>>{new Date(nft.lastTransfer).toLocaleDateString()}</div>
                      </div>
                      <div><>

                        <span className="text-gray-600">Royalties:</span>
                        <div
</> className="font-medium">{nft.royalties}%</div>
                      </div>
                    </div>

                    <div><>

                      <div className="text-sm font-medium mb-2">Metadata</div>
                      <div
</> className="grid grid-cols-2 gap-2 text-xs">
                        <div><>

                          <span className="text-gray-600">Images:</span>
                          <span
</> className="ml-2">{nft.metadata.images.length}</span>
                        </div>
                        <div><>

                          <span className="text-gray-600">Documents:</span>
                          <span
</> className="ml-2">{nft.metadata.documents.length}</span>
                        </div>
                        <div><>

                          <span className="text-gray-600">Assessments:</span>
                          <span
</> className="ml-2">{nft.metadata.assessments.length}</span>
                        </div>
                        <div><>

                          <span className="text-gray-600">Certificates:</span>
                          <span
</> className="ml-2">{nft.metadata.certificates.length}</span>
                        </div>
                      </div>
                    </div>

                    <div><>

                      <div className="text-sm text-gray-600 mb-1">Transfer History</div>
                      <Progress
</> value={(nft.transferHistory / 10) * 100} />
                      <div className="text-xs text-gray-500 mt-1">{nft.transferHistory} transfers</div>
                    </div>

                    <div className="flex gap-2"><>

                      <Button size="sm">View NFT</Button>
                      <Button
</> size="sm" variant="outline">
                        Transfer
                      </Button>
                      <Button size="sm" variant="outline">
                        Update Metadata
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="governance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><>

                  <Users className="h-5 w-5" />
                  DAO Governance
                </CardTitle>
                <CardDescription
</>>Decentralized governance for network decisions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center"><>

                    <div className="text-3xl font-bold text-blue-600">2,847</div>
                    <div
</> className="text-sm text-gray-600">Active Voters</div>
                  </div>

                  <div className="space-y-3">
                    <div className="border rounded-lg p-3"><>

                      <div className="font-medium mb-1">Proposal #15: Network Upgrade v3.0</div>
                      <div
</> className="text-sm text-gray-600 mb-2">Implement quantum-resistant consensus mechanism</div>
                      <div className="flex justify-between text-sm"><>

                        <span>For: 78.5%</span>
                        <span
</>>Against: 21.5%</span>
                      </div>
                      <Progress value={78.5} className="mt-1" />
                      <div className="text-xs text-gray-500 mt-1">Ends in 3 days</div>
                    </div>

                    <div className="border rounded-lg p-3"><>

                      <div className="font-medium mb-1">Proposal #14: Fee Structure Update</div>
                      <div
</> className="text-sm text-gray-600 mb-2">Adjust transaction fees for better scalability</div>
                      <div className="flex justify-between text-sm"><>

                        <span>For: 92.1%</span>
                        <span
</>>Against: 7.9%</span>
                      </div>
                      <Progress value={92.1} className="mt-1" />
                      <Badge className="bg-green-100 text-green-800 mt-2">PASSED</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><>

                  <Coins className="h-5 w-5" />
                  Token Economics
                </CardTitle>
                <CardDescription
</>>TERRA token distribution and staking</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 border rounded-lg"><>

                      <div className="text-2xl font-bold text-purple-600">1B</div>
                      <div
</> className="text-sm text-gray-600">Total Supply</div>
                    </div>
                    <div className="text-center p-3 border rounded-lg"><>

                      <div className="text-2xl font-bold text-green-600">847M</div>
                      <div
</> className="text-sm text-gray-600">Circulating</div>
                    </div>
                  </div>

                  <div><>

                    <div className="text-sm font-medium mb-2">Token Distribution</div>
                    <div
</> className="space-y-2">
                      <div className="flex justify-between text-sm"><>

                        <span>Staking Rewards</span>
                        <span
</>>35%</span>
                      </div>
                      <div className="flex justify-between text-sm"><>

                        <span>Ecosystem Development</span>
                        <span
</>>25%</span>
                      </div>
                      <div className="flex justify-between text-sm"><>

                        <span>Team & Advisors</span>
                        <span
</>>20%</span>
                      </div>
                      <div className="flex justify-between text-sm"><>

                        <span>Public Sale</span>
                        <span
</>>15%</span>
                      </div>
                      <div className="flex justify-between text-sm"><>

                        <span>Reserve Fund</span>
                        <span
</>>5%</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-center"><>

                    <div className="text-lg font-bold text-orange-600">12.5%</div>
                    <div
</> className="text-sm text-gray-600">Current APY</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Alert>
            <Users className="h-4 w-4" /><>

            <AlertTitle>Decentralized Governance</AlertTitle>
            <AlertDescription
</>>
              Terrafusion operates as a decentralized autonomous organization (DAO) where TERRA token holders can
              propose and vote on network upgrades, fee structures, and governance policies. All major decisions are
              made through transparent on-chain voting.
            </AlertDescription>
          </Alert>
        </TabsContent>
      </Tabs>
    </div>
  )
}
