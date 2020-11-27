function setupPieChart({width, height, id}) {
    const democrats = "#3984D8";
    const republicans = "#DB594C";
    var dimensions = {
        width,
        height,
        margin: {
            top: 40,
            right: 10,
            left: 30,
            bottom: 10,
        }
    }
    dimensions.boundedWidth = dimensions.width - dimensions.margin.left - dimensions.margin.right
    dimensions.boundedHeight = dimensions.height - dimensions.margin.top - dimensions.margin.bottom


    const svg = d3.select('#' + id).append('svg')
        .attr("viewBox", [-dimensions.margin.left, dimensions.margin.top, dimensions.width, height])
        .style("font", "10px sans-serif")
        .style("user-select", "none")
        .attr('width', '100%')
        .attr('height', '100%')
        .append('g')
        .attr("transform", "translate(" + dimensions.width / 2 + "," + dimensions.height / 1.8 + ")");

    var radius = Math.min(dimensions.boundedWidth, dimensions.boundedHeight) / 2;
    var data = [{color: republicans, totalVotes: 304}, {color: democrats, totalVotes: 227}];
    var pie = d3.pie()
        .value(function (d) {
            return d.totalVotes;
        });

    const arc =  d3.arc()
        .innerRadius(0)
        .outerRadius(radius)

    var data_ready = pie(data)
    const arcG = svg.selectAll('path')
        .data(data_ready)
        .enter()
    arcG.append('g')
        .append('path')
        .attr('d', arc)
        .attr('fill', function (d) {
            return (d.data.color)
        })
        .style("stroke-width", "2px")
        .style("opacity", 0.7);

    arcG.append('text')
        .attr("transform", function(d){ return "translate(" + arc.centroid(d) +")"; })
        .style("font-weight", "bold")
        .style("text-anchor", "middle")
        .style("fill", "white")
        .style("font-size", 32)
        .text(d=>d.data.totalVotes)


    // Legend section
    var legendData = [{name: "Clinton, Hillary", color: democrats}, {name: "Trump, Donald J", color: republicans}]
    var legend = svg.append('g').attr('transform', `translate(${.3 * dimensions.width},${-.35 * dimensions.height})`).selectAll('.legend').data(legendData).enter().append("g")
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

    return {}
}