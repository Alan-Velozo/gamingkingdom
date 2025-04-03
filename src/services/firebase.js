import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
    apiKey: "AIzaSyBe4UvILOcSdpPw-il5lQh0ZptnmANGNrY",
    authDomain: "gamingkingdom-b39cc.firebaseapp.com",
    projectId: "gamingkingdom-b39cc",
    storageBucket: "gamingkingdom-b39cc.appspot.com",
    messagingSenderId: "855327937213",
    appId: "1:855327937213:web:9097c357bf39bb1ac41dd4",
    measurementId: "G-C0SCZWSJ6Z"
};

export const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);

export const auth = getAuth(app);

export const storage = getStorage(app);