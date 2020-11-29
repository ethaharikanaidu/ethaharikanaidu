function setupStackChart(data, {width, height, id, stateChanged}) {
    const dataByCounty = d3.nest().key(getCounty).rollup(function (v) {

        return {
            county: getCounty(v[0]),
            democrats_vote: d3.sum(v, (d) => +d['Votes16 Clintonh']),
            republicans_vote: d3.sum(v, (d) => +d['Votes16 Trumpd']),
            state: v[0].State
        };
    })
        .entries(data).map(d => d.value).sort((a, b) => {
            return (b.republicans_vote + b.democrats_vote) - (a.republicans_vote + a.democrats_vote)
        });
    const democrats = "#3984D8";
    const republicans = "#DB594C";
    const dataByState = d3.nest().key(d => d.state).object(dataByCounty);
    const color = d3.scaleOrdinal().domain(Object.keys(dataByCounty[0]).slice(1)).range([democrats, republicans]);
    let currentState = 'California';
    const topN = 10

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

    function setNewState(newState){
        currentState = newState;
        update();
    }

    //setup the dropdown select
    const dropdown = d3.select('#' + id)
        .append('div')
        .attr('class',  'p-2 text-center')
        .append('select')
        .attr('id', 'state-select')
        .attr('class',  'border-2 rounded p-2 border-gray-400')
        .style('margin-top', '12px')
        .on('change', function (){
            const newState = d3.select('#state-select').property('value');
            setNewState(newState);
            stateChanged(newState)
        })
    dropdown .selectAll('option')
        .data(Object.keys(dataByState))
        .enter()
        .append('option')
        .attr('value', d=>d)
        .html( d=>d)

    dimensions.boundedWidth = dimensions.width - dimensions.margin.left - dimensions.margin.right
    dimensions.boundedHeight = dimensions.height - dimensions.margin.top - dimensions.margin.bottom
    var svg = d3.select('#' + id).append('svg')
        .attr("viewBox", [-30, 250, dimensions.width, dimensions.height /3])
        .attr('width', '100%')
        .attr('height', '100%')

    function update() {
        svg.html("")
        var data = dataByState[currentState]
       data =  data.sort((a, b) => {
            return (b.republicans_vote + b.democrats_vote) - (a.republicans_vote + a.democrats_vote)
        });
        var topNData = data.slice(0, topN)
        var bounds = svg.append("g")
            .style("transform", `translate(${dimensions.margin.left}px, ${dimensions.margin.top}px)`);

        var series = d3.stack()
            .keys(Object.keys(topNData[0]).slice(1))
            (topNData)
            .map(d => (d.forEach(v => v.key = d.key), d))

        var xScale = d3.scaleLinear()
            .domain([0, d3.max(series, d => d3.max(d, d => d[1]))])
            .range([0, dimensions.boundedWidth]);

        var xAxis = bounds.append("g")
            .attr("transform", "translate(0," + (dimensions.boundedHeight) + ")")
            .call(d3.axisBottom(xScale).ticks(width / 100, "s"))
            .call(g => g.selectAll(".domain").remove())

        var yScale = d3.scaleBand()
            .domain(topNData.map(d => d.county))
            .range([0, dimensions.boundedHeight])
            .padding(0.08)

        var yAxis = bounds.append("g").call(d3.axisLeft(yScale).tickSizeOuter(0))
            .call(g => g.selectAll(".domain").remove())

        var rectG = bounds.append("g")
            .selectAll("g")
            .data(series)
            .enter()
            .append("g")
            .attr("fill", d => color(d.key))

        rectG.selectAll("rect")
            .data(d => d)
            .enter()
            .append("rect")
            .attr("x", d => xScale(d[0]))
            .attr("y", (d, i) => yScale(d.data.county))
            .attr("width", d =>{
                return (xScale(d[1]) - xScale(d[0])) || 0
            })
            .attr("height", yScale.bandwidth())

        // generate the first part of the texts
        const labels = [];
        series[0].forEach((d, index) => {
            labels.push({
                value: Math.round(d[1] / series[1][index][1] * 10000) / 100,
                x: xScale(d[1]) / 2,
                y: yScale(d.data.county) + yScale.bandwidth() / 2
            })
        })

        series[1].forEach((d, index) => {
            labels.push({
                value: Math.round((d[1] - d[0]) / d[1] * 10000) / 100,
                x: xScale(d[0]) + xScale(d[1] - d[0]) / 2,
                y: yScale(d.data.county) + yScale.bandwidth() / 2
            })
        })

        rectG.selectAll("text")
            .data(labels)
            .enter()
            .append("text")
            .attr("x", d => d.x)
            .attr("y", d => d.y)
            .attr("fill", 'black')
            .attr("font-size", 12)
            .attr("text-anchor", "middle")
            .text(d => d.value + "%")
    }

    update()


    // Legend section
    var legendData = [{name: "Clinton, Hillary", color: democrats}, {name: "Trump, Donald J", color: republicans}]
    var legend = svg.append('g').attr('transform', `translate(${.85 * dimensions.width},${.65 * dimensions.height})`).selectAll('.legend').data(legendData).enter().append("g")
        .attr('class', 'legend')
        .attr("transform", function (d, i) {
            return "translate(0," + i * 20 + ")";
        });

    legend.append("rect")
        .attr("width", 12)
        .attr("height", 12)
        .style("fill", d => d.color);

    legend.append("text")
        .attr("x", 24)
        .attr("y", 8)
        .attr("dy", ".15em")
        .attr("font-size", 16)
        .text(function (d) {
            return d.name;
        });

    return {
        setNewState
    }
}

getCounty = function (d) {
    var county = d.County.split(',')[0].replace(" County", "").replace(" City and Borough", "").replace(" Borough", "").replace(" Parish", "").replace(' city', "").replace(" Census Area", "").replace(" Municipality", "")
    return county
}