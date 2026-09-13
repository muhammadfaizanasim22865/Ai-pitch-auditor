export type Verdict = 'TRUE' | 'FALSE' | 'MIXED' | 'UNVERIFIED' | 'OPINION';
export type VerdictLabel = 'Supported' | 'Contradicted' | 'Mixed' | 'Unverified' | 'Opinion';

export interface Evidence {
  title: string;
  url: string;
  snippet: string;
}

export interface Claim {
  id: number;
  claim: string;
  category: string;
  verdict: Verdict;
  verdict_label: VerdictLabel;
  confidence: number;
  explanation: string;
  evidence: Evidence[];
  sources: string[];
  cross_examiner_questions: string[];
}

export interface CredibilityScore {
  score: number | null;
  scale: string;
  basis: string;
  counts: {
    TRUE: number;
    FALSE: number;
    MIXED: number;
    UNVERIFIED: number;
  };
}

export interface Metadata {
  processing_time_seconds: number;
  audio_filename: string;
  audio_size_bytes: number;
  stt_model: string;
  llm_model: string;
}

export interface AnalyzeResponse {
  transcript: string;
  claims: Claim[];
  claim_count: number;
  credibility_score: CredibilityScore;
  metadata: Metadata;
}

export interface ApiError {
  message: string;
  status?: number;
  type: 'network' | 'validation' | 'server' | 'unexpected';
}
