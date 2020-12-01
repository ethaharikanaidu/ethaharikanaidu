function setupScatterPlot(data, {width, height, id, abbreviation}) {
    data = d3.nest().key(d => d.State).rollup(function (v) {

        return {
            state: v[0].State,
            abbreviation: v[0].ST,
            republicans_vote: d3.sum(v, (d) => +d['Votes16 Trumpd']),
            democrats_vote: d3.sum(v, (d) => +d['Votes16 Clintonh'])
        };
    }).entries(data).map(d => d.value).sort((a, b) => {
        return (b.republicans_vote + b.democrats_vote) > (a.republicans_vote + a.democrats_vote)
    });

    const democrats = "#3984D8";
    const republicans = "#DB594C";
    const formatComma = d3.format(",");
    const topN = data.length;
    var topNData = data.slice(0, topN)
    var dimensions = {
        width,
        height,
        margin: {
            top: 40,
            right: 10,
            left: 80,
            bottom: 100,
        }
    }

    // Create tooltip
    var tooltip = d3.select(".svg-tooltip")

    dimensions.boundedWidth = dimensions.width - dimensions.margin.left - dimensions.margin.right
    dimensions.boundedHeight = dimensions.height - dimensions.margin.top - dimensions.margin.bottom

    var xScale = d3.scaleBand()
        .domain(topNData.map(function (d) {
            return d.state;
        }))
        .padding(.2)
        .range([0, dimensions.boundedWidth]);

    var yScale = d3.scaleLinear()
        .domain([0, d3.max(topNData, d => {
            return Math.max(d.republicans_vote, d.democrats_vote)
        })])
        .range([dimensions.boundedHeight, 0])

    var svg = d3.select('#' + id).append('svg')
       .attr("viewBox", [0, 0, dimensions.width, dimensions.height])
        .attr('width', dimensions.width)
        .attr('height', dimensions.height)
        .append('g')
        .attr('transform', `translate(0,${dimensions.margin.top})scale(.98)`);

    var bounds = svg.append("g")
        .style("transform", `translate(${dimensions.margin.left}px, ${dimensions.margin.top}px)`);


    var xAxisGen = d3.axisBottom(xScale).tickFormat(d=> abbreviation[d]);

    var xAxis = bounds.append("g")
        .attr("transform", "translate(0," + (dimensions.boundedHeight) + ")")
        .call(xAxisGen)
        .call(g => g.append("text")
            .attr("x", width)
            .attr("y", dimensions.margin.bottom - 4)
            .attr("fill", "currentColor")
            .attr("text-anchor", "end")
            .text('State'))
        .selectAll('text')
        .style("text-anchor", "end")
        .attr("dx", "-.8em")
        .attr("dy", ".15em")
        .style("font-size", "10")
        .attr("transform", "rotate(-65)")
        .append('title')
        .text(d=>d)

    var yAxisGen = d3.axisLeft(yScale);

    var yAxis = bounds.append("g")
        .call(yAxisGen)
        .call(g=>g.selectAll('text') .style('font-size', 10));

    // fatten the data
    var allData = [];
    topNData.forEach(d => {
        allData.push([{
            state: d.state,
            value: d.democrats_vote,
            color: democrats
        }, {
            state: d.state,
            value: d.republicans_vote,
            color: republicans
        }]);
    })


    const circleRadius = 5;
    const hoverCircleRadius = 10;
    const lineWidth = 2;
    const hoverLineWidth = 5;
    let currentState = 'California'

    // add the circles
    const statesGContainer = bounds.append("g")
        .attr('class', 'state-container');

    function update() {
        statesGContainer.html('')
       const statesG =  statesGContainer.selectAll(".statesG")
            .data(allData)
            .enter()
            .append('g')
            .attr('class', 'statesG')
            .attr('opacity', d => d[0].state === currentState ? 1 : .4)
            .attr('transform', `translate(${xScale.bandwidth() / 2},0)`)
            .on('mousemove', function () {
                d3.select(this).selectAll('circle').attr('r', hoverCircleRadius)
                d3.select(this).selectAll('.line').style('stroke-width', hoverLineWidth)
            })
            .on('mouseout', function () {
                d3.select(this).selectAll('circle').attr('r', circleRadius)
                d3.select(this).selectAll('.line').style('stroke-width', lineWidth)
            });

        //generate the line
        const lineGen = d3.line()
            .x(d => xScale(d.state))
            .y(d => yScale(d.value));
        statesG.append('path')
            .style('stroke', 'grey')
            .attr('class', 'line')
            .attr('d', d=> lineGen(d))

        const state = statesG.selectAll('.state').data(d => d).enter()
            .append("circle")
            .attr("fill", d => d.color)
            .attr("cx", d => xScale(d.state))
            .attr("cy", d => yScale(d.value))
            .attr("r", circleRadius)
            .on("mouseover", function (d) {
                tooltip.text(formatComma(d.value))
                tooltip.style("visibility", "visible");
            })
            .on("mousemove", function () {
                d3.select(this).attr('r', hoverCircleRadius);
                tooltip.style("top", (d3.event.pageY - 10) + "px").style("left", (d3.event.pageX + 10) + "px");
            })
            .on("mouseout", function () {
                d3.select(this).attr('r', circleRadius)
                tooltip.style("visibility", "hidden");
            });

    }


    // Legend section
    var legendData = [{name: "Clinton, Hillary", color: democrats}, {name: "Trump, Donald J", color: republicans}]
    var legend = svg.append('g').attr('transform', `translate(${.65 * dimensions.width},${.05 * dimensions.height})`).selectAll('.legend').data(legendData).enter().append("g")
        .attr('class', 'legend')
        .attr("transform", function (d, i) {
            return "translate(0," + i * 30 + ")";
        });

    legend.append("circle")
        .attr("r", 8.5)
        .style("fill", d => d.color);

    legend.append("text")
        .attr("x", 24)
        .attr("x", 24)
        .attr("dy", ".15em")
        .attr("font-size", 10)
        .text(function (d) {
            return d.name;
        });

    update();

    function stateChanged(newState){
        currentState = newState;
        update();
    }


    return {stateChanged}
}