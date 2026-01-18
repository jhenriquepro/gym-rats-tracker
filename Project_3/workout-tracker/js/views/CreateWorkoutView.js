import { StorageService } from '../services/StorageService.js';

export class CreateWorkoutView {
    constructor() {
        // Inputs
        this.inputName = document.getElementById('inp-plan-name');
        this.inputExName = document.getElementById('inp-new-exercise');
        this.inputExSets = document.getElementById('inp-new-sets');
        
        // Buttons
        this.btnAdd = document.getElementById('btn-append-exercise');
        this.form = document.getElementById('form-create-workout');
        this.btnCancel = document.getElementById('btn-cancel-create');
        
        // Containers
        this.previewList = document.getElementById('preview-list');

        // Estado Temporário (Lista de exercícios sendo montada)
        this.tempExercises = [];
        this.STORAGE_KEY_TEMPLATES = 'gym_rats_templates';

        this.init();
    }

    init() {
        this.attachEvents();
    }

    attachEvents() {
        // Botão "Adicionar" (Coloca na lista de baixo)
        this.btnAdd.addEventListener('click', () => this.addExerciseToPreview());

        // Botão Salvar (Finaliza o cadastro)
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveTemplate();
        });

        // Botão Cancelar
        this.btnCancel.addEventListener('click', (e) => {
            e.preventDefault();
            this.resetForm();
            // Volta para dashboard (simulado via evento global ou callback, 
            // mas aqui vamos apenas limpar e esconder se fosse SPA completa)
            document.querySelector('[data-target="view-dashboard"]').click();
        });
    }

    addExerciseToPreview() {
        const name = this.inputExName.value.trim();
        const sets = parseInt(this.inputExSets.value);

        if (!name || isNaN(sets) || sets <= 0) {
            alert("Digite um nome válido e número de séries.");
            return;
        }

        // Adiciona ao array temporário
        this.tempExercises.push({ name, sets });

        // Renderiza na tela
        this.renderPreview();

        // Limpa inputs pequenos
        this.inputExName.value = '';
        this.inputExSets.value = '';
        this.inputExName.focus();
    }

    renderPreview() {
        this.previewList.innerHTML = '';
        this.tempExercises.forEach((ex, index) => {
            const li = document.createElement('li');
            li.style.cssText = "background: #2c2c2e; padding: 10px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center;";
            
            li.innerHTML = `
                <span><strong>${ex.name}</strong> <small>(${ex.sets} séries)</small></span>
                <button type="button" class="btn-remove-item" style="color: #ff453a; background: none; font-weight: bold;">✕</button>
            `;

            // Evento para remover item da lista
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
            alert("Dê um nome ao seu treino (Ex: Perna).");
            return;
        }
        if (this.tempExercises.length === 0) {
            alert("Adicione pelo menos um exercício.");
            return;
        }

        // 1. Recupera templates já existentes
        const templates = StorageService.get(this.STORAGE_KEY_TEMPLATES) || [];

        // 2. Cria o novo objeto modelo
        const newTemplate = {
            id: Date.now(),
            name: planName,
            exercises: this.tempExercises // Array de {name, sets}
        };

        // 3. Salva
        templates.push(newTemplate);
        StorageService.save(this.STORAGE_KEY_TEMPLATES, templates);

        alert("✅ Treino Salvo com Sucesso!");
        this.resetForm();
        
        // Redireciona para o Dashboard
        document.querySelector('[data-target="view-dashboard"]').click();
    }

    resetForm() {
        this.inputName.value = '';
        this.inputExName.value = '';
        this.inputExSets.value = '';
        this.tempExercises = [];
        this.renderPreview();
    }
}