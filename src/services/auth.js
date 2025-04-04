import { createUserWithEmailAndPassword, onAuthStateChanged, signInWithEmailAndPassword, signOut, updateProfile } from "firebase/auth";
import { auth } from "./firebase";
import { createUserProfile, getUserProfileById, updateUserProfile } from "./user-profile";
import { getFileURL, uploadFile } from "./file-storage";
import { getExtensionFromFile } from "../libraries/file";

const defaultProfileImage = "/assets/users/user.png";
const defaultBannerImage = "/assets/users/banner.webp";


// Objeto que representa los datos vacíos de un usuario
const EMPTY_USER_DATA = {
    id: null,
    email: null,
    displayName: null,
    bio: null,
    photoURL: null,
    fullyLoaded: false,
}

// Variable para almacenar los datos del usuario actual
let userData = EMPTY_USER_DATA;

// Array para almacenar los observadores (callbacks) que serán notificados cuando cambien los datos del usuario
let observers = [];

// Si hay datos de usuario almacenados en localStorage, cargarlos
if (localStorage.getItem('user') !== null) {
    userData = JSON.parse(localStorage.getItem('user'));
}

// Se ejecuta cada vez que el estado de autenticación cambia (por ejemplo, cuando el usuario inicia o cierra sesión)
onAuthStateChanged(auth, async user => {
    if (user) {
        // Si el usuario está autenticado, se obtienen y actualizan los datos del perfil
        setUserData({
            id: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
        });

        // Obtiene el perfil del usuario desde Firestore
        const userProfile = await getUserProfileById(user.uid);

        // Actualiza los datos del usuario con la biografía y el banner
        setUserData({
            bio: userProfile.bio,
            bannerURL: userProfile.bannerURL || "",
            fullyLoaded: true,              // Indica que los datos del usuario están completamente cargados
        });
    } else {
        // Si el usuario no está autenticado, se restablecen los datos del usuario a vacío
        setUserData(EMPTY_USER_DATA);
    }
});

// Función para registrar un nuevo usuario
export async function register(email, password) {
    try {
        
        // Crear una cuenta de usuario con correo y contraseña
        const userCredentials = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredentials.user;

        // Asignar un nombre de usuario y una foto de perfil predeterminados
        const defaultDisplayName = `Jugador #${Math.floor(1000 + Math.random() * 9000)}`;
        const defaultPhotoURL = defaultProfileImage; 
        const defaultBannerURL = defaultBannerImage;

        // Actualiza el perfil del usuario en Firebase Authentication
        await updateProfile(user, { displayName: defaultDisplayName, photoURL: defaultPhotoURL });

        // Crea el perfil del usuario en Firestore
        await createUserProfile(user.uid, { email, displayName: defaultDisplayName, photoURL: defaultPhotoURL, bannerURL: defaultBannerURL });

        // Actualiza los datos del usuario en el estado local
        setUserData({
            id: user.uid,
            email: user.email,
            displayName: defaultDisplayName,
            photoURL: defaultPhotoURL,
            bannerURL: defaultBannerURL,
            fullyLoaded: true,
        });
    } catch (error) {
        console.error("[auth.js register] Error al crear una cuenta: ", error.code);
        throw error;
    }
}

// Función para iniciar sesión con correo y contraseña
export function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password)
        .then(userCredentials => {
            console.log("Usuario autenticado. ID: ", userCredentials.user.uid);
        })
        .catch(error => {
            console.error("[auth.js login] Error al crear una cuenta: ", error.code);
            throw error;
        });
}

// Función para actualizar el nombre y la biografía del usuario
export async function updateUser({ displayName, bio }) {
    try {
        // Actualiza el nombre del usuario en Firebase Authentication
        const authPromise = updateProfile(auth.currentUser, { displayName });

        // Actualiza el nombre y la biografía del usuario en Firestore
        const firestorePromise = updateUserProfile(userData.id, { displayName, bio });

        // Ejecuta ambas promesas en paralelo
        await Promise.all([authPromise, firestorePromise]);

        // Notifica los cambios del nombre de usuario al estado local
        setUserData({ displayName, bio });
    } catch (error) {
        console.error("[auth.js updateUser] Error al actualizar el nombre o bio: ", error);
        throw error;
    }
}


// Función para actualizar la foto de perfil del usuario
export async function updateUserPhoto(photo) {
    try {
        // Genera la ruta del archivo en Firebase Storage
        const filePath = `users/${userData.id}/avatar.${getExtensionFromFile(photo)}`;

        // Sube el archivo (foto) a Firebase Storage
        await uploadFile(filePath, photo);

        // Obtiene la URL pública del archivo subido
        const photoURL = await getFileURL(filePath);

        // Actualiza la foto de perfil en Firebase Authentication
        const authPromise = updateProfile(auth.currentUser, { photoURL });

        // Actualiza la foto de perfil en Firestore
        const storagePromise = updateUserProfile(userData.id, { photoURL });

        // Ejecuta ambas promesas en paralelo
        await Promise.all([authPromise, storagePromise]);

        // Notifica los cambios de la foto de perfil al estado local
        setUserData({ photoURL });
    } catch (error) {
        console.error("[auth.js updateUserPhoto] Error al actualizar la foto de perfil.", error);
        throw error;
    }
}

// Función para actualizar el banner del usuario
export async function updateUserBanner(banner) {
    try {
        // Genera la ruta del archivo en Firebase Storage
        const filePath = `users/${userData.id}/banner.${getExtensionFromFile(banner)}`;

        // Sube el archivo (banner) a Firebase Storage
        await uploadFile(filePath, banner);

        // Obtiene la URL pública del archivo subido
        const bannerURL = await getFileURL(filePath);

        // Actualiza el banner en Firestore
        await updateUserProfile(userData.id, { bannerURL });

        // Notifica los cambios del banner al estado local
        setUserData({ bannerURL });
    } catch (error) {
        console.error("[auth.js updateUserBanner] Error al actualizar el banner.", error);
        throw error;
    }
}



export function logout() {

    // Elimina los datos del usuario del localStorage
    localStorage.removeItem('user');        

    // Cierra la sesión en Firebase Authentication
    return signOut(auth);
}

// Función para suscribirse a cambios en los datos del usuario
export function subscribeToAuth(callback) {

    // Añade el callback a la lista de observadores
    observers.push(callback);
    
    // Notifica al nuevo observador con los datos actuales del usuario
    notify(callback);               
    return () => {
        // Permite desuscribirse de los cambios
        observers = observers.filter(obs => obs !== callback);      
    };
}

// Función para notificar a un observador con los datos actuales del usuario
function notify(observer) {
    observer({ ...userData });
}

// Función para notificar a todos los observadores con los datos actuales del usuario
function notifyAll() {
    observers.forEach(observer => notify(observer));
}

// Función para actualizar los datos del usuario en el estado local y en el localStorage
function setUserData(newData) {
    userData = {
        ...userData,
        ...newData,
    }
    localStorage.setItem('user', JSON.stringify(userData));
    // Notifica a todos los observadores con los datos actualizados
    notifyAll();        
}
