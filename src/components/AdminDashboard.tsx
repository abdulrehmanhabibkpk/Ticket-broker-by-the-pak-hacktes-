import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  getDocs
} from "firebase/firestore";
import { Ticket, Booking, LedgerTransaction, SystemNotification } from "../types";
import { Button, Input, Card, Badge, LoadingSpinner, Alert } from "./UIComponents";
import {
  Plane,
  Plus,
  Edit2,
  Trash2,
  Calendar,
  DollarSign,
  Users,
  Briefcase,
  X,
  FileText,
  UserCheck,
  RefreshCw,
  Bell,
  CreditCard,
  Building2,
  ShieldAlert,
  ArrowUpRight,
  ArrowDownLeft,
  ChevronRight,
  Building
} from "lucide-react";

export default function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  // Navigation: 'inventory' | 'bookings' | 'ledger' | 'notifications'
  const [activeTab, setActiveTab] = useState<string>("inventory");
  
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [ledgers, setLedgers] = useState<LedgerTransaction[]>([]);
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [loadingLedgers, setLoadingLedgers] = useState(true);

  // Form State for Adding / Editing Tickets (Flight schedules)
  const [isEditing, setIsEditing] = useState(false);
  const [editTicketId, setEditTicketId] = useState<string | null>(null);
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [departureDate, setDepartureDate] = useState("");
  const [price, setPrice] = useState<string>("");
  const [totalSeats, setTotalSeats] = useState<string>("");
  const [availableSeats, setAvailableSeats] = useState<string>("");
  const [airline, setAirline] = useState("");
  const [pnrPrefix, setPnrPrefix] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  // Form State for Ledger Deposit Credit top-up
  const [agentEmail, setAgentEmail] = useState("");
  const [agentName, setAgentName] = useState("");
  const [topupAmount, setTopupAmount] = useState<string>("");
  const [depositDesc, setDepositDesc] = useState("Corporate credit balance deposit approved by admin.");
  const [ledgerSubmitting, setLedgerSubmitting] = useState(false);
  const [ledgerError, setLedgerError] = useState("");
  const [ledgerSuccess, setLedgerSuccess] = useState("");

  // Form State for Broadcast Alert Announcements
  const [notifTitle, setNotifTitle] = useState("");
  const [notifContent, setNotifContent] = useState("");
  const [notifType, setNotifType] = useState("info");
  const [notifSubmitting, setNotifSubmitting] = useState(false);
  const [notifError, setNotifError] = useState("");
  const [notifSuccess, setNotifSuccess] = useState("");

  // Photo viewer modal state
  const [photoModal, setPhotoModal] = useState<{
    isOpen: boolean;
    title: string;
    imgUrl: string;
  }>({ isOpen: false, title: "", imgUrl: "" });

  // 1. Listen to Tickets real-time
  useEffect(() => {
    const q = query(collection(db, "tickets"));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const ticketList: Ticket[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          ticketList.push({
            id: docSnap.id,
            origin: data.origin || "",
            destination: data.destination || "",
            departureDate: data.departureDate || "",
            price: Number(data.price) || 0,
            availableSeats: Number(data.availableSeats) !== undefined ? Number(data.availableSeats) : (Number(data.totalSeats) || 0),
            totalSeats: Number(data.totalSeats) || 0,
            airline: data.airline || "",
            pnrPrefix: data.pnrPrefix || "",
          });
        });
        setTickets(ticketList);
        setLoadingTickets(false);
      },
      (error) => {
        console.error("Error listening to tickets:", error);
        setLoadingTickets(false);
      }
    );
    return () => unsubscribe();
  }, []);

  // 2. Listen to Bookings real-time
  useEffect(() => {
    const q = query(collection(db, "bookings"), orderBy("timestamp", "desc"));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const bookingList: Booking[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          bookingList.push({
            bookingId: docSnap.id,
            ticketId: data.ticketId || "",
            agentName: data.agentName || "Unknown Agent",
            agentEmail: data.agentEmail || "",
            passengerName: data.passengerName || "",
            passengerPassport: data.passengerPassport || "",
            passengerPhotoUrl: data.passengerPhotoUrl || "",
            passportPhotoUrl: data.passportPhotoUrl || "",
            status: data.status || "Pending",
            timestamp: data.timestamp,
          });
        });
        setBookings(bookingList);
        setLoadingBookings(false);
      },
      (error) => {
        console.error("Error listening to bookings:", error);
        setLoadingBookings(false);
      }
    );
    return () => unsubscribe();
  }, []);

  // 3. Listen to all Ledger logs
  useEffect(() => {
    const q = query(collection(db, "ledgers"), orderBy("timestamp", "desc"));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const ledgerList: LedgerTransaction[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          ledgerList.push({
            id: docSnap.id,
            agentEmail: data.agentEmail || "",
            agentName: data.agentName || "",
            type: data.type || "Debit",
            amount: Number(data.amount) || 0,
            description: data.description || "",
            timestamp: data.timestamp,
          });
        });
        setLedgers(ledgerList);
        setLoadingLedgers(false);
      },
      (error) => {
        console.error("Error listening to ledgers:", error);
        setLoadingLedgers(false);
      }
    );
    return () => unsubscribe();
  }, []);

  // 4. Listen to system notifications
  useEffect(() => {
    const q = query(collection(db, "notifications"), orderBy("timestamp", "desc"));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const notificationList: SystemNotification[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          notificationList.push({
            id: docSnap.id,
            title: data.title || "",
            content: data.content || "",
            timestamp: data.timestamp,
            type: data.type || "info",
          });
        });
        setNotifications(notificationList);
      },
      (error) => {
        console.error("Error listening to notifications:", error);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleCreateOrUpdateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");
    setSubmitting(true);

    if (!origin.trim() || !destination.trim()) {
      setFormError("Origin and Destination are required.");
      setSubmitting(false);
      return;
    }
    if (!airline.trim() || !pnrPrefix.trim()) {
      setFormError("Airline and PNR Prefix are required.");
      setSubmitting(false);
      return;
    }
    if (!departureDate) {
      setFormError("Departure Date is required.");
      setSubmitting(false);
      return;
    }

    const parsedPrice = Number(price);
    const parsedTotalSeats = Number(totalSeats);
    const parsedAvailableSeats = isEditing ? Number(availableSeats) : parsedTotalSeats;

    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      setFormError("Price must be a valid number greater than 0.");
      setSubmitting(false);
      return;
    }
    if (isNaN(parsedTotalSeats) || !Number.isInteger(parsedTotalSeats) || parsedTotalSeats <= 0) {
      setFormError("Total seats must be a valid integer greater than 0.");
      setSubmitting(false);
      return;
    }
    if (isEditing && (isNaN(parsedAvailableSeats) || !Number.isInteger(parsedAvailableSeats) || parsedAvailableSeats < 0)) {
      setFormError("Available seats must be a valid integer greater than or equal to 0.");
      setSubmitting(false);
      return;
    }
    if (isEditing && parsedAvailableSeats > parsedTotalSeats) {
      setFormError("Available seats cannot exceed total capacity.");
      setSubmitting(false);
      return;
    }

    try {
      const ticketData = {
        origin: String(origin).trim().toUpperCase(),
        destination: String(destination).trim().toUpperCase(),
        departureDate: String(departureDate).trim(),
        price: parsedPrice,
        totalSeats: parsedTotalSeats,
        availableSeats: parsedAvailableSeats,
        airline: String(airline).trim(),
        pnrPrefix: String(pnrPrefix).trim().toUpperCase(),
      };

      if (isEditing && editTicketId) {
        const docRef = doc(db, "tickets", editTicketId);
        await updateDoc(docRef, ticketData);
        setFormSuccess("B2B Ticket successfully updated!");
        resetForm();
      } else {
        await addDoc(collection(db, "tickets"), ticketData);
        setFormSuccess("New B2B Ticket successfully published!");
        resetForm();
      }
    } catch (err: any) {
      console.error("Ticket save error:", err);
      setFormError(err.message || "Failed to save B2B ticket.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditClick = (t: Ticket) => {
    setIsEditing(true);
    setEditTicketId(t.id);
    setOrigin(t.origin);
    setDestination(t.destination);
    setDepartureDate(t.departureDate);
    setPrice(String(t.price));
    setTotalSeats(String(t.totalSeats));
    setAvailableSeats(String(t.availableSeats));
    setAirline(t.airline);
    setPnrPrefix(t.pnrPrefix);
    setFormError("");
    setFormSuccess("");
  };

  const handleDeleteTicket = async (ticketId: string) => {
    if (!window.confirm("Are you sure you want to delete this B2B flight schedule permanently?")) {
      return;
    }
    try {
      await deleteDoc(doc(db, "tickets", ticketId));
      alert("Ticket successfully removed from both web and mobile clients!");
    } catch (err: any) {
      console.error("Delete ticket error:", err);
      alert("Failed to delete ticket: " + err.message);
    }
  };

  // Toggle booking status between Confirmed / Pending
  const handleToggleBookingStatus = async (bookingId: string, currentStatus: string) => {
    try {
      const nextStatus = currentStatus === "Confirmed" ? "Pending" : "Confirmed";
      const docRef = doc(db, "bookings", bookingId);
      await updateDoc(docRef, {
        status: nextStatus,
      });
    } catch (err: any) {
      console.error("Update status error:", err);
      alert("Failed to update booking status: " + err.message);
    }
  };

  // Submit agency ledger deposit credit top-up
  const handleAddLedgerCredit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLedgerError("");
    setLedgerSuccess("");
    setLedgerSubmitting(true);

    const amountNum = Number(topupAmount);
    if (!agentEmail.trim()) {
      setLedgerError("Agent corporate email is required.");
      setLedgerSubmitting(false);
      return;
    }
    if (isNaN(amountNum) || amountNum <= 0) {
      setLedgerError("Top Up Amount must be a valid number greater than 0.");
      setLedgerSubmitting(false);
      return;
    }

    try {
      // Create Credit Ledger Entry
      const ledgerColRef = collection(db, "ledgers");
      const cleanPrefix = agentEmail.split("@")[0].replace(/[._]/g, " ");
      const computedName = agentName.trim() || cleanPrefix.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
      
      await addDoc(ledgerColRef, {
        agentEmail: agentEmail.trim().toLowerCase(),
        agentName: computedName,
        type: "Credit",
        amount: amountNum,
        description: depositDesc.trim(),
        timestamp: new Date()
      });

      setLedgerSuccess(`Successfully added PKR ${amountNum.toLocaleString()} credit to B2B partner ${agentEmail}!`);
      setTopupAmount("");
      setAgentEmail("");
      setAgentName("");
    } catch (err: any) {
      console.error("Ledger save error:", err);
      setLedgerError(err.message || "Failed to add ledger entry.");
    } finally {
      setLedgerSubmitting(false);
    }
  };

  // Submit System Notification alert broadcast
  const handleBroadcastAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotifError("");
    setNotifSuccess("");
    setNotifSubmitting(true);

    if (!notifTitle.trim() || !notifContent.trim()) {
      setNotifError("Announcement title and message body are required.");
      setNotifSubmitting(false);
      return;
    }

    try {
      const notifColRef = collection(db, "notifications");
      await addDoc(notifColRef, {
        title: notifTitle.trim(),
        content: notifContent.trim(),
        type: notifType,
        timestamp: new Date()
      });

      setNotifSuccess("B2B Broadcast alert announcement posted successfully!");
      setNotifTitle("");
      setNotifContent("");
    } catch (err: any) {
      console.error("Notification post error:", err);
      setNotifError(err.message || "Failed to post broadcast notification.");
    } finally {
      setNotifSubmitting(false);
    }
  };

  // Delete dynamic notification broadcast
  const handleDeleteNotification = async (id: string) => {
    if (!window.confirm("Delete this announcement?")) return;
    try {
      await deleteDoc(doc(db, "notifications", id));
    } catch (err: any) {
      console.error("Delete notification error:", err);
      alert("Failed to delete announcement: " + err.message);
    }
  };

  const resetForm = () => {
    setIsEditing(false);
    setEditTicketId(null);
    setOrigin("");
    setDestination("");
    setDepartureDate("");
    setPrice("");
    setTotalSeats("");
    setAvailableSeats("");
    setAirline("");
    setPnrPrefix("");
  };

  return (
    <div className="flex min-h-[90vh] bg-[#F1F5F9] -mx-4 sm:-mx-6 lg:-mx-8 -my-8 font-sans">
      
      {/* SIDEBAR NAVIGATION - MATCHING SKY PASS STYLE */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col justify-between shrink-0 hidden md:flex">
        <div>
          {/* Logo brand */}
          <div className="p-6 border-b border-gray-100 flex items-center gap-3 bg-[#133F5C] text-white">
            <div className="bg-[#ff7300] p-1.5 rounded-full flex items-center justify-center">
              <Plane className="h-5 w-5 text-white transform -rotate-45" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold tracking-tight flex items-center gap-1 leading-none">
                <span className="text-white font-black">SKY</span>
                <span className="text-[#ff7300] font-black">PASS</span>
              </h2>
              <span className="text-[9px] text-gray-300 font-mono tracking-wider block mt-1">
                SYSTEM ADMINISTRATOR
              </span>
            </div>
          </div>

          {/* Admin Nav Links */}
          <nav className="p-4 space-y-1">
            <button
              onClick={() => setActiveTab("inventory")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-150 ${
                activeTab === "inventory"
                  ? "bg-[#00a29c] text-white shadow-xs"
                  : "text-[#133F5C] hover:bg-gray-50"
              }`}
            >
              <Plane className="h-4 w-4" />
              <span>Manage Tickets</span>
            </button>

            <button
              onClick={() => setActiveTab("bookings")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-150 ${
                activeTab === "bookings"
                  ? "bg-[#00a29c] text-white shadow-xs"
                  : "text-[#133F5C] hover:bg-gray-50"
              }`}
            >
              <FileText className="h-4 w-4" />
              <span>Agency Bookings</span>
              {bookings.length > 0 && (
                <span className="ml-auto bg-[#ff7300] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {bookings.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("ledger")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-150 ${
                activeTab === "ledger"
                  ? "bg-[#00a29c] text-white shadow-xs"
                  : "text-[#133F5C] hover:bg-gray-50"
              }`}
            >
              <CreditCard className="h-4 w-4" />
              <span>Agency Ledgers</span>
            </button>

            <button
              onClick={() => setActiveTab("notifications")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-150 ${
                activeTab === "notifications"
                  ? "bg-[#00a29c] text-white shadow-xs"
                  : "text-[#133F5C] hover:bg-gray-50"
              }`}
            >
              <Bell className="h-4 w-4" />
              <span>Broadcast Alerts</span>
            </button>
          </nav>
        </div>

        {/* Admin profile details bottom */}
        <div className="p-4 border-t border-gray-100 bg-gray-50">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-9 w-9 bg-[#ff7300] text-white font-bold rounded-full flex items-center justify-center text-sm">
              AD
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-[#111827] truncate">System Admin</p>
              <p className="text-[10px] text-gray-500 truncate">abdulrehman654as@gmail.com</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="w-full text-center text-xs text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 py-2 rounded-md font-semibold transition-colors duration-150"
          >
            Sign Out Admin
          </button>
        </div>
      </aside>

      {/* MAIN VIEWPORT */}
      <main className="flex-1 flex flex-col overflow-hidden">
        
        {/* Top Header */}
        <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6 shrink-0 shadow-xs">
          <div className="flex items-center gap-3">
            <span className="text-sm font-extrabold text-[#133F5C] uppercase tracking-wide">
              {activeTab === "inventory" ? "Manage B2B Ticket Inventory" : activeTab.replace("_", " ")}
            </span>
            <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
            <span className="text-xs text-gray-400 hidden sm:inline">Global Administration Console</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="bg-[#ff7300]/10 text-[#EA580C] font-bold text-xs px-3 py-1.5 rounded border border-[#ff7300]/20 flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" />
              <span>Active Flights: {tickets.length}</span>
            </div>
          </div>
        </header>

        {/* Content panel */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* TAB 1: MANAGE TICKETS (FLIGHT INVENTORY CONTROLLER) */}
          {activeTab === "inventory" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-fadeIn">
              
              {/* Left Column: List of existing tickets */}
              <div className="lg:col-span-8 space-y-4">
                <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs">
                  <div className="flex justify-between items-center pb-4 border-b border-gray-100 mb-4">
                    <div>
                      <h3 className="text-sm font-black text-[#133F5C]">Published B2B Ticket Schedules</h3>
                      <p className="text-[11px] text-gray-500 mt-0.5">List of dynamic flights synchronized perfectly across Web and Android clients</p>
                    </div>
                  </div>

                  {loadingTickets ? (
                    <div className="py-12"><LoadingSpinner /></div>
                  ) : tickets.length === 0 ? (
                    <div className="py-12 text-center text-gray-400">
                      No active flight listings found. Fill the form on the right to publish your first flight.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 text-xs">
                        <thead>
                          {/* Navy Blue header matching Image 1 */}
                          <tr className="bg-[#133F5C] text-white">
                            <th className="px-4 py-2.5 text-left font-bold uppercase">Airline / PNR</th>
                            <th className="px-4 py-2.5 text-left font-bold uppercase">Sector</th>
                            <th className="px-4 py-2.5 text-left font-bold uppercase">Departure Date</th>
                            <th className="px-4 py-2.5 text-left font-bold uppercase">Price</th>
                            <th className="px-4 py-2.5 text-left font-bold uppercase">Seats (Avail/Total)</th>
                            <th className="px-4 py-2.5 text-right font-bold uppercase">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                          {tickets.map((t) => (
                            <tr key={t.id} className="hover:bg-cyan-50/20">
                              <td className="px-4 py-3 font-bold text-gray-800">
                                {t.airline} <span className="font-mono text-[10px] text-gray-400">({t.pnrPrefix})</span>
                              </td>
                              <td className="px-4 py-3 font-extrabold text-[#133F5C]">
                                {t.origin} &rarr; {t.destination}
                              </td>
                              <td className="px-4 py-3 font-mono text-gray-500">
                                {t.departureDate}
                              </td>
                              <td className="px-4 py-3 font-black text-[#ff7300]">
                                PKR {t.price.toLocaleString()}
                              </td>
                              <td className="px-4 py-3">
                                <span className="font-bold text-green-600">{t.availableSeats}</span>
                                <span className="text-gray-400"> / {t.totalSeats}</span>
                              </td>
                              <td className="px-4 py-3 text-right space-x-2">
                                <button
                                  id={`edit-ticket-btn-${t.id}`}
                                  onClick={() => handleEditClick(t)}
                                  className="text-gray-500 hover:text-[#00a29c] transition-colors p-1 bg-gray-50 hover:bg-cyan-50 rounded border border-gray-100"
                                >
                                  <Edit2 className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  id={`delete-ticket-btn-${t.id}`}
                                  onClick={() => handleDeleteTicket(t.id)}
                                  className="text-gray-500 hover:text-red-600 transition-colors p-1 bg-gray-50 hover:bg-red-50 rounded border border-gray-100"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Add/Edit Form matching exact Firestore keys */}
              <div className="lg:col-span-4 sticky top-6">
                <Card className="border border-gray-200 shadow-sm p-5 space-y-4 bg-white">
                  <h3 className="text-sm font-black text-[#133F5C] pb-2 border-b border-gray-100 flex items-center gap-2">
                    <Plus className="h-4.5 w-4.5 text-[#ff7300]" />
                    {isEditing ? "Edit Ticket Listing" : "Add New Ticket Listing"}
                  </h3>

                  {formError && <Alert id="form-error" type="error" message={formError} onClose={() => setFormError("")} />}
                  {formSuccess && <Alert id="form-success" type="success" message={formSuccess} onClose={() => setFormSuccess("")} />}

                  <form onSubmit={handleCreateOrUpdateTicket} className="space-y-4 text-xs">
                    <Input
                      id="airline-input"
                      label="Airline Carrier"
                      placeholder="e.g. FlyJinnah or AirArabia"
                      value={airline}
                      onChange={(e) => setAirline(e.target.value)}
                      required
                      disabled={submitting}
                    />

                    <Input
                      id="pnr-prefix-input"
                      label="PNR Prefix / Flight Prefix"
                      placeholder="e.g. 9P"
                      value={pnrPrefix}
                      onChange={(e) => setPnrPrefix(e.target.value)}
                      required
                      disabled={submitting}
                    />

                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        id="origin-input"
                        label="Origin City Code"
                        placeholder="e.g. ISB"
                        value={origin}
                        onChange={(e) => setOrigin(e.target.value)}
                        required
                        disabled={submitting}
                      />
                      <Input
                        id="destination-input"
                        label="Destination City Code"
                        placeholder="e.g. SHJ"
                        value={destination}
                        onChange={(e) => setDestination(e.target.value)}
                        required
                        disabled={submitting}
                      />
                    </div>

                    <Input
                      id="departure-date-input"
                      label="Departure Date"
                      type="date"
                      value={departureDate}
                      onChange={(e) => setDepartureDate(e.target.value)}
                      required
                      disabled={submitting}
                    />

                    <Input
                      id="price-input"
                      label="Seat Price (PKR)"
                      type="number"
                      placeholder="e.g. 98000"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      required
                      disabled={submitting}
                    />

                    <Input
                      id="total-seats-input"
                      label="Total Seats Capacity"
                      type="number"
                      placeholder="e.g. 150"
                      value={totalSeats}
                      onChange={(e) => setTotalSeats(e.target.value)}
                      required
                      disabled={submitting}
                    />

                    {isEditing && (
                      <Input
                        id="available-seats-input"
                        label="Available Seats count"
                        type="number"
                        placeholder="e.g. 148"
                        value={availableSeats}
                        onChange={(e) => setAvailableSeats(e.target.value)}
                        required
                        disabled={submitting}
                      />
                    )}

                    <div className="flex gap-2.5 pt-2">
                      <button
                        id="submit-ticket-btn"
                        type="submit"
                        disabled={submitting}
                        className="flex-1 bg-[#ff7300] hover:bg-[#e05e00] text-white font-bold py-2.5 rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5"
                      >
                        {submitting ? <LoadingSpinner size="sm" /> : isEditing ? "Update Ticket" : "Publish Ticket"}
                      </button>
                      {isEditing && (
                        <button
                          id="cancel-edit-btn"
                          type="button"
                          onClick={resetForm}
                          className="px-3 py-2 border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 rounded-lg text-xs transition-colors"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </form>
                </Card>
              </div>

            </div>
          )}

          {/* TAB 2: AGENCY BOOKINGS APPROVAL STREAM */}
          {activeTab === "bookings" && (
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-xs space-y-4 animate-fadeIn">
              <div className="pb-4 border-b border-gray-100">
                <h3 className="text-base font-black text-[#133F5C]">Unified Agency Bookings stream</h3>
                <p className="text-xs text-gray-500">Real-time bookings submitted across B2B mobile and web agent panels</p>
              </div>

              {loadingBookings ? (
                <div className="py-12"><LoadingSpinner /></div>
              ) : bookings.length === 0 ? (
                <div className="py-12 text-center text-gray-400">
                  No bookings registered in the system yet. Active agents bookings will appear here in real-time.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 text-xs">
                    <thead>
                      <tr className="bg-gray-50 text-gray-500">
                        <th className="px-4 py-3 text-left font-bold uppercase">Booking ID</th>
                        <th className="px-4 py-3 text-left font-bold uppercase">Flight / Sector</th>
                        <th className="px-4 py-3 text-left font-bold uppercase">B2B Agent Email</th>
                        <th className="px-4 py-3 text-left font-bold uppercase">Passenger Details</th>
                        <th className="px-4 py-3 text-left font-bold uppercase">Verified Docs</th>
                        <th className="px-4 py-3 text-left font-bold uppercase">Status</th>
                        <th className="px-4 py-3 text-right font-bold uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {bookings.map((b) => {
                        const associatedFlight = tickets.find((t) => t.id === b.ticketId);
                        return (
                          <tr key={b.bookingId} className="hover:bg-gray-50">
                            <td className="px-4 py-3 font-mono font-bold text-gray-500">
                              #{b.bookingId.substring(0, 8)}
                            </td>
                            <td className="px-4 py-3">
                              <div className="font-bold text-gray-800">
                                {associatedFlight ? `${associatedFlight.origin} to ${associatedFlight.destination}` : b.ticketId}
                              </div>
                              <div className="text-[10px] text-gray-400 font-mono">
                                Airline: {associatedFlight?.airline || "Partner Airline"}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="font-bold text-gray-800">{b.agentName}</div>
                              <div className="text-[10px] text-gray-400 font-mono">{b.agentEmail}</div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="font-bold text-gray-800">{b.passengerName}</div>
                              <div className="text-[10px] text-gray-500 font-mono">Passport: {b.passengerPassport}</div>
                            </td>
                            <td className="px-4 py-3 space-x-2">
                              {b.passengerPhotoUrl ? (
                                <button
                                  id={`photo-admin-preview-${b.bookingId}`}
                                  onClick={() =>
                                    setPhotoModal({
                                      isOpen: true,
                                      title: `Passenger Profile Image: ${b.passengerName}`,
                                      imgUrl: b.passengerPhotoUrl,
                                    })
                                  }
                                  className="text-xs text-[#00a29c] font-bold bg-cyan-50 hover:bg-cyan-100 px-2.5 py-1 rounded cursor-pointer border border-cyan-100"
                                >
                                  Photo
                                </button>
                              ) : (
                                <span className="text-gray-400 text-[10px]">No Photo</span>
                              )}
                              {b.passportPhotoUrl ? (
                                <button
                                  id={`passport-admin-preview-${b.bookingId}`}
                                  onClick={() =>
                                    setPhotoModal({
                                      isOpen: true,
                                      title: `Passport Scan Image: ${b.passengerName}`,
                                      imgUrl: b.passportPhotoUrl,
                                    })
                                  }
                                  className="text-xs text-blue-600 font-bold bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded cursor-pointer border border-blue-100"
                                >
                                  Passport
                                </button>
                              ) : (
                                <span className="text-gray-400 text-[10px]">No Passport</span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <Badge status={b.status} />
                            </td>
                            <td className="px-4 py-3 text-right">
                              <button
                                id={`toggle-admin-btn-${b.bookingId}`}
                                onClick={() => handleToggleBookingStatus(b.bookingId, b.status)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                                  b.status === "Confirmed"
                                    ? "bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200"
                                    : "bg-green-600 hover:bg-green-700 text-white shadow-xs"
                                }`}
                              >
                                {b.status === "Confirmed" ? "Set Pending" : "Confirm Seat"}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: AGENCY LEDGERS BALANCE TOP-UP MANAGER */}
          {activeTab === "ledger" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-fadeIn">
              
              {/* Left Column: Ledger logs */}
              <div className="lg:col-span-8 space-y-4">
                <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs">
                  <div className="pb-4 border-b border-gray-100 mb-4">
                    <h3 className="text-sm font-black text-[#133F5C]">All B2B Partner Ledger Records</h3>
                    <p className="text-xs text-gray-500 mt-0.5">Global ledger transaction audit stream representing ticket deductions and credit top-ups</p>
                  </div>

                  {loadingLedgers ? (
                    <div className="py-12"><LoadingSpinner /></div>
                  ) : ledgers.length === 0 ? (
                    <div className="py-12 text-center text-gray-400">
                      No ledger transactions logged yet. Use the right form to approve credit top-ups.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 text-xs">
                        <thead>
                          <tr className="bg-gray-50 text-gray-500">
                            <th className="px-4 py-3 text-left font-bold uppercase">Date</th>
                            <th className="px-4 py-3 text-left font-bold uppercase">Agency B2B Partner</th>
                            <th className="px-4 py-3 text-left font-bold uppercase">Particulars / Description</th>
                            <th className="px-4 py-3 text-left font-bold uppercase">Type</th>
                            <th className="px-4 py-3 text-right font-bold uppercase">Amount (PKR)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                          {ledgers.map((l) => (
                            <tr key={l.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3 text-gray-400 font-mono">
                                {l.timestamp ? new Date(l.timestamp.seconds * 1000).toLocaleDateString() : "Live"}
                              </td>
                              <td className="px-4 py-3">
                                <div className="font-bold text-gray-800">{l.agentName}</div>
                                <div className="text-[10px] text-gray-500 font-mono">{l.agentEmail}</div>
                              </td>
                              <td className="px-4 py-3 text-gray-600 font-medium">
                                {l.description}
                              </td>
                              <td className="px-4 py-3">
                                <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                                  l.type === "Credit" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                                }`}>
                                  {l.type}
                                </span>
                              </td>
                              <td className={`px-4 py-3 text-right font-bold font-mono ${
                                l.type === "Credit" ? "text-green-600" : "text-red-600"
                              }`}>
                                {l.type === "Credit" ? "+" : "-"} {l.amount.toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Add Credit Limit Deposit Form */}
              <div className="lg:col-span-4 sticky top-6">
                <Card className="border border-gray-200 shadow-sm p-5 space-y-4 bg-white">
                  <h3 className="text-sm font-black text-[#133F5C] pb-2 border-b border-gray-100 flex items-center gap-2">
                    <Plus className="h-4.5 w-4.5 text-[#00a29c]" />
                    Approve Credit Balance Top-up
                  </h3>

                  {ledgerError && <Alert id="ledger-error" type="error" message={ledgerError} onClose={() => setLedgerError("")} />}
                  {ledgerSuccess && <Alert id="ledger-success" type="success" message={ledgerSuccess} onClose={() => setLedgerSuccess("")} />}

                  <form onSubmit={handleAddLedgerCredit} className="space-y-4 text-xs">
                    <Input
                      id="agent-email-input"
                      label="B2B Agent Corporate Email"
                      type="email"
                      placeholder="agent.partner@gmail.com"
                      value={agentEmail}
                      onChange={(e) => setAgentEmail(e.target.value)}
                      required
                      disabled={ledgerSubmitting}
                    />

                    <Input
                      id="agent-name-input"
                      label="Agency Name (Optional)"
                      placeholder="e.g. Al-Harmain Travel Agency"
                      value={agentName}
                      onChange={(e) => setAgentName(e.target.value)}
                      disabled={ledgerSubmitting}
                    />

                    <Input
                      id="credit-amount-input"
                      label="Top Up Amount (PKR)"
                      type="number"
                      placeholder="e.g. 500000"
                      value={topupAmount}
                      onChange={(e) => setTopupAmount(e.target.value)}
                      required
                      disabled={ledgerSubmitting}
                    />

                    <div className="flex flex-col gap-1">
                      <label htmlFor="ledger-desc" className="text-xs font-semibold text-[#111827]">
                        Receipt Particulars / Description
                      </label>
                      <textarea
                        id="ledger-desc"
                        rows={3}
                        value={depositDesc}
                        onChange={(e) => setDepositDesc(e.target.value)}
                        disabled={ledgerSubmitting}
                        className="p-2.5 text-xs text-[#111827] bg-white border border-[#E5E7EB] rounded-md focus:border-[#1D4ED8] focus:ring-1 focus:ring-[#1D4ED8] outline-none transition-all placeholder-gray-400"
                      />
                    </div>

                    <button
                      id="submit-ledger-btn"
                      type="submit"
                      disabled={ledgerSubmitting}
                      className="w-full bg-[#00a29c] hover:bg-[#00828a] text-white font-bold py-2.5 rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5"
                    >
                      {ledgerSubmitting ? <LoadingSpinner size="sm" /> : "Approve Credit Deposit"}
                    </button>
                  </form>
                </Card>
              </div>

            </div>
          )}

          {/* TAB 4: BROADCAST ALERT ANNOUNCEMENTS */}
          {activeTab === "notifications" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-fadeIn">
              
              {/* Left: list of announcements */}
              <div className="lg:col-span-8 space-y-4">
                <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs">
                  <div className="pb-4 border-b border-gray-100 mb-4 flex justify-between items-center">
                    <div>
                      <h3 className="text-sm font-black text-[#133F5C]">Broadcast Alerts Feed</h3>
                      <p className="text-xs text-gray-500 mt-0.5">Active announcements displayed across B2B agent dashboards instantly</p>
                    </div>
                  </div>

                  {notifications.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                      No broadcast notifications published yet. Use the right form to publish alerts.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {notifications.map((n) => (
                        <div key={n.id} className="p-4 border border-gray-100 bg-gray-50 rounded-xl flex justify-between gap-4 items-start">
                          <div>
                            <div className="flex gap-2.5 items-center mb-1.5">
                              <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${
                                n.type === "alert" ? "bg-red-100 text-red-800" : n.type === "promo" ? "bg-yellow-100 text-yellow-800" : "bg-blue-100 text-blue-800"
                              }`}>
                                {n.type}
                              </span>
                              <span className="text-[10px] text-gray-400 font-mono">
                                {n.timestamp ? new Date(n.timestamp.seconds * 1000).toLocaleString() : "Live"}
                              </span>
                            </div>
                            <h4 className="text-xs font-black text-[#133F5C]">{n.title}</h4>
                            <p className="text-[11px] text-gray-600 mt-1 whitespace-pre-line leading-relaxed">{n.content}</p>
                          </div>
                          <button
                            id={`delete-notif-btn-${n.id}`}
                            onClick={() => handleDeleteNotification(n.id)}
                            className="text-gray-400 hover:text-red-600 font-bold text-sm bg-gray-100 hover:bg-red-50 px-2 py-0.5 rounded border border-gray-200"
                          >
                            &times;
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Right: post alert announcement */}
              <div className="lg:col-span-4 sticky top-6">
                <Card className="border border-gray-200 shadow-sm p-5 space-y-4 bg-white">
                  <h3 className="text-sm font-black text-[#133F5C] pb-2 border-b border-gray-100 flex items-center gap-2">
                    <Plus className="h-4.5 w-4.5 text-[#ff7300]" />
                    Publish Broadcast Announcement
                  </h3>

                  {notifError && <Alert id="notif-error" type="error" message={notifError} onClose={() => setNotifError("")} />}
                  {notifSuccess && <Alert id="notif-success" type="success" message={notifSuccess} onClose={() => setNotifSuccess("")} />}

                  <form onSubmit={handleBroadcastAlert} className="space-y-4 text-xs">
                    <Input
                      id="notif-title-input"
                      label="Announcement Title"
                      placeholder="e.g. Schedule Update or Visa Guidelines"
                      value={notifTitle}
                      onChange={(e) => setNotifTitle(e.target.value)}
                      required
                      disabled={notifSubmitting}
                    />

                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-semibold text-[#111827]">Alert Type Category</span>
                      <select
                        id="notif-type-select"
                        value={notifType}
                        onChange={(e) => setNotifType(e.target.value)}
                        disabled={notifSubmitting}
                        className="px-3 py-2 text-xs text-[#111827] bg-white border border-[#E5E7EB] rounded-md outline-none focus:border-[#1D4ED8]"
                      >
                        <option value="info">Information (Blue)</option>
                        <option value="alert">Critical Alert (Red)</option>
                        <option value="promo">Special Promotion (Yellow)</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label htmlFor="notif-content" className="text-xs font-semibold text-[#111827]">
                        Broadcast Message body
                      </label>
                      <textarea
                        id="notif-content"
                        rows={5}
                        placeholder="Type B2B partner broadcast alert details here..."
                        value={notifContent}
                        onChange={(e) => setNotifContent(e.target.value)}
                        required
                        disabled={notifSubmitting}
                        className="p-2.5 text-xs text-[#111827] bg-white border border-[#E5E7EB] rounded-md outline-none focus:border-[#1D4ED8]"
                      />
                    </div>

                    <button
                      id="submit-notif-btn"
                      type="submit"
                      disabled={notifSubmitting}
                      className="w-full bg-[#ff7300] hover:bg-[#e05e00] text-white font-bold py-2.5 rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5"
                    >
                      {notifSubmitting ? <LoadingSpinner size="sm" /> : "Post B2B Announcement"}
                    </button>
                  </form>
                </Card>
              </div>

            </div>
          )}

        </div>
      </main>

      {/* PHOTO PREVIEW MODAL */}
      {photoModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative bg-white rounded-xl max-w-lg w-full p-6 border border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-sm font-black text-[#133F5C]">{photoModal.title}</h4>
              <button
                id="close-admin-photo-modal-btn"
                onClick={() => setPhotoModal({ isOpen: false, title: "", imgUrl: "" })}
                className="text-gray-400 hover:text-gray-600 cursor-pointer text-lg font-bold"
              >
                &times;
              </button>
            </div>
            <div className="flex justify-center bg-gray-50 border border-gray-100 rounded p-2">
              <img
                src={photoModal.imgUrl}
                alt="Document Preview"
                className="max-h-96 max-w-full object-contain rounded-lg"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="mt-4 flex justify-end">
              <Button
                id="modal-close-btn-admin"
                variant="secondary"
                onClick={() => setPhotoModal({ isOpen: false, title: "", imgUrl: "" })}
              >
                Close Preview
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
