// Firebase setup for Polokwane Service Delivery System

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// IMPORTANT:
// Go to https://console.firebase.google.com
// Create a new Firebase project (example: "polokwane-service-delivery")
// Then go to Project Settings → scroll to "Your apps" → "Web app" → copy the config.
// Replace the placeholders below with your real values.

const firebaseConfig = {
  apiKey: "YOUR_FIREBASE_API_KEY",
  authDomain: "YOUR_FIREBASE_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_FIREBASE_PROJECT_ID",
  storageBucket: "YOUR_FIREBASE_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
