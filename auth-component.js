// Authentication component for login and registration
import { authService } from './auth-service.js';

class AuthComponent {
    constructor() {
        this.isLoginMode = true;
        this.init();
    }

    init() {
        this.createAuthModal();
        this.bindEvents();
    }

    createAuthModal() {
        const modalHTML = `
            <div id="auth-modal" class="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50" style="display: none;">
                <div class="bg-surface border border-surface-light rounded-lg p-8 w-full max-w-md mx-4">
                    <div class="text-center mb-6">
                        <h2 id="auth-modal-title" class="text-2xl font-bold text-primary mb-2">Iniciar Sesión</h2>
                        <p class="text-text-secondary">Accede a tu cuenta de Trader Survivor</p>
                    </div>

                    <form id="auth-form" class="space-y-4">
                        <div id="name-field" class="hidden">
                            <label class="block text-sm font-medium text-text-secondary mb-1">Nombre completo</label>
                            <input type="text" id="auth-name" class="w-full p-3 bg-background border border-surface-light rounded-md text-white focus:border-primary focus:outline-none" placeholder="Tu nombre completo">
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-text-secondary mb-1">Correo electrónico</label>
                            <input type="email" id="auth-email" class="w-full p-3 bg-background border border-surface-light rounded-md text-white focus:border-primary focus:outline-none" placeholder="tu@email.com" required>
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-text-secondary mb-1">Contraseña</label>
                            <input type="password" id="auth-password" class="w-full p-3 bg-background border border-surface-light rounded-md text-white focus:border-primary focus:outline-none" placeholder="••••••••" required>
                        </div>

                        <div id="confirm-password-field" class="hidden">
                            <label class="block text-sm font-medium text-text-secondary mb-1">Confirmar contraseña</label>
                            <input type="password" id="auth-confirm-password" class="w-full p-3 bg-background border border-surface-light rounded-md text-white focus:border-primary focus:outline-none" placeholder="••••••••">
                        </div>

                        <div id="auth-error" class="text-red text-sm hidden"></div>

                        <button type="submit" id="auth-submit-btn" class="w-full bg-primary text-background font-bold py-3 px-4 rounded-md hover:bg-secondary transition-colors">
                            Iniciar Sesión
                        </button>
                    </form>

                    <div class="mt-6 text-center">
                        <button id="auth-toggle-btn" class="text-primary hover:text-secondary text-sm">
                            ¿No tienes cuenta? Regístrate
                        </button>
                    </div>

                    <div class="mt-4 text-center">
                        <button id="forgot-password-btn" class="text-text-secondary hover:text-primary text-sm">
                            ¿Olvidaste tu contraseña?
                        </button>
                    </div>

                    <div id="loading-auth" class="hidden">
                        <div class="flex items-center justify-center py-4">
                            <div class="spinner border-4 border-surface-light border-t-primary rounded-full w-8 h-8 animate-spin"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    bindEvents() {
        const modal = document.getElementById('auth-modal');
        const form = document.getElementById('auth-form');
        const toggleBtn = document.getElementById('auth-toggle-btn');
        const forgotPasswordBtn = document.getElementById('forgot-password-btn');

        // Form submission
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSubmit();
        });

        // Toggle between login and register
        toggleBtn.addEventListener('click', () => {
            this.toggleMode();
        });

        // Forgot password
        forgotPasswordBtn.addEventListener('click', () => {
            this.handleForgotPassword();
        });

        // Close modal on outside click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.hideModal();
            }
        });

        // ESC key to close modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.style.display !== 'none') {
                this.hideModal();
            }
        });
    }

    showModal() {
        const modal = document.getElementById('auth-modal');
        modal.style.display = 'flex';
        document.getElementById('auth-email').focus();
    }

    hideModal() {
        const modal = document.getElementById('auth-modal');
        modal.style.display = 'none';
        this.clearForm();
    }

    toggleMode() {
        this.isLoginMode = !this.isLoginMode;
        this.updateUI();
    }

    updateUI() {
        const title = document.getElementById('auth-modal-title');
        const submitBtn = document.getElementById('auth-submit-btn');
        const toggleBtn = document.getElementById('auth-toggle-btn');
        const nameField = document.getElementById('name-field');
        const confirmPasswordField = document.getElementById('confirm-password-field');

        if (this.isLoginMode) {
            title.textContent = 'Iniciar Sesión';
            submitBtn.textContent = 'Iniciar Sesión';
            toggleBtn.textContent = '¿No tienes cuenta? Regístrate';
            nameField.classList.add('hidden');
            confirmPasswordField.classList.add('hidden');
        } else {
            title.textContent = 'Crear Cuenta';
            submitBtn.textContent = 'Crear Cuenta';
            toggleBtn.textContent = '¿Ya tienes cuenta? Inicia sesión';
            nameField.classList.remove('hidden');
            confirmPasswordField.classList.remove('hidden');
        }

        this.clearError();
    }

    async handleSubmit() {
        const email = document.getElementById('auth-email').value.trim();
        const password = document.getElementById('auth-password').value;
        const name = document.getElementById('auth-name').value.trim();
        const confirmPassword = document.getElementById('auth-confirm-password').value;

        // Validation
        if (!email || !password) {
            this.showError('Por favor, completa todos los campos requeridos.');
            return;
        }

        if (!this.isLoginMode) {
            if (!name) {
                this.showError('Por favor, ingresa tu nombre completo.');
                return;
            }
            if (password !== confirmPassword) {
                this.showError('Las contraseñas no coinciden.');
                return;
            }
            if (password.length < 6) {
                this.showError('La contraseña debe tener al menos 6 caracteres.');
                return;
            }
        }

        this.showLoading(true);

        try {
            let result;
            if (this.isLoginMode) {
                result = await authService.login(email, password);
            } else {
                result = await authService.register(email, password, name);
            }

            if (result.success) {
                this.hideModal();
                this.showSuccessMessage(this.isLoginMode ? 'Sesión iniciada correctamente' : 'Cuenta creada correctamente');
                // The auth state change will be handled by the main app
            } else {
                this.showError(this.getErrorMessage(result.error));
            }
        } catch (error) {
            this.showError('Error de conexión. Por favor, intenta nuevamente.');
        } finally {
            this.showLoading(false);
        }
    }

    async handleForgotPassword() {
        const email = document.getElementById('auth-email').value.trim();
        
        if (!email) {
            this.showError('Por favor, ingresa tu correo electrónico para recuperar la contraseña.');
            return;
        }

        this.showLoading(true);

        try {
            const result = await authService.resetPassword(email);
            if (result.success) {
                this.showSuccessMessage('Se ha enviado un enlace de recuperación a tu correo electrónico.');
            } else {
                this.showError(this.getErrorMessage(result.error));
            }
        } catch (error) {
            this.showError('Error al enviar el correo de recuperación.');
        } finally {
            this.showLoading(false);
        }
    }

    showError(message) {
        const errorDiv = document.getElementById('auth-error');
        errorDiv.textContent = message;
        errorDiv.classList.remove('hidden');
    }

    clearError() {
        const errorDiv = document.getElementById('auth-error');
        errorDiv.classList.add('hidden');
    }

    showLoading(show) {
        const loadingDiv = document.getElementById('loading-auth');
        const form = document.getElementById('auth-form');
        
        if (show) {
            loadingDiv.classList.remove('hidden');
            form.classList.add('hidden');
        } else {
            loadingDiv.classList.add('hidden');
            form.classList.remove('hidden');
        }
    }

    clearForm() {
        document.getElementById('auth-email').value = '';
        document.getElementById('auth-password').value = '';
        document.getElementById('auth-name').value = '';
        document.getElementById('auth-confirm-password').value = '';
        this.clearError();
    }

    showSuccessMessage(message) {
        // Create a temporary success notification
        const notification = document.createElement('div');
        notification.className = 'fixed top-4 right-4 bg-green text-background px-6 py-3 rounded-md shadow-lg z-50';
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    getErrorMessage(error) {
        const errorMessages = {
            'auth/user-not-found': 'No existe una cuenta con este correo electrónico.',
            'auth/wrong-password': 'Contraseña incorrecta.',
            'auth/email-already-in-use': 'Ya existe una cuenta con este correo electrónico.',
            'auth/weak-password': 'La contraseña es muy débil.',
            'auth/invalid-email': 'Correo electrónico inválido.',
            'auth/too-many-requests': 'Demasiados intentos fallidos. Intenta más tarde.',
            'auth/network-request-failed': 'Error de conexión. Verifica tu internet.',
        };

        return errorMessages[error] || 'Ha ocurrido un error. Por favor, intenta nuevamente.';
    }
}

// Export the class
export { AuthComponent };
