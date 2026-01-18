// js/views/LogWorkoutView.js
import { Workout } from '../models/Workout.js';
import { StorageService } from '../services/StorageService.js';
import { ExportService } from '../services/ExportService.js';
import { Timer } from '../utils/Timer.js';

export class LogWorkoutView {
    constructor() {
        // Seletores
        this.form = document.getElementById('form-log-workout');
        this.exerciseSelect = document.getElementById('inp-exercise');
        this.setsContainer = document.getElementById('sets-container'); // ID Corrigido
        this.btnAddSet = document.getElementById('btn-add-set');
        this.btnCancel = document.getElementById('btn-cancel-log');

        // Contexto do cabeçalho para inserir o timer
        this.viewHeader = document.querySelector('#view-log-workout .view-header');

        // Estado
        this.currentWorkout = new Workout();
        this.STORAGE_KEY = 'gym_rats_last_workout';
        this.timerElement = null;

        // Instancia Timer
        this.timer = new Timer((timeString) => {
            if (this.timerElement) this.timerElement.innerText = timeString;
        });

        // Mock Data (Idealmente viria de um ExerciseService)
        this.mockExercises = [
            "Supino Reto", "Supino Inclinado", "Crucifixo",
            "Agachamento Livre", "Leg Press", "Extensora",
            "Levantamento Terra", "Remada Curvada", "Puxada Alta",
            "Rosca Direta", "Tríceps Testa", "Desenvolvimento Militar"
        ];

        this.init();
    }

    init() {
        this.populateDropdown();
        this.createTimerElement();
        this.createSaveIndicator();
        this.attachEvents();
        this.loadSavedWorkout();
    }

    // --- UI HELPERS ---

    createTimerElement() {
        if (document.getElementById('workout-timer-display')) return;

        const timerDisplay = document.createElement('div');
        timerDisplay.id = 'workout-timer-display';
        timerDisplay.className = 'timer-display'; // Use CSS para estilizar
        timerDisplay.innerText = "00:00";

        this.viewHeader.appendChild(timerDisplay);
        this.timerElement = timerDisplay;
    }

    createSaveIndicator() {
        if (document.getElementById('save-status')) return;

        const indicator = document.createElement('div');
        indicator.id = 'save-status';
        indicator.innerText = "☁️ Salvo";
        indicator.className = 'save-indicator'; // Use CSS para estilizar
        document.body.appendChild(indicator);
        this.saveIndicator = indicator;
    }

    triggerSaveFeedback() {
        if (!this.saveIndicator) return;

        this.saveIndicator.classList.add('visible');
        if (this.saveTimeout) clearTimeout(this.saveTimeout);

        this.saveTimeout = setTimeout(() => {
            this.saveIndicator.classList.remove('visible');
        }, 1500);
    }

    showModal(message) {
        const modal = document.getElementById('app-modal');
        const msgElement = document.getElementById('modal-message');
        const btnClose = document.getElementById('btn-close-modal');

        if (modal && msgElement) {
            msgElement.innerText = message;
            modal.showModal();
            btnClose.onclick = () => modal.close();
        } else {
            alert(message);
        }
    }

    // --- LÓGICA DE DADOS ---

    save() {
        StorageService.save(this.STORAGE_KEY, this.currentWorkout);
        this.triggerSaveFeedback();
    }

    loadSavedWorkout() {
        const savedData = StorageService.get(this.STORAGE_KEY);
        if (savedData && savedData.exercises && savedData.exercises.length > 0) {
            console.log("🔄 Restaurando treino anterior...");
            this.currentWorkout.id = savedData.id;
            this.currentWorkout.exercises = savedData.exercises;

            if (savedData.startTime) {
                this.currentWorkout.startTime = savedData.startTime;
                this.timer.start(this.currentWorkout.startTime);
            }
            this.renderList();
        }
    }

    // --- HANDLERS ---

