import React, { useState, useEffect } from "react";
import logo from "../assets/images/logo.png";
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
import { Ticket, Booking, LedgerTransaction, SystemNotification, UmrahPackage, UmrahBooking, HotelListing, HotelBooking } from "../types";
import { Button, Input, Card, Badge, LoadingSpinner, Alert, Skeleton, TableSkeleton, CardSkeleton } from "./UIComponents";
import { TicketInvoiceModal } from "./TicketInvoiceModal";
import { HotelVoucherModal } from "./HotelVoucherModal";
import { UmrahPackageInvoiceModal } from "./UmrahPackageInvoiceModal";
import { AddUserBalanceModal } from "./AddUserBalanceModal";
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
  Building,
  Sparkles,
  Hotel,
  BedDouble,
  MapPin,
  Star
} from "lucide-react";

const sendApprovalNotification = async (
  subject: string,
  details: Record<string, any>,
  agentEmail: string
) => {
  try {
    const payload = {
      _subject: `🎟️ Ticket Broker: ${subject}`,
      _template: "table",
      _cc: agentEmail,
      _next: "https://ticketbroker.vercel.app/",
      "Website": "https://ticketbroker.vercel.app/",
      ...details,
    };
    await fetch("https://formsubmit.co/ajax/teemabdulrehman.com@gmail.com", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify(payload)
    });
  } catch (err) {
    console.error("Failed to send approval email notification:", err);
  }
};

