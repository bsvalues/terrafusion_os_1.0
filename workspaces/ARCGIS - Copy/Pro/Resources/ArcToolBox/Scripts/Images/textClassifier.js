/*
-------------------------------------------------------------------------
    Tool:               Plot a drill-down bar plot
    Source Name:        textclassifier.js
    Version:            ArcGIS Pro 3.0
    Author:             Esri, Inc.
    Usage:
    Required Arguments: Data is passed in the list of dictionary. The program will
                        group itself to create a drill-down plot.
    Description:        Plots a graph based on the input values.
    Updated:            10-11-2022
------------------------------------------------------------------------
*/

function cround(num, decimal_place){
    const multi = Math.pow(10, decimal_place);
    const val = Math.round(num * multi)/multi;
    return val
}
function execute() {

    function getGroupData(group) {
    // get items for this group, aggregate by sales
    let arr = [];
    //
    group.groups.forEach(g => {
        if (g.level == 0){
        arr.push({
            name: g.name,
            gdp: cround(g.getAggregate(wijmo.Aggregate.Avg, 'base_v'),4) ,
            group: g
        });
        } else{
                arr.push({
            name: g.name,
            gdp: cround(g.getAggregate(wijmo.Aggregate.Sum, 'slabel_v'),4),
            group: g
        });
        }
    });
    //
    // return a new collection view sorted by sales
    return new wijmo.collections.CollectionView(arr, {
        sortDescriptions: [
            new wijmo.collections.SortDescription('slabel_v', false)
        ]
    });
}
    function getData() {
    return new wijmo.collections.CollectionView(data, {
        groupDescriptions: ['label', 'slabel_n']
    });
}

function showGroup(group) {
    // update titles
    updateChartHeader(group);
    let level = 'level' in group ? group.level + 1 : 0;
    if (level == 0){
        //pltChart.axisX.title = wijmo.toHeaderCase(view.groupDescriptions[level].propertyName);
		pltChart.axisX.title = wijmo.toHeaderCase("Class Label");
        pltChart.axisY.title = 'Probability score'
        //
        // update the series color (use a different one for each level)
        let palette = pltChart.palette || chart.Palettes.standard;
        pltChart.series[0].style = {
            fill: palette[level],
            stroke: palette[level]
        };
        //
        // update data
        pltChart.itemsSource = getGroupData(group);
        pltChart.selection = null;
    }else{
        pltChart.axisX.title = wijmo.toHeaderCase("Token");
		//pltChart.axisX.title = wijmo.toHeaderCase(view.groupDescriptions[level].propertyName);
        pltChart.axisY.title = 'Impact score'
        // update the series color (use a different one for each level)
        let palette = pltChart.palette || chart.Palettes.standard;
        pltChart.series[0].style = {
            fill: palette[level],
            stroke: palette[level]
        };

        //
        // update data
        pltChart.itemsSource = getGroupData(group);
        pltChart.selection = null;
    }

}
//
// update the chart header element

    function updateChartHeader(group) {

            let item = group.items[0], path = '', headers = [];
            //
            for (let i = 0; i <= group.level; i++) {
                let prop = view.groupDescriptions[i].propertyName, hdr = wijmo.format('<a href="#{path}">{prop}</a>: {value}', {
                    path: path,
                    prop: wijmo.toHeaderCase(prop),
                    value: item[prop]
                });
                //
                headers.push(hdr);
                path += '/' + item[prop];
                }
        //
            var header = document.getElementById('header');
            val = headers.length > 0
                ? 'Explanation by model for class ' + headers.join(', ')
                : 'Prediction probability by model';
            header.innerHTML = val
               header.addEventListener('click', function (e) {
                        if (e.target.nodeName === 'A') {
                            e.preventDefault();
                            //
                            // get the link path
                            let path = e.target.href;
                            path = path.substr(path.lastIndexOf('#') + 1);
                            let paths = path.split('/');
                            //
                            // find the group that matches the path
                            let src = view;
                            for (let i = 1; i < paths.length; i++) {
                                for (let j = 0; j < src.groups.length; j++) {
                                    let group = src.groups[j];
                                    if (group.name == paths[i]) {
                                        src = group;
                                        break;
                                    }
                                }
                            }
                            // show the selected group
                            showGroup(src);
                        }
                    });
            return val
     }



    var fontColor_global = "#848484";
    var colorLine = "#5b9cdea0";
    var c_color = '#ffcc80';
    var colorHighlight = "#18ffffA0";
    var c_outliers = ["#762a83", "#1b7837", "#848484"];
    if (g_popupTheme === 2) {
        colorLine = "#64b5f6";
        fontColor_global = "#ededed";
        c_outliers = ["#d500f9", "#76ff03", "#bdbdbd"];
        compareColors = ["#F26745", "#31A2BD", "#d48cf8", "#F49368",
            "#B37D4E ", "#faa513", "#f06292", "#3D936A",
            "#8FC33A", "#E67E8A", "#74B7F2", "#A06496"];
    }

    function isNullOrUndefined(val) {
        return (val === null || val === undefined);
    }


    var pltChart = null;
    var annotationFocus = null;


    function rez() {
        var w = window.innerWidth - 35;
        if (w < 300) {
            w = 300;
        }
        var h = 300;
        if (w > 800) {
            h = 350;
        } else if (w > 600) {
            h = 300;
        } else {
            h = 250;
        }
        if ($(window).height() > 200) {
            h = Math.min(h, $(window).height() - 20);
        }

        var target = $("#shap-explanation-automl");
        if (w > 600) {
            target.css("width", "95%")
        }
        target.width(w);
        target.height(h);
        if (!isNullOrUndefined(pltChart)) {
            pltChart.refresh();
        }
    }



    function plot(){
        var containerStr = "<div id='timeseries_html_container' style='font-family: Verdana; width: 100%; min-width: 300px'>" +
            '<h4 id="header">Prediction probability by model</h4>'+
            "<div id='shap-explanation-automl' style='width: 90%; height: 10px; border: none; font-size: 10px; margin: 0px; padding: 5px; background-color: transparent'></div>" +
            "</div>";
        $("body").append(containerStr);
        rez();
        var header = document.querySelector("#shap-explanation-automl > svg > g.wj-header");
        var chart = wijmo.chart;
        view = getData();
        pltChart = new chart.FlexChart('#shap-explanation-automl', {
            legend: {
                position: chart.Position.None
            },
            bindingX: 'name',
            series: [{
                    binding: 'gdp',
                    name: 'GDP'
                }],
            axisX: {
                title: 'Class Label',
    //            format: 'd'
            },
            axisY: {
                title: 'Probability score'
            },
//            header: "Summary of Variable Importance",
            tooltip: {
                threshold: 0,
                content: function (hit) {
                    var item = hit.item['name'];
                    var hitName = hit.item['gdp'];
                    var path = hit.item.group._path;

                    // A messy method to distinguish a drill-down
                    if ((path.length - path.replaceAll('/', '').length)>1){
                        return "<div>" +
                        "<div>@t</div>".replace(/@t/g, "Impact on prediction") +
                        "<div><b>@valueLabel</b>:\t@v %</div>".replace(/@valueLabel/g, item).replace(/@v/g, (hitName*100).toFixed(2)) +
                        "</div>";
                    }else{
                        return "<div>" +
                        "<div>@t</div>".replace(/@t/g, "Prediction probability") +
                        "<div><b>@valueLabel</b>:\t@v %</div>".replace(/@valueLabel/g, item).replace(/@v/g, (hitName*100).toFixed(2)) +
                        "</div>";
                    }

                },
            },
            selectionMode: chart.SelectionMode.Point,
            selectionChanged: (s) => {
                if (s.selection) {
                    let point = s.selection.collectionView.currentItem;
                    if (point && point.group && !point.group.isBottomLevel) {
                        showGroup(point.group);
                    }
                }
                }   ,
            itemsSource: getGroupData(view),
            palette: ['rgba(45,200,199,1)', 'rgba(75, 133, 5, 0.73)', 'rgba(137,194,53,1)', 'rgba(227,119,164,1)',
                'rgba(166,137,49,1)', 'rgba(166,114,166,1)', 'rgba(208,192,65,1)', 'rgba(227,88,85,1)', 'rgba(104,112,106,1)'],

            itemFormatter: (engine, hitTestInfo, defaultRenderer) => {
                var ht = hitTestInfo;
                if (ht.y < 0) {
                    engine.stroke = 'red';
                    engine.fill = 'rgba(247, 43, 43, 0.73)';
                }
//                else {
//                    engine.stroke = 'green';
//                    engine.fill = 'rgba(45, 99, 18, 1)';
//                }
                defaultRenderer();
            }
             });
}


    plot();
    window.addEventListener('resize', rez);
}

