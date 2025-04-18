class ChoroplethMap {

  /**
   * Class constructor with basic configuration
   * @param {Object}
   * @param {Array}
   */
  constructor(config, data) {
    this.config = {
      parentElement: config.parentElement,
      containerWidth: config.containerWidth || 650,
      containerHeight: config.containerHeight || 500,
      margin: config.margin || {top: 0, right: 0, bottom: 0, left: 0},
      projection: config.projection || d3.geoAlbersUsa(),  // Use Albers USA projection
      tooltipPadding: 10
    }
    this.data = data;
    this.initVis();
  }
  
  /**
   * We initialize scales/axes and append static elements, such as axis titles.
   */
  initVis() {
    let vis = this;

    // Calculate inner chart size. Margin specifies the space around the actual chart.
    vis.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
    vis.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;

    // Define size of SVG drawing area
    vis.svg = d3.select(vis.config.parentElement).append('svg')
        .attr('width', vis.config.containerWidth)
        .attr('height', vis.config.containerHeight);

    // Append group element that will contain our actual chart 
    // and position it according to the given margin config
    vis.chart = vis.svg.append('g')
        .attr('transform', `translate(${vis.config.margin.left},${vis.config.margin.top})`)
        .style('border', '10px solid red');

    // Set the scale for the Albers USA projection
    vis.config.projection
      .scale(2000); // Adjust scale as needed
    
    vis.geoPath = d3.geoPath().projection(vis.config.projection);

    vis.updateVis();
  }

  updateVis() {
    let vis = this;

    vis.colorScale = d3.scaleSequential()
      .domain([0, d3.max(stateCounts, d => d.count)])
      .interpolator(d3.interpolateReds);

    vis.renderVis();
  }

  /**
   * Bind data to visual elements.
   */
  renderVis() {
    
    let vis = this;

    // Convert compressed TopoJSON to GeoJSON format
    const states = topojson.feature(vis.data, vis.data.objects.states);

    // Defines the scale of the projection so that the geometry fits within the SVG area
    const scale = Math.max(vis.width, vis.height);

    // Set the projection's scale and center manually
    vis.config.projection = d3.geoAlbersUsa()
      .scale(scale)
      .translate([vis.width / 2, vis.height / 2]);  // Adjust the translation to center the map

    // Use fitSize to make sure the projection is adjusted properly
    vis.geoPath = d3.geoPath().projection(vis.config.projection);

    // Append shapes of U.S. states
    const geoPath = vis.chart.selectAll('.geo-path')
    .data(states.features);

    const stateCountMap = new Map(stateCounts.map(d => [d.state, d.count]));
    // console.log(stateCountMap);
    // ENTER: Create new elements when data is added
    geoPath.enter()
    .append('path')
    .attr('class', 'geo-path')
    .attr('d', vis.geoPath)
    .attr('fill', d => selectedState === d.properties.name ? '#CE6DBDFF' : statesToHighlight.includes(d.properties.name) ? '#473c9c' : vis.colorScale(stateCountMap.get(d.properties.name) || 0))
    .attr('stroke', '#fff')
    .attr('stroke-width', '0.2')
    .on('mouseover', hoveredState)
    .on('mouseout', function(event, d) {
      d3.select('#tooltip').style('display', 'none');
      if (selectedState !== d.properties.name) {
        d3.select(this).attr('fill', statesToHighlight.includes(d.properties.name) ? '#473c9c' : vis.colorScale(stateCountMap.get(d.properties.name) || 0));
      }
    })
    .on('click', stateClick);

    // UPDATE
    geoPath
    .attr('d', vis.geoPath)
    .attr('stroke', 'lightgray')
    .attr('stroke-width', '0.5')
    .on('mouseover', hoveredState)
    .on('mouseout', function(event, d) {
      d3.select('#tooltip').style('display', 'none');
      if (selectedState !== d.properties.name) {
        d3.select(this).attr('fill', statesToHighlight.includes(d.properties.name) ? '#473c9c' : vis.colorScale(stateCountMap.get(d.properties.name) || 0));
      }
    })
    .on("click", stateClick)
    .transition().duration(900)
    .attr('fill', d => selectedState === d.properties.name ? '#CE6DBDFF' : statesToHighlight.includes(d.properties.name) ? '#473c9c' : vis.colorScale(stateCountMap.get(d.properties.name) || 0));

    // EXIT
    geoPath.exit().remove();

    function hoveredState(event, d) {
      // highlight when hovering only if not already active
      if (!statesToHighlight.includes(d.properties.name) && selectedState !== d.properties.name) {
        d3.select(this).attr('fill', sunburst.colorScale(d.properties.name));
      }

      d3.select('#tooltip')
        .style('display', 'block')
        .style('left', (event.pageX + vis.config.tooltipPadding) + 'px')   
        .style('top', (event.pageY + vis.config.tooltipPadding) + 'px')
        .html(`
          <h5 style="margin: 0; padding: 0; line-height: 1; font-size: 14px; white-space: nowrap;">${d.properties.name}</h5>
          <span>Number of books banned in this state: ${stateCounts.find(item => item.state === d.properties.name) ? stateCounts.find(item => item.state === d.properties.name).count : 0 }</span>
        `);
    }

    function stateClick(event, d) {
      // wipe statesToHighlight array
      //statesToHighlight = [];
      // if already selected, deselect
      if (selectedState === d.properties.name || !stateCountMap.get(d.properties.name)) {
        selectedState = "";
      } else { // select state
        selectedState = d.properties.name;
      }
      choroplethMap.updateVis();
      filterByState();
      pathTooltipChange();
    }

    vis.renderLegend();
  }

  renderLegend() {
    let vis = this;

    vis.chart.selectAll(".legend").remove();

    const colorLegend = d3.legendColor()
    .scale(vis.colorScale)
    .shapeWidth(50)
    .shapeHeight(10)
    .cells(0)
    .orient("horizontal")
    .labelFormat(d3.format(".0f"))
    .title("Number of bans");

    vis.chart.append("g")
      .attr("class", "legend")
      .attr("transform", "translate(370,30)")
      .call(colorLegend);
      //.selectAll("text")
      //.style("font-size", "10px");
  }
}
