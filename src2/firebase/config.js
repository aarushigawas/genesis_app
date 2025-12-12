import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAm665F2xyIuP5xo_ZE0gntVirE6vIAnWE",
  authDomain: "genesisapp-99570.firebaseapp.com",
  projectId: "genesisapp-99570",
  storageBucket: "genesisapp-99570.firebasestorage.app",
  messagingSenderId: "957192498846",
  appId: "1:957192498846:web:391d354cfd1e86ebca158f",
  measurementId: "G-HLR6SK5S3R"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
