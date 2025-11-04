import React, { createContext, useContext, useState, ReactNode } from "react";
import { User, AppraisalReport } from "../../shared/schema";

// Define a simplified context type
interface SimpleAppraisalContextType {
  currentUser: User | null;
  currentReport: AppraisalReport | null;
  setCurrentUser: (user: User | null) => void;
  setCurrentReport: (report: AppraisalReport | null) => void;
}

// Create the context
const SimpleAppraisalContext = createContext<SimpleAppraisalContextType | undefined>(undefined);

// Create the hook
export function useSimpleAppraisal() {
  const context = useContext(SimpleAppraisalContext);
  if (context === undefined) {
    throw new Error("useSimpleAppraisal must be used within a SimpleAppraisalProvider");
  }
  return context;
}

// Provider component
interface SimpleAppraisalProviderProps {
  children: ReactNode;
}

export function SimpleAppraisalProvider({ children }: SimpleAppraisalProviderProps) {
  const [currentUser, setCurrentUser] = useState<User | null>({
    id: 1,
    username: "demo",
    password: "password",
    fullName: "John Appraiser",
    company: "ABC Appraisal",
    licenseNumber: "AP12345",
    email: "john@abcappraisal.com",
    phoneNumber: "555-123-4567",
  });

  const [currentReport, setCurrentReport] = useState<AppraisalReport | null>(null);

  const value = {
    currentUser,
    currentReport,
    setCurrentUser,
    setCurrentReport,
  };

  return (
    <SimpleAppraisalContext.Provider value={value}>{children}</SimpleAppraisalContext.Provider>
  );
}
