import { spawn, ChildProcess } from "child_process";
import { EventEmitter } from "events";
import path from "path";
import fs from "fs";
import { auditLogger } from "./audit-logger";

export interface ImportJob {
  id: string;
  userId: number;
  fileName: string;
  filePath: string;
  format: string;
  status: "pending" | "processing" | "complete" | "error";
  progress: number;
  recordsProcessed: number;
  totalRecords: number;
  error?: string;
  createdAt: Date;
  completedAt?: Date;
}

export interface TerraFusionComp {
  address: string;
  sale_price_usd: number;
  gla_sqft: number;
  sale_date: string;
  source_table: string;
  bedrooms?: number;
  bathrooms?: number;
  lot_size_sqft?: number;
  year_built?: number;
  property_type?: string;
}

export class RustImporterBridge extends EventEmitter {
  private jobs: Map<string, ImportJob> = new Map();
  private activeProcesses: Map<string, ChildProcess> = new Map();
  private rustBinaryPath: string;

  constructor() {
    super();
    this.rustBinaryPath =
      process.env.RUST_IMPORTER_BIN || "./terrafusion_import/target/release/terrafusion_import";
    this.ensureRustBinary();
  }

  private ensureRustBinary(): void {
    if (!fs.existsSync(this.rustBinaryPath)) {
      console.warn(`Rust binary not found at ${this.rustBinaryPath}. Building...`);
      this.buildRustBinary();
    }
  }

  private buildRustBinary(): void {
    try {
      const buildProcess = spawn("cargo", ["build", "--release"], {
        cwd: "./terrafusion_import",
        stdio: "pipe",
      });

      buildProcess.on("close", (code) => {
        if (code === 0) {
          console.log("Rust binary built successfully");
        } else {
          console.error("Failed to build Rust binary");
        }
      });
    } catch (error) {
      console.error("Error building Rust binary:", error);
    }
  }

  public createJob(userId: number, fileName: string, filePath: string, format: string): string {
    const id = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const job: ImportJob = {
      id,
      userId,
      fileName,
      filePath,
      format,
      status: "pending",
      progress: 0,
      recordsProcessed: 0,
      totalRecords: 0,
      createdAt: new Date(),
    };

    this.jobs.set(id, job);
    this.emit("jobCreated", job);

    // Auto-start processing
    setTimeout(() => this.processJob(id), 100);

    return id;
  }

  public getJob(id: string): ImportJob | undefined {
    return this.jobs.get(id);
  }

  public getAllJobs(): ImportJob[] {
    return Array.from(this.jobs.values());
  }

  public getJobsByUser(userId: number): ImportJob[] {
    return Array.from(this.jobs.values()).filter((job) => job.userId === userId);
  }

  public async processJob(jobId: string): Promise<void> {
    const job = this.jobs.get(jobId);
    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }

    if (job.status !== "pending") {
      return;
    }

    job.status = "processing";
    this.emit("jobStatusChanged", job);

    try {
      const rustProcess = spawn(
        this.rustBinaryPath,
        ["--input", job.filePath, "--format", job.format, "--stream"],
        {
          stdio: ["pipe", "pipe", "pipe"],
        }
      );

      this.activeProcesses.set(jobId, rustProcess);

      let buffer = "";

      rustProcess.stdout.on("data", (data) => {
        buffer += data.toString();
        const lines = buffer.split("\n");
        buffer = lines.pop() || ""; // Keep incomplete line in buffer

        for (const line of lines) {
          if (line.trim()) {
            try {
              const comp: TerraFusionComp = JSON.parse(line);

              // Log to audit system with blockchain hash
              auditLogger.logCompImport(jobId, comp);

              job.recordsProcessed++;
              job.progress = Math.min(
                95,
                (job.recordsProcessed / Math.max(job.totalRecords, 100)) * 100
              );

              this.emit("compProcessed", jobId, comp);
              this.emit("jobProgress", job);
            } catch (parseError) {
              console.error("Error parsing comp JSON:", parseError, "Line:", line);
            }
          }
        }
      });

      rustProcess.stderr.on("data", (data) => {
        const errorMessage = data.toString();
        console.error(`Rust importer error for job ${jobId}:`, errorMessage);

        // Try to extract total records from stderr
        const totalMatch = errorMessage.match(/Total records: (\d+)/);
        if (totalMatch) {
          job.totalRecords = parseInt(totalMatch[1]);
        }
      });

      rustProcess.on("close", (code) => {
        this.activeProcesses.delete(jobId);

        if (code === 0) {
          job.status = "complete";
          job.progress = 100;
          job.completedAt = new Date();

          // Finalize audit with blockchain hash
          auditLogger.finalizeJobAudit(jobId).then((result) => {
            console.log(
              `[Audit] Job ${jobId} finalized with Merkle root: ${result.merkleRoot}, Blockchain TX: ${result.txId}`
            );
          });
        } else {
          job.status = "error";
          job.error = `Process exited with code ${code}`;
        }

        this.emit("jobCompleted", job);
        this.emit("jobStatusChanged", job);
      });

      rustProcess.on("error", (error) => {
        console.error(`Failed to start Rust process for job ${jobId}:`, error);
        job.status = "error";
        job.error = error.message;
        this.activeProcesses.delete(jobId);
        this.emit("jobCompleted", job);
        this.emit("jobStatusChanged", job);
      });
    } catch (error) {
      job.status = "error";
      job.error = error instanceof Error ? error.message : "Unknown error";
      this.emit("jobCompleted", job);
      this.emit("jobStatusChanged", job);
    }
  }

  public cancelJob(jobId: string): boolean {
    const process = this.activeProcesses.get(jobId);
    const job = this.jobs.get(jobId);

    if (process && job) {
      process.kill("SIGTERM");
      job.status = "error";
      job.error = "Cancelled by user";
      this.activeProcesses.delete(jobId);
      this.emit("jobCompleted", job);
      this.emit("jobStatusChanged", job);
      return true;
    }

    return false;
  }

  public cleanup(): void {
    // Kill all active processes
    for (const [jobId, process] of this.activeProcesses) {
      process.kill("SIGTERM");
      const job = this.jobs.get(jobId);
      if (job) {
        job.status = "error";
        job.error = "System shutdown";
      }
    }
    this.activeProcesses.clear();
  }
}

// Global singleton instance
export const rustImporter = new RustImporterBridge();

// Cleanup on process exit
process.on("exit", () => rustImporter.cleanup());
process.on("SIGINT", () => rustImporter.cleanup());
process.on("SIGTERM", () => rustImporter.cleanup());
