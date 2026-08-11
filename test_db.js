import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import fs from "fs";

const configPath = "firebase-applet-config.json";
const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
const app = initializeApp(config);
const db = getFirestore(app);

async function check() {
  const collections = ["hotel_bookings", "hotelbookings", "hotels_bookings", "bookings", "hotels"];
  for (const c of collections) {
    try {
      const snap = await getDocs(collection(db, c));
      console.log(`Collection ${c} has ${snap.size} documents.`);
      if (snap.size > 0 && c !== "hotels") {
          snap.forEach(doc => {
              console.log(doc.id, doc.data());
          });
      }
    } catch(e) {
      console.error(c, e.message);
    }
  }
}
check();
