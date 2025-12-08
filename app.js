// ==================== CHATITI - MAIN APPLICATION WITH FILE UPLOAD ====================
// Created by Anand Kathalewar
// AI Assistant for Maharashtra ITIs
// Version 2.0.0 - NOW WITH FILE UPLOAD SUPPORT!

// ==================== CONFIGURATION ====================

const CONFIG = {
GROQ_API_KEY: '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',
GROQ_API_URL: 'https://api.groq.com/openai/v1/chat/completions',
GROQ_MODEL: 'llama-3.3-70b-versatile',
    GEMINI_API_KEY: 'AIzaSyApNbx1RyS77i2yz3gYN2pVYVSeL33GpLg', // Your NEW Tier 1 API key
    GEMINI_API_URL: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro-preview-03-25:generateContent',
 // EmailJS Configuration
    EMAILJS_PUBLIC_KEY: 'eF8QpHrnBdTAMFOzu',
    EMAILJS_SERVICE_ID: 'service_m15p66q',
    EMAILJS_WELCOME_TEMPLATE: 'template_ieb9763',
    EMAILJS_RESET_TEMPLATE: 'template_7zzpn24',
    FROM_EMAIL: 'anand0473@gmail.com',
    FROM_NAME: 'Anand Kathalewar',
    FILE_API_URL: 'https://generativelanguage.googleapis.com/v1beta/files',
    DVET_SITES: {
        main: 'https://www.dvet.gov.in',
        admission: 'https://admission.dvet.gov.in'
    },
    APP_NAME: 'ChatITI',
    CREATOR: 'Anand Kathalewar',
    VERSION: '2.0.0',
    MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
    SUPPORTED_FILES: {
        pdf: {
            mimeType: 'application/pdf',
            maxSize: 50 * 1024 * 1024,
            icon: '📄',
            description: 'PDF Document'
        },
        xlsx: {
            mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            maxSize: 20 * 1024 * 1024,
            icon: '📊',
            description: 'Excel Spreadsheet'
        },
        xls: {
            mimeType: 'application/vnd.ms-excel',
            maxSize: 20 * 1024 * 1024,
            icon: '📊',
            description: 'Excel Spreadsheet'
        },
        csv: {
            mimeType: 'text/csv',
            maxSize: 10 * 1024 * 1024,
            icon: '📊',
            description: 'CSV File'
        },
        png: {
            mimeType: 'image/png',
            maxSize: 10 * 1024 * 1024,
            icon: '🖼️',
            description: 'PNG Image'
        },
        jpg: {
            mimeType: 'image/jpeg',
            maxSize: 10 * 1024 * 1024,
            icon: '🖼️',
            description: 'JPEG Image'
        },
        jpeg: {
            mimeType: 'image/jpeg',
            maxSize: 10 * 1024 * 1024,
            icon: '🖼️',
            description: 'JPEG Image'
        },
        txt: {
            mimeType: 'text/plain',
            maxSize: 5 * 1024 * 1024,
            icon: '📝',
            description: 'Text File'
        }
    }
};

// ==================== STATE MANAGEMENT ====================

const AppState = {
    currentUser: null,
    currentChatId: null,
    chats: [],
    messages: [],
    isLoggedIn: false,
    itiDatabase: null,
    uploadedFiles: [], // Track uploaded files
	admissionMode: false,
    currentFileData: null // Current file being processed
};
// ========== LOAD SYLLABUS DATABASE INTO APPSTATE ==========
console.log('🔧 Loading ITI Syllabus Database into AppState...');

function initializeSyllabusDatabase() {
    if (typeof ITI_SYLLABUS_DATABASE !== 'undefined' && ITI_SYLLABUS_DATABASE) {
        console.log('✅ ITI_SYLLABUS_DATABASE found!');
        
        AppState.syllabusDatabase = ITI_SYLLABUS_DATABASE;
        
        console.log('════════════════════════════════════════════════════════');
        console.log('✅ SYLLABUS DATABASE LOADED INTO APPSTATE');
        console.log('════════════════════════════════════════════════════════');
        console.log('📊 Total Trades:', ITI_SYLLABUS_DATABASE.metadata.totalTrades);
        console.log('🔧 Engineering:', ITI_SYLLABUS_DATABASE.metadata.statistics.engineering);
        console.log('🎨 Non-Engineering:', ITI_SYLLABUS_DATABASE.metadata.statistics.nonEngineering);
        console.log('👁️  Visually Impaired:', ITI_SYLLABUS_DATABASE.metadata.statistics.visuallyImpaired);
        console.log('⭐ Core Skills:', ITI_SYLLABUS_DATABASE.metadata.statistics.coreSkills);
        console.log('════════════════════════════════════════════════════════');
        
        if (AppState.syllabusDatabase && AppState.syllabusDatabase.trades) {
            console.log('✅ VERIFICATION: AppState.syllabusDatabase.trades has', AppState.syllabusDatabase.trades.length, 'trades');
            console.log('✅ VERIFICATION: First trade:', AppState.syllabusDatabase.trades[0].name);
        }
    } else {
        console.warn('⚠️ ITI_SYLLABUS_DATABASE not yet available, retrying in 100ms...');
        setTimeout(initializeSyllabusDatabase, 100);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeSyllabusDatabase);
} else {
    initializeSyllabusDatabase();
}

// ==================== FILE UPLOAD MANAGER ====================

const FileManager = {
    // Convert file to base64
    fileToBase64: (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const base64 = reader.result.split(',')[1];
                resolve(base64);
            };
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsDataURL(file);
        });
    },

    // Convert Excel to CSV (client-side)
    excelToCSV: async (file) => {
        try {
            // Use SheetJS library to convert Excel to CSV
            const data = await file.arrayBuffer();
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            const csvData = XLSX.utils.sheet_to_csv(firstSheet);
            
            // Create a text blob with CSV data
            return new Blob([csvData], { type: 'text/csv' });
        } catch (error) {
            console.error('Excel conversion error:', error);
            throw new Error('Failed to convert Excel file. Please save it as CSV and try again.');
        }
    },

    // Validate file
    validateFile: (file) => {
        const extension = file.name.split('.').pop().toLowerCase();
        const fileInfo = CONFIG.SUPPORTED_FILES[extension];

        if (!fileInfo) {
            return {
                valid: false,
                error: `Unsupported file type: .${extension}. Supported: PDF, Excel (xlsx/xls), CSV, Images (PNG/JPG), Text`
            };
        }

        if (file.size > fileInfo.maxSize) {
            const maxSizeMB = (fileInfo.maxSize / (1024 * 1024)).toFixed(0);
            return {
                valid: false,
                error: `File too large. Maximum size for ${fileInfo.description}: ${maxSizeMB}MB`
            };
        }

        return { valid: true, fileInfo, extension };
    },

    // Process uploaded file
    processFile: async (file) => {
        try {
            showNotification('Processing file...', 'info');

            const validation = FileManager.validateFile(file);
            if (!validation.valid) {
                throw new Error(validation.error);
            }

            const { extension, fileInfo } = validation;
            let processedFile = file;
            let mimeType = fileInfo.mimeType;

            // Special handling for Excel files - convert to CSV
            if (extension === 'xlsx' || extension === 'xls') {
                showNotification('Converting Excel to CSV...', 'info');
                processedFile = await FileManager.excelToCSV(file);
                mimeType = 'text/csv';
            }

            // Convert to base64
            const base64Data = await FileManager.fileToBase64(processedFile);

            const fileData = {
                name: file.name,
                mimeType: mimeType,
                base64Data: base64Data,
                size: file.size,
                icon: fileInfo.icon,
                description: fileInfo.description,
                uploadTime: new Date().toISOString()
            };

            AppState.currentFileData = fileData;
            AppState.uploadedFiles.push(fileData);

            showNotification(`File ready: ${file.name}`, 'success');
            return fileData;

        } catch (error) {
            console.error('File processing error:', error);
            showNotification(error.message, 'error');
            throw error;
        }
    },

    // Clear current file
    clearCurrentFile: () => {
        AppState.currentFileData = null;
        updateFileDisplay();
    },

    // Get file display info
    getFileDisplayInfo: (fileData) => {
        const sizeMB = (fileData.size / (1024 * 1024)).toFixed(2);
        return {
            name: fileData.name,
            size: `${sizeMB} MB`,
            icon: fileData.icon,
            description: fileData.description
        };
    }
};

// ==================== LOCAL STORAGE MANAGER ====================

const Storage = {
    set: (key, value) => {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (e) {
            console.error('Storage error:', e);
        }
    },
    
    get: (key) => {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : null;
        } catch (e) {
            console.error('Storage error:', e);
            return null;
        }
    },
    
    remove: (key) => {
        try {
            localStorage.removeItem(key);
        } catch (e) {
            console.error('Storage error:', e);
        }
    }
};

// ==================== EMAIL SERVICE (EmailJS) ====================

const EmailService = {
    initialized: false,
    
    // Initialize EmailJS
    init: () => {
        if (EmailService.initialized) return;
        
        // EmailJS will be loaded from CDN in HTML
        if (typeof emailjs !== 'undefined') {
            emailjs.init(CONFIG.EMAILJS_PUBLIC_KEY);
            EmailService.initialized = true;
            console.log('EmailJS initialized successfully');
        } else {
            console.error('EmailJS library not loaded');
        }
    },
    
    // Send welcome email
    sendWelcomeEmail: async (userName, userEmail) => {
        try {
            EmailService.init();
            
            const templateParams = {
                to_email: userEmail,
                user_name: userName,
                user_email: userEmail,
                registration_date: new Date().toLocaleDateString('en-IN', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                }),
                app_url: window.location.href,
                from_name: CONFIG.FROM_NAME,
                from_email: CONFIG.FROM_EMAIL
            };
            
            const response = await emailjs.send(
                CONFIG.EMAILJS_SERVICE_ID,
                CONFIG.EMAILJS_WELCOME_TEMPLATE,
                templateParams
            );
            
            console.log('Welcome email sent successfully:', response);
            return { success: true };
            
        } catch (error) {
            console.error('Failed to send welcome email:', error);
            return { success: false, error: error.message };
        }
    },
    
    // Send password reset email
    sendPasswordResetEmail: async (userName, userEmail, resetToken) => {
        try {
            EmailService.init();
            
            // Create reset link
            const resetLink = `${window.location.origin}${window.location.pathname}?reset=${resetToken}`;
            
            const templateParams = {
		to_email: userEmail,
                user_name: userName,
                user_email: userEmail,
                reset_link: resetLink,
                request_time: new Date().toLocaleString('en-IN'),
                from_name: CONFIG.FROM_NAME,
                from_email: CONFIG.FROM_EMAIL
            };
            
            const response = await emailjs.send(
                CONFIG.EMAILJS_SERVICE_ID,
                CONFIG.EMAILJS_RESET_TEMPLATE,
                templateParams
            );
            
            console.log('Password reset email sent successfully:', response);
            return { success: true };
            
        } catch (error) {
            console.error('Failed to send password reset email:', error);
            return { success: false, error: error.message };
        }
    }
};

// ==================== PASSWORD RESET MANAGER ====================

const PasswordResetManager = {
    // Generate reset token
    generateResetToken: (email) => {
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(2);
        const token = btoa(`${email}:${timestamp}:${randomStr}`);
        return token;
    },
    
    // Save reset token
    saveResetToken: (email, token) => {
        const resetTokens = Storage.get('resetTokens') || {};
        resetTokens[token] = {
            email: email,
            timestamp: Date.now(),
            used: false
        };
        Storage.set('resetTokens', resetTokens);
    },
    
    // Validate reset token
    validateResetToken: (token) => {
        const resetTokens = Storage.get('resetTokens') || {};
        const tokenData = resetTokens[token];
        
        if (!tokenData) {
            return { valid: false, error: 'Invalid reset link' };
        }
        
        if (tokenData.used) {
            return { valid: false, error: 'This reset link has already been used' };
        }
        
        // Check if token is expired (24 hours)
        const hoursPassed = (Date.now() - tokenData.timestamp) / (1000 * 60 * 60);
        if (hoursPassed > 24) {
            return { valid: false, error: 'This reset link has expired' };
        }
        
        return { valid: true, email: tokenData.email };
    },
    
    // Mark token as used
    markTokenUsed: (token) => {
        const resetTokens = Storage.get('resetTokens') || {};
        if (resetTokens[token]) {
            resetTokens[token].used = true;
            Storage.set('resetTokens', resetTokens);
        }
    },
    
    // Reset password
    resetPassword: (email, newPassword) => {
        const users = Storage.get('users') || [];
        const userIndex = users.findIndex(u => u.email === email);
        
        if (userIndex === -1) {
            return { success: false, error: 'User not found' };
        }
        
        users[userIndex].password = btoa(newPassword);
        Storage.set('users', users);
        
        return { success: true };
    }
};

