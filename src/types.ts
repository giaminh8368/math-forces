/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Problem {
  id: string;
  title: string;
  rating: number; // 800 to 3000
  category: 'Calculus' | 'Linear Algebra' | 'Series' | '3D Geometry' | 'Proofs';
  statement: string; // Markdown or plain LaTeX
  sampleInput?: string;
  sampleOutput?: string;
  solution?: string; // Standard analytical solution
  editorial?: string; // Steps explanation
  intuition: string; // The "Deep geometric/ML intuition"
  tags: string[];
  isCustom?: boolean;
}

export type Verdict = 'AC' | 'WA' | 'RTE' | 'TLE' | 'PENDING';

export interface Submission {
  id: string;
  problemId: string;
  problemTitle: string;
  rating: number;
  language: 'Math Step' | 'Python/NumPy' | 'Logic Proof';
  code: string;
  verdict: Verdict;
  feedback: string;
  submittedAt: string;
  ratingChange?: number;
}

export interface UserStatus {
  username: string;
  elo: number; // starts at 1200
  title: string; // Pupil, Expert, Specialist, Master, Grandmaster, etc.
  streak: number;
  solvedCount: number;
  subCount: number;
}

export interface VirtualContest {
  id: string;
  title: string;
  startTime: string;
  durationSeconds: number;
  problems: Problem[];
  solvedIds: string[];
  score: number;
}
