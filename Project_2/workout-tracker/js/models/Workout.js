// js/models/Workout.js
export class Workout {
    constructor() {
        this.id = Date.now();
        this.startTime = null;
        this.endTime = null;
        this.exercises = [];
    }

    start() {
        if (!this.startTime) {
            this.startTime = Date.now();
        }
    }

    addExercise(name, setsCount) {
        const newExercise = {
            id: Date.now() + Math.random(), // ID único para o exercício
            name: name,
            sets: Array.from({ length: setsCount }, (_, i) => ({
                index: i + 1,
                weight: '',
                reps: '',
                rpe: '',
                completed: false
            }))
        };
        this.exercises.push(newExercise);
    }

    updateSet(exerciseIndex, setIndex, field, value) {
        // Verificação de segurança para evitar erro de "undefined"
        if (this.exercises[exerciseIndex]?.sets[setIndex]) {
            this.exercises[exerciseIndex].sets[setIndex][field] = value;
        }
    }
}