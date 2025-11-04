import React, { createContext, useContext, useState, ReactNode } from "react";

// 1. Create a simple context
interface UserContextType {
  name: string;
  setName: (name: string) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

// 2. Create a hook to use the context
function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}

// 3. Create the provider component
interface UserProviderProps {
  children: ReactNode;
}

function UserProvider({ children }: UserProviderProps) {
  const [name, setName] = useState("John Doe");

  const value = {
    name,
    setName,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

// 4. Create a component that uses the context
function UserProfile() {
  const { name, setName } = useUser();

  return (
    <div><>

      <h2>User Profile</h2>
      <p
</>>Name: {name}</p>
      <button onClick={() => setName("Jane Doe")}>Change Name</button>
    </div>
  );
}

// 5. Create the main app component that uses the provider
export default function DirectApp() {
  return (
    <div className="p-8"><>

      <h1 className="text-2xl font-bold mb-4">Direct App Test</h1>
      <UserProvider
</>>
        <UserProfile />
      </UserProvider>
    </div>
  );
}
