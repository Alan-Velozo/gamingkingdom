<script>
  import Home from './pages/Home.vue';
  import { logout, subscribeToAuth } from './services/auth';
  import { search } from './services/search';
  import { getPrivateChats } from './services/private-chat';

  export default {
    name: 'App',
    components: { Home },
    data() {
        return {
            // Datos del usuario autenticado
            authUser: { id: null, email: null },

            // Variables para la funcionalidad de búsqueda
            searchQuery: '',          // Término de búsqueda ingresado por el usuario
            searchResults: [],        // Resultados de la búsqueda
            showSearch: false,        // Controla si se muestra la barra de búsqueda

            // Variables para la funcionalidad de chats
            showChatList: false,      // Controla si se muestra la lista de chats
            chats: [],                // Lista de chats privados
            hasChats: false,          // Indica si el usuario tiene chats
        };
    },
    methods: {
        // Método para manejar el cierre de sesión
        handleLogout() {
            logout();           // Llama a la función de cierre de sesión del servicio de autenticación
            this.$router.push({ path: '/iniciar-sesion' });         // Redirige al usuario a la página de inicio de sesión
        },

        // Método para alternar la visibilidad de la barra de búsqueda
        toggleSearch() {
            this.showSearch = !this.showSearch;
        },

        // Método para realizar una búsqueda
        async search() {
            if (this.searchQuery.trim() === '') {
                // Si la búsqueda está vacía, limpia los resultados
                this.searchResults = [];
                return;
            }
            try {
                // Llama a la función de búsqueda del servicio, pasando el término de búsqueda y el ID del usuario autenticado
                this.searchResults = await search(this.searchQuery, this.authUser.id);
            } catch (error) {
                console.error('Error al buscar:', error);
            }
        },

        // Método para navegar a un resultado de búsqueda
        goToResult(result) {
            if (result.type === 'community') {
                // Si el resultado es una comunidad, redirige a la página de la comunidad
                this.$router.push(`/comunidad/${result.id}`);
            } else if (result.type === 'user') {
                // Si el resultado es un usuario, redirige a la página del usuario
                this.$router.push(`/usuario/${result.id}`);
            }
            // Limpia la búsqueda después de seleccionar un resultado
            this.searchQuery = '';
            this.searchResults = [];
            this.showSearch = false;
        },

        // Método para alternar la visibilidad de la lista de chats
        async toggleChatList() {
            this.showChatList = !this.showChatList;
            if (this.showChatList) {
                // Si se muestra la lista de chats, obtiene los chats privados del usuario
                this.chats = await getPrivateChats(this.authUser.id);
                this.hasChats = this.chats.length > 0;      // Actualiza si el usuario tiene chats
            }
        }
    },
    mounted() {
        // Suscribe el componente a los cambios en la autenticación del usuario
        subscribeToAuth(newUserData => this.authUser = newUserData);
    },
  }
</script>

