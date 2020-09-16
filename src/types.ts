export type totalCovidData = {
  cases: number,
  deaths: number,
  active: number,
  recovered: number
};

type covidData = [
  cases: (number | null)[],
  deaths: (number | null)[],
  active: (number | null)[],
  recovered: (number | null)[]
];

type info = [
  country: string,
  state: (string | null),
  population: number,
  startDate: string,
  endDate: string,
  covidData: covidData,
  points: number,
  flag: string
];

type coords = [
  longitude: number[],
  latitude: number[],
  state: string
];

export type data = {
  totalStartDate: string,
  totalEndDate: string,
  totalCovidData: totalCovidData[][],
  min: number[],
  max: number[],
  minPerArea: number[],
  maxPerArea: number[],
  minPerPerson: number[],
  maxPerPerson: number[],
  info: { [key: string]: info },
  coords: { [key: string]: coords }
};