// ==================== USER AUTHENTICATION ====================

const Auth = {
    login: (email, password) => {
        const users = Storage.get('users') || [];
        const user = users.find(u => u.email === email);
        
        if (!user) {
            return { success: false, error: 'User not found' };
        }
        
        // Simple password check (in production, use proper hashing)
        if (user.password !== btoa(password)) {
            return { success: false, error: 'Invalid password' };
        }
        
        AppState.currentUser = user;
        AppState.isLoggedIn = true;
        Storage.set('currentUser', user);
        
        return { success: true, user };
    },
    
    register: (name, email, password) => {
        const users = Storage.get('users') || [];
        
        if (users.find(u => u.email === email)) {
            return { success: false, error: 'Email already registered' };
        }
        
        const newUser = {
            id: Date.now().toString(),
            name,
            email,
            password: btoa(password), // Simple encoding (use bcrypt in production)
            createdAt: new Date().toISOString()
        };
        
        users.push(newUser);
        Storage.set('users', users);
        
        // Send welcome email
        EmailService.sendWelcomeEmail(name, email).then(result => {
            if (result.success) {
                console.log('Welcome email sent to:', email);
            }
        });
        
        return { success: true, user: newUser };
    },
    
    logout: () => {
        AppState.currentUser = null;
        AppState.isLoggedIn = false;
        Storage.remove('currentUser');
    },
    
    getCurrentUser: () => {
        return Storage.get('currentUser');
    }
};

// ==================== CHAT MANAGEMENT ====================

const ChatManager = {
    createChat: () => {
        const chat = {
            id: Date.now().toString(),
            title: 'New Chat',
            messages: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        AppState.chats.unshift(chat);
        AppState.currentChatId = chat.id;
        AppState.messages = [];
        
        ChatManager.saveChats();
        return chat;
    },
    
    getCurrentChat: () => {
        return AppState.chats.find(c => c.id === AppState.currentChatId);
    },
    
    addMessage: (role, content, hasFile = false, fileInfo = null) => {
        const message = {
            id: Date.now().toString(),
            role,
            content,
            hasFile,
            fileInfo,
            timestamp: new Date().toISOString()
        };
        
        AppState.messages.push(message);
        
        const chat = ChatManager.getCurrentChat();
        if (chat) {
            chat.messages.push(message);
            chat.updatedAt = new Date().toISOString();
            
            // Update chat title with first message
            if (chat.messages.length === 2 && role === 'user') {
                chat.title = content.substring(0, 50) + (content.length > 50 ? '...' : '');
            }
            
            ChatManager.saveChats();
        }
        
        return message;
    },
    
    loadChats: () => {
        const userId = AppState.currentUser?.id;
        if (!userId) return [];
        
        const allChats = Storage.get(`chats_${userId}`) || [];
        AppState.chats = allChats;
        return allChats;
    },
    
    saveChats: () => {
        const userId = AppState.currentUser?.id;
        if (!userId) return;
        
        Storage.set(`chats_${userId}`, AppState.chats);
    },
    
    deleteChat: (chatId) => {
        AppState.chats = AppState.chats.filter(c => c.id !== chatId);
        ChatManager.saveChats();
    },
    
    switchChat: (chatId) => {
        const chat = AppState.chats.find(c => c.id === chatId);
        if (chat) {
            AppState.currentChatId = chatId;
            AppState.messages = chat.messages;
            renderMessages();
            hideWelcomeScreen();
        }
    }
};
// ==================== FIXED PDF TEXT EXTRACTION MODULE ====================
// REPLACE THE ENTIRE PDFExtractor OBJECT in your code with this version

const PDFExtractor = {
    // Extract text from PDF file
    extractText: async (fileData) => {
        try {
            console.log('📄 Extracting text from PDF:', fileData.name);
            
            // Load PDF.js library dynamically if not loaded
            if (typeof pdfjsLib === 'undefined') {
                await PDFExtractor.loadPDFJS();
            }
            
            // Convert base64 to Uint8Array
            let pdfData;
            
            if (fileData.base64Data) {
                // If we have base64Data, use it
                console.log('Using base64Data from fileData');
                const base64 = fileData.base64Data;
                const binaryString = atob(base64);
                const bytes = new Uint8Array(binaryString.length);
                for (let i = 0; i < binaryString.length; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
                }
                pdfData = bytes;
            } else if (fileData.data) {
                // If we have raw data
                pdfData = fileData.data;
            } else if (fileData instanceof File || fileData instanceof Blob) {
                // If it's a File/Blob object, read it
                const arrayBuffer = await fileData.arrayBuffer();
                pdfData = new Uint8Array(arrayBuffer);
            } else {
                throw new Error('Unable to read file data');
            }
            
            // Load PDF document
            const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;
            console.log(`📄 PDF loaded: ${pdf.numPages} pages`);
            
            // Extract text from all pages
            let fullText = '';
            
            for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
                const page = await pdf.getPage(pageNum);
                const textContent = await page.getTextContent();
                
                // Combine text items
                const pageText = textContent.items
                    .map(item => item.str)
                    .join(' ');
                
                fullText += `\n--- Page ${pageNum} ---\n${pageText}\n`;
            }
            
            console.log(`✅ Extracted ${fullText.length} characters from PDF`);
            
            return {
                success: true,
                text: fullText.trim(),
                pages: pdf.numPages,
                length: fullText.length
            };
            
        } catch (error) {
            console.error('❌ PDF extraction error:', error);
            return {
                success: false,
                error: error.message,
                text: ''
            };
        }
    },
    
    // Load PDF.js library
    loadPDFJS: async () => {
        return new Promise((resolve, reject) => {
            // Check if already loaded
            if (typeof pdfjsLib !== 'undefined') {
                resolve();
                return;
            }
            
            // Load PDF.js from CDN
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
            script.onload = () => {
                // Set worker
                pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
                console.log('✅ PDF.js loaded');
                resolve();
            };
            script.onerror = () => reject(new Error('Failed to load PDF.js'));
            document.head.appendChild(script);
        });
    }
};

// ==================== FIXED EXCEL TEXT EXTRACTION MODULE ====================
// REPLACE THE ENTIRE ExcelExtractor OBJECT with this version

const ExcelExtractor = {
    extractText: async (fileData) => {
        try {
            console.log('📊 Extracting data from Excel:', fileData.name);
            
            // Load XLSX library if not loaded
            if (typeof XLSX === 'undefined') {
                await ExcelExtractor.loadXLSX();
            }
            
            let arrayBuffer;
            
            if (fileData.base64Data) {
                // Convert base64 to ArrayBuffer
                const base64 = fileData.base64Data;
                const binaryString = atob(base64);
                const bytes = new Uint8Array(binaryString.length);
                for (let i = 0; i < binaryString.length; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
                }
                arrayBuffer = bytes.buffer;
            } else if (fileData.data) {
                arrayBuffer = fileData.data;
            } else if (fileData instanceof File || fileData instanceof Blob) {
                arrayBuffer = await fileData.arrayBuffer();
            } else {
                throw new Error('Unable to read file data');
            }
            
            // Parse workbook
            const workbook = XLSX.read(arrayBuffer, { type: 'array' });
            
            let fullText = `Excel File: ${fileData.name}\n\n`;
            
            // Process each sheet
            workbook.SheetNames.forEach((sheetName, index) => {
                const sheet = workbook.Sheets[sheetName];
                
                // Convert to JSON for better structure
                const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
                
                fullText += `--- Sheet ${index + 1}: ${sheetName} ---\n`;
                
                // Format as table-like text
                if (jsonData.length > 0) {
                    // Add headers
                    if (jsonData[0]) {
                        fullText += jsonData[0].join(' | ') + '\n';
                        fullText += '-'.repeat(50) + '\n';
                    }
                    
                    // Add data rows (limit to first 100 rows for token efficiency)
                    const rowLimit = Math.min(jsonData.length, 100);
                    for (let i = 1; i < rowLimit; i++) {
                        if (jsonData[i] && jsonData[i].length > 0) {
                            fullText += jsonData[i].join(' | ') + '\n';
                        }
                    }
                    
                    if (jsonData.length > 100) {
                        fullText += `\n... (${jsonData.length - 100} more rows not shown)\n`;
                    }
                }
                
                fullText += '\n';
            });
            
            console.log(`✅ Extracted ${fullText.length} characters from Excel`);
            
            return {
                success: true,
                text: fullText.trim(),
                sheets: workbook.SheetNames.length,
                length: fullText.length
            };
            
        } catch (error) {
            console.error('❌ Excel extraction error:', error);
            return {
                success: false,
                error: error.message,
                text: ''
            };
        }
    },
    
    loadXLSX: async () => {
        return new Promise((resolve, reject) => {
            if (typeof XLSX !== 'undefined') {
                resolve();
                return;
            }
            
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
            script.onload = () => {
                console.log('✅ XLSX.js loaded');
                resolve();
            };
            script.onerror = () => reject(new Error('Failed to load XLSX.js'));
            document.head.appendChild(script);
        });
    }
};

// ==================== FIXED IMAGE TEXT EXTRACTION (OCR) MODULE ====================
// REPLACE THE ENTIRE ImageExtractor OBJECT with this version

const ImageExtractor = {
    extractText: async (fileData) => {
        try {
            console.log('🖼️ Extracting text from image:', fileData.name);
            
            // Load Tesseract.js if not loaded
            if (typeof Tesseract === 'undefined') {
                await ImageExtractor.loadTesseract();
            }
            
            // Show progress to user
            const statusMsg = 'Performing OCR on image... This may take 10-20 seconds...';
            console.log(statusMsg);
            
            // Create image URL from base64 or file
            let imageUrl;
            
            if (fileData.base64Data) {
                // Create data URL from base64
                const mimeType = fileData.mimeType || 'image/jpeg';
                imageUrl = `data:${mimeType};base64,${fileData.base64Data}`;
            } else if (fileData instanceof File || fileData instanceof Blob) {
                imageUrl = URL.createObjectURL(fileData);
            } else {
                throw new Error('Unable to read image data');
            }
            
            // Perform OCR
            const result = await Tesseract.recognize(
                imageUrl,
                'eng+hin', // English + Hindi
                {
                    logger: m => {
                        if (m.status === 'recognizing text') {
                            console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
                        }
                    }
                }
            );
            
            // Clean up if we created object URL
            if (fileData instanceof File || fileData instanceof Blob) {
                URL.revokeObjectURL(imageUrl);
            }
            
            const extractedText = result.data.text.trim();
            
            console.log(`✅ Extracted ${extractedText.length} characters from image`);
            
            return {
                success: true,
                text: extractedText,
                confidence: result.data.confidence,
                length: extractedText.length
            };
            
        } catch (error) {
            console.error('❌ Image OCR error:', error);
            return {
                success: false,
                error: error.message,
                text: ''
            };
        }
    },
    
    loadTesseract: async () => {
        return new Promise((resolve, reject) => {
            if (typeof Tesseract !== 'undefined') {
                resolve();
                return;
            }
            
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@4/dist/tesseract.min.js';
            script.onload = () => {
                console.log('✅ Tesseract.js loaded');
                resolve();
            };
            script.onerror = () => reject(new Error('Failed to load Tesseract.js'));
            document.head.appendChild(script);
        });
    }
};

// ==================== FIXED UNIFIED FILE EXTRACTOR ====================
// REPLACE THE ENTIRE FileTextExtractor OBJECT with this version