<template>
  <header>
    <nav>
      <!-- Logo a la izquierda -->
      <router-link to="/" class="logo-container">
        <picture>
          <source media="(max-width: 1000px)" srcset="/assets/isotipo-blanco.png">
          <img alt="Logo" class="logo" src="/assets/logo-blanco.png">
        </picture>
      </router-link>

      <!-- Buscador en el centro -->
      <template v-if="authUser.id !== null">
        <div class="search-container">
          <div class="search-box">
            <input 
              type="text" 
              v-model="searchQuery" 
              placeholder="Buscar..." 
              @input="search"
            />
            <i class="fa-solid fa-magnifying-glass pr-3" style="color: #000000;"></i>
          </div>
          <ul v-if="searchResults.length > 0" class="search-results">
              <li v-for="result in searchResults" :key="result.id" @click="goToResult(result)">
                  {{ result.type === 'community' ? result.name : result.displayName }}
              </li>
          </ul>
        </div>
      </template>

      <!-- Menú a la derecha -->
      <div class="right-menu">
        <!-- Hamburguesa para móviles -->
        <input type="checkbox" id="mobile-menu-toggle" class="mobile-menu-toggle">
        <label for="mobile-menu-toggle" class="hamburger">
          <i class="fa-solid fa-bars"></i>
        </label>

        <!-- Contenido del menú -->
        <div class="desktop-menu">
          <template v-if="authUser.id !== null">
            <ul class="nav-links">
              <li>
                <router-link to="/"><i class="fa-solid fa-house"></i></router-link>
              </li>
              <li>
                <router-link to="/chat"><i class="fa-solid fa-comment-dots"></i></router-link>
              </li>
              <li>
                <router-link to="/perfil"><i class="fa-solid fa-circle-user"></i></router-link>
              </li>
              <li>
                <form action="#" @submit.prevent="handleLogout">
                  <button class="logout">
                    <i class="fa-solid fa-power-off"></i>
                  </button>
                </form>
              </li>
            </ul>
          </template>
          
          <template v-else>
            <div class="auth-buttons">
              <button class="login" @click="$router.push('/iniciar-sesion')">Iniciar sesión</button>
              <button class="signup" @click="$router.push('/registro')">Registrarse</button>
            </div>
          </template>
        </div>

        <!-- Menú móvil -->
        <div class="mobile-menu">
          <ul class="nav-links">
            <template v-if="authUser.id !== null">
              <li><router-link to="/"><i class="fa-solid fa-house"></i> Inicio</router-link></li>
              <li>
                <router-link to="/chat">
                  <i class="fa-brands fa-rocketchat"></i> Mensajes
                </router-link>
              </li>
              <li><router-link to="/perfil"><i class="fa-solid fa-circle-user"></i> Perfil</router-link></li>
              <li>
                <form @submit.prevent="handleLogout">
                  <button class="logout"><i class="fa-solid fa-power-off"></i> Cerrar sesión</button>
                </form>
              </li>
            </template>

            <template v-else>
              <li>
                <router-link to="/iniciar-sesion">Iniciar sesión</router-link>
              </li>
              <li>
                <router-link to="/registro">Registrarse</router-link>
              </li>
            </template>
          </ul>
        </div>
      </div>
    </nav>
  </header>

  <!-- Menú lateral de chats -->
  <!-- <div class="chat-list-sidebar" :class="{ 'open': showChatList }">
    <div class="chat-list-content">
      <p class="chat-list-title">Mensajes recientes</p>
      <ul v-if="chats.length > 0">
        <li v-for="chat in chats" :key="chat.chatId">
          <router-link :to="`/usuario/${chat.participants[0].id}/chat`">
            {{ chat.participants[0].displayName }}
          </router-link>
        </li>
      </ul>
      <p v-else class="no-chats-message">No hay mensajes.</p>
      <button @click="toggleChatList" class="close-chats">Cerrar</button>
    </div>
  </div> -->

  <main>
    <router-view :key="$route.fullPath"/>
  </main>

  <footer v-if="!$route.meta.hideFooter">
    <div class="footer-content">
      <div class="footer-text">
        <p>&copy; GamingKingdom</p>
        <p>Todos los derechos reservados.</p>
      </div>
    </div>
  </footer>
</template>

