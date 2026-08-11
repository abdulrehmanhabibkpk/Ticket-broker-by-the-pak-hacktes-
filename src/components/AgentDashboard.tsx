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
  getDoc
} from "firebase/firestore";
import { Ticket, Booking } from "../types";
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
  Clock
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
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [loadingBookings, setLoadingBookings] = useState(true);

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

  // 1. Listen to available flights
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
            title: data.title || data.route || "No Route Name",
            route: data.route || data.title || "No Route Name",
            dateTime: data.dateTime || "",
            price: Number(data.price) || 0,
            availableSeats: Number(data.availableSeats) !== undefined ? Number(data.availableSeats) : (Number(data.totalSeats) || 0),
            totalSeats: Number(data.totalSeats) || 0,
            carrier: data.carrier || data.airline || "Unknown Carrier",
            airline: data.airline || data.carrier || "Unknown Carrier",
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

  // 2. Listen to "My Bookings"
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

  // Handle passenger image upload selection
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

  // Handle passport image upload selection
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

    setBookingLoading(true);

    try {
      // 1. Verify latest seats count via getDoc
      const ticketRef = doc(db, "tickets", selectedTicket.id);
      const ticketSnap = await getDoc(ticketRef);
      if (!ticketSnap.exists()) {
        throw new Error("This ticket listing does not exist anymore.");
      }

      const freshTicketData = ticketSnap.data();
      const currentAvailableSeats = Number(freshTicketData.availableSeats);

      if (currentAvailableSeats <= 0) {
        throw new Error("Seats have just been fully booked by another agency.");
      }

      // 2. Setup the booking order document inside 'bookings'
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
        status: "Pending", // Default initial status
        timestamp: new Date()
      };

      await setDoc(newBookingDocRef, bookingOrder);

      // 3. Decrement the flight available seats count
      await updateDoc(ticketRef, {
        availableSeats: currentAvailableSeats - 1,
      });

      setBookingStatus({
        type: "success",
        text: `Booking successfully created for ${passengerName}! Initial status is Pending.`,
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
        text: err.message || "Failed to finalize booking. Please try again.",
      });
    } finally {
      setBookingLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Agent Header banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white border border-[#E5E7EB] rounded-lg p-6 gap-4">
        <div>
          <span className="text-xs font-bold text-[#1D4ED8] uppercase tracking-wider block mb-1">
            B2B Agent Portal
          </span>
          <h2 className="text-xl font-bold text-[#111827] flex items-center gap-2">
            Welcome back, {agentName}
          </h2>
          <p className="text-sm text-[#6B7280]">
            B2B Partner: <span className="font-semibold text-gray-700">{agentEmail}</span>
          </p>
        </div>
        <Button id="agent-logout-btn" variant="outline" onClick={onLogout}>
          Sign Out Portal
        </Button>
      </div>

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Live Schedules and Active Bookings */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Live flight inventory catalog */}
          <div className="bg-white border border-[#E5E7EB] rounded-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-base font-bold text-[#111827] flex items-center gap-2">
                  <Plane className="h-5 w-5 text-[#1D4ED8]" />
                  Live Available Flight Schedules
                </h3>
                <p className="text-xs text-[#6B7280] mt-1">
                  Click 'Reserve Seat' to initiate the passenger boarding dossier
                </p>
              </div>
              <span className="text-xs text-[#6B7280] font-mono flex items-center gap-1.5 bg-gray-50 px-2.5 py-1 rounded border border-[#E5E7EB]">
                <RefreshCw className="h-3.5 w-3.5 animate-spin-slow text-[#1D4ED8]" />
                Live Feed
              </span>
            </div>

            {loadingTickets ? (
              <div className="py-12">
                <LoadingSpinner />
              </div>
            ) : tickets.length === 0 ? (
              <div className="py-12 text-center text-[#6B7280] border border-dashed border-[#E5E7EB] rounded-lg">
                No tickets are currently published. Contact Admin to publish.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tickets.map((t) => {
                  const isNoSeats = t.availableSeats <= 0;
                  return (
                    <div
                      key={t.id}
                      className={`border rounded-lg p-4 transition-all duration-200 flex flex-col justify-between ${
                        selectedTicket?.id === t.id
                          ? "border-[#1D4ED8] bg-blue-50/20"
                          : "border-[#E5E7EB] hover:border-gray-300"
                      }`}
                    >
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded uppercase">
                            {t.carrier}
                          </span>
                          <span className="text-base font-bold text-[#111827]">
                            ${t.price}
                          </span>
                        </div>
                        <h4 className="text-sm font-semibold text-[#111827]">{t.route}</h4>
                        
                        <div className="flex items-center gap-2 mt-3 text-xs text-[#6B7280]">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>{t.dateTime ? new Date(t.dateTime).toLocaleString() : "Contact Carrier"}</span>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-[#E5E7EB] flex items-center justify-between">
                        <div className="text-xs">
                          {isNoSeats ? (
                            <span className="font-bold text-red-600 flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" /> Fully Booked
                            </span>
                          ) : (
                            <span>
                              <strong className="text-[#1D4ED8] font-bold">{t.availableSeats}</strong> seats left
                            </span>
                          )}
                        </div>
                        <Button
                          id={`book-ticket-btn-${t.id}`}
                          variant={selectedTicket?.id === t.id ? "primary" : "outline"}
                          disabled={isNoSeats}
                          onClick={() => {
                            setSelectedTicket(t);
                            setBookingStatus(null);
                          }}
                          className="text-xs py-1 px-3"
                        >
                          {selectedTicket?.id === t.id ? "Selected" : "Reserve Seat"}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* "My Bookings" list */}
          <div className="bg-white border border-[#E5E7EB] rounded-lg p-6">
            <h3 className="text-base font-bold text-[#111827] mb-6 flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-[#1D4ED8]" />
              My Registered Bookings ({myBookings.length})
            </h3>

            {loadingBookings ? (
              <div className="py-12">
                <LoadingSpinner />
              </div>
            ) : myBookings.length === 0 ? (
              <div className="py-12 text-center text-[#6B7280] border border-dashed border-[#E5E7EB] rounded-lg">
                No tickets booked yet. Complete the dossier on the right to place a booking.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-[#E5E7EB]">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Dossier ID</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Flight / Airline</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Passenger</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Documents</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E7EB] bg-white">
                    {myBookings.map((b) => {
                      const associatedFlight = tickets.find((t) => t.id === b.ticketId);
                      return (
                        <tr key={b.bookingId} className="hover:bg-gray-50 transition-all duration-150">
                          <td className="px-4 py-3 whitespace-nowrap text-xs font-mono font-bold text-gray-500">
                            #{b.bookingId.substring(0, 8)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm font-semibold text-[#111827]">
                              {associatedFlight?.route || "Custom Sync Flight"}
                            </div>
                            <div className="text-xs text-[#6B7280]">
                              {associatedFlight?.carrier || "Airline Partner"}
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm font-semibold text-[#111827]">{b.passengerName}</div>
                            <div className="text-xs text-[#6B7280] font-mono">PPT: {b.passengerPassport}</div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap space-x-2">
                            {b.passengerPhotoUrl ? (
                              <button
                                id={`view-pass-${b.bookingId}`}
                                onClick={() =>
                                  setPhotoModal({
                                    isOpen: true,
                                    title: `Passenger Photo: ${b.passengerName}`,
                                    imgUrl: b.passengerPhotoUrl,
                                  })
                                }
                                className="inline-flex items-center gap-1 text-xs text-[#1D4ED8] hover:underline font-semibold bg-blue-50 px-2 py-0.5 rounded cursor-pointer"
                              >
                                Photo
                              </button>
                            ) : (
                              <span className="text-xs text-gray-400">No Photo</span>
                            )}
                            {b.passportPhotoUrl ? (
                              <button
                                id={`view-passpt-${b.bookingId}`}
                                onClick={() =>
                                  setPhotoModal({
                                    isOpen: true,
                                    title: `Passport Photo: ${b.passengerName}`,
                                    imgUrl: b.passportPhotoUrl,
                                  })
                                }
                                className="inline-flex items-center gap-1 text-xs text-[#1D4ED8] hover:underline font-semibold bg-gray-100 px-2 py-0.5 rounded cursor-pointer"
                              >
                                Passport
                              </button>
                            ) : (
                              <span className="text-xs text-gray-400">No Passport</span>
                            )}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
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
        </div>

        {/* Right Column: Dynamic Booking dossier builder */}
        <div className="lg:col-span-4">
          <Card id="booking-flow-card" className="sticky top-4">
            <h3 className="text-base font-bold text-[#111827] mb-4 pb-2 border-b border-[#E5E7EB] flex items-center gap-2">
              <FileText className="h-5 w-5 text-[#1D4ED8]" />
              Interactive Booking Dossier
            </h3>

            {bookingStatus && (
              <div className="mb-4">
                <Alert
                  id="booking-status-alert"
                  type={bookingStatus.type}
                  message={bookingStatus.text}
                  onClose={() => setBookingStatus(null)}
                />
              </div>
            )}

            {!selectedTicket ? (
              <div className="py-8 text-center text-[#6B7280]">
                <Plane className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                Select an active flight schedule from the catalog to build passenger boarding details.
              </div>
            ) : (
              <form onSubmit={handleCreateBooking} className="space-y-4">
                {/* Chosen Flight card */}
                <div className="bg-gray-50 border border-[#E5E7EB] rounded-lg p-3.5 relative">
                  <button
                    id="deselect-ticket-btn"
                    type="button"
                    onClick={() => setSelectedTicket(null)}
                    className="absolute top-2.5 right-2.5 text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  <p className="text-xs font-bold text-gray-400 uppercase">Selected Flight</p>
                  <p className="text-sm font-bold text-[#111827] mt-1">{selectedTicket.route}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{selectedTicket.carrier} • ${selectedTicket.price}</p>
                </div>

                <Input
                  id="passenger-name-input"
                  label="Passenger Full Name"
                  placeholder="e.g., Jane Smith"
                  value={passengerName}
                  onChange={(e) => setPassengerName(e.target.value)}
                  required
                  disabled={bookingLoading}
                />

                <Input
                  id="passenger-passport-input"
                  label="Passport / National Document ID"
                  placeholder="e.g., EP76543210"
                  value={passengerPassport}
                  onChange={(e) => setPassengerPassport(e.target.value)}
                  required
                  disabled={bookingLoading}
                />

                {/* Passenger Photo Upload Slot */}
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-[#111827]">Passenger Profile Photo</span>
                  <div className="relative border border-dashed border-[#E5E7EB] rounded-lg p-4 hover:bg-gray-50 transition-colors flex flex-col items-center justify-center cursor-pointer">
                    <input
                      id="passenger-photo-file-input"
                      type="file"
                      accept="image/*"
                      onChange={handlePassengerPhotoChange}
                      disabled={bookingLoading}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full"
                    />
                    {passengerPhoto ? (
                      <div className="text-center space-y-1">
                        <CheckCircle className="h-6 w-6 text-green-600 mx-auto" />
                        <p className="text-xs font-bold text-green-700">{passengerPhotoName}</p>
                        <p className="text-[10px] text-gray-400">Optimized image ready for mobile sync</p>
                      </div>
                    ) : (
                      <div className="text-center space-y-1">
                        <Upload className="h-5 w-5 text-gray-400 mx-auto" />
                        <p className="text-xs text-gray-500">Drag & drop or click to upload</p>
                        <p className="text-[10px] text-gray-400">JPG, PNG up to 5MB</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Passport Photo Upload Slot */}
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-[#111827]">Passport Verification Scan</span>
                  <div className="relative border border-dashed border-[#E5E7EB] rounded-lg p-4 hover:bg-gray-50 transition-colors flex flex-col items-center justify-center cursor-pointer">
                    <input
                      id="passport-photo-file-input"
                      type="file"
                      accept="image/*"
                      onChange={handlePassportPhotoChange}
                      disabled={bookingLoading}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full"
                    />
                    {passportPhoto ? (
                      <div className="text-center space-y-1">
                        <CheckCircle className="h-6 w-6 text-green-600 mx-auto" />
                        <p className="text-xs font-bold text-green-700">{passportPhotoName}</p>
                        <p className="text-[10px] text-gray-400">Optimized scan ready for mobile sync</p>
                      </div>
                    ) : (
                      <div className="text-center space-y-1">
                        <Upload className="h-5 w-5 text-gray-400 mx-auto" />
                        <p className="text-xs text-gray-500">Drag & drop or click to upload</p>
                        <p className="text-[10px] text-gray-400">JPG, PNG up to 5MB</p>
                      </div>
                    )}
                  </div>
                </div>

                <Button
                  id="submit-booking-btn"
                  type="submit"
                  className="w-full pt-3"
                  disabled={bookingLoading || !passengerName || !passengerPassport}
                >
                  {bookingLoading ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    "Place B2B Booking Order"
                  )}
                </Button>
              </form>
            )}
          </Card>
        </div>

      </div>

      {/* Image Preview Modal */}
      {photoModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative bg-white rounded-lg max-w-lg w-full p-6 border border-[#E5E7EB]">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-base font-bold text-[#111827]">{photoModal.title}</h4>
              <button
                id="close-preview-modal-btn"
                onClick={() => setPhotoModal({ isOpen: false, title: "", imgUrl: "" })}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex justify-center bg-gray-50 border border-[#E5E7EB] rounded p-2">
              <img
                src={photoModal.imgUrl}
                alt="Document Verification preview"
                className="max-h-96 max-w-full object-contain rounded"
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
