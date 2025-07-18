import { 
    getFirestore, collection, addDoc, query, where, getDocs, updateDoc, doc, getDoc 
} from "firebase/firestore";
import { getFileURL, uploadFile } from "./file-storage";
import { getExtensionFromFile } from "../libraries/file";
import { db } from "./firebase";

// Referencia a la colección "communities" en Firestore
const communitiesRef = collection(db, "communities");

// Función para crear una nueva comunidad
export async function createCommunity({ name, description }) {
    try {
        // 1️- Crea la comunidad en Firestore sin imágenes
        const newCommunity = { name, description, photoURL: "", bannerURL: "" };

        // Agrega un nuevo documento a la colección "communities"
        const docRef = await addDoc(communitiesRef, newCommunity);

        // Retorna el ID de la comunidad recién creada
        return docRef.id; 
    } catch (error) {
        console.error("Error al crear la comunidad:", error);
        throw error;
    }
}

// Función para actualizar la foto de la comunidad
export async function updateCommunityPhoto(communityId, photo) {
    try {
        // Genera la ruta del archivo en Firebase Storage
        const filePath = `communities/${communityId}/photo.${getExtensionFromFile(photo)}`;

        // Sube el archivo (foto) a Firebase Storage
        await uploadFile(filePath, photo);

        // Obtiene la URL pública del archivo subido
        const photoURL = await getFileURL(filePath);

        // Referencia al documento de la comunidad en Firestore
        const communityRef = doc(db, "communities", communityId);

        // Actualiza el campo "photoURL" del documento de la comunidad
        await updateDoc(communityRef, { photoURL });

        console.log("Foto de la comunidad actualizada:", photoURL);
        return photoURL;
    } catch (error) {
        console.error("[updateCommunityPhoto] Error al actualizar la foto de la comunidad.", error);
        throw error;
    }
}

// Función para actualizar el banner de la comunidad
export async function updateCommunityBanner(communityId, banner) {
    try {
        // Genera la ruta del archivo en Firebase Storage
        const filePath = `communities/${communityId}/banner.${getExtensionFromFile(banner)}`;

        // Sube el archivo (banner) a Firebase Storage
        await uploadFile(filePath, banner);

        // Obtiene la URL pública del archivo subido
        const bannerURL = await getFileURL(filePath);

        // Referencia al documento de la comunidad en Firestore
        const communityRef = doc(db, "communities", communityId);

        // Actualiza el campo "bannerURL" del documento de la comunidad
        await updateDoc(communityRef, { bannerURL });

        console.log("Banner de la comunidad actualizado:", bannerURL);
        return bannerURL;
    } catch (error) {
        console.error("[updateCommunityBanner] Error al actualizar el banner de la comunidad.", error);
        throw error;
    }
}


// Función para obtener los datos de una comunidad por su ID
export async function getCommunity(id) {
    try {
        // Referencia al documento de la comunidad en Firestore
        const docRef = doc(db, "communities", id);

        // Obtiene el documento de la comunidad
        const docSnap = await getDoc(docRef);

        // Si el documento existe, retorna los datos de la comunidad junto con su ID
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() };
        }
        // Si el documento no existe, retorna null
        return null;
    } catch (error) {
        console.error("Error al obtener la comunidad:", error);
        throw error;
    }
}


// Función para buscar comunidades por nombre
export async function searchCommunities(searchQuery) {
    
    // Si la búsqueda está vacía, retorna un array vacío
    if (!searchQuery.trim()) return [];

    // Referencia a la colección "communities" en Firestore
    const communitiesRef = collection(db, 'communities');

    // Consulta para buscar comunidades cuyo nombre coincida con el término de búsqueda
    const q = query(communitiesRef, where('name', '>=', searchQuery), where('name', '<=', searchQuery + '\uf8ff'));

    try {
        // Ejecuta la consulta y obtiene los documentos que coinciden
        const querySnapshot = await getDocs(q);

        // Mapea los documentos para retornar un array de comunidades con sus datos e ID
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error('Error buscando comunidades:', error);

        // En caso de error, retorna un array vacío
        return [];
    }
}

