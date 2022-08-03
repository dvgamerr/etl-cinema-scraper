declare interface CinemaJSON {
  [key: string]: CinemaItem
}

declare interface CinemaItem {
  name: string;
  display: string;
  release: Date;
  genre: string;
  time: number | string;
  cover: string;
  url: string;
  theater: string[];
}
