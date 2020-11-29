function setupSunburst(data, {width, height, id, stateChanged}) {
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
    dimensions.boundedHeight = dimensions.height - dimensions.margin.top - dimensions.margin.bottom;

    let selectedState = 'California'


    // group the data by party
    data = d3.nest().key(d => d['Winning Party']).rollup(v => {
        return v.map(d => {
            return {
                name: d.State,
                value: d.Votes
            }
        });
    }).object(data);

    // compose the data to conform to d3 flare.json structure (https://github.com/d3/d3-hierarchy/blob/master/test/data/flare.json)

    const flareData = {
        name: "flare",
        children: [
            ...data.Republicans.map(d=> {return {...d, color : republicans}}),
            ...data.Democrats.map(d=> {return {...d, color : democrats}})
        ]
    }

    const radius = width / 5;

    const arc = d3.arc()
        .startAngle(d => d.x0)
        .endAngle(d => d.x1)
        .padAngle(d => Math.min((d.x1 - d.x0) / 2, 0.005))
        .padRadius(radius * 1.5)
        .innerRadius(d =>0)
        .outerRadius(d => Math.max(d.y0 * radius, d.y1 * radius - 1));

    const partition = data => {
        const root = d3.hierarchy(data)
            .sum(d => d.value)
        return d3.partition()
            .size([2 * Math.PI, root.height + 1])
            (root);
    }

    const root = partition(flareData);
    root.each(d => d.current = d);


    const svg = d3.select('#' + id).append('svg')
        .attr("viewBox", [-dimensions.margin.left, dimensions.margin.top, dimensions.width, height])
        .style("font", "10px sans-serif")
        .style("user-select", "none")
        .attr('width', '100%')
        .attr('height', '100%')
    const g = svg.append('g')
        .attr("transform", "translate(" + dimensions.width / 2 + "," + dimensions.height / 1.8 + ")");

    function setOpacity(d){
        return d.data.name === selectedState ?  1 : .3
    }

    function setSelectedState(newState){
        selectedState = newState;
        g.selectAll('.state-path')
            .style('fill-opacity', setOpacity)
    }
    const path = g.append("g")
        .selectAll("path")
        .data(root.descendants().slice(1))
        .join("path")
        .attr('class', 'state-path')
        .style('fill-opacity', setOpacity)
        .style('stroke', 'black')
        .style('stroke-width', .2)
        .style("cursor", "pointer")
        .attr("fill", d => {
            return d.data.color;
        })
        .attr("d", d => arc(d.current))
        .on('click', function(d){
            setSelectedState(d.data.name);
            d3.select('#state-select').property('value', d.data.name).on('change')()
        })


    const label = g.append("g")
        .attr("text-anchor", "middle")
        .style("user-select", "none")
        .selectAll("text")
        .data(root.descendants().slice(1))
        .join("text")
        .attr("dy", "0.35em")
        .attr("fill-opacity", d => +labelVisible(d.current))
        .attr("transform", d => labelTransform(d.current))
        .attr("font-size", d => d.children ? "15" : "13")
        .attr('fill', '#262626')
        .html(d => d.data.name + " <tspan fill='#262626' font-weight='bold'>(" +  (d.data.total || d.data.value) + ")</tspan>");



    function labelVisible(d) {
        return d.y1 <= 2 && d.y0 >= 1 && (d.y1 - d.y0) * (d.x1 - d.x0) > 0.03;
    }

    function labelTransform(d) {
        const x = (d.x0 + d.x1) / 2 * 180 / Math.PI;
        const y = (d.y0 + d.y1) / 2 * radius;
        return `rotate(${x - 90}) translate(${y},0) rotate(${x < 180 ? 0 : 180})`;
    }


    // Legend section
    var legendData = [{name: "Clinton, Hillary", color: democrats}, {name: "Trump, Donald J", color: republicans}]
    var legend = svg.append('g').attr('transform', `translate(${.8 * dimensions.width},${ dimensions.height + 70})`).selectAll('.legend').data(legendData).enter().append("g")
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

    return {setSelectedState}
}