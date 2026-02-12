function isNullOrUndefined(val){
    return (val===null || val===undefined);
}

// JS format string
String.prototype.format = function () {
    var args = arguments;
    return this.replace(/{([0-9]+)}/g, function (match, index) {
        // check if the argument is present
        return typeof args[index] == 'undefined' ? match : args[index];
    });
};

function buildSVG(s) {
    var div= document.createElementNS('http://www.w3.org/1999/xhtml', 'div');
    div.innerHTML= '<svg xmlns="http://www.w3.org/2000/svg">'+s+'</svg>';
    var frag= document.createDocumentFragment();
    while (div.firstChild.firstChild)
        frag.appendChild(div.firstChild.firstChild);
    return frag;
}

const hexToRgb = hex =>
    hex.replace(/^#?([a-f\d])([a-f\d])([a-f\d])$/i
        , (m, r, g, b) => '#' + r + r + g + g + b + b)
        .substring(1).match(/.{2}/g)
        .map(x => parseInt(x, 16))

function hex2rgbaStr(hex, a) {
    if (hex[0] != "#") {
        return "rgba(0,0,0,@a)".replace(/@a/g, a);
    }
    var rgb = hexToRgb(hex);
    return "rgba(@r,@g,@b,@a)"
        .replace(/@r/g, rgb[0])
        .replace(/@g/g, rgb[1])
        .replace(/@b/g, rgb[2])
        .replace(/@a/g, a);
}

function getStandardDeviation (array, ddof = 1) {
    const n = array.length
    const mean = array.reduce((a, b) => a + b) / n
    return Math.sqrt(array.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b) / (n - ddof))
  }

function getMean(array) {
    return array.reduce((a, b) => a + b) / array.length;
}

function normalizeArray(array) {
    var std = getStandardDeviation(array);
    if(std === 0){
        return array;
    }
    res = array.map(x => x / std);
    var mean = getMean(res);
    return res.map(x => x - mean);
}

