import { Router } from "express";
import { NFTMintingService } from "../services/nft-minting";
import { PredictiveModelingService } from "../services/predictive-modeling";
import { DroneCoordinationService } from "../services/drone-coordination";
import { ZeroTrustMeshFederation } from "../services/mesh-federation";

const router = Router();

// Initialize services
const nftService = new NFTMintingService();
const predictionService = new PredictiveModelingService();
const droneService = new DroneCoordinationService();
const federationService = new ZeroTrustMeshFederation();

// NFT Minting Endpoints
router.post("/nft/mint/:jobId", async (req, res) => {
  try {
    const { jobId } = req.params;
    const { ownerAddress } = req.body;

    if (!ownerAddress) {
      return res.status(400).json({ error: "Owner address is required" });
    }

    // Get comp data from job
    const compData = {
      jobId,
      address: req.body.address || "123 Main St",
      salePrice: req.body.salePrice || 450000,
      gla: req.body.gla || 1850,
      zipCode: req.body.zipCode || "90210",
      county: req.body.county || "Los Angeles",
      saleDate: req.body.saleDate || new Date().toISOString(),
      merkleHash: req.body.merkleHash || `hash_${jobId}`,
    };

    const result = await nftService.mintCompNFT(compData, ownerAddress);

    res.json({
      success: true,
      tokenId: result.tokenId,
      transactionHash: result.transactionHash,
      message: "Comp NFT minted successfully",
    });
  } catch (error) {
    console.error("NFT minting error:", error);
    res.status(500).json({ error: "Failed to mint NFT" });
  }
});

router.post("/nft/verify/:tokenId", async (req, res) => {
  try {
    const { tokenId } = req.params;
    const { merkleHash } = req.body;

    if (!merkleHash) {
      return res.status(400).json({ error: "Merkle hash is required" });
    }

    const transactionHash = await nftService.verifyCompNFT(parseInt(tokenId), merkleHash);

    res.json({
      success: true,
      transactionHash,
      message: "NFT verified successfully",
    });
  } catch (error) {
    console.error("NFT verification error:", error);
    res.status(500).json({ error: "Failed to verify NFT" });
  }
});

router.get("/nft/data/:tokenId", async (req, res) => {
  try {
    const { tokenId } = req.params;
    const nftData = await nftService.getCompNFTData(parseInt(tokenId));

    if (!nftData) {
      return res.status(404).json({ error: "NFT not found" });
    }

    res.json(nftData);
  } catch (error) {
    console.error("NFT data retrieval error:", error);
    res.status(500).json({ error: "Failed to retrieve NFT data" });
  }
});

// Predictive Modeling Endpoints
router.post("/predict/zipcode", async (req, res) => {
  try {
    const { zipCode, features } = req.body;

    if (!zipCode) {
      return res.status(400).json({ error: "ZIP code is required" });
    }

    const input = {
      zipCode,
      timestamp: new Date().toISOString(),
      features: {
        averageGLA: features?.averageGLA || 1800,
        medianPrice: features?.medianPrice || 400000,
        salesVolume: features?.salesVolume || 50,
        daysOnMarket: features?.daysOnMarket || 30,
        pricePerSqft: features?.pricePerSqft || 250,
        zoningMix: features?.zoningMix || { R1: 0.7, R2: 0.2, C1: 0.1 },
        neighboringZipTrends: features?.neighboringZipTrends || {},
      },
    };

    const prediction = await predictionService.predictZipPrice(input);

    res.json({
      success: true,
      prediction,
    });
  } catch (error) {
    console.error("Prediction error:", error);
    res.status(500).json({ error: "Failed to generate prediction" });
  }
});

router.get("/risk/assessment/:zipCode", async (req, res) => {
  try {
    const { zipCode } = req.params;
    const assessment = await predictionService.generateRiskAssessment(zipCode);

    res.json({
      success: true,
      assessment,
    });
  } catch (error) {
    console.error("Risk assessment error:", error);
    res.status(500).json({ error: "Failed to generate risk assessment" });
  }
});

