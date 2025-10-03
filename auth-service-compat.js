// Authentication service (compatibility version)
class AuthService {
    constructor() {
        this.currentUser = null;
        this.authStateListeners = [];
        
        // Listen for auth state changes
        auth.onAuthStateChanged((user) => {
            this.currentUser = user;
            this.authStateListeners.forEach(listener => listener(user));
        });
    }

    // Register new user
    async register(email, password, displayName) {
        try {
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            
            // Update user profile with display name
            if (displayName) {
                await userCredential.user.updateProfile({
                    displayName: displayName
                });
            }
            
            return { success: true, user: userCredential.user };
        } catch (error) {
            return { success: false, error: error.code };
        }
    }

    // Login user
    async login(email, password) {
        try {
            const userCredential = await auth.signInWithEmailAndPassword(email, password);
            return { success: true, user: userCredential.user };
        } catch (error) {
            return { success: false, error: error.code };
        }
    }

    // Logout user
    async logout() {
        try {
            await auth.signOut();
            return { success: true };
        } catch (error) {
            return { success: false, error: error.code };
        }
    }

    // Reset password
    async resetPassword(email) {
        try {
            await auth.sendPasswordResetEmail(email);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.code };
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

// Create singleton instance
const authService = new AuthService();
