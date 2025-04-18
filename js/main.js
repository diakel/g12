const parseMonthYear = d3.timeParse('%b.%y');
let date = "";
let selectedState = "";
let selectedBook, selectedArc = null;
let statesToHighlight = []; // this variable stores states in which the selected book was banned
let stateCounts = null; // this variable stores states with their respective number of banned books
let sunburst, dataBooks, stateData, choroplethMap;
let filteredData;
let breadcrumbs = []; // to keep track of where we are 
let sortBy = "count";

d3.json('data/books_hierarchy_new.json').then((subjectsHierarchyData) => {
  dataBooks = subjectsHierarchyData;
  const dataBooksHierarchy = d3.hierarchy(dataBooks);

  // creates an object with state, count of banned books
  stateCounts = d3.rollups(
    dataBooksHierarchy.leaves(),           
    v => v.length,
    d => d.parent.parent.parent.data.name
  ).map(([state, count]) => ({ state, count }));

  // load map data
  d3.json('data/us-states.json')
  .then(data => {
    stateData = data;

    // Mercator projection
    choroplethMap = new ChoroplethMap({ 
      parentElement: '#mercator',
      projection: d3.geoMercator()
    }, stateData);

    sunburst = new Sunburst({parentElement: '#vis-sunburst'}, dataBooks); 
    filterData();
  })
  .catch(error => console.error(error));
}); 

/**
 * Handles change in the data selector
 */
function filterData() {
  pathTooltipChange();
  filteredData = JSON.parse(JSON.stringify(dataBooks));
  
  if (date !== "" && date !== "Jul.21-Jun.24") {
    selectedState = "";
    selectedBook = null;
    statesToHighlight = [];
    breadcrumbs = [];
    filteredData.children.forEach(district => {
      district.children.forEach(genre => {
        // Filter the books based on the date and update the genre's children
        genre.children = genre.children.filter(book => book.children[0].date === date);
      });
    
      // Remove any genres that don't have any books left
      district.children = district.children.filter(genre => genre.children.length > 0);
    });
    
    // Remove any districts that don't have any genres left
    filteredData.children = filteredData.children.filter(district => district.children.length > 0);

    sunburst.data = filteredData;
  } else {
    sunburst.data = dataBooks;
  }

  sunburst.updateVis();
  const filteredDataHierarchy = d3.hierarchy(filteredData);
  stateCounts = d3.rollups(
    filteredDataHierarchy.leaves(),           
    v => v.length,
    d => d.parent.parent.parent.data.name
  ).map(([state, count]) => ({ state, count }));

  choroplethMap.updateVis();
}

/**
 * Handles state selection by updating the sunburst
 */
function filterByState() {
  const stateData = filteredData.children.find(s => s.name === selectedState);
  breadcrumbs = [];
  if (stateData) {
    sunburst.data = stateData;
    breadcrumbs.push(d3.hierarchy(stateData));
  } else {
    sunburst.data = filteredData;
  }
  selectedArc = sunburst.root;
  // breadcrumbs = [];
  // breadcrumbs.push(selectedArc);
  //selectedArc = sunburst.root.children.find(state => state.data.name === selectedState);
  sunburst.updateVis();
}

/**
 * Handles arc selection: filters by the selected arc and updates the data of the sunburst
 * @param {int} depth 
 * @param {Object} parent 
 */
function selectArc(depth, parent) {
  if (selectedArc) {
    let newData = null;
    if (parent.data.name === "United States") { 
      selectedState = selectedArc.data.name;
      choroplethMap.updateVis();
    }
    switch (depth) {
      case 1:
        newData = sunburst.data.children.find(d => d.name === selectedArc.data.name);
        break;
      case 2:
        newData = parent.data.children.find(d => d.name === selectedArc.data.name);
        breadcrumbs.push(parent);
        break;
      case 3:
        breadcrumbs.push(parent.parent);
        breadcrumbs.push(parent);
        // go to the outer layer, find the parent, then from the parent find the selected arc
        newData = parent.parent.data.children.find(d => d.name === parent.data.name).children.find(d => d.name === selectedArc.data.name);
    }
    sunburst.data = newData;
    breadcrumbs.push(selectedArc);
  } else {
    sunburst.data = dataBooks;
    breadcrumbs = [];
  }
  sunburst.updateVis();
}

