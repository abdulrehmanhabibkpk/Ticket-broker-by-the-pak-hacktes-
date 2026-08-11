import React, { useState, useEffect } from "react";
import { auth } from "./firebase";
import { onAuthStateChanged, signOut, reload } from "firebase/auth";
import LoginRegister from "./components/LoginRegister";
import AdminDashboard from "./components/AdminDashboard";
import AgentDashboard from "./components/AgentDashboard";
import { LoadingSpinner } from "./components/UIComponents";
import { Plane, Shield, User, Landmark, ShieldCheck } from "lucide-react";

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
            // Unverified agents are signed out (handled securely in LoginRegister,
            // but this observer keeps state pristine in case of session refresh)
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
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#F9FAFB]">
        <div className="text-center space-y-4">
          <Plane className="h-10 w-10 text-[#1D4ED8] animate-pulse mx-auto" />
          <p className="text-sm font-semibold text-gray-500">
            Establishing B2B Security Sync...
          </p>
          <LoadingSpinner size="md" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-[#111827] flex flex-col font-sans">
      {/* Premium Corporate Navbar Header */}
      <header className="bg-white border-b border-[#E5E7EB] sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-50 p-2 rounded-lg border border-blue-100">
              <Plane className="h-6 w-6 text-[#1D4ED8]" />
            </div>
            <div>
              <span className="text-xs font-bold text-[#6B7280] font-mono tracking-tight block">
                GLOBAL BROKER SYSTEM
              </span>
              <h1 className="text-base font-extrabold tracking-tight text-[#111827] flex items-center gap-1.5">
                B2B Air Reservation Portal
              </h1>
            </div>
          </div>

          {user && (
            <div className="flex items-center gap-4">
              {/* Security indicator */}
              <div className="hidden md:flex items-center gap-1.5 px-3 py-1 bg-green-50 border border-green-200 text-green-700 rounded text-xs font-semibold uppercase tracking-wider">
                <ShieldCheck className="h-4 w-4 text-green-600" />
                Active Mobile Sync
              </div>
              
              {/* User badge */}
              <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-[#E5E7EB] rounded-md text-xs font-semibold">
                {userRole === "admin" ? (
                  <Shield className="h-3.5 w-3.5 text-[#1D4ED8]" />
                ) : (
                  <User className="h-3.5 w-3.5 text-gray-500" />
                )}
                <span className="text-[#111827]">
                  {userRole === "admin" ? "System Admin" : agentName}
                </span>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Portal View Space */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!user ? (
          <LoginRegister onLoginSuccess={handleLoginSuccess} />
        ) : userRole === "admin" ? (
          <AdminDashboard onLogout={handleLogout} />
        ) : (
          <AgentDashboard
            agentName={agentName}
            agentEmail={user.email}
            onLogout={handleLogout}
          />
        )}
      </main>

      {/* Corporate Footer */}
      <footer className="bg-white border-t border-[#E5E7EB] py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-[#6B7280]">
          <div className="flex items-center gap-2 font-mono">
            <span>( the pak hacktes teem )</span>
            <span className="text-gray-300">|</span>
            <span>Real-time B2B Sync Terminal</span>
          </div>
          <div className="flex gap-4">
            <span>Security Rule: Verified Auth Enforced</span>
            <span>•</span>
            <span>Cloud Firestore Sync Active</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
