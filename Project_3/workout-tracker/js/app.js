import { LogWorkoutView } from './views/LogWorkoutView.js';
import { CreateWorkoutView } from './views/CreateWorkoutView.js';
import { DashboardView } from './views/DashboardView.js';
import { AuthService } from './services/AuthService.js';
import { StorageService } from './services/StorageService.js';

document.addEventListener('DOMContentLoaded', () => {

    // --- 1. Elementos UI Globais ---
    const btnProfile = document.getElementById('btn-user-profile');
    const modalLogin = document.getElementById('modal-login');
    const formLogin = document.getElementById('form-login');
    const btnGoogle = document.getElementById('btn-google-login');
    const btnCloseLogin = document.getElementById('btn-close-login');
    const profileIconText = btnProfile.querySelector('.icon');

    // Variável de estado do usuário
    let currentUser = null;

    // --- 2. Inicialização de Views ---
    const logWorkoutView = new LogWorkoutView();
    const createWorkoutView = new CreateWorkoutView();
    // Dashboard é instanciado depois, pois precisa saber do usuário para carregar o histórico correto
    let dashboardView = null;

    // 2. Elementos Globais
    const sections = document.querySelectorAll('.view-section');
    const modalSelect = document.getElementById('modal-select-workout');
    const listSaved = document.getElementById('list-saved-workouts');

    // --- 3. Lógica de Autenticação ---

    // Escuta mudanças de estado (Login/Logout)
    AuthService.onStateChanged((user) => {
        currentUser = user;

        if (user) {
            // USUÁRIO LOGADO
            const initial = user.email ? user.email[0].toUpperCase() : 'U';
            profileIconText.innerText = initial; // Troca "User" pela inicial
            btnProfile.style.borderColor = 'var(--color-primary)';

            // Configura Storage para usar ID do usuário
            StorageService.setUserId(user.uid);
        } else {
            // USUÁRIO DESLOGADO
            profileIconText.innerText = 'Log In';
            btnProfile.style.borderColor = 'var(--color-border)';
            profileIconText.style.fontSize = '0.6rem'; // Texto menor para caber

            StorageService.setUserId(null);
        }

        // Recarrega o Dashboard para atualizar o calendário com os dados do usuário certo
        dashboardView = new DashboardView();
    });

    // Clique no Botão de Perfil
    btnProfile.addEventListener('click', () => {
        if (currentUser) {
            // Se já logado, oferece Logout
            if (confirm(`Logado como ${currentUser.email}.\nDeseja sair?`)) {
                AuthService.logout();
            }
        } else {
            // Se não logado, abre modal
            modalLogin.showModal();
        }
    });

    // Login via Formulário (Email/Senha)
    formLogin.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('inp-email').value;
        const password = document.getElementById('inp-password').value;

        try {
            await AuthService.loginEmail(email, password);
            modalLogin.close();
        } catch (error) {
            alert("Erro no login: " + error.message);
        }
    });

    // Login via Google
    btnGoogle.addEventListener('click', async () => {
        try {
            await AuthService.loginGoogle();
            modalLogin.close();
        } catch (error) {
            alert("Erro no login Google. Verifique a configuração no código.");
        }
    });

    btnCloseLogin.addEventListener('click', () => modalLogin.close());

    // --- NAVEGAÇÃO SPA ---
    function navigateTo(targetId) {
        sections.forEach(sec => sec.classList.add('hidden'));
        sections.forEach(sec => sec.classList.remove('active'));

        const target = document.getElementById(targetId);
        if (target) {
            target.classList.remove('hidden');
            target.classList.add('active');
        }

        // Atualiza Navbar
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.target === targetId) item.classList.add('active');
        });
    }

    // Eventos de Navegação (Botões e Links)
    document.querySelectorAll('[data-target]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            navigateTo(link.dataset.target);
        });
    });

    // --- LÓGICA DO DASHBOARD ---

    // Botão "INICIAR TREINO" -> Abre Modal
    document.getElementById('btn-start-selection').addEventListener('click', () => {
        populateWorkoutList();
        modalSelect.showModal();
    });

    // Fechar Modal
    document.getElementById('btn-close-selection').addEventListener('click', () => {
        modalSelect.close();
    });

    // Função para preencher a lista do modal
    function populateWorkoutList() {
        const templates = StorageService.get('gym_rats_templates') || [];
        listSaved.innerHTML = '';

        if (templates.length === 0) {
            listSaved.innerHTML = `<p style="text-align:center; padding: 20px;">Nenhum treino criado.<br>Clique em "Criar Novo Treino".</p>`;
            return;
        }

        templates.forEach(template => {
            const btn = document.createElement('button');
            btn.className = 'btn-secondary'; // Reutiliza estilo CSS
            btn.style.textAlign = 'left';
            btn.style.marginBottom = '10px';
            btn.innerHTML = `<strong>${template.name}</strong> <span style="font-size:0.8em">(${template.exercises.length} exercícios)</span>`;

            // CLIQUE NO TREINO DA LISTA
            btn.addEventListener('click', () => {
                modalSelect.close();
                startWorkout(template); // Inicia fluxo
            });

            listSaved.appendChild(btn);
        });
    }

    function startWorkout(template) {
        // 1. Navega para tela de log
        navigateTo('view-log-workout');

        // 2. Manda a View carregar os dados e INICIAR O TIMER
        logWorkoutView.startNewSession(template);
    }

});