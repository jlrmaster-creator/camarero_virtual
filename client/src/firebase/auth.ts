import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from 'firebase/auth';
import {
  doc,
  setDoc,
  updateDoc,
  getDoc,
  getDocs,
  collection,
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

  // Create user → company lookup doc for fast path
  await setDoc(doc(db, 'userCompanies', adminUid), { companyId: companyDoc.id });

  return companyDoc.id;
}

export async function getCompanyByUser(uid: string): Promise<Company | null> {
  const db = getDb();

  // Fast path via userCompanies lookup doc
  const lookupRef = doc(db, 'userCompanies', uid);
  const lookupSnap = await getDoc(lookupRef);
  if (lookupSnap.exists()) {
    const { companyId } = lookupSnap.data() as { companyId: string };
    return getCompanyById(companyId);
  }

  // Fallback: iterate all companies (legacy / rules not yet updated)
  const companiesRef = collection(db, 'companies');
  const snap = await getDocs(companiesRef);
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
  return snap.docs.map(d => {
    const data = d.data();
    return {
      id: d.id,
      email: data.email ?? '',
      role: data.role as UserRole,
      displayName: data.displayName ?? '',
      bloqueado: data.bloqueado ?? false,
      eliminado: data.eliminado ?? false,
    };
  });
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
  await setDoc(ref, { email, role, displayName, bloqueado: false, eliminado: false });
}

export async function addUserCompanyLookup(uid: string, companyId: string): Promise<void> {
  const db = getDb();
  await setDoc(doc(db, 'userCompanies', uid), { companyId });
}

export async function updateCompanyUser(
  companyId: string,
  uid: string,
  data: Partial<{ displayName: string; bloqueado: boolean; eliminado: boolean }>,
): Promise<void> {
  const db = getDb();
  const ref = doc(db, 'companies', companyId, 'users', uid);
  await updateDoc(ref, data);
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

export async function checkUserBlocked(
  companyId: string,
  uid: string,
): Promise<{ blocked: boolean; deleted: boolean }> {
  const db = getDb();
  const ref = doc(db, 'companies', companyId, 'users', uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return { blocked: false, deleted: true };
  const data = snap.data();
  return {
    blocked: data.bloqueado ?? false,
    deleted: data.eliminado ?? false,
  };
}
