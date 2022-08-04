declare interface CinemaJSON {
  [key: string]: CinemaItem[];
}

declare interface CinemaItem {
  name: string;
  display: string;
  release: Date;
  genre: string;
  timeMin?: string;
  time: number;
  cover: string;
  url: string;
  theater: string[];
}
