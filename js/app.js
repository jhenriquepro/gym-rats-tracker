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

    // Função para preencher a lista do modal com Ícones de Ação
    function populateWorkoutList() {
        const templates = StorageService.get('gym_rats_templates') || [];
        listSaved.innerHTML = '';

        if (templates.length === 0) {
            listSaved.innerHTML = `<p style="text-align:center; padding: 20px; color: #888;">Nenhum treino criado.<br>Clique em "+ CRIAR NOVO TREINO".</p>`;
            return;
        }

        templates.forEach(template => {
            // Cria o container da linha (div)
            const itemRow = document.createElement('div');
            itemRow.className = 'template-item'; // Classe CSS nova

            itemRow.innerHTML = `
                <button class="template-info-btn">
                    <strong>${template.name}</strong> 
                    <span style="font-size:0.8em; color: #888; margin-left: 5px;">(${template.exercises.length} ex)</span>
                </button>

                <div class="template-actions">
                    <button class="btn-icon-action btn-edit" title="Editar">
                        ✏️
                    </button>
                    <button class="btn-icon-action btn-delete" title="Excluir">
                        🗑️
                    </button>
                </div>
            `;

            // EVENTO 1: Iniciar Treino (Clicar no nome)
            itemRow.querySelector('.template-info-btn').addEventListener('click', () => {
                modalSelect.close();
                startWorkout(template);
            });

            // EVENTO 2: Editar Treino (Clicar no Lápis)
            itemRow.querySelector('.btn-edit').addEventListener('click', (e) => {
                e.stopPropagation(); // Impede de iniciar o treino ao clicar no ícone
                modalSelect.close();

                // Navega para a tela de criação
                navigateTo('view-create-workout');

                // Carrega os dados para edição
                createWorkoutView.loadTemplateForEditing(template);
            });

            // EVENTO 3: Excluir Treino (Clicar no Lixo)
            itemRow.querySelector('.btn-delete').addEventListener('click', (e) => {
                e.stopPropagation();
                if (confirm(`Tem certeza que deseja apagar o treino "${template.name}"?`)) {
                    // Remove do array
                    const updatedTemplates = templates.filter(t => t.id !== template.id);
                    StorageService.save('gym_rats_templates', updatedTemplates);

                    // Recarrega a lista visualmente
                    populateWorkoutList();
                }
            });

            listSaved.appendChild(itemRow);
        });
    }

    function startWorkout(template) {
        // 1. Navega para tela de log
        navigateTo('view-log-workout');

        // 2. Manda a View carregar os dados e INICIAR O TIMER
        logWorkoutView.startNewSession(template);
    }

});