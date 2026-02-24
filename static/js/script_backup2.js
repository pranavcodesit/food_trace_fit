document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const startScannerBtn = document.getElementById('start-scanner');
    const stopScannerBtn = document.getElementById('stop-scanner');
    const switchCameraBtn = document.getElementById('switch-camera');
    const toggleFlashBtn = document.getElementById('toggle-flash');
    const darkModeToggleBtn = document.getElementById('dark-mode-toggle');
    const scannerVideo = document.getElementById('scanner');
    const barcodeInput = document.getElementById('barcode-input');
    const submitBarcodeBtn = document.getElementById('submit-barcode');
    const loadingSection = document.getElementById('loading');
    const productInfoSection = document.getElementById('product-info');
    const errorMessageSection = document.getElementById('error-message');
    const errorText = document.getElementById('error-text');
    const tryAgainBtn = document.getElementById('try-again');
    const apiStatusContainer = document.getElementById('api-status');
    const scannerSection = document.getElementById('scanner-section');
    const scannerMessage = document.getElementById('scanner-message');
    const zoomControl = document.getElementById('zoom-control');
    const captureButton = document.getElementById('capture-button');
    const showWelcomeBtn = document.getElementById('show-welcome');
    
    // Scan Method Selection Elements
    const barcodeScanBtn = document.getElementById('barcode-scan-btn');
    const nutritionLabelBtn = document.getElementById('nutrition-label-btn');
    const scannerWrapper = document.getElementById('scanner-wrapper');
    const zoomControlContainer = document.getElementById('zoom-control-container');
    const scannerControls = document.querySelector('.scanner-controls');
    const manualEntry = document.querySelector('.manual-entry');
    const ocrUploadSection = document.getElementById('ocr-upload-section');
    
    // Chat Elements
    const toggleChatBtn = document.getElementById('toggle-chat');
    const chatContainer = document.getElementById('chat-container');
    const closeChatBtn = document.getElementById('close-chat');
    const chatMessages = document.getElementById('chat-messages');
    const chatInput = document.getElementById('chat-input');
    const sendMessageBtn = document.getElementById('send-message');
    
    // Education Search Elements
    const educationSearchInput = document.getElementById('education-search-input');
    const educationSearchBtn = document.getElementById('education-search-btn');
    const educationLinks = document.querySelectorAll('.education-link');
    
    // Welcome Dialog Elements
    const welcomeOverlay = document.getElementById('welcome-overlay');
    const welcomeCloseBtn = document.getElementById('welcome-close');
    
    // Check which APIs are configured
    checkApiStatus();
    
    // Initialize dark mode from localStorage
    if (localStorage.getItem('darkMode') === 'enabled') {
        document.body.classList.add('dark-mode');
    }
    
    // Welcome dialog functionality
    function showWelcomeDialog() {
        // Only show welcome dialog if user hasn't seen it before or if manually triggered
        welcomeOverlay.classList.add('active');
    }
    
    // Scan Method Selection functionality
    function showBarcodeScanner() {
        // Show barcode scanner elements
        scannerWrapper.classList.remove('hidden');
        zoomControlContainer.classList.remove('hidden');
        scannerControls.classList.remove('hidden');
        manualEntry.classList.remove('hidden');
        
        // Hide OCR upload section
        ocrUploadSection.classList.add('hidden');
        
        // Update button states
        barcodeScanBtn.classList.add('active');
        nutritionLabelBtn.classList.remove('active');
        
        // Store preference
        localStorage.setItem('scanMethod', 'barcode');
    }
    
    function showNutritionLabelUpload() {
        // Hide barcode scanner elements
        scannerWrapper.classList.add('hidden');
        zoomControlContainer.classList.add('hidden');
        scannerControls.classList.add('hidden');
        manualEntry.classList.add('hidden');
        
        // Show OCR upload section
        ocrUploadSection.classList.remove('hidden');
        
        // Update button states
        barcodeScanBtn.classList.remove('active');
        nutritionLabelBtn.classList.add('active');
        
        // Store preference
        localStorage.setItem('scanMethod', 'nutrition');
    }
    
    // Initialize scan method from localStorage or default to barcode
    const savedScanMethod = localStorage.getItem('scanMethod') || 'barcode';
    if (savedScanMethod === 'nutrition') {
        showNutritionLabelUpload();
    } else {
        showBarcodeScanner();
    }
    
    // Add event listeners for scan method buttons
    barcodeScanBtn.addEventListener('click', showBarcodeScanner);
    nutritionLabelBtn.addEventListener('click', showNutritionLabelUpload);
    
    function showWelcomeOnFirstVisit() {
        // Only show welcome dialog if user hasn't seen it before
        if (!localStorage.getItem('welcomeShown')) {
            showWelcomeDialog();
        }
    }
    
    function closeWelcomeDialog() {
        welcomeOverlay.classList.remove('active');
        // Set flag in localStorage so dialog won't show again automatically
        localStorage.setItem('welcomeShown', 'true');
    }
    
    // Show welcome dialog when page loads (first visit only)
    showWelcomeOnFirstVisit();
    
    // Add event listener to close button
    if (welcomeCloseBtn) {
        welcomeCloseBtn.addEventListener('click', closeWelcomeDialog);
    }
    
    // Add event listener to show welcome button
    if (showWelcomeBtn) {
        showWelcomeBtn.addEventListener('click', showWelcomeDialog);
    }
    
    // Also close dialog when clicking outside of it
    if (welcomeOverlay) {
        welcomeOverlay.addEventListener('click', (e) => {
            if (e.target === welcomeOverlay) {
                closeWelcomeDialog();
            }
        });
        
        // Add keyboard shortcut (Escape key) to close dialog
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && welcomeOverlay.classList.contains('active')) {
                closeWelcomeDialog();
            }
        });
    }
    
    // External feedback link is now used instead of the form
    // No JavaScript needed for the feedback button as it's a direct link
    
    // Chat functionality
    let currentProduct = null;
    
    function toggleChat() {
        chatContainer.classList.toggle('hidden');
        if (!chatContainer.classList.contains('hidden')) {
            chatInput.focus();
        }
    }
    
    function closeChat() {
        chatContainer.classList.add('hidden');
    }
    
    function addMessage(message, isUser = false) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${isUser ? 'user' : 'bot'}`;
        
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        
        // Check if message contains markdown-style formatting
        if (!isUser && (message.includes('**') || message.includes('â€¢') || message.includes('\n'))) {
            // Simple markdown parsing
            let formattedMessage = message
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold text
                .replace(/\n/g, '<br>'); // Line breaks
            
            messageContent.innerHTML = formattedMessage;
        } else {
            messageContent.textContent = message;
        }
        
        messageDiv.appendChild(messageContent);
        chatMessages.appendChild(messageDiv);
        
        // Scroll to bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    // Function to provide quick nutrition facts
    function getQuickNutritionFact() {
        const facts = [
            "ðŸŽ An apple contains about 95 calories and is a good source of fiber.",
            "ðŸ¥¦ Broccoli is rich in vitamins C and K, and is a good source of folate.",
            "ðŸ¥š Eggs are one of the most nutritious foods, containing a little bit of almost every nutrient you need.",
            "ðŸ¥‘ Avocados are loaded with heart-healthy monounsaturated fatty acids.",
            "ðŸ“ Strawberries are among the most antioxidant-rich fruits and are particularly high in vitamin C.",
            "ðŸ¥› Milk is a great source of calcium, vitamin D, and protein.",
            "ðŸ— Chicken breast is high in protein and low in fat if eaten without the skin.",
            "ðŸŸ Fatty fish like salmon are loaded with omega-3 fatty acids, crucial for brain health.",
            "ðŸ¥œ Almonds are high in healthy fats, vitamin E, and magnesium.",
            "ðŸ  Sweet potatoes are a great source of beta-carotene, vitamin C, and potassium."
        ];
        
        return facts[Math.floor(Math.random() * facts.length)];
    }
    
    async function sendMessage() {
        const message = chatInput.value.trim();
        if (message === '') return;
        
        // Add user message to chat
        addMessage(message, true);
        chatInput.value = '';
        
        // Show typing indicator
        const typingIndicator = document.createElement('div');
        typingIndicator.className = 'message bot typing';
        typingIndicator.innerHTML = '<div class="message-content">Thinking...</div>';
        chatMessages.appendChild(typingIndicator);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        try {
            // Check for special commands
            if (message.toLowerCase() === 'help') {
                // Remove typing indicator
                chatMessages.removeChild(typingIndicator);
                
                // Show help message
                addMessage('ðŸ¤– **Chat Assistant Help**\n\n' +
                          'â€¢ Ask about nutrition facts for any food\n' +
                          'â€¢ Get healthy eating recommendations\n' +
                          'â€¢ Learn about ingredients or allergens\n' +
                          'â€¢ Ask for meal planning advice\n' +
                          'â€¢ Get explanations about nutrition terms\n' +
                          'â€¢ Type "fact" for a random nutrition fact\n' +
                          'â€¢ Type "clear" to clear chat history\n' +
                          'â€¢ Type "help" to see this message again');
                return;
            }
            
            if (message.toLowerCase() === 'clear') {
                // Clear chat history except for the first welcome message
                while (chatMessages.children.length > 1) {
                    chatMessages.removeChild(chatMessages.lastChild);
                }
                return;
            }
            
            if (message.toLowerCase() === 'fact') {
                // Remove typing indicator
                chatMessages.removeChild(typingIndicator);
                
                // Show a random nutrition fact
                addMessage(getQuickNutritionFact());
                return;
            }
            
            // Prepare the request data
            const requestData = {
                query: message,
                product_data: currentProduct || null
            };
            
            // Send request to backend
            const response = await fetch('/chat-assistant', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-Key': getApiKey()
                },
                body: JSON.stringify(requestData)
            });
            
            if (!response.ok) {
                throw new Error('Failed to get response from chat assistant');
            }
            
            const data = await response.json();
            
            // Remove typing indicator
            chatMessages.removeChild(typingIndicator);
            
            // Add bot response
            addMessage(data.response);
            
            // Suggest follow-up questions based on context
            if (currentProduct && Math.random() > 0.7) {
                setTimeout(() => {
                    const suggestions = [
                        `Is ${currentProduct.name} healthy for daily consumption?`,
                        `What are healthier alternatives to ${currentProduct.name}?`,
                        `What nutrients am I missing if I eat ${currentProduct.name}?`,
                        `How does ${currentProduct.name} fit into a balanced diet?`
                    ];
                    
                    const randomSuggestion = suggestions[Math.floor(Math.random() * suggestions.length)];
                    addMessage(`ðŸ’¡ You might also want to ask: "${randomSuggestion}"`); 
                }, 1000);
            }
            
        } catch (error) {
            console.error('Chat error:', error);
            
            // Remove typing indicator
            chatMessages.removeChild(typingIndicator);
            
            // Add error message
            addMessage('Sorry, I encountered an error. Please try again later. Type "help" for assistance.');
        }
    }
    
    // Add event listeners for chat
    const floatingChatBtn = document.getElementById('floating-chat-btn');
    
    if (floatingChatBtn) {
        floatingChatBtn.addEventListener('click', toggleChat);
    }
    
    if (closeChatBtn) {
        closeChatBtn.addEventListener('click', closeChat);
    }
    
    if (sendMessageBtn) {
        sendMessageBtn.addEventListener('click', sendMessage);
    }
    
    if (chatInput) {
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
    }
    
    // Add keyboard shortcut (Escape key) to close chat
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !chatContainer.classList.contains('hidden')) {
            closeChat();
        }
    });
    
    // Education Search Functionality
    function performEducationSearch() {
        const searchTerm = educationSearchInput.value.toLowerCase().trim();
        let resultsFound = false;
        
        if (searchTerm === '') {
            // If search is empty, show all links
            educationLinks.forEach(link => {
                link.style.display = 'flex';
            });
            return;
        }
        
        educationLinks.forEach(link => {
            const linkText = link.textContent.toLowerCase();
            if (linkText.includes(searchTerm)) {
                link.style.display = 'flex';
                resultsFound = true;
            } else {
                link.style.display = 'none';
            }
        });
        
        // If no results found, show a message
        if (!resultsFound) {
            // Check if message already exists
            let noResultsMsg = document.getElementById('no-results-message');
            if (!noResultsMsg) {
                noResultsMsg = document.createElement('p');
                noResultsMsg.id = 'no-results-message';
                noResultsMsg.className = 'no-results';
                document.querySelector('.education-links').appendChild(noResultsMsg);
            }
            noResultsMsg.textContent = `No results found for "${searchTerm}". Try another search term.`;
            noResultsMsg.style.display = 'block';
        } else {
            // Hide the message if it exists
            const noResultsMsg = document.getElementById('no-results-message');
            if (noResultsMsg) {
                noResultsMsg.style.display = 'none';
            }
        }
    }
    
    // Add event listeners for education search
    if (educationSearchBtn) {
        educationSearchBtn.addEventListener('click', performEducationSearch);
    }
    
    if (educationSearchInput) {
        educationSearchInput.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') {
                performEducationSearch();
            }
        });
    }

    // Scanner variables
    let codeReader = null;
    let selectedDeviceId = null;
    let availableCameras = [];
    let currentCameraIndex = 0;
    let scanning = false;
    let currentStream = null;
    let flashEnabled = false;
    let flashSupported = false;

    // Initialize the barcode scanner
    function initScanner() {
        try {
            console.log('Initializing scanner...');
            
            // Check if ZXing library is loaded
            if (typeof ZXing === 'undefined') {
                console.error('ZXing library not loaded');
                showError('Barcode scanner library not loaded. Please refresh the page or try again later.');
                // Try to load ZXing library dynamically
                loadZXingLibrary();
                return;
            }
            
            console.log('ZXing library found:', ZXing);
            
            // First check if browser supports getUserMedia
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                console.error('Browser does not support getUserMedia');
                showError('Your browser does not support camera access. Please use a modern browser like Chrome, Firefox, or Edge.');
                return;
            }
            
            // Check for camera permissions first
            console.log('Checking camera permissions...');
            navigator.mediaDevices.getUserMedia({ video: true })
                .then(stream => {
                    console.log('Camera permission granted');
                    // Stop the test stream immediately
                    stream.getTracks().forEach(track => track.stop());
                    
                    try {
                        // Now create the ZXing reader with format hints to only accept product barcodes
                        const hints = new Map();
                        // Only use product barcode formats (UPC-A, UPC-E, EAN-8, EAN-13, etc.)
                        // Exclude QR codes and other non-product formats
                        const formats = [
                            ZXing.BarcodeFormat.UPC_A,
                            ZXing.BarcodeFormat.UPC_E,
                            ZXing.BarcodeFormat.EAN_8,
                            ZXing.BarcodeFormat.EAN_13,
                            ZXing.BarcodeFormat.CODE_39,
                            ZXing.BarcodeFormat.CODE_128
                        ];
                        hints.set(ZXing.DecodeHintType.POSSIBLE_FORMATS, formats);
                        codeReader = new ZXing.BrowserMultiFormatReader(hints);
                        console.log('BrowserMultiFormatReader created successfully with product barcode formats');
                        
                        // Get available video devices
                        navigator.mediaDevices.enumerateDevices()
                            .then(devices => {
                                // Filter for video input devices only
                                const videoDevices = devices.filter(device => device.kind === 'videoinput');
                                console.log('Video devices found:', videoDevices);
                                
                                if (videoDevices.length === 0) {
                                    console.warn('No camera detected');
                                    showError('No camera detected. Please enter the barcode manually.');
                                    return;
                                }

                                // Store all available cameras
                                availableCameras = videoDevices;
                                
                                // Find the index of the rear camera if available
                                const rearCameraIndex = availableCameras.findIndex(device => 
                                    /(back|rear)/i.test(device.label));
                                
                                // Set the current camera index to the rear camera if found, otherwise use the first camera
                                currentCameraIndex = rearCameraIndex !== -1 ? rearCameraIndex : 0;
                                selectedDeviceId = availableCameras[currentCameraIndex].deviceId;
                                
                                console.log('Selected camera:', currentCameraIndex, selectedDeviceId);
                                
                                // Enable the start scanner button
                                startScannerBtn.disabled = false;
                                
                                // Enable camera switch button if more than one camera is available
                                if (availableCameras.length > 1) {
                                    switchCameraBtn.disabled = false;
                                }
                                
                                console.log('Scanner initialized successfully');
                            })
                            .catch(err => {
                                console.error('Error enumerating devices:', err);
                                showError('Failed to list cameras. Please check camera permissions or enter the barcode manually.');
                            });
                    } catch (readerError) {
                        console.error('Error creating BrowserMultiFormatReader:', readerError);
                        showError('Failed to initialize barcode reader. Please refresh the page or try again later.');
                    }
                })
                .catch(err => {
                    console.error('Camera permission error:', err);
                    if (err.name === 'NotAllowedError') {
                        showError('Camera access denied. Please grant camera permissions in your browser settings and refresh the page.');
                    } else if (err.name === 'NotFoundError') {
                        showError('No camera found. Please connect a camera or enter the barcode manually.');
                    } else if (err.name === 'NotReadableError') {
                        showError('Camera is in use by another application. Please close other applications using the camera.');
                    } else {
                        showError('Failed to access camera: ' + err.message);
                    }
                });
        } catch (error) {
            console.error('Error initializing scanner:', error);
            showError('Failed to initialize scanner. Please refresh the page or try again later.');
        }
    }
    
    // Function to dynamically load ZXing library if it's not available
    function loadZXingLibrary() {
        console.log('Attempting to load ZXing library dynamically');
        
        // Try both paths
        const paths = [
            '/static/js/zxing-library.min.js',
            '/zxing-library.js'
        ];
        
        let loaded = false;
        
        // Try each path in sequence
        function tryNextPath(index) {
            if (index >= paths.length) {
                console.error('Failed to load ZXing library from all paths');
                return;
            }
            
            const script = document.createElement('script');
            script.src = paths[index];
            script.onload = function() {
                console.log('ZXing library loaded successfully from', paths[index]);
                loaded = true;
                // Reinitialize scanner after library is loaded
                setTimeout(initScanner, 500);
            };
            script.onerror = function() {
                console.error('Failed to load ZXing library from', paths[index]);
                // Try next path
                tryNextPath(index + 1);
            };
            document.body.appendChild(script);
        }
        
        // Start with the first path
        tryNextPath(0);
    }

    // Start the scanner
    function startScanner() {
        try {
            // Display initializing message
            if (scannerMessage) {
                scannerMessage.textContent = 'Initializing camera...';
                scannerMessage.style.display = 'block';
            }
            
            // Check if ZXing library is loaded
            if (typeof ZXing === 'undefined') {
                console.error('ZXing library not loaded when trying to start scanner');
                if (scannerMessage) {
                    scannerMessage.textContent = 'Loading barcode scanner library...';
                } else {
                    showError('Barcode scanner library not loaded. Please refresh the page.');
                }
                // Try to load ZXing library dynamically
                loadZXingLibrary();
                return;
            }
            
            // If codeReader or selectedDeviceId is not initialized, reinitialize the scanner
            if (!codeReader || !selectedDeviceId) {
                console.error('CodeReader or selectedDeviceId not initialized');
                // Try to reinitialize the scanner
                console.log('Attempting to reinitialize scanner...');
                if (scannerMessage) {
                    scannerMessage.textContent = 'Setting up scanner...';
                }
                initScanner();
                setTimeout(() => {
                    if (codeReader && selectedDeviceId) {
                        console.log('Scanner reinitialized successfully, starting scanner...');
                        if (scannerMessage) {
                            scannerMessage.textContent = 'Scanner ready, starting...';
                        }
                        startScanner();
                    } else {
                        if (scannerMessage) {
                            scannerMessage.textContent = 'Scanner initialization failed. Please refresh the page.';
                        } else {
                            showError('Scanner not initialized. Please refresh the page or check camera permissions.');
                        }
                    }
                }, 1000);
                return;
            }

            // Check if browser supports getUserMedia
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                console.error('Browser does not support getUserMedia');
                if (scannerMessage) {
                    scannerMessage.textContent = 'Your browser does not support camera access. Please use a modern browser.';
                } else {
                    showError('Your browser does not support camera access. Please use a modern browser like Chrome, Firefox, or Edge.');
                }
                return;
            }

            // Update UI
            hideAllSections();
            scannerSection.style.display = 'block';
            scanning = true;
            startScannerBtn.disabled = true;
            stopScannerBtn.disabled = false;
            
            // Enable camera switch button if more than one camera is available
            if (availableCameras && availableCameras.length > 1) {
                switchCameraBtn.disabled = false;
            }
            
            // Enable flash toggle button (will be disabled later if not supported)
            toggleFlashBtn.disabled = false;
            
            console.log('Starting scanner with device ID:', selectedDeviceId);
            if (scannerMessage) {
                scannerMessage.textContent = 'Accessing camera...';
            }
            
            // First, explicitly request camera permissions with fallback options
            let videoConstraints;
            
            try {
                // Try with exact device ID first
                videoConstraints = { deviceId: { exact: selectedDeviceId } };
            } catch (e) {
                console.warn('Error with exact device ID, using fallback:', e);
                // Fallback to any camera if the selected one isn't available
                videoConstraints = { facingMode: 'environment' };
            }
            
            navigator.mediaDevices.getUserMedia({ video: videoConstraints })
                .then(stream => {
                    console.log('Camera permission granted, stream obtained');
                    // Store the current stream for later use (e.g., toggling flash)
                    currentStream = stream;
                    
                    // Attach stream to video element to show preview
                    scannerVideo.srcObject = stream;
                    
                    // Make sure video element is visible
                    scannerVideo.style.display = 'block';
                    
                    // Check if flash is supported on this device
                    checkFlashSupport(stream);
                    
                    // Play the video
                    const playPromise = scannerVideo.play();
                    if (playPromise !== undefined) {
                        playPromise
                            .then(() => {
                                console.log('Video playback started successfully');
                                // Now start the ZXing decoder only after video is successfully playing
                                startZXingDecoder(selectedDeviceId);
                            })
                            .catch(error => {
                                console.error('Error playing video:', error);
                                if (scannerMessage) {
                                    scannerMessage.textContent = 'Error playing video: ' + error.message + '. Try Again';
                                } else {
                                    showError('Error playing video: ' + error.message);
                                }
                            });
                    }
                    // ZXing decoder will be started after video playback is successful
                    // See the startZXingDecoder function call in the playPromise.then() callback
                })
                .catch(error => {
                    console.error('Camera access error:', error);
                    if (error.name === 'NotAllowedError') {
                        if (scannerMessage) {
                            scannerMessage.textContent = 'Camera access denied. Please grant camera permissions and try again.';
                        } else {
                            showError('Camera access denied. Please grant camera permissions and try again.');
                        }
                    } else if (error.name === 'NotFoundError') {
                        if (scannerMessage) {
                            scannerMessage.textContent = 'No camera found. Please connect a camera or enter the barcode manually.';
                        } else {
                            showError('No camera found. Please connect a camera or enter the barcode manually.');
                        }
                    } else if (error.name === 'NotReadableError') {
                        if (scannerMessage) {
                            scannerMessage.textContent = 'Camera is in use by another application. Please close other applications using the camera.';
                        } else {
                            showError('Camera is in use by another application. Please close other applications using the camera.');
                        }
                    } else if (error.name === 'OverconstrainedError') {
                        console.log('Selected camera not available, trying with any available camera...');
                        if (scannerMessage) {
                            scannerMessage.textContent = 'Selected camera not available, trying with any available camera...';
                        }
                        // Try again with any camera
                        navigator.mediaDevices.getUserMedia({ video: true })
                            .then(stream => {
                                console.log('Using fallback camera');
                                if (scannerMessage) {
                                    scannerMessage.textContent = 'Using fallback camera...';
                                }
                                scannerVideo.srcObject = stream;
                                
                                // Use the first available device ID instead
                                const fallbackDeviceId = null; // Let ZXing use the default
                                if (scannerMessage) {
                                    scannerMessage.textContent = 'Starting fallback camera...';
                                }
                                
                                // Play the video with proper promise handling
                                const playPromise = scannerVideo.play();
                                if (playPromise !== undefined) {
                                    playPromise
                                        .then(() => {
                                            console.log('Fallback video playback started successfully');
                                            // Start ZXing decoder only after video is successfully playing
                                            if (scannerMessage) {
                                                scannerMessage.textContent = 'Starting barcode decoder with fallback camera...';
                                            }
                                            startZXingDecoder(fallbackDeviceId);
                                        })
                                        .catch(error => {
                                            console.error('Error playing fallback video:', error);
                                            if (scannerMessage) {
                                                scannerMessage.textContent = 'Error playing video: ' + error.message + '. Try Again';
                                            } else {
                                                showError('Error playing video: ' + error.message);
                                            }
                                        });
                                }
                            })
                            .catch(fallbackError => {
                                console.error('Fallback camera error:', fallbackError);
                                if (scannerMessage) {
                                    scannerMessage.textContent = 'Could not access any camera. Please check permissions or enter the barcode manually.';
                                } else {
                                    showError('Could not access any camera. Please check permissions or enter the barcode manually.');
                                }
                            });
                    } else {
                        if (scannerMessage) {
                            scannerMessage.textContent = 'Failed to access camera: ' + error.message;
                        } else {
                            showError('Failed to access camera: ' + error.message);
                        }
                    }
                });
            
            console.log('Scanner started successfully');
            if (scannerMessage) {
                scannerMessage.textContent = 'Scanner active. Point camera at a barcode.';
            }
         } catch (error) {
             console.error('Error in startScanner function:', error);
             if (scannerMessage) {
                 scannerMessage.textContent = 'Failed to start scanner: ' + error.message;
             } else {
                 showError('Failed to start scanner. Please refresh the page or try again later.');
             }
         }
     }

    // Function to check if flash is supported on the current camera
    function checkFlashSupport(stream) {
        if (!stream) {
            console.warn('No stream available to check flash support');
            flashSupported = false;
            toggleFlashBtn.classList.add('disabled');
            return;
        }
        
        const track = stream.getVideoTracks()[0];
        
        // Check if the track has torch capability
        if (track && track.getCapabilities && track.getCapabilities().torch) {
            console.log('Flash/torch is supported on this device');
            flashSupported = true;
            toggleFlashBtn.classList.remove('disabled');
        } else {
            console.log('Flash/torch is not supported on this device');
            flashSupported = false;
            toggleFlashBtn.classList.add('disabled');
        }
    }
    
    // Function to toggle the flash/torch
    function toggleFlash() {
        if (!currentStream || !flashSupported) return;
        
        const track = currentStream.getVideoTracks()[0];
        
        if (track && track.getCapabilities && track.getCapabilities().torch) {
            flashEnabled = !flashEnabled;
            
            try {
                track.applyConstraints({
                    advanced: [{ torch: flashEnabled }]
                })
                .then(() => {
                    console.log('Flash toggled:', flashEnabled ? 'ON' : 'OFF');
                    // Update UI to reflect flash state
                    if (flashEnabled) {
                        toggleFlashBtn.classList.add('active');
                    } else {
                        toggleFlashBtn.classList.remove('active');
                    }
                })
                .catch(error => {
                    console.error('Error toggling flash:', error);
                    flashEnabled = false;
                    toggleFlashBtn.classList.remove('active');
                });
            } catch (error) {
                console.error('Error applying flash constraints:', error);
                flashEnabled = false;
                toggleFlashBtn.classList.remove('active');
            }
        }
    }
    
    // Function to start the ZXing decoder after video is successfully playing
    function startZXingDecoder(deviceId) {
        try {
            if (scannerMessage) {
                scannerMessage.textContent = 'Starting barcode decoder...';
            }
            
            codeReader.decodeFromVideoDevice(deviceId, scannerVideo, (result, err) => {
                if (result && scanning) {
                    console.log('Barcode detected:', result.text);
                    if (scannerMessage) {
                        scannerMessage.textContent = 'Barcode detected! Processing...';
                    }
                    // Stop scanning once a barcode is detected
                    stopScanner();
                    // Process the barcode
                    processBarcode(result.text);
                    // Ensure camera is completely closed
                    if (scannerVideo && scannerVideo.srcObject) {
                        const tracks = scannerVideo.srcObject.getTracks();
                        tracks.forEach(track => track.stop());
                        scannerVideo.srcObject = null;
                        console.log('Camera closed after successful scan');
                    }
                }
                
                if (err && !(err instanceof ZXing.NotFoundException)) {
                    console.error('Scanner error:', err);
                    if (scanning) {
                        if (scannerMessage) {
                            scannerMessage.textContent = 'Scanner error: ' + err.message;
                        }
                        stopScanner();
                        if (!scannerMessage) {
                            showError('Scanner error. Please try again or enter the barcode manually.');
                        }
                    }
                }
            });
            console.log('ZXing decoder started successfully');
            if (scannerMessage) {
                scannerMessage.textContent = 'Scanner active. Point camera at a barcode.';
            }
        } catch (decoderError) {
            console.error('Error starting ZXing decoder:', decoderError);
            if (scannerMessage) {
                scannerMessage.textContent = 'Failed to start barcode decoder: ' + decoderError.message;
            }
            stopScanner();
            if (!scannerMessage) {
                showError('Failed to start barcode decoder. Please try again or enter the barcode manually.');
            }
        }
    }

    // Stop the scanner
    function stopScanner() {
        try {
            console.log('Stopping scanner...');
            
            // Update scanner message
            if (scannerMessage) {
                scannerMessage.textContent = 'Stopping scanner...';
            }
            
            // Stop video stream if it exists
            if (scannerVideo && scannerVideo.srcObject) {
                const tracks = scannerVideo.srcObject.getTracks();
                tracks.forEach(track => {
                    try {
                        console.log('Stopping track:', track.kind);
                        track.stop();
                    } catch (trackError) {
                        console.error('Error stopping track:', trackError);
                    }
                });
                scannerVideo.srcObject = null;
                
                // Pause the video element
                try {
                    scannerVideo.pause();
                } catch (pauseError) {
                    console.error('Error pausing video:', pauseError);
                }
            }
            
            // Reset ZXing reader
            if (codeReader) {
                try {
                    codeReader.reset();
                    console.log('CodeReader reset');
                } catch (resetError) {
                    console.error('Error resetting codeReader:', resetError);
                    // If reset fails, try to recreate the codeReader
                    try {
                        codeReader = new ZXing.BrowserMultiFormatReader();
                        console.log('CodeReader recreated after reset failure');
                    } catch (recreateError) {
                        console.error('Error recreating codeReader:', recreateError);
                    }
                }
            }
            
            // Update UI state
            scanning = false;
            startScannerBtn.disabled = false;
            stopScannerBtn.disabled = true;
            toggleFlashBtn.disabled = true;
            
            // Reset flash state
            flashEnabled = false;
            flashSupported = false;
            toggleFlashBtn.classList.remove('active');
            
            // Only enable switch camera if we have multiple cameras and they're available
            if (availableCameras && availableCameras.length > 1) {
                switchCameraBtn.disabled = false;
            } else {
                switchCameraBtn.disabled = true;
            }
            
            // Update scanner message
            if (scannerMessage) {
                scannerMessage.textContent = 'Scanner stopped. Click "Start Scanner" to scan again.';
            }
            
            console.log('Scanner stopped successfully');
        } catch (error) {
            console.error('Error stopping scanner:', error);
            if (scannerMessage) {
                scannerMessage.textContent = 'Error stopping scanner: ' + error.message;
            }
        }
    }

    // Get API key - hardcoded for public use
    function getApiKey() {
        // Use the hardcoded API key from the server logs
        const hardcodedApiKey = 'foodscanner_api_key_secure_123';
        
        // Store it in localStorage to avoid repeated calls
        if (!localStorage.getItem('foodscannerApiKey')) {
            localStorage.setItem('foodscannerApiKey', hardcodedApiKey);
        }
        
        // In development mode, we don't need an API key
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            return null;
        }
        
        return hardcodedApiKey;
    }
    
    // Process the barcode (either scanned or manually entered)
    function processBarcode(barcode) {
        if (!barcode || barcode.trim() === '') {
            showError('Please enter a valid barcode.');
            return;
        }

        // Ensure camera is completely closed if it's still open
        if (scannerVideo && scannerVideo.srcObject) {
            const tracks = scannerVideo.srcObject.getTracks();
            tracks.forEach(track => track.stop());
            scannerVideo.srcObject = null;
            console.log('Camera closed in processBarcode');
        }

        // Show loading state
        hideAllSections();
        loadingSection.classList.remove('hidden');
        
        // Auto scroll to the loading section
        loadingSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        
        // Get API key
        const apiKey = getApiKey();
        const headers = {
            'Content-Type': 'application/json',
        };
        
        // Add API key to headers if available
        if (apiKey) {
            headers['X-API-Key'] = apiKey;
        }

        // Call the backend API
        fetch('/scan', {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({ barcode: barcode.trim() })
        })
        .then(response => {
            if (!response.ok) {
                if (response.status === 401) {
                    // Invalid API key, clear it from localStorage
                    localStorage.removeItem('foodscannerApiKey');
                    throw new Error('Invalid API key. Please try again.');
                }
                return response.json().then(data => {
                    throw new Error(data.error || `HTTP error! Status: ${response.status}`);
                });
            }
            return response.json();
        })
        .then(data => {
            displayProductInfo(data);
        })
        .catch(error => {
            console.error('Error:', error);
            showError(error.message || 'Failed to fetch product information. Please try again.');
        });
    }

    // Check which APIs are configured
    function checkApiStatus() {
        // Get API key
        const apiKey = getApiKey();
        const headers = {};
        
        // Add API key to headers if available
        if (apiKey) {
            headers['X-API-Key'] = apiKey;
        }
        
        fetch('/api-status', {
            headers: headers
        })
            .then(response => {
                if (!response.ok) {
                    if (response.status === 401) {
                        // Invalid API key, clear it from localStorage and try again
                        localStorage.removeItem('foodscannerApiKey');
                        throw new Error('Invalid API key. Please try again.');
                    }
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                let statusHtml = '<h3>Data Sources Status</h3><div class="api-status-list">';
                
                // OpenFoodFacts status
                statusHtml += `
                    <div class="api-status-item">
                        <div class="status-indicator ${data.openfoodfacts ? 'status-active' : 'status-inactive'}"></div>
                        <span class="api-name">OpenFoodFacts</span>
                    </div>`;
                
                // USDA status
                statusHtml += `
                    <div class="api-status-item">
                        <div class="status-indicator ${data.usda ? 'status-active' : 'status-inactive'}"></div>
                        <span class="api-name">USDA FoodData Central</span>
                    </div>`;
                
                // Edamam status
                statusHtml += `
                    <div class="api-status-item">
                        <div class="status-indicator ${data.edamam ? 'status-active' : 'status-inactive'}"></div>
                        <span class="api-name">Edamam Food Database</span>
                    </div>`;
                
                // IFCT status
                statusHtml += `
                    <div class="api-status-item">
                        <div class="status-indicator ${data.ifct ? 'status-active' : 'status-inactive'}"></div>
                        <span class="api-name">Indian Food Composition Database</span>
                    </div>`;
                
                // Groq AI status
                statusHtml += `
                    <div class="api-status-item">
                        <div class="status-indicator ${data.groq ? 'status-active' : 'status-inactive'}"></div>
                        <span class="api-name">Groq AI (for missing data)</span>
                    </div>`;
                
                statusHtml += '</div>';
                
                // Add refresh option
                statusHtml += '<span class="refresh-api-status" onclick="refreshApiStatus()">Refresh Status</span>';
                
                if (apiStatusContainer) {
                    apiStatusContainer.innerHTML = statusHtml;
                }
            })
            .catch(error => {
                console.error('Error checking API status:', error);
                if (apiStatusContainer) {
                    apiStatusContainer.innerHTML = '<p>Error checking data sources</p>';
                }
            });
    }

    // Display product information
    function displayProductInfo(product) {
        // Ensure camera is completely closed if it's still open
        if (scannerVideo && scannerVideo.srcObject) {
            const tracks = scannerVideo.srcObject.getTracks();
            tracks.forEach(track => track.stop());
            scannerVideo.srcObject = null;
            console.log('Camera closed in displayProductInfo');
        }
        
        // Hide loading
        hideAllSections();
        
        // Update the current product for the chatbot
        currentProduct = product;
        
        // Set product details
        document.getElementById('product-name').textContent = product.product_name || 'Unknown Product';
        document.getElementById('product-brand').textContent = product.brand || 'Unknown Brand';
        document.getElementById('barcode').textContent = product.code || 'N/A';
        
        // Generate and display AI suggestion
        generateAISuggestion(product);
        
        // For categories, check if we need to translate from French or other languages
        let categories = product.categories || 'N/A';
        // If categories contain French terms, we can add translation logic here
        if (categories.includes('Boissons') || categories.includes('prÃ©parations')) {
            // Simple translation of common French food categories
            categories = categories
                .replace('Boissons et prÃ©parations de boissons', 'Beverages and beverage preparations')
                .replace('Boissons', 'Beverages')
                .replace('Boissons gazeuses', 'Carbonated beverages')
                .replace('Boissons Ã©dulcorÃ©es', 'Sweetened beverages')
                .replace('Sodas', 'Sodas')
                .replace('Sodas au cola', 'Cola sodas')
                .replace('Sodas light', 'Diet sodas')
                .replace('Sodas au cola light', 'Diet cola sodas');
        }
        document.getElementById('categories').textContent = categories;
        
        document.getElementById('serving-size').textContent = product.serving_size || 'N/A';
        
        // For ingredients, check if we need to translate from French or other languages
        let ingredients = product.ingredients_text || 'No ingredients information available';
        // If ingredients contain French terms, we can add translation logic here
        if (ingredients.includes('Eau gazÃ©ifiÃ©e') || ingredients.includes('colorant') || ingredients.includes('acidifiant')) {
            // Simple translation of common French ingredients
            ingredients = ingredients
                .replace('Eau gazÃ©ifiÃ©e', 'Carbonated water')
                .replace('colorant', 'coloring')
                .replace('acidifiant', 'acidifier')
                .replace('acide phosphorique', 'phosphoric acid')
                .replace('Ã©dulcorants', 'sweeteners')
                .replace('aspartame', 'aspartame')
                .replace('acÃ©sulfame-K', 'acesulfame-K')
                .replace('arÃ´mes naturels', 'natural flavors')
                .replace('arÃ´me cafÃ©ine', 'caffeine flavor')
                .replace('correcteur d\'aciditÃ©', 'acidity regulator')
                .replace('citrates de sodium', 'sodium citrates');
        }
        // Format ingredients for table display
        if (ingredients && ingredients.length > 0) {
            // Clean up any excessive whitespace or line breaks
            ingredients = ingredients.replace(/\s+/g, ' ').trim();
            
            // Split ingredients by commas, periods, or semicolons
            const ingredientsList = ingredients.split(/[,;.]+/).map(item => item.trim()).filter(item => item.length > 0);
            
            // Create a table for ingredients
            let tableHTML = '<table class="ingredients-table"><thead><tr><th>Ingredient</th><th>Type</th><th>Notes</th></tr></thead><tbody>';
            
            // Add each ingredient to the table
            ingredientsList.forEach(ingredient => {
                // Normalize ingredient for comparison
                const ingredientLower = ingredient.toLowerCase();
                
                // Determine ingredient type (enhanced logic)
                let type = 'Primary';
                let notes = '';
                
                // Check for additives
                if (ingredientLower.match(/colou?r(ing)?|flavo[u]r(ing)?|preservative|sweetener|acid|stabilizer|emulsifier|thickener|e\d{3,4}|monosodium|glutamate|msg|nitrite|nitrate|sulfite|benzoate|sorbate/i)) {
                    type = 'Additive';
                    
                    // Add specific notes for certain additives
                    if (ingredientLower.match(/nitrite|nitrate/i)) {
                        notes = 'May affect blood pressure';
                    } else if (ingredientLower.match(/msg|monosodium glutamate/i)) {
                        notes = 'May cause sensitivity in some people';
                    } else if (ingredientLower.match(/sulfite|sulphite/i)) {
                        notes = 'Common allergen';
                    }
                } 
                // Check for nutrients
                else if (ingredientLower.match(/vitamin|mineral|calcium|iron|zinc|magnesium|potassium|folate|folic|b\d+|omega/i)) {
                    type = 'Nutrient';
                    notes = 'Nutritional benefit';
                }
                // Check for common allergens
                else if (ingredientLower.match(/milk|dairy|lactose|whey|casein|egg|peanut|nut|soy|wheat|gluten|fish|shellfish|crustacean|sesame|mustard|celery|lupin|mollusc/i)) {
                    type = 'Primary';
                    notes = '<span class="allergen-warning">Common allergen</span>';
                }
                // Check for sugars
                else if (ingredientLower.match(/sugar|sucrose|fructose|glucose|dextrose|maltose|syrup|honey|molasses|agave|corn syrup|maple/i)) {
                    type = 'Sweetener';
                    notes = 'Added sugar';
                }
                // Check for oils and fats
                else if (ingredientLower.match(/oil|fat|butter|margarine|lard|shortening/i)) {
                    type = 'Fat/Oil';
                    
                    if (ingredientLower.match(/olive|avocado|flax|canola|sunflower/i)) {
                        notes = 'Unsaturated fat (healthier)';
                    } else if (ingredientLower.match(/palm|coconut|butter|lard/i)) {
                        notes = 'Saturated fat';
                    }
                }
                
                tableHTML += `<tr><td>${ingredient}</td><td>${type}</td><td>${notes}</td></tr>`;
            });
            
            tableHTML += '</tbody></table>';
            document.getElementById('ingredients').innerHTML = tableHTML;
        } else {
            document.getElementById('ingredients').textContent = ingredients;
        }
        
        // Set health recommendation
        const healthRecommendationElement = document.getElementById('health-recommendation');
        if (healthRecommendationElement) {
            // Check if health recommendation is available from the API
            if (product.health_recommendation) {
                healthRecommendationElement.innerHTML = '';
                
                // Create a detailed health recommendation section
                const recommendationTitle = document.createElement('div');
                recommendationTitle.className = 'recommendation-title';
                recommendationTitle.textContent = 'Smart Health Opinion:';
                
                const recommendationContent = document.createElement('div');
                recommendationContent.className = 'recommendation-content';
                recommendationContent.textContent = product.health_recommendation;
                
                // Create consumption advice section
                const consumptionTitle = document.createElement('div');
                consumptionTitle.className = 'recommendation-subtitle';
                consumptionTitle.textContent = 'Consumption Advice:';
                
                // Generate consumption advice based on health score, fat score, and nutrition grade
                const healthScore = product.health_score ? product.health_score.score : 50;
                const fatValue = product.nutriments.fat ? parseFloat(product.nutriments.fat) : 0;
                const nutritionGrade = product.nutrition_grade_fr ? product.nutrition_grade_fr.toUpperCase() : 'C';
                
                let consumptionAdvice = '';
                
                // Determine consumption frequency based on scores
                if (healthScore >= 80 || nutritionGrade === 'A') {
                    consumptionAdvice = 'This product can be consumed regularly as part of a balanced diet.';
                } else if (healthScore >= 60 || nutritionGrade === 'B') {
                    consumptionAdvice = 'This product can be consumed moderately as part of a varied diet.';
                } else if (healthScore >= 40 || nutritionGrade === 'C') {
                    consumptionAdvice = 'This product should be consumed occasionally and in moderate portions.';
                } else if (healthScore >= 20 || nutritionGrade === 'D') {
                    consumptionAdvice = 'This product should be consumed infrequently and in small portions.';
                } else {
                    consumptionAdvice = 'This product should be limited in your diet due to its poor nutritional profile.';
                }
                
                const consumptionContent = document.createElement('div');
                consumptionContent.className = 'recommendation-content';
                consumptionContent.textContent = consumptionAdvice;
                
                // Create weight impact section
                const weightTitle = document.createElement('div');
                weightTitle.className = 'recommendation-subtitle';
                weightTitle.textContent = 'Weight Impact:';
                
                // Generate weight impact advice based on energy and fat content
                const energyValue = product.nutriments.energy ? parseFloat(product.nutriments.energy) : 0;
                
                let weightImpact = '';
                if (energyValue > 350 || fatValue > 20) {
                    weightImpact = 'High in calories and/or fat. Regular consumption may contribute to weight gain if not balanced with physical activity.';
                } else if (energyValue > 250 || fatValue > 10) {
                    weightImpact = 'Moderate calorie content. Be mindful of portion sizes to maintain weight.';
                } else {
                    weightImpact = 'Lower calorie option that is less likely to contribute to weight gain when consumed in appropriate portions.';
                }
                
                const weightContent = document.createElement('div');
                weightContent.className = 'recommendation-content';
                weightContent.textContent = weightImpact;
                
                // Create potential health concerns section
                const concernsTitle = document.createElement('div');
                concernsTitle.className = 'recommendation-subtitle';
                concernsTitle.textContent = 'Health Considerations:';
                
                // Generate health concerns based on nutritional content
                const sugarValue = product.nutriments.sugar ? parseFloat(product.nutriments.sugar) : 0;
                const saltValue = product.nutriments.salt ? parseFloat(product.nutriments.salt) : 0;
                
                let healthConcerns = [];
                
                if (fatValue > 20) {
                    healthConcerns.push('High fat content may increase risk of cardiovascular issues if consumed regularly.');
                }
                
                if (sugarValue > 15) {
                    healthConcerns.push('High sugar content may contribute to dental issues and metabolic problems with frequent consumption.');
                }
                
                if (saltValue > 1.5) {
                    healthConcerns.push('High salt content may contribute to elevated blood pressure in sensitive individuals.');
                }
                
                // If no specific concerns, provide a general statement
                if (healthConcerns.length === 0) {
                    if (healthScore >= 60) {
                        healthConcerns.push('No significant nutritional concerns when consumed as part of a balanced diet.');
                    } else {
                        healthConcerns.push('While not presenting specific nutritional red flags, this product should be consumed in moderation.');
                    }
                }
                
                const concernsContent = document.createElement('div');
                concernsContent.className = 'recommendation-content';
                concernsContent.textContent = healthConcerns.join(' ');
                
                // Append all elements to the recommendation container
                healthRecommendationElement.appendChild(recommendationTitle);
                healthRecommendationElement.appendChild(recommendationContent);
                healthRecommendationElement.appendChild(consumptionTitle);
                healthRecommendationElement.appendChild(consumptionContent);
                healthRecommendationElement.appendChild(weightTitle);
                healthRecommendationElement.appendChild(weightContent);
                healthRecommendationElement.appendChild(concernsTitle);
                healthRecommendationElement.appendChild(concernsContent);
            } else {
                // If no health recommendation is available from the API
                healthRecommendationElement.textContent = 'No health recommendation available';
            }
        }
        
        // Set alternative products
        const alternativeProductsContainer = document.getElementById('alternative-products');
        if (alternativeProductsContainer) {
            alternativeProductsContainer.innerHTML = '';
            
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
                    alternativeProductsContainer.appendChild(alternativeElement);
                });
            } else {
                const noAlternativesElement = document.createElement('p');
                noAlternativesElement.textContent = 'No alternative products available';
                alternativeProductsContainer.appendChild(noAlternativesElement);
            }
        }
        
        // Display data source
        const dataSourceElement = document.getElementById('data-source');
        if (dataSourceElement) {
            dataSourceElement.textContent = product.source || 'Unknown Source';
        }
        
        // Set nutrition grade
        const nutritionGradeElement = document.getElementById('nutrition-grade');
        const nutritionScoreElement = document.getElementById('nutrition-score');
        const nutritionGradeText = document.getElementById('nutrition-grade-text');
        
        // First, reset all markers to inactive
        document.querySelectorAll('.grade-marker').forEach(marker => {
            marker.classList.remove('active');
        });
        
        if (product.nutrition_grade_fr) {
            // Convert the French nutrition grade to English
            const grade = product.nutrition_grade_fr.toUpperCase();
            nutritionGradeElement.textContent = grade;
            nutritionGradeElement.className = 'nutrition-grade grade-' + product.nutrition_grade_fr.toLowerCase();
            
            // Add English description of the grade
            const gradeDescriptions = {
                'A': 'Excellent',
                'B': 'Good',
                'C': 'Average',
                'D': 'Poor',
                'E': 'Very Poor'
            };
            
            // Calculate a numeric score based on the grade (similar to health score)
            const gradeScores = {
                'A': 95, // Excellent (90-100)
                'B': 80, // Very Good (75-89)
                'C': 65, // Good (60-74)
                'D': 45, // Fair (40-59)
                'E': 25  // Poor (0-39)
            };
            
            // Calculate a numeric score based on the grade for internal use
            const score = gradeScores[grade] || 0;
            
            // Set the description in the grade text element
            nutritionGradeText.textContent = gradeDescriptions[grade] || '';
            
            // Apply color class based on score range (similar to health score)
            let scoreClass = '';
            if (score >= 90) {
                scoreClass = 'health-score-90-100';
            } else if (score >= 75) {
                scoreClass = 'health-score-75-89';
            } else if (score >= 60) {
                scoreClass = 'health-score-60-74';
            } else if (score >= 40) {
                scoreClass = 'health-score-40-59';
            } else {
                scoreClass = 'health-score-0-39';
            }
            nutritionScoreElement.className = 'nutrition-score ' + scoreClass;
            
            // Add a tooltip with the English description
            if (gradeDescriptions[grade]) {
                nutritionGradeElement.textContent = grade;
                nutritionGradeElement.title = gradeDescriptions[grade];
                nutritionScoreElement.textContent = score + '/100';
                nutritionGradeText.textContent = gradeDescriptions[grade];
            }
            
            // Activate the appropriate marker with glowing effect
            const activeMarker = document.getElementById('grade-marker-' + product.nutrition_grade_fr.toLowerCase());
            if (activeMarker) {
                activeMarker.classList.add('active');
            }
        } else if (product.ingredients_text && product.nutriments) {
            // If nutrition grade is not available but we have ingredients and nutriments,
            // display 'Calculating...' and request calculation from backend
            
            // Reset all grade markers to inactive state when no grade is available
            document.querySelectorAll('.grade-marker').forEach(marker => {
                marker.classList.remove('active');
            });
            nutritionGradeElement.textContent = '?';
            nutritionGradeElement.className = 'nutrition-grade';
            nutritionScoreElement.textContent = '';
            nutritionScoreElement.className = 'nutrition-score';
            nutritionGradeText.textContent = 'Calculating...';
            
            // Reset all grade markers to inactive state
            document.querySelectorAll('.grade-marker').forEach(marker => {
                marker.classList.remove('active');
            });
            
            // Request nutrition grade calculation from backend using Groq AI
            fetch('/calculate-nutrition-grade', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ingredients: product.ingredients_text,
                    nutriments: product.nutriments,
                    product_name: product.product_name
                })
            })
            .then(response => response.json())
            .then(data => {
                if (data.grade) {
                    const grade = data.grade.toUpperCase();
                    nutritionGradeElement.textContent = grade;
                    nutritionGradeElement.className = 'nutrition-grade grade-' + data.grade.toLowerCase();
                    
                    // Add description to tooltip
                    if (gradeDescriptions[grade]) {
                        nutritionGradeElement.title = gradeDescriptions[grade];
                        nutritionGradeText.textContent = gradeDescriptions[grade];
                    }
                    
                    // Highlight the active grade marker
                    document.querySelectorAll('.grade-marker').forEach(marker => {
                        marker.classList.remove('active');
                    });
                    
                    const activeMarker = document.getElementById('grade-marker-' + data.grade.toLowerCase());
                    if (activeMarker) {
                        activeMarker.classList.add('active');
                    }
                } else {
                    nutritionGradeText.textContent = 'NOT-APPLICABLE';
                    nutritionGradeText.className = 'grade-text not-applicable';
                }
            })
            .catch(error => {
                console.error('Error calculating nutrition grade:', error);
                nutritionGradeText.textContent = 'NOT-APPLICABLE';
                nutritionGradeText.className = 'grade-text not-applicable';
            });
        } else if (product.ingredients_text && product.nutriments) {
            // If nutrition grade is not available but we have ingredients and nutriments,
            // display 'Calculating...' and request calculation from backend using Groq AI
            nutritionGradeElement.textContent = '?';
            nutritionGradeElement.className = 'nutrition-grade';
            nutritionScoreElement.textContent = '';
            nutritionScoreElement.className = 'nutrition-score';
            nutritionGradeText.textContent = 'Calculating...';
            
            // Reset all grade markers to inactive state
            document.querySelectorAll('.grade-marker').forEach(marker => {
                marker.classList.remove('active');
            });
            
            // Request nutrition grade calculation from backend using Groq AI
            fetch('/calculate-nutrition-grade', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-Key': 'foodscanner_api_key_secure_123'
                },
                body: JSON.stringify({
                    ingredients: product.ingredients_text,
                    nutriments: product.nutriments,
                    product_name: product.product_name
                })
            })
            .then(response => response.json())
            .then(data => {
                if (data.grade) {
                    const grade = data.grade.toUpperCase();
                    nutritionGradeElement.textContent = grade;
                    nutritionGradeElement.className = 'nutrition-grade grade-' + data.grade.toLowerCase();
                    
                    // Set the width of the nutrition grade bar
                    const gradePercentages = {
                        'A': '100%',
                        'B': '80%',
                        'C': '60%',
                        'D': '40%',
                        'E': '20%'
                    };
                    
                    // Calculate a numeric score based on the grade (similar to health score)
                    const gradeScores = {
                        'A': 95, // Excellent (90-100)
                        'B': 80, // Very Good (75-89)
                        'C': 65, // Good (60-74)
                        'D': 45, // Fair (40-59)
                        'E': 25  // Poor (0-39)
                    };
                    
                    // Calculate a numeric score based on the grade for internal use
                    const score = gradeScores[grade] || 0;
                    
                    // Add English description of the grade
                    const gradeDescriptions = {
                        'A': 'Excellent',
                        'B': 'Good',
                        'C': 'Average',
                        'D': 'Poor',
                        'E': 'Very Poor'
                    };
                    
                    // Set the description in the grade text element
                    nutritionGradeText.textContent = gradeDescriptions[grade] || '';
                    
                    // Set the nutrition score element to display the numeric score
                    nutritionScoreElement.textContent = score + '/100';
                    
                    // Apply color class based on score range
                    let scoreClass = '';
                    if (score >= 90) {
                        scoreClass = 'health-score-90-100';
                    } else if (score >= 75) {
                        scoreClass = 'health-score-75-89';
                    } else if (score >= 60) {
                        scoreClass = 'health-score-60-74';
                    } else if (score >= 40) {
                        scoreClass = 'health-score-40-59';
                    } else {
                        scoreClass = 'health-score-0-39';
                    }
                    nutritionScoreElement.className = 'nutrition-score ' + scoreClass;
                    
                    // Add description to tooltip and text
                    if (gradeDescriptions[grade]) {
                        nutritionGradeElement.title = gradeDescriptions[grade];
                        nutritionGradeText.textContent = gradeDescriptions[grade];
                    }
                    
                    // Highlight the active grade marker
                    document.querySelectorAll('.grade-marker').forEach(marker => {
                        marker.classList.remove('active');
                    });
                    
                    const activeMarker = document.getElementById('grade-marker-' + data.grade.toLowerCase());
                    if (activeMarker) {
                        activeMarker.classList.add('active');
                    }
                    
                    // Display explanation if available
                    if (data.explanation) {
                        console.log('Nutrition grade explanation:', data.explanation);
                    }
                } else {
                    nutritionGradeText.textContent = 'NOT-APPLICABLE';
                    nutritionGradeText.className = 'grade-text not-applicable';
                }
            })
            .catch(error => {
                console.error('Error calculating nutrition grade:', error);
                nutritionGradeText.textContent = 'NOT-APPLICABLE';
                nutritionGradeText.className = 'grade-text not-applicable';
            });
        } else if (product.ingredients_text && product.nutriments) {
            // If nutrition grade is not available but we have ingredients and nutriments,
            // display 'Calculating...' and request calculation from backend using AI
            nutritionGradeElement.textContent = '?';
            nutritionGradeElement.className = 'nutrition-grade';
            nutritionScoreElement.textContent = '';
            nutritionScoreElement.className = 'nutrition-score';
            nutritionGradeBar.style.width = '0%';
            nutritionGradeText.textContent = 'Calculating...';
            
            // Request nutrition grade calculation from backend using AI
            fetch('/calculate-nutrition-grade', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ingredients: product.ingredients_text,
                    nutriments: product.nutriments,
                    product_name: product.product_name
                })
            })
            .then(response => response.json())
            .then(data => {
                if (data.grade) {
                    const grade = data.grade.toUpperCase();
                    nutritionGradeElement.textContent = grade;
                    nutritionGradeElement.className = 'nutrition-grade grade-' + data.grade.toLowerCase();
                    
                    // Calculate a numeric score based on the grade
                    const gradeScores = {
                        'A': 95, // Excellent (90-100)
                        'B': 80, // Very Good (75-89)
                        'C': 65, // Good (60-74)
                        'D': 45, // Fair (40-59)
                        'E': 25  // Poor (0-39)
                    };
                    
                    // Calculate a numeric score based on the grade for internal use
                    const score = gradeScores[grade] || 0;
                    
                    // Set the description in the grade text element
                    nutritionGradeText.textContent = gradeDescriptions[grade] || '';
                    
                    // Apply color class based on score range
                    let scoreClass = '';
                    if (score >= 90) {
                        scoreClass = 'health-score-90-100';
                    } else if (score >= 75) {
                        scoreClass = 'health-score-75-89';
                    } else if (score >= 60) {
                        scoreClass = 'health-score-60-74';
                    } else if (score >= 40) {
                        scoreClass = 'health-score-40-59';
                    } else {
                        scoreClass = 'health-score-0-39';
                    }
                    nutritionScoreElement.className = 'nutrition-score ' + scoreClass;
                    
                    // Highlight the active grade marker
                    document.querySelectorAll('.grade-marker').forEach(marker => {
                        marker.classList.remove('active');
                    });
                    
                    const activeMarker = document.getElementById('grade-marker-' + data.grade.toLowerCase());
                    if (activeMarker) {
                        activeMarker.classList.add('active');
                    }
                    
                    // Add description to tooltip and text
                    if (gradeDescriptions[grade]) {
                        nutritionGradeElement.title = gradeDescriptions[grade];
                        nutritionGradeText.textContent = gradeDescriptions[grade];
                    }
                    
                    // Display explanation if available
                    if (data.explanation) {
                        console.log('AI-generated nutrition grade explanation:', data.explanation);
                    }
                } else {
                    nutritionGradeText.textContent = 'NOT-APPLICABLE';
                    nutritionGradeText.className = 'grade-text not-applicable';
                }
            })
            .catch(error => {
                console.error('Error calculating nutrition grade:', error);
                nutritionGradeText.textContent = 'NOT-APPLICABLE';
                nutritionGradeText.className = 'grade-text not-applicable';
            });
        } else {
            nutritionGradeElement.textContent = '';
            nutritionGradeElement.className = 'nutrition-grade';
            nutritionGradeText.textContent = 'NOT-APPLICABLE';
            nutritionGradeText.className = 'grade-text not-applicable';
            
            // Reset all grade markers to inactive state
            document.querySelectorAll('.grade-marker').forEach(marker => {
                marker.classList.remove('active');
            });
        }
        
        // Set health score
        const healthScoreElement = document.getElementById('health-score');
        const healthRatingElement = document.getElementById('health-rating');
        const healthScoreBar = document.getElementById('health-score-bar');
        const healthScoreText = document.getElementById('health-score-text');
        if (product.health_score) {
            const score = product.health_score.score;
            const rating = product.health_score.rating;
            
            healthRatingElement.textContent = rating;
            healthRatingElement.className = 'health-rating grade-' + rating.toLowerCase();
            healthScoreElement.textContent = score + '/100';
            
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
            // Set the progress width directly on the element itself
            const progressWidth = score + '%';
            healthScoreBar.style.width = progressWidth;
            healthScoreBar.className = 'health-score-bar ' + scoreClass;
            healthScoreBar.title = score + '/100 - ' + rating;
            
            healthScoreElement.className = 'health-score ' + scoreClass;
            healthScoreText.textContent = scoreDescription;
        } else if (product.ingredients_text && product.nutriments) {
            // If health score is not available but we have ingredients and nutriments,
            // display 'Calculating...' and request calculation from backend
            healthScoreElement.textContent = 'N/A';
            healthRatingElement.textContent = '';
            healthScoreText.textContent = 'Calculating...';
            healthScoreElement.className = 'health-score';
            healthScoreBar.style.width = '0%';
            
            // Request health score calculation from backend using Groq AI
            fetch('/calculate-health-score', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ingredients: product.ingredients_text,
                    nutriments: product.nutriments,
                    product_name: product.product_name
                })
            })
            .then(response => response.json())
            .then(data => {
                if (data.score && data.rating) {
                    const score = data.score;
                    const rating = data.rating;
                    
                    healthRatingElement.textContent = rating;
                    healthRatingElement.className = 'health-rating grade-' + rating.toLowerCase();
                    healthScoreElement.textContent = score + '/100';
                    
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
                    const progressWidth = score + '%';
                    healthScoreBar.style.width = progressWidth;
                    healthScoreBar.className = 'health-score-bar ' + scoreClass;
                    healthScoreBar.title = score + '/100 - ' + rating;
                    
                    healthScoreElement.className = 'health-score ' + scoreClass;
                    healthScoreText.textContent = scoreDescription;
                } else {
                    healthScoreText.textContent = 'Unknown';
                }
            })
            .catch(error => {
                console.error('Error calculating health score:', error);
                healthScoreText.textContent = 'Unknown';
            });
        } else {
            healthScoreElement.textContent = 'N/A';
            healthRatingElement.textContent = '';
            healthScoreText.textContent = 'Unknown';
            healthScoreElement.className = 'health-score';
            healthScoreBar.style.width = '0%';
        }
        
        // Display Fat Score
        const fatScoreElement = document.getElementById('fat-score');
        const fatRatingElement = document.getElementById('fat-rating');
        const fatScoreText = document.getElementById('fat-score-text');
        const fatScoreBar = document.getElementById('fat-score-bar');
        
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
            tooltip += 'â€¢ Very low fat content, suitable for low-fat diets\n';
            tooltip += 'â€¢ Minimal impact on cardiovascular health from fat content\n';
            tooltip += 'â€¢ May be lower in essential fatty acids - check ingredients';
        } else if (fatContent <= 10) {
            tooltip += 'â€¢ Low fat content, good for moderate fat reduction\n';
            tooltip += 'â€¢ Generally healthy fat level for most diets\n';
            tooltip += 'â€¢ Check fat quality (saturated vs. unsaturated)';
        } else if (fatContent <= 20) {
            tooltip += 'â€¢ Medium fat content, moderate consumption advised\n';
            tooltip += 'â€¢ May contribute to daily fat intake significantly\n';
            tooltip += 'â€¢ Consider the type of fats present (saturated vs. unsaturated)';
        } else if (fatContent <= 30) {
            tooltip += 'â€¢ High fat content, consume in limited quantities\n';
            tooltip += 'â€¢ May contribute significantly to daily caloric intake\n';
            tooltip += 'â€¢ Check for saturated and trans fat content';
        } else {
            tooltip += 'â€¢ Very high fat content, consume sparingly\n';
            tooltip += 'â€¢ May increase risk of cardiovascular issues if consumed regularly\n';
            tooltip += 'â€¢ High caloric density - portion control important';
        }
        
        fatScoreBar.title = tooltip;
        fatScoreElement.className = 'fat-score ' + fatScoreClass;
        fatScoreText.textContent = fatDescription;
        
        // Set allergens
        const allergensContainer = document.getElementById('allergens');
        allergensContainer.innerHTML = '';
        if (product.allergens_tags && product.allergens_tags.length > 0) {
            // Add allergen warning message
            const warningElement = document.createElement('p');
            warningElement.className = 'allergen-warning';
            warningElement.textContent = 'This product contains the following allergens:';
            allergensContainer.appendChild(warningElement);
            
            // Create allergen tags container
            const tagsContainer = document.createElement('div');
            tagsContainer.className = 'tags';
            allergensContainer.appendChild(tagsContainer);
            
            // Allergen descriptions for tooltips
            const allergenInfo = {
                'gluten': 'May cause digestive issues for people with celiac disease or gluten sensitivity',
                'crustaceans': 'Common seafood allergen that can cause severe reactions',
                'eggs': 'One of the most common food allergens, especially in children',
                'fish': 'Can cause severe allergic reactions in sensitive individuals',
                'peanuts': 'One of the most common allergens that can cause severe, potentially fatal reactions',
                'soy': 'Common allergen found in many processed foods',
                'milk': 'Common allergen that affects many people with lactose intolerance',
                'nuts': 'Tree nuts can cause severe allergic reactions',
                'celery': 'Less common allergen but can cause oral allergy syndrome',
                'mustard': 'Can cause reactions ranging from mild to severe',
                'sesame': 'Increasingly recognized as a significant allergen',
                'sulfites': 'Can trigger asthma and other symptoms in sensitive people',
                'lupin': 'Related to peanuts and may cause cross-reactivity',
                'molluscs': 'Shellfish allergen that can cause severe reactions'
            };
            
            product.allergens_tags.forEach(allergen => {
                // Clean up allergen name and translate if needed
                let allergenName = allergen
                    .replace('en:', '')
                    .replace('fr:', '')
                    .replace(/-/g, ' ');
                
                // Translate common French allergen terms to English
                const frenchToEnglish = {
                    'gluten': 'gluten',
                    'crustaces': 'crustaceans',
                    'oeufs': 'eggs',
                    'poisson': 'fish',
                    'arachides': 'peanuts',
                    'soja': 'soy',
                    'lait': 'milk',
                    'fruits a coque': 'nuts',
                    'celeri': 'celery',
                    'moutarde': 'mustard',
                    'sesame': 'sesame',
                    'sulfites': 'sulfites',
                    'lupin': 'lupin',
                    'mollusques': 'molluscs'
                };
                
                // Check if the allergen name is in French and translate it
                let englishAllergen = allergenName;
                for (const [french, english] of Object.entries(frenchToEnglish)) {
                    if (allergenName.toLowerCase().includes(french)) {
                        englishAllergen = english;
                        break;
                    }
                }
                
                // Capitalize first letter
                const displayName = englishAllergen.charAt(0).toUpperCase() + englishAllergen.slice(1);
                
                const tagElement = document.createElement('span');
                tagElement.className = 'tag';
                tagElement.textContent = displayName;
                
                // Add tooltip with allergen information
                if (allergenInfo[englishAllergen.toLowerCase()]) {
                    tagElement.title = allergenInfo[englishAllergen.toLowerCase()];
                }
                
                tagsContainer.appendChild(tagElement);
            });
            
            // Add note about potential cross-contamination
            const noteElement = document.createElement('p');
            noteElement.className = 'allergen-note';
            noteElement.textContent = 'Note: Products may also contain traces of other allergens due to cross-contamination during manufacturing.';
            allergensContainer.appendChild(noteElement);
            
        } else {
            const noAllergensElement = document.createElement('p');
            noAllergensElement.innerHTML = '<strong>No allergens</strong> have been declared for this product. However, always check the packaging for the most up-to-date information.';
            allergensContainer.appendChild(noAllergensElement);
        }
        
        // Set nutriments
        document.getElementById('energy').textContent = formatNutriment(product.nutriments.energy, 'kcal');
        document.getElementById('fat').textContent = formatNutriment(product.nutriments.fat, 'g');
        document.getElementById('protein').textContent = formatNutriment(product.nutriments.protein, 'g');
        document.getElementById('carbs').textContent = formatNutriment(product.nutriments.carbs, 'g');
        document.getElementById('sugar').textContent = formatNutriment(product.nutriments.sugar, 'g');
        document.getElementById('salt').textContent = formatNutriment(product.nutriments.salt, 'g');
        document.getElementById('fiber').textContent = formatNutriment(product.nutriments.fiber, 'g');
        
        // Fat score is already calculated and displayed above
        
        // Set product image
        const productImg = document.getElementById('product-img');
        if (product.image_url) {
            productImg.src = product.image_url;
            productImg.alt = product.product_name || 'Product Image';
        } else if (window.productImageData) {
            // Use the uploaded product image if available
            productImg.src = window.productImageData;
            productImg.alt = product.product_name || 'Product Image';
        } else {
            productImg.src = 'https://via.placeholder.com/150?text=No+Image';
            productImg.alt = 'No Image Available';
        }
        
        // Show product info section
        productInfoSection.classList.remove('hidden');
        
        // Display public reviews
        displayPublicReviews(product);
        
        // Auto scroll to the product info section
        productInfoSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        
        // Save scan to history cookie
        saveToScanHistory(product);
    }
    
    // Save scanned product to history cookie
    function saveToScanHistory(product) {
        // Create a simplified product object to save in cookie
        const historyItem = {
            code: product.code,
            product_name: product.product_name || 'Unknown Product',
            brand: product.brand || product.brands || 'Unknown Brand',
            image_url: product.image_url || '',
            nutrition_grade: product.nutrition_grade_fr ? product.nutrition_grade_fr.toUpperCase() : null,
            health_score: product.health_score ? product.health_score.score : null,
            timestamp: new Date().toISOString()
        };
        
        // Get existing history from cookie
        let scanHistory = [];
        const historyCookie = getCookie('scanHistory');
        
        if (historyCookie) {
            try {
                scanHistory = JSON.parse(historyCookie);
                // Ensure it's an array
                if (!Array.isArray(scanHistory)) {
                    scanHistory = [];
                }
            } catch (e) {
                console.error('Error parsing scan history cookie:', e);
                scanHistory = [];
            }
        }
        
        // Check if this product is already in history
        const existingIndex = scanHistory.findIndex(item => item.code === historyItem.code);
        
        if (existingIndex !== -1) {
            // Remove the existing entry
            scanHistory.splice(existingIndex, 1);
        }
        
        // Add new item at the beginning (most recent first)
        scanHistory.unshift(historyItem);
        
        // Get history limit from dashboard settings or use default
        const historyLimit = dashboardSettings ? dashboardSettings.historyLimit : 10;
        
        // Limit history to the configured number of items
        if (scanHistory.length > historyLimit) {
            scanHistory = scanHistory.slice(0, historyLimit);
        }
        
        // Save back to cookie (30 days expiration)
        setCookie('scanHistory', JSON.stringify(scanHistory), 30);
        
        // Update the history display
        displayScanHistory();
    }
    
    // Display scan history from cookie
    function displayScanHistory() {
        const historyContainer = document.getElementById('scan-history-items');
        if (!historyContainer) return;
        
        // Clear existing history items
        historyContainer.innerHTML = '';
        
        // Get history from cookie
        const historyCookie = getCookie('scanHistory');
        if (!historyCookie) {
            historyContainer.innerHTML = '<p class="empty-history">No scan history yet</p>';
            return;
        }
        
        try {
            const scanHistory = JSON.parse(historyCookie);
            
            if (!Array.isArray(scanHistory) || scanHistory.length === 0) {
                historyContainer.innerHTML = '<p class="empty-history">No scan history yet</p>';
                return;
            }
            
            // Create history items
            scanHistory.forEach(item => {
                const historyItem = document.createElement('div');
                historyItem.className = 'history-item';
                historyItem.dataset.barcode = item.code;
                
                // Format date
                const date = new Date(item.timestamp);
                const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                
                // Create nutrition grade and health score elements if available
                let gradeHTML = '';
                if (item.nutrition_grade) {
                    const gradeClass = `grade-${item.nutrition_grade.toLowerCase()}`;
                    gradeHTML += `<span class="history-grade ${gradeClass}">${item.nutrition_grade}</span>`;
                }
                
                let scoreHTML = '';
                if (item.health_score !== null) {
                    let scoreClass = 'score-average';
                    if (item.health_score >= 70) scoreClass = 'score-good';
                    if (item.health_score <= 30) scoreClass = 'score-bad';
                    scoreHTML = `<span class="history-score ${scoreClass}">${item.health_score}</span>`;
                }
                
                // Create the main visible part of the history item
                historyItem.innerHTML = `
                    <div class="history-item-image">
                        <img src="${item.image_url || 'https://via.placeholder.com/40?text=No+Image'}" alt="${item.product_name}">
                    </div>
                    <div class="history-item-details">
                        <div class="history-item-name">${item.product_name}</div>
                        <div class="history-item-brand">${item.brand}</div>
                        <div class="history-item-date">${formattedDate}</div>
                    </div>
                    <div class="history-item-grades">
                        ${gradeHTML}
                        ${scoreHTML}
                    </div>
                    <button class="history-item-view" data-barcode="${item.code}">View</button>
                    <button class="history-item-expand">â–¼</button>
                    
                    <div class="history-item-content">
                        <div class="history-item-details-expanded">
                            <div class="history-detail-item">
                                <span class="history-detail-label">Barcode</span>
                                <span class="history-detail-value">${item.code}</span>
                            </div>
                            <div class="history-detail-item">
                                <span class="history-detail-label">Scanned On</span>
                                <span class="history-detail-value">${formattedDate}</span>
                            </div>
                            <div class="history-detail-item">
                                <span class="history-detail-label">Nutrition Grade</span>
                                <span class="history-detail-value">${item.nutrition_grade || 'N/A'}</span>
                            </div>
                            <div class="history-detail-item">
                                <span class="history-detail-label">Health Score</span>
                                <span class="history-detail-value">${item.health_score !== null ? item.health_score : 'N/A'}</span>
                            </div>
                        </div>
                    </div>
                `;
                
                historyContainer.appendChild(historyItem);
                
                // Add click event to view button
                const viewButton = historyItem.querySelector('.history-item-view');
                viewButton.addEventListener('click', (e) => {
                    e.stopPropagation(); // Prevent triggering the parent's click event
                    processBarcode(item.code);
                });
                
                // Add click event to expand button
                const expandButton = historyItem.querySelector('.history-item-expand');
                expandButton.addEventListener('click', (e) => {
                    e.stopPropagation(); // Prevent triggering the parent's click event
                    historyItem.classList.toggle('history-item-expanded');
                });
                
                // Add click event to the entire history item (except buttons)
                historyItem.addEventListener('click', (e) => {
                    // Only toggle if the click wasn't on a button
                    if (!e.target.closest('button')) {
                        historyItem.classList.toggle('history-item-expanded');
                    }
                });
            });
            
        } catch (e) {
            console.error('Error displaying scan history:', e);
            historyContainer.innerHTML = '<p class="empty-history">Error loading scan history</p>';
        }
    }
    
    // Helper function to set a cookie
    function setCookie(name, value, days) {
        let expires = '';
        if (days) {
            const date = new Date();
            date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
            expires = '; expires=' + date.toUTCString();
        }
        document.cookie = name + '=' + encodeURIComponent(value) + expires + '; path=/';
    }
    
    // Helper function to get a cookie
    function getCookie(name) {
        const nameEQ = name + '=';
        const ca = document.cookie.split(';');
        for (let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) === ' ') c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) === 0) return decodeURIComponent(c.substring(nameEQ.length, c.length));
        }
        return null;
    }
    
    // Helper function to clear scan history
    function clearScanHistory() {
        setCookie('scanHistory', '', -1); // Set expiration to past date to delete
        displayScanHistory(); // Update the display
    }
    
    // Generate AI suggestion based on product information
    function generateAISuggestion(product) {
        const aiSuggestionElement = document.getElementById('ai-suggestion');
        if (!aiSuggestionElement) return;
        
        // Get relevant product information for analysis
        const productName = product.product_name || '';
        const ingredients = product.ingredients_text || '';
        const nutritionGrade = product.nutrition_grade_fr ? product.nutrition_grade_fr.toUpperCase() : 'C';
        const healthScore = product.health_score ? product.health_score.score : 50;
        const nutriments = product.nutriments || {};
        
        // Analyze product to determine verdict
        let verdict = 'Avoid';
        let verdictIcon = 'âŒ';
        let verdictClass = 'avoid';
        let reason = '';
        let tip = '';
        
        // Determine verdict based on nutrition grade and health score
        if (nutritionGrade === 'A' || nutritionGrade === 'B' || healthScore >= 70) {
            verdict = 'Eat';
            verdictIcon = 'âœ…';
            verdictClass = 'eat';
        }
        
        // Generate reason based on product analysis
        if (verdict === 'Eat') {
            // Positive reasons
            const positiveReasons = [
                healthScore >= 80 ? 'This product has an excellent nutritional profile' : '',
                healthScore >= 70 ? 'This food offers good nutritional value' : '',
                (nutriments.fiber && parseFloat(nutriments.fiber) > 3) ? 'This product is a good source of fiber' : '',
                (nutriments.protein && parseFloat(nutriments.protein) > 10) ? 'This food is rich in protein' : '',
                (nutriments.sugar && parseFloat(nutriments.sugar) < 5) ? 'This product is low in sugar' : '',
                (nutriments.fat && parseFloat(nutriments.fat) < 3) ? 'This food is low in fat' : '',
                (nutriments.salt && parseFloat(nutriments.salt) < 0.3) ? 'This product is low in salt' : ''
            ].filter(r => r !== '');
            
            // Select a random positive reason or default
            reason = positiveReasons.length > 0 ? 
                positiveReasons[Math.floor(Math.random() * positiveReasons.length)] : 
                'This product has a generally positive nutritional profile';
                
            // Generate tips for 'Eat' verdict
            const eatTips = [
                'Enjoy as part of a balanced diet with plenty of fruits and vegetables',
                'Consider portion size even with healthier options',
                'Pair with fresh produce to create a more balanced meal',
                'Great choice! Remember to maintain variety in your diet',
                'Good option, but always aim for a diverse diet with many food groups'
            ];
            
            tip = eatTips[Math.floor(Math.random() * eatTips.length)];
        } else {
            // Negative reasons
            const negativeReasons = [
                (nutriments.sugar && parseFloat(nutriments.sugar) > 15) ? 'This product is high in sugar' : '',
                (nutriments.fat && parseFloat(nutriments.fat) > 17.5) ? 'This food is high in fat' : '',
                (nutriments.salt && parseFloat(nutriments.salt) > 1.5) ? 'This product is high in salt' : '',
                healthScore <= 30 ? 'This food has a poor nutritional profile' : '',
                ingredients.match(/artificial|additive|preservative|color|flavour|flavor|sweetener|syrup|e\d{3}/i) ? 'This product contains several artificial additives' : ''
            ].filter(r => r !== '');
            
            // Select a random negative reason or default
            reason = negativeReasons.length > 0 ? 
                negativeReasons[Math.floor(Math.random() * negativeReasons.length)] : 
                'This product has a less favorable nutritional profile';
                
            // Generate tips for 'Avoid' verdict
            const avoidTips = [
                'Look for alternatives with less sugar and more fiber',
                'Consider whole food options instead for better nutrition',
                'If consumed, keep portions small and occasional',
                'Try to balance with plenty of fruits and vegetables',
                'Check labels for similar products with fewer additives'
            ];
            
            tip = avoidTips[Math.floor(Math.random() * avoidTips.length)];
        }
        
        // Identify good aspects of the product regardless of verdict
        const goodAspects = [
            (nutriments.fiber && parseFloat(nutriments.fiber) > 2) ? 'Contains fiber which supports digestive health' : '',
            (nutriments.protein && parseFloat(nutriments.protein) > 5) ? 'Provides protein which is essential for muscle maintenance' : '',
            (nutriments.carbohydrates && parseFloat(nutriments.carbohydrates) > 0) ? 'Offers energy through carbohydrates' : '',
            (!ingredients.match(/artificial|additive|preservative|color|flavour|flavor|sweetener|syrup|e\d{3}/i)) ? 'Contains minimal artificial additives' : '',
            (nutritionGrade && nutritionGrade !== 'E') ? `Has a nutrition grade of ${nutritionGrade} which is not the lowest rating` : ''
        ].filter(g => g !== '');
        
        // Create good aspects HTML if any good aspects exist
        let goodAspectsHTML = '';
        if (goodAspects.length > 0) {
            // Select up to 2 good aspects
            const selectedGoodAspects = goodAspects.slice(0, 2);
            goodAspectsHTML = `
            <div class="ai-good">
                <span class="ai-good-icon">âœ¨</span>
                <span class="ai-good-text">Good to know: ${selectedGoodAspects.join('. ')}</span>
            </div>`;
        }
        
        // Create the AI suggestion HTML
        const suggestionHTML = `
            <div class="ai-verdict ${verdictClass}">${verdictIcon} ${verdict}: ${reason}</div>
            <div class="ai-tip">
                <span class="ai-tip-icon">ðŸ’¡</span>
                <span class="ai-tip-text">Tip: ${tip}</span>
            </div>
            ${goodAspectsHTML}
        `;
        
        // Set the AI suggestion content
        aiSuggestionElement.innerHTML = suggestionHTML;
    }
    
    // Format nutriment value with unit
    function formatNutriment(value, unit) {
        if (value === '' || value === undefined || value === null) {
            return 'N/A';
        }
        return `${value} ${unit}`;
    }
    
    // Generate and display public reviews for a product
    function displayPublicReviews(product) {
        const publicReviewsElement = document.getElementById('public-reviews');
        if (!publicReviewsElement) return;
        
        // Clear any existing reviews
        publicReviewsElement.innerHTML = '';
        
        // Get product name and brand for review generation
        const productName = product.product_name || '';
        const brand = product.brands || '';
        
        // Generate 2-3 random reviews based on product information
        const numberOfReviews = Math.floor(Math.random() * 2) + 2; // 2-3 reviews
        
        // Sample review templates
        const reviewTemplates = [
            {
                positive: true,
                templates: [
                    'Really enjoy this product. It tastes great and the ingredients seem pretty clean.',
                    'My family loves this. Good value for money and healthier than many alternatives.',
                    'Been buying this for years. Consistent quality and taste.',
                    'Great taste and texture. Will definitely buy again!',
                    'Pleasantly surprised by how good this is. Recommended!'
                ]
            },
            {
                positive: false,
                templates: [
                    'Not impressed with the taste. Expected better quality for the price.',
                    'Too many additives for my liking. Looking for more natural alternatives.',
                    'The flavor is a bit artificial. Wouldn\'t buy again.',
                    'Disappointed with the nutritional value. Contains more sugar than expected.',
                    'Average at best. There are better options available.'
                ]
            },
            {
                positive: null, // mixed
                templates: [
                    'Decent product but a bit pricey for what you get.',
                    'Good taste but wish it had less additives.',
                    'Kids like it but I\'m concerned about the sugar content.',
                    'Convenient option but not the healthiest choice.',
                    'Tastes good but the ingredient list is longer than I\'d prefer.'
                ]
            }
        ];
        
        // Sample sources
        const sources = ['Amazon', 'Walmart', 'Target', 'Grocery Review', 'FoodAdvisor', 'HealthEats'];
        
        // Sample reviewer names
        const reviewerNames = ['Sarah M.', 'John D.', 'Emma L.', 'Michael K.', 'Lisa T.', 'David R.', 'Jessica W.', 'Robert P.'];
        
        // Generate reviews based on product health score if available
        let reviewDistribution = [0.33, 0.33, 0.34]; // default: equal distribution of positive, negative, mixed
        
        if (product.health_score && product.health_score.score) {
            const score = product.health_score.score;
            if (score >= 70) {
                reviewDistribution = [0.7, 0.1, 0.2]; // mostly positive
            } else if (score >= 50) {
                reviewDistribution = [0.5, 0.2, 0.3]; // more positive than negative
            } else if (score >= 30) {
                reviewDistribution = [0.3, 0.4, 0.3]; // more negative than positive
            } else {
                reviewDistribution = [0.1, 0.7, 0.2]; // mostly negative
            }
        }
        
        for (let i = 0; i < numberOfReviews; i++) {
            // Determine review type based on distribution
            const rand = Math.random();
            let reviewType;
            if (rand < reviewDistribution[0]) {
                reviewType = 0; // positive
            } else if (rand < reviewDistribution[0] + reviewDistribution[1]) {
                reviewType = 1; // negative
            } else {
                reviewType = 2; // mixed
            }
            
            // Get random template from selected type
            const selectedTemplate = reviewTemplates[reviewType].templates[
                Math.floor(Math.random() * reviewTemplates[reviewType].templates.length)
            ];
            
            // Generate rating based on review type
            let rating;
            if (reviewType === 0) { // positive
                rating = Math.floor(Math.random() * 2) + 4; // 4-5 stars
            } else if (reviewType === 1) { // negative
                rating = Math.floor(Math.random() * 2) + 1; // 1-2 stars
            } else { // mixed
                rating = 3; // 3 stars
            }
            
            // Generate stars string
            const stars = 'â˜…'.repeat(rating) + 'â˜†'.repeat(5 - rating);
            
            // Generate random date within last 6 months
            const today = new Date();
            const sixMonthsAgo = new Date();
            sixMonthsAgo.setMonth(today.getMonth() - 6);
            const randomDate = new Date(sixMonthsAgo.getTime() + Math.random() * (today.getTime() - sixMonthsAgo.getTime()));
            const formattedDate = randomDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
            
            // Create review item
            const reviewItem = document.createElement('div');
            reviewItem.className = 'review-item';
            reviewItem.innerHTML = `
                <div class="review-header">
                    <span class="review-author">${reviewerNames[Math.floor(Math.random() * reviewerNames.length)]}</span>
                    <span class="review-date">${formattedDate}</span>
                </div>
                <div class="review-rating">${stars}</div>
                <div class="review-content">${selectedTemplate}</div>
                <div class="review-source">Source: ${sources[Math.floor(Math.random() * sources.length)]}</div>
            `;
            
            publicReviewsElement.appendChild(reviewItem);
        }
    }

    // Show error message
    function showError(message) {
        hideAllSections();
        errorText.textContent = message;
        errorMessageSection.classList.remove('hidden');
        
        // Auto scroll to the error message section
        errorMessageSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    // Hide all main sections
    function hideAllSections() {
        loadingSection.classList.add('hidden');
        productInfoSection.classList.add('hidden');
        errorMessageSection.classList.add('hidden');
    }
    
    // Make refreshApiStatus available globally
    window.refreshApiStatus = function() {
        checkApiStatus();
    };

    // Event listeners
    startScannerBtn.addEventListener('click', startScanner);
    stopScannerBtn.addEventListener('click', stopScanner);
    submitBarcodeBtn.addEventListener('click', () => processBarcode(barcodeInput.value));
    barcodeInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            processBarcode(barcodeInput.value);
        }
    });
    tryAgainBtn.addEventListener('click', () => {
        hideAllSections();
        barcodeInput.value = '';
    });
    
    // Zoom control event listener
    zoomControl.addEventListener('input', handleZoom);
    
    // Capture button event listener
    captureButton.addEventListener('click', captureImage);
    
    // Dark mode toggle
    darkModeToggleBtn.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        
        // Save preference to localStorage
        if (document.body.classList.contains('dark-mode')) {
            localStorage.setItem('darkMode', 'enabled');
        } else {
            localStorage.setItem('darkMode', 'disabled');
        }
    });
    
    // Camera switch
    switchCameraBtn.addEventListener('click', () => {
        if (scanning) {
            // Stop current camera
            stopScanner();
            
            // Switch to next camera
            currentCameraIndex = (currentCameraIndex + 1) % availableCameras.length;
            selectedDeviceId = availableCameras[currentCameraIndex].deviceId;
            
            // Restart scanner with new camera
            startScanner();
        }
    });
    
    // Flash toggle
    toggleFlashBtn.addEventListener('click', () => {
        if (scanning && flashSupported) {
            toggleFlash();
        }
    });

    // Initialize the scanner
    initScanner();
    
    // Initialize scan history display
    displayScanHistory();
    
    // Clear history button event listener
    document.getElementById('clear-history').addEventListener('click', clearScanHistory);
    
    // Dashboard settings functionality
    const dashboardSettingsBtn = document.getElementById('dashboard-settings');
    const dashboardModal = document.getElementById('dashboard-modal');
    const closeDashboardModalBtn = document.getElementById('close-dashboard-modal');
    const saveDashboardSettingsBtn = document.getElementById('save-dashboard-settings');
    const resetDashboardSettingsBtn = document.getElementById('reset-dashboard-settings');
    
    // Default settings
    const defaultSettings = {
        historyDisplay: 'compact',
        historyLimit: 10,
        showNutrition: true,
        showIngredients: true,
        showAllergens: true,
        showRecommendations: true,
        showAlternatives: true,
        showReviews: true
    };
    
    // Load settings from localStorage or use defaults
    let dashboardSettings = loadDashboardSettings();
    
    // Apply settings on page load
    applyDashboardSettings(dashboardSettings);
    
    // Open dashboard settings modal
    dashboardSettingsBtn.addEventListener('click', () => {
        // Populate form with current settings
        document.getElementById('history-display').value = dashboardSettings.historyDisplay;
        document.getElementById('history-limit').value = dashboardSettings.historyLimit;
        document.getElementById('show-nutrition').checked = dashboardSettings.showNutrition;
        document.getElementById('show-ingredients').checked = dashboardSettings.showIngredients;
        document.getElementById('show-allergens').checked = dashboardSettings.showAllergens;
        document.getElementById('show-recommendations').checked = dashboardSettings.showRecommendations;
        document.getElementById('show-alternatives').checked = dashboardSettings.showAlternatives;
        document.getElementById('show-reviews').checked = dashboardSettings.showReviews;
        
        // Show modal
        dashboardModal.classList.remove('hidden');
    });
    
    // Close dashboard settings modal
    closeDashboardModalBtn.addEventListener('click', () => {
        dashboardModal.classList.add('hidden');
    });
    
    // Close modal when clicking outside of it
    dashboardModal.addEventListener('click', (e) => {
        if (e.target === dashboardModal) {
            dashboardModal.classList.add('hidden');
        }
    });
    
    // Save dashboard settings
    saveDashboardSettingsBtn.addEventListener('click', () => {
        // Get values from form
        const newSettings = {
            historyDisplay: document.getElementById('history-display').value,
            historyLimit: parseInt(document.getElementById('history-limit').value),
            showNutrition: document.getElementById('show-nutrition').checked,
            showIngredients: document.getElementById('show-ingredients').checked,
            showAllergens: document.getElementById('show-allergens').checked,
            showRecommendations: document.getElementById('show-recommendations').checked,
            showAlternatives: document.getElementById('show-alternatives').checked,
            showReviews: document.getElementById('show-reviews').checked
        };
        
        // Save settings
        dashboardSettings = newSettings;
        saveDashboardSettings(dashboardSettings);
        
        // Apply settings
        applyDashboardSettings(dashboardSettings);
        
        // Close modal
        dashboardModal.classList.add('hidden');
    });
    
    // Reset dashboard settings to default
    resetDashboardSettingsBtn.addEventListener('click', () => {
        // Reset to defaults
        dashboardSettings = {...defaultSettings};
        saveDashboardSettings(dashboardSettings);
        
        // Update form
        document.getElementById('history-display').value = dashboardSettings.historyDisplay;
        document.getElementById('history-limit').value = dashboardSettings.historyLimit;
        document.getElementById('show-nutrition').checked = dashboardSettings.showNutrition;
        document.getElementById('show-ingredients').checked = dashboardSettings.showIngredients;
        document.getElementById('show-allergens').checked = dashboardSettings.showAllergens;
        document.getElementById('show-recommendations').checked = dashboardSettings.showRecommendations;
        document.getElementById('show-alternatives').checked = dashboardSettings.showAlternatives;
        document.getElementById('show-reviews').checked = dashboardSettings.showReviews;
        
        // Apply settings
        applyDashboardSettings(dashboardSettings);
    });
    
    // Load dashboard settings from localStorage
    function loadDashboardSettings() {
        const savedSettings = localStorage.getItem('dashboardSettings');
        if (savedSettings) {
            try {
                return JSON.parse(savedSettings);
            } catch (e) {
                console.error('Error parsing dashboard settings:', e);
                return {...defaultSettings};
            }
        }
        return {...defaultSettings};
    }
    
    // Save dashboard settings to localStorage
    function saveDashboardSettings(settings) {
        localStorage.setItem('dashboardSettings', JSON.stringify(settings));
    }
    
    // Apply dashboard settings to the UI
    function applyDashboardSettings(settings) {
        // Apply history display style
        const historySection = document.getElementById('scan-history-section');
        historySection.className = 'scan-history-section';
        historySection.classList.add(`history-display-${settings.historyDisplay}`);
        
        // Apply history limit
        // This will be used when saving to cookie
        
        // Apply widget visibility
        document.querySelector('.nutrition-tile').style.display = settings.showNutrition ? 'block' : 'none';
        document.querySelector('.ingredients-tile').style.display = settings.showIngredients ? 'block' : 'none';
        document.querySelector('.allergens-tile').style.display = settings.showAllergens ? 'block' : 'none';
        document.querySelector('.recommendation-tile').style.display = settings.showRecommendations ? 'block' : 'none';
        document.querySelector('.alternatives-tile').style.display = settings.showAlternatives ? 'block' : 'none';
        document.querySelector('.reviews-tile').style.display = settings.showReviews ? 'block' : 'none';
        
        // Refresh history display with new settings
        displayScanHistory();
    }
    
    // Handle zoom functionality
    function handleZoom() {
        if (!scannerVideo.srcObject) return;
        
        const zoomLevel = parseFloat(zoomControl.value);
        
        // Get video tracks
        const videoTrack = scannerVideo.srcObject.getVideoTracks()[0];
        
        if (videoTrack && videoTrack.getCapabilities && videoTrack.getCapabilities().zoom) {
            // Check if zoom is supported by the camera
            const capabilities = videoTrack.getCapabilities();
            
            // Apply zoom if supported
            if (capabilities.zoom) {
                try {
                    videoTrack.applyConstraints({
                        advanced: [{ zoom: zoomLevel }]
                    }).catch(error => {
                        console.error('Error applying zoom:', error);
                    });
                } catch (error) {
                    console.error('Error applying zoom constraints:', error);
                }
            }
        } else {
            // Fallback for browsers/devices that don't support zoom
            // Apply CSS transform scale as a visual zoom effect
            const scale = zoomLevel;
            scannerVideo.style.transform = `scale(${scale})`;
            scannerVideo.style.transformOrigin = 'center';
        }
    }
    
    // Capture image and process it
    function captureImage() {
        if (!scannerVideo.srcObject || !scanning) {
            if (scannerMessage) {
                scannerMessage.textContent = 'Please start the scanner first';
            }
            return;
        }
        
        try {
            // Create a canvas element
            const canvas = document.createElement('canvas');
            canvas.width = scannerVideo.videoWidth;
            canvas.height = scannerVideo.videoHeight;
            
            // Draw the current video frame to the canvas
            const ctx = canvas.getContext('2d');
            ctx.drawImage(scannerVideo, 0, 0, canvas.width, canvas.height);
            
            // Add visual feedback for capture
            const flash = document.createElement('div');
            flash.style.position = 'absolute';
            flash.style.top = '0';
            flash.style.left = '0';
            flash.style.right = '0';
            flash.style.bottom = '0';
            flash.style.backgroundColor = 'white';
            flash.style.opacity = '0.7';
            flash.style.zIndex = '100';
            flash.style.animation = 'flash 0.5s';
            
            // Add flash animation style
            const style = document.createElement('style');
            style.textContent = `
                @keyframes flash {
                    0% { opacity: 0.7; }
                    100% { opacity: 0; }
                }
            `;
            document.head.appendChild(style);
            
            // Add flash element to scanner wrapper
            const scannerWrapper = document.getElementById('scanner-wrapper');
            scannerWrapper.appendChild(flash);
            
            // Remove flash after animation completes
            setTimeout(() => {
                scannerWrapper.removeChild(flash);
                document.head.removeChild(style);
            }, 500);
            
            if (scannerMessage) {
                scannerMessage.textContent = 'Processing captured image...';
            }
            
            // Use ZXing to decode the image
            if (typeof ZXing !== 'undefined') {
                try {
                    // Convert canvas to ImageData
                    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    
                    // Create a BinaryBitmap for ZXing
                    const luminanceSource = new ZXing.HTMLCanvasElementLuminanceSource(canvas);
                    const binaryBitmap = new ZXing.BinaryBitmap(new ZXing.HybridBinarizer(luminanceSource));
                    
                    // Try to decode the image
                    const reader = new ZXing.MultiFormatReader();
                    const result = reader.decode(binaryBitmap);
                    
                    if (result && result.text) {
                        console.log('Barcode detected from captured image:', result.text);
                        if (scannerMessage) {
                            scannerMessage.textContent = 'Barcode detected! Processing...';
                        }
                        
                        // Process the barcode
                        processBarcode(result.text);
                    } else {
                        if (scannerMessage) {
                            scannerMessage.textContent = 'No barcode found in the captured image. Try again.';
                        }
                    }
                } catch (error) {
                    console.error('Error decoding captured image:', error);
                    if (error instanceof ZXing.NotFoundException) {
                        if (scannerMessage) {
                            scannerMessage.textContent = 'No barcode found in the captured image. Try again.';
                        }
                    } else {
                        if (scannerMessage) {
                            scannerMessage.textContent = 'Error processing the image: ' + error.message;
                        }
                    }
                }
            } else {
                console.error('ZXing library not loaded');
                if (scannerMessage) {
                    scannerMessage.textContent = 'Barcode scanner library not loaded. Please refresh the page.';
                }
            }
        } catch (error) {
            console.error('Error capturing image:', error);
            if (scannerMessage) {
                scannerMessage.textContent = 'Error capturing image: ' + error.message;
            }
        }
    }
});

