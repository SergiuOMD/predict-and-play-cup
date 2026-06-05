export type FootballDataPerson = {
  id: number;
  name: string;
  firstName?: string | null;
  lastName?: string | null;
  position?: string | null;
  nationality?: string | null;
  shirtNumber?: number | null;
  role?: string | null;
};

export type FootballDataTeam = {
  id: number | null;
  name: string | null;
  shortName: string | null;
  tla: string | null;
  crest: string | null;
  squad?: FootballDataPerson[] | null;
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

export type FootballDataTeamsResponse = {
  teams: FootballDataTeam[];
  resultSet?: { count: number };
};
