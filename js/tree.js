function setupTree(data, {width, height, id}) {
    const fileData = d3.nest().key(d => d.State).rollup(function (v) {

        var democrats_vote = d3.sum(v, (d) => +d['Votes16 Clintonh']);
        var republicans_votes = d3.sum(v, (d) => +d['Votes16 Trumpd']);

        return {
            name: v[0].State,
            party: democrats_vote > republicans_votes ? "democrats" : "republicans",
            value33: democrats_vote > republicans_votes ? democrats_vote : republicans_votes
        };

    }).entries(data).map(d => d.value);
    const dataByParty = d3.nest().key(d => d.party).object(fileData)
    data = ({
        name: "US",
        children: [
            {name: "Republicans", party: "republicans", children: dataByParty.republicans},
            {name: "Democrats", party: "democrats", children: dataByParty.democrats}
        ]
    });

    const dy = width / 6;
    const diagonal = d3.linkVertical().x(d => d.x).y(d => d.y);
    const democrats = "#3984D8";
    const republicans = "#DB594C";

    const root = d3.hierarchy(data);
    var dimensions = {
        width ,
        height,
        margin: {
            top: 40,
            right: 10,
            left: 30,
            bottom: 10,
        }
    }

    root.x0 = dy / 2;
    root.y0 = 0;
    root.descendants().forEach((d, i) => {
        d.id = i;
        d._children = d.children;
    });
    dimensions.boundedWidth = dimensions.width - dimensions.margin.left - dimensions.margin.right
    dimensions.boundedHeight = dimensions.height - dimensions.margin.top - dimensions.margin.bottom

    var tree = d3.tree().size([dimensions.boundedWidth , dimensions.boundedHeight])

    const svg = d3.select('#' + id).append('svg')
        .attr("viewBox", [-dimensions.margin.left, dimensions.margin.top, dimensions.width, height])
        .style("font", "10px sans-serif")
        .style("user-select", "none")
        .attr('width', '100%')
        .attr('height', '100%')
        .append('g')
        .attr('transform', `scale(.98)`);

    const gLink = svg.append("g")
        .attr("fill", "none")
        .attr("stroke", "#555")
        .attr("stroke-opacity", 0.4)
        .attr("stroke-width", 1.5);

    const gNode = svg.append("g")
        .attr("cursor", "pointer")
        .attr("pointer-events", "all");

    var selectedState = 'California'

    function fillOpacity(d) {
        //determine the party
        var party = (dataByParty.republicans.find(d=>d.name === selectedState)||dataByParty.democrats.find(d=>d.name === selectedState)).party
        if (d.target.data.name === selectedState || (!d.source.parent && d.target.data.party === party) ) {
            return 1;
        }
        return .5
    }

    function strokeWidth(d) {
        //determine the party
        var party = (dataByParty.republicans.find(d=>d.name === selectedState)||dataByParty.democrats.find(d=>d.name === selectedState)).party
        if (d.target.data.name === selectedState || (!d.source.parent && d.target.data.party === party) ) {
            return 3;
        }
        return 1
    }

    function fontWeight(d) {
        if (d._children || d.data.name === selectedState ) {
            return 'bold';
        }
        return 'normal'
    }

    function fontSize(d) {
        if (d.parent === null ) {
            return '1.8em';
        }
        return d._children  ||  d.data.name === selectedState? "1.4em" : "1em"
    }

     function updateTree(state) {
         selectedState = state;
         d3.selectAll('.state-link').attr('opacity', fillOpacity).attr('stroke-width', strokeWidth)
         d3.selectAll('.tree-text').attr('font-weight', fontWeight).attr('font-size', fontSize)
     }


    function update(source) {
        const duration = d3.event && d3.event.altKey ? 2500 : 250;
        const nodes = root.descendants().reverse();
        const links = root.links();

        // Compute the new tree layout.
        tree(root);

        let left = root;
        let right = root;
        root.eachBefore(node => {
            if (node.x < left.x) left = node;
            if (node.x > right.x) right = node;
        });

        const height = right.x - left.x + dimensions.margin.top + dimensions.margin.bottom;

        const transition = svg.transition()
            .duration(duration)
            .attr("viewBox", [-dimensions.margin.left, left.x - dimensions.margin.top, width, height])
            .tween("resize", window.ResizeObserver ? null : () => () => svg.dispatch("toggle"));

        // Update the nodes…
        const node = gNode.selectAll("g")
            .data(nodes, d => d.id);

        // Enter any new nodes at the parent's previous position.
        const nodeEnter = node.enter().append("g")
            .attr("transform", d => `translate(${source.x0||0},${source.y1||0})`)
            .attr("fill-opacity", 0)
            .attr("stroke-opacity", 0)
            .on("click", function(d){
                d3.select('#state-select').property('value', d.data.name).on('change')();
               updateTree(d.data.name);
            })

        nodeEnter.append("circle")
            .attr("r", 2.5)
            .attr("fill", d=>{
                if(d.parent === null) return "black"
                return d.data.party === "democrats" ? democrats : republicans
            })
            .attr("stroke-width", 10);

        nodeEnter.append("text")
            .attr("class", 'tree-text')
            .attr("dy",  d => d._children ? "-0.31em" : "0.31em")
            .attr("font-size",  fontSize)
            .attr("font-weight",  fontWeight)
            .attr('transform', d => d._children ? null : 'rotate(-270)')
            .attr("x", d => d._children ? 0 : 6)
            .attr("text-anchor", d => d._children ? "middle" : "start")
            .text(d => d.data.name)
            .clone(true).lower()
            .attr("stroke-linejoin", "round")
            .attr("stroke-width", 3)
            .attr("stroke", "white");

        // Transition nodes to their new position.
        const nodeUpdate = node.merge(nodeEnter).transition(transition)
            .attr("transform", d => `translate(${d.x},${d.y})`)
            .attr("fill-opacity", 1)
            .attr("stroke-opacity", 1);

        // Transition exiting nodes to the parent's new position.
        const nodeExit = node.exit().transition(transition).remove()
            .attr("transform", d => `translate(${source.x},${source.y})`)
            .attr("fill-opacity", 0)
            .attr("stroke-opacity", 0);

        // Update the links…
        const link = gLink.selectAll("path")
            .data(links, d => d.target.id);

        // Enter any new links at the parent's previous position.
        const linkEnter = link.enter().append("path")
            .attr('class','state-link')
            .attr("d", d => {
                const o = {x: source.x0, y: source.y0};
                return diagonal({source: o, target: o});
            });

        // Transition links to their new position.
        link.merge(linkEnter).transition(transition)
            .attr("stroke", d => d.target.data.party === "democrats" ? democrats : republicans)
            .attr('opacity', fillOpacity)
            .attr('stroke-width', strokeWidth)
            .attr("d", diagonal);

        // Transition exiting nodes to the parent's new position.
        link.exit().transition(transition).remove()
            .attr("d", d => {
                const o = {x: source.x, y: source.y};
                return diagonal({source: o, target: o});
            });

        // Stash the old positions for transition.
        root.eachBefore(d => {
            d.x0 = d.x;
            d.y0 = d.y;
        });
    }
    update(root);



    // Legend section
    var legendData = [{name : "Clinton, Hillary", color : democrats},{name:"Trump, Donald J", color: republicans}]
    var legend = svg.append('g').attr('transform', `translate(${ .82 * dimensions.width},${ .18 * dimensions.height})`).selectAll('.legend').data(legendData).enter().append("g")
        .attr('class', 'legend')
        .attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; });

    legend.append("rect")
        .attr("width", 12)
        .attr("height", 12)
        .style("fill", d=> d.color);

    legend.append("text")
        .attr("x", 24)
        .attr("y", 8)
        .attr("dy", ".15em")
        .attr("font-size", 10)
        .text(function(d) { return d.name; });

    return {updateTree}
}