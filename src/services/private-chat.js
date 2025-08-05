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
    return [id1, id2].sort().join('_');         // Ordena los IDs y los une con un guión bajo
}

/**
 * Obtiene todos los chats privados de un usuario con información de los participantes
 * @param {string} userId - ID del usuario cuyos chats se quieren obtener
 * @returns {Promise<Array>} - Array de objetos con información de los chats
 */
export async function getPrivateChats(userId) {
    // Referencia a la colección de chats privados
    const chatsRef = collection(db, "private-chats");
    
    // Consulta para obtener solo los chats donde el usuario es participante
    // La consulta where(userId, "==", true) busca documentos donde el campo con nombre igual al userId tenga valor true
    const q = query(chatsRef, where(userId, "==", true));
    
    // Ejecuta la consulta y obtiene los resultados
    const querySnapshot = await getDocs(q);

    // Array para almacenar la información procesada de los chats
    const chats = [];
    
    // Itera sobre cada documento (chat) encontrado
    for (const doc of querySnapshot.docs) {
        // Obtiene el ID del chat desde el documento
        const chatId = doc.id;
        
        // Extrae los IDs de todos los participantes excepto el usuario actual
        // Object.keys(doc.data()) obtiene todas las claves del objeto, que son los IDs de los participantes
        // filter(key => key !== userId) elimina el ID del usuario actual
        const participants = Object.keys(doc.data()).filter(key => key !== userId);

        // Obtiene información detallada de cada participante usando sus perfiles
        // Promise.all permite ejecutar múltiples promesas en paralelo y esperar a que todas se completen
        const participantProfiles = await Promise.all(
            participants.map(async (participantId) => {
                // Obtiene el perfil completo del participante usando la función importada
                const profile = await getUserProfileById(participantId);
                
                // Retorna un objeto con información básica del participante
                return {
                    id: participantId,
                    // Usa el displayName del perfil o el ID como respaldo si no hay nombre
                    displayName: profile.displayName || participantId,
                };
            })
        );

        // Añade la información del chat al array de resultados
        chats.push({ 
            chatId,                             // ID único del chat 
            participants: participantProfiles   // Array con información de los participantes
        });
    }

    // Retorna el array con todos los chats procesados
    return chats;
}