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

// ---- Project Sharing ----

export type ProjectPermission = 'owner' | 'editor' | 'viewer';

export interface ProjectShare {
  projectId: string;
  uid: string;
  email: string;
  displayName: string;
  permission: ProjectPermission;
  sharedAt: string;
  sharedBy: string;
}

const SHARES_COLLECTION = 'projectShares';

/**
 * Share a project with another user.
 */
export async function shareProject(
  projectId: string,
  targetUid: string,
  targetEmail: string,
  targetDisplayName: string,
  permission: ProjectPermission,
  sharedByUid: string
): Promise<void> {
  if (!isFirebaseConfigured || !db) {
    throw new Error('Firebase is not configured.');
  }

  const shareId = `${projectId}_${targetUid}`;
  const shareRef = doc(db, SHARES_COLLECTION, shareId);
  await setDoc(shareRef, {
    projectId,
    uid: targetUid,
    email: targetEmail,
    displayName: targetDisplayName,
    permission,
    sharedAt: new Date().toISOString(),
    sharedBy: sharedByUid,
  });
}

/**
 * Remove project sharing for a user.
 */
export async function unshareProject(projectId: string, targetUid: string): Promise<void> {
  if (!isFirebaseConfigured || !db) {
    throw new Error('Firebase is not configured.');
  }

  const shareId = `${projectId}_${targetUid}`;
  const shareRef = doc(db, SHARES_COLLECTION, shareId);
  await deleteDoc(shareRef);
}

/**
 * List all shares for a project.
 */
export async function listProjectShares(projectId: string): Promise<ProjectShare[]> {
  if (!isFirebaseConfigured || !db) {
    throw new Error('Firebase is not configured.');
  }

  const q = query(
    collection(db, SHARES_COLLECTION),
    where('projectId', '==', projectId)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => d.data() as ProjectShare);
}

/**
 * List all projects shared with a user.
 */
export async function listSharedProjects(userId: string): Promise<CloudProjectMeta[]> {
  if (!isFirebaseConfigured || !db) {
    throw new Error('Firebase is not configured.');
  }

  // Find all share records for this user
  const sharesQuery = query(
    collection(db, SHARES_COLLECTION),
    where('uid', '==', userId)
  );

  const sharesSnapshot = await getDocs(sharesQuery);
  const projectIds = sharesSnapshot.docs.map((d) => d.data().projectId as string);

  // Fetch project metadata concurrently
  const projects: CloudProjectMeta[] = [];
  const projectPromises = projectIds.map(async (projectId) => {
    const projectRef = doc(db!, PROJECTS_COLLECTION, projectId);
    const projectSnap = await getDoc(projectRef);
    if (projectSnap.exists()) {
      const data = projectSnap.data();
      return {
        id: projectSnap.id,
        name: data.name,
        description: data.metadata?.description,
        updatedAt: data.updatedAt,
        createdAt: data.createdAt,
        ownerId: data.ownerId,
        ownerName: data.ownerName,
        modelCount: data.scene?.models?.length ?? 0,
        version: data.version,
      } as CloudProjectMeta;
    }
    return null;
  });

  const results = await Promise.all(projectPromises);
  results.forEach((project) => {
    if (project) projects.push(project);
  });

  return projects;
}

/**
 * Share a project with an entire team.
 * Creates share records for all team members.
 */
export async function shareProjectWithTeam(
  projectId: string,
  teamId: string,
  permission: ProjectPermission,
  sharedByUid: string
): Promise<void> {
  if (!isFirebaseConfigured || !db) {
    throw new Error('Firebase is not configured.');
  }

  // Fetch team members
  const membersRef = collection(db, 'teams', teamId, 'members');
  const membersSnapshot = await getDocs(membersRef);

  const sharePromises = membersSnapshot.docs.map(async (memberDoc) => {
    const member = memberDoc.data();
    if (member.uid !== sharedByUid) {
      await shareProject(
        projectId,
        member.uid,
        member.email,
        member.displayName,
        permission,
        sharedByUid
      );
    }
  });

  await Promise.all(sharePromises);
}

/**
 * Check if a user has access to a project (owner or shared).
 */
export async function checkProjectAccess(
  projectId: string,
  userId: string
): Promise<ProjectPermission | null> {
  if (!isFirebaseConfigured || !db) {
    throw new Error('Firebase is not configured.');
  }

  // Check if user is the owner
  const projectRef = doc(db, PROJECTS_COLLECTION, projectId);
  const projectSnap = await getDoc(projectRef);
  if (projectSnap.exists() && projectSnap.data().ownerId === userId) {
    return 'owner';
  }

  // Check share records
  const shareId = `${projectId}_${userId}`;
  const shareRef = doc(db, SHARES_COLLECTION, shareId);
  const shareSnap = await getDoc(shareRef);

  if (shareSnap.exists()) {
    return shareSnap.data().permission as ProjectPermission;
  }

  return null;
}
