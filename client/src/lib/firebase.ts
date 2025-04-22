import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBe_QfC5hO6BERDIu7toyRTWODYoTuAJs8",
  authDomain: "mazeej-df812.firebaseapp.com",
  projectId: "mazeej-df812",
  storageBucket: "mazeej-df812.firebasestorage.app",
  messagingSenderId: "260429068988",
  appId: "1:260429068988:web:bf26abcd6c77465a222eb9",
  measurementId: "G-Q9E7CTM3F2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export { auth };
