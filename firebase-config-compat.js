// Firebase configuration (compatibility version)
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
firebase.initializeApp(firebaseConfig);

// Initialize Firebase services
const auth = firebase.auth();
const db = firebase.firestore();
const analytics = firebase.analytics();
