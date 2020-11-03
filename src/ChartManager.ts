import {
	select,
	selectAll,
	scaleTime,
	scaleLinear,
	line,
	extent,
	axisBottom,
	axisLeft,
	format,
	curveMonotoneX,
	interpolateString
} from "d3";
import { nest } from "d3-collection";
import {
	getChartData,
	getDateIndex,
	getLatestDate
} from "./utils/utils";

import { EventBus } from "./events/EventBus"
import { areaChange, timeseriesAction } from "./events/constants";

import { data } from "./types";

export class ChartManager {
	private eventBus: EventBus;
	private targetDate: string;
	private area: string;
	private chart: any;
	private data: data;

	constructor(eventBus: EventBus, data: data) {
		this.eventBus = eventBus;
		this.data = data;
		this.targetDate = getLatestDate(this.data);
		this.area = "World";

		this.chart = this.createChart();
	}


	private createChart() {
		const data = getChartData(this.data, { targetDateIndex: getDateIndex(this.data, this.targetDate), area: this.area });
		// set the dimensions and margins of the graph
		const width = parseInt(select("#chart-wrapper").style("width"));
		const height = parseInt(select("#chart-wrapper").style("height"));
		const marginX = 25;
		const marginY = 30;

		const svg = select("svg")
			.attr("id", "lineChart")
			.attr("width", width)
			.attr("height", height)
			.append("g");

		// set x-axis and y-axis
		let xScale = scaleTime()
			.domain(extent(data, (d: { [key: string]: Date }) => d.date))
			.range([marginX * 2, width - (marginX * 2)])
			.nice();

		let yScale = scaleLinear()
			.domain(extent(data, (d: { [key: string]: Date }) => d.covidInfo))
			.range([height - marginY, marginY])
			.nice();

		let xAxis = svg
			.append("g")
			.attr("transform", `translate(0, ${height - marginY})`)
			.attr("stroke-width", 1.2)
			.call(axisBottom(xScale).ticks(5).tickPadding(3));

		let yAxis = svg
			.append("g")
			.attr("transform", `translate(${marginX * 2}, 0)`)
			.attr("stroke-width", 1.2)
			.call(
				axisLeft(yScale).ticks(5).tickFormat(format(".1s")).tickPadding(3)
			);

		const colorRange = {
			1: "#538DD4",
			2: "#f4a261",
			3: "#e63946",
			4: "#2a9d8f"
		}

		const drawLine = line()
			.x((d: any) => xScale(d.date))
			.y((d: any) => yScale(d.covidInfo))
			.curve(curveMonotoneX);

		// animate the line drawing
		function transition(path) {
			selectAll(path._groups["0"]).each(function (d, i) {
				select(this)
					.transition()
					.attr("stroke-width", 2.5)
					.delay(i * 250)
					.duration(3000)
					.attrTween("stroke-dasharray", tweenDash);
			});
		}

		function tweenDash() {
			const l = this.getTotalLength();
			const i = interpolateString(`${0}, ${l}`, `${l}, ${l}`);
			return function (t) {
				return i(t);
			};
		}

		const multiLineData = nest()
			.key((d: any) => d.key)
			.entries(data);

		svg.append("g").attr("class", "line-group");

		const tooltip = svg.append("g").style("display", "none");

		tooltip
			.append("text")
			.attr("class", "tooltip")
			.attr("x", 15)
			.attr("y", 20)
			.style("text-anchor", "end");

		const keys = [
			multiLineData[3],
			multiLineData[2],
			multiLineData[1],
			multiLineData[0],
		];

		const legend = svg
			.append("g")
			.attr("text-anchor", "middle")
			.selectAll("g")
			.data(keys.slice().reverse())
			.enter()
			.append("g")
			.attr("transform", function (_, i) {
				return `translate(${(marginX * 2) + 12
					}, ${marginX + 10 + i * 16})`;
			});

		legend
			.append("rect")
			.attr("width", 12)
			.attr("height", 4)
			.attr("fill", (d: { [key: string]: string }) => colorRange[d.key]);

		legend
			.append("text")
			.attr("class", "legend")
			.attr("x", 16)
			.attr("y", 6)
			.attr("text-anchor", "start")
			.text(function (d) {
				return d.values[0].type;
			});

		// draw lines and add mouse-event listeners
		svg
			.select("g.line-group")
			.attr("fill", "none")
			.attr("stroke-width", 0)
			.selectAll("g")
			.data(multiLineData)
			.enter()
			.append("path")
			.attr("class", "line")
			.attr("stroke", (d: { [key: string]: string }) => colorRange[d.key])
			.attr("d", (d) => drawLine(d.values))
			.on("mouseover", function () {
				svg.classed("no-hover", false);
				selectAll("#lineChart path")
					.transition()
					.duration(100)
					.attr("opacity", 0.25);
				select(this).transition().duration(100).attr("opacity", 1);
				tooltip.style("display", null);
			})
			.on("mouseout", function () {
				selectAll("#lineChart path")
					.transition()
					.duration(100)
					.attr("opacity", 1);
				tooltip.style("display", "none");
			})
			.on("mousemove", function (e: any) {
				const mouseCoords = [e.offsetX, e.offsetY];
				const date = xScale.invert(mouseCoords[0]);
				const covidInfo = +yScale.invert(mouseCoords[1]).toFixed();

				var xPosition = (mouseCoords[0] - 15);
				var yPosition = (mouseCoords[1] - 25);

				tooltip.attr("transform", `translate(${xPosition}, ${yPosition})`);
				tooltip
					.select("text")
					.text(
						`${format(".2s")(covidInfo)} - ${new Date(
							date
						).toLocaleDateString()}`
					);
			})
			.call(transition);

		this.eventBus.subscribe(areaChange, (area: string) => {
			this.area = area;
			this.updateChart();
		});
		this.eventBus.subscribe(timeseriesAction, this.handleTimeseriesAction.bind(this));

		return {
			multiLineData,
			marginX,
			marginY,
			xScale,
			yScale,
			xAxis,
			yAxis,
			svg,
			drawLine,
		};
	}

