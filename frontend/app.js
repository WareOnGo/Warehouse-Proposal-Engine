// app.js

document.addEventListener('DOMContentLoaded', () => {
    const warehouseIdInput = document.getElementById('warehouse-id');
    const generateButton = document.getElementById('generate-button');
    const statusMessage = document.getElementById('status-message');

    const API_BASE_URL = 'http://localhost:3001';

    generateButton.addEventListener('click', async () => {
        const warehouseId = warehouseIdInput.value.trim();

        if (!warehouseId) {
            statusMessage.textContent = 'Error: Please enter a Warehouse ID.';
            statusMessage.style.color = 'red';
            return;
        }

        statusMessage.textContent = 'Generating presentation, please wait...';
        statusMessage.style.color = '#333';

        try {
            // Use the new API endpoint
            const response = await fetch(`${API_BASE_URL}/api/generate-ppt/${warehouseId}`);

            if (!response.ok) {
                // Try to get error message from the server's JSON response
                const errorData = await response.json();
                throw new Error(errorData.error || `Server responded with status ${response.status}`);
            }

            // 1. Get the response as a 'blob' (a file-like object)
            const blob = await response.blob();
            
            // 2. Create a temporary URL for this blob
            const url = window.URL.createObjectURL(blob);
            
            // 3. Create a temporary invisible link element
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Warehouse_${warehouseId}.pptx`); // Set the download filename
            
            // 4. Add the link to the document, click it, and then remove it
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // 5. Clean up the temporary URL
            window.URL.revokeObjectURL(url);
            
            statusMessage.textContent = `Success! Your download for Warehouse ${warehouseId} has started.`;
            statusMessage.style.color = 'green';

        } catch (error) {
            console.error('Generation error:', error);
            statusMessage.textContent = `Error: ${error.message}`;
            statusMessage.style.color = 'red';
        }
    });
});