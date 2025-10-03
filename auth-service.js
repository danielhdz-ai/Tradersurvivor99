// Authentication service
import { 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged,
    sendPasswordResetEmail,
    updateProfile
} from "firebase/auth";
import { auth } from "./firebase-config.js";

class AuthService {
    constructor() {
        this.currentUser = null;
        this.authStateListeners = [];
        
        // Listen for auth state changes
        onAuthStateChanged(auth, (user) => {
            this.currentUser = user;
            this.authStateListeners.forEach(listener => listener(user));
        });
    }

    // Register new user
    async register(email, password, displayName) {
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            
            // Update user profile with display name
            if (displayName) {
                await updateProfile(userCredential.user, {
                    displayName: displayName
                });
            }
            
            return { success: true, user: userCredential.user };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // Login user
    async login(email, password) {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            return { success: true, user: userCredential.user };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // Logout user
    async logout() {
        try {
            await signOut(auth);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // Reset password
    async resetPassword(email) {
        try {
            await sendPasswordResetEmail(auth, email);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // Get current user
    getCurrentUser() {
        return this.currentUser;
    }

    // Check if user is authenticated
    isAuthenticated() {
        return this.currentUser !== null;
    }

    // Add auth state listener
    onAuthStateChange(callback) {
        this.authStateListeners.push(callback);
        
        // Return unsubscribe function
        return () => {
            const index = this.authStateListeners.indexOf(callback);
            if (index > -1) {
                this.authStateListeners.splice(index, 1);
            }
        };
    }

    // Get user ID
    getUserId() {
        return this.currentUser ? this.currentUser.uid : null;
    }

    // Get user email
    getUserEmail() {
        return this.currentUser ? this.currentUser.email : null;
    }

    // Get user display name
    getUserDisplayName() {
        return this.currentUser ? this.currentUser.displayName : null;
    }
}

// Export singleton instance
export const authService = new AuthService();
