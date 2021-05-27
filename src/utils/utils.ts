
// convert Date object to string - month/day/year
export function toDateString(date: Date) {
	return `${date.getFullYear()}-${(date.getMonth() + 1 < 10)
		? "0" + (date.getMonth() + 1)
		: date.getMonth() + 1}-${(date.getDate() < 10)
			? "0" + date.getDate()
			: date.getDate()}`;
}

// returns all dates with covid data
export function getDateRange(data: any, startDate = data.totalStartDate, endDate = data.totalEndDate) {
	const startDateTimestamp = new Date(startDate).getTime();
	const endDateTimestamp = new Date(endDate).getTime();

	const dateRange: { [key: string]: number } = {};
	const dayMilliseconds = 86400 * 1000;

	let time = startDateTimestamp;
	let idx = 0;

	while (time <= endDateTimestamp) {
		const dateString = toDateString(new Date(time));
		dateRange[dateString] = idx;

		time += dayMilliseconds;
		idx += 1;
	}

	return dateRange;
}

// returns index of a given date in dateRange
export function getDateIndex(data: any, date: string, dateRange = getDateRange(data), startDate = data.totalStartDate, endDate = data.totalEndDate) {
	if (dateRange.hasOwnProperty(date)) {
		if (dateRange[date] < dateRange[endDate]) {
			return Math.max(dateRange[date], 0);
		} else {
			return Math.max(dateRange[endDate], 0);
		}
	}

	const dateRangeEntries = Object.entries(dateRange);
	return Math.max(dateRangeEntries[dateRangeEntries.length - 1][1], 0);
}

// returns latest date with covid data
export function getLatestDate(data: any): string {
	return data.totalEndDate;
}

// converts number to a more readable string format - e.g. 31470367 to 31,470,367
function toNumString(num: number) {
	return num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,");
}

// returns total for a given type
export function getCovidTypeCount(data: any, covidDataType: number, dateRange: { [key: string]: number }, targetDate: string) {
	return toNumString(data.totalCovidData[covidDataType][dateRange[targetDate]]);
}

interface getSceneDataProps {
	targetDateIndex: number,
	covidDataType: number,
	dateRange?: { [key: string]: number },
	covidDataRange?: number,
	targetDate?: string
}

// returns all data points with latitude, longitude, a rate adjusted value and iso 
export function getSceneData(data: any, props: getSceneDataProps) {

	const {
		targetDateIndex,
		covidDataType,
		dateRange = getDateRange(data, data.totalStartDate, data.totalEndDate),
		covidDataRange = data.maxPerPerson[covidDataType] - data.minPerPerson[covidDataType],
		targetDate = Object.keys(dateRange)[targetDateIndex]
	} = props;

	const boxInfos = [];

	for (let iso in data.coords) {

		const countryData = data.info[iso]
			? {
				country: data.info[iso][0],
				state: data.info[iso][1],
				population: data.info[iso][2],
				startDate: data.info[iso][3],
				endDate: data.info[iso][4],
				dates: data.info[iso][5],
				points: data.info[iso][6],
			}
			: null;

		// date of first recorded data for given iso
		let dateIndex =
			countryData &&
			getDateIndex(
				data,
				targetDate,
				dateRange,
				countryData.startDate,
				countryData.endDate
			);

		let covidData =
			countryData && countryData.dates && countryData.dates[covidDataType]
				? countryData.dates[covidDataType][dateIndex] /
				countryData.population
				: 0;

		// bugfix for france
		if (iso.includes("FR-")) {
			dateIndex =
				data.info["FR"] &&
				getDateIndex(
					data,
					targetDate,
					dateRange,
					data.info["FR"][3],
					data.info["FR"][4]
				);

			covidData =
				data.info["FR"] && data.info["FR"][5] && data.info["FR"][5][covidDataType]
					? data.info["FR"][5][covidDataType][dateIndex] /
					data.info["FR"][2]
					: 0;
		}

		const amount = Math.max(
			(covidData - data.minPerPerson[covidDataType]) / covidDataRange,
			0.01
		);

		if (countryData && countryData.state === null)
			countryData.state = data.coords[iso][2];

		const isoInfos = data.coords[iso][0].map((coord: number, idx: number) => {
			return { lng: coord, lat: data.coords[iso][1][idx], amount, iso };
		});

		boxInfos.push(...isoInfos);
	}

	return boxInfos;
}

