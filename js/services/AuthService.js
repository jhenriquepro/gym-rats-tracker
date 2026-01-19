// js/services/AuthService.js

// Importa as funções oficiais do Firebase via CDN
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
    getAuth,
    signInWithPopup,
    GoogleAuthProvider,
    signOut,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// --- CONFIGURAÇÃO DO FIREBASE ---
const firebaseConfig = {
    apiKey: "AIzaSyA332XqKrA03fYrBfvyz1kMPFo5Hcx5ZD0",
    authDomain: "gym-rats-6cc81.firebaseapp.com",
    projectId: "gym-rats-6cc81",
    storageBucket: "gym-rats-6cc81.firebasestorage.app",
    messagingSenderId: "221626713042",
    appId: "1:221626713042:web:b8099fafb23b6cd9597e0b"
};

// Inicializa o Firebase
let app, auth, googleProvider;

try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    googleProvider = new GoogleAuthProvider();
} catch (error) {
    console.error("Erro ao inicializar Firebase. Verifique se copiou as chaves corretamente no AuthService.js");
}

export class AuthService {

    // Login com Google (Abre Janela Pop-up)
    static async loginGoogle() {
        try {
            const result = await signInWithPopup(auth, googleProvider);
            return result.user;
        } catch (error) {
            console.error("Erro Google Auth:", error);
            alert("Erro ao logar com Google: " + error.message);
            throw error;
        }
    }

    // Login com Email/Senha
    static async loginEmail(email, password) {
        try {
            const result = await signInWithEmailAndPassword(auth, email, password);
            return result.user;
        } catch (error) {
            console.log("Erro login:", error.code); // Para debug

            // [ATUALIZAÇÃO] Adicionado 'auth/invalid-credential' na verificação
            if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {

                // Vamos tentar criar a conta direto OU perguntar
                // Como invalid-credential pode ser senha errada também, o ideal é avisar:
                const confirmCreate = confirm("Login falhou (Senha errada ou Usuário inexistente).\nDeseja CRIAR uma nova conta com este e-mail?");

                if (confirmCreate) {
                    return this.registerEmail(email, password);
                }
            }
            throw error; // Se não for isso, joga o erro pra frente
        }
    }

    // Cria conta com Email/Senha (Auxiliar)
    static async registerEmail(email, password) {
        try {
            const result = await createUserWithEmailAndPassword(auth, email, password);
            return result.user;
        } catch (error) {
            console.error("Erro ao criar conta:", error);
            throw error;
        }
    }

    // Logout
    static async logout() {
        try {
            await signOut(auth);
            window.location.reload(); // Recarrega para limpar memória
        } catch (error) {
            console.error("Erro ao sair:", error);
        }
    }

    // Observador (Ouve se o usuário logou ou deslogou)
    static onStateChanged(callback) {
        if (!auth) return;

        onAuthStateChanged(auth, (user) => {
            callback(user);
        });
    }
}