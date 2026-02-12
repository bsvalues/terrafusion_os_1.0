import crypto from "crypto";
import { TerraFusionComp } from "./rust-importer-bridge";

export interface AuditLogEntry {
  id: string;
  jobId: string;
  compHash: string;
  merkleRoot?: string;
  blockchainTxId?: string;
  createdAt: Date;
}

export class AuditLogger {
  private auditLogs: Map<string, AuditLogEntry[]> = new Map();
  private merkleRoots: Map<string, string> = new Map();

  constructor() {}

  public hashComp(comp: TerraFusionComp): string {
    const serialized = JSON.stringify(comp, Object.keys(comp).sort());
    return crypto.createHash("sha256").update(serialized).digest("hex");
  }

  public logCompImport(jobId: string, comp: TerraFusionComp): string {
    const compHash = this.hashComp(comp);
    const id = crypto.randomUUID();

    const entry: AuditLogEntry = {
      id,
      jobId,
      compHash,
      createdAt: new Date(),
    };

    if (!this.auditLogs.has(jobId)) {
      this.auditLogs.set(jobId, []);
    }

    this.auditLogs.get(jobId)!.push(entry);
    return compHash;
  }

  public calculateMerkleRoot(jobId: string): string {
    const entries = this.auditLogs.get(jobId) || [];
    const hashes = entries.map((entry) => entry.compHash);

    if (hashes.length === 0) {
      return "";
    }

    if (hashes.length === 1) {
      return hashes[0];
    }

    // Build Merkle tree
    let level = hashes;
    while (level.length > 1) {
      const nextLevel: string[] = [];

      for (let i = 0; i < level.length; i += 2) {
        const left = level[i];
        const right = i + 1 < level.length ? level[i + 1] : left;
        const combined = left + right;
        const hash = crypto.createHash("sha256").update(combined).digest("hex");
        nextLevel.push(hash);
      }

      level = nextLevel;
    }

    const merkleRoot = level[0];
    this.merkleRoots.set(jobId, merkleRoot);

    // Update all entries with the Merkle root
    const jobEntries = this.auditLogs.get(jobId);
    if (jobEntries) {
      jobEntries.forEach((entry) => {
        entry.merkleRoot = merkleRoot;
      });
    }

    return merkleRoot;
  }

  public async publishToBlockchain(jobId: string, merkleRoot: string): Promise<string | null> {
    try {
      // Simulate blockchain transaction
      // In production, this would use Web3, Ethereum, or other blockchain APIs
      const txId = `tx_${Date.now()}_${crypto.randomBytes(16).toString("hex")}`;

      console.log(`[Blockchain] Publishing Merkle root for job ${jobId}: ${merkleRoot}`);
      console.log(`[Blockchain] Transaction ID: ${txId}`);

      // Update audit entries with blockchain transaction ID
      const entries = this.auditLogs.get(jobId);
      if (entries) {
        entries.forEach((entry) => {
          entry.blockchainTxId = txId;
        });
      }

      return txId;
    } catch (error) {
      console.error(`[Blockchain] Failed to publish to blockchain:`, error);
      return null;
    }
  }

  public finalizeJobAudit(jobId: string): Promise<{ merkleRoot: string; txId: string | null }> {
    const merkleRoot = this.calculateMerkleRoot(jobId);
    return this.publishToBlockchain(jobId, merkleRoot).then((txId) => ({
      merkleRoot,
      txId,
    }));
  }

  public getAuditLog(jobId: string): AuditLogEntry[] {
    return this.auditLogs.get(jobId) || [];
  }

  public getAllAuditLogs(): AuditLogEntry[] {
    const allLogs: AuditLogEntry[] = [];
    for (const logs of this.auditLogs.values()) {
      allLogs.push(...logs);
    }
    return allLogs;
  }

  public exportAuditReport(jobId?: string): {
    summary: {
      totalJobs: number;
      totalRecords: number;
      totalHashes: number;
      blockchainTransactions: number;
    };
    logs: AuditLogEntry[];
  } {
    const logs = jobId ? this.getAuditLog(jobId) : this.getAllAuditLogs();

    const uniqueJobs = new Set(logs.map((log) => log.jobId)).size;
    const uniqueTxs = new Set(logs.map((log) => log.blockchainTxId).filter(Boolean)).size;

    return {
      summary: {
        totalJobs: uniqueJobs,
        totalRecords: logs.length,
        totalHashes: logs.length,
        blockchainTransactions: uniqueTxs,
      },
      logs,
    };
  }

  public verifyIntegrity(jobId: string, comp: TerraFusionComp): boolean {
    const calculatedHash = this.hashComp(comp);
    const entries = this.auditLogs.get(jobId) || [];

    return entries.some((entry) => entry.compHash === calculatedHash);
  }
}

// Global singleton instance
export const auditLogger = new AuditLogger();
