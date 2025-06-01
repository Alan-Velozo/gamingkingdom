<script>
    import Loader from '../components/Loader.vue';
    import ChatLoader from '../components/ChatLoader.vue';
    import MainButton from '../components/MainButton.vue';
    import { subscribeToAuth } from '../services/auth';
    import { saveChatMessage, subscribeToChatMessages } from '../services/chat';

    export default {
        name: 'Chat',
        components: { Loader, MainButton, ChatLoader },
        data() {
            return {
                authUser: {
                    id: null,
                    email: null,
                },
                loadingUser: true,
                unsubscribeFromAuth: () => {},

                messages: [],           // Almacena los mensajes del chat
                unsubscribeFromMessages: () => {},          // Función para desuscribirse de mensajes

                // Nuevo mensaje a enviar
                newMessage: {
                    content: '',
                },

                loadingMessages: true,
            }
        },
        methods: {
            /**
             * Envía un nuevo mensaje al chat
             * 1. Guarda el mensaje usando el servicio chat
             * 2. Limpia el campo de texto después de enviar
             */
            sendMessage() {
                saveChatMessage({
                    user_id: this.authUser.id,              // ID del usuario
                    email: this.authUser.email,             // Email del usuario
                    content: this.newMessage.content,       // Contenido del mensaje
                }).then(doc => {
                    console.log("El ID generado: " + doc.id);
                });

                this.newMessage.content = '';               // Limpia el campo de mensaje
            },

            formatDate(date) {
                return Intl.DateTimeFormat('es-AR', {
                    year: 'numeric', month: '2-digit', day: '2-digit',
                    hour: '2-digit', minute: '2-digit', second: '2-digit'
                }).format(date).replace(',', '');
            }
        },
        mounted() {
            // Suscripción a mensajes del chat (actualización en tiempo real)
            this.unsubscribeFromMessages = subscribeToChatMessages(newMessages => {
                this.messages = newMessages;            // Actualiza la lista de mensajes
                this.loadingMessages = false;           // Desactiva el estado de carga
            });

            // Suscripción a cambios de autenticación
            this.unsubscribeFromAuth = subscribeToAuth(newUserData => {
                this.authUser = newUserData;            // Actualiza datos del usuario
                this.loadingUser = false;               // Desactiva el estado de carga
            });
        },

        // Limpieza al desmontar el componente
        unmounted() {
            this.unsubscribeFromMessages();             // Cancela la suscripción a mensajes
            this.unsubscribeFromAuth();                 // Cancela la suscripción a auth
        }
    }
</script>

<template>
    <h1 class="pt-10 text-center">Chat general</h1>

    <div class="p-5">
        <div class="">
            <h2 class="sr-only">Lista de mensajes</h2>
            <div class="p-4 min-h-[400px]">
                <ul v-if="!loadingMessages" class="flex flex-col items-start">
                    <li 
                        v-for="message in messages"
                        :key="message.id"
                        :class="[
                            'p-4 mb-4 text-white',
                            message.user_id === authUser.id ? 'self-end bg-[#EA5B27]' : 'self-start bg-[#633188]'
                        ]"
                    >
                        <p>
                            <b>
                                <template v-if="message.user_id !== authUser.id">
                                    <router-link 
                                        :to="`/usuario/${message.user_id}`"
                                        class="text-white underline"
                                    >
                                        {{ message.email }}
                                    </router-link> 
                                </template>
                                <template v-else>
                                    {{ message.email }}
                                </template>
                            </b>
                        </p>
                        <p>{{ message.content }}</p>
                        <p v-if="message.created_at !== null" class="mt-5">{{ formatDate(message.created_at.toDate()) }}</p>
                        <p v-else>Enviando...</p>
                    </li>
                </ul>
                <ChatLoader v-else />
            </div>
        </div>
        <div class="">
            <form 
                action="#"
                @submit.prevent="sendMessage"
                class="flex w-full justify-between items-center"
            >
                    <textarea 
                        id="message"
                        placeholder="Escribe un mensaje..."
                        required
                        class="w-full px-4 py-2 border border-gray-400 text-black no-resize h-22"
                        v-model="newMessage.content"
                    ></textarea>
                <MainButton class="h-[4.1rem] w-24"><i class="fa-solid fa-paper-plane" style="color: #ffffff;"></i></MainButton>
            </form>
        </div>
    </div>
</template>



<style scoped>

    h1{
        font-family: "Jersey 15", "sans-serif";
        font-size: 4rem;
    }

</style>