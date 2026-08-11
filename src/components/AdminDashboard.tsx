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
  orderBy
} from "firebase/firestore";
import { Ticket, Booking } from "../types";
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
  ExternalLink,
  X,
  FileText,
  UserCheck,
  RefreshCw
} from "lucide-react";

export default function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  const [activeTab, setActiveTab] = useState<"inventory" | "bookings">("inventory");
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [loadingBookings, setLoadingBookings] = useState(true);

  // Form State for Adding / Editing Tickets
  const [isEditing, setIsEditing] = useState(false);
  const [editTicketId, setEditTicketId] = useState<string | null>(null);
  const [route, setRoute] = useState("");
  const [dateTime, setDateTime] = useState("");
  const [price, setPrice] = useState<number>(0);
  const [totalSeats, setTotalSeats] = useState<number>(0);
  const [availableSeats, setAvailableSeats] = useState<number>(0);
  const [carrier, setCarrier] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

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

  const handleCreateOrUpdateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");
    setSubmitting(true);

    if (!route.trim()) {
      setFormError("Route/Route Title is required.");
      setSubmitting(false);
      return;
    }
    if (!carrier.trim()) {
      setFormError("Airline Carrier is required.");
      setSubmitting(false);
      return;
    }
    if (price <= 0 || totalSeats <= 0) {
      setFormError("Price and Total Seats must be greater than 0.");
      setSubmitting(false);
      return;
    }

    try {
      const ticketData = {
        title: route,
        route: route,
        dateTime: dateTime,
        price: Number(price),
        totalSeats: Number(totalSeats),
        availableSeats: isEditing ? Number(availableSeats) : Number(totalSeats),
        carrier: carrier,
        airline: carrier,
      };

      if (isEditing && editTicketId) {
        // Update ticket
        const docRef = doc(db, "tickets", editTicketId);
        await updateDoc(docRef, ticketData);
        setFormSuccess("Ticket successfully updated!");
        resetForm();
      } else {
        // Create ticket
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

  const handleEditClick = (ticket: Ticket) => {
    setIsEditing(true);
    setEditTicketId(ticket.id);
    setRoute(ticket.route);
    setDateTime(ticket.dateTime);
    setPrice(ticket.price);
    setTotalSeats(ticket.totalSeats);
    setAvailableSeats(ticket.availableSeats);
    setCarrier(ticket.carrier);
  };

  const handleDeleteTicket = async (ticketId: string) => {
    if (!window.confirm("Are you sure you want to delete this ticket? This action cannot be undone.")) {
      return;
    }
    try {
      await deleteDoc(doc(db, "tickets", ticketId));
    } catch (err: any) {
      alert("Error deleting ticket: " + err.message);
    }
  };

  const handleToggleBookingStatus = async (bookingId: string, currentStatus: string) => {
    const nextStatus = currentStatus === "Confirmed" ? "Pending" : "Confirmed";
    try {
      const docRef = doc(db, "bookings", bookingId);
      await updateDoc(docRef, { status: nextStatus });
    } catch (err: any) {
      alert("Error updating booking status: " + err.message);
    }
  };

  const resetForm = () => {
    setIsEditing(false);
    setEditTicketId(null);
    setRoute("");
    setDateTime("");
    setPrice(0);
    setTotalSeats(0);
    setAvailableSeats(0);
    setCarrier("");
  };

  return (
    <div className="space-y-6">
      {/* Top Admin Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white border border-[#E5E7EB] rounded-lg p-6 gap-4">
        <div>
          <span className="text-xs font-bold text-[#1D4ED8] uppercase tracking-wider block mb-1">
            B2B Administration Panel
          </span>
          <h2 className="text-xl font-bold text-[#111827] flex items-center gap-2">
            System Administrator console
          </h2>
          <p className="text-sm text-[#6B7280]">
            Active account: <strong className="font-semibold text-gray-700">abdulrehman654as@gmail.com</strong>
          </p>
        </div>
        <Button id="admin-logout-btn" variant="outline" onClick={onLogout}>
          Sign Out Portal
        </Button>
      </div>

      {/* Tabs */}
      <div className="border-b border-[#E5E7EB] flex gap-4">
        <button
          id="tab-inventory-btn"
          onClick={() => setActiveTab("inventory")}
          className={`py-3 px-1 text-sm font-semibold border-b-2 transition-all duration-150 cursor-pointer ${
            activeTab === "inventory"
              ? "border-[#1D4ED8] text-[#1D4ED8]"
              : "border-transparent text-[#6B7280] hover:text-[#111827]"
          }`}
        >
          Ticket Inventory Controller
        </button>
        <button
          id="tab-bookings-btn"
          onClick={() => setActiveTab("bookings")}
          className={`py-3 px-1 text-sm font-semibold border-b-2 transition-all duration-150 cursor-pointer ${
            activeTab === "bookings"
              ? "border-[#1D4ED8] text-[#1D4ED8]"
              : "border-transparent text-[#6B7280] hover:text-[#111827]"
          }`}
        >
          Unified B2B Booking Viewer ({bookings.length})
        </button>
      </div>

      {activeTab === "inventory" ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Inventory Manager Form */}
          <div className="lg:col-span-1">
            <Card id="inventory-form-card" className="sticky top-4">
              <h3 className="text-base font-bold text-[#111827] mb-4 pb-2 border-b border-[#E5E7EB] flex items-center gap-2">
                <Plane className="h-4 w-4 text-[#1D4ED8]" />
                {isEditing ? "Edit B2B Flight Ticket" : "Publish New Ticket"}
              </h3>

              {formError && (
                <div className="mb-4">
                  <Alert id="form-error-alert" type="error" message={formError} onClose={() => setFormError("")} />
                </div>
              )}
              {formSuccess && (
                <div className="mb-4">
                  <Alert id="form-success-alert" type="success" message={formSuccess} onClose={() => setFormSuccess("")} />
                </div>
              )}

              <form onSubmit={handleCreateOrUpdateTicket} className="space-y-4">
                <Input
                  id="form-route-input"
                  label="Flight Route"
                  placeholder="e.g., London to New York"
                  value={route}
                  onChange={(e) => setRoute(e.target.value)}
                  required
                />

                <Input
                  id="form-carrier-input"
                  label="Airline / Carrier"
                  placeholder="e.g., British Airways"
                  value={carrier}
                  onChange={(e) => setCarrier(e.target.value)}
                  required
                />

                <Input
                  id="form-datetime-input"
                  label="Departure Date & Time"
                  type="datetime-local"
                  value={dateTime}
                  onChange={(e) => setDateTime(e.target.value)}
                  required
                />

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    id="form-price-input"
                    label="Seat Price ($)"
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    required
                  />

                  <Input
                    id="form-seats-input"
                    label="Total Seats"
                    type="number"
                    value={totalSeats}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setTotalSeats(val);
                      if (!isEditing) setAvailableSeats(val);
                    }}
                    required
                  />
                </div>

                {isEditing && (
                  <Input
                    id="form-avail-seats-input"
                    label="Available Seats (Currently)"
                    type="number"
                    value={availableSeats}
                    onChange={(e) => setAvailableSeats(Number(e.target.value))}
                    required
                  />
                )}

                <div className="flex gap-3 pt-2">
                  <Button
                    id="submit-ticket-btn"
                    type="submit"
                    className="flex-1"
                    disabled={submitting}
                  >
                    {submitting ? <LoadingSpinner size="sm" /> : isEditing ? "Update Ticket" : "Publish Flight"}
                  </Button>
                  {isEditing && (
                    <Button
                      id="cancel-edit-btn"
                      variant="outline"
                      onClick={resetForm}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </form>
            </Card>
          </div>

          {/* Ticket Listing Table */}
          <div className="lg:col-span-2">
            <div className="bg-white border border-[#E5E7EB] rounded-lg p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-base font-bold text-[#111827]">
                  Active Global Tickets ({tickets.length})
                </h3>
                <span className="text-xs text-[#6B7280] font-mono flex items-center gap-1.5 bg-gray-50 px-2.5 py-1 rounded border border-[#E5E7EB]">
                  <RefreshCw className="h-3.5 w-3.5 animate-spin-slow text-[#1D4ED8]" />
                  Real-time Active Inventory Sync
                </span>
              </div>

              {loadingTickets ? (
                <div className="py-12">
                  <LoadingSpinner />
                </div>
              ) : tickets.length === 0 ? (
                <div className="py-12 text-center text-[#6B7280] border-2 border-dashed border-[#E5E7EB] rounded-lg">
                  No active tickets published. Create your first ticket flight layout.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-[#E5E7EB]">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Carrier</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Route</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Departure</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Price</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Capacity</th>
                        <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5E7EB] bg-white">
                      {tickets.map((t) => (
                        <tr key={t.id} className="hover:bg-gray-50 transition-all duration-150">
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-gray-800">
                            {t.carrier}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-[#111827] font-semibold">
                            {t.route}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-xs text-[#6B7280]">
                            {t.dateTime ? new Date(t.dateTime).toLocaleString() : "Not specified"}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-[#111827] font-bold">
                            ${t.price}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm">
                            <span className="font-semibold text-blue-600">{t.availableSeats}</span>
                            <span className="text-gray-400"> / {t.totalSeats}</span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium space-x-2">
                            <button
                              id={`edit-ticket-btn-${t.id}`}
                              onClick={() => handleEditClick(t)}
                              className="text-gray-500 hover:text-[#1D4ED8] transition-colors p-1 bg-gray-100 hover:bg-blue-50 rounded"
                              title="Edit Flight details"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              id={`delete-ticket-btn-${t.id}`}
                              onClick={() => handleDeleteTicket(t.id)}
                              className="text-gray-500 hover:text-red-600 transition-colors p-1 bg-gray-100 hover:bg-red-50 rounded"
                              title="Delete Flight"
                            >
                              <Trash2 className="h-4 w-4" />
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
        </div>
      ) : (
        /* Unified Booking Viewer */
        <div className="bg-white border border-[#E5E7EB] rounded-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-base font-bold text-[#111827]">
                Unified Agency Bookings Stream
              </h3>
              <p className="text-xs text-[#6B7280] mt-1">
                Real-time booking orders submitted across Web and Android B2B clients
              </p>
            </div>
            <span className="text-xs text-[#6B7280] font-mono flex items-center gap-1.5 bg-gray-50 px-2.5 py-1 rounded border border-[#E5E7EB]">
              <RefreshCw className="h-3.5 w-3.5 animate-spin-slow text-[#1D4ED8]" />
              Sync Enabled
            </span>
          </div>

          {loadingBookings ? (
            <div className="py-12">
              <LoadingSpinner />
            </div>
          ) : bookings.length === 0 ? (
            <div className="py-12 text-center text-[#6B7280] border-2 border-dashed border-[#E5E7EB] rounded-lg">
              No agency booking transactions currently placed. Live bookings show here.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-[#E5E7EB]">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Booking ID</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Flight / ID</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Agent Partner</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Passenger Details</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Attachments</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Control Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB] bg-white">
                  {bookings.map((b) => (
                    <tr key={b.bookingId} className="hover:bg-gray-50 transition-all duration-150">
                      <td className="px-4 py-3 whitespace-nowrap text-xs font-mono font-bold text-gray-500">
                        #{String(b.bookingId || "").substring(0, 8)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm font-semibold text-[#111827]">
                          {tickets.find((t) => t.id === b.ticketId)?.route || "Custom / Syncing Flight"}
                        </div>
                        <div className="text-xs text-[#6B7280] font-mono">
                          ID: {String(b.ticketId || "").substring(0, 8)}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm font-semibold text-[#111827]">{b.agentName}</div>
                        <div className="text-xs text-gray-500">{b.agentEmail}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm font-semibold text-[#111827]">{b.passengerName}</div>
                        <div className="text-xs text-[#6B7280] font-mono">Passport: {b.passengerPassport}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap space-x-2">
                        {b.passengerPhotoUrl ? (
                          <button
                            id={`view-pass-photo-${b.bookingId}`}
                            onClick={() =>
                              setPhotoModal({
                                isOpen: true,
                                title: `Passenger Photo: ${b.passengerName}`,
                                imgUrl: b.passengerPhotoUrl,
                              })
                            }
                            className="inline-flex items-center gap-1 text-xs text-[#1D4ED8] hover:underline font-semibold bg-blue-50 px-2 py-1 rounded cursor-pointer"
                          >
                            Passenger
                          </button>
                        ) : (
                          <span className="text-xs text-gray-400">No Photo</span>
                        )}
                        {b.passportPhotoUrl ? (
                          <button
                            id={`view-passport-photo-${b.bookingId}`}
                            onClick={() =>
                              setPhotoModal({
                                isOpen: true,
                                title: `Passport Document: ${b.passengerName}`,
                                imgUrl: b.passportPhotoUrl,
                              })
                            }
                            className="inline-flex items-center gap-1 text-xs text-[#1D4ED8] hover:underline font-semibold bg-gray-100 px-2 py-1 rounded cursor-pointer"
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
                      <td className="px-4 py-3 whitespace-nowrap text-right text-sm">
                        <Button
                          id={`toggle-status-btn-${b.bookingId}`}
                          variant={b.status === "Confirmed" ? "secondary" : "primary"}
                          onClick={() => handleToggleBookingStatus(b.bookingId, b.status)}
                          className="text-xs py-1 px-3"
                        >
                          {b.status === "Confirmed" ? "Mark Pending" : "Confirm Order"}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Image Preview Modal */}
      {photoModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative bg-white rounded-lg max-w-lg w-full p-6 border border-[#E5E7EB]">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-base font-bold text-[#111827]">{photoModal.title}</h4>
              <button
                id="close-photo-modal-btn"
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
                id="modal-close-btn"
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
