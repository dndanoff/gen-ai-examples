// Export functionality
export class DiagramExporter {
    static async exportAsImage(svg) {
        if (!svg) {
            alert('No diagram to export');
            return false;
        }

        try {
            // Clone the SVG to avoid modifying the original
            const svgClone = svg.cloneNode(true);
            
            // Get SVG dimensions
            const bbox = svg.getBBox();
            const width = bbox.width + 40;
            const height = bbox.height + 40;
            
            svgClone.setAttribute('width', width);
            svgClone.setAttribute('height', height);
            svgClone.setAttribute('viewBox', `${bbox.x - 20} ${bbox.y - 20} ${width} ${height}`);
            
            // Add XML namespace if not present
            svgClone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

            // Convert SVG to string
            const svgData = new XMLSerializer().serializeToString(svgClone);
            
            // Create canvas to convert to PNG
            const canvas = document.createElement('canvas');
            const scale = 2; // 2x for better quality
            canvas.width = width * scale;
            canvas.height = height * scale;
            const ctx = canvas.getContext('2d');
            
            // Set white background
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Create image from SVG data URL instead of blob
            const img = new Image();
            
            return new Promise((resolve, reject) => {
                img.onload = () => {
                    try {
                        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                        
                        // Download as PNG
                        canvas.toBlob((blob) => {
                            if (blob) {
                                const link = document.createElement('a');
                                link.download = 'workflow-diagram.png';
                                link.href = URL.createObjectURL(blob);
                                link.click();
                                URL.revokeObjectURL(link.href);
                                resolve(true);
                            } else {
                                reject(new Error('Failed to create image blob'));
                            }
                        });
                    } catch (err) {
                        reject(err);
                    }
                };
                
                img.onerror = (err) => {
                    reject(new Error('Failed to load image for export'));
                };
                
                // Use data URL instead of blob URL to avoid CORS issues
                const svgDataUrl = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
                img.src = svgDataUrl;
            });
        } catch (error) {
            console.error('Error exporting image:', error);
            alert('Failed to export image: ' + error.message);
            return false;
        }
    }

    static exportAsText(mermaidText) {
        if (!mermaidText) {
            alert('No diagram text available');
            return false;
        }

        try {
            // Create a blob with the mermaid text
            const blob = new Blob([mermaidText], { type: 'text/plain' });
            const link = document.createElement('a');
            link.download = 'workflow-diagram.mmd';
            link.href = URL.createObjectURL(blob);
            link.click();
            URL.revokeObjectURL(link.href);
            return true;
        } catch (error) {
            console.error('Error exporting text:', error);
            alert('Failed to export text: ' + error.message);
            return false;
        }
    }

    static async copyToClipboard(mermaidText) {
        if (!mermaidText) {
            alert('No diagram text available');
            return false;
        }

        try {
            // Copy to clipboard
            await navigator.clipboard.writeText(mermaidText);
            return true;
        } catch (error) {
            console.error('Error copying text:', error);
            alert('Failed to copy to clipboard: ' + error.message);
            return false;
        }
    }

    static showSuccess(button) {
        const originalText = button.innerHTML;
        button.classList.add('success');
        button.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg> Success!';
        
        setTimeout(() => {
            button.classList.remove('success');
            button.innerHTML = originalText;
        }, 2000);
    }
}
