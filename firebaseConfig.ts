// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";  
import { GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyD0AHfkKYCVBwxFsnteQpzpMuioJWoNR2Q",
  authDomain: "gonullu-akademi-d17ca.firebaseapp.com",
  projectId: "gonullu-akademi-d17ca",
  storageBucket: "gonullu-akademi-d17ca.firebasestorage.app",
  messagingSenderId: "398773868326",
  appId: "1:398773868326:web:703fa4130cdfbbce9053e7",
  measurementId: "G-CXWWNR1CE5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);

export default app;