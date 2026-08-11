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
import { ShieldAlert, MailCheck, ShieldCheck, HelpCircle } from "lucide-react";

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
        // 1. Create the user account
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // 2. Send the verification email
        await sendEmailVerification(user);

        // 3. Instantly log them out
        await signOut(auth);

        setAlertMsg({
          type: "success",
          text: "Registration successful! Please check your email inbox to verify your account.",
        });
        
        // Reset form to Login view so they can sign in after verifying
        setIsSignUp(false);
        setPassword("");
      } else {
        // Sign In
        setLastEmailAttempt(email);
        setLastPasswordAttempt(password);

        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Force reload to get the latest emailVerified flag status
        await reload(user);

        if (!user.emailVerified) {
          // If the email is NOT verified, block login, sign them out, and display red error
          await signOut(auth);
          setAlertMsg({
            type: "error",
            text: "Your email address is not verified yet. Please click the verification link sent to your inbox.",
          });
          setShowResend(true);
          setLoading(false);
          return;
        }

        // Email is verified! Proceed with login
        onLoginSuccess(user);
      }
    } catch (error: any) {
      console.error("Auth error:", error);
      let errMsg = "An error occurred during authentication.";
      if (error.code === "auth/email-already-in-use") {
        errMsg = "This email is already in use by another B2B account.";
      } else if (error.code === "auth/invalid-credential" || error.code === "auth/wrong-password" || error.code === "auth/user-not-found") {
        errMsg = "Invalid email or password. Please try again.";
      } else if (error.code === "auth/weak-password") {
        errMsg = "Password is too weak. Must be at least 6 characters.";
      } else if (error.code === "auth/invalid-email") {
        errMsg = "Invalid email format.";
      } else {
        errMsg = error.message || errMsg;
      }
      setAlertMsg({ type: "error", text: errMsg });
    } finally {
      setLoading(false);
    }
  };

  // Resend Verification Email that re-authenticates the user in the background temporarily
  const handleResendVerification = async () => {
    if (!lastEmailAttempt || !lastPasswordAttempt) {
      setAlertMsg({
        type: "error",
        text: "Please enter your email and password above to request a new verification link.",
      });
      return;
    }

    setLoading(true);
    setAlertMsg({ type: "info", text: "Re-authenticating in background to verify request..." });

    try {
      // Re-authenticate user temporarily
      const credential = await signInWithEmailAndPassword(auth, lastEmailAttempt, lastPasswordAttempt);
      const tempUser = credential.user;

      // Send verification email again
      await sendEmailVerification(tempUser);

      // Sign out instantly
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

  // Real Google Sign-In as GMS Web Fallback integration
  const handleGoogleSignIn = async () => {
    setLoading(true);
    setAlertMsg(null);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      // Google Auth emails are pre-verified, but let's double check or reload
      await reload(user);
      
      // Let them sign in
      onLoginSuccess(user);
    } catch (error: any) {
      console.error("Google Sign-In Error:", error);
      if (error.code !== "auth/popup-closed-by-user") {
        setAlertMsg({
          type: "error",
          text: `Google Authentication GMS Link failed: ${error.message}`,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
      <div className="w-full max-w-md bg-white border border-[#E5E7EB] rounded-lg shadow-sm p-8">
        {/* Top Branding Header */}
        <div className="text-center mb-8">
          <h1 id="app-title" className="text-2xl font-bold tracking-tight text-[#111827]">
            B2B Ticket Booking Portal
          </h1>
          <p id="team-subtext" className="text-xs text-[#6B7280] font-mono mt-1">
            ( the pak hacktes teem )
          </p>
        </div>

        {alertMsg && (
          <div className="mb-6">
            <Alert
              id="auth-alert"
              type={alertMsg.type}
              message={alertMsg.text}
              onClose={() => setAlertMsg(null)}
            />
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          <Input
            id="email-input"
            label="Corporate Email Address"
            type="email"
            placeholder="agency.partner@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
          />

          <Input
            id="password-input"
            label="Password"
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
                className="text-xs font-semibold text-[#1D4ED8] hover:text-[#1E40AF] transition-colors underline bg-transparent border-none cursor-pointer p-0"
              >
                Resend Verification Email
              </button>
            </div>
          )}

          <Button
            id="submit-auth-btn"
            type="submit"
            disabled={loading}
            className="w-full mt-2"
          >
            {loading ? (
              <LoadingSpinner size="sm" />
            ) : isSignUp ? (
              "Create B2B Account"
            ) : (
              "Sign In to Portal"
            )}
          </Button>
        </form>

        {/* Divider */}
        <div className="relative flex py-4 items-center">
          <div className="flex-grow border-t border-[#E5E7EB]"></div>
          <span className="flex-shrink mx-4 text-xs text-[#6B7280] font-medium uppercase">
            Or GMS Web Fallback
          </span>
          <div className="flex-grow border-t border-[#E5E7EB]"></div>
        </div>

        {/* GMS Web Sync Fallback Button */}
        <button
          id="gms-google-auth-btn"
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 px-4 py-2 text-sm font-semibold border border-[#E5E7EB] hover:bg-gray-50 text-[#111827] rounded-md transition-all duration-200"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" width="24" height="24">
            <g transform="matrix(1, 0, 0, 1, 0, 0)">
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
            </g>
          </svg>
          Google Play / GMS Auth Fallback
        </button>

        {/* Toggle between Login and Register */}
        <div className="text-center mt-6">
          <button
            id="auth-toggle-view-btn"
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setAlertMsg(null);
              setShowResend(false);
            }}
            className="text-xs text-[#6B7280] hover:text-[#111827] transition-colors focus:outline-none"
          >
            {isSignUp ? (
              <span>
                Already have a B2B account?{" "}
                <strong className="text-[#1D4ED8] font-bold hover:underline">Sign In</strong>
              </span>
            ) : (
              <span>
                New agency partner?{" "}
                <strong className="text-[#1D4ED8] font-bold hover:underline">Create B2B Account</strong>
              </span>
            )}
          </button>
        </div>

        {/* Informational Help Note */}
        <div className="mt-8 pt-6 border-t border-[#E5E7EB] flex gap-2.5 text-xs text-[#6B7280]">
          <HelpCircle className="h-4 w-4 text-gray-400 flex-shrink-0" />
          <div>
            <p className="font-semibold text-[#111827] mb-0.5">Mobile Sync Active</p>
            This portal is fully synchronized with your Android booking client, sharing the same live flight schedules, real-time inventory, and verified agent permissions.
          </div>
        </div>
      </div>
    </div>
  );
}