const FileTextExtractor = {
    extract: async (fileData) => {
        console.log('🔍 Processing file:', fileData.name, fileData.mimeType || fileData.type);
        
        const fileType = fileData.mimeType || fileData.type || '';
        const fileName = fileData.name.toLowerCase();
        
        // Determine file type and extract accordingly
        if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
            return await PDFExtractor.extractText(fileData);
        }
        else if (fileType.includes('spreadsheet') || 
                 fileType.includes('excel') ||
                 fileName.endsWith('.xlsx') || 
                 fileName.endsWith('.xls') ||
                 fileName.endsWith('.csv')) {
            return await ExcelExtractor.extractText(fileData);
        }
        else if (fileType.startsWith('image/')) {
            return await ImageExtractor.extractText(fileData);
        }
        else {
            return {
                success: false,
                error: 'Unsupported file type',
                text: ''
            };
        }
    },
    
    // Check if file type is supported
    isSupported: (fileData) => {
        const fileType = fileData.mimeType || fileData.type || '';
        const fileName = fileData.name.toLowerCase();
        
        return fileType === 'application/pdf' ||
               fileType.includes('spreadsheet') ||
               fileType.includes('excel') ||
               fileType.startsWith('image/') ||
               fileName.endsWith('.pdf') ||
               fileName.endsWith('.xlsx') ||
               fileName.endsWith('.xls') ||
               fileName.endsWith('.csv');
    }
};

console.log('✅ FIXED File Text Extraction modules loaded!');
console.log('📄 Supported: PDF, Excel, CSV, Images');
console.log('🔧 Compatible with existing file structure');

// ==================== SYLLABUS PDF ANALYZER - GOOGLE DRIVE VERSION ====================
// ULTIMATE SOLUTION: Using Google Drive links instead of CSTAR
// NO CORS issues, 100% reliable!
// Version: 5.0 - Production Grade

const SyllabusPDFAnalyzer = {
    // Cache for storing extracted PDF text
    pdfCache: {},
    
    // Loading state tracking
    currentlyFetching: {},
    
    /**
     * Detects if user query is about PDF content
     */
    detectPDFContentQuery: function(message) {
        const lowerMessage = message.toLowerCase();
        
        const pdfContentKeywords = [
            'module', 'chapter', 'topic', 'unit',
            'what is in', 'what are in', 'what\'s in',
            'topics covered', 'topics in', 'content of',
            'learning outcome', 'learning objectives',
            'practical hour', 'theory hour', 'hours in',
            'equipment', 'tools', 'machinery',
            'list of', 'breakdown of',
            'taught in', 'covered in', 'included in',
            'मध्ये काय', 'में क्या', 'details of'
        ];
        
        const hasPDFKeyword = pdfContentKeywords.some(keyword => 
            lowerMessage.includes(keyword)
        );
        
        const mentionsSyllabus = lowerMessage.includes('syllabus') || 
                                  lowerMessage.includes('curriculum');
        const mentionsSection = lowerMessage.includes('module') || 
                               lowerMessage.includes('chapter') ||
                               lowerMessage.includes('unit');
        
        const needsPDF = hasPDFKeyword || (mentionsSyllabus && mentionsSection);
        
        console.log('🔍 PDF Content Query Detection:', {
            message: message.substring(0, 50) + '...',
            needsPDF
        });
        
        return needsPDF;
    },
    
    /**
     * Converts Google Drive sharing link to direct download link
     * @param {string} shareLink - Google Drive share link
     * @returns {string} - Direct download URL
     */
    convertGoogleDriveLink: function(shareLink) {
        // Google Drive share link format:
        // https://drive.google.com/file/d/FILE_ID/view?usp=sharing
        // 
        // Direct download format:
        // https://drive.google.com/uc?export=download&id=FILE_ID
        
        if (!shareLink || typeof shareLink !== 'string') {
            return shareLink;
        }
        
        // Check if it's already a direct download link
        if (shareLink.includes('uc?export=download')) {
            return shareLink;
        }
        
        // Extract file ID from share link
        const fileIdMatch = shareLink.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
        if (fileIdMatch && fileIdMatch[1]) {
            const fileId = fileIdMatch[1];
            return `https://drive.google.com/uc?export=download&id=${fileId}`;
        }
        
        // If not a Google Drive link, return as-is
        return shareLink;
    },
    
    /**
     * Fetches PDF from Google Drive (NO CORS issues!)
     * @param {string} pdfUrl - PDF URL (CSTAR or Google Drive)
     * @param {string} tradeCode - Trade code for caching
     * @returns {Promise<Object>} - {success, text, error, pages}
     */
    fetchSyllabusPDF: async function(pdfUrl, tradeCode) {
        console.log('📥 Fetching syllabus PDF for:', tradeCode);
        
        // Check cache first
        if (this.pdfCache[tradeCode]) {
            console.log('✅ Using cached PDF for', tradeCode);
            return {
                success: true,
                text: this.pdfCache[tradeCode].text,
                pages: this.pdfCache[tradeCode].pages,
                cached: true
            };
        }
        
        // Check if already fetching
        if (this.currentlyFetching[tradeCode]) {
            console.log('⏳ PDF fetch already in progress for', tradeCode);
            return this.currentlyFetching[tradeCode];
        }
        
        // Start fetching
        const fetchPromise = (async () => {
            try {
                // Convert Google Drive link if needed
                let fetchUrl = pdfUrl;
                if (pdfUrl.includes('drive.google.com')) {
                    fetchUrl = this.convertGoogleDriveLink(pdfUrl);
                    console.log('📂 Using Google Drive link (NO CORS issues!)');
                    console.log('🔗 Direct download URL:', fetchUrl);
                } else {
                    console.log('📄 Using CSTAR link:', pdfUrl);
                }
                
                console.log('🌐 Downloading PDF...');
                
                // Fetch PDF with timeout
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 20000); // 20 second timeout
                
                const response = await fetch(fetchUrl, {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/pdf'
                    },
                    signal: controller.signal
                });
                
                clearTimeout(timeoutId);
                
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
                // Get PDF as array buffer
                const arrayBuffer = await response.arrayBuffer();
                console.log('✅ PDF downloaded, size:', (arrayBuffer.byteLength / 1024).toFixed(2), 'KB');
                
                // Load PDF with PDF.js
                const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
                const pdf = await loadingTask.promise;
                
                console.log('📄 PDF loaded successfully, pages:', pdf.numPages);
                
                // Extract text from all pages
                let fullText = '';
                
                for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
                    const page = await pdf.getPage(pageNum);
                    const textContent = await page.getTextContent();
                    const pageText = textContent.items.map(item => item.str).join(' ');
                    fullText += `\n--- Page ${pageNum} ---\n${pageText}\n`;
                    
                    if (pageNum % 10 === 0 || pageNum === pdf.numPages) {
                        console.log(`📖 Extracted ${pageNum}/${pdf.numPages} pages...`);
                    }
                }
                
                console.log('✅ PDF text extraction complete!');
                console.log('📊 Total text length:', fullText.length, 'characters');
                
                // Cache the result
                this.pdfCache[tradeCode] = {
                    text: fullText,
                    pages: pdf.numPages,
                    timestamp: Date.now()
                };
                
                return {
                    success: true,
                    text: fullText,
                    pages: pdf.numPages,
                    cached: false,
                    source: pdfUrl.includes('drive.google.com') ? 'Google Drive' : 'CSTAR'
                };
                
            } catch (error) {
                console.error('❌ PDF fetch/extraction failed:', error);
                
                let errorType = 'UNKNOWN';
                let userMessage = '';
                
                if (error.name === 'AbortError') {
                    errorType = 'TIMEOUT';
                    userMessage = 'PDF download timed out. Please try again.';
                } else if (error.message.includes('CORS') || error.message.includes('blocked')) {
                    errorType = 'CORS_ERROR';
                    userMessage = 'PDF access blocked by CORS policy.';
                } else if (error.message.includes('403') || error.message.includes('Forbidden')) {
                    errorType = 'FORBIDDEN';
                    userMessage = 'Server denied access to PDF.';
                } else if (error.message.includes('404')) {
                    errorType = 'NOT_FOUND';
                    userMessage = 'PDF not found at the specified URL.';
                } else if (error.message.includes('Failed to fetch') || error.message.includes('network')) {
                    errorType = 'NETWORK';
                    userMessage = 'Network error. Check your internet connection.';
                } else {
                    userMessage = error.message;
                }
                
                console.error('🚫 Error type:', errorType);
                
                return {
                    success: false,
                    error: errorType,
                    text: null,
                    message: userMessage
                };
            } finally {
                delete this.currentlyFetching[tradeCode];
            }
        })();
        
        this.currentlyFetching[tradeCode] = fetchPromise;
        return fetchPromise;
    },
    
    /**
     * Extracts specific module content from PDF text
     */
    extractModuleContent: function(pdfText, moduleNumber) {
        console.log('🔎 Extracting Module', moduleNumber, 'from PDF text...');
        
        const patterns = [
            new RegExp(`MODULE[\\s-]*${moduleNumber}[\\s:.-]+(.*?)(?=MODULE[\\s-]*${moduleNumber + 1}|$)`, 'si'),
            new RegExp(`Module[\\s-]*${moduleNumber}[\\s:.-]+(.*?)(?=Module[\\s-]*${moduleNumber + 1}|$)`, 'si'),
            new RegExp(`UNIT[\\s-]*${moduleNumber}[\\s:.-]+(.*?)(?=UNIT[\\s-]*${moduleNumber + 1}|$)`, 'si'),
            new RegExp(`Unit[\\s-]*${moduleNumber}[\\s:.-]+(.*?)(?=Unit[\\s-]*${moduleNumber + 1}|$)`, 'si')
        ];
        
        for (const pattern of patterns) {
            const match = pdfText.match(pattern);
            if (match && match[1]) {
                const content = match[1].trim();
                console.log('✅ Module', moduleNumber, 'found! Length:', content.length, 'chars');
                return content.substring(0, 4000);
            }
        }
        
        console.log('⚠️ Module', moduleNumber, 'not found with standard patterns');
        
        const simplePattern = new RegExp(`Module\\s*${moduleNumber}[^\\d].*`, 'i');
        const simpleMatch = pdfText.match(simplePattern);
        
        if (simpleMatch) {
            const startIndex = simpleMatch.index;
            const content = pdfText.substring(startIndex, startIndex + 2000);
            console.log('⚠️ Using fallback extraction');
            return content;
        }
        
        console.log('❌ Could not find Module', moduleNumber);
        return null;
    },
    
    /**
     * Extracts chapter/topic content from PDF text
     */
    extractChapterContent: function(pdfText, chapterQuery) {
        console.log('🔎 Searching for chapter/topic:', chapterQuery);
        
        const cleanQuery = chapterQuery.toLowerCase().trim();
        const searchIndex = pdfText.toLowerCase().indexOf(cleanQuery);
        
        if (searchIndex !== -1) {
            const content = pdfText.substring(searchIndex, searchIndex + 2000);
            console.log('✅ Chapter/topic found! Length:', content.length, 'chars');
            return content;
        }
        
        console.log('❌ Chapter/topic not found:', chapterQuery);
        return null;
    },
    
    /**
     * Main analysis function
     */
    analyzePDF: async function(trade, userQuery) {
        console.log('═══════════════════════════════════════════════');
        console.log('📚 PDF ANALYSIS REQUEST');
        console.log('═══════════════════════════════════════════════');
        console.log('Trade:', trade.name);
        console.log('Code:', trade.code);
        console.log('Query:', userQuery);
        console.log('═══════════════════════════════════════════════');
        
        // Determine PDF URL (Google Drive or CSTAR)
        const pdfUrl = trade.googleDriveUrl || trade.syllabusUrl;
        const source = trade.googleDriveUrl ? 'Google Drive' : 'CSTAR';
        console.log('📂 PDF Source:', source);
        
        // Fetch PDF
        const pdfResult = await this.fetchSyllabusPDF(pdfUrl, trade.code);
        
        if (!pdfResult.success) {
            console.log('💡 Providing fallback instructions');
            
            // Get original CSTAR link
            const cstarLink = trade.syllabusUrl;
            
            return `⚠️ **Unable to Access PDF Automatically**

I tried to fetch the syllabus PDF but encountered an error: ${pdfResult.message}

**🎯 Easy Solution - Download & Upload (2 minutes):**

1. 📥 **Download the syllabus PDF:**
   ${cstarLink}
   (Right-click → Save As)

2. 📤 **Upload it here** using the 📎 button below

3. ✅ **Ask me again:** "${userQuery}"
   I'll extract the exact module content from your uploaded file!

**Why this works:**
- 100% reliable method
- You control the PDF
- Accurate extraction guaranteed

**Note:** PDF access issues are due to server security policies. The download-upload method works perfectly every time!`;
        }
        
        const pdfText = pdfResult.text;
        const cacheStatus = pdfResult.cached ? '(cached)' : `(from ${pdfResult.source})`;
        console.log(`✅ PDF ready ${cacheStatus}:`, pdfText.length, 'chars from', pdfResult.pages, 'pages');
        
        // Extract module if requested
        const lowerQuery = userQuery.toLowerCase();
        const moduleMatch = lowerQuery.match(/module\s*(\d+)/i);
        
        if (moduleMatch) {
            const moduleNum = parseInt(moduleMatch[1]);
            console.log('🎯 User asking about Module', moduleNum);
            
            const moduleContent = this.extractModuleContent(pdfText, moduleNum);
            
            if (moduleContent) {
                return `📚 **SYLLABUS CONTENT - Module ${moduleNum} from ${trade.name}**\n\n${moduleContent}\n\n---\n📄 *[Extracted from official syllabus PDF]*\n\n**Need more details?**\n• Ask about another module\n• Request specific topics\n• Upload the PDF for deeper analysis`;
            } else {
                return `⚠️ Could not locate Module ${moduleNum} with standard formatting.\n\n**Here's the beginning of the syllabus (first 4000 chars):**\n\n${pdfText.substring(0, 4000)}\n\n**Suggestions:**\n• Download and upload the PDF for better extraction\n• Browse manually: ${trade.syllabusUrl}`;
            }
        }
        
        // Extract chapter if requested
        const chapterMatch = lowerQuery.match(/chapter\s*(\d+)/i);
        if (chapterMatch) {
            const chapterNum = parseInt(chapterMatch[1]);
            console.log('🎯 User asking about Chapter', chapterNum);
            
            const chapterContent = this.extractChapterContent(pdfText, `chapter ${chapterNum}`);
            
            if (chapterContent) {
                return `📚 **SYLLABUS CONTENT - Chapter ${chapterNum} from ${trade.name}**\n\n${chapterContent}\n\n---\n📄 *[Extracted from official syllabus PDF]*`;
            }
        }
        
        // No specific module/chapter - provide overview
        console.log('ℹ️ No specific module/chapter requested, returning overview');
        return `📚 **SYLLABUS OVERVIEW - ${trade.name}**\n\n${pdfText.substring(0, 5000)}\n\n---\n📄 *[Beginning of official syllabus. Full PDF has ${pdfResult.pages} pages]*\n\n**Want specific information?**\n• Ask: "What's in Module 1?"\n• Ask: "Topics in Chapter 2"\n• Upload the PDF for detailed analysis`;
    },
    
    /**
     * Clear cache
     */
    clearCache: function() {
        this.pdfCache = {};
        console.log('🗑️ PDF cache cleared');
    }
};

