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

// Define las categorías disponibles para las publicaciones - Array de strings para validación de tipos de contenido
export const categories = ["Encuesta", "Arte", "Pregunta", "Guia", "General", "Social"];

/**
 * Función asíncrona para persistir una nueva publicación en Firestore
 * @param {Object} post - Objeto que contiene todos los datos de la publicación
 * @param {string} post.user_id - ID único del usuario autor (requerido)
 * @param {string} post.email - Email del usuario autor
 * @param {string} post.content - Contenido HTML/texto de la publicación
 * @param {string} post.displayName - Nombre de visualización del usuario
 * @param {string} post.photoURL - URL de la imagen de perfil del usuario
 * @param {string} post.communityId - ID de la comunidad (opcional, null si es post general)
 * @param {string} post.category - Categoría del contenido (default: "general")
 * @param {string} post.title - Título de la publicación
 * @param {string} post.cover - URL de la imagen de portada
 * @returns {Promise<DocumentReference>} Promesa que resuelve con la referencia del documento creado
 * @throws {Error} Si el user_id no está presente en el objeto post
 */
export const savePost = async (post) => {

    // Validación de integridad de datos: verifica que el campo 'user_id' esté presente
    if (!post.user_id) {
        throw new Error("El campo 'user_id' es obligatorio.");
    }

    // Crea un nuevo documento en la colección "posts" con todos los datos del post
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

/**
 * Función para establecer una suscripción en tiempo real a la colección de posts
 * Utiliza onSnapshot para escuchar cambios en tiempo real y actualizar automáticamente la UI
 * @param {Function} callback - Función que se ejecuta cada vez que hay cambios en los posts
 * @param {Array} callback.posts - Array de posts con datos actualizados
 * @returns {Function} Función de cancelación de la suscripción
 */
export function subscribeToPosts(callback) {

    // Referencia a la colección 'posts' en Firestore
    const refPosts = collection(db, 'posts');

    // Consulta que ordena los posts por 'created_at' en orden descendente (más recientes primero)
    const q = query(refPosts, orderBy('created_at', 'desc'));

    // Establece un listener en tiempo real que se ejecuta cada vez que hay cambios
    return onSnapshot(q, async (snapshot) => {

        // Procesa cada documento para agregar datos adicionales del usuario
        // Usa Promise.all para procesar todas las consultas de usuario en paralelo
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

                    // Si el usuario existe, actualiza el post con los datos más recientes del usuario
                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        // Usa el operador || para mantener datos existentes si no hay nuevos
                        postData.photoURL = userData.photoURL || postData.photoURL;
                        postData.displayName = userData.displayName || postData.displayName;
                    }
                } catch (error) {
                    console.error(`Error al obtener datos del usuario para el post ${document.id}:`, error);
                }

                // Retorna el post con los datos actualizados y el ID del documento
                return { id: document.id, ...postData };
            })
        );

        // Ejecuta el callback con los posts actualizados
        callback(postsWithUpdates);
    });
}

/**
 * Función para persistir un comentario en la subcolección 'comments' de un post específico
 * @param {string} postId - ID del post al que pertenece el comentario
 * @param {Object} comment - Objeto que contiene los datos del comentario
 * @param {string} comment.user_id - ID único del usuario que hace el comentario (requerido)
 * @param {string} comment.email - Email del usuario
 * @param {string} comment.displayName - Nombre de visualización del usuario
 * @param {string} comment.content - Contenido del comentario (puede contener HTML)
 * @param {string} comment.photoURL - URL de la foto de perfil del usuario
 * @returns {Promise<DocumentReference>} Promesa que resuelve con la referencia del comentario creado
 * @throws {Error} Si el user_id no está presente en el comentario
 */
export const saveComment = (postId, comment) => {
    
    // Verifica que el campo 'user_id' esté presente en el comentario
    if (!comment.user_id) {
        throw new Error("El campo 'user_id' es obligatorio en el comentario.");
    }

    // Agrega un nuevo documento a la subcolección 'comments' del post
    // La estructura es: posts/{postId}/comments/{commentId}
    return addDoc(collection(db, `posts/${postId}/comments`), {
        user_id: comment.user_id,
        email: comment.email,
        displayName: comment.displayName,
        content: comment.content,
        photoURL: comment.photoURL,
        created_at: serverTimestamp(),
    });
};

/**
 * Función para establecer una suscripción en tiempo real a los comentarios de un post específico
 * @param {string} postId - ID del post cuyos comentarios se van a escuchar
 * @param {Function} callback - Función que se ejecuta cada vez que hay cambios en los comentarios
 * @param {Array} callback.comments - Array de comentarios con datos actualizados
 * @returns {Function} Función de cancelación de la suscripción
 */
export function subscribeToComments(postId, callback) {

    // Referencia a la subcolección 'comments' del post específico
    const refComments = collection(db, `posts/${postId}/comments`);

    // Consulta que ordena los comentarios por 'created_at' en orden descendente
    const q = query(refComments, orderBy('created_at', 'desc'));

    // Establece un listener en tiempo real para los comentarios
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

                    // Si el usuario existe, actualiza el comentario con los datos más recientes
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

        // Ejecuta el callback con los comentarios actualizados
        callback(commentsWithUpdates);
    });
}

