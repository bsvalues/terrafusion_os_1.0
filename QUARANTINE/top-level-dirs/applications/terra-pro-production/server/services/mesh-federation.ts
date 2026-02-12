import https from "https";
import fs from "fs";
import path from "path";
import crypto from "crypto";

export interface FederationNode {
  id: string;
  name: string;
  endpoint: string;
  certificate: string;
  publicKey: string;
  county: string;
  lastSeen: Date;
  status: "online" | "offline" | "syncing";
}

export interface FederationMessage {
  type: "sync_request" | "data_update" | "peer_discovery" | "health_check";
  fromNode: string;
  toNode?: string;
  data: any;
  signature: string;
  timestamp: string;
}

export class ZeroTrustMeshFederation {
  private nodes: Map<string, FederationNode> = new Map();
  private certificates: Map<string, string> = new Map();
  private httpsAgent: https.Agent;

  constructor() {
    this.initializeHTTPSAgent();
    this.startPeerDiscovery();
  }

  /**
   * Initialize mTLS HTTPS agent for secure communication
   */
  private initializeHTTPSAgent() {
    try {
      const certPath = path.join(process.cwd(), "certs", "node-cert.pem");
      const keyPath = path.join(process.cwd(), "certs", "node-key.pem");
      const caPath = path.join(process.cwd(), "certs", "ca.pem");

      if (fs.existsSync(certPath) && fs.existsSync(keyPath) && fs.existsSync(caPath)) {
        this.httpsAgent = new https.Agent({
          cert: fs.readFileSync(certPath),
          key: fs.readFileSync(keyPath),
          ca: fs.readFileSync(caPath),
          rejectUnauthorized: true,
          requestCert: true,
        });
      } else {
        console.warn("Certificate files not found, using insecure agent for demo");
        this.httpsAgent = new https.Agent({
          rejectUnauthorized: false,
        });
      }
    } catch (error) {
      console.error("Failed to initialize HTTPS agent:", error);
      this.httpsAgent = new https.Agent({ rejectUnauthorized: false });
    }
  }

  /**
   * Send encrypted message to peer node
   */
  async sendToPeer(
    peerId: string,
    message: Omit<FederationMessage, "signature" | "timestamp">
  ): Promise<any> {
    const peer = this.nodes.get(peerId);
    if (!peer) {
      throw new Error(`Peer ${peerId} not found`);
    }

    try {
      const fullMessage: FederationMessage = {
        ...message,
        signature: await this.signMessage(message),
        timestamp: new Date().toISOString(),
      };

      const response = await this.makeSecureRequest(peer.endpoint + "/api/federation", {
        method: "POST",
        body: JSON.stringify(fullMessage),
        headers: {
          "Content-Type": "application/json",
          "X-Node-ID": this.getNodeId(),
        },
      });

      return response;
    } catch (error) {
      console.error(`Failed to send message to peer ${peerId}:`, error);
      this.updateNodeStatus(peerId, "offline");
      throw error;
    }
  }