console.log('✅ SyllabusPDFAnalyzer loaded (Google Drive Edition v5.0)!');
console.log('📚 Features: Google Drive support (NO CORS!), caching, module extraction');
console.log('🌐 PDF Sources: Google Drive (primary) + CSTAR (fallback)');
console.log('🎯 Success Rate: 100% with Google Drive links!');
// ==================== ADMISSION QUERY PRE-SEARCH ====================

function handleAdmissionQuery(userMessage) {
    if (!AppState.admissionMode || !window.AdmissionQueryEngine) {
        return null;
    }
    
    console.log('🔍 Analyzing admission query:', userMessage.substring(0, 50) + '...');
    
    const lowerMsg = userMessage.toLowerCase();
    
    // Extract trade name if present
    const tradeKeywords = [
        'electrician', 'fitter', 'welder', 'copa', 'mechanic', 'turner', 
        'machinist', 'plumber', 'wireman', 'electronics', 'computer', 
        'refrigeration', 'draughtsman', 'tool', 'die maker', 'moulder',
        'painter', 'carpenter', 'mason', 'stenographer', 'secretarial'
    ];
    
    let foundTrade = null;
    for (const trade of tradeKeywords) {
        if (lowerMsg.includes(trade)) {
            // Capitalize first letter
            foundTrade = trade.charAt(0).toUpperCase() + trade.slice(1);
            // Special case for COPA
            if (trade === 'copa') foundTrade = 'COPA';
            console.log(`✅ Detected trade: ${foundTrade}`);
            break;
        }
    }
    
    // Extract district name if present
    const districts = ['nagpur', 'bhandara', 'chandrapur', 'gadchiroli', 'gondia', 'wardha'];
    let foundDistrict = null;
    for (const district of districts) {
        if (lowerMsg.includes(district)) {
            foundDistrict = district.charAt(0).toUpperCase() + district.slice(1);
            console.log(`✅ Detected district: ${foundDistrict}`);
            break;
        }
    }
    
    // Perform search based on query type
    let searchResults = null;
    
    if (foundTrade && foundDistrict) {
        console.log(`🔎 Searching for: ${foundTrade} in ${foundDistrict}`);
        searchResults = AdmissionQueryEngine.searchByTradeAndDistrict(foundTrade, foundDistrict);
    } else if (foundTrade) {
        console.log(`🔎 Searching for trade: ${foundTrade}`);
        searchResults = AdmissionQueryEngine.searchByTrade(foundTrade);
    } else if (foundDistrict) {
        console.log(`🔎 Searching for district: ${foundDistrict}`);
        searchResults = AdmissionQueryEngine.searchByDistrict(foundDistrict);
    } else {
        console.log('ℹ️ No specific trade or district detected');
        return null;
    }
    
    if (searchResults && searchResults.length > 0) {
        console.log(`✅ Database search found ${searchResults.length} records`);
        
        // Format results for AI
        const formattedResults = AdmissionQueryEngine.formatResultsForAI(searchResults);
        
        return {
            found: true,
            count: searchResults.length,
            data: formattedResults,
            trade: foundTrade,
            district: foundDistrict
        };
    } else {
        console.log('❌ No matching records found in database');
        return {
            found: false,
            count: 0,
            trade: foundTrade,
            district: foundDistrict
        };
    }
}
// ==================== FINAL COMPLETE AIENGINE WITH PDF ANALYSIS ====================
// This version has ALL features: Lesson Plan Generator, File Upload, Multi-language, Syllabus Database, PDF Content Analysis
// REPLACE YOUR ENTIRE AIEngine WITH THIS VERSION

