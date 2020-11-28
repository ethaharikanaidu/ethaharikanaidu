function setupSunburst(data, {width, height, id}) {
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
            {
                name: "Republicans",
                color: republicans,
                total : d3.sum(data.Republicans, d=>d.value),
                children: data.Republicans
            },
            {
                name: "Democrats",
                color: democrats,
                total : d3.sum(data.Democrats, d=>d.value),
                children: data.Democrats
            }
        ]
    }
    console.log(flareData)

    const radius = width / 8;

    const arc = d3.arc()
        .startAngle(d => d.x0)
        .endAngle(d => d.x1)
        .padAngle(d => Math.min((d.x1 - d.x0) / 2, 0.005))
        .padRadius(radius * 1.5)
        .innerRadius(d => d.y0 * radius)
        .outerRadius(d => Math.max(d.y0 * radius, d.y1 * radius - 1));

    const partition = data => {
        const root = d3.hierarchy(data)
            .sum(d => d.value)
            .sort((a, b) => b.value - a.value);
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

    const path = g.append("g")
        .selectAll("path")
        .data(root.descendants().slice(1))
        .join("path")
        .attr("fill", d => {
            while (d.depth > 1)
                d = d.parent;

            return d.data.color;
        })
        .attr("fill-opacity", d => arcVisible(d.current) ? (d.children ? 0.6 : 0.4) : 0)
        .attr("d", d => arc(d.current));

    path.filter(d => d.children)
        .style("cursor", "pointer")
        .on("click", clicked);

    const label = g.append("g")
        .attr("pointer-events", "none")
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
        .html(d => d.data.name + " <tspan fill='red' font-weight='bold'>(" +  (d.data.total || d.data.value) + ")</tspan>");

    const parent = g.append("circle")
        .datum(root)
        .attr("r", radius)
        .attr("fill", "none")
        .attr("pointer-events", "all")
        .on("click", clicked);

    function clicked(p) {
        parent.datum(p.parent || root);

        root.each(d => d.target = {
            x0: Math.max(0, Math.min(1, (d.x0 - p.x0) / (p.x1 - p.x0))) * 2 * Math.PI,
            x1: Math.max(0, Math.min(1, (d.x1 - p.x0) / (p.x1 - p.x0))) * 2 * Math.PI,
            y0: Math.max(0, d.y0 - p.depth),
            y1: Math.max(0, d.y1 - p.depth)
        });

        const t = g.transition().duration(750);

        // Transition the data on all arcs, even the ones that aren’t visible,
        // so that if this transition is interrupted, entering arcs will start
        // the next transition from the desired position.
        path.transition(t)
            .tween("data", d => {
                const i = d3.interpolate(d.current, d.target);
                return t => d.current = i(t);
            })
            .filter(function (d) {
                return +this.getAttribute("fill-opacity") || arcVisible(d.target);
            })
            .attr("fill-opacity", d => arcVisible(d.target) ? (d.children ? 0.6 : 0.4) : 0)
            .attrTween("d", d => () => arc(d.current));

        label.filter(function (d) {
            return +this.getAttribute("fill-opacity") || labelVisible(d.target);
        }).transition(t)
            .attr("fill-opacity", d => +labelVisible(d.target))
            .attrTween("transform", d => () => labelTransform(d.current));
    }


    function arcVisible(d) {
        return d.y1 <= 2 && d.y0 >= 1 && d.x1 > d.x0;
    }

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
    var legend = svg.append('g').attr('transform', `translate(${.8 * dimensions.width},${.8 * dimensions.height})`).selectAll('.legend').data(legendData).enter().append("g")
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