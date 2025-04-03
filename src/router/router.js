// Este archivo va a contener el router y su configuración.

import { createRouter, createWebHashHistory, createWebHistory } from "vue-router";
import Home from "../pages/Home.vue";
import Chat from "../pages/Chat.vue";
import Login from "../pages/Login.vue";
import Register from "../pages/Register.vue";
import MyProfile from "../pages/MyProfile.vue";
import MyProfileEdit from "../pages/MyProfileEdit.vue";
import UserProfile from "../pages/UserProfile.vue";
import PrivateChat from "../pages/PrivateChat.vue";
import PostDetail from "../pages/PostDetail.vue";
import Community from "../pages/community/Community.vue";
import CreateCommunity from "../pages/community/CreateCommunity.vue";
import CommunityChat from "../pages/community/chat/CommunityChat.vue";
import { subscribeToAuth } from "../services/auth";

// Definimos el array de rutas.
const routes = [
    { path: '/',                        component: Home, },
    { path: '/iniciar-sesion',          component: Login, },
    { path: '/registro',                component: Register, },
    { path: '/chat',                    component: Chat,                meta: { requiresAuth: true } },
    { path: '/perfil',                  component: MyProfile,           meta: { requiresAuth: true } },
    { path: '/perfil/editar',           component: MyProfileEdit,       meta: { requiresAuth: true } },
    { path: '/usuario/:id',             component: UserProfile,         meta: { requiresAuth: true } },
    { path: '/usuario/:id/chat',        component: PrivateChat,         meta: { requiresAuth: true, hideFooter: true } },
    { path: '/post/:id',                component: PostDetail,          meta: { requiresAuth: true } }, 
    { path: '/community/:id',           component: Community,           meta: { requiresAuth: true } },
    { path: '/create-community',        component: CreateCommunity,     meta: { requiresAuth: true } },
    { path: '/community/:id/chat',      component: CommunityChat,       meta: { requiresAuth: true, hideFooter: true } },


];

// Creamos el router, configurando las rutas y el sistema de historial que queremos usar.
const router = createRouter({
    routes,
    history: createWebHashHistory(),
});

// Configuramos la restricción por estado de autenticación a nuestro router.
let authUser = {
    id: null,
    email: null,
}

subscribeToAuth(newUserData => authUser = newUserData);

router.beforeEach((to, from) => {
    // console.log('[router] Navegando a la ruta... ', to.path);
    // Para acceder al chat, el usuario debe estar autenticado.
    // if(authUser.id === null && to.path == '/chat') {
    // if(authUser.id === null && ['/chat', '/perfil', '...'].includes(to.path)) {
    if(authUser.id === null && to.meta.requiresAuth) {
        return {
            path: '/iniciar-sesion',
        };
    }
});

// Exportamos el router.
export default router;