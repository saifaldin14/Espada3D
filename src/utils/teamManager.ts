/**
 * Team & Organization management via Firestore.
 *
 * Firestore collections:
 *   teams/{teamId}                – Team metadata
 *   teams/{teamId}/members/{uid}  – Membership document per user
 *
 * Each team has an owner (creator) and members with roles (owner, admin, editor, viewer).
 */

import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  updateDoc,
  query,
  where,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../config/firebase';

// ---- Types ----

export type TeamRole = 'owner' | 'admin' | 'editor' | 'viewer';

export interface TeamMember {
  uid: string;
  email: string;
  displayName: string;
  role: TeamRole;
  joinedAt: string;
}

export interface Team {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  ownerName: string;
  createdAt: string;
  updatedAt: string;
  memberCount: number;
}

export interface TeamInvite {
  teamId: string;
  teamName: string;
  invitedBy: string;
  invitedByName: string;
  role: TeamRole;
  createdAt: string;
}

// ---- Constants ----

const TEAMS_COLLECTION = 'teams';
const MEMBERS_SUBCOLLECTION = 'members';
const INVITES_COLLECTION = 'invites';

function assertFirebase(): void {
  if (!isFirebaseConfigured || !db) {
    throw new Error('Firebase is not configured. Set REACT_APP_FIREBASE_* environment variables.');
  }
}

// ---- Team CRUD ----

/**
 * Create a new team. The creator becomes the owner.
 */
export async function createTeam(
  ownerId: string,
  ownerEmail: string,
  ownerName: string,
  name: string,
  description: string = ''
): Promise<Team> {
  assertFirebase();

  const teamId = `team_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const now = new Date().toISOString();

  const team: Team = {
    id: teamId,
    name,
    description,
    ownerId,
    ownerName,
    createdAt: now,
    updatedAt: now,
    memberCount: 1,
  };

  // Create team document
  const teamRef = doc(db!, TEAMS_COLLECTION, teamId);
  await setDoc(teamRef, { ...team, _serverTimestamp: serverTimestamp() });

  // Add owner as the first member
  const memberRef = doc(db!, TEAMS_COLLECTION, teamId, MEMBERS_SUBCOLLECTION, ownerId);
  await setDoc(memberRef, {
    uid: ownerId,
    email: ownerEmail,
    displayName: ownerName,
    role: 'owner' as TeamRole,
    joinedAt: now,
  });

  return team;
}

/**
 * Get team details.
 */
export async function getTeam(teamId: string): Promise<Team | null> {
  assertFirebase();

  const teamRef = doc(db!, TEAMS_COLLECTION, teamId);
  const snapshot = await getDoc(teamRef);
  if (!snapshot.exists()) return null;

  const data = snapshot.data();
  return {
    id: snapshot.id,
    name: data.name,
    description: data.description || '',
    ownerId: data.ownerId,
    ownerName: data.ownerName || '',
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
    memberCount: data.memberCount || 1,
  };
}

/**
 * Update team metadata.
 */
export async function updateTeam(
  teamId: string,
  updates: Partial<Pick<Team, 'name' | 'description'>>
): Promise<void> {
  assertFirebase();

  const teamRef = doc(db!, TEAMS_COLLECTION, teamId);
  await updateDoc(teamRef, {
    ...updates,
    updatedAt: new Date().toISOString(),
    _serverTimestamp: serverTimestamp(),
  });
}

/**
 * Delete a team and all its members.
 */
export async function deleteTeam(teamId: string): Promise<void> {
  assertFirebase();

  // Delete all members first
  const membersRef = collection(db!, TEAMS_COLLECTION, teamId, MEMBERS_SUBCOLLECTION);
  const membersSnapshot = await getDocs(membersRef);
  const deletePromises = membersSnapshot.docs.map((d) => deleteDoc(d.ref));
  await Promise.all(deletePromises);

  // Delete the team
  const teamRef = doc(db!, TEAMS_COLLECTION, teamId);
  await deleteDoc(teamRef);
}

/**
 * List teams the user belongs to.
 * We query the members subcollection across all teams using a collection
 * group query. Since collection group queries on subcollections require
 * the same collection name across documents, this works with
 * teams/{teamId}/members/{uid}.
 *
 * Note: For collection group queries to work, the Firestore index must be
 * configured. As a fallback, we use a user-teams mapping collection.
 */
export async function listUserTeams(userId: string): Promise<Team[]> {
  assertFirebase();

  // Use a simpler approach: query a flat user-teams mapping collection
  const userTeamsRef = collection(db!, 'userTeams');
  const q = query(userTeamsRef, where('uid', '==', userId));
  const snapshot = await getDocs(q);

  const teamIds = snapshot.docs.map((d) => d.data().teamId as string);

  // Fetch each team
  const teams: Team[] = [];
  for (const teamId of teamIds) {
    const team = await getTeam(teamId);
    if (team) teams.push(team);
  }

  return teams;
}

// ---- Membership ----

/**
 * Add a member to a team.
 */
export async function addTeamMember(
  teamId: string,
  uid: string,
  email: string,
  displayName: string,
  role: TeamRole = 'editor'
): Promise<void> {
  assertFirebase();

  const memberRef = doc(db!, TEAMS_COLLECTION, teamId, MEMBERS_SUBCOLLECTION, uid);
  await setDoc(memberRef, {
    uid,
    email,
    displayName,
    role,
    joinedAt: new Date().toISOString(),
  });

  // Also add to the flat user-teams mapping
  const userTeamRef = doc(db!, 'userTeams', `${uid}_${teamId}`);
  await setDoc(userTeamRef, { uid, teamId });

  // Increment member count
  const teamRef = doc(db!, TEAMS_COLLECTION, teamId);
  const teamSnap = await getDoc(teamRef);
  if (teamSnap.exists()) {
    const currentCount = teamSnap.data().memberCount || 1;
    await updateDoc(teamRef, { memberCount: currentCount + 1, updatedAt: new Date().toISOString() });
  }
}

/**
 * Remove a member from a team.
 */
export async function removeTeamMember(teamId: string, uid: string): Promise<void> {
  assertFirebase();

  const memberRef = doc(db!, TEAMS_COLLECTION, teamId, MEMBERS_SUBCOLLECTION, uid);
  await deleteDoc(memberRef);

  // Remove from flat mapping
  const userTeamRef = doc(db!, 'userTeams', `${uid}_${teamId}`);
  await deleteDoc(userTeamRef);

  // Decrement member count
  const teamRef = doc(db!, TEAMS_COLLECTION, teamId);
  const teamSnap = await getDoc(teamRef);
  if (teamSnap.exists()) {
    const currentCount = teamSnap.data().memberCount || 2;
    await updateDoc(teamRef, { memberCount: Math.max(1, currentCount - 1), updatedAt: new Date().toISOString() });
  }
}

/**
 * Update a member's role.
 */
export async function updateMemberRole(
  teamId: string,
  uid: string,
  role: TeamRole
): Promise<void> {
  assertFirebase();

  const memberRef = doc(db!, TEAMS_COLLECTION, teamId, MEMBERS_SUBCOLLECTION, uid);
  await updateDoc(memberRef, { role });
}

/**
 * Get all members of a team.
 */
export async function getTeamMembers(teamId: string): Promise<TeamMember[]> {
  assertFirebase();

  const membersRef = collection(db!, TEAMS_COLLECTION, teamId, MEMBERS_SUBCOLLECTION);
  const snapshot = await getDocs(membersRef);

  return snapshot.docs.map((d) => {
    const data = d.data();
    return {
      uid: data.uid,
      email: data.email,
      displayName: data.displayName,
      role: data.role as TeamRole,
      joinedAt: data.joinedAt,
    };
  });
}

/**
 * Get a user's role in a team.
 */
export async function getUserTeamRole(teamId: string, uid: string): Promise<TeamRole | null> {
  assertFirebase();

  const memberRef = doc(db!, TEAMS_COLLECTION, teamId, MEMBERS_SUBCOLLECTION, uid);
  const snapshot = await getDoc(memberRef);

  if (!snapshot.exists()) return null;
  return snapshot.data().role as TeamRole;
}

/**
 * Check if a user has the required permission level in a team.
 * Hierarchy: owner > admin > editor > viewer
 */
export function hasPermission(userRole: TeamRole | null, requiredRole: TeamRole): boolean {
  if (!userRole) return false;

  const hierarchy: Record<TeamRole, number> = {
    owner: 4,
    admin: 3,
    editor: 2,
    viewer: 1,
  };

  return hierarchy[userRole] >= hierarchy[requiredRole];
}

// ---- Invites ----

/**
 * Create a team invite for a user by email.
 */
export async function createTeamInvite(
  teamId: string,
  teamName: string,
  invitedByUid: string,
  invitedByName: string,
  inviteeEmail: string,
  role: TeamRole = 'editor'
): Promise<string> {
  assertFirebase();

  const inviteId = `invite_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const inviteRef = doc(db!, INVITES_COLLECTION, inviteId);

  await setDoc(inviteRef, {
    id: inviteId,
    teamId,
    teamName,
    invitedBy: invitedByUid,
    invitedByName,
    inviteeEmail,
    role,
    status: 'pending',
    createdAt: new Date().toISOString(),
    _serverTimestamp: serverTimestamp(),
  });

  return inviteId;
}

