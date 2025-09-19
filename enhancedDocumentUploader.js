/**
 * Enhanced Document Uploader
 * Handles file uploads with drag & drop, file validation, and progress tracking
 */
class DocumentUploader {
    constructor() {
        // UI Elements
        this.modal = document.getElementById('upload-modal');
        this.form = document.getElementById('upload-form');
        this.dropZone = document.getElementById('drop-zone');
        this.fileInput = document.getElementById('file-input');
        this.browseBtn = document.getElementById('browse-btn');
        this.filePreview = document.getElementById('file-preview');
        this.closeBtn = document.getElementById('close-upload-modal');
        this.cancelBtn = document.getElementById('cancel-upload');
        this.submitBtn = document.getElementById('submit-upload');
        this.fileInfo = document.getElementById('file-info');
        this.docTitleInput = document.getElementById('document-title');
        this.docTypeSelect = document.getElementById('document-type');
        this.progressBar = this.createProgressBar();
        
        // Configuration
        this.config = {
            maxFileSize: 15 * 1024 * 1024, // 15MB
            maxRetries: 3,
            retryDelay: 1000, // 1 second
            allowedTypes: [
                'image/jpeg', 'image/png', 'image/webp', 'image/gif',
                'application/pdf',
                'application/msword', // .doc
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
                'application/vnd.ms-excel', // .xls
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
                'text/plain',
                'application/rtf',
                'application/zip',
                'application/x-rar-compressed',
                'application/x-7z-compressed'
            ],
            compressImages: true,
            maxImageWidth: 1920,
            imageQuality: 0.8,
            maxConcurrentUploads: 3,
            batchSize: 5
        };

        // State
        this.selectedFiles = [];
        this.uploadQueue = [];
        this.currentUploads = 0;
        this.uploadedFiles = [];
        this.failedUploads = [];
        
        // Initialize
        this.initializeEventListeners();
        this.setupFileTypeDetection();
    }

    /**
     * Create and initialize the progress bar
     */
    createProgressBar() {
        const container = document.createElement('div');
        container.className = 'progress-container';
        container.style.display = 'none';
        container.style.marginTop = '15px';
        
        const progressBar = document.createElement('div');
        progressBar.className = 'progress-bar';
        progressBar.style.height = '6px';
        progressBar.style.backgroundColor = '#e0e0e0';
        progressBar.style.borderRadius = '3px';
        progressBar.style.overflow = 'hidden';
        
        const progressFill = document.createElement('div');
        progressFill.className = 'progress-fill';
        progressFill.style.height = '100%';
        progressFill.style.width = '0%';
        progressFill.style.backgroundColor = '#4CAF50';
        progressFill.style.transition = 'width 0.3s ease';
        
        progressBar.appendChild(progressFill);
        container.appendChild(progressBar);
        
        const progressText = document.createElement('div');
        progressText.className = 'progress-text';
        progressText.style.marginTop = '5px';
        progressText.style.fontSize = '12px';
        progressText.style.color = '#666';
        progressText.textContent = '0%';
        
        container.appendChild(progressText);
        
        if (this.fileInfo && this.fileInfo.parentNode) {
            this.fileInfo.parentNode.insertBefore(container, this.fileInfo.nextSibling);
        }
        
        return {
            container,
            fill: progressFill,
            text: progressText,
            show: () => container.style.display = 'block',
            hide: () => container.style.display = 'none',
            update: (percent, text) => {
                progressFill.style.width = `${percent}%`;
                progressText.textContent = text || `${Math.round(percent)}%`;
            }
        };
    }

