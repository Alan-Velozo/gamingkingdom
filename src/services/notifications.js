// services/notifications.js
import { 
    collection, 
    query, 
    where, 
    onSnapshot, 
    doc, 
    getDoc, 
    setDoc, 
    updateDoc, 
    serverTimestamp,
    orderBy,
    addDoc // Añade esta importación
} from "firebase/firestore";
import { db } from "./firebase";

// Función para suscribirse a las notificaciones de un usuario
export function subscribeToNotifications(userId, callback) {
    const notificationsRef = collection(db, 'notifications');
    const q = query(notificationsRef, where('userId', '==', userId), orderBy('created_at', 'desc'));

    return onSnapshot(q, snapshot => {
        const notifications = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        callback(notifications);
    });
}

// Función para marcar una notificación como leída
export async function markNotificationAsRead(notificationId) {
    const notificationRef = doc(db, 'notifications', notificationId);
    await updateDoc(notificationRef, { read: true });
}

// Función para crear una notificación
export async function createNotification(userId, type, content) {
    const notificationsRef = collection(db, 'notifications');
    await addDoc(notificationsRef, {
        userId,
        type,
        content,
        data,
        read: false,
        created_at: serverTimestamp()
    });
}