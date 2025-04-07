class Sunburst {

    /**
     * Class constructor for the sunburst chart with initial configuration
     * @param {Object}
     * @param {Array}
     */
    constructor(_config, _data) {
      this.config = {
        parentElement: _config.parentElement,
        containerWidth: 850,
        containerHeight: 850,
        margin: {top: 5, right: 5, bottom: 10, left: 20}
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

      // The inner circle of the sunburst
      vis.rootCircle = vis.chart
          .append("circle")
          .attr("class", "root")
          .style("fill", "none")
          .attr("pointer-events", "all")
          .style("cursor", "pointer");

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

      // Colour Scale for the arcs
      const topLevelNames = vis.root.children.map(d => d.data.name);
      vis.colorScale = d3.scaleOrdinal()
        .domain(topLevelNames)
        .range(d3.quantize(d3.interpolateRainbow, topLevelNames.length + 1));

      // Inner circle for the sunburst
      vis.rootCircle
        .on("click", () => { if (selectedArc) selectRoot(); });

      d3.select("#tooltip-sun").style("display", "none");

      vis.renderVis();
    }
  
    /**
     * Bind data to visual elements
     */
    renderVis() {
      let vis = this;

      // Filter data for the arcs
      const arcs = vis.chart.selectAll(".arc")
        .data(vis.root.descendants().filter(d => d.depth < 4 && d.depth > 0), d => d.data.name);
  
      // Exit
      arcs.exit().transition().duration(900).attr("opacity", 0).remove();
  
      // Enter
      const arcsEnter = arcs.enter()
        .append("path")
        .attr("class", "arc")
        .attr("opacity", 0)
        .attr("fill", d => {
          if (selectedBook && d.data.author) {
            if (selectedBook.name === d.data.name && selectedBook.author === d.data.author) return "white";
          }
          while (d.depth > 1) d = d.parent;
          return vis.colorScale(d.data.name);
        })
        .attr("d", vis.arcGenerator)
        .style("cursor", "pointer")
        .on("click", clickedArc)
        .on("mouseover", hoveredArc)
        .on("mouseout", () => { 
          if (selectedBook) return;
          d3.select("#tooltip-sun").style("display", "none");
        });
  
      // enter + update
      arcsEnter.merge(arcs)
        .transition().duration(900)
        .attr("opacity", 1)
        .attr("d", vis.arcGenerator)
        .attr("fill", d => {
          if (selectedBook && d.data.author) {
            if (selectedBook.name === d.data.name && selectedBook.author === d.data.author) return "white";
          }
          while (d.depth > 1) d = d.parent;
          return vis.colorScale(d.data.name);
        });
  
      // title update
      arcsEnter.append("title")
        .merge(arcs.select("title"))
        .text(d => d.data.name);
      
      vis.rootCircle.attr("r", Math.sqrt(vis.root.children[0].y0));

      // Arc and Book labels
      const labels = vis.chart
        .attr("text-anchor", "middle")
        .selectAll("text")
        .data(vis.root.descendants().filter(d => d.depth && d.children && (d.y0 + d.y1) / 2 * (d.x1 - d.x0) > 1400), d => d.data.name)
        .join("text")
          .attr("transform", function(d) {
            const x = (d.x0 + d.x1) / 2 * 180 / Math.PI;
            const y = (Math.sqrt(d.y0) + Math.sqrt(d.y1)) / 2;
            return `rotate(${x - 90}) translate(${y},0) rotate(${x < 180 ? 0 : 180})`;
          })
          .attr("dy", "0.35em")
          .text(d => {
            const maxChars = 9;
            return d.data.name.length > maxChars ? d.data.name.substring(0, maxChars - 3) + "…" : d.data.name;
          })
          .style("font-size", d => {
            return "9px";
          })
          .style("font-weight", "700")
          .style("fill", "white")
          .style("cursor", "pointer")
          .on("click", clickedArc)
          .on("mouseover", hoveredArc)
          .on("mouseout", () => { 
            if (selectedBook) return;
            d3.select("#tooltip-sun").style("display", "none");
          })
          .raise();
      
      const bookLabels = vis.chart
        .attr("text-anchor", "middle")
        .selectAll("textBook")
        .data(vis.root.descendants().filter(d => d.depth && d.depth < 4 && !d.children && (Math.sqrt(d.y1) - Math.sqrt(d.y0)) * (d.x1 - d.x0) > 1.5))
        .join("text")
          .attr("transform", function(d) {
            const x = (d.x0 + d.x1) / 2 * 180 / Math.PI;
            const y = (Math.sqrt(d.y0) + Math.sqrt(d.y1)) / 2;
            return `rotate(${x - 90}) translate(${y},0) rotate(${x < 180 ? 0 : 180})`;
          })
          .attr("dy", "0.35em")
          .text(d => {
            const maxChars = Math.floor((Math.sqrt(d.y1) - Math.sqrt(d.y0)) / 4);
            return d.data.name.length > maxChars ? d.data.name.substring(0, maxChars - 3) + "…" : d.data.name;
          })
          .style("font-size", d => {
            const arcWidth = (d.x1 - d.x0) * vis.radius;
            const maxChars = Math.floor(arcWidth / 6);
            return "9px";
          })
          .style("font-weight", "500")
          .style("fill", d => selectedBook ? (selectedBook.name === d.data.name && selectedBook.author === d.data.author ? "black" : "white") : "white")
          .style("cursor", "pointer")
          .on("click", clickedArc)
          .on("mouseover", hoveredArc)
          .on("mouseout", () => { 
            if (selectedBook) return;
            d3.select("#tooltip-sun").style("display", "none");
          })
          .raise();
      
      function hoveredArc(event, d) {
        if (selectedBook) return;
        d3.select('#tooltip-sun')
          .html(`
            <h2 style="margin: 0; font-size: 18px;">${d.data.name}</h2>
            <div style="font-size: 16px; color: #555; margin-top: 0.2em;">
              ${d.data.author ? d.data.author : ""}
              <div style="font-size: 14px; color: #666; margin-top: 0.5em;">
              ${d.data.description ? d.data.description : ""}
              </div>
            </div>
          `)
          .style("display", "block")
          .style("max-width", () => { return Math.sqrt(vis.root.children[0].y0) + 60 + "px"; })
          .style("max-height", () => { return Math.sqrt(vis.root.children[0].y0) + 80 + "px"; });
      }

      function clickedArc(event, d) {
        if (d.children) {
          // Clicked not on the book (books don't have children):
          selectedArc = d;
          selectArc(selectedArc.depth, selectedArc.parent);
        } else {
          const isActive = selectedBook === d.data;
          if (isActive) selectedBook = null;
          else { 
            selectedBook = d.data; 
            // Show book info in the tooltip
            d3.select('#tooltip-sun')
            .html(`
              <h2 style="margin: 0; font-size: 18px;">${d.data.name}</h2>
              <div style="font-size: 16px; color: #555; margin-top: 0.2em;">
                ${d.data.author ? d.data.author : ""}
                <div style="font-size: 14px; color: #666; margin-top: 0.5em;">
                ${d.data.description ? d.data.description : ""}
                </div>
              </div>
            `)
            .style("display", "block")
            .style("max-width", () => { return Math.sqrt(vis.root.children[0].y0) + 60 + "px"; })
            .style("max-height", () => { return Math.sqrt(vis.root.children[0].y0) + 80 + "px"; });
          }
          vis.renderVis();
          bookSelect();
        }
      }
    }
  }