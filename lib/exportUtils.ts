function escapeCsvCell(value: string | number): string {
    const text = String(value);
    if (/[",\n]/.test(text)) {
        return `"${text.replace(/"/g, '""')}"`;
    }
    return text;
}

export function downloadCSV(filename: string, headers: string[], rows: (string | number)[][]) {
    const csvLines = [headers, ...rows].map(row => row.map(escapeCsvCell).join(','));
    const csvContent = csvLines.join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
