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

