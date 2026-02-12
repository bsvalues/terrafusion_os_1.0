import ... from "@/storage";
import ... from "@/database-storage";

// Use PostgreSQL storage directly for Tesla-level simplicity and reliability  
export const storage = new DatabaseStorage();