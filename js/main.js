const parseMonthYear = d3.timeParse('%b.%y');

// I load a subset of the dataset for one district for testing purposes. 
// Full dataset is in data/books_hierarchy.json or data/books_without_empty_subjects.csv

d3.json('data/books_hierarchy_subset.json').then((subjectsHierarchyData) => {
  const sunburst = new Sunburst({parentElement: '#vis-sunburst'}, subjectsHierarchyData);
});