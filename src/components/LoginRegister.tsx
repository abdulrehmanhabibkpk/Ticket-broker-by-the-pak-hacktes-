import React, { useState } from "react";
import { auth } from "../firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signOut,
  signInWithPopup,
  GoogleAuthProvider,
  reload
} from "firebase/auth";
import { Button, Input, Alert, LoadingSpinner } from "./UIComponents";
import {
  Plane,
  ShieldCheck,
  HelpCircle,
  Sparkles,
  Lock,
  Mail,
  ArrowRight,
  Clock,
  Smartphone,
  CheckCircle2
} from "lucide-react";

export default function LoginRegister({
  onLoginSuccess,
}: {
  onLoginSuccess: (user: any) => void;
}) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [alertMsg, setAlertMsg] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);
  const [showResend, setShowResend] = useState(false);

  // Re-authentication values stored temporarily for resending in background
  const [lastEmailAttempt, setLastEmailAttempt] = useState("");
  const [lastPasswordAttempt, setLastPasswordAttempt] = useState("");

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAlertMsg(null);
    setLoading(true);
    setShowResend(false);

    try {
      if (isSignUp) {
        // 1. Create user account
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // 2. Send email verification
        await sendEmailVerification(user);

        // 3. Log out immediately
        await signOut(auth);

        setAlertMsg({
          type: "success",
          text: "B2B Registration successful! Please check your email inbox to verify your account.",
        });
        
        // Return to login
        setIsSignUp(false);
        setPassword("");
      } else {
        // Sign In
        setLastEmailAttempt(email);
        setLastPasswordAttempt(password);

        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Attempt reload to fetch latest verified status, catching network warnings gracefully
        try {
          await reload(user);
        } catch (reloadErr) {
          console.warn("Network reload warning during login:", reloadErr);
        }

        if (!user.emailVerified) {
          await signOut(auth);
          setAlertMsg({
            type: "error",
            text: "Your B2B email address is not verified yet. Please click the verification link sent to your inbox.",
          });
          setShowResend(true);
          setLoading(false);
          return;
        }

        // Email verified! Success
        onLoginSuccess(user);
      }
    } catch (error: any) {
      console.error("Auth error:", error);
      let errMsg = "An error occurred during authentication.";
      if (error.code === "auth/email-already-in-use") {
        errMsg = "This corporate email is already registered with an active B2B account.";
      } else if (error.code === "auth/invalid-credential" || error.code === "auth/wrong-password" || error.code === "auth/user-not-found") {
        errMsg = "Invalid email or password credentials. Please try again.";
      } else if (error.code === "auth/weak-password") {
        errMsg = "Password is too weak. Must contain at least 6 characters.";
      } else if (error.code === "auth/invalid-email") {
        errMsg = "Invalid corporate email format.";
      } else {
        errMsg = error.message || errMsg;
      }
      setAlertMsg({ type: "error", text: errMsg });
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!lastEmailAttempt || !lastPasswordAttempt) {
      setAlertMsg({
        type: "error",
        text: "Please enter your email and password above to request a new verification link.",
      });
      return;
    }

    setLoading(true);
    setAlertMsg({ type: "info", text: "Re-authenticating B2B agent in background..." });

    try {
      const credential = await signInWithEmailAndPassword(auth, lastEmailAttempt, lastPasswordAttempt);
      const tempUser = credential.user;

      await sendEmailVerification(tempUser);
      await signOut(auth);

      setAlertMsg({
        type: "success",
        text: `Verification link successfully resent to ${lastEmailAttempt}. Please check your spam folder too.`,
      });
      setShowResend(false);
    } catch (error: any) {
      console.error("Resend error:", error);
      setAlertMsg({
        type: "error",
        text: `Could not resend verification email: ${error.message}`,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setAlertMsg(null);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      await reload(user);
      onLoginSuccess(user);
    } catch (error: any) {
      console.error("Google Sign-In Error:", error);
      if (error.code !== "auth/popup-closed-by-user") {
        setAlertMsg({
          type: "error",
          text: `GMS Auth Link failed: ${error.message}`,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#F9FAFB] -mx-4 sm:-mx-6 lg:-mx-8 -my-8 font-sans">
      
      {/* LEFT SIDE PANEL - BOOK BROKER BRAND & MOBILE PARTNER PREVIEW */}
      <div className="w-full md:w-1/2 bg-[#133F5C] text-white p-12 flex flex-col justify-between relative overflow-hidden">
        {/* Subtle decorative circles for a premium luxury touch */}
        <div className="absolute -top-16 -left-16 h-64 w-64 rounded-full bg-cyan-600/10 blur-2xl"></div>
        <div className="absolute -bottom-16 -right-16 h-80 w-80 rounded-full bg-orange-600/10 blur-2xl"></div>

        {/* Header Branding */}
        <div className="flex items-center gap-3.5 relative z-10">
          <div className="bg-[#ff7300] p-2.5 rounded-full flex items-center justify-center shadow-lg">
            <Plane className="h-6 w-6 text-white transform -rotate-45" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight leading-none">
              <span className="text-white">BOOK </span>
              <span className="text-[#ff7300]">BROKER</span>
            </h1>
            <span className="text-[10px] text-cyan-300 font-mono tracking-widest block mt-1 uppercase font-bold">
              B2B Partner Portal
            </span>
          </div>
        </div>

        {/* Marketing Info */}
        <div className="space-y-6 max-w-md my-12 md:my-0 relative z-10">
          <span className="bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider inline-flex items-center gap-1.5">
            <Smartphone className="h-3.5 w-3.5" />
            Dual-Platform Sync Enabled
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight leading-tight">
            The elite ticketing solution for corporate travel agents.
          </h2>
          <p className="text-sm text-gray-300 leading-relaxed">
            Configure, manage and book bulk airline seats dynamically. Sync live inventory, active ledger limits, and traveler passports instantly with our companion Android applications.
          </p>

          <div className="space-y-3 pt-4">
            <div className="flex items-center gap-3 text-xs text-gray-200">
              <CheckCircle2 className="h-4.5 w-4.5 text-[#ff7300] shrink-0" />
              <span>Real-time inventory locks preventing overbooking.</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-200">
              <CheckCircle2 className="h-4.5 w-4.5 text-[#ff7300] shrink-0" />
              <span>Instant ledger balance debits & credit limit top-ups.</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-200">
              <CheckCircle2 className="h-4.5 w-4.5 text-[#ff7300] shrink-0" />
              <span>Embedded passenger document parsing & secure backups.</span>
            </div>
          </div>
        </div>

        {/* Footer Subtext */}
        <div className="relative z-10 text-gray-400 text-xs">
          <p>© 2026 Book Broker Travel & Tours. All rights reserved.</p>
        </div>
      </div>

      {/* RIGHT SIDE PANEL - CLEAN LOGIN / REGISTER PORTAL CARD (IMAGE 2) */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-8 sm:p-12 md:p-16">
        <div className="w-full max-w-md bg-white border border-gray-100 rounded-2xl shadow-xl p-8 space-y-6">
          
          {/* Portal Title header with required branding text */}
          <div className="text-center space-y-1">
            <h2 id="app-title" className="text-xl font-extrabold text-[#133F5C] tracking-tight">
              {isSignUp ? "Create B2B Agency Account" : "B2B Ticket Booking Portal"}
            </h2>
            <p id="team-subtext" className="text-xs text-gray-400 font-mono italic">
              ( the pak hacktes teem )
            </p>
          </div>

          {alertMsg && (
            <Alert
              id="auth-alert"
              type={alertMsg.type}
              message={alertMsg.text}
              onClose={() => setAlertMsg(null)}
            />
          )}

          <form onSubmit={handleAuth} className="space-y-4">
            <Input
              id="email-input"
              label="Corporate Email Address"
              type="email"
              placeholder="agency.partner@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />

            <Input
              id="password-input"
              label="Secure Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />

            {showResend && (
              <div className="text-right">
                <button
                  id="resend-verification-btn"
                  type="button"
                  onClick={handleResendVerification}
                  className="text-xs font-semibold text-[#ff7300] hover:text-[#e05e00] transition-colors underline bg-transparent border-none cursor-pointer p-0"
                >
                  Resend Verification Email
                </button>
              </div>
            )}

            <button
              id="submit-auth-btn"
              type="submit"
              disabled={loading}
              className="w-full bg-[#133F5C] hover:bg-[#1d5074] text-white font-bold py-3 px-4 rounded-xl text-xs transition-all duration-150 flex items-center justify-center gap-2 shadow-md cursor-pointer"
            >
              {loading ? (
                <LoadingSpinner size="sm" />
              ) : isSignUp ? (
                <span>Register New B2B Agency</span>
              ) : (
                <span>Sign In to Portal</span>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-gray-100"></div>
            <span className="flex-shrink mx-4 text-[10px] text-gray-400 font-bold uppercase tracking-widest">
              Or GMS Web Fallback
            </span>
            <div className="flex-grow border-t border-gray-100"></div>
          </div>

          {/* GMS Web Sync Fallback Button */}
          <button
            id="gms-google-auth-btn"
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-4 py-2.5 text-xs font-bold border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl transition-all duration-200 cursor-pointer shadow-xs"
          >
            <svg className="h-4.5 w-4.5" viewBox="0 0 24 24">
              <path
                d="M21.35,11.1H12v2.7h5.38c-0.24,1.28 -0.96,2.37 -2.04,3.1v2.58h3.3c1.93,-1.78 3.04,-4.4 3.04,-7.48C21.68,11.87 21.56,11.45 21.35,11.1z"
                fill="#4285F4"
              />
              <path
                d="M12,20.6c2.43,0 4.47,-0.8 5.96,-2.2l-3.3,-2.58c-0.91,0.61 -2.08,0.98 -3.22,0.98 -2.48,0 -4.58,-1.68 -5.33,-3.94H2.7v2.66C4.18,17.76 7.82,20.6 12,20.6z"
                fill="#34A853"
              />
              <path
                d="M6.67,12.86c-0.19,-0.57 -0.3,-1.18 -0.3,-1.8s0.11,-1.23 0.3,-1.8V6.6H2.7C2.06,7.88 1.7,9.31 1.7,10.8c0,1.49 0.36,2.92 1,4.2l3.97,-3.14z"
                fill="#FBBC05"
              />
              <path
                d="M12,5.18c1.32,0 2.51,0.45 3.44,1.35l2.58,-2.58C16.46,2.44 14.42,1.7 12,1.7c-4.18,0 -7.82,2.84 -9.3,7.1l3.97,3.14c0.75,-2.26 2.85,-3.94 5.33,-3.94z"
                fill="#EA4335"
              />
            </svg>
            <span>Google Play / GMS Auth Fallback</span>
          </button>

          {/* Toggle between login and register */}
          <div className="text-center pt-2">
            <button
              id="auth-toggle-view-btn"
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setAlertMsg(null);
                setShowResend(false);
              }}
              className="text-xs text-gray-500 hover:text-gray-800 transition-colors focus:outline-none cursor-pointer font-semibold"
            >
              {isSignUp ? (
                <span>
                  Already have a B2B account?{" "}
                  <strong className="text-[#ff7300] font-black hover:underline">Sign In</strong>
                </span>
              ) : (
                <span>
                  New agency partner?{" "}
                  <strong className="text-[#ff7300] font-black hover:underline">Create Account</strong>
                </span>
              )}
            </button>
          </div>

          {/* Help note */}
          <div className="pt-4 border-t border-gray-100 flex gap-2.5 text-xs text-gray-400">
            <HelpCircle className="h-4.5 w-4.5 text-gray-300 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-gray-600 mb-0.5">Secure Android GMS Link</p>
              Both application clients utilize matching SHA-256 signatures over the exact same Firestore repository for zero lag transaction updates.
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
