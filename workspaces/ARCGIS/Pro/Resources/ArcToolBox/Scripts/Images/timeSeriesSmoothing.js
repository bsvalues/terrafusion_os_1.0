function isNullOrUndefined(val){
    return (val===null || val===undefined);
}

function execute() {

    var fontColor_global = "#848484";
    var colorLine = "#1976d2";
    var colorLineSmooth = "#F26745";
    var c_color = '#ffcc80';
    var colorHighlight = "#18ffff";
    var c_outliers = ["#762a83", "#1b7837", "#848484"];
    if(g_popupTheme===2){
        colorLine = "#64b5f6";
        fontColor_global = "#ededed";
        colorLineSmooth = "#F26745";
        c_outliers = ["#d500f9", "#76ff03", "#bdbdbd"];
    }
    var container_id = "html_chart";
    if (!isNullOrUndefined(data.cid)){
        container_id = data.cid;
    }
    var annotationFocus = null;
    var pltChart = null;

    function formatGlobalValue(value) {
        // should be 'e4' but the scientific notation is not supported by wijmo
        return wijmo.Globalize.format(value, 'g4');
    }


    function calSignalTimeSteps() {
        var timeSteps = [];
        var t0 = data.t0;
        data.dt.forEach(function(ts){
            var t = new Date(t0);
            t.setSeconds(t.getSeconds() + ts);
            timeSteps.push(t);
        });

        return timeSteps;
    }
    var signalTimeSteps = calSignalTimeSteps();
    var signalTimeIntervals = null;
    function hitTimeTest(t){
        var maxStep = signalTimeSteps.length;
        if(t<signalTimeSteps[0]){
            return 0;
        }else if(t>signalTimeSteps[maxStep-1]){
            return maxStep-1;
        }

        if(isNullOrUndefined(signalTimeIntervals)){
            signalTimeIntervals = [];
            for(var i=0; i<maxStep; i+=1){
                signalTimeIntervals.push(signalTimeSteps[i]-signalTimeSteps[0]);
            }
        }
        var dt = t - signalTimeSteps[0];

        var p0 = 0, p1 = maxStep;
        var tid = -1;
        while(p1-p0 > 1){
            var mid = parseInt((p0+p1)/2);
            var vMid = signalTimeIntervals[mid];
            if(dt == vMid){
                tid = mid;
                break;
            }else if(dt < vMid){
                p1 = mid;
            }else{
                p0 = mid;
            }
        }
        if(tid == -1){
            if((dt-signalTimeIntervals[p0])<(signalTimeIntervals[p1]-dt)){
                tid = p0;
            }else{
                tid  =p1;
            }
        }
        return tid;
    }

    function getFormattedDate(date, allTimeStepsSameDay){
        var F = "yyyy/MM/dd HH:mm:ss";
        return "<b>@t</b>: ".replace("@t", data.labels["datetime"]) + wijmo.Globalize.format(date, F);
    }
    function getValuesRange(values, values2=null){
        var min = values[0];
        var max = values[0];
        for(var i = 1; i<values.length; i+=1){
            var v = values[i];
            if(isNullOrUndefined(v)){
                continue;
            }
            if(min > v || isNaN(min)){
                min = v;
            }
            if(max < v || isNaN(max)){
                max = v;
            }
        }
        if(!isNullOrUndefined(values2)){
            for(var i = 0; i<values2.length; i+=1){
                var v = values2[i];
                if(isNullOrUndefined(v)){
                    continue;
                }
                if(min > v){
                    min = v;
                }
                if(max < v){
                    max = v;
                }
            }
        }
        return [min, max];
    }

    function prepareData(){
        var dataBundle = [];
        var smoothBundle = [];
        // original data and smoothing data
        for(var i=0; i<data.dt.length; i+=1){
            dataBundle.push({
                x: signalTimeSteps[i],
                y: data.vo[i]
            });
            smoothBundle.push({
                x: signalTimeSteps[i],
                y: data.vs[i]
            });
        }
        var range = getValuesRange(data.vo, data.vs);
        if(range[0] == range[1])
        {
            range[0] -= 1;
            range[1] += 1;

        }
        var resultBundle = {
            dataBundle: dataBundle,
            smoothBundle: smoothBundle,
            range: range
        };
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
            h = Math.min(h, $(window).height());
        }

        var target = $("#timeseries_@@cid".replace(/@@cid/g, container_id));
        if(w>600){
            target.css("width", "95%")
        }
        target.width(w);
        target.height(h);
        if(!isNullOrUndefined(pltChart)){
            pltChart.refresh();
        }
    }

    function updateToolTipVisibleRegion(pltChart, toolTipVisibleRegion)
    {
        if(isNullOrUndefined(pltChart) || isNullOrUndefined(toolTipVisibleRegion))
        {
            return;
        }
        var hostEle = pltChart.hostElement;
        var rect = hostEle.getBoundingClientRect();
        var offsetX = rect.left + parseInt($(hostEle).css("padding-left"));
        var offsetY = rect.top + parseInt($(hostEle).css("padding-top"));
        toolTipVisibleRegion.xMinCoord = pltChart.axisX.convert(toolTipVisibleRegion.xMin) - 5 + offsetX;
        toolTipVisibleRegion.xMaxCoord = pltChart.axisX.convert(toolTipVisibleRegion.xMax) + 5 + offsetX;
        toolTipVisibleRegion.yMinCoord = pltChart.axisY.convert(toolTipVisibleRegion.yMax) + offsetY;
        toolTipVisibleRegion.yMaxCoord = pltChart.axisY.convert(toolTipVisibleRegion.yMin) + offsetY;
    }

    function plot(){
        if(data.dt.length<2){
            return;
        }
        var target = $("#timeseries_@@cid".replace(/@@cid/g, container_id));
        target.css("font-family: Verdana; width: 100%; min-width: 300px; height: 10px; border: none; font-size: 10px; margin: 0px; padding: 0px;");
        rez();
        var chart = wijmo.chart;
        var result = prepareData();
        var d0 = signalTimeSteps[0];
        var d1 = signalTimeSteps[signalTimeSteps.length-1];
        var allTimeStepsSameDay = false;
        if(d0.getFullYear()==d1.getFullYear() && d0.getMonth()==d1.getMonth() && d0.getDate()==d1.getDate()){
            allTimeStepsSameDay = true;
        }
        var toolTipVisibleRegion = {
            xMin: signalTimeSteps[0],
            xMax: signalTimeSteps[signalTimeSteps.length - 1],
            yMin: result.range[0],
            yMax: result.range[1],
            xMinCoord: 0,
            xMaxCoord: 0,
            yMinCoord: 0,
            yMaxCoord: 0,
        };
        
        var lineMarkerSize = 1.2;
        var series = [
            {
                name: data.labels["original"],
                itemsSource: result.dataBundle,
                bindingX: 'x',
                binding: 'y',
                style: {
                    stroke: colorLine,
                    fill: colorLine,
                    "stroke-width": "1"
                },
                symbolStyle: {
                    stroke: colorLine,
                    fill: colorLine,
                    rx: lineMarkerSize,
                    ry: lineMarkerSize
                },
            },
            {
                name: data.labels["smoothed"],
                itemsSource: result.smoothBundle,
                bindingX: 'x',
                binding: 'y',
                style: {
                    stroke: colorLineSmooth,
                    fill: colorLineSmooth,
                    "stroke-width": "1"
                    // "stroke-dasharray": "4, 2",
                    // "stroke-width": "1"
                },
                symbolStyle: {
                    stroke: colorLineSmooth,
                    fill: colorLineSmooth,
                    rx: lineMarkerSize,
                    ry: lineMarkerSize
                },
            }
        ];

        pltChart = new chart.FlexChart('#timeseries_@@cid'.replace(/@@cid/g, container_id), {
            chartType: chart.ChartType.LineSymbols,
            axisY: {
                title: data.vn,
                axisLine: true,
                majorGrid: false,
                min: result.range[0],
                max: result.range[1],
            },
            series: series,
            legend: {
                position: chart.Position.Bottom
            },
            tooltip:{
                threshold: -1,
                content: function(hit){
                    return null;
                },
            },
            rendered: function(self){
                updateToolTipVisibleRegion(pltChart, toolTipVisibleRegion);
                pltChart.addEventListener(pltChart.hostElement, 'mousemove', function (e) {
                    var eX = e.x;
                    var eY = e.y;
                    if(lm.isVisible){
                        if(eX < toolTipVisibleRegion.xMinCoord
                            || eX > toolTipVisibleRegion.xMaxCoord
                            || eY < toolTipVisibleRegion.yMinCoord
                            || eY > toolTipVisibleRegion.yMaxCoord){
                            lm.isVisible = false;
                            annotationFocus.items.clear();
                        }
                    }else{
                        if(eX >= toolTipVisibleRegion.xMinCoord
                            && eX <= toolTipVisibleRegion.xMaxCoord
                            && eY >= toolTipVisibleRegion.yMinCoord
                            && eY <= toolTipVisibleRegion.yMaxCoord){
                            lm.isVisible = true;
                        }
                    }
                });
                pltChart.addEventListener(pltChart.hostElement, 'mouseleave', function () {
                    lm.isVisible = false;
                    annotationFocus.items.clear();
                });

                document.addEventListener("scroll", (event) => {
                    updateToolTipVisibleRegion(pltChart, toolTipVisibleRegion);
                });

                // scroll to bottom right
                $('html, body').scrollTop($(document).height());
                $('html, body').scrollLeft($(document).width());
                document.body.style.overflow = "auto";
            }
        });

        // add the custom tooltips here
        var previous_focusedTimeId = -1;
        var previous_focusedMessage = "";
        if(annotationFocus == null){
            annotationFocus = new wijmo.chart.annotation.AnnotationLayer(pltChart);
        }
        var lm = new chart.LineMarker(pltChart, {
            isVisible: false,
            lines: 'None',
            interaction: 'Move',
            content: (ht) => {
                if (ht.item) {
                    annotationFocus.items.clear();
                    var cursorTime = pltChart.axisX.convertBack(ht.point.x);
                    var timeIndex = hitTimeTest(cursorTime);
                    if(timeIndex>=0 && timeIndex < signalTimeSteps.length && lm.isVisible){
                        var t = signalTimeSteps[timeIndex];
                            // add the reference line
                            annotationFocus.items.push(new wijmo.chart.annotation.Line({
                                type: 'Line',
                                tooltip: null,
                                position: 'Center',
                                attachment: 'DataCoordinate',
                                start: { x: t, y: result.range[0] },
                                end: { x: t, y: result.range[1] },
                                style: {
                                    stroke: colorHighlight,
                                    strokeWidth: 1,
                                    opacity: 1 }
                            }));
                        if(timeIndex === previous_focusedTimeId){
                            return previous_focusedMessage;
                        }else{
                            // prepare the message here
                            var message = "<div>@t</div>".replace(/@t/g, getFormattedDate(t, allTimeStepsSameDay));
                            // Add original value
                            var rawValue = result.dataBundle[timeIndex].y;
                            if(!isNullOrUndefined(rawValue) && !isNaN(rawValue)){
                                message += "<div style='color: @c'><b>@valueLabel</b>:&emsp;@v</div>"
                                .replace(/@c/g, colorLine)
                                .replace(/@valueLabel/g, data.labels["original"])
                                .replace(/@v/g, formatGlobalValue(rawValue));
                            }
                            var smoothValue = result.smoothBundle[timeIndex].y;
                            if(!isNullOrUndefined(smoothValue) && !isNaN(smoothValue)){
                                message += "<div style='color: @c'><b>@valueLabel</b>:&emsp;@v</div>"
                                        .replace(/@c/g, colorLineSmooth)
                                        .replace(/@valueLabel/g, data.labels["smoothed"])
                                        .replace(/@v/g, formatGlobalValue(smoothValue));
                                if(!isNullOrUndefined(rawValue) && !isNaN(rawValue)){
                                    var lb_resd = "Residual";
                                    if(!isNullOrUndefined(data.labels["residual"])){
                                        lb_resd = data.labels["residual"];
                                    }
                                    message += "<div style='color: @c'><b>@valueLabel</b>:&emsp;@v</div>"
                                        .replace(/@c/g, c_outliers[2])
                                        .replace(/@valueLabel/g, lb_resd)
                                        .replace(/@v/g, formatGlobalValue(rawValue - smoothValue));
                                }
                            }

                            previous_focusedMessage = message;
                            previous_focusedTimeId = timeIndex;
                            return message;
                        }
                    }else{
                        return "Tool tip";
                    }
                }
                else {
                    return null;
                }
            }
        });
    }
    plot();
    window.addEventListener('resize', rez);
}

var basePath_LBRJS = rp + "ArcToolBox/Scripts/Images/";
var basePath = rp + "Charts/";
var jsResources = [
    "@@chart_base/scripts/jquery-3.1.0.slim.min.js",
    "@@chart_base/scripts/wijmo.min.js",
    "@@chart_base/scripts/wijmo.chart.min.js",
    "@@chart_base/scripts/wijmo.chart.analytics.min.js",
    "@@chart_base/scripts/wijmo.chart.annotation.min.js",
    "@@chart_base/scripts/culture/wijmo.culture.@@lang.min.js".replace(/@@lang/g, data.lang), 
    "@@chart_base/scripts/main.js",
    "@@img_base/SSUtil.js"];
var cssResources = [
    basePath + "styles/wijmo-chart.min.css"];

if(isNullOrUndefined(window.g_popupTheme)){
    window.g_popupTheme = 1;
}
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
            var js_path = resourcePath;
            js_path = js_path.replace("@@chart_base/", basePath);
            js_path = js_path.replace("@@img_base/", basePath_LBRJS);
            script.src = js_path;
            script.async = false;
            script.onload = loadResource;
            document.head.appendChild(script);
        }else{
            loadResource();
        }
    }
}
loadResource();
