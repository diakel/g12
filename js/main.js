const parseMonthYear = d3.timeParse('%b.%y');

// Full dataset is in data/books_hierarchy.json or data/books_without_empty_subjects.csv

let sunburst = null;

function filterByDistrict() {
  const districtName = document.getElementById("districtChoice").value.trim();

  if (!districtName) return;

  console.log(sunburst.data.children.filter(d => d.name === districtName));

  const filteredData = {
    name: "Root",
    children: sunburst.data.children.filter(d => d.name === districtName).children // this is not working properly
  };

  if (filteredData.children.length === 0) {
    alert("District not found.");
    return;
  }

  sunburst.data = filteredData;
  sunburst.updateVis();
}

d3.json('data/books_hierarchy.json').then((subjectsHierarchyData) => {
  sunburst = new Sunburst({parentElement: '#vis-sunburst'}, subjectsHierarchyData);
});

Promise.all([
  d3.json('https://raw.githubusercontent.com/PublicaMundi/MappingAPI/master/data/geojson/us-states.json'),
  d3.csv('data/books_without_empty_subjects.csv')
]).then(([usMap, stateData]) => {
  const stateInfo = {};
  stateData.forEach(d => {
    stateInfo[d.state] = +d.value;
  });

  const map = new StatesMap({parentElement: '#map'}, usMap, stateInfo);
});
