export type PredictionScores = {
  score1_home: number;
  score1_away: number;
  score2_home: number;
  score2_away: number;
  score3_home: number;
  score3_away: number;
};

export function formatPredictionScores(p: PredictionScores): string {
  return [
    `${p.score1_home}-${p.score1_away}`,
    `${p.score2_home}-${p.score2_away}`,
    `${p.score3_home}-${p.score3_away}`,
  ].join(" · ");
}

export function formatPredictionScoresCsv(p: PredictionScores): string {
  return `${p.score1_home}-${p.score1_away}, ${p.score2_home}-${p.score2_away}, ${p.score3_home}-${p.score3_away}`;
}
