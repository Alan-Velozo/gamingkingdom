import { addDoc, collection, doc, getDoc, onSnapshot, orderBy, query, serverTimestamp, setDoc, where, getDocs } from "firebase/firestore";
import { db } from "./firebase";
import { getUserProfileById } from "./user-profile";


export async function sendPrivateChatMessage(senderId, receiverId, content) {
    const chatId = calculateChatId(senderId, receiverId); // Calcular el ID del chat

    await createOrVerifyPrivateChat(senderId, receiverId); // Crear o verificar que exista el chat

    const messagesCollection = collection(db, `private-chats/${chatId}/messages`); // Referencia a la colección de mensajes del chat

    // Agregar mensaje a la colección de mensajes del chat
    await addDoc(messagesCollection, {
        sender_id: senderId,
        content,
        created_at: serverTimestamp(),
    });

}

export function subscribeToPrivateChat(senderId, receiverId, callback) {
    const chatId = calculateChatId(senderId, receiverId);       // Calcular el ID del chat

    const q = query(
        collection(db, `private-chats/${chatId}/messages`), 
        orderBy('created_at')
    );

    // Escuchar cambios en la colección de mensajes y ejecuta el callback con los datos actualizados
    return onSnapshot(q, snapshot => {
        callback(snapshot.docs.map(doc => {
            return {
                id: doc.uid,
                sender_id: doc.data().sender_id,
                content: doc.data().content,
                created_at: doc.data().created_at || null,
            }
        }))
    });
}

async function createOrVerifyPrivateChat(senderId, receiverId) {
    const chatId = calculateChatId(senderId, receiverId);       // Calcular el ID del chat

    const chatRef = doc(db, `private-chats/${chatId}`);     // Referencia al documento del chat

    const chatDoc = await getDoc(chatRef);          // Obtiene el documento del chat

    if(!chatDoc.exists()) {
        // Si el documento no existe, lo crea con los IDs de los participantes
        return setDoc(chatRef, {
            [senderId]: true,
            [receiverId]: true,
        }).then(() => {});
    }

    return;
}

// Calcular el ID del chat basado en los IDs de los participantes
function calculateChatId(id1, id2) {
    return [id1, id2].sort().join('_');         // Ordena los IDs y los une con un guion bajo

}













export async function getPrivateChats(userId) {
    const chatsRef = collection(db, "private-chats");
    const q = query(chatsRef, where(userId, "==", true));
    const querySnapshot = await getDocs(q);

    const chats = [];
    for (const doc of querySnapshot.docs) {
        const chatId = doc.id;
        const participants = Object.keys(doc.data()).filter(key => key !== userId);

        // Obtener el displayName de cada participante
        const participantProfiles = await Promise.all(
            participants.map(async (participantId) => {
                const profile = await getUserProfileById(participantId);
                return {
                    id: participantId,
                    displayName: profile.displayName || participantId, // Usar el ID como fallback
                };
            })
        );

        chats.push({ chatId, participants: participantProfiles });
    }

    return chats;
}