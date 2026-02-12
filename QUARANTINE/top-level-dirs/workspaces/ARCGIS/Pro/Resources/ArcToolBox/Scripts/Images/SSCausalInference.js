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

function execute() {
    if(isNullOrUndefined(data.local)){
        document.body.innerHTML += `<div style='font-family: Verdana; width: 100%; min-width: 300px;background-color: transparent;font-size: 10px; padding: 0 15px 0 15px;'>${data.labels["trim_label"]}</div>`;
        return;
    }
    var fontColor_global = "#848484";
    var colorLine = "#CC0099";
    var colorLineOrange = "#ff9800"
    var colorLineSmooth = "#F26745";
    var c_color = '#ffcc80';
    var colorHighlight = "#18ffff";
    var c_outliers = ["#762a83", "#1b7837", "#848484"];
    if(g_popupTheme===2){
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
        return [min, max];
    }

    function prepareData(){

        var y_diff = data.local.y - data.local.y_on_erf;

        var pointBundle = [];
        var mainPoint = {
            x: data.local.x,
            y: data.local.y,
            w: data.local.w,
            main: 1,
        };
        for(var i=0; i<data.x.length; i+=1){
            pointBundle.push({
                x: data.x[i],
                y: data.y[i],
                w: data.w[i]
            });
        }
        pointBundle.push(mainPoint);

        var erfBundle = [];
        for(var i=0; i<data.erf_x.length; i+=1){
            erfBundle.push({
                x: data.erf_x[i],
                y: data.erf_y[i],
                y_shift: data.erf_y[i] + y_diff
            });
        }

        var targetBundleOut = [];
        var targetBundleExp = [];
        // loop through the data to get the y range
        var y_min = data.y[0];
        var y_max = data.y[0];
        data.local.tar_outcome.forEach(ele => {
            if(y_min > ele[0]){
                y_min = ele[0];
            }
            if(y_max < ele[0]){
                y_max = ele[0];
            }
        })
        data.local.tar_exposure.forEach(ele => {
            var yl = data.local.y_on_erf + ele[1];
            if(y_min > yl){
                y_min = yl;
            }
            if(y_max < yl){
                y_max = yl;
            }
        })
        var range_x = getValuesRange(data.x, getValuesRange(data.erf_x), extendRatio=0.05);
        var range_y = getValuesRange(data.y, [y_min, y_max])
        var range_erf_y = getValuesRange(data.erf_y)
        var range_y = getValuesRange(range_y, range_erf_y, extendRatio=0.05)
        var range_y = getValuesRange(range_y, [range_erf_y[0] + y_diff, range_erf_y[1] + y_diff], extendRatio=0.05)

        // prepare all the target markers
        for(var i=0; i< data.local.tar_outcome.length; i+=1){
            var ele = data.local.tar_outcome[i];
            targetBundleOut.push({
                ind: i,
                x: range_x[0],
                y: ele[0],
                diff: ele[1],
                typeO: "tar_out"
            })
        }
        for(var i=0; i< data.local.tar_exposure.length; i+=1){
            var ele = data.local.tar_exposure[i];
            targetBundleExp.push({
                ind: i,
                x: ele[0],
                y: range_y[0],
                diff: ele[1],
                typeO: "tar_exp"
            })
        }

        var resultBundle = {
            pointBundle: pointBundle,
            erfBundle: erfBundle,
            targetBundleOut: targetBundleOut,
            targetBundleExp: targetBundleExp,
            range_x: range_x,
            range_y: range_y,
            range_w: getValuesRange(data.w),
            range_erf_x: getValuesRange(data.erf_x),
            range_erf_y: getValuesRange(data.erf_y),
            
        };
        return resultBundle;
    }

    function rez(){
        var w = window.innerWidth - 30;
        if(w < 300){
            w = 300;
        }

        var h = parseInt(w *0.8);
        var target = $("#ci_popup");
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
        if(data.x.length<2){
            return;
        }
        
        var containerStr = "<div id='ci_popup' style='font-family: Verdana; width: 100%; min-width: 300px;background-color: transparent;font-size: 10px;'></div>";
        $("body").append(containerStr);
        rez();
        var chart = wijmo.chart;
        var result = prepareData();
        var series = [{
            name: data.labels["obs"],
            binding: 'y,w',
            style: {
                stroke: "#2493F2",
                fill: 'rgba(36,147,242,0.4)'
            },
            symbolStyle: {
                strokeWidth: 0.5
            },
            // symbolSize: 10
        },
        {
            name: data.labels["erf"],
            itemsSource: result.erfBundle,
            chartType: 'Line',
            bindingX: 'x',
            binding: 'y',
            style: {
                strokeWidth: 2,
                stroke: colorLine
            },
        },
        {
            name: data.labels["erf_id"].format(data.local.id),
            itemsSource: result.erfBundle,
            chartType: 'Line',
            bindingX: 'x',
            binding: 'y_shift',
            style: {
                strokeWidth: 1.5,
                stroke: colorLineOrange,
                'stroke-dasharray': '10 1',
            },
        }];

        if(result.targetBundleOut.length > 0){
            var wd = 7;
            var he = 11
            series.push({
                chartType: "Scatter",
                itemsSource: result.targetBundleOut,
                bindingX: 'x',
                binding: 'y',
                name: data.labels.tar_out.format(data.ny).replace(":", "").replace("：", ""),
                // tooltipContent: 'todo: change later',
                tooltipContent: null,
                style: { 
                        "fill": "#ffb74d",
                        "stroke": "transparent",
                },
                itemFormatter: (engine, ht, render) => {
                    // render();
                    var typeO = ht.item.typeO;
                    // draw the triangle here
                    engine.strokeWidth = 20;
                    var x0 = ht.point.x;
                    var y0 = ht.point.y;
                    engine.drawPolygon(
                        xs=[x0, x0, x0 + he], 
                        ys=[y0 - wd, y0 + wd, y0],
                        className="tar_marker",
                        style={tp: 'tar_out', ind: ht.item.ind}
                        );
                }
            });
        }

        if(result.targetBundleExp.length > 0){
            var wd = 7;
            var he = 11
            series.push({
                chartType: "Scatter",
                itemsSource: result.targetBundleExp,
                bindingX: 'x',
                binding: 'y',
                name: data.labels.tar_exp.format(data.nx).replace(":", "").replace("：", ""),
                // tooltipContent: 'todo: change later',
                tooltipContent: null,
                style: { 
                        "fill": "#ffb74d",
                        "stroke": "transparent",
                },
                itemFormatter: (engine, ht, render) => {
                    // render();
                    var typeO = ht.item.typeO;
                    // draw the triangle here
                    engine.strokeWidth = 20;
                    var x0 = ht.point.x;
                    var y0 = ht.point.y;
                    engine.drawPolygon(
                        xs=[x0 - wd, x0 + wd, x0], 
                        ys=[y0, y0, y0 - he],
                        className="tar_marker",
                        style={tp: 'tar_exp', ind: ht.item.ind}
                        );
                }
            });
        }

        pltChart = new chart.FlexChart('#ci_popup', {
            chartType: 'Bubble',
            axisX: {
                title: data.nx,
                min: result.range_x[0],
                max: result.range_x[1],
            },
            axisY: {
                title: data.ny,
                axisLine: true,
                majorGrid: false,
                min: result.range_y[0],
                max: result.range_y[1],
            },
            itemsSource: result.pointBundle,
            bindingX: 'x',
            tooltip:{
                threshold: 8,
                content: (hit) =>{
                    if(!isNullOrUndefined(hit.item.typeO)){
                        var ind = parseInt(hit.item.ind)
                        if(hit.item.typeO == "tar_out"){
                            var message = `<div style='color: #1b5e20'><b>${data.labels.tar_out.format(data.ny)}</b>&emsp;${formatGlobalValue(hit.item.y)}</div>`;
                            var dir = data.labels.str_inc;
                            if (hit.item.diff < 0){
                                dir = data.labels.str_dec;
                            }
                            if(hit.item.diff == 0){
                                message += `<div>${data.labels.equ_out_tar}<\div>`
                            }else{
                                var msg = data.labels.str_exp_mov.format(data.nx, `<b>${dir.format(formatGlobalValue(Math.abs(hit.item.diff)))}</b>`)
                                message += `<div>${msg}</div>`
                            }
                            return message;
                        }else{
                            var message = `<div style='color: #1b5e20'><b>${data.labels.tar_exp.format(data.nx)}</b>&emsp;${formatGlobalValue(hit.item.x)}</div>`;
                            var dir = data.labels.str_inc;
                            if (hit.item.diff < 0){
                                dir = data.labels.str_dec;
                            }
                            if(hit.item.diff == 0){
                                message += `<div>${data.labels.equ_exp_tar}<\div>`
                            }else{
                                var msg = data.labels.str_out_mov.format(data.ny, `<b>${dir.format(formatGlobalValue(Math.abs(hit.item.diff)))}</b>`, formatGlobalValue(Math.abs(hit.item.x)))
                                message += `<div>${msg}</div>`
                            }
                            return message;
                        }
                    }else{
                        return null;
                    }
                    
                }
            },
            series: series,
            itemFormatter: (engine, ht, defaultRenderer) => {
                if (ht.item.w == 0) {
                    engine.stroke = null;
                    engine.fill = '#9e9e9e';
                }
                if(!isNullOrUndefined(ht.item.main)){
                    engine.stroke = colorLineOrange;
                    engine.fill = '#bf360c';
                }
                defaultRenderer();
            },
            legend: {
                position: 'Bottom',
            },
            // tooltip:{
            //     threshold: 1,
            //     content: function(hit){
            //         var item = hit.item;
            //         if(hit.name === "Values"){
            //             return "<div>" +
            //             "<b>ID: @id</b>".replace(/@id/g, item.id) +
            //             "<div>@x_label: @x_value (@x_o)</div>"
            //                 .replace(/@x_label/g, labels[4])
            //                 .replace(/@x_value/g, formatStdValue(item.x))
            //                 .replace(/@x_o/g, formatGlobalValue(item.x_o)) +
            //             "<div>@y_label: @y_value (@y_o)</div>"
            //                 .replace(/@y_label/g, labels[5])
            //                 .replace(/@y_value/g, formatStdValue(item.y))
            //                 .replace(/@y_o/g, formatGlobalValue(item.y_o)) +
            //             "</div>";
            //         }
            //         else if (hit.name === "Fitted Line"){
            //             return "<div>" +
            //             "<b>@relation</b>".replace(/@relation/g, labels[0]) +
            //             "</div>";
            //         } 
            //         else{
            //             return null;
            //         }
                    
            //     },
            // },

            rendered: function(self){
                // // update axis formats
                // self.axisX.format = getDefaultNumberFormat(pltChart.axisX, 'x');
                // self.axisY.format = getDefaultNumberFormat(pltChart.axisY, 'y');
                // // update axis line color
                // $.each(self.axisX.hostElement.querySelectorAll("line"), function (ind, line) {
                //     $(line).attr("stroke", fontColor_global).attr('fill', 'none').removeClass('wj-line').removeClass('wj-tick');
                // });
                // $.each(self.axisY.hostElement.querySelectorAll("line"), function (ind, line) {
                //     $(line).attr("stroke", fontColor_global).attr('fill', 'none').removeClass('wj-line').removeClass('wj-tick');
                // });
                // retrieve all target marker svg element as polygon, add the event listener for each one

                if(annotationFocus == null){
                    annotationFocus = new wijmo.chart.annotation.AnnotationLayer(pltChart);
                }

                var es = self.hostElement.querySelectorAll('polygon');
                var triangleMarkers = [];
                for(var i=0; i<es.length; i+=1){
                    var polygon = $(es[i])[0];
                    if(polygon.getAttribute("class")=="tar_marker"){
                        ele = $(polygon);
                        ele.attr("cursor", "pointer");
                        ele.attr("z-index", 10000);
                        triangleMarkers.push(ele);
                    }
                }
                const x_offset = pltChart.axisX.convertBack(10) - pltChart.axisX.convertBack(0)
                const y_offset = pltChart.axisY.convertBack(0) - pltChart.axisY.convertBack(10)
                // pltChart.axisX.convert(toolTipVisibleRegion.xMin)
                for(var i=0; i<es.length; i+=1){
                    var polygon = $(es[i])[0];
                    // console.log(polygon.getAttribute("class"))
                    if(polygon.getAttribute("class")=="tar_marker"){
                        polygon.addEventListener('click', function (e) {
                            // change back the original colors of the element
                            var target = $(e.target);
                            var ind = parseInt(target.attr("ind"))
                            if(target.hasClass("selected")){
                                annotationFocus.items.clear();
                                target.attr('fill', "#ffb74d");
                                target.removeClass("selected");
                            }else{
                                annotationFocus.items.clear();
                                triangleMarkers.forEach(function (ele) {
                                    ele.attr('fill', "#ffb74d");
                                    ele.removeClass("selected");
                                });
                                target.attr('fill', "#e65100");
                                target.addClass("selected");
                                // var ele = result.targetBundle[ind];
                                // triangleMarkers
                                // target.attr('fill', "#e65100");
                                var tp = target.attr("tp");
                                if (tp == "tar_out") {
                                    var ele = result.targetBundleOut[ind];
                                    annotationFocus.items.push(new wijmo.chart.annotation.Line({
                                        type: 'Line',
                                        tooltip: null,
                                        position: 'Center',
                                        attachment: 1,
                                        start: { x: result.range_x[0] + x_offset, y: ele.y },
                                        end: { x: result.range_x[1], y: ele.y },
                                        style: {
                                            stroke: colorLineOrange,
                                            strokeWidth: 1,
                                            opacity: 1 }
                                    }));
                                    annotationFocus.items.push(new wijmo.chart.annotation.Line({
                                        type: 'Line',
                                        tooltip: null,
                                        position: 'Center',
                                        attachment: 1,
                                        start: { x: data.local.x, y: result.range_y[0] },
                                        end: { x: data.local.x, y: result.range_y[1] },
                                        style: {
                                            stroke: colorLineOrange,
                                            strokeWidth: 1,
                                            opacity: 1 }
                                    }));
                                    annotationFocus.items.push(new wijmo.chart.annotation.Line({
                                        type: 'Line',
                                        tooltip: null,
                                        position: 'Center',
                                        attachment: 1,
                                        start: { x: data.local.x + ele.diff, y: result.range_y[0] },
                                        end: { x: data.local.x + ele.diff, y: result.range_y[1] },
                                        style: {
                                            stroke: colorLineOrange,
                                            strokeWidth: 1,
                                            opacity: 1 }
                                    }));
                                    annotationFocus.items.push(new wijmo.chart.annotation.Line({
                                        type: 'Line',
                                        tooltip: null,
                                        position: 'Center',
                                        attachment: 1,
                                        start: { x: data.local.x, y: ele.y },
                                        end: { x: data.local.x + ele.diff, y: ele.y },
                                        style: {
                                            stroke: "#1b5e20",
                                            strokeWidth: 3,
                                            opacity: 1 }
                                    }));
                                }else{
                                    var ele = result.targetBundleExp[ind];
                                    annotationFocus.items.push(new wijmo.chart.annotation.Line({
                                        type: 'Line',
                                        tooltip: null,
                                        position: 'Center',
                                        attachment: 1,
                                        start: { x: result.range_x[0], y: data.local.y },
                                        end: { x: result.range_x[1], y: data.local.y },
                                        style: {
                                            stroke: colorLineOrange,
                                            strokeWidth: 1,
                                            opacity: 1 }
                                    }));
                                    annotationFocus.items.push(new wijmo.chart.annotation.Line({
                                        type: 'Line',
                                        tooltip: null,
                                        position: 'Center',
                                        attachment: 1,
                                        start: { x: result.range_x[0], y: data.local.y + ele.diff },
                                        end: { x: result.range_x[1], y: data.local.y + ele.diff },
                                        style: {
                                            stroke: colorLineOrange,
                                            strokeWidth: 1,
                                            opacity: 1 }
                                    }));
                                    annotationFocus.items.push(new wijmo.chart.annotation.Line({
                                        type: 'Line',
                                        tooltip: null,
                                        position: 'Center',
                                        attachment: 1,
                                        start: { x: ele.x, y: result.range_y[0] + y_offset },
                                        end: { x: ele.x, y: result.range_y[1] },
                                        style: {
                                            stroke: colorLineOrange,
                                            strokeWidth: 1,
                                            opacity: 1 }
                                    }));
                                    annotationFocus.items.push(new wijmo.chart.annotation.Line({
                                        type: 'Line',
                                        tooltip: null,
                                        position: 'Center',
                                        attachment: 1,
                                        start: { x: ele.x, y: data.local.y },
                                        end: { x: ele.x, y: data.local.y + ele.diff },
                                        style: {
                                            stroke: "#1b5e20",
                                            strokeWidth: 3,
                                            opacity: 1 }
                                    }));
                                }
                                
                            }

                            
                        });
                    }
                    
                    
                }

                //update legend style
                try{
                    var g_elements = $(".wj-legend").children("g");
                    var current_ind = 3;
                    if(result.targetBundleOut.length > 0){
                        var ele = g_elements[current_ind];
                        var ellipse = $(ele.removeChild(ele.childNodes[0]));
                        var x0 = parseFloat(ellipse.attr("cx"));
                        var y0 = parseFloat(ellipse.attr("cy"));
                        var node = `<polygon stroke="transparent" stroke-width="1" fill="#ffb74d" points="${x0-3},${y0-5} ${x0-3},${y0+5} ${x0+5},${y0} " ></polygon>`
                        ele.appendChild(buildSVG(node));

                        current_ind += 1;
                    }
                    if(result.targetBundleExp.length > 0){
                        var ele = g_elements[current_ind];
                        var ellipse = $(ele.removeChild(ele.childNodes[0]));
                        var x0 = parseFloat(ellipse.attr("cx"));
                        var y0 = parseFloat(ellipse.attr("cy"));
                        var node = `<polygon stroke="transparent" stroke-width="1" fill="#ffb74d" points="${x0-5},${y0+4} ${x0+5},${y0+4} ${x0},${y0-5} " ></polygon>`
                        ele.appendChild(buildSVG(node));
                     
                        current_ind += 1;
                    }
                }catch(e){}

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
    "@@chart_base/scripts/jquery-3.1.0.slim.min.js",
    "@@chart_base/scripts/wijmo.min.js",
    "@@chart_base/scripts/wijmo.chart.min.js",
    "@@chart_base/scripts/wijmo.chart.analytics.min.js",
    "@@chart_base/scripts/wijmo.chart.annotation.min.js",
    "@@chart_base/scripts/culture/wijmo.culture.@@lang.min.js".replace(/@@lang/g, data.lang), 
    "@@chart_base/scripts/main.js",
    "@@img_base/SSUtil.js"];
var cssResources = [basePath + "styles/wijmo-chart.min.css"];

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
