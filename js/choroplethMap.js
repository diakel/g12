class ChoroplethMap {

  /**
   * Class constructor with basic configuration
   * @param {Object}
   * @param {Array}
   */
  constructor(_config, _data) {
    this.config = {
      parentElement: _config.parentElement,
      containerWidth: _config.containerWidth || 850,
      containerHeight: _config.containerHeight || 550,
      margin: _config.margin || {top: 0, right: 0, bottom: 0, left: 0},
      projection: _config.projection || d3.geoAlbersUsa(),  // Use Albers USA projection
      tooltipPadding: 10
    }
    this.data = _data;
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
        .data(states.features)
      .join('path')
        .attr('class', 'geo-path')
        .attr('d', vis.geoPath)
        .attr('fill', '#9467BDFF')
        .attr('stroke', '#fff')
        .attr('stroke-width', '0.2');

        // Add an additional layer on top of the map to show the state borders more clearly
    // const geoBoundaryPath = vis.chart.selectAll('.geo-boundary-path')
    //     .data([topojson.mesh(vis.data, vis.data.objects.states)])
    //   .join('path')
    //     .attr('class', 'geo-boundary-path')
    //     .attr('d', vis.geoPath);

    geoPath
      .on('mouseover', (event,d) => {
        
        //d3.select(this).attr('fill', 'white');
        d3.select('#tooltip')
          .style('display', 'block')
          .style('left', (event.pageX + vis.config.tooltipPadding) + 'px')   
          .style('top', (event.pageY + vis.config.tooltipPadding) + 'px')
          .html(`
            <div class="tooltip-title"> ${d.properties.name} </div>
          `);
      })
      .on('mouseout', () => {
        d3.select('#tooltip').style('display', 'none');
      });
    
  }
}