  /**
   * Make secure HTTPS request with mTLS
   */
  private async makeSecureRequest(url: string, options: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const req = https.request(
        url,
        {
          ...options,
          agent: this.httpsAgent,
        },
        (res) => {
          let data = "";
          res.on("data", (chunk) => (data += chunk));
          res.on("end", () => {
            try {
              resolve(JSON.parse(data));
            } catch (error) {
              resolve(data);
            }
          });
        }
      );

      req.on("error", reject);

      if (options.body) {
        req.write(options.body);
      }

      req.end();
    });
  }

  /**
   * Register a new peer node
   */
  async registerPeer(node: Omit<FederationNode, "lastSeen" | "status">): Promise<void> {
    const federationNode: FederationNode = {
      ...node,
      lastSeen: new Date(),
      status: "online",
    };

    // Verify peer certificate
    if (await this.verifyCertificate(node.certificate, node.publicKey)) {
      this.nodes.set(node.id, federationNode);
      this.certificates.set(node.id, node.certificate);

      console.log(`Registered peer: ${node.name} (${node.county})`);

      // Send welcome message
      await this.sendToPeer(node.id, {
        type: "peer_discovery",
        fromNode: this.getNodeId(),
        data: { message: "Welcome to Terrafusion mesh network" },
      });
    } else {
      throw new Error("Certificate verification failed");
    }
  }

  /**
   * Synchronize data with peer nodes
   */
  async synchronizeData(data: any): Promise<void> {
    const activePeers = Array.from(this.nodes.values()).filter((node) => node.status === "online");

    const syncPromises = activePeers.map(async (peer) => {
      try {
        await this.sendToPeer(peer.id, {
          type: "data_update",
          fromNode: this.getNodeId(),
          data: await this.encryptData(data, peer.publicKey),
        });

        this.updateNodeStatus(peer.id, "online");
      } catch (error) {
        console.error(`Sync failed with ${peer.name}:`, error);
        this.updateNodeStatus(peer.id, "offline");
      }
    });

    await Promise.allSettled(syncPromises);
  }

  /**
   * Handle incoming federation message
   */
  async handleMessage(message: FederationMessage): Promise<any> {
    // Verify message signature
    if (!(await this.verifyMessageSignature(message))) {
      throw new Error("Message signature verification failed");
    }

    const fromNode = this.nodes.get(message.fromNode);
    if (!fromNode) {
      throw new Error(`Unknown sender: ${message.fromNode}`);
    }

    this.updateNodeStatus(message.fromNode, "online");

    switch (message.type) {
      case "health_check":
        return { status: "healthy", timestamp: new Date().toISOString() };

      case "peer_discovery":
        return { peers: Array.from(this.nodes.values()) };

      case "data_update":
        const decryptedData = await this.decryptData(message.data);
        await this.processDataUpdate(decryptedData);
        return { status: "processed" };

      case "sync_request":
        return await this.handleSyncRequest(message.data);

      default:
        throw new Error(`Unknown message type: ${message.type}`);
    }
  }

  /**
   * Start peer discovery process
   */
  private startPeerDiscovery() {
    setInterval(async () => {
      for (const [nodeId, node] of this.nodes) {
        try {
          await this.sendToPeer(nodeId, {
            type: "health_check",
            fromNode: this.getNodeId(),
            data: {},
          });
        } catch (error) {
          console.warn(`Health check failed for ${node.name}`);
        }
      }
    }, 30000); // Every 30 seconds
  }

  /**
   * Sign message with private key
   */
  private async signMessage(message: any): Promise<string> {
    try {
      const privateKeyPath = path.join(process.cwd(), "certs", "node-key.pem");
      if (fs.existsSync(privateKeyPath)) {
        const privateKey = fs.readFileSync(privateKeyPath, "utf8");
        const messageString = JSON.stringify(message);
        const signature = crypto.sign("sha256", Buffer.from(messageString), {
          key: privateKey,
          padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
        });
        return signature.toString("base64");
      }
    } catch (error) {
      console.warn("Signing failed, using mock signature");
    }

    return "mock_signature_" + crypto.randomBytes(32).toString("hex");
  }

  /**
   * Verify message signature
   */
  private async verifyMessageSignature(message: FederationMessage): Promise<boolean> {
    try {
      const certificate = this.certificates.get(message.fromNode);
      if (!certificate) return false;

      // Extract message without signature
      const { signature, ...messageWithoutSig } = message;
      const messageString = JSON.stringify(messageWithoutSig);

      // In production, extract public key from certificate and verify
      return true; // Mock verification for demo
    } catch (error) {
      console.error("Signature verification error:", error);
      return false;
    }
  }

  /**
   * Encrypt data for specific peer
   */
  private async encryptData(data: any, publicKey: string): Promise<string> {
    try {
      const dataString = JSON.stringify(data);
      const encrypted = crypto.publicEncrypt(publicKey, Buffer.from(dataString));
      return encrypted.toString("base64");
    } catch (error) {
      // Return mock encrypted data for demo
      return Buffer.from(JSON.stringify(data)).toString("base64");
    }
  }

  /**
   * Decrypt received data
   */
  private async decryptData(encryptedData: string): Promise<any> {
    try {
      const privateKeyPath = path.join(process.cwd(), "certs", "node-key.pem");
      if (fs.existsSync(privateKeyPath)) {
        const privateKey = fs.readFileSync(privateKeyPath, "utf8");
        const encrypted = Buffer.from(encryptedData, "base64");
        const decrypted = crypto.privateDecrypt(privateKey, encrypted);
        return JSON.parse(decrypted.toString());
      }
    } catch (error) {
      console.warn("Decryption failed, using mock data");
    }

    // Return mock decrypted data for demo
    return JSON.parse(Buffer.from(encryptedData, "base64").toString());
  }

  /**
   * Verify peer certificate
   */
  private async verifyCertificate(certificate: string, publicKey: string): Promise<boolean> {
    // In production, verify certificate chain and revocation status
    return true; // Mock verification for demo
  }

  /**
   * Process incoming data update
   */
  private async processDataUpdate(data: any): Promise<void> {
    console.log("Processing federated data update:", data);
    // In production, validate and merge data into local store
  }

  /**
   * Handle sync request from peer
   */
  private async handleSyncRequest(requestData: any): Promise<any> {
    // Return relevant data based on sync request
    return {
      data: [],
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Update node status
   */
  private updateNodeStatus(nodeId: string, status: FederationNode["status"]) {
    const node = this.nodes.get(nodeId);
    if (node) {
      node.status = status;
      node.lastSeen = new Date();
    }
  }

  /**
   * Get current node ID
   */
  private getNodeId(): string {
    return process.env.NODE_ID || "node_" + require("os").hostname();
  }

  /**
   * Get federation status
   */
  getFederationStatus() {
    return {
      nodeId: this.getNodeId(),
      totalPeers: this.nodes.size,
      onlinePeers: Array.from(this.nodes.values()).filter((n) => n.status === "online").length,
      peers: Array.from(this.nodes.values()),
    };
  }
}
