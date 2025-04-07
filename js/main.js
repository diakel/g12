const parseMonthYear = d3.timeParse('%b.%y');
let date = "";
let selectedState = "";
let selectedBook, selectedArc = null;
let statesToHighlight = []; // this variable stores states in which the selected book was banned
let stateCounts = null; // this variable stores states with their respective number of banned books
let sunburst, dataBooks, stateData, choroplethMap;

d3.json('data/books_hierarchy_new.json').then((subjectsHierarchyData) => {
  dataBooks = subjectsHierarchyData;
  const dataBooksHierarchy = d3.hierarchy(dataBooks);

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

function filterData() {
  let filteredData = JSON.parse(JSON.stringify(dataBooks));
  
  if (date !== "" && date !== "Jul.21-Jun.24") {
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
  }

  sunburst.data = filteredData;

  sunburst.updateVis();
  choroplethMap.updateVis();
}

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
        break;
      case 3:
        // go to the outer layer, find the parent, then from the parent find the selected arc
        newData = parent.parent.data.children.find(d => d.name === parent.data.name).children.find(d => d.name === selectedArc.data.name);
    }
    sunburst.data = newData;
  } else {
    sunburst.data = dataBooks;
  }
  sunburst.updateVis();
}

function selectRoot() {
  if (selectedArc.parent) {
    sunburst.data = selectedArc.parent.data;
    selectedArc = selectedArc.parent;
  } else {
    selectedArc = null;
    sunburst.data = dataBooks;
  }
  if (sunburst.data.name === "United States") {
    selectedState = "";
    choroplethMap.updateVis();
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
    //console.log(statesToHighlight);
  }
  choroplethMap.updateVis();
}


const selectedDateHeader = document.getElementById("selectedDate");
const selectDate = document.getElementById("date");
const dateValue = ["Jul.21-Jun.24", "Jul.21", "Aug.21", "Sep.21", "Oct.21", "Nov.21", "Dec.21",
  "Jan.22", "Feb.22", "Mar.22", "Apr.22", "May.22", "Jun.22","Jul.22", "Aug.22", "Sep.22", "Oct.22", "Nov.22", "Dec.22",
  "Jan.23", "Feb.23", "Mar.23", "Apr.23", "May.23", "Jun.23","Jul.23", "Aug.23", "Sep.23", "Oct.23", "Nov.23", "Dec.23",
  "Jan.24", "Feb.24", "Mar.24", "Apr.24", "May.24", "Jun.24"];

selectDate.addEventListener("change", () => {
  //console.log(`DATE: ${dateValue[selectDate.value]}`);
  //date = selectDate.value === 0 ? "" : parseMonthYear(dateValue[selectDate.value]);
  console.log(selectDate.value);
  if (selectDate.value !== 0) {
    date = dateValue[selectDate.value];
  } else {
    date = "";
  }
  
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
