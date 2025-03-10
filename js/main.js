const parseMonthYear = d3.timeParse('%b.%y');

// I load a subset of the dataset for one district for testing purposes. 
// Full dataset is in data/books_hierarchy.json or data/books_without_empty_subjects.csv

let sunburst = null;

function filterByDistrict() {
  const districtName = document.getElementById("districtChoice").value.trim();

  if (!districtName) return; // Don't filter if empty

  console.log(sunburst.data.children.filter(d => d.name === districtName));

  // Filter the dataset for the selected district
  const filteredData = {
    name: "Root",
    children: sunburst.data.children.filter(d => d.name === districtName).children // Keep only the matching district
  };

  // If no matching district is found, show a message
  if (filteredData.children.length === 0) {
    alert("District not found.");
    return;
  }

  // Update the visualization with filtered data
  sunburst.data = filteredData;
  sunburst.updateVis();
}

d3.json('data/books_hierarchy.json').then((subjectsHierarchyData) => {
  //const districtChoice = document.getElementById("districtChoice").textContent;
  //console.log(districtChoice);
  sunburst = new Sunburst({parentElement: '#vis-sunburst'}, subjectsHierarchyData);
});