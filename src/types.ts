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

export interface UserProfile {
  uid: string;
  email: string;
  emailVerified: boolean;
  displayName: string;
  role: "admin" | "agent";
}
