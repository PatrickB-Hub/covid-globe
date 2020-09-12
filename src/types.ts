export type covidData = {
  cases: number,
  deaths: number,
  active: number,
  recovered: number
};

export type data = {
  totalStartDate: string,
  totalEndDate: string,
  totalCovidData: covidData[][],
  min: number[],
  max: number[],
  minPerArea: number[],
  maxPerArea: number[],
  minPerPerson: number[],
  maxPerPerson: number[],
  info: { [key: string]: (string | number | any[][])[] },
  coords: { [key: string]: (number[] | string)[] }
}