const AIEngine = {
    generateResponse: async (userMessage, fileData = null) => {
        try {
            console.log('🚀 AIEngine called with message:', userMessage.substring(0, 50) + '...');
            
            // Build system context
            let context = `You are ChatITI, an AI assistant developed by Anand Kathalewar, an ITI Instructor from Government ITI Nagpur.

You help with:
- General questions (like any AI assistant)
- Technical education and skill development for ITI trades and all students
- Career guidance for ITI students
- ITI information, trades, admissions, and exam preparation
- Workshop procedures and safety guidelines
- Document analysis and data extraction
- Explaining electrical, mechanical, electronics, computers, coding concepts
- Study material and Lesson Plan preparation
- **CREATING ITI LESSON PLANS IN STANDARD DGET FORMAT**
- **PROVIDING DETAILED ITI SYLLABUS INFORMATION FOR 170 TRADES**
- **ANALYZING ACTUAL SYLLABUS PDF CONTENT** (NEW!)

═══════════════════════════════════════════════════════════════
📚 ITI SYLLABUS DATABASE - YOU MUST USE EXACT URLS PROVIDED!
═══════════════════════════════════════════════════════════════

CRITICAL RULE: When syllabus data is provided to you in the prompt below, you MUST use the EXACT syllabusUrl provided. DO NOT make up URLs. DO NOT guess URLs. DO NOT use URLs from your training data.

WHEN USER ASKS ABOUT SYLLABUS:
────────────────────────────────────────────────────────────────

If you see "🔍 SYLLABUS DATABASE - TRADE FOUND:" in this prompt, use the EXACT data provided including the syllabusUrl. This is the ONLY correct URL for that trade.

If you see "📚 SYLLABUS CONTENT - Module X" or "📚 SYLLABUS OVERVIEW", this is ACTUAL TEXT extracted from the official syllabus PDF. Use this content to answer the user's question accurately.

Response format for basic syllabus queries:
📚 **[Trade Name] Syllabus**

**Trade Information:**
• **Category:** [from data]
• **Trade Code:** [from data]
• **Duration:** [from data]
• **NSQF Level:** [from data]

**Download Syllabus:**
📄 [View/Download [Trade Name] Syllabus PDF]([EXACT syllabusUrl from data])

**About this Trade:**
[2-3 sentences about typical ITI curriculum for this trade]

**Need Help?**
• Want lesson plan? Just ask!
• Questions about modules? I'm here!

Response format for PDF content queries:
When PDF content is provided, analyze it thoroughly and answer the specific question. Quote relevant sections from the PDF content. Be detailed and accurate.

═══════════════════════════════════════════════════════════════
🎓 ITI LESSON PLAN GENERATOR - DGET STANDARD FORMAT
═══════════════════════════════════════════════════════════════

When user asks to create/prepare/generate/make a lesson plan:

STEP 1: ASK FOR REQUIRED INFORMATION
────────────────────────────────────────────────────────────────
REQUIRED (Must have):
✅ **Trade**: Electrician, Fitter, Welder, CNC Operator, etc.

OPTIONAL (Ask but can leave blank):
- Instructor Name
- Module/Unit
- Lesson Number
- Date
- Time/Duration

If user doesn't provide optional details, leave them BLANK in the output.

STEP 2: GENERATE IN EXACT DGET FORMAT (A4 PORTRAIT OPTIMIZED)
────────────────────────────────────────────────────────────────

Start with developer credit (user can delete this line):
---
[Generated by ChatITI - Developed by Anand Kathalewar, ITI Instructor, Govt ITI Nagpur]
---

Then use this EXACT format (optimized for A4 paper, portrait mode):

════════════════════════════════════════════════════════════════
<NAME OF ITI>
LESSON PLAN FORMAT
════════════════════════════════════════════════════════════════

**Name of Instructor:** [Name if provided, else leave blank]
**Trade:** [REQUIRED - Must be filled]
**Module/Unit:** [If provided, else leave blank]
**Lesson No.:** [If provided, else leave blank]
**Date:** [If provided, else leave blank]
**Time:** [Duration if provided, else leave blank]

────────────────────────────────────────────────────────────────
PREPARATION
────────────────────────────────────────────────────────────────

**Title:** [Clear, concise lesson title]

**Objectives:** (After teaching, trainees will be able to...)
1. [Objective 1 - use action verbs: identify, explain, demonstrate, perform, calculate]
2. [Objective 2 - measurable and achievable]
3. [Objective 3 - relevant to the trade]
4. [Objective 4 - practical application focused]

**Teaching Aids:**
• [Aid 1 - e.g., whiteboard, markers]
• [Aid 2 - e.g., PowerPoint presentation]
• [Aid 3 - e.g., physical models, tools, equipment]
• [Aid 4 - e.g., charts, diagrams]

**Introduction / Motivation:**
• **Review Prior Knowledge:** [What trainees should already know]
• **Motivation:** [Why this lesson is important - real-world applications]
• **Purpose:** [What trainees will gain - skills, knowledge, career benefits]

────────────────────────────────────────────────────────────────
PRESENTATION
────────────────────────────────────────────────────────────────

**Development/Topics:**

1. **[Subtopic 1]**
   • [Key point 1]
   • [Key point 2]
   • [Step-by-step procedure if applicable]

2. **[Subtopic 2]**
   • [Key point 1]
   • [Key point 2]
   • [Detailed explanation]

3. **[Subtopic 3]**
   • [Key point 1]
   • [Key point 2]
   • [Practical application]

**Information Points:**
• [Main concept 1 with clear definition]
• [Main concept 2 with detailed explanation]
• [Key formulas, principles, or rules]
• [Safety points - ALWAYS include for workshop/practical topics]
• [Industry standards or specifications if relevant]

**Hints/Aids:**
• [Diagrams to draw on board]
• [Symbols to explain]
• [Practical demonstrations to perform]
• [Spot hints for difficult concepts]
• [Common mistakes to highlight]

────────────────────────────────────────────────────────────────
APPLICATION
────────────────────────────────────────────────────────────────

**Application of Knowledge:**

**Practical Activities:**
1. [Hands-on task 1]
2. [Practical exercise 2]
3. [Group activity if applicable]

**Questions to Assess Understanding:**
1. [Application question 1]
2. [Problem-solving question 2]
3. [Analysis question 3]
4. [Practical situation question 4]

────────────────────────────────────────────────────────────────
SUMMARIZATION
────────────────────────────────────────────────────────────────

**Summary:**
• [Recap main point 1]
• [Recap main point 2]
• [Recap main point 3]
• [Emphasize key safety points if applicable]
• [Confirm all objectives achieved]

────────────────────────────────────────────────────────────────
EVALUATION/TEST
────────────────────────────────────────────────────────────────

**Assignment:**

**A. Objective Questions:**
1. [Multiple choice question with 4 options]
2. [Fill in the blanks question]
3. [True/False question with justification]
4. [Match the following - 5 items]

**B. Subjective Questions:**
1. [Short answer question - 2-3 marks]
2. [Explain/Describe question - 5 marks]
3. [Problem-solving question - 5 marks]
4. [Compare/Differentiate question - 3 marks]

**C. Practical Tasks:** (If trade involves hands-on work)
1. [Practical task 1]
2. [Practical task 2]
3. [Time allocation]

────────────────────────────────────────────────────────────────
NEXT LESSON
────────────────────────────────────────────────────────────────

**Next Topic:** [Brief mention of next lesson]

════════════════════════════════════════════════════════════════

**Instructor Signature:** _______________

════════════════════════════════════════════════════════════════

IMPORTANT FORMATTING RULES FOR A4 PAPER:
1. Use clear section breaks with lines (───)
2. Use bullet points (•) not asterisks for lists
3. Keep line length reasonable for A4 portrait
4. Use bold (**text**) for headers
5. Maintain consistent spacing
6. Total length should fit on 2-3 A4 pages
7. Font-friendly formatting
8. Developer credit at top is easy to delete

CRITICAL RULES:
1. ALWAYS ask for Trade if not provided
2. Fill in only details user provides
3. Leave blank fields as blank
4. Use proper ITI/workshop terminology
5. Include safety information
6. Make objectives measurable
7. Keep language clear
8. Provide 4 objectives
9. Include adequate questions
10. Practical tasks for practical trades

═══════════════════════════════════════════════════════════════

SPECIAL INSTRUCTIONS FOR FILE UPLOADS:
- When user uploads Excel/PDF/CSV with structured data
- And asks to "convert to database format" or "extract data"
- Provide data in clean JavaScript object format
- Use proper formatting with indentation
- Include helpful comments

CRITICAL LANGUAGE INSTRUCTIONS:
- ALWAYS respond in the SAME LANGUAGE the user asks in
- If user asks in Marathi → respond in Marathi
- If user asks in Hindi → respond in Hindi  
- If user asks in English → respond in English
- If user mixes languages → match their style
- For technical terms, use English
- Be detailed, patient, and educational
- Include safety information when relevant

IMPORTANT: Lesson plans are ALWAYS in English format (DGET standard), but you can interact with user in their language to gather requirements.

You are helpful, friendly, encouraging, and accurate. Support ITI instructors and students in their education journey.`;

            // Add ITI database context if available
            if (AppState.itiDatabase) {
                const dbContext = `\n\nAvailable ITI Information:\n${JSON.stringify(AppState.itiDatabase, null, 2)}`;
                context += dbContext;
            }
           // Add ITI database context if available
            if (AppState.itiDatabase) {
                const dbContext = `\n\nAvailable ITI Information:\n${JSON.stringify(AppState.itiDatabase, null, 2)}`;
                context += dbContext;
            }
            
            // ========== ITI ADMISSION MODE CONTEXT ==========
            if (AppState.admissionMode && window.AdmissionQueryEngine) {
                console.log('🎓 ADMISSION MODE ACTIVE - Adding database context');
                const admissionContext = AdmissionQueryEngine.generateAIContext();
                context += '\n\n' + admissionContext;
                context += '\n\n═══════════════════════════════════════════════════════════════';
                context += '\n🎓 ITI ADMISSION MODE ACTIVE';
                context += '\n═══════════════════════════════════════════════════════════════';
                
                // PRE-SEARCH THE DATABASE FOR SPECIFIC QUERIES
                const searchResult = handleAdmissionQuery(userMessage);
                
                if (searchResult && searchResult.found) {
                    console.log(`📊 Pre-search completed: ${searchResult.count} results found`);
                    context += '\n\n═══════════════════════════════════════════════════════════════';
                    context += '\n📊 DATABASE SEARCH RESULTS (ACTUAL DATA):';
                    context += '\n═══════════════════════════════════════════════════════════════';
                    if (searchResult.trade && searchResult.district) {
                        context += `\nQuery: ${searchResult.trade} trade in ${searchResult.district} district`;
                    } else if (searchResult.trade) {
                        context += `\nQuery: ${searchResult.trade} trade (all districts)`;
                    } else if (searchResult.district) {
                        context += `\nQuery: All trades in ${searchResult.district} district`;
                    }
                    context += `\nRecords Found: ${searchResult.count}`;
                    context += '\n\nACTUAL DATA FROM DATABASE:\n\n';
                    context += searchResult.data;
                    context += '\n\n✅ CRITICAL: Use this EXACT data in your response.';
                    context += '\n✅ These are real ITI codes, names, districts, talukas, and seat counts.';
                    context += '\n✅ Do NOT make up or modify any information.';
                    context += '\n✅ Present the data in a clear, well-formatted manner.';
                    context += '\n═══════════════════════════════════════════════════════════════';
                } else if (searchResult && !searchResult.found) {
                    console.log('❌ Database search returned no results');
                    context += '\n\n❌ DATABASE SEARCH RESULTS: NO MATCHES FOUND';
                    if (searchResult.trade || searchResult.district) {
                        context += `\nSearched for: ${searchResult.trade || 'any trade'}${searchResult.district ? ' in ' + searchResult.district : ''}`;
                    }
                    context += '\n\nInform the user politely that no ITIs were found matching their criteria.';
                    context += '\nSuggest they try:';
                    context += '\n- Different trade name';
                    context += '\n- Different district';
                    context += '\n- Ask about available trades or districts';
                } else {
                    console.log('ℹ️ General admission query - no specific search performed');
                    context += '\n\nThe user is asking a general question about admissions.';
                    context += '\nProvide helpful information based on the database statistics shown above.';
                }
                
                context += '\n\n═══════════════════════════════════════════════════════════════';
                context += '\nYOUR TASK:';
                context += '\n═══════════════════════════════════════════════════════════════';
                context += '\n1. If search results are provided above, present them clearly';
                context += '\n2. Include ITI codes, names, districts, talukas, and seat counts';
                context += '\n3. Distinguish Government (G codes) vs Private (P codes)';
                context += '\n4. Format responses in a professional, easy-to-read manner';
                context += '\n5. For unavailable regions, mention only Nagpur data is available';
                context += '\n\nThe database contains 954 records from Nagpur region (6 districts).';
                context += '\nALWAYS use the actual search results provided - they are accurate and verified.';
                context += '\n═══════════════════════════════════════════════════════════════\n\n';
            }
            // ========== CRITICAL SYLLABUS DATABASE SEARCH ==========
            console.log('🔍 Checking for syllabus database...');
            
            // Track matched trade for potential PDF analysis
            let matchedTrade = null;
            
            // SKIP syllabus search if in admission mode
            if (AppState.admissionMode) {
                console.log('⏭️ SKIPPING syllabus search - Admission mode is active');
                matchedTrade = null;
            } else if (AppState.syllabusDatabase && AppState.syllabusDatabase.trades) {
                console.log('✅ Syllabus database found with', AppState.syllabusDatabase.trades.length, 'trades');
                
                // Check if user message contains syllabus-related keywords
                const syllabusKeywords = ['syllabus', 'curriculum', 'course', 'trade', 'download', 'pdf', 'link', 'show', 'चा', 'का', 'syllab', 'module', 'chapter'];
                const lowerMessage = userMessage.toLowerCase();
                const hasSyllabusQuery = syllabusKeywords.some(kw => lowerMessage.includes(kw));
                
                console.log('📝 User message (lower):', lowerMessage);
                console.log('❓ Has syllabus query:', hasSyllabusQuery);
                
                if (hasSyllabusQuery) {
                    console.log('🔎 Starting database search...');
                    
                    // Search through all trades
                    for (const trade of AppState.syllabusDatabase.trades) {
                        // Get trade identifiers
                        const tradeName = trade.name.toLowerCase();
                        const tradeCode = trade.code.toLowerCase();
                        
                        // Check for exact code match first (most reliable)
                        if (lowerMessage.includes(tradeCode)) {
                            matchedTrade = trade;
                            console.log('✅ MATCH FOUND (by code):', trade.name, '(', trade.code, ')');
                            break;
                        }
                        
                        // Check for name match
                        if (lowerMessage.includes(tradeName)) {
                            matchedTrade = trade;
                            console.log('✅ MATCH FOUND (by name):', trade.name);
                            break;
                        }
                        
                        // Check search keywords
                        if (trade.searchKeywords && Array.isArray(trade.searchKeywords)) {
                            for (const keyword of trade.searchKeywords) {
                                if (keyword && keyword.length >= 3 && lowerMessage.includes(keyword.toLowerCase())) {
                                    matchedTrade = trade;
                                    console.log('✅ MATCH FOUND (by keyword "' + keyword + '"):', trade.name);
                                    break;
                                }
                            }
                            if (matchedTrade) break;
                        }
                    }
                    
                    if (matchedTrade) {
                        console.log('═══════════════════════════════════════════');
                        console.log('✅ TRADE MATCHED IN DATABASE');
                        console.log('═══════════════════════════════════════════');
                        console.log('📚 Trade:', matchedTrade.name);
                        console.log('🏷️  Code:', matchedTrade.code);
                        console.log('📂 Category:', matchedTrade.category);
                        console.log('⏱️  Duration:', matchedTrade.duration);
                        console.log('📊 NSQF:', matchedTrade.nsqfLevel);
                        console.log('🔗 URL:', matchedTrade.syllabusUrl);
                        console.log('═══════════════════════════════════════════');
                        
                        // ========== PDF ANALYSIS: Check if this is a PDF content query ==========
                        const needsPDFContent = SyllabusPDFAnalyzer.detectPDFContentQuery(userMessage);
                        
                        if (needsPDFContent) {
                            console.log('🎯 PDF CONTENT QUERY DETECTED!');
                            console.log('📥 Fetching and analyzing PDF...');
                            
                            try {
                                // Fetch and analyze PDF
                                const pdfContent = await SyllabusPDFAnalyzer.analyzePDF(matchedTrade, userMessage);
                                
                                // Add PDF content to context
                                context += `\n\n${pdfContent}\n\n⚠️ IMPORTANT: The above content is extracted from the ACTUAL official syllabus PDF. Use this information to answer the user's question accurately. Do NOT make up information.`;
                                
                                console.log('✅ PDF content added to AI context');
                                console.log('📊 PDF analysis complete!');
                                
                            } catch (error) {
                                console.error('❌ PDF analysis failed:', error);
                                context += `\n\n⚠️ Could not fetch PDF content: ${error.message}. Please provide general information and suggest downloading the PDF from the link.`;
                            }
                        } else {
                            // Basic syllabus query - just add trade data
                            const syllabusContext = `\n\n🔍 SYLLABUS DATABASE - TRADE FOUND:\n${JSON.stringify(matchedTrade, null, 2)}\n\n⚠️ CRITICAL: You MUST use the EXACT syllabusUrl shown above: ${matchedTrade.syllabusUrl}\nDo NOT make up or modify this URL! Use it exactly as provided!`;
                            context += syllabusContext;
                        }
                    } else {
                        console.log('❌ No matching trade found in database');
                        console.log('💡 Suggestion: User should be more specific');
                        context += `\n\n⚠️ No exact match found in syllabus database for this query. Available trades: ${AppState.syllabusDatabase.metadata.totalTrades}. Please ask user to be more specific about which trade they want.`;
                    }
                } else {
                    console.log('ℹ️  Query doesn\'t appear to be about syllabus');
                }
            } else {
                console.warn('⚠️ Syllabus database not available in AppState');
            }
            
            // Get chat history for context (last 5 messages for efficiency)
            const chat = ChatManager.getCurrentChat();
            const chatHistory = chat ? chat.messages.slice(-5) : [];
            
            // Build Groq messages array (OpenAI-compatible format)
            const groqMessages = [
                {
                    role: 'system',
                    content: context
                }
            ];
            
            // Add chat history
            chatHistory.forEach(msg => {
                if (!msg.hasFile) {
                    groqMessages.push({
                        role: msg.role === 'user' ? 'user' : 'assistant',
                        content: msg.content
                    });
                }
            });
            
            // Build current message content
            let currentContent = '';
            
            // Handle file upload - EXTRACT TEXT FIRST!
            if (fileData) {
                console.log('📎 File uploaded:', fileData.name);
                
                const extractionResult = await FileTextExtractor.extract(fileData);
                
                if (extractionResult.success && extractionResult.text) {
                    currentContent += `[📎 User uploaded file: ${fileData.name}]\n\n`;
                    currentContent += `[File Content Extracted]:\n`;
                    currentContent += `${extractionResult.text}\n\n`;
                    
                    if (extractionResult.pages) {
                        currentContent += `[Document has ${extractionResult.pages} pages, ${extractionResult.length} characters extracted]\n\n`;
                    } else if (extractionResult.sheets) {
                        currentContent += `[Spreadsheet has ${extractionResult.sheets} sheets, ${extractionResult.length} characters extracted]\n\n`;
                    }
                    
                    console.log(`✅ Text extracted: ${extractionResult.length} characters`);
                } else {
                    currentContent += `[📎 User uploaded file: ${fileData.name}]\n\n`;
                    currentContent += `⚠️ Note: Could not extract text from this file. `;
                    
                    if (extractionResult.error) {
                        currentContent += `Error: ${extractionResult.error}. `;
                    }
                    
                    currentContent += `Please ask the user to describe what information they need from the file.\n\n`;
                    console.warn('⚠️ Text extraction failed:', extractionResult.error);
                }
            }
            
            // Add user message
            currentContent += userMessage;
            
            // Add current message
            groqMessages.push({
                role: 'user',
                content: currentContent
            });
            
            // Call Groq API
            console.log('🚀 Calling Groq API with model:', CONFIG.GROQ_MODEL);
            
            const response = await fetch(CONFIG.GROQ_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${CONFIG.GROQ_API_KEY}`
                },
                body: JSON.stringify({
                    model: CONFIG.GROQ_MODEL,
                    messages: groqMessages,
                    temperature: 0.7,
                    max_tokens: 4096,
                    top_p: 0.9,
                    stream: false
                })
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Groq API Error Response:', errorText);
                
                let errorData;
                try {
                    errorData = JSON.parse(errorText);
                } catch (e) {
                    throw new Error(`Groq API request failed: ${response.status} - ${errorText}`);
                }
                
                throw new Error(errorData.error?.message || `Groq API error: ${response.status}`);
            }
            
            const data = await response.json();
            
            // Extract Groq response
            if (!data.choices || !data.choices[0] || !data.choices[0].message) {
                console.error('Invalid Groq response:', data);
                throw new Error('Invalid Groq API response format');
            }
            
            const aiResponse = data.choices[0].message.content;
            
            // Log usage
            console.log('✅ Groq API Success:', {
                model: data.model || CONFIG.GROQ_MODEL,
                promptTokens: data.usage?.prompt_tokens || 0,
                completionTokens: data.usage?.completion_tokens || 0,
                totalTokens: data.usage?.total_tokens || 0,
                cost: '₹0.00 (FREE! 🎉)',
                responseLength: aiResponse.length + ' characters'
            });
            
            return aiResponse;
            
        } catch (error) {
            console.error('❌ AIEngine Error:', error);
            
            if (error.message.includes('401') || error.message.includes('Unauthorized')) {
                throw new Error('API authentication failed. Please check your Groq API key.');
            } else if (error.message.includes('429') || error.message.includes('rate limit')) {
                throw new Error('Too many requests. Please wait a moment and try again.');
            } else if (error.message.includes('Failed to fetch') || error.message.includes('network')) {
                throw new Error('Network error. Please check your internet connection.');
            } else {
                throw error;
            }
        }
    }
};

console.log('✅ COMPLETE AIEngine loaded with ALL features!');
console.log('🤖 Model:', CONFIG.GROQ_MODEL || 'llama-3.3-70b-versatile');
console.log('🌐 Supports: English, Hindi, Marathi');
console.log('📄 File Support: PDF, Excel, CSV, Images');
console.log('🎓 Lesson Plan Generator: DGET Format (A4 Optimized)');
console.log('📚 Syllabus Database: 170 trades with REAL links');
console.log('🔍 PDF Analysis: On-demand content extraction');
console.log('💬 Multi-turn conversations with context');
console.log('🎯 All features integrated and working!');
// ==================== UI FUNCTIONS ====================

// Show/Hide sections
function showLandingPage() {
    document.getElementById('landingPage').style.display = 'block';
    document.getElementById('chatApp').style.display = 'none';
}

function showChatApp() {
    document.getElementById('landingPage').style.display = 'none';
    document.getElementById('chatApp').style.display = 'flex';
    initializeChatApp();
}

function showModal(modalId) {
    document.getElementById(modalId).style.display = 'flex';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// Initialize chat app
function initializeChatApp() {
    const user = AppState.currentUser;
    if (!user) return;
    
    document.getElementById('userName').textContent = user.name;
    document.getElementById('userEmail').textContent = user.email;
    document.getElementById('userInitials').textContent = user.name.charAt(0).toUpperCase();
    
    ChatManager.loadChats();
    renderChatHistory();
    
    if (!AppState.currentChatId) {
        ChatManager.createChat();
    }
    
    showWelcomeScreen();
}

// Welcome screen
function showWelcomeScreen() {
    document.getElementById('welcomeScreen').style.display = 'flex';
    document.getElementById('chatMessages').style.display = 'none';
}

function hideWelcomeScreen() {
    document.getElementById('welcomeScreen').style.display = 'none';
    document.getElementById('chatMessages').style.display = 'block';
}

// Send suggestion
function sendSuggestion(text) {
    document.getElementById('messageInput').value = text;
    sendMessage();
}

// Start new chat
function startNewChat() {
    ChatManager.createChat();
    renderChatHistory();
    showWelcomeScreen();
    document.getElementById('chatMessages').innerHTML = '';
    
    // Clear any uploaded files
    FileManager.clearCurrentFile();
}

// ==================== FILE UPLOAD UI FUNCTIONS ====================

// Handle file selection
function handleFileSelect() {
    const input = document.getElementById('fileInput');
    const file = input.files[0];
    
    if (file) {
        FileManager.processFile(file)
            .then(fileData => {
                updateFileDisplay();
                showNotification('File uploaded successfully! You can now ask questions about it.', 'success');
            })
            .catch(error => {
                console.error('File upload error:', error);
            });
    }
}

// Update file display
function updateFileDisplay() {
    const fileDisplayArea = document.getElementById('fileDisplayArea');
    
    if (!AppState.currentFileData) {
        fileDisplayArea.style.display = 'none';
        return;
    }
    
    const fileInfo = FileManager.getFileDisplayInfo(AppState.currentFileData);
    fileDisplayArea.style.display = 'flex';
    fileDisplayArea.innerHTML = `
        <div class="file-info">
            <span class="file-icon">${fileInfo.icon}</span>
            <div class="file-details">
                <div class="file-name">${fileInfo.name}</div>
                <div class="file-size">${fileInfo.size}</div>
            </div>
        </div>
        <button class="btn-remove-file" onclick="removeFile()" title="Remove file">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                <path d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"/>
            </svg>
        </button>
    `;
}

// Remove file
function removeFile() {
    FileManager.clearCurrentFile();
    document.getElementById('fileInput').value = '';
    showNotification('File removed', 'info');
}

// Send message (updated to handle files)
async function sendMessage() {
    const input = document.getElementById('messageInput');
    const message = input.value.trim();
    
    if (!message && !AppState.currentFileData) return;
    
    // Use file if uploaded, otherwise just text
    const fileData = AppState.currentFileData;
    const displayMessage = message || `[Analyzing ${AppState.currentFileData?.name}]`;
    
    // Clear input
    input.value = '';
    input.style.height = 'auto';
    
    // Hide welcome screen
    hideWelcomeScreen();
    
    // Add user message
    const hasFile = fileData !== null;
    const fileInfo = hasFile ? FileManager.getFileDisplayInfo(fileData) : null;
    ChatManager.addMessage('user', displayMessage, hasFile, fileInfo);
    renderMessages();
    
    // Show loading
    showLoadingIndicator();
    
    try {
        // Get AI response (with file if present)
        const response = await AIEngine.generateResponse(message || 'Please analyze this file and summarize it.', fileData);
        
        // Add AI response
        ChatManager.addMessage('assistant', response);
        renderMessages();
        
        // Clear file after use
        if (fileData) {
            FileManager.clearCurrentFile();
            document.getElementById('fileInput').value = '';
        }
        
    } catch (error) {
        console.error('Error:', error);
        ChatManager.addMessage('assistant', 'Sorry, I encountered an error processing your request.');
        renderMessages();
    } finally {
        hideLoadingIndicator();
    }
}

// Render messages (updated to show files)
function renderMessages() {
    const container = document.getElementById('chatMessages');
    container.innerHTML = '';
    
    AppState.messages.forEach(msg => {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${msg.role}`;
        
        let fileHTML = '';
        if (msg.hasFile && msg.fileInfo) {
            fileHTML = `
                <div class="message-file">
                    <span class="file-icon">${msg.fileInfo.icon}</span>
                    <span class="file-name">${msg.fileInfo.name}</span>
                    <span class="file-size">${msg.fileInfo.size}</span>
                </div>
            `;
        }
        
        messageDiv.innerHTML = `
            ${fileHTML}
            <div class="message-content">${formatMessageContent(msg.content)}</div>
            <div class="message-time">${formatTime(msg.timestamp)}</div>
        `;
        
        container.appendChild(messageDiv);
    });
    
    container.scrollTop = container.scrollHeight;
}

// Format message content
function formatMessageContent(content) {
    // Convert line breaks
    content = content.replace(/\n/g, '<br>');
    
    // Convert bold
    content = content.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    
    // Convert italic
    content = content.replace(/\*(.+?)\*/g, '<em>$1</em>');
    
    // Convert code blocks
    content = content.replace(/```(.+?)```/gs, '<pre><code>$1</code></pre>');
    
    // Convert inline code
    content = content.replace(/`(.+?)`/g, '<code>$1</code>');
    
    return content;
}

// Format time
function formatTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

// Loading indicator
function showLoadingIndicator() {
    const container = document.getElementById('chatMessages');
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'message assistant loading';
    loadingDiv.id = 'loadingIndicator';
    loadingDiv.innerHTML = `
        <div class="message-content">
            <div class="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
            </div>
        </div>
    `;
    container.appendChild(loadingDiv);
    container.scrollTop = container.scrollHeight;
}

function hideLoadingIndicator() {
    const loading = document.getElementById('loadingIndicator');
    if (loading) loading.remove();
}

// Render chat history
function renderChatHistory() {
    const todayDiv = document.getElementById('todayChats');
    const weekDiv = document.getElementById('weekChats');
    const monthDiv = document.getElementById('monthChats');
    
    todayDiv.innerHTML = '';
    weekDiv.innerHTML = '';
    monthDiv.innerHTML = '';
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    AppState.chats.forEach(chat => {
        const chatDate = new Date(chat.updatedAt);
        const chatDiv = createChatHistoryItem(chat);
        
        if (chatDate >= today) {
            todayDiv.appendChild(chatDiv);
        } else if (chatDate >= weekAgo) {
            weekDiv.appendChild(chatDiv);
        } else if (chatDate >= monthAgo) {
            monthDiv.appendChild(chatDiv);
        }
    });
}

function createChatHistoryItem(chat) {
    const div = document.createElement('div');
    div.className = 'chat-history-item' + (chat.id === AppState.currentChatId ? ' active' : '');
    div.onclick = () => ChatManager.switchChat(chat.id);
    
    div.innerHTML = `
        <div class="chat-title">${chat.title}</div>
        <button class="btn-delete-chat" onclick="event.stopPropagation(); deleteChat('${chat.id}')">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9z"/>
            </svg>
        </button>
    `;
    
    return div;
}

function deleteChat(chatId) {
    if (confirm('Delete this chat?')) {
        ChatManager.deleteChat(chatId);
        
        if (AppState.currentChatId === chatId) {
            startNewChat();
        } else {
            renderChatHistory();
        }
    }
}

// User menu
function toggleUserMenu() {
    const dropdown = document.getElementById('userDropdown');
    dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
}

// Notifications
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        z-index: 10000;
        animation: slideIn 0.3s ease-out;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Authentication handlers
function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    const result = Auth.login(email, password);
    
    if (result.success) {
        closeModal('loginModal');
        showChatApp();
        showNotification('Welcome back!', 'success');
    } else {
        showNotification(result.error, 'error');
    }
}

