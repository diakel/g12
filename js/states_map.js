class StatesMap {

    /**
     * Class constructor for the sunburst chart with initial configuration
     * @param {Object}
     * @param {Array}
     */
    constructor(_config, _dataMap, _stateInfo) {
      this.config = {
        parentElement: _config.parentElement,
        containerWidth: 600,
        containerHeight: 600,
        margin: {top: 5, right: 10, bottom: 10, left: 100}
      }
      this.dataMap = _dataMap;
      this.stateInfo = _stateInfo;
      this.initVis();
    }
    
    /**
     * We initialize the visualization
     */
    initVis() {
      let vis = this;
  
      // Calculate inner chart size. Margin specifies the space around the actual chart.
      vis.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
      vis.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;

      // Define size of SVG drawing area
      vis.svg = d3.select(vis.config.parentElement)
        .append("svg")
        .attr("width", vis.config.containerWidth)
        .attr("height", vis.config.containerHeight);

     // vis.renderLegend(); // for future use
      vis.updateVis();
    }
  
    /**
     * Prepare the data before we render it.
     */
    updateVis() {
      let vis = this;

      const projection = d3.geoAlbersUsa()
        .scale(1000)
        .translate([vis.width / 2, vis.height / 2]);

      vis.path = d3.geoPath().projection(projection);

      const colorScale = d3.scaleSequential(d3.interpolateBlues)
        .domain([0, d3.max(Object.values(vis.stateInfo))]);
        
      vis.renderVis();
    }
  
    /**
     * Bind data to visual elements
     */
    renderVis() {
      let vis = this;

      vis.svg.append("g")
        .selectAll("path")
        .data(vis.dataMap.features)
        .join("path")
        .attr("d", vis.path)
        .attr("fill", d => {
            const stateName = d.properties.name;
            return vis.stateInfo[stateName] ? colorScale(vis.stateInfo[stateName]) : "#ccc";
        })
        .attr("stroke", "#fff")
        .on("mouseover", (event, d) => {
            const stateName = d.properties.name;
            d3.select("#tooltip")
            .style("visibility", "visible")
            .text(`${stateName}: ${vis.stateInfo[stateName] || "No Data"}`)
            .style("left", event.pageX + "px")
            .style("top", event.pageY + "px");
        })
        .on("mouseout", () => {
            d3.select("#tooltip").style("visibility", "hidden");
        });
    }


    /**
     * Create legend for the visualization. To be implemented. 
     */
    renderLegend() {
      let vis = this;
      // Stub
    }
  }