class ChoroplethMap {

  /**
   * Class constructor with basic configuration
   * @param {Object}
   * @param {Array}
   */
  constructor(config, data) {
    this.config = {
      parentElement: config.parentElement,
      containerWidth: config.containerWidth || 850,
      containerHeight: config.containerHeight || 550,
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

    vis.renderVis();
  }

  /**
   * Bind data to visual elements.
   */
  renderVis() {
    
    let vis = this;

    console.log("rendering");
    console.log(vis.activeStates);

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

    // ENTER: Create new elements when data is added
    geoPath.enter()
    .append('path')
    .attr('class', 'geo-path')
    .attr('d', vis.geoPath)
    .attr('fill', d => statesToHighlight.includes(d.properties.name) ? '#261d6d' : '#9467BDFF')
    .attr('stroke', '#fff')
    .attr('stroke-width', '0.2')
    .on('mouseover', function(event, d) {
      
      // highlight when hovering only if not already active
      if (!statesToHighlight.includes(d.properties.name)) {
        d3.select(this).attr('fill', '#CE6DBDFF');
      }

      d3.select('#tooltip')
        .style('display', 'block')
        .style('left', (event.pageX + vis.config.tooltipPadding) + 'px')   
        .style('top', (event.pageY + vis.config.tooltipPadding) + 'px')
        .html(`
          <div class="tooltip-title"> ${d.properties.name} </div>
        `);
    })
    .on('mouseout', function(event, d) {
      d3.select('#tooltip').style('display', 'none');
      d3.select(this).attr('fill', statesToHighlight.includes(d.properties.name) ? '#261d6d' : '#9467BDFF');
    });

    // UPDATE
    geoPath
    .attr('d', vis.geoPath)
    .attr('fill', d => statesToHighlight.includes(d.properties.name) ? '#261d6d' : '#9467BDFF')
    .attr('stroke', '#fff')
    .attr('stroke-width', '0.2');

    // EXIT
    geoPath.exit().remove();
  }
}
