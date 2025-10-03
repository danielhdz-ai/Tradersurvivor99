// Main application logic
import { authService } from './auth-service.js';
import { databaseService } from './database-service.js';

class TraderSurvivorApp {
    constructor() {
        this.currentUser = null;
        this.accounts = [];
        this.operations = [];
        this.finances = [];
        this.currentSection = 'dashboard';
        this.editingOperationId = null;
        this.editingAccountId = null;
        this.editingFinanceId = null;
        
        this.init();
    }

    async init() {
        this.showLoading(true);
        
        // Setup auth state listener
        authService.onAuthStateChange((user) => {
            this.handleAuthStateChange(user);
        });

        // Setup UI event listeners
        this.setupEventListeners();
        
        // Check initial auth state
        if (authService.isAuthenticated()) {
            await this.initializeApp();
        } else {
            this.showAuthScreen();
        }
        
        this.showLoading(false);
    }

    async handleAuthStateChange(user) {
        this.currentUser = user;
        
        if (user) {
            await this.initializeApp();
        } else {
            this.showAuthScreen();
        }
    }

    async initializeApp() {
        try {
            // Initialize user data in Firestore
            await databaseService.initializeUserData();
            
            // Load initial data
            await this.loadAllData();
            
            // Update UI
            this.updateUserDisplay();
            this.showMainApp();
            
            // Show success notification
            this.showNotification('¡Bienvenido a Trader Survivor!', 'success');
            
        } catch (error) {
            console.error('Error initializing app:', error);
            this.showNotification('Error al cargar la aplicación', 'error');
        }
    }

    async loadAllData() {
        try {
            // Load accounts
            const accountsResult = await databaseService.getAccounts();
            if (accountsResult.success) {
                this.accounts = accountsResult.data;
                this.updateAccountsUI();
                this.updateAccountSelectors();
            }

            // Load operations
            const operationsResult = await databaseService.getOperations();
            if (operationsResult.success) {
                this.operations = operationsResult.data;
                this.updateOperationsUI();
                this.updateDashboard();
            }

            // Load finances
            const financesResult = await databaseService.getFinances();
            if (financesResult.success) {
                this.finances = financesResult.data;
                this.updateFinancesUI();
            }

        } catch (error) {
            console.error('Error loading data:', error);
            this.showNotification('Error al cargar los datos', 'error');
        }
    }

    setupEventListeners() {
        // Auth form listeners
        this.setupAuthListeners();
        
        // Navigation listeners
        this.setupNavigationListeners();
        
        // Account listeners
        this.setupAccountListeners();
        
        // Operation listeners
        this.setupOperationListeners();
        
        // Finance listeners
        this.setupFinanceListeners();
        
        // User menu listeners
        this.setupUserMenuListeners();
    }

    setupAuthListeners() {
        // Tab switching
        document.getElementById('login-tab').addEventListener('click', () => {
            this.switchAuthTab('login');
        });
        
        document.getElementById('register-tab').addEventListener('click', () => {
            this.switchAuthTab('register');
        });

        // Login form
        document.getElementById('login-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleLogin();
        });

