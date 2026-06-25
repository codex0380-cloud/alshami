/* ===================== Firebase Configuration ===================== */
/* بيانات مشروع Firebase — شاورما الشامي */

const firebaseConfig = {
  apiKey: "AIzaSyAmp5RT6anCjpPfYR7npSY6bcHRPBiEAMI",
  authDomain: "alshami-733a1.firebaseapp.com",
  databaseURL: "https://alshami-733a1-default-rtdb.firebaseio.com",
  projectId: "alshami-733a1",
  storageBucket: "alshami-733a1.firebasestorage.app",
  messagingSenderId: "170748434237",
  appId: "1:170748434237:web:538c729ff31c9b4c435754",
  measurementId: "G-6TMW53SK0D"
};

// Initialize Firebase (compat SDK)
firebase.initializeApp(firebaseConfig);
const db = firebase.database();
