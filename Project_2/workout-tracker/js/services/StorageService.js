// js/services/StorageService.js

export class StorageService {
    
    // Salva qualquer dado com uma chave específica
    static save(key, data) {
        try {
            // JSON.stringify: Converte Objeto JS -> String Texto
            const serializedData = JSON.stringify(data);
            localStorage.setItem(key, serializedData);
        } catch (error) {
            console.error("Erro ao salvar no LocalStorage:", error);
        }
    }

    // Recupera o dado
    static get(key) {
        try {
            const serializedData = localStorage.getItem(key);
            if (!serializedData) return null;

            // JSON.parse: Converte String Texto -> Objeto JS
            return JSON.parse(serializedData);
        } catch (error) {
            console.error("Erro ao ler do LocalStorage:", error);
            return null;
        }
    }
}