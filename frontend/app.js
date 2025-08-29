document.addEventListener('DOMContentLoaded', () => {
    // --- Get references to all elements ---
    const warehouseIdInput = document.getElementById('warehouse-id');
    const fetchButton = document.getElementById('fetch-button');
    const confirmButton = document.getElementById('confirm-button');
    const statusMessage = document.getElementById('status-message');
    
    const inputSection = document.getElementById('input-section');
    const previewSection = document.getElementById('preview-section');
    const detailsPreview = document.getElementById('details-preview');

    const API_BASE_URL = 'http://localhost:3001';
    let currentWarehouseId = null; // To store the ID between steps

    // --- Step 1: Fetch and Display Warehouse Data ---
    fetchButton.addEventListener('click', async () => {
        const warehouseId = warehouseIdInput.value.trim();
        if (!warehouseId) {
            statusMessage.textContent = 'Error: Please enter a Warehouse ID.';
            return;
        }

        currentWarehouseId = warehouseId; // Save the ID for the next step
        statusMessage.textContent = 'Fetching data...';

        try {
            // Call the NEW JSON data endpoint
            const response = await fetch(`${API_BASE_URL}/api/warehouse/${currentWarehouseId}`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch warehouse data.');
            }

            // Populate the preview section with formatted JSON
            detailsPreview.textContent = JSON.stringify(data, null, 2);
            
            // Toggle visibility of the sections
            inputSection.style.display = 'none';
            previewSection.style.display = 'block';
            statusMessage.textContent = `Showing details for Warehouse ID: ${currentWarehouseId}. Please confirm.`;

        } catch (error) {
            statusMessage.textContent = `Error: ${error.message}`;
        }
    });

    // --- Step 2: Confirm and Generate the PPT ---
    confirmButton.addEventListener('click', async () => {
        if (!currentWarehouseId) {
            statusMessage.textContent = 'Error: No Warehouse ID selected.';
            return;
        }

        statusMessage.textContent = 'Generating presentation, please wait...';

        try {
            // Call the PPT generation endpoint
            const response = await fetch(`${API_BASE_URL}/api/generate-ppt/${currentWarehouseId}`);

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Server responded with status ${response.status}`);
            }

            // Standard file download logic
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Warehouse_${currentWarehouseId}.pptx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            
            statusMessage.textContent = `Success! Your download for Warehouse ${currentWarehouseId} has started.`;
            
            // Reset the view
            previewSection.style.display = 'none';
            inputSection.style.display = 'block';
            warehouseIdInput.value = '';

        } catch (error) {
            statusMessage.textContent = `Error: ${error.message}`;
        }
    });
});