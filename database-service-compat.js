// Database service for Firestore operations (compatibility version)
class DatabaseService {
    constructor() {
        this.listeners = new Map();
    }

    // Get user-specific collection reference
    getUserCollection(collectionName) {
        const userId = authService.getUserId();
        if (!userId) {
            throw new Error('User not authenticated');
        }
        return db.collection('users').doc(userId).collection(collectionName);
    }

    // Get user document reference
    getUserDoc() {
        const userId = authService.getUserId();
        if (!userId) {
            throw new Error('User not authenticated');
        }
        return db.collection('users').doc(userId);
    }

    // Initialize user data structure
    async initializeUserData() {
        try {
            const userId = authService.getUserId();
            if (!userId) return;

            const userDocRef = this.getUserDoc();
            const userDoc = await userDocRef.get();

            if (!userDoc.exists) {
                // Create initial user document
                await userDocRef.set({
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
                    settings: {
                        currency: 'USD',
                        theme: 'dark'
                    }
                });

                // Create initial collections with sample data if needed
                await this.createInitialData();
            } else {
                // Update last login
                await userDocRef.update({
                    lastLogin: firebase.firestore.FieldValue.serverTimestamp()
                });
            }
        } catch (error) {
            console.error('Error initializing user data:', error);
        }
    }

    // Create initial data structure
    async createInitialData() {
        try {
            // Create init document to mark database as initialized
            const initRef = this.getUserCollection('init');
            await initRef.add({
                inicializado: true,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        } catch (error) {
            console.error('Error creating initial data:', error);
        }
    }

    // ACCOUNTS OPERATIONS
    async addAccount(accountData) {
        try {
            const accountsRef = this.getUserCollection('accounts');
            const docRef = await accountsRef.add({
                ...accountData,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            return { success: true, id: docRef.id };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async getAccounts() {
        try {
            const accountsRef = this.getUserCollection('accounts');
            const snapshot = await accountsRef.get();
            const accounts = [];
            snapshot.forEach(doc => {
                accounts.push({ id: doc.id, ...doc.data() });
            });
            return { success: true, data: accounts };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async updateAccount(accountId, accountData) {
        try {
            const accountRef = this.getUserCollection('accounts').doc(accountId);
            await accountRef.update({
                ...accountData,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async deleteAccount(accountId) {
        try {
            const accountRef = this.getUserCollection('accounts').doc(accountId);
            await accountRef.delete();
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // OPERATIONS OPERATIONS
    async addOperation(operationData) {
        try {
            const operationsRef = this.getUserCollection('operations');
            const docRef = await operationsRef.add({
                ...operationData,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            return { success: true, id: docRef.id };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async getOperations(accountId = null) {
        try {
            const operationsRef = this.getUserCollection('operations');
            let query = operationsRef.orderBy('date', 'desc');
            
            if (accountId && accountId !== 'all') {
                query = operationsRef.where('account', '==', accountId).orderBy('date', 'desc');
            }
            
            const snapshot = await query.get();
            const operations = [];
            snapshot.forEach(doc => {
                operations.push({ id: doc.id, ...doc.data() });
            });
            return { success: true, data: operations };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async updateOperation(operationId, operationData) {
        try {
            const operationRef = this.getUserCollection('operations').doc(operationId);
            await operationRef.update({
                ...operationData,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async deleteOperation(operationId) {
        try {
            const operationRef = this.getUserCollection('operations').doc(operationId);
            await operationRef.delete();
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // FINANCES OPERATIONS
    async addFinanceEntry(financeData) {
        try {
            const financesRef = this.getUserCollection('finances');
            const docRef = await financesRef.add({
                ...financeData,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            return { success: true, id: docRef.id };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async getFinances() {
        try {
            const financesRef = this.getUserCollection('finances');
            const query = financesRef.orderBy('date', 'desc');
            const snapshot = await query.get();
            const finances = [];
            snapshot.forEach(doc => {
                finances.push({ id: doc.id, ...doc.data() });
            });
            return { success: true, data: finances };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async updateFinanceEntry(financeId, financeData) {
        try {
            const financeRef = this.getUserCollection('finances').doc(financeId);
            await financeRef.update({
                ...financeData,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async deleteFinanceEntry(financeId) {
        try {
            const financeRef = this.getUserCollection('finances').doc(financeId);
            await financeRef.delete();
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // SETTINGS OPERATIONS
    async getUserSettings() {
        try {
            const userDoc = await this.getUserDoc().get();
            if (userDoc.exists) {
                return { success: true, data: userDoc.data().settings || {} };
            }
            return { success: true, data: {} };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async updateUserSettings(settings) {
        try {
            const userDocRef = this.getUserDoc();
            await userDocRef.update({
                settings: settings,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
}

// Create singleton instance
const databaseService = new DatabaseService();
