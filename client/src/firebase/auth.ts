import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  getDocs,
  collection,
  query,
  where,
  Timestamp,
  serverTimestamp,
} from 'firebase/firestore';
import { getAuthInstance, getDb } from './init';
import type { Company, CompanyUser, UserRole } from '@/types/models';

// ── Authentication ─────────────────────────────────────────────────────────

export async function signUp(email: string, password: string): Promise<User> {
  const auth = getAuthInstance();
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  return cred.user;
}

export async function signIn(email: string, password: string): Promise<User> {
  const auth = getAuthInstance();
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

export async function logOut(): Promise<void> {
  const auth = getAuthInstance();
  await signOut(auth);
}

// ── Company ─────────────────────────────────────────────────────────────────

export async function createCompany(
  companyName: string,
  adminEmail: string,
  adminUid: string,
): Promise<string> {
  const db = getDb();
  const companiesRef = collection(db, 'companies');
  const companyDoc = doc(companiesRef);

  await setDoc(companyDoc, {
    name: companyName,
    createdAt: serverTimestamp(),
    createdBy: adminUid,
  });

  // Create the admin user document within the company
  const userRef = doc(db, 'companies', companyDoc.id, 'users', adminUid);
  await setDoc(userRef, {
    email: adminEmail,
    role: 'admin',
    displayName: adminEmail.split('@')[0],
  });

  return companyDoc.id;
}

export async function getCompanyByUser(uid: string): Promise<Company | null> {
  const db = getDb();
  const companiesRef = collection(db, 'companies');
  const snap = await getDocs(companiesRef);
  // Find the company where this user has a user doc
  for (const companyDoc of snap.docs) {
    const userRef = doc(db, 'companies', companyDoc.id, 'users', uid);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      const data = companyDoc.data();
      return {
        id: companyDoc.id,
        name: data.name,
        createdAt: data.createdAt?.toDate?.()?.toISOString() ?? '',
      };
    }
  }
  return null;
}

export async function getCompanyById(companyId: string): Promise<Company | null> {
  const db = getDb();
  const ref = doc(db, 'companies', companyId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const data = snap.data();
  return {
    id: snap.id,
    name: data.name,
    createdAt: data.createdAt?.toDate?.()?.toISOString() ?? '',
  };
}

// ── Company Users ──────────────────────────────────────────────────────────

export async function getCompanyUsers(companyId: string): Promise<CompanyUser[]> {
  const db = getDb();
  const ref = collection(db, 'companies', companyId, 'users');
  const snap = await getDocs(ref);
  return snap.docs.map(d => ({
    id: d.id,
    email: d.data().email,
    role: d.data().role as UserRole,
    displayName: d.data().displayName,
  }));
}

export async function addCompanyUser(
  companyId: string,
  uid: string,
  email: string,
  role: UserRole,
  displayName: string,
): Promise<void> {
  const db = getDb();
  const ref = doc(db, 'companies', companyId, 'users', uid);
  await setDoc(ref, { email, role, displayName });
}

export async function getUserRole(
  companyId: string,
  uid: string,
): Promise<UserRole | null> {
  const db = getDb();
  const ref = doc(db, 'companies', companyId, 'users', uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return snap.data().role as UserRole;
}
