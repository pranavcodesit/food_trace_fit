// OCR Upload Functionality for Product and Nutrition Label Images

document.addEventListener('DOMContentLoaded', function() {
    // Check if the OCR upload elements exist on the page
    const nutritionUploadBtn = document.getElementById('nutrition-image-button');
    const nutritionFileInput = document.getElementById('nutrition-image-input');
    const productUploadBtn = document.getElementById('product-image-button');
    const productFileInput = document.getElementById('product-image-input');
    const ingredientUploadBtn = document.getElementById('ingredient-image-button');
    const ingredientFileInput = document.getElementById('ingredient-image-input');
    const ocrResultsContainer = document.getElementById('ocr-results');
    
    // Track upload status
    let productImageUploaded = false;
    let nutritionImageUploaded = false;
    let ingredientImageUploaded = false; // New: Track ingredient image upload status
    
    // Function to update process button state
    function updateProcessButtonState() {
        const processButton = document.getElementById('process-ocr-button');
        if (!processButton) return;
        
        // The process button should be enabled if both product and nutrition images are uploaded.
        // The ingredient image is optional, so it doesn't strictly need to be uploaded to enable the button.
        if (productImageUploaded && nutritionImageUploaded) {
            processButton.disabled = false;
            processButton.classList.add('ready');
        } else {
            processButton.disabled = true;
            processButton.classList.remove('ready');
        }
    }
    
    // Set up the nutrition label file input trigger with animation
    if (nutritionUploadBtn && nutritionFileInput) {
        nutritionUploadBtn.addEventListener('click', function() {
            // Add pulse animation
            nutritionUploadBtn.classList.add('pulse-animation');
            
            // Trigger file input
            nutritionFileInput.click();
            
            // Remove animation after a short delay
            setTimeout(() => {
                nutritionUploadBtn.classList.remove('pulse-animation');
            }, 500);
        });
    }
    
    // Set up the product image file input trigger with animation
    if (productUploadBtn && productFileInput) {
        productUploadBtn.addEventListener('click', function() {
            // Add pulse animation
            productUploadBtn.classList.add('pulse-animation');
            
            // Trigger file input
            productFileInput.click();
            
            // Remove animation after a short delay
            setTimeout(() => {
                productUploadBtn.classList.remove('pulse-animation');
            }, 500);
        });
    }

    // New: Set up the ingredient image file input trigger with animation
    if (ingredientUploadBtn && ingredientFileInput) {
        ingredientUploadBtn.addEventListener('click', function() {
            ingredientUploadBtn.classList.add('pulse-animation');
            ingredientFileInput.click();
            setTimeout(() => {
                ingredientUploadBtn.classList.remove('pulse-animation');
            }, 500);
        });
    }
    
    // Get preview elements
    const nutritionPreviewContainer = document.getElementById('ocr-preview-container');
    const nutritionPreviewImage = document.getElementById('ocr-preview-image');
    const productPreviewContainer = document.getElementById('product-preview-container');
    const productPreviewImage = document.getElementById('product-preview-image');
    const ingredientPreviewContainer = document.getElementById('ingredient-preview-container');
    const ingredientPreviewImage = document.getElementById('ingredient-preview-image');
    const processButton = document.getElementById('process-ocr-button');
    const cancelButton = document.getElementById('cancel-ocr-button');
    const ocrMessage = document.getElementById('ocr-message');
    
    // Highlight active step based on current state
    function updateActiveStep(stepNumber) {
        // Get all instruction steps
        const steps = document.querySelectorAll('.instruction-step');
        
        // Remove active class from all steps
        steps.forEach(step => {
            step.classList.remove('active-step');
        });
        
        // Add active class to current step
        if (stepNumber > 0 && stepNumber <= steps.length) {
            steps[stepNumber - 1].classList.add('active-step');
        }
    }
    
    // Initially highlight step 1
    updateActiveStep(1);
    
    // Function to show OCR-specific messages with icons
    function showOcrMessage(message, type = 'info') {
        if (!ocrMessage) return;
        
        // Clear previous messages
        ocrMessage.innerHTML = '';
        ocrMessage.className = 'ocr-message';
        
        // Add message type class
        ocrMessage.classList.add(type);
        ocrMessage.classList.remove('hidden');
        
        // Create icon based on message type
        const icon = document.createElement('i');
        icon.className = 'message-icon';
        
        // Add appropriate icon class based on message type
        if (type === 'success') {
            icon.classList.add('success-icon');
        } else if (type === 'error') {
            icon.classList.add('error-icon');
        } else {
            icon.classList.add('info-icon');
        }
        
        // Add icon and message text
        ocrMessage.appendChild(icon);
        const messageText = document.createElement('span');
        messageText.textContent = message;
        messageText.style.marginLeft = '8px';
        ocrMessage.appendChild(messageText);
        
        // Add animation
        ocrMessage.style.animation = 'slideUp 0.3s forwards';
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            ocrMessage.classList.add('fade-out');
            setTimeout(() => {
                ocrMessage.classList.add('hidden');
                ocrMessage.classList.remove('fade-out');
                ocrMessage.style.animation = '';
            }, 500);
        }, 5000);
        }
    
    // Function to validate image file
    function validateImageFile(file, inputElement) {
        const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
        
        // Validate file type
        if (!validTypes.includes(file.type)) {
            // Error message removed as requested
            inputElement.value = '';
            return false;
        }
        
        // Validate file size (max 5MB)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            // Error message removed as requested
            inputElement.value = '';
            return false;
        }
        
        return true;
    }
    
    // Handle nutrition label file selection
    if (nutritionFileInput) {
        nutritionFileInput.addEventListener('change', function(e) {
            if (!e.target.files.length) return;
            
            const file = e.target.files[0];
            
            // Validate the file
            if (!validateImageFile(file, nutritionFileInput)) return;
            
            // Show preview with enhanced UI
            if (nutritionPreviewContainer && nutritionPreviewImage) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    // Update image source
                    nutritionPreviewImage.src = e.target.result;
                    
                    // Show preview container with animation
                    nutritionPreviewContainer.classList.remove('hidden');
                    nutritionPreviewContainer.style.animation = 'fadeIn 0.5s forwards';
                    
                    // Update upload status
                    nutritionImageUploaded = true;
                    updateProcessButtonState();
                    
                    // Update active step if both images are uploaded
                    if (productImageUploaded) {
                        updateActiveStep(2);
                        
                        // Show buttons if both images are uploaded
                        if (!processButton.classList.contains('hidden')) {
                            processButton.style.animation = 'pulse 1s ease infinite';
                        } else {
                            setTimeout(() => {
                                processButton.classList.remove('hidden');
                                processButton.style.animation = 'slideUp 0.3s forwards, pulse 1s ease infinite';
                                
                                setTimeout(() => {
                                    cancelButton.classList.remove('hidden');
                                    cancelButton.style.animation = 'slideUp 0.3s forwards';
                                }, 100);
                            }, 200);
                        }

                        // New: Handle ingredient image file selection
                        if (ingredientFileInput) {
                            ingredientFileInput.addEventListener('change', function(e) {
                                if (!e.target.files.length) return;

                                const file = e.target.files[0];

                                // Validate the file
                                if (!validateImageFile(file, ingredientFileInput)) return;

                                // Show preview
                                if (ingredientPreviewContainer && ingredientPreviewImage) {
                                    const reader = new FileReader();
                                    reader.onload = function(e) {
                                        ingredientPreviewImage.src = e.target.result;
                                        ingredientPreviewContainer.classList.remove('hidden');
                                        ingredientPreviewContainer.style.animation = 'fadeIn 0.5s forwards';
                                        ingredientImageUploaded = true;
                                    };
                                    reader.readAsDataURL(file);
                                }
                            });
                        }
                        

                    }
                    
                    // Success message with showOcrMessage removed as requested
                };
                reader.readAsDataURL(file);
            }
        });
    }
    
    // Handle product image file selection
    if (productFileInput) {
        productFileInput.addEventListener('change', function(e) {
            if (!e.target.files.length) return;
            
            const file = e.target.files[0];
            
            // Validate the file
            if (!validateImageFile(file, productFileInput)) return;
            
            // Show preview with enhanced UI
            if (productPreviewContainer && productPreviewImage) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    // Update image source
                    productPreviewImage.src = e.target.result;
                    
                    // Show preview container with animation
                    productPreviewContainer.classList.remove('hidden');
                    productPreviewContainer.style.animation = 'fadeIn 0.5s forwards';
                    
                    // Update upload status
                    productImageUploaded = true;
                    updateProcessButtonState();
                    
                    // Update active step if both images are uploaded
                    if (nutritionImageUploaded) {
                        updateActiveStep(2);
                        
                        // Show buttons if both images are uploaded
                        if (!processButton.classList.contains('hidden')) {
                            processButton.style.animation = 'pulse 1s ease infinite';
                        } else {
                            setTimeout(() => {
                                processButton.classList.remove('hidden');
                                processButton.style.animation = 'slideUp 0.3s forwards, pulse 1s ease infinite';
                                
                                setTimeout(() => {
                                    cancelButton.classList.remove('hidden');
                                    cancelButton.style.animation = 'slideUp 0.3s forwards';
                                }, 100);
                            }, 200);
                        }
                        

                    }
                    
                    // Success message with showOcrMessage removed as requested
                };
                reader.readAsDataURL(file);
            }
        });
    }
    
    // Handle process button click
    if (processButton) {
        processButton.addEventListener('click', function() {
            const nutritionFile = nutritionFileInput.files[0];
            const productFile = productFileInput.files[0];
            const ingredientFile = ingredientFileInput.files[0]; // Get ingredient file
            
            if (!nutritionFile || !productFile) {
                // Add detailed error message for debugging
                console.error('Missing files:', { 
                    nutritionFile: nutritionFile ? nutritionFile.name : 'missing', 
                    productFile: productFile ? productFile.name : 'missing' 
                });
                if (ocrMessage) {
                    showOcrMessage('Please upload both product and nutrition label images', 'error');
                }
                return;
            }
            
            // Update active step
            updateActiveStep(3);
            
            // Hide previews
            if (nutritionPreviewContainer) nutritionPreviewContainer.classList.add('hidden');
            if (productPreviewContainer) productPreviewContainer.classList.add('hidden');
            if (ingredientPreviewContainer) ingredientPreviewContainer.classList.add('hidden'); // New: Hide ingredient preview
            
            // Hide process and cancel buttons during processing
            processButton.classList.add('hidden');
            cancelButton.classList.add('hidden');
            
            // Show progress bar instead of message
            const progressBar = document.getElementById('ocr-progress');
            if (progressBar) {
                progressBar.classList.remove('hidden');
            } else if (ocrMessage) {
                // Fallback to message if progress bar doesn't exist
                showOcrMessage('Processing images, please wait...', 'info');
            }
            
            // Create FormData and append files
            const formData = new FormData();
            formData.append('nutrition_image', nutritionFile);
            formData.append('product_image', productFile);
            if (ingredientFile) {
                formData.append('ingredient_image', ingredientFile);
            }
            
            // Add detailed logging
            console.log('Sending OCR request with files:', {
                nutritionImage: nutritionFile.name,
                productImage: productFile.name,
                ingredientImage: ingredientFile ? ingredientFile.name : 'N/A',
                nutritionSize: nutritionFile.size,
                productSize: productFile.size,
                ingredientSize: ingredientFile ? ingredientFile.size : 'N/A'
            });
            
            // Show loading indicator if it exists
            const loadingElement = document.getElementById('loading');
            if (loadingElement) loadingElement.style.display = 'flex';
            
            // Send to server for OCR processing
            fetch('/process-nutrition-image', {
                method: 'POST',
                body: formData
            })
            .then(response => {
                console.log('OCR response status:', response.status, response.statusText);
                
                // Hide loading indicator and progress bar if they exist
                const loadingElement = document.getElementById('loading');
                if (loadingElement) loadingElement.style.display = 'none';
                
                const progressBar = document.getElementById('ocr-progress');
                if (progressBar) progressBar.classList.add('hidden');
                
                if (!response.ok) {
                    console.error('Server response not OK:', response.status, response.statusText);
                    
                    // Show process and cancel buttons again
                    processButton.classList.remove('hidden');
                    cancelButton.classList.remove('hidden');
                    
                    // Show previews again
                    if (nutritionPreviewContainer) nutritionPreviewContainer.classList.remove('hidden');
                    if (productPreviewContainer) productPreviewContainer.classList.remove('hidden');
                    
                    // Reset active step
                    updateActiveStep(2);
                    
                    // Try to get more detailed error information from the response
                    return response.json().then(errorData => {
                        throw new Error(errorData.error || `Server error: ${response.status}`);
                    }).catch(jsonError => {
                        // If JSON parsing fails, use the status text
                        throw new Error(`Server error: ${response.status} ${response.statusText}`);
                    });
                }
                return response.json();
            })
            .then(data => {
                console.log('OCR processing response:', data);
                
                // Update active step
                updateActiveStep(4);
                
                if (data.error) {
                    console.error('OCR processing error:', data.error);
                    
                    // Hide progress bar if it exists
                    const progressBar = document.getElementById('ocr-progress');
                    if (progressBar) progressBar.classList.add('hidden');
                    
                    if (ocrMessage) {
                        showOcrMessage('Error processing images: ' + data.error, 'error');
                    }
                    
                    // Show process and cancel buttons again
                    processButton.classList.remove('hidden');
                    cancelButton.classList.remove('hidden');
                    
                    // Show previews again
                    if (nutritionPreviewContainer) nutritionPreviewContainer.classList.remove('hidden');
                    if (productPreviewContainer) productPreviewContainer.classList.remove('hidden');
                    
                    // Reset active step
                    updateActiveStep(2);
                    return;
                }
                
                // Check if we have valid text data
                if (!data.text || data.text.trim() === '') {
                    console.warn('OCR returned empty or missing text');
                    if (ocrMessage) {
                        showOcrMessage('No text was detected in the nutrition image. Please try a clearer image.', 'warning');
                    }
                }
                
                // Display the OCR results
                if (ocrResultsContainer) {
                    displayOcrResults(data, ocrResultsContainer);
                }
                
                // If we have nutrition data, send it to Groq AI for processing
                // Success message removed as requested
            })
            .catch(error => {
                console.error('Error processing image:', error);
                
                // Hide loading indicator and progress bar if they exist
                const loadingElement = document.getElementById('loading');
                if (loadingElement) loadingElement.style.display = 'none';
                
                const progressBar = document.getElementById('ocr-progress');
                if (progressBar) progressBar.classList.add('hidden');
    
                // Show process and cancel buttons again
                processButton.classList.remove('hidden');
                cancelButton.classList.remove('hidden');
                
                // Show previews again
                if (nutritionPreviewContainer) nutritionPreviewContainer.classList.remove('hidden');
                if (productPreviewContainer) productPreviewContainer.classList.remove('hidden');
                
                // Reset active step
                updateActiveStep(2);
                
                // Show error message
                if (ocrMessage) {
                    showOcrMessage('Error processing images: ' + error.message, 'error');
                }
            });
        });
    }
    
    // Handle cancel button click
    if (cancelButton) {
        cancelButton.addEventListener('click', function() {
            // Reset the file inputs
            if (nutritionFileInput) nutritionFileInput.value = '';
            if (productFileInput) productFileInput.value = '';
            if (ingredientFileInput) ingredientFileInput.value = ''; // New: Reset ingredient file input
            
            // Reset upload status
            productImageUploaded = false;
            nutritionImageUploaded = false;
            ingredientImageUploaded = false; // New: Reset ingredient image upload status
            
            // Hide nutrition preview with animation
            if (nutritionPreviewContainer) {
                nutritionPreviewContainer.style.animation = 'fadeOut 0.3s forwards';
                setTimeout(() => {
                    nutritionPreviewContainer.classList.add('hidden');
                    nutritionPreviewContainer.style.animation = '';
                }, 300);
            }
            
            // Hide product preview with animation
            if (productPreviewContainer) {
                productPreviewContainer.style.animation = 'fadeOut 0.3s forwards';
                setTimeout(() => {
                    productPreviewContainer.classList.add('hidden');
                    productPreviewContainer.style.animation = '';
                }, 300);
            }

            // New: Hide ingredient preview with animation
            if (ingredientPreviewContainer) {
                ingredientPreviewContainer.style.animation = 'fadeOut 0.3s forwards';
                setTimeout(() => {
                    ingredientPreviewContainer.classList.add('hidden');
                    ingredientPreviewContainer.style.animation = '';
                }, 300);
            }
            
            // Hide process button with animation
            if (processButton) {
                processButton.style.animation = 'fadeOut 0.3s forwards';
                setTimeout(() => {
                    processButton.classList.add('hidden');
                    processButton.style.animation = '';
                    processButton.disabled = true;
                    processButton.classList.remove('ready');
                }, 300);
            }
            
            // Hide cancel button with animation
            cancelButton.style.animation = 'fadeOut 0.3s forwards';
            setTimeout(() => {
                cancelButton.classList.add('hidden');
                cancelButton.style.animation = '';
            }, 300);
            

            
            // Reset active step
            updateActiveStep(1);
            
            // Cancel message removed as requested
        });
    }
    
    // Create nutrition data section if it doesn't exist
    if (!document.getElementById('nutrition-data')) {
        const nutritionData = document.createElement('div');
        nutritionData.id = 'nutrition-data';
        nutritionData.className = 'hidden';
        
        // Add it after OCR results
        if (ocrResultsContainer && ocrResultsContainer.parentNode) {
            ocrResultsContainer.parentNode.insertBefore(nutritionData, ocrResultsContainer.nextSibling);
        }
    }
    
    // Function to display OCR results with enhanced UI
    function displayOcrResults(data, container) {
        console.log('Displaying OCR results:', data);
        
        // Get the text content element
        const textContent = document.getElementById('ocr-text-content');
        if (!textContent) {
            console.error('OCR text content element not found');
            if (ocrMessage) {
                showOcrMessage('Error: Could not display OCR results', 'error');
            }
            return;
        }
        
        // Set the text content with validation
        if (data && typeof data === 'object') {
            // Handle different response formats
            const ocrText = data.text || (data.success && data.parsed_text) || 'No text detected';
            textContent.textContent = ocrText;
            
            // Log text length for debugging
            console.log(`OCR text length: ${ocrText.length} characters`);
            
            // Show warning for very short text
            if (ocrText.length < 10 && ocrText !== 'No text detected') {
                console.warn('Very short OCR text detected:', ocrText);
                if (ocrMessage) {
                    showOcrMessage('Warning: Very little text was detected. The image may not be clear enough.', 'warning');
                }
            }
        } else {
            console.error('Invalid OCR data format:', data);
            textContent.textContent = 'Error: Invalid OCR data format';
            if (ocrMessage) {
                showOcrMessage('Error: Invalid OCR data format', 'error');
            }
        }
        
        // Show the container with animation
        container.classList.remove('hidden');
        container.style.animation = 'slideUp 0.5s forwards';
        
        // Show success message if text was detected
        if (data.text && data.text.trim() !== '') {
            // Success message removed as requested
        }
        
        // Store product image information for later use
        if (data.product_image) {
            // Store product image data in a global variable or data attribute
            container.dataset.productImagePath = data.product_image.path;
            container.dataset.productImageFilename = data.product_image.filename;
            
            // Display the product image information more prominently
            const productThumbnail = document.createElement('div');
            productThumbnail.className = 'product-thumbnail';
            productThumbnail.innerHTML = `
                <div class="product-image-info">
                    <strong><i class="product-icon icon"></i> Product Image:</strong> Successfully uploaded and will be processed with OCR
                    <p class="small-text">OCR will be performed on both nutrition label and product image for comprehensive analysis</p>
                </div>
            `;
            container.appendChild(productThumbnail);
            
            // Add a style for the product image info
            const style = document.createElement('style');
            style.textContent = `
                .product-image-info {
                    background-color: rgba(52, 152, 219, 0.1);
                    border-left: 3px solid #3498db;
                    padding: 10px;
                    margin-top: 15px;
                    border-radius: 4px;
                }
                .product-image-info .small-text {
                    font-size: 0.8rem;
                    opacity: 0.8;
                    margin-top: 5px;
                }
            `;
            document.head.appendChild(style);
        }
        
        // Get analyze and edit buttons
        const analyzeButton = document.getElementById('analyze-nutrition-button');
        const editButton = document.getElementById('edit-ocr-text-button');
        
        // Add event listener to analyze button
        if (analyzeButton) {
            analyzeButton.onclick = function() {
                if (data.text && data.text.trim() !== '') {
                    // Pass both text and product image info to the processing function
                    processNutritionData(data.text, data.product_image);
                } else {
                    // Error message removed as requested
                }
            };
        }
        
        // Add event listener to edit button
        if (editButton) {
            editButton.onclick = function() {
                // Make text content editable
                textContent.contentEditable = true;
                textContent.focus();
                textContent.classList.add('editable');
                
                // Change edit button to save button
                editButton.textContent = 'Save Changes';
                editButton.onclick = function() {
                    // Save changes
                    textContent.contentEditable = false;
                    textContent.classList.remove('editable');
                    
                    // Change button back to edit
                    editButton.textContent = 'Edit Text';
                    
                    // Reset onclick handler
                    editButton.onclick = arguments.callee.caller;
                    
                    // Show message
                    // Success message removed as requested
                };
            };
        }
        
        // Update active step
        updateActiveStep(4);
    }
    
    // Function to process nutrition data with AI
    function processNutritionData(text, productImage) {
        // Show analysis progress bar
        const analysisProgress = document.getElementById('analysis-progress');
        if (analysisProgress) {
            analysisProgress.classList.remove('hidden');
        } else {
            // Fallback to loading indicator if progress bar not found
            const loading = document.getElementById('loading');
            if (loading) loading.classList.remove('hidden');
        }
        
        // Prepare data for server
        const requestData = { 
            text: text 
        };
        
        // Add product image info if available
        if (productImage) {
            requestData.product_image = productImage;
            // Show message that both images are being processed with OCR
            // Info message removed as requested
        } else {
            // Info message removed as requested
        }
        
        // Send text and product image info to server for AI analysis
        fetch('/analyze-nutrition-data', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestData)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            // Hide analysis progress bar
            const analysisProgress = document.getElementById('analysis-progress');
            if (analysisProgress) {
                analysisProgress.classList.add('hidden');
            }
            
            if (data.error) {
                // Error message removed as requested
                return;
            }
            
            console.log('Data received from /analyze-nutrition-data:', data);

            // Process the nutrition data from Groq AI
            if (data.nutriments) {
                // Display nutrition data
                displayNutritionData(data);

                // Save nutrition scan to history cookie
                // Ensure the data object has the 'code' property, which is used as a unique identifier for history items.
                // For nutrition label scans, we can generate a unique code or use a combination of product name and timestamp.
                // For simplicity, let's generate a unique code using a timestamp and a random number.
                const nutritionScanCode = `NUTRITION_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
                const productToSave = {
                    ...data,
                    code: nutritionScanCode,
                    // Ensure product_name is present, default to 'Nutrition Scan' if not provided by AI
                    product_name: data.product_name || 'Nutrition Scan',
                    // Ensure brand is present, default to 'N/A' if not provided by AI
                    brand: data.brand || 'N/A',
                    // Use a placeholder image if no image_url is available
                    image_url: productImage?.image_url || data.image_url || 'https://via.placeholder.com/40?text=Nutrition',
                    // Ensure nutrition_grade_fr is present
                    nutrition_grade_fr: data.nutrition_grade_fr || null,
                    // Ensure health_score is present
                    health_score: data.health_score || null
                };
                saveToScanHistory(productToSave);
                
                // Show product name and grade if available
                let successMessage = 'Nutrition data analyzed successfully!';
                if (data.product_name && data.product_name !== 'Nutrition Information') {
                    successMessage += ` Product: ${data.product_name}`;
                }
                if (data.nutrition_grade_fr) {
                    successMessage += ` Grade: ${data.nutrition_grade_fr.toUpperCase()}`;
                }
                
                // Show success message in a different location (inside the nutrition data section)
            const nutritionDataSection = document.getElementById('nutrition-data');
            if (nutritionDataSection) {
                const gradeInfo = document.createElement('div');
                gradeInfo.className = 'nutrition-grade-info';
                gradeInfo.innerHTML = `<span class="nutrition-grade grade-${data.nutrition_grade_fr?.toLowerCase() || 'c'}">Grade: ${data.nutrition_grade_fr?.toUpperCase() || 'C'}</span>`;
                nutritionDataSection.prepend(gradeInfo);
            }
            
            // Update active step
            updateActiveStep(5);
            } else {
                // Error message removed as requested
            }
        })
        .catch(error => {
            console.error('Error analyzing nutrition data:', error);
            
            // Hide analysis progress bar
            const analysisProgress = document.getElementById('analysis-progress');
            if (analysisProgress) {
                analysisProgress.classList.add('hidden');
            }

            // Error message removed as requested
        });
    }
    
    // Function to display nutrition data
    function displayNutritionData(product) {
        // Get the nutrition container
        const nutritionContainer = document.getElementById('nutrition-data');
        if (!nutritionContainer) return;
        
        // Clear previous data
        nutritionContainer.innerHTML = '';
        
        // Add header
        const header = document.createElement('h4');
        const icon = document.createElement('i');
        icon.className = 'nutrition-icon icon';
        header.appendChild(icon);
        header.appendChild(document.createTextNode('Nutrition Analysis'));
        nutritionContainer.appendChild(header);
        
        // Show the nutrition data container
        nutritionContainer.classList.remove('hidden');
        
        // Update product info section with additional data
        updateProductInfo(product);
        
        // Create a collapsible section for the detailed nutrition table
        const collapsibleSection = document.createElement('div');
        collapsibleSection.className = 'collapsible-section';
        
        // Create toggle button
        const toggleButton = document.createElement('button');
        toggleButton.className = 'collapsible-toggle';
        toggleButton.innerHTML = '<span>Show Detailed Nutrition Table</span><i class="toggle-icon"></i>';
        collapsibleSection.appendChild(toggleButton);
        
        // Create a wrapper for the table to enable horizontal scrolling on small screens
        const tableWrapper = document.createElement('div');
        tableWrapper.className = 'nutrition-table-wrapper';
        tableWrapper.style.display = 'none'; // Initially hidden
        
        // Create a table for the nutrition data
        const table = document.createElement('table');
        table.className = 'nutrition-table';
        
        // Add table header
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        ['Nutrient', 'Amount', 'Daily Value'].forEach(text => {
            const th = document.createElement('th');
            th.textContent = text;
            headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);
        table.appendChild(thead);
        
        // Add table body
        const tbody = document.createElement('tbody');
        
        // Add each nutrient to the table
        for (const [nutrient, value] of Object.entries(product.nutriments)) {
            const row = document.createElement('tr');
            
            // Nutrient name
            const nameCell = document.createElement('td');
            nameCell.textContent = formatNutrientName(nutrient);
            row.appendChild(nameCell);
            
            // Amount
            const amountCell = document.createElement('td');
            // Check if value is an object with amount property or just a number
            const amount = typeof value === 'object' ? value.amount : value;
            amountCell.textContent = `${amount} ${getNutrimentUnit(nutrient)}`;
            row.appendChild(amountCell);
            
            // Daily value
            const dvCell = document.createElement('td');
            // Check if value is an object with daily_value property
            const dailyValue = typeof value === 'object' && value.daily_value ? value.daily_value : '-';
            dvCell.textContent = dailyValue !== '-' ? `${dailyValue}%` : dailyValue;
            row.appendChild(dvCell);
            
            tbody.appendChild(row);
        }
        
        table.appendChild(tbody);
        tableWrapper.appendChild(table);
        collapsibleSection.appendChild(tableWrapper);
        nutritionContainer.appendChild(collapsibleSection);
        
        // Add event listener to toggle button
        toggleButton.addEventListener('click', function() {
            const isVisible = tableWrapper.style.display !== 'none';
            tableWrapper.style.display = isVisible ? 'none' : 'block';
            toggleButton.querySelector('span').textContent = isVisible ? 'Show Detailed Nutrition Table' : 'Hide Detailed Nutrition Table';
            toggleButton.classList.toggle('active');
        });
    }
    
    // Function to update product info section with additional data
    function updateProductInfo(product) {
        // Show product info section
        const productInfoSection = document.getElementById('product-info');
        if (productInfoSection) {
            productInfoSection.classList.remove('hidden');
        }
        
        // Set product details
        document.getElementById('product-name').textContent = product.product_name || 'Unknown Product';
        document.getElementById('product-brand').textContent = product.brand || 'Unknown Brand';
        document.getElementById('barcode').textContent = 'N/A'; // No barcode for nutrition label scan
        
        // Set categories
        const categoriesElement = document.getElementById('categories');
        if (categoriesElement) {
            categoriesElement.textContent = product.categories || 'N/A';
        }
        
        // Set serving size
        const servingSizeElement = document.getElementById('serving-size');
        if (servingSizeElement) {
            servingSizeElement.textContent = product.serving_size || 'N/A';
        }
        
        // Set data source
        const dataSourceElement = document.getElementById('data-source');
        if (dataSourceElement) {
            dataSourceElement.textContent = product.source || 'Nutrition Label OCR + Groq AI';
        }
        
        // Keep product image as an empty rectangle
        const productImageElement = document.getElementById('product-image');
        if (productImageElement) {
            // Clear any existing image
            productImageElement.src = '';
            productImageElement.alt = 'Product Image';
            // Style the empty rectangle
            productImageElement.style.backgroundColor = '#2c3e50';
            productImageElement.style.border = '1px dashed #95a5a6';
            productImageElement.style.minHeight = '150px';
            productImageElement.style.minWidth = '150px';
            productImageElement.style.borderRadius = '8px';
            productImageElement.style.display = 'block';
        }
        
        // Set ingredients
        const ingredientsElement = document.getElementById('ingredients');
        if (ingredientsElement) {
            ingredientsElement.innerHTML = product.ingredients_text || 'No ingredients information available';
        }
        
        // Set allergens
        const allergensElement = document.getElementById('allergens');
        if (allergensElement) {
            allergensElement.innerHTML = '';
            
            if (product.allergens_tags && product.allergens_tags.length > 0) {
                product.allergens_tags.forEach(allergen => {
                    const allergenTag = document.createElement('span');
                    allergenTag.className = 'tag allergen-tag';
                    allergenTag.textContent = allergen.replace('en:', '');
                    allergensElement.appendChild(allergenTag);
                });
            } else {
                allergensElement.textContent = 'No allergens information available';
            }
        }
        
        // Set health recommendation
        const healthRecommendationElement = document.getElementById('health-recommendation');
        if (healthRecommendationElement) {
            healthRecommendationElement.textContent = product.health_recommendation || 'No health recommendations available';
        }
        
        // Set alternative products
        const alternativeProductsElement = document.getElementById('alternative-products');
        if (alternativeProductsElement) {
            alternativeProductsElement.innerHTML = '';
            
            if (product.alternative_products && product.alternative_products.length > 0) {
                product.alternative_products.forEach(alternative => {
                    const alternativeElement = document.createElement('div');
                    alternativeElement.className = 'alternative-item';
                    
                    const nameElement = document.createElement('span');
                    nameElement.className = 'alternative-name';
                    nameElement.textContent = alternative.name;
                    
                    const descriptionElement = document.createElement('p');
                    descriptionElement.className = 'alternative-description';
                    descriptionElement.textContent = alternative.description;
                    
                    alternativeElement.appendChild(nameElement);
                    alternativeElement.appendChild(descriptionElement);
                    alternativeProductsElement.appendChild(alternativeElement);
                });
            } else {
                const noAlternativesElement = document.createElement('p');
                noAlternativesElement.textContent = 'No alternative products available';
                alternativeProductsElement.appendChild(noAlternativesElement);
            }
        }
        
        // Set nutrition values in the nutrition grid
        if (product.nutriments) {
            document.getElementById('energy').textContent = formatNutriment(product.nutriments.energy, 'kcal');
            document.getElementById('fat').textContent = formatNutriment(product.nutriments.fat, 'g');
            document.getElementById('protein').textContent = formatNutriment(product.nutriments.protein, 'g');
            document.getElementById('carbs').textContent = formatNutriment(product.nutriments.carbs, 'g');
            document.getElementById('sugar').textContent = formatNutriment(product.nutriments.sugar, 'g');
            document.getElementById('salt').textContent = formatNutriment(product.nutriments.salt, 'g');
            document.getElementById('fiber').textContent = formatNutriment(product.nutriments.fiber, 'g');
        }
        
        // Set nutrition grade
        if (product.nutrition_grade_fr) {
            const grade = product.nutrition_grade_fr.toUpperCase();
            const nutritionGradeElement = document.getElementById('nutrition-grade');
            if (nutritionGradeElement) {
                nutritionGradeElement.textContent = grade;
                nutritionGradeElement.className = 'nutrition-grade grade-' + grade.toLowerCase();
                
                // Add tooltip with detailed information
                let gradeTooltip = `Nutrition Grade: ${grade}\n`;
                
                switch(grade.toLowerCase()) {
                    case 'a':
                        gradeTooltip += 'Excellent nutritional quality\nLow in sugar, salt, and unhealthy fats\nHigh in beneficial nutrients';
                        break;
                    case 'b':
                        gradeTooltip += 'Good nutritional quality\nUsually balanced nutrient profile\nModerate levels of sugar, salt, and fats';
                        break;
                    case 'c':
                        gradeTooltip += 'Average nutritional quality\nConsume in moderation\nMay contain moderate levels of sugar, salt, or fats';
                        break;
                    case 'd':
                        gradeTooltip += 'Below average nutritional quality\nConsume occasionally\nLikely high in sugar, salt, or unhealthy fats';
                        break;
                    case 'e':
                        gradeTooltip += 'D - Poor\nConsume rarely\nHigh in sugar, salt, or unhealthy fats\nLow in beneficial nutrients';
                        break;
                    default:
                        gradeTooltip += 'Nutritional quality information not available';
                }
                
                nutritionGradeElement.title = gradeTooltip;
            }
            
            // Highlight the appropriate grade marker
            const gradeMarkers = document.querySelectorAll('.grade-marker');
            gradeMarkers.forEach(marker => {
                marker.classList.remove('active');
            });
            const activeMarker = document.getElementById('grade-marker-' + grade.toLowerCase());
            if (activeMarker) {
                activeMarker.classList.add('active');
            }
            
            // Set nutrition grade text
            const gradeTextElement = document.getElementById('nutrition-grade-text');
            if (gradeTextElement) {
                const gradeTexts = {
                    'A': 'Excellent nutritional quality',
                    'B': 'Good nutritional quality',
                    'C': 'Average nutritional quality',
                    'D': 'D - Poor',
                    'E': 'Very poor nutritional quality'
                };
                gradeTextElement.textContent = gradeTexts[grade] || '';
            }
        }
        
        // Set health score
        const healthScoreElement = document.getElementById('health-score');
        const healthRatingElement = document.getElementById('health-rating');
        const healthScoreBar = document.getElementById('health-score-bar');
        const healthScoreText = document.getElementById('health-score-text');
        if (product.health_score) {
            // Check if health_score is an object with score and rating properties
            // or just a numeric value (for backward compatibility)
            let score, rating;
            if (typeof product.health_score === 'object' && product.health_score !== null) {
                score = product.health_score.score;
                rating = product.health_score.rating;
            } else {
                // If it's a direct numeric value, use it as the score
                score = product.health_score;
                // Determine rating based on score
                if (score >= 80) {
                    rating = 'A';
                } else if (score >= 60) {
                    rating = 'B';
                } else if (score >= 40) {
                    rating = 'C';
                } else if (score >= 20) {
                    rating = 'D';
                } else {
                    rating = 'E';
                }
            }
            
            if (healthRatingElement) {
                healthRatingElement.textContent = rating;
                healthRatingElement.className = 'health-rating grade-' + rating.toLowerCase();
                
                // Add tooltip with detailed information
                let ratingTooltip = `Health Rating: ${rating}\n`;
                
                switch(rating.toLowerCase()) {
                    case 'a':
                        ratingTooltip += 'Excellent health score (80-100)\nVery nutritious food\nHigh in beneficial nutrients\nLow in harmful components';
                        break;
                    case 'b':
                        ratingTooltip += 'Good health score (60-79)\nNutritious food\nGood balance of nutrients\nModerate levels of sugar, salt, and fats';
                        break;
                    case 'c':
                        ratingTooltip += 'Average health score (40-59)\nModerately nutritious\nConsume in moderation\nMay contain moderate levels of sugar, salt, or fats';
                        break;
                    case 'd':
                        ratingTooltip += 'Below average health score (20-39)\nLimited nutritional value\nConsume occasionally\nLikely high in sugar, salt, or unhealthy fats';
                        break;
                    case 'e':
                        ratingTooltip += 'Poor health score (0-19)\nLow nutritional value\nConsume rarely\nHigh in sugar, salt, or unhealthy fats\nLow in beneficial nutrients';
                        break;
                    default:
                        ratingTooltip += 'Health score information not available';
                }
                
                healthRatingElement.title = ratingTooltip;
            }
            
            if (healthScoreElement) {
                healthScoreElement.textContent = score + '/100';
            }
            
            // Apply color class based on score range
            let scoreClass = '';
            let scoreDescription = '';
            if (score >= 90) {
                scoreClass = 'health-score-90-100';
                scoreDescription = 'Excellent';
            } else if (score >= 75) {
                scoreClass = 'health-score-75-89';
                scoreDescription = 'Very Good';
            } else if (score >= 60) {
                scoreClass = 'health-score-60-74';
                scoreDescription = 'Good';
            } else if (score >= 40) {
                scoreClass = 'health-score-40-59';
                scoreDescription = 'Fair';
            } else {
                scoreClass = 'health-score-0-39';
                scoreDescription = 'Poor';
            }
            
            // Set the width of the health score bar based on the score
            if (healthScoreBar) {
                const progressWidth = score + '%';
                healthScoreBar.style.width = progressWidth;
                healthScoreBar.className = 'health-score-bar ' + scoreClass;
                healthScoreBar.title = score + '/100 - ' + rating;
            }
            
            if (healthScoreElement) {
                healthScoreElement.className = 'health-score ' + scoreClass;
            }
            
            if (healthScoreText) {
                healthScoreText.textContent = scoreDescription;
            }
        } else if (product.ingredients_text && product.nutriments) {
            // If health score is not available but we have ingredients and nutriments,
            // display 'Calculating...' and request calculation from backend
            if (healthScoreElement) healthScoreElement.textContent = 'N/A';
            if (healthRatingElement) healthRatingElement.textContent = '';
            if (healthScoreText) healthScoreText.textContent = 'Calculating...';
            if (healthScoreElement) healthScoreElement.className = 'health-score';
            if (healthScoreBar) healthScoreBar.style.width = '0%';
        } else {
            // No health score data available
            if (healthScoreElement) healthScoreElement.textContent = 'N/A';
            if (healthRatingElement) healthRatingElement.textContent = '';
            if (healthScoreText) healthScoreText.textContent = 'Unknown';
            if (healthScoreElement) healthScoreElement.className = 'health-score';
            if (healthScoreBar) healthScoreBar.style.width = '0%';
        }
        
        // Display Fat Score
        const fatScoreElement = document.getElementById('fat-score');
        const fatRatingElement = document.getElementById('fat-rating');
        const fatScoreText = document.getElementById('fat-score-text');
        const fatScoreBar = document.getElementById('fat-score-bar');
        
        if (fatScoreElement && fatRatingElement && fatScoreText && fatScoreBar) {
            // Set nutriments for fat score calculation
            const nutriments = product.nutriments || {};
            const fatContent = parseFloat(nutriments.fat) || 0;
            
            // Calculate fat score (0-100) where lower is better
            let fatScore = 0;
            let fatRating = '';
            let fatDescription = '';
            
            if (fatContent <= 3) {
                // Very low fat (0-3g per 100g)
                fatScore = Math.max(0, Math.min(100, 100 - (fatContent * 10)));
                fatRating = 'A';
                fatDescription = 'Very Low Fat';
            } else if (fatContent <= 10) {
                // Low fat (3-10g per 100g)
                fatScore = Math.max(0, Math.min(100, 70 - ((fatContent - 3) * 5)));
                fatRating = 'B';
                fatDescription = 'Low Fat';
            } else if (fatContent <= 20) {
                // Medium fat (10-20g per 100g)
                fatScore = Math.max(0, Math.min(100, 40 - ((fatContent - 10) * 2)));
                fatRating = 'C';
                fatDescription = 'Medium Fat';
            } else if (fatContent <= 30) {
                // High fat (20-30g per 100g)
                fatScore = Math.max(0, Math.min(100, 20 - ((fatContent - 20) * 1)));
                fatRating = 'D';
                fatDescription = 'High Fat';
            } else {
                // Very high fat (>30g per 100g)
                fatScore = Math.max(0, Math.min(100, 10 - ((fatContent - 30) * 0.5)));
                fatRating = 'E';
                fatDescription = 'Very High Fat';
            }
            
            // Round the score to the nearest integer
            fatScore = Math.round(fatScore);
            
            // Set the fat score display
            fatRatingElement.textContent = fatRating;
            fatRatingElement.className = 'fat-rating grade-' + fatRating.toLowerCase();
            fatScoreElement.textContent = fatScore + '/100';
            
            // Add tooltip with detailed information
            let fatRatingTooltip = `Fat Rating: ${fatRating}\n`;
            
            switch(fatRating.toLowerCase()) {
                case 'a':
                    fatRatingTooltip += 'Very Low Fat (0-3g per 100g)\nExcellent for low-fat diets\nMinimal impact on cardiovascular health\nMay be lower in essential fatty acids';
                    break;
                case 'b':
                    fatRatingTooltip += 'Low Fat (3-10g per 100g)\nGood for moderate fat reduction\nUsually healthy fat level for most diets\nCheck fat quality (saturated vs. unsaturated)';
                    break;
                case 'c':
                    fatRatingTooltip += 'Medium Fat (10-20g per 100g)\nModerate consumption advised\nMay contribute to daily fat intake significantly\nCheck fat quality (saturated vs. unsaturated)';
                    break;
                case 'd':
                    fatRatingTooltip += 'High Fat (20-30g per 100g)\nConsume in limited quantities\nMay contribute significantly to daily caloric intake\nCheck for saturated and trans fat content';
                    break;
                case 'e':
                    fatRatingTooltip += 'Very High Fat (>30g per 100g)\nConsume sparingly\nMay increase risk of cardiovascular issues if consumed regularly\nHigh caloric density - portion control important';
                    break;
                default:
                    fatRatingTooltip += 'Fat content information not available';
            }
            
            fatRatingElement.title = fatRatingTooltip;
            
            // Apply color class based on fat content ranges
            let fatScoreClass = '';
            if (fatContent <= 3) {
                fatScoreClass = 'fat-score-0-3';
            } else if (fatContent <= 10) {
                fatScoreClass = 'fat-score-3-10';
            } else if (fatContent <= 20) {
                fatScoreClass = 'fat-score-10-20';
            } else if (fatContent <= 30) {
                fatScoreClass = 'fat-score-20-30';
            } else {
                fatScoreClass = 'fat-score-30-100';
            }
            
            // Set the width of the fat score bar based on the score
            const progressWidth = fatScore + '%';
            fatScoreBar.style.width = progressWidth;
            fatScoreBar.className = 'fat-score-bar ' + fatScoreClass;
            fatScoreBar.title = fatScore + '/100 - ' + fatRating;
            
            // Make sure the fat score bar is visible with full width container
            const fatScoreContainer = document.querySelector('.fat-score-container');
            if (fatScoreContainer) {
                fatScoreContainer.style.width = '100%';
            }
            
            // Create enhanced tooltip with detailed justification
            let tooltip = `Fat Score: ${fatScore}/100 (${fatRating} - ${fatDescription})\n`;
            tooltip += `Fat Content: ${fatContent}g per 100g\n`;
            tooltip += `\nInterpretation:\n`;
            
            if (fatContent <= 3) {
                tooltip += '• Very low fat content, suitable for low-fat diets\n';
                tooltip += '• Minimal impact on cardiovascular health from fat content\n';
                tooltip += '• May be lower in essential fatty acids - check ingredients';
            } else if (fatContent <= 10) {
                tooltip += '• Low fat content, good for moderate fat reduction\n';
                tooltip += '• Generally healthy fat level for most diets\n';
                tooltip += '• Check fat quality (saturated vs. unsaturated)';
            } else if (fatContent <= 20) {
                tooltip += '• Medium fat content, moderate consumption advised\n';
                tooltip += '• May contribute to daily fat intake significantly\n';
                tooltip += '• Consider the type of fats present (saturated vs. unsaturated)';
            } else if (fatContent <= 30) {
                tooltip += '• High fat content, consume in limited quantities\n';
                tooltip += '• May contribute significantly to daily caloric intake\n';
                tooltip += '• Check for saturated and trans fat content';
            } else {
                tooltip += '• Very high fat content, consume sparingly\n';
                tooltip += '• May increase risk of cardiovascular issues if consumed regularly\n';
                tooltip += '• High caloric density - portion control important';
            }
            
            fatScoreBar.title = tooltip;
            fatScoreElement.className = 'fat-score ' + fatScoreClass;
            fatScoreText.textContent = fatDescription;
        }
        
        // Generate and display AI suggestion
        generateAISuggestion(product);
        
        // Handle visibility of public reviews section
        const reviewsSection = document.getElementById('reviews-section');
        if (reviewsSection) {
            // Hide reviews section for OCR scans
            if (product.source.includes('OCR')) {
                reviewsSection.style.display = 'none'; // Completely remove the tile
            } else {
                // Show reviews section for barcode scans
                reviewsSection.style.display = ''; // Restore default display
                reviewsSection.classList.remove('hidden');
                // Clear any existing reviews and prepare for new ones
                const publicReviewsElement = document.getElementById('public-reviews');
                if (publicReviewsElement) {
                    publicReviewsElement.innerHTML = '';
                    // Reset styling if it was previously set for empty rectangle
                    publicReviewsElement.style.backgroundColor = '';
                    publicReviewsElement.style.border = '';
                    publicReviewsElement.style.minHeight = '';
                    publicReviewsElement.style.padding = '';
                    publicReviewsElement.style.borderRadius = '';
                }
            }
        }
        
        // Auto scroll to the product info section
        productInfoSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    
    // Helper function to format nutriment values
    function formatNutriment(value, unit) {
        if (value === undefined || value === null) {
            return 'N/A';
        }
        
        // Convert to number if it's a string
        const numValue = typeof value === 'string' ? parseFloat(value) : value;
        
        // Check if it's a valid number
        if (isNaN(numValue)) {
            return 'N/A';
        }
        
        // Format the number
        return numValue.toFixed(1) + unit;
    }
    
    // Function to generate AI suggestion
    function generateAISuggestion(product) {
        const aiSuggestionElement = document.getElementById('ai-suggestion');
        if (!aiSuggestionElement) return;
        
        // Clear previous content
        aiSuggestionElement.innerHTML = '';
        
        // Determine verdict based on nutrition grade and health score
        let verdict = 'Neutral';
        let reason = 'Not enough information to make a recommendation.';
        let tip = 'Consider checking the complete nutritional information.';
        
        if (product.nutrition_grade_fr && product.health_score) {
            const grade = product.nutrition_grade_fr.toUpperCase();
            const healthScore = product.health_score;
            
            if (grade === 'A' || grade === 'B' || healthScore >= 70) {
                verdict = 'Eat';
                reason = 'This product has good nutritional quality.';
                tip = 'Enjoy as part of a balanced diet.';
            } else if (grade === 'D' || grade === 'E' || healthScore < 40) {
                verdict = 'Avoid';
                reason = 'This product has a D - Poor nutritional quality.';
                tip = 'Consider healthier alternatives with less sugar, salt, or fat.';
            } else {
                verdict = 'Moderate';
                reason = 'This product has average nutritional quality.';
                tip = 'Consume in moderation as part of a balanced diet.';
            }
        }
        
        // Find positive aspects
        const positiveAspects = [];
        const nutriments = product.nutriments;
        
        if (nutriments) {
            if (nutriments.fiber && nutriments.fiber > 3) {
                positiveAspects.push('Good source of fiber');
            }
            if (nutriments.protein && nutriments.protein > 10) {
                positiveAspects.push('Good source of protein');
            }
            if (nutriments.sugar && nutriments.sugar < 5) {
                positiveAspects.push('Low in sugar');
            }
            if (nutriments.salt && nutriments.salt < 0.3) {
                positiveAspects.push('Low in salt');
            }
            if (nutriments.fat && nutriments.fat < 3) {
                positiveAspects.push('Low in fat');
            }
        }
        
        // Limit to 2 positive aspects
        positiveAspects.splice(2);
        
        // Create the AI suggestion HTML
        const verdictClass = verdict.toLowerCase();
        const verdictHTML = `<div class="verdict ${verdictClass}">${verdict}</div>`;
        
        const reasonHTML = `<div class="reason"><strong>Why:</strong> ${reason}</div>`;
        const tipHTML = `<div class="tip"><strong>Tip:</strong> ${tip}</div>`;
        
        let positiveHTML = '';
        if (positiveAspects.length > 0) {
            positiveHTML = `<div class="positive-aspects"><strong>Positive Aspects:</strong> ${positiveAspects.join(', ')}</div>`;
        }
        
        // Set the HTML content
        aiSuggestionElement.innerHTML = `
            <div class="ai-header">AI Nutrition Assistant</div>
            <div class="ai-content">
                ${verdictHTML}
                ${reasonHTML}
                ${tipHTML}
                ${positiveHTML}
                <div class="ai-footer">
                    <div class="ai-powered-by">Powered by AI</div>
                </div>
            </div>
        `;
    }
    
    // Helper function to format nutrient names
    function formatNutrientName(name) {
        return name
            .replace(/_/g, ' ')
            .replace(/-/g, ' ')
            .replace(/\b\w/g, l => l.toUpperCase());
    }
    
    // Helper function to get the unit for a nutrient
    function getNutrimentUnit(nutrient) {
        const unitMap = {
            // Standard nutrient names
            calories: 'kcal',
            energy: 'kcal',
            total_fat: 'g',
            fat: 'g',
            saturated_fat: 'g',
            'saturated-fat': 'g',
            trans_fat: 'g',
            cholesterol: 'mg',
            sodium: 'mg',
            total_carbohydrate: 'g',
            carbohydrate: 'g',
            carbs: 'g',
            dietary_fiber: 'g',
            fiber: 'g',
            sugars: 'g',
            sugar: 'g',
            protein: 'g',
            salt: 'g',
            
            // Vitamins and minerals
            vitamin_a: 'mcg',
            vitamin_c: 'mg',
            calcium: 'mg',
            iron: 'mg',
            potassium: 'mg',
            vitamin_d: 'mcg',
            vitamin_e: 'mg',
            vitamin_k: 'mcg',
            thiamin: 'mg',
            riboflavin: 'mg',
            niacin: 'mg',
            vitamin_b6: 'mg',
            folate: 'mcg',
            vitamin_b12: 'mcg',
            biotin: 'mcg',
            pantothenic_acid: 'mg',
            phosphorus: 'mg',
            iodine: 'mcg',
            magnesium: 'mg',
            zinc: 'mg',
            selenium: 'mcg',
            copper: 'mg',
            manganese: 'mg',
            chromium: 'mcg',
            molybdenum: 'mcg',
            chloride: 'mg'
        };
        
        return unitMap[nutrient.toLowerCase()] || 'g';
    }
});
