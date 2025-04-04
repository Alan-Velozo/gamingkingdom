<script>
    import TextWithDefault from './TextWithDefault.vue';
    import { getUserCommunities } from '../services/community';


    export default {
        name: 'ExternalUserProfileData',
        components: { TextWithDefault },
        props: {
            user: {
                type: Object,
                required: true,
                loadingCommunities: true,
            }
        },
        data(){
            return{
                communities: [],
                loadingCommunities: true,
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
        }
    }
</script>

<template>
    <div>
        <div class="banner" v-if="user.bannerURL" :style="{ backgroundImage: `url(${user.bannerURL})`}"></div>
        <div class="banner" v-else="user.bannerURL" style="background-image: url('../assets/profile/banner.webp');"></div>
        
        <div class="user">
            <div class="user-img-container">
                <img v-if="user.photoURL" :src="user.photoURL" alt="Foto de perfil" class="user-img">
            </div>

            <div class="user-data">
                <ul class="user-data-list">
                    <li class="user-username"><TextWithDefault :value="user.displayName" /></li>
                    <li class="user-email">{{ user.email }}</li>
                    <li class="user-bio"><TextWithDefault :value="user.bio" default-value="Sin biografía." /></li>
                </ul>

                <div v-if="!loadingCommunities && communities.length > 0" class="user-communities">
                    <p><i class="fa-solid fa-people-group"></i> Comunidades</p>
                    <ul>
                        <li v-for="community in communities" :key="community.id">
                            <router-link :to="`/community/${community.id}`">{{ community.name }}</router-link>
                        </li>
                    </ul>
                </div>
                
                <div class="user-cta">
                    <router-link :to="`/usuario/${user.id}/chat`" class="message-profile"><i class="fa-regular fa-message" style="color: #ffffff;"></i> Enviar mensaje</router-link>
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

    .user-cta .message-profile {
        background: #1D71B8;
        color: white;
        padding: .5rem 1rem;
    }

    .user-cta .message-profile i{
        padding-right: 1rem;
    }

    .user-data-list li {
        padding: .5rem 0;
        word-wrap: break-word;
        overflow-wrap: break-word;
    }

    .user-data-list .user-username {
        font-size: 3.5rem;
        font-family: "Jersey 10", sans-serif;
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

        .user-cta{
            display: flex;
            justify-content: center;
            padding-top: 2rem;
        }
    }
</style>
