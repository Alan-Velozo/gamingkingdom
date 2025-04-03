import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

const storage = getStorage();

export async function uploadFileToStorage(file) {
  try {
    // Crear una referencia en el Storage para el archivo
    const storageRef = ref(storage, `uploads/${file.name}`);

    // Subir el archivo a Firebase Storage
    const snapshot = await uploadBytes(storageRef, file);

    // Obtener la URL de descarga del archivo subido
    const downloadURL = await getDownloadURL(snapshot.ref);
    console.log("URL del archivo subido: ", downloadURL);  // Verificar la URL
    return downloadURL;
  } catch (error) {
    console.error("Error al subir el archivo a Storage: ", error);
    throw error;
  }
}
