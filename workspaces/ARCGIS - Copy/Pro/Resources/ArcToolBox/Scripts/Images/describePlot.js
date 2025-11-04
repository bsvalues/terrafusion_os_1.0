/*
-------------------------------------------------------------------------
    Tool:               Plot a bar plot
    Source Name:        describePlot.js
    Version:            ArcGIS Pro 3.0
    Author:             Esri, Inc.
    Usage:
    Required Arguments: Name of the fields
                        values of the fields
                        Labels for the associated fields
    Description:        Plots a graph based on the input values.
    Updated:            01-11-2022
------------------------------------------------------------------------
*/

function execute() {
    var classColors = ["#78AAFF", "#FF6455", "#7DDC55", "#FFB400", "#C864E1",
        "#BEA064", "#FABEC8", "#AFAFAF", "#005AE6", "#E60000",
        "#37A000", "#960096", "#B4FF00", "#822800", "#3C6E82",
        "#FF00C3", "#00E6AA", "#FFE600", "#002378", "#D78787",
        "#282828", "#73E1E1", "#006400", "#E1C3FF", "#966432",
        "#FFC88C", "#D2FFBE", "#CDE1FF", "#FFFF87", "#F0F0F0"];

    var compareColors = ["#F26745", "#31A2BD", "#7e57c2", "#F49368",
        "#8d6e63", "#faa513", "#f06292", "#3D936A",
        "#355A7C", "#E67E8A", "#2977BC", "#A06496"];

    var fontColor_global = "#848484";
    var colorLine = "#5b9cdea0";
    var c_color = '#ffcc80';
    var colorHighlight = "#18ffffA0";
    var c_outliers = ["#762a83", "#1b7837", "#848484"];
    if(g_popupTheme===2){
        colorLine = "#64b5f6";
        fontColor_global = "#ededed";
        c_outliers = ["#d500f9", "#76ff03", "#bdbdbd"];
        compareColors = ["#F26745", "#31A2BD", "#d48cf8", "#F49368",
        "#B37D4E ", "#faa513", "#f06292", "#3D936A",
        "#8FC33A", "#E67E8A", "#74B7F2", "#A06496"];
    }

    function isNullOrUndefined(val){
        return (val===null || val===undefined);
    }

    const hexToRgb = hex =>
        hex.replace(/^#?([a-f\d])([a-f\d])([a-f\d])$/i
            ,(m, r, g, b) => '#' + r + r + g + g + b + b)
            .substring(1).match(/.{2}/g)
            .map(x => parseInt(x, 16))

    function hex2rgbaStr(hex, a){
        if(hex[0] != "#"){
            return "rgba(0,0,0,@a)".replace(/@a/g, a);
        }
        var rgb = hexToRgb(hex);
        return "rgba(@r,@g,@b,@a)"
            .replace(/@r/g, rgb[0])
            .replace(/@g/g, rgb[1])
            .replace(/@b/g, rgb[2])
            .replace(/@a/g, a);
    }

    var pltChart = null;
    var annotationFocus = null;

    function formatGlobalValue(value) {
        // should be 'e4' but the scientific notation is not supported by wijmo
        return wijmo.Globalize.format(value, 'g4');
    }

    var compareCandidateBean = {
        enabled: false,
        candidateLegendInds: [],
        ind_best: -1,
        ind_active: -1,
        ind_begin_position: -1,
        name_bestForecast: null,
        name_bestFit: null,
        name_bestIntv: null,
        name_activeForecast: null,
        name_activeFit: null,
        name_activeIntv: null,
        names_forecastLine: [],
    };

    function getValuesRange(values, values2=null){
        var min = values[0];
        var max = values[0];
        for(var i = 1; i<values.length; i+=1){
            if(min > values[i]){
                min = values[i];
            }
            if(max < values[i]){
                max = values[i];
            }
        }
        if(!isNullOrUndefined(values2)){
            for(var i = 0; i<values2.length; i+=1){
                if(min > values2[i]){
                    min = values2[i];
                }
                if(max < values2[i]){
                    max = values2[i];
                }
            }
        }
        return [min, max];
    }

    function prepareData(){
        var dataBundle = [];
        var yMin = 0;
        var yMax = 0;
        var yMinLine = values[0];
        var yMaxLine = values[0];
        // original data
        for(var i=0; i<values.length; i+=1){
            dataBundle.push({
                field: fields[i],
                y: values[i]
            });
        }
        var range = getValuesRange(values);
        yMin = Math.min(yMin, range[0]);
        yMax = Math.max(yMax, range[1]);
        yMinLine = Math.min(yMinLine, range[0]);
        yMaxLine = Math.max(yMaxLine, range[1]);
        var resultBundle = {
            dataBundle: dataBundle,
            rawTime_last: fields[values.length-1],
        };


        if(yMin == yMax){
            yMin -= 1;
            yMax += 1;
        }
        if(yMinLine == yMaxLine){
            yMinLine -= 1;
            yMaxLine += 1;
        }
        resultBundle["axY"] = [yMin, yMax];
        resultBundle["axYLine"] = [yMinLine, yMaxLine];
        var ext = (yMaxLine - yMinLine) * 0.1;
        resultBundle["axYLineOpt"] = [yMinLine - ext, yMaxLine + ext];
        return resultBundle;
    }

    function rez(){
        var w = window.innerWidth - 35;
        if(w < 300){
            w = 300;
        }
        var h = 300;
        if(w>800){
            h=350;
        }else if(w>600){
            h=300;
        }else {
            h=250;
        }
        if($(window).height()>200){
            h = Math.min(h, $(window).height()-20);
        }

        var target = $("#shap-explanation-automl");
        if(w>600){
            target.css("width", "95%")
        }
        target.width(w);
        target.height(h);
        if(!isNullOrUndefined(pltChart)){
            pltChart.refresh();
        }
    }

    function getHorizontalFunc(name, value, color){
        if(isNullOrUndefined(color)){
            color="#bdbdbd";
        }
        var yFun = new wijmo.chart.analytics.YFunctionSeries();
        yFun.name = name;
        if(signalTimeSteps[0] instanceof Date){
            yFun.min = signalTimeSteps[0].getTime();
            yFun.max = signalTimeSteps[signalTimeSteps.length-1].getTime();
        }else{
            yFun.min = 0;
            yFun.max = signalTimeSteps.length-1;
        }

        yFun.sampleCount = 2;
        yFun.style = {
            stroke: color,
            strokeWidth: 1,
        };
        yFun.func = function(x){
            return value;
        };
        return yFun;
    }

    function plot(){
        // This js is a modified version of timeseries.js. It takes the fields and their impact
        // score to generate the plotting.
        if(values.length<2){
            return;
        }
        // append chart container and the heads
        var containerStr = "<div id='timeseries_html_container' style='font-family: Verdana; width: 100%; min-width: 300px'>" +
            "<div id='shap-explanation-automl' style='width: 90%; height: 10px; border: none; font-size: 10px; margin: 0px; padding: 5px; background-color: transparent'></div>" +
            "</div>";
        $("body").append(containerStr);
        rez();
        var chart = wijmo.chart;
        var result = prepareData();
        var d0 = fields[0];
        var d1 = fields[fields.length-1];
        var showYRangeToggle = false;
        if((result.axY[1]-result.axY[0])/(result.axYLine[1]-result.axYLine[0]) > 2){
            showYRangeToggle = true;
        }
        var originalTimeSteps = values.length;
        var lineMarkerSize = 1.5;
        var legendPosition = chart.Position.Bottom;
        var hasPredictedData = false;
        var series = [{

            style: {
                stroke: colorLine,
                fill: colorLine,
            },
            symbolStyle: {
                stroke: colorLine,
                fill: colorLine,
                rx: lineMarkerSize,
                ry: lineMarkerSize
            },
        }];
        var toolTipVisibleRegion = {
            xMin: fields[0],
            xMax: fields[fields.length - 1],
            yMin: result.axY[0],
            yMax: result.axY[1],
            xMinCoord: 0,
            xMaxCoord: 0,
            yMinCoord: 0,
            yMaxCoord: 0,
        };
        var yMin = result.axY[0];
        var yMax = result.axY[1];
        if(showYRangeToggle){
            yMin = result.axYLineOpt[0];
            yMax = result.axYLineOpt[1];
            toolTipVisibleRegion.yMin = result.axYLineOpt[0];
            toolTipVisibleRegion.yMax = result.axYLineOpt[1];
        }
        pltChart = new chart.FlexChart('#shap-explanation-automl', {
            chartType: chart.ChartType.Bar,
            itemsSource: result.dataBundle,
            bindingX: "field",
            binding: "y",
            header: "Summary of Variable Importance",
            axisY: {
                title: "Variables",
                axisLine: true,
                majorGrid: false,

                reversed: false,
            },
            axisX: {
                title: "Importance in percentage",
                axisLine: false,
                majorGrid: true,
                minorGrid: false,
                majorUnit  : 20,
                max:  result.axY[1],

            },
            series: series,
            legend: {
                position: legendPosition
            },
            tooltip:{
                threshold: 0,
                content: function(hit){
                    var item = hit.item;
                    var hitName = hit.name;
                    return "<div>" +
                        "<div>@t</div>".replace(/@t/g, "Importance of Variable") +
                        "<div><b>@valueLabel</b>:\t@v %</div>".replace(/@valueLabel/g, item.field).replace(/@v/g, formatGlobalValue(item.y)) +
                        "</div>";

                },
            },


            rendered: function(self){
                // update axis line color
                $.each(self.axisX.hostElement.querySelectorAll("rect"), function (ind, line) {
                    $(line).attr("stroke", fontColor_global).attr('fill', 'none').removeClass('wj-line').removeClass('wj-tick');
                });
                $.each(self.axisY.hostElement.querySelectorAll("rect"), function (ind, line) {
                    $(line).attr("stroke", fontColor_global).attr('fill', 'none').removeClass('wj-line').removeClass('wj-tick');
                });

                // retrieve all bar chart element rectangle and add the event listener for each one
//                if (!hasPredictedData) {
                    self.series.forEach(function (seriesItem) {
                        var es = seriesItem.hostElement.querySelectorAll('rect');
                        for(var i=0; i<es.length; i+=1){
                            var ellipse = es[i];
                            ellipse.addEventListener('mouseover', function (e) {
                                // highlight the mouse hovered point
                                var target = $(e.target);
                                target.attr('fill_old', target.attr('fill'));
                                target.attr('stroke_old', target.attr('stroke'));
                                target.attr('fill', colorHighlight).attr('stroke', colorHighlight);
                                target.attr("rx", 4).attr("ry", 4);
                            });
                            ellipse.addEventListener('mouseout', function (e) {
                                // change back the original colors of the element
                                var target = $(e.target);
                                target.attr('fill', target.attr('fill_old'));
                                target.attr('stroke', target.attr('stroke_old'));
                                target.attr("rx", 1.5).attr("ry", 1.5);
                            });
                        }
                    });

                // scroll to bottom
                $('html, body').scrollTop($(document).height());
                document.body.style.overflow = "auto";
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

if(g_popupTheme===2){
    cssResources.push(basePath_LBRJS + "localBivarRelPlot_dark.css");
}else{
    cssResources.push(basePath_LBRJS + "localBivarRelPlot.css");
}

    function endsWith(str, suffix) {
    return str.indexOf(suffix, str.length - suffix.length) !== -1;
}
var resourcesToLoad = cssResources.concat(jsResources).reverse();
function loadResource() {
    var resourcePath = resourcesToLoad.pop();
    if(resourcePath === undefined){
        initializeWijmo();
        execute();
    }else{
        if(endsWith(resourcePath, ".css")){
            var link = document.createElement("link");
            link.rel="stylesheet";
            link.type = 'text/css';
            link.href = resourcePath;
            link.onload = loadResource;
            document.head.appendChild(link);
        }else if(endsWith(resourcePath, ".js")){
            var script = document.createElement("script");
            script.type = "text/javascript";
            script.src = basePath + resourcePath;
            script.onload = loadResource;
            document.head.appendChild(script);
        }else{
            loadResource();
        }
    }
}
loadResource();
