wijmo.chart.LineMarker.prototype._moveMarker = function (e) {
    var self = this, 
    chart = self._chart, 
    point = self._getEventPoint(e), 
    plotRect = self._plotRect, 
    isDragAction = self._interaction === wijmo.chart.LineMarkerInteraction.Drag, 
    hLineVisible = self._lines === wijmo.chart.LineMarkerLines.Horizontal, 
    vLineVisible = self._lines === wijmo.chart.LineMarkerLines.Vertical, 
    seriesIndex = self._seriesIndex, series, offset = wijmo.getElementRect(chart.hostElement), hitTest, xAxis, yAxis, x, y;
    if (!plotRect) {
        return;
    }
    if (!self._isVisible || self._interaction === wijmo.chart.LineMarkerInteraction.None ||
        (self._interaction === wijmo.chart.LineMarkerInteraction.Drag &&
            (!self._capturedEle || self._lines === wijmo.chart.LineMarkerLines.None))) {
        return;
    }
    if (isDragAction) {
        if (self._contentDragStartPoint) {
            point.x = hLineVisible ? self._targetPoint.x :
                self._mouseDownCrossPoint.x + point.x - self._contentDragStartPoint.x;
            point.y = vLineVisible ? self._targetPoint.y :
                self._mouseDownCrossPoint.y + point.y - self._contentDragStartPoint.y;
        }
        else if (hLineVisible ||
            (!self._dragLines && self._capturedEle === self._hLine)) {
            // horizontal hine dragging
            point.x = self._targetPoint.x;
        }
        else if (vLineVisible ||
            (!self._dragLines && self._capturedEle === self._vLine)) {
            // vertical hine dragging
            point.y = self._targetPoint.y;
        }
    }
    if ((isDragAction && self._lines === wijmo.chart.LineMarkerLines.Horizontal) ||
        (!self._dragLines && self._capturedEle === self._hLine)) {
        if (point.y <= plotRect.top || point.y >= plotRect.top + plotRect.height) {
            return;
        }
    }
    else if ((isDragAction && self._lines === wijmo.chart.LineMarkerLines.Vertical) ||
        (!self._dragLines && self._capturedEle === self._vLine)) {
        if (point.x <= plotRect.left || point.x >= plotRect.left + plotRect.width) {
            return;
        }
    }
    else {
        if (point.x <= plotRect.left || point.y <= plotRect.top
            || point.x >= plotRect.left + plotRect.width
            || point.y >= plotRect.top + plotRect.height) {
            return;
        }
    }
    if (seriesIndex != null && seriesIndex >= 0 && seriesIndex < chart.series.length) {
        series = chart.series[seriesIndex];
        hitTest = series.hitTest(new wijmo.Point(point.x, NaN));
        if (hitTest == null || hitTest.x == null || hitTest.y == null) {
            return;
        }
        xAxis = series.axisX || chart.axisX;
        yAxis = series._getAxisY();
        x = wijmo.isDate(hitTest.x) ? wijmo.chart.FlexChartCore._toOADate(hitTest.x) : hitTest.x;
        x = wijmo.isString(x) ? hitTest.pointIndex : x;
        y = wijmo.isDate(hitTest.y) ? wijmo.chart.FlexChartCore._toOADate(hitTest.y) : hitTest.y;
        var paddingLeft = this._getElementPaddingValuee(chart.hostElement, 'padding-left');
        var paddingTop = this._getElementPaddingValuee(chart.hostElement, 'padding-top');
        point.x = xAxis.convert(x) + paddingLeft + offset.left;
        if (this.chart._stacking != wijmo.chart.Stacking.None) {
            y = this._calcStackedValue(seriesIndex, x, y);
        }
        point.y = yAxis.convert(y) + paddingTop + offset.top;
    }
    self._updateMarkerPosition(point);
    e.preventDefault();
};


wijmo.chart.LineMarker.prototype._updatePositionByAlignment = function (isMarkerMoved) {
    var self = this, align = self._alignment, tp = self._targetPoint, marker = self._marker, topBottom = 0, leftRight = 0, width = marker.clientWidth, height = marker.clientHeight, plotRect = self._plotRect, 
    //offset for right-bottom lnkemarker to avoid mouse overlapping.
    offset = 12;
    if (!self._plot) {
        return;
    }
    if (!self._capturedEle || (self._capturedEle && self._capturedEle !== self._markerContent)) {
        if (align === wijmo.chart.LineMarkerAlignment.Auto) {
            if ((tp.x + width + offset > plotRect.left + plotRect.width) && (tp.x - width >= 0)) {
                leftRight = width;
            }
            //set default auto to right top.
            topBottom = height;
            if (tp.y - height < plotRect.top) {
                topBottom = 0;
            }
        }
        else {
            if ((1 & align) === 1) { //left
                leftRight = width;
            }
            if ((2 & align) === 2) { //Top
                topBottom = height;
            }
        }
        //only add offset when interaction is move and alignment is right bottom
        if (self._interaction === wijmo.chart.LineMarkerInteraction.Move && topBottom === 0 && leftRight === 0 && this.verticalPosition == null) {
            leftRight = -offset;
        }
    }
    else {
        //content dragging: when the content is on top position
        if (parseInt(self._hLine.style.top) > 0) {
            topBottom = height;
        }
        //content dragging: when the content is on left position
        if (parseInt(self._vLine.style.left) > 0) {
            leftRight = width;
        }
    }
    marker.style.left = (tp.x - leftRight - plotRect.left) + 'px';
    marker.style.top = (tp.y - topBottom - plotRect.top) + 'px';
    self._hLine.style.top = topBottom + 'px';
    self._hLine.style.left = plotRect.left - tp.x + leftRight + 'px';
    self._vLine.style.top = plotRect.top - tp.y + topBottom + 'px';
    self._vLine.style.left = leftRight + 'px';
};