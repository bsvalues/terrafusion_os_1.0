/**
 * Terrafusion Universal Conversion Agent Bridge
 * This bridge connects the Rust conversion agent with the Terrafusion platform
 */

const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs").promises;

class UniversalConversionAgent {
  constructor() {
    this.rustAgentPath = path.join(__dirname, "rust_agent");
    this.templatesPath = path.join(this.rustAgentPath, "templates");
    this.dataPath = path.join(this.rustAgentPath, "data");
  }

  /**
   * Convert CSV data using XML template mapping
   * @param {string} templateName - Name of the XML template file
   * @param {string} inputFile - Path to input CSV file
   * @param {string} outputFile - Optional output JSON file path
   * @returns {Promise<Object>} Conversion result
   */
  async convertData(templateName, inputFile, outputFile = null) {
    return new Promise((resolve, reject) => {
      const templatePath = path.join(this.templatesPath, templateName);
      const args = ["--template", templatePath, "--input", inputFile];

      if (outputFile) {
        args.push("--output", outputFile);
      }

      const rustProcess = spawn("./target/release/universal_conversion_agent", args, {
        cwd: this.rustAgentPath,
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

      rustProcess.on("close", (code) => {
        if (code === 0) {
          try {
            const result = outputFile
              ? { success: true, outputFile, message: "Data converted successfully" }
              : { success: true, data: JSON.parse(stdout) };
            resolve(result);
          } catch (error) {
            reject(new Error(`Failed to parse output: ${error.message}`));
          }
        } else {
          reject(new Error(`Conversion failed: ${stderr || "Unknown error"}`));
        }
      });

      rustProcess.on("error", (error) => {
        reject(new Error(`Failed to start conversion agent: ${error.message}`));
      });
    });
  }

  /**
   * Create a new XML template
   * @param {Object} templateConfig - Template configuration
   * @returns {Promise<string>} Created template file path
   */
  async createTemplate(templateConfig) {
    const templateXml = this.generateTemplateXml(templateConfig);
    const templatePath = path.join(this.templatesPath, `${templateConfig.name}.xml`);

    await fs.writeFile(templatePath, templateXml, "utf8");
    return templatePath;
  }

  /**
   * Generate XML template from configuration
   * @param {Object} config - Template configuration
   * @returns {string} XML template string
   */
  generateTemplateXml(config) {
    const { name, description, fields, settings } = config;

    let primaryFields = "";
    let secondaryFields = "";

    fields.forEach((field /* , index */) => {
      primaryFields += `
        <Field>
            <Index>${index}</Index>
            <FriendlyName>${field.source.name}</FriendlyName>
            <DataType>${field.source.type}</DataType>
            <Key>${field.source.key}</Key>
        </Field>`;

      secondaryFields += `
        <Field>
            <Index>${index}</Index>
            <FriendlyName>${field.target.name}</FriendlyName>
            <DataType>${field.target.type}</DataType>
            <Key>${field.target.key}</Key>
        </Field>`;
    });

    return `<?xml version="1.0" encoding="UTF-8"?>
<Template>
    <PrimaryFields>${primaryFields}
    </PrimaryFields>
    <SecondaryFields>${secondaryFields}
    </SecondaryFields>
    <Direction>PrimaryToSecondary</Direction>
    <MappingOption>DirectMapping</MappingOption>
    <SplitOption>${settings.splitOption || ""}</SplitOption>
    <TemplateSettings>
        <SourceFilePath>${settings.sourceFilePath || ""}</SourceFilePath>
        <SourceDelimiter>${settings.delimiter || ","}</SourceDelimiter>
        <SourceHasHeader>${settings.hasHeader ? "true" : "false"}</SourceHasHeader>
    </TemplateSettings>
    <PrimaryConverterName>Terrafusion CSV Reader</PrimaryConverterName>
    <SecondaryConverterName>Terrafusion Property Parser</SecondaryConverterName>
    <CustomerNumber>TF001</CustomerNumber>
    <TemplateName>${name}</TemplateName>
    <Description>${description}</Description>
</Template>`;
  }

  /**
   * List available templates
   * @returns {Promise<Array>} List of template files
   */
  async listTemplates() {
    try {
      const files = await fs.readdir(this.templatesPath);
      return files.filter((file) => file.endsWith(".xml"));
    } catch (error) {
      return [];
    }
  }

  /**
   * Process property data for Terrafusion
   * @param {Array} csvData - Raw CSV property data
   * @param {string} templateName - Template to use for conversion
   * @returns {Promise<Object>} Processed property data
   */
  async processPropertyData(csvData, templateName = "sample_template.xml") {
    try {
      // Write CSV data to temporary file
      const tempCsvPath = path.join(this.dataPath, `temp_${Date.now()}.csv`);
      const csvContent = this.arrayToCsv(csvData);
      await fs.writeFile(tempCsvPath, csvContent, "utf8");

      // Convert using Rust agent
      const result = await this.convertData(templateName, tempCsvPath);

      // Clean up temporary file
      await fs.unlink(tempCsvPath).catch(() => {});

      return {
        success: true,
        originalRecords: csvData.length,
        processedData: result.data,
        template: templateName,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Convert array data to CSV format
   * @param {Array} data - Array of objects or arrays
   * @returns {string} CSV string
   */
  arrayToCsv(data) {
    if (!data || data.length === 0) return "";

    if (Array.isArray(data[0])) {
      // Array of arrays
      return data.map((row) => row.join(",")).join("\n");
    } else {
      // Array of objects
      const headers = Object.keys(data[0]);
      const csvRows = [headers.join(",")];

      data.forEach((row) => {
        const values = headers.map((header) => {
          const value = row[header] || "";
          return typeof value === "string" && value.includes(",") ? `"${value}"` : value;
        });
        csvRows.push(values.join(","));
      });

      return csvRows.join("\n");
    }
  }

  /**
   * Check if Rust agent is built and ready
   * @returns {Promise<boolean>} True if agent is ready
   */
  async isReady() {
    try {
      const agentPath = path.join(
        this.rustAgentPath,
        "target",
        "release",
        "universal_conversion_agent"
      );
      await fs.access(agentPath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Build the Rust agent if not already built
   * @returns {Promise<boolean>} True if build successful
   */
  async buildAgent() {
    return new Promise((resolve, reject) => {
      const buildProcess = spawn("cargo", ["build", "--release"], {
        cwd: this.rustAgentPath,
        stdio: "pipe",
      });

      buildProcess.on("close", (code) => {
        resolve(code === 0);
      });

      buildProcess.on("error", (error) => {
        reject(error);
      });
    });
  }
}

module.exports = UniversalConversionAgent;