var basePath_LBRJS = rp + "ArcToolBox/Scripts/Images/";
var basePath = rp + "Charts/";
var jsResources = [
    "scripts/jquery-3.1.0.slim.min.js",
    "scripts/wijmo.min.js",
    "scripts/wijmo.chart.min.js",
    "scripts/wijmo.chart.analytics.min.js",
    "scripts/wijmo.chart.annotation.min.js",
    "scripts/culture/wijmo.culture.@@lang.min.js".replace(/@@lang/g, 'en'),
    "scripts/main.js"];
var cssResources = [
    basePath + "styles/wijmo-chart.min.css"];

if (g_popupTheme === 2) {
    cssResources.push(basePath_LBRJS + "localBivarRelPlot_dark.css");
} else {
    cssResources.push(basePath_LBRJS + "localBivarRelPlot.css");
}

function endsWith(str, suffix) {
    return str.indexOf(suffix, str.length - suffix.length) !== -1;
}
var resourcesToLoad = cssResources.concat(jsResources).reverse();
function loadResource() {

    var resourcePath = resourcesToLoad.pop();
    if (resourcePath === undefined) {
        initializeWijmo();
        execute();
    } else {
        if (endsWith(resourcePath, ".css")) {
            var link = document.createElement("link");
            link.rel = "stylesheet";
            link.type = 'text/css';
            link.href = resourcePath;
            link.onload = loadResource;
            document.head.appendChild(link);
        } else if (endsWith(resourcePath, ".js")) {
            var script = document.createElement("script");
            script.type = "text/javascript";
            script.src = basePath + resourcePath;
            script.async = false;
            script.onload = loadResource;
            document.head.appendChild(script);
        } else {
            loadResource();
        }
    }
}
loadResource();