    /**
     * Initialize event listeners
     */
    initializeEventListeners() {
        // Open modal when clicking the add document button
        const addDocBtn = document.getElementById('add-document');
        if (addDocBtn) {
            addDocBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.openModal();
            });
        }
        
        // Close modal
        this.closeBtn?.addEventListener('click', () => this.closeModal());
        this.cancelBtn?.addEventListener('click', () => this.closeModal());
        
        // Click outside to close
        window.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.closeModal();
            }
        });
        
        // File selection
        this.browseBtn?.addEventListener('click', () => this.fileInput?.click());
        this.fileInput?.addEventListener('change', (e) => this.handleFileSelect(e));
        
        // Form submission
        this.form?.addEventListener('submit', (e) => this.handleSubmit(e));
        
        // Drag and drop
        this.dropZone?.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.dropZone.classList.add('drag-over');
        });
        
        this.dropZone?.addEventListener('dragleave', () => {
            this.dropZone.classList.remove('drag-over');
        });
        
        this.dropZone?.addEventListener('drop', (e) => {
            e.preventDefault();
            this.dropZone.classList.remove('drag-over');
            if (e.dataTransfer.files.length) {
                this.handleFileSelect({ target: { files: e.dataTransfer.files } });
            }
        });
        
        // Title validation
        this.docTitleInput?.addEventListener('input', () => this.validateForm());
    }

    /**
     * Set up file type detection
     */
    async setupFileTypeDetection() {
        try {
            // For browser environment, we'll use a simpler approach
            this.fileType = {
                fromBlob: async (blob) => {
                    // First try to get type from blob if available
                    if (blob.type && blob.type !== 'application/octet-stream') {
                        return { mime: blob.type };
                    }
                    
                    // Fallback to file extension check
                    const fileName = blob.name || '';
                    const extension = (fileName.split('.').pop() || '').toLowerCase();
                    
                    const mimeTypes = {
                        'jpg': 'image/jpeg',
                        'jpeg': 'image/jpeg',
                        'png': 'image/png',
                        'gif': 'image/gif',
                        'webp': 'image/webp',
                        'pdf': 'application/pdf',
                        'doc': 'application/msword',
                        'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                        'xls': 'application/vnd.ms-excel',
                        'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                        'txt': 'text/plain',
                        'rtf': 'application/rtf',
                        'zip': 'application/zip',
                        'rar': 'application/x-rar-compressed',
                        '7z': 'application/x-7z-compressed'
                    };
                    
                    return {
                        mime: mimeTypes[extension] || 'application/octet-stream'
                    };
                }
            };
        } catch (error) {
            console.warn('File type detection not available:', error);
            // Fallback to basic type detection
            this.fileType = {
                fromBlob: async (blob) => ({ mime: blob.type || 'application/octet-stream' })
            };
        }
    }

    /**
     * Handle file selection
     * @param {Event} event - File input change event or drop event
     */
    async handleFileSelect(event) {
        const files = event.target.files;
        if (!files || files.length === 0) return;
        
        // Process each file
        for (let i = 0; i < files.length; i++) {
            try {
                await this.processFile(files[i]);
            } catch (error) {
                console.error('Error processing file:', error);
                this.showToast(`Error processing ${files[i].name}: ${error.message}`, 'error');
            }
        }
        
        this.updateFileList();
        this.validateForm();
    }

    /**
     * Process a single file
     * @param {File} file - The file to process
     */
    async processFile(file) {
        // Check file size
        if (file.size > this.config.maxFileSize) {
            throw new Error(`File size exceeds ${this.config.maxFileSize / (1024 * 1024)}MB`);
        }
        
        // Check file type
        const fileType = await this.detectFileType(file);
        if (!this.isFileTypeAllowed(fileType || file.type)) {
            throw new Error('File type not supported');
        }
        
        // Add to selected files
        const fileData = {
            id: Date.now() + Math.random().toString(36).substr(2, 9),
            file,
            name: file.name,
            size: file.size,
            type: fileType || file.type,
            status: 'pending',
            progress: 0,
            error: null
        };
        
        this.selectedFiles.push(fileData);
        
        // Create preview if it's an image
        if (file.type.startsWith('image/')) {
            await this.createImagePreview(fileData);
        }
        
        return fileData;
    }

    /**
     * Detect file type
     * @param {File} file - The file to detect type for
     */
    async detectFileType(file) {
        try {
            if (this.fileType?.fromBlob) {
                const type = await this.fileType.fromBlob(file);
                return type?.mime || file.type;
            }
            return file.type;
        } catch (error) {
            console.warn('File type detection failed, falling back to browser type:', error);
            return file.type;
        }
    }

    /**
     * Check if file type is allowed
     * @param {string} type - MIME type to check
     */
    isFileTypeAllowed(type) {
        if (!type) return false;
        return this.config.allowedTypes.some(allowed => 
            type === allowed || 
            (allowed.endsWith('/*') && type.startsWith(allowed.slice(0, -1)))
        );
    }

    /**
     * Create image preview
     * @param {Object} fileData - File data object
     */
    createImagePreview(fileData) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                fileData.previewUrl = e.target.result;
                resolve();
            };
            reader.onerror = () => resolve();
            reader.readAsDataURL(fileData.file);
        });
    }

    /**
     * Update the file list UI
     */
    updateFileList() {
        if (!this.filePreview) return;
        
        this.filePreview.innerHTML = '';
        this.filePreview.style.display = this.selectedFiles.length ? 'block' : 'none';
        
        this.selectedFiles.forEach((fileData, index) => {
            const fileElement = this.createFileElement(fileData, index);
            this.filePreview.appendChild(fileElement);
        });
    }

    /**
     * Create a file element for the UI
     * @param {Object} fileData - File data object
     * @param {number} index - File index
     */
    createFileElement(fileData, index) {
        const element = document.createElement('div');
        element.className = `file-item ${fileData.status}`;
        element.dataset.index = index;
        
        const icon = this.getFileIcon(fileData.type);
        const size = this.formatFileSize(fileData.size);
        
        element.innerHTML = `
            <div class="file-icon">${icon}</div>
            <div class="file-info">
                <div class="file-name">${fileData.name}</div>
                <div class="file-meta">${size} • ${fileData.status}</div>
                <div class="progress-bar">
                    <div class="progress" style="width: ${fileData.progress}%"></div>
                </div>
            </div>
            <div class="file-actions">
                ${fileData.status === 'error' ? 
                    `<button class="btn small secondary retry-btn" data-index="${index}">
                        <i class="fas fa-redo"></i> Tentar novamente
                    </button>` : ''}
                <button class="btn small danger remove-btn" data-index="${index}">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        // Add event listeners
        element.querySelector('.remove-btn')?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.removeFile(index);
        });
        
        element.querySelector('.retry-btn')?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.retryUpload(index);
        });
        
        return element;
    }

    /**
     * Get appropriate icon for file type
     * @param {string} mimeType - MIME type of the file
     */
    getFileIcon(mimeType) {
        const icons = {
            'image/': '🖼️',
            'application/pdf': '📄',
            'application/msword': '📝',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '📝',
            'application/vnd.ms-excel': '📊',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '📊',
            'text/': '📄',
            'application/zip': '🗄️',
            'application/x-rar-compressed': '🗄️',
            'application/x-7z-compressed': '🗄️',
            'default': '📁'
        };
        
        for (const [prefix, icon] of Object.entries(icons)) {
            if (mimeType.startsWith(prefix)) {
                return icon;
            }
        }
        
        return icons.default;
    }

    /**
     * Format file size in human-readable format
     * @param {number} bytes - File size in bytes
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Remove a file from the selection
     * @param {number} index - Index of the file to remove
     */
    removeFile(index) {
        this.selectedFiles.splice(index, 1);
        this.updateFileList();
        this.validateForm();
    }

    /**
     * Validate the form
     */
    validateForm() {
        if (!this.docTitleInput) return true;
        
        const title = this.docTitleInput.value.trim();
        const hasTitle = title.length >= 3 && title.length <= 100;
        const hasFiles = this.selectedFiles.length > 0;
        
        if (this.docTitleInput) {
            this.docTitleInput.setCustomValidity(
                hasTitle ? '' : 'O título deve ter entre 3 e 100 caracteres'
            );
        }
        
        if (this.submitBtn) {
            this.submitBtn.disabled = !(hasTitle && hasFiles);
        }
        
        return hasTitle && hasFiles;
    }

    /**
     * Handle form submission
     * @param {Event} e - Form submit event
     */
    async handleSubmit(e) {
        e.preventDefault();
        
        if (!this.validateForm()) {
            this.showToast('Por favor, preencha todos os campos obrigatórios', 'error');
            return;
        }
        
        try {
            // Verify authentication before starting upload
            const { data: { user }, error: authError } = await window.supabase.auth.getUser();
            if (authError || !user) {
                throw new Error('Sessão expirada. Por favor, faça login novamente.');
            }
            
            this.setUploadingState(true);
            
            // Process files in batches
            const batchSize = this.config.batchSize;
            for (let i = 0; i < this.selectedFiles.length; i += batchSize) {
                const batch = this.selectedFiles.slice(i, i + batchSize);
                await this.processBatch(batch);
            }
            
            // Show success message
            if (this.uploadedFiles.length > 0) {
                this.showToast(
                    `${this.uploadedFiles.length} ficheiro(s) enviado(s) com sucesso!`,
                    'success'
                );
                
                // Reset form if all files were uploaded successfully
                if (this.failedUploads.length === 0) {
                    this.resetForm();
                    this.closeModal();
                }
            }
            
            // Show error message for failed uploads
            if (this.failedUploads.length > 0) {
                this.showToast(
                    `Falha ao enviar ${this.failedUploads.length} ficheiro(s). Tente novamente.`,
                    'error'
                );
            }
            
        } catch (error) {
            console.error('Upload error:', error);
            
            if (error.message.includes('not authenticated') || error.message.includes('Sessão expirada')) {
                this.showToast('Sessão expirada. Por favor, faça login novamente.', 'error');
                // Optional: Redirect to login page
                // window.location.href = '/login.html';
            } else {
                this.showToast(`Erro ao enviar ficheiros: ${error.message}`, 'error');
            }
        } finally {
            this.setUploadingState(false);
        }
    }

    /**
     * Process a batch of files
     * @param {Array} files - Array of files to process
     */
    async processBatch(files) {
        const uploadPromises = files.map(fileData => 
            this.uploadWithRetry(fileData)
                .then(result => {
                    this.uploadedFiles.push(result);
                    return result;
                })
                .catch(error => {
                    console.error('File upload failed:', error);
                    this.failedUploads.push({
                        file: fileData,
                        error: error.message
                    });
                    throw error;
                })
        );
        
        return Promise.all(uploadPromises);
    }

    /**
     * Upload a file with retry logic
     * @param {Object} fileData - File data object
     * @param {number} retryCount - Current retry attempt
     */
    async uploadWithRetry(fileData, retryCount = 0) {
        const fileIndex = this.selectedFiles.findIndex(f => f.id === fileData.id);
        if (fileIndex === -1) {
            throw new Error('File not found in selection');
        }
        
        try {
            // Update file status
            this.updateFileStatus(fileIndex, 'uploading', 0);
            
            // Upload the file
            const result = await this.uploadFile(fileData, (progress) => {
                this.updateFileProgress(fileIndex, progress);
            });
            
            // Update status to completed
            this.updateFileStatus(fileIndex, 'completed', 100);
            
            return result;
            
        } catch (error) {
            // Check if we should retry
            if (retryCount < this.config.maxRetries) {
                // Wait before retrying (exponential backoff)
                const delay = this.config.retryDelay * (retryCount + 1);
                await new Promise(resolve => setTimeout(resolve, delay));
                return this.uploadWithRetry(fileData, retryCount + 1);
            }
            
            // Max retries reached, mark as failed
            this.updateFileStatus(fileIndex, 'error', 0, error.message);
            throw error;
        }
    }

    /**
     * Update file status in the UI
     * @param {number} index - Index of the file
     * @param {string} status - New status (uploading, completed, error)
     * @param {number} progress - Upload progress (0-100)
     * @param {string} [error] - Error message if any
     */
    updateFileStatus(index, status, progress, error = null) {
        const fileData = this.selectedFiles[index];
        if (!fileData) return;
        
        fileData.status = status;
        fileData.progress = progress;
        fileData.error = error;
        
        // Update UI
        const fileElement = this.filePreview.querySelector(`.file-item[data-index="${index}"]`);
        if (fileElement) {
            fileElement.className = `file-item ${status}`;
            
            const progressBar = fileElement.querySelector('.progress');
            if (progressBar) {
                progressBar.style.width = `${progress}%`;
            }
            
            const statusElement = fileElement.querySelector('.file-meta');
            if (statusElement) {
                let statusText = this.formatFileSize(fileData.size);
                if (status === 'uploading') {
                    statusText += ` • A enviar (${Math.round(progress)}%)`;
                } else if (status === 'completed') {
                    statusText += ' • Concluído';
                } else if (status === 'error') {
                    statusText += ' • Falha';
                } else {
                    statusText += ' • Pendente';
                }
                statusElement.textContent = statusText;
            }
            
            // Show/hide retry button
            const retryBtn = fileElement.querySelector('.retry-btn');
            if (retryBtn) {
                retryBtn.style.display = status === 'error' ? 'inline-flex' : 'none';
            }
        }
    }

    /**
     * Update file upload progress
     * @param {number} index - Index of the file
     * @param {number} progress - Upload progress (0-100)
     */
    updateFileProgress(index, progress) {
        const fileData = this.selectedFiles[index];
        if (!fileData) return;
        
        fileData.progress = progress;
        
        // Update progress bar
        const fileElement = this.filePreview.querySelector(`.file-item[data-index="${index}"]`);
        if (fileElement) {
            const progressBar = fileElement.querySelector('.progress');
            if (progressBar) {
                progressBar.style.width = `${progress}%`;
            }
            
            const statusElement = fileElement.querySelector('.file-meta');
            if (statusElement) {
                statusElement.textContent = 
                    `${this.formatFileSize(fileData.size)} • A enviar (${Math.round(progress)}%)`;
            }
        }
    }

    /**
     * Generate a simple hash for the file (basic implementation)
     * @param {File} file - The file to hash
     * @returns {Promise<string>} - A hash string
     */
    async generateFileHash(file) {
        // This is a simple hash implementation for the browser
        // For production, consider using a proper hashing library like crypto-js
        const arrayBuffer = await file.arrayBuffer();
        const hashArray = Array.from(new Uint8Array(arrayBuffer));
        const hashHex = hashArray
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
        return hashHex.substring(0, 64); // Return first 64 chars as a simple hash
    }

    /**
     * Upload file to the server
     * @param {Object} fileData - File data object
     * @param {Function} onProgress - Progress callback
     */
    async uploadFile(fileData, onProgress) {
        if (!window.supabase) {
            throw new Error('Supabase client not initialized');
        }
        
        // Get the current user from Supabase auth
        const { data: { user }, error: authError } = await window.supabase.auth.getUser();
        
        if (authError || !user) {
            console.error('Authentication error:', authError);
            throw new Error('User not authenticated. Please log in again.');
        }
        
        const userId = user.id;
        
        // Generate a unique file name
        const fileExt = fileData.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
        const filePath = `${userId}/${fileName}`;
        
        try {
            // Generate a hash for the file
            const hashLocal = await this.generateFileHash(fileData.file);
            
            // Upload the file to Supabase Storage
            const { data, error } = await window.supabase.storage
                .from('documents')
                .upload(filePath, fileData.file, {
                    cacheControl: '3600',
                    upsert: false,
                    onProgress: (progress) => {
                        const percent = Math.round((progress.loaded / progress.total) * 100);
                        onProgress(percent);
                    }
                });
            
            if (error) throw error;
            
            // Get public URL
            const { data: urlData } = window.supabase.storage
                .from('documents')
                .getPublicUrl(filePath);
            
            // Save document metadata to database
            const docTitle = this.docTitleInput?.value || fileData.name;
            const docType = this.docTypeSelect?.value || 'other';
            
            // Create the document data object with all required fields
            const documentData = {
                user_id: userId,
                title: docTitle,
                type: docType,
                status: 'normal', // Set status to a valid value from the CHECK constraint
                location: {}, // Provide a default value for the NOT NULL location column
                file_url: urlData.publicUrl,
                created_at: new Date().toISOString(),
                // Re-add file_name and other optional fields as they exist in the schema
                file_name: fileData.name,
                file_path: filePath,
                file_size: fileData.size,
                file_type: fileData.type,
                hash_local: hashLocal
                // Do not include 'updated_at' as it's not in the schema
            };
            
            // First, try to insert with all fields
            let { data: docData, error: docError } = await window.supabase
                .from('documents')
                .insert([documentData])
                .select()
                .single();
            
            // Check for errors during the insert operation
            if (docError) {
                // Attempt to clean up the uploaded file from storage if the database insert fails
                console.error('Error saving document metadata, attempting to remove orphaned file:', docError);
                try {
                    await window.supabase.storage
                        .from('documents')
                        .remove([filePath]);
                    console.log('Orphaned file removed successfully.');
                } catch (cleanupError) {
                    console.error('Failed to remove orphaned file. Manual cleanup may be required:', cleanupError);
                }
                
                // Throw an error to be caught by the calling function
                throw new Error(`Failed to save document metadata: ${docError.message}`);
            }
            
            // Log points for document upload
            try {
                if (window.logActivity) {
                    await window.logActivity('document_upload', { 
                        documentId: docData.id,
                        title: docTitle,
                        type: docType
                    });
                }
            } catch (pointsError) {
                console.error('Error logging points:', pointsError);
                // Don't fail the upload if points logging fails
            }
            
            return {
                ...docData,
                file: fileData,
                publicUrl: urlData.publicUrl
            };
            
        } catch (error) {
            console.error('Upload error:', error);
            
            // Try to clean up the uploaded file if there was an error
            try {
                await window.supabase.storage
                    .from('documents')
                    .remove([filePath]);
            } catch (cleanupError) {
                console.error('Error cleaning up file after upload error:', cleanupError);
            }
            
            throw error;
        }
    }

    /**
     * Retry a failed upload
     * @param {number} index - Index of the file to retry
     */
    async retryUpload(index) {
        const fileData = this.selectedFiles[index];
        if (!fileData || fileData.status !== 'error') return;
        
        try {
            // Verify authentication before retry
            const { data: { user }, error: authError } = await window.supabase.auth.getUser();
            if (authError || !user) {
                throw new Error('Sessão expirada. Por favor, faça login novamente.');
            }
            
            this.setUploadingState(true);
            await this.uploadWithRetry(fileData);
            this.showToast('Ficheiro enviado com sucesso!', 'success');
        } catch (error) {
            console.error('Retry failed:', error);
            this.showToast(`Falha ao enviar: ${error.message}`, 'error');
            
            // If authentication failed, redirect to login
            if (error.message.includes('not authenticated') || error.message.includes('Sessão expirada')) {
                // Optional: Add a redirect to login page
                // window.location.href = '/login.html';
            }
        } finally {
            this.setUploadingState(false);
        }
    }

    /**
     * Set uploading state (enables/disables UI elements)
     * @param {boolean} isUploading - Whether upload is in progress
     */
    setUploadingState(isUploading) {
        if (this.submitBtn) {
            this.submitBtn.disabled = isUploading;
            const btnText = this.submitBtn.querySelector('.btn-text');
            const spinner = this.submitBtn.querySelector('.loading-spinner');
            
            if (btnText) btnText.textContent = isUploading ? 'A enviar...' : 'Enviar Documento';
            if (spinner) spinner.style.display = isUploading ? 'inline-block' : 'none';
        }
        
        if (this.cancelBtn) {
            this.cancelBtn.disabled = isUploading;
        }
        
        if (this.fileInput) {
            this.fileInput.disabled = isUploading;
        }
        
        if (this.browseBtn) {
            this.browseBtn.disabled = isUploading;
        }
        
        if (this.dropZone) {
            this.dropZone.style.pointerEvents = isUploading ? 'none' : '';
            this.dropZone.style.opacity = isUploading ? '0.6' : '1';
        }
        
        // Show/hide progress bar
        if (this.progressBar) {
            if (isUploading) {
                this.progressBar.show();
            } else {
                this.progressBar.hide();
            }
        }
    }

    /**
     * Reset the form
     */
    resetForm() {
        if (this.form) {
            this.form.reset();
        }
        
        this.selectedFiles = [];
        this.uploadedFiles = [];
        this.failedUploads = [];
        
        if (this.filePreview) {
            this.filePreview.innerHTML = '';
            this.filePreview.style.display = 'none';
        }
        
        if (this.progressBar) {
            this.progressBar.hide();
            this.progressBar.update(0, '0%');
        }
        
        this.validateForm();
    }

    /**
     * Open the upload modal
     */
    openModal() {
        if (this.modal) {
            this.modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
            this.resetForm();
        }
    }

    /**
     * Close the upload modal
     */
    closeModal() {
        if (this.modal) {
            this.modal.style.display = 'none';
            document.body.style.overflow = '';
            this.resetForm();
        }
    }

    /**
     * Show a toast notification
     * @param {string} message - Message to display
     * @param {string} type - Type of notification (success, error, info)
     */
    showToast(message, type = 'info') {
        if (window.showToast) {
            window.showToast(message, type);
            return;
        }
        
        // Fallback to alert if showToast is not available
        alert(`${type.toUpperCase()}: ${message}`);
    }
}

// Initialize the document uploader when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const uploadModal = document.getElementById('upload-modal');
    if (uploadModal) {
        window.documentUploader = new DocumentUploader();
    }
});
