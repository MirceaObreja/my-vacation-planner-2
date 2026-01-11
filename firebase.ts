
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Deine echten Firebase-Projektdaten wurden hier eingefügt
export const firebaseConfig = {
  apiKey: "AIzaSyAsVSbZ-FHX--N5BSxb_s0EuUxSmXArc5w",
  authDomain: "vacation-planner-8d8d5.firebaseapp.com",
  projectId: "vacation-planner-8d8d5",
  storageBucket: "vacation-planner-8d8d5.firebasestorage.app",
  messagingSenderId: "1040015360883",
  appId: "1:1040015360883:web:87916eda13fe1bfbdcbb06",
  measurementId: "G-LGZ75FB355"
};

export const isFirebaseConfigured = () => {
  return firebaseConfig.apiKey && firebaseConfig.apiKey !== "YOUR_API_KEY";
};

// Initialisierung
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
