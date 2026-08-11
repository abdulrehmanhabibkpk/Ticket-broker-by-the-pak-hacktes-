import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, setDoc } from "firebase/firestore";
import fs from "fs";

const configPath = "firebase-applet-config.json";
const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
const app = initializeApp(config);
const db = getFirestore(app);

async function check() {
  // We can't list collections easily in client SDK, so let's try some common ones
  const collections = ["hotel_bookings", "hotel", "hotelBookings", "HotelBookings", "book_hotel", "reservations", "hotel_reservations", "umrah_packages", "umrah_bookings", "ledgers", "tickets"];
  for (const c of collections) {
    try {
      const snap = await getDocs(collection(db, c));
      console.log(`Collection ${c} has ${snap.size} documents.`);
    } catch(e) {
      console.error(c, e.message);
    }
  }
}
check().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
