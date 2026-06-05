export type FootballDataTeam = {
  id: number | null;
  name: string | null;
  shortName: string | null;
  tla: string | null;
  crest: string | null;
};

export type FootballDataMatch = {
  id: number;
  utcDate: string;
  status: string;
  stage: string;
  group: string | null;
  homeTeam: FootballDataTeam;
  awayTeam: FootballDataTeam;
  score: {
    fullTime: { home: number | null; away: number | null };
  };
};

export type FootballDataMatchesResponse = {
  matches: FootballDataMatch[];
  resultSet?: { count: number };
};
