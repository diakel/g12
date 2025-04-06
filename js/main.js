const parseMonthYear = d3.timeParse('%b.%y');
let selectedState, selectedArc = "";
let selectedBook = null;
let statesToHighlight = [];
let sunburst, dataBooks;

d3.json('data/books_hierarchy_new.json').then((subjectsHierarchyData) => {
  dataBooks = subjectsHierarchyData;
  sunburst = new Sunburst({parentElement: '#vis-sunburst'}, dataBooks);
}); 

function filterByState() {
  if (selectedState !== "") {
    sunburst.data = dataBooks.children.find(s => s.name === selectedState);
  } else {
    sunburst.data = dataBooks;
  }
  sunburst.updateVis();
}

/**
 * Handles arc selection: filters by the selected arc and updates the data of the sunburst
 * @param {int} depth 
 * @param {Object} parent 
 */
function selectArc(depth, parent) {
  if (selectedArc !== "") {
    let newData = null;
    switch (depth) {
      case 1:
        newData = sunburst.data.children.find(d => d.name === selectedArc);
        break;
      case 2:
        newData = parent.data.children.find(d => d.name === selectedArc);
        break;
      case 3:
        // go to the outer layer, find the parent, then from the parent find the selected arc
        newData = parent.parent.data.children.find(d => d.name === parent.data.name).children.find(d => d.name === selectedArc);
    }
    sunburst.data = newData;
  } else {
    sunburst.data = dataBooks;
  }
  sunburst.updateVis();
}

/**
 * Fills statesToHighlight array with the states in which the selected book was banned
 */
function bookSelect() {
  statesToHighlight = [];
  if (selectedBook) {
    for (const state of dataBooks.children) {
      const stateHierarchy = d3.hierarchy(state);
      if (stateHierarchy.descendants().find(d => d.data.name === selectedBook.name && d.data.author === selectedBook.author)) {
        statesToHighlight.push(state.name);
      }
    }
    console.log(statesToHighlight);
  }
}


/**
 * Load geo data
 */

d3.json('data/us-states.json')
  .then(data => {
    // Mercator projection
    const geoMap1 = new GeoMap({ 
      parentElement: '#mercator',
      projection: d3.geoMercator()
    }, data);

    // Lambert conformal conic projection
    // See: https://observablehq.com/@bryik/statscans-most-common-map-projection
    // We need to rotate the globe. You can often find specifications for popular projections
    // and world regions somewhere on the internet or you tweak the parameters to get a satisfying result.
    const geoMap2 = new GeoMap({ 
      parentElement: '#lambert',
      projection: d3.geoConicConformal()
          .parallels([49, 77])
          .rotate([91.86667, 0])
    }, data);
  })
  .catch(error => console.error(error));
