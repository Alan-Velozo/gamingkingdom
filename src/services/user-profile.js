import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "./firebase";

export async function getUserProfileById(id) {
    try {
        const refUser = doc(db, `users/${id}`); // Referencia al documento del usuario en Firestore

        const userDoc = await getDoc(refUser); // Obtiene el documento del usuario

        // Retornar los datos del perfil de usuario
        return {
            id: userDoc.id, 
            email: userDoc.data().email,
            displayName: userDoc.data().displayName,
            bio: userDoc.data().bio,
            photoURL: userDoc.data().photoURL,
            bannerURL: userDoc.data().bannerURL
        }   
    } catch (error) {
        console.error("[user-profile.js getUserProfileById] Error: ", error);
        throw error;
    }
}

export async function createUserProfile(id, data) {
    const refUser = doc(db, `users/${id}`); // Referencia al documento del usuario en Firestore

    await setDoc(refUser, data); // Crea el documento del usuario con los datos proporcionados
}

export async function updateUserProfile(id, data) {
    const refUser = doc(db, `users/${id}`); // Referencia al documento del usuario en Firestore

    await updateDoc(refUser, data); // Actualiza el documento del usuario con los datos proporcionados
}