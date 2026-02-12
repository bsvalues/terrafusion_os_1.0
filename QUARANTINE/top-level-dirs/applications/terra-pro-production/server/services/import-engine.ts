import { spawn } from "child_process";
import { promises as fs } from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";

export interface TerraFusionComp {
  id?: string;
  address: string;
  sale_price_usd: number;
  gla_sqft: number;
  sale_date: string;
  source_table: string;
  source_file: string;
  property_type?: string;
  bedrooms?: number;
  bathrooms?: number;
  year_built?: number;
  lot_size?: number;
  city?: string;
  state?: string;
  zip_code?: string;
  metadata?: Record<string, any>;
}

export interface ImportResult {
  success: boolean;
  data?: TerraFusionComp[];
  error?: string;
  stats?: {
    totalRecords: number;
    validRecords: number;
    errorCount: number;
    processingTimeMs: number;
  };
}

export class TerraFusionImportEngine {
  private static readonly TEMP_DIR = path.join(process.cwd(), "temp", "imports");
  private static readonly RUST_BINARY = path.join(
    process.cwd(),
    "terrafusion_import",
    "target",
    "release",
    "terrafusion_import"
  );

  static async ensureTempDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.TEMP_DIR, { recursive: true });
    } catch (error) {
      console.error("Failed to create temp directory:", error);
    }
  }

  static async detectFormat(filePath: string): Promise<string | null> {
    try {
      const ext = path.extname(filePath).toLowerCase();
      const supportedFormats: Record<string, string> = {
        ".sqlite": "SQLite Database",
        ".db": "SQLite Database",
        ".sqlite3": "SQLite Database",
      };

      return supportedFormats[ext] || null;
    } catch (error) {
      return null;
    }
  }

  static async importSqlite(filePath: string): Promise<ImportResult> {
    const startTime = Date.now();

    try {
      await this.ensureTempDirectory();

      const outputPath = path.join(this.TEMP_DIR, `import_${uuidv4()}.json`);

      const rustProcess = spawn("cargo", ["run", "--release", "--", filePath, outputPath], {
        cwd: path.join(process.cwd(), "terrafusion_import"),
        stdio: ["pipe", "pipe", "pipe"],
      });

      let stdout = "";
      let stderr = "";

      rustProcess.stdout.on("data", (data) => {
        stdout += data.toString();
      });

      rustProcess.stderr.on("data", (data) => {
        stderr += data.toString();
      });

      const exitCode = await new Promise<number>((resolve) => {
        rustProcess.on("close", resolve);
      });

      if (exitCode !== 0) {
        return {
          success: false,
          error: `Rust import process failed: ${stderr}`,
          stats: {
            totalRecords: 0,
            validRecords: 0,
            errorCount: 1,
            processingTimeMs: Date.now() - startTime,
          },
        };
      }

      try {
        const jsonData = await fs.readFile(outputPath, "utf-8");
        const data: TerraFusionComp[] = JSON.parse(jsonData);

        await fs.unlink(outputPath).catch(() => {});

        return {
          success: true,
          data,
          stats: {
            totalRecords: data.length,
            validRecords: data.length,
            errorCount: 0,
            processingTimeMs: Date.now() - startTime,
          },
        };
      } catch (parseError) {
        return {
          success: false,
          error: `Failed to parse import results: ${parseError}`,
          stats: {
            totalRecords: 0,
            validRecords: 0,
            errorCount: 1,
            processingTimeMs: Date.now() - startTime,
          },
        };
      }
    } catch (error) {
      return {
        success: false,
        error: `Import failed: ${error}`,
        stats: {
          totalRecords: 0,
          validRecords: 0,
          errorCount: 1,
          processingTimeMs: Date.now() - startTime,
        },
      };
    }
  }

  static async importFile(filePath: string): Promise<ImportResult> {
    const format = await this.detectFormat(filePath);

    if (!format) {
      return {
        success: false,
        error: "Unsupported file format",
        stats: {
          totalRecords: 0,
          validRecords: 0,
          errorCount: 1,
          processingTimeMs: 0,
        },
      };
    }

    switch (format) {
      case "SQLite Database":
        return this.importSqlite(filePath);
      default:
        return {
          success: false,
          error: `Format ${format} not yet implemented`,
          stats: {
            totalRecords: 0,
            validRecords: 0,
            errorCount: 1,
            processingTimeMs: 0,
          },
        };
    }
  }

  static async getSupportedFormats(): Promise<Array<{ name: string; extensions: string[] }>> {
    return [
      {
        name: "SQLite Database",
        extensions: [".sqlite", ".db", ".sqlite3"],
      },
    ];
  }

  static async validateImportedData(
    data: TerraFusionComp[]
  ): Promise<{ valid: TerraFusionComp[]; invalid: any[] }> {
    const valid: TerraFusionComp[] = [];
    const invalid: any[] = [];

    for (const item of data) {
      if (this.isValidTerraFusionComp(item)) {
        valid.push(item);
      } else {
        invalid.push(item);
      }
    }

    return { valid, invalid };
  }

  private static isValidTerraFusionComp(item: any): item is TerraFusionComp {
    return (
      typeof item === "object" &&
      typeof item.address === "string" &&
      item.address.length > 0 &&
      typeof item.sale_price_usd === "number" &&
      item.sale_price_usd > 0 &&
      typeof item.gla_sqft === "number" &&
      item.gla_sqft > 0 &&
      typeof item.sale_date === "string" &&
      typeof item.source_table === "string" &&
      typeof item.source_file === "string"
    );
  }
}