/**
 * Función asíncrona para alternar una reacción (like o dislike) en un post específico
 * Implementa lógica de exclusión mutua: un usuario no puede tener like y dislike simultáneamente
 * @param {string} postId - ID del post al que se aplica la reacción
 * @param {string} reaction - Tipo de reacción ("like" o "dislike")
 * @param {string} userId - ID del usuario que realiza la reacción
 * @returns {Promise<void>} Promesa que se resuelve cuando se completa la operación
 */
export const toggleReaction = async (postId, reaction, userId) => {

  // Verifica que postId y userId estén definidos
  if (!postId || !userId) {
    console.error("postId o userId no están definidos.");
    return;
  }

  // Referencia al documento del post en Firestore
  const postRef = firestoreDoc(db, 'posts', postId);
  try {
    // Obtiene el documento del post para verificar su existencia
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
    // Usa updateDoc para actualizar solo los campos específicos
    await updateDoc(postRef, { likes, dislikes });
    console.log("Reacción actualizada:", { likes, dislikes });
  } catch (error) {
    console.error("Error al actualizar la reacción:", error);
  }
};
  
/**
 * Función asíncrona para obtener los datos completos de un post, incluyendo likes y dislikes
 * @param {string} postId - ID del post del que se obtienen los datos
 * @returns {Promise<Object|null>} Promesa que resuelve con los datos del post o null si no existe
 */
export const getLikesAndDislikes = async (postId) => {
    
  // Referencia al documento del post
    const postRef = firestoreDoc(db, 'posts', postId);

    // Obtiene el documento del post
    const postDoc = await getDoc(postRef);

    // Retorna los datos del post si existe; de lo contrario, retorna null
    return postDoc.exists() ? postDoc.data() : null;
};

/**
 * Función asíncrona para alternar una reacción (like o dislike) en un comentario específico
 * Similar a toggleReaction pero para comentarios en subcolecciones
 * @param {string} postId - ID del post que contiene el comentario
 * @param {string} commentId - ID del comentario al que se aplica la reacción
 * @param {string} type - Tipo de reacción ("like" o "dislike")
 * @param {string} userId - ID del usuario que realiza la reacción
 * @returns {Promise<void>} Promesa que se resuelve cuando se completa la operación
 */
export const toggleCommentReaction = async (postId, commentId, type, userId) => {

  // Referencia al documento del comentario en la subcolección
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

    // Lógica para manejar likes y dislikes en comentarios (misma lógica que posts)
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

/**
 * Función asíncrona para alternar el estado de guardado de un post para un usuario específico
 * Mantiene una lista de posts guardados en el documento del usuario
 * @param {string} userId - ID del usuario que guarda/desguarda el post
 * @param {string} postId - ID del post que se va a guardar/desguardar
 * @returns {Promise<boolean>} Promesa que resuelve con el nuevo estado (true si se guardó, false si se eliminó)
 * @throws {Error} Si el usuario no existe en la base de datos
 */
export const toggleSavePost = async (userId, postId) => {

  // Referencia al documento del usuario en Firestore
  const userRef = firestoreDoc(db, 'users', userId);

  // Obtiene el documento del usuario
  const userDoc = await getDoc(userRef);

  // Verifica si el usuario existe
  if (!userDoc.exists()) {
    throw new Error("El usuario no existe.");
  }

  const userData = userDoc.data();
  const savedPosts = userData.savedPosts || [];       // Lista de posts guardados (o un array vacío si no existe)

  // Verificar si el post ya está guardado usando includes()
  const isPostSaved = savedPosts.includes(postId);

  if (isPostSaved) {
    // Si ya está guardado, se quita de la lista usando filter()
    const updatedSavedPosts = savedPosts.filter(id => id !== postId);
    await updateDoc(userRef, { savedPosts: updatedSavedPosts });
    console.log("Post eliminado de guardados.");
  } else {
    // Si no está guardado, se agrega a la lista usando push()
    savedPosts.push(postId);
    await updateDoc(userRef, { savedPosts });
    console.log("Post guardado correctamente.");
  }

  return !isPostSaved;     // Retorna el nuevo estado (true si se guardó, false si se eliminó)
};

/**
 * Función asíncrona para obtener la lista de posts guardados de un usuario específico
 * @param {string} userId - ID del usuario del que se obtienen los posts guardados
 * @returns {Promise<Array>} Promesa que resuelve con un array de IDs de posts guardados
 * @throws {Error} Si el usuario no existe en la base de datos
 */
export const getSavedPosts = async (userId) => {

  // Referencia al documento del usuario en Firestore
  const userRef = firestoreDoc(db, 'users', userId); 

  // Obtiene el documento del usuario para verificar su existencia
  const userDoc = await getDoc(userRef); 

  // Verifica si el usuario existe antes de proceder
  if (!userDoc.exists()) {
    throw new Error("El usuario no existe.");
  }

  const userData = userDoc.data(); 

  // Retorna la lista de posts guardados (o un array vacío si no existe)
  return userData.savedPosts || []; 
};