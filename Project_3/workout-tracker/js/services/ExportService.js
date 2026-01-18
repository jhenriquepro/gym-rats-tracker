// js/services/ExportService.js

export class ExportService {
  /**
   * Export workout to Excel
   */
  static async exportToExcel(workout, fileName = 'Workout') {
    await this.loadScript('https://cdn.jsdelivr.net/npm/xlsx/dist/xlsx.full.min.js');

    const workbook = XLSX.utils.book_new();

    // === Sheet 1: Summary ===
    const summary = this.generateSummary(workout);
    const summarySheet = XLSX.utils.json_to_sheet(summary);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

    // === Sheet 2: Detailed Exercises ===
    const exerciseData = this.flattenExercises(workout.exercises);
    const exerciseSheet = XLSX.utils.json_to_sheet(exerciseData);
    this.styleExcelSheet(exerciseSheet);
    XLSX.utils.book_append_sheet(workbook, exerciseSheet, 'Exercises');

    XLSX.writeFile(workbook, `${fileName}.xlsx`);
  }

  /**
   * Export workout to PDF (CORRIGIDO)
   */
  static async exportToPDF(workout, fileName = 'Workout') {
    // 1. Carrega o jsPDF (Core)
    await this.loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');

    // 2. Carrega o AutoTable (Plugin de Tabela) - ESSENCIAL PARA O ERRO SUMIR
    await this.loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.31/jspdf.plugin.autotable.min.js');

    const { jsPDF } = window.jspdf;

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    let yPosition = 15;

    // Header
    doc.setFontSize(18);
    doc.text('RELATÓRIO DE TREINO', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 10;

    // Summary Info
    doc.setFontSize(10);
    const workoutDate = new Date(workout.startTime).toLocaleDateString('pt-BR');
    const duration = this.calculateDuration(workout.startTime, workout.endTime);

    doc.text(`Data: ${workoutDate}`, 15, yPosition);
    yPosition += 7;
    doc.text(`Duração: ${duration}`, 15, yPosition);
    yPosition += 7;
    doc.text(`Total Exercícios: ${workout.exercises.length}`, 15, yPosition);
    yPosition += 12;

    // Exercises Table
    doc.setFontSize(12);
    doc.text('DETALHES', 15, yPosition);
    yPosition += 5; // Pequeno ajuste para a tabela não ficar em cima do título

    const tableData = workout.exercises.map(ex => [
      ex.name,
      ex.sets.length,
      ex.sets.map(s => `${s.weight || '-'}kg × ${s.reps || '-'}`).join(' | ')
    ]);

    // Agora doc.autoTable vai funcionar porque carregamos o script no passo 2
    doc.autoTable({
      head: [['Exercício', 'Séries', 'Detalhes (Carga x Reps)']],
      body: tableData,
      startY: yPosition,
      margin: 15,
      columnStyles: {
        0: { cellWidth: 50 },
        1: { cellWidth: 20 },
        2: { cellWidth: 'auto' }
      },
      headStyles: {
        fillColor: [204, 255, 0], // Seu Neon Lime
        textColor: [0, 0, 0],     // Texto preto
        fontStyle: 'bold'
      }
    });

    doc.save(`${fileName}.pdf`);
  }

  /**
   * Export as CSV (simple format)
   */
  static exportToCSV(workout, fileName = 'Workout') {
    const rows = [];
    rows.push(['RELATORIO DE TREINO']);
    rows.push([]);
    rows.push([
      'Data:',
      new Date(workout.startTime).toLocaleDateString(),
      'Duracao:',
      this.calculateDuration(workout.startTime, workout.endTime)
    ]);
    rows.push([]);
    rows.push(['Exercicio', 'Serie', 'Peso (kg)', 'Reps', 'RPE']);

    workout.exercises.forEach(exercise => {
      exercise.sets.forEach((set, idx) => {
        rows.push([
          idx === 0 ? exercise.name : '',
          set.index,
          set.weight || '-',
          set.reps || '-',
          set.rpe || '-'
        ]);
      });
    });

    const csvContent = rows.map(row =>
      row.map(cell => `"${cell}"`).join(',')
    ).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  // ===== HELPER METHODS =====

  static async loadScript(src) {
    return new Promise((resolve, reject) => {
      // Verifica se O SCRIPT ESPECÍFICO já foi carregado procurando pelo src no DOM
      // Isso impede que ele pule o carregamento do autotable só porque o jspdf já existe
      if (document.querySelector(`script[src="${src}"]`)) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = src;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Failed to load ${src}`));
      document.head.appendChild(script);
    });
  }

  static generateSummary(workout) {
    const startDate = new Date(workout.startTime);
    const duration = this.calculateDuration(workout.startTime, workout.endTime);

    return [{
      'Data': startDate.toLocaleDateString(),
      'Inicio': startDate.toLocaleTimeString(),
      'Duracao': duration,
      'Exercicios': workout.exercises.length,
      'Total Series': workout.exercises.reduce((sum, ex) => sum + ex.sets.length, 0)
    }];
  }

  static flattenExercises(exercises) {
    const flattened = [];
    exercises.forEach((exercise) => {
      exercise.sets.forEach((set) => {
        flattened.push({
          'Exercicio': exercise.name,
          'Serie #': set.index,
          'Peso (kg)': set.weight || '-',
          'Reps': set.reps || '-',
          'RPE': set.rpe || '-'
        });
      });
    });
    return flattened;
  }

  static styleExcelSheet(sheet) {
    sheet['!cols'] = [
      { wch: 20 }, { wch: 8 }, { wch: 12 }, { wch: 8 }, { wch: 10 }
    ];
  }

  static calculateDuration(startTime, endTime) {
    if (!startTime || !endTime) return 'N/A';
    const diffMs = endTime - startTime;
    const diffMins = Math.floor(diffMs / 60000);
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  }
}