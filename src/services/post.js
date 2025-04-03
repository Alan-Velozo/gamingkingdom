import { 
    addDoc, 
    collection, 
    onSnapshot, 
    orderBy, 
    query, 
    updateDoc,
    serverTimestamp, 
    doc as firestoreDoc, 
    getDoc 
} from "firebase/firestore"; 
import { db } from "./firebase";
import { uploadFileToStorage } from "./storage"; // Función que sube archivos a Firebase Storage

export const categories = ["Encuesta", "Arte", "Pregunta", "Guia", "General", "Social"];


// Función para guardar una nueva publicación en Firestore
export const savePost = async (post) => {

    // Verifica que el campo 'user_id' esté presente en el objeto post
    if (!post.user_id) {
        throw new Error("El campo 'user_id' es obligatorio.");
    }

    return addDoc(collection(db, "posts"), {
        user_id: post.user_id,
        email: post.email,
        content: post.content,
        displayName: post.displayName,
        photoURL: post.photoURL,
        // fileURL: fileURL,
        communityId: post.communityId || null, 
        category: post.category || "general",
        title: post.title,
        cover: post.cover,
        created_at: serverTimestamp(),
    });
};

// Función para suscribirse a cambios en tiempo real en la colección "posts"
export function subscribeToPosts(callback) {

    // Referencia a la colección 'posts'
    const refPosts = collection(db, 'posts');

    // Consulta que ordena los posts por 'created_at' en orden descendente (más recientes primero)
    const q = query(refPosts, orderBy('created_at', 'desc'));

    // Escucha cambios en la consulta y ejecuta el callback cada vez que hay actualizaciones
    return onSnapshot(q, async (snapshot) => {

        // Procesa cada documento para agregar datos adicionales del usuario
        const postsWithUpdates = await Promise.all(
            snapshot.docs.map(async (document) => {
                const postData = document.data();
                try {
                    
                    // Verifica si el post tiene un 'user_id' definido
                    if (!postData.user_id) {
                        console.warn(`La publicación con ID ${document.id} no tiene un 'user_id' definido.`);
                        return { id: document.id, ...postData };
                    }

                    // Obtiene datos adicionales del usuario que creó la publicación
                    const userDocRef = firestoreDoc(db, 'users', postData.user_id);
                    const userDoc = await getDoc(userDocRef);

                    // Si el usuario existe, actualiza el post con los datos del usuario
                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        postData.photoURL = userData.photoURL || postData.photoURL;
                        postData.displayName = userData.displayName || postData.displayName;
                    }
                } catch (error) {
                    console.error(`Error al obtener datos del usuario para el post ${document.id}:`, error);
                }

                // Retorna el post con los datos actualizados
                return { id: document.id, ...postData };
            })
        );

        // Llama a la función callback con los posts actualizados
        callback(postsWithUpdates);
    });
}

// Función para guardar un comentario en la subcolección 'comments' de un post
export const saveComment = (postId, comment) => {
    
    // Verifica que el campo 'user_id' esté presente en el comentario
    if (!comment.user_id) {
        throw new Error("El campo 'user_id' es obligatorio en el comentario.");
    }

    // Agrega un nuevo documento a la subcolección 'comments' del post
    return addDoc(collection(db, `posts/${postId}/comments`), {
        user_id: comment.user_id,
        email: comment.email,
        displayName: comment.displayName,
        content: comment.content,
        photoURL: comment.photoURL,
        created_at: serverTimestamp(),
    });
};

// Función para suscribirse a cambios en tiempo real en los comentarios de un post
export function subscribeToComments(postId, callback) {

    // Referencia a la subcolección 'comments' del post
    const refComments = collection(db, `posts/${postId}/comments`);

    // Consulta que ordena los comentarios por 'created_at' en orden descendente
    const q = query(refComments, orderBy('created_at', 'desc'));

    // Escucha cambios en la consulta y ejecuta el callback cada vez que hay actualizaciones
    return onSnapshot(q, async (snapshot) => {

        // Procesa cada comentario para agregar datos adicionales del usuario
        const commentsWithUpdates = await Promise.all(
            snapshot.docs.map(async (document) => {
                const commentData = document.data();

                try {

                    // Verifica si el comentario tiene un 'user_id' definido
                    if (!commentData.user_id) {
                        console.warn(`El comentario con ID ${document.id} no tiene un 'user_id' definido.`);
                        return { id: document.id, ...commentData };
                    }

                    // Obtiene datos adicionales del usuario que hizo el comentario
                    const userDocRef = firestoreDoc(db, 'users', commentData.user_id);
                    const userDoc = await getDoc(userDocRef);

                    // Si el usuario existe, actualiza el comentario con los datos del usuario
                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        commentData.photoURL = userData.photoURL || commentData.photoURL;
                        commentData.displayName = userData.displayName || commentData.displayName;
                    }
                } catch (error) {
                    console.error(`Error al obtener datos del usuario para el comentario ${document.id}:`, error);
                }

                // Retorna el comentario con los datos actualizados
                return { id: document.id, ...commentData };
            })
        );

        // Llama a la función callback con los comentarios actualizados
        callback(commentsWithUpdates);
    });
}





















