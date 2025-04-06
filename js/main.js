const parseMonthYear = d3.timeParse('%b.%y');
let selectedState, selectedArc = "";
let selectedBook = null;
let statesToHighlight = []; // this variable stores states in which the selected book was banned
let stateCounts = null; // this variable stores states with their respective number of banned books
let sunburst, dataBooks;

d3.json('data/books_hierarchy_new.json').then((subjectsHierarchyData) => {
  dataBooks = subjectsHierarchyData;
  const dataBooksHierarchy = d3.hierarchy(dataBooks);

  stateCounts = d3.rollups(
    dataBooksHierarchy.leaves(),           
    v => v.length,
    d => d.parent.parent.parent.data.name
  ).map(([state, count]) => ({ state, count }));

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
    const choroplethMap1 = new ChoroplethMap({ 
      parentElement: '#mercator',
      projection: d3.geoMercator()
    }, data);
  })
  .catch(error => console.error(error));


// dealing with the month picker, range from July 2021 to June 2024
const selectMonth = document.getElementById("month");
const selectYear = document.getElementById("year");
const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

// Range july 2021 to june 2024, note 0 based months
const startYear = 2021;
const startMonth = 6;
const endYear = 2024;
const endMonth = 5;

function setYears() {
  for (let year = startYear; year <= endYear; year++) {
    const option = document.createElement("option");
    option.value = year;
    option.textContent = year;
    selectYear.appendChild(option);
  }
}

function setMonths(selectedYear) {
  // Clear options
  selectMonth.innerHTML = "";

  let start = 0;
  let end = 11;

  // cond for start and end months based on years
  if (selectedYear == startYear) start = startMonth;
  if (selectedYear == endYear) end = endMonth;

  for (let i = start; i <= end; i++) {
    const option = document.createElement("option");
    option.value = i;
    option.textContent = months[i];
    selectMonth.appendChild(option);
  }
}

setYears();
selectYear.value = startYear;
setMonths(startYear);
// Update months when year changes
selectYear.addEventListener("change", () => {
  setMonths(parseInt(selectYear.value));
});
