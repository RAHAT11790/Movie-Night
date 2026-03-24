import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue, push, set, remove, update, query, orderByChild, equalTo, get } from "firebase/database";
import { getAuth, signInWithEmailAndPassword, signOut, GoogleAuthProvider, signInWithPopup } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyC0KtwNcRcGYplQloSUh1nVCJKdEqJ5dj8",
  authDomain: "movie-night-88f65.firebaseapp.com",
  projectId: "movie-night-88f65",
  storageBucket: "movie-night-88f65.firebasestorage.app",
  messagingSenderId: "222819622819",
  appId: "1:222819622819:web:c3a8b2f4eb1558fea28416"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export { ref, onValue, push, set, remove, update, query, orderByChild, equalTo, get, signInWithEmailAndPassword, signOut, signInWithPopup };
