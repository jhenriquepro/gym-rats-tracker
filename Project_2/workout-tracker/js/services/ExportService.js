// js/services/ExportService.js

export class ExportService {
  /**
   * Export workout to Excel
   * @param {Workout} workout - Your workout object
   * @param {string} fileName - Output file name (without extension)
   */
  static async exportToExcel(workout, fileName = 'Workout') {
    // Dynamically load SheetJS from CDN
    const script = await this.loadScript('https://cdn.jsdelivr.net/npm/xlsx/dist/xlsx.full.min.js');
    
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
    
    // Download
    XLSX.writeFile(workbook, `${fileName}.xlsx`);
  }

  /**
   * Export workout to PDF
   * @param {Workout} workout - Your workout object
   * @param {string} fileName - Output file name (without extension)
   */
  static async exportToPDF(workout, fileName = 'Workout') {
    // Load jsPDF from CDN
    const jsPDFScript = await this.loadScript('https://cdn.jsdelivr.net/npm/jspdf/dist/jspdf.umd.min.js');
    const { jsPDF } = window.jspdf;
    
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPosition = 15;
    
    // Header
    doc.setFontSize(18);
    doc.text('WORKOUT REPORT', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 10;
    
    // Summary Info
    doc.setFontSize(10);
    const workoutDate = new Date(workout.startTime).toLocaleDateString();
    const duration = this.calculateDuration(workout.startTime, workout.endTime);
    
    doc.text(`Date: ${workoutDate}`, 15, yPosition);
    yPosition += 7;
    doc.text(`Duration: ${duration}`, 15, yPosition);
    yPosition += 7;
    doc.text(`Total Exercises: ${workout.exercises.length}`, 15, yPosition);
    yPosition += 12;
    
    // Exercises Table
    doc.setFontSize(12);
    doc.text('EXERCISES', 15, yPosition);
    yPosition += 8;
    
    const tableData = workout.exercises.map(ex => [
      ex.name,
      ex.sets.length,
      ex.sets.map(s => `${s.weight || '-'}kg × ${s.reps || '-'}`).join(' | ')
    ]);
    
    doc.autoTable({
      head: [['Exercise', 'Sets', 'Details']],
      body: tableData,
      startY: yPosition,
      margin: 15,
      columnStyles: {
        0: { cellWidth: 50 },
        1: { cellWidth: 20 },
        2: { cellWidth: pageWidth - 95 }
      },
      headStyles: {
        fillColor: [41, 150, 161], // Your teal color
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      }
    });
    
    // Save
    doc.save(`${fileName}.pdf`);
  }

  /**
   * Export as CSV (simple format)
   */
  static exportToCSV(workout, fileName = 'Workout') {
    const rows = [];
    
    // Header
    rows.push(['WORKOUT EXPORT']);
    rows.push([]);
    rows.push([
      'Date:',
      new Date(workout.startTime).toLocaleDateString(),
      'Duration:',
      this.calculateDuration(workout.startTime, workout.endTime)
    ]);
    rows.push([]);
    
    // Exercise data
    rows.push(['Exercise', 'Set', 'Weight (kg)', 'Reps', 'RPE', 'Completed']);
    
    workout.exercises.forEach(exercise => {
      exercise.sets.forEach((set, idx) => {
        rows.push([
          idx === 0 ? exercise.name : '',
          set.index,
          set.weight || '-',
          set.reps || '-',
          set.rpe || '-',
          set.completed ? 'Yes' : 'No'
        ]);
      });
    });
    
    // Convert to CSV string
    const csvContent = rows.map(row => 
      row.map(cell => `"${cell}"`).join(',')
    ).join('\n');
    
    // Download
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
      if (window.XLSX || window.jspdf) {
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
    const endDate = workout.endTime ? new Date(workout.endTime) : new Date();
    const duration = this.calculateDuration(workout.startTime, workout.endTime);
    
    return [{
      'Workout Date': startDate.toLocaleDateString(),
      'Start Time': startDate.toLocaleTimeString(),
      'Total Duration': duration,
      'Exercises': workout.exercises.length,
      'Total Sets': workout.exercises.reduce((sum, ex) => sum + ex.sets.length, 0),
      'Total Completed': workout.exercises.reduce((sum, ex) => 
        sum + ex.sets.filter(s => s.completed).length, 0
      )
    }];
  }

  static flattenExercises(exercises) {
    const flattened = [];
    
    exercises.forEach((exercise, exIdx) => {
      exercise.sets.forEach((set, setIdx) => {
        flattened.push({
          'Exercise': exercise.name,
          'Set #': set.index,
          'Weight (kg)': set.weight || '-',
          'Reps': set.reps || '-',
          'RPE (0-10)': set.rpe || '-',
          'Completed': set.completed ? '✓' : '✗'
        });
      });
    });
    
    return flattened;
  }

  static styleExcelSheet(sheet) {
    // Add column widths
    sheet['!cols'] = [
      { wch: 20 },  // Exercise
      { wch: 8 },   // Set #
      { wch: 12 },  // Weight
      { wch: 8 },   // Reps
      { wch: 10 },  // RPE
      { wch: 12 }   // Completed
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
