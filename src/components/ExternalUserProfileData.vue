<script>
    import TextWithDefault from './TextWithDefault.vue';
    import { getUserCommunities } from '../services/community';
    import { isFollowing, followUser, unfollowUser, getFollowersCount, getFollowingCount } from '../services/user-profile';
    import { refreshAuthUser } from '../services/auth';

    export default {
        name: 'ExternalUserProfileData',
        components: { TextWithDefault },
        props: {
            user: {
                type: Object,
                required: true,
                loadingCommunities: true,
            },
            authUser: {
                type: Object,
                required: false,
                default: null
            },
            showFollow: {
                type: Boolean,
                default: false
            }
        },
        data(){
            return{
                communities: [],
                loadingCommunities: true,
                isFollowingUser: false,
                followersCount: 0,
                followingCount: 0,
                loadingFollow: false,
            }
        },
        async mounted() {
            if (this.user.id) {
                this.loadingCommunities = true;
                try {
                    // Obtener las comunidades del usuario
                    this.communities = await getUserCommunities(this.user.id);
                } catch (error) {
                    console.error("Error al cargar las comunidades:", error);
                }
                this.loadingCommunities = false;
            }

            // Verifica si el usuario autenticado está siguiendo a este perfil
            if (this.authUser && this.authUser.id && this.user.id && this.authUser.id !== this.user.id) {
                this.isFollowingUser = await isFollowing(this.authUser.id, this.user.id);
            }

            // Obtiene los contadores de seguidores y seguidos del usuario
            if (this.user.id) {
                this.followersCount = await getFollowersCount(this.user.id);
                this.followingCount = await getFollowingCount(this.user.id);
            }
        },
        methods: {
            /**
            * Alterna el estado de "seguir" o "dejar de seguir" a un usuario
            */
            async toggleFollow() {

                // Verifica que haya un usuario autenticado válido y que no sea el mismo perfil
                if (!this.authUser || !this.authUser.id || !this.user.id || this.authUser.id === this.user.id) return;
                
                this.loadingFollow = true;
                
                
                if (this.isFollowingUser) {
                    // Si ya sigue al usuario, deja de seguir
                    await unfollowUser(this.authUser.id, this.user.id);
                    this.isFollowingUser = false;
                    this.followersCount--;

                    // Actualiza el array local del usuario autenticado
                    if (this.authUser.following) {
                        this.authUser.following = this.authUser.following.filter(id => id !== this.user.id);
                    }
                } else {
                    // Si no lo sigue, comienza a seguirlo
                    await followUser(this.authUser.id, this.user.id);
                    this.isFollowingUser = true;
                    this.followersCount++;
                }

                // Actualiza globalmente los datos del usuario autenticado en la app
                await refreshAuthUser(); 
                this.loadingFollow = false;
            }
        }
    }
</script>

<template>
    <div>
        <div class="banner" v-if="user.bannerURL" :style="{ backgroundImage: `url(${user.bannerURL})`}"></div>
        <div class="banner" v-else="user.bannerURL" style="background-image: url('/assets/users/banner.png');"></div>
        
        <div class="user">
            <div class="user-img-container">
                <img v-if="user.photoURL" :src="user.photoURL" alt="Foto de perfil" class="user-img">
            </div>

            <div class="user-data">
                <ul class="user-data-list">
                    <li class="user-username"><TextWithDefault :value="user.displayName" /></li>
                    <li class="user-email">{{ user.email }}</li>
                    <li class="user-bio"><TextWithDefault :value="user.bio" default-value="Sin biografía." /></li>
                    <li class="user-favorite-game" v-if="user.favoriteGame && typeof user.favoriteGame === 'object'">
                        <i class="fa-solid fa-star" style="color: #000000;"></i> {{ user.favoriteGame.name }}
                    </li>
                </ul>

                <div v-if="!loadingCommunities && communities.length > 0" class="user-communities">
                    <p><i class="fa-solid fa-people-group"></i> Comunidades</p>
                    <ul>
                        <li v-for="community in communities" :key="community.id">
                            <router-link :to="`/comunidad/${community.id}`">{{ community.name }}</router-link>
                        </li>
                    </ul>
                </div>
                
                <div class="user-cta">
                    <router-link :to="`/chat/usuario/${user.id}`" class="message-profile bg-[#623B97]"><i class="fa-regular fa-message" style="color: #ffffff;"></i> Enviar mensaje</router-link>
                </div>
                <!-- Botón de seguir/dejar de seguir y contadores -->
                <div v-if="showFollow" class="mt-4">
                    <button @click="toggleFollow" :disabled="loadingFollow" :class="isFollowingUser ? 'bg-[#C0282E]' : 'bg-[#1D71B8]'" class="follow-button">
                        <span v-if="!isFollowingUser"><i class="fa-solid fa-user-plus"></i></span>
                        <span v-else><i class="fa-solid fa-user-minus"></i></span>
                        {{ isFollowingUser ? 'Dejar de seguir' : 'Seguir' }}
                    </button>
                </div>
                <div class="followers-following flex justify-between mt-10">
                    <span><b>{{ followersCount }}</b> seguidores</span>
                    <span><b>{{ followingCount }}</b> seguidos</span>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
    .banner {
        width: 100%;
        height: 40vh;
        background-repeat: no-repeat;
        background-size: cover;
        background-position: center;
        border-bottom: 3px solid black;
    }

    .user .user-img-container .user-img {
        width: 250px;
        height: 250px;
        object-fit: cover;
        object-position: center;
        margin-top: -125px;
        margin-left: 5%;
        border: 3px solid black;
        background: black;
    }

    .user-data {
        margin-left: 5%;
        max-width: 250px;
    }

    .user-cta {
        display: flex;
        justify-content: space-between;
        padding-top: 2rem;
    }

    .user-cta .message-profile, .follow-button {
        color: white;
        padding: .5rem 1rem;
        width: 100%;
        text-align: center;
    }

    .user-cta .message-profile i, .follow-button i{
        padding-right: 1rem;
    }

    .user-data-list li {
        padding: .5rem 0;
        word-wrap: break-word;
        overflow-wrap: break-word;
    }

    .user-data-list .user-username {
        font-size: 3.5rem;
        font-family: "Jersey 15", sans-serif;
        line-height: 1;
        padding-top: 2rem;
    }

    .user-data-list .user-email {
        color: grey;
    }

    .user-communities{
        padding-top: 2rem;
    }

    .user-communities p{
        font-weight: bold;
        padding-bottom: .5rem;
    }

    .user-communities ul li{
        color: #613b93;
        font-weight: 500;
    }

    .user-favorite-game{
        font-weight: bold;
    }

    .user-favorite-game i{
        padding-right: .5rem;
    }

    @media screen and (max-width: 1023px) {
        
        .user .user-img-container .user-img{
            width: 250px;
            height: 250px;
            margin-top: -125px;
            margin-left: auto;
            margin-right: auto;
        }

        .user-data{
            margin-left: auto;
            border-right: none;
            max-width: none;
            text-align: center;
            padding: 0 5%;
        }

        .user-data button, .user-cta a{
            max-width: 300px;
        }

        .followers-following{
            justify-content: space-evenly;
        }

        .user-cta{
            display: flex;
            justify-content: center;
            padding-top: 2rem;
        }
    }

    @media screen and (max-width: 400px) {
        .followers-following{
            justify-content: space-between;
        }
    }
</style>
