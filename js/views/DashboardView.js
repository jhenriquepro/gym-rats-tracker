// js/views/DashboardView.js
import { StorageService } from '../services/StorageService.js';

export class DashboardView {
    constructor() {
        this.statsContainer = document.getElementById('dashboard-stats-container');

        // Estado: Começa exibindo a data de hoje
        this.viewDate = new Date();

        this.init();
    }

    init() {
        this.renderCalendar();
    }

    renderCalendar() {
        // 1. Recupera histórico
        const history = StorageService.get('gym_rats_history') || [];
        // Cria lista de datas com treino (String formato "Sun Oct 27 2025")
        const workoutDates = new Set(history.map(h => h.dateString));

        // 2. Dados da Visualização Atual
        const viewYear = this.viewDate.getFullYear();
        const viewMonth = this.viewDate.getMonth(); // 0 a 11

        // Dados auxiliares
        const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
        const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
        const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay();

        // Data de HOJE (para marcar o dia atual)
        const today = new Date();
        const isCurrentMonth = today.getMonth() === viewMonth && today.getFullYear() === viewYear;

        // --- 3. CONSTRUÇÃO DO HTML ---

        // A) Construindo o Seletor de Meses
        let monthOptions = '';
        monthNames.forEach((name, index) => {
            const selected = index === viewMonth ? 'selected' : '';
            monthOptions += `<option value="${index}" ${selected}>${name}</option>`;
        });

        // B) Construindo o Seletor de Anos (2026 - 2030)
        let yearOptions = '';
        for (let y = 2026; y <= 2030; y++) {
            const selected = y === viewYear ? 'selected' : '';
            yearOptions += `<option value="${y}" ${selected}>${y}</option>`;
        }

        let html = `
            <div class="calendar-wrapper">
                
                <div class="calendar-controls">
                    <select id="sel-cal-month" class="inp-cal-select">
                        ${monthOptions}
                    </select>
                    
                    <select id="sel-cal-year" class="inp-cal-select">
                        ${yearOptions}
                    </select>
                </div>

                <div class="calendar-grid">
        `;

        // Dias Vazios (Padding)
        for (let i = 0; i < firstDayIndex; i++) {
            html += `<div class="calendar-day empty"></div>`;
        }

        // Dias do Mês
        for (let i = 1; i <= daysInMonth; i++) {
            const dateCheck = new Date(viewYear, viewMonth, i).toDateString();
            const hasWorkout = workoutDates.has(dateCheck);
            const isToday = isCurrentMonth && i === today.getDate();

            let classes = 'calendar-day';
            if (hasWorkout) classes += ' day-active';
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

        // 4. EVENTOS DE MUDANÇA (Recarrega o calendário ao trocar opção)

        const selMonth = document.getElementById('sel-cal-month');
        const selYear = document.getElementById('sel-cal-year');

        selMonth.addEventListener('change', (e) => {
            this.viewDate.setMonth(parseInt(e.target.value));
            this.renderCalendar(); // Redesenha
        });

        selYear.addEventListener('change', (e) => {
            this.viewDate.setFullYear(parseInt(e.target.value));
            this.renderCalendar(); // Redesenha
        });
    }
}