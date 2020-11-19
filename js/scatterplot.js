function setupScatterPlot(data, {width, height, id}) {
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
    const topN = 10;
    var topNData = data.slice(0, topN)
    var dimensions = {
        width ,
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
        .domain(topNData.map(function(d) { return d.state; }))
        .padding(.2)
        .range([ 0, dimensions.boundedWidth ]);

    var yScale = d3.scaleLinear()
        .domain([0,d3.max(topNData, d=>{
            return Math.max(d.republicans_vote, d.democrats_vote)
        })])
        .range([dimensions.boundedHeight,0])

    var svg = d3.select('#' + id).append('svg')
        .attr("viewBox", [0, 0, dimensions.width, dimensions.height])
        .attr('width', '100%')
        .attr('height', '100%')
        .append('g')
        .attr('transform', 'scale(.98)')

    var bounds = svg.append("g")
        .style("transform", `translate(${dimensions.margin.left}px, ${dimensions.margin.top}px)`);


    var xAxisGen = d3.axisBottom(xScale);

    var xAxis  = bounds.append("g")
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
        .attr("transform", "rotate(-65)" );

    var yAxisGen = d3.axisLeft(yScale);

    var yAxis =  bounds.append("g")
        .call(yAxisGen);

    // fatten the data
    var allData = [];
    topNData.forEach(d=>{
        allData.push({
            state : d.state,
            value : d.democrats_vote,
            color : democrats
        });
        allData.push({
            state : d.state,
            value : d.republicans_vote,
            color : republicans
        });
    })


    // add the circles
    bounds.append("g")
        .attr("stroke-width", 1.5)
        .selectAll("circle")
        .data(allData)
        .enter()
        .append("circle")
        .attr("fill", d => d.color)
        .attr('opacity', .8)
        .attr("cx", d => xScale(d.state) + xScale.bandwidth()/2)
        .attr("cy", d => yScale(d.value))
        .attr("r", topN > 25 ? 7 : 10)
        .on("mouseover", function(d){
            tooltip.text(formatComma(d.value))
            return tooltip.style("visibility", "visible");
        })
        .on("mousemove", function(){
            return tooltip.style("top", (d3.event.pageY-10)+"px").style("left",(d3.event.pageX+10)+"px");
        })
        .on("mouseout", function(){
            return tooltip.style("visibility", "hidden");
        });;


    // Legend section
    var legendData = [{name : "Clinton, Hillary", color : democrats},{name:"Trump, Donald J", color: republicans}]
    var legend = svg.append('g').attr('transform', `translate(${.85 * dimensions.width},${ .05 * dimensions.height})`).selectAll('.legend').data(legendData).enter().append("g")
        .attr('class', 'legend')
        .attr("transform", function(d, i) { return "translate(0," + i * 30 + ")"; });

    legend.append("circle")
        .attr("r", 8.5)
        .style("fill", d=> d.color);

    legend.append("text")
        .attr("x", 24)
        .attr("x", 24)
        .attr("dy", ".15em")
        .attr("font-size", 10)
        .text(function(d) { return d.name; });

    return {

    }
}