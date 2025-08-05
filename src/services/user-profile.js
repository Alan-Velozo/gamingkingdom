import { doc, getDoc, setDoc, updateDoc, arrayUnion, arrayRemove, collection, getDocs, query, where } from "firebase/firestore";
import { db } from "./firebase";

export async function getUserProfileById(id) {
    try {
        const refUser = doc(db, `users/${id}`); 

        const userDoc = await getDoc(refUser); 

        // Retornar los datos del perfil de usuario
        return {
            id: userDoc.id, 
            email: userDoc.data().email,
            displayName: userDoc.data().displayName,
            bio: userDoc.data().bio,
            photoURL: userDoc.data().photoURL,
            bannerURL: userDoc.data().bannerURL,
            favoriteGame: userDoc.data().favoriteGame,
            followers: userDoc.data().followers || [],
            following: userDoc.data().following || []
        }   
    } catch (error) {
        console.error("[user-profile.js getUserProfileById] Error: ", error);
        throw error;
    }
}

export async function createUserProfile(id, data) {
    const refUser = doc(db, `users/${id}`); 

    await setDoc(refUser, data); 
}

export async function updateUserProfile(id, data) {
    const refUser = doc(db, `users/${id}`); 

    await updateDoc(refUser, data); 
}

// Seguir a un usuario
export async function followUser(currentUserId, targetUserId) {
    const userRef = doc(db, `users/${targetUserId}`);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) return;
    
    const userData = userDoc.data();
    const followers = userData.followers || [];
    
    if (!followers.includes(currentUserId)) {
        await updateDoc(userRef, {
            followers: arrayUnion(currentUserId)
        });
    }
    
    // También actualizar el array de seguidos del usuario actual
    const currentUserRef = doc(db, `users/${currentUserId}`);
    await updateDoc(currentUserRef, {
        following: arrayUnion(targetUserId)
    });
}

// Dejar de seguir a un usuario
export async function unfollowUser(currentUserId, targetUserId) {
    const userRef = doc(db, `users/${targetUserId}`);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) return;
    
    const userData = userDoc.data();
    const followers = userData.followers || [];
    
    if (followers.includes(currentUserId)) {
        await updateDoc(userRef, {
            followers: arrayRemove(currentUserId)
        });
    }
    
    // También actualizar el array de seguidos del usuario actual
    const currentUserRef = doc(db, `users/${currentUserId}`);
    await updateDoc(currentUserRef, {
        following: arrayRemove(targetUserId)
    });
}

// Verificar si el usuario actual sigue a otro usuario
export async function isFollowing(currentUserId, targetUserId) {
    const userRef = doc(db, `users/${currentUserId}`);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) return false;
    
    const userData = userDoc.data();
    const following = userData.following || [];
    
    return following.includes(targetUserId);
}

// Obtener el número de seguidores de un usuario
export async function getFollowersCount(userId) {
    const userRef = doc(db, `users/${userId}`);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) return 0;
    
    const userData = userDoc.data();
    const followers = userData.followers || [];
    
    return followers.length;
}

// Obtener el número de seguidos de un usuario
export async function getFollowingCount(userId) {
    const userRef = doc(db, `users/${userId}`);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) return 0;
    
    const userData = userDoc.data();
    const following = userData.following || [];
    
    return following.length;
}

// Obtener los datos de varios usuarios por sus IDs
export async function getUsersByIds(ids) {
    if (!ids || ids.length === 0) return [];
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("__name__", "in", ids));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));
}