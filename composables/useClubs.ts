/**
 * useClubs
 * --------
 * All GraphQL queries, mutations and reactive state for the Clubs feature.
 * Mirrors the REST-oriented useAxios usage in the existing pages.
 */

import { useGraphQL } from '../composables/useGraphQL'

// ---------------------------------------------------------------------------
// GQL Documents
// ---------------------------------------------------------------------------

const CLUB_FIELDS = /* graphql */ `
  id slug name shortDescription longDescription
  icon coverImage themeColor banner thumbnail
  visibility mode
  ownerId ownerType
  membersCount maxMembers
  tags level language timezone estimatedDuration
  isActive archived completed
  joinCode allowInvites requireApproval
  welcomeMessage rules
  engagementScore rating reviewsCount
  lastActivityAt createdAt updatedAt
  features {
    assignmentsEnabled gradingEnabled discussionsEnabled
    liveSessionsEnabled gamificationEnabled rankingEnabled certificatesEnabled
  }
`

const MEMBER_FIELDS = /* graphql */ `
  id userId clubId role status
  nicknameInClub participationScore completedAssignments
  lastSeenAt notificationsEnabled joinedAt
  user { id username fullName profilePictureUrl }
`

const POST_FIELDS = /* graphql */ `
  id clubId authorId title content
  isPinned isAnnouncement createdAt updatedAt
  author { id username fullName profilePictureUrl }
`

const ASSIGNMENT_FIELDS = /* graphql */ `
  id clubId createdBy title description
  deadline maxScore isActive createdAt updatedAt
  creator { id username fullName }
`

const SUBMISSION_FIELDS = /* graphql */ `
  id assignmentId studentId content
  score feedback submittedAt gradedAt
  student { id username fullName profilePictureUrl }
`

// Queries
export const Q_CLUBS = /* graphql */ `
  query ListClubs($limit: Int, $offset: Int) {
    clubs(limit: $limit, offset: $offset) { ${CLUB_FIELDS} }
  }
`

export const Q_SEARCH_CLUBS = /* graphql */ `
  query SearchClubs($filter: ClubSearchFilter, $limit: Int, $offset: Int) {
    searchClubs(filter: $filter, limit: $limit, offset: $offset) { ${CLUB_FIELDS} }
  }
`

export const Q_MY_CLUBS = /* graphql */ `
  query MyClubs { myClubs { ${CLUB_FIELDS} } }
`

export const Q_CLUB_BY_SLUG = /* graphql */ `
  query ClubBySlug($slug: String!) {
    clubBySlug(slug: $slug) { ${CLUB_FIELDS} owner { id username fullName profilePictureUrl } }
  }
`

export const Q_MY_MEMBERSHIP = /* graphql */ `
  query MyMembership($clubId: UUID!) {
    myMembership(clubId: $clubId) { ${MEMBER_FIELDS} }
  }
`

export const Q_CLUB_MEMBERS = /* graphql */ `
  query ClubMembers($clubId: UUID!, $includePending: Boolean) {
    clubMembers(clubId: $clubId, includePending: $includePending) { ${MEMBER_FIELDS} }
  }
`

export const Q_CLUB_FEED = /* graphql */ `
  query ClubFeed($clubId: UUID!, $limit: Int, $offset: Int) {
    clubFeed(clubId: $clubId, limit: $limit, offset: $offset) { ${POST_FIELDS} }
  }
`

export const Q_CLUB_ASSIGNMENTS = /* graphql */ `
  query ClubAssignments($clubId: UUID!) {
    clubAssignments(clubId: $clubId) { ${ASSIGNMENT_FIELDS} }
  }
`

export const Q_ASSIGNMENT_SUBMISSIONS = /* graphql */ `
  query AssignmentSubmissions($assignmentId: UUID!) {
    assignmentSubmissions(assignmentId: $assignmentId) { ${SUBMISSION_FIELDS} }
  }
`

export const Q_MY_SUBMISSION = /* graphql */ `
  query MySubmission($assignmentId: UUID!) {
    mySubmission(assignmentId: $assignmentId) { ${SUBMISSION_FIELDS} }
  }
`

export const Q_CLUB_STATS = /* graphql */ `
  query ClubStats($clubId: UUID!) {
    clubStats(clubId: $clubId) {
      clubId membersCount activeMembersCount pendingMembersCount
      postsCount assignmentsCount avgCompletionRate engagementScore
    }
  }
`

// Mutations
export const M_CREATE_CLUB = /* graphql */ `
  mutation CreateClub($input: CreateClubInput!) {
    createClub(input: $input) { ${CLUB_FIELDS} }
  }
`

export const M_UPDATE_CLUB = /* graphql */ `
  mutation UpdateClub($clubId: UUID!, $input: UpdateClubInput!) {
    updateClub(clubId: $clubId, input: $input) { ${CLUB_FIELDS} }
  }
`

