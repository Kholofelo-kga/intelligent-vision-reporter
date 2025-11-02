// Firebase configuration for Polokwane Service Delivery AI System
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Your Firebase config from console
const firebaseConfig = {
  apiKey: "AIzaSyBfPQ5sItGulh50GXA6xrIbMvTucEBowM8",
  authDomain: "polokwane-service-delivery.firebaseapp.com",
  projectId: "polokwane-service-delivery",
  storageBucket: "polokwane-service-delivery.firebasestorage.app",
  messagingSenderId: "1084668032255",
  appId: "1:1084668032255:web:c11ab3b1fefffce32cc8ca"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
