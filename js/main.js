const parseMonthYear = d3.timeParse('%b.%y');

// Full dataset is in data/books_hierarchy.json or data/books_without_empty_subjects.csv

d3.json('data/books_hierarchy_new.json').then((subjectsHierarchyData) => {
  const sunburst = new Sunburst({parentElement: '#vis-sunburst'}, subjectsHierarchyData);
});  



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
