const parseMonthYear = d3.timeParse('%b.%y');

// I load a subset of the dataset for one district for testing purposes. 
// Full dataset is in data/books_hierarchy.json or data/books_without_empty_subjects.csv

d3.json('data/books_hierarchy_subset.json').then((subjectsHierarchyData) => {
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

    // Lambert conformal conic projection
    // See: https://observablehq.com/@bryik/statscans-most-common-map-projection
    // We need to rotate the globe. You can often find specifications for popular projections
    // and world regions somewhere on the internet or you tweak the parameters to get a satisfying result.
  })
  .catch(error => console.error(error));