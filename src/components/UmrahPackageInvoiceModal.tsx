import React from "react";
import { UmrahBooking, UmrahPackage } from "../types";
import { X, Printer, Plane, Building2, Bus, Users } from "lucide-react";

interface UmrahPackageInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: UmrahBooking | null;
  pkg?: UmrahPackage | null;
}

export const UmrahPackageInvoiceModal: React.FC<UmrahPackageInvoiceModalProps> = ({
  isOpen,
  onClose,
  booking,
  pkg,
}) => {
  if (!isOpen || !booking) return null;

  const handlePrint = () => {
    window.print();
  };

  // Dates formatting
  const createdDateStr = booking.timestamp
    ? new Date(
        typeof booking.timestamp === "object" && "seconds" in booking.timestamp
          ? booking.timestamp.seconds * 1000
          : booking.timestamp
      ).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }) + " 11:00"
    : "15-Aug-2026 11:00";

  const voucherNo = `MILLATAZ_${booking.bookingId.substring(0, 6).toUpperCase()}`;
  const pnrCode = `BQK${booking.bookingId.substring(0, 3).toUpperCase()}`;
  const ticketNo = `2149762${booking.bookingId.substring(0, 6).replace(/[^0-9]/g, "8") || "568054"}`;

  // Default flight info if pkg missing
  const depFlight = pkg?.flightNoDep || "PK739";
  const retFlight = pkg?.flightNoRet || "PK740";
  const airline = pkg?.airline || "PIA (Pakistan International Airlines)";
  const hotelMakkah = pkg?.hotelMakkah || "LAND PREMIUM or similar (Makkah)";
  const hotelMadinah = pkg?.hotelMadinah || "WALID WASAL or similar (Madinah)";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      
      {/* Container box */}
      <div className="relative bg-white rounded-xl max-w-4xl w-full p-6 shadow-2xl my-6 border border-gray-300 print:border-none print:shadow-none print:p-0 print:m-0 print:w-full print:max-w-none">
        
        {/* Top bar controls (Hidden when printing) */}
        <div className="flex justify-between items-center pb-4 mb-4 border-b border-gray-200 print:hidden">
          <div className="flex items-center gap-2">
            <span className="bg-[#b45309] text-white text-xs font-bold px-2.5 py-1 rounded uppercase">
              UMRAH GROUP PACKAGE VOUCHER
            </span>
            <span className="text-xs font-mono text-gray-500 font-bold">
              Ref #{booking.bookingId.substring(0, 8)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="bg-[#b45309] hover:bg-[#92400e] text-white px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
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

        {/* PRINTABLE VOUCHER CONTENT - EXACT REPLICA OF THE IMAGE */}
        <div id="printable-umrah-voucher" className="bg-white text-gray-900 font-sans text-xs p-4 border border-gray-300 print:border-none">
          
          {/* 1. TOP BRANDING HEADER */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-3 border-b-2 border-gray-800 gap-2">
            <div className="flex items-center gap-2">
              <div className="bg-amber-600 text-white font-black text-xl px-2 py-1 tracking-tighter rounded">
                AZ
              </div>
              <div>
                <h2 className="text-lg font-black tracking-tight text-amber-800 uppercase leading-none">
                  A ZOWAR <span className="text-gray-800 text-xs font-bold">UMRAH CO.</span>
                </h2>
                <span className="text-[10px] text-gray-500 font-semibold tracking-wider">ISO: F1301</span>
              </div>
            </div>

            <div className="text-right">
              <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-wide uppercase">
                GOLDEN TRIP TRAVELS & TOURS
              </h1>
              <p className="text-[11px] font-bold text-amber-700">Licensed Hajj & Umrah Travel Group</p>
            </div>
          </div>

          {/* 2. VOUCHER METADATA BAR */}
          <div className="py-2 border-b border-gray-400 text-[11px] flex flex-wrap justify-between items-center bg-gray-50 px-2 my-2 font-mono">
            <div>
              <span className="font-bold text-gray-700">Voucher no:</span>{" "}
              <span className="font-bold text-amber-800">{voucherNo}</span>
            </div>
            <div>
              <span className="font-bold text-gray-700">user id:</span> <span className="font-bold text-gray-900">128</span>
            </div>
            <div>
              <span className="font-bold text-gray-700">status:</span> <span className="font-bold text-green-700">1 (Confirmed)</span>
            </div>
            <div>
              <span className="font-bold text-gray-700">created on:</span>{" "}
              <span className="font-bold text-gray-900">{createdDateStr}</span>
            </div>
          </div>

          {/* VOUCHER NOTES */}
          <div className="mb-4 text-[11px] font-semibold text-gray-800">
            <span className="font-bold text-amber-900">Voucher notes:</span> Zavia Travels (PVT) Ltd Hajj Umrah Service &bull; Agent: {booking.agentName || "B2B Travel Agent"} ({booking.agentEmail})
          </div>

          {/* 3. FLIGHT ITINERARY SECTION */}
          <div className="mb-6">
            <div className="flex items-center gap-1.5 mb-1 text-sky-800">
              <Plane className="h-4 w-4 transform -rotate-45" />
              <span className="font-black text-xs uppercase tracking-wide">Flight Schedule ({airline})</span>
            </div>
            <div className="border border-gray-800 rounded-xs overflow-hidden">
              <table className="w-full text-center border-collapse text-[11px]">
                <thead>
                  <tr className="bg-gray-100 border-b border-gray-800 font-bold text-gray-900">
                    <th className="p-1 border-r border-gray-400">flight no</th>
                    <th className="p-1 border-r border-gray-400">takeoff port</th>
                    <th className="p-1 border-r border-gray-400">takeoff date</th>
                    <th className="p-1 border-r border-gray-400">takeoff time</th>
                    <th className="p-1 border-r border-gray-400">landing port</th>
                    <th className="p-1 border-r border-gray-400">landing date</th>
                    <th className="p-1 border-r border-gray-400">landing time</th>
                    <th className="p-1">notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-300 font-mono">
                  <tr>
                    <td className="p-1.5 border-r border-gray-400 font-bold">{depFlight}</td>
                    <td className="p-1.5 border-r border-gray-400">MUX / LHE</td>
                    <td className="p-1.5 border-r border-gray-400">01-Mar-2026</td>
                    <td className="p-1.5 border-r border-gray-400">22:50:00</td>
                    <td className="p-1.5 border-r border-gray-400">JED</td>
                    <td className="p-1.5 border-r border-gray-400">02-Mar-2026</td>
                    <td className="p-1.5 border-r border-gray-400">01:50:00</td>
                    <td className="p-1.5 font-sans text-left text-[10px]">Confirmed Dep</td>
                  </tr>
                  <tr>
                    <td className="p-1.5 border-r border-gray-400 font-bold">{retFlight}</td>
                    <td className="p-1.5 border-r border-gray-400">JED / MED</td>
                    <td className="p-1.5 border-r border-gray-400">23-Mar-2026</td>
                    <td className="p-1.5 border-r border-gray-400">03:50:00</td>
                    <td className="p-1.5 border-r border-gray-400">MUX / LHE</td>
                    <td className="p-1.5 border-r border-gray-400">23-Mar-2026</td>
                    <td className="p-1.5 border-r border-gray-400">10:15:00</td>
                    <td className="p-1.5 font-sans text-left text-[10px]">Confirmed Ret</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* 4. HOTEL ACCOMMODATION SECTION */}
          <div className="mb-6">
            <div className="flex items-center gap-1.5 mb-1 text-emerald-800">
              <Building2 className="h-4 w-4" />
              <span className="font-black text-xs uppercase tracking-wide">Hotel Accommodation</span>
            </div>
            <div className="border border-gray-800 rounded-xs overflow-hidden">
              <table className="w-full text-center border-collapse text-[11px]">
                <thead>
                  <tr className="bg-gray-100 border-b border-gray-800 font-bold text-gray-900">
                    <th className="p-1 border-r border-gray-400">city</th>
                    <th className="p-1 border-r border-gray-400 text-left pl-2">hotel name</th>
                    <th className="p-1 border-r border-gray-400">checking date</th>
                    <th className="p-1 border-r border-gray-400">checkout date</th>
                    <th className="p-1 border-r border-gray-400">room type</th>
                    <th className="p-1 border-r border-gray-400">no of rooms</th>
                    <th className="p-1 border-r border-gray-400">total nights</th>
                    <th className="p-1">notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-300">
                  <tr>
                    <td className="p-1.5 border-r border-gray-400 font-bold capitalize">makkah</td>
                    <td className="p-1.5 border-r border-gray-400 text-left pl-2 font-semibold">{hotelMakkah}</td>
                    <td className="p-1.5 border-r border-gray-400 font-mono">02-Mar-2026</td>
                    <td className="p-1.5 border-r border-gray-400 font-mono">06-Mar-2026</td>
                    <td className="p-1.5 border-r border-gray-400 capitalize">shared / quad</td>
                    <td className="p-1.5 border-r border-gray-400 font-mono">1</td>
                    <td className="p-1.5 border-r border-gray-400 font-mono">04</td>
                    <td className="p-1.5 text-left text-[10px]">-</td>
                  </tr>
                  <tr>
                    <td className="p-1.5 border-r border-gray-400 font-bold capitalize">madina</td>
                    <td className="p-1.5 border-r border-gray-400 text-left pl-2 font-semibold">{hotelMadinah}</td>
                    <td className="p-1.5 border-r border-gray-400 font-mono">06-Mar-2026</td>
                    <td className="p-1.5 border-r border-gray-400 font-mono">14-Mar-2026</td>
                    <td className="p-1.5 border-r border-gray-400 capitalize">shared / quad</td>
                    <td className="p-1.5 border-r border-gray-400 font-mono">1</td>
                    <td className="p-1.5 border-r border-gray-400 font-mono">08</td>
                    <td className="p-1.5 text-left text-[10px]">-</td>
                  </tr>
                  <tr>
                    <td className="p-1.5 border-r border-gray-400 font-bold capitalize">makkah</td>
                    <td className="p-1.5 border-r border-gray-400 text-left pl-2 font-semibold">{hotelMakkah}</td>
                    <td className="p-1.5 border-r border-gray-400 font-mono">14-Mar-2026</td>
                    <td className="p-1.5 border-r border-gray-400 font-mono">23-Mar-2026</td>
                    <td className="p-1.5 border-r border-gray-400 capitalize">shared / quad</td>
                    <td className="p-1.5 border-r border-gray-400 font-mono">1</td>
                    <td className="p-1.5 border-r border-gray-400 font-mono">10</td>
                    <td className="p-1.5 text-left text-[10px]">-</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* 5. TRANSPORT / TRANSFER ITINERARY SECTION */}
          <div className="mb-6">
            <div className="flex items-center gap-1.5 mb-1 text-purple-800">
              <Bus className="h-4 w-4" />
              <span className="font-black text-xs uppercase tracking-wide">Transport & Transfers</span>
            </div>
            <div className="border border-gray-800 rounded-xs overflow-hidden">
              <table className="w-full text-center border-collapse text-[11px]">
                <thead>
                  <tr className="bg-gray-100 border-b border-gray-800 font-bold text-gray-900">
                    <th className="p-1 border-r border-gray-400">transfer date</th>
                    <th className="p-1 border-r border-gray-400">from point</th>
                    <th className="p-1 border-r border-gray-400">to point</th>
                    <th className="p-1 border-r border-gray-400">vehicle type</th>
                    <th className="p-1 border-r border-gray-400">Total vehicles</th>
                    <th className="p-1">notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-300">
                  <tr>
                    <td className="p-1.5 border-r border-gray-400 font-mono">02-Mar-2026</td>
                    <td className="p-1.5 border-r border-gray-400">Jeddah airport</td>
                    <td className="p-1.5 border-r border-gray-400">Makkah city</td>
                    <td className="p-1.5 border-r border-gray-400">Air-Conditioned Bus</td>
                    <td className="p-1.5 border-r border-gray-400 font-mono">1</td>
                    <td className="p-1.5 text-left text-[10px]">-</td>
                  </tr>
                  <tr>
                    <td className="p-1.5 border-r border-gray-400 font-mono">06-Mar-2026</td>
                    <td className="p-1.5 border-r border-gray-400">Makkah city</td>
                    <td className="p-1.5 border-r border-gray-400">Madina city</td>
                    <td className="p-1.5 border-r border-gray-400">Air-Conditioned Bus</td>
                    <td className="p-1.5 border-r border-gray-400 font-mono">1</td>
                    <td className="p-1.5 text-left text-[10px]">-</td>
                  </tr>
                  <tr>
                    <td className="p-1.5 border-r border-gray-400 font-mono">14-Mar-2026</td>
                    <td className="p-1.5 border-r border-gray-400">Madina city</td>
                    <td className="p-1.5 border-r border-gray-400">Makkah city</td>
                    <td className="p-1.5 border-r border-gray-400">Air-Conditioned Bus</td>
                    <td className="p-1.5 border-r border-gray-400 font-mono">1</td>
                    <td className="p-1.5 text-left text-[10px]">-</td>
                  </tr>
                  <tr>
                    <td className="p-1.5 border-r border-gray-400 font-mono">23-Mar-2026</td>
                    <td className="p-1.5 border-r border-gray-400">Makkah city</td>
                    <td className="p-1.5 border-r border-gray-400">Jeddah airport</td>
                    <td className="p-1.5 border-r border-gray-400">Air-Conditioned Bus</td>
                    <td className="p-1.5 border-r border-gray-400 font-mono">1</td>
                    <td className="p-1.5 text-left text-[10px]">-</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* 6. PASSENGER DETAILS LIST SECTION */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5 text-amber-800">
                <Users className="h-4 w-4" />
                <span className="font-black text-xs uppercase tracking-wide">Passenger Manifest</span>
              </div>
              <div className="text-xs font-bold text-gray-800">
                adults: <span className="font-extrabold text-amber-800">1</span> &nbsp;&bull;&nbsp; 
                children: <span className="font-extrabold text-amber-800">0</span> &nbsp;&bull;&nbsp; 
                infants: <span className="font-extrabold text-amber-800">0</span>
              </div>
            </div>

            <div className="border border-gray-800 rounded-xs overflow-hidden">
              <table className="w-full text-center border-collapse text-[11px]">
                <thead>
                  <tr className="bg-gray-100 border-b border-gray-800 font-bold text-gray-900">
                    <th className="p-1 border-r border-gray-400 w-12">id</th>
                    <th className="p-1 border-r border-gray-400 text-left pl-3">client name</th>
                    <th className="p-1 border-r border-gray-400">passport no</th>
                    <th className="p-1 border-r border-gray-400">age group</th>
                    <th className="p-1 border-r border-gray-400">code</th>
                    <th className="p-1 border-r border-gray-400">ticket no</th>
                    <th className="p-1">PNR</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-300 font-mono">
                  <tr>
                    <td className="p-1.5 border-r border-gray-400 font-bold">11051655</td>
                    <td className="p-1.5 border-r border-gray-400 text-left pl-3 font-bold text-gray-900 font-sans uppercase">
                      {booking.passengerName}
                    </td>
                    <td className="p-1.5 border-r border-gray-400 font-bold text-amber-900">
                      {booking.passengerPassport}
                    </td>
                    <td className="p-1.5 border-r border-gray-400 font-sans">Adult</td>
                    <td className="p-1.5 border-r border-gray-400">75906</td>
                    <td className="p-1.5 border-r border-gray-400">{ticketNo}</td>
                    <td className="p-1.5 font-bold text-amber-800">{pnrCode}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* 7. PACKAGE PRICE SUMMARY */}
          <div className="mt-4 pt-3 border-t-2 border-gray-800 flex justify-between items-center bg-amber-50 p-3 rounded">
            <div>
              <p className="text-xs font-black text-amber-900 uppercase">{pkg?.days || "15 Days Executive Umrah Package"}</p>
              <p className="text-[10px] text-gray-600 font-medium">Includes Flight, Visa Processing, Hotel Stay, Transport & Ziyarat</p>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold text-gray-500 uppercase block">Total Package Fare</span>
              <span className="text-base sm:text-lg font-black text-amber-900 font-mono">
                PKR {pkg?.price ? pkg.price.toLocaleString() : "245,000"}.00
              </span>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
