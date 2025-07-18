import { 
    addDoc, 
    collection, 
    onSnapshot, 
    orderBy, 
    query, 
    serverTimestamp 
  } from "firebase/firestore";
  import { db } from "./firebase";
  
  // Guarda un mensaje en el chat de la comunidad
  export function saveCommunityChatMessage(communityId, data) {
    // Referencia a la subcolección "chat" dentro de la comunidad específica
    const chatRef = collection(db, `communities/${communityId}/chat`);
    
    // Agrega un nuevo documento al chat de la comunidad con los datos recibidos y la fecha de creación del servidor
    return addDoc(chatRef, {
      ...data, // Desestructura los datos recibidos (por ejemplo: user_id, email, content)
      created_at: serverTimestamp(), // Agrega la marca de tiempo del servidor
    }).then(doc => ({ id: doc.id })); // Devuelve el id del mensaje recién creado
  }
  
  // Se suscribe a los mensajes del chat de una comunidad, ordenados por fecha
  export function subscribeToCommunityChatMessages(communityId, callback) {
    // Referencia a la subcolección "chat" dentro de la comunidad específica
    const chatRef = collection(db, `communities/${communityId}/chat`);
    
    // Crea una consulta para obtener los mensajes ordenados por fecha de creación
    const q = query(chatRef, orderBy("created_at"));
    
    // Se suscribe a los cambios en la consulta (escucha en tiempo real)
    return onSnapshot(q, snapshot => {
      // Mapea los documentos recibidos a un array de objetos con todos los datos del mensaje
      const messages = snapshot.docs.map(doc => ({
        id: doc.id, // ID del documento
        ...doc.data(), // Todos los datos del mensaje (user_id, email, content, created_at, etc.)
      }));
      
      // Llama al callback proporcionado con la lista de mensajes actualizada
      callback(messages);
    });
  }
  