export default function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  // Navigation: 'inventory' | 'bookings' | 'ledger' | 'notifications' | 'umrah_inventory' | 'umrah_bookings' | 'hotel_inventory' | 'hotel_bookings'
  const [activeTab, setActiveTab] = useState<string>("inventory");
  
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [ledgers, setLedgers] = useState<LedgerTransaction[]>([]);
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [loadingLedgers, setLoadingLedgers] = useState(true);

  // Umrah Packages and Bookings state
  const [umrahPackages, setUmrahPackages] = useState<UmrahPackage[]>([]);
  const [umrahBookings, setUmrahBookings] = useState<UmrahBooking[]>([]);
  const [loadingUmrahPackages, setLoadingUmrahPackages] = useState(true);
  const [loadingUmrahBookings, setLoadingUmrahBookings] = useState(true);

  // Hotel Listings and Bookings state
  const [hotels, setHotels] = useState<HotelListing[]>([]);
  const [hotelBookings, setHotelBookings] = useState<HotelBooking[]>([]);
  const [loadingHotels, setLoadingHotels] = useState(true);
  const [loadingHotelBookings, setLoadingHotelBookings] = useState(true);

  // Form State for Adding / Editing Hotels
  const [isEditingHotel, setIsEditingHotel] = useState(false);
  const [editHotelId, setEditHotelId] = useState<string | null>(null);
  const [hotelName, setHotelName] = useState("");
  const [hotelCity, setHotelCity] = useState("Makkah");
  const [hotelStars, setHotelStars] = useState("5");
  const [hotelDistance, setHotelDistance] = useState("");
  const [hotelRoomTypes, setHotelRoomTypes] = useState("Quad / Triple / Double Sharing");
  const [hotelPricePerNight, setHotelPricePerNight] = useState("");
  const [hotelTotalRooms, setHotelTotalRooms] = useState("");
  const [hotelAvailableRooms, setHotelAvailableRooms] = useState("");
  const [hotelAmenities, setHotelAmenities] = useState("Free WiFi, Air Conditioning, Haram Shuttle Service");
  const [hotelDescription, setHotelDescription] = useState("");
  const [hotelImageUrl, setHotelImageUrl] = useState("");
  const [hotelSubmitting, setHotelSubmitting] = useState(false);
  const [hotelError, setHotelError] = useState("");
  const [hotelSuccess, setHotelSuccess] = useState("");

  // Form State for Adding / Editing Umrah Packages
  const [isEditingUmrah, setIsEditingUmrah] = useState(false);
  const [editUmrahId, setEditUmrahId] = useState<string | null>(null);
  const [umrahDays, setUmrahDays] = useState("");
  const [umrahAirline, setUmrahAirline] = useState("");
  const [umrahFlightNoDep, setUmrahFlightNoDep] = useState("");
  const [umrahFlightNoRet, setUmrahFlightNoRet] = useState("");
  const [umrahDepDetails, setUmrahDepDetails] = useState("");
  const [umrahRetDetails, setUmrahRetDetails] = useState("");
  const [umrahBaggage, setUmrahBaggage] = useState("");
  const [umrahPrice, setUmrahPrice] = useState("");
  const [umrahHotelMakkah, setUmrahHotelMakkah] = useState("");
  const [umrahHotelMadinah, setUmrahHotelMadinah] = useState("");
  const [umrahTotalSeats, setUmrahTotalSeats] = useState("");
  const [umrahAvailableSeats, setUmrahAvailableSeats] = useState("");
  const [umrahSubmitting, setUmrahSubmitting] = useState(false);
  const [umrahError, setUmrahError] = useState("");
  const [umrahSuccess, setUmrahSuccess] = useState("");

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

  // Ticket Invoice modal state
  const [invoiceModal, setInvoiceModal] = useState<{
    isOpen: boolean;
    booking: Booking | null;
    ticket?: Ticket | null;
  }>({ isOpen: false, booking: null, ticket: null });

  // Hotel Voucher modal state
  const [voucherModal, setVoucherModal] = useState<{
    isOpen: boolean;
    booking: HotelBooking | null;
    hotel?: HotelListing | null;
  }>({ isOpen: false, booking: null, hotel: null });

  // Umrah Invoice modal state
  const [umrahInvoiceModal, setUmrahInvoiceModal] = useState<{
    isOpen: boolean;
    booking: UmrahBooking | null;
    pkg?: UmrahPackage | null;
  }>({ isOpen: false, booking: null, pkg: null });

  // Add User Balance Modal state
  const [isAddBalanceModalOpen, setIsAddBalanceModalOpen] = useState(false);

  // Compute list of unique agents with net balances from Firestore collections
  const uniqueAgents = React.useMemo(() => {
    const map = new Map<string, { email: string; name: string; balance: number }>();

    const defaultAgents = [
      { email: "agent.partner@gmail.com", name: "Al-Harmain Travel Agency" },
      { email: "makkah.travels@gmail.com", name: "Makkah Tours & Travels" },
      { email: "subhan.travels@gmail.com", name: "Subhan Air Services" },
    ];

    defaultAgents.forEach((a) => {
      map.set(a.email.toLowerCase(), { email: a.email.toLowerCase(), name: a.name, balance: 0 });
    });

    ledgers.forEach((l) => {
      const email = (l.agentEmail || "").toLowerCase();
      if (!email) return;
      const existing = map.get(email) || { email, name: l.agentName || email, balance: 0 };
      if (l.type === "Credit") {
        existing.balance += Number(l.amount) || 0;
      } else {
        existing.balance -= Number(l.amount) || 0;
      }
      if (l.agentName && !existing.name) existing.name = l.agentName;
      map.set(email, existing);
    });

    bookings.forEach((b) => {
      const email = (b.agentEmail || "").toLowerCase();
      if (email && !map.has(email)) {
        map.set(email, { email, name: b.agentName || email, balance: 0 });
      }
    });

    umrahBookings.forEach((b) => {
      const email = (b.agentEmail || "").toLowerCase();
      if (email && !map.has(email)) {
        map.set(email, { email, name: b.agentName || email, balance: 0 });
      }
    });

    hotelBookings.forEach((b) => {
      const email = (b.agentEmail || "").toLowerCase();
      if (email && !map.has(email)) {
        map.set(email, { email, name: b.agentName || email, balance: 0 });
      }
    });

    return Array.from(map.values());
  }, [ledgers, bookings, umrahBookings, hotelBookings]);

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

  // 5. Listen to Umrah packages real-time
  useEffect(() => {
    const q = query(collection(db, "umrah_packages"));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (snapshot.empty) {
          // Auto seed default Umrah packages if Firestore is empty
          addDoc(collection(db, "umrah_packages"), {
            days: "15 Days Executive Umrah Package",
            airline: "PIA (Pakistan International Airlines)",
            flightNoDep: "PK-739",
            flightNoRet: "PK-740",
            depDetails: "LHE 08:30 -> JED 12:15",
            retDetails: "MED 15:45 -> LHE 22:30",
            baggage: "2 Pieces (23kg) + 7kg Hand",
            price: 245000,
            hotelMakkah: "Swissôtel Makkah (5 Star)",
            hotelMadinah: "Pullman Zamzam Madinah (5 Star)",
            totalSeats: 30,
            availableSeats: 22,
            timestamp: new Date(),
          }).catch(console.error);

          addDoc(collection(db, "umrah_packages"), {
            days: "21 Days Economy Sharing Package",
            airline: "Airblue",
            flightNoDep: "PA-270",
            flightNoRet: "PA-271",
            depDetails: "KHI 14:00 -> JED 17:30",
            retDetails: "JED 20:00 -> KHI 02:15",
            baggage: "30kg Check-in + 7kg Carry-on",
            price: 195000,
            hotelMakkah: "Anjum Hotel Makkah (5 Star)",
            hotelMadinah: "Grand Plaza Madinah (4 Star)",
            totalSeats: 40,
            availableSeats: 35,
            timestamp: new Date(),
          }).catch(console.error);
        }

        const pkgsList: UmrahPackage[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          pkgsList.push({
            id: docSnap.id,
            days: data.days || "",
            airline: data.airline || "",
            flightNoDep: data.flightNoDep || "",
            flightNoRet: data.flightNoRet || "",
            depDetails: data.depDetails || "",
            retDetails: data.retDetails || "",
            baggage: data.baggage || "",
            price: Number(data.price) || 0,
            hotelMakkah: data.hotelMakkah || "",
            hotelMadinah: data.hotelMadinah || "",
            totalSeats: Number(data.totalSeats) || 0,
            availableSeats: data.availableSeats !== undefined ? Number(data.availableSeats) : (Number(data.totalSeats) || 0),
          });
        });
        setUmrahPackages(pkgsList);
        setLoadingUmrahPackages(false);
      },
      (error) => {
        console.error("Error listening to Umrah packages:", error);
      }
    );
    return () => unsubscribe();
  }, []);

  // 6. Listen to Umrah bookings real-time
  useEffect(() => {
    const q = query(collection(db, "umrah_bookings"));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const bookingsList: UmrahBooking[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          bookingsList.push({
            bookingId: docSnap.id,
            packageId: data.packageId || "",
            agentName: data.agentName || "",
            agentEmail: data.agentEmail || "",
            passengerName: data.passengerName || "",
            passengerPassport: data.passengerPassport || "",
            passengerPhotoUrl: data.passengerPhotoUrl || "",
            passportPhotoUrl: data.passportPhotoUrl || "",
            status: data.status || "Pending",
            timestamp: data.timestamp,
          });
        });
        setUmrahBookings(bookingsList);
        setLoadingUmrahBookings(false);
      },
      (error) => {
        console.error("Error listening to Umrah bookings:", error);
        setLoadingUmrahBookings(false);
      }
    );
    return () => unsubscribe();
  }, []);

  // 7. Listen to Hotel Listings real-time
  useEffect(() => {
    const q = query(collection(db, "hotels"));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (snapshot.empty) {
          // Auto seed sample hotels if Firestore collection is empty
          addDoc(collection(db, "hotels"), {
            name: "Swissôtel Makkah",
            city: "Makkah",
            stars: 5,
            distanceToHaram: "100 meters from King Abdulaziz Gate",
            roomTypes: "Quad / Triple / Double Sharing",
            pricePerNight: 28000,
            totalRooms: 25,
            availableRooms: 20,
            amenities: "Free WiFi, Breakfast Buffet, Haram Shuttle Service, Air Conditioning",
            description: "Luxury 5-star hotel facing the Holy Kaaba.",
            imageUrl: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80",
            timestamp: new Date(),
          }).catch(console.error);

          addDoc(collection(db, "hotels"), {
            name: "Pullman Zamzam Madinah",
            city: "Madinah",
            stars: 5,
            distanceToHaram: "150 meters from Al-Masjid an-Nabawi",
            roomTypes: "Quad / Triple / Double Sharing",
            pricePerNight: 24000,
            totalRooms: 20,
            availableRooms: 18,
            amenities: "Free WiFi, Restaurant, Room Service, Air Conditioning",
            description: "Elegant hotel located steps away from Al-Masjid an-Nabawi.",
            imageUrl: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80",
            timestamp: new Date(),
          }).catch(console.error);
        }

        const hotelList: HotelListing[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          hotelList.push({
            id: docSnap.id,
            name: data.name || "",
            city: data.city || "Makkah",
            stars: Number(data.stars) || 5,
            distanceToHaram: data.distanceToHaram || "",
            roomTypes: data.roomTypes || "Sharing",
            pricePerNight: Number(data.pricePerNight) || 0,
            totalRooms: Number(data.totalRooms) || 0,
            availableRooms: data.availableRooms !== undefined ? Number(data.availableRooms) : (Number(data.totalRooms) || 0),
            imageUrl: data.imageUrl || "",
            amenities: data.amenities || "",
            description: data.description || "",
          });
        });
        setHotels(hotelList);
        setLoadingHotels(false);
      },
      (error) => {
        console.error("Error listening to hotels:", error);
        setLoadingHotels(false);
      }
    );
    return () => unsubscribe();
  }, []);

  // 8. Listen to Hotel Bookings real-time
  useEffect(() => {
    const q = query(collection(db, "hotelBookings"), orderBy("timestamp", "desc"));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const bookingsList: HotelBooking[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          bookingsList.push({
            bookingId: docSnap.id,
            hotelId: data.hotelId || "",
            hotelName: data.hotelName || "",
            city: data.city || "",
            agentName: data.agentName || "",
            agentEmail: data.agentEmail || "",
            guestName: data.guestName || "",
            guestPhone: data.guestPhone || data.phone || "",
            passportNo: data.passportNo || data.passportNumber || "",
            checkInDate: data.checkInDate || "",
            checkOutDate: data.checkOutDate || "",
            nights: Number(data.nights) || 1,
            roomType: data.roomType || "",
            numberOfRooms: Number(data.numberOfRooms) || Number(data.roomsCount) || 1,
            totalCost: Number(data.totalCost) || 0,
            status: data.status || "Pending",
            timestamp: data.timestamp || Date.now(),
          });
        });
        setHotelBookings(bookingsList);
        setLoadingHotelBookings(false);
      },
      (error) => {
        console.error("Error listening to hotel bookings:", error);
        setLoadingHotelBookings(false);
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

      if (nextStatus === "Confirmed") {
        const targetBooking = bookings.find(b => b.bookingId === bookingId);
        if (targetBooking && targetBooking.agentEmail) {
          sendApprovalNotification(
            "Flight Ticket Booking Confirmed & Approved",
            {
              "Status": "APPROVED & CONFIRMED",
              "Booking ID": bookingId,
              "Agent Name": targetBooking.agentName,
              "Agent Email": targetBooking.agentEmail,
              "Passenger Name": targetBooking.passengerName,
              "Passenger Passport": targetBooking.passengerPassport,
              "Title": targetBooking.title || "N/A",
              "Gender": targetBooking.gender || "N/A",
              "Nationality": targetBooking.nationality || "N/A",
              "Date of Birth": targetBooking.dob || "N/A",
              "Document Expiry": targetBooking.documentExpiry || "N/A",
              "Frequent Flyer": targetBooking.frequentFlyer || "N/A",
              "Wheelchair": targetBooking.wheelchair || "N/A",
              "Meal": targetBooking.meal || "N/A",
              "Phone": targetBooking.phone || "N/A",
              "Reference": targetBooking.reference || "N/A",
              "Message": "Your B2B flight ticket booking has been successfully approved and confirmed by the administrator."
            },
            targetBooking.agentEmail
          );
        }
      }
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

  // Umrah Packages CRUD Handlers
  const handleCreateOrUpdateUmrahPackage = async (e: React.FormEvent) => {
    e.preventDefault();
    setUmrahError("");
    setUmrahSuccess("");
    setUmrahSubmitting(true);

    if (!umrahDays.trim() || !umrahAirline.trim() || !umrahFlightNoDep.trim() || !umrahFlightNoRet.trim()) {
      setUmrahError("Days, Airline, and Flight numbers are required.");
      setUmrahSubmitting(false);
      return;
    }

    const parsedPrice = Number(umrahPrice);
    const parsedTotalSeats = Number(umrahTotalSeats);
    const parsedAvailableSeats = isEditingUmrah ? Number(umrahAvailableSeats) : parsedTotalSeats;

    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      setUmrahError("Price must be a valid number greater than 0.");
      setUmrahSubmitting(false);
      return;
    }
    if (isNaN(parsedTotalSeats) || !Number.isInteger(parsedTotalSeats) || parsedTotalSeats <= 0) {
      setUmrahError("Total seats must be a valid integer greater than 0.");
      setUmrahSubmitting(false);
      return;
    }

    try {
      const packageData = {
        days: umrahDays.trim(),
        airline: umrahAirline.trim(),
        flightNoDep: umrahFlightNoDep.trim().toUpperCase(),
        flightNoRet: umrahFlightNoRet.trim().toUpperCase(),
        depDetails: umrahDepDetails.trim(),
        retDetails: umrahRetDetails.trim(),
        baggage: umrahBaggage.trim(),
        price: parsedPrice,
        hotelMakkah: umrahHotelMakkah.trim(),
        hotelMadinah: umrahHotelMadinah.trim(),
        totalSeats: parsedTotalSeats,
        availableSeats: parsedAvailableSeats,
      };

      if (isEditingUmrah && editUmrahId) {
        const docRef = doc(db, "umrah_packages", editUmrahId);
        await updateDoc(docRef, packageData);
        setUmrahSuccess("Umrah package successfully updated!");
        resetUmrahForm();
      } else {
        await addDoc(collection(db, "umrah_packages"), packageData);
        setUmrahSuccess("New Umrah package successfully published!");
        resetUmrahForm();
      }
    } catch (err: any) {
      console.error("Umrah package save error:", err);
      setUmrahError(err.message || "Failed to save Umrah package.");
    } finally {
      setUmrahSubmitting(false);
    }
  };

  const handleEditUmrahClick = (pkg: UmrahPackage) => {
    setIsEditingUmrah(true);
    setEditUmrahId(pkg.id);
    setUmrahDays(pkg.days);
    setUmrahAirline(pkg.airline);
    setUmrahFlightNoDep(pkg.flightNoDep);
    setUmrahFlightNoRet(pkg.flightNoRet);
    setUmrahDepDetails(pkg.depDetails);
    setUmrahRetDetails(pkg.retDetails);
    setUmrahBaggage(pkg.baggage);
    setUmrahPrice(String(pkg.price));
    setUmrahHotelMakkah(pkg.hotelMakkah);
    setUmrahHotelMadinah(pkg.hotelMadinah);
    setUmrahTotalSeats(String(pkg.totalSeats));
    setUmrahAvailableSeats(String(pkg.availableSeats));
    setUmrahError("");
    setUmrahSuccess("");
  };

  const handleDeleteUmrahPackage = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this Umrah Group Package permanently?")) {
      return;
    }
    try {
      await deleteDoc(doc(db, "umrah_packages", id));
      alert("Umrah Package successfully removed!");
    } catch (err: any) {
      console.error("Delete Umrah package error:", err);
      alert("Failed to delete package: " + err.message);
    }
  };

  const handleToggleUmrahBookingStatus = async (bookingId: string, currentStatus: string) => {
    try {
      const nextStatus = currentStatus === "Confirmed" ? "Pending" : "Confirmed";
      const docRef = doc(db, "umrah_bookings", bookingId);
      await updateDoc(docRef, {
        status: nextStatus,
      });

      if (nextStatus === "Confirmed") {
        const targetBooking = umrahBookings.find(b => b.bookingId === bookingId);
        if (targetBooking && targetBooking.agentEmail) {
          sendApprovalNotification(
            "Umrah Group Package Booking Confirmed & Approved",
            {
              "Status": "APPROVED & CONFIRMED",
              "Booking ID": bookingId,
              "Agent Name": targetBooking.agentName,
              "Agent Email": targetBooking.agentEmail,
              "Passenger Name": targetBooking.passengerName,
              "Passenger Passport": targetBooking.passengerPassport,
              "Title": targetBooking.title || "N/A",
              "Gender": targetBooking.gender || "N/A",
              "Nationality": targetBooking.nationality || "N/A",
              "Date of Birth": targetBooking.dob || "N/A",
              "Document Expiry": targetBooking.documentExpiry || "N/A",
              "Frequent Flyer": targetBooking.frequentFlyer || "N/A",
              "Wheelchair": targetBooking.wheelchair || "N/A",
              "Meal": targetBooking.meal || "N/A",
              "Phone": targetBooking.phone || "N/A",
              "Reference": targetBooking.reference || "N/A",
              "Message": "Your B2B Umrah Package booking has been successfully approved and confirmed by the administrator."
            },
            targetBooking.agentEmail
          );
        }
      }
    } catch (err: any) {
      console.error("Update status error:", err);
      alert("Failed to update booking status: " + err.message);
    }
  };

  const resetUmrahForm = () => {
    setIsEditingUmrah(false);
    setEditUmrahId(null);
    setUmrahDays("");
    setUmrahAirline("");
    setUmrahFlightNoDep("");
    setUmrahFlightNoRet("");
    setUmrahDepDetails("");
    setUmrahRetDetails("");
    setUmrahBaggage("");
    setUmrahPrice("");
    setUmrahHotelMakkah("");
    setUmrahHotelMadinah("");
    setUmrahTotalSeats("");
    setUmrahAvailableSeats("");
  };

  const handleCreateOrUpdateHotel = async (e: React.FormEvent) => {
    e.preventDefault();
    setHotelError("");
    setHotelSuccess("");
    setHotelSubmitting(true);

    if (!hotelName.trim() || !hotelCity.trim()) {
      setHotelError("Hotel Name and City are required.");
      setHotelSubmitting(false);
      return;
    }

    const price = Number(hotelPricePerNight);
    const rooms = Number(hotelTotalRooms);
    const avail = isEditingHotel ? Number(hotelAvailableRooms) : rooms;

    if (isNaN(price) || price <= 0) {
      setHotelError("Price per night must be a number greater than 0.");
      setHotelSubmitting(false);
      return;
    }

    if (isNaN(rooms) || rooms <= 0) {
      setHotelError("Total rooms must be greater than 0.");
      setHotelSubmitting(false);
      return;
    }

    try {
      if (isEditingHotel && editHotelId) {
        const docRef = doc(db, "hotels", editHotelId);
        await updateDoc(docRef, {
          name: hotelName.trim(),
          city: hotelCity.trim(),
          stars: Number(hotelStars) || 5,
          distanceToHaram: hotelDistance.trim(),
          roomTypes: hotelRoomTypes.trim(),
          pricePerNight: price,
          totalRooms: rooms,
          availableRooms: avail,
          amenities: hotelAmenities.trim(),
          description: hotelDescription.trim(),
          imageUrl: hotelImageUrl.trim(),
        });
        setHotelSuccess("Hotel details updated successfully!");
      } else {
        await addDoc(collection(db, "hotels"), {
          name: hotelName.trim(),
          city: hotelCity.trim(),
          stars: Number(hotelStars) || 5,
          distanceToHaram: hotelDistance.trim(),
          roomTypes: hotelRoomTypes.trim(),
          pricePerNight: price,
          totalRooms: rooms,
          availableRooms: rooms,
          amenities: hotelAmenities.trim(),
          description: hotelDescription.trim(),
          imageUrl: hotelImageUrl.trim(),
          timestamp: new Date(),
        });
        setHotelSuccess("Hotel published successfully for B2B Agents!");
      }
      resetHotelForm();
    } catch (err: any) {
      console.error("Hotel submit error:", err);
      setHotelError("Error saving hotel: " + err.message);
    } finally {
      setHotelSubmitting(false);
    }
  };

  const handleEditHotelClick = (h: HotelListing) => {
    setIsEditingHotel(true);
    setEditHotelId(h.id);
    setHotelName(h.name);
    setHotelCity(h.city);
    setHotelStars(String(h.stars));
    setHotelDistance(h.distanceToHaram || "");
    setHotelRoomTypes(h.roomTypes || "");
    setHotelPricePerNight(String(h.pricePerNight));
    setHotelTotalRooms(String(h.totalRooms));
    setHotelAvailableRooms(String(h.availableRooms));
    setHotelAmenities(h.amenities || "");
    setHotelDescription(h.description || "");
    setHotelImageUrl(h.imageUrl || "");
    setHotelError("");
    setHotelSuccess("");
  };

  const handleDeleteHotel = async (id: string) => {
    if (!window.confirm("Are you sure you want to remove this hotel listing?")) {
      return;
    }
    try {
      await deleteDoc(doc(db, "hotels", id));
      alert("Hotel listing deleted!");
    } catch (err: any) {
      console.error("Delete hotel error:", err);
      alert("Failed to delete hotel: " + err.message);
    }
  };

  const handleToggleHotelBookingStatus = async (bookingId: string, currentStatus: string) => {
    try {
      const nextStatus = currentStatus === "Confirmed" ? "Pending" : "Confirmed";
      const docRef = doc(db, "hotelBookings", bookingId);
      await updateDoc(docRef, { status: nextStatus });

      if (nextStatus === "Confirmed") {
        const targetBooking = hotelBookings.find(b => b.bookingId === bookingId);
        if (targetBooking && targetBooking.agentEmail) {
          sendApprovalNotification(
            "Hotel Reservation Confirmed & Approved",
            {
              "Status": "APPROVED & CONFIRMED",
              "Booking ID": bookingId,
              "Agent Name": targetBooking.agentName,
              "Agent Email": targetBooking.agentEmail,
              "Guest Name": targetBooking.guestName,
              "Hotel Name": targetBooking.hotelName,
              "City": targetBooking.city,
              "Check-In": targetBooking.checkInDate,
              "Check-Out": targetBooking.checkOutDate,
              "Title": targetBooking.title || "N/A",
              "Gender": targetBooking.gender || "N/A",
              "Nationality": targetBooking.nationality || "N/A",
              "Date of Birth": targetBooking.dob || "N/A",
              "Document Expiry": targetBooking.documentExpiry || "N/A",
              "Frequent Flyer": targetBooking.frequentFlyer || "N/A",
              "Wheelchair": targetBooking.wheelchair || "N/A",
              "Meal": targetBooking.meal || "N/A",
              "Reference": targetBooking.reference || "N/A",
              "Message": "Your B2B Hotel room reservation has been successfully approved and confirmed by the administrator."
            },
            targetBooking.agentEmail
          );
        }
      }
    } catch (err: any) {
      console.error("Update hotel booking status error:", err);
      alert("Failed to update status: " + err.message);
    }
  };

  const resetHotelForm = () => {
    setIsEditingHotel(false);
    setEditHotelId(null);
    setHotelName("");
    setHotelCity("Makkah");
    setHotelStars("5");
    setHotelDistance("");
    setHotelRoomTypes("Quad / Triple / Double Sharing");
    setHotelPricePerNight("");
    setHotelTotalRooms("");
    setHotelAvailableRooms("");
    setHotelAmenities("Free WiFi, Air Conditioning, Haram Shuttle Service");
    setHotelDescription("");
    setHotelImageUrl("");
  };


  return (
    <div className="flex min-h-[90vh] bg-[#F9FAFB] -mx-4 sm:-mx-6 lg:-mx-8 -my-8 font-sans">
      
      {/* SIDEBAR NAVIGATION - MATCHING TICKET BROKER STYLE */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col justify-between shrink-0 hidden md:flex">
        <div>
          {/* Logo brand */}
          <div className="p-6 border-b border-gray-100 flex items-center gap-3 bg-[#133F5C] text-white">
            <div className="bg-white p-1 rounded-lg flex items-center justify-center shadow-md w-10 h-10 shrink-0">
              <img src={logo} alt="Ticket Broker Logo" className="h-full w-full object-contain rounded-md" referrerPolicy="no-referrer" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold tracking-tight flex items-center gap-1 leading-none">
                <span className="text-white font-black">TICKET </span>
                <span className="text-[#ff7300] font-black">BROKER</span>
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

            <button
              onClick={() => setActiveTab("umrah_inventory")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-150 ${
                activeTab === "umrah_inventory"
                  ? "bg-[#00a29c] text-white shadow-xs"
                  : "text-[#133F5C] hover:bg-gray-50"
              }`}
            >
              <Sparkles className="h-4 w-4" />
              <span>Umrah Packages</span>
            </button>

            <button
              onClick={() => setActiveTab("umrah_bookings")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-150 ${
                activeTab === "umrah_bookings"
                  ? "bg-[#00a29c] text-white shadow-xs"
                  : "text-[#133F5C] hover:bg-gray-50"
              }`}
            >
              <Users className="h-4 w-4" />
              <span>Umrah Bookings</span>
              {umrahBookings.length > 0 && (
                <span className="ml-auto bg-[#ff7300] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {umrahBookings.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("hotel_inventory")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-150 ${
                activeTab === "hotel_inventory"
                  ? "bg-[#00a29c] text-white shadow-xs"
                  : "text-[#133F5C] hover:bg-gray-50"
              }`}
            >
              <Hotel className="h-4 w-4" />
              <span>Hotels Inventory</span>
            </button>

            <button
              onClick={() => setActiveTab("hotel_bookings")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-150 ${
                activeTab === "hotel_bookings"
                  ? "bg-[#00a29c] text-white shadow-xs"
                  : "text-[#133F5C] hover:bg-gray-50"
              }`}
            >
              <BedDouble className="h-4 w-4" />
              <span>Hotel Bookings</span>
              {hotelBookings.length > 0 && (
                <span className="ml-auto bg-[#ff7300] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {hotelBookings.length}
                </span>
              )}
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

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsAddBalanceModalOpen(true)}
              className="bg-[#00a29c] hover:bg-[#00828a] text-white font-extrabold text-xs px-3.5 py-1.5 rounded-lg shadow-xs flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <CreditCard className="h-4 w-4" />
              <span>➕ Add User Balance</span>
            </button>
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
                    <TableSkeleton />
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
                <TableSkeleton />
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
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() =>
                                    setInvoiceModal({
                                      isOpen: true,
                                      booking: b,
                                      ticket: associatedFlight,
                                    })
                                  }
                                  className="px-2.5 py-1.5 bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer flex items-center gap-1"
                                >
                                  <FileText className="h-3.5 w-3.5" />
                                  <span>Invoice</span>
                                </button>
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
                              </div>
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
                  <div className="pb-4 border-b border-gray-100 mb-4 flex justify-between items-center flex-wrap gap-2">
                    <div>
                      <h3 className="text-sm font-black text-[#133F5C]">All B2B Partner Ledger Records</h3>
                      <p className="text-xs text-gray-500 mt-0.5">Global ledger transaction audit stream representing ticket deductions and credit top-ups</p>
                    </div>
                    <button
                      onClick={() => setIsAddBalanceModalOpen(true)}
                      className="bg-[#00a29c] hover:bg-[#00828a] text-white font-bold text-xs px-3 py-1.5 rounded-lg shadow-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <CreditCard className="h-3.5 w-3.5" />
                      <span>➕ Add User Balance</span>
                    </button>
                  </div>

                  {loadingLedgers ? (
                    <TableSkeleton />
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

          {/* TAB 5: UMRAH PACKAGES INVENTORY */}
          {activeTab === "umrah_inventory" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-fadeIn">
              
              {/* Left Column: List packages */}
              <div className="lg:col-span-8 space-y-4">
                <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs">
                  <div className="pb-4 border-b border-gray-100 mb-4">
                    <h3 className="text-sm font-black text-[#133F5C]">Active Umrah Group Packages ({umrahPackages.length})</h3>
                    <p className="text-xs text-gray-500 mt-0.5">Manage live available tours, flights, hotel listings, and seat inventory.</p>
                  </div>

                  {loadingUmrahPackages ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <CardSkeleton />
                      <CardSkeleton />
                    </div>
                  ) : umrahPackages.length === 0 ? (
                    <div className="py-12 text-center text-gray-400">
                      No Umrah packages published yet. Use the form on the right to create your first package.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {umrahPackages.map((pkg) => (
                        <div
                          key={pkg.id}
                          className="border border-gray-200 rounded-xl p-4 bg-white hover:border-[#00a29c] transition-all flex flex-col md:flex-row justify-between gap-4"
                        >
                          <div className="flex-1 space-y-3 text-xs">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="text-sm font-black text-[#133F5C]">{pkg.airline}</h4>
                                <span className="inline-block bg-cyan-50 text-[#00a29c] text-[10px] font-bold px-2 py-0.5 rounded-full mt-1">
                                  {pkg.days} Package
                                </span>
                              </div>
                              <div className="text-right">
                                <span className="text-[10px] text-gray-400 font-bold block">Package Price</span>
                                <span className="text-sm font-black text-[#ff7300]">PKR {pkg.price.toLocaleString()}</span>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-gray-50 p-2.5 rounded-lg text-[11px] text-gray-600">
                              <div>
                                <p><strong>Makkah Hotel:</strong> {pkg.hotelMakkah || "Not Specified"}</p>
                                <p><strong>Madinah Hotel:</strong> {pkg.hotelMadinah || "Not Specified"}</p>
                                <p><strong>Baggage:</strong> {pkg.baggage || "Standard"}</p>
                              </div>
                              <div>
                                <p><strong>Dep Flight:</strong> {pkg.flightNoDep} ({pkg.depDetails})</p>
                                <p><strong>Ret Flight:</strong> {pkg.flightNoRet} ({pkg.retDetails})</p>
                                <p><strong>Seats Available:</strong> <span className="font-bold text-[#00a29c]">{pkg.availableSeats}</span> / {pkg.totalSeats}</p>
                              </div>
                            </div>
                          </div>

                          <div className="flex md:flex-col justify-end items-end gap-2 shrink-0 md:border-l md:border-gray-100 md:pl-4">
                            <button
                              onClick={() => handleEditUmrahClick(pkg)}
                              className="px-3 py-1.5 text-xs text-[#00a29c] bg-cyan-50 hover:bg-cyan-100 rounded-md font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteUmrahPackage(pkg.id)}
                              className="px-3 py-1.5 text-xs text-red-600 bg-red-50 hover:bg-red-100 rounded-md font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Form */}
              <div className="lg:col-span-4 sticky top-6">
                <Card className="border border-gray-200 shadow-sm p-5 space-y-4 bg-white">
                  <h3 className="text-sm font-black text-[#133F5C] pb-2 border-b border-gray-100 flex items-center gap-2">
                    <Sparkles className="h-4.5 w-4.5 text-[#ff7300]" />
                    {isEditingUmrah ? "Edit Umrah Package" : "Publish Umrah Package"}
                  </h3>

                  {umrahError && <Alert id="umrah-error" type="error" message={umrahError} onClose={() => setUmrahError("")} />}
                  {umrahSuccess && <Alert id="umrah-success" type="success" message={umrahSuccess} onClose={() => setUmrahSuccess("")} />}

                  <form onSubmit={handleCreateOrUpdateUmrahPackage} className="space-y-3.5 text-xs">
                    <Input
                      id="umrah-days"
                      label="Package Duration"
                      placeholder="e.g. 15 Days"
                      value={umrahDays}
                      onChange={(e) => setUmrahDays(e.target.value)}
                      required
                      disabled={umrahSubmitting}
                    />

                    <Input
                      id="umrah-airline"
                      label="Airline Carrier"
                      placeholder="e.g. Saudia Arabian Airlines"
                      value={umrahAirline}
                      onChange={(e) => setUmrahAirline(e.target.value)}
                      required
                      disabled={umrahSubmitting}
                    />

                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        id="umrah-dep-flight"
                        label="Dep Flight No"
                        placeholder="e.g. SV723"
                        value={umrahFlightNoDep}
                        onChange={(e) => setUmrahFlightNoDep(e.target.value)}
                        required
                        disabled={umrahSubmitting}
                      />
                      <Input
                        id="umrah-ret-flight"
                        label="Ret Flight No"
                        placeholder="e.g. SV726"
                        value={umrahFlightNoRet}
                        onChange={(e) => setUmrahFlightNoRet(e.target.value)}
                        required
                        disabled={umrahSubmitting}
                      />
                    </div>

                    <Input
                      id="umrah-dep-details"
                      label="Departure Details"
                      placeholder="e.g. ISB 16 Aug 10:35 → JED 16 Aug 13:40"
                      value={umrahDepDetails}
                      onChange={(e) => setUmrahDepDetails(e.target.value)}
                      disabled={umrahSubmitting}
                    />

                    <Input
                      id="umrah-ret-details"
                      label="Return Details"
                      placeholder="e.g. JED 05 Sep 18:10 → ISB 06 Sep 01:10"
                      value={umrahRetDetails}
                      onChange={(e) => setUmrahRetDetails(e.target.value)}
                      disabled={umrahSubmitting}
                    />

                    <Input
                      id="umrah-baggage"
                      label="Baggage Policy"
                      placeholder="e.g. 23 KG Departure / 46 KG Return"
                      value={umrahBaggage}
                      onChange={(e) => setUmrahBaggage(e.target.value)}
                      disabled={umrahSubmitting}
                    />

                    <Input
                      id="umrah-hotel-makkah"
                      label="Hotel in Makkah"
                      placeholder="e.g. Swissôtel Makkah"
                      value={umrahHotelMakkah}
                      onChange={(e) => setUmrahHotelMakkah(e.target.value)}
                      disabled={umrahSubmitting}
                    />

                    <Input
                      id="umrah-hotel-madinah"
                      label="Hotel in Madinah"
                      placeholder="e.g. Pullman Zamzam Madina"
                      value={umrahHotelMadinah}
                      onChange={(e) => setUmrahHotelMadinah(e.target.value)}
                      disabled={umrahSubmitting}
                    />

                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        id="umrah-price"
                        label="Price (PKR)"
                        type="number"
                        placeholder="e.g. 255000"
                        value={umrahPrice}
                        onChange={(e) => setUmrahPrice(e.target.value)}
                        required
                        disabled={umrahSubmitting}
                      />
                      <Input
                        id="umrah-seats"
                        label="Total Seats"
                        type="number"
                        placeholder="e.g. 50"
                        value={umrahTotalSeats}
                        onChange={(e) => setUmrahTotalSeats(e.target.value)}
                        required
                        disabled={umrahSubmitting}
                      />
                    </div>

                    {isEditingUmrah && (
                      <Input
                        id="umrah-avail-seats"
                        label="Available Seats Override"
                        type="number"
                        placeholder="e.g. 48"
                        value={umrahAvailableSeats}
                        onChange={(e) => setUmrahAvailableSeats(e.target.value)}
                        required
                        disabled={umrahSubmitting}
                      />
                    )}

                    <div className="flex gap-2 pt-2">
                      <button
                        id="submit-umrah-btn"
                        type="submit"
                        disabled={umrahSubmitting}
                        className="flex-1 bg-[#ff7300] hover:bg-[#e05e00] text-white font-bold py-2 rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        {umrahSubmitting ? <LoadingSpinner size="sm" /> : isEditingUmrah ? "Update Package" : "Publish Package"}
                      </button>
                      {isEditingUmrah && (
                        <button
                          id="cancel-umrah-edit-btn"
                          type="button"
                          onClick={resetUmrahForm}
                          className="px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2 rounded-lg text-xs transition-all cursor-pointer"
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

          {/* TAB 6: UMRAH BOOKINGS */}
          {activeTab === "umrah_bookings" && (
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-xs space-y-4 animate-fadeIn">
              <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                <div>
                  <h3 className="text-base font-black text-[#133F5C]">Partner Umrah Package Bookings ({umrahBookings.length})</h3>
                  <p className="text-xs text-gray-500">Approve, verify, and view dynamic passenger dossiers submitted by travel agents.</p>
                </div>
              </div>

              {loadingUmrahBookings ? (
                <TableSkeleton />
              ) : umrahBookings.length === 0 ? (
                <div className="py-12 text-center text-gray-400">
                  No Umrah Package bookings received from agents yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 text-xs">
                    <thead>
                      <tr className="bg-gray-50 text-gray-500">
                        <th className="px-4 py-3 text-left font-bold uppercase">Ref ID</th>
                        <th className="px-4 py-3 text-left font-bold uppercase">Agency Partner</th>
                        <th className="px-4 py-3 text-left font-bold uppercase">Umrah Package</th>
                        <th className="px-4 py-3 text-left font-bold uppercase">Passenger Details</th>
                        <th className="px-4 py-3 text-left font-bold uppercase">Uploaded Documents</th>
                        <th className="px-4 py-3 text-left font-bold uppercase">Status</th>
                        <th className="px-4 py-3 text-left font-bold uppercase">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {umrahBookings.map((b) => {
                        const associatedPkg = umrahPackages.find((p) => p.id === b.packageId);
                        return (
                          <tr key={b.bookingId} className="hover:bg-gray-50">
                            <td className="px-4 py-3 font-mono font-bold text-gray-500">
                              #{b.bookingId.substring(0, 8)}
                            </td>
                            <td className="px-4 py-3">
                              <div className="font-bold text-gray-800">{b.agentName}</div>
                              <div className="text-[10px] text-gray-500 font-mono">{b.agentEmail}</div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="font-bold text-gray-800">
                                {associatedPkg ? `${associatedPkg.airline} (${associatedPkg.days})` : "Syncing..."}
                              </div>
                              <div className="text-[10px] text-[#ff7300] font-bold">
                                PKR {associatedPkg?.price.toLocaleString() || "Syncing"}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="font-bold text-gray-800">{b.passengerName}</div>
                              <div className="text-[10px] text-gray-500 font-mono font-bold">Passport: {b.passengerPassport}</div>
                            </td>
                            <td className="px-4 py-3 space-x-2">
                              {b.passengerPhotoUrl ? (
                                <button
                                  onClick={() =>
                                    setPhotoModal({
                                      isOpen: true,
                                      title: `Umrah Photo: ${b.passengerName}`,
                                      imgUrl: b.passengerPhotoUrl,
                                    })
                                  }
                                  className="text-[10px] text-[#00a29c] font-bold bg-cyan-50 hover:bg-cyan-100 px-2 py-0.5 rounded cursor-pointer"
                                >
                                  Photo
                                </button>
                              ) : (
                                <span className="text-gray-400">No Photo</span>
                              )}
                              {b.passportPhotoUrl ? (
                                <button
                                  onClick={() =>
                                    setPhotoModal({
                                      isOpen: true,
                                      title: `Passport Photo: ${b.passengerName}`,
                                      imgUrl: b.passportPhotoUrl,
                                    })
                                  }
                                  className="text-[10px] text-blue-600 font-bold bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded cursor-pointer"
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
                            <td className="px-4 py-3">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() =>
                                    setUmrahInvoiceModal({
                                      isOpen: true,
                                      booking: b,
                                      pkg: associatedPkg,
                                    })
                                  }
                                  className="px-2.5 py-1 bg-[#b45309] hover:bg-[#92400e] text-white text-xs font-bold rounded shadow-xs transition-colors cursor-pointer flex items-center gap-1"
                                >
                                  <FileText className="h-3.5 w-3.5" />
                                  <span>Voucher</span>
                                </button>
                                <button
                                  onClick={() => handleToggleUmrahBookingStatus(b.bookingId, b.status)}
                                  className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all cursor-pointer ${
                                    b.status === "Confirmed"
                                      ? "bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200"
                                      : "bg-green-600 hover:bg-green-700 text-white shadow-xs"
                                  }`}
                                >
                                  {b.status === "Confirmed" ? "Set Pending" : "Confirm Tour"}
                                </button>
                              </div>
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

          {/* TAB 7: HOTEL INVENTORY */}
          {activeTab === "hotel_inventory" && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-xl border border-gray-200 shadow-xs">
                <div>
                  <h3 className="text-base font-black text-[#133F5C] flex items-center gap-2">
                    <Hotel className="h-5 w-5 text-[#00a29c]" /> Hotel Inventory & Rates
                  </h3>
                  <p className="text-xs text-gray-500">
                    Add and publish hotels in Makkah, Madinah, or global cities for B2B Agent reservations.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Active Hotel Listings */}
                <div className="lg:col-span-2 space-y-4">
                  <h4 className="text-xs font-black text-[#133F5C] uppercase tracking-wider">
                    Published Hotels ({hotels.length})
                  </h4>

                  {loadingHotels ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <CardSkeleton />
                      <CardSkeleton />
                    </div>
                  ) : hotels.length === 0 ? (
                    <Card className="p-8 text-center text-gray-400 text-xs">
                      No hotel listings found. Use the form on the right to publish your first hotel.
                    </Card>
                  ) : (
                    <div className="grid grid-cols-1 gap-4">
                      {hotels.map((h) => (
                        <div
                          key={h.id}
                          className="bg-white rounded-xl border border-gray-200 p-5 hover:border-[#00a29c] transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                        >
                          <div className="space-y-1.5 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="bg-[#133F5C] text-white text-[10px] font-black px-2 py-0.5 rounded">
                                {h.city}
                              </span>
                              <h5 className="font-extrabold text-sm text-[#133F5C]">{h.name}</h5>
                              <div className="flex items-center text-amber-400 text-xs">
                                {"★".repeat(h.stars)}
                              </div>
                            </div>

                            <p className="text-xs text-gray-600 flex items-center gap-1 font-medium">
                              <MapPin className="h-3.5 w-3.5 text-[#00a29c]" /> {h.distanceToHaram || "Near City Center"}
                            </p>

                            <p className="text-[11px] text-gray-500">
                              <BedDouble className="h-3 w-3 inline mr-1 text-gray-400" />
                              Room Types: <span className="font-semibold text-gray-700">{h.roomTypes}</span>
                            </p>

                            {h.amenities && (
                              <p className="text-[10px] text-gray-400 font-mono">
                                Amenities: {h.amenities}
                              </p>
                            )}
                          </div>

                          <div className="text-left sm:text-right space-y-2 border-t sm:border-t-0 pt-3 sm:pt-0 border-gray-100 w-full sm:w-auto">
                            <div>
                              <span className="text-[10px] text-gray-400 uppercase font-bold block">Rate / Night</span>
                              <span className="text-sm font-black text-[#ff7300]">
                                PKR {h.pricePerNight.toLocaleString()}
                              </span>
                            </div>

                            <div className="text-[11px] font-bold text-gray-600">
                              Rooms: <span className="text-[#00a29c]">{h.availableRooms}</span> / {h.totalRooms}
                            </div>

                            <div className="flex items-center gap-2 pt-1">
                              <button
                                onClick={() => handleEditHotelClick(h)}
                                className="p-1.5 text-gray-500 hover:text-[#00a29c] bg-gray-50 hover:bg-cyan-50 rounded-md transition-colors cursor-pointer text-xs font-bold flex items-center gap-1"
                              >
                                <Edit2 className="h-3.5 w-3.5" /> Edit
                              </button>
                              <button
                                onClick={() => handleDeleteHotel(h.id)}
                                className="p-1.5 text-gray-500 hover:text-red-600 bg-gray-50 hover:bg-red-50 rounded-md transition-colors cursor-pointer text-xs font-bold flex items-center gap-1"
                              >
                                <Trash2 className="h-3.5 w-3.5" /> Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Publish / Edit Hotel Form */}
                <div>
                  <Card className="p-5 border border-gray-200">
                    <h3 className="text-sm font-black text-[#133F5C] pb-3 border-b border-gray-100 mb-4">
                      {isEditingHotel ? "Edit Hotel Details" : "Publish New Hotel Listing"}
                    </h3>

                    {hotelError && <Alert id="hotel-error" type="error" message={hotelError} onClose={() => setHotelError("")} />}
                    {hotelSuccess && <Alert id="hotel-success" type="success" message={hotelSuccess} onClose={() => setHotelSuccess("")} />}

                    <form onSubmit={handleCreateOrUpdateHotel} className="space-y-3.5 text-xs">
                      <Input
                        id="hotel-name"
                        label="Hotel Name"
                        placeholder="e.g. Swissôtel Makkah"
                        value={hotelName}
                        onChange={(e) => setHotelName(e.target.value)}
                        required
                        disabled={hotelSubmitting}
                      />

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-[#133F5C] mb-1">City</label>
                          <select
                            value={hotelCity}
                            onChange={(e) => setHotelCity(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg p-2 text-xs bg-white font-bold text-gray-800"
                            disabled={hotelSubmitting}
                          >
                            <option value="Makkah">Makkah</option>
                            <option value="Madinah">Madinah</option>
                            <option value="Jeddah">Jeddah</option>
                            <option value="Riyadh">Riyadh</option>
                            <option value="Dubai">Dubai</option>
                            <option value="Istanbul">Istanbul</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-[#133F5C] mb-1">Star Rating</label>
                          <select
                            value={hotelStars}
                            onChange={(e) => setHotelStars(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg p-2 text-xs bg-white font-bold text-gray-800"
                            disabled={hotelSubmitting}
                          >
                            <option value="5">5 Star Luxury</option>
                            <option value="4">4 Star Premium</option>
                            <option value="3">3 Star Standard</option>
                            <option value="2">2 Star Economy</option>
                          </select>
                        </div>
                      </div>

                      <Input
                        id="hotel-distance"
                        label="Distance / Location"
                        placeholder="e.g. 100 meters from King Abdulaziz Gate"
                        value={hotelDistance}
                        onChange={(e) => setHotelDistance(e.target.value)}
                        disabled={hotelSubmitting}
                      />

                      <Input
                        id="hotel-rooms-type"
                        label="Room Sharing Configurations"
                        placeholder="e.g. Quad / Triple / Double Sharing"
                        value={hotelRoomTypes}
                        onChange={(e) => setHotelRoomTypes(e.target.value)}
                        required
                        disabled={hotelSubmitting}
                      />

                      <div className="grid grid-cols-2 gap-3">
                        <Input
                          id="hotel-price"
                          label="Price / Night (PKR)"
                          type="number"
                          placeholder="e.g. 28000"
                          value={hotelPricePerNight}
                          onChange={(e) => setHotelPricePerNight(e.target.value)}
                          required
                          disabled={hotelSubmitting}
                        />
                        <Input
                          id="hotel-[#rooms]"
                          label="Total Rooms"
                          type="number"
                          placeholder="e.g. 20"
                          value={hotelTotalRooms}
                          onChange={(e) => setHotelTotalRooms(e.target.value)}
                          required
                          disabled={hotelSubmitting}
                        />
                      </div>

                      {isEditingHotel && (
                        <Input
                          id="hotel-avail-rooms"
                          label="Available Rooms Override"
                          type="number"
                          placeholder="e.g. 18"
                          value={hotelAvailableRooms}
                          onChange={(e) => setHotelAvailableRooms(e.target.value)}
                          required
                          disabled={hotelSubmitting}
                        />
                      )}

                      <Input
                        id="hotel-amenities"
                        label="Amenities & Services"
                        placeholder="e.g. Free WiFi, Breakfast, Haram Shuttle"
                        value={hotelAmenities}
                        onChange={(e) => setHotelAmenities(e.target.value)}
                        disabled={hotelSubmitting}
                      />

                      <div className="flex gap-2 pt-2">
                        <button
                          id="submit-hotel-btn"
                          type="submit"
                          disabled={hotelSubmitting}
                          className="flex-1 bg-[#ff7300] hover:bg-[#e05e00] text-white font-bold py-2 rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          {hotelSubmitting ? <LoadingSpinner size="sm" /> : isEditingHotel ? "Update Hotel" : "Publish Hotel"}
                        </button>
                        {isEditingHotel && (
                          <button
                            id="cancel-hotel-edit-btn"
                            type="button"
                            onClick={resetHotelForm}
                            className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-3 py-2 rounded-lg text-xs cursor-pointer"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </form>
                  </Card>
                </div>
              </div>
            </div>
          )}

          {/* TAB 8: HOTEL BOOKINGS */}
          {activeTab === "hotel_bookings" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center bg-white p-6 rounded-xl border border-gray-200 shadow-xs">
                <div>
                  <h3 className="text-base font-black text-[#133F5C] flex items-center gap-2">
                    <BedDouble className="h-5 w-5 text-[#00a29c]" /> Partner Hotel Bookings Log
                  </h3>
                  <p className="text-xs text-gray-500">Review, manage, and confirm room reservations submitted by B2B travel agents.</p>
                </div>
              </div>

              {loadingHotelBookings ? (
                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-xs">
                  <TableSkeleton />
                </div>
              ) : hotelBookings.length === 0 ? (
                <Card className="p-12 text-center text-gray-400 text-xs">
                  No agent hotel bookings recorded yet.
                </Card>
              ) : (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-xs">
                  <table className="min-w-full divide-y divide-gray-200 text-xs">
                    <thead>
                      <tr className="bg-gray-50 text-gray-500 font-bold uppercase">
                        <th className="px-4 py-3 text-left">Ref ID</th>
                        <th className="px-4 py-3 text-left">Hotel & Location</th>
                        <th className="px-4 py-3 text-left">Guest Details</th>
                        <th className="px-4 py-3 text-left">Check-In / Out</th>
                        <th className="px-4 py-3 text-left">Rooms / Cost</th>
                        <th className="px-4 py-3 text-left">Agent</th>
                        <th className="px-4 py-3 text-left">Status</th>
                        <th className="px-4 py-3 text-left">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {hotelBookings.map((hb) => (
                        <tr key={hb.bookingId} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-mono font-bold text-gray-500">
                            #{hb.bookingId.substring(0, 8)}
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-bold text-gray-800">{hb.hotelName}</div>
                            <div className="text-[10px] text-[#00a29c] font-bold">{hb.city}</div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-bold text-gray-800">{hb.guestName}</div>
                            <div className="text-[10px] text-gray-500 font-mono">Phone: {hb.guestPhone}</div>
                            <div className="text-[10px] text-gray-500 font-mono">Passport: {hb.passportNo}</div>
                          </td>
                          <td className="px-4 py-3 space-y-0.5 text-[11px]">
                            <div><strong>In:</strong> {hb.checkInDate}</div>
                            <div><strong>Out:</strong> {hb.checkOutDate}</div>
                            <div className="text-[10px] text-gray-400 font-bold">{hb.nights} Night(s)</div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-bold text-[#ff7300]">
                              PKR {hb.totalCost ? hb.totalCost.toLocaleString() : "0"}
                            </div>
                            <div className="text-[10px] text-gray-500">
                              {hb.numberOfRooms} Room(s) ({hb.roomType})
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-bold text-gray-700">{hb.agentName}</div>
                            <div className="text-[10px] text-gray-400">{hb.agentEmail}</div>
                          </td>
                          <td className="px-4 py-3">
                            <Badge status={hb.status} />
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => {
                                  const matchingHotel = hotels.find((h) => h.id === hb.hotelId);
                                  setVoucherModal({
                                    isOpen: true,
                                    booking: hb,
                                    hotel: matchingHotel,
                                  });
                                }}
                                className="px-2.5 py-1 bg-[#5da855] hover:bg-[#4d8f45] text-white text-xs font-bold rounded shadow-xs transition-colors cursor-pointer flex items-center gap-1"
                              >
                                <FileText className="h-3.5 w-3.5" />
                                <span>Voucher</span>
                              </button>
                              <button
                                onClick={() => handleToggleHotelBookingStatus(hb.bookingId, hb.status)}
                                className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all cursor-pointer ${
                                  hb.status === "Confirmed"
                                    ? "bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200"
                                    : "bg-green-600 hover:bg-green-700 text-white shadow-xs"
                                }`}
                              >
                                {hb.status === "Confirmed" ? "Set Pending" : "Confirm Hotel"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
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

      {/* TICKET INVOICE MODAL */}
      <TicketInvoiceModal
        isOpen={invoiceModal.isOpen}
        onClose={() => setInvoiceModal({ isOpen: false, booking: null, ticket: null })}
        booking={invoiceModal.booking}
        ticket={invoiceModal.ticket}
      />

      {/* HOTEL VOUCHER MODAL */}
      <HotelVoucherModal
        isOpen={voucherModal.isOpen}
        onClose={() => setVoucherModal({ isOpen: false, booking: null, hotel: null })}
        booking={voucherModal.booking}
        hotel={voucherModal.hotel}
      />

      {/* UMRAH PACKAGE INVOICE MODAL */}
      <UmrahPackageInvoiceModal
        isOpen={umrahInvoiceModal.isOpen}
        onClose={() => setUmrahInvoiceModal({ isOpen: false, booking: null, pkg: null })}
        booking={umrahInvoiceModal.booking}
        pkg={umrahInvoiceModal.pkg}
      />

      {/* ADD USER BALANCE MODAL */}
      <AddUserBalanceModal
        isOpen={isAddBalanceModalOpen}
        onClose={() => setIsAddBalanceModalOpen(false)}
        agents={uniqueAgents}
      />

    </div>
  );
}
