import { doc, getDoc, setDoc, updateDoc, collection, addDoc, deleteDoc, query, where, getDocs, doc as firestoreDoc } from "firebase/firestore";
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
            bannerURL: userDoc.data().bannerURL,
            favoriteGame: userDoc.data().favoriteGame
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

// Seguir a un usuario
export async function followUser(currentUserId, targetUserId) {
    const followsRef = collection(db, "follows");
    // Verifica si ya existe la relación
    const q = query(followsRef, where("followerId", "==", currentUserId), where("followingId", "==", targetUserId));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) return; // Ya sigue
    await addDoc(followsRef, { followerId: currentUserId, followingId: targetUserId });
}

// Dejar de seguir a un usuario
export async function unfollowUser(currentUserId, targetUserId) {
    const followsRef = collection(db, "follows");
    const q = query(followsRef, where("followerId", "==", currentUserId), where("followingId", "==", targetUserId));
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach(async (docSnap) => {
        await deleteDoc(firestoreDoc(db, "follows", docSnap.id));
    });
}

// Verificar si el usuario actual sigue a otro usuario
export async function isFollowing(currentUserId, targetUserId) {
    const followsRef = collection(db, "follows");
    const q = query(followsRef, where("followerId", "==", currentUserId), where("followingId", "==", targetUserId));
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
}

// Obtener el número de seguidores de un usuario
export async function getFollowersCount(userId) {
    const followsRef = collection(db, "follows");
    const q = query(followsRef, where("followingId", "==", userId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.size;
}

// Obtener el número de seguidos de un usuario
export async function getFollowingCount(userId) {
    const followsRef = collection(db, "follows");
    const q = query(followsRef, where("followerId", "==", userId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.size;
}