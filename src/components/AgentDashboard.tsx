import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import {
  collection,
  onSnapshot,
  query,
  where,
  orderBy,
  doc,
  setDoc,
  updateDoc,
  getDoc,
  addDoc
} from "firebase/firestore";
import { Ticket, Booking, LedgerTransaction, SystemNotification } from "../types";
import { Button, Input, Card, Badge, LoadingSpinner, Alert } from "./UIComponents";
import {
  Plane,
  Plus,
  Briefcase,
  Upload,
  Calendar,
  User,
  CreditCard,
  CheckCircle,
  FileText,
  AlertCircle,
  X,
  RefreshCw,
  Clock,
  Landmark,
  Bell,
  Search,
  CheckCircle2,
  ChevronRight,
  ArrowRight,
  Sparkles,
  HelpCircle,
  ShieldCheck,
  Percent
} from "lucide-react";

// Client-side lightweight image compressor to Base64 (JPG, 70% quality, max 400x400px)
const compressImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 400;
        const MAX_HEIGHT = 400;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
          resolve(dataUrl);
        } else {
          resolve(event.target?.result as string);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
};

export default function AgentDashboard({
  agentName,
  agentEmail,
  onLogout,
}: {
  agentName: string;
  agentEmail: string;
  onLogout: () => void;
}) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [myBookings, setMyBookings] = useState<Booking[]>([]);
  const [ledgers, setLedgers] = useState<LedgerTransaction[]>([]);
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [loadingLedgers, setLoadingLedgers] = useState(true);

  // Selected sidebar navigation tab: 'dashboard' | 'book_tickets' | 'bookings' | 'ledger' | 'notifications' | 'banks' | 'umrah'
  const [activeTab, setActiveTab] = useState<string>("dashboard");

  // Flight search/filter state
  const [selectedSectorFilter, setSelectedSectorFilter] = useState<string>("All Types");
  const [searchKeyword, setSearchKeyword] = useState<string>("");
  const [searchDeptDate, setSearchDeptDate] = useState<string>("");
  const [advanceSearch, setAdvanceSearch] = useState<boolean>(false);

  // Booking Flow form state
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [passengerName, setPassengerName] = useState("");
  const [passengerPassport, setPassengerPassport] = useState("");
  
  // File uploads
  const [passengerPhoto, setPassengerPhoto] = useState<string>("");
  const [passportPhoto, setPassportPhoto] = useState<string>("");
  const [passengerPhotoName, setPassengerPhotoName] = useState("");
  const [passportPhotoName, setPassportPhotoName] = useState("");

  const [bookingStatus, setBookingStatus] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [bookingLoading, setBookingLoading] = useState(false);

  // Photo viewer modal state
  const [photoModal, setPhotoModal] = useState<{
    isOpen: boolean;
    title: string;
    imgUrl: string;
  }>({ isOpen: false, title: "", imgUrl: "" });

  // Real-time listener for flights
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

  // Real-time listener for "My Bookings"
  useEffect(() => {
    const q = query(
      collection(db, "bookings"),
      where("agentEmail", "==", agentEmail)
    );
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
        // Sort descending by timestamp or placement
        setMyBookings(bookingList);
        setLoadingBookings(false);
      },
      (error) => {
        console.error("Error listening to my bookings:", error);
        setLoadingBookings(false);
      }
    );
    return () => unsubscribe();
  }, [agentEmail]);

  // Real-time listener for "Ledger Statement"
  useEffect(() => {
    const q = query(
      collection(db, "ledgers"),
      where("agentEmail", "==", agentEmail)
    );
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
  }, [agentEmail]);

  // Real-time listener for system notifications
  useEffect(() => {
    const q = query(collection(db, "notifications"));
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

  // Compute Current Ledger Balance (Sum of Credits - Sum of Debits)
  const totalCredits = ledgers
    .filter((l) => l.type === "Credit")
    .reduce((sum, item) => sum + item.amount, 0);

  const totalDebits = ledgers
    .filter((l) => l.type === "Debit")
    .reduce((sum, item) => sum + item.amount, 0);

  // We start agency partners with a default dynamic credit of PKR 500,000 for realistic trial if they have no entries
  const currentBalance = ledgers.length === 0 ? 500000 : (totalCredits - totalDebits);

  const handlePassengerPhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPassengerPhotoName(file.name);
      try {
        const base64 = await compressImage(file);
        setPassengerPhoto(base64);
      } catch (err) {
        console.error("Failed to compress passenger image:", err);
      }
    }
  };

  const handlePassportPhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPassportPhotoName(file.name);
      try {
        const base64 = await compressImage(file);
        setPassportPhoto(base64);
      } catch (err) {
        console.error("Failed to compress passport image:", err);
      }
    }
  };

  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setBookingStatus(null);

    if (!selectedTicket) return;

    if (selectedTicket.availableSeats <= 0) {
      setBookingStatus({
        type: "error",
        text: "This flight is fully booked. No seats remaining.",
      });
      return;
    }

    if (currentBalance < selectedTicket.price) {
      setBookingStatus({
        type: "error",
        text: `Insufficient ledger credit! Flight costs PKR ${selectedTicket.price.toLocaleString()}, your current balance is PKR ${currentBalance.toLocaleString()}. Please check "Banks Detail" page to transfer funds.`,
      });
      return;
    }

    setBookingLoading(true);

    try {
      const ticketRef = doc(db, "tickets", selectedTicket.id);
      const ticketSnap = await getDoc(ticketRef);
      if (!ticketSnap.exists()) {
        throw new Error("This flight listing does not exist anymore.");
      }

      const freshTicketData = ticketSnap.data();
      const currentAvailableSeats = Number(freshTicketData.availableSeats);

      if (currentAvailableSeats <= 0) {
        throw new Error("Seats have just been fully booked by another agency.");
      }

      // 1. Create unique Booking ID and upload to Firestore
      const bookingsColRef = collection(db, "bookings");
      const newBookingDocRef = doc(bookingsColRef);
      const bookingId = newBookingDocRef.id;

      const bookingOrder: Booking = {
        bookingId: bookingId,
        ticketId: selectedTicket.id,
        agentName: agentName,
        agentEmail: agentEmail,
        passengerName: passengerName,
        passengerPassport: passengerPassport,
        passengerPhotoUrl: passengerPhoto,
        passportPhotoUrl: passportPhoto,
        status: "Pending",
        timestamp: new Date()
      };

      await setDoc(newBookingDocRef, bookingOrder);

      // 2. Decrement available seats in Firestore immediately
      await updateDoc(ticketRef, {
        availableSeats: currentAvailableSeats - 1,
      });

      // 3. Create a debit transaction in the ledger statement
      const ledgerColRef = collection(db, "ledgers");
      await addDoc(ledgerColRef, {
        agentEmail: agentEmail,
        agentName: agentName,
        type: "Debit",
        amount: selectedTicket.price,
        description: `B2B Ticket Purchase: ${selectedTicket.origin} to ${selectedTicket.destination} (${selectedTicket.airline} PNR Prefix: ${selectedTicket.pnrPrefix}) for ${passengerName}`,
        timestamp: new Date()
      });

      setBookingStatus({
        type: "success",
        text: `Seat reserved successfully for ${passengerName}! Booking ID is #${bookingId.substring(0, 8)}. PKR ${selectedTicket.price.toLocaleString()} deducted from ledger.`,
      });

      // Reset Booking form
      setPassengerName("");
      setPassengerPassport("");
      setPassengerPhoto("");
      setPassportPhoto("");
      setPassengerPhotoName("");
      setPassportPhotoName("");
      setSelectedTicket(null);
    } catch (err: any) {
      console.error("Booking error:", err);
      setBookingStatus({
        type: "error",
        text: err.message || "Failed to finalize booking order. Please retry.",
      });
    } finally {
      setBookingLoading(false);
    }
  };

  // Filter Logic matching Image 1 top tabs (UAE, KSA, Oman, etc.)
  const getFilteredTickets = () => {
    return tickets.filter((t) => {
      // Keyword search
      const keyword = searchKeyword.toLowerCase().trim();
      const originMatch = t.origin.toLowerCase().includes(keyword);
      const destMatch = t.destination.toLowerCase().includes(keyword);
      const airlineMatch = t.airline.toLowerCase().includes(keyword);
      const matchesKeyword = !keyword || originMatch || destMatch || airlineMatch;

      // Date filter
      const matchesDate = !searchDeptDate || t.departureDate === searchDeptDate;

      // Sector filter pill logic
      let matchesSector = true;
      if (selectedSectorFilter === "UAE One Way") {
        matchesSector = ["DXB", "SHJ", "AUH", "DUBAI", "SHARJAH", "ABU DHABI"].some(
          (code) => t.destination.toUpperCase().includes(code) || t.origin.toUpperCase().includes(code)
        );
      } else if (selectedSectorFilter === "KSA One Way") {
        matchesSector = ["JED", "RUH", "MED", "DMM", "JEDDAH", "RIYADH", "MADINAH"].some(
          (code) => t.destination.toUpperCase().includes(code) || t.origin.toUpperCase().includes(code)
        );
      } else if (selectedSectorFilter === "Oman One Way") {
        matchesSector = ["MCT", "MUSCAT"].some(
          (code) => t.destination.toUpperCase().includes(code) || t.origin.toUpperCase().includes(code)
        );
      } else if (selectedSectorFilter === "Bahrain One Way") {
        matchesSector = ["BAH", "BAHRAIN"].some(
          (code) => t.destination.toUpperCase().includes(code) || t.origin.toUpperCase().includes(code)
        );
      } else if (selectedSectorFilter === "Umrah") {
        matchesSector = ["JED", "MED", "JEDDAH", "MADINAH"].some(
          (code) => t.destination.toUpperCase().includes(code)
        ) || t.airline.toLowerCase().includes("saudia");
      } else if (selectedSectorFilter === "Qatar One Way") {
        matchesSector = ["DOH", "DOHA", "QATAR"].some(
          (code) => t.destination.toUpperCase().includes(code) || t.origin.toUpperCase().includes(code)
        );
      } else if (selectedSectorFilter === "UK One Way") {
        matchesSector = ["LHR", "MAN", "LGW", "LONDON", "MANCHESTER", "UK"].some(
          (code) => t.destination.toUpperCase().includes(code) || t.origin.toUpperCase().includes(code)
        );
      }

      return matchesKeyword && matchesDate && matchesSector;
    });
  };

  const filteredTickets = getFilteredTickets();

  // Grouping flights by Airline and Origin-Destination sector for the exact Image 1 layout
  const groupFlightsBySector = (flightsList: Ticket[]) => {
    const groups: { [key: string]: Ticket[] } = {};
    flightsList.forEach((flight) => {
      // Key format: "AirlineName origin-destination"
      const key = `${flight.airline}__${flight.origin.toUpperCase()}-${flight.destination.toUpperCase()}`;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(flight);
    });
    return groups;
  };

  const groupedFlights = groupFlightsBySector(filteredTickets);

  // Static Umrah Packages lists matching Image 3 structure
  const umrahPackages = [
    {
      id: "pkg-1",
      days: "21 Days",
      airline: "SV-Saudi Arabian Airlines",
      flightNoDep: "SV723",
      flightNoRet: "SV726",
      depDetails: "ISB 16 Aug 10:35 → JED 16 Aug 13:40 (Non Stop • 5h 5m)",
      retDetails: "JED 05 Sep 18:10 → ISB 06 Sep 01:10 (Non Stop • 5h)",
      baggage: "Departure 23 KG | Arrival 46 KG",
      price: 255500,
    },
    {
      id: "pkg-2",
      days: "21 Days",
      airline: "SV-Saudi Arabian Airlines",
      flightNoDep: "SV727",
      flightNoRet: "SV722",
      depDetails: "ISB 18 Aug 02:55 → JED 18 Aug 06:00 (Non Stop)",
      retDetails: "JED 07 Sep 01:50 → ISB 07 Sep 08:50 (Non Stop)",
      baggage: "Departure 23 KG | Arrival 46 KG",
      price: 255500,
    },
    {
      id: "pkg-3",
      days: "22 Days",
      airline: "9P-FLY-JINNAH",
      flightNoDep: "9P729",
      flightNoRet: "9P726",
      depDetails: "ISB 20 Aug 06:40 → JED 20 Aug 10:05 (Non Stop • 5h 25m)",
      retDetails: "JED 10 Sep 11:05 → ISB 10 Sep 18:05 (Non Stop)",
      baggage: "Departure 20 KG | Arrival 30 KG",
      price: 252999,
    },
  ];

  return (
    <div className="flex min-h-[90vh] bg-[#F1F5F9] -mx-4 sm:-mx-6 lg:-mx-8 -my-8 font-sans">
      
      {/* SIDEBAR NAVIGATION - MATCHING SKY PASS EXACT STYLE & DESIGN */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col justify-between shrink-0 hidden md:flex">
        <div>
          {/* Sky Pass Brand Header with Jet icon */}
          <div className="p-6 border-b border-gray-100 flex items-center gap-3 bg-[#133F5C] text-white">
            <div className="bg-[#ff7300] p-1.5 rounded-full flex items-center justify-center">
              <Plane className="h-5 w-5 text-white transform -rotate-45" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold tracking-tight flex items-center gap-1 leading-none">
                <span className="text-white">SKY</span>
                <span className="text-[#ff7300]">PASS</span>
              </h2>
              <span className="text-[9px] text-gray-300 font-mono tracking-wider block mt-1">
                B2B RESERVATIONS
              </span>
            </div>
          </div>

          {/* Nav Links */}
          <nav className="p-4 space-y-1">
            <button
              onClick={() => { setActiveTab("dashboard"); setSelectedTicket(null); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-150 ${
                activeTab === "dashboard"
                  ? "bg-[#00a29c] text-white shadow-xs"
                  : "text-[#133F5C] hover:bg-gray-50"
              }`}
            >
              <Briefcase className="h-4 w-4" />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => { setActiveTab("book_tickets"); setSelectedTicket(null); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-150 ${
                activeTab === "book_tickets"
                  ? "bg-[#00a29c] text-white shadow-xs"
                  : "text-[#133F5C] hover:bg-gray-50"
              }`}
            >
              <Plane className="h-4 w-4" />
              <span>Book Tickets</span>
            </button>

            <button
              onClick={() => { setActiveTab("bookings"); setSelectedTicket(null); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-150 ${
                activeTab === "bookings"
                  ? "bg-[#00a29c] text-white shadow-xs"
                  : "text-[#133F5C] hover:bg-gray-50"
              }`}
            >
              <FileText className="h-4 w-4" />
              <span>Bookings</span>
              {myBookings.length > 0 && (
                <span className="ml-auto bg-[#ff7300] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {myBookings.length}
                </span>
              )}
            </button>

            <button
              onClick={() => { setActiveTab("ledger"); setSelectedTicket(null); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-150 ${
                activeTab === "ledger"
                  ? "bg-[#00a29c] text-white shadow-xs"
                  : "text-[#133F5C] hover:bg-gray-50"
              }`}
            >
              <CreditCard className="h-4 w-4" />
              <span>My Ledger</span>
            </button>

            <button
              onClick={() => { setActiveTab("notifications"); setSelectedTicket(null); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-150 ${
                activeTab === "notifications"
                  ? "bg-[#00a29c] text-white shadow-xs"
                  : "text-[#133F5C] hover:bg-gray-50"
              }`}
            >
              <Bell className="h-4 w-4" />
              <span>Notifications</span>
              {notifications.length > 0 && (
                <span className="ml-auto bg-[#ff7300] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {notifications.length}
                </span>
              )}
            </button>

            <button
              onClick={() => { setActiveTab("banks"); setSelectedTicket(null); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-150 ${
                activeTab === "banks"
                  ? "bg-[#00a29c] text-white shadow-xs"
                  : "text-[#133F5C] hover:bg-gray-50"
              }`}
            >
              <Landmark className="h-4 w-4" />
              <span>Banks Detail</span>
            </button>
          </nav>
        </div>

        {/* User profile bottom details */}
        <div className="p-4 border-t border-gray-100 bg-gray-50">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-9 w-9 bg-[#133F5C] text-white font-bold rounded-full flex items-center justify-center text-sm">
              {agentName.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-[#111827] truncate">{agentName}</p>
              <p className="text-[10px] text-gray-500 truncate">{agentEmail}</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="w-full text-center text-xs text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 py-2 rounded-md font-semibold transition-colors duration-150"
          >
            Sign Out Account
          </button>
        </div>
      </aside>

      {/* MAIN VIEWPORT */}
      <main className="flex-1 flex flex-col overflow-hidden">
        
        {/* Top bar with system status */}
        <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6 shrink-0 shadow-xs">
          <div className="flex items-center gap-3">
            <span className="text-sm font-extrabold text-[#133F5C] uppercase tracking-wide">
              {activeTab.replace("_", " ")}
            </span>
            <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
            <span className="text-xs text-gray-400 hidden sm:inline">Active Mobile Sync Terminal</span>
          </div>

          <div className="flex items-center gap-4">
            {/* Quick balance banner */}
            <div className="bg-[#00a29c]/10 text-[#00828a] font-bold text-xs px-3 py-1.5 rounded border border-[#00a29c]/20 flex items-center gap-1.5">
              <CreditCard className="h-3.5 w-3.5" />
              <span>Ledger Balance: PKR {currentBalance.toLocaleString()}</span>
            </div>

            <div className="h-8 w-px bg-gray-200 hidden md:block"></div>
            
            {/* Agent Role label */}
            <div className="hidden md:flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-[#ff7300]" />
              <span className="text-xs font-bold text-gray-500 uppercase">Verified B2B Agent</span>
            </div>
          </div>
        </header>

        {/* Content Panel scroll container */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* 1. DASHBOARD TAB VIEW (IMAGE 4) */}
          {activeTab === "dashboard" && (
            <div className="space-y-8 animate-fadeIn">
              {/* Promo Banner */}
              <div className="bg-gradient-to-r from-[#133F5C] to-[#1d5074] rounded-xl p-8 text-white relative overflow-hidden shadow-md">
                <div className="absolute -right-10 -bottom-10 opacity-10">
                  <Plane className="h-64 w-64 transform -rotate-45" />
                </div>
                <div className="max-w-xl space-y-3 relative z-10">
                  <span className="bg-[#ff7300] text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                    Exclusive Agent Offer
                  </span>
                  <h2 className="text-2xl font-black tracking-tight leading-tight">
                    Experience dynamic group ticket bookings at industry-leading commission rates
                  </h2>
                  <p className="text-xs text-gray-200 leading-relaxed">
                    Instantly issue bulk seats, handle boarding documentation, and manage payments natively. Completely synced with our companion B2B Android app client.
                  </p>
                </div>
              </div>

              {/* Selection cards matching Image 4 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto py-4">
                
                {/* Card 1: Group Tickets (Blue card with flight image) */}
                <div className="bg-gradient-to-br from-[#1E40AF] to-[#3B82F6] text-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col justify-between h-[360px] group border-4 border-white">
                  <div className="p-6 text-center">
                    <div className="inline-flex p-3 bg-white/10 rounded-full mb-3">
                      <Plane className="h-6 w-6 text-white transform -rotate-45" />
                    </div>
                    <h3 className="text-2xl font-black uppercase tracking-tight">Group Tickets</h3>
                    <p className="text-xs text-blue-100 mt-1">Book block seats on premium routes instantly</p>
                  </div>

                  <div className="px-6 flex justify-center flex-1 items-center overflow-hidden">
                    <img
                      src="/src/assets/images/airplane_card_1786469847543.jpg"
                      alt="Airplane Group Tickets"
                      className="h-32 w-full object-cover rounded-lg group-hover:scale-105 transition-all duration-300 shadow-md"
                      referrerPolicy="no-referrer"
                    />
                  </div>

                  <div className="p-6">
                    <button
                      onClick={() => setActiveTab("book_tickets")}
                      className="w-full bg-white hover:bg-gray-50 text-[#1E40AF] font-bold py-3 px-4 rounded-xl text-xs transition-all duration-150 flex items-center justify-center gap-2 shadow-sm"
                    >
                      <span>Click To Book Now</span>
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Card 2: Umrah Group Packages (Orange card with Kaaba image) */}
                <div className="bg-gradient-to-br from-[#EA580C] to-[#F97316] text-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col justify-between h-[360px] group border-4 border-white">
                  <div className="p-6 text-center">
                    <div className="inline-flex p-3 bg-white/10 rounded-full mb-3">
                      <Sparkles className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-2xl font-black uppercase tracking-tight">Umrah Group Packages</h3>
                    <p className="text-xs text-orange-100 mt-1">Explore all premium Umrah listings & flights</p>
                  </div>

                  <div className="px-6 flex justify-center flex-1 items-center overflow-hidden">
                    <img
                      src="/src/assets/images/kaaba_card_1786469865142.jpg"
                      alt="Umrah Group Packages"
                      className="h-32 w-full object-cover rounded-lg group-hover:scale-105 transition-all duration-300 shadow-md"
                      referrerPolicy="no-referrer"
                    />
                  </div>

                  <div className="p-6">
                    <button
                      onClick={() => setActiveTab("umrah")}
                      className="w-full bg-white hover:bg-gray-50 text-[#EA580C] font-bold py-3 px-4 rounded-xl text-xs transition-all duration-150 flex items-center justify-center gap-2 shadow-sm"
                    >
                      <span>Click To Book Now</span>
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* 2. BOOK TICKETS TAB VIEW (IMAGE 1) */}
          {activeTab === "book_tickets" && (
            <div className="space-y-6 animate-fadeIn">
              
              {/* Sector Filter Bar & Search Fields */}
              <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs space-y-4">
                
                {/* Sector filtering pills */}
                <div className="flex flex-wrap gap-2 pb-2 border-b border-gray-100">
                  {[
                    "All Types",
                    "UAE One Way",
                    "KSA One Way",
                    "Oman One Way",
                    "Bahrain One Way",
                    "Umrah",
                    "Qatar One Way",
                    "UK One Way"
                  ].map((sector) => (
                    <button
                      key={sector}
                      onClick={() => setSelectedSectorFilter(sector)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-150 border cursor-pointer ${
                        selectedSectorFilter === sector
                          ? "bg-[#00a29c] border-[#00a29c] text-white shadow-xs"
                          : "bg-white border-gray-200 text-[#133F5C] hover:bg-gray-50"
                      }`}
                    >
                      {sector}
                    </button>
                  ))}
                </div>

                {/* Live filters */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3 w-full md:w-auto">
                    {/* Advance Search Toggle */}
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={advanceSearch}
                        onChange={(e) => setAdvanceSearch(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00a29c]"></div>
                      <span className="ml-2 text-xs font-bold text-[#133F5C]">Advance Search</span>
                    </label>

                    {/* Date filter picker */}
                    <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 text-xs text-[#133F5C]">
                      <Calendar className="h-3.5 w-3.5 text-gray-400" />
                      <input
                        type="date"
                        value={searchDeptDate}
                        onChange={(e) => setSearchDeptDate(e.target.value)}
                        className="bg-transparent outline-none cursor-pointer font-semibold text-gray-600 ml-1"
                        placeholder="Search by Dept Date"
                      />
                      {searchDeptDate && (
                        <button onClick={() => setSearchDeptDate("")} className="text-gray-400 hover:text-red-500 font-bold ml-1">
                          &times;
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Keyword text search */}
                  <div className="relative w-full md:w-64">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <Search className="h-4 w-4 text-gray-400" />
                    </span>
                    <input
                      type="text"
                      placeholder="Search by Keyword..."
                      value={searchKeyword}
                      onChange={(e) => setSearchKeyword(e.target.value)}
                      className="w-full pl-9 pr-4 py-1.5 bg-gray-50 text-xs border border-gray-200 rounded-lg outline-none focus:bg-white focus:border-[#00a29c] transition-all text-gray-800"
                    />
                  </div>
                </div>

              </div>

              {/* Flight Catalog table/cards grouped by Airline & Sector matching Image 1 */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* Main flight schedules column */}
                <div className="lg:col-span-8 space-y-6">
                  
                  {loadingTickets ? (
                    <div className="py-20 bg-white border border-gray-200 rounded-xl">
                      <LoadingSpinner />
                    </div>
                  ) : filteredTickets.length === 0 ? (
                    <div className="py-16 text-center text-gray-500 bg-white border border-dashed border-gray-300 rounded-xl p-8">
                      <Plane className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <p className="font-semibold text-gray-700">No active B2B flight schedules found.</p>
                      <p className="text-xs text-gray-400 mt-1">Try resetting your search query or choosing "All Types" filter.</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      
                      {/* Loop over grouped sectors */}
                      {Object.keys(groupedFlights).map((groupKey) => {
                        const [airline, sector] = groupKey.split("__");
                        const flights = groupedFlights[groupKey];
                        
                        return (
                          <div key={groupKey} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-xs">
                            
                            {/* Group Header matching Image 1 (Pink/Red typography centering the airline + sector) */}
                            <div className="bg-gray-50 border-b border-gray-100 py-3.5 px-4 text-center">
                              <h4 className="text-base font-black tracking-wider text-[#EA580C] uppercase flex items-center justify-center gap-2">
                                <span className="bg-[#EA580C]/10 text-[#EA580C] text-[10px] px-2 py-0.5 rounded font-mono">AIRLINE</span>
                                {airline} &bull; {sector}
                              </h4>
                            </div>

                            {/* Group Table matching Image 1 */}
                            <div className="overflow-x-auto">
                              <table className="min-w-full divide-y divide-gray-200">
                                <thead>
                                  {/* Table Header matching the Navy blue bar of Image 1 */}
                                  <tr className="bg-[#133F5C] text-white">
                                    <th className="px-4 py-2.5 text-left text-xs font-bold uppercase tracking-wider">Date</th>
                                    <th className="px-4 py-2.5 text-left text-xs font-bold uppercase tracking-wider">Flight#</th>
                                    <th className="px-4 py-2.5 text-left text-xs font-bold uppercase tracking-wider">Origin-Destination</th>
                                    <th className="px-4 py-2.5 text-left text-xs font-bold uppercase tracking-wider">Time</th>
                                    <th className="px-4 py-2.5 text-left text-xs font-bold uppercase tracking-wider">Baggage</th>
                                    <th className="px-4 py-2.5 text-left text-xs font-bold uppercase tracking-wider">Meal</th>
                                    <th className="px-4 py-2.5 text-[#ff7300] text-left text-xs font-bold uppercase tracking-wider">Price</th>
                                    <th className="px-4 py-2.5 text-right text-xs font-bold uppercase tracking-wider">Action</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 bg-[#F0F9FF]/20">
                                  {flights.map((f, idx) => {
                                    const isNoSeats = f.availableSeats <= 0;
                                    const isSelected = selectedTicket?.id === f.id;
                                    
                                    // Generate a mock flight time matching Image 1 "00:35-02:50"
                                    const timeSlots = ["00:35-02:50", "06:00-08:15", "11:40-13:40", "21:10-23:25"];
                                    const mockTime = timeSlots[idx % timeSlots.length];

                                    return (
                                      <tr
                                        key={f.id}
                                        className={`hover:bg-cyan-50/40 transition-colors ${
                                          isSelected ? "bg-cyan-50/60 font-bold" : ""
                                        }`}
                                      >
                                        <td className="px-4 py-3 whitespace-nowrap text-xs font-bold text-[#133F5C]">
                                          {f.departureDate}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-xs font-mono font-extrabold text-gray-700">
                                          {f.pnrPrefix} {100 + (idx * 17)}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-xs font-bold text-gray-800">
                                          {f.origin}-{f.destination}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-600 font-mono">
                                          {mockTime}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-600">
                                          20+10 KG
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500 font-semibold">
                                          No
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-xs font-black text-[#133F5C]">
                                          PKR {f.price.toLocaleString()}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-right text-xs">
                                          <button
                                            id={`select-seat-btn-${f.id}`}
                                            disabled={isNoSeats}
                                            onClick={() => {
                                              setSelectedTicket(f);
                                              setBookingStatus(null);
                                            }}
                                            className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                                              isSelected
                                                ? "bg-green-600 text-white"
                                                : isNoSeats
                                                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                                : "bg-[#ff7300] hover:bg-[#e05e00] text-white shadow-xs"
                                            }`}
                                          >
                                            {isSelected ? "Selected" : "Book now"}
                                          </button>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>

                          </div>
                        );
                      })}

                    </div>
                  )}

                </div>

                {/* Interactive Booking dossier builder sidebar */}
                <div className="lg:col-span-4 sticky top-6">
                  <Card id="booking-flow-card" className="border border-gray-200 shadow-sm p-5 space-y-4 bg-white">
                    <h3 className="text-sm font-black text-[#133F5C] pb-2 border-b border-gray-100 flex items-center gap-2">
                      <FileText className="h-4.5 w-4.5 text-[#ff7300]" />
                      B2B Interactive Dossier
                    </h3>

                    {bookingStatus && (
                      <Alert
                        id="booking-status-alert"
                        type={bookingStatus.type}
                        message={bookingStatus.text}
                        onClose={() => setBookingStatus(null)}
                      />
                    )}

                    {!selectedTicket ? (
                      <div className="py-12 text-center text-gray-400 space-y-2">
                        <Plane className="h-10 w-10 text-gray-300 mx-auto transform -rotate-45" />
                        <p className="text-xs font-bold text-gray-600">No flight selected</p>
                        <p className="text-[10px] leading-relaxed">
                          Choose any available flight schedule on the left table by clicking the orange "Book now" button.
                        </p>
                      </div>
                    ) : (
                      <form onSubmit={handleCreateBooking} className="space-y-4">
                        {/* Chosen Flight Card details */}
                        <div className="bg-[#F0F9FF] border border-cyan-100 rounded-xl p-4 relative">
                          <button
                            id="deselect-ticket-btn"
                            type="button"
                            onClick={() => setSelectedTicket(null)}
                            className="absolute top-2.5 right-2.5 text-gray-400 hover:text-gray-600 cursor-pointer text-sm font-bold"
                          >
                            &times;
                          </button>
                          <span className="bg-[#ff7300] text-white text-[9px] font-bold px-1.5 py-0.5 rounded tracking-wide uppercase">
                            Selected
                          </span>
                          <p className="text-sm font-black text-[#133F5C] mt-2">
                            {selectedTicket.origin} &rarr; {selectedTicket.destination}
                          </p>
                          <div className="text-xs text-gray-500 mt-1 space-y-0.5">
                            <p className="font-semibold">Airline: {selectedTicket.airline}</p>
                            <p>PNR Prefix: <span className="font-mono font-bold text-gray-700">{selectedTicket.pnrPrefix}</span></p>
                            <p className="font-bold text-[#ff7300] text-sm mt-1">Price: PKR {selectedTicket.price.toLocaleString()}</p>
                          </div>
                        </div>

                        <Input
                          id="passenger-name-input"
                          label="Passenger Full Name"
                          placeholder="e.g. Jane Smith"
                          value={passengerName}
                          onChange={(e) => setPassengerName(e.target.value)}
                          required
                          disabled={bookingLoading}
                        />

                        <Input
                          id="passenger-passport-input"
                          label="Passport / National Document ID"
                          placeholder="e.g. PPT87654321"
                          value={passengerPassport}
                          onChange={(e) => setPassengerPassport(e.target.value)}
                          required
                          disabled={bookingLoading}
                        />

                        {/* Passenger Photo Base64 upload */}
                        <div className="flex flex-col gap-1">
                          <span className="text-xs font-bold text-[#133F5C]">Passenger Photo File</span>
                          <div className="relative border border-dashed border-gray-300 rounded-lg p-3 hover:bg-gray-50 transition-colors flex flex-col items-center justify-center cursor-pointer min-h-[90px]">
                            <input
                              id="passenger-photo-file-input"
                              type="file"
                              accept="image/*"
                              onChange={handlePassengerPhotoChange}
                              disabled={bookingLoading}
                              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                            />
                            {passengerPhoto ? (
                              <div className="text-center">
                                <CheckCircle2 className="h-5 w-5 text-green-600 mx-auto mb-1" />
                                <p className="text-[10px] font-bold text-green-700 truncate max-w-[200px]">
                                  {passengerPhotoName}
                                </p>
                              </div>
                            ) : (
                              <div className="text-center text-gray-400">
                                <Upload className="h-4.5 w-4.5 mx-auto mb-1" />
                                <p className="text-[10px]">Select passenger photo</p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Passport Scan Base64 upload */}
                        <div className="flex flex-col gap-1">
                          <span className="text-xs font-bold text-[#133F5C]">Passport Verification Scan</span>
                          <div className="relative border border-dashed border-gray-300 rounded-lg p-3 hover:bg-gray-50 transition-colors flex flex-col items-center justify-center cursor-pointer min-h-[90px]">
                            <input
                              id="passport-photo-file-input"
                              type="file"
                              accept="image/*"
                              onChange={handlePassportPhotoChange}
                              disabled={bookingLoading}
                              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                            />
                            {passportPhoto ? (
                              <div className="text-center">
                                <CheckCircle2 className="h-5 w-5 text-green-600 mx-auto mb-1" />
                                <p className="text-[10px] font-bold text-green-700 truncate max-w-[200px]">
                                  {passportPhotoName}
                                </p>
                              </div>
                            ) : (
                              <div className="text-center text-gray-400">
                                <Upload className="h-4.5 w-4.5 mx-auto mb-1" />
                                <p className="text-[10px]">Select passport scan file</p>
                              </div>
                            )}
                          </div>
                        </div>

                        <button
                          id="submit-booking-btn"
                          type="submit"
                          disabled={bookingLoading || !passengerName || !passengerPassport}
                          className="w-full bg-[#ff7300] hover:bg-[#e05e00] disabled:bg-gray-200 text-white font-bold py-2.5 rounded-lg text-xs transition-all duration-150 flex items-center justify-center gap-2"
                        >
                          {bookingLoading ? (
                            <LoadingSpinner size="sm" />
                          ) : (
                            <span>Place B2B Booking Order</span>
                          )}
                        </button>
                      </form>
                    )}
                  </Card>
                </div>

              </div>

            </div>
          )}

          {/* 3. BOOKINGS TAB VIEW */}
          {activeTab === "bookings" && (
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-xs space-y-4 animate-fadeIn">
              <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                <div>
                  <h3 className="text-base font-black text-[#133F5C]">My Registered Bookings ({myBookings.length})</h3>
                  <p className="text-xs text-gray-500">View status, verification documents, and active mobile synchronization state</p>
                </div>
              </div>

              {loadingBookings ? (
                <div className="py-12"><LoadingSpinner /></div>
              ) : myBookings.length === 0 ? (
                <div className="py-12 text-center text-gray-400">
                  No bookings completed yet. Select a flight listing under "Book Tickets" to reserve seats.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr className="bg-gray-50 text-gray-500">
                        <th className="px-4 py-3 text-left text-xs font-bold uppercase">Dossier ID</th>
                        <th className="px-4 py-3 text-left text-xs font-bold uppercase">Flight / Sector ID</th>
                        <th className="px-4 py-3 text-left text-xs font-bold uppercase">Passenger Details</th>
                        <th className="px-4 py-3 text-left text-xs font-bold uppercase">Required Documents</th>
                        <th className="px-4 py-3 text-left text-xs font-bold uppercase">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white text-xs">
                      {myBookings.map((b) => {
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
                              <div className="font-bold text-gray-800">{b.passengerName}</div>
                              <div className="text-[10px] text-gray-500 font-mono">PPT: {b.passengerPassport}</div>
                            </td>
                            <td className="px-4 py-3 space-x-2">
                              {b.passengerPhotoUrl ? (
                                <button
                                  id={`photo-preview-${b.bookingId}`}
                                  onClick={() =>
                                    setPhotoModal({
                                      isOpen: true,
                                      title: `Passenger Profile Image: ${b.passengerName}`,
                                      imgUrl: b.passengerPhotoUrl,
                                    })
                                  }
                                  className="text-xs text-[#00a29c] font-bold bg-cyan-50 hover:bg-cyan-100 px-2.5 py-1 rounded cursor-pointer"
                                >
                                  Photo
                                </button>
                              ) : (
                                <span className="text-gray-400">No Photo</span>
                              )}
                              {b.passportPhotoUrl ? (
                                <button
                                  id={`passport-preview-${b.bookingId}`}
                                  onClick={() =>
                                    setPhotoModal({
                                      isOpen: true,
                                      title: `Passport Scan Image: ${b.passengerName}`,
                                      imgUrl: b.passportPhotoUrl,
                                    })
                                  }
                                  className="text-xs text-blue-600 font-bold bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded cursor-pointer"
                                >
                                  Passport
                                </button>
                              ) : (
                                <span className="text-gray-400">No Passport</span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <Badge status={b.status} />
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

          {/* 4. MY LEDGER TAB VIEW */}
          {activeTab === "ledger" && (
            <div className="space-y-6 animate-fadeIn">
              
              {/* Financial Balance Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                <Card className="border-l-4 border-l-[#00a29c]">
                  <span className="text-[10px] font-black text-gray-400 uppercase">Available Credit Limit</span>
                  <p className="text-2xl font-black text-[#133F5C] mt-1">PKR {currentBalance.toLocaleString()}</p>
                  <p className="text-[10px] text-gray-500 mt-2">Deducted automatically upon flight reservation</p>
                </Card>

                <Card className="border-l-4 border-l-[#ff7300]">
                  <span className="text-[10px] font-black text-gray-400 uppercase">Total Deposits / Credits</span>
                  <p className="text-2xl font-black text-[#133F5C] mt-1">PKR {(ledgers.length === 0 ? 500000 : totalCredits).toLocaleString()}</p>
                  <p className="text-[10px] text-gray-500 mt-2">Approved bank deposits in Pakistan accounts</p>
                </Card>

                <Card className="border-l-4 border-l-blue-600">
                  <span className="text-[10px] font-black text-gray-400 uppercase">Total spent on tickets</span>
                  <p className="text-2xl font-black text-[#133F5C] mt-1 font-mono">PKR {totalDebits.toLocaleString()}</p>
                  <p className="text-[10px] text-gray-500 mt-2">Accumulated flight purchases</p>
                </Card>

              </div>

              {/* Transactions list */}
              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-xs">
                <h3 className="text-sm font-black text-[#133F5C] pb-4 border-b border-gray-100 mb-4">
                  B2B Account Ledger Statement
                </h3>

                {loadingLedgers ? (
                  <div className="py-12"><LoadingSpinner /></div>
                ) : ledgers.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-xs font-bold text-[#133F5C]">No transaction statement currently generated.</p>
                    <p className="text-[11px] text-gray-500 mt-1">
                      You are operating on a trial credit balance of <strong>PKR 500,000</strong>. New flight purchases will appear here in real-time.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 text-xs">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="px-4 py-3 text-left font-bold text-gray-500">Transaction Date</th>
                          <th className="px-4 py-3 text-left font-bold text-gray-500">Particulars / Description</th>
                          <th className="px-4 py-3 text-left font-bold text-gray-500">Entry Type</th>
                          <th className="px-4 py-3 text-right font-bold text-gray-500">Amount (PKR)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 bg-white">
                        {ledgers.map((l) => (
                          <tr key={l.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-gray-500 font-mono">
                              {l.timestamp ? new Date(l.timestamp.seconds * 1000).toLocaleString() : "Syncing..."}
                            </td>
                            <td className="px-4 py-3 text-gray-800 font-medium">
                              {l.description}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
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
          )}

          {/* 5. NOTIFICATIONS TAB VIEW */}
          {activeTab === "notifications" && (
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-xs space-y-4 animate-fadeIn">
              <div className="pb-4 border-b border-gray-100">
                <h3 className="text-base font-black text-[#133F5C] flex items-center gap-2">
                  <Bell className="h-5 w-5 text-[#ff7300]" />
                  Global Broadcast Announcements
                </h3>
                <p className="text-xs text-gray-500">Real-time alerts, operational adjustments, and flight scheduling notifications</p>
              </div>

              {notifications.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                  <Bell className="h-10 w-10 mx-auto mb-3 text-gray-300" />
                  No system announcements currently broadcasted.
                </div>
              ) : (
                <div className="space-y-4 max-w-3xl">
                  {notifications.map((n) => (
                    <div key={n.id} className="p-4 rounded-xl border border-gray-100 bg-gray-50 hover:bg-gray-100/50 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                          n.type === "alert" ? "bg-red-100 text-red-800" : n.type === "promo" ? "bg-yellow-100 text-yellow-800" : "bg-blue-100 text-blue-800"
                        }`}>
                          {n.type}
                        </span>
                        <span className="text-[10px] text-gray-400 font-mono">
                          {n.timestamp ? new Date(n.timestamp.seconds * 1000).toLocaleDateString() : "Live"}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-[#133F5C]">{n.title}</h4>
                      <p className="text-[11px] text-gray-600 mt-1 leading-relaxed whitespace-pre-line">{n.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 6. BANKS DETAIL TAB VIEW */}
          {activeTab === "banks" && (
            <div className="space-y-6 animate-fadeIn">
              
              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-xs">
                <div className="pb-4 border-b border-gray-100 mb-6">
                  <h3 className="text-base font-black text-[#133F5C] flex items-center gap-2">
                    <Landmark className="h-5 w-5 text-[#ff7300]" />
                    Banks Detail For Ticketing
                  </h3>
                  <p className="text-xs text-gray-500">
                    Deposit payments into Pakistan accounts below to top-up your available ledger balance limit.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  {/* Bank Account 1 */}
                  <div className="border border-gray-200 rounded-xl p-5 bg-gray-50 space-y-3">
                    <div className="flex items-center gap-2.5 pb-2.5 border-b border-gray-200">
                      <div className="p-2 bg-[#133F5C] text-white rounded-lg text-xs font-bold">MBL</div>
                      <div>
                        <h4 className="text-xs font-bold text-[#133F5C]">Meezan Bank Limited</h4>
                        <p className="text-[10px] text-gray-400 font-mono">Islamic Banking</p>
                      </div>
                    </div>
                    <div className="text-xs space-y-1.5 text-gray-600">
                      <p><strong>Account Name:</strong> Skypass Travel & Tours</p>
                      <p><strong>Account Number:</strong> 0513-010543210</p>
                      <p><strong>Branch:</strong> Blue Area Branch, Islamabad</p>
                      <p><strong>IBAN:</strong> PK87MEZN0513010543210</p>
                    </div>
                  </div>

                  {/* Bank Account 2 */}
                  <div className="border border-gray-200 rounded-xl p-5 bg-gray-50 space-y-3">
                    <div className="flex items-center gap-2.5 pb-2.5 border-b border-gray-200">
                      <div className="p-2 bg-orange-600 text-white rounded-lg text-xs font-bold">ABL</div>
                      <div>
                        <h4 className="text-xs font-bold text-[#133F5C]">Allied Bank Limited</h4>
                        <p className="text-[10px] text-gray-400 font-mono">Commercial Banking</p>
                      </div>
                    </div>
                    <div className="text-xs space-y-1.5 text-gray-600">
                      <p><strong>Account Name:</strong> Skypass Travel & Tours</p>
                      <p><strong>Account Number:</strong> 0010-065432102</p>
                      <p><strong>Branch:</strong> F-10 Markaz, Islamabad</p>
                      <p><strong>IBAN:</strong> PK54ALHL0010065432102</p>
                    </div>
                  </div>

                  {/* Bank Account 3 */}
                  <div className="border border-gray-200 rounded-xl p-5 bg-gray-50 space-y-3">
                    <div className="flex items-center gap-2.5 pb-2.5 border-b border-gray-200">
                      <div className="p-2 bg-green-700 text-white rounded-lg text-xs font-bold">HBL</div>
                      <div>
                        <h4 className="text-xs font-bold text-[#133F5C]">Habib Bank Limited</h4>
                        <p className="text-[10px] text-gray-400 font-mono">Retail Banking</p>
                      </div>
                    </div>
                    <div className="text-xs space-y-1.5 text-gray-600">
                      <p><strong>Account Name:</strong> Skypass Travel & Tours</p>
                      <p><strong>Account Number:</strong> 2201-987654321</p>
                      <p><strong>Branch:</strong> Jinnah Avenue Branch, Islamabad</p>
                      <p><strong>IBAN:</strong> PK92HABB2201987654321</p>
                    </div>
                  </div>

                </div>

                {/* Instructions Section */}
                <div className="mt-8 pt-6 border-t border-gray-100 flex gap-4 bg-orange-50/50 p-4 rounded-xl border border-orange-100/50">
                  <HelpCircle className="h-5 w-5 text-[#ff7300] shrink-0 mt-0.5" />
                  <div className="text-xs text-gray-600 space-y-2">
                    <p className="font-bold text-[#133F5C] text-sm">How to Request a Balance Limit Top-up:</p>
                    <p>1. Send the cash or bank deposit payment amount to any of the verified corporate bank accounts listed above.</p>
                    <p>2. Keep a digital copy or picture of the deposit receipt/slip.</p>
                    <p>3. WhatsApp or Email the deposit slip along with your agency email address (<strong>{agentEmail}</strong>) directly to the System Admin.</p>
                    <p>4. The admin will verify the deposit and instantly credit your ledger statement, which will sync immediately across this Web client and your Android application.</p>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* 7. UMRAH PACKAGES TAB VIEW (IMAGE 3) */}
          {activeTab === "umrah" && (
            <div className="space-y-6 animate-fadeIn">
              
              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-xs">
                <div className="pb-4 border-b border-gray-100 mb-6">
                  <h3 className="text-base font-black text-[#133F5C] flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-[#ff7300]" />
                    Umrah Group Packages Catalog
                  </h3>
                  <p className="text-xs text-gray-500">
                    Live available premium Umrah tours. Standardized inclusions, direct airline bookings, and robust hotel sync.
                  </p>
                </div>

                <div className="space-y-6 max-w-4xl">
                  {umrahPackages.map((pkg) => (
                    <div
                      key={pkg.id}
                      className="border-2 border-cyan-100/60 bg-white rounded-2xl p-5 shadow-xs hover:border-[#00a29c] transition-all flex flex-col md:flex-row justify-between gap-6"
                    >
                      {/* Left: Brand logo & Airline */}
                      <div className="flex flex-col justify-between space-y-4 md:w-1/4 shrink-0">
                        <div className="space-y-1.5">
                          <div className="h-10 w-28 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-center p-2 text-xs font-black tracking-wider text-[#00a29c]">
                            SAUDIA / JINNAH
                          </div>
                          <p className="text-xs font-black text-[#133F5C] leading-none">{pkg.airline}</p>
                          <span className="inline-block bg-cyan-50 text-[#00a29c] text-[10px] font-bold px-2 py-0.5 rounded-full">
                            {pkg.days} Package
                          </span>
                        </div>
                      </div>

                      {/* Center: Flight timelines */}
                      <div className="flex-1 space-y-4">
                        <div className="grid grid-cols-1 gap-3 text-xs">
                          {/* Departure Details */}
                          <div className="flex items-start gap-2.5">
                            <span className="bg-[#133F5C]/10 text-[#133F5C] text-[10px] font-bold px-2 py-0.5 rounded font-mono shrink-0">DEP</span>
                            <div className="space-y-0.5">
                              <p className="font-bold text-gray-800">{pkg.depDetails}</p>
                              <p className="text-[10px] text-gray-400 font-mono">Flight No: {pkg.flightNoDep}</p>
                            </div>
                          </div>

                          {/* Return Details */}
                          <div className="flex items-start gap-2.5">
                            <span className="bg-[#ff7300]/10 text-[#ff7300] text-[10px] font-bold px-2 py-0.5 rounded font-mono shrink-0">RET</span>
                            <div className="space-y-0.5">
                              <p className="font-bold text-gray-800">{pkg.retDetails}</p>
                              <p className="text-[10px] text-gray-400 font-mono">Flight No: {pkg.flightNoRet}</p>
                            </div>
                          </div>
                        </div>

                        {/* Baggage rules */}
                        <div className="text-[11px] text-[#ff7300] font-bold bg-orange-50/40 p-2.5 rounded-xl border border-orange-100/50 flex items-center gap-2">
                          <Briefcase className="h-3.5 w-3.5" />
                          <span>Baggage Policy: {pkg.baggage}</span>
                        </div>
                      </div>

                      {/* Right: Price and Action */}
                      <div className="md:w-1/4 shrink-0 border-l border-gray-100 pl-0 md:pl-6 flex flex-col justify-between items-end">
                        <div className="text-right">
                          <span className="text-[10px] text-gray-400 font-bold block">Package Price</span>
                          <span className="text-xl font-black text-[#ff7300]">PKR {pkg.price.toLocaleString()}</span>
                          <span className="text-[10px] text-gray-500 block">Per Person</span>
                        </div>

                        <button
                          onClick={() => {
                            // Find corresponding flight if existing, or load interactive dossier
                            setActiveTab("book_tickets");
                            // Select any ticket or notify agent
                            setBookingStatus({
                              type: "info",
                              text: `Choose an active ticket slot under "Book Tickets" to complete the Umrah boarding list for ${pkg.airline}.`,
                            });
                          }}
                          className="bg-[#ff7300] hover:bg-[#e05e00] text-white font-black text-xs py-2 px-5 rounded-lg w-full md:w-auto transition-all cursor-pointer"
                        >
                          Show Details
                        </button>
                      </div>

                    </div>
                  ))}
                </div>

              </div>

            </div>
          )}

        </div>
      </main>

      {/* DOCUMENT VIEW PREVIEW MODAL */}
      {photoModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative bg-white rounded-xl max-w-lg w-full p-6 border border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-sm font-black text-[#133F5C]">{photoModal.title}</h4>
              <button
                id="close-preview-modal-btn"
                onClick={() => setPhotoModal({ isOpen: false, title: "", imgUrl: "" })}
                className="text-gray-400 hover:text-gray-600 cursor-pointer text-lg font-bold"
              >
                &times;
              </button>
            </div>
            <div className="flex justify-center bg-gray-50 border border-gray-100 rounded p-2">
              <img
                src={photoModal.imgUrl}
                alt="Document verification"
                className="max-h-96 max-w-full object-contain rounded-lg"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="mt-4 flex justify-end">
              <Button
                id="modal-close-btn-agent"
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