        // Register form
        document.getElementById('register-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleRegister();
        });

        // Forgot password
        document.getElementById('forgot-password-btn').addEventListener('click', async () => {
            await this.handleForgotPassword();
        });
    }

    setupNavigationListeners() {
        // Navigation tabs
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                const target = tab.getAttribute('data-target');
                this.showSection(target);
            });
        });
    }

    setupAccountListeners() {
        // Add account button
        document.getElementById('add-account-btn').addEventListener('click', () => {
            this.showAccountForm();
        });

        // Account form
        document.getElementById('account-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleAccountSubmit();
        });

        // Cancel account form
        document.getElementById('acc-cancel').addEventListener('click', () => {
            this.hideAccountForm();
        });
    }

    setupOperationListeners() {
        // Add operation button
        document.getElementById('add-operation-btn').addEventListener('click', () => {
            this.showOperationForm();
        });

        // Operation form
        document.getElementById('operation-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleOperationSubmit();
        });

        // Cancel operation form
        document.getElementById('op-cancel').addEventListener('click', () => {
            this.hideOperationForm();
        });
    }

    setupFinanceListeners() {
        // Add finance button
        document.getElementById('add-finance-btn').addEventListener('click', () => {
            this.showFinanceForm();
        });

        // Finance form
        document.getElementById('finance-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleFinanceSubmit();
        });

        // Cancel finance form
        document.getElementById('finance-cancel').addEventListener('click', () => {
            this.hideFinanceForm();
        });
    }

    setupUserMenuListeners() {
        // User menu toggle
        document.getElementById('user-menu-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleUserMenu();
        });

        // Close user menu when clicking outside
        document.addEventListener('click', () => {
            this.closeUserMenu();
        });

        // Logout button
        document.getElementById('logout-btn').addEventListener('click', async () => {
            await this.handleLogout();
        });
    }

    // Auth Methods
    switchAuthTab(tab) {
        const loginTab = document.getElementById('login-tab');
        const registerTab = document.getElementById('register-tab');
        const loginForm = document.getElementById('login-form');
        const registerForm = document.getElementById('register-form');

        if (tab === 'login') {
            loginTab.classList.add('bg-primary', 'text-background');
            loginTab.classList.remove('text-text-secondary');
            registerTab.classList.remove('bg-primary', 'text-background');
            registerTab.classList.add('text-text-secondary');
            loginForm.classList.remove('hidden');
            registerForm.classList.add('hidden');
        } else {
            registerTab.classList.add('bg-primary', 'text-background');
            registerTab.classList.remove('text-text-secondary');
            loginTab.classList.remove('bg-primary', 'text-background');
            loginTab.classList.add('text-text-secondary');
            registerForm.classList.remove('hidden');
            loginForm.classList.add('hidden');
        }

        // Clear errors
        this.clearAuthErrors();
    }

    async handleLogin() {
        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value;

        if (!email || !password) {
            this.showAuthError('login', 'Por favor, completa todos los campos.');
            return;
        }

        this.showAuthLoading(true);

        try {
            const result = await authService.login(email, password);
            
            if (result.success) {
                // Auth state change will handle the rest
            } else {
                this.showAuthError('login', this.getErrorMessage(result.error));
            }
        } catch (error) {
            this.showAuthError('login', 'Error de conexión. Por favor, intenta nuevamente.');
        } finally {
            this.showAuthLoading(false);
        }
    }

    async handleRegister() {
        const name = document.getElementById('register-name').value.trim();
        const email = document.getElementById('register-email').value.trim();
        const password = document.getElementById('register-password').value;
        const confirmPassword = document.getElementById('register-confirm-password').value;

        // Validation
        if (!name || !email || !password || !confirmPassword) {
            this.showAuthError('register', 'Por favor, completa todos los campos.');
            return;
        }

        if (password !== confirmPassword) {
            this.showAuthError('register', 'Las contraseñas no coinciden.');
            return;
        }

        if (password.length < 6) {
            this.showAuthError('register', 'La contraseña debe tener al menos 6 caracteres.');
            return;
        }

        this.showAuthLoading(true);

        try {
            const result = await authService.register(email, password, name);
            
            if (result.success) {
                // Auth state change will handle the rest
            } else {
                this.showAuthError('register', this.getErrorMessage(result.error));
            }
        } catch (error) {
            this.showAuthError('register', 'Error de conexión. Por favor, intenta nuevamente.');
        } finally {
            this.showAuthLoading(false);
        }
    }

    async handleForgotPassword() {
        const email = document.getElementById('login-email').value.trim();
        
        if (!email) {
            this.showAuthError('login', 'Por favor, ingresa tu correo electrónico para recuperar la contraseña.');
            return;
        }

        this.showAuthLoading(true);

        try {
            const result = await authService.resetPassword(email);
            if (result.success) {
                this.showNotification('Se ha enviado un enlace de recuperación a tu correo electrónico.', 'success');
            } else {
                this.showAuthError('login', this.getErrorMessage(result.error));
            }
        } catch (error) {
            this.showAuthError('login', 'Error al enviar el correo de recuperación.');
        } finally {
            this.showAuthLoading(false);
        }
    }

    async handleLogout() {
        this.showLoading(true);
        
        try {
            await authService.logout();
            // Auth state change will handle the rest
        } catch (error) {
            console.error('Error logging out:', error);
            this.showNotification('Error al cerrar sesión', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    // Account Methods
    showAccountForm(account = null) {
        this.editingAccountId = account ? account.id : null;
        
        if (account) {
            document.getElementById('acc-name').value = account.name || '';
            document.getElementById('acc-balance').value = account.balance || '';
            document.getElementById('acc-currency').value = account.currency || 'USD';
            document.getElementById('acc-platform').value = account.platform || 'meta-trader-4';
        } else {
            document.getElementById('account-form').reset();
        }
        
        document.getElementById('add-account-form').style.display = 'block';
    }

    hideAccountForm() {
        document.getElementById('add-account-form').style.display = 'none';
        this.editingAccountId = null;
        document.getElementById('account-form').reset();
    }

    async handleAccountSubmit() {
        const accountData = {
            name: document.getElementById('acc-name').value.trim(),
            balance: parseFloat(document.getElementById('acc-balance').value) || 0,
            currency: document.getElementById('acc-currency').value,
            platform: document.getElementById('acc-platform').value
        };

        if (!accountData.name) {
            this.showNotification('Por favor, ingresa el nombre de la cuenta.', 'error');
            return;
        }

        this.showLoading(true);

        try {
            let result;
            if (this.editingAccountId) {
                result = await databaseService.updateAccount(this.editingAccountId, accountData);
            } else {
                result = await databaseService.addAccount(accountData);
            }

            if (result.success) {
                this.hideAccountForm();
                await this.loadAllData();
                this.showNotification(
                    this.editingAccountId ? 'Cuenta actualizada correctamente' : 'Cuenta creada correctamente',
                    'success'
                );
            } else {
                this.showNotification('Error al guardar la cuenta: ' + result.error, 'error');
            }
        } catch (error) {
            console.error('Error saving account:', error);
            this.showNotification('Error al guardar la cuenta', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async deleteAccount(accountId) {
        if (!confirm('¿Estás seguro de que quieres eliminar esta cuenta? Esta acción no se puede deshacer.')) {
            return;
        }

        this.showLoading(true);

        try {
            const result = await databaseService.deleteAccount(accountId);
            
            if (result.success) {
                await this.loadAllData();
                this.showNotification('Cuenta eliminada correctamente', 'success');
            } else {
                this.showNotification('Error al eliminar la cuenta: ' + result.error, 'error');
            }
        } catch (error) {
            console.error('Error deleting account:', error);
            this.showNotification('Error al eliminar la cuenta', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    // Operation Methods
    showOperationForm(operation = null) {
        this.editingOperationId = operation ? operation.id : null;
        
        if (operation) {
            document.getElementById('op-date').value = operation.date || '';
            document.getElementById('op-account').value = operation.account || '';
            document.getElementById('op-instrument').value = operation.instrument || '';
            document.getElementById('op-type').value = operation.type || '';
            document.getElementById('op-entry').value = operation.entry || '';
            document.getElementById('op-exit').value = operation.exit || '';
            document.getElementById('op-volume').value = operation.volume || '';
            document.getElementById('op-pl').value = operation.pl || '';
            document.getElementById('op-currency').value = operation.currency || 'USD';
            document.getElementById('op-notes').value = operation.notes || '';
        } else {
            document.getElementById('operation-form').reset();
            // Set today's date as default
            document.getElementById('op-date').value = new Date().toISOString().split('T')[0];
        }
        
        document.getElementById('add-operation-form').style.display = 'block';
    }

    hideOperationForm() {
        document.getElementById('add-operation-form').style.display = 'none';
        this.editingOperationId = null;
        document.getElementById('operation-form').reset();
    }

    async handleOperationSubmit() {
        const operationData = {
            date: document.getElementById('op-date').value,
            account: document.getElementById('op-account').value,
            instrument: document.getElementById('op-instrument').value.toUpperCase(),
            type: document.getElementById('op-type').value,
            entry: parseFloat(document.getElementById('op-entry').value) || 0,
            exit: parseFloat(document.getElementById('op-exit').value) || 0,
            volume: parseFloat(document.getElementById('op-volume').value) || 0,
            pl: parseFloat(document.getElementById('op-pl').value) || 0,
            currency: document.getElementById('op-currency').value,
            notes: document.getElementById('op-notes').value.trim()
        };

        // Validation
        if (!operationData.date || !operationData.account || !operationData.instrument || 
            !operationData.type || !operationData.entry || !operationData.volume) {
            this.showNotification('Por favor, completa todos los campos requeridos.', 'error');
            return;
        }

        this.showLoading(true);

        try {
            let result;
            if (this.editingOperationId) {
                result = await databaseService.updateOperation(this.editingOperationId, operationData);
            } else {
                result = await databaseService.addOperation(operationData);
            }

            if (result.success) {
                this.hideOperationForm();
                await this.loadAllData();
                this.showNotification(
                    this.editingOperationId ? 'Operación actualizada correctamente' : 'Operación creada correctamente',
                    'success'
                );
            } else {
                this.showNotification('Error al guardar la operación: ' + result.error, 'error');
            }
        } catch (error) {
            console.error('Error saving operation:', error);
            this.showNotification('Error al guardar la operación', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async deleteOperation(operationId) {
        if (!confirm('¿Estás seguro de que quieres eliminar esta operación? Esta acción no se puede deshacer.')) {
            return;
        }

        this.showLoading(true);

        try {
            const result = await databaseService.deleteOperation(operationId);
            
            if (result.success) {
                await this.loadAllData();
                this.showNotification('Operación eliminada correctamente', 'success');
            } else {
                this.showNotification('Error al eliminar la operación: ' + result.error, 'error');
            }
        } catch (error) {
            console.error('Error deleting operation:', error);
            this.showNotification('Error al eliminar la operación', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    // Finance Methods
    showFinanceForm(finance = null) {
        this.editingFinanceId = finance ? finance.id : null;
        
        if (finance) {
            document.getElementById('finance-date').value = finance.date || '';
            document.getElementById('finance-amount').value = finance.amount || '';
            document.getElementById('finance-currency').value = finance.currency || 'USD';
            document.getElementById('finance-notes').value = finance.notes || '';
        } else {
            document.getElementById('finance-form').reset();
            // Set today's date as default
            document.getElementById('finance-date').value = new Date().toISOString().split('T')[0];
        }
        
        document.getElementById('add-finance-form').style.display = 'block';
    }

    hideFinanceForm() {
        document.getElementById('add-finance-form').style.display = 'none';
        this.editingFinanceId = null;
        document.getElementById('finance-form').reset();
    }

    async handleFinanceSubmit() {
        const financeData = {
            date: document.getElementById('finance-date').value,
            amount: parseFloat(document.getElementById('finance-amount').value) || 0,
            currency: document.getElementById('finance-currency').value,
            notes: document.getElementById('finance-notes').value.trim()
        };

        if (!financeData.date || financeData.amount === 0) {
            this.showNotification('Por favor, completa todos los campos requeridos.', 'error');
            return;
        }

        this.showLoading(true);

        try {
            let result;
            if (this.editingFinanceId) {
                result = await databaseService.updateFinanceEntry(this.editingFinanceId, financeData);
            } else {
                result = await databaseService.addFinanceEntry(financeData);
            }

            if (result.success) {
                this.hideFinanceForm();
                await this.loadAllData();
                this.showNotification(
                    this.editingFinanceId ? 'Movimiento actualizado correctamente' : 'Movimiento creado correctamente',
                    'success'
                );
            } else {
                this.showNotification('Error al guardar el movimiento: ' + result.error, 'error');
            }
        } catch (error) {
            console.error('Error saving finance:', error);
            this.showNotification('Error al guardar el movimiento', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async deleteFinance(financeId) {
        if (!confirm('¿Estás seguro de que quieres eliminar este movimiento? Esta acción no se puede deshacer.')) {
            return;
        }

        this.showLoading(true);

        try {
            const result = await databaseService.deleteFinanceEntry(financeId);
            
            if (result.success) {
                await this.loadAllData();
                this.showNotification('Movimiento eliminado correctamente', 'success');
            } else {
                this.showNotification('Error al eliminar el movimiento: ' + result.error, 'error');
            }
        } catch (error) {
            console.error('Error deleting finance:', error);
            this.showNotification('Error al eliminar el movimiento', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    // UI Update Methods
    updateUserDisplay() {
        const displayName = authService.getUserDisplayName() || 'Usuario';
        const email = authService.getUserEmail() || '';
        
        document.getElementById('user-display-name').textContent = displayName;
        document.getElementById('user-email-display').textContent = email;
    }

    updateAccountsUI() {
        const container = document.getElementById('accounts-container');
        container.innerHTML = '';

        this.accounts.forEach(account => {
            const accountCard = this.createAccountCard(account);
            container.appendChild(accountCard);
        });
    }

    createAccountCard(account) {
        const card = document.createElement('div');
        card.className = 'account-card';
        
        card.innerHTML = `
            <div class="flex justify-between items-start mb-4">
                <div>
                    <h3 class="text-lg font-semibold text-primary">${account.name}</h3>
                    <p class="text-sm text-text-secondary">${account.platform}</p>
                </div>
                <div class="flex space-x-2">
                    <button onclick="app.showAccountForm(${JSON.stringify(account).replace(/"/g, '&quot;')})" class="text-primary hover:text-secondary">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="app.deleteAccount('${account.id}')" class="text-red hover:text-red">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <div class="space-y-2">
                <div class="flex justify-between">
                    <span class="text-text-secondary">Balance Inicial:</span>
                    <span class="font-semibold">${this.formatCurrency(account.balance, account.currency)}</span>
                </div>
                <div class="flex justify-between">
                    <span class="text-text-secondary">Divisa:</span>
                    <span class="font-semibold">${account.currency}</span>
                </div>
            </div>
        `;

        return card;
    }

    updateAccountSelectors() {
        const selectors = [
            document.getElementById('dashboard-account-select'),
            document.getElementById('op-account')
        ];

        selectors.forEach(selector => {
            if (selector) {
                // Clear existing options (except "all" for dashboard)
                if (selector.id === 'dashboard-account-select') {
                    selector.innerHTML = '<option value="all">Todas las cuentas</option>';
                } else {
                    selector.innerHTML = '<option value="">Seleccionar cuenta</option>';
                }

                // Add account options
                this.accounts.forEach(account => {
                    const option = document.createElement('option');
                    option.value = account.id;
                    option.textContent = account.name;
                    selector.appendChild(option);
                });
            }
        });
    }

    updateOperationsUI() {
        const tbody = document.getElementById('operations-table-body');
        tbody.innerHTML = '';

        this.operations.forEach(operation => {
            const row = this.createOperationRow(operation);
            tbody.appendChild(row);
        });
    }

    createOperationRow(operation) {
        const row = document.createElement('tr');
        
        const account = this.accounts.find(acc => acc.id === operation.account);
        const accountName = account ? account.name : 'N/A';
        
        row.innerHTML = `
            <td>${this.formatDate(operation.date)}</td>
            <td>${accountName}</td>
            <td>${operation.instrument}</td>
            <td><span class="px-2 py-1 rounded text-xs ${operation.type === 'BUY' ? 'bg-green text-background' : 'bg-red text-white'}">${operation.type}</span></td>
            <td>${operation.entry}</td>
            <td>${operation.exit || '-'}</td>
            <td>${operation.volume}</td>
            <td class="${operation.pl >= 0 ? 'text-positive' : 'text-negative'}">${this.formatCurrency(operation.pl, operation.currency)}</td>
            <td>
                <button onclick="app.showOperationForm(${JSON.stringify(operation).replace(/"/g, '&quot;')})" class="text-primary hover:text-secondary mr-2">
                    <i class="fas fa-edit"></i>
                </button>
                <button onclick="app.deleteOperation('${operation.id}')" class="text-red hover:text-red">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;

        return row;
    }

    updateFinancesUI() {
        const tbody = document.getElementById('finances-table-body');
        tbody.innerHTML = '';

        this.finances.forEach(finance => {
            const row = this.createFinanceRow(finance);
            tbody.appendChild(row);
        });

        this.updateFinanceSummary();
    }

    createFinanceRow(finance) {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>${this.formatDate(finance.date)}</td>
            <td>${finance.notes || '-'}</td>
            <td class="${finance.amount >= 0 ? 'text-positive' : 'text-negative'}">${this.formatCurrency(finance.amount, finance.currency)}</td>
            <td>${finance.currency}</td>
            <td>
                <button onclick="app.showFinanceForm(${JSON.stringify(finance).replace(/"/g, '&quot;')})" class="text-primary hover:text-secondary mr-2">
                    <i class="fas fa-edit"></i>
                </button>
                <button onclick="app.deleteFinance('${finance.id}')" class="text-red hover:text-red">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;

        return row;
    }

    updateFinanceSummary() {
        // Calculate trading P/L from operations
        const tradingPL = this.operations.reduce((sum, op) => sum + (op.pl || 0), 0);
        
        // Calculate income and expenses from finances
        const income = this.finances.filter(f => f.amount > 0).reduce((sum, f) => sum + f.amount, 0);
        const expenses = this.finances.filter(f => f.amount < 0).reduce((sum, f) => sum + Math.abs(f.amount), 0);
        
        // Calculate net balance
        const netBalance = tradingPL + income - expenses;

        // Update UI
        document.getElementById('finance-trading-pl').textContent = this.formatCurrency(tradingPL, 'USD');
        document.getElementById('finance-total-income').textContent = this.formatCurrency(income, 'USD');
        document.getElementById('finance-total-expenses').textContent = this.formatCurrency(expenses, 'USD');
        document.getElementById('finance-net-balance').textContent = this.formatCurrency(netBalance, 'USD');

        // Update colors
        document.getElementById('finance-trading-pl').className = `text-xl font-bold ${tradingPL >= 0 ? 'text-positive' : 'text-negative'}`;
        document.getElementById('finance-net-balance').className = `text-xl font-bold ${netBalance >= 0 ? 'text-positive' : 'text-negative'}`;
    }

    updateDashboard() {
        // Calculate metrics
        const totalPL = this.operations.reduce((sum, op) => sum + (op.pl || 0), 0);
        const totalTrades = this.operations.length;
        const winningTrades = this.operations.filter(op => (op.pl || 0) > 0).length;
        const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
        
        const profits = this.operations.filter(op => (op.pl || 0) > 0).reduce((sum, op) => sum + op.pl, 0);
        const losses = Math.abs(this.operations.filter(op => (op.pl || 0) < 0).reduce((sum, op) => sum + op.pl, 0));
        const profitFactor = losses > 0 ? profits / losses : profits > 0 ? profits : 0;

        // Update UI
        document.getElementById('current-balance').textContent = this.formatCurrency(totalPL, 'USD');
        document.getElementById('win-rate').textContent = `${winRate.toFixed(1)}%`;
        document.getElementById('profit-factor').textContent = profitFactor.toFixed(2);
        document.getElementById('total-trades').textContent = totalTrades.toString();

        // Update colors
        document.getElementById('current-balance').className = `text-3xl font-bold ${totalPL >= 0 ? 'text-positive' : 'text-negative'}`;
        document.getElementById('win-rate').className = `text-3xl font-bold ${winRate >= 50 ? 'text-positive' : 'text-negative'}`;
        document.getElementById('profit-factor').className = `text-3xl font-bold ${profitFactor >= 1 ? 'text-positive' : 'text-negative'}`;
    }

    // UI Helper Methods
    showSection(sectionId) {
        // Hide all sections
        document.querySelectorAll('.section-container').forEach(section => {
            section.classList.remove('active');
        });

        // Show target section
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.classList.add('active');
        }

        // Update navigation
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.classList.remove('active');
        });

        const activeTab = document.querySelector(`[data-target="${sectionId}"]`);
        if (activeTab) {
            activeTab.classList.add('active');
        }

        this.currentSection = sectionId;
    }

    showAuthScreen() {
        document.getElementById('auth-screen').style.display = 'flex';
        document.getElementById('main-app').classList.remove('show');
    }

    showMainApp() {
        document.getElementById('auth-screen').style.display = 'none';
        document.getElementById('main-app').classList.add('show');
    }

    showLoading(show) {
        const loadingScreen = document.getElementById('loading-screen');
        if (show) {
            loadingScreen.classList.remove('hidden');
        } else {
            loadingScreen.classList.add('hidden');
        }
    }

    showAuthLoading(show) {
        const authLoading = document.getElementById('auth-loading');
        const loginForm = document.getElementById('login-form');
        const registerForm = document.getElementById('register-form');
        
        if (show) {
            authLoading.classList.remove('hidden');
            loginForm.classList.add('hidden');
            registerForm.classList.add('hidden');
        } else {
            authLoading.classList.add('hidden');
            if (document.getElementById('login-tab').classList.contains('bg-primary')) {
                loginForm.classList.remove('hidden');
            } else {
                registerForm.classList.remove('hidden');
            }
        }
    }

    showAuthError(form, message) {
        const errorElement = document.getElementById(`${form}-error`);
        errorElement.textContent = message;
        errorElement.classList.remove('hidden');
    }

    clearAuthErrors() {
        document.getElementById('login-error').classList.add('hidden');
        document.getElementById('register-error').classList.add('hidden');
    }

    toggleUserMenu() {
        const dropdown = document.getElementById('user-menu-dropdown');
        dropdown.classList.toggle('show');
    }

    closeUserMenu() {
        const dropdown = document.getElementById('user-menu-dropdown');
        dropdown.classList.remove('show');
    }

    showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    // Utility Methods
    formatCurrency(amount, currency) {
        return new Intl.NumberFormat('es-ES', {
            style: 'currency',
            currency: currency || 'USD'
        }).format(amount || 0);
    }

    formatDate(dateString) {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES');
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

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new TraderSurvivorApp();
});