// returns the coutry name for a given iso
export function getCountryName(data: any, iso: string): string {
	if (!data.info[iso][0]) {
		return "";
	}

	return data.info[iso][0];
}

// returns the url of the country flag
export function getCountryFlag(data: any, iso: string): string {
	if (!data.info[iso.split("-")[0]][7])
		return "";

	return data.info[iso.split("-")[0]][7];
}

// returns additional information for a given country
export function getCountryDetails(data: any, date: string, iso: string, covidType: string, covidTypeIndex: number): { [key: string]: string } {
	if (!data.info[iso][2]) {
		return {};
	}

	return {
		[covidType]: toNumString(data.info[iso][5][covidTypeIndex][getDateIndex(data, date)]),
		population: toNumString(data.info[iso][2])
	};
}

// returns the amount of points (coordinate pairs)
export function getTotalPoints(data: any) {
	let count = 0;
	const keys = Object.keys(data.coords);
	keys.forEach(k => {
		count += data.coords[k][0].length;
	})

	return count;
}

interface getChartDataProps {
	targetDateIndex: number,
	area: string,
	dateRange?: { [key: string]: number },
	targetDate?: string
}

// returns all cases, deaths, active, recovered numbers for a given country
export function getChartData(data: any, props: getChartDataProps) {

	const {
		targetDateIndex,
		area,
		dateRange = getDateRange(data, data.totalStartDate, data.totalEndDate),
		targetDate = Object.keys(dateRange)[targetDateIndex],
	} = props;

	const chartInfo = [];

	const dates = Object.keys(dateRange);

	if (area !== "World") {

		const countryData = data.info[area]
			? {
				country: data.info[area][0],
				startDate: data.info[area][3],
				endDate: data.info[area][4],
				dates: data.info[area][5],
			}
			: null;

		// date of first recorded data for given iso
		const dateIndex =
			countryData &&
			getDateIndex(
				data,
				targetDate,
				dateRange,
				countryData.startDate,
				countryData.endDate
			);

		if (dateIndex) {

			for (let i = 0; i < dateIndex; i++) {

				const cases: number =
					countryData && countryData.dates && countryData.dates[0]
						? countryData.dates[0][i]
						: 0;
				const deaths: number =
					countryData && countryData.dates && countryData.dates[2]
						? countryData.dates[2][i]
						: 0;
				const recovered: number =
					countryData && countryData.dates && countryData.dates[3]
						? countryData.dates[3][i]
						: 0;

				chartInfo.push(
					{
						key: 1,
						type: "Cases",
						country: countryData.country,
						covidInfo: cases || 0,
						date: new Date(dates[i]),
					},
					{
						key: 2,
						type: "Active",
						country: countryData.country,
						covidInfo: Math.max(cases - recovered || 0, 0),
						date: new Date(dates[i]),
					},
					{
						key: 3,
						type: "Deaths",
						country: countryData.country,
						covidInfo: deaths || 0,
						date: new Date(dates[i]),
					},
					{
						key: 4,
						type: "Recovered",
						country: countryData.country,
						covidInfo: recovered || 0,
						date: new Date(dates[i]),
					},
				);
			}
		}
	} else {

		const dateIndex =
			getDateIndex(
				data,
				targetDate,
				dateRange,
				data.totalStartDate,
				data.totalEndDate
			);

		for (let i = 0; i < dateIndex; i++) {

			const cases: number = data.totalCovidData[0][i];
			const deaths: number = data.totalCovidData[2][i];
			const recovered: number = data.totalCovidData[3][i];

			chartInfo.push(
				{
					key: 1,
					type: "Cases",
					country: "World",
					covidInfo: cases || 0,
					date: new Date(dates[i]),
				},
				{
					key: 2,
					type: "Active",
					country: "World",
					covidInfo: Math.max(cases - recovered || 0, 0),
					date: new Date(dates[i]),
				},
				{
					key: 3,
					type: "Deaths",
					country: "World",
					covidInfo: deaths || 0,
					date: new Date(dates[i]),
				},
				{
					key: 4,
					type: "Recovered",
					country: "World",
					covidInfo: recovered || 0,
					date: new Date(dates[i]),
				},
			);
		}
	}

	return chartInfo;
}