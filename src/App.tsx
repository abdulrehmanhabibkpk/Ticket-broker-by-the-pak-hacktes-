import React, { useState, useEffect } from "react";
import { auth } from "./firebase";
import { onAuthStateChanged, signOut, reload } from "firebase/auth";
import LoginRegister from "./components/LoginRegister";
import AdminDashboard from "./components/AdminDashboard";
import AgentDashboard from "./components/AgentDashboard";
import { LoadingSpinner } from "./components/UIComponents";
import { Plane } from "lucide-react";

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<"admin" | "agent" | null>(null);
  const [agentName, setAgentName] = useState("");
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Force reload to get latest emailVerified flag status
          await reload(firebaseUser);
          
          const email = firebaseUser.email || "";
          
          // Role Redirect and Verification Rules
          // Admin (abdulrehman654as@gmail.com) bypasses/is always verified,
          // other B2B agents MUST be verified to be logged in.
          if (email === "abdulrehman654as@gmail.com") {
            setUserRole("admin");
            setUser(firebaseUser);
          } else if (firebaseUser.emailVerified) {
            setUserRole("agent");
            
            // Extract the email prefix, clean it, and capitalize each word
            const prefix = email.split("@")[0];
            const cleanName = prefix
              .replace(/[._]/g, " ")
              .split(" ")
              .map(word => word.charAt(0).toUpperCase() + word.slice(1))
              .join(" ");
            
            setAgentName(cleanName);
            setUser(firebaseUser);
          } else {
            // Unverified agents are signed out securely
            await signOut(auth);
            setUser(null);
            setUserRole(null);
          }
        } catch (err) {
          console.error("Auth state synchronization error:", err);
          setUser(null);
          setUserRole(null);
        }
      } else {
        setUser(null);
        setUserRole(null);
      }
      setInitializing(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setUserRole(null);
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  const handleLoginSuccess = async (firebaseUser: any) => {
    const email = firebaseUser.email || "";
    if (email === "abdulrehman654as@gmail.com") {
      setUserRole("admin");
    } else {
      setUserRole("agent");
      const prefix = email.split("@")[0];
      const cleanName = prefix
        .replace(/[._]/g, " ")
        .split(" ")
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
      setAgentName(cleanName);
    }
    setUser(firebaseUser);
  };

  if (initializing) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#F8FAFC]">
        <div className="text-center space-y-4">
          <Plane className="h-10 w-10 text-[#133F5C] animate-pulse mx-auto" />
          <p className="text-sm font-bold text-gray-500">
            Establishing Secure B2B Sync Link...
          </p>
          <LoadingSpinner size="md" />
        </div>
      </div>
    );
  }

  // Pure clean display filling the entire workspace viewport perfectly
  return (
    <div className="min-h-screen bg-[#F1F5F9] text-[#111827]">
      {!user ? (
        <div className="p-4 sm:p-6 lg:p-8">
          <LoginRegister onLoginSuccess={handleLoginSuccess} />
        </div>
      ) : userRole === "admin" ? (
        <div className="p-4 sm:p-6 lg:p-8">
          <AdminDashboard onLogout={handleLogout} />
        </div>
      ) : (
        <div className="p-4 sm:p-6 lg:p-8">
          <AgentDashboard
            agentName={agentName}
            agentEmail={user.email}
            onLogout={handleLogout}
          />
        </div>
      )}
    </div>
  );
}