export const M_DELETE_CLUB = /* graphql */ `
  mutation DeleteClub($clubId: UUID!) { deleteClub(clubId: $clubId) }
`

export const M_JOIN_BY_CODE = /* graphql */ `
  mutation JoinByCode($joinCode: String!) {
    joinClubByCode(joinCode: $joinCode) { ${MEMBER_FIELDS} }
  }
`

export const M_REQUEST_JOIN = /* graphql */ `
  mutation RequestJoin($clubId: UUID!) {
    requestToJoinClub(clubId: $clubId) { ${MEMBER_FIELDS} }
  }
`

export const M_APPROVE_MEMBER = /* graphql */ `
  mutation ApproveMember($clubId: UUID!, $userId: UUID!) {
    approveClubMember(clubId: $clubId, userId: $userId) { ${MEMBER_FIELDS} }
  }
`

export const M_REJECT_MEMBER = /* graphql */ `
  mutation RejectMember($clubId: UUID!, $userId: UUID!) {
    rejectClubMember(clubId: $clubId, userId: $userId)
  }
`

export const M_REMOVE_MEMBER = /* graphql */ `
  mutation RemoveMember($clubId: UUID!, $userId: UUID!) {
    removeClubMember(clubId: $clubId, userId: $userId)
  }
`

export const M_CHANGE_ROLE = /* graphql */ `
  mutation ChangeRole($clubId: UUID!, $userId: UUID!, $newRole: ClubMemberRoleGQL!) {
    changeMemberRole(clubId: $clubId, userId: $userId, newRole: $newRole) { ${MEMBER_FIELDS} }
  }
`

export const M_BAN_MEMBER = /* graphql */ `
  mutation BanMember($clubId: UUID!, $userId: UUID!) {
    banClubMember(clubId: $clubId, userId: $userId) { ${MEMBER_FIELDS} }
  }
`

export const M_CREATE_POST = /* graphql */ `
  mutation CreatePost($clubId: UUID!, $input: CreatePostInput!) {
    createClubPost(clubId: $clubId, input: $input) { ${POST_FIELDS} }
  }
`

export const M_DELETE_POST = /* graphql */ `
  mutation DeletePost($postId: UUID!) { deleteClubPost(postId: $postId) }
`

export const M_CREATE_ASSIGNMENT = /* graphql */ `
  mutation CreateAssignment($clubId: UUID!, $input: CreateAssignmentInput!) {
    createAssignment(clubId: $clubId, input: $input) { ${ASSIGNMENT_FIELDS} }
  }
`

export const M_DELETE_ASSIGNMENT = /* graphql */ `
  mutation DeleteAssignment($assignmentId: UUID!) {
    deleteAssignment(assignmentId: $assignmentId)
  }
`

export const M_SUBMIT_ASSIGNMENT = /* graphql */ `
  mutation SubmitAssignment($assignmentId: UUID!, $input: SubmitAssignmentInput!) {
    submitAssignment(assignmentId: $assignmentId, input: $input) { ${SUBMISSION_FIELDS} }
  }
`

export const M_GRADE_SUBMISSION = /* graphql */ `
  mutation GradeSubmission($submissionId: UUID!, $score: Float!, $feedback: String) {
    gradeSubmission(submissionId: $submissionId, score: $score, feedback: $feedback) { ${SUBMISSION_FIELDS} }
  }
`

export const M_REGENERATE_CODE = /* graphql */ `
  mutation RegenerateCode($clubId: UUID!) {
    regenerateJoinCode(clubId: $clubId) { id joinCode }
  }
`

export const M_TRANSFER_OWNERSHIP = /* graphql */ `
  mutation TransferOwnership($clubId: UUID!, $newOwnerId: UUID!) {
    transferClubOwnership(clubId: $clubId, newOwnerId: $newOwnerId) { id ownerId }
  }
`

// ---------------------------------------------------------------------------
// Composable
// ---------------------------------------------------------------------------

export function useClubs() {
  const { query, mutate } = useGraphQL()

  // ── Queries ──────────────────────────────────────────────────────────────

  async function fetchPublicClubs(limit = 20, offset = 0) {
    const data = await query(Q_CLUBS, { limit, offset })
    return data.clubs as any[]
  }

  async function searchClubs(filter: Record<string, any>, limit = 20, offset = 0) {
    const data = await query(Q_SEARCH_CLUBS, { filter, limit, offset })
    return data.searchClubs as any[]
  }

  async function fetchMyClubs() {
    const data = await query(Q_MY_CLUBS)
    return data.myClubs as any[]
  }

  async function fetchClubBySlug(slug: string) {
    const data = await query(Q_CLUB_BY_SLUG, { slug })
    return data.clubBySlug as any
  }

  async function fetchMyMembership(clubId: string) {
    const data = await query(Q_MY_MEMBERSHIP, { clubId })
    return data.myMembership as any | null
  }

  async function fetchMembers(clubId: string, includePending = false) {
    const data = await query(Q_CLUB_MEMBERS, { clubId, includePending })
    return data.clubMembers as any[]
  }

  async function fetchFeed(clubId: string, limit = 20, offset = 0) {
    const data = await query(Q_CLUB_FEED, { clubId, limit, offset })
    return data.clubFeed as any[]
  }

  async function fetchAssignments(clubId: string) {
    const data = await query(Q_CLUB_ASSIGNMENTS, { clubId })
    return data.clubAssignments as any[]
  }

  async function fetchSubmissions(assignmentId: string) {
    const data = await query(Q_ASSIGNMENT_SUBMISSIONS, { assignmentId })
    return data.assignmentSubmissions as any[]
  }

  async function fetchMySubmission(assignmentId: string) {
    const data = await query(Q_MY_SUBMISSION, { assignmentId })
    return data.mySubmission as any | null
  }

  async function fetchStats(clubId: string) {
    const data = await query(Q_CLUB_STATS, { clubId })
    return data.clubStats as any
  }

  // ── Mutations ─────────────────────────────────────────────────────────────

  async function createClub(input: Record<string, any>) {
    const data = await mutate(M_CREATE_CLUB, { input })
    return data.createClub as any
  }

  async function updateClub(clubId: string, input: Record<string, any>) {
    const data = await mutate(M_UPDATE_CLUB, { clubId, input })
    return data.updateClub as any
  }

  async function deleteClub(clubId: string) {
    const data = await mutate(M_DELETE_CLUB, { clubId })
    return data.deleteClub as boolean
  }

  async function joinByCode(joinCode: string) {
    const data = await mutate(M_JOIN_BY_CODE, { joinCode })
    return data.joinClubByCode as any
  }

  async function requestJoin(clubId: string) {
    const data = await mutate(M_REQUEST_JOIN, { clubId })
    return data.requestToJoinClub as any
  }

  async function approveMember(clubId: string, userId: string) {
    const data = await mutate(M_APPROVE_MEMBER, { clubId, userId })
    return data.approveClubMember as any
  }

  async function rejectMember(clubId: string, userId: string) {
    const data = await mutate(M_REJECT_MEMBER, { clubId, userId })
    return data.rejectClubMember as boolean
  }

  async function removeMember(clubId: string, userId: string) {
    const data = await mutate(M_REMOVE_MEMBER, { clubId, userId })
    return data.removeClubMember as boolean
  }

  async function changeRole(clubId: string, userId: string, newRole: string) {
    const data = await mutate(M_CHANGE_ROLE, { clubId, userId, newRole })
    return data.changeMemberRole as any
  }

  async function banMember(clubId: string, userId: string) {
    const data = await mutate(M_BAN_MEMBER, { clubId, userId })
    return data.banClubMember as any
  }

  async function createPost(clubId: string, input: Record<string, any>) {
    const data = await mutate(M_CREATE_POST, { clubId, input })
    return data.createClubPost as any
  }

  async function deletePost(postId: string) {
    const data = await mutate(M_DELETE_POST, { postId })
    return data.deleteClubPost as boolean
  }

  async function createAssignment(clubId: string, input: Record<string, any>) {
    const data = await mutate(M_CREATE_ASSIGNMENT, { clubId, input })
    return data.createAssignment as any
  }

  async function deleteAssignment(assignmentId: string) {
    const data = await mutate(M_DELETE_ASSIGNMENT, { assignmentId })
    return data.deleteAssignment as boolean
  }

  async function submitAssignment(assignmentId: string, input: Record<string, any>) {
    const data = await mutate(M_SUBMIT_ASSIGNMENT, { assignmentId, input })
    return data.submitAssignment as any
  }

  async function gradeSubmission(submissionId: string, score: number, feedback?: string) {
    const data = await mutate(M_GRADE_SUBMISSION, { submissionId, score, feedback })
    return data.gradeSubmission as any
  }

  async function regenerateCode(clubId: string) {
    const data = await mutate(M_REGENERATE_CODE, { clubId })
    return data.regenerateJoinCode as any
  }

  return {
    // queries
    fetchPublicClubs,
    searchClubs,
    fetchMyClubs,
    fetchClubBySlug,
    fetchMyMembership,
    fetchMembers,
    fetchFeed,
    fetchAssignments,
    fetchSubmissions,
    fetchMySubmission,
    fetchStats,
    // mutations
    createClub,
    updateClub,
    deleteClub,
    joinByCode,
    requestJoin,
    approveMember,
    rejectMember,
    removeMember,
    changeRole,
    banMember,
    createPost,
    deletePost,
    createAssignment,
    deleteAssignment,
    submitAssignment,
    gradeSubmission,
    regenerateCode,
  }
}