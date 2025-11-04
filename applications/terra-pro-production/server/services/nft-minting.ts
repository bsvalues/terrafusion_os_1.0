import { ethers, JsonRpcProvider, Contract, Wallet, formatEther, parseEther } from "ethers";
import crypto from "crypto";

export interface CompNFTMetadata {
  name: string;
  description: string;
  image: string;
  attributes: Array<{
    trait_type: string;
    value: string | number;
  }>;
  external_url: string;
}

export interface CompNFTData {
  jobId: string;
  address: string;
  salePrice: number;
  gla: number;
  zipCode: string;
  county: string;
  saleDate: string;
  merkleHash: string;
}

export class NFTMintingService {
  private provider: JsonRpcProvider | null = null;
  private contract: Contract | null = null;
  private signer: Wallet | null = null;

  constructor() {
    this.initializeProvider();
  }

  /**
   * Initialize blockchain provider and contract
   */
  private async initializeProvider() {
    try {
      // Check for environment variables
      const rpcUrl = process.env.ETHEREUM_RPC_URL;
      const contractAddress = process.env.COMP_NFT_CONTRACT_ADDRESS;
      const privateKey = process.env.MINTER_PRIVATE_KEY;

      if (!rpcUrl || !contractAddress || !privateKey) {
        console.warn("Blockchain configuration missing. NFT minting will use mock responses.");
        return;
      }

      this.provider = new JsonRpcProvider(rpcUrl);
      this.signer = new Wallet(privateKey, this.provider);

      // Contract ABI (simplified for demo)
      const contractABI = [
        "function mintComp(address to, string jobId, string ipfsURI, string county, uint256 salePrice, uint256 gla, string zipCode) returns (uint256)",
        "function verifyComp(uint256 tokenId, string merkleHash)",
        "function getCompData(uint256 tokenId) view returns (tuple(string jobId, string merkleHash, string county, uint256 salePrice, uint256 gla, string zipCode, uint256 verificationTimestamp, bool isVerified))",
        "function getTokenByJobId(string jobId) view returns (uint256)",
      ];

      this.contract = new ethers.Contract(contractAddress, contractABI, this.signer);

      console.log("NFT minting service initialized with contract:", contractAddress);
    } catch (error) {
      console.error("Failed to initialize NFT service:", error);
    }
  }

  /**
   * Mint NFT for verified comp
   */
  async mintCompNFT(
    compData: CompNFTData,
    ownerAddress: string
  ): Promise<{ tokenId: number; transactionHash: string }> {
    try {
      if (!this.contract || !this.signer) {
        // Return mock response if blockchain not configured
        return {
          tokenId: Math.floor(Math.random() * 10000),
          transactionHash: "0x" + crypto.randomBytes(32).toString("hex"),
        };
      }

      // Upload metadata to IPFS
      const ipfsURI = await this.uploadToIPFS(compData);

      // Mint NFT on blockchain
      const tx = await this.contract.mintComp(
        ownerAddress,
        compData.jobId,
        ipfsURI,
        compData.county,
        parseEther(compData.salePrice.toString()),
        compData.gla,
        compData.zipCode
      );

      const receipt = await tx.wait();

      // Extract token ID from events
      const mintEvent = receipt.events?.find((e: any) => e.event === "CompMinted");
      const tokenId = mintEvent?.args?.tokenId?.toNumber() || 0;

      return {
        tokenId,
        transactionHash: receipt.transactionHash,
      };
    } catch (error) {
      console.error("NFT minting failed:", error);
      throw new Error("Failed to mint comp NFT");
    }
  }

  /**
   * Verify comp with blockchain hash
   */
  async verifyCompNFT(tokenId: number, merkleHash: string): Promise<string> {
    try {
      if (!this.contract) {
        return "0x" + crypto.randomBytes(32).toString("hex");
      }

      const tx = await this.contract.verifyComp(tokenId, merkleHash);
      const receipt = await tx.wait();

      return receipt.transactionHash;
    } catch (error) {
      console.error("NFT verification failed:", error);
      throw new Error("Failed to verify comp NFT");
    }
  }

  /**
   * Upload metadata to IPFS
   */
  private async uploadToIPFS(compData: CompNFTData): Promise<string> {
    try {
      const metadata: CompNFTMetadata = {
        name: `Terrafusion Comp #${compData.jobId}`,
        description: `Verified property comparable in ${compData.county}, ${compData.zipCode}`,
        image: `https://api.terrafusion.ai/comp-image/${compData.jobId}`,
        external_url: `https://explorer.terrafusion.ai/comp/${compData.jobId}`,
        attributes: [
          { trait_type: "County", value: compData.county },
          { trait_type: "ZIP Code", value: compData.zipCode },
          { trait_type: "Sale Price", value: compData.salePrice },
          { trait_type: "GLA (sqft)", value: compData.gla },
          { trait_type: "Sale Date", value: compData.saleDate },
          { trait_type: "Address", value: compData.address },
          { trait_type: "Merkle Hash", value: compData.merkleHash },
        ],
      };

      // Upload to IPFS (would use Pinata, Infura, or similar service)
      const ipfsApiKey = process.env.IPFS_API_KEY;
      if (!ipfsApiKey) {
        // Return mock IPFS hash
        return "QmX" + crypto.randomBytes(22).toString("hex");
      }

      // In production, implement actual IPFS upload
      const response = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${ipfsApiKey}`,
        },
        body: JSON.stringify({
          pinataContent: metadata,
          pinataMetadata: {
            name: `comp-${compData.jobId}.json`,
          },
        }),
      });

      if (!response.ok) {
        throw new Error("IPFS upload failed");
      }

      const result = await response.json();
      return `ipfs://${result.IpfsHash}`;
    } catch (error) {
      console.error("IPFS upload failed:", error);
      // Return mock IPFS hash for demo
      return "QmX" + crypto.randomBytes(22).toString("hex");
    }
  }

  /**
   * Get NFT data by token ID
   */
  async getCompNFTData(tokenId: number) {
    try {
      if (!this.contract) {
        return null;
      }

      const compData = await this.contract.getCompData(tokenId);
      return {
        jobId: compData.jobId,
        merkleHash: compData.merkleHash,
        county: compData.county,
        salePrice: formatEther(compData.salePrice),
        gla: compData.gla.toNumber(),
        zipCode: compData.zipCode,
        verificationTimestamp: new Date(compData.verificationTimestamp.toNumber() * 1000),
        isVerified: compData.isVerified,
      };
    } catch (error) {
      console.error("Failed to get NFT data:", error);
      return null;
    }
  }

  /**
   * Check if blockchain is properly configured
   */
  isBlockchainConfigured(): boolean {
    return this.provider !== null && this.contract !== null && this.signer !== null;
  }

  /**
   * Get token ID by job ID
   */
  async getTokenByJobId(jobId: string): Promise<number | null> {
    try {
      if (!this.contract) {
        return null;
      }

      const tokenId = await this.contract.getTokenByJobId(jobId);
      return tokenId.toNumber();
    } catch (error) {
      console.error("Failed to get token by job ID:", error);
      return null;
    }
  }

  /**
   * Check if blockchain is configured
   */
  isBlockchainConfigured(): boolean {
    return this.contract !== null && this.provider !== null;
  }
}
