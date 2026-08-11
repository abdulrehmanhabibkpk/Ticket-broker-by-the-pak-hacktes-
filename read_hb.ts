import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, setDoc } from "firebase/firestore";
import fs from "fs";

const configPath = "firebase-applet-config.json";
const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
const app = initializeApp(config);
const db = getFirestore(app);

async function check() {
    const snap = await getDocs(collection(db, "hotelBookings"));
    snap.forEach(d => console.log(d.id, d.data()));
}
check().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
