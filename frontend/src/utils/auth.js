// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDWk027Iw9OYw6iL8f89yd-D35L1oHWt6I",
  authDomain: "fba-shipment-f283c.firebaseapp.com",
  projectId: "fba-shipment-f283c",
  storageBucket: "fba-shipment-f283c.firebasestorage.app",
  messagingSenderId: "218223107550",
  appId: "1:218223107550:web:a5f6b72a3603f459a5114f",
  measurementId: "G-J42LW6N28Z",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
