export type Gender = 'male' | 'female';
export type TournamentType = 'mixed' | 'male' | 'female';
export type TeamMode = 'rotating' | 'fixed';
export type FixedTeamSubMode = 'random' | 'manual';

export interface Player {
  id: string;
  name: string;
  gender: Gender;
}

export interface Team {
  id: string;
  player1: Player;
  player2: Player;
}

export interface Match {
  id: string;
  team1: Team;
  team2: Team;
  score1: number | null;
  score2: number | null;
  round: number;
}

export interface Round {
  number: number;
  matches: Match[];
}

export interface TournamentState {
  type: TournamentType;
  mode: TeamMode;
  players: Player[];
  rounds: Round[];
  isStarted: boolean;
}
