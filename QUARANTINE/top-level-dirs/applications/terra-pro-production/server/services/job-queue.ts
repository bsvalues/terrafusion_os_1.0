import { v4 as uuid } from "uuid";
import { spawn, ChildProcess } from "child_process";
import path from "path";
import fs from "fs";

export interface ImportJob {
  id: string;
  userId: string;
  fileName: string;
  filePath: string;
  format: string;
  status: "pending" | "processing" | "complete" | "error";
  progress: number;
  recordsProcessed: number;
  totalRecords: number;
  error?: string;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

class JobQueue {
  private jobs: Map<string, ImportJob> = new Map();
  private activeJobs: Map<string, ChildProcess> = new Map();
  private maxConcurrentJobs = 3;

  createJob(userId: string, fileName: string, filePath: string, format: string): string {
    const id = uuid();
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
    this.processNextJob();
    return id;
  }

  getJob(id: string): ImportJob | undefined {
    return this.jobs.get(id);
  }

  getJobsByUser(userId: string): ImportJob[] {
    return Array.from(this.jobs.values()).filter((job) => job.userId === userId);
  }

  getAllJobs(): ImportJob[] {
    return Array.from(this.jobs.values());
  }

  private async processNextJob() {
    if (this.activeJobs.size >= this.maxConcurrentJobs) {
      return;
    }

    const pendingJob = Array.from(this.jobs.values()).find((job) => job.status === "pending");

    if (!pendingJob) {
      return;
    }

    await this.processJob(pendingJob);
  }

  private async processJob(job: ImportJob) {
    job.status = "processing";
    job.startedAt = new Date();

    try {
      // Check if Rust binary exists
      const rustBinary =
        process.env.RUST_IMPORTER_BIN || "./terrafusion_import/target/release/terrafusion_importer";

      if (!fs.existsSync(rustBinary)) {
        throw new Error(`Rust importer binary not found at ${rustBinary}`);
      }

      // Spawn Rust process
      const rustProcess = spawn(
        rustBinary,
        ["--input", job.filePath, "--format", job.format, "--output-stream"],
        {
          stdio: ["pipe", "pipe", "pipe"],
          cwd: process.cwd(),
        }
      );

      this.activeJobs.set(job.id, rustProcess);

      // Handle stdout data (streaming records)
      rustProcess.stdout.on("data", (data) => {
        const lines = data.toString().split("\n").filter(Boolean);
        for (const line of lines) {
          try {
            const record = JSON.parse(line);
            job.recordsProcessed++;
            job.progress =
              job.totalRecords > 0 ? (job.recordsProcessed / job.totalRecords) * 100 : 0;

            // Emit record via SSE (handled by stream endpoint)
            this.emitRecord(job.id, record);
          } catch (e) {
            console.warn("Failed to parse record:", line);
          }
        }
      });

      // Handle stderr
      rustProcess.stderr.on("data", (data) => {
        console.error(`Rust importer error for job ${job.id}:`, data.toString());
      });

      // Handle process completion
      rustProcess.on("close", (code) => {
        this.activeJobs.delete(job.id);

        if (code === 0) {
          job.status = "complete";
          job.progress = 100;
          job.completedAt = new Date();
        } else {
          job.status = "error";
          job.error = `Process exited with code ${code}`;
        }

        // Process next job in queue
        this.processNextJob();
      });

      rustProcess.on("error", (error) => {
        this.activeJobs.delete(job.id);
        job.status = "error";
        job.error = error.message;
        this.processNextJob();
      });
    } catch (error) {
      job.status = "error";
      job.error = error instanceof Error ? error.message : "Unknown error";
      this.processNextJob();
    }
  }

  private emitRecord(jobId: string, record: any) {
    // This will be handled by the SSE endpoint
    // For now, we just log it
    console.log(`Job ${jobId} processed record:`, record.address || "Unknown address");
  }

  cancelJob(id: string): boolean {
    const job = this.jobs.get(id);
    if (!job) return false;

    const activeProcess = this.activeJobs.get(id);
    if (activeProcess) {
      activeProcess.kill();
      this.activeJobs.delete(id);
    }

    job.status = "error";
    job.error = "Cancelled by user";
    return true;
  }

  deleteJob(id: string): boolean {
    const job = this.jobs.get(id);
    if (!job) return false;

    this.cancelJob(id);
    this.jobs.delete(id);

    // Clean up file
    try {
      if (fs.existsSync(job.filePath)) {
        fs.unlinkSync(job.filePath);
      }
    } catch (e) {
      console.warn("Failed to delete file:", job.filePath);
    }

    return true;
  }
}

export const jobQueue = new JobQueue();