/**
 * Handles clicking on the root of the sunburst (going a level up basically);
 */
function selectRoot() {
  if (selectedArc.parent) {
    sunburst.data = selectedArc.parent.data;
    breadcrumbs = breadcrumbs.filter(d => d.data.name !== selectedArc.data.name);
    selectedArc = selectedArc.parent;
  } else {
    selectedArc = null;
    breadcrumbs = [];
    sunburst.data = filteredData;
  }
  if (sunburst.data.name === "United States") {
    selectedState = "";
  }
  selectedBook = null;
  bookSelect();
  sunburst.updateVis();
  // choroplethMap.updateVis();
  pathTooltipChange();
}

/**
 * Fills statesToHighlight array with the states in which the selected book was banned
 */
function bookSelect() {
  statesToHighlight = [];
  if (selectedBook) {
    for (const state of dataBooks.children) {
      const stateHierarchy = d3.hierarchy(state);
      if (stateHierarchy.descendants().find(d => d.data.name === selectedBook.name && d.data.author === selectedBook.author
        && (d.data.date === date || date === "" || date === "Jul.21-Jun.24")
      )) {
        statesToHighlight.push(state.name);
      }
    }
  }
  choroplethMap.updateVis();
}

/**
 * Changes the tooltip above the sunburst that shows the current "path" of the user (using global var).
 */
function pathTooltipChange() {
  if (breadcrumbs.length == 0) {
    d3.select("#tooltip-structure")
      .style("display", "none");
    return;
  }
  const pathHTML = breadcrumbs.map(b => `
    <span class="breadcrumb">${b.data.name}</span>
    `).join(`<icon class="breadcrumb-separator"></icon>`); 

  d3.select("#tooltip-structure")
      .html(`<div class="breadcrumb-container">${pathHTML}</div>`)
      .style("border", "1px solid black")
      .style("padding-top", "7px")
      .style("padding-left", "5px")
      .style("padding-right", "5px")
      .style("display", "block");
}

// Sort selector
d3.select(".sort").on("change", (e) => {
  sortBy = e.target.value;
  sunburst.updateVis();
});

// Data selector
const selectedDateHeader = document.getElementById("selectedDate");
const selectDate = document.getElementById("date");
selectDate.value = 0;
const dateValue = ["Jul.21-Jun.24", "Jul.21", "Aug.21", "Sep.21", "Oct.21", "Nov.21", "Dec.21",
  "Jan.22", "Feb.22", "Mar.22", "Apr.22", "May.22", "Jun.22","Jul.22", "Aug.22", "Sep.22", "Oct.22", "Nov.22", "Dec.22",
  "Jan.23", "Feb.23", "Mar.23", "Apr.23", "May.23", "Jun.23","Jul.23", "Aug.23", "Sep.23", "Oct.23", "Nov.23", "Dec.23",
  "Jan.24", "Feb.24", "Mar.24", "Apr.24", "May.24", "Jun.24"];

selectDate.addEventListener("change", () => {
  // console.log(selectDate.value);
  if (selectDate.value !== 0) {
    date = dateValue[selectDate.value];
  } else {
    date = "";
  }
  selectedState = "";
  selectedBook, selectedArc = null;
  statesToHighlight = [];
  breadcrumbs = [];
  d3.select("#tooltip-sun").style("display", "none");
  filterData();
});

function updateDateHeader() {
  const selectedDate = dateValue[selectDate.value];
  selectedDateHeader.textContent = `Selected Date: ${selectedDate}`;
};

// initialize value
updateDateHeader();

// update header with new date
selectDate.addEventListener("input", updateDateHeader);