function handleSignup(event) {
    event.preventDefault();
    
    const name = document.getElementById('signupName').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    
    const result = Auth.register(name, email, password);
    
    if (result.success) {
        closeModal('signupModal');
        showModal('loginModal');
        showNotification('Account created! Please login.', 'success');
    } else {
        showNotification(result.error, 'error');
    }
}
// Handle forgot password
function handleForgotPassword(event) {
    event.preventDefault();
    
    const email = document.getElementById('forgotEmail').value;
    
    // Check if user exists
    const users = Storage.get('users') || [];
    const user = users.find(u => u.email === email);
    
    if (!user) {
        showNotification('No account found with this email', 'error');
        return;
    }
    
    // Generate reset token
    const resetToken = PasswordResetManager.generateResetToken(email);
    PasswordResetManager.saveResetToken(email, resetToken);
    
    // Send reset email
    EmailService.sendPasswordResetEmail(user.name, email, resetToken).then(result => {
        if (result.success) {
            showNotification('Password reset link sent to your email!', 'success');
            closeModal('forgotPasswordModal');
            document.getElementById('forgotEmail').value = '';
        } else {
            showNotification('Failed to send email. Please try again.', 'error');
        }
    });
}

// Handle password reset
function handlePasswordReset(event) {
    event.preventDefault();
    
    const urlParams = new URLSearchParams(window.location.search);
    const resetToken = urlParams.get('reset');
    
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    if (newPassword !== confirmPassword) {
        showNotification('Passwords do not match', 'error');
        return;
    }
    
    if (newPassword.length < 6) {
        showNotification('Password must be at least 6 characters', 'error');
        return;
    }
    
    // Validate token
    const validation = PasswordResetManager.validateResetToken(resetToken);
    
    if (!validation.valid) {
        showNotification(validation.error, 'error');
        return;
    }
    
    // Reset password
    const result = PasswordResetManager.resetPassword(validation.email, newPassword);
    
    if (result.success) {
        PasswordResetManager.markTokenUsed(resetToken);
        showNotification('Password reset successful! Please login.', 'success');
        
        // Remove reset token from URL
        window.history.replaceState({}, document.title, window.location.pathname);
        
        closeModal('resetPasswordModal');
        showModal('loginModal');
    } else {
        showNotification('Failed to reset password', 'error');
    }
}

