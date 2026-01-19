import { Workout } from '../models/Workout.js';
import { StorageService } from '../services/StorageService.js';
import { ExportService } from '../services/ExportService.js';
import { Timer } from '../utils/Timer.js';

export class LogWorkoutView {
    constructor() {
        this.form = document.getElementById('form-log-workout');
        this.setsContainer = document.getElementById('sets-container');
        this.btnCancel = document.getElementById('btn-cancel-log');
        this.viewHeader = document.querySelector('#view-log-workout .view-header');
        this.titleElement = document.getElementById('log-title');

        this.currentWorkout = new Workout();
        this.STORAGE_KEY_CURRENT = 'gym_rats_current_session';
        this.timerElement = null;

        // [NOVO] Objeto para armazenar os intervalos de descanso de cada exercício individualmente
        // Ex: { 0: 1234, 1: 5678 } (IndexDoExercicio: IDdoIntervalo)
        this.activeRestTimers = {};

        this.timer = new Timer((timeString) => {
            if (this.timerElement) this.timerElement.innerText = timeString;
        });

        this.init();
    }

    init() {
        this.createTimerElement();
        this.attachEvents();
    }

    startNewSession(template) {
        this.currentWorkout = new Workout();
        this.setsContainer.innerHTML = '';
        this.titleElement.innerText = template.name;

        // Limpa timers antigos se houver
        this.activeRestTimers = {};

        template.exercises.forEach(ex => {
            this.currentWorkout.addExercise(ex.name, ex.sets);
        });

        this.currentWorkout.start();
        this.timer.start();
        this.renderList();
        this.saveState();
    }

    createTimerElement() {
        if (document.getElementById('workout-timer-display')) return;
        const timerDisplay = document.createElement('div');
        timerDisplay.id = 'workout-timer-display';
        timerDisplay.className = 'timer-display';
        timerDisplay.innerText = "00:00";
        this.viewHeader.appendChild(timerDisplay);
        this.timerElement = timerDisplay;
    }

    saveState() {
        StorageService.save(this.STORAGE_KEY_CURRENT, this.currentWorkout);
    }

    async handleFinishWorkout() {
        if (!confirm("Finalizar treino?")) return;
        this.timer.stop();

        // [NOVO] Limpa todos os timers de descanso ao finalizar
        Object.values(this.activeRestTimers).forEach(intervalId => clearInterval(intervalId));

        this.currentWorkout.endTime = Date.now();
        // --- [NOVO] SALVAR NO HISTÓRICO ---
        const history = StorageService.get('gym_rats_history') || [];
        // Salva apenas um resumo leve para não pesar a memória
        history.push({
            id: this.currentWorkout.id,
            name: this.titleElement.innerText, // Nome do treino (Ex: Treino A)
            endTime: this.currentWorkout.endTime,
            dateString: new Date().toDateString()
        });
        StorageService.save('gym_rats_history', history);
        // ----------------------------------

        this.saveState(); // Limpa current session
        StorageService.save(this.STORAGE_KEY_CURRENT, null);

        const exportChoice = prompt("Exportar?\n1-Excel\n2-PDF\n3-CSV\nCancelar para sair.", "1");

        try {
            const fileName = `${this.titleElement.innerText}_${new Date().toISOString().split('T')[0]}`;
            if (exportChoice === '1') await ExportService.exportToExcel(this.currentWorkout, fileName);
            else if (exportChoice === '2') await ExportService.exportToPDF(this.currentWorkout, fileName);
            else if (exportChoice === '3') ExportService.exportToCSV(this.currentWorkout, fileName);
        } catch (e) { console.error(e); }

        this.resetView();
        document.querySelector('[data-target="view-dashboard"]').click();
    }

    resetView() {
        this.timer.stop();
        // Limpa timers de descanso
        Object.values(this.activeRestTimers).forEach(intervalId => clearInterval(intervalId));
        this.activeRestTimers = {};

        this.currentWorkout = new Workout();
        this.setsContainer.innerHTML = '';
        this.timerElement.innerText = "00:00";
        this.titleElement.innerText = "Treino";
    }

