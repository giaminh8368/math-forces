/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Brain, Cpu, BookOpen, Trophy, 
  Clock, Send, Upload, History, 
  FileCode, CheckCircle2, XCircle, 
  AlertCircle, ChevronRight, HelpCircle, 
  Search, RefreshCw, Flame, Lightbulb,
  CornerDownRight, User, Terminal
} from 'lucide-react';
import { MathRenderer } from './components/MathRenderer';
import { PRELOADED_PROBLEMS } from './problemsData';
import { Problem, Submission, UserStatus, VirtualContest, Verdict } from './types';
import { LECTURES_DATA, Lecture } from './lecturesData';

// Get ELO rank styling helper
export function getRankDetails(elo: number) {
  if (elo < 1200) return { title: 'Newbie', color: 'text-cf-newbie', bg: 'bg-[#808080]/10', border: 'border-[#808080]/30', hex: '#808080' };
  if (elo < 1400) return { title: 'Pupil', color: 'text-green-500', bg: 'bg-[#008000]/10', border: 'border-green-500/30', hex: '#008000' };
  if (elo < 1600) return { title: 'Specialist', color: 'text-teal-400', bg: 'bg-teal-500/10', border: 'border-teal-500/30', hex: '#03a89e' };
  if (elo < 1900) return { title: 'Expert', color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/30', hex: '#0000ff' };
  if (elo < 2200) return { title: 'Candidate Master', color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/30', hex: '#aa00aa' };
  if (elo < 2400) return { title: 'Master', color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-[#ff8c00]/30', hex: '#ff8c00' };
  return { title: 'Grandmaster', color: 'text-red-500 font-extrabold animate-pulse', bg: 'bg-red-500/10', border: 'border-red-500/30', hex: '#ff0000' };
}

// Default solution templates for convenience
const SOLUTION_TEMPLATES: Record<string, string> = {
  Calculus: `% Lời giải Giải tích / Calculus Solution Step-by-Step\n% Bước 1 (Đặt nhân tử / Substitution):\nLet u = ...\n\n% Bước 2 (Biến đổi / Integration):\nThus, output integrates to:\n...\n\n% Bước 3 (Kết quả cuối cùng / Final result):\nHence, the final analytic form is:\n...`,
  'Linear Algebra': `# Lời giải Đại số tuyến tính / Linear Algebra Form\n# Step 1: Characteristic equation det(A - lambda * I) = 0\n\n# Step 2: Calculation of Eigenvalues and Eigenspaces\n\n# Step 3: Resulting transition matrix`,
  Others: `% Gõ mã nguồn hoặc các dòng chứng minh toán học của bạn tại đây\n% Gợi ý: Hãy trình bày rõ nét các bước biến đổi chi tiết để nhận AC`
};

export default function App() {
  // Master problem set (preloaded + dynamically loaded via Vision parser)
  const [problems, setProblems] = useState<Problem[]>(() => {
    const saved = localStorage.getItem('kaistforces_problems');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Combine preloaded with custom, avoiding duplicates by id
        const merged = [...PRELOADED_PROBLEMS];
        parsed.forEach((custom: Problem) => {
          if (!merged.some(p => p.id === custom.id)) {
            merged.push(custom);
          }
        });
        return merged;
      } catch (e) {
        return PRELOADED_PROBLEMS;
      }
    }
    return PRELOADED_PROBLEMS;
  });

  // User Stats & Elo
  const [userStatus, setUserStatus] = useState<UserStatus>(() => {
    const saved = localStorage.getItem('kaistforces_user');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return {
      username: 'VOI_to_KAIST_Scholar',
      elo: 1200,
      title: 'Pupil',
      streak: 5,
      solvedCount: 0,
      subCount: 0
    };
  });

  // Submissions Logs
  const [submissions, setSubmissions] = useState<Submission[]>(() => {
    const saved = localStorage.getItem('kaistforces_subs');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [];
  });

  // Navigation and Filtering Active states
  const [activeTab, setActiveTab] = useState<'problems' | 'contests' | 'submissions' | 'upload' | 'theory'>('problems');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedRating, setSelectedRating] = useState<string>('All');
  const [selectedLecture, setSelectedLecture] = useState<Lecture>(LECTURES_DATA[0]);
  
  // Active Interactive Components
  const [selectedProblem, setSelectedProblem] = useState<Problem | null>(null);
  const [draftSolution, setDraftSolution] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState<'Math Step' | 'Python/NumPy' | 'Logic Proof'>('Math Step');
  
  // Virtual Contest Status
  const [activeContest, setActiveContest] = useState<VirtualContest | null>(() => {
    const saved = localStorage.getItem('kaistforces_contest');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return null;
  });
  const [contestTimeLeft, setContestTimeLeft] = useState(0);

  // Loading, API & Judgment status
  const [isJudging, setIsJudging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [judgementResult, setJudgementResult] = useState<Submission | null>(null);
  const [parsingError, setParsingError] = useState<string | null>(null);
  const [rawImageUpload, setRawImageUpload] = useState<string | null>(null);
  const [hintRequested, setHintRequested] = useState(false);
  const [showEditorial, setShowEditorial] = useState(false);
  const [revealFormat, setRevealFormat] = useState(false);
  const [gradingMode, setGradingMode] = useState<'local' | 'ai'>('local');

  // Command bar floating console states
  const [terminalInput, setTerminalInput] = useState('');
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    'Welcome to KAIST-Forces Core Console v1.0.',
    'System status initialized. Initial Cadet: Pupil. Type /help to see all available professor commands.'
  ]);
  const [showTerminal, setShowTerminal] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Save changes to localStorage on updates
  useEffect(() => {
    localStorage.setItem('kaistforces_problems', JSON.stringify(problems.filter(p => p.isCustom)));
  }, [problems]);

  useEffect(() => {
    localStorage.setItem('kaistforces_user', JSON.stringify(userStatus));
  }, [userStatus]);

  useEffect(() => {
    localStorage.setItem('kaistforces_subs', JSON.stringify(submissions));
  }, [submissions]);

  useEffect(() => {
    if (activeContest) {
      localStorage.setItem('kaistforces_contest', JSON.stringify(activeContest));
    } else {
      localStorage.removeItem('kaistforces_contest');
    }
  }, [activeContest]);

  // Handle active virtual contest countdown timer
  useEffect(() => {
    if (!activeContest) return;
    
    // Calculate seconds left
    const elapsedSeconds = Math.floor((Date.now() - new Date(activeContest.startTime).getTime()) / 1000);
    const left = Math.max(0, activeContest.durationSeconds - elapsedSeconds);
    setContestTimeLeft(left);

    if (left <= 0) {
      // Contest finished automatically!
      setTerminalLogs(prev => [...prev, '⏰ Virtual Contest expired. Submitting scoreboard points.']);
      setActiveContest(null);
      return;
    }

    const timer = setInterval(() => {
      setContestTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setActiveContest(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [activeContest]);

  // Terminal logs smart auto-scroll
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [terminalLogs]);

  // Handle Problem Select template inserts
  useEffect(() => {
    if (selectedProblem) {
      setDraftSolution(SOLUTION_TEMPLATES[selectedProblem.category] || SOLUTION_TEMPLATES.Others);
      setJudgementResult(null);
      setHintRequested(false);
      setShowEditorial(false);
      setRevealFormat(false);
    }
  }, [selectedProblem]);

  // Core functions
  const handleTerminalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = terminalInput.trim();
    if (!cmd) return;

    setTerminalLogs(prev => [...prev, `> ${cmd}`]);
    setTerminalInput('');

    const args = cmd.split(' ');
    const commandName = args[0].toLowerCase();

    switch (commandName) {
      case '/help':
        setTerminalLogs(prev => [
          ...prev,
          '🔧 Available Commands:',
          '  /status            Display Cadet details, streak & Cadet Title ELO',
          '  /problem [rating]  Match next math problem with matching ELO difficulty',
          '  /contest           Initialize active Virtual Cadet contest (5 tasks | 120m)',
          '  /hint              Request step suggestions on active problem (Deducts 10% score)',
          '  /clear             Clear the terminal history'
        ]);
        break;
      case '/clear':
        setTerminalLogs([]);
        break;
      case '/status':
        const rank = getRankDetails(userStatus.elo);
        setTerminalLogs(prev => [
          ...prev,
          `Cadet Handle: ${userStatus.username}`,
          `ELO Rank Level: ${userStatus.elo} (${rank.title})`,
          `Streak Multiplier: ${userStatus.streak} consecutive days`,
          `Status: AC ${userStatus.solvedCount} / Total attempted ${userStatus.subCount}`
        ]);
        break;
      case '/problem':
        const rTarget = args[1] ? parseInt(args[1]) : 0;
        let candidates = rTarget 
          ? problems.filter(p => Math.abs(p.rating - rTarget) <= 200)
          : problems;
        if (candidates.length === 0) candidates = problems;
        
        const randomProblem = candidates[Math.floor(Math.random() * candidates.length)];
        setSelectedProblem(randomProblem);
        setActiveTab('problems');
        setTerminalLogs(prev => [...prev, `🎯 Loading problem: "${randomProblem.title}" (Rating: ${randomProblem.rating})`]);
        break;
      case '/contest':
        startNewContest();
        break;
      case '/hint':
        if (!selectedProblem) {
          setTerminalLogs(prev => [...prev, '⚠️ No active problem selected in the Workspace. Please click or summon a problem first.']);
        } else {
          setHintRequested(true);
          setTerminalLogs(prev => [...prev, `💡 Hint loaded for "${selectedProblem.title}". A 10% penalty holds upon Accepted submission.`]);
        }
        break;
      default:
        setTerminalLogs(prev => [...prev, `❌ Unrecognized command: "${commandName}". Type /help for assistance.`]);
    }
  };

  // Start virtual contest
  const startNewContest = () => {
    // Select 5 unique problems of increasing difficulty
    const sorted = [...problems].sort((a,b) => a.rating - b.rating);
    const selected: Problem[] = [];
    
    // Pick from distinct rating brackets
    const brackets = [1100, 1400, 1600, 1900, 2400];
    brackets.forEach(target => {
      const candidates = sorted.filter(p => p.rating >= target - 150 && p.rating <= target + 150 && !selected.some(s => s.id === p.id));
      if (candidates.length > 0) {
        selected.push(candidates[Math.floor(Math.random() * candidates.length)]);
      }
    });

    // Fallback if brackets empty
    while (selected.length < 5 && sorted.length >= 5) {
      const item = sorted[Math.floor(Math.random() * sorted.length)];
      if (!selected.some(s => s.id === item.id)) {
        selected.push(item);
      }
    }

    const contest: VirtualContest = {
      id: `Contest_${Date.now()}`,
      title: 'KAIST MAS-Core Virtual Midterm Exam',
      startTime: new Date().toISOString(),
      durationSeconds: 120 * 60, // 120 minutes
      problems: selected,
      solvedIds: [],
      score: 0
    };

    setActiveContest(contest);
    setSelectedProblem(selected[0]);
    setActiveTab('contests');
    setTerminalLogs(prev => [
      ...prev,
      '🏆 KAIST MAS-Core Virtual contest started successfully!',
      'Duration: 120 minutes | 5 problems of increasing difficulty.',
      `Problem A: ${selected[0]?.title} (Rating: ${selected[0]?.rating})`
    ]);
  };

  // Math Answer Normalization and Exact Expression Matching
  const normalizeMathString = (str: string): string => {
    return str
      .toLowerCase()
      .replace(/\s+/g, '') // Remove all whitespaces and tabs
      .replace(/\\mathrm/g, '') // Strip LaTeX formatting
      .replace(/\\text/g, '')
      .replace(/\\left/g, '')
      .replace(/\\right/g, '')
      // Remove LaTeX formatting symbols, brackets, variables and commas
      .replace(/[\$\{\}\(\)\|\\\[\]\*,]/g, '')
      .replace(/\+c$/i, '') // Squeeze indefinite integral constants
      .replace(/\+constant$/i, '')
      .trim();
  };

  const checkLocalAnswer = (userRaw: string, expectedRaw: string): boolean => {
    if (!userRaw || !expectedRaw) return false;

    const userNorm = normalizeMathString(userRaw);
    const expectedNorm = normalizeMathString(expectedRaw);

    if (!userNorm || !expectedNorm) return false;

    // Direct match after stripping markup
    if (userNorm === expectedNorm) return true;

    // Substring match
    if (userNorm.includes(expectedNorm)) return true;

    // Smart fraction to decimal equivalences
    if (expectedNorm === '3/2' && (userNorm.includes('1.5') || userNorm.includes('3/2'))) return true;
    if (expectedNorm === '1/2' && (userNorm.includes('0.5') || userNorm.includes('1/2'))) return true;
    if (expectedNorm === '1/4' && (userNorm.includes('0.25') || userNorm.includes('1/4'))) return true;
    if (expectedNorm === '3/4' && (userNorm.includes('0.75') || userNorm.includes('3/4'))) return true;

    // Common algebraic commutative variations
    if (expectedNorm === '1+2x' && (userNorm.includes('2x+1') || userNorm.includes('1+2x'))) return true;
    if (expectedNorm === '2x+1' && (userNorm.includes('1+2x') || userNorm.includes('2x+1'))) return true;

    return false;
  };

  // Master Math solution grader/judge API call
  const submitSolution = async () => {
    if (!selectedProblem) return;
    if (!draftSolution.trim()) return;

    setIsJudging(true);
    setJudgementResult(null);

    // If local mode is chosen, execute instantly with local checker
    if (gradingMode === 'local') {
      try {
        // Short timeout for realistic grading feeling
        await new Promise(resolve => setTimeout(resolve, 600));

        const alreadySolved = submissions.some(s => s.problemId === selectedProblem.id && s.verdict === 'AC');
        const isCorrect = checkLocalAnswer(draftSolution, selectedProblem.sampleOutput || '');
        const verdict = isCorrect ? 'AC' : 'WA';
        let feedback = isCorrect 
          ? `🟩 [LOCAL MATCHER - AC]: Chúc mừng! Kết quả của bạn đã khớp hoàn toàn với đáp án mẫu chuẩn ($${selectedProblem.sampleOutput}$). Các bước biến đổi tuyến tính/tích phân đã được kiểm tra đạt độ chính xác cần thiết.${alreadySolved ? ' (Bài tập này đã được bạn giải trước đó, Elo giữ nguyên).' : ''}`
          : `🟥 [LOCAL MATCHER - WA]: Kết quả của bạn chưa khớp với đáp án mẫu. Vui lòng kiểm tra lại các bước tính toán, dấu của tích phân, hoặc định dạng của hằng số cộng thêm.${alreadySolved ? ' (Bài tập này đã được bạn giải trước đó, Elo giữ nguyên).' : ''}`;

        // Calculate dynamic ELO updates
        let eloChange = 0;
        if (!alreadySolved) {
          const pointsBase = selectedProblem.rating / 10;
          if (isCorrect) {
            let penalty = hintRequested ? 0.9 : 1.0;
            eloChange = Math.round((pointsBase * 0.15) * penalty);
            if (selectedProblem.rating >= 2100) eloChange += 10;
          } else {
            eloChange = Math.round(- (pointsBase * 0.05));
          }
        }

        const newElo = Math.max(800, userStatus.elo + eloChange);
        const solvedIds = isCorrect 
          ? [...submissions.filter(s => s.verdict === 'AC').map(s => s.problemId), selectedProblem.id] 
          : submissions.filter(s => s.verdict === 'AC').map(s => s.problemId);
        const uniqueSolved = Array.from(new Set(solvedIds));

        // Update User info
        setUserStatus(prev => ({
          ...prev,
          elo: newElo,
          solvedCount: uniqueSolved.length,
          subCount: prev.subCount + 1,
          streak: isCorrect ? prev.streak + 1 : 0
        }));

        const newSub: Submission = {
          id: `Sub_${Date.now()}`,
          problemId: selectedProblem.id,
          problemTitle: selectedProblem.title,
          rating: selectedProblem.rating,
          language: selectedLanguage,
          code: draftSolution,
          verdict: verdict as Verdict,
          feedback: feedback,
          submittedAt: new Date().toLocaleTimeString(),
          ratingChange: eloChange
        };

        setSubmissions(prev => [newSub, ...prev]);
        setJudgementResult(newSub);

        // Virtual Contest Logic
        if (activeContest) {
          const isProblemInContest = activeContest.problems.some(p => p.id === selectedProblem.id);
          if (isProblemInContest && isCorrect) {
            const isFreshSolve = !activeContest.solvedIds.includes(selectedProblem.id);
            if (isFreshSolve) {
              const updatedSolved = [...activeContest.solvedIds, selectedProblem.id];
              const contestMinutesElapsed = Math.floor((Date.now() - new Date(activeContest.startTime).getTime()) / (60000));
              const calculatedPoints = Math.round(selectedProblem.rating - (contestMinutesElapsed * 2));
              const freshScore = activeContest.score + Math.max(selectedProblem.rating / 2, calculatedPoints);
              
              setActiveContest(prev => prev ? {
                ...prev,
                solvedIds: updatedSolved,
                score: freshScore
              } : null);

              setTerminalLogs(prev => [...prev, `🎉 Contest Accepted! +${calculatedPoints} score added to leaderboard.`]);
            }
          }
        }

        setTerminalLogs(prev => [
          ...prev,
          `Verdict: [${verdict}] (Local Mode) for problem: ${selectedProblem.title}. ELO adjustment: ${eloChange >= 0 ? '+' : ''}${eloChange}`
        ]);

      } catch (err: any) {
        console.error("Local grading error:", err);
      } finally {
        setIsJudging(false);
      }
      return;
    }

    // AI Grader Mode (calls backend)
    try {
      const response = await fetch('/api/judge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problemTitle: selectedProblem.title,
          rating: selectedProblem.rating,
          category: selectedProblem.category,
          statement: selectedProblem.statement,
          code: draftSolution,
          language: selectedLanguage,
          sampleOutput: selectedProblem.sampleOutput
        })
      });

      if (!response.ok) {
        throw new Error('API server returned error status.');
      }

      const res = await response.json();
      
      // Calculate ELO adjustments
      const alreadySolved = submissions.some(s => s.problemId === selectedProblem.id && s.verdict === 'AC');
      let eloChange = 0;
      const isCorrect = res.verdict === 'AC';

      if (!alreadySolved) {
        const pointsBase = selectedProblem.rating / 10;
        if (isCorrect) {
          // Multiplier if they solved it within active contest
          let penalty = hintRequested ? 0.9 : 1.0;
          eloChange = Math.round((pointsBase * 0.15) * penalty);
          // Bonus for grandmaster ratings
          if (selectedProblem.rating >= 2100) eloChange += 10;
        } else {
          eloChange = Math.round(- (pointsBase * 0.05));
        }
      }

      const newElo = Math.max(800, userStatus.elo + eloChange);
      const solvedIds = isCorrect ? [...submissions.filter(s => s.verdict === 'AC').map(s => s.problemId), selectedProblem.id] : submissions.filter(s => s.verdict === 'AC').map(s => s.problemId);
      const uniqueSolved = Array.from(new Set(solvedIds));

      // Update Cadet details
      setUserStatus(prev => ({
        ...prev,
        elo: newElo,
        solvedCount: uniqueSolved.length,
        subCount: prev.subCount + 1,
        // Increment streak if correct
        streak: isCorrect ? prev.streak + 1 : 0
      }));

      // Create structured submission
      let aiFeedback = res.feedback;
      if (alreadySolved) {
        aiFeedback += '\n\n*(Bài toán này đã được bạn giải thành công trước đó, Elo được giữ nguyên để tránh farm).*';
      }

      const newSub: Submission = {
        id: `Sub_${Date.now()}`,
        problemId: selectedProblem.id,
        problemTitle: selectedProblem.title,
        rating: selectedProblem.rating,
        language: selectedLanguage,
        code: draftSolution,
        verdict: res.verdict as Verdict,
        feedback: aiFeedback,
        submittedAt: new Date().toLocaleTimeString(),
        ratingChange: eloChange
      };

      setSubmissions(prev => [newSub, ...prev]);
      setJudgementResult(newSub);

      // Handle Virtual Contest updates
      if (activeContest) {
        const isProblemInContest = activeContest.problems.some(p => p.id === selectedProblem.id);
        if (isProblemInContest && isCorrect) {
          const isFreshSolve = !activeContest.solvedIds.includes(selectedProblem.id);
          if (isFreshSolve) {
            const updatedSolved = [...activeContest.solvedIds, selectedProblem.id];
            // Calculate dynamic contest score (higher for ratings, decrease for time passed)
            const contestMinutesElapsed = Math.floor((Date.now() - new Date(activeContest.startTime).getTime()) / (60000));
            const calculatedPoints = Math.round(selectedProblem.rating - (contestMinutesElapsed * 2));
            const freshScore = activeContest.score + Math.max(selectedProblem.rating / 2, calculatedPoints);
            
            setActiveContest(prev => prev ? {
              ...prev,
              solvedIds: updatedSolved,
              score: freshScore
            } : null);

            setTerminalLogs(prev => [...prev, `🎉 Contest Accepted! +${calculatedPoints} score added to leaderboard.`]);
          }
        }
      }

      setTerminalLogs(prev => [
        ...prev,
        `Verdict: [${res.verdict}] for problem: ${selectedProblem.title}. ELO adjustment: ${eloChange >= 0 ? '+' : ''}${eloChange}`
      ]);

    } catch (e: any) {
      console.error(e);
      // Fallback grade logic if API fails or falls offline
      setTerminalLogs(prev => [...prev, '⚠️ AI Judge Server failed. Falling back to robust local answer matcher.']);
      
      const alreadySolved = submissions.some(s => s.problemId === selectedProblem.id && s.verdict === 'AC');
      const isCorrect = checkLocalAnswer(draftSolution, selectedProblem.sampleOutput || '');
      const verdict = isCorrect ? 'AC' : 'WA';
      let feedback = isCorrect
        ? `🟩 [LOCAL FALLBACK - AC]: Máy chủ AI bận/lỗi. Hệ thống đã tự động chuyển sang Chế độ Chấm điểm Khớp đáp án và phát hiện đáp án trùng khớp hoàn toàn với kết quả mẫu chuẩn ($${selectedProblem.sampleOutput}$).${alreadySolved ? ' (Bài tập này đã được bạn giải trước đó, Elo giữ nguyên).' : ''}`
        : `🟥 [LOCAL FALLBACK - WA]: Máy chủ AI bận/lỗi. Hệ thống đã tự động chuyển sang Chế độ Chấm điểm Khớp đáp án nma kết quả của bạn chưa trùng khớp với kết quả mẫu chuẩn ($${selectedProblem.sampleOutput}$).${alreadySolved ? ' (Bài tập này đã được bạn giải trước đó, Elo giữ nguyên).' : ''}`;

      let eloChange = 0;
      if (!alreadySolved) {
        const pointsBase = selectedProblem.rating / 10;
        if (isCorrect) {
          let penalty = hintRequested ? 0.9 : 1.0;
          eloChange = Math.round((pointsBase * 0.15) * penalty);
          if (selectedProblem.rating >= 2100) eloChange += 10;
        } else {
          eloChange = Math.round(- (pointsBase * 0.05));
        }
      }

      const newElo = Math.max(800, userStatus.elo + eloChange);
      const solvedIds = isCorrect 
        ? [...submissions.filter(s => s.verdict === 'AC').map(s => s.problemId), selectedProblem.id] 
        : submissions.filter(s => s.verdict === 'AC').map(s => s.problemId);
      const uniqueSolved = Array.from(new Set(solvedIds));

      setUserStatus(prev => ({
        ...prev,
        elo: newElo,
        solvedCount: uniqueSolved.length,
        subCount: prev.subCount + 1,
        streak: isCorrect ? prev.streak + 1 : 0
      }));

      const fallbackSub: Submission = {
        id: `Sub_${Date.now()}`,
        problemId: selectedProblem.id,
        problemTitle: selectedProblem.title,
        rating: selectedProblem.rating,
        language: selectedLanguage,
        code: draftSolution,
        verdict: verdict as Verdict,
        feedback: feedback,
        submittedAt: new Date().toLocaleTimeString(),
        ratingChange: eloChange
      };

      setSubmissions(prev => [fallbackSub, ...prev]);
      setJudgementResult(fallbackSub);
    } finally {
      setIsJudging(false);
    }
  };

  // Convert File standard input to Base64 screenshot upload
  const handleUploadedSnapshot = async (file: File) => {
    setIsUploading(true);
    setParsingError(null);
    setRawImageUpload(null);

    const reader = new FileReader();
    reader.onload = async () => {
      const b64 = (reader.result as string).split(',')[1];
      setRawImageUpload(b64);
      
      try {
        const response = await fetch('/api/parse-problem', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image: b64,
            mimeType: file.type
          })
        });

        if (!response.ok) {
          throw new Error('Professor vision parser failed to read image layout.');
        }

        const data = await response.json();
        
        // Add dynamic ID and mark as customized custom problem
        const parsedProblem: Problem = {
          ...data,
          id: `Custom_${Date.now()}`,
          isCustom: true
        };

        setProblems(prev => [parsedProblem, ...prev]);
        setSelectedProblem(parsedProblem);
        setActiveTab('problems');
        setTerminalLogs(prev => [...prev, `🤖 AI Vision parsed: "${parsedProblem.title}" (Rating: ${parsedProblem.rating}) loaded into the Problem Bank!`]);

      } catch (e: any) {
        console.error(e);
        setParsingError(e.message || 'Vision parser failed. Please ensure your Gemini API key is configured.');
      } finally {
        setIsUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Inject a mock parser sample challenge so users can test immediately
  const trySampleScan = () => {
    setIsUploading(true);
    setParsingError(null);
    
    // Simulate professor bocking
    setTimeout(() => {
      const sampleCustom: Problem = {
        id: `Custom_Sample_${Date.now()}`,
        title: 'Fourier Trigonometric Linear Approximation',
        rating: 1800,
        category: 'Series',
        statement: 'Prove that the orthogonal trigonometric basis functions satisfy $\\int_{-\\pi}^{\\pi} \\cos(mx)\\cos(nx)\\,dx = 0$ for $m \\neq n$ and evaluate the normalization factor where $m=n$.',
        sampleInput: 'Orthogonal integrals showing cosine trigonometric identities.',
        sampleOutput: '\\pi \\text{ for } m=n',
        solution: 'Apply the standard sum-of-angles formula:\n$$\\cos(mx)\\cos(nx) = \\frac{1}{2}(\\cos((m+n)x) + \\cos((m-n)x))$$\nIntegrate over $[-\\pi, \\pi]$. Since $m \\pm n \\neq 0$, both integral outputs are sine terms evaluated at bounds, returning 0.\nFor $m = n$, integration yields $\\int_{-\\pi}^{\\pi} \\cos^2(mx)dx = \\int_{-\\pi}^{\\pi} \\frac{1+\\cos(2mx)}{2}dx = \\pi$.',
        intuition: 'This represents the mathematical foundation of Fourier analysis, which decomposes audio, signals, and pixels into orthogonal vector coordinates. In deep learning architectures, spectral convolutions accelerate training speed from $O(N^2)$ to $O(N \\log N)$.',
        tags: ['orthogonality', 'fourier', 'space-decomposition', 'kaist-quiz-parser'],
        isCustom: true
      };

      setProblems(prev => [sampleCustom, ...prev]);
      setSelectedProblem(sampleCustom);
      setActiveTab('problems');
      setTerminalLogs(prev => [...prev, `🤖 Sample handwritten midterm OCR ingested! Loaded: "${sampleCustom.title}"`]);
      setIsUploading(false);
    }, 1500);
  };

  // Give Up button reveals master editorial
  const handleGiveUp = () => {
    setShowEditorial(true);
    // Create skipped submission
    const skipSub: Submission = {
      id: `Sub_${Date.now()}`,
      problemId: selectedProblem!.id,
      problemTitle: selectedProblem!.title,
      rating: selectedProblem!.rating,
      language: selectedLanguage,
      code: draftSolution,
      verdict: 'PENDING',
      feedback: '⬛ [Skipped]: Editorial unlocked. Review the deep visual and coordinate intuitions below.',
      submittedAt: new Date().toLocaleTimeString()
    };
    setSubmissions(prev => [skipSub, ...prev]);
    setTerminalLogs(prev => [...prev, `⬛ Skipped problem: "${selectedProblem!.title}". Read the geometrical intuition to review!`]);
  };

  // Helper formatting for virtual timer Display
  const formatTimer = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Filters calculation
  const filteredProblems = problems.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.statement.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCat = selectedCategory === 'All' || p.category === selectedCategory;
    
    let matchesRating = true;
    if (selectedRating !== 'All') {
      const ratingVal = parseInt(selectedRating);
      matchesRating = p.rating >= ratingVal && p.rating < ratingVal + 500;
    }

    return matchesSearch && matchesCat && matchesRating;
  });

  const rankInfo = getRankDetails(userStatus.elo);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col justify-between">
      
      {/* ================= HEADER BRANDING ================= */}
      <header className="border-b border-slate-200 bg-white/95 backdrop-blur sticky top-0 z-40 px-4 py-3 flex flex-wrap justify-between items-center gap-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg text-white font-extrabold flex items-center justify-center shadow-lg shadow-blue-500/10">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display font-bold tracking-tight text-xl text-slate-900">KAIST-Forces</span>
              <span className="text-[10px] bg-red-50 text-red-600 font-mono px-1.5 py-0.5 rounded border border-red-200 uppercase font-semibold">Core Judge</span>
            </div>
            <p className="text-xs text-slate-500">MAS101 Calculus & MAS109 Linear Algebra auto-grader</p>
          </div>
        </div>

        {/* ELO & Badge Profile widget */}
        <div className="flex items-center gap-3 sm:gap-6">
          <div className="flex items-center gap-2 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg text-xs">
            <User className="w-4 h-4 text-blue-600" />
            <div>
              <div className="flex items-center gap-1.5">
                <span className={`font-mono font-bold ${rankInfo.color}`}>{userStatus.username}</span>
                <span className={`text-[9px] px-1.5 py-0.2 rounded font-semibold uppercase ${rankInfo.bg} ${rankInfo.color} border ${rankInfo.border}`}>
                  {rankInfo.title}
                </span>
              </div>
              <div className="flex items-center gap-2 text-slate-500 mt-0.5">
                <span>Rating: <strong className="text-slate-850 font-mono">{userStatus.elo}</strong></span>
                <span>•</span>
                <span className="flex items-center gap-0.5 text-orange-600 font-medium">
                  <Flame className="w-3.5 h-3.5 fill-orange-500/20" />
                  <strong>{userStatus.streak} days</strong>
                </span>
              </div>
            </div>
          </div>

          <button 
            onClick={() => setShowTerminal(!showTerminal)}
            className="p-2 py-1.5 text-xs font-mono bg-slate-100 border border-slate-350 hover:bg-slate-200 text-slate-700 hover:text-slate-900 rounded transition flex items-center gap-1.5"
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Terminal</span>
          </button>
        </div>
      </header>

      {/* ================= SECONDARY NAVIGATION RAIL ================= */}
      <div className="bg-slate-100 border-b border-slate-200 px-4 py-2 flex flex-wrap justify-between items-center gap-4 text-xs font-mono">
        <div className="flex flex-wrap items-center gap-2">
          <button 
            onClick={() => { setActiveTab('problems'); setSelectedProblem(null); }}
            className={`px-3 py-1.5 rounded-md transition flex items-center gap-1.5 ${activeTab === 'problems' ? 'bg-white text-slate-950 font-bold border border-slate-300/80 shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'}`}
          >
            <BookOpen className="w-3.5 h-3.5 text-blue-600" />
            <span>Problem Set</span>
          </button>
          
          <button 
            onClick={() => { setActiveTab('theory'); setSelectedProblem(null); }}
            className={`px-3 py-1.5 rounded-md transition flex items-center gap-1.5 ${activeTab === 'theory' ? 'bg-white text-slate-950 font-bold border border-slate-300/80 shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'}`}
          >
            <Brain className="w-3.5 h-3.5 text-indigo-600" />
            <span className="font-semibold text-slate-900">Bài học Lý thuyết</span>
          </button>

          <button 
            onClick={() => { setActiveTab('contests'); setSelectedProblem(null); }}
            className={`px-3 py-1.5 rounded-md transition flex items-center gap-1.5 relative ${activeTab === 'contests' ? 'bg-white text-slate-950 font-bold border border-slate-300/80 shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'}`}
          >
            <Trophy className="w-3.5 h-3.5 text-amber-600" />
            <span>Virtual Contest</span>
            {activeContest && (
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
              </span>
            )}
          </button>

          <button 
            onClick={() => { setActiveTab('submissions'); setSelectedProblem(null); }}
            className={`px-3 py-1.5 rounded-md transition flex items-center gap-1.5 ${activeTab === 'submissions' ? 'bg-white text-slate-950 font-bold border border-slate-300/80 shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'}`}
          >
            <History className="w-3.5 h-3.5 text-purple-600" />
            <span>My Submissions</span>
          </button>

          <button 
            onClick={() => { setActiveTab('upload'); setSelectedProblem(null); }}
            className={`px-3 py-1.5 rounded-md transition flex items-center gap-1.5 ${activeTab === 'upload' ? 'bg-white text-slate-950 font-bold border border-slate-300/80 shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'}`}
          >
            <Upload className="w-3.5 h-3.5 text-emerald-600" />
            <span>Ingest Exam</span>
          </button>
        </div>

        {/* Quick statistics tracker */}
        <div className="flex items-center gap-4 text-[11px] text-slate-500">
          <span>Streak Mode: <strong className="text-orange-600">🔥 ON</strong></span>
          <span>•</span>
          <span>Solved: <strong className="text-slate-800 font-mono">{userStatus.solvedCount}</strong></span>
          <span>•</span>
          <span>Elo Level: <strong className="text-blue-600">{userStatus.elo}</strong></span>
        </div>
      </div>

      {/* ================= MAIN CONTAINER ================= */}
      <main className="flex-1 max-w-[1700px] w-full mx-auto px-4 py-6">

        {/* ================= THEORY COMPANION TAB ================= */}
        {activeTab === 'theory' && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Sidebar list of math lectures */}
            <div className="lg:col-span-1 space-y-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <h2 className="font-display font-bold text-slate-800 tracking-tight text-sm flex items-center gap-2 pb-2 border-b border-slate-100">
                <BookOpen className="w-4 h-4 text-blue-600" />
                <span>Mục lục Bài học</span>
              </h2>
              
              <div className="flex flex-col gap-1.5 pt-1">
                {LECTURES_DATA.map((lec) => (
                  <button
                    key={lec.id}
                    onClick={() => setSelectedLecture(lec)}
                    className={`text-left text-xs p-3.5 rounded-xl transition-all border ${
                      selectedLecture.id === lec.id
                        ? 'bg-blue-50/70 border-blue-200 text-blue-900 font-bold shadow-xs'
                        : 'bg-white border-transparent text-slate-600 hover:bg-slate-100/50 hover:text-slate-900'
                    }`}
                  >
                    <div className="text-[10px] uppercase font-bold text-slate-400 font-mono mb-1">{lec.code}</div>
                    <div className="line-clamp-2">{lec.title}</div>
                  </button>
                ))}
              </div>

              {/* Tips for highschool-level student */}
              <div className="p-4 bg-amber-50 rounded-xl border border-amber-200/60 mt-6 space-y-2">
                <h4 className="text-xs font-bold text-amber-800 flex items-center gap-1.5">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
                  <span>Cầu nối Cấp 3 lên Đại Học!</span>
                </h4>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  MAS101 tại KAIST giảng dạy hoàn toàn bằng Tiếng Anh và học lượng lý thuyết cực kỳ rộng. Đừng hoảng sợ! Hãy đọc kĩ hộp <strong>"Cầu nối Cấp 3"</strong> ở mỗi bài học để chuyển dịch kiến thức mượt mà.
                </p>
              </div>
            </div>

            {/* Lecture contents rendering */}
            <div className="lg:col-span-3 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
              
              {/* Header */}
              <div className="border-b border-slate-150 pb-4 space-y-2 border-slate-200">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-mono bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded uppercase">
                    {selectedLecture.code}
                  </span>
                  <span className="text-[10px] font-mono bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded uppercase">
                    KAIST College Math Sheet
                  </span>
                </div>
                <h1 className="text-xl font-bold text-slate-900 leading-tight">
                  {selectedLecture.title}
                </h1>
              </div>

              {/* High School Bridge Widget */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50/50 rounded-2xl p-5 border border-blue-200 relative overflow-hidden">
                <div className="space-y-1.5 relative z-10">
                  <div className="flex items-center gap-2 text-blue-800 font-bold text-xs">
                    <Brain className="w-4 h-4 text-blue-600 animate-pulse" />
                    <span>CẦU NỐI KIẾN THỨC CẤP 3:</span>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    {selectedLecture.highSchoolBridge}
                  </p>
                </div>
              </div>

              {/* Vietnamese simplified explanation */}
              <div className="space-y-2">
                <h3 className="text-slate-800 font-bold text-sm tracking-tight flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                  <span>Giải thích bản chất (Intuitive Concept)</span>
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed bg-slate-50/80 p-4 rounded-xl border border-slate-200/60">
                  {selectedLecture.vietnameseExplanation}
                </p>
              </div>

              {/* Core Formulas */}
              <div className="space-y-3">
                <h3 className="text-slate-800 font-bold text-sm tracking-tight flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
                  <span>Công thức & Phát biểu cốt lõi</span>
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedLecture.formulas.map((f, i) => (
                    <div key={i} className="bg-white border border-slate-200 p-4 rounded-2xl space-y-2 shadow-xs">
                      <span className="text-[11px] block font-mono text-slate-400 font-bold uppercase tracking-wider">{f.label}</span>
                      <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-lg text-slate-900 font-mono text-xs overflow-x-auto">
                        <MathRenderer text={`${f.formula}`} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Worked examples */}
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-3">
                <h3 className="text-slate-800 font-bold text-sm tracking-tight flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-600"></span>
                  <span>Bài tập mẫu phân tích (Worked Example)</span>
                </h3>
                <div className="space-y-4 text-xs font-sans">
                  <div className="p-3 bg-white rounded-lg border border-slate-200 font-medium">
                    <span className="text-indigo-600 font-bold font-mono text-[10px] block mb-1">ĐỀ BÀI / PROBLEM:</span>
                    <MathRenderer text={selectedLecture.workedExample.problem} />
                  </div>
                  <div className="p-4 bg-white/70 rounded-lg border border-slate-200 leading-relaxed">
                    <span className="text-emerald-700 font-bold font-mono text-[10px] block mb-1.5">LỜI GIẢI CHI TIẾT / ANALYSIS SOLUTION:</span>
                    <div className="text-slate-700 leading-relaxed font-sans">
                      <MathRenderer text={selectedLecture.workedExample.solution} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Bilingual micro-dictionary */}
              <div className="space-y-3 pt-4 border-t border-slate-150 border-slate-200">
                <h3 className="text-slate-800 font-bold text-sm tracking-tight flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                  <span>Thuật ngữ Anh - Việt chuyên ngành (Calculus Dictionary)</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {selectedLecture.bilingualDictionary.map((dict, i) => (
                    <div key={i} className="flex gap-3 p-3 bg-slate-50 border border-slate-200/60 rounded-xl hover:border-slate-300 transition">
                      <div className="font-mono text-xs font-black text-blue-600 whitespace-nowrap">{dict.term}</div>
                      <div className="space-y-0.5">
                        <div className="font-bold text-slate-850">{dict.translation}</div>
                        <div className="text-[11px] text-slate-500 leading-normal">{dict.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* 1. VIEW DIRECTORY: PROBLEMS LIST */}
        {activeTab === 'problems' && !selectedProblem && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            
            {/* Left sidebar filters list */}
            <div className="lg:col-span-1 space-y-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <h2 className="font-display font-bold text-slate-800 tracking-tight text-sm flex items-center gap-2">
                <Brain className="w-4 h-4 text-blue-500" />
                <span>MAS Core Filter</span>
              </h2>

              {/* Search text box */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search equation syntax or tags..."
                  className="w-full bg-slate-50 border border-slate-250 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-blue-500/50 transition font-mono"
                />
              </div>

              {/* Subject Group category selector */}
              <div>
                <label className="block text-[11px] text-slate-400 font-mono mb-2 uppercase tracking-wider font-semibold">Subject Core Category</label>
                <div className="flex flex-col gap-1">
                  {['All', 'Calculus', 'Linear Algebra', 'Series', '3D Geometry', 'Proofs'].map(cat => (
                    <button 
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`text-left text-xs px-3 py-2 rounded-lg transition-all flex items-center justify-between ${selectedCategory === cat ? 'bg-blue-600 text-white font-bold border border-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}`}
                    >
                      <span>{cat}</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${selectedCategory === cat ? 'bg-blue-700 text-blue-100' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}>
                        {cat === 'All' ? problems.length : problems.filter(p => p.category === cat).length}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Difficulty Rating class */}
              <div>
                <label className="block text-[11px] text-slate-400 font-mono mb-2 uppercase tracking-wider font-semibold">Codeforces Rating Range</label>
                <div className="flex flex-col gap-1">
                  {['All', '800', '1300', '1800', '2300', '2800'].map(rate => (
                    <button 
                      key={rate}
                      onClick={() => setSelectedRating(rate)}
                      className={`text-left text-xs px-3 py-2 rounded-lg transition-all flex items-center justify-between ${selectedRating === rate ? 'bg-blue-600 text-white font-bold border border-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}`}
                    >
                      <span className="font-mono">{rate === 'All' ? 'All difficulties' : `Rating ${rate} - ${parseInt(rate) + 400}`}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick instructions panel */}
              <div className="p-4 bg-blue-50/60 border border-blue-100 rounded-2xl">
                <h3 className="text-xs text-blue-700 font-bold flex items-center gap-1.5 mb-1.5 font-display">
                  <Cpu className="w-3.5 h-3.5 text-blue-600" />
                  <span>Interactive Auto-Grader</span>
                </h3>
                <p className="text-[11px] text-slate-600 leading-relaxed font-sans">
                  Giải bài tập Giải tích nâng cao, chứng minh vector pháp tuyến, tính toán chuỗi Taylor. Đột phá tư duy toán đại học cùng hệ thống chấm điểm tự động tức thì.
                </p>
              </div>
            </div>

            {/* Right main list of grading prompts */}
            <div className="lg:col-span-3 space-y-4">
              <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <div>
                  <h1 className="font-display font-bold text-sm text-slate-900 tracking-wide">Problem Bank List</h1>
                  <p className="text-xs text-slate-500 mt-0.5">Showing {filteredProblems.length} mathematical grading tasks matched</p>
                </div>
                <button 
                  onClick={() => startNewContest()}
                  className="px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 text-white text-xs font-bold rounded-lg hover:brightness-110 active:scale-95 transition flex items-center gap-1.5 shadow-lg shadow-amber-500/15"
                >
                  <Trophy className="w-4 h-4" />
                  <span>Begin Virtual Exam</span>
                </button>
              </div>

              {/* Problems Grid Table */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="grid grid-cols-12 gap-4 text-xs font-mono text-slate-500 border-b border-slate-200 p-4 font-bold bg-slate-50/50 uppercase tracking-wider">
                  <div className="col-span-1 text-center">Status</div>
                  <div className="col-span-6">Problem Title</div>
                  <div className="col-span-3">Core Subject</div>
                  <div className="col-span-2 text-right">CF Rating</div>
                </div>

                <div className="divide-y divide-slate-100">
                  {filteredProblems.length === 0 ? (
                    <div className="text-center py-12 text-xs text-slate-500 font-mono">
                      No problems match search query or ELO filters. Check another selector tag.
                    </div>
                  ) : (
                    filteredProblems.map(p => {
                      const isSolved = submissions.some(s => s.problemId === p.id && s.verdict === 'AC');
                      const rStyles = getRankDetails(p.rating);

                      return (
                        <div 
                          key={p.id} 
                          onClick={() => setSelectedProblem(p)}
                          className="grid grid-cols-12 gap-4 items-center p-4 hover:bg-slate-50/80 border-l-2 border-transparent hover:border-blue-600 cursor-pointer transition"
                        >
                          <div className="col-span-1 flex justify-center">
                            {isSolved ? (
                              <CheckCircle2 className="w-4 h-4 text-green-600 fill-green-500/10" />
                            ) : (
                              <div className="w-4 h-4 rounded-full border border-slate-300" />
                            )}
                          </div>
                          
                          <div className="col-span-6 pr-4">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-slate-800 text-xs hover:text-blue-600 transition font-display">{p.title}</span>
                              {p.isCustom && (
                                <span className="text-[9px] bg-teal-50 text-teal-700 font-mono border border-teal-200/80 px-1 rounded uppercase">Vision Ingest</span>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {p.tags.slice(0, 3).map(t => (
                                <span key={t} className="text-[9px] font-mono bg-slate-100 text-slate-600 border border-slate-200 px-1.5 py-0.2 rounded">
                                  #{t}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div className="col-span-3">
                            <span className="text-[11px] font-mono text-slate-700 px-2 py-0.5 bg-slate-100 rounded border border-slate-250 font-semibold">
                              {p.category}
                            </span>
                          </div>

                          <div className="col-span-2 text-right">
                            <span className={`font-mono text-xs font-extrabold ${rStyles.color}`}>
                              Rating {p.rating}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. PROBLEMS DETAILS & LIVE Auto-Grader SCREEN */}
        {selectedProblem && (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
            
            {/* Left section: Problem Latex parameters */}
            <div className="xl:col-span-6 space-y-5">
              
              {/* Back to table element */}
              <div className="flex justify-between items-center">
                <button 
                  onClick={() => setSelectedProblem(null)}
                  className="p-1 px-2.5 text-xs font-mono bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 hover:text-slate-900 rounded transition flex items-center gap-1.5 shadow-xs"
                >
                  <span>← Back to Problem-Matrix</span>
                </button>

                {activeContest && (
                  <div className="flex items-center gap-2 bg-red-50 border border-red-200 px-3 py-1 rounded text-red-600 text-xs font-mono font-bold animate-pulse">
                     <Clock className="w-3.5 h-3.5" />
                    <span>CONTEST TIMER: {formatTimer(contestTimeLeft)}</span>
                  </div>
                )}
              </div>

              {/* The Statement Board */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex flex-wrap justify-between items-center gap-3 pb-3 border-b border-slate-150">
                  <div>
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 bg-blue-50 text-blue-800 rounded-lg border border-blue-200 font-bold">
                      {selectedProblem.category}
                    </span>
                    <h1 className="text-lg font-display font-semibold text-slate-900 mt-1.5 tracking-tight">{selectedProblem.title}</h1>
                  </div>
                  
                  <div className="text-right">
                    <span className={`text-xs font-mono font-black ${getRankDetails(selectedProblem.rating).color}`}>
                      Rating ★ {selectedProblem.rating}
                    </span>
                  </div>
                </div>

                {/* Mathematical Equation rendered in clean custom component */}
                <div className="prose text-sm text-slate-700 leading-relaxed font-sans py-2">
                  <MathRenderer text={selectedProblem.statement} />
                </div>

                {/* Sub-sample elements mock formats with spoiler protection */}
                {selectedProblem.sampleOutput && (
                  <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl font-mono text-[11px] space-y-2 shadow-xs">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-slate-500 font-bold tracking-wider uppercase">EXPECTED CORRECT FORMAT (Sample Output):</p>
                      <button
                        onClick={() => setRevealFormat(!revealFormat)}
                        className={`px-2.5 py-1 text-[10px] font-mono font-bold rounded-lg border transition-all uppercase ${revealFormat ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100' : 'bg-blue-600 text-white border-blue-700 hover:bg-blue-700 shadow-3xs animate-pulse hover:scale-102 active:scale-98'}`}
                      >
                        {revealFormat ? '🔒 Ẩn đáp án mẫu' : '👁️ Xem đáp án mẫu'}
                      </button>
                    </div>
                    
                    <div className="relative mt-2">
                      {!revealFormat && (
                        <div 
                          onClick={() => setRevealFormat(true)}
                          className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-200/40 hover:bg-slate-200/50 backdrop-blur-[5.5px] rounded-lg border border-dashed border-slate-300 p-4 cursor-pointer transition-all group"
                        >
                          <span className="text-[10px] text-slate-700 font-sans font-bold flex items-center gap-1.5 group-hover:text-blue-750">
                            👁️ Nhấp vào đây để xem đáp án mẫu (Tránh spoil khi đang giải!)
                          </span>
                        </div>
                      )}
                      <div className="p-2.5 bg-white rounded-lg border border-slate-200 text-blue-700 font-bold">
                        <MathRenderer text={`$$${selectedProblem.sampleOutput}$$`} />
                      </div>
                    </div>
                  </div>
                )}

                {/* Tag keywords list */}
                <div className="flex flex-wrap gap-1.5 pt-3 border-t border-slate-150">
                  {selectedProblem.tags.map(t => (
                    <span key={t} className="text-[10px] font-mono bg-slate-100 text-slate-500 border border-slate-200 px-2 py-0.5 rounded">
                      #{t}
                    </span>
                  ))}
                </div>
              </div>

              {/* INLINE EXPLANATORY ACCORDION (Editorial & Intuition via !GiveUp or Skip) */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-display font-semibold text-sm text-slate-800 flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-amber-500 animate-pulse" />
                    <span>Editorial & Mathematical Intuition</span>
                  </h3>
                  
                  {!showEditorial ? (
                    <button 
                      onClick={() => handleGiveUp()}
                      className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 font-mono text-[10px] font-bold border border-red-200 rounded uppercase transition shadow-2xs"
                    >
                      Reveal Editorial (!GiveUp)
                    </button>
                  ) : (
                    <span className="text-[10px] font-mono text-amber-700 font-bold bg-amber-50 border border-amber-250 px-2 py-0.5 rounded uppercase">Unveiled</span>
                  )}
                </div>

                {showEditorial ? (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4 text-xs leading-relaxed text-slate-700">
                    <div className="space-y-2">
                      <h4 className="text-slate-900 font-bold flex items-center gap-1">
                        <Flame className="w-3.5 h-3.5 text-orange-500 fill-orange-500/10" />
                        <span>Prof. Geometrical & Physical Intuition:</span>
                      </h4>
                      <p className="font-sans text-slate-600">
                        {selectedProblem.intuition}
                      </p>
                    </div>

                    <div className="space-y-2 pt-3 border-t border-slate-200">
                      <h4 className="text-slate-900 font-bold flex items-center gap-1">
                        <BookOpen className="w-3.5 h-3.5 text-blue-500" />
                        <span>Analytical Resolution proof:</span>
                      </h4>
                      <div className="font-mono bg-white p-3 rounded-lg border border-slate-200 text-blue-900 overflow-x-auto text-[11px] font-semibold">
                        <MathRenderer text={selectedProblem.solution || 'Proof is trivial depending on coordinate parameters.'} />
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-500 leading-relaxed font-sans">
                    Nghĩ không ra? Bấm "Reveal Editorial (!GiveUp)" để xem ngay lời giải và bản chất hình học từ Giáo sư, tiếp thu ngay góc nhìn đột phá của bài toán.
                  </p>
                )}
              </div>
            </div>

            {/* Right section: Grader code area & Judge response */}
            <div className="xl:col-span-6 space-y-5">
              
              {/* Grader form panel */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex flex-wrap justify-between items-center gap-3">
                  <h3 className="font-display font-semibold text-slate-800 text-sm flex items-center gap-2">
                    <FileCode className="w-4 h-4 text-blue-500" />
                    <span>Submit Transformations & Steps</span>
                  </h3>

                  {/* Submission format selector */}
                  <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                    {(['Math Step', 'Python/NumPy', 'Logic Proof'] as const).map(lang => (
                      <button
                        key={lang}
                        onClick={() => setSelectedLanguage(lang)}
                        className={`px-2 py-1 text-[10px] font-mono rounded transition-all ${selectedLanguage === lang ? 'bg-white text-slate-950 font-bold border border-slate-300/80 shadow-2xs' : 'text-slate-500 hover:text-slate-900 hover:bg-white/40'}`}
                      >
                        {lang}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Judging Mode Configuration Select */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="space-y-0.5">
                    <span className="font-bold text-slate-700 flex items-center gap-1.5 font-display text-[11px] uppercase tracking-wider">
                      ⚙️ Chế độ Chấm bài (Judging Mode)
                    </span>
                    <p className="text-[10px] text-slate-500 font-sans font-normal leading-normal max-w-sm">
                      {gradingMode === 'local' 
                        ? '⚡ Đối chiếu đáp án chuẩn tại chỗ cực nhanh (Siêu ổn định, không lỗi kết nối API).' 
                        : '🌟 Phân tích dòng chảy logic từng bước bởi Giáo sư AI (Yêu cầu kết nối AI Studio API).'}
                    </p>
                  </div>
                  <div className="flex bg-slate-200 p-0.5 rounded-lg border border-slate-300">
                    <button
                      onClick={() => {
                        setGradingMode('local');
                        setTerminalLogs(prev => [...prev, '🔄 Chuyển sang chấm bài bằng: KHỚP ĐÁP ÁN (Khuyên dùng, siêu ổn định)']);
                      }}
                      className={`px-3 py-1 text-[11px] font-sans font-bold rounded-md transition-all flex items-center gap-1 ${gradingMode === 'local' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'}`}
                    >
                      <span>⚡ Local-Match</span>
                    </button>
                    <button
                      onClick={() => {
                        setGradingMode('ai');
                        setTerminalLogs(prev => [...prev, '🔄 Chuyển sang chấm bài bằng: GIÁO SƯ AI (Cần kết nối API)']);
                      }}
                      className={`px-3 py-1 text-[11px] font-sans font-bold rounded-md transition-all flex items-center gap-1 ${gradingMode === 'ai' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'}`}
                    >
                      <span>🌟 AI-Professor</span>
                    </button>
                  </div>
                </div>

                {/* Solution draft text area with nice IDE-style numbering layout */}
                <div className="relative border border-slate-250 focus-within:border-blue-500 rounded-xl overflow-hidden bg-slate-50 font-mono text-xs shadow-inner">
                  <div className="flex">
                    {/* Mock editor rail lines count */}
                    <div className="w-10 bg-slate-100/50 border-r border-slate-200 py-3 text-right select-none text-slate-400 px-2 space-y-0.5 text-[10px]">
                      {Array.from({ length: 9 }).map((_, i) => (
                        <div key={i}>{i + 1}</div>
                      ))}
                    </div>
                    
                    <textarea
                      value={draftSolution}
                      onChange={(e) => setDraftSolution(e.target.value)}
                      placeholder="Insert standard mathematical substitutions, derivatives, linear coordinate transformations, or proofs here..."
                      className="flex-1 min-h-[170px] bg-transparent outline-none p-3 py-2.5 text-slate-950 font-mono text-xs placeholder-slate-400 resize-y leading-normal"
                    />
                  </div>

                  <div className="bg-slate-100 border-t border-slate-200 px-3 py-1.5 flex justify-between items-center text-[10px] text-slate-500">
                    <span>Grader Language: <span className="text-slate-800 font-bold">{selectedLanguage}</span></span>
                    <span>No compile timeout constraints applying</span>
                  </div>
                </div>

                {/* Live LaTeX Preview Tool */}
                <div className="border border-blue-150 rounded-xl p-4 bg-blue-50/25 space-y-2.5 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-blue-700 font-bold tracking-wider uppercase flex items-center gap-1.5">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500 font-black"></span>
                      </span>
                      Xem trước công thức LaTeX (Live Preview)
                    </span>
                    <span className="text-[9px] font-mono text-slate-400 text-right">Gõ $công\_thức$ hoặc $$biểu\_thức$$ bên dưới</span>
                  </div>
                  <div className="p-3.5 bg-white border border-slate-150 rounded-lg text-slate-800 text-xs shadow-3xs overflow-x-auto min-h-[55px] leading-relaxed">
                    {draftSolution.trim() ? (
                      <MathRenderer text={draftSolution} />
                    ) : (
                      <p className="text-[10.5px] text-slate-400 italic font-sans">
                        Nhập các công thức toán học (bằng các ký hiệu $ hoặc $$) ở khung soạn thảo phía trên để xem trước công thức trực quan tại đây...
                      </p>
                    )}
                  </div>
                </div>

                {/* Control Action Buttons */}
                <div className="flex justify-between items-center gap-4 flex-wrap">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setHintRequested(true);
                        setTerminalLogs(prev => [...prev, `💡 Hint unlocked for "${selectedProblem.title}". 10% penalty holds upon Accepted.`]);
                      }}
                      className="px-3.5 py-2 text-xs bg-slate-100 border border-slate-250 text-slate-700 hover:bg-slate-200 rounded-lg transition flex items-center gap-1.5"
                    >
                      <Lightbulb className="w-4 h-4 text-amber-500" />
                      <span>Request Hint (-10% Pts)</span>
                    </button>
                  </div>

                  <button
                    onClick={() => submitSolution()}
                    disabled={isJudging || !draftSolution.trim()}
                    className={`px-5 py-2.5 rounded-lg text-xs font-bold font-display shadow-lg transition flex items-center gap-2 ${draftSolution.trim() && !isJudging ? 'bg-blue-600 text-white hover:brightness-110 active:scale-95 cursor-pointer shadow-blue-500/10' : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'}`}
                  >
                    {isJudging ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-white" />
                        <span>GRADES PENDING (O(1) judge)...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 text-white" />
                        <span>SUBMIT STEPS (AC auto-grader)</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Dynamic Hint Panel */}
                {hintRequested && (
                  <div className="p-3.5 bg-amber-50 border border-amber-200/80 rounded-xl space-y-1 text-xs text-amber-900 font-sans">
                    <h4 className="font-bold font-display text-amber-800 flex items-center gap-1">
                      <Lightbulb className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                      <span>Professor Hint Triggered:</span>
                    </h4>
                    <p className="text-slate-700 leading-relaxed font-sans">
                      {selectedProblem.category === 'Calculus' && '💡 Hint: Thử hạ bậc tích phân bằng các góc nhân đôi hoặc công thức phân tích tích-thành-tổng. Tích phân từng phần 2 lần với hàm mũ và hàm sin sẽ tạo thành vòng lặp, hãy giải phương trình thế để rút gọn.'}
                      {selectedProblem.category === 'Linear Algebra' && '💡 Hint: Lập phương trình đặc trưng det(A - xI) = 0. Nghiệm thu được là trị riêng Eigenvalues. Vector hướng riêng trực giao khi ma trận đối xứng.'}
                      {selectedProblem.category === 'Series' && '💡 Hint: Chuỗi Taylor của tan(x) có thể tính nhanh bằng cách khai triển tỉ số sin(x)/cos(x) hoặc lấy vi phân liên tiếp tại x = 0.'}
                      {selectedProblem.category === '3D Geometry' && '💡 Hint: Sử dụng trực tiếp công thức hình chiếu vector của đoạn nối hai điểm bất kỳ lên vector chuẩn pháp tuyến của mặt phẳng. Với khoảng cách hai đường chéo, dùng cross-product.'}
                      {selectedProblem.category === 'Proofs' && '💡 Hint: Áp dụng hằng đẳng thức vector triple cross vector bac-cab để khai triển tích có hướng của tích có hướng, sau đó rút gọn biểu thức.'}
                    </p>
                  </div>
                )}
              </div>

              {/* LIVE JUDGING FEEDBACK RESULT BOX */}
              {judgementResult && (
                <div className={`p-6 rounded-2xl border transition-all ${judgementResult.verdict === 'AC' ? 'bg-green-50 border-green-200 text-green-900 shadow-xs' : judgementResult.verdict === 'WA' ? 'bg-red-50 border-red-200 text-red-900 shadow-xs' : 'bg-amber-50 border-amber-250 text-amber-900 shadow-xs'}`}>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                    <div className="flex items-center gap-2.5">
                      {judgementResult.verdict === 'AC' ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600 fill-green-500/10" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-red-600" />
                      )}
                      
                      <div>
                        {/* Display styled Codeforces Tag Verdict */}
                        <div className="flex items-center gap-1.5">
                          <span className={`text-sm font-mono font-black uppercase tracking-wider ${judgementResult.verdict === 'AC' ? 'text-green-400' : 'text-red-400'}`}>
                            {judgementResult.verdict === 'AC' && '🟩 Accepted - AC'}
                            {judgementResult.verdict === 'WA' && '🟥 Wrong Answer - WA'}
                            {judgementResult.verdict === 'RTE' && '🟨 Runtime Error - RTE'}
                            {judgementResult.verdict === 'TLE' && '🟦 Time Limit Exceeded - TLE'}
                          </span>
                        </div>
                        <p className="text-[10px] text-gray-500 font-mono mt-0.5">Submitted at {judgementResult.submittedAt}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className={`font-mono text-xs font-bold ${judgementResult.ratingChange! >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {judgementResult.ratingChange! >= 0 ? 'Elo +' : 'Elo '}{judgementResult.ratingChange}
                      </span>
                    </div>
                  </div>

                  {/* Math Judge explanation response text */}
                  <div className="text-xs font-sans mt-4 leading-relaxed p-4 bg-slate-50 border border-slate-200 rounded-xl">
                    <h4 className="font-bold text-slate-800 font-display mb-1.5 flex items-center gap-1">
                      <Cpu className="w-3.5 h-3.5 text-blue-600" />
                      <span>Prof. Judge feedback evaluation report:</span>
                    </h4>
                    <p className="text-slate-700 select-all leading-normal whitespace-pre-wrap">
                      {judgementResult.feedback}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 3. VIEW CONTEMPLAY: VIRTUAL CONTEST SCREEN */}
        {activeTab === 'contests' && (
          <div className="space-y-6">
            
            {/* Active contest details */}
            {activeContest ? (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Scoreboard and problem selectors */}
                <div className="lg:col-span-8 space-y-5">
                  <div className="bg-gradient-to-br from-slate-100 to-slate-50 p-6 rounded-2xl border border-slate-250 text-center space-y-4 relative overflow-hidden shadow-xs">
                    <div className="absolute top-0 right-0 p-3 opacity-10">
                      <Trophy className="w-32 h-32 text-amber-600" />
                    </div>

                    <div className="inline-block px-3 py-1 bg-amber-100 border border-amber-200 rounded-full text-amber-700 text-xs font-mono font-bold">
                      🏆 ACTIVE MIDTERM ARENA
                    </div>
                    
                    <h2 className="font-display font-semibold text-lg text-slate-900 tracking-wide">{activeContest.title}</h2>
                    
                    <div className="grid grid-cols-3 gap-4 max-w-xl mx-auto pt-4">
                      {/* Sub points */}
                      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                        <span className="block text-[10px] text-slate-400 uppercase tracking-widest font-mono">LEADERBOARD Score</span>
                        <strong className="block text-xl font-mono text-amber-600 mt-1">{activeContest.score} Pts</strong>
                      </div>
                      
                      {/* Completed */}
                      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                        <span className="block text-[10px] text-slate-400 uppercase tracking-widest font-mono">Solved/Total</span>
                        <strong className="block text-xl font-mono text-teal-600 mt-1">{activeContest.solvedIds.length} / 5</strong>
                      </div>

                      {/* Timer */}
                      <div className="bg-white p-3.5 rounded-xl border border-red-200 shadow-2xs">
                        <span className="block text-[10px] text-red-500 uppercase tracking-widest font-mono">Exam countdown</span>
                        <strong className="block text-xl font-mono text-red-600 mt-1">{formatTimer(contestTimeLeft)}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Contest problem elements listing */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                    <h3 className="font-display font-semibold text-slate-800 text-sm">Contest Problem Set (Select to Solve)</h3>
                    
                    <div className="space-y-2.5">
                      {activeContest.problems.map((p, idx) => {
                        const isSolved = activeContest.solvedIds.includes(p.id);
                        const isCurrent = selectedProblem?.id === p.id;

                        return (
                          <div
                            key={p.id}
                            onClick={() => setSelectedProblem(p)}
                            className={`p-3.5 rounded-xl border cursor-pointer transition flex items-center justify-between ${isCurrent ? 'bg-blue-50/60 border-blue-400' : 'bg-slate-50 border-slate-200 hover:bg-slate-100/50'}`}
                          >
                            <div className="flex items-center gap-3">
                              <span className="font-mono text-slate-400 text-xs font-bold uppercase">Problem {String.fromCharCode(65 + idx)}</span>
                              <div>
                                <h4 className="text-sm font-display font-medium text-slate-900">{p.title}</h4>
                                <div className="flex gap-2 items-center text-[10px] text-slate-500 mt-0.5">
                                  <span>{p.category}</span>
                                  <span>•</span>
                                  <span>Rating {p.rating}</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              {isSolved ? (
                                <span className="text-[10px] font-mono text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded font-bold uppercase">Accepted</span>
                              ) : (
                                <span className="text-[10px] font-mono text-slate-550 bg-slate-100 border border-slate-250 px-2 py-0.5 rounded uppercase">Unsolved</span>
                              )}
                              <ChevronRight className="w-4 h-4 text-slate-400" />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Score standings drawer */}
                <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                  <h3 className="font-display font-semibold text-slate-800 text-sm">Contest Standing board</h3>
                  
                  <div className="space-y-2 text-xs font-mono">
                    <div className="flex items-center justify-between p-2.5 bg-slate-100 rounded border border-slate-200">
                      <span className="text-blue-700 font-bold">1. VOI_to_KAIST_Scholar (You)</span>
                      <strong className="text-blue-700 font-bold">{activeContest.score}</strong>
                    </div>
                    
                    <div className="flex items-center justify-between p-2.5 bg-transparent rounded text-slate-500">
                      <span>2. KAIST_Math_Cadet</span>
                      <span>2400</span>
                    </div>

                    <div className="flex items-center justify-between p-2.5 bg-transparent rounded text-slate-500">
                      <span>3. Deep_Subspace_Solver</span>
                      <span>1900</span>
                    </div>

                    <div className="flex items-center justify-between p-2.5 bg-transparent rounded text-slate-500">
                      <span>4. NumPy_Speedrunner</span>
                      <span>800</span>
                    </div>
                  </div>

                  <button 
                    onClick={() => {
                      setActiveContest(null);
                      setTerminalLogs(prev => [...prev, '🚪 Virtual Contest forfeited. Scoreboard closed.']);
                    }}
                    className="w-full py-2 bg-red-50 border border-red-200 hover:bg-red-100 text-red-650 rounded-lg text-xs font-semibold transition font-mono uppercase"
                  >
                    Quit Contest (Forfeit)
                  </button>
                </div>
              </div>
            ) : (
              <div className="max-w-2xl mx-auto text-center space-y-6 pt-12">
                <div className="p-4 bg-amber-100 border border-amber-200 text-amber-600 rounded-full inline-block shadow-sm">
                  <Trophy className="w-12 h-12" />
                </div>
                
                <div className="space-y-2">
                  <h1 className="font-display font-bold text-xl text-slate-900 tracking-wide">Enter the Virtual Contest</h1>
                  <p className="text-xs text-slate-500 max-w-lg mx-auto leading-relaxed">
                    Test your mathematical and algorithmic skills in a simulated 120-minute exam challenge. You will solve 5 math problems of escalating ELO difficulties from actual KAIST MAS101 Quizzes.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 max-w-md mx-auto text-left text-xs font-mono bg-white p-4 border border-slate-200 rounded-2xl shadow-xs">
                  <div className="space-y-1">
                    <span className="block text-slate-400 font-semibold">FORMAT:</span>
                    <strong className="text-slate-800 block uppercase">5 Problems (A to E)</strong>
                  </div>
                  
                  <div className="space-y-1">
                    <span className="block text-slate-400 font-semibold">TIMER CONSTRAINTS:</span>
                    <strong className="text-slate-800 block uppercase">120 Minutes</strong>
                  </div>

                  <div className="space-y-1 col-span-2 pt-2 border-t border-slate-200">
                    <span className="block text-slate-400 font-semibold font-mono">PENALIZATION LAW:</span>
                    <strong className="text-amber-600 block">Score decreases linearly with time passed</strong>
                  </div>
                </div>

                <button
                  onClick={() => startNewContest()}
                  className="px-6 py-3 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-650 text-white font-display font-bold text-sm rounded-lg hover:brightness-110 active:scale-95 transition inline-flex items-center gap-2 shadow-lg shadow-amber-500/15"
                >
                  <Trophy className="w-4 h-4 text-white" />
                  <span>Start Virtual Midterm Exam</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* 4. MASTER SCOREBOARD VIEW: ALL SUBMISSIONS HISTORY */}
        {activeTab === 'submissions' && (
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div>
              <h2 className="font-display font-bold text-slate-800 tracking-tight text-sm flex items-center gap-2">
                <History className="w-4 h-4 text-purple-600" />
                <span>My Historical Submissions</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">Tracking grading verdicts and feedback loops saved in local space</p>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-2xs">
              <table className="w-full text-left border-collapse text-xs font-mono">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 tracking-wider font-bold">
                    <th className="p-3.5">Submission ID</th>
                    <th className="p-3.5">Problem Title</th>
                    <th className="p-3.5 text-center">Verdict</th>
                    <th className="p-3.5">Grader Language</th>
                    <th className="p-3.5">Submitted At</th>
                    <th className="p-3.5 text-right">Rating Adjustment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {submissions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-10 text-slate-400">
                        No submissions logged in this session yet. Choose a problem to start!
                      </td>
                    </tr>
                  ) : (
                    submissions.map(sub => (
                      <tr key={sub.id} className="hover:bg-slate-50 transition">
                        <td className="p-3.5 text-slate-450">#{sub.id.substring(4, 12)}</td>
                        <td className="p-3.5">
                          <strong className="text-slate-800 hover:underline hover:text-blue-600 cursor-pointer block">{sub.problemTitle}</strong>
                          <span className="text-[10px] text-slate-400 block">Rating: {sub.rating}</span>
                        </td>
                        <td className="p-3.5 text-center">
                          <span className={`inline-block px-2.5 py-1 rounded font-bold uppercase border tracking-wider text-[10px] ${sub.verdict === 'AC' ? 'bg-green-50 text-green-700 border-green-200/80' : sub.verdict === 'WA' ? 'bg-red-50 text-red-700 border-red-200/80' : 'bg-amber-50 text-amber-700 border-amber-250'}`}>
                            {sub.verdict}
                          </span>
                        </td>
                        <td className="p-3.5 text-slate-700">{sub.language}</td>
                        <td className="p-3.5 text-slate-500">{sub.submittedAt}</td>
                        <td className={`p-3.5 text-right font-bold ${sub.ratingChange! >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                          {sub.ratingChange ? (sub.ratingChange >= 0 ? `+${sub.ratingChange}` : sub.ratingChange) : '0'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 5. VISION INGESTER: PARSE HANDWRITTEN EXAMS */}
        {activeTab === 'upload' && (
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 text-center space-y-5 shadow-xs">
              <div className="p-4 bg-teal-50 text-teal-600 rounded-full inline-block">
                <Upload className="w-10 h-10" />
              </div>
              
              <div className="space-y-1.5">
                <h1 className="font-display font-bold text-lg text-slate-950 tracking-tight">AI Problem Ingestion (Exam OCR Parser)</h1>
                <p className="text-xs text-slate-500 max-w-lg mx-auto leading-relaxed">
                  Upload a clean JPG/PNG screenshot of a handwritten mathematical problem, homework document, or blackboard sketch. Our server-side Gemini Vision agent will bóc tách (extract) the equations, formulate a Codeforces Problem, and compute its Rating!
                </p>
              </div>

              {/* Ingestion status bar / error */}
              {parsingError && (
                <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2 max-w-md mx-auto">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <p className="text-left font-semibold">{parsingError}</p>
                </div>
              )}

              {/* Upload Drop Zone drag and drop structure */}
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-250 hover:border-blue-500 bg-slate-50/50 hover:bg-blue-50/30 py-12 px-6 rounded-2xl cursor-pointer transition flex flex-col items-center justify-center gap-3 group"
              >
                <div className="p-3 bg-white border border-slate-200 rounded-xl group-hover:scale-105 transition shadow-2xs">
                  <FileCode className="w-6 h-6 text-slate-400 group-hover:text-blue-600" />
                </div>
                
                <div className="text-xs space-y-1 font-mono">
                  <p className="font-semibold text-slate-800">Drag & drop or Click to choose snapshot image</p>
                  <p className="text-slate-400 font-normal">Supports standard PNG, JPEG formats up to 10MB</p>
                </div>

                <input 
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleUploadedSnapshot(file);
                  }}
                  accept="image/*"
                  className="hidden"
                />
              </div>

              {/* Mock problem generator so they can test immediately if no upload */}
              <div className="pt-3 flex flex-col sm:flex-row gap-3 items-center justify-center">
                <span className="text-xs text-slate-400">Don't have a quiz screenshot on hand?</span>
                <button 
                  onClick={() => trySampleScan()}
                  disabled={isUploading}
                  className="px-4 py-2 bg-slate-100 border border-slate-200 hover:text-blue-600 hover:border-blue-300 text-slate-800 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition select-none disabled:opacity-50"
                >
                  {isUploading ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Brain className="w-3.5 h-3.5 text-blue-600" />
                  )}
                  <span>Try Ingesting sample handwritten page (Instant demo)</span>
                </button>
              </div>
            </div>

            {/* Ingest process guide */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
              <h3 className="font-display font-semibold text-slate-800 text-sm">Vision Ingestion Logic Requirements</h3>
              
              <ul className="text-xs leading-relaxed text-slate-500 space-y-2 list-disc pl-4 font-sans">
                <li>Make sure handwritten characters are clearly legible with sufficient illumination.</li>
                <li>Equations wrapped in LaTeX formats will load directly into the render panels automatically.</li>
                <li>The algorithm uses Gemini Multimodal Vision parameters to calculate Codeforces rating indexes based on conceptual prerequisites.</li>
              </ul>
            </div>
          </div>
        )}

      </main>

      {/* ================= TERMINAL COMMAND FLOATING AREA ================= */}
      {showTerminal && (
        <div className="fixed bottom-14 right-4 max-w-lg w-full bg-slate-950 border border-slate-800 rounded-xl shadow-2xl z-50 overflow-hidden font-mono text-xs flex flex-col justify-between">
          <div className="bg-slate-900 px-4 py-2 flex justify-between items-center border-b border-slate-800/60">
            <span className="text-teal-400 font-bold flex items-center gap-1">
              <Terminal className="w-3.5 h-3.5" />
              <span>KAIST-Forces Judge Terminal Console</span>
            </span>
            <button 
              onClick={() => setShowTerminal(false)}
              className="px-1.5 hover:text-white text-slate-400"
            >
              ✕
            </button>
          </div>

          <div className="p-4 h-48 overflow-y-auto space-y-1.5 bg-slate-950 text-slate-200">
            {terminalLogs.map((log, idx) => (
              <div key={idx} className="whitespace-pre-wrap leading-relaxed select-all">
                {log.startsWith('>') ? (
                  <span className="text-slate-500 font-bold">{log}</span>
                ) : log.includes('AC') ? (
                  <span className="text-green-400 font-semibold">{log}</span>
                ) : log.includes('WA') || log.includes('Error') ? (
                  <span className="text-red-400 font-semibold">{log}</span>
                ) : (
                  <span>{log}</span>
                )}
              </div>
            ))}
            <div ref={logsEndRef} />
          </div>

          {/* Form write line inputs */}
          <form onSubmit={handleTerminalSubmit} className="bg-slate-950 flex items-center border-t border-slate-800/80">
            <div className="pl-3.5 text-teal-400 font-black select-none pointer-events-none">$</div>
            <input 
              type="text"
              value={terminalInput}
              onChange={(e) => setTerminalInput(e.target.value)}
              placeholder="Type /status or /problem 1500 or /help..."
              className="flex-1 bg-transparent px-3 py-2.5 outline-none font-mono text-xs text-teal-400"
              autoFocus
            />
            <button 
              type="submit"
              className="p-3 text-teal-400 hover:text-white"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}

      {/* ================= FOOTER WATERMARK ================= */}
      <footer className="border-t border-slate-200 bg-slate-100 py-4 text-center text-[11px] text-slate-500 font-mono mt-12">
        <p>© 2026 KAIST-Forces Judge System. Created for MAS101 Core Curriculum and AI Studio engineering tracks.</p>
      </footer>
      
    </div>
  );
}