	private updateChart() {
		let { xScale, yScale, xAxis, yAxis, svg, drawLine } = this.chart;

		const data = getChartData(this.data, { targetDateIndex: getDateIndex(this.data, this.targetDate), area: this.area });

		xScale.domain(extent(data, (d: any) => d.date)).nice();
		xAxis
			.transition()
			.duration(1000)
			.call(axisBottom(xScale).ticks(5).tickPadding(3));

		yScale.domain(extent(data, (d: any) => d.covidInfo)).nice();
		yAxis
			.transition()
			.duration(1000)
			.call(
				axisLeft(yScale).ticks(5).tickFormat(format(".1s")).tickPadding(3)
			);

		const multiLineData = nest()
			.key((d: any) => d.key)
			.entries(data);

		this.chart.multiLineData = multiLineData;

		svg.selectAll("path.line").each(function (_, i: number) {
			select(this)
				.transition()
				.attr("d", drawLine(multiLineData[i].values))
				.duration(1000);
		});

		if (this.area !== "World") {
			document.getElementById("chart-heading").textContent = this.chart.multiLineData[0].values[0].country;
		}

	}

	resizeChart() {
		let { multiLineData, marginX, marginY, xScale, yScale, xAxis, yAxis, drawLine } = this.chart;

		const width = parseInt(select("#chart-wrapper").style("width"));
		const height = parseInt(select("#chart-wrapper").style("height"));

		select("svg")
			.attr("width", width)
			.attr("height", height)

		xScale.range([marginX * 2, width - (marginX * 2)])
			.nice();
		yScale.range([height - marginY, marginY])
			.nice();

		xAxis
			.attr("transform", `translate(0, ${height - marginY})`)
			.call(axisBottom(xScale).ticks(5).tickPadding(3));
		yAxis
			.attr("transform", `translate(${marginX * 2}, 0)`)
			.call(axisLeft(yScale).ticks(5).tickFormat(format(".1s")).tickPadding(3));

		selectAll("path.line").each(function (_, i: number) {
			select(this)
				.attr("d", drawLine(multiLineData[i].values))
		});
	}

	private handleTimeseriesAction(target: string) {
		this.targetDate = target;
		this.updateChart();
	}
}
