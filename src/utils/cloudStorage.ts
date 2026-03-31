import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../config/firebase';
import { ProjectData } from './projectManager';

export interface CloudProjectMeta {
  id: string;
  name: string;
  description?: string;
  updatedAt: string;
  createdAt: string;
  ownerId: string;
  ownerName?: string;
  modelCount: number;
  version: string;
}

const PROJECTS_COLLECTION = 'projects';

/**
 * Save a project to Firestore.
 */
export async function saveProjectToCloud(
  userId: string,
  projectData: ProjectData,
  displayName?: string
): Promise<string> {
  if (!isFirebaseConfigured || !db) {
    throw new Error('Firebase is not configured. Set REACT_APP_FIREBASE_* environment variables.');
  }

  const projectId = projectData.id || `project_${Date.now()}`;
  const docRef = doc(db, PROJECTS_COLLECTION, projectId);

  await setDoc(docRef, {
    ...projectData,
    id: projectId,
    ownerId: userId,
    ownerName: displayName ?? '',
    updatedAt: new Date().toISOString(),
    _serverTimestamp: serverTimestamp(),
  });

  return projectId;
}

/**
 * Load a project from Firestore.
 */
export async function loadProjectFromCloud(projectId: string): Promise<ProjectData | null> {
  if (!isFirebaseConfigured || !db) {
    throw new Error('Firebase is not configured.');
  }

  const docRef = doc(db, PROJECTS_COLLECTION, projectId);
  const snapshot = await getDoc(docRef);

  if (!snapshot.exists()) return null;

  const data = snapshot.data() as ProjectData & { _serverTimestamp?: Timestamp };
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { _serverTimestamp, ...projectData } = data;
  return projectData as ProjectData;
}

/**
 * List all projects belonging to a user.
 */
export async function listUserProjects(userId: string): Promise<CloudProjectMeta[]> {
  if (!isFirebaseConfigured || !db) {
    throw new Error('Firebase is not configured.');
  }

  const q = query(
    collection(db, PROJECTS_COLLECTION),
    where('ownerId', '==', userId),
    orderBy('updatedAt', 'desc'),
    limit(100)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      name: data.name,
      description: data.metadata?.description,
      updatedAt: data.updatedAt,
      createdAt: data.createdAt,
      ownerId: data.ownerId,
      ownerName: data.ownerName,
      modelCount: data.scene?.models?.length ?? 0,
      version: data.version,
    };
  });
}

/**
 * Delete a project from Firestore.
 */
export async function deleteProjectFromCloud(projectId: string): Promise<void> {
  if (!isFirebaseConfigured || !db) {
    throw new Error('Firebase is not configured.');
  }

  const docRef = doc(db, PROJECTS_COLLECTION, projectId);
  await deleteDoc(docRef);
}
