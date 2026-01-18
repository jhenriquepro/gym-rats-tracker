// js/utils/Timer.js

export class Timer {
    /**
     * @param {Function} onTickCallback - Função chamada a cada segundo com o texto formatado (ex: "01:30")
     */
    constructor(onTickCallback) {
        this.intervalId = null;
        this.startTime = null;
        this.onTick = onTickCallback;
    }

    /**
     * Inicia ou retoma o cronômetro.
     * @param {number|null} existingStartTime - Timestamp (Date.now()) se estiver restaurando um treino.
     * @returns {number} O timestamp de início (para ser salvo).
     */
    start(existingStartTime = null) {
        // Se não passar nada, assume que começou AGORA.
        this.startTime = existingStartTime || Date.now();
        
        // Garante que não haja dois intervalos rodando
        this.stop();

        // Atualiza imediatamente (sem esperar 1s) e inicia o loop
        this.tick();
        this.intervalId = setInterval(() => this.tick(), 1000);

        return this.startTime;
    }

    /**
     * Para o cronômetro (limpa o intervalo).
     */
    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }

    /**
     * Função interna chamada a cada segundo.
     */
    tick() {
        if (!this.startTime) return;

        const now = Date.now();
        const diff = now - this.startTime;
        
        // Formatação MM:SS
        const timeString = this.formatTime(diff);

        // Atualiza a tela através do callback
        if (this.onTick) this.onTick(timeString);
    }

    formatTime(ms) {
        const totalSeconds = Math.floor(ms / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
}