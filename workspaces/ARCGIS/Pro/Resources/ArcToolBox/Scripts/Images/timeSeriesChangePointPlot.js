/*
    In this code change type codes are:
        changeType = 0 -> mean
        changeType = 1 -> STANDARD_DEVIATION
        changeType = 2 -> slope
        changeType = 3 -> count
*/


function isNullOrUndefined(val){
    return (val===null || val===undefined);
}

function execute() {
    var fontColor_global = "#848484";
    var colorLine = "#1A85FF"; 
    var colorHighlight = "#18ffff";
    var c_cp = "#D41159"; 
    var c_mean = "#D41159";
    var c_lower = "#D41159";
    var c_upper = c_lower;
    var c_global_var = "#b5b5b5";
    var c_area = "rgba(214, 111, 149, 0.08)";

    if(g_popupTheme===2){
        colorLine = "#1A85FF";
        fontColor_global = "#ededed";
        c_cp = "#fa055f";
        c_mean = "#fa055f";
        c_lower = "#fa055f";
        c_upper = c_lower;
        c_global_var = "#b5b5b5";
        c_area = "rgba(214, 111, 149, 0.08)";
    }
    var annotationFocus = null;
    var pltChart = null;
    var supportTime = ["SECONDS", "MINUTES", "HOURS", "DAYS", "WEEKS", "MONTHS", "YEARS"];

    function formatGlobalValue(value) {
        // should be 'e4' but the scientific notation is not supported by wijmo
        return wijmo.Globalize.format(value, 'g4');
    }

    function isLeapYear(year) {
        return year % 100 === 0 ? year % 400 === 0 : year % 4 === 0;
    }

    function getLegalDate(deltaYear, deltaMonth){
        var lastDays = {0:31, 1:28, 2:31, 3:30, 4:31, 5:30,
            6:31, 7:31, 8:30, 9:31, 10:30, 11:31};
        var t_start = new Date(data.t0);
        var newYear = t_start.getFullYear();
        var newMonth = t_start.getMonth();
        newYear += deltaYear;
        newMonth += deltaMonth;
        newYear += parseInt(newMonth / 12);
        newMonth = newMonth % 12;
        var maxDate = lastDays[newMonth];
        if(newMonth==1 && isLeapYear(newYear)){
            maxDate = 29;
        }
        return new Date(newYear, newMonth, t_start.getDate()>maxDate ? maxDate : t_start.getDate() ,
            t_start.getHours(), t_start.getMinutes(), t_start.getSeconds());
    }

    function calSignalTimeSteps() {
        var timeSteps = [];
        var T = data.ts.length;
        var unit = data.unit;
        var intv = data.intv;
        if(unit=="MONTHS")
        {
            var timeDelta = intv;
            for(var i=0; i<T; i+=1){
                timeSteps.push(getLegalDate(0, i*timeDelta));
            }
        }else if(unit=="YEARS"){
            var timeDelta = intv;
            for(var i=0; i<T; i+=1){
                timeSteps.push(getLegalDate(i*timeDelta, 0));
            }
        }else if(supportTime.indexOf(unit)>=0){
            var timeDelta = intv;
            if(unit == "MINUTES"){
                timeDelta = timeDelta * 60;
            }else if(unit == "HOURS"){
                timeDelta = timeDelta * 60 * 60;
            }else if(unit == "DAYS"){
                timeDelta = timeDelta * 60 * 60 * 24;
            }else if(unit == "WEEKS"){
                timeDelta = timeDelta * 60 * 60 * 24 * 7;
            }
            for(var i=0; i<T; i+=1){
                var t = new Date(data.t0);
                t.setSeconds(t.getSeconds() + timeDelta * i);
                timeSteps.push(t);
            }
        }else{
            // there are some error here, return simple number indexes
            for(var i=0; i<T; i+=1){
                timeSteps.push(i);
            }
        }
        
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
                tid = p1;
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
        var changePoints = [];
        var meanValueBundle = [];
        var lowerBoundBundle = [];
        var upperBoundBundle = [];
        var slopeValueBundle = [];
        var globalLowerBundle = [];
        var globalUpperBundle = [];
        var areaBundle = []
        var bounds = [];
        var cpSet = new Set();
        if(!isNullOrUndefined(data.cps) && data.cps.length>0){
            cpSet = new Set(data.cps);
        }
        var sumVal = 0.0;
        var sumCount = 0.0;
        var cpStartId = 0;
        var meanVal = 0.0;
        var segVar = 0.0;
        var stdDev, lowerBound, upperBound, slopeVal;
        var changeType = data.cpt;
        // original data and change point data
        if (changeType === "2"){
            for (var i=0; i<data.ts.length; i+=1){
                var isCp = cpSet.has(i);
                dataBundle.push({
                    x: signalTimeSteps[i],
                    y: data.ts[i],
                    isCp: isCp,
                    slope: null,
                    intercept: null
                });

                if (isCp){
                    var n = i - cpStartId;
                    var sum_xt = 0.0;
                    var sum_x = 0.0;
                    var sum_t = 0.0;
                    var sum_t2 = 0.0;

                    for(var j=cpStartId; j<i; j+=1){
                        sum_x += data.ts[j];
                        sum_xt += data.ts[j] * j;
                        sum_t += j;
                        sum_t2 += j * j;
                    }

                    // Fitted line is of form  X = a + b * t
                    var b = (n * sum_xt - sum_x * sum_t) / (n * sum_t2 - sum_t * sum_t);
                    var a = (sum_x - b * sum_t) / n;
                    slopeValueBundle.push({
                        x: signalTimeSteps[cpStartId],
                        y: a + b * (cpStartId)
                    });
                    bounds.push(a + b * (cpStartId))

                    for(var j=cpStartId; j<i; j+=1){
                        dataBundle[j].slope = b;
                        dataBundle[j].intercept = a;
                    }
                    cpStartId = i;
                    slopeValueBundle.push({
                        x: signalTimeSteps[i - 1],
                        y: a + b * (i - 1)
                    });
                    bounds.push(a + b * (i - 1));

                    slopeValueBundle.push({
                        x: signalTimeSteps[i - 1],
                        y: null //signalTimeSteps[i]  //data.ts[i]
                    });
                }
            }
            // last Segment
            var lastSegIdx = signalTimeSteps.length - 1;
            var n = lastSegIdx - cpStartId + 1;
            var sum_xt = 0.0;
            var sum_x = 0.0;
            var sum_t = 0.0;
            var sum_t2 = 0.0;

            for (var j=cpStartId; j<=lastSegIdx; j+=1){
                sum_x += data.ts[j];
                sum_xt += data.ts[j] * j;
                sum_t += j;
                sum_t2 += j * j;
            }

            var b = (n * sum_xt - sum_x * sum_t) / (n * sum_t2 - sum_t * sum_t);
            var a = (sum_x - b * sum_t) / n;

            slopeValueBundle.push({
                x: signalTimeSteps[cpStartId],
                y: a + b * cpStartId
            });
            bounds.push(a + b * (lastSegIdx));
            slopeValueBundle.push({
                x: signalTimeSteps[lastSegIdx],
                y: a + b * lastSegIdx
            });
            bounds.push(a + b * (lastSegIdx));

            for(var j=cpStartId; j<=lastSegIdx; j+=1){
                dataBundle[j].slope = b;
                dataBundle[j].intercept = a;
            }
        }
        else if (changeType === "1"){
            for (var i=0; i<data.ts.length; i+=1){
                sumVal += data.ts[i];
            }
            meanVal = sumVal / data.ts.length;
            for (var i=0; i<data.ts.length; i+=1){
                var isCp = cpSet.has(i);
                dataBundle.push({
                    x: signalTimeSteps[i],
                    y: data.ts[i],
                    isCp: isCp,
                    mean: meanVal,
                    lower: null,
                    upper: null
                });
                if(isCp){
                    // for (var j=cpStartId; j<i; j+=1){
                    //     segVar += (dataBundle[j].y - meanVal) * (dataBundle[j].y - meanVal);
                    // }
                    stdDev = Math.sqrt(segVar / (i - cpStartId + 1));
                    lowerBound = meanVal - 2 * stdDev;
                    upperBound = meanVal + 2 * stdDev;
                    for (var j=cpStartId; j<i; j+=1){
                        dataBundle[j].lower = lowerBound;
                        dataBundle[j].upper = upperBound;
                    }
                    bounds.push(lowerBound);
                    bounds.push(upperBound);

                    lowerBoundBundle.push({
                        x: signalTimeSteps[cpStartId],
                        y: lowerBound
                    });
                    upperBoundBundle.push({
                        x: signalTimeSteps[cpStartId],
                        y: upperBound
                    });

                    areaBundle.push({
                        x: signalTimeSteps[cpStartId],
                        bottom: lowerBound,
                        ceiling: upperBound
                    });

                    cpStartId = i;
                    lowerBoundBundle.push({
                        x: signalTimeSteps[cpStartId-1],
                        y: lowerBound
                    });
                    lowerBoundBundle.push({
                        x: signalTimeSteps[cpStartId-1],
                        y: null
                    });
                    upperBoundBundle.push({
                        x: signalTimeSteps[cpStartId-1],
                        y: upperBound
                    });
                    upperBoundBundle.push({
                        x: signalTimeSteps[cpStartId-1],
                        y: null
                    });
                    areaBundle.push({
                        x: signalTimeSteps[cpStartId-1],
                        bottom: lowerBound,
                        ceiling: upperBound
                    });
                    areaBundle.push({
                        x: signalTimeSteps[cpStartId-1],
                        bottom: null,
                        ceiling: null
                    });

                    segVar = 0.0;
                }
                else{
                    segVar += (dataBundle[i].y - meanVal) * (dataBundle[i].y - meanVal);
                }
            }
            // Last segment
            stdDev = Math.sqrt(segVar / (signalTimeSteps.length - cpStartId + 1));
            lowerBound = meanVal - 2 * stdDev;
            upperBound = meanVal + 2 * stdDev;
            bounds.push(lowerBound);
            bounds.push(upperBound);
            for (var j=cpStartId; j<signalTimeSteps.length; j+=1){
                dataBundle[j].lower = lowerBound;
                dataBundle[j].upper= upperBound;
            }
            lowerBoundBundle.push({
                x: signalTimeSteps[cpStartId],
                y: lowerBound
            });
            lowerBoundBundle.push({
                x: signalTimeSteps[signalTimeSteps.length-1],
                y: lowerBound
            });

            upperBoundBundle.push({
                x: signalTimeSteps[cpStartId],
                y: upperBound
            });
            upperBoundBundle.push({
                x: signalTimeSteps[signalTimeSteps.length-1],
                y: upperBound
            });

            areaBundle.push({
                x: signalTimeSteps[cpStartId],
                bottom: lowerBound,
                ceiling: upperBound
            });
            areaBundle.push({
                x: signalTimeSteps[signalTimeSteps.length-1],
                bottom: lowerBound,
                ceiling: upperBound
            });

            // Add the global mean and variance
            meanValueBundle.push({
                x: signalTimeSteps[0],
                y: meanVal
            });
            meanValueBundle.push({
                x: signalTimeSteps[signalTimeSteps.length-1],
                y: meanVal
            });
            // global
            var globalVar = 0.0;
            for (var j=0; j<signalTimeSteps.length; j+=1)
                globalVar += (data.ts[j] - meanVal) * (data.ts[j] - meanVal);
            globalVar /= signalTimeSteps.length;
            var globalSTD = Math.sqrt(globalVar);
            var globalLowerBound = meanVal - 2 * globalSTD;
            var globalUpperBound = meanVal + 2 * globalSTD;
            globalLowerBundle.push({
                x: signalTimeSteps[0],
                y: globalLowerBound
            });
            globalLowerBundle.push({
                x: signalTimeSteps[signalTimeSteps.length-1],
                y: globalLowerBound
            });
            globalUpperBundle.push({
                x: signalTimeSteps[0],
                y: globalUpperBound
            });
            globalUpperBundle.push({
                x: signalTimeSteps[signalTimeSteps.length-1],
                y: globalUpperBound
            });
            for (var j=0; j<signalTimeSteps.length; j+=1){
                dataBundle[j]["globalLower"] = globalLowerBound;
                dataBundle[j]["globalUpper"] = globalUpperBound;
            }
        }
        else{
            for(var i=0; i<data.ts.length; i+=1){
                var isCp = cpSet.has(i);
                dataBundle.push({
                    x: signalTimeSteps[i],
                    y: data.ts[i],
                    isCp: isCp,
                    mean: null,
                });
                if(isCp && sumCount>0){
                    meanVal = sumVal / sumCount;
                    meanValueBundle.push({
                        x: signalTimeSteps[cpStartId],
                        y: meanVal
                    });
                    for(var j=cpStartId; j<i; j+=1){
                        dataBundle[j].mean = meanVal;
                    }

                    cpStartId = i;
                    meanValueBundle.push({
                        x: signalTimeSteps[cpStartId-1],
                        y: meanVal
                    });
                    meanValueBundle.push({
                        x: signalTimeSteps[cpStartId-1],
                        y: null
                    });
                    sumVal = data.ts[i];
                    sumCount = 1;
                    
                }else{
                    sumVal += data.ts[i];
                    sumCount += 1;
                }
            }
            // close the mean line at the end
            meanVal = sumVal / sumCount;
            meanValueBundle.push({
                x: signalTimeSteps[cpStartId],
                y: meanVal
            });
            meanValueBundle.push({
                x: signalTimeSteps[signalTimeSteps.length-1],
                y: meanVal
            });
            for(var j=cpStartId; j<signalTimeSteps.length; j+=1){
                dataBundle[j].mean = meanVal;
            }
        }

        if(!isNullOrUndefined(data.cps) && data.cps.length>0){
            data.cps.forEach(function(tid){
                changePoints.push({
                    x: signalTimeSteps[tid],
                    y: data.ts[tid],
                });
            });
        }
        var range = getValuesRange(data.ts, bounds);
        var resultBundle = {
            dataBundle: dataBundle,
            changePoints: changePoints,
            range: range,
            //meanValueBundle: meanValueBundle
        };
        if (changeType === "0" || changeType === "3"){
            resultBundle["meanValueBundle"] = meanValueBundle;
        }
        else if (changeType === "1"){
            resultBundle["lowerBoundBundle"] = lowerBoundBundle;
            resultBundle["upperBoundBundle"] = upperBoundBundle;
            resultBundle["globalLowerBundle"] = globalLowerBundle;
            resultBundle["globalUpperBundle"] = globalUpperBundle;
            resultBundle["meanValueBundle"] = meanValueBundle;
            resultBundle["areaBundle"] = areaBundle;
        }
        else{
            resultBundle["slopeValueBundle"] = slopeValueBundle;
        }
        return resultBundle;
    }

    function rez(){
        var w = window.innerWidth - 35;
        if(w < 300){
            w = 300;
        }
        var h = 300;
        if(w > 800){
            h=350;
        }else if(w > 600){
            h=300;
        }else {
            h=250;
        }
        if($(window).height() > 200){
            h = Math.min(h, $(window).height());
        }

        var target = $("#timeseries_html_chart");
        if(w>600){
            target.css("width", "95%")
        }
        target.width(w);
        target.height(h);
        if(!isNullOrUndefined(pltChart)){
            pltChart.refresh();
        }
    }

    function plot(){
        if(data.ts.length<2){
            return;
        }
        var containerStr = "<div id='timeseries_html_container' style='font-family: Verdana; width: 100%; min-width: 300px'>" +
            "<div id='timeseries_html_chart' style='width: 90%; height: 10px; border: none; font-size: 10px; margin: 0px; padding: 5px; background-color: transparent'></div>" +
            "</div>";
        $("body").append(containerStr);
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
        var meanLineWidth = "1.5";
        if(signalTimeSteps.length >= 200)
        {
            meanLineWidth = "2.0";
        }

        // Add Change Type Method to the Chart
        $("#timeseries_html_container")
            .prepend("<div id='timeseries_html_head' style='color: @@fc; font-size: 13px; padding-left: 30px'><b>@hNote: </b>@CH_M</div>".replace(/@@fc/g, fontColor_global)
                .replace("@hNote", data.labels["headerNote"])
                .replace("@CH_M", data.labels["changeStr"]))

        // Add Note for standard Deviation
        if (data.cpt == "1"){
            $("#timeseries_html_container")
                    .append("<div id='timeseries_html_footnote' style='color: @@fc; font-size: 10px; padding: 10px 0px 10px 30px;'>@note</div>".replace(/@@fc/g, fontColor_global)
                        .replace("@note", data.labels["footNote"]))
        }
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
                name: data.labels["chpts"],
                chartType: "Scatter",
                itemsSource: result.changePoints,
                bindingX: 'x',
                binding: 'y',
                symbolStyle: {
                    stroke: c_cp,
                    fill: c_cp,
                    rx: 2.5,
                    ry: 2.5
                },
            },
        ];

        if (data.cpt === "0" || data.cpt === "3"){
            series.push({
                name: data.labels["segMeanVals"],
                chartType: "Line",
                itemsSource: result.meanValueBundle,
                bindingX: 'x',
                binding: 'y',
                style: {
                    stroke: c_mean,
                    // "stroke-dasharray": "6, 1",
                    fill: c_mean,
                    "stroke-width": meanLineWidth
                },
            });
        }
        else if (data.cpt === "1"){
            series.push({
                name: data.labels["globalMean"],
                chartType: "Line",
                itemsSource: result.meanValueBundle,
                bindingX: 'x',
                binding: 'y',
                style: {
                    stroke: c_mean,
                    //"stroke-dasharray": "6, 1",
                    fill: c_mean,
                    "stroke-width": meanLineWidth
                },
            });
            series.push({
                name: data.labels["segUpperBounds"],
                chartType: "Line",
                itemsSource: result.upperBoundBundle,
                bindingX: 'x',
                binding: 'y',
                style: {
                    stroke: c_upper,
                    "stroke-dasharray": "6, 1",
                    "stroke-width": meanLineWidth
                },
            });
            series.push({
                name: data.labels["segLowerBounds"],
                chartType: "Line",
                itemsSource: result.lowerBoundBundle,
                bindingX: 'x',
                binding: 'y',
                style: {
                    stroke: c_lower,
                    "stroke-dasharray": "6, 1",
                    "stroke-width": meanLineWidth
                },
            });
            series.push({
                name: data.labels["globUpperBounds"],
                chartType: "Line",
                itemsSource: result.globalUpperBundle,
                bindingX: 'x',
                binding: 'y',
                style: {
                    stroke: c_global_var,
                    "stroke-dasharray": "6, 1",
                    "stroke-width": meanLineWidth
                },
            });
            series.push({
                name: data.labels["segArea"],
                chartType: "Area",
                itemsSource: result.areaBundle,
                bindingX: 'x',
                binding: 'bottom,ceiling',
                style: {
                    fill: c_area,
                    stroke: 'transparent'
                },
            });
            series.push({
                name: data.labels["globLowerBounds"],
                chartType: "Line",
                itemsSource: result.globalLowerBundle,
                bindingX: 'x',
                binding: 'y',
                style: {
                    stroke: c_global_var,
                    "stroke-dasharray": "6, 1",
                    "stroke-width": meanLineWidth
                },
            });
        }
        else{
            series.push({
                name: data.labels["segLine"],
                chartType: "Line",
                itemsSource: result.slopeValueBundle,
                bindingX: 'x',
                binding: 'y',
                style: {
                    stroke: c_mean,
                    "stroke-dasharray": "6, 1",
                    "stroke-width": meanLineWidth
                },
            });
        }

        pltChart = new chart.FlexChart('#timeseries_html_chart', {
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
                var hostEle = pltChart.hostElement
                var offsetX = hostEle.offsetLeft + parseInt($(hostEle).css("padding-left"));
                var offsetY = hostEle.offsetTop + parseInt($(hostEle).css("padding-top"));
                toolTipVisibleRegion.xMinCoord = pltChart.axisX.convert(toolTipVisibleRegion.xMin) - 5 + offsetX;
                toolTipVisibleRegion.xMaxCoord = pltChart.axisX.convert(toolTipVisibleRegion.xMax) + 5 + offsetX;
                toolTipVisibleRegion.yMinCoord = pltChart.axisY.convert(toolTipVisibleRegion.yMax) + offsetY;
                toolTipVisibleRegion.yMaxCoord = pltChart.axisY.convert(toolTipVisibleRegion.yMin) + offsetY;
                pltChart.addEventListener(pltChart.hostElement, 'mousemove', function (e) {
                    var eX = e.x + window.pageXOffset;
                    var eY = e.y + window.pageYOffset;
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
                            if(result.dataBundle[timeIndex].isCp){
                                message += "<div style='color: @c'><b>@valueLabel</b></div>"
                                .replace(/@c/g, c_cp)
                                .replace(/@valueLabel/g, data.labels["chpt"]);
                            }
                            // Add original value
                            var rawValue = result.dataBundle[timeIndex].y;
                            message += "<div style='color: @c'><b>@valueLabel</b>:&emsp;@v</div>"
                                .replace(/@c/g, colorLine)
                                .replace(/@valueLabel/g, data.labels["original"])
                                .replace(/@v/g, formatGlobalValue(rawValue));
                            if (data.cpt === "0" || data.cpt === "3"){
                                message += "<div style='color: @c'><b>@valueLabel</b>:&emsp;@v</div>"
                                    .replace(/@c/g, c_mean)
                                    .replace(/@valueLabel/g, data.labels["segMean"])
                                    .replace(/@v/g, formatGlobalValue(result.dataBundle[timeIndex].mean));
                            }
                            else if (data.cpt === "1"){
                                message += "<div style='color: @c'><b>@valueLabel</b>:&emsp;@v</div>"
                                    .replace(/@c/g, c_mean)
                                    .replace(/@valueLabel/g, data.labels["globalMean"])
                                    .replace(/@v/g, formatGlobalValue(result.dataBundle[timeIndex].mean));
                                message += "<div style='color: @c'><b>@valueLabel</b>:&emsp;@v</div>"
                                    .replace(/@c/g, c_upper)
                                    .replace(/@valueLabel/g, data.labels["segUpper"])
                                    .replace(/@v/g, formatGlobalValue(result.dataBundle[timeIndex].upper));
                                message += "<div style='color: @c'><b>@valueLabel</b>:&emsp;@v</div>"
                                    .replace(/@c/g, c_lower)
                                    .replace(/@valueLabel/g, data.labels["segLower"])
                                    .replace(/@v/g, formatGlobalValue(result.dataBundle[timeIndex].lower));
                                message += "<div style='color: @c'><b>@valueLabel</b>:&emsp;@v</div>"
                                    .replace(/@c/g, c_global_var)
                                    .replace(/@valueLabel/g, data.labels["globLower"])
                                    .replace(/@v/g, formatGlobalValue(result.dataBundle[timeIndex].globalLower));
                                message += "<div style='color: @c'><b>@valueLabel</b>:&emsp;@v</div>"
                                    .replace(/@c/g, c_global_var)
                                    .replace(/@valueLabel/g, data.labels["globUpper"])
                                    .replace(/@v/g, formatGlobalValue(result.dataBundle[timeIndex].globalUpper));
                            }
                            else{
                                message += "<div style='color: @c'><b>@valueLabel</b>:&emsp;@v</div>"
                                    .replace(/@c/g, c_mean)
                                    .replace(/@valueLabel/g, data.labels["segSlope"])
                                    .replace(/@v/g, formatGlobalValue(result.dataBundle[timeIndex].slope));
                                message += "<div style='color: @c'><b>@valueLabel</b>:&emsp;@v</div>"
                                    .replace(/@c/g, c_mean)
                                    .replace(/@valueLabel/g, data.labels["segIntercept"])
                                    .replace(/@v/g, formatGlobalValue(result.dataBundle[timeIndex].intercept));
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
    "@@chart_base/scripts/culture/wijmo.culture.@@lang.min.js".replace(/@@lang/g, lang), 
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
