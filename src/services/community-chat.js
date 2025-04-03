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
    const chatRef = collection(db, `communities/${communityId}/chat`);
    return addDoc(chatRef, {
      ...data,
      created_at: serverTimestamp(),
    }).then(doc => ({ id: doc.id }));
  }
  
  // Se suscribe a los mensajes del chat de una comunidad, ordenados por fecha
  export function subscribeToCommunityChatMessages(communityId, callback) {
    const chatRef = collection(db, `communities/${communityId}/chat`);
    const q = query(chatRef, orderBy('created_at'));
    return onSnapshot(q, snapshot => {
      const messages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      callback(messages);
    });
  }
  