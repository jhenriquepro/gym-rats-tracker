// js/services/StorageService.js

export class StorageService {

    // Armazena o ID do usuário atual (se houver)
    static userId = null;

    static setUserId(uid) {
        this.userId = uid;
    }

    // Gera a chave. Ex: "user_123_gym_rats_last_workout" ou apenas "gym_rats_last_workout"
    static getKey(key) {
        if (this.userId) {
            return `user_${this.userId}_${key}`;
        }
        return key; // Modo visitante (sem login)
    }

    static save(key, data) {
        try {
            const finalKey = this.getKey(key);
            const serializedData = JSON.stringify(data);
            localStorage.setItem(finalKey, serializedData);
        } catch (error) {
            console.error("Erro ao salvar:", error);
        }
    }

    static get(key) {
        try {
            const finalKey = this.getKey(key);
            const serializedData = localStorage.getItem(finalKey);
            if (!serializedData) return null;
            return JSON.parse(serializedData);
        } catch (error) {
            console.error("Erro ao ler:", error);
            return null;
        }
    }
}