// Función para alternar una reacción (like o dislike) en un post
export const toggleReaction = async (postId, reaction, userId) => {

  // Verifica que postId y userId estén definidos
  if (!postId || !userId) {
    console.error("postId o userId no están definidos.");
    return;
  }

  // Referencia al documento del post
  const postRef = firestoreDoc(db, 'posts', postId);
  try {
    // Obtiene el documento del post
    const postDoc = await getDoc(postRef);
    if (!postDoc.exists()) {
      console.error("El post no existe.");
      return;
    }
    const postData = postDoc.data();      // Datos del post
    let likes = postData.likes || [];     // Lista de likes (o un array vacío si no existe)
    let dislikes = postData.dislikes || [];   // Lista de dislikes (o un array vacío si no existe)
    
    // Lógica para manejar likes y dislikes
    if (reaction === "like") {
      // Si ya dio dislike, se quita
      if (dislikes.includes(userId)) {
        dislikes = dislikes.filter(id => id !== userId);
      }
      // Toggle like: si ya está en likes, se elimina; si no, se agrega
      if (likes.includes(userId)) {
        likes = likes.filter(id => id !== userId);
      } else {
        likes.push(userId);
      }
    } else if (reaction === "dislike") {
      // Si ya dio like, se quita
      if (likes.includes(userId)) {
        likes = likes.filter(id => id !== userId);
      }
      // Toggle dislike: si ya está, se elimina; si no, se agrega
      if (dislikes.includes(userId)) {
        dislikes = dislikes.filter(id => id !== userId);
      } else {
        dislikes.push(userId);
      }
    }
    
    // Actualiza el documento del post con las nuevas listas de likes y dislikes
    await updateDoc(postRef, { likes, dislikes });
    console.log("Reacción actualizada:", { likes, dislikes });
  } catch (error) {
    console.error("Error al actualizar la reacción:", error);
  }
};
  
// Función para obtener las listas de likes y dislikes de un post
export const getLikesAndDislikes = async (postId) => {
    
  // Referencia al documento del post
    const postRef = firestoreDoc(db, 'posts', postId);

    // Obtiene el documento del post
    const postDoc = await getDoc(postRef);

    // Retorna los datos del post si existe; de lo contrario, retorna null
    return postDoc.exists() ? postDoc.data() : null;
};









// Función para alternar una reacción (like o dislike) en un comentario
export const toggleCommentReaction = async (postId, commentId, type, userId) => {

  // Referencia al documento del comentario
  const commentRef = firestoreDoc(db, `posts/${postId}/comments`, commentId);
  try {
    // Obtiene el documento del comentario
    const commentDoc = await getDoc(commentRef);
    if (!commentDoc.exists()) {
      console.error('El comentario no existe.');
      return;
    }
    const commentData = commentDoc.data();
    let likes = commentData.likes || [];      // Lista de likes (o un array vacío si no existe)
    let dislikes = commentData.dislikes || [];    // Lista de dislikes (o un array vacío si no existe)

    // Lógica para manejar likes y dislikes en comentarios
    if (type === "like") {
      // Si el usuario ya dio dislike, se elimina
      if (dislikes.includes(userId)) {
        dislikes = dislikes.filter(id => id !== userId);
      }
      // Alterna el like: si ya está, se elimina; si no, se agrega.
      if (likes.includes(userId)) {
        likes = likes.filter(id => id !== userId);
      } else {
        likes.push(userId);
      }
    } else if (type === "dislike") {
      // Si el usuario ya dio like, se elimina
      if (likes.includes(userId)) {
        likes = likes.filter(id => id !== userId);
      }
      // Alterna el dislike: si ya está, se elimina; si no, se agrega.
      if (dislikes.includes(userId)) {
        dislikes = dislikes.filter(id => id !== userId);
      } else {
        dislikes.push(userId);
      }
    }

    // Actualiza el documento del comentario con las nuevas listas de likes y dislikes
    await updateDoc(commentRef, { likes, dislikes });
    console.log("Reacción en comentario actualizada correctamente!");
  } catch (error) {
    console.error("Error al actualizar la reacción del comentario:", error);
  }
};




















// Objeto que define estilos (colores e íconos) para cada categoría de publicación
export const categoryStyles = {
  encuesta: { color: "#613b93", icon: "fa-poll" },
  arte: { color: "#bf3138", icon: "fa-paintbrush" },
  pregunta: { color: "#0d76bc", icon: "fa-question-circle" },
  guia: { color: "#ef6532", icon: "fa-book-open" },
  general: { color: "#464655", icon: "fa-comments" },
  social: { color: "#088c08", icon: "fa-users" }
};





























// Función para alternar el estado de guardado de un post para un usuario
export const toggleSavePost = async (userId, postId) => {

  // Referencia al documento del usuario
  const userRef = firestoreDoc(db, 'users', userId);

  // Obtiene el documento del usuario
  const userDoc = await getDoc(userRef);

  // Verifica si el usuario existe
  if (!userDoc.exists()) {
    throw new Error("El usuario no existe.");
  }

  const userData = userDoc.data();
  const savedPosts = userData.savedPosts || [];       // Lista de posts guardados (o un array vacío si no existe)

  // Verificar si el post ya está guardado
  const isPostSaved = savedPosts.includes(postId);

  if (isPostSaved) {
    // Si ya está guardado, se quita
    const updatedSavedPosts = savedPosts.filter(id => id !== postId);
    await updateDoc(userRef, { savedPosts: updatedSavedPosts });
    console.log("Post eliminado de guardados.");
  } else {
    // Si no está guardado, se agrega
    savedPosts.push(postId);
    await updateDoc(userRef, { savedPosts });
    console.log("Post guardado correctamente.");
  }

  return !isPostSaved;     // Retorna el nuevo estado (true si se guardó, false si se eliminó)
};

// Función para obtener los posts guardados de un usuario
export const getSavedPosts = async (userId) => {

  // Referencia al documento del usuario
  const userRef = firestoreDoc(db, 'users', userId); 

  // Obtiene el documento del usuario
  const userDoc = await getDoc(userRef); 

  // Verifica si el usuario existe
  if (!userDoc.exists()) {
    throw new Error("El usuario no existe.");
  }

  const userData = userDoc.data(); 

  // Retorna la lista de posts guardados (o un array vacío si no existe)
  return userData.savedPosts || []; 
};

