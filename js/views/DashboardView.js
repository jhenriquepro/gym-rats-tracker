// js/views/DashboardView.js
import { StorageService } from '../services/StorageService.js';

export class DashboardView {
    constructor() {
        this.statsContainer = document.getElementById('dashboard-stats-container');

        // Estado: Começa exibindo a data de hoje (Mês/Ano atual)
        this.viewDate = new Date();

        this.init();
    }

    init() {
        this.renderCalendar();
    }

    changeMonth(offset) {
        // Altera o mês (ex: +1 ou -1)
        this.viewDate.setMonth(this.viewDate.getMonth() + offset);
        this.renderCalendar(); // Redesenha a tela
    }

    renderCalendar() {
        // 1. Recupera o histórico de treinos salvos
        const history = StorageService.get('gym_rats_history') || [];

        // Cria um Set (lista única) com as datas que tiveram treino.
        // Formato esperado salvo no LogWorkoutView: "Sun Oct 27 2025" (toDateString)
        const workoutDates = new Set(history.map(h => h.dateString));

        // 2. Configurações da Data da Visualização
        const year = this.viewDate.getFullYear();
        const month = this.viewDate.getMonth();

        // Configura local para Português
        const monthName = this.viewDate.toLocaleDateString('pt-BR', { month: 'long' });

        // Primeiro dia do mês (0 = Domingo, 1 = Segunda...)
        const firstDayIndex = new Date(year, month, 1).getDay();

        // Total de dias no mês
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        // Data de HOJE (para marcar o dia atual com borda)
        const today = new Date();
        const isCurrentMonth = today.getMonth() === month && today.getFullYear() === year;

        // 3. Monta o HTML
        // Cabeçalho com Botões de Navegação
        let html = `
            <div class="calendar-wrapper">
                <div class="calendar-header-nav">
                    <button id="btn-prev-month" class="btn-calendar-nav">‹</button>
                    <h3 style="text-transform: capitalize;">${monthName} <span style="color:#666">${year}</span></h3>
                    <button id="btn-next-month" class="btn-calendar-nav">›</button>
                </div>

                <div class="calendar-grid">
        `;

        // Dias Vazios (Padding) antes do dia 1
        for (let i = 0; i < firstDayIndex; i++) {
            html += `<div class="calendar-day empty"></div>`;
        }

        // Dias do Mês (1 a 31)
        for (let i = 1; i <= daysInMonth; i++) {
            // Cria a string de data para comparar com o histórico
            // Nota: Precisamos criar o objeto Date corretamente para o toDateString bater
            const dateCheck = new Date(year, month, i).toDateString();

            // Verifica se TREINOU neste dia
            const hasWorkout = workoutDates.has(dateCheck);

            // Verifica se é HOJE
            const isToday = isCurrentMonth && i === today.getDate();

            // Define as classes CSS
            let classes = 'calendar-day';
            if (hasWorkout) classes += ' day-active'; // <--- AQUI A MÁGICA DA COR
            if (isToday) classes += ' day-today';

            html += `
                <div class="${classes}">
                    <span>${i}</span>
                </div>
            `;
        }

        html += `
                </div>
                <div class="calendar-footer">
                    <div class="calendar-legend">
                        <span class="dot-legend"></span> Treino Finalizado
                    </div>
                </div>
            </div>`;

        this.statsContainer.innerHTML = html;

        // 4. Reconecta os eventos dos botões (pois o HTML foi refeito)
        document.getElementById('btn-prev-month').addEventListener('click', () => this.changeMonth(-1));
        document.getElementById('btn-next-month').addEventListener('click', () => this.changeMonth(1));
    }
}