// Drone Coordination Endpoints
router.get("/drones/fleet", (req, res) => {
  try {
    const fleetStatus = droneService.getFleetStatus();
    res.json(fleetStatus);
  } catch (error) {
    console.error("Fleet status error:", error);
    res.status(500).json({ error: "Failed to get fleet status" });
  }
});

router.post("/drones/scan", async (req, res) => {
  try {
    const { zipCode, coordinates, requirements } = req.body;

    if (!zipCode || !coordinates) {
      return res.status(400).json({ error: "ZIP code and coordinates are required" });
    }

    const jobId = droneService.requestPropertyScan(
      zipCode,
      coordinates,
      requirements || ["ocr", "camera"]
    );

    res.json({
      success: true,
      jobId,
      message: "Property scan job created",
    });
  } catch (error) {
    console.error("Drone scan error:", error);
    res.status(500).json({ error: "Failed to create scan job" });
  }
});

router.post("/drones/measure", async (req, res) => {
  try {
    const { zipCode, coordinates } = req.body;

    if (!zipCode || !coordinates) {
      return res.status(400).json({ error: "ZIP code and coordinates are required" });
    }

    const jobId = droneService.requestStructureMeasurement(zipCode, coordinates);

    res.json({
      success: true,
      jobId,
      message: "Structure measurement job created",
    });
  } catch (error) {
    console.error("Drone measurement error:", error);
    res.status(500).json({ error: "Failed to create measurement job" });
  }
});

router.get("/drones/job/:jobId", (req, res) => {
  try {
    const { jobId } = req.params;
    const jobStatus = droneService.getJobStatus(jobId);

    if (!jobStatus) {
      return res.status(404).json({ error: "Job not found" });
    }

    res.json(jobStatus);
  } catch (error) {
    console.error("Job status error:", error);
    res.status(500).json({ error: "Failed to get job status" });
  }
});

// Federation Endpoints
router.get("/federation/status", (req, res) => {
  try {
    const status = federationService.getFederationStatus();
    res.json(status);
  } catch (error) {
    console.error("Federation status error:", error);
    res.status(500).json({ error: "Failed to get federation status" });
  }
});

router.post("/federation/message", async (req, res) => {
  try {
    const message = req.body;
    const response = await federationService.handleMessage(message);
    res.json(response);
  } catch (error) {
    console.error("Federation message error:", error);
    res.status(500).json({ error: "Failed to handle federation message" });
  }
});

router.post("/federation/register", async (req, res) => {
  try {
    const nodeData = req.body;
    await federationService.registerPeer(nodeData);
    res.json({ success: true, message: "Peer registered successfully" });
  } catch (error) {
    console.error("Peer registration error:", error);
    res.status(500).json({ error: "Failed to register peer" });
  }
});

// Meta Infrastructure Status
router.get("/status", (req, res) => {
  try {
    // Safely get NFT status
    let nftStatus;
    try {
      nftStatus = {
        configured: nftService.isBlockchainConfigured(),
        status: "operational",
      };
    } catch (error) {
      nftStatus = {
        configured: false,
        status: "configuration_needed",
      };
    }

    // Safely get drone status
    let droneStatus;
    try {
      droneStatus = droneService.getFleetStatus();
    } catch (error) {
      droneStatus = {
        totalDrones: 0,
        activeDrones: 0,
        pendingJobs: 0,
        activeJobs: 0,
      };
    }

    // Safely get federation status
    let federationStatus;
    try {
      federationStatus = federationService.getFederationStatus();
    } catch (error) {
      federationStatus = {
        nodeId: "demo-node",
        totalPeers: 0,
        onlinePeers: 0,
      };
    }

    const status = {
      nft: nftStatus,
      prediction: {
        status: "operational",
      },
      drones: droneStatus,
      federation: federationStatus,
      timestamp: new Date().toISOString(),
    };

    res.json(status);
  } catch (error) {
    console.error("Status error:", error);
    res.status(500).json({ error: "Failed to get system status" });
  }
});

export default router;
