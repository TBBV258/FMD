// Auth Forms JavaScript
document.addEventListener('DOMContentLoaded', () => {
    // Initialize tabs
    const tabs = document.querySelectorAll('.auth-tab');
    const forms = document.querySelectorAll('.auth-form');
    
    // Tab switching
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const target = tab.getAttribute('data-tab');
            
            // Update active tab
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // Show target form
            forms.forEach(form => {
                form.classList.remove('active');
                if (form.id === `${target}-form`) {
                    form.classList.add('active');
                }
            });
        });
    });
    
    // Toggle password visibility
    document.querySelectorAll('.toggle-password').forEach(button => {
        button.addEventListener('click', (e) => {
            const input = button.parentElement.querySelector('input');
            const icon = button.querySelector('i');
            
            if (input.type === 'password') {
                input.type = 'text';
                icon.classList.replace('fa-eye', 'fa-eye-slash');
                button.setAttribute('aria-label', 'Ocultar senha');
            } else {
                input.type = 'password';
                icon.classList.replace('fa-eye-slash', 'fa-eye');
                button.setAttribute('aria-label', 'Mostrar senha');
            }
        });
    });
    
    // Form validation
    function validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(String(email).toLowerCase());
    }
    
    function validatePassword(password) {
        // At least 8 characters, 1 letter and 1 number
        const re = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
        return re.test(password);
    }
    
    // Show error message
    function showError(inputId, message) {
        const errorElement = document.getElementById(`${inputId}-error`);
        const inputGroup = document.getElementById(inputId)?.closest('.input-group');
        
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
        }
        
        if (inputGroup) {
            inputGroup.classList.add('error');
        }
    }
    
    // Clear error
    function clearError(inputId) {
        const errorElement = document.getElementById(`${inputId}-error`);
        const inputGroup = document.getElementById(inputId)?.closest('.input-group');
        
        if (errorElement) {
            errorElement.textContent = '';
            errorElement.style.display = 'none';
        }
        
        if (inputGroup) {
            inputGroup.classList.remove('error');
        }
    }
    
    // Show success state
    function showSuccess(inputId) {
        const inputGroup = document.getElementById(inputId)?.closest('.input-group');
        if (inputGroup) {
            inputGroup.classList.remove('error');
            inputGroup.classList.add('success');
        }
        clearError(inputId);
    }
    
    // Set loading state
    function setLoading(button, isLoading) {
        if (!button) return;
        
        if (isLoading) {
            button.disabled = true;
            button.classList.add('loading');
        } else {
            button.disabled = false;
            button.classList.remove('loading');
        }
    }
    
    // Show toast notification
    function showToast(message, type = 'info') {
        const toastContainer = document.getElementById('toast-container');
        if (!toastContainer) return;
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <span>${message}</span>
                <button class="toast-close" aria-label="Fechar">&times;</button>
            </div>
        `;
        
        toastContainer.appendChild(toast);
        
        // Auto-remove toast after 5 seconds
        const timer = setTimeout(() => {
            toast.classList.add('fade-out');
            setTimeout(() => toast.remove(), 300);
        }, 5000);
        
        // Close button
        const closeButton = toast.querySelector('.toast-close');
        closeButton.addEventListener('click', () => {
            clearTimeout(timer);
            toast.classList.add('fade-out');
            setTimeout(() => toast.remove(), 300);
        });
        
        return toast;
    }
    
    // Login form submission
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('login-email').value.trim();
            const password = document.getElementById('login-password').value;
            const rememberMe = document.getElementById('remember-me').checked;
            const loginButton = document.getElementById('login-button');
            
            // Validate inputs
            let isValid = true;
            
            if (!email) {
                showError('login-email', 'Por favor, insira seu email');
                isValid = false;
            } else if (!validateEmail(email)) {
                showError('login-email', 'Por favor, insira um email válido');
                isValid = false;
            } else {
                clearError('login-email');
            }
            
            if (!password) {
                showError('login-password', 'Por favor, insira sua senha');
                isValid = false;
            } else {
                clearError('login-password');
            }
            
            if (!isValid) return;
            
            setLoading(loginButton, true);
            
            try {
                if (window.authApi) {
                    const user = await window.authApi.signIn(email, password);
                    if (user) {
                        if (rememberMe) {
                            localStorage.setItem('remember_me', 'true');
                        }
                        showToast('Login realizado com sucesso!', 'success');
                        
                        // Redirect after a short delay
                        setTimeout(() => {
                            window.location.href = 'index.html';
                        }, 1000);
                    }
                } else {
                    throw new Error('Sistema de autenticação não disponível');
                }
            } catch (error) {
                console.error('Login error:', error);
                showToast(error.message || 'Erro ao fazer login. Verifique suas credenciais.', 'error');
            } finally {
                setLoading(loginButton, false);
            }
        });
    }
    
    // Register form submission
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const name = document.getElementById('register-name').value.trim();
            const email = document.getElementById('register-email').value.trim();
            const phone = document.getElementById('register-phone').value.trim();
            const password = document.getElementById('register-password').value;
            const confirmPassword = document.getElementById('register-confirm-password').value;
            const termsAgreed = document.getElementById('terms-agree').checked;
            const registerButton = document.getElementById('register-button');
            
            // Validate inputs
            let isValid = true;
            
            // Name validation
            if (!name) {
                showError('register-name', 'Por favor, insira seu nome completo');
                isValid = false;
            } else if (name.length < 3) {
                showError('register-name', 'O nome deve ter pelo menos 3 caracteres');
                isValid = false;
            } else {
                clearError('register-name');
            }
            
            // Email validation
            if (!email) {
                showError('register-email', 'Por favor, insira seu email');
                isValid = false;
            } else if (!validateEmail(email)) {
                showError('register-email', 'Por favor, insira um email válido');
                isValid = false;
            } else {
                clearError('register-email');
            }
            
            // Phone validation (optional)
            if (phone && !/^\+?[\d\s-]{8,}$/.test(phone)) {
                showError('register-phone', 'Por favor, insira um telefone válido');
                isValid = false;
            } else {
                clearError('register-phone');
            }
            
            // Password validation
            if (!password) {
                showError('register-password', 'Por favor, insira uma senha');
                isValid = false;
            } else if (!validatePassword(password)) {
                showError('register-password', 'A senha deve ter pelo menos 8 caracteres, incluindo letras e números');
                isValid = false;
            } else {
                clearError('register-password');
            }
            
            // Confirm password
            if (password !== confirmPassword) {
                showError('register-confirm-password', 'As senhas não coincidem');
                isValid = false;
            } else {
                clearError('register-confirm-password');
            }
            
            // Terms agreement
            if (!termsAgreed) {
                const termsError = document.getElementById('terms-error');
                if (termsError) {
                    termsError.textContent = 'Você deve concordar com os Termos de Serviço';
                    termsError.style.display = 'block';
                }
                isValid = false;
            } else {
                const termsError = document.getElementById('terms-error');
                if (termsError) {
                    termsError.textContent = '';
                    termsError.style.display = 'none';
                }
            }
            
            if (!isValid) return;
            
            setLoading(registerButton, true);
            
            try {
                if (window.authApi) {
                    const userData = {
                        fullName: name,
                        phoneNumber: phone
                    };
                    
                    const user = await window.authApi.signUp(email, password, userData);
                    
                    if (user) {
                        showToast('Conta criada com sucesso! Verifique seu email para confirmar.', 'success');
                        
                        // Clear form and switch to login
                        registerForm.reset();
                        document.querySelector('[data-tab="login"]').click();
                    }
                } else {
                    throw new Error('Sistema de autenticação não disponível');
                }
            } catch (error) {
                console.error('Registration error:', error);
                showToast(error.message || 'Erro ao criar conta. Tente novamente.', 'error');
            } finally {
                setLoading(registerButton, false);
            }
        });
    }
    
    // Forgot password
    const forgotPasswordLink = document.getElementById('forgot-password');
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', async (e) => {
            e.preventDefault();
            
            const email = prompt('Por favor, insira seu email para redefinir sua senha:');
            if (!email) return;
            
            if (!validateEmail(email)) {
                showToast('Por favor, insira um email válido', 'error');
                return;
            }
            
            try {
                if (window.authApi) {
                    await window.authApi.resetPassword(email);
                    showToast(`Um email de redefinição de senha foi enviado para ${email}`, 'success');
                } else {
                    throw new Error('Sistema de autenticação não disponível');
                }
            } catch (error) {
                console.error('Password reset error:', error);
                showToast(error.message || 'Erro ao solicitar redefinição de senha', 'error');
            }
        });
    }
    
    // Social login
    const googleLoginBtn = document.getElementById('google-login');
    if (googleLoginBtn) {
        googleLoginBtn.addEventListener('click', async () => {
            try {
                if (window.authApi) {
                    await window.authApi.signInWithGoogle();
                } else {
                    throw new Error('Sistema de autenticação não disponível');
                }
            } catch (error) {
                console.error('Google login error:', error);
                showToast(error.message || 'Erro ao fazer login com Google', 'error');
            }
        });
    }
    
    const facebookLoginBtn = document.getElementById('facebook-login');
    if (facebookLoginBtn) {
        facebookLoginBtn.addEventListener('click', async () => {
            try {
                if (window.authApi) {
                    await window.authApi.signInWithFacebook();
                } else {
                    throw new Error('Sistema de autenticação não disponível');
                }
            } catch (error) {
                console.error('Facebook login error:', error);
                showToast(error.message || 'Erro ao fazer login com Facebook', 'error');
            }
        });
    }
});