<style scoped>

  nav {
    background: black;
    display: flex;
    height: 80px;
    align-items: center;
    position: fixed;
    width: 100%;
    z-index: 999999;
    top: 0;
    padding: 0 2rem;
    justify-content: space-between;
  }

  .logo-container {
    flex: 0 1 auto;
  }

  .logo {
    max-width: 150px;
    height: auto;
  }

  .search-container {
    flex: 1 1 600px;
    max-width: 800px;
    margin: 0 2rem;
    position: relative;
  }

  .search-box {
    display: flex;
    align-items: center;
    background: white;
    padding: 8px 12px;
  }

  .search-box input {
    border: none;
    outline: none;
    width: 100%;
    font-size: 14px;
  }

  .right-menu {
    flex: 0 1 auto;
    display: flex;
    align-items: center;
    gap: 15px;
  }

  .nav-links {
    display: flex;
    gap: 25px;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .nav-links a, .nav-links button {
    color: white;
    font-size: 1.2rem;
    text-decoration: none;
    background: none;
    border: none;
    cursor: pointer;
  }

  .auth-buttons {
    display: flex;
    gap: 10px;
  }

  .login, .signup {
    padding: 8px 20px;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.2s;
  }

  .login {
    background: transparent;
    border: 1px solid white;
    color: white;
    border-radius: 100px;
  }

  .signup {
    background: white;
    border: none;
    border-radius: 100px;
  }

  @media (max-width: 1000px) {
    
    .nav-links {
      gap: 15px;
    }
    
    .auth-buttons {
      gap: 5px;
    }
  }

  @media (max-width: 690px) {
    .auth-buttons .login, 
    .auth-buttons .signup {
      display: none;
    }
  }

  .search-results{
    background: white;
    margin-bottom: -2.5%;
    position: absolute;
    width: 100%;
    outline: 1px solid black;
  }

  .search-results li{
    padding: 10px;
    cursor: pointer;
  }

  .search-results li:hover{
    background: rgb(241, 241, 241);
    transition-duration: .25s;
    transition-property: background, font-weight;
    font-weight: bold;
  }

  .hamburger {
    display: none;
    color: white;
    font-size: 1.5rem;
    cursor: pointer;
  }

  .mobile-menu-toggle {
    display: none;
  }

  .mobile-menu {
    display: none;
    position: fixed;
    top: 80px;
    right: -100%;
    background: black;
    width: 250px;
    height: calc(100vh - 80px);
    padding: 20px;
    transition: right 0.3s ease;
  }

  .mobile-menu-toggle:checked ~ .mobile-menu {
    right: 0;
  }

  .mobile-menu .nav-links {
    flex-direction: column;
    gap: 15px;
  }

  .mobile-menu .nav-links a,
  .mobile-menu .nav-links button {
    font-size: 1.1rem;
    padding: 10px;
    display: flex;
    align-items: center;
    gap: 10px;
  }

  @media (max-width: 1000px) {
    
    .logo{
      max-height: 60px;
    }
    
    .hamburger {
      display: block;
    }
    
    .desktop-menu {
      display: none;
    }
    
    .mobile-menu {
      display: block;
    }
    
    /* .search-container {
      display: none;
    } */
  }

  @media (max-width: 690px) {
    .auth-buttons {
      display: none;
    }
  }

  main {
    margin-top: 80px;
  }

  footer {
    background-color: black;
    padding: 3rem;
    z-index: 9999999999999999999;
    position: relative;
  }

  footer .footer-content .footer-text {
    color: white;
    text-align: center;
    font-size: 1.2rem;
  }

  footer .footer-content .footer-text p:first-of-type {
    padding-bottom: 3rem;
  }

  .chat-list-sidebar {
    position: fixed;
    top: 0;
    right: -300px; 
    width: 300px;
    height: 100vh;
    background: white;
    box-shadow: -2px 0 5px rgba(0, 0, 0, 0.1);
    transition: right 0.3s ease;
    z-index: 1000000;
  }

  .chat-list-sidebar.open {
    right: 0; 
  }

  .chat-list-content {
    padding: 20px;
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  .chat-list-title{
    font-weight: bold;
  }

  .chat-list-content p {
    margin-bottom: 16px;
  }

  .chat-list-content ul {
    list-style: none;
    padding: 0;
    margin: 0;
    flex: 1;
    overflow-y: auto;
  }

  .chat-list-content li {
    margin-bottom: 15px;
  }

  .chat-list-content li a {
    text-decoration: none;
    color: #007bff;
  }

  .chat-list-content button {
    margin-top: 16px;
    padding: 8px 16px;
    background: black;
    color: white;
    border: none;
    cursor: pointer;
  }

  .no-chats-message {
    text-align: center;
    color: #666;
    margin-top: 20px;
  }
</style>