/**
 * List pending invites for a user's email.
 */
export async function listPendingInvites(email: string): Promise<(TeamInvite & { id: string })[]> {
  assertFirebase();

  const q = query(
    collection(db!, INVITES_COLLECTION),
    where('inviteeEmail', '==', email),
    where('status', '==', 'pending')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      teamId: data.teamId,
      teamName: data.teamName,
      invitedBy: data.invitedBy,
      invitedByName: data.invitedByName,
      role: data.role as TeamRole,
      createdAt: data.createdAt,
    };
  });
}

/**
 * Accept a team invite.
 */
export async function acceptInvite(
  inviteId: string,
  uid: string,
  email: string,
  displayName: string
): Promise<void> {
  assertFirebase();

  const inviteRef = doc(db!, INVITES_COLLECTION, inviteId);
  const inviteSnap = await getDoc(inviteRef);

  if (!inviteSnap.exists()) {
    throw new Error('Invite not found');
  }

  const data = inviteSnap.data();
  if (data.status !== 'pending') {
    throw new Error('Invite is no longer pending');
  }

  // Add user to team
  await addTeamMember(data.teamId, uid, email, displayName, data.role);

  // Mark invite as accepted
  await updateDoc(inviteRef, { status: 'accepted' });
}

/**
 * Decline a team invite.
 */
export async function declineInvite(inviteId: string): Promise<void> {
  assertFirebase();

  const inviteRef = doc(db!, INVITES_COLLECTION, inviteId);
  await updateDoc(inviteRef, { status: 'declined' });
}
