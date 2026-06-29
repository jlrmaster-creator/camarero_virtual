import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { getAuthInstance } from '@/firebase/init';
import * as authService from '@/firebase/auth';
import { setFirebaseCompanyId } from '@/services/store';
import type { Company, CompanyUser, UserRole } from '@/types/models';

interface AuthContextType {
  user: User | null;
  company: Company | null;
  role: UserRole | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<User>;
  signUp: (email: string, password: string) => Promise<User>;
  logOut: () => Promise<void>;
  registerCompany: (companyName: string, email: string, password: string) => Promise<void>;
  addUserToCompany: (uid: string, email: string, role: UserRole, displayName: string) => Promise<void>;
  getCompanyUsers: () => Promise<CompanyUser[]>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getAuthInstance();
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const c = await authService.getCompanyByUser(firebaseUser.uid);
        setCompany(c);
        if (c) {
          const status = await authService.checkUserBlocked(c.id, firebaseUser.uid);
          if (status.deleted || status.blocked) {
            await authService.logOut();
            setCompany(null);
            setRole(null);
            setFirebaseCompanyId(null);
            setLoading(false);
            return;
          }
          const r = await authService.getUserRole(c.id, firebaseUser.uid);
          setRole(r);
          setFirebaseCompanyId(c.id);
        } else {
          setFirebaseCompanyId(null);
        }
      } else {
        setCompany(null);
        setRole(null);
        setFirebaseCompanyId(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const u = await authService.signIn(email, password);
    return u;
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    const u = await authService.signUp(email, password);
    return u;
  }, []);

  const logOut = useCallback(async () => {
    await authService.logOut();
  }, []);

  const registerCompany = useCallback(
    async (companyName: string, email: string, password: string) => {
      const u = await authService.signUp(email, password);
      const companyId = await authService.createCompany(companyName, email, u.uid);
      const c = await authService.getCompanyById(companyId);
      setCompany(c);
      setRole('admin');
      setFirebaseCompanyId(companyId);
    },
    [],
  );

  const addUserToCompany = useCallback(
    async (uid: string, email: string, role: UserRole, displayName: string) => {
      if (!company) throw new Error('No company selected');
      await authService.addCompanyUser(company.id, uid, email, role, displayName);
    },
    [company],
  );

  const getCompanyUsers = useCallback(async () => {
    if (!company) throw new Error('No company selected');
    return authService.getCompanyUsers(company.id);
  }, [company]);

  return (
    <AuthContext.Provider
      value={{
        user,
        company,
        role,
        loading,
        signIn,
        signUp,
        logOut,
        registerCompany,
        addUserToCompany,
        getCompanyUsers,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
