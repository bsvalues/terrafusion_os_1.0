import multer from "multer";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";

// Ensure upload directory exists
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Create a unique filename to avoid collisions
    const uniqueId = uuidv4();
    const fileExtension = path.extname(file.originalname);
    const newFilename = `order_${uniqueId}${fileExtension}`;
    cb(null, newFilename);
  },
});

// File filter to only allow PDFs and specific image types
const fileFilter = (req, file, cb) => {
  const allowedTypes = ["application/pdf", "image/jpeg", "image/png"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only PDF, JPEG, and PNG files are allowed."), false);
  }
};

// Create the multer upload instance
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  },
});

// Utility function to parse order details from filename (if needed)
export function parseOrderDetails(filename: string) {
  try {
    const baseFilename = path.basename(filename, path.extname(filename));
    // If the filename has a pattern like "1234 Order.pdf", extract the order number
    const orderNumberMatch = baseFilename.match(/^(\d+)\s+Order$/);
    if (orderNumberMatch) {
      return {
        orderNumber: orderNumberMatch[1],
      };
    }
    return null;
  } catch (error) {
    console.error("Error parsing order details from filename:", error);
    return null;
  }
}

// Utility function to extract file paths from request
export function getUploadedFilePaths(req: any): string[] {
  if (!req.files) return [];
  return req.files.map((file: any) => file.path);
}

// Utility function to extract a single file path
export function getUploadedFilePath(req: any): string | null {
  if (!req.file) return null;
  return req.file.path;
}
