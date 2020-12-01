function setupMap(data, us, {width, height, id}) {
    data = d3.nest().key(d => d.State).rollup(function (v) {

        return {
            state: v[0].State,
            abbreviation: v[0].ST,
            republicans_vote: d3.sum(v, (d) => +d['Votes16 Trumpd']),
            democrats_vote: d3.sum(v, (d) => +d['Votes16 Clintonh'])
        };
    }).object(data)
    const path = d3.geoPath();
    const democrats = "#3984D8";
    const republicans = "#DB594C";
    var selectedState = 'California'
    var dimensions = {
        width,
        height
    }

    function fillOpacity(d) {
        if ((d.properties || d.data).name === selectedState) {
            return 1;
        }
        return .5
    }

    function stateChanged(newState){
        selectedState = newState;
        d3.selectAll('.state-path').attr('opacity', fillOpacity)
        d3.selectAll('.state-link').attr('opacity', (d) =>{
            if (d.target.data.name === selectedState) {
                return 1;
            }
            return .3
        })
    }

    const state = {}

    const svg = d3.select('#' + id).append('svg')
        .attr("viewBox", [-30, 50, dimensions.width, dimensions.height])
        .attr('width', '100%')
        .attr('height', '100%')
        .append('g')
        .attr('transform', 'scale(.62)')
    var stateFeatures = topojson.feature(us, us.objects.states).features;
    svg.append("g")
        .attr('cursor', 'pointer')
        .selectAll("path")
        .data(stateFeatures)
        .enter()
        .append("path")
        .attr('class', 'state-path')
        .attr("fill", d => {
            var stateInfo = data[d.properties.name];
            if (stateInfo && stateInfo.republicans_vote > stateInfo.democrats_vote)
                return republicans
            return democrats
        })
        .attr('opacity', fillOpacity)
        .attr("d", path)
        .on('click', d=>{
            stateChanged(d.properties.name);
            d3.select('#state-select').property('value', d.properties.name).on('change')()
        })

    //state names
    svg.append("g")
        .attr("class", "states-names")
        .selectAll("text")
        .data(stateFeatures)
        .enter()
        .append("svg:text")
        .text(function (d) {
            return data[d.properties.name].abbreviation
        })
        .attr("x", function (d) {
            return path.centroid(d)[0];
        })
        .attr("y", function (d) {
            return path.centroid(d)[1];
        })
        .attr("text-anchor", "middle")
        .attr('pointer-events', 'none')
        .attr('fill', '#262626')
        .append('title')
        .text(function (d) {
            return data[d.properties.name].abbreviation
        });

    console.log(JSON.stringify(state))


    svg.append("path")
        .datum(topojson.mesh(us, us.objects.states, (a, b) => a !== b))
        .attr("fill", "none")
        .attr("stroke", "white")
        .attr("stroke-linejoin", "round")
        .attr("d", path)

    // Legend section
    var legendData = [{name: "Democrats", color: democrats}, {name: "Republicans", color: republicans}]
    var legend = svg.append('g').attr('transform', `translate(${1.28 * dimensions.width},${1.05 * dimensions.height})`).selectAll('.legend').data(legendData).enter().append("g")
        .attr('class', 'legend')
        .attr("transform", function (d, i) {
            return "translate(0," + i * 30 + ")";
        });

    legend.append("rect")
        .attr("width", 18)
        .attr("height", 15)
        .style("fill", d => d.color);

    legend.append("text")
        .attr("x", 24)
        .attr("y", 9)
        .attr("dy", ".35em")
        .text(function (d) {
            return d.name;
        });
    return {stateChanged}
}