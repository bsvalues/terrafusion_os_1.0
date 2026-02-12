define(
[
  "dojox/charting/themes/PlotKit/base", 
], 
function(pk) {
  var rainbow = pk.base.clone();
  rainbow.chart.fill = rainbow.plotarea.fill = "#e7eef6";

  // Based on colors used by Explorer Online
  rainbow.colors = [ // 15 colors
    "#284B70", // Blue
    "#702828", // Red
    "#5F7143", // Light Green
    "#F6BC0C", // Yellow
    "#382C6C", // Indigo
    "#50224F", // Magenta
    "#1D7554", // Dark Green
    "#4C4C4C", // Gray Shade
    "#0271AE", // Light Blue
    "#706E41", // Brown
    "#446A73", // Cyan
    "#0C3E69", // Medium Blue
    "#757575", // Gray Shade 2
    "#B7B7B7", // Gray Shade 3
    "#A3A3A3" // Gray Shade 4
  ];
  
  rainbow.series.stroke.width = 1;
  rainbow.marker.stroke.width = 1;

  return rainbow;
});
