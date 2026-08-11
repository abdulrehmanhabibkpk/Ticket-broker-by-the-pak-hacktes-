import { Timestamp } from "firebase/firestore";

export interface Ticket {
  id: string;
  title: string;       // London to New York
  route: string;       // Mirror title for compatibility
  dateTime: string;    // String representation for simple parsing, or formatted
  price: number;
  availableSeats: number;
  totalSeats: number;
  carrier: string;     // Airline carrier
  airline: string;     // Mirror carrier for compatibility
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
