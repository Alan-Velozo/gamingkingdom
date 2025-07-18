import { addDoc, collection, onSnapshot, orderBy, query, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";

// Guarda un nuevo mensaje en la colección 'chat' de Firestore
export function saveChatMessage(data) {
    // Referencia a la colección 'chat' en la base de datos
    const refChat = collection(db, 'chat');

    // Agrega un nuevo documento a la colección con los datos recibidos y la fecha de creación actual del servidor
    return addDoc(refChat, {
        ...data, // Desestructura los datos recibidos (por ejemplo: user_id, email, content)
        created_at: serverTimestamp(), // Agrega la marca de tiempo del servidor
    })
        .then(doc => {
            // Devuelve el id del documento recién creado
            return {
                id: doc.id,
            }
        });
}

// Se suscribe en tiempo real a los mensajes de la colección 'chat'
export function subscribeToChatMessages(callback) {
    // Referencia a la colección 'chat'
    const refChat = collection(db, 'chat');

    // Crea una consulta para obtener los mensajes ordenados por fecha de creación
    const q = query(refChat, orderBy('created_at'));

    // Se suscribe a los cambios en la consulta (escucha en tiempo real)
    return onSnapshot(q, snapshot => {
        // Mapea los documentos recibidos a un array de objetos con los datos relevantes
        const documents = snapshot.docs.map(doc => {
            return {
                id: doc.id,
                user_id: doc.data().user_id,
                email: doc.data().email,
                content: doc.data().content,
                created_at: doc.data().created_at,
            }
        });

        // Llama al callback proporcionado con la lista de mensajes actualizada
        callback(documents);
    });
}