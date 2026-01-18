// js/views/DashboardView.js
import { StorageService } from '../services/StorageService.js';

export class DashboardView {
    constructor() {
        this.statsContainer = document.getElementById('dashboard-stats-container');
        // Inicializa o calendário
        this.renderCalendar();
    }

    renderCalendar() {
        // 1. Recupera histórico de treinos
        // Nota: Precisaremos garantir que o LogWorkoutView salve em 'gym_rats_history'
        const history = StorageService.get('gym_rats_history') || [];

        // Extrai apenas as datas (String: "2023-10-27") dos treinos finalizados
        const workoutDates = history.map(h => new Date(h.endTime).toDateString());

        // 2. Configurações de Data Atual
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth(); // 0 = Jan, 1 = Fev...

        // Nome do Mês
        const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

        // Dias no mês
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        // 3. Monta o HTML
        let html = `
            <div class="calendar-wrapper">
                <div class="calendar-header">
                    <h3>${monthNames[month]} <small>${year}</small></h3>
                    <div class="calendar-legend">
                        <span class="dot-legend"></span> Treino Feito
                    </div>
                </div>
                <div class="calendar-grid">
        `;

        // Loop para criar os dias (1 a 31)
        for (let i = 1; i <= daysInMonth; i++) {
            // Cria data para comparar
            const checkDate = new Date(year, month, i).toDateString();

            // Verifica se tem treino nesse dia
            const hasWorkout = workoutDates.includes(checkDate);
            const isToday = i === now.getDate();

            const activeClass = hasWorkout ? 'day-active' : '';
            const todayClass = isToday ? 'day-today' : '';

            html += `
                <div class="calendar-day ${activeClass} ${todayClass}">
                    <span>${i}</span>
                </div>
            `;
        }

        html += `</div></div>`; // Fecha grid e wrapper

        this.statsContainer.innerHTML = html;
    }
}