// Función para alternar la membresía de un usuario en una comunidad
export async function toggleCommunityMembership(userId, communityId) {
    try {
      // Referencia al documento del usuario en Firestore
      const userRef = doc(db, "users", userId);

      // Obtiene el documento del usuario
      const userSnap = await getDoc(userRef);
  
      // Verifica si el usuario existe
      if (!userSnap.exists()) {
        throw new Error("El usuario no existe.");
      }
  
      // Obtiene los datos del usuario
      const userData = userSnap.data();

      // Obtiene la lista de comunidades a las que pertenece el usuario (o un array vacío si no existe)
      const userCommunities = userData.communities || [];
  
      // Verifica si el usuario ya es miembro de la comunidad
      if (userCommunities.includes(communityId)) {
        // Si ya es miembro, lo saca de la comunidad
        await updateDoc(userRef, {
          communities: userCommunities.filter(id => id !== communityId),
        });
        console.log("Usuario salió de la comunidad:", communityId);
        
        // Retorna false para indicar que el usuario ya no es miembro
        return false; 
      } else {
        // Si no es miembro, lo agrega a la comunidad
        await updateDoc(userRef, {
          communities: [...userCommunities, communityId],
        });
        console.log("Usuario unido a la comunidad:", communityId);

        // Retorna true para indicar que el usuario ahora es miembro
        return true; 
      }
    } catch (error) {
      console.error("Error al alternar la membresía de la comunidad:", error);
      throw error;
    }
}

// Función para verificar si un usuario es miembro de una comunidad
export async function isUserInCommunity(userId, communityId) {
    try {

        // Referencia al documento del usuario en Firestore
        const userRef = doc(db, "users", userId);

        // Obtiene el documento del usuario
        const userSnap = await getDoc(userRef);

        // Si el usuario no existe, retorna false
        if (!userSnap.exists()) return false;

        // Obtiene los datos del usuario
        const userData = userSnap.data();

        // Verifica si el usuario es miembro de la comunidad
        return userData.communities?.includes(communityId) || false;
    } catch (error) {
        console.error("Error al verificar la comunidad del usuario:", error);
        return false;
    }
}


// Función para obtener las comunidades a las que pertenece un usuario
export async function getUserCommunities(userId) {
  try {
      // Referencia al documento del usuario en Firestore
      const userRef = doc(db, "users", userId);

      // Obtiene el documento del usuario
      const userSnap = await getDoc(userRef);

      // Si el usuario existe
      if (userSnap.exists()) {

          // Obtiene la lista de IDs de comunidades a las que pertenece el usuario (o un array vacío si no existe)
          const communityIds = userSnap.data().communities || [];

          // Obtiene los datos completos de cada comunidad usando Promise.all para ejecutar las consultas en paralelo
          const communities = await Promise.all(
              communityIds.map(async (communityId) => {

                  // Referencia al documento de la comunidad en Firestore
                  const communityRef = doc(db, "communities", communityId);

                  // Obtiene el documento de la comunidad
                  const communitySnap = await getDoc(communityRef);

                  // Si la comunidad existe, retorna sus datos junto con su ID
                  if (communitySnap.exists()) {
                      return { id: communitySnap.id, ...communitySnap.data() };
                  }
                  // Si la comunidad no existe, retorna null
                  return null;
              })
          );

          // Filtrar comunidades nulas (por si alguna no existe)
          return communities.filter(community => community !== null);
      }
      // Si el usuario no existe, devuelve un array vacío
      return []; 
  } catch (error) {
      console.error("Error al obtener las comunidades del usuario:", error);
      return [];
  }
}

// Función para obtener los datos de una comunidad por su ID
export const getCommunityById = async (id) => {
    const docRef = doc(db, 'communities', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    } else {
      throw new Error('Comunidad no encontrada');
    }
  };