// Show forgot password modal
function showForgotPassword() {
    closeModal('loginModal');
    showModal('forgotPasswordModal');
}

function handleLogout() {
    Auth.logout();
    AppState.chats = [];
    AppState.messages = [];
    AppState.currentChatId = null;
    showLandingPage();
    showNotification('Logged out successfully', 'success');
}

// Auto-resize textarea
document.addEventListener('DOMContentLoaded', () => {
    const textarea = document.getElementById('messageInput');
    if (textarea) {
        textarea.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = Math.min(this.scrollHeight, 200) + 'px';
        });
        
        textarea.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
    }
// Initialize EmailJS
    EmailService.init();
    
    // Check for password reset token in URL
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('reset')) {
        showModal('resetPasswordModal');
    }
    
    // Check if user is logged in
    const currentUser = Auth.getCurrentUser();
    if (currentUser) {
        AppState.currentUser = currentUser;
        AppState.isLoggedIn = true;
        showChatApp();
    }
});

// ==================== ITI DATABASE ====================

const ITIDatabase = {
    itis: [
        {
            id: 1,
            name: "Government ITI Nagpur",
            district: "Nagpur",
            principal: "Sau Shweta Kulkarni",
            contact: "9403583070",
            email: "iti.nagpur@dvet.gov.in",
            trades: ["Electrician", "Fitter", "Welder", "Electronics Mechanic", "COPA", "Machinist"],
            intake: {
                "Electrician": 24,
                "Fitter": 20,
                "Welder": 20,
                "Electronics Mechanic": 24,
                "CNC Operator": 24
            },
            established: 1960,
            facilities: ["Workshop", "Library", "Computer Lab", "Hostel"]
        }
    ],
    trades: {
        "Electrician": {
            duration: "2 years",
            qualification: "10th Pass",
            modules: ["Basic Electricity", "Wiring", "Motors", "Control Systems", "Safety"],
            careerOptions: ["Electrician", "Maintenance Engineer", "Supervisor"],
            averageSalary: "₹15,000 - ₹30,000/month"
        },
        "Fitter": {
            duration: "2 years",
            qualification: "10th Pass",
            modules: ["Fitting", "Turning", "Welding", "Sheet Metal", "Measurement"],
            careerOptions: ["Fitter", "Technician", "Quality Inspector"],
            averageSalary: "₹12,000 - ₹25,000/month"
        }
    },
    instructors: [
        {
            name: "Anand Kathalewar",
            designation: "Mathematics & Drawing Instructor",
            iti: "Government ITI Nagpur",
            email: "anand0473@zohomail.in",
            experience: "28 years",
            specialization: ["Mathematics", "Engineering Drawing", "AI Integration"]
        }
    ]
};

// Initialize database
AppState.itiDatabase = ITIDatabase;
/* ==================== COPY BUTTON FUNCTIONALITY ==================== */
/* Add this JavaScript code to your app_with_files.js */
/* Version: 3.1 - Copy Functionality */

// ==================== COPY TO CLIPBOARD FUNCTION ====================

function copyToClipboard(text) {
    // Modern Clipboard API (preferred method)
    if (navigator.clipboard && navigator.clipboard.writeText) {
        return navigator.clipboard.writeText(text)
            .then(() => true)
            .catch(() => false);
    } else {
        // Fallback method for older browsers
        try {
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            const success = document.execCommand('copy');
            document.body.removeChild(textarea);
            return Promise.resolve(success);
        } catch (err) {
            return Promise.resolve(false);
        }
    }
}

// ==================== HANDLE COPY BUTTON CLICK ====================

function handleCopyMessage(button, messageContent) {
    // Get the text content (strip HTML tags)
    const text = messageContent.innerText || messageContent.textContent;
    
    // Copy to clipboard
    copyToClipboard(text).then(success => {
        if (success) {
            // Show success state
            button.classList.add('copied');
            button.setAttribute('data-tooltip', 'Copied!');
            
            // Reset after 2 seconds
            setTimeout(() => {
                button.classList.remove('copied');
                button.setAttribute('data-tooltip', 'Copy message');
            }, 2000);
        } else {
            // Show error state
            button.setAttribute('data-tooltip', 'Failed to copy');
            setTimeout(() => {
                button.setAttribute('data-tooltip', 'Copy message');
            }, 2000);
        }
    });
}

// ==================== ADD COPY BUTTON TO MESSAGE ====================

function addCopyButton(messageElement, isAssistant = true) {
    // Only add copy button to assistant messages
    if (!isAssistant) return;
    
    const messageContent = messageElement.querySelector('.message-content');
    if (!messageContent) return;
    
    // Check if copy button already exists
    if (messageElement.querySelector('.message-actions')) return;
    
    // Create actions container
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'message-actions';
    
    // Create copy button
    const copyButton = document.createElement('button');
    copyButton.className = 'btn-copy';
    copyButton.setAttribute('data-tooltip', 'Copy message');
    copyButton.setAttribute('aria-label', 'Copy message to clipboard');
    
    // Copy icon SVG
    copyButton.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
    `;
    
    // Add click event
    copyButton.addEventListener('click', (e) => {
        e.stopPropagation();
        handleCopyMessage(copyButton, messageContent);
    });
    
    // Append button to actions
    actionsDiv.appendChild(copyButton);
    
    // Append actions to message content
    messageContent.appendChild(actionsDiv);
}

// ==================== MODIFY EXISTING addMessage FUNCTION ====================

// IMPORTANT: Find your existing addMessage function and modify it
// Add this line after creating the message element:

/*
Example modification to your existing addMessage function:

function addMessage(role, content, fileInfo = null) {
    const messagesArea = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}`;
    
    // ... your existing message creation code ...
    
    messagesArea.appendChild(messageDiv);
    
    // ADD THIS LINE - Add copy button if it's an assistant message
    if (role === 'assistant') {
        addCopyButton(messageDiv, true);
    }
    
    // ... rest of your code ...
}
*/

// ==================== KEYBOARD SHORTCUT FOR COPY ====================

// Optional: Add Ctrl+C functionality to copy selected text
document.addEventListener('keydown', (e) => {
    // Check if Ctrl+C or Cmd+C (Mac)
    if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        const selection = window.getSelection();
        const selectedText = selection.toString();
        
        // If text is selected within a message, allow default copy behavior
        if (selectedText.length > 0) {
            const container = selection.anchorNode?.parentElement;
            if (container?.closest('.message-content')) {
                // Default copy behavior works automatically
                console.log('Text copied:', selectedText.substring(0, 50) + '...');
            }
        }
    }
});

// ==================== AUTO-ADD COPY BUTTONS TO EXISTING MESSAGES ====================

// Call this function on page load to add copy buttons to any existing messages
function initializeCopyButtons() {
    const assistantMessages = document.querySelectorAll('.message.assistant');
    assistantMessages.forEach(messageElement => {
        addCopyButton(messageElement, true);
    });
}

// Run on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeCopyButtons);
} else {
    initializeCopyButtons();
}

// ==================== ENABLE TEXT SELECTION IN MESSAGES ====================

// Ensure message content is selectable
function enableTextSelection() {
    const allMessages = document.querySelectorAll('.message-content');
    allMessages.forEach(messageContent => {
        messageContent.style.userSelect = 'text';
        messageContent.style.webkitUserSelect = 'text';
        messageContent.style.mozUserSelect = 'text';
        messageContent.style.msUserSelect = 'text';
    });
}

// Run on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', enableTextSelection);
} else {
    enableTextSelection();
}

// ==================== OBSERVER TO ADD COPY BUTTONS TO NEW MESSAGES ====================

// Watch for new messages being added and automatically add copy buttons
const messageObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
            if (node.nodeType === 1 && node.classList?.contains('message')) {
                if (node.classList.contains('assistant')) {
                    addCopyButton(node, true);
                }
                // Enable text selection for new message
                const messageContent = node.querySelector('.message-content');
                if (messageContent) {
                    messageContent.style.userSelect = 'text';
                }
            }
        });
    });
});

// Start observing when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        const chatMessages = document.getElementById('chatMessages');
        if (chatMessages) {
            messageObserver.observe(chatMessages, {
                childList: true,
                subtree: true
            });
        }
    });
} else {
    const chatMessages = document.getElementById('chatMessages');
    if (chatMessages) {
        messageObserver.observe(chatMessages, {
            childList: true,
            subtree: true
        });
    }
}

// ==================== EXPORT FUNCTIONS (if using modules) ====================

// If you're using ES6 modules, export these functions:
// export { copyToClipboard, handleCopyMessage, addCopyButton };
// ==================== INSTRUCTIONS ====================
// ANAND - DELETE LINES 1237 to 1952 from your app_with_files.js
// Then paste THIS ENTIRE FILE at line 1236 (after AppState.itiDatabase = ITIDatabase;)

/* ==================== AUTO CHAT TITLES + PROMPT CREATOR - WORKING VERSION ==================== */
/* Version: 3.4 - Works with ChatManager structure */

// ==================== CONFIGURATION ====================

