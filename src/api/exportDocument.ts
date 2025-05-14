
/**
 * Exports project data to PDF or DOCX format
 */
export async function exportDocument(
  projectId: string,
  format: 'pdf' | 'docx' = 'pdf',
  language: 'pt' | 'en' = 'pt'
) {
  try {
    const response = await fetch(`/api/export?projectId=${projectId}&format=${format}&language=${language}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Export failed with status: ${response.status}`);
    }

    // For a real implementation, we would handle the blob and trigger a download
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = `projeto-pt2030-${projectId}.${format}`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    
    return {
      success: true,
      message: `Documento exportado com sucesso em formato ${format.toUpperCase()}`
    };
  } catch (error: any) {
    console.error('Error exporting document:', error);
    throw new Error(`Failed to export document: ${error.message}`);
  }
}
