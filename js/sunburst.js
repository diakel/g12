class Sunburst {

    /**
     * Class constructor for the sunburst chart with initial configuration
     * @param {Object}
     * @param {Array}
     */
    constructor(_config, _data) {
      this.config = {
        parentElement: _config.parentElement,
        containerWidth: 400,
        containerHeight: 400,
        margin: {top: 5, right: 10, bottom: 10, left: 100}
      }
      this.data = _data;
      this.initVis();
    }
    
    /**
     * We initialize the arc generator, scales, axes, and append static elements
     */
    initVis() {
      let vis = this;
  
      // Calculate inner chart size. Margin specifies the space around the actual chart.
      vis.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
      vis.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;

      vis.radius = vis.width / 2;

      // Initialize arc generator
      vis.arcGenerator = d3.arc()
        .startAngle(d => d.x0)
        .endAngle(d => d.x1)
        .padAngle(d => Math.min((d.x1 - d.x0) / 2, 0.005))
        .padRadius(vis.radius / 2)
        .innerRadius(d => Math.sqrt(d.y0))
        .outerRadius(d => Math.sqrt(d.y1) - 1);
  
      // Define size of SVG drawing area
      vis.svg = d3.select(vis.config.parentElement).append('svg')
          .attr('width', vis.config.containerWidth)
          .attr('height', vis.config.containerHeight);
  
      // Append group element that will contain our actual chart 
      // and position it according to the config
      vis.chart = vis.svg.append('g')
          .attr('transform', `translate(${vis.width / 2},${vis.height / 2})`);

     // vis.renderLegend(); // for future use
      vis.updateVis();
    }
  
    /**
     * Prepare the data before we render it.
     */
    updateVis() {
      let vis = this;

      // Prepare the sunburst chart layout and data representation.
      const partition = data => d3.partition().size([2 * Math.PI, vis.radius * vis.radius])
        (d3.hierarchy(data)
          .count()
          .sort((a, b) => b.value - a.value));

      vis.root = partition(vis.data);

      // Colour Scale for the categories
      vis.colorScale = d3.scaleOrdinal(d3.quantize(d3.interpolateRainbow, vis.root.children.length + 1));
        
      vis.renderVis();
    }
  
    /**
     * Bind data to visual elements
     */
    renderVis() {
      let vis = this;


      const path = vis.chart.selectAll("path")
        .data(vis.root.descendants().filter(d => d.depth))
        .join("path")
          .attr("fill", d => { while (d.depth > 1) d = d.parent; return vis.colorScale(d.data.name); })
          .attr("d", vis.arcGenerator)
        .append("title")
        .text(d => `${d.ancestors().map(d => d.data.name).reverse().join("/")}\n${d.data.author}`);


      vis.chart
        .selectAll("text")
        .data(vis.root.descendants().filter(d => d.depth && (d.y0 + d.y1) / 2 * (d.x1 - d.x0) > 10))
        .join("text")
          .attr("transform", function(d) {
            const x = (d.x0 + d.x1) / 2 * 180 / Math.PI;
            const y = (d.y0 + d.y1) / 2;
            return `rotate(${x - 90}) translate(${y},0) rotate(${x < 180 ? 0 : 180})`;
          })
        .attr("dy", "0.35em")
        .text(d => d.data.name);
    }


    /**
     * Create legend for the visualization. To be implemented. 
     */
    renderLegend() {
      let vis = this;
      // Stub
    }
  }