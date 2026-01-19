// js/views/CreateWorkoutView.js
import { StorageService } from '../services/StorageService.js';

export class CreateWorkoutView {
    constructor() {
        this.inputName = document.getElementById('inp-plan-name');
        this.inputExName = document.getElementById('inp-new-exercise');
        this.inputExSets = document.getElementById('inp-new-sets');
        this.btnAdd = document.getElementById('btn-append-exercise');
        this.form = document.getElementById('form-create-workout');
        this.btnCancel = document.getElementById('btn-cancel-create');
        this.previewList = document.getElementById('preview-list');
        this.submitBtn = this.form.querySelector('button[type="submit"]'); // Captura o botão de salvar

        this.tempExercises = [];
        this.STORAGE_KEY_TEMPLATES = 'gym_rats_templates';

        // [NOVO] Variável para saber se estamos editando (guarda o ID do treino)
        this.editingId = null;

        this.init();
    }

    init() {
        this.attachEvents();
    }

    // [NOVO] Método chamado pelo app.js quando clica no Lápis
    loadTemplateForEditing(template) {
        this.editingId = template.id; // Marca que estamos editando este ID

        // Preenche os campos
        this.inputName.value = template.name;
        this.tempExercises = [...template.exercises]; // Copia os exercícios

        // Muda o texto do botão para dar feedback visual
        this.submitBtn.innerText = "ATUALIZAR TREINO";

        this.renderPreview();
    }

    attachEvents() {
        this.btnAdd.addEventListener('click', () => this.addExerciseToPreview());

        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveTemplate();
        });

        this.btnCancel.addEventListener('click', (e) => {
            e.preventDefault();
            // Se cancelar, volta para o dashboard
            document.querySelector('[data-target="view-dashboard"]').click();
            this.resetForm();
        });
    }

    addExerciseToPreview() {
        const name = this.inputExName.value.trim();
        const sets = parseInt(this.inputExSets.value);

        if (!name || isNaN(sets) || sets <= 0) {
            alert("Digite um nome válido e número de séries.");
            return;
        }

        this.tempExercises.push({ name, sets });
        this.renderPreview();

        this.inputExName.value = '';
        this.inputExSets.value = '';
        this.inputExName.focus();
    }

    renderPreview() {
        this.previewList.innerHTML = '';
        this.tempExercises.forEach((ex, index) => {
            const li = document.createElement('li');
            // Mantive seu estilo inline anterior, mas idealmente iria para o CSS
            li.style.cssText = "background: #2c2c2e; padding: 10px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;";

            li.innerHTML = `
                <span><strong>${ex.name}</strong> <small>(${ex.sets} séries)</small></span>
                <button type="button" class="btn-remove-item" style="color: #ff453a; background: none; font-weight: bold; cursor: pointer;">✕</button>
            `;

            li.querySelector('.btn-remove-item').addEventListener('click', () => {
                this.tempExercises.splice(index, 1);
                this.renderPreview();
            });

            this.previewList.appendChild(li);
        });
    }

    saveTemplate() {
        const planName = this.inputName.value.trim();

        if (!planName) {
            alert("Dê um nome ao seu treino.");
            return;
        }
        if (this.tempExercises.length === 0) {
            alert("Adicione pelo menos um exercício.");
            return;
        }

        const templates = StorageService.get(this.STORAGE_KEY_TEMPLATES) || [];

        const workoutData = {
            id: this.editingId || Date.now(), // Se editando usa o ID antigo, se não, cria novo
            name: planName,
            exercises: this.tempExercises
        };

        if (this.editingId) {
            // [NOVO] Lógica de Atualização
            const index = templates.findIndex(t => t.id === this.editingId);
            if (index !== -1) {
                templates[index] = workoutData; // Substitui o antigo
                alert("✅ Treino atualizado com sucesso!");
            }
        } else {
            // Lógica de Criação Nova
            templates.push(workoutData);
            alert("✅ Novo treino criado com sucesso!");
        }

        StorageService.save(this.STORAGE_KEY_TEMPLATES, templates);

        this.resetForm();
        document.querySelector('[data-target="view-dashboard"]').click();
    }

    resetForm() {
        this.inputName.value = '';
        this.inputExName.value = '';
        this.inputExSets.value = '';
        this.tempExercises = [];
        this.editingId = null; // Limpa o estado de edição
        this.submitBtn.innerText = "SALVAR TREINO"; // Volta texto original
        this.renderPreview();
    }
}