    renderList() {
        this.setsContainer.innerHTML = '';

        this.currentWorkout.exercises.forEach((exercise, exIndex) => {
            const card = document.createElement('div');
            card.className = 'exercise-card';

            // 1. Nome do Exercício (Topo)
            let html = `
                <div class="exercise-header">
                    <strong>${exercise.name}</strong>
                </div>
            `;

            // 2. Loop das Séries (Inputs)
            exercise.sets.forEach((set, setIndex) => {
                html += `
                <div class="set-row">
                    <span class="set-index">${setIndex + 1}</span>
                    <input type="number" class="inp-set" placeholder="KG" 
                        data-ex="${exIndex}" data-set="${setIndex}" data-field="weight" value="${set.weight}">
                    <input type="number" class="inp-set" placeholder="Reps" 
                        data-ex="${exIndex}" data-set="${setIndex}" data-field="reps" value="${set.reps}">
                    <input type="number" class="inp-set" placeholder="RPE" 
                        data-ex="${exIndex}" data-set="${setIndex}" data-field="rpe" value="${set.rpe}">
                </div>`;
            });

            // 3. Timer de Descanso (AGORA ABAIXO E ALINHADO)
            // Criamos uma div .set-row para manter o layout, com um span vazio na esquerda
            html += `
                <div class="set-row" style="margin-top: 10px;">
                    <span class="set-index" style="visibility: hidden;"></span>

                    <div class="rest-timer-box" id="rest-box-${exIndex}">
                        <span class="rest-label">Descanso</span>
                        
                        <div class="timer-inputs" id="timer-inputs-${exIndex}">
                            <input type="number" class="inp-timer inp-min" value="1" placeholder="m"> : 
                            <input type="number" class="inp-timer inp-sec" value="30" placeholder="s">
                        </div>

                        <div class="timer-countdown-text hidden" id="timer-display-${exIndex}">00:00</div>

                        <button type="button" class="btn-timer-toggle" data-ex="${exIndex}">▶</button>
                    </div>
                </div>
            `;

            card.innerHTML = html;
            this.setsContainer.appendChild(card);
        });

        this.attachInputListeners();
        this.attachTimerListeners();
    }

    attachInputListeners() {
        const inputs = this.setsContainer.querySelectorAll('.inp-set');
        inputs.forEach(input => {
            input.addEventListener('input', (e) => {
                const { ex, set, field } = e.target.dataset;
                this.currentWorkout.updateSet(ex, set, field, e.target.value);
                this.saveState();
            });
        });
    }

    // [NOVO] Gerencia os cliques no Play/Stop de cada exercício
    attachTimerListeners() {
        const buttons = this.setsContainer.querySelectorAll('.btn-timer-toggle');

        buttons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const exIndex = e.target.dataset.ex;
                this.toggleRestTimer(exIndex, btn);
            });
        });
    }

    // [NOVO] Lógica principal do Timer Regressivo Individual
    toggleRestTimer(exIndex, btn) {
        const box = document.getElementById(`rest-box-${exIndex}`);
        const inputsDiv = document.getElementById(`timer-inputs-${exIndex}`);
        const displayDiv = document.getElementById(`timer-display-${exIndex}`);

        const inpMin = box.querySelector('.inp-min');
        const inpSec = box.querySelector('.inp-sec');

        // Se já existe um timer rodando para esse exercício, vamos PARAR (Stop)
        if (this.activeRestTimers[exIndex]) {
            clearInterval(this.activeRestTimers[exIndex]);
            delete this.activeRestTimers[exIndex];

            // Restaura visual
            box.classList.remove('running');
            inputsDiv.classList.remove('hidden');
            displayDiv.classList.add('hidden');
            btn.innerText = "▶"; // Volta para Play
            return;
        }

        // Se não está rodando, vamos INICIAR (Play)
        let min = parseInt(inpMin.value) || 0;
        let sec = parseInt(inpSec.value) || 0;
        let totalSeconds = (min * 60) + sec;

        if (totalSeconds <= 0) return; // Não inicia se for 0

        // Atualiza visual para modo "Rodando"
        box.classList.add('running');
        inputsDiv.classList.add('hidden');
        displayDiv.classList.remove('hidden');
        btn.innerText = "■"; // Ícone de Stop

        // Função para formatar MM:SS
        const updateDisplay = (s) => {
            const m = Math.floor(s / 60).toString().padStart(2, '0');
            const secRem = (s % 60).toString().padStart(2, '0');
            displayDiv.innerText = `${m}:${secRem}`;
        };

        updateDisplay(totalSeconds); // Mostra tempo inicial imediatamente

        // Inicia o Intervalo
        this.activeRestTimers[exIndex] = setInterval(() => {
            totalSeconds--;

            if (totalSeconds < 0) {
                // Timer Acabou!
                clearInterval(this.activeRestTimers[exIndex]);
                delete this.activeRestTimers[exIndex];

                // Toca um beep (opcional, simples do navegador)
                // const audio = new Audio('path/to/beep.mp3'); audio.play();

                // Volta ao estado inicial
                box.classList.remove('running');
                inputsDiv.classList.remove('hidden');
                displayDiv.classList.add('hidden');
                btn.innerText = "▶";

                // Feedback visual (piscar verde rapidinho)
                box.style.backgroundColor = "rgba(50, 215, 75, 0.5)";
                setTimeout(() => box.style.backgroundColor = "", 500);

            } else {
                updateDisplay(totalSeconds);
            }
        }, 1000);
    }

    attachEvents() {
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleFinishWorkout();
        });

        this.btnCancel.addEventListener('click', () => {
            if (confirm("Cancelar e descartar este treino?")) {
                StorageService.save(this.STORAGE_KEY_CURRENT, null);
                this.resetView();
                document.querySelector('[data-target="view-dashboard"]').click();
            }
        });
    }
}