import { Timestamp } from "firebase/firestore";

export interface Ticket {
  id: string;
  origin: string;
  destination: string;
  airline: string;
  departureDate: string;
  price: number;
  totalSeats: number;
  availableSeats: number;
  pnrPrefix: string;
}

export interface Booking {
  bookingId: string;
  ticketId: string;
  agentName: string;
  agentEmail: string;
  passengerName: string;
  passengerPassport: string;
  passengerPhotoUrl: string; // Base64 or storage URL
  passportPhotoUrl: string;  // Base64 or storage URL
  status: "Confirmed" | "Pending" | string;
  timestamp: Timestamp | any;
}

export interface LedgerTransaction {
  id: string;
  agentEmail: string;
  agentName: string;
  type: "Credit" | "Debit" | string; // Credit = Deposit, Debit = Ticket purchase
  amount: number;
  description: string;
  timestamp: Timestamp | any;
}

export interface SystemNotification {
  id: string;
  title: string;
  content: string;
  timestamp: Timestamp | any;
  type: "alert" | "info" | "promo" | string;
}

export interface UmrahPackage {
  id: string;
  days: string;
  airline: string;
  flightNoDep: string;
  flightNoRet: string;
  depDetails: string;
  retDetails: string;
  baggage: string;
  price: number;
  hotelMakkah: string;
  hotelMadinah: string;
  totalSeats: number;
  availableSeats: number;
}

export interface UmrahBooking {
  bookingId: string;
  packageId: string;
  agentName: string;
  agentEmail: string;
  passengerName: string;
  passengerPassport: string;
  passengerPhotoUrl: string; // Base64 or storage URL
  passportPhotoUrl: string;  // Base64 or storage URL
  status: "Confirmed" | "Pending" | string;
  timestamp: Timestamp | any;
}

export interface HotelListing {
  id: string;
  name: string;
  city: string;
  stars: number;
  distanceToHaram?: string;
  roomTypes: string;
  pricePerNight: number;
  totalRooms: number;
  availableRooms: number;
  imageUrl?: string;
  amenities?: string;
  description?: string;
}

export interface HotelBooking {
  bookingId: string;
  hotelId: string;
  hotelName: string;
  city: string;
  agentName: string;
  agentEmail: string;
  guestName: string;
  guestPhone: string;
  passportNo: string;
  checkInDate: string;
  checkOutDate: string;
  nights: number;
  roomType: string;
  numberOfRooms: number;
  totalCost: number;
  status: "Confirmed" | "Pending" | "Cancelled" | string;
  timestamp: Timestamp | any;
}

