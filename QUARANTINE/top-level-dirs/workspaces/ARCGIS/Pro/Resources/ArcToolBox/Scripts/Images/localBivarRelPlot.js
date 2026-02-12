function execute(){
    var fontColor_global = "#848484";
    var colorGrey = "#607d8b";
    var colorHighlight = "#18ffff";
    var colorOrange = "#ff9800";
    var lineColorMap = {
        0: '#848484',
        1: '#E78AC3',
        2: '#4EC2A5',
        3: '#8DA0CB',
        4: '#FC8D62',
        5: '#FFE576',
    };

    if(g_popupTheme===2) {
        fontColor_global = "#ededed";
        colorGrey = "#90a4ae";
    }

    var pltChart = null;
    var lastResizeTime = 0;
    var axisDecimalPlace_x = 0;
    var axisDecimalPlace_y = 0;
    /**
     * Test is a value is null or undefined
     */
    function isNullOrUndefined(val){
        return (val===null || val===undefined);
    }

    function generatePloyLine(cofficients, xRange, extendRatio){
        var values = [];
        if(isNullOrUndefined(cofficients[0])){
            return values;
        }
        if(isNullOrUndefined(extendRatio)){
            extendRatio = 0;
        }
        var range = extendRange(xRange, extendRatio);
        var interval = (range[1] - range[0]) / 100;
        for(var x=range[0]; x<=range[1]; x+=interval){
            var y = cofficients[0] + cofficients[1]*x + cofficients[2]*x*x;
            values.push({
                x: x,
                y: y
            })
        }
        return values;
    }

    function prepareData(data, globalRange){
        var xMin = globalRange[0][0];
        var xMax = globalRange[0][1];
        var yMin = globalRange[1][0];
        var yMax = globalRange[1][1];
        var xRange = xMax - xMin;
        var yRange = yMax - yMin;
        var dataBundle = [];
        var range = [[null, null], [null, null]];

        for(var i=0; i<data.length; i+=1){
            var x0 = data[i][0];
            var y0 = data[i][1];
            var x = (x0 - xMin) / xRange;
            var y = (y0 - yMin) / yRange;
            dataBundle.push({
                id: ids[i],
                x: x,
                y: y,
                x_o: x0,
                y_o: y0,
            });
            if(x < range[0][0] || range[0][0] === null){
                range[0][0] = x;
            }
            if(x > range[0][1] || range[0][1] === null){
                range[0][1] = x;
            }
            if(y < range[1][0] || range[1][0] === null){
                range[1][0] = y;
            }
            if(y > range[1][1] || range[1][1] === null){
                range[1][1] = y;
            }
        }
        var center = 0;
        if(range[0][0] === range[0][1]){
            center = range[0][0];
            range[0][0] = center - 0.5;
            range[0][1] = center + 0.5;
        }
        if(range[1][0] === range[1][1]){
            center = range[1][0];
            range[1][0] = center - 0.5;
            range[1][1] = center + 0.5;
        }

        return {
            dataBundle: dataBundle.reverse(),
            range: range
        };
    }

    function rez(){
        var w = window.innerWidth - 35;
        if(w < 300){
            w = 300;
        }

        var h = parseInt(w *0.8);
        var target = $("#bivariate_html_chart");
        if(w>600){
            target.css("width", "95%")
        }
        target.width(w);
        target.height(h);
        if(!isNullOrUndefined(pltChart)){
            pltChart.refresh();
        }
    }

    /**
     * extend the value range by a certain ratio, for the purpose of graph drawing
     */
    function extendRange(range, ratio){
        if(range[0]>=range[1]){
            console.log("error, the first element of the range must be less than the second one");
            return null;
        }
        var delta = (range[1] - range[0])*ratio;
        return[range[0]-delta, range[1]+delta];
    }

    function formatStdValue(value) {
        return wijmo.Globalize.format(value, 'n4');
    }

    function formatGlobalValue(value) {
        if(value==Number.NEGATIVE_INFINITY){
            return value;
        }
        // should be 'e4' but the scientific notation is not supported by wijmo
        return wijmo.Globalize.format(value, 'g4');
    }

    function getDefaultNumberFormat(axis, axisName) {
        if (!Math.log10)
            Math.log10 = function (x) { return Math.log(x) / Math.LN10; };

        var dInterval = axis._calcMajorUnit();
        var nDig;
        if (dInterval < 1.)
            nDig = Math.ceil(-Math.log10(dInterval));
        else {
            nDig = Math.ceil(2 - Math.log10(dInterval));
            if (nDig === 0) // show 1 decimal digit for range [100;1000]?
                nDig = 1;
            else if (nDig < 0)
                nDig = 0;
        }
        var timeCurrent = new Date().getTime() / 1000;
        if(timeCurrent - lastResizeTime < 0.3){
            if(axisName === 'x'){
                nDig = Math.max(nDig, axisDecimalPlace_x);
                axisDecimalPlace_x = nDig;
            }else{
                nDig = Math.max(nDig, axisDecimalPlace_y);
                axisDecimalPlace_y = nDig;
            }
        }
        lastResizeTime = timeCurrent;
        return "g" + nDig;
    }

    function plot(){
        if(XY.length<2){
            return;
        }
        // append chart container and the heads
        var containerStr = "<div id='bivariate_html_container' style='font-family: Verdana; width: 100%; min-width: 300px'>" +
            "<div id='bivariate_html_head' style='color: @@fc; font-size: 12px; padding-left: 30px'></div>".replace(/@@fc/g, fontColor_global) +
            "<div id='bivariate_html_chart' style='width: 90%; height: 10px; border: none; font-size: 10px; margin: 0px; padding: 5px; background-color: transparent'></div>" +
            "</div>";
        $("body").append(containerStr);
        rez();
        var headEle = $("#bivariate_html_head");
        headEle.append("<div style='color: @@c; font-weight: bold'>@@t</div>"
            .replace(/@@c/, lineColorMap[rel])
            .replace(/@@t/, labels[1]));
        if(!isNullOrUndefined(r2)){
            headEle.append("<div>@@t</div>".replace(/@@t/, labels[2] + ": " + formatStdValue(r2)));
            headEle.append("<div>@@t</div>".replace(/@@t/, labels[3] + ": " + formatGlobalValue(aicc)));
        }

        var chart = wijmo.chart;
        var result = prepareData(XY, gr);
        var xRange = extendRange(result.range[0], 0.05);
        var yRange = extendRange(result.range[1], 0.05);
        var fittedLine = generatePloyLine(coef, result.range[0], extendRatio=0.1);

        pltChart = new chart.FlexChart('#bivariate_html_chart', {
            chartType: 'Scatter',
            axisX: {
                title: axs[0],
                min: xRange[0],
                max: xRange[1],
            },
            axisY: {
                title: axs[1],
                axisLine: true,
                majorGrid: false,
                min: yRange[0],
                max: yRange[1],
            },
            series: [
                {
                    name: "Fitted Line",
                    itemsSource: fittedLine,
                    chartType: 'Line',
                    bindingX: 'x',
                    binding: 'y',
                    style:{
                        strokeWidth: 2,
                        stroke: lineColorMap[rel]
                    },
                },
                {
                    name: "Values",
                    itemsSource: result.dataBundle,
                    bindingX: 'x',
                    binding: 'y',
                    style: {
                        stroke: colorGrey,
                        fill: 'transparent'
                    },
                    symbolSize: 6
                }
            ],
            legend: {
                position: 'None'
            },
            tooltip:{
                threshold: 1,
                content: function(hit){
                    var item = hit.item;
                    if(hit.name === "Values"){
                        return "<div>" +
                        "<b>ID: @id</b>".replace(/@id/g, item.id) +
                        "<div>@x_label: @x_value (@x_o)</div>"
                            .replace(/@x_label/g, labels[4])
                            .replace(/@x_value/g, formatStdValue(item.x))
                            .replace(/@x_o/g, formatGlobalValue(item.x_o)) +
                        "<div>@y_label: @y_value (@y_o)</div>"
                            .replace(/@y_label/g, labels[5])
                            .replace(/@y_value/g, formatStdValue(item.y))
                            .replace(/@y_o/g, formatGlobalValue(item.y_o)) +
                        "</div>";
                    }
                    else if (hit.name === "Fitted Line"){
                        return "<div>" +
                        "<b>@relation</b>".replace(/@relation/g, labels[0]) +
                        "</div>";
                    } 
                    else{
                        return null;
                    }
                    
                },
            },
            rendered: function(self){
                // update axis formats
                self.axisX.format = getDefaultNumberFormat(pltChart.axisX, 'x');
                self.axisY.format = getDefaultNumberFormat(pltChart.axisY, 'y');
                // update axis line color
                $.each(self.axisX.hostElement.querySelectorAll("line"), function (ind, line) {
                    $(line).attr("stroke", fontColor_global).attr('fill', 'none').removeClass('wj-line').removeClass('wj-tick');
                });
                $.each(self.axisY.hostElement.querySelectorAll("line"), function (ind, line) {
                    $(line).attr("stroke", fontColor_global).attr('fill', 'none').removeClass('wj-line').removeClass('wj-tick');
                });
                // retrieve all scatter points' svg element as ellipse, update the style of the first one and add the event listener for each one
                var es = self.hostElement.querySelectorAll('ellipse');
                for(var i=0; i<es.length; i+=1){
                    var ellipse = es[i];
                    if(i===es.length-1){
                        $(ellipse).attr("fill", colorHighlight).attr("stroke", colorHighlight).attr("rx", 5).attr("ry", 5);
                    }
                    ellipse.addEventListener('mouseover', function (e) {
                        // highlight the mouse hovered point
                        var target = $(e.target);
                        target.attr('fill_old', target.attr('fill'));
                        target.attr('stroke_old', target.attr('stroke'));
                        target.attr('fill', colorOrange).attr('stroke', colorOrange);
                    });
                    ellipse.addEventListener('mouseout', function (e) {
                        // change back the original colors of the element
                        var target = $(e.target);
                        target.attr('fill', target.attr('fill_old'));
                        target.attr('stroke', target.attr('stroke_old'));
                    });
                }
                // scroll to bottom
                $('html, body').scrollTop($(document).height());
                document.body.style.overflow = "auto";
            }
        });
    }
    plot();
    window.addEventListener('resize', rez);
}
var basePath_LBRJS = rp + "ArcToolbox/Scripts/Images/";
var language = lang;
var basePath = rp + "Charts/";
var jsResources = [
    "@@chart_base/scripts/jquery-3.1.0.slim.min.js",
    "@@chart_base/scripts/wijmo.min.js",
    "@@chart_base/scripts/wijmo.chart.min.js", 
    "@@chart_base/scripts/culture/wijmo.culture.@@lang.min.js".replace(/@@lang/g, language), 
    "@@chart_base/scripts/main.js",
    "@@img_base/SSUtil.js"];
var cssResources = [basePath + "styles/wijmo-chart.min.css"];
if(g_popupTheme===2){
    cssResources.push(basePath_LBRJS + "localBivarRelPlot_dark.css");
}else{
    cssResources.push(basePath_LBRJS + "localBivarRelPlot.css");
}
var resourcesToLoad = jsResources.length + cssResources.length;
for(var i=0; i<cssResources.length; i+=1){
    var link = document.createElement("link"); 
    link.rel="stylesheet";
    link.type = 'text/css';
    link.href = cssResources[i]; 
    link.onload = callback;
    document.head.appendChild(link);
}
for(var i=0; i<jsResources.length; i+=1){
    var script = document.createElement("script"); 
    script.type = "text/javascript";
    var js_path = jsResources[i];
    js_path = js_path.replace("@@chart_base/", basePath);
    js_path = js_path.replace("@@img_base/", basePath_LBRJS);
    script.src = js_path;
    script.async = false;
    script.onload = callback;
    document.head.appendChild(script);
}
function callback(){
    resourcesToLoad -= 1;
    if(resourcesToLoad === 0){
        initializeWijmo();
        execute();
    }
}