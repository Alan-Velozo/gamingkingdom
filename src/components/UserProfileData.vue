<script>
    import Loader from './Loader.vue';
    import TextWithDefault from './TextWithDefault.vue';
    import { getUserCommunities } from '../services/community';
    import { getFollowersCount, getFollowingCount } from '../services/user-profile';

    export default {
        name: 'UserProfileData',
        components: { Loader, TextWithDefault },
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
                followersCount: 0,
                followingCount: 0,
            }
        },
        async mounted() {
            if (this.user.id) {
                this.loadingCommunities = true;
                try {
                    // Obtener las comunidades del usuario
                    this.communities = await getUserCommunities(this.user.id);
                    this.followersCount = await getFollowersCount(this.user.id);
                    this.followingCount = await getFollowingCount(this.user.id);
                } catch (error) {
                    console.error("Error al cargar las comunidades:", error);
                }
                this.loadingCommunities = false;
            }
        },
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

                <div class="followers-following flex justify-between mt-4">
                    <span><b>{{ followersCount }}</b> seguidores</span>
                    <span><b>{{ followingCount }}</b> seguidos</span>
                </div>

                <div v-if="!loadingCommunities && communities.length > 0" class="user-communities">
                    <p><i class="fa-solid fa-people-group"></i> Comunidades</p>
                    <ul>
                        <li v-for="community in communities" :key="community.id">
                            <router-link :to="`/community/${community.id}`">{{ community.name }}</router-link>
                        </li>
                    </ul>
                </div>
                
                <div class="user-cta">
                    <router-link class="edit-profile" to="/perfil/editar"><i class="fa-solid fa-user-pen" style="color: #ffffff;"></i> Editar perfil</router-link>
                    <router-link class="create-community" to="/create-community"><i class="fa-solid fa-plus" style="color: #ffffff;"></i> Crear comunidad</router-link>
                </div>
            </div>

        </div>
    </div>
</template>

<style scoped>

    .banner{
        width: 100%;
        height: 40vh;
        background-repeat: no-repeat;
        background-size: cover;
        background-position: center;
        border-bottom: 3px solid black;
    }

    .user .user-img-container .user-img{
        width: 250px;
        height: 250px;
        object-fit: cover;
        object-position: center;
        margin-top: -125px;
        margin-left: 5%;
        border: 3px solid black;
        background: black;
    }

    .user-data{
        margin-left: 5%;
        max-width: 250px;
    }

    .user-cta{
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        padding-top: 2rem;
    }

    .user-cta .edit-profile,
    .user-cta .create-community{
        background: #1D71B8;
        color: white;
        padding: .5rem 1rem;
        margin-bottom: 1rem;
        width: 100%;
        text-align: center;
    }

    .user-cta .edit-profile i,
    .user-cta .create-community i{
        padding-right: 1rem;
    }

    .user-cta .create-community{
        background: #bf3138;
    }

    .user-data-list li{
        padding: .5rem 0;
        word-wrap: break-word;
        overflow-wrap: break-word;
    }

    .user-data-list .user-username{
        font-size: 3.25rem;
        font-family: "Jersey 15", sans-serif;
        line-height: 1;
        padding-top: 2rem;
    }

    .user-data-list .user-email{
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

        .user-cta .edit-profile,
        .user-cta .create-community{
            margin: auto;
        }

        .followers-following{
            justify-content: space-evenly;
        }

        .user-cta .create-community{
            margin-top: 1rem;
        }

        .user-data button, .user-cta a{
            max-width: 300px;
        }
    }

    @media screen and (max-width: 400px) {
        .followers-following{
            justify-content: space-between;
        }
    }

</style>