    attachEvents() {
        this.btnAddSet.addEventListener('click', (e) => {
            e.preventDefault();
            this.handleAddExercise();
        });

        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleFinishWorkout();
        });

        if (this.btnCancel) {
            this.btnCancel.addEventListener('click', (e) => {
                e.preventDefault();
                if (confirm("Deseja cancelar e apagar este treino?")) {
                    this.resetView();
                }
            });
        }
    }

    handleAddExercise() {
        const exerciseName = this.exerciseSelect.value;
        if (!exerciseName) {
            this.showModal("⚠️ Por favor, selecione um exercício.");
            return;
        }

        let setsCount = prompt(`Quantas séries para ${exerciseName}?`, "3");
        if (setsCount === null) return; // Cancelado

        setsCount = parseInt(setsCount);
        if (isNaN(setsCount) || setsCount <= 0) {
            this.showModal("❌ Número inválido.");
            return;
        }

        // Inicia o timer se for o primeiro exercício
        if (!this.currentWorkout.startTime) {
            this.currentWorkout.startTime = this.timer.start();
        }

        this.currentWorkout.addExercise(exerciseName, setsCount);
        this.save();
        this.renderList();

        // Auto-scroll
        setTimeout(() => {
            this.setsContainer.lastElementChild?.scrollIntoView({ behavior: 'smooth' });
        }, 100);

        this.exerciseSelect.value = "";
    }

    async handleFinishWorkout() {
        if (!this.currentWorkout.startTime) {
            this.showModal("Nenhum treino iniciado para finalizar.");
            return;
        }

        if (!confirm("Deseja realmente finalizar o treino?")) return;

        this.timer.stop();
        this.currentWorkout.endTime = Date.now();
        this.save();

        const exportChoice = prompt(
            "TREINO FINALIZADO! 🎉\n\n" +
            "Escolha o formato de exportação:\n" +
            "[ 1 ] 📊 Excel\n" +
            "[ 2 ] 📄 PDF\n" +
            "[ 3 ] 📝 CSV\n\n" +
            "Cancelar para apenas salvar.", "1"
        );

        if (!exportChoice) {
            this.resetView();
            return;
        }

        try {
            const fileName = `Workout_${new Date().toISOString().split('T')[0]}`;

            if (exportChoice === '1') await ExportService.exportToExcel(this.currentWorkout, fileName);
            else if (exportChoice === '2') await ExportService.exportToPDF(this.currentWorkout, fileName);
            else if (exportChoice === '3') ExportService.exportToCSV(this.currentWorkout, fileName);

            this.showModal("✅ Arquivo gerado com sucesso!");
        } catch (error) {
            console.error(error);
            this.showModal("❌ Erro ao exportar ou cancelar.");
        } finally {
            this.resetView();
        }
    }

    resetView() {
        this.timer.stop();
        this.currentWorkout = new Workout();
        StorageService.save(this.STORAGE_KEY, {}); // Limpa storage
        this.setsContainer.innerHTML = '';
        this.timerElement.innerText = "00:00";
    }

    // --- RENDER ---

    renderList() {
        this.setsContainer.innerHTML = '';

        this.currentWorkout.exercises.forEach((exercise, exIndex) => {
            const card = document.createElement('div');
            card.className = 'exercise-card'; // Classe CSS

            // Header do Card
            let html = `
                <div class="exercise-header">
                    <strong>${exercise.name}</strong>
                    <small>${exercise.sets.length} séries</small>
                </div>
                <div class="sets-header">
                    <span>#</span>
                    <span>KG</span>
                    <span>Reps</span>
                    <span>RPE</span>
                </div>
            `;

            // Rows (Séries)
            exercise.sets.forEach((set, setIndex) => {
                html += `
                <div class="set-row">
                    <span class="set-index">${setIndex + 1}</span>
                    <input type="number" class="inp-set" placeholder="kg" 
                        data-ex="${exIndex}" data-set="${setIndex}" data-field="weight" value="${set.weight}">
                    <input type="number" class="inp-set" placeholder="reps" 
                        data-ex="${exIndex}" data-set="${setIndex}" data-field="reps" value="${set.reps}">
                    <input type="number" class="inp-set" placeholder="RPE" 
                        data-ex="${exIndex}" data-set="${setIndex}" data-field="rpe" value="${set.rpe}">
                </div>`;
            });

            card.innerHTML = html;
            this.setsContainer.appendChild(card);
        });

        this.attachInputListeners();
    }

    attachInputListeners() {
        const inputs = this.setsContainer.querySelectorAll('input');
        inputs.forEach(input => {
            input.addEventListener('input', (e) => {
                const { ex, set, field } = e.target.dataset;
                this.currentWorkout.updateSet(ex, set, field, e.target.value);
                this.save();
            });
        });
    }

    populateDropdown() {
        this.exerciseSelect.innerHTML = '<option value="" disabled selected>Selecionar...</option>';
        this.mockExercises.forEach(ex => {
            const option = document.createElement('option');
            option.value = ex;
            option.textContent = ex;
            this.exerciseSelect.appendChild(option);
        });
    }
}