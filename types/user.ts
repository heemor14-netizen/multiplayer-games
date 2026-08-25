export interface UserProfile {
  uid: string;
  displayName: string;
  photoURL: string | null;
  totalScore: number;
  gamesPlayed: number;
  createdAt: number;
}
