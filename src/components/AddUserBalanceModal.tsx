import React, { useState } from "react";
import { db } from "../firebase";
import { collection, addDoc } from "firebase/firestore";
import { X, DollarSign, UserCheck, CreditCard, Sparkles } from "lucide-react";
import { Alert, LoadingSpinner } from "./UIComponents";

interface AgentItem {
  email: string;
  name: string;
  balance: number;
}

interface AddUserBalanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  agents: AgentItem[];
  onBalanceAdded?: () => void;
}

export const AddUserBalanceModal: React.FC<AddUserBalanceModalProps> = ({
  isOpen,
  onClose,
  agents,
  onBalanceAdded,
}) => {
  if (!isOpen) return null;

  const [selectedEmail, setSelectedEmail] = useState<string>(agents[0]?.email || "");
  const [customEmail, setCustomEmail] = useState<string>("");
  const [customName, setCustomName] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [description, setDescription] = useState<string>("Corporate credit balance deposit approved by admin.");
  
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");

  // Determine active target agent
  const isCustom = selectedEmail === "NEW_AGENT";
  const activeAgent = agents.find((a) => a.email.toLowerCase() === selectedEmail.toLowerCase());

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedEmail(val);
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);

    const targetEmail = isCustom ? customEmail.trim().toLowerCase() : selectedEmail.trim().toLowerCase();
    
    let targetName = "";
    if (isCustom) {
      targetName = customName.trim() || targetEmail.split("@")[0];
    } else {
      targetName = activeAgent?.name || targetEmail.split("@")[0];
    }

    if (!targetEmail) {
      setError("Please select or enter an Agent/User email.");
      setSubmitting(false);
      return;
    }

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError("Amount must be a number greater than 0 PKR.");
      setSubmitting(false);
      return;
    }

    try {
      await addDoc(collection(db, "ledgers"), {
        agentEmail: targetEmail,
        agentName: targetName,
        type: "Credit",
        amount: numAmount,
        description: description.trim() || "Account top-up credit added by Admin",
        timestamp: new Date(),
      });

      setSuccess(`PKR ${numAmount.toLocaleString()} added successfully to ${targetName} (${targetEmail})!`);
      setAmount("");
      if (onBalanceAdded) onBalanceAdded();
    } catch (err: any) {
      console.error("Add balance error:", err);
      setError("Failed to add balance: " + (err.message || "Firestore error"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="relative bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 overflow-hidden">
        
        {/* Header */}
        <div className="flex justify-between items-center pb-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="bg-[#00a29c]/10 p-2.5 rounded-xl text-[#00a29c]">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-[#133F5C]">Add User / Agent Balance</h3>
              <p className="text-xs text-gray-500">Top-up credit limit for B2B partner accounts</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4 text-xs">
          
          {error && <Alert id="add-balance-error" type="error" message={error} onClose={() => setError("")} />}
          {success && <Alert id="add-balance-success" type="success" message={success} onClose={() => setSuccess("")} />}

          {/* User/Agent Selector Dropdown */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-[#111827] flex items-center justify-between">
              <span>Select Agent / User</span>
              {activeAgent && !isCustom && (
                <span className="text-[11px] text-[#00a29c] font-mono font-bold">
                  Current Net Balance: PKR {activeAgent.balance.toLocaleString()}
                </span>
              )}
            </label>

            <select
              value={selectedEmail}
              onChange={handleSelectChange}
              disabled={submitting}
              className="px-3 py-2.5 text-xs text-[#111827] bg-white border border-[#E5E7EB] rounded-lg outline-none focus:border-[#00a29c] focus:ring-1 focus:ring-[#00a29c] font-medium"
            >
              {agents.map((ag) => (
                <option key={ag.email} value={ag.email}>
                  {ag.name} ({ag.email}) &bull; Balance: PKR {ag.balance.toLocaleString()}
                </option>
              ))}
              <option value="NEW_AGENT">+ Enter Custom / New Agent Email</option>
            </select>
          </div>

          {/* Custom Agent Email / Name input if NEW_AGENT selected */}
          {isCustom && (
            <div className="space-y-3 bg-gray-50 p-3.5 rounded-xl border border-gray-200">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-[#111827]">Agent Email Address</label>
                <input
                  type="email"
                  placeholder="agent.partner@gmail.com"
                  value={customEmail}
                  onChange={(e) => setCustomEmail(e.target.value)}
                  required
                  disabled={submitting}
                  className="px-3 py-2 text-xs bg-white border border-[#E5E7EB] rounded-md outline-none focus:border-[#00a29c]"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-[#111827]">Agency Name (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Madinah Travels Pvt Ltd"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  disabled={submitting}
                  className="px-3 py-2 text-xs bg-white border border-[#E5E7EB] rounded-md outline-none focus:border-[#00a29c]"
                />
              </div>
            </div>
          )}

          {/* Amount PKR */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-[#111827]">Amount to Add (PKR)</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500 font-bold">
                PKR
              </div>
              <input
                type="number"
                placeholder="500000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                disabled={submitting}
                className="pl-12 pr-3 py-2.5 text-xs text-[#111827] bg-white border border-[#E5E7EB] rounded-lg outline-none focus:border-[#00a29c] focus:ring-1 focus:ring-[#00a29c] font-bold text-sm w-full"
              />
            </div>
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-[#111827]">Receipt Particulars / Note</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={submitting}
              className="p-2.5 text-xs text-[#111827] bg-white border border-[#E5E7EB] rounded-lg outline-none focus:border-[#00a29c]"
            />
          </div>

          {/* Submit buttons */}
          <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-gray-300 rounded-xl font-bold text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-[#00a29c] hover:bg-[#00828a] text-white font-bold py-2.5 rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {submitting ? <LoadingSpinner size="sm" /> : "➕ Add Credit Balance"}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
