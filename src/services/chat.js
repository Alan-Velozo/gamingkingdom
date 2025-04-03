import { addDoc, collection, onSnapshot, orderBy, query, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";

export function saveChatMessage(data) {
    const refChat = collection(db, 'chat');

    return addDoc(refChat, {
        ...data,
        
        created_at: serverTimestamp(),
    })
        .then(doc => {
           
            return {
                id: doc.id,
            }
        });
}

export function subscribeToChatMessages(callback) {

    const refChat = collection(db, 'chat');

    const q = query(refChat, orderBy('created_at'));

    return onSnapshot(q, snapshot => {
        const documents = snapshot.docs.map(doc => {
            return {
                id: doc.id,
                user_id: doc.data().user_id,
                email: doc.data().email,
                content: doc.data().content,
                created_at: doc.data().created_at,
            }
        });

        callback(documents);
    });
}