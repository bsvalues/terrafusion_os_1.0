export interface DroneUnit {
  id: string;
  name: string;
  status: "idle" | "active" | "charging" | "maintenance" | "offline";
  location: {
    lat: number;
    lng: number;
    altitude: number;
  };
  capabilities: {
    ocr: boolean;
    lidar: boolean;
    gps: boolean;
    camera: boolean;
  };
  batteryLevel: number;
  lastSeen: Date;
  assignedZip?: string;
  currentJob?: string;
}

export interface DroneJob {
  id: string;
  type: "parcel_scan" | "structure_measure" | "document_capture" | "verification";
  priority: number;
  zipCode: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  requirements: string[];
  assignedDrone?: string;
  status: "pending" | "assigned" | "in_progress" | "completed" | "failed";
  createdAt: Date;
  completedAt?: Date;
  results?: any;
}

export interface DroneData {
  jobId: string;
  droneId: string;
  timestamp: string;
  location: {
    lat: number;
    lng: number;
    altitude: number;
  };
  imagery: {
    rgb?: string; // Base64 encoded image
    depth?: string; // LiDAR depth map
    thermal?: string; // Thermal imaging if available
  };
  measurements: {
    parcelBoundary?: Array<{ lat: number; lng: number }>;
    structureDimensions?: {
      length: number;
      width: number;
      height: number;
    };
    setbacks?: {
      front: number;
      rear: number;
      side: number;
    };
  };
  ocrResults?: {
    text: string;
    confidence: number;
    boundingBoxes: Array<{
      text: string;
      x: number;
      y: number;
      width: number;
      height: number;
    }>;
  };
}

export class DroneCoordinationService {
  private drones: Map<string, DroneUnit> = new Map();
  private jobQueue: DroneJob[] = [];
  private activeJobs: Map<string, DroneJob> = new Map();

  constructor() {
    this.initializeDroneFleet();
    this.startJobScheduler();
  }

  /**
   * Initialize drone fleet with mock units
   */
  private initializeDroneFleet() {
    const mockDrones: DroneUnit[] = [
      {
        id: "drone-001",
        name: "TerraScout Alpha",
        status: "idle",
        location: { lat: 37.7749, lng: -122.4194, altitude: 0 },
        capabilities: { ocr: true, lidar: true, gps: true, camera: true },
        batteryLevel: 85,
        lastSeen: new Date(),
      },
      {
        id: "drone-002",
        name: "TerraScout Beta",
        status: "idle",
        location: { lat: 37.7849, lng: -122.4094, altitude: 0 },
        capabilities: { ocr: true, lidar: false, gps: true, camera: true },
        batteryLevel: 92,
        lastSeen: new Date(),
      },
      {
        id: "drone-003",
        name: "TerraScout Gamma",
        status: "charging",
        location: { lat: 37.7649, lng: -122.4294, altitude: 0 },
        capabilities: { ocr: false, lidar: true, gps: true, camera: true },
        batteryLevel: 15,
        lastSeen: new Date(),
      },
    ];

    mockDrones.forEach((drone) => {
      this.drones.set(drone.id, drone);
    });

    console.log(`Drone fleet initialized with ${mockDrones.length} units`);
  }

  /**
   * Create new drone job
   */
  createJob(jobData: Omit<DroneJob, "id" | "status" | "createdAt">): string {
    const job: DroneJob = {
      id: `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      status: "pending",
      createdAt: new Date(),
      ...jobData,
    };

    this.jobQueue.push(job);
    this.scheduleJobs();

    return job.id;
  }

  /**
   * Schedule jobs to available drones
   */
  private scheduleJobs() {
    const availableDrones = Array.from(this.drones.values()).filter(
      (drone) => drone.status === "idle" && drone.batteryLevel > 20
    );

    const pendingJobs = this.jobQueue
      .filter((job) => job.status === "pending")
      .sort((a, b) => b.priority - a.priority);

    for (const job of pendingJobs) {
      const suitableDrone = this.findSuitableDrone(job, availableDrones);

      if (suitableDrone) {
        this.assignJobToDrone(job, suitableDrone);
        availableDrones.splice(availableDrones.indexOf(suitableDrone), 1);
      }
    }
  }

  /**
   * Find suitable drone for job
   */
  private findSuitableDrone(job: DroneJob, availableDrones: DroneUnit[]): DroneUnit | null {
    return (
      availableDrones.find((drone) => {
        // Check capability requirements
        if (job.requirements.includes("ocr") && !drone.capabilities.ocr) return false;
        if (job.requirements.includes("lidar") && !drone.capabilities.lidar) return false;

        // Check proximity (within 50km for demo)
        const distance = this.calculateDistance(
          drone.location.lat,
          drone.location.lng,
          job.coordinates.lat,
          job.coordinates.lng
        );

        return distance < 50; // 50km range
      }) || null
    );
  }

  /**
   * Assign job to drone
   */
  private assignJobToDrone(job: DroneJob, drone: DroneUnit) {
    job.status = "assigned";
    job.assignedDrone = drone.id;

    drone.status = "active";
    drone.currentJob = job.id;
    drone.assignedZip = job.zipCode;

    this.activeJobs.set(job.id, job);

    console.log(`Job ${job.id} assigned to drone ${drone.name}`);

    // Simulate job execution
    setTimeout(
      () => {
        this.simulateJobCompletion(job.id);
      },
      30000 + Math.random() * 60000
    ); // 30-90 seconds
  }

  /**
   * Simulate job completion with mock data
   */
  private simulateJobCompletion(jobId: string) {
    const job = this.activeJobs.get(jobId);
    if (!job || !job.assignedDrone) return;

    const drone = this.drones.get(job.assignedDrone);
    if (!drone) return;

    // Generate mock results based on job type
    const results = this.generateMockJobResults(job);

    job.status = "completed";
    job.completedAt = new Date();
    job.results = results;

    drone.status = "idle";
    drone.currentJob = undefined;
    drone.batteryLevel = Math.max(10, drone.batteryLevel - 15); // Consume battery

    this.activeJobs.delete(jobId);

    console.log(`Job ${jobId} completed by drone ${drone.name}`);

    // Schedule next jobs
    this.scheduleJobs();
  }

  /**
   * Generate mock job results
   */
  private generateMockJobResults(job: DroneJob): DroneData {
    return {
      jobId: job.id,
      droneId: job.assignedDrone!,
      timestamp: new Date().toISOString(),
      location: {
        lat: job.coordinates.lat + (Math.random() - 0.5) * 0.001,
        lng: job.coordinates.lng + (Math.random() - 0.5) * 0.001,
        altitude: 50 + Math.random() * 100,
      },
      imagery: {
        rgb: `data:image/jpeg;base64,${Buffer.from("mock_rgb_image").toString("base64")}`,
        depth: job.requirements.includes("lidar")
          ? `data:application/octet-stream;base64,${Buffer.from("mock_depth_data").toString("base64")}`
          : undefined,
      },
      measurements:
        job.type === "structure_measure"
          ? {
              structureDimensions: {
                length: 25 + Math.random() * 50,
                width: 20 + Math.random() * 30,
                height: 8 + Math.random() * 12,
              },
              setbacks: {
                front: 5 + Math.random() * 10,
                rear: 8 + Math.random() * 15,
                side: 3 + Math.random() * 7,
              },
            }
          : undefined,
      ocrResults: job.requirements.includes("ocr")
        ? {
            text: "Property Address: 123 Main St\nLot Size: 0.25 acres\nZoning: R-1",
            confidence: 0.85 + Math.random() * 0.15,
            boundingBoxes: [
              { text: "123 Main St", x: 10, y: 20, width: 100, height: 15 },
              { text: "0.25 acres", x: 10, y: 40, width: 80, height: 12 },
            ],
          }
        : undefined,
    };
  }

  /**
   * Calculate distance between two coordinates
   */
  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Start job scheduler
   */
  private startJobScheduler() {
    setInterval(() => {
      this.scheduleJobs();
      this.updateDroneStatuses();
    }, 10000); // Every 10 seconds
  }

  /**
   * Update drone statuses
   */
  private updateDroneStatuses() {
    for (const drone of this.drones.values()) {
      // Simulate battery charging
      if (drone.status === "charging" && drone.batteryLevel < 100) {
        drone.batteryLevel = Math.min(100, drone.batteryLevel + 5);
        if (drone.batteryLevel >= 90) {
          drone.status = "idle";
        }
      }

      // Auto-charge if battery low
      if (drone.batteryLevel < 20 && drone.status === "idle") {
        drone.status = "charging";
      }

      drone.lastSeen = new Date();
    }
  }

  /**
   * Get fleet status
   */
  getFleetStatus() {
    return {
      totalDrones: this.drones.size,
      activeDrones: Array.from(this.drones.values()).filter((d) => d.status === "active").length,
      pendingJobs: this.jobQueue.filter((j) => j.status === "pending").length,
      activeJobs: this.activeJobs.size,
      drones: Array.from(this.drones.values()),
      recentJobs: this.jobQueue.slice(-10),
    };
  }

  /**
   * Get job status
   */
  getJobStatus(jobId: string): DroneJob | null {
    return this.activeJobs.get(jobId) || this.jobQueue.find((job) => job.id === jobId) || null;
  }

  /**
   * Request property scan
   */
  requestPropertyScan(
    zipCode: string,
    coordinates: { lat: number; lng: number },
    requirements: string[] = ["ocr", "camera"]
  ): string {
    return this.createJob({
      type: "parcel_scan",
      priority: 5,
      zipCode,
      coordinates,
      requirements,
    });
  }

  /**
   * Request structure measurement
   */
  requestStructureMeasurement(zipCode: string, coordinates: { lat: number; lng: number }): string {
    return this.createJob({
      type: "structure_measure",
      priority: 7,
      zipCode,
      coordinates,
      requirements: ["lidar", "camera", "gps"],
    });
  }
}
