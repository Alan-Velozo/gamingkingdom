import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "./firebase";

/**
 * Función de búsqueda unificada que busca tanto usuarios como comunidades.
 * @param {string} searchQuery - El término de búsqueda.
 * @param {string} userId - El ID del usuario autenticado (para excluirlo de los resultados).
 * @returns {Promise<Array>} - Un array de resultados que incluye comunidades y usuarios.
 */
export async function search(searchQuery, userId) {

    // Si la búsqueda está vacía o solo contiene espacios en blanco, retorna un array vacío
    if (!searchQuery.trim()) return []; 

    try {
        // Referencia a la colección "communities"
        const communitiesRef = collection(db, "communities");

        // Referencia a la colección "users"
        const usersRef = collection(db, "users");

        // Consulta para buscar comunidades cuyo nombre coincida con el término de búsqueda
        const communitiesQuery = query(

            // Colección de comunidades
            communitiesRef,    

            // Filtra comunidades cuyo nombre sea mayor o igual al término de búsqueda
            where("name", ">=", searchQuery),

            // Filtra comunidades cuyo nombre sea menor o igual al término de búsqueda + un carácter especial
            where("name", "<=", searchQuery + "\uf8ff")
        );

        // Consulta para buscar usuarios cuyo nombre mostrado (displayName) coincida con el término de búsqueda
        const usersQuery = query(

            // Colección de usuarios
            usersRef,

            // Filtra usuarios cuyo displayName sea mayor o igual al término de búsqueda
            where("displayName", ">=", searchQuery),

            // Filtra usuarios cuyo displayName sea menor o igual al término de búsqueda + un carácter especial
            where("displayName", "<=", searchQuery + "\uf8ff")
        );

        // Ejecutar ambas consultas en paralelo usando Promise.all
        const [communitiesSnapshot, usersSnapshot] = await Promise.all([

            // Obtiene los documentos de la consulta de comunidades
            getDocs(communitiesQuery),

            // Obtiene los documentos de la consulta de usuarios
            getDocs(usersQuery),
        ]);

        // Mapear los resultados de comunidades
        const communities = communitiesSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            type: "community", // Añadir un campo "type" para identificar que es una comunidad
        }));

        // Mapear los resultados de usuarios y excluir al usuario autenticado
        const users = usersSnapshot.docs
            .map(doc => ({
                id: doc.id,
                ...doc.data(),
                type: "user", // Añadir un campo "type" para identificar el tipo
            }))
            .filter(user => user.id !== userId); // Filtrar para excluir al usuario autenticado

        // Combinar y retornar los resultados de comunidades y usuarios
        return [...communities, ...users];
    } catch (error) {

        // En caso de error, imprimir el error en la consola y retornar un array vacío
        console.error("Error en la búsqueda unificada:", error);
        return []; // En caso de error, retorna un array vacío
    }
}