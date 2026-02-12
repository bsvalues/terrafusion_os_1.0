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
    var colorLine = "#1976d2";
    var c_color = '#ffcc80';
    var colorHighlight = "#18ffff";
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
        var t_start = new Date(t0);
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
        var T = ts.length;
        if(!isNullOrUndefined(window.forecast) && forecast.length>0){
            T += forecast.length;
        }else if(!isNullOrUndefined(window.CC) && CC.length>0 && CC[0].forecast.length>0){
            T += CC[0].forecast.length;
        }

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
                var t = new Date(t0);
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
                tid  =p1;
            }
        }
        return tid;
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

    function getFormattedDate(date, allTimeStepsSameDay){
        var u = unit.toUpperCase();
        if(["SECONDS", "MINUTES", "HOURS", "DAYS"].indexOf(u) >= 0){
            if(allTimeStepsSameDay){
                var F = "HH:mm:ss";
                return "<b>@t</b>: ".replace("@t", labels["time"]) + wijmo.Globalize.format(date, F);
            }else{
                var F = "yyyy/MM/dd HH:mm:ss";
                return "<b>@t</b>: ".replace("@t", labels["datetime"]) + wijmo.Globalize.format(date, F);
            }
        }else if(["WEEKS", "MONTHS", "YEARS"].indexOf(u) >= 0){
            var F = "yyyy/MM/dd";
            return "<b>@t</b>: ".replace("@t", labels["date"]) + wijmo.Globalize.format(date, F);
        }else{
            return "<b>Time Step</b>: " + date.toString();
        }
    }
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
        var yMin = ts[0];
        var yMax = ts[0];
        var yMinLine = ts[0];
        var yMaxLine = ts[0];
        // get outliers
        var outliers = new Set();
        if(!isNullOrUndefined(window.outliers) && window.outliers.length>0){
            outliers = new Set(window.outliers);
        }

        // original data
        for(var i=0; i<ts.length; i+=1){
            var isOutlier = false;
            if(outliers.has(i)){
                isOutlier = true;
            }
            dataBundle.push({
                x: signalTimeSteps[i],
                y: ts[i],
                isOutlier: isOutlier
            });
        }
        var range = getValuesRange(ts);
        yMin = Math.min(yMin, range[0]);
        yMax = Math.max(yMax, range[1]);
        yMinLine = Math.min(yMinLine, range[0]);
        yMaxLine = Math.max(yMaxLine, range[1]);
        var resultBundle = {
            dataBundle: dataBundle,
            rawTime_last: signalTimeSteps[ts.length-1],
        };
        // forecasted data
        if(!isNullOrUndefined(window.forecast) && window.forecast.length>0)
        {
            var startInd = ts.length;
            var forecastBundle = [{x: signalTimeSteps[startInd-1], y: ts[startInd-1]}];
            for(var i=0; i<forecast.length; i+=1){
                forecastBundle.push({
                    x: signalTimeSteps[startInd+i],
                    y: forecast[i]
                });
            }
            resultBundle["forecastBundle"] = forecastBundle;
            range = getValuesRange(forecast);
            yMin = Math.min(yMin, range[0]);
            yMax = Math.max(yMax, range[1]);
            yMinLine = Math.min(yMinLine, range[0]);
            yMaxLine = Math.max(yMaxLine, range[1]);
        }
        // confidence interval of forecasted data
        if(!isNullOrUndefined(window.conf_int) && window.conf_int.length>0)
        {
            var startInd = ts.length;
            var confidBundle = [{x: signalTimeSteps[startInd-1], bottom: ts[startInd-1], ceiling: ts[startInd-1]}];
            for(var i=0; i<conf_int.length; i+=1){
                confidBundle.push({
                    x: signalTimeSteps[startInd+i],
                    bottom: conf_int[i][0],
                    ceiling: conf_int[i][1],
                });
                if(yMin > conf_int[i][0]){
                    yMin = conf_int[i][0];
                }
                if(yMax < conf_int[i][1]){
                    yMax = conf_int[i][1];
                }
            }
            resultBundle["confidBundle"] = confidBundle;
        }
        // mean of cluster that this signal belongs to
        if(!isNullOrUndefined(window.g_mean) && window.g_mean.length>0)
        {
            var bundle_g_mean = [];
            for(var i=0; i<g_mean.length; i+=1){
                bundle_g_mean.push({
                    x: signalTimeSteps[i],
                    y: g_mean[i],
                });
            }
            resultBundle["meanBundle"] = bundle_g_mean;
            range = getValuesRange(g_mean);
            yMin = Math.min(yMin, range[0]);
            yMax = Math.max(yMax, range[1]);
            yMinLine = Math.min(yMinLine, range[0]);
            yMaxLine = Math.max(yMaxLine, range[1]);
        }

        // medoid of cluster that this signal belongs to
        if(!isNullOrUndefined(window.g_medoid) && window.g_medoid.length>0)
        {
            var bundle_g_medoid = [];
            for(var i=0; i<g_medoid.length; i+=1){
                bundle_g_medoid.push({
                    x: signalTimeSteps[i],
                    y: g_medoid[i],
                });
            }
            resultBundle["medoidBundle"] = bundle_g_medoid;
            range = getValuesRange(g_medoid);
            yMin = Math.min(yMin, range[0]);
            yMax = Math.max(yMax, range[1]);
            yMinLine = Math.min(yMinLine, range[0]);
            yMaxLine = Math.max(yMaxLine, range[1]);
        }
        // fitted line of the raw value and OUTLIERS
        if(!isNullOrUndefined(window.fit) && window.fit.length>0)
        {
            var bundle_fit = [];
            var bundle_outliers_pos = [];
            var bundle_outliers_neg = [];
            var time_offset = ts.length - fit.length;
            for(var i=0; i<fit.length; i+=1){
                var real_timeStep = i + time_offset;
                bundle_fit.push({
                    x: signalTimeSteps[real_timeStep],
                    y: fit[i],
                });
                if(outliers.has(real_timeStep)){
                    if(ts[real_timeStep]>fit[i])
                    {
                        bundle_outliers_pos.push({
                            x: signalTimeSteps[real_timeStep],
                            y: ts[real_timeStep]
                        });
                    }else{
                        bundle_outliers_neg.push({
                            x: signalTimeSteps[real_timeStep],
                            y: ts[real_timeStep]
                        });
                    }
                }
            }
            resultBundle["fitBundle"] = bundle_fit;
            if(bundle_outliers_pos.length>0){
                resultBundle["outliersBundlePos"] = bundle_outliers_pos;
            }
            if(bundle_outliers_neg.length>0){
                resultBundle["outliersBundleNeg"] = bundle_outliers_neg;
            }

            range = getValuesRange(fit);
            yMin = Math.min(yMin, range[0]);
            yMax = Math.max(yMax, range[1]);
            yMinLine = Math.min(yMinLine, range[0]);
            yMaxLine = Math.max(yMaxLine, range[1]);
        }

        if(!isNullOrUndefined(window.CC) && window.CC.length>0) {
            compareCandidateBean.enabled = true;
            var forecastCandidates = [];
            var methodCount_forest = 1;
            var methodCount_exponential = 1;
            $.each(window.CC, function (ind, candidate) {
                var CB = {};
                var forecastStartInd = ts.length;
                // add additional forecast values
                var fB = [{x: signalTimeSteps[forecastStartInd-1], y: ts[forecastStartInd-1]}];
                for(var i=0; i<candidate.forecast.length; i+=1){
                    fB.push({
                        x: signalTimeSteps[forecastStartInd+i],
                        y: candidate.forecast[i]
                    });
                }
                CB["forecast"] = fB;
                if(candidate.forecast.length > 0){
                    range = getValuesRange(candidate.forecast);
                    yMin = Math.min(yMin, range[0]);
                    yMax = Math.max(yMax, range[1]);
                    yMinLine = Math.min(yMinLine, range[0]);
                    yMaxLine = Math.max(yMaxLine, range[1]);
                }

                // add additional fit values
                var fitB = [];
                var time_offset = ts.length - candidate.fit.length;
                for(var i=0; i<candidate.fit.length; i+=1){
                    fitB.push({
                        x: signalTimeSteps[i + time_offset],
                        y: candidate.fit[i],
                    });
                }
                CB["fit"] = fitB;
                if(candidate.fit.length>0){
                    range = getValuesRange(candidate.fit);
                    yMin = Math.min(yMin, range[0]);
                    yMax = Math.max(yMax, range[1]);
                    yMinLine = Math.min(yMinLine, range[0]);
                    yMaxLine = Math.max(yMaxLine, range[1]);
                }

                // add additional confidence interval values
                var cB = [{x: signalTimeSteps[forecastStartInd-1], bottom: ts[forecastStartInd-1], ceiling: ts[forecastStartInd-1]}];
                if(candidate.conf_int.length>0){
                    for(var i=0; i<candidate.conf_int.length; i+=1){
                        cB.push({
                            x: signalTimeSteps[forecastStartInd+i],
                            bottom: candidate.conf_int[i][0],
                            ceiling: candidate.conf_int[i][1],
                        });
                        if(yMin > candidate.conf_int[i][0]){
                            yMin = candidate.conf_int[i][0];
                        }
                        if(yMax < candidate.conf_int[i][1]){
                            yMax = candidate.conf_int[i][1];
                        }
                    }
                }else{
                    cB = null;
                }

                CB["conf_int"] = cB;
                CB["season"] = candidate.season;
                CB["method"] = candidate.method;
                // var seq = "@d.".replace(/@d/g, (ind + 1));
                if(!isNullOrUndefined(candidate.alias)){
                    CB["methodAlias"] = candidate.alias
                    if(candidate.method.indexOf(";")>0){
                        CB["methodNote"] = candidate.alias + ":" + candidate.method.substr(candidate.method.indexOf(";")+1);
                    }
                }else{
                    CB["methodAlias"] = candidate.method;
                }

                CB["best"] = candidate.best;
                if(candidate.best){
                    compareCandidateBean.ind_best = ind;
                }
                forecastCandidates.push(CB);
            });
            resultBundle["forecastCandidates"] = forecastCandidates;
        }

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
        if(ts.length<2){
            return;
        }
        // append chart container and the heads
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
        var showYRangeToggle = false;
        if((result.axY[1]-result.axY[0])/(result.axYLine[1]-result.axYLine[0]) > 2){
            showYRangeToggle = true;
        }
        var originalTimeSteps = ts.length;
        var hasPredictedData = false;
        if(!isNullOrUndefined(window.forecast) && forecast.length > 0){
            hasPredictedData = true;
        }else if(!isNullOrUndefined(window.CC) && CC.length>0 && CC[0].forecast.length>0)
        {
            hasPredictedData = true;
        }
        var toolTipVisibleRegion = {
            xMin: signalTimeSteps[0],
            xMax: signalTimeSteps[signalTimeSteps.length - 1],
            yMin: result.axY[0],
            yMax: result.axY[1],
            xMinCoord: 0,
            xMaxCoord: 0,
            yMinCoord: 0,
            yMaxCoord: 0,
        };
        // add Y axis range toggle to the chart
        if(showYRangeToggle){
            $("#timeseries_html_container")
                .prepend("<div class='container-fluid noselect'  " +
                    "style='color: @@fc; font-size: 12px; padding: 10px 0px 0px 40px; cursor: pointer;'>".replace(/@@fc/g, fontColor_global)+
                    "<input id='showYRangeToggle' type='checkbox' style='cursor: pointer'>"+
                    "<label for='showYRangeToggle' style='cursor: pointer'>Show Full Data Range</label>"+
                    "</div>");

            document.querySelector('#showYRangeToggle').addEventListener('click', e => {
                var showFullYRange = e.target.checked;
                if(!isNullOrUndefined(pltChart)){
                    if(showFullYRange){
                        pltChart.axisY.min = result.axY[0];
                        pltChart.axisY.max = result.axY[1];
                        toolTipVisibleRegion.yMin = result.axY[0];
                        toolTipVisibleRegion.yMax = result.axY[1];
                    }else{
                        pltChart.axisY.min = result.axYLineOpt[0];
                        pltChart.axisY.max = result.axYLineOpt[1];
                        toolTipVisibleRegion.yMin = result.axYLineOpt[0];
                        toolTipVisibleRegion.yMax = result.axYLineOpt[1];
                    }
                }
            });
        }

        // add forecast method to the chart
        if(!isNullOrUndefined(window.F_M)) {
            var FMethod = window.F_M;
            $("#timeseries_html_container")
                .prepend("<div id='timeseries_html_head' style='color: @@fc; font-size: 13px; padding-left: 30px'><b>Forecast Method: </b>@F_M</div>".replace(/@@fc/g, fontColor_global)
                    .replace("@F_M", FMethod))
        }
        // add full forest methods to the foot note:
        if(compareCandidateBean.enabled)
        {
            var forestMethodNotes = "";
            result.forecastCandidates.forEach(function(candidates){
                if(!isNullOrUndefined(candidates.methodNote)){
                    forestMethodNotes += "<div>@n</div>".replace(/@n/g, candidates.methodNote);
                }
            });
            if(forestMethodNotes.length > 0){
                $("#timeseries_html_container")
                    .append("<div id='timeseries_html_footnote' style='color: @@fc; font-size: 10px; padding: 10px 0px 10px 30px;'>@note</div>".replace(/@@fc/g, fontColor_global)
                        .replace("@note", forestMethodNotes))
            }

        }

        var fit_color = compareColors[0];
        var lineMarkerSize = 1.5;
        if(!isNullOrUndefined(window.cid)){
            c_color = classColors[(cid-1)%classColors.length];
            colorLine = c_color;
        }

        var series = [];
        series.push({
            name: labels["original"],
            itemsSource: result.dataBundle,
            bindingX: 'x',
            binding: 'y',
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
        });

        if(!isNullOrUndefined(window.fit) && fit.length > 0){
            series.push({
                name: labels["fit"],
                itemsSource: result.fitBundle,
                bindingX: 'x',
                binding: 'y',
                style: {
                    stroke: fit_color,
                    fill: fit_color,
                    "stroke-dasharray": "2, 1"
                },
                symbolStyle: {
                    stroke: fit_color,
                    fill: fit_color,
                    rx: lineMarkerSize,
                    ry: lineMarkerSize
                },
            });
        }
        if(!isNullOrUndefined(result.outliersBundlePos) && result.outliersBundlePos.length > 0){
            series.push({
                name: labels["otl_pos"],
                chartType: "Scatter",
                itemsSource: result.outliersBundlePos,
                bindingX: 'x',
                binding: 'y',
                symbolStyle: {
                    stroke: c_outliers[0],
                    fill: c_outliers[0],
                    rx: 3,
                    ry: 3
                },
            });
        }

        if(!isNullOrUndefined(result.outliersBundleNeg) && result.outliersBundleNeg.length > 0){
            series.push({
                name: labels["otl_neg"],
                chartType: "Scatter",
                itemsSource: result.outliersBundleNeg,
                bindingX: 'x',
                binding: 'y',
                symbolStyle: {
                    stroke: c_outliers[1],
                    fill: c_outliers[1],
                    rx: 3,
                    ry: 3
                },
            });
        }

        if(!isNullOrUndefined(window.conf_int) && conf_int.length > 0){
            series.push({
                name: labels['conf_int'],
                chartType: "Area",
                itemsSource: result.confidBundle,
                bindingX: 'x',
                binding: 'bottom,ceiling',
                style: {
                    fill: hex2rgbaStr(fit_color, 0.2),
                    stroke: 'transparent'
                },
            });
        }
        if(!isNullOrUndefined(window.forecast) && forecast.length > 0){
            series.push({
                name: labels["forecasted"],
                itemsSource: result.forecastBundle,
                bindingX: 'x',
                binding: 'y',
                style: {
                    stroke: fit_color,
                    // "stroke-dasharray": "2, 1"
                },
                symbolStyle: {
                    stroke: fit_color,
                    fill: fit_color,
                    rx: lineMarkerSize,
                    ry: lineMarkerSize
                },
            });
        }
        if(!isNullOrUndefined(window.g_mean) && g_mean.length > 0){
            series.push({
                name: labels["average"],
                chartType: "Line",
                itemsSource: result.meanBundle,
                bindingX: 'x',
                binding: 'y',
                style: {
                    stroke: c_color,
                    "stroke-dasharray": "4, 2",
                    "stroke-width": "1"
                },
            });
        }
        if(!isNullOrUndefined(window.g_medoid) && g_medoid.length > 0){
            series.push({
                name: "Medoid of Cluster",
                chartType: "Line",
                itemsSource: result.medoidBundle,
                bindingX: 'x',
                binding: 'y',
                style: {
                    stroke: '#a5d6a7',
                },
            });
        }

        var updateCompareCandidates = function (series) {
            if(isNullOrUndefined(series)){
                while (pltChart.series.length > compareCandidateBean.ind_begin_position){
                    pltChart.series.splice(pltChart.series.length - 1, 1);
                }
            }

            var linesToAppend_Fit = [];
            var linesToAppend_Forecast = [];
            var linesToAppend_ForecastBestInd = -1;
            var linesToAppend_Intv = [];
            compareCandidateBean.name_bestFit = null;
            compareCandidateBean.name_bestForecast = null;
            compareCandidateBean.name_bestIntv = null;
            compareCandidateBean.name_activeFit = null;
            compareCandidateBean.name_activeForecast = null;
            compareCandidateBean.name_activeIntv = null;
            compareCandidateBean.names_forecastLine = [];
            $.each(result.forecastCandidates, function (ind, candidate) {
                var bundle = {
                    name: candidate.methodAlias,
                    chartType: "Line",
                    itemsSource: candidate.forecast,
                    bindingX: 'x',
                    binding: 'y',
                    style: {
                        stroke: compareColors[ind%compareColors.length],
                        "stroke-width": "1.2",
                    },
                    symbolStyle: {
                        stroke: compareColors[ind%compareColors.length],
                        fill: compareColors[ind%compareColors.length],
                        rx: lineMarkerSize,
                        ry: lineMarkerSize
                    },
                };
                if(candidate.best || ind===compareCandidateBean.ind_active){
                    if(candidate.best){
                        bundle.name = "*" + bundle.name;
                        compareCandidateBean.name_bestForecast = bundle.name;
                        bundle.style["stroke-width"] = "2";
                        delete bundle.chartType;
                        linesToAppend_ForecastBestInd = linesToAppend_Forecast.length;
                    }else{
                        delete bundle.chartType;
                        compareCandidateBean.name_activeForecast = bundle.name;
                    }
                    linesToAppend_Forecast.push(bundle);
                    compareCandidateBean.names_forecastLine.push(bundle.name);

                    if(!isNullOrUndefined(candidate.fit)){
                        var name = bundle.name + "-" + labels["fit"];
                        if(candidate.best){
                            compareCandidateBean.name_bestFit = name;
                        }else{
                            compareCandidateBean.name_activeFit = name;
                        }
                        linesToAppend_Fit.push({
                            name: name,
                            itemsSource: candidate.fit,
                            bindingX: 'x',
                            binding: 'y',
                            style: {
                                stroke: compareColors[ind%compareColors.length],
                                "stroke-dasharray": "2, 1"
                            },
                            symbolStyle: {
                                stroke: compareColors[ind%compareColors.length],
                                fill: compareColors[ind%compareColors.length],
                                rx: lineMarkerSize,
                                ry: lineMarkerSize
                            },
                        });
                    }
                    if(!isNullOrUndefined(candidate.conf_int)){
                        var name = bundle.name + "-" + labels['conf_int'];
                        if(candidate.best){
                            compareCandidateBean.name_bestIntv = name;
                        }else{
                            compareCandidateBean.name_activeIntv = name;
                        }
                        linesToAppend_Intv.push({
                            name: name,
                            chartType: "Area",
                            itemsSource: candidate.conf_int,
                            bindingX: 'x',
                            binding: 'bottom,ceiling',
                            style: {
                                fill: hex2rgbaStr(compareColors[ind%compareColors.length], 0.2),
                                stroke: 'transparent'
                            },
                        });
                    }
                }
                else{
                    linesToAppend_Forecast.push(bundle);
                    compareCandidateBean.names_forecastLine.push(bundle.name)
                }
            });
            if(!isNullOrUndefined(series)){
                linesToAppend_Intv.forEach(function (d) {
                    series.push(d);
                });

                linesToAppend_Fit.forEach(function (d) {
                    series.push(d);
                });
                compareCandidateBean.candidateLegendInds = [];
                linesToAppend_Forecast.forEach(function (d) {
                    compareCandidateBean.candidateLegendInds.push(series.length);
                    series.push(d);
                });
            }else{
                linesToAppend_Intv.forEach(function (d) {
                    pltChart.series.push(new wijmo.chart.Series(d));
                });

                linesToAppend_Fit.forEach(function (d) {
                    pltChart.series.push(new wijmo.chart.Series(d));
                });
                compareCandidateBean.candidateLegendInds = [];
                linesToAppend_Forecast.forEach(function (d) {
                    compareCandidateBean.candidateLegendInds.push(pltChart.series.length);
                    pltChart.series.push(new wijmo.chart.Series(d));
                });
            }

        };

        if(compareCandidateBean.enabled){
            compareCandidateBean.ind_begin_position = series.length;
        }
        updateCompareCandidates(series);
        var legendPosition = chart.Position.Bottom;
        if (compareCandidateBean.enabled){
            legendPosition = chart.Position.Right;
        }
        var yMin = result.axY[0];
        var yMax = result.axY[1];
        if(showYRangeToggle){
            yMin = result.axYLineOpt[0];
            yMax = result.axYLineOpt[1];
            toolTipVisibleRegion.yMin = result.axYLineOpt[0];
            toolTipVisibleRegion.yMax = result.axYLineOpt[1];
        }
        pltChart = new chart.FlexChart('#timeseries_html_chart', {
            chartType: chart.ChartType.LineSymbols,
            axisY: {
                title: vn,
                axisLine: true,
                majorGrid: false,
                min: yMin,
                max: yMax,
            },
            series: series,
            legend: {
                position: legendPosition
            },
            tooltip:{
                threshold: 0,
                content: function(hit){
                    var item = hit.item;
                    if(!hasPredictedData){
                        if(hit.name === labels["original"]){
                            var hitName = hit.name;
                            return "<div>" +
                                "<div>@t</div>".replace(/@t/g, getFormattedDate(item.x, allTimeStepsSameDay)) +
                                "<div><b>@valueLabel</b>:\t@v</div>".replace(/@valueLabel/g, hitName).replace(/@v/g, formatGlobalValue(item.y)) +
                                "</div>";
                        }
                    }
                },
            },
            itemFormatter: function(engine, hit, defaultRenderer) {
                if (hit.x <= result["rawTime_last"]) {
                    if(hit.name === labels["forecasted"]
                        || hit.name === compareCandidateBean.name_bestForecast
                        || hit.name === compareCandidateBean.name_activeForecast){
                        engine.stroke = colorLine;
                    }
                }
                defaultRenderer();
            },
            rendering(s, e){
                if(hasPredictedData){
                    var annotations = new wijmo.chart.annotation.AnnotationLayer(s, [{
                        type: 'Line',
                        attachment: 'DataCoordinate',
                        start: {x: result.rawTime_last, y: s.axisY.min*2 - s.axisY.max},
                        end: {x: result.rawTime_last, y: s.axisY.max},
                        style: {
                            stroke: fontColor_global,
                            "stroke-dasharray": "3, 3",
                        }
                    }]);
                }
            },
            rendered: function(self){
                // update axis line color
                $.each(self.axisX.hostElement.querySelectorAll("line"), function (ind, line) {
                    $(line).attr("stroke", fontColor_global).attr('fill', 'none').removeClass('wj-line').removeClass('wj-tick');
                });
                $.each(self.axisY.hostElement.querySelectorAll("line"), function (ind, line) {
                    $(line).attr("stroke", fontColor_global).attr('fill', 'none').removeClass('wj-line').removeClass('wj-tick');
                });

                if(compareCandidateBean.enabled){
                    // find all the compare candidates related legend, add event listener to them
                    var g_elements = $(".wj-legend").children("g");
                    $.each(g_elements, function (ind, g_ele) {
                        try{
                            $(g_ele).attr("fill", fontColor_global);
                            $($(g_ele).find("text")).removeClass("wj-label");
                        }catch (e) {
                        }
                    });
                    $.each(compareCandidateBean.candidateLegendInds, function(ind, g_position){
                        if(g_position>=g_elements.length){
                            return;
                        }
                        var g = g_elements[g_position];
                        // $(g).attr("font-weight", "bold");
                        $(g).attr("fill", compareColors[ind%compareColors.length]);
                        // $($(g).find("text")).removeClass("wj-label")

                        if(ind === compareCandidateBean.ind_best || ind === compareCandidateBean.ind_active){
                            var legd = document.getElementsByClassName("wj-legend")[0];
                            var base = legd.getElementsByTagName("g")[g_position];
                            var SVGRect = base.getBBox();
                            var rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
                            var padding = 3;
                            rect.setAttribute("x", (SVGRect.x - padding).toString());
                            rect.setAttribute("y", (SVGRect.y - padding).toString());
                            rect.setAttribute("width", (SVGRect.width + padding * 2).toString());
                            rect.setAttribute("height", (SVGRect.height + padding * 2).toString());
                            rect.setAttribute("fill",
                                hex2rgbaStr(compareColors[ind%compareColors.length], 0.2));
                            legd.insertBefore(rect, base);
                        }

                        if(ind === compareCandidateBean.ind_best){
                            return;
                        }

                        $(g).attr("cursor", "pointer");
                        g.addEventListener('click', function(e){
                            if(compareCandidateBean.ind_active ===  ind){
                                compareCandidateBean.ind_active = -1;
                            }else{
                                compareCandidateBean.ind_active = ind;
                            }
                            updateCompareCandidates();
                        });
                    });
                }

                // retrieve all scatter points' svg element as ellipse,  and add the event listener for each one
                if(!hasPredictedData){
                    self.series.forEach(function(seriesItem){
                        var es = seriesItem.hostElement.querySelectorAll('ellipse');
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
                        var ls = seriesItem.legendElement.querySelectorAll('ellipse');
                        for(var i=0; i<ls.length; i+=1){
                            var ellipse = ls[i];
                            $(ellipse).attr("rx", 1.5).attr("ry", 1.5);
                        }
                    });
                }

                if(hasPredictedData){
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
                }

                // scroll to bottom
                $('html, body').scrollTop($(document).height());
                document.body.style.overflow = "auto";
            }
        });
        if(!isNullOrUndefined(window.t_mean)){
            pltChart.series.splice(0, 0, getHorizontalFunc("Data Mean", t_mean, "#ba68c8"));
        }
        if(!isNullOrUndefined(window.t_median)){
            pltChart.series.splice(1, 0, getHorizontalFunc("Data Median", t_median, "#f06292"));
        }

        if(hasPredictedData){
            // add a LineMarker
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
                                start: { x: t, y: result.axY[0] },
                                end: { x: t, y: result.axY[1] },
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
                                if(timeIndex < originalTimeSteps){
                                    // Add indicator
                                    if(timeIndex == originalTimeSteps - 1){
                                        var FSStr = "Forecast result starts from here";
                                        if(!isNullOrUndefined(labels["FSStr"]))
                                        {
                                            FSStr = labels["FSStr"];
                                        }
                                        message = "<div style='color:@@fc'><b>@@FSStr</b></div>".replace(/@@fc/g, fontColor_global).replace(/@@FSStr/g, FSStr) + message;
                                    }
                                    // Add original value
                                    var rawValue = result.dataBundle[timeIndex].y;
                                    message += "<div style='color: @c'><b>@valueLabel</b>:&emsp;@v</div>"
                                        .replace(/@c/g, colorLine)
                                        .replace(/@valueLabel/g, labels["original"])
                                        .replace(/@v/g, formatGlobalValue(rawValue));
                                    // Add fitted value
                                    if(!isNullOrUndefined(window.fit) && fit.length > 0){
                                        var fitLength = result.fitBundle.length;
                                        var fitInd = fitLength - originalTimeSteps + timeIndex;
                                        if(fitInd>=0 && fitInd<fitLength){
                                            var fittedValue = result.fitBundle[fitInd].y;
                                            message += "<div style='color: @c'><b>@valueLabel</b>:&emsp;@v</div>"
                                                .replace(/@c/g, fit_color)
                                                .replace(/@valueLabel/g, labels["fit"])
                                                .replace(/@v/g, formatGlobalValue(fittedValue));
                                            
                                            var c_out = c_outliers[2];
                                            if(result.dataBundle[timeIndex].isOutlier){
                                               c_out = rawValue > fittedValue ? c_outliers[0]: c_outliers[1];
                                            }
                                            message += "<div style='color: @c'><b>@valueLabel</b>:&emsp;@v</div>"
                                                   .replace(/@c/g, c_out)
                                                   .replace(/@valueLabel/g, labels["residual"])
                                                   .replace(/@v/g, formatGlobalValue(rawValue - fittedValue));
                                        }

                                    }else if(compareCandidateBean.enabled){
                                        var fit_str = [];
                                        fit_str.push("<div><b>@valueLabel:</b></div>".replace(/@valueLabel/g, labels["fit"]));
                                        $.each(result.forecastCandidates, function (ind, candidate) {
                                            if(ind!==compareCandidateBean.ind_best && ind!==compareCandidateBean.ind_active){
                                                return;
                                            }
                                            if(!isNullOrUndefined(candidate.fit)){
                                                var fitLength = candidate.fit.length;
                                                var fitInd = fitLength - originalTimeSteps + timeIndex;
                                                if(fitInd>=0 && fitInd<fitLength){
                                                    var name = candidate.methodAlias;
                                                    if(ind === compareCandidateBean.ind_best){
                                                        name = "*" + name;
                                                    }
                                                    fit_str.push("<div style='color: @c'>&emsp;@valueLabel:&emsp;@v</div>"
                                                        .replace(/@c/g, compareColors[ind%compareColors.length])
                                                        .replace(/@valueLabel/g, name)
                                                        .replace(/@v/g, formatGlobalValue(candidate.fit[fitInd].y)));
                                                }
                                            }
                                        });
                                        if(fit_str.length > 1){
                                            fit_str.forEach(function (s) {
                                                message += s;
                                            })
                                        }
                                    }
                                }else{
                                    // Add forecast value
                                    var forecastInd = timeIndex - originalTimeSteps + 1;
                                    var conf_str = [];
                                    if(!isNullOrUndefined(window.forecast) && window.forecast.length > 0){
                                        if(forecastInd>=0 && forecastInd<result.forecastBundle.length){
                                            message += "<div style='color: @c'><b>@valueLabel</b>:&emsp;@v</div>"
                                                .replace(/@c/g, fit_color)
                                                .replace(/@valueLabel/g, labels["forecasted"])
                                                .replace(/@v/g, formatGlobalValue(result.forecastBundle[forecastInd].y));
                                        }
                                    }else if(compareCandidateBean.enabled){
                                        var forecast_str = [];
                                        forecast_str.push("<div><b>@valueLabel:</b></div>".replace(/@valueLabel/g, labels["forecasted"]));
                                        conf_str.push("<div><b>@valueLabel:</b></div>".replace(/@valueLabel/g, labels["conf_int"]))
                                        $.each(result.forecastCandidates, function (ind, candidate) {
                                            var name = candidate.methodAlias;
                                            if(ind === compareCandidateBean.ind_best){
                                                name = "*" + name;
                                            }
                                            if(!isNullOrUndefined(candidate.forecast)){
                                                if(forecastInd>=0 && forecastInd<candidate.forecast.length){
                                                    forecast_str.push("<div style='color: @c'>&emsp;@valueLabel:&emsp;@v</div>"
                                                        .replace(/@c/g, compareColors[ind%compareColors.length])
                                                        .replace(/@valueLabel/g, name)
                                                        .replace(/@v/g, formatGlobalValue(candidate.forecast[forecastInd].y)));
                                                }
                                            }

                                            if(ind === compareCandidateBean.ind_best || ind === compareCandidateBean.ind_active){
                                                if(!isNullOrUndefined(candidate.conf_int)){
                                                    if(forecastInd>=0 && forecastInd<candidate.conf_int.length){
                                                        conf_str.push("<div style='color: @c'>&emsp;@valueLabel:&emsp;[@v1, @v2]</div>"
                                                            .replace(/@c/g, compareColors[ind%compareColors.length])
                                                            .replace(/@valueLabel/g, name)
                                                            .replace(/@v1/g, formatGlobalValue(candidate.conf_int[forecastInd].bottom))
                                                            .replace(/@v2/g, formatGlobalValue(candidate.conf_int[forecastInd].ceiling)));
                                                    }
                                                }
                                            }
                                        });
                                        if(forecast_str.length > 1){
                                            forecast_str.forEach(function (s) {
                                                message += s;
                                            })
                                        }
                                    }
                                    // Add confidence interval
                                    if(!isNullOrUndefined(window.conf_int) && window.conf_int.length > 0){
                                        if(forecastInd>=0 && forecastInd<result.confidBundle.length){
                                            message += "<div style='color: @c'><b>@valueLabel</b>:&emsp;[@v1, @v2]</div>"
                                                .replace(/@c/g, hex2rgbaStr(fit_color, 0.7))
                                                .replace(/@valueLabel/g, labels["conf_int"])
                                                .replace(/@v1/g, formatGlobalValue(result.confidBundle[forecastInd].bottom))
                                                .replace(/@v2/g, formatGlobalValue(result.confidBundle[forecastInd].ceiling));
                                        }
                                    }else if(conf_str.length > 1){
                                        conf_str.forEach(function (s) {
                                            message += s;
                                        })
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