function execute() {

    var fontColor_global = "#848484";
    var color_grey = "#e0e0e0 ";
    var colorLine = "#E66100";
    var colorLine2 = "#5D3A9B";
    var color_ci = "#78AAFF"; 
    // var colorLine_light = "#ffcdd2";
    // var colorLine2_light = "#b2dfdb";
    var colorLine_light = color_grey;
    var colorLine2_light = color_grey;
    var colorLineOrange = "#ff9800"
    var colorLineSmooth = "#F26745";
    var c_color = '#ffcc80';
    var colorHighlight = "#18ffff";
    var c_outliers = ["#762a83", "#1b7837", "#848484"];
    if(g_popupTheme===2){
        colorLine = "#E66100";
        colorLine2 = "#ea80fc";
        fontColor_global = "#ededed";
        colorLineSmooth = "#F26745";
        c_outliers = ["#d500f9", "#76ff03", "#bdbdbd"];
    }

    var colorCategories = [
        [-0.9, 21.06, 29.42, 67.79, 100],
        [-0.8, 26.47, 55.53, 82.91, 100],
        [-0.7, 28.1, 80.26, 98.6, 100],
        [-0.6, 22.48, 105.37, 112.98, 100],
        [-0.5, 18.49, 130.77, 123.5, 100],
        [-0.4, 56.71, 154.15, 129.22, 100],
        [-0.3, 109.94, 173.57, 138.93, 100],
        [-0.2, 157.39, 191.98, 159.38, 100],
        [-0.1, 199.37, 211.86, 189.28, 100],
        [0, 237.86, 234.5, 225.77, 100],
        [0.1, 246.94, 230.94, 223.82, 100],
        [0.2, 235.12, 197.65, 179.5, 100],
        [0.3, 226.11, 164.02, 140.28, 100],
        [0.4, 216.37, 130.05, 111.96, 100],
        [0.5, 201.4, 97.73, 98.87, 100],
        [0.6, 179.84, 69.23, 96.29, 100],
        [0.7, 153.15, 44.93, 96.89, 100],
        [0.8, 121.89, 26.81, 94.52, 100],
        [0.9, 86.72, 19.34, 80.31, 100],
        [1, 52.07, 13.12, 53.39, 100]
    ]

    var container_id = "html_chart";
    if (!isNullOrUndefined(data.cid)){
        container_id = data.cid;
    }
    var annotationFocus = null;
    var annotationFocus_ts = null;
    var pltChart = null;
    var supportTime = ["SECONDS", "MINUTES", "HOURS", "DAYS", "WEEKS", "MONTHS", "YEARS"];
    var tsChart = null;

    function formatGlobalValue(value) {
        // should be 'e4' but the scientific notation is not supported by wijmo
        return wijmo.Globalize.format(value, 'g4');
    }
    
    function hitLagTest(minLag, maxLag, include0, value) {
        if(value <= minLag)
        {
            return 0;
        }else if(value >= maxLag){
            var ind = parseInt(maxLag - minLag);
            if(!include0 & minLag < 0){
                ind -= 1;
            }
            return ind;
        }
        var ind = parseInt(value - minLag);
        if((value - minLag - ind)>0.5){
            ind += 1;
        }
        if(!include0 & minLag < 0){
            if(value >= -1 && value <= 1)
            {
                if(value < 0){
                    ind = parseInt(-1 - minLag);
                }else
                {
                    ind = parseInt(0 - minLag);
                }
            }else if(value > 1)
            {
                ind -= 1;
            }
        }
        return ind;
    }

    function hitTimeTest(t, startInd = 0) {
        var maxStep = signalTimeSteps.length;
        if (t < signalTimeSteps[startInd]) {
            return 0;
        } else if (t > signalTimeSteps[maxStep - 1]) {
            return maxStep - 1 - startInd;
        }

        if (startInd != hitTimeTestStartInd) {
            signalTimeIntervals = [];
            for (var i = startInd; i < maxStep; i += 1) {
                signalTimeIntervals.push(signalTimeSteps[i] - signalTimeSteps[startInd]);
            }
            hitTimeTestStartInd = startInd;
        }
        var dt = t - signalTimeSteps[startInd];

        var p0 = 0, p1 = signalTimeIntervals.length;
        var tid = -1;
        while (p1 - p0 > 1) {
            var mid = parseInt((p0 + p1) / 2);
            var vMid = signalTimeIntervals[mid];
            if (dt == vMid) {
                tid = mid;
                break;
            } else if (dt < vMid) {
                p1 = mid;
            } else {
                p0 = mid;
            }
        }
        if (tid == -1) {
            if ((dt - signalTimeIntervals[p0]) < (signalTimeIntervals[p1] - dt)) {
                tid = p0;
            } else {
                tid = p1;
            }
        }
        return tid;
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
        if(isNullOrUndefined(data.ts1) || data.ts1.length==0){
            return [];
        }
        var timeSteps = [];
        var T = data.ts1.length;

        if(data.unit=="MONTHS")
        {
            var timeDelta = data.intv;
            for(var i=0; i<T; i+=1){
                timeSteps.push(getLegalDate(0, i*timeDelta));
            }
        }else if(data.unit=="YEARS"){
            var timeDelta = data.intv;
            for(var i=0; i<T; i+=1){
                timeSteps.push(getLegalDate(i*timeDelta, 0));
            }
        }else if(supportTime.indexOf(data.unit)>=0){
            var timeDelta = data.intv;
            if(data.unit == "MINUTES"){
                timeDelta = timeDelta * 60;
            }else if(data.unit == "HOURS"){
                timeDelta = timeDelta * 60 * 60;
            }else if(data.unit == "DAYS"){
                timeDelta = timeDelta * 60 * 60 * 24;
            }else if(data.unit == "WEEKS"){
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
    var hitTimeTestStartInd = -1;

    function getFormattedDate(date, allTimeStepsSameDay){
        var u = data.unit.toUpperCase();
        if(["SECONDS", "MINUTES", "HOURS"].indexOf(u) >= 0){
            if(allTimeStepsSameDay){
                var F = "HH:mm:ss";
                return "<b>@t</b>: ".replace("@t", data.labels["time"]) + wijmo.Globalize.format(date, F);
            }else{
                var F = "yyyy/MM/dd HH:mm:ss";
                return "<b>@t</b>: ".replace("@t", data.labels["datetime"]) + wijmo.Globalize.format(date, F);
            }
        }else if(["DAYS", "WEEKS", "MONTHS", "YEARS"].indexOf(u) >= 0){
            var F = "yyyy/MM/dd";
            return "<b>@t</b>: ".replace("@t", data.labels["date"]) + wijmo.Globalize.format(date, F);
        }else{
            return "<b>Time Step</b>: " + date.toString();
        }
    }
    function getValuesRange(values, values2=null, extendRatio=0){
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
        if(!isNullOrUndefined(extendRatio) && extendRatio > 0){
            var diff = (max - min) * extendRatio;
            min = min - diff;
            max = max + diff;
        }
        if(min == max){
            min = min - 1;
            max = max + 1;
        }
        return [min, max];
    }

    function prepareData(){

        // Extract the correlation dataset
        var lag = data.lag0;
        var includeLag0 = data.include0;
        if(isNullOrUndefined(data.show_ci) || !data.show_ci)
        {
            data.show_ci = false;
        }

        var pointBundle = [];
        var confidBundle = [];
        var absMaxY = -10;
        const BOUNDRY_SHIFT = 1.96 / Math.sqrt(data.num_t);

        for(var i=0; i<data.corrs.length; i+=1){
            if(!includeLag0 && lag==0){
                lag += 1;
            }
            var y = data.corrs[i];
            if(!isNullOrUndefined(y)){
                if (y > 1){
                    y = 1;
                }else if(y < -1){
                    y = -1;
                }
                if(Math.abs(y) > absMaxY){
                    absMaxY = Math.abs(y);
                }
                pointBundle.push({
                    x: lag,
                    y: y,
                    c: "red",
                    isAbsMax: false
                });
                if(data.show_ci){
                    let ci_low = y - BOUNDRY_SHIFT < -1? -1: y - BOUNDRY_SHIFT;
                    let ci_high = y + BOUNDRY_SHIFT > 1? 1: y + BOUNDRY_SHIFT;
                    confidBundle.push({
                        x: lag,
                        "bottom": ci_low,
                        "ceiling": ci_high,
                    });
                }
            }
            lag += 1;
        }
        pointBundle.forEach(function (p) {
            if (p.y == absMaxY || p.y == -absMaxY) {
                p.isAbsMax = true;
            }
        });
        var resultBundle = {
            correlation:{
                pointBundle: pointBundle,
                range_x: [data.lag0, lag-1],
                range_y: getValuesRange(data.corrs)
            }
        };
        if (!isNullOrUndefined(data.ts1)){
            // Extract the time series dataset
            var dataBundle1 = [];
            var dataBundle2 = [];

            var _ts2 = data.ts2;
            if(isNullOrUndefined(data.ts2) || data.ts2.length!=data.ts1.length){
                _ts2 = data.ts1;
            }

            for(var i=0; i<data.ts1.length; i+=1){
                dataBundle1.push({
                    x: signalTimeSteps[i],
                    y: data.ts1[i],
                });
                dataBundle2.push({
                    x: signalTimeSteps[i],
                    y: _ts2[i],
                });
            }

            var pwDataBundle1 = [];
            var pwDataBundle2 = [];
            var pwRange_y1 = [];
            var pwRange_y2 = [];
            var pwValidStartInd = null;
            
            if(!isNullOrUndefined(data.pw_coefs) && data.pw_coefs.length>0){
                var l_coef = data.pw_coefs.length;
                pwValidStartInd = l_coef - 1;
                const do2 = !isNullOrUndefined(data.ts2) && data.ts2.length==data.ts1.length;
                var Ys = [];
                var Y2s = [];
                var nm_ts1 = normalizeArray(data.ts1);
                var nm_ts2 = do2 ? normalizeArray(data.ts2) : [];

                for(var i = l_coef-1; i < nm_ts1.length; i += 1){
                    var y = 0;
                    for(var j=0; j<l_coef; j+=1){
                        y += data.pw_coefs[j] * nm_ts1[i-j];
                    }
                    pwDataBundle1.push({
                        x: signalTimeSteps[i],
                        y: y,
                    });
                    Ys.push(y);
                    if(do2){
                        var y2 = 0;
                        for(var j=0; j<l_coef; j+=1){
                            y2 += data.pw_coefs[j] * nm_ts2[i-j];
                        }
                        pwDataBundle2.push({
                            x: signalTimeSteps[i],
                            y: y2,
                        });
                        Y2s.push(y2);
                    }else{
                        pwDataBundle2.push({
                            x: signalTimeSteps[i],
                            y: y,
                        });
                        Y2s.push(y);
                    }
                }
                pwRange_y1 = getValuesRange(Ys, null, 0.05);
                pwRange_y2 = getValuesRange(Y2s, null, 0.05);
            }

            resultBundle["time_series"] = {
                dataBundle1: dataBundle1,
                dataBundle2: dataBundle2,
                pwDataBundle1: pwDataBundle1,
                pwDataBundle2: pwDataBundle2,
                range_x: [signalTimeSteps[0], signalTimeSteps[signalTimeSteps.length-1]],
                range_y1: getValuesRange(data.ts1, null, 0.05),
                range_y2: getValuesRange(_ts2, null, 0.05),
                pwRange_y1: pwRange_y1,
                pwRange_y2: pwRange_y2,
                pwValidStartInd: pwValidStartInd,
            };
        }
        if(data.show_ci){
            resultBundle.correlation.confidBundle = confidBundle;
        }
        return resultBundle;
    }

    function rez(){
        var w = window.innerWidth - 40;
        if(w < 300){
            w = 300;
        }

        var h = parseInt(w *0.25);
        if(h > 250){
            h = 250;
        }
        var window_h = window.innerHeight;
        if(window_h > 160 && h * 2 > window_h){
            h = window_h / 2 - 60;
        }
        var target = $("#sstsc_popup");
        if(w>600){
            target.css("width", "95%")
        }
        target.width(w);
        target.height(h);

        if(!isNullOrUndefined(tsChart)){
            var target_ts = $("#sstsc_popup_ts");
            if(w>600){
                target_ts.css("width", "95%")
            }
            target_ts.width(w);
            target_ts.height(h);
            if(!isNullOrUndefined(tsChart)){
                tsChart.refresh();
            }
        }
        
    }

    function plot(){
        var containerStr = "<div id='sstsc_popup' class='custom-gridlines' style='font-family: Verdana; width: 100%; min-width: 300px;background-color: transparent;font-size: 10px;'></div>";
        $("body").append(containerStr);
        var containerStr = "<div id='sstsc_popup_ts' class='custom-gridlines' style='font-family: Verdana; width: 100%; min-width: 300px;background-color: transparent;font-size: 10px;'></div>";
        $("body").append(containerStr);
        rez();
        var chart = wijmo.chart;
        var result = prepareData();
        var focusedTimeLag = null;
        var first_time_render = true;
        var showPreWhitenData = false;
        var xTitle = "Time Step of the Secondary Variable";
        if(!isNullOrUndefined(data.labels["xlabel"])){
            xTitle = data.labels["xlabel"];
        }
        var xTitleTime = "Date/Time";
        if(!isNullOrUndefined(data.labels["date_time"])){
            xTitleTime = data.labels["date_time"];
        }
        function updateFocusedTimeLag(tl){
            if(isNullOrUndefined(tsChart))
            {
                return;
            }
            if(tl == focusedTimeLag){
                return;
            }
            bundle1 = [];
            bundle2 = [];
            var sourceDataBundle1 = showPreWhitenData? result.time_series.pwDataBundle1 : result.time_series.dataBundle1;
            var sourceDataBundle2 = showPreWhitenData? result.time_series.pwDataBundle2 : result.time_series.dataBundle2;
            var startInd = showPreWhitenData? result.time_series.pwValidStartInd : 0;
            if(isNullOrUndefined(tl)){
                tsChart.axisX.title = xTitleTime;
                sourceDataBundle1.forEach((d, ind) => {
                    d.x = signalTimeSteps[ind + startInd];
                    bundle1.push(d);
                });
                sourceDataBundle2.forEach((d, ind) => {
                    d.x = signalTimeSteps[ind + startInd];
                    bundle2.push(d);
                });
            }
            else
            {
                tsChart.axisX.title = xTitle;
                sourceDataBundle1.forEach((d, ind) => {
                    d.x = ind - tl;
                    bundle1.push(d);
                });
                sourceDataBundle2.forEach((d, ind) => {
                    d.x = ind;
                    bundle2.push(d);
                });
               
            }
            focusedTimeLag = tl;
            tsChart.series[0].itemsSource = bundle1;
            tsChart.series[1].itemsSource = bundle2;
            // tsChart.refresh();
        }

        // code to extract color values from layer info, delete later
        // var c0 = -9;
        // var ss = "";
        // breaks.forEach((b) => {
        //     values = [c0/10].concat(b.symbol.symbol.symbolLayers[1].color.values);
        //     ss += `[${values}],\n`;
        // c0 += 1;
        // })
        // console.log(ss);
        var toolTipVisibleRegion = {
            xMin: result.correlation.range_x[0] - 0.5,
            xMax: result.correlation.range_x[1] + 0.5,
            yMin: -1,
            yMax: 1,
            xMinCoord: 0,
            xMaxCoord: 0,
            yMinCoord: 0,
            yMaxCoord: 0,
        };

        var series = [];
        const corr_ind = data.show_ci ? 1 : 0;
        if (data.show_ci) {
            series.push({
                name: "Confidence Interval",
                chartType: "Area",
                itemsSource: result.correlation.confidBundle,
                bindingX: 'x',
                binding: 'bottom,ceiling',
                style: {
                    fill: hex2rgbaStr(color_ci, 0.2),
                    stroke: hex2rgbaStr(color_ci, 0.3),
                    strokeWidth: 1,
                },
            });
        }
        series.push({
            name: "Correlation Value",
            itemsSource: result.correlation.pointBundle,
            bindingX: 'x',
            binding: 'y',
            // style: {
            //     strokeWidth: 1,
            //     stroke: 'rgba(0,0,0,0.15)',
            //     fill: 'rgba(0,0,0,0.5)'
            // },
            // symbolSize: 8
        });

        pltChart = new chart.FlexChart('#sstsc_popup', {
            // chartType: 'Scatter',
            axisX: {
                title: "Time Lag",
                origin: 0,
                min: result.correlation.range_x[0] - 0.5,
                max: result.correlation.range_x[1] + 0.5,
                axisLine: true,
                majorGrid: true,
                majorTickMarks: 'Cross',
                majorUnit: 1,
                // minorGrid: true,
                // minorTickMarks: 'Cross',
                // minorUnit: 1,
            },
            axisY: {
                title: "Time Series Correlation",
                axisLine: true,
                // majorGrid: false,
                min: -1.01,
                max: 1.01,
                // format: 'c0',
                axisLine: true,
                majorGrid: true,
                majorTickMarks: 'Cross',
                majorUnit: 0.5,
                minorGrid: true,
                minorTickMarks: 'None',
                minorUnit: 0.1,
            },
            // itemsSource: result.correlation.pointBundle,
            // bindingX: 'x',
            tooltip:{
                threshold: 8,
                content: (hit) =>{
                    return null;
                }
            },
            series: series,
            itemFormatter: (engine, ht, defaultRenderer) => {
                if(isNullOrUndefined(ht.item.y))
                {
                    return;
                }
                var y = ht.item.y;
                var stage = parseInt((y+0.9) * 10);
                if(stage < 0){
                    stage = 0;
                }else if(stage > colorCategories.length-1){
                    stage = colorCategories.length-1;
                }
                engine.fill = `rgba(${colorCategories[stage][1]},${colorCategories[stage][2]},${colorCategories[stage][3]},0.8)`;
                
                if(ht.item.isAbsMax)
                {
                    engine.stroke = "#ffd500";
                    engine.strokeWidth = 2;
                }
                else{
                    if(y < 0){
                        engine.stroke = `rgba(${colorCategories[0][1]},${colorCategories[0][2]},${colorCategories[0][3]},0.6)`;
                    }else if(y > 0){
                        stage = colorCategories.length-1;
                        engine.stroke = `rgba(${colorCategories[stage][1]},${colorCategories[stage][2]},${colorCategories[stage][3]},0.6)`; 
                    }else{
                        engine.stroke = 'rgba(0, 0, 0, 0.6)';
                    }
                    engine.strokeWidth = 1;
                }
                
                
                defaultRenderer();
            },
            legend: {
                // position: 'Bottom',
                position: wijmo.chart.Position.None,
            },

            rendered: function(self){
                // update axis line color
                $.each(self.axisX.hostElement.querySelectorAll("line"), function (ind, line) {
                    $(line).attr("stroke", fontColor_global).attr('fill', 'none').removeClass('wj-line').removeClass('wj-tick');
                });
                $.each(self.axisY.hostElement.querySelectorAll("line"), function (ind, line) {
                    $(line).attr("stroke", fontColor_global).attr('fill', 'none').removeClass('wj-line').removeClass('wj-tick');
                });
                var hostEle = pltChart.hostElement;
                var offsetX = hostEle.offsetLeft + parseInt($(hostEle).css("padding-left"));
                var offsetY = hostEle.offsetTop + parseInt($(hostEle).css("padding-top"));
                toolTipVisibleRegion.xMinCoord = pltChart.axisX.convert(toolTipVisibleRegion.xMin) - 5 + offsetX;
                toolTipVisibleRegion.xMaxCoord = pltChart.axisX.convert(toolTipVisibleRegion.xMax) + 5 + offsetX;
                toolTipVisibleRegion.yMinCoord = pltChart.axisY.convert(toolTipVisibleRegion.yMax) + offsetY;
                toolTipVisibleRegion.yMaxCoord = pltChart.axisY.convert(toolTipVisibleRegion.yMin) + offsetY;
                pltChart.addEventListener(pltChart.hostElement, 'mousemove', function (e) {
                    var eX = e.x + window.pageXOffset;
                    var eY = e.y + window.pageYOffset;
                    if (lm.isVisible) {
                        if (eX < toolTipVisibleRegion.xMinCoord
                            || eX > toolTipVisibleRegion.xMaxCoord
                            || eY < toolTipVisibleRegion.yMinCoord
                            || eY > toolTipVisibleRegion.yMaxCoord) {
                            lm.isVisible = false;
                            annotationFocus.items.clear();
                            if (!isNullOrUndefined(previous_focusedLag) && previous_focusedLag >= 0 && pltChart.series[corr_ind].hostElement.children.length > previous_focusedLag) {
                                var strokeWidth = result.correlation.pointBundle[previous_focusedLag].isAbsMax ? 2 : 1;
                                pltChart.series[corr_ind].hostElement.children[previous_focusedLag].children[0].setAttribute("stroke-width", strokeWidth);
                                pltChart.series[corr_ind].hostElement.children[previous_focusedLag].children[0].setAttribute("stroke", previous_focusedStroke);
                            }
                            updateFocusedTimeLag(null);
                        }
                    } else {
                        if (eX >= toolTipVisibleRegion.xMinCoord
                            && eX <= toolTipVisibleRegion.xMaxCoord
                            && eY >= toolTipVisibleRegion.yMinCoord
                            && eY <= toolTipVisibleRegion.yMaxCoord) {
                            lm.isVisible = true;
                            previous_focusedLag = -1;
                            updateFocusedTimeLag(0);
                        }
                    }
                });
                pltChart.addEventListener(pltChart.hostElement, 'mouseleave', function () {
                    lm.isVisible = false;
                    annotationFocus.items.clear();
                    if (!isNullOrUndefined(previous_focusedLag) && previous_focusedLag >= 0 && pltChart.series[corr_ind].hostElement.children.length > previous_focusedLag) {
                        var strokeWidth = result.correlation.pointBundle[previous_focusedLag].isAbsMax ? 2 : 1;
                        pltChart.series[corr_ind].hostElement.children[previous_focusedLag].children[0].setAttribute("stroke-width", strokeWidth);
                        pltChart.series[corr_ind].hostElement.children[previous_focusedLag].children[0].setAttribute("stroke", previous_focusedStroke);
                    }
                    updateFocusedTimeLag(null);
                });

                // scroll to bottom
                $('html, body').scrollTop($(document).height());
                document.body.style.overflow = "auto";
            }
        });
        // add a LineMarker
        var previous_focusedLag = -1;
        var previous_focusedMessage = "";
        var previous_focusedStroke = null;
        if (annotationFocus == null) {
            annotationFocus = new wijmo.chart.annotation.AnnotationLayer(pltChart);
        }
        var lm = new chart.LineMarker(pltChart, {
            isVisible: false,
            lines: 'None',
            interaction: 'Move',
            content: (ht) => {
                var yUnit = pltChart.axisY.convertBack(0) - pltChart.axisY.convertBack(1);
                var cursorTime = pltChart.axisX.convertBack(ht.point.x);
                var lagIndex = hitLagTest(result.correlation.range_x[0], result.correlation.range_x[1], data.include0, cursorTime);
                if (lagIndex >= 0 && lagIndex < result.correlation.pointBundle.length && lm.isVisible) {
                    var lag = result.correlation.pointBundle[lagIndex].x;
                    if (lagIndex === previous_focusedLag) {
                        return previous_focusedMessage;
                    } 
                    else 
                    {   
                        updateFocusedTimeLag(lag);
                        annotationFocus.items.clear();
                        if (previous_focusedLag >= 0 && pltChart.series[corr_ind].hostElement.children.length > previous_focusedLag) {
                            strokeWidth = result.correlation.pointBundle[previous_focusedLag].isAbsMax ? 2 : 1;
                            pltChart.series[corr_ind].hostElement.children[previous_focusedLag].children[0].setAttribute("stroke-width", strokeWidth);
                            pltChart.series[corr_ind].hostElement.children[previous_focusedLag].children[0].setAttribute("stroke", previous_focusedStroke);
                        }

                        // add the reference line
                        var y = result.correlation.pointBundle[lagIndex].y;
                        if (y < 0) {
                            y += yUnit * 4;
                            y = Math.min(y, 0);
                        }else if (y > 0) {
                            y -= yUnit * 4;
                            y = Math.max(y, 0);
                        }
                        if(pltChart.series[corr_ind].hostElement.children.length > lagIndex){
                            pltChart.series[corr_ind].hostElement.children[lagIndex].children[0].setAttribute("stroke-width", 2);
                            previous_focusedStroke = pltChart.series[corr_ind].hostElement.children[lagIndex].children[0].getAttribute("stroke");
                            pltChart.series[corr_ind].hostElement.children[lagIndex].children[0].setAttribute("stroke", colorHighlight);
                        }
                        // prepare the message here
                        // message = "<div style='color:@@fc'><b>@@FSStr</b></div>".replace(/@@fc/g, fontColor_global).replace(/@@FSStr/g, FSStr) + message;
                        message = "<div style='color: @c'><b>@valueLabel</b>:&emsp;@v</div>"
                                .replace(/@c/g, fontColor_global)
                                .replace(/@valueLabel/g, "Time Lag")
                                .replace(/@v/g, formatGlobalValue(lag));
                                message += "<div style='color: @c'><b>@valueLabel</b>:&emsp;@v</div>"
                                .replace(/@c/g, fontColor_global)
                                .replace(/@valueLabel/g, "Correlation")
                                .replace(/@v/g, formatGlobalValue(result.correlation.pointBundle[lagIndex].y));
                        
                        if(data.show_ci){
                            message += "<div style='color: @c'><b>@valueLabel</b>:&emsp;@v</div>"
                            .replace(/@c/g, fontColor_global)
                            .replace(/@valueLabel/g, "Lower 95% Confidence Bound")
                            .replace(/@v/g, formatGlobalValue(result.correlation.confidBundle[lagIndex].bottom));
                            message += "<div style='color: @c'><b>@valueLabel</b>:&emsp;@v</div>"
                            .replace(/@c/g, fontColor_global)
                            .replace(/@valueLabel/g, "Upper 95% Confidence Bound")
                            .replace(/@v/g, formatGlobalValue(result.correlation.confidBundle[lagIndex].ceiling));
                        }

                        previous_focusedLag = lagIndex;
                        previous_focusedMessage = message;
                        return message;

                    }
                } else {
                    annotationFocus.items.clear();
                    return "Tool tip";
                }
            }
        });

        // code for draw the second time series data //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
        if(!isNullOrUndefined(result.time_series)){
            var d0 = signalTimeSteps[0];
            var d1 = signalTimeSteps[signalTimeSteps.length-1];
            var allTimeStepsSameDay = false;
            if(d0.getFullYear()==d1.getFullYear() && d0.getMonth()==d1.getMonth() && d0.getDate()==d1.getDate()){
                allTimeStepsSameDay = true;
            }
            var lineMarkerSize = 6;
            if (signalTimeSteps.length > 300) {
                lineMarkerSize = 0;
            }else if (signalTimeSteps.length > 150) {
                lineMarkerSize = 2;
            }else if(signalTimeSteps.length > 50) {
                lineMarkerSize = 4;
            } 
            
            var series_ts = [
                {
                    name: data.labels["var1"],
                    itemsSource: result.time_series.dataBundle1,
                    bindingX: 'x',
                    binding: 'y',
                    style: {
                        stroke: colorLine,
                        fill: colorLine,
                    },
                    symbolSize: lineMarkerSize,
                    // symbolStyle: {
                    //     stroke: colorLine,
                    //     fill: colorLine,
                    //     rx: lineMarkerSize,
                    //     ry: lineMarkerSize
                    // },
                },
                {
                    name: data.labels["var2"],
                    itemsSource: result.time_series.dataBundle2,
                    bindingX: 'x',
                    binding: 'y',
                    style: {
                        stroke: colorLine2,
                        fill: colorLine2,
                    },
                    symbolSize: lineMarkerSize,
                    // symbolStyle: {
                    //     stroke: colorLine2,
                    //     fill: colorLine2,
                    //     rx: lineMarkerSize,
                    //     ry: lineMarkerSize
                    // },
                },
            ];
            // set the separate Y axis if needed
            if(data.labels.var1 != data.labels.var2){
                var axisY2 = new chart.Axis();
                axisY2.position = chart.Position.Right;
                axisY2.title = data.labels.var2;
                axisY2.min = result.time_series.range_y2[0];
                axisY2.max = result.time_series.range_y2[1];
                axisY2.axisLine = true;
                series_ts[1].axisY = axisY2;
            }
    
            var showPreWhitenDataToggle = false;
            if(result.time_series.pwDataBundle1.length > 0){
                showPreWhitenDataToggle = true;
            }
            if (showPreWhitenDataToggle) {
                var label = "Show detrended and filtered time series";
                if(!isNullOrUndefined(data.labels.pwl))
                {
                    label = data.labels.pwl;
                }
                $("<div class='container-fluid noselect' " +
                        "style='font-family: Verdana; color: @@fc; font-size: 12px; padding: 10px 0px 0px 40px; cursor: pointer;'>".replace(/@@fc/g, fontColor_global) +
                        "<input id='showPreWhitenDataToggle' type='checkbox' style='cursor: pointer'>" +
                        `<label for='showPreWhitenDataToggle' style='cursor: pointer'>${label}</label>` +
                        "</div>").insertBefore("#sstsc_popup_ts");
                document.querySelector('#showPreWhitenDataToggle').addEventListener('click', e => {
                    showPreWhitenData = e.target.checked;
                    if (!isNullOrUndefined(tsChart)) {
                        var sourceDataBundle1 = showPreWhitenData ? result.time_series.pwDataBundle1 : result.time_series.dataBundle1;
                        var sourceDataBundle2 = showPreWhitenData ? result.time_series.pwDataBundle2 : result.time_series.dataBundle2;
                        var range_y1 = showPreWhitenData ? result.time_series.pwRange_y1 : result.time_series.range_y1;
                        var range_y2 = showPreWhitenData ? result.time_series.pwRange_y2 : result.time_series.range_y2;
                        tsChart.series[0].itemsSource = sourceDataBundle1;
                        tsChart.series[1].itemsSource = sourceDataBundle2;
                        tsChart.axisY.min = range_y1[0];
                        tsChart.axisY.max = range_y1[1];
                        if(data.labels.var1 != data.labels.var2){
                            tsChart.series[1].axisY.min = range_y2[0];
                            tsChart.series[1].axisY.max = range_y2[1];
                        }
                        if(!isNullOrUndefined(toolTipVisibleRegion_ts)){
                            toolTipVisibleRegion_ts.xMin = signalTimeSteps[signalTimeSteps.length - sourceDataBundle1.length];
                            toolTipVisibleRegion_ts.xMax = signalTimeSteps[signalTimeSteps.length - 1];
                            toolTipVisibleRegion_ts.yMin = range_y1[0] < range_y2[0] ? range_y1[0] : range_y2[0];
                            toolTipVisibleRegion_ts.yMax = range_y1[1] > range_y2[1] ? range_y1[1] : range_y2[1];
                        }
                        updateFocusedTimeLag(null);
                    }
    
                        
                });
            }
    
            var toolTipVisibleRegion_ts = {
                xMin: signalTimeSteps[0],
                xMax: signalTimeSteps[signalTimeSteps.length - 1],
                yMin: result.time_series.range_y1[0],
                yMax: result.time_series.range_y1[1],
                xMinCoord: 0,
                xMaxCoord: 0,
                yMinCoord: 0,
                yMaxCoord: 0,
            };
    
            var legendPosition = chart.Position.Bottom;
            tsChart = new chart.FlexChart('#sstsc_popup_ts', {
                chartType: chart.ChartType.LineSymbols,
                // chartType: chart.ChartType.Scatter,
                // chartType: chart.ChartType.Line,
                axisY: {
                    title: data.labels["var1"],
                    axisLine: true,
                    majorGrid: false,
                    min: result.time_series.range_y1[0],
                    max: result.time_series.range_y1[1],
                },
                axisX: {
                    title: xTitleTime,
                },
                series: series_ts,
                legend: {
                    position: legendPosition
                },
                tooltip:{
                    threshold: 0,
                    content: function(hit){
                        return null;
                    },
                },
                itemFormatter: function(engine, hit, defaultRenderer) {
                    if(!isNullOrUndefined(focusedTimeLag))
                    {
                        if (hit.name === data.labels["var1"]) {
                            if (focusedTimeLag > 0 && hit.x < 0) {
                                engine.stroke = colorLine_light;
                                engine.fill = colorLine_light;
                                var y1 = tsChart.series[0].itemsSource[hit.pointIndex].y;
                                var y2 = tsChart.series[0].itemsSource[hit.pointIndex + 1].y;
                                var pt1 = tsChart.dataToPoint(hit.pointIndex - focusedTimeLag, y1), pt2 = tsChart.dataToPoint(hit.pointIndex + 1 - focusedTimeLag, y2);
                                engine.drawLine(pt1.x, pt1.y, pt2.x, pt2.y, null, {
                                    stroke: colorLine_light,
                                    strokeWidth: 2.5,
                                });
    
                            } else if (focusedTimeLag < 0 && hit.x >= tsChart.series[0].itemsSource.length) {
                                engine.stroke = colorLine_light;
                                engine.fill = colorLine_light;
                                var y1 = tsChart.series[0].itemsSource[hit.pointIndex].y;
                                var y2 = tsChart.series[0].itemsSource[hit.pointIndex - 1].y;
                                var pt1 = tsChart.dataToPoint(hit.pointIndex - focusedTimeLag, y1), pt2 = tsChart.dataToPoint(hit.pointIndex - 1 - focusedTimeLag, y2);
                                engine.drawLine(pt1.x, pt1.y, pt2.x, pt2.y, null, {
                                    stroke: colorLine_light,
                                    strokeWidth: 2.5,
                                });
                            }
                        } 
                        if (hit.name === data.labels["var2"]) {
                            if (focusedTimeLag > 0 && hit.x >= tsChart.series[0].itemsSource.length - focusedTimeLag) {
                                engine.stroke = colorLine2_light;
                                engine.fill = colorLine2_light;
                                var x1 = tsChart.axisX.convert(hit.pointIndex), x2 = tsChart.axisX.convert(hit.pointIndex - 1);
                                var y1, y2;
                                if(!isNullOrUndefined(tsChart.series[1].axisY)){
                                    y1 = tsChart.series[1].axisY.convert(tsChart.series[1].itemsSource[hit.pointIndex].y);
                                    y2 = tsChart.series[1].axisY.convert(tsChart.series[1].itemsSource[hit.pointIndex - 1].y);
                                }else{
                                    y1 = tsChart.axisY.convert(tsChart.series[1].itemsSource[hit.pointIndex].y);
                                    y2 = tsChart.axisY.convert(tsChart.series[1].itemsSource[hit.pointIndex - 1].y);
                                }
                                
                                engine.drawLine(x1, y1, x2, y2, null, {
                                    stroke: colorLine2_light,
                                    strokeWidth: 2.5,
                                });
                                
                            } else if (focusedTimeLag < 0 && hit.x < - focusedTimeLag) {
                                engine.stroke = colorLine2_light;
                                engine.fill = colorLine2_light;
                                var x1 = tsChart.axisX.convert(hit.pointIndex), x2 = tsChart.axisX.convert(hit.pointIndex + 1);
                                var y1, y2;
                                if(!isNullOrUndefined(tsChart.series[1].axisY)){
                                    y1 = tsChart.series[1].axisY.convert(tsChart.series[1].itemsSource[hit.pointIndex].y);
                                    y2 = tsChart.series[1].axisY.convert(tsChart.series[1].itemsSource[hit.pointIndex + 1].y);
                                }else{
                                    y1 = tsChart.axisY.convert(tsChart.series[1].itemsSource[hit.pointIndex].y);
                                    y2 = tsChart.axisY.convert(tsChart.series[1].itemsSource[hit.pointIndex + 1].y);
                                }
                                
                                engine.drawLine(x1, y1, x2, y2, null, {
                                    stroke: colorLine2_light,
                                    strokeWidth: 2.5,
                                });
                            }
                        }
                    }
                    defaultRenderer();
                },
                rendered: function(self){
                    // update axis line color
                    $.each(self.axisX.hostElement.querySelectorAll("line"), function (ind, line) {
                        $(line).attr("stroke", fontColor_global).attr('fill', 'none').removeClass('wj-line').removeClass('wj-tick');
                    });
                    $.each(self.axisY.hostElement.querySelectorAll("line"), function (ind, line) {
                        $(line).attr("stroke", fontColor_global).attr('fill', 'none').removeClass('wj-line').removeClass('wj-tick');
                    });
                    if(self.axes.length > 2){
                        $.each(self.axes[1].hostElement.children, function (ind, ele) {
                            if(ele.tagName === 'text'){
                                ele.setAttribute("fill", colorLine);
                                ele.setAttribute("class", null);
                            }
                            else if(ele.tagName === 'line'){
                                // $(ele).attr("stroke", fontColor_global);
                                ele.setAttribute("stroke", colorLine);
                            }else if (ele.tagName === 'g'){
                                ele.children[0].setAttribute("fill", colorLine);
                            }
                        });
                        $.each(self.axes[2].hostElement.children, function (ind, ele) {
                            if(ele.tagName === 'text'){
                                ele.setAttribute("fill", colorLine2);
                                ele.setAttribute("class", null);
                            }
                            else if(ele.tagName === 'line'){
                                // $(ele).attr("stroke", fontColor_global);
                                ele.setAttribute("stroke", colorLine2);
                            }else if (ele.tagName === 'g'){
                                ele.children[0].setAttribute("fill", colorLine2);
                            }
                        });
                    }
    
                    var hostEle = tsChart.hostElement;
                    var offsetX = hostEle.offsetLeft + parseInt($(hostEle).css("padding-left"));
                    var offsetY = hostEle.offsetTop + parseInt($(hostEle).css("padding-top"));
                    toolTipVisibleRegion_ts.xMinCoord = tsChart.axisX.convert(toolTipVisibleRegion_ts.xMin) - 5 + offsetX;
                    toolTipVisibleRegion_ts.xMaxCoord = tsChart.axisX.convert(toolTipVisibleRegion_ts.xMax) + 5 + offsetX;
                    toolTipVisibleRegion_ts.yMinCoord = tsChart.axisY.convert(toolTipVisibleRegion_ts.yMax) + offsetY;
                    toolTipVisibleRegion_ts.yMaxCoord = tsChart.axisY.convert(toolTipVisibleRegion_ts.yMin) + offsetY;
                    tsChart.addEventListener(tsChart.hostElement, 'mousemove', function (e) {
                        var eX = e.x + window.pageXOffset;
                        var eY = e.y + window.pageYOffset;
                        if (lm_ts.isVisible) {
                            if (eX < toolTipVisibleRegion_ts.xMinCoord
                                || eX > toolTipVisibleRegion_ts.xMaxCoord
                                || eY < toolTipVisibleRegion_ts.yMinCoord
                                || eY > toolTipVisibleRegion_ts.yMaxCoord) {
                                lm_ts.isVisible = false;
                                annotationFocus_ts.items.clear();
                            }
                        } else {
                            if (eX >= toolTipVisibleRegion_ts.xMinCoord
                                && eX <= toolTipVisibleRegion_ts.xMaxCoord
                                && eY >= toolTipVisibleRegion_ts.yMinCoord
                                && eY <= toolTipVisibleRegion_ts.yMaxCoord) {
                                lm_ts.isVisible = true;
                                previous_focusedLag = -1;
                            }
                        }
                    });
                    tsChart.addEventListener(tsChart.hostElement, 'mouseleave', function () {
                        lm_ts.isVisible = false;
                        annotationFocus_ts.items.clear();
                    });
                    // scroll to bottom
                    if(first_time_render){
                        $('html, body').scrollTop($(document).height());
                        document.body.style.overflow = "auto";
                        first_time_render = false;
                    }
                }
            });
            var previous_focusedTimeId = -1;
            var previous_focusedMessage_ts = "";
            if (annotationFocus_ts == null) {
                annotationFocus_ts = new wijmo.chart.annotation.AnnotationLayer(tsChart);
            }
            var lm_ts = new chart.LineMarker(tsChart, {
                isVisible: false,
                lines: 'None',
                interaction: 'Move',
                content: (ht) => {
                    if (ht.item){
                        var cursorTime = tsChart.axisX.convertBack(ht.point.x);
                        var startInd = showPreWhitenData? result.time_series.pwValidStartInd: 0;
                        var timeIndex = hitTimeTest(cursorTime, startInd=startInd);
                        if(timeIndex>=0 && timeIndex < signalTimeSteps.length && lm_ts.isVisible){
                            if(timeIndex === previous_focusedTimeId){
                                return previous_focusedMessage_ts;
                            }else{
                                annotationFocus_ts.items.clear();
                                var t = signalTimeSteps[timeIndex + startInd];
                                // add the reference line
                                annotationFocus_ts.items.push(new wijmo.chart.annotation.Line({
                                    type: 'Line',
                                    tooltip: null,
                                    position: 'Center',
                                    attachment: 'DataCoordinate',
                                    start: { x: t, y: toolTipVisibleRegion_ts.yMin },
                                    end: { x: t, y: toolTipVisibleRegion_ts.yMax },
                                    style: {
                                        stroke: colorHighlight,
                                        strokeWidth: 1,
                                        opacity: 1
                                    }
                                }));
                                // prepare the message here
                                var message = "<div>@t</div>".replace(/@t/g, getFormattedDate(t, allTimeStepsSameDay));
                                var sourceDataBundle1 = showPreWhitenData ? result.time_series.pwDataBundle1 : result.time_series.dataBundle1;
                                var sourceDataBundle2 = showPreWhitenData ? result.time_series.pwDataBundle2 : result.time_series.dataBundle2;
                        
                                // Add original value
                                var rawValue = sourceDataBundle1[timeIndex].y;
                                message += "<div style='color: @c'><b>@valueLabel</b>:&emsp;@v</div>"
                                    .replace(/@c/g, colorLine)
                                    .replace(/@valueLabel/g, data.labels["var1"])
                                    .replace(/@v/g, formatGlobalValue(rawValue));
                                if(data.labels["var2"] != data.labels["var1"]){
                                    rawValue = sourceDataBundle2[timeIndex].y;
                                    message += "<div style='color: @c'><b>@valueLabel</b>:&emsp;@v</div>"
                                    .replace(/@c/g, colorLine2)
                                    .replace(/@valueLabel/g, data.labels["var2"])
                                    .replace(/@v/g, formatGlobalValue(rawValue));
                                }
                                previous_focusedMessage_ts = message;
                                previous_focusedTimeId = timeIndex;
                                return message;
                            }
                        }else{
                            annotationFocus_ts.items.clear();
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
    "@@chart_base/scripts/culture/wijmo.culture.@@lang.min.js".replace(/@@lang/g, data.lang), 
    "@@chart_base/scripts/main.js",
    "@@img_base/SSUtil.js"];
var cssResources = [basePath + "styles/wijmo-chart.min.css", basePath_LBRJS + "SSTSCorrelation.css"];

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
