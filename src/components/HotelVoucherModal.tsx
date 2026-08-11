import React from "react";
import { HotelBooking, HotelListing } from "../types";
import { X, Printer, Building2, CheckCircle2 } from "lucide-react";

interface HotelVoucherModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: HotelBooking | null;
  hotel?: HotelListing | null;
}

export const HotelVoucherModal: React.FC<HotelVoucherModalProps> = ({
  isOpen,
  onClose,
  booking,
  hotel,
}) => {
  if (!isOpen || !booking) return null;

  const handlePrint = () => {
    window.print();
  };

  // Calculations
  const checkIn = new Date(booking.checkInDate || "2026-08-15");
  const checkOut = new Date(booking.checkOutDate || "2026-08-20");
  const diffTime = Math.max(1000 * 60 * 60 * 24, checkOut.getTime() - checkIn.getTime());
  const nightsCount = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const daysCount = nightsCount + 1;

  const formatDateStr = (dateObj: Date) => {
    const day = dateObj.getDate();
    const month = dateObj.toLocaleString("en-US", { month: "short" });
    const year = dateObj.getFullYear();
    return `${day} ${month} ${year}`;
  };

  const checkInFormatted = formatDateStr(checkIn);
  const checkOutFormatted = formatDateStr(checkOut);

  // Price calculations
  const totalCost = booking.totalCost || 50000;
  const numRooms = booking.numberOfRooms || 1;
  const costPerRoom = Math.round(totalCost / numRooms);
  const taxablePay = Math.round(costPerRoom * 0.85);
  const gstService = costPerRoom - taxablePay;

  const bookingRef = `ACC${booking.bookingId.substring(0, 10).toUpperCase()}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      
      {/* Container box */}
      <div className="relative bg-white rounded-xl max-w-3xl w-full p-6 shadow-2xl my-6 border border-gray-300 print:border-none print:shadow-none print:p-0 print:m-0 print:w-full print:max-w-none">
        
        {/* Top bar controls (Hidden when printing) */}
        <div className="flex justify-between items-center pb-4 mb-4 border-b border-gray-200 print:hidden">
          <div className="flex items-center gap-2">
            <span className="bg-[#5da855] text-white text-xs font-bold px-2.5 py-1 rounded uppercase">
              HOTEL RESERVATION VOUCHER
            </span>
            <span className="text-xs font-mono text-gray-500 font-bold">
              Ref #{booking.bookingId.substring(0, 8)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="bg-[#5da855] hover:bg-[#4d8f45] text-white px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
            >
              <Printer className="h-4 w-4" />
              <span>Print Voucher / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* PRINTABLE VOUCHER CONTENT - EXACT REPLICA OF THE IMAGE */}
        <div id="printable-hotel-voucher" className="bg-white text-gray-900 font-sans text-xs border-2 border-gray-800 p-1">
          
          {/* 1. GREEN HEADER: Voucher Format */}
          <div className="bg-[#8ec677] text-gray-900 font-black text-center py-1.5 text-sm uppercase tracking-wide border-b-2 border-gray-800">
            Voucher Format
          </div>

          {/* 2. LOGO + HOTEL NAME HEADER */}
          <div className="flex items-center justify-between p-4 border-b-2 border-gray-800 bg-white">
            <div className="flex items-center gap-2">
              {/* Vyapar style logo */}
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 flex items-center justify-center relative">
                  <div className="w-0 h-0 border-l-[14px] border-l-transparent border-r-[14px] border-r-transparent border-b-[24px] border-b-[#f43f5e] transform -rotate-12"></div>
                  <div className="w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-b-[18px] border-b-[#eab308] absolute top-1"></div>
                </div>
                <span className="text-[10px] font-black text-[#6366f1] tracking-wider uppercase mt-1">Vyapar</span>
              </div>
            </div>

            <div className="text-center flex-1">
              <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
                {booking.hotelName || hotel?.name || "Hotel Name"}
              </h1>
              <p className="text-xs font-bold text-gray-600">
                {booking.city || hotel?.city || "Makkah / Madinah"} &bull; {hotel?.stars || 5} Star Luxury Stay
              </p>
            </div>

            <div className="w-16"></div>
          </div>

          {/* 3. BOOKING DETAILS GRID TABLE */}
          <table className="w-full text-left border-collapse border-b-2 border-gray-800 text-[11px]">
            <tbody>
              <tr className="border-b border-gray-800">
                <td className="p-1.5 font-bold text-gray-900 border-r border-gray-800 w-1/6 bg-gray-50">Booking No:</td>
                <td className="p-1.5 font-mono font-bold text-gray-800 border-r border-gray-800 w-2/6">{bookingRef}</td>
                <td className="p-1.5 font-bold text-gray-900 border-r border-gray-800 w-1/6 bg-gray-50">Booking Name:</td>
                <td className="p-1.5 font-bold text-gray-800 w-2/6">{booking.guestName}</td>
              </tr>
              <tr className="border-b border-gray-800">
                <td className="p-1.5 font-bold text-gray-900 border-r border-gray-800 bg-gray-50">Contact Number:</td>
                <td className="p-1.5 font-mono text-gray-800 border-r border-gray-800">{booking.guestPhone || "8822665599"}</td>
                <td className="p-1.5 font-bold text-gray-900 border-r border-gray-800 bg-gray-50">Mobile Number:</td>
                <td className="p-1.5 font-mono text-gray-800">{booking.guestPhone || "9922663388"}</td>
              </tr>
              <tr className="border-b border-gray-800">
                <td className="p-1.5 font-bold text-gray-900 border-r border-gray-800 bg-gray-50" rowSpan={2}>State Address:</td>
                <td className="p-1.5 text-gray-800 border-r border-gray-800" rowSpan={2}>
                  {hotel?.distanceToHaram || "Prime Location, KSA"}
                </td>
                <td className="p-1.5 font-bold text-gray-900 border-r border-gray-800 bg-gray-50">Email:</td>
                <td className="p-1.5 font-mono text-gray-800">{booking.agentEmail || "agent@travel.com"}</td>
              </tr>
              <tr className="border-b border-gray-800">
                <td className="p-1.5 font-bold text-gray-900 border-r border-gray-800 bg-gray-50">No of Guest:</td>
                <td className="p-1.5 font-bold text-gray-800">1 Primary (+ Family)</td>
              </tr>
              <tr className="border-b-2 border-gray-800">
                <td className="p-1.5 font-bold text-gray-900 border-r border-gray-800 bg-gray-50">GSTIN / Ref:</td>
                <td className="p-1.5 font-mono text-gray-800 border-r border-gray-800">22AAAAA0000A1ZS</td>
                <td className="p-1.5 font-bold text-gray-900 border-r border-gray-800 bg-gray-50">No of room:</td>
                <td className="p-1.5 font-bold text-gray-800">{booking.numberOfRooms} Room(s)</td>
              </tr>
            </tbody>
          </table>

          {/* 4. HIGHLIGHTED DATES BLOCK (Check-in / Check-out / Number of Days) */}
          <div className="grid grid-cols-3 text-center border-b-2 border-gray-800 divide-x-2 divide-gray-800 bg-white">
            <div className="p-3">
              <span className="text-xs font-bold text-gray-700 block">Check-in</span>
              <span className="text-lg sm:text-xl font-black text-gray-900 mt-1 block">
                {checkInFormatted}
              </span>
            </div>
            <div className="p-3">
              <span className="text-xs font-bold text-gray-700 block">Check-out</span>
              <span className="text-lg sm:text-xl font-black text-gray-900 mt-1 block">
                {checkOutFormatted}
              </span>
            </div>
            <div className="p-3">
              <span className="text-xs font-bold text-gray-700 block">Number of Days</span>
              <span className="text-lg sm:text-xl font-black text-gray-900 mt-1 block">
                {daysCount} day {nightsCount} Night
              </span>
            </div>
          </div>

          {/* 5. PACKAGE DETAILS TABLE */}
          <div className="border-b-2 border-gray-800">
            <div className="bg-[#8ec677] text-gray-900 font-black text-center py-1 text-xs uppercase tracking-wide border-b border-gray-800">
              Package Details
            </div>
            <table className="w-full text-center border-collapse text-[11px]">
              <thead>
                <tr className="border-b border-gray-800 bg-gray-100 font-bold">
                  <th className="p-1.5 border-r border-gray-800 text-left pl-3">Room Type</th>
                  <th className="p-1.5 border-r border-gray-800">Unit</th>
                  <th className="p-1.5 border-r border-gray-800">Quantity</th>
                  <th className="p-1.5 border-r border-gray-800">GST</th>
                  <th className="p-1.5 border-r border-gray-800">Amount</th>
                  <th className="p-1.5 border-r border-gray-800">Taxable Pay</th>
                  <th className="p-1.5">GST+Service</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-800">
                  <td className="p-1.5 border-r border-gray-800 text-left pl-3 font-bold">{booking.roomType}</td>
                  <td className="p-1.5 border-r border-gray-800">1</td>
                  <td className="p-1.5 border-r border-gray-800">{booking.numberOfRooms}</td>
                  <td className="p-1.5 border-r border-gray-800">18%</td>
                  <td className="p-1.5 border-r border-gray-800 font-mono">{costPerRoom}</td>
                  <td className="p-1.5 border-r border-gray-800 font-mono">{taxablePay}</td>
                  <td className="p-1.5 font-mono">{costPerRoom}</td>
                </tr>
                <tr className="bg-gray-50 font-black border-t-2 border-gray-800 text-xs">
                  <td colSpan={6} className="p-1.5 text-right pr-4 border-r border-gray-800 uppercase">
                    Total Payable Amount
                  </td>
                  <td className="p-1.5 font-mono text-gray-900">
                    PKR {totalCost.toLocaleString()}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 6. GUEST INFORMATION TABLE */}
          <div className="border-b-2 border-gray-800">
            <div className="bg-[#8ec677] text-gray-900 font-black text-center py-1 text-xs uppercase tracking-wide border-b border-gray-800">
              Guest Information
            </div>

            <div className="grid grid-cols-4 divide-x-2 divide-gray-800">
              <div className="col-span-3">
                <table className="w-full text-center border-collapse text-[11px]">
                  <thead>
                    <tr className="border-b border-gray-800 bg-gray-100 font-bold">
                      <th className="p-1.5 border-r border-gray-800 text-left pl-3">Guest Name</th>
                      <th className="p-1.5 border-r border-gray-800">Passport / Age</th>
                      <th className="p-1.5 border-r border-gray-800">Sex</th>
                      <th className="p-1.5">No of Pax</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-gray-200">
                      <td className="p-1.5 border-r border-gray-800 text-left pl-3 font-bold">{booking.guestName}</td>
                      <td className="p-1.5 border-r border-gray-800 font-mono">{booking.passportNo}</td>
                      <td className="p-1.5 border-r border-gray-800">M / F</td>
                      <td className="p-1.5">Adult</td>
                    </tr>
                    <tr className="border-b border-gray-200">
                      <td className="p-1.5 border-r border-gray-800 text-left pl-3 text-gray-600">Contact Person</td>
                      <td className="p-1.5 border-r border-gray-800 font-mono">{booking.guestPhone}</td>
                      <td className="p-1.5 border-r border-gray-800">Primary</td>
                      <td className="p-1.5">Lead Guest</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* QR Code / Verified Stamp box */}
              <div className="col-span-1 p-3 flex flex-col items-center justify-center bg-gray-50 text-center">
                <div className="w-20 h-20 bg-black flex items-center justify-center rounded p-1 text-white">
                  {/* Decorative QR code pattern */}
                  <div className="w-full h-full bg-white p-1 grid grid-cols-4 gap-0.5">
                    <div className="bg-black"></div>
                    <div className="bg-black"></div>
                    <div className="bg-white"></div>
                    <div className="bg-black"></div>
                    <div className="bg-white"></div>
                    <div className="bg-black"></div>
                    <div className="bg-black"></div>
                    <div className="bg-white"></div>
                    <div className="bg-black"></div>
                    <div className="bg-white"></div>
                    <div className="bg-black"></div>
                    <div className="bg-black"></div>
                    <div className="bg-black"></div>
                    <div className="bg-black"></div>
                    <div className="bg-white"></div>
                    <div className="bg-black"></div>
                  </div>
                </div>
                <span className="text-[9px] font-mono font-bold text-gray-600 mt-1 uppercase">VERIFIED VOUCHER</span>
              </div>
            </div>
          </div>

          {/* 7. PACKAGE INCLUDES */}
          <div className="border-b-2 border-gray-800">
            <div className="bg-[#8ec677] text-gray-900 font-black text-center py-1 text-xs uppercase tracking-wide border-b border-gray-800">
              Package Includes
            </div>
            <div className="p-2.5 text-[11px] grid grid-cols-2 gap-x-6 gap-y-1 bg-white font-medium">
              <div>1. Breakfast Buffet</div>
              <div>2. Swimming Pool & Gym</div>
              <div>3. Daily Housekeeping</div>
              <div>4. Haram Shuttle Service</div>
              <div>5. High-Speed WiFi</div>
              <div>6. Non-smoking Family Rooms</div>
              <div>7. Central Air Conditioning</div>
              <div>8. In-room Safety Deposit Box</div>
            </div>
          </div>

          {/* 8. TERMS & CONDITIONS */}
          <div className="border-b-2 border-gray-800">
            <div className="bg-[#8ec677] text-gray-900 font-black text-center py-1 text-xs uppercase tracking-wide border-b border-gray-800">
              Terms & Conditions
            </div>
            <div className="p-3 text-[10px] space-y-1 text-gray-800 bg-white">
              <p>1. All bookings must be made in advance through the official agent ledger portal.</p>
              <p>2. Bookings made with vouchers are non-refundable in cash once confirmed by hotel management.</p>
              <p>3. Vouchers are not refundable in cash or replaceable if lost, destroyed, or stolen.</p>
              <p>4. All vouchers must be presented by the bearer on arrival at the hotel reception along with valid passports.</p>
              <p>5. Any remaining amount is not exchangeable for cash or another voucher and will be automatically forfeited.</p>
            </div>
          </div>

          {/* 9. FOOTER */}
          <div className="text-center py-2 bg-gray-50 font-bold text-xs text-gray-900">
            Thanks for business with us!!! Please visit us again !!!
          </div>

        </div>

      </div>

    </div>
  );
};
