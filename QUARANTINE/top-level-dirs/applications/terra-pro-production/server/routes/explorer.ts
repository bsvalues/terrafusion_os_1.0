import { Router, Request, Response } from "express";
import crypto from "crypto";

const router = Router();

// Mock blockchain verification data for demo
const mockRegistryData = [
  {
    job_id: "job_tf_001",
    root_hash: "0xa1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456",
    blockchain_tx_id: "0x7f8e9d0c1b2a39485764534231098765432109876543210987654321098765",
    timestamp: "2025-05-29T18:30:00Z",
    verified: true,
    entry_count: 247,
    comp_hashes: [
      "0x1234567890abcdef1234567890abcdef12345678",
      "0x2345678901bcdef12345678901bcdef123456789",
      "0x3456789012cdef123456789012cdef1234567890",
    ],
    metadata: {
      county: "Del Norte",
      file_count: 5,
      source_formats: ["SQLite", "CSV", "XML"],
    },
  },
  {
    job_id: "job_tf_002",
    root_hash: "0xb2c3d4e5f6789012345678901234567890abcdef1234567890abcdef1234567a",
    blockchain_tx_id: "0x8f9e0d1c2b3a49586754632140987654321098765432109876543210987654",
    timestamp: "2025-05-29T16:15:00Z",
    verified: true,
    entry_count: 89,
    comp_hashes: [
      "0x4567890123def4567890123def4567890123def4",
      "0x5678901234ef56789012345ef56789012345ef56",
    ],
    metadata: {
      county: "Mendocino",
      file_count: 2,
      source_formats: ["CSV"],
    },
  },
];

// Search endpoint
router.get("/", async (req: Request, res: Response) => {
  try {
    const { q } = req.query;

    if (!q || typeof q !== "string") {
      return res.status(400).json({ error: "Query parameter required" });
    }

    const query = q.toLowerCase().trim();

    // Search through mock data
    const result = mockRegistryData.find(
      (entry) =>
        entry.job_id.toLowerCase().includes(query) ||
        entry.root_hash.toLowerCase().includes(query) ||
        entry.blockchain_tx_id.toLowerCase().includes(query) ||
        entry.comp_hashes.some((hash) => hash.toLowerCase().includes(query)) ||
        (entry.metadata?.county && entry.metadata.county.toLowerCase().includes(query))
    );

    if (!result) {
      return res.status(404).json({ error: "No records found" });
    }

    // Simulate blockchain verification
    const verified = await simulateBlockchainVerification(
      result.blockchain_tx_id,
      result.root_hash
    );

    res.json({
      ...result,
      verified,
    });
  } catch (error) {
    console.error("Explorer search error:", error);
    res.status(500).json({ error: "Search failed" });
  }
});

// Simulate blockchain verification (in production, this would call actual blockchain APIs)
async function simulateBlockchainVerification(txId: string, rootHash: string): Promise<boolean> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 100));

  // Mock verification logic - in production this would:
  // 1. Connect to Ethereum/blockchain network
  // 2. Query transaction by txId
  // 3. Verify the rootHash is stored in the transaction data
  // 4. Check transaction confirmation status

  return true; // Mock successful verification
}

export default router;