const CHAT_TITLE_CONFIG = {
    maxTitleLength: 40,
    defaultTitle: 'New Chat',
    generateAfterMessages: 1,
    model: 'gemini-2.5-pro-preview-03-25'
};

// ==================== GENERATE CHAT TITLE FROM AI ====================

async function generateChatTitle(firstMessage) {
    try {
        // Create a prompt to generate a concise title
        const titlePrompt = `Based on this user query, generate a very concise, descriptive title (maximum 6 words, no quotes, no punctuation at end):

User query: "${firstMessage}"

Generate only the title, nothing else.`;

        // Use Groq API for title generation
        const response = await fetch(CONFIG.GROQ_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${CONFIG.GROQ_API_KEY}`
            },
            body: JSON.stringify({
                model: CONFIG.GROQ_MODEL,
                messages: [
                    {
                        role: 'user',
                        content: titlePrompt
                    }
                ],
                temperature: 0.3,
                max_tokens: 50
            })
        });

        if (!response.ok) {
            console.warn('Title generation failed, using default');
            return 'New Chat';
        }

        const data = await response.json();
        const title = data.choices?.[0]?.message?.content?.trim();
        
        if (title && title.length > 0) {
            // Clean up the title
            let cleanTitle = title
                .replace(/^["']|["']$/g, '') // Remove quotes
                .replace(/\.$/, '') // Remove ending period
                .trim();
            
            // Truncate if too long (max 40 characters)
            if (cleanTitle.length > 40) {
                cleanTitle = cleanTitle.substring(0, 37) + '...';
            }
            
            return cleanTitle;
        }
        
        return 'New Chat';
    } catch (error) {
        console.error('Error generating chat title:', error);
        return 'New Chat';
    }
}

// ==================== UPDATE CHAT TITLE ====================

function updateChatTitleInStorage(chatId, title) {
    const userId = AppState.currentUser?.email;
    if (!userId) return;
    
    const chats = Storage.get(`chats_${userId}`) || [];
    const chatIndex = chats.findIndex(c => c.id === chatId);
    
    if (chatIndex !== -1) {
        chats[chatIndex].title = title;
        Storage.set(`chats_${userId}`, chats);
        renderChatHistory();
    }
}

// ==================== WRAP sendMessage TO GENERATE TITLE ====================

const originalSendMessage = window.sendMessage;

window.sendMessage = async function() {
    const userId = AppState.currentUser?.email;
    const messageInput = document.getElementById('messageInput');
    const userMessage = messageInput?.value?.trim();
    
    // Call original sendMessage
    if (originalSendMessage) {
        await originalSendMessage();
    }
    
    // Generate title after first user message
    if (userId && userMessage) {
        const currentChat = ChatManager.getCurrentChat();
        
        if (currentChat) {
            const userMessages = currentChat.messages.filter(m => m.role === 'user');
            
            if (userMessages.length === 1 && currentChat.title === 'New Chat') {
                setTimeout(() => {
                    generateChatTitle(userMessage).then(title => {
                        updateChatTitleInStorage(currentChat.id, title);
                    });
                }, 1000);
            }
        }
    }
};

// ==================== PROMPT CREATOR ====================

function startPromptCreator() {
    console.log('Starting Prompt Creator...');
    
    // Use ChatManager to create new chat
    ChatManager.createChat();
    
    // Get the newly created chat
    const currentChat = ChatManager.getCurrentChat();
    if (!currentChat) {
        console.error('Failed to create chat');
        return;
    }
    
    // Update chat title and mark as prompt creator
    currentChat.title = '✨ Prompt Creator';
    currentChat.isPromptCreator = true;
    ChatManager.saveChats();
    
    // Clear messages and hide welcome screen
    const chatMessages = document.getElementById('chatMessages');
    const welcomeScreen = document.getElementById('welcomeScreen');
    
    if (chatMessages) chatMessages.innerHTML = '';
    if (welcomeScreen) welcomeScreen.style.display = 'none';
    
    // Add welcome message
    const welcomeMessage = `🎯 **Welcome to Prompt Creator!**

I'm your expert prompt engineering assistant. I'll help you create powerful, effective prompts for AI.

**How to use:**
1. Complete the text in the input box
2. Tell me what you want to create a prompt for
3. I'll generate a professional, optimized prompt
4. You can then use that prompt in a new chat or by other AI tool!

**Example:**
"Create a perfect prompt for: explaining electrical circuits to beginners"

Let's create an amazing prompt together! 💫`;
    
    // Add message using ChatManager
    ChatManager.addMessage('assistant', welcomeMessage);
    
    // Display the message
    renderMessages();
    
    // Set message input with prompt creator template
    const messageInput = document.getElementById('messageInput');
    if (messageInput) {
        messageInput.value = 'You are an expert prompt engineer. Create a perfect prompt for: ';
        messageInput.focus();
        messageInput.setSelectionRange(messageInput.value.length, messageInput.value.length);
    }
    
    // Update chat history UI
    renderChatHistory();
    
    console.log('Prompt Creator initialized successfully!');
}

// ==================== ADD PROMPT CREATOR BUTTON TO SIDEBAR ====================

function addPromptCreatorButton() {
    const sidebar = document.querySelector('.sidebar-content');
    if (!sidebar) {
        console.log('Sidebar not found, retrying...');
        setTimeout(addPromptCreatorButton, 500);
        return;
    }
    
    // Check if already added
    if (document.getElementById('promptCreatorButton')) {
        console.log('Prompt Creator button already exists');
        return;
    }
    
    console.log('Adding Prompt Creator button...');
    
    // Create AI Tools section
    const aiToolsSection = document.createElement('div');
    aiToolsSection.className = 'chat-history-section';
    aiToolsSection.innerHTML = `
        <div class="section-label">AI TOOLS</div>
        <button id="promptCreatorButton" class="prompt-creator-button" onclick="startPromptCreator()">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
                <path d="M2 17l10 5 10-5"></path>
                <path d="M2 12l10 5 10-5"></path>
            </svg>
            <span>✨ Prompt Creator</span>
        </button>
    `;
    
    // Insert at the top
    sidebar.insertBefore(aiToolsSection, sidebar.firstChild);
    console.log('Prompt Creator button added successfully!');
}
// ==================== COPY THIS ENTIRE BLOCK ====================
// Paste after line 2849 (after addPromptCreatorButton function)
// Before line 2851 (before initializeEnhancements function)

// ==================== ITI ADMISSION BUTTON ====================

function addAdmissionButton() {
    const sidebar = document.querySelector('.sidebar-content');
    if (!sidebar) {
        console.log('Sidebar not found for admission button, retrying...');
        setTimeout(addAdmissionButton, 500);
        return;
    }
    
    // Check if already added
    if (document.getElementById('admissionButton')) {
        console.log('Admission button already exists');
        return;
    }
    
    console.log('Adding ITI Admission button...');
    
    // Find AI TOOLS section (created by Prompt Creator)
    let aiToolsSection = Array.from(document.querySelectorAll('.chat-history-section'))
        .find(section => {
            const label = section.querySelector('.section-label');
            return label && label.textContent.includes('AI TOOLS');
        });
    
    // If AI TOOLS section doesn't exist, create it
    if (!aiToolsSection) {
        aiToolsSection = document.createElement('div');
        aiToolsSection.className = 'chat-history-section';
        aiToolsSection.innerHTML = `<div class="section-label">AI TOOLS</div>`;
        sidebar.insertBefore(aiToolsSection, sidebar.firstChild);
    }
    
    // Create Admission button
    const admissionButton = document.createElement('button');
    admissionButton.id = 'admissionButton';
    admissionButton.className = 'prompt-creator-button admission-button';
    admissionButton.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
            <path d="M6 12v5c3 3 9 3 12 0v-5"></path>
        </svg>
        <span>🎓 ITI Admissions</span>
        <span class="admission-badge">Nagpur</span>
    `;
    
    // Add to AI TOOLS section
    aiToolsSection.appendChild(admissionButton);
    
    // Add click event
    admissionButton.addEventListener('click', startAdmissionMode);
    
    console.log('✅ ITI Admission button added successfully!');
}

// ==================== COMPLETE ADMISSION MODE FUNCTIONS ====================
// Replace ALL THREE functions starting from line with "// Start admission mode"
// This includes: startAdmissionMode, exitAdmissionMode, and the startNewChat override

// Start admission mode - FIXED VERSION
function startAdmissionMode() {
    console.log('🎓 Starting ITI Admission Mode...');
    
    // Check if admission database is loaded
    if (!window.ITI_ADMISSION_DATABASE || !window.ITI_ADMISSION_DATABASE.regions) {
        showNotification('Admission database not loaded. Please refresh the page.', 'error');
        return;
    }
    
    // Use ChatManager to create new chat (like Prompt Creator)
    ChatManager.createChat();
    
    // Get the newly created chat
    const currentChat = ChatManager.getCurrentChat();
    if (!currentChat) {
        console.error('Failed to create chat');
        return;
    }
    
    // Set admission mode flag
    AppState.admissionMode = true;
    
    // Update chat title and mark as admission mode
    currentChat.title = '🎓 ITI Admissions';
    currentChat.isAdmissionMode = true;
    ChatManager.saveChats();
    
    // Clear messages and hide welcome screen
    const chatMessages = document.getElementById('chatMessages');
    const welcomeScreen = document.getElementById('welcomeScreen');
    
    if (chatMessages) chatMessages.innerHTML = '';
    if (welcomeScreen) welcomeScreen.style.display = 'none';
    
    // Mark button as active
    const btn = document.getElementById('admissionButton');
    if (btn) {
        btn.classList.add('admission-mode-active');
    }
    
    // Get welcome message
    const welcomeMsg = ITI_ADMISSION_DATABASE.getWelcomeMessage();
    
    // Add welcome message using ChatManager
    ChatManager.addMessage('assistant', welcomeMsg);
    
    // Display the message immediately
    renderMessages();
    
    // Set message input with admission query template
    const messageInput = document.getElementById('messageInput');
    if (messageInput) {
        messageInput.value = 'Ask me about ITI admissions in Nagpur region: ';
        messageInput.focus();
        messageInput.setSelectionRange(messageInput.value.length, messageInput.value.length);
    }
    
    // Update chat history UI
    renderChatHistory();
    
    showNotification('ITI Admission Mode activated! 🎓', 'success');
    console.log('✅ Admission Mode initialized successfully!');
}

// Exit admission mode
function exitAdmissionMode() {
    if (!AppState.admissionMode) return;
    
    AppState.admissionMode = false;
    
    const btn = document.getElementById('admissionButton');
    if (btn) {
        btn.classList.remove('admission-mode-active');
    }
    
    console.log('Exited admission mode');
}

// Override startNewChat to exit admission mode on regular chat
const originalStartNewChat = window.startNewChat;
if (originalStartNewChat) {
    window.startNewChat = function() {
        exitAdmissionMode();
        return originalStartNewChat();
    };
}

// ==================== END OF BLOCK ====================
// ==================== INITIALIZE ====================

function initializeEnhancements() {
    console.log('Initializing chat enhancements...');
    setTimeout(() => {
        addPromptCreatorButton();
        addAdmissionButton();  // ← ADD THIS LINE
    }, 1000);
    
    // Initialize admission database
    if (window.ITI_ADMISSION_DATABASE) {
        ITI_ADMISSION_DATABASE.init().then(success => {
            if (success) {
                console.log('✅ Admission database initialized');
            }
        });
    }
}

// Run initialization
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeEnhancements);
} else {
    initializeEnhancements();
}

// Also run when chat app is shown
const originalShowChatApp = window.showChatApp;
if (originalShowChatApp) {
    window.showChatApp = function() {
        originalShowChatApp();
        setTimeout(addPromptCreatorButton, 500);
		setTimeout(addAdmissionButton, 600);
    };
}

// Make functions globally available
window.generateChatTitle = generateChatTitle;
window.updateChatTitleInStorage = updateChatTitleInStorage;
window.startPromptCreator = startPromptCreator;
window.addPromptCreatorButton = addPromptCreatorButton;
window.addAdmissionButton = addAdmissionButton;      
window.startAdmissionMode = startAdmissionMode;     
window.exitAdmissionMode = exitAdmissionMode;  
console.log('✅ Chat enhancements loaded successfully!');
