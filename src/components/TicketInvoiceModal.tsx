import React from "react";
import { Booking, Ticket } from "../types";
import { X, Printer, Plane } from "lucide-react";

interface TicketInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking | null;
  ticket?: Ticket | null;
}

export const TicketInvoiceModal: React.FC<TicketInvoiceModalProps> = ({
  isOpen,
  onClose,
  booking,
  ticket,
}) => {
  if (!isOpen || !booking) return null;

  const handlePrint = () => {
    window.print();
  };

  const totalPrice = ticket?.price || 45000;
  const baseFare = Math.round(totalPrice * 0.88);
  const taxesFees = totalPrice - baseFare;

  // Format booking date
  const bookingDateStr = booking.timestamp
    ? new Date(
        typeof booking.timestamp === "object" && "seconds" in booking.timestamp
          ? booking.timestamp.seconds * 1000
          : booking.timestamp
      ).toISOString().split("T")[0]
    : new Date().toISOString().split("T")[0];

  const pnrCode = ticket?.pnrPrefix
    ? `${ticket.pnrPrefix}${booking.bookingId.substring(0, 6).toUpperCase()}`
    : `SV${booking.bookingId.substring(0, 6).toUpperCase()}`;

  const ticketNo = `SV2053TCK${booking.bookingId.substring(0, 5).toUpperCase()}`;
  const invNo = `SV2053-${booking.bookingId.substring(0, 4).toUpperCase()}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      
      {/* Container box */}
      <div className="relative bg-white rounded-xl max-w-2xl w-full p-6 shadow-2xl my-6 border border-gray-300 print:border-none print:shadow-none print:p-0 print:m-0 print:w-full print:max-w-none">
        
        {/* Top bar controls (Hidden when printing) */}
        <div className="flex justify-between items-center pb-4 mb-4 border-b border-gray-200 print:hidden">
          <div className="flex items-center gap-2">
            <span className="bg-[#3b82f6] text-white text-xs font-bold px-2.5 py-1 rounded">
              E-TICKET INVOICE
            </span>
            <span className="text-xs font-mono text-gray-500 font-bold">
              Ref #{booking.bookingId.substring(0, 8)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
            >
              <Printer className="h-4 w-4" />
              <span>Print Invoice / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* PRINTABLE INVOICE CONTENT */}
        <div id="printable-ticket-invoice" className="bg-white text-gray-800 font-sans text-xs">
          
          {/* 1. TOP CURVED SKY BLUE BANNER */}
          <div className="relative bg-gradient-to-r from-[#38bdf8] via-[#0284c7] to-[#0369a1] text-white rounded-t-xl p-6 overflow-hidden">
            {/* Wave overlay SVG */}
            <div className="absolute inset-0 opacity-20 pointer-events-none">
              <svg className="w-full h-full" viewBox="0 0 500 150" preserveAspectRatio="none">
                <path d="M0,0 L500,0 L500,100 C300,150 150,50 0,100 Z" fill="#ffffff" />
              </svg>
            </div>

            <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              
              {/* Left Logo Area */}
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-white/20 rounded-full flex items-center justify-center border border-white/40 shadow-xs">
                  <Plane className="h-6 w-6 text-white transform -rotate-45" />
                </div>
                <div className="h-12 w-12 bg-black rounded-full flex items-center justify-center text-center p-1 border-2 border-white shadow-md">
                  <span className="text-[8px] font-extrabold uppercase leading-none text-white tracking-tighter">
                    YOUR<br />LOGO
                  </span>
                </div>
              </div>

              {/* Right Agency Contact Details */}
              <div className="text-left sm:text-right text-[11px] space-y-0.5">
                <h2 className="text-base font-black tracking-tight text-white uppercase">
                  Sky Voyage Airways
                </h2>
                <p className="text-sky-100">Lima, OH 45807</p>
                <p className="text-sky-100">info@skyvoyageairways.com</p>
                <p className="text-sky-100 font-mono">222 555 7777</p>
              </div>

            </div>
          </div>

          {/* 2. MAIN HEADLINE */}
          <div className="my-5 px-1">
            <h1 className="text-xl sm:text-2xl font-black text-[#2563eb] tracking-wide uppercase">
              INVOICE AIRLINE TICKET
            </h1>
          </div>

          {/* 3. TABLE 1: INVOICE NO & BILLING / PAYMENT DETAILS */}
          <div className="mb-5 border border-gray-400 rounded-sm overflow-hidden">
            {/* Header bar */}
            <div className="bg-[#3b82f6] text-white font-bold px-3 py-1.5 text-xs">
              Invoice No: {invNo}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-gray-400">
              {/* Billing Address */}
              <div className="p-3 space-y-1">
                <h4 className="font-extrabold text-gray-900 border-b border-gray-200 pb-1 mb-1">
                  Billing Address
                </h4>
                <p className="font-bold text-gray-800">{booking.agentName || "Valued B2B Travel Client"}</p>
                <p className="text-gray-600">{booking.agentEmail || "agent@skyvoyage.com"}</p>
                <p className="text-gray-600">Pakistan B2B Portal Branch</p>
              </div>

              {/* Payment Details */}
              <div className="p-3 space-y-1">
                <h4 className="font-extrabold text-gray-900 border-b border-gray-200 pb-1 mb-1">
                  Payment Details
                </h4>
                <div className="grid grid-cols-2 gap-1 text-[11px]">
                  <span className="font-semibold text-gray-600">Payment Date:</span>
                  <span className="font-mono text-gray-800">{bookingDateStr}</span>

                  <span className="font-semibold text-gray-600">Payment Method:</span>
                  <span className="text-gray-800">Ledger Balance Credit</span>

                  <span className="font-semibold text-gray-600">Card Number:</span>
                  <span className="font-mono text-gray-800">1234 5678 9876 5432</span>
                </div>
              </div>
            </div>
          </div>

          {/* 4. TABLE 2: PASSENGER DETAILS & FLIGHT DETAILS */}
          <div className="mb-5 border border-gray-400 rounded-sm overflow-hidden">
            <div className="grid grid-cols-2 bg-[#3b82f6] text-white font-bold px-3 py-1.5 text-xs divide-x divide-white/40">
              <div>Passenger Details</div>
              <div className="pl-3">Flight Details</div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-gray-400">
              
              {/* Passenger Column */}
              <div className="p-3">
                <table className="w-full text-left border-collapse text-[11px]">
                  <tbody>
                    <tr className="border-b border-gray-200">
                      <td className="py-1 font-semibold text-gray-600 w-1/3">Passenger Name:</td>
                      <td className="py-1 font-extrabold text-gray-900">{booking.passengerName}</td>
                    </tr>
                    <tr className="border-b border-gray-200">
                      <td className="py-1 font-semibold text-gray-600">Ticket Number:</td>
                      <td className="py-1 font-mono text-gray-800">{ticketNo}</td>
                    </tr>
                    <tr className="border-b border-gray-200">
                      <td className="py-1 font-semibold text-gray-600">Booking Reference:</td>
                      <td className="py-1 font-mono font-bold text-[#2563eb]">{pnrCode}</td>
                    </tr>
                    <tr className="border-b border-gray-200">
                      <td className="py-1 font-semibold text-gray-600">Class:</td>
                      <td className="py-1 font-bold text-gray-800">Economy</td>
                    </tr>
                    <tr>
                      <td className="py-1 font-semibold text-gray-600">Passport:</td>
                      <td className="py-1 font-mono text-gray-800">{booking.passengerPassport}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Flight Column */}
              <div className="p-3">
                <table className="w-full text-left border-collapse text-[11px]">
                  <tbody>
                    <tr className="border-b border-gray-200">
                      <td className="py-1 font-semibold text-gray-600 w-2/5">Flight Number:</td>
                      <td className="py-1 font-extrabold text-gray-900">
                        {ticket?.airline || "SV"} {ticket?.pnrPrefix || "SV"}123
                      </td>
                    </tr>
                    <tr className="border-b border-gray-200">
                      <td className="py-1 font-semibold text-gray-600">Departure Date & Time:</td>
                      <td className="py-1 text-gray-800">
                        {ticket?.departureDate || "2053-01-15"}, 08:00 AM
                      </td>
                    </tr>
                    <tr className="border-b border-gray-200">
                      <td className="py-1 font-semibold text-gray-600">Arrival Date & Time:</td>
                      <td className="py-1 text-gray-800">
                        {ticket?.departureDate || "2053-01-15"}, 10:30 AM
                      </td>
                    </tr>
                    <tr className="border-b border-gray-200">
                      <td className="py-1 font-semibold text-gray-600">From:</td>
                      <td className="py-1 font-bold text-gray-800">
                        {ticket?.origin || "Sky Voyage Airport"}
                      </td>
                    </tr>
                    <tr className="border-b border-gray-200">
                      <td className="py-1 font-semibold text-gray-600">To:</td>
                      <td className="py-1 font-bold text-gray-800">
                        {ticket?.destination || "Celestial Airport"}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-1 font-semibold text-gray-600">Seat / Baggage:</td>
                      <td className="py-1 text-gray-800">15F (Window) &bull; 20KG Check-in</td>
                    </tr>
                  </tbody>
                </table>
              </div>

            </div>
          </div>

          {/* 5. TABLE 3: FINANCIAL FARE BREAKDOWN */}
          <div className="mb-5 border border-gray-400 rounded-sm overflow-hidden">
            <table className="w-full text-left border-collapse text-[11px]">
              <tbody className="divide-y divide-gray-300">
                <tr>
                  <td className="p-2.5 font-semibold text-gray-700 w-1/2">Base Fare:</td>
                  <td className="p-2.5 font-bold text-gray-900">PKR {baseFare.toLocaleString()}.00</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-semibold text-gray-700">Taxes and Fees:</td>
                  <td className="p-2.5 font-bold text-gray-900">PKR {taxesFees.toLocaleString()}.00</td>
                </tr>
                <tr className="bg-blue-50 font-black">
                  <td className="p-2.5 text-xs text-[#2563eb]">Total Amount:</td>
                  <td className="p-2.5 text-xs text-[#2563eb]">PKR {totalPrice.toLocaleString()}.00</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 6. TABLE 4: IMPORTANT INFORMATION */}
          <div className="mb-6 border border-gray-400 rounded-sm overflow-hidden">
            <div className="bg-[#3b82f6] text-white font-bold px-3 py-1.5 text-xs">
              Important Information
            </div>
            <div className="p-3 space-y-1 text-[11px] text-gray-700 bg-white">
              <ul className="list-disc list-inside space-y-1">
                <li>This Invoice serves as your official electronic airline ticket.</li>
                <li>Please carry a valid passport / original CNIC for airport security check and check-in.</li>
                <li>Contact Sky Voyage Airways / B2B Helpdesk for any itinerary changes or cancellations.</li>
              </ul>
            </div>
          </div>

          {/* 7. FOOTER NOTE */}
          <div className="text-center pt-2 border-t border-gray-200">
            <p className="text-[11px] font-semibold text-gray-600 italic">
              Thank you for choosing Sky Voyage Airways. We wish you a pleasant journey!
            </p>
          </div>

        </div>

      </div>

    </div>
  );
};
