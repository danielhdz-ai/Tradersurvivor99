// Database service for Firestore operations
import { 
    collection, 
    doc, 
    addDoc, 
    updateDoc, 
    deleteDoc, 
    getDocs, 
    getDoc,
    query, 
    where, 
    orderBy, 
    onSnapshot,
    serverTimestamp,
    writeBatch
} from "firebase/firestore";
import { db } from "./firebase-config.js";
import { authService } from "./auth-service.js";

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
        return collection(db, 'users', userId, collectionName);
    }

    // Get user document reference
    getUserDoc() {
        const userId = authService.getUserId();
        if (!userId) {
            throw new Error('User not authenticated');
        }
        return doc(db, 'users', userId);
    }

    // Initialize user data structure
    async initializeUserData() {
        try {
            const userId = authService.getUserId();
            if (!userId) return;

            const userDocRef = this.getUserDoc();
            const userDoc = await getDoc(userDocRef);

            if (!userDoc.exists()) {
                // Create initial user document
                await updateDoc(userDocRef, {
                    createdAt: serverTimestamp(),
                    lastLogin: serverTimestamp(),
                    settings: {
                        currency: 'USD',
                        theme: 'dark'
                    }
                });

                // Create initial collections with sample data if needed
                await this.createInitialData();
            } else {
                // Update last login
                await updateDoc(userDocRef, {
                    lastLogin: serverTimestamp()
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
            const initRef = collection(db, 'users', authService.getUserId(), 'init');
            await addDoc(initRef, {
                inicializado: true,
                createdAt: serverTimestamp()
            });
        } catch (error) {
            console.error('Error creating initial data:', error);
        }
    }

    // ACCOUNTS OPERATIONS
    async addAccount(accountData) {
        try {
            const accountsRef = this.getUserCollection('accounts');
            const docRef = await addDoc(accountsRef, {
                ...accountData,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });
            return { success: true, id: docRef.id };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async getAccounts() {
        try {
            const accountsRef = this.getUserCollection('accounts');
            const snapshot = await getDocs(accountsRef);
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
            const accountRef = doc(this.getUserCollection('accounts'), accountId);
            await updateDoc(accountRef, {
                ...accountData,
                updatedAt: serverTimestamp()
            });
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async deleteAccount(accountId) {
        try {
            const accountRef = doc(this.getUserCollection('accounts'), accountId);
            await deleteDoc(accountRef);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // OPERATIONS OPERATIONS
    async addOperation(operationData) {
        try {
            const operationsRef = this.getUserCollection('operations');
            const docRef = await addDoc(operationsRef, {
                ...operationData,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });
            return { success: true, id: docRef.id };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async getOperations(accountId = null) {
        try {
            const operationsRef = this.getUserCollection('operations');
            let q = query(operationsRef, orderBy('date', 'desc'));
            
            if (accountId && accountId !== 'all') {
                q = query(operationsRef, where('account', '==', accountId), orderBy('date', 'desc'));
            }
            
            const snapshot = await getDocs(q);
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
            const operationRef = doc(this.getUserCollection('operations'), operationId);
            await updateDoc(operationRef, {
                ...operationData,
                updatedAt: serverTimestamp()
            });
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async deleteOperation(operationId) {
        try {
            const operationRef = doc(this.getUserCollection('operations'), operationId);
            await deleteDoc(operationRef);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // FINANCES OPERATIONS
    async addFinanceEntry(financeData) {
        try {
            const financesRef = this.getUserCollection('finances');
            const docRef = await addDoc(financesRef, {
                ...financeData,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });
            return { success: true, id: docRef.id };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async getFinances() {
        try {
            const financesRef = this.getUserCollection('finances');
            const q = query(financesRef, orderBy('date', 'desc'));
            const snapshot = await getDocs(q);
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
            const financeRef = doc(this.getUserCollection('finances'), financeId);
            await updateDoc(financeRef, {
                ...financeData,
                updatedAt: serverTimestamp()
            });
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async deleteFinanceEntry(financeId) {
        try {
            const financeRef = doc(this.getUserCollection('finances'), financeId);
            await deleteDoc(financeRef);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // SETTINGS OPERATIONS
    async getUserSettings() {
        try {
            const userDoc = await getDoc(this.getUserDoc());
            if (userDoc.exists()) {
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
            await updateDoc(userDocRef, {
                settings: settings,
                updatedAt: serverTimestamp()
            });
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // GENERAL DATA OPERATIONS
    async addToCollection(collectionName, data) {
        try {
            const collectionRef = this.getUserCollection(collectionName);
            const docRef = await addDoc(collectionRef, {
                ...data,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });
            return { success: true, id: docRef.id };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async getFromCollection(collectionName, orderByField = null) {
        try {
            const collectionRef = this.getUserCollection(collectionName);
            let q = collectionRef;
            
            if (orderByField) {
                q = query(collectionRef, orderBy(orderByField, 'desc'));
            }
            
            const snapshot = await getDocs(q);
            const data = [];
            snapshot.forEach(doc => {
                data.push({ id: doc.id, ...doc.data() });
            });
            return { success: true, data: data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // REAL-TIME LISTENERS
    subscribeToCollection(collectionName, callback, orderByField = null) {
        try {
            const collectionRef = this.getUserCollection(collectionName);
            let q = collectionRef;
            
            if (orderByField) {
                q = query(collectionRef, orderBy(orderByField, 'desc'));
            }
            
            const unsubscribe = onSnapshot(q, (snapshot) => {
                const data = [];
                snapshot.forEach(doc => {
                    data.push({ id: doc.id, ...doc.data() });
                });
                callback(data);
            });
            
            this.listeners.set(collectionName, unsubscribe);
            return unsubscribe;
        } catch (error) {
            console.error('Error subscribing to collection:', error);
            return null;
        }
    }

    // Unsubscribe from all listeners
    unsubscribeAll() {
        this.listeners.forEach(unsubscribe => {
            if (typeof unsubscribe === 'function') {
                unsubscribe();
            }
        });
        this.listeners.clear();
    }

    // Batch operations
    async batchWrite(operations) {
        try {
            const batch = writeBatch(db);
            
            operations.forEach(operation => {
                const { type, ref, data } = operation;
                switch (type) {
                    case 'set':
                        batch.set(ref, data);
                        break;
                    case 'update':
                        batch.update(ref, data);
                        break;
                    case 'delete':
                        batch.delete(ref);
                        break;
                }
            });
            
            await batch.commit();
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
}

// Export singleton instance
export const databaseService = new DatabaseService();
