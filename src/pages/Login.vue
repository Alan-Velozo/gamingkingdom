<script>
    import { login } from '../services/auth';

    export default {
        name: 'Login',
        data() {
            return {
                user: {
                    email: '',
                    password: '',
                },
                loading: false,
                error: null,
            };
        },
        methods: {
            async handleSubmit() {
                this.loading = true;
                this.error = null;

                try {
                    await login(this.user.email, this.user.password);
                    this.$router.push({
                        path: '/perfil',
                    });
                } catch (error) {
                    this.error = 'Credenciales incorrectas. Por favor, inténtelo de nuevo.';
                    console.error('[Login handleSubmit] ', error)
                }
                this.loading = false;
            }
        }
    }
</script>

<template>
    <div class="container">

        <div class="context">
            <div class="login-container">

                <div class="login-form">
                    <h1>Iniciar sesión</h1>
                    <form action="#" @submit.prevent="handleSubmit">
                        
                        <div class="email">
                            <label for="email">Correo electrónico</label>
                            <div class="email-content">
                                <i class="fa-solid fa-envelope" style="color: #000000;"></i>
                                <input type="email" name="email" id="email" placeholder="Correo electrónico" v-model="user.email" :disabled="loading" required>
                            </div>
                        </div>

                        <div class="password">
                            <label for="password">Contraseña</label>
                            <div class="password-content">
                                <i class="fa-solid fa-lock" style="color: #000000;"></i>
                                <input type="password" name="password" id="password" placeholder="Contraseña" v-model="user.password" :disabled="loading" required>
                            </div>
                        </div>

                        <div class="register-ask">
                            <p>¿No tienes una cuenta? <router-link to="/registro">Registrate</router-link></p>
                        </div>

                        <div class="submit">
                            <input type="submit" value="INGRESAR">
                        </div>
                        <p v-if="error" class="error">{{ error }}</p>
                    </form>
                </div>

                <div class="login-content">
                    <img src="../../../public/isotipo.svg" alt="Logo">
                </div>
            </div>
        </div>


        <div class="area" >
            <ul class="circles">
                <li></li>
                <li></li>
                <li></li>
                <li></li>
                <li></li>
                <li></li>
                <li></li>
                <li></li>
                <li></li>
                <li></li>
            </ul>
        </div>

    </div>
</template>

<style scoped>

    .container{
        min-height: 100vh;
        align-content: center;
        background-repeat: no-repeat;
        background-size: cover;
        padding: 0;
        margin: auto;
    }

    .login-container{
        display: flex;
        width: fit-content;
        margin: auto;
        justify-content: space-around;
        padding: 3rem;
        align-items: center;
        z-index: 99;
        position: relative;
        backdrop-filter: blur(15px);
        border: 2px solid black;
        gap: 5rem;
    }

    .login-container .login-content img{
        width: 300px;
    }

    .login-container .login-form form .email .email-content,
    .login-container .login-form form .password .password-content{
        display: flex;
        padding-top: 1rem;
    }

    .login-container .login-form form .email,
    .login-container .login-form form .password,
    .login-container .login-form form .submit{
        width: 100%;
    }

    .login-container .login-form form .email i,
    .login-container .login-form form .password i{
        padding-right: 1rem;
        font-size: 1.5rem;
        overflow: hidden;
        padding-top: .5rem;
    }

    .login-container .login-form form .email input,
    .login-container .login-form form .password input{
        border: none;    
        border: 1px solid black;
        font-size: 1.1rem;
        background: none;
        padding: .5rem;
    }


    .login-container .login-form form .password{
        padding: 3rem 0;
    }

    .login-container .login-form form .submit input{
        border: none;
        color: white;
        padding: 1rem 2rem;
        cursor: pointer;
        background: black;
        border: 1px solid black;
        font-size: 1.1rem;
    }

    @media screen and (max-width: 1279px) {
        .login-container{
            flex-direction: column-reverse;
            width: fit-content;
            padding: 3rem;
        }

        .login-container .login-content img{
            width: 100px;
            padding-bottom: 2rem
        }   

    }

.context {
    width: 100%;    
}

.context h1{
    font-family: "Jersey 10", sans-serif;
    font-size: 3rem;
    padding-bottom: 3rem;
    letter-spacing: 3px;
    margin-top: 0;
    padding-left: 0;
}

.area{
    width: 100%;    
   
}

.circles{
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;
}

.circles li{
    position: absolute;
    display: block;
    list-style: none;
    width: 20px;
    height: 20px;
    background: rgba(255, 255, 255, 0.2);
    animation: animate 25s linear infinite;
    bottom: -150px;
    
}

.circles li:nth-child(1){
        left: 25%;
        width: 80px;
        height: 80px;
        animation-delay: 0s;
        background-color: #eb5b29;
    }

    .circles li:nth-child(2){
        left: 10%;
        width: 20px;
        height: 20px;
        animation-delay: 2s;
        animation-duration: 12s;
        background-color: #63338a;
    }

    .circles li:nth-child(3){
        left: 70%;
        width: 20px;
        height: 20px;
        animation-delay: 4s;
        background-color: #0d71b8;
    }

    .circles li:nth-child(4){
        left: 40%;
        width: 60px;
        height: 60px;
        animation-delay: 0s;
        animation-duration: 18s;
        background-color: #c12a2e;

    }

    .circles li:nth-child(5){
        left: 65%;
        width: 20px;
        height: 20px;
        animation-delay: 0s;
        background-color: #eb5b29;

    }

    .circles li:nth-child(6){
        left: 75%;
        width: 110px;
        height: 110px;
        animation-delay: 3s;
        background-color: #63338a;

    }

    .circles li:nth-child(7){
        left: 35%;
        width: 150px;
        height: 150px;
        animation-delay: 7s;
        background-color: #0d71b8;
    }

    .circles li:nth-child(8){
        left: 50%;
        width: 25px;
        height: 25px;
        animation-delay: 15s;
        animation-duration: 45s;
        background-color: #63338a;
    }

    .circles li:nth-child(9){
        left: 20%;
        width: 15px;
        height: 15px;
        animation-delay: 2s;
        animation-duration: 35s;
        background-color: #eb5b29;
    }

    .circles li:nth-child(10){
        left: 85%;
        width: 150px;
        height: 150px;
        animation-delay: 0s;
        animation-duration: 11s;
        background-color: #c12a2e;
    }



@keyframes animate {

    0%{
        transform: translateY(0) rotate(0deg);
        opacity: 1;
        border-radius: 0;
    }

    100%{
        transform: translateY(-1000px) rotate(720deg);
        opacity: 0;
        border-radius: 50%;
    }

}

.register-ask{
    padding-bottom: 3rem;
}

.register-ask a{
    color: #0d71b8;
    text-decoration: underline;
}


.error{
    color: darkred;
    font-weight: 500;
    padding-top: 2rem;
}
</style>