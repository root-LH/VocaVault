export interface CSVWord {
  word: string;
  definition: string;
  example?: string;
}

export const downloadCSV = (words: any[], filename: string) => {
  const headers = ["Word", "Definition", "Example"];
  const rows = words.map(w => [
    `"${(w.word || "").replace(/"/g, '""')}"`,
    `"${(w.definition || "").replace(/"/g, '""')}"`,
    `"${(w.example || "").replace(/"/g, '""')}"`
  ].join(","));

  const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\n"); // UTF-8 BOM 추가 (엑셀 깨짐 방지)
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const parseCSV = (text: string): CSVWord[] => {
  const lines = text.split(/\r?\n/).filter(line => line.trim() !== "");
  if (lines.length < 2) return [];

  const words: CSVWord[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    // 더 견고한 CSV 파싱: 쉼표로 나누되 따옴표 안의 쉼표는 무시
    const values: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let charIndex = 0; charIndex < line.length; charIndex++) {
      const char = line[charIndex];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    values.push(current.trim());

    if (values.length >= 2) {
      const word = values[0].replace(/^"|"$/g, '').replace(/""/g, '"');
      const definition = values[1].replace(/^"|"$/g, '').replace(/""/g, '"');
      const example = values[2] ? values[2].replace(/^"|"$/g, '').replace(/""/g, '"') : "";
      
      if (word && definition) {
        words.push({ word, definition, example });
      }
    }
  }
  
  return words;
};
