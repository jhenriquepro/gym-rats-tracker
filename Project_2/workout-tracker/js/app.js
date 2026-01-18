// js/app.js
import { LogWorkoutView } from './views/LogWorkoutView.js';

document.addEventListener('DOMContentLoaded', () => {
    // 1. Inicializa as Views
    const logView = new LogWorkoutView();

    // 2. Lógica Simples de Navegação (Router básico)
    const navLinks = document.querySelectorAll('[data-target]');
    const sections = document.querySelectorAll('.view-section');

    function navigateTo(targetId) {
        // Esconde todas as seções
        sections.forEach(sec => sec.classList.add('hidden'));
        sections.forEach(sec => sec.classList.remove('active'));

        // Mostra a alvo
        const targetSection = document.getElementById(targetId);
        if (targetSection) {
            targetSection.classList.remove('hidden');
            targetSection.classList.add('active');
        }

        // Atualiza Nav (opcional visual)
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.target === targetId) item.classList.add('active');
        });
    }

    // Attach click events
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            // Pega o target do atributo data-target ou data-link
            const target = link.dataset.target || link.dataset.link;
            navigateTo(target);
        });
    });

    console.log("App Inicializado 🚀");
});