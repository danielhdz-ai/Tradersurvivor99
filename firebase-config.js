// Firebase configuration
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBWX_li52qXOfsee0v6dEX6TsTre5nsyJQ",
  authDomain: "tradersurvivor99.firebaseapp.com",
  projectId: "tradersurvivor99",
  storageBucket: "tradersurvivor99.firebasestorage.app",
  messagingSenderId: "321644861145",
  appId: "1:321644861145:web:4adf78d89de42ab14650c8",
  measurementId: "G-CS7ST78JQT"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const analytics = getAnalytics(app);

export default app;
