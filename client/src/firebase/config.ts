// Firebase configuration
// These values are public (safe to commit). Security is enforced via Firebase Security Rules.

export const firebaseConfig = {
  apiKey: 'AIzaSyDCzxJwuAyXDSrzugmvI2erXxWvCO4GkfY',
  authDomain: 'camarero-virtual-ee00c.firebaseapp.com',
  projectId: 'camarero-virtual-ee00c',
  storageBucket: 'camarero-virtual-ee00c.firebasestorage.app',
  messagingSenderId: '1009834386654',
  appId: '1:1009834386654:web:c4793e320d56652a5b4e4f',
};

export function isFirebaseConfigured(): boolean {
  return !!(firebaseConfig.apiKey && firebaseConfig.projectId);
}
