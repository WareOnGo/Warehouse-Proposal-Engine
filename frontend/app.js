document.addEventListener('DOMContentLoaded', () => {
    // --- Get references to all elements ---
    const warehouseIdInput = document.getElementById('warehouse-id');
    const fetchButton = document.getElementById('fetch-button');
    const confirmButton = document.getElementById('confirm-button');
    const backButton = document.getElementById('back-button');
    const statusMessage = document.getElementById('status-message');
    const inputSection = document.getElementById('input-section');
    const previewSection = document.getElementById('preview-section');
    const detailsContainer = document.getElementById('details-container');
    const clientNameInput = document.getElementById('client-name');
    const clientRequirementInput = document.getElementById('client-requirement');
    const pocNameInput = document.getElementById('poc-name');
    const pocContactInput = document.getElementById('poc-contact');
    const pptTypeInfo = document.getElementById('ppt-type-info');
    const imageSelectionInstruction = document.getElementById('image-selection-instruction');

    const API_BASE_URL = 'http://localhost:3001'; // Or your deployed Render URL
    let currentWarehouseIds = null;
    let selectedPptType = 'standard'; // Default to standard
    
    // --- Get selected PPT type ---
    function getSelectedPptType() {
        const selectedRadio = document.querySelector('input[name="ppt-type"]:checked');
        return selectedRadio ? selectedRadio.value : 'standard';
    }

    // --- Event listener for the "Start Over" button ---
    backButton.addEventListener('click', () => {
        previewSection.style.display = 'none';
        inputSection.style.display = 'block';
        statusMessage.textContent = 'Ready for input.';
        warehouseIdInput.value = '';
        clientNameInput.value = '';
        clientRequirementInput.value = '';
        pocNameInput.value = '';
        pocContactInput.value = '';
    });
    
    // --- Step 1: Fetch and Display Warehouse Data ---
    fetchButton.addEventListener('click', async () => {
        const warehouseIds = warehouseIdInput.value.trim();
        if (!warehouseIds) {
            statusMessage.textContent = 'Error: Please enter at least one Warehouse ID.';
            return;
        }

        currentWarehouseIds = warehouseIds;
        selectedPptType = getSelectedPptType();
        statusMessage.textContent = 'Fetching data...';
        detailsContainer.innerHTML = '';

        try {
            const response = await fetch(`${API_BASE_URL}/api/warehouses?ids=${currentWarehouseIds}`);
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Failed to fetch warehouse data.');

            // Update info banner based on PPT type
            if (selectedPptType === 'detailed') {
                pptTypeInfo.className = 'info-banner detailed';
                pptTypeInfo.innerHTML = '<strong>📊 Detailed Presentation Selected</strong><br>First 4 images are auto-selected. Click to select/deselect any number of images. The presentation will contain geospatial data, distance highlights, technical details, commercials, and satellite imagery. Generation may take 10-60 seconds per warehouse.';
                imageSelectionInstruction.style.display = 'block';
            } else {
                pptTypeInfo.className = 'info-banner standard';
                pptTypeInfo.innerHTML = '<strong>📄 Standard Presentation Selected</strong><br>Select up to 4 images per warehouse for the presentation.';
                imageSelectionInstruction.style.display = 'block';
            }

            data.forEach(warehouse => {
                const card = document.createElement('div');
                card.className = 'warehouse-card';
                card.dataset.warehouseId = warehouse.id;

                const title = document.createElement('h3');
                title.textContent = `Warehouse #${warehouse.id} - ${warehouse.city}, ${warehouse.state}`;
                card.appendChild(title);

                const detailsGrid = document.createElement('div');
                detailsGrid.className = 'details-grid';
                detailsGrid.innerHTML = `<p><strong>Address:</strong> ${warehouse.address}</p><p><strong>Rate:</strong> Rs. ${warehouse.ratePerSqft}/sft</p>`;
                card.appendChild(detailsGrid);

                const gallery = document.createElement('div');
                gallery.className = 'image-gallery';
                
                if (warehouse.photos && warehouse.photos.length > 0) {
                    const allUrls = warehouse.photos.split(',').map(url => url.trim());
                    const imageUrls = allUrls.filter(url => /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(url));

                    if (imageUrls.length > 0) {
                        imageUrls.forEach((url, index) => {
                            const img = document.createElement('img');
                            img.src = url;
                            img.alt = 'Warehouse Photo';
                            img.dataset.url = url;
                            
                            // Make images selectable for both standard and detailed PPT
                            img.className = 'selectable-image';
                            
                            // For detailed PPT, auto-select first 4 images by default
                            if (selectedPptType === 'detailed' && index < 4) {
                                img.classList.add('selected');
                            }
                            
                            // Add click logic for image selection
                            img.addEventListener('click', (event) => {
                                const clickedImage = event.currentTarget;
                                const parentCard = clickedImage.closest('.warehouse-card');
                                const selectedImagesInCard = parentCard.querySelectorAll('.selectable-image.selected');
                                
                                // For standard PPT, limit to 4 images per warehouse
                                // For detailed PPT, allow unlimited selection
                                if (selectedPptType === 'standard') {
                                    // Check if the user is trying to select a new image AND the limit is already reached
                                    if (!clickedImage.classList.contains('selected') && selectedImagesInCard.length >= 4) {
                                        alert('You can only select a maximum of 4 images per warehouse.');
                                        return; // Prevent selecting the 5th image
                                    }
                                }
                                
                                // Toggle the selection
                                clickedImage.classList.toggle('selected');
                            });

                            gallery.appendChild(img);
                        });
                    } else {
                        gallery.textContent = 'Photos not available. Can be provided upon request/during site visit.';
                    }
                } else {
                    gallery.textContent = 'Photos not available. Can be provided upon request/during site visit.';
                }
                card.appendChild(gallery);
                detailsContainer.appendChild(card);
            });
            
            inputSection.style.display = 'none';
            previewSection.style.display = 'block';
            
            if (selectedPptType === 'detailed') {
                statusMessage.textContent = `Showing details for Warehouse IDs: ${currentWarehouseIds}. All photos will be included automatically.`;
            } else {
                statusMessage.textContent = `Showing details for Warehouse IDs: ${currentWarehouseIds}. Click images to select them, then confirm.`;
            }

        } catch (error) {
            statusMessage.textContent = `Error: ${error.message}`;
        }
    });

    // --- Step 2: Confirm and Generate the PPT ---
    confirmButton.addEventListener('click', async () => {
        if (!currentWarehouseIds) return;

        let endpoint, requestBody, filename;

        if (selectedPptType === 'detailed') {
            // Detailed PPT - with selected images
            const selectedImages = {};
            document.querySelectorAll('.warehouse-card').forEach(card => {
                const warehouseId = card.dataset.warehouseId;
                const selectedInCard = card.querySelectorAll('.selectable-image.selected');
                if (selectedInCard.length > 0) {
                    selectedImages[warehouseId] = Array.from(selectedInCard).map(img => img.dataset.url);
                }
            });

            endpoint = `${API_BASE_URL}/api/generate-detailed-ppt`;
            requestBody = {
                ids: currentWarehouseIds,
                selectedImages: selectedImages,
                customDetails: {
                    companyName: clientNameInput.value.trim(),
                    employeeName: pocNameInput.value.trim()
                }
            };
            filename = `Detailed_Warehouses_${currentWarehouseIds.replace(/, /g, '_')}.pptx`;
            statusMessage.textContent = 'Generating detailed presentation with geospatial data, please wait... This may take 10-60 seconds per warehouse.';
        } else {
            // Standard PPT - with selected images
            const selectedImages = {};
            document.querySelectorAll('.warehouse-card').forEach(card => {
                const warehouseId = card.dataset.warehouseId;
                const selectedInCard = card.querySelectorAll('.selectable-image.selected');
                if (selectedInCard.length > 0) {
                    selectedImages[warehouseId] = Array.from(selectedInCard).map(img => img.dataset.url);
                }
            });

            endpoint = `${API_BASE_URL}/api/generate-ppt`;
            requestBody = {
                ids: currentWarehouseIds,
                selectedImages: selectedImages,
                customDetails: {
                    clientName: clientNameInput.value.trim(),
                    clientRequirement: clientRequirementInput.value.trim(),
                    pocName: pocNameInput.value.trim(),
                    pocContact: pocContactInput.value.trim()
                }
            };
            filename = `Warehouses_${currentWarehouseIds.replace(/, /g, '_')}.pptx`;
            statusMessage.textContent = 'Generating standard presentation, please wait...';
        }

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Server responded with status ${response.status}`);
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            
            statusMessage.textContent = `Success! Your ${selectedPptType} presentation download has started.`;
            previewSection.style.display = 'none';
            inputSection.style.display = 'block';
            warehouseIdInput.value = '';

        } catch (error) {
            statusMessage.textContent = `Error: ${error.message}`;
        }
    });
});