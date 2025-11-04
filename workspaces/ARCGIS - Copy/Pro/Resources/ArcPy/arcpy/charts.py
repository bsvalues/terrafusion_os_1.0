#COPYRIGHT 2018 ESRI
#
#TRADE SECRETS: ESRI PROPRIETARY AND CONFIDENTIAL
#Unpublished material - all rights reserved under the
#Copyright Laws of the United States.
#
#For additional information, contact:
#Environmental Systems Research Institute, Inc.
#Attn: Contracts Dept
#380 New York Street
#Redlands, California, USA 92373
#
#email: contracts@esri.com

"""Charts Module"""

from arcgisscripting import charts

__all__ = [item for item in dir(charts) if not item.startswith('_')]
__all__ += ["Bar", "Box", "CalendarHeat", "DataClock", "Histogram", "Line", "MatrixHeat", "Pie", "QQPlot", "Scatter", "ScatterMatrix"]

locals().update(charts.__dict__)
del charts

from arcpy.arcobjects._base import _ObjectWithoutInitCall, passthrough_attr as _passthrough_attr, pass_parameterized_attr as _pass_parameterized_attr
from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject as _convertArcObjectToPythonObject
from arcpy.geoprocessing._base import gp_fixargs as _gp_fixargs
import codecs as _codecs
import uuid as _uuid

class Chart(_ObjectWithoutInitCall):
    """The Chart class defines an ArcGIS Pro chart. The class allows you to create different types of charts, including
    bar charts, line charts, histograms, and scatter plots. Also, you can use the class to define the chart title, axes,
    and other properties.
    """
    def __init__(self, name, title = None, description = None, xTitle = None, yTitle = None, dataSource = None, displaySize = None, theme = None):
        import arcgisscripting
        self._arc_object = arcgisscripting.charts.Chart(*_gp_fixargs((name,), True))
        self.xAxis = self._create_axis(self._hId)
        self.yAxis = self._create_axis(self._vId)

        if dataSource != None:
            self.dataSource = dataSource
        if title != None:
            self.title = title
        if description != None:
            self.description = description
        if xTitle != None:
            self.xAxis.title = xTitle
        if yTitle != None:
            self.yAxis.title = yTitle

        if displaySize != None :
            self.displaySize = displaySize
        else :
            self.displaySize = (400,300)

        if theme != None :
            self.theme = theme

    _hId = _passthrough_attr('horizontalAxisId')
    _vId = _passthrough_attr('verticalAxisId')
    _chartType = _passthrough_attr('chartType')
    title = _passthrough_attr('title')
    description = _passthrough_attr('description')
    color = _passthrough_attr('color')
    dataSource = _passthrough_attr('dataSource')
    theme = _passthrough_attr('theme')
    enableServerSideProcessing = _passthrough_attr('enableServerSideProcessing')

    class _arc_base:
        def __init__(self, parent):
            self._parent = parent
            self._arc_object = parent._arc_object

    class _seriesType(_arc_base):
        pass

        def __init__(self, parent):
            super().__init__(parent)

        def __repr__(self):
            return 'Chart("{} series")'.format(self._parent._chartType)

        def __str__(self):
            return 'Chart("{} series")'.format(self._parent._chartType)

    class _axis(_arc_base):
        """Sets additional properties that apply to axis only.
        field
            The name of the attribute field to display on the axis.

        sort
            The sorting method applied to this axis. ASC for ascending sorting and DESC for descending sorting. This
            only applies to bar charts.

        title
            The label of the axis that displays on the chart.

        useAdaptiveBounds
            Indicates whether grid chart series are displayed with adaptive axes, i.e. using series axis minimum and maximum.
        """
        _axisType = ''

        class _guide:
            def __init__(self, _name):
                self.name = _name
                self.valueFrom = None
                self.valueTo = None
                self.label = None

        class _Guides:
            def new(self, name, valueFrom, valueTo = None, label = None):
                guide = self._axis._guide(name)
                guide.valueFrom = valueFrom
                guide.valueTo = valueTo
                guide.label = label

                guides = self._axis._guides
                if guides == None:
                    guides = []

                guides.append(self._getGuideDict(guide))

                self._axis._guides = guides
                return guide

            def get(self, index):
                return self._makeGuide(self._axis._guides[index])

            def update(self, _guides):
                guides = self._axis._guides
                for i, g in enumerate(guides):
                    for j, gNew in enumerate(_guides):
                        if g['name'] == gNew.name:
                            guides[i] = self._getGuideDict(gNew)
                self._axis._guides = guides
                return

            def remove(self, guide):
                guides = self._axis._guides
                guides = [g for g in guides if g['name'] != guide.name]
                self._axis._guides = guides
                return

            def removeByIndex(self, index):
                guides = self._axis._guides
                del guides[index]
                self._axis._guides = guides
                return

            def removeAll(self):
                self._axis._guides = []

            def length(self):
                return len(self._axis._guides)

            def _getGuideDict(self, guide):
                _guide = {}
                _guide['name'] = guide.name
                _guide['valueFrom'] = guide.valueFrom
                if guide.valueTo != None:
                    _guide['valueTo'] = guide.valueTo
                if guide.label != None:
                    _guide['label'] = guide.label
                if hasattr(guide, 'fillColor') and guide.fillColor != None:
                    _guide['fillColor'] = guide.fillColor
                if hasattr(guide, 'lineColor') and guide.lineColor != None:
                    _guide['lineColor'] = guide.lineColor
                if hasattr(guide, 'lineWidth') and guide.lineWidth != None:
                    _guide['lineWidth'] = guide.lineWidth
                if hasattr(guide, 'lineDashStyle') and guide.lineDashStyle != None:
                    _guide['lineDashStyle'] = guide.lineDashStyle
                return _guide

            def _makeGuide(self, guideDict):
                guide = self._axis._guide("new-guide")
                if 'name' in guideDict:
                    guide.name = guideDict['name']
                if 'valueFrom' in guideDict:
                    guide.valueFrom = guideDict['valueFrom']
                if 'valueTo' in guideDict:
                    guide.valueTo = guideDict['valueTo']
                if 'label' in guideDict:
                    guide.label = guideDict['label']
                return guide

            def __init__(self, axis):
                self._axis = axis

        _guides = _pass_parameterized_attr('axisProperty', axisId="axisId", type='guides')

        title = _pass_parameterized_attr('axisProperty', axisId="axisId", type='title')
        field = _pass_parameterized_attr('axisProperty', axisId="axisId", type='field')
        sort = _pass_parameterized_attr('axisProperty', axisId="axisId", type='sort')
        minimum = _pass_parameterized_attr('axisProperty', axisId="axisId", type='minimum')
        maximum = _pass_parameterized_attr('axisProperty', axisId="axisId", type='maximum')
        logarithmic = _pass_parameterized_attr('axisProperty', axisId="axisId", type='logarithmic')
        useAdaptiveBounds = _pass_parameterized_attr('axisProperty', axisId="axisId", type='useAdaptiveBounds')
        invert = _pass_parameterized_attr('axisProperty', axisId="axisId", type='invert')

        def addGuide(self, guide):
            if not (hasattr(guide, '__dict__')  and '_arc_object'  in guide.__dict__):
              raise RuntimeError('arcpy.charts.Guide object expected.')
            return self._arc_object._addGuide(self.axisId, guide._arc_object)

        def removeGuide(self, guide):
            return self._arc_object._removeGuide(self.axisId, guide._arc_object)

        def listGuides(self, guideName=None):
            """Layer.listCharts({wildcard})

            Returns a Python list of Guide objects that exist within a chart's axis.

                guideName{String}:
            A guideName is a guide identifier and is not case sensitive."""
            lg = self._arc_object._listGuides(self.axisId, guideName)
            for ig in range(len(lg)) :
                lg[ig] = _convertArcObjectToPythonObject(lg[ig])
                
            return lg
        def __repr__(self):
            return "Chart.{}axis".format(self._axisType)

        def __str__(self):
            return "Chart<{}>.{}axis<{}>".format(self._parent._chartType, self._axisType, self.title)

        def __init__(self, parent, i):
            super().__init__(parent)
            if i == 0:
                self._axisType = 'X'
            else:
                self._axisType = 'Y'
            self.axisId = i
            self.guides = self._Guides(self)

    _helpGen = """
    dataSource
        mp.Layer object or path/url to a dataset.
    """

    class _bar(_seriesType):
        def __init__(self, parent):
            super().__init__(parent)
        aggregation = _passthrough_attr('aggregation')
        splitCategory = _passthrough_attr('splitCategory')
        multiSeriesDisplay = _passthrough_attr('multiSeriesDisplay')
        rotated = _passthrough_attr('rotated')
        showMovingAverage = _passthrough_attr('showMovingAverage')
        movingAveragePeriod = _passthrough_attr('movingAveragePeriod')

    class _scatterPlot(_seriesType):
        def __init__(self, parent):
            super().__init__(parent)
        showTrendLine = _passthrough_attr('showTrendLine')
        bubbleMinSize =  _passthrough_attr('bubbleMinSize')
        bubbleMaxSize =  _passthrough_attr('bubbleMaxSize')

    class _qqPlot(_seriesType):
        def __init__(self, parent):
            super().__init__(parent)
        showReferenceLine = _passthrough_attr('showReferenceLine')
        dataTransformationType = _passthrough_attr('dataTransformationType')


    class _line(_seriesType):
        def __init__(self, parent):
            super().__init__(parent)
        aggregation = _passthrough_attr('aggregation')
        splitCategory = _passthrough_attr('splitCategory')
        timeIntervalUnits = _passthrough_attr('timeIntervalUnits')
        timeIntervalSize = _passthrough_attr('timeIntervalSize')
        trimIncompleteTimeInterval = _passthrough_attr('trimIncompleteTimeInterval')
        timeAggregationType = _passthrough_attr('timeAggregationType')
        nullPolicy = _passthrough_attr('nullPolicy')
        rotated = _passthrough_attr('rotated')

    class _histogram(_seriesType):
        def __init__(self, parent):
            super().__init__(parent)
        binCount = _passthrough_attr('binCount')
        showMean = _passthrough_attr('showMean')
        showMedian = _passthrough_attr('showMedian')
        showStandardDeviation = _passthrough_attr('showStandardDeviation')
        showComparisonDistribution = _passthrough_attr('showComparisonDistribution')
        dataTransformationType = _passthrough_attr('dataTransformationType')

    class _boxPlot(_seriesType):
        def __init__(self, parent):
            super().__init__(parent)
        showOutliers = _passthrough_attr('showOutliers')
        standardizeValues = _passthrough_attr('standardizeValues')
        splitCategory = _passthrough_attr('splitCategory')
        splitCategoryAsMeanLine = _passthrough_attr('splitCategoryAsMeanLine')
        rotated = _passthrough_attr('rotated')

    class _dataClock(_seriesType):
        def __init__(self, parent):
            super().__init__(parent)
        aggregation = _passthrough_attr('aggregation')
        timeUnitsRingWedge = _passthrough_attr('timeUnitsRingWedge')
        nullPolicy = _passthrough_attr('nullPolicy')
        classificationMethod = _passthrough_attr('classificationMethod')
        classCount = _passthrough_attr('classCount')

    class _calendarHeatChart(_seriesType):
        def __init__(self, parent):
            super().__init__(parent)
        aggregation = _passthrough_attr('aggregation')
        calendarType = _passthrough_attr('calendarType')
        nullPolicy = _passthrough_attr('nullPolicy')
        classificationMethod = _passthrough_attr('classificationMethod')
        classCount = _passthrough_attr('classCount')
        includeLeapDay = _passthrough_attr('includeLeapDay')

    class _matrixHeatChart(_seriesType):
        def __init__(self, parent):
            super().__init__(parent)
        aggregation = _passthrough_attr('aggregation')
        nullPolicy = _passthrough_attr('nullPolicy')
        classificationMethod = _passthrough_attr('classificationMethod')
        classCount = _passthrough_attr('classCount')

    class _scatterPlotMatrix(_seriesType):
        def __init__(self, parent):
            super().__init__(parent)
        fields = _passthrough_attr('fields')
        showTrendLine = _passthrough_attr('showTrendLine')
        showHistograms = _passthrough_attr('showHistograms')
        showAsRSquared = _passthrough_attr('showAsRSquared')

    class _pie(_seriesType):
        def __init__(self, parent):
            super().__init__(parent)
        categoryField = _passthrough_attr('categoryField')
        numberFields = _passthrough_attr('numberFields')
        donutSize = _passthrough_attr('donutSize')
        groupingPercent = _passthrough_attr('groupingPercent')
        sort = _passthrough_attr('sort')

    class _legend(_arc_base):
        """Sets properties of the chart legend.
        visible
            Toggles if the legend is visible in the chart view. True displays the legend, False hides the legend.
        """
        def __init__(self, parent):
            super().__init__(parent)
        visible = _passthrough_attr('legendVisible')
        title = _passthrough_attr('legendTitle')
        alignment = _passthrough_attr('legendAlignment')


    @property
    def type(self):
        return self._chartType

    @type.setter
    def type(self, val):
        """Chart.type{String}
        Sets the type of chart to create. Valid options:.
            bar
            boxPlot
            calendarHeatChart
            dataClock
            histogram
            line
            matrixHeatChart
            pie
            qqPlot
            scatter
            scatterMatrix
        """
        if getattr(self, '_chartType'):
            raise AttributeError('Cannot change chart type: "{}"'.format(self._chartType))
        else:
            self._createChartType(val)

    @property
    def legend(self):
        return self._create_legend()

    def _create_legend(self):
        if hasattr(self, 'chartLegend'):
            return self.chartLegend
        else:
            setattr(self, 'chartLegend', self._legend(self))
            return self.chartLegend

    def _createChartType(self, val):
        if isinstance(val, str) == False :
            raise RuntimeError("Chart type must be a string")

        val = val.lower()
        if val == 'bar':
            self._create_bar()
        elif val == 'pie':
            self._create_pie()
        elif val == 'scatter':
            self._create_scatterPlot()
        elif val == 'line':
            self._create_line()
        elif val == 'histogram':
            self._create_histogram()
        elif val == 'boxplot':
            self._create_boxPlot()
        elif val == 'qqplot':
            self._create_qqPlot()
        elif val == 'dataclock':
            self._create_dataClock()
        elif val == 'scattermatrix':
            self._create_scatterPlotMatrix()
        elif val == 'calendarheatchart':
            self._create_calendarHeatChart()
        elif val == 'matrixheatchart':
            self._create_matrixHeatChart()
        else:
            raise RuntimeError("Invalid chart type. Valid values: 'bar' | 'pie' | 'histogram' | 'line' | 'scatter' | 'scatterMatrix' | 'boxPlot' | 'qqPlot' | 'dataClock' | 'calendarHeatChart' | 'matrixHeatChart'")

    def _create_axis(self, i):
        return self._axis(self, i)

    def _create_bar(self):
        setattr(self, '_chartType', 'bar')
        setattr(self, 'bar', self._bar(self))
        return self

    def _create_pie(self):
        setattr(self, '_chartType', 'pie')
        setattr(self, 'pie', self._pie(self))
        return self

    def _create_scatterPlot(self):
        setattr(self, '_chartType', 'scatter')
        setattr(self, 'scatter', self._scatterPlot(self))
        return self

    def _create_line(self):
        setattr(self, '_chartType', 'line')
        setattr(self, 'line', self._line(self))
        return self

    def _create_histogram(self):
        setattr(self, '_chartType', 'histogram')
        setattr(self, 'histogram', self._histogram(self))
        return self

    def _create_boxPlot(self):
        setattr(self, '_chartType', 'boxPlot')
        setattr(self, 'boxPlot', self._boxPlot(self))
        return self

    def _create_qqPlot(self):
        setattr(self, '_chartType', 'qqPlot')
        setattr(self, 'qqPlot', self._qqPlot(self))
        return self

    def _create_dataClock(self):
        setattr(self, '_chartType', 'dataClock')
        setattr(self, 'dataClock', self._dataClock(self))
        return self

    def _create_calendarHeatChart(self):
        setattr(self, '_chartType', 'calendarHeatChart')
        setattr(self, 'calendarHeatChart', self._calendarHeatChart(self))
        return self

    def _create_matrixHeatChart(self):
        setattr(self, '_chartType', 'matrixHeatChart')
        setattr(self, 'matrixHeatChart', self._matrixHeatChart(self))
        return self

    def _create_scatterPlotMatrix(self):
        setattr(self, '_chartType', 'scatterMatrix')
        setattr(self, 'scatterMatrix', self._scatterPlotMatrix(self))
        return self

    def _repr_svg_(self):
        return self.getSVG(self.displaySize[0], self.displaySize[1])

    def getSVG(self, width, height):
        return self._arc_object.getSVG(width, height)

    def exportToSVG(self, path, width = None, height = None):
        svgRes = self.getSVG(width if width != None else self.displaySize[0],
                             height if height != None else self.displaySize[1])

        with _codecs.open(path, "w", "utf-8") as f_svg:
            f_svg.write(svgRes)

    def _getWebSpec(self):
        return self._arc_object._getWebSpec()

    def _getCIM(self):
        from .cim.cimloader import GetJSONTypeOBJ
        import json
        return GetJSONTypeOBJ(json.loads(_convertArcObjectToPythonObject(self._arc_object._getCIM(*_gp_fixargs((self,), True)))))
        
    def addToLayer(self, layer_or_layerfile):
        """Chart.addToLayer(layer_or_layerfile)
        Adds the chart class to a layer.

        layer_or_layerfile{object}
            The chart will be added to this target layer object.

        The chart object properties will be set into the layer definition.
        """
        return _convertArcObjectToPythonObject(self._arc_object.addToLayer(*_gp_fixargs((layer_or_layerfile,), True)))

    def updateChart(self):
        """Chart.updateChart()
        Updates chart properties to sync changes between the class and the chart associated with a layer.

        After defining chart properties in the chart class, the final step is typically to add the chart to a layer.
        Use the addToLayer method to accomplish this. However, you may wish to further modify the chart properties.
        Instead of starting from scratch with a new chart, you can modify the properties of the original chart class,
        then use the updateChart method to sync any changes into the layer. This will allow the changes you make to be
        presented in the Chart properties pane and chart view.Use updateChart to sync chart property changes into a
        layer.
        """
        return _convertArcObjectToPythonObject(self._arc_object.updateChart(*_gp_fixargs((), True)))

    @property
    def displaySize(self):
        return self.__displaySize

    @displaySize.setter
    def displaySize(self, val):
        """Chart.displaySize
        Sets dimensions of a chart for visualization purposes in Python Notebooks or export. Does not affect charts in UI.
        'displaySize' is tuple or a list with 2 positive numeric values. For ex., (400, 300) or [80.5, 60.5].
        """
        if type(val) in [tuple,list] and len(val) == 2 and type(val[0]) in [int, float] and type(val[1]) in [int, float] :
            self.__displaySize = val
        else :
            raise AttributeError('Invalid argument. "displaySize" must be a tuple or a list with 2 positive numeric values. For ex., (400, 300) or [80.5, 60.5]')

class TimeBinningProperties(_ObjectWithoutInitCall):
    """Sets the time binning properties.

    intervalSize
        The span of time that will be binned or aggregated together. This argument must
        be used in conjunction with `timeIntervalUnit`. If timeIntervalSize is 0, it will be calculated based on field time range.
    intervalUnits
        The time unit that corresponds to the timeIntervalSize.
        Valid options include 'SECONDS', 'MINUTES', 'HOURS', 'DAYS', 'WEEKS', 'MONTHS', and 'YEARS'.
    timeAggregationType
        The time interval alignment type.
        Valid options include 'equalIntervalsFromStartTime', 'equalIntervalsFromEndTime', and 'referenceTime'.
    referenceTime
        The time interval alignment reference time when timeAggregationType is set to 'referenceTime'.
    trimIncompleteInterval
        Determines whether incomplete time intervals at the start or end of the data span
        (depending on the timeAggregationType) will be removed from the chart. Incomplete
        intervals on a chart can cause misleading results in which the period in question
        is under- or overreported due to a different amount of time in the interval. True
        indicates to trim these incomplete intervals. False does not trim incomplete
        intervals.
    """
    def __init__(self, intervalSize = None, intervalUnits = None, timeAggregationType = None, trimIncompleteInterval = None, referenceTime = None):
        import arcgisscripting
        self._arc_object = arcgisscripting.charts.TimeBinningProperties(*_gp_fixargs((self,), True))

        if intervalSize != None:
            self.intervalSize = intervalSize
        if intervalUnits != None:
            self.intervalUnits = intervalUnits
        if timeAggregationType != None:
          self.timeAggregationType = timeAggregationType
        if referenceTime != None:
            self.referenceTime = referenceTime
        if trimIncompleteInterval != None:
            self.trimIncompleteInterval = trimIncompleteInterval

    intervalSize = _passthrough_attr('timeIntervalSize')
    intervalUnits = _passthrough_attr('timeIntervalUnits')
    timeAggregationType = _passthrough_attr('timeAggregationType')
    referenceTime = _passthrough_attr('referenceTime')
    trimIncompleteInterval = _passthrough_attr('trimIncompleteTimeInterval')

class Guide(_ObjectWithoutInitCall):
    """Sets the properties of axis Guide object.
    guideType
        The type of the guide.
        Valid options include 'line', 'range', and 'polyline'.
    name
        Unique name of the guide.
    label
        Guide label.
    valueFrom
        An axis value at which a line and range guide starts.
    valueT0
        An axis value at which a range guide stops.
    polyline
        Vertices of the polyline guide as a list of x and y coordinates in a row-major order.
    lineColor 
        A color of the line guide
    lineWidth
        A width of a line guide
    lineDashStyle
        A style of a line guide
        Supported options are 'solid', 'dot', 'dash', 'dashDot', 'longDash', and 'longDashDot'.
    fillColor
        A color of the range guide
    """
    def __init__(self, guideType, *, name = None, label = None, valueFrom = None, valueTo = None, polyline = None, lineColor = None, lineWidth = None, lineDashStyle = None, fillColor = None):
        import arcgisscripting
        self._arc_object = arcgisscripting.charts.Guide(*_gp_fixargs((self,), True))

        self.guideType = guideType

        if name != None:
            self.name = name
        else:
            self.name = "guide" + str(_uuid.uuid4())

        if label != None:
            self.label = label
        if valueFrom != None:
          self.valueFrom = valueFrom
        if valueTo != None:
            self.valueTo = valueTo
        if polyline != None:
            self.polyline = polyline
        if fillColor != None:
            self.fillColor = fillColor
        if lineColor != None:
            self.lineColor = lineColor
        if lineWidth != None:
            self.lineWidth = lineWidth
        if lineDashStyle != None:
            self.lineDashStyle = lineDashStyle

    guideType = _passthrough_attr('guideType')
    name = _passthrough_attr('name')
    label = _passthrough_attr('label')
    valueFrom = _passthrough_attr('valueFrom')
    valueTo = _passthrough_attr('valueTo')
    fillColor = _passthrough_attr('fillColor')
    lineColor = _passthrough_attr('lineColor')
    lineWidth = _passthrough_attr('lineWidth')
    lineDashStyle = _passthrough_attr('lineDashStyle')
    polyline = _passthrough_attr('polyline')

_ob_conversion = (
     ('ChartObject', Chart),
     ('TimeBinningPropertiesObject', TimeBinningProperties),
     ('GuideObject', Guide),
)

############################################################################################################
### SPECIALIZED CHART CLASSES
############################################################################################################
class Bar(Chart):
    """Sets bar chart properties.

    x
        The field name for the x-axis variable. The field must be a category or a
        date field.
        if set to an empty string or None, a bar chart will match layer's symbology when supported.
    y
        The field names for the numeric fields. Specify a single field name or a
        list of field names.
    aggregation
        The statistical calculation applied to values that occur at the same value
        along the x-axis.
        Supported statistics are 'COUNT', 'SUM', 'MEAN', 'MEDIAN', 'MIN', and 'MAX'.
        No aggregation means that each value will be plotted on the chart regardless
        of overlap or recurring values.
    splitCategory
        A second categorical field that adds a separate series for each unique
        value in the field.
    multiSeriesDisplay
        The display type for a bar chart with multiple series.
        Valid options are 'sideBySide', 'stacked', 'stacked100', and 'grid'.
    miniChartsPerRow
        Sets the number of mini charts per row when multiSeriesDisplay parameter is set to 'grid'
    showPreviewChart
        Indicates whether the preview chart is displayed when multiSeriesDisplay parameter is set to 'grid'.
    showMovingAverage
        Indicates whether the moving average is displayed for temporal bar charts.
    movingAveragePeriod
        The size of the moving average period.
    rotated
        Indicates whether lines are viewed horizontally or vertically. Lines display
        horizontally by default.
    title
        Sets the title of the chart. The title text appears at the top of the chart view and
        is used as the label for the chart in the Contents pane.
    description
        Sets the description of the chart. The description text appears at the bottom of the
        chart view.
    xTitle
        Sets the title for the x-axis of the chart.
    yTitle
        Sets the title for the y-axis of the chart.
    dataSource
        Sets the data source of the chart. When a chart is exported using the exportToSVG method
        or displayed in an ArcGIS Notebook, the data source is read and rendered on the chart.
        Valid data sources include paths to datasets, including local datasets, UNC paths, and
        service URLs, and arcpy.mp Layer objects.
    displaySize
        Sets the size of the chart when exported using the exportToSVG method or displayed in an
        ArcGIS Notebook. The value must be specified as a two-item list, where the first item is
        the width of the chart and the second item is the height of the chart.
    showNullCategory
        Indicates whether null x-values should be represented as an additional category.
    nullCategoryLabel
        Sets the axis label of the null category bar.
    nullCategoryColor
        Sets the color of the null category bar.
    timeBinningProperties
        Sets time binning properties, if needed for date-time based x field, as TimeBinningProperties object
    nullPolicy
        How summarized bars returning a null value are displayed.
        Supported options are 'null' and 'zero'.
    """

    def __init__(self, x, *, y = None, aggregation = None, splitCategory = None, multiSeriesDisplay = None, miniChartsPerRow = None, showPreviewChart = None, showMovingAverage = None, movingAveragePeriod = None, rotated = None, title = None, description = None, xTitle = None, yTitle = None, dataSource = None, displaySize = None, theme = None, timeBinningProperties = None, nullPolicy = None):

        super(Bar, self).__init__("chart" + str(_uuid.uuid4()), title=title, description = description, xTitle = xTitle, yTitle = yTitle, dataSource = dataSource, displaySize = displaySize, theme = theme)

        self.type = "bar"
        del self.bar

        self.x = x
        if y != None :
            self.y = y
        else :
            self.y = ""

        if aggregation != None :
            self.aggregation = aggregation
        if splitCategory != None :
            self.splitCategory = splitCategory
        if multiSeriesDisplay != None :
            self.multiSeriesDisplay = multiSeriesDisplay
        if miniChartsPerRow != None :
            self.miniChartsPerRow = miniChartsPerRow
        if showPreviewChart != None :
            self.showPreviewChart= showPreviewChart
        if showMovingAverage != None :
            self.showMovingAverage = showMovingAverage
        if movingAveragePeriod != None :
            self.movingAveragePeriod = movingAveragePeriod
        if rotated != None :
            self.rotated = rotated

        if timeBinningProperties != None :
            self.timeBinningProperties = timeBinningProperties
        if nullPolicy != None :
            self.nullPolicy = nullPolicy

    x = _passthrough_attr('fieldX', doc = 'The name of the attribute field.')
    y = _passthrough_attr('fieldY', doc = 'The name of the attribute field.')
    aggregation = _passthrough_attr('aggregation')
    splitCategory = _passthrough_attr('splitCategory')
    sortSeries = _passthrough_attr('sortSeries')
    multiSeriesDisplay = _passthrough_attr('multiSeriesDisplay')
    miniChartsPerRow = _passthrough_attr('miniChartsPerRow')
    showPreviewChart = _passthrough_attr('showPreviewChart')
    rotated = _passthrough_attr('rotated')
    showMovingAverage = _passthrough_attr('showMovingAverage')
    movingAveragePeriod = _passthrough_attr('movingAveragePeriod')
    showNullCategory = _passthrough_attr('showNullCategory')
    nullCategoryLabel = _passthrough_attr('nullCategoryLabel')
    nullCategoryColor = _passthrough_attr('nullCategoryColor')
    timeBinningProperties = _passthrough_attr('timeBinningProperties')
    nullPolicy = _passthrough_attr('nullPolicy')

class Box(Chart):
    """Sets bar chart properties.

    y
        The fields to display as boxes. Specify a single field name or a list
        of field names.
    x
        The x-axis field is used to create multiple series box plots by setting
        the category.
    splitCategory
        A second categorical field that adds a separate series for each
        unique value in the field.
    splitCategoryAsMeanLine
        Multiple-series box plots created with a split field can be displayed as
        mean lines or as side-by-side boxes. True displays split multiple series
        as mean lines. False displays multiple series as side-by-side boxes.
    standardizeValues
        Box plots created from multiple fields are standardized by default.
        True displays standardized values. False displays nonstandardized values.
    showOutliers
        Indicates whether outliers are shown as points extending beyond the whiskers.
        True displays outliers as points. False includes outliers in whiskers.
    rotated
        Indicates whether lines are viewed horizontally or vertically. Lines display
        horizontally by default.
    title
        Sets the title of the chart. The title text appears at the top of the chart view and
        is used as the label for the chart in the Contents pane.
    description
        Sets the description of the chart. The description text appears at the bottom of the
        chart view.
    xTitle
        Sets the title for the x-axis of the chart.
    yTitle
        Sets the title for the y-axis of the chart.
    dataSource
        Sets the data source of the chart. When a chart is exported using the exportToSVG method
        or displayed in an ArcGIS Notebook, the data source is read and rendered on the chart.
        Valid data sources include paths to datasets, including local datasets, UNC paths, and
        service URLs, and arcpy.mp Layer objects.
    displaySize
        Sets the size of the chart when exported using the exportToSVG method or displayed in an
        ArcGIS Notebook. The value must be specified as a two-item list, where the first item is
        the width of the chart and the second item is the height of the chart.
    """
    def __init__(self, y, *, x = None, splitCategory = None, splitCategoryAsMeanLine = None, standardizeValues = None, showOutliers = None, rotated = None, title = None, description = None, xTitle = None, yTitle = None, dataSource = None, displaySize = None, theme = None):

        super(Box, self).__init__("chart" + str(_uuid.uuid4()), title=title, description = description, xTitle = xTitle, yTitle = yTitle, dataSource = dataSource, displaySize = displaySize, theme = theme)

        self.type = "boxPlot"
        del self.boxPlot

        if x != None:
            self.x = x
        if y != None:
            self.y = y
        else :
            self.y = ""

        if splitCategory != None:
            self.splitCategory = splitCategory
        if splitCategoryAsMeanLine != None:
            self.splitCategoryAsMeanLine = splitCategoryAsMeanLine
        if standardizeValues != None:
            self.standardizeValues = standardizeValues
        if showOutliers != None:
            self.showOutliers = showOutliers
        if rotated != None:
            self.rotated = rotated

    x = _passthrough_attr('fieldX', doc = 'The name of the attribute field.')
    y = _passthrough_attr('fieldY', doc = 'The name of the attribute field.')
    showOutliers = _passthrough_attr('showOutliers')
    standardizeValues = _passthrough_attr('standardizeValues')
    splitCategory = _passthrough_attr('splitCategory')
    splitCategoryAsMeanLine = _passthrough_attr('splitCategoryAsMeanLine')
    sortSeries = _passthrough_attr('sortSeries')
    rotated = _passthrough_attr('rotated')

class Pie(Chart):
    """Sets pie chart properties.

    categoryField
        The field name for the category variable.
    numberFields
        The field names for the numeric fields. Specify a single field name or a
        list of field names.
    splitCategory
        A second categorical field that adds a separate series for each unique
        value in the field.
    miniChartsPerRow
        Sets the number of mini charts per row when multiSeriesDisplay parameter is set to 'grid'
    showPreviewChart
        Indicates whether the preview chart is displayed when multiSeriesDisplay parameter is set to 'grid'.
    groupingPercent
        The threshold for determining the “Other” group (0 - 100).
    donutSize
        The size of the the hole in middle of the chart (0 - 100).
    sort
        Sorts the slices.
        Supported options are: 'LABEL_CLOCKWISE', 'LABEL_COUNTERCLOCKWISE', 'VALUE_CLOCKWISE', 'VALUE_COUNTERCLOCKWISE'
    showDataLabels
        Indicates whether slice labels are visible in pie chart.
    dataLabelsDisplay
        Sets the format of slice labels.
        Supported options are: 'VALUE', 'PERCENTAGE', 'PERCENTAGE_AND_VALUE'
    title
        Sets the title of the chart. The title text appears at the top of the chart view and
        is used as the label for the chart in the Contents pane.
    description
        Sets the description of the chart. The description text appears at the bottom of the
        chart view.
    dataSource
        Sets the data source of the chart. When a chart is exported using the exportToSVG method
        or displayed in an ArcGIS Notebook, the data source is read and rendered on the chart.
        Valid data sources include paths to datasets, including local datasets, UNC paths, and
        service URLs, and arcpy.mp Layer objects.
    displaySize
        Sets the size of the chart when exported using the exportToSVG method or displayed in an
        ArcGIS Notebook. The value must be specified as a two-item list, where the first item is
        the width of the chart and the second item is the height of the chart.
    """

    def __init__(self, *, categoryField = None, numberFields = None, splitCategory = None, miniChartsPerRow = None, showPreviewChart = None, groupingPercent = None, donutSize = None, sort = None, showDataLabels = None, dataLabelsDisplay = None, title = None, description = None, dataSource = None, displaySize = None, theme = None):

        super(Pie, self).__init__("chart" + str(_uuid.uuid4()), title=title, description = description, dataSource = dataSource, displaySize = displaySize, theme = theme)

        self.type = "pie"
        del self.pie
        del self.xAxis
        del self.yAxis

        if categoryField != None :
            self.categoryField = categoryField
        else :
            self.categoryField = ""

        if numberFields != None :
            self.numberFields = numberFields
        else :
            self.numberFields = ""

        if splitCategory != None :
            self.splitCategory = splitCategory
        if miniChartsPerRow != None :
            self.miniChartsPerRow = miniChartsPerRow
        if showPreviewChart != None :
            self.showPreviewChart= showPreviewChart

        if groupingPercent != None :
            self.groupingPercent = groupingPercent
        if donutSize != None :
            self.donutSize = donutSize
        if sort != None :
            self.sort = sort
        if showDataLabels != None :
            self.showDataLabels = showDataLabels
        if dataLabelsDisplay != None :
            self.dataLabelsDisplay = dataLabelsDisplay

    categoryField = _passthrough_attr('fieldX', doc = 'The name of the attribute field.')
    numberFields = _passthrough_attr('fieldY', doc = 'The name of the attribute field.')
    splitCategory = _passthrough_attr('splitCategory')
    sortSeries = _passthrough_attr('sortSeries')
    miniChartsPerRow = _passthrough_attr('miniChartsPerRow')
    showPreviewChart = _passthrough_attr('showPreviewChart')
    groupingPercent = _passthrough_attr('groupingPercent')
    donutSize = _passthrough_attr('donutSize')
    sort = _passthrough_attr('sortPie')
    showDataLabels = _passthrough_attr('showDataLabels')
    dataLabelsDisplay = _passthrough_attr('dataLabelsDisplay')

class Line(Chart):
    """Sets bar chart properties.

    x
        The field name for the x-axis variable. The field must be a numeric or
        date field.
    y
        The field names for the y-axis variables. The value must be a numeric
        field or a list of numeric fields.
    splitCategory
        A categorical field that adds a separate series for each
        unique value in the field.
    multiSeriesDisplay
        The display type for a bar chart with multiple series.
        Valid options are 'singleChart' and "grid".
    miniChartsPerRow
        Sets the number of mini charts per row when multiSeriesDisplay parameter is set to 'grid'
    showPreviewChart
        Indicates whether the preview chart is displayed when multiSeriesDisplay parameter is set to 'grid'.
    aggregation
        The statistical calculation applied to values aggregated into each temporal bin.
        Supported statistics are 'COUNT', 'SUM', 'MEAN', 'MEDIAN', 'MIN', and 'MAX'.
        No aggregation means that each value will be plotted on the chart regardless of
        overlap or recurring values.
    timeIntervalUnits
        The time unit that corresponds to the timeIntervalSize.
        Valid options include 'SECONDS', 'MINUTES', 'HOURS', 'DAYS', 'WEEKS', 'MONTHS', and 'YEARS'.
    timeIntervalSize
        The span of time that will be binned or aggregated together. This argument must
        be used in conjunction with `timeIntervalUnit`.
    timeAggregationType
        The time interval alignment type.
        Valid options include 'equalIntervalsFromStartTime', 'equalIntervalsFromEndTime', and 'referenceTime'.
    referenceTime
        The time interval alignment reference time when timeAggregationType is set to 'referenceTime'.
    trimIncompleteTimeInterval
        Determines whether incomplete time intervals at the start or end of the data span
        (depending on the timeAggregationType) will be removed from the chart. Incomplete
        intervals on a chart can cause misleading results in which the period in question
        is under- or overreported due to a different amount of time in the interval. True
        indicates to trim these incomplete intervals. False does not trim incomplete
        intervals.
    nullPolicy
        How summarized bins returning a null value are displayed.
        Supported options are 'null', 'zero', and 'interpolate'.
    rotated
        Indicates whether lines are viewed horizontally or vertically. Lines display
        horizontally by default.
    title
        Sets the title of the chart. The title text appears at the top of the chart view and
        is used as the label for the chart in the Contents pane.
    description
        Sets the description of the chart. The description text appears at the bottom of the
        chart view.
    xTitle
        Sets the title for the x-axis of the chart.
    yTitle
        Sets the title for the y-axis of the chart.
    dataSource
        Sets the data source of the chart. When a chart is exported using the exportToSVG method
        or displayed in an ArcGIS Notebook, the data source is read and rendered on the chart.
        Valid data sources include paths to datasets, including local datasets, UNC paths, and
        service URLs, and arcpy.mp Layer objects.
    displaySize
        Sets the size of the chart when exported using the exportToSVG method or displayed in an
        ArcGIS Notebook. The value must be specified as a two-item list, where the first item is
        the width of the chart and the second item is the height of the chart.
    """
    def __init__(self, x, *, y = None, splitCategory = None, multiSeriesDisplay = None, miniChartsPerRow = None, showPreviewChart = None,  aggregation = None, timeIntervalUnits = None, timeIntervalSize = None, trimIncompleteTimeInterval = None, timeAggregationType = None, referenceTime = None, nullPolicy = None, rotated = None, title = None, description = None, xTitle = None, yTitle = None, dataSource = None, displaySize = None, theme = None):

        super(Line, self).__init__("chart" + str(_uuid.uuid4()), title=title, description = description, xTitle = xTitle, yTitle = yTitle, dataSource = dataSource, displaySize = displaySize, theme = theme)

        self.type = "line"
        del self.line

        self.x = x
        if y != None:
            self.y = y
        else :
            self.y = ""

        if splitCategory != None:
            self.splitCategory = splitCategory
        if multiSeriesDisplay != None :
            self.multiSeriesDisplay = multiSeriesDisplay
        if miniChartsPerRow != None :
            self.miniChartsPerRow = miniChartsPerRow
        if showPreviewChart != None :
            self.showPreviewChart = showPreviewChart
        if aggregation != None :
            self.aggregation = aggregation
        if timeAggregationType != None :
            self.timeAggregationType = timeAggregationType
        if referenceTime != None:
            self.referenceTime = referenceTime
        if timeIntervalUnits != None :
            self.timeIntervalUnits = timeIntervalUnits
        if timeIntervalSize != None :
            self.timeIntervalSize = timeIntervalSize
        if trimIncompleteTimeInterval != None :
            self.trimIncompleteTimeInterval = trimIncompleteTimeInterval
        if nullPolicy != None :
            self.nullPolicy = nullPolicy
        if rotated != None:
            self.rotated = rotated

    x = _passthrough_attr('fieldX', doc = 'The name of the attribute field.')
    y = _passthrough_attr('fieldY', doc = 'The name of the attribute field.')
    aggregation = _passthrough_attr('aggregation')
    splitCategory = _passthrough_attr('splitCategory')
    sortSeries = _passthrough_attr('sortSeries')
    multiSeriesDisplay = _passthrough_attr('multiSeriesDisplay')
    miniChartsPerRow = _passthrough_attr('miniChartsPerRow')
    showPreviewChart = _passthrough_attr('showPreviewChart')
    timeIntervalUnits = _passthrough_attr('timeIntervalUnits')
    timeIntervalSize = _passthrough_attr('timeIntervalSize')
    trimIncompleteTimeInterval = _passthrough_attr('trimIncompleteTimeInterval')
    timeAggregationType = _passthrough_attr('timeAggregationType')
    referenceTime = _passthrough_attr('referenceTime')
    nullPolicy = _passthrough_attr('nullPolicy')
    rotated = _passthrough_attr('rotated')

class Histogram(Chart):
    """Sets histogram chart properties.

    x
        The field name for the x-axis variable. The field must be a numeric field.
    splitCategory
        A categorical field that adds a separate series for each unique
        value in the field.
    miniChartsPerRow
        Sets the number of mini charts per row when multiSeriesDisplay parameter is set to 'grid'
    showPreviewChart
        Indicates whether the preview chart is displayed when multiSeriesDisplay parameter is set to 'grid'.
    binCount
        The number of bins to display in the histogram.
    showMean
        Indicates whether the mean statistical line is visible in the histogram.
        True displays the line. False hides the line.
    showMedian
        Indicates whether the median statistical line is visible in the histogram.
        True displays the line. False hides the line.
    showStandardDeviation
        Indicates whether the standard deviation statistical line is visible in the histogram.
        True displays the line. False hides the line.
    showComparisonDistribution
        Indicates whether the normal distribution comparison line is visible in the histogram.
        True displays the line. False hides the line.
    dataTransformationType
        The data transformation type.
        Supported transformations are 'none', 'logarithmic', 'squareRoot', 'inverse', and 'boxCox'.
    dataTransformationParameters
        The data transformation parameters for the Box-Cox transformation. This parameter
        accepts a two-item list where the first item is the power parameter and the
        second item is the shift parameter.
    title
        Sets the title of the chart. The title text appears at the top of the chart view and
        is used as the label for the chart in the Contents pane.
    description
        Sets the description of the chart. The description text appears at the bottom of the
        chart view.
    xTitle
        Sets the title for the x-axis of the chart.
    yTitle
        Sets the title for the y-axis of the chart.
    dataSource
        Sets the data source of the chart. When a chart is exported using the exportToSVG method
        or displayed in an ArcGIS Notebook, the data source is read and rendered on the chart.
        Valid data sources include paths to datasets, including local datasets, UNC paths, and
        service URLs, and arcpy.mp Layer objects.
    displaySize
        Sets the size of the chart when exported using the exportToSVG method or displayed in an
        ArcGIS Notebook. The value must be specified as a two-item list, where the first item is
        the width of the chart and the second item is the height of the chart.
    """
    def __init__(self, x, *, splitCategory = None, miniChartsPerRow = None, showPreviewChart = None, binCount = None, showMean = None, showMedian = None, showStandardDeviation = None, showComparisonDistribution = None, dataTransformationType = None, dataTransformationParameters = None, title = None, description = None, xTitle = None, yTitle = None, dataSource = None, displaySize = None, theme = None):

        super(Histogram, self).__init__("chart" + str(_uuid.uuid4()), title=title, description = description, xTitle = xTitle, yTitle = yTitle, dataSource = dataSource, displaySize = displaySize, theme = theme)

        self.type = "histogram"
        del self.histogram

        self.x = x

        if splitCategory != None :
            self.splitCategory = splitCategory
        if miniChartsPerRow != None :
            self.miniChartsPerRow = miniChartsPerRow
        if showPreviewChart != None :
            self.showPreviewChart= showPreviewChart

        if binCount != None:
            self.binCount = binCount
        if showMean != None :
            self.showMean = showMean
        if showMedian != None :
            self.showMedian = showMedian
        if showStandardDeviation != None :
            self.showStandardDeviation = showStandardDeviation
        if showComparisonDistribution != None :
            self.showComparisonDistribution = showComparisonDistribution
        if dataTransformationType != None :
            self.dataTransformationType = dataTransformationType
        if dataTransformationParameters != None :
            self.dataTransformationParameters = dataTransformationParameters

    x = _passthrough_attr('fieldX', doc = 'The name of the attribute field.')
    splitCategory = _passthrough_attr('splitCategory')
    sortSeries = _passthrough_attr('sortSeries')
    miniChartsPerRow = _passthrough_attr('miniChartsPerRow')
    showPreviewChart = _passthrough_attr('showPreviewChart')
    binCount = _passthrough_attr('binCount')
    showMean = _passthrough_attr('showMean')
    showMedian = _passthrough_attr('showMedian')
    showStandardDeviation = _passthrough_attr('showStandardDeviation')
    showComparisonDistribution = _passthrough_attr('showComparisonDistribution')
    dataTransformationType = _passthrough_attr('dataTransformationType')
    dataTransformationParameters = _passthrough_attr('dataTransformationParameters')

class Scatter(Chart):
    """Sets scatter plot properties.

    x
        The field name for the x-axis variable. The field must be a numeric field.
    y
        The field name for the y-axis variable. The field must be a numeric field.
    splitCategory
        A categorical field that adds a separate series for each unique
        value in the field.
    sizeField
        The field used to determine the size of the proportional symbol when creating
        a bubble plot.
    sizeMin
        The minimum size for points in a bubble plot.
    sizeMax
        The maximum size for points in a bubble plot.
    multiSeriesDisplay
        The display type for a bar chart with multiple series.
        Valid options are 'sideBySide', 'stacked', 'stacked100', and 'grid'.
    miniChartsPerRow
        Sets the number of mini charts per row when multiSeriesDisplay parameter is set to 'grid'
    showPreviewChart
        Indicates whether the preview chart is displayed when multiSeriesDisplay parameter is set to 'grid'.
    showTrendLine
        Indicates whether the trend line is visible in the scatter plot.
        True displays the line. False hides the line.
    title
        Sets the title of the chart. The title text appears at the top of the chart view and
        is used as the label for the chart in the Contents pane.
    description
        Sets the description of the chart. The description text appears at the bottom of the
        chart view.
    xTitle
        Sets the title for the x-axis of the chart.
    yTitle
        Sets the title for the y-axis of the chart.
    dataSource
        Sets the data source of the chart. When a chart is exported using the exportToSVG method
        or displayed in an ArcGIS Notebook, the data source is read and rendered on the chart.
        Valid data sources include paths to datasets, including local datasets, UNC paths, and
        service URLs, and arcpy.mp Layer objects.
    displaySize
        Sets the size of the chart when exported using the exportToSVG method or displayed in an
        ArcGIS Notebook. The value must be specified as a two-item list, where the first item is
        the width of the chart and the second item is the height of the chart.
    """
    def __init__(self, x, y, *, splitCategory = None, sizeField = None, sizeMin = None, sizeMax = None, multiSeriesDisplay = None, miniChartsPerRow = None, showPreviewChart = None, showTrendLine = None, title = None, description = None, xTitle = None, yTitle = None, dataSource = None, displaySize = None, theme = None):

        super(Scatter, self).__init__("chart" + str(_uuid.uuid4()), title=title, description = description, xTitle = xTitle, yTitle = yTitle, dataSource = dataSource, displaySize = displaySize, theme = theme)

        self.type = "scatter"
        del self.scatter

        self.x = x
        self.y = y

        if splitCategory != None :
            self.splitCategory = splitCategory
        if sizeField != None :
            self.sizeField = sizeField
        if sizeMin != None:
            self.sizeMin = sizeMin
        if sizeMax != None:
            self.sizeMax = sizeMax
        if multiSeriesDisplay != None :
            self.multiSeriesDisplay = multiSeriesDisplay
        if miniChartsPerRow != None :
            self.miniChartsPerRow = miniChartsPerRow
        if showPreviewChart != None :
            self.showPreviewChart= showPreviewChart
        if showTrendLine != None :
            self.showTrendLine = showTrendLine

    x = _passthrough_attr('fieldX', doc = 'The name of the attribute field.')
    y = _passthrough_attr('fieldY1', doc = 'The name of the attribute field.')
    splitCategory = _passthrough_attr('splitCategory')
    sizeField = _passthrough_attr('fieldZ', doc = 'The name of the attribute field.')
    sizeMin =  _passthrough_attr('bubbleMinSize')
    sizeMax =  _passthrough_attr('bubbleMaxSize')
    sortSeries = _passthrough_attr('sortSeries')
    multiSeriesDisplay = _passthrough_attr('multiSeriesDisplay')
    miniChartsPerRow = _passthrough_attr('miniChartsPerRow')
    showPreviewChart = _passthrough_attr('showPreviewChart')
    showTrendLine = _passthrough_attr('showTrendLine')

class QQPlot(Chart):
    """Sets scatter plot properties.

    x
        The field name for the x-axis variable. The field must be a numeric field.
    y
        The field name for the y-axis variable, which is used to compare against
        the distribution of the x-axis variable. The field must be a numeric field.
    showReferenceLine
        Indicates whether the reference line is visible in the QQ plot. True displays
        the line. False hides the line.
    dataTransformationType
        The data transformation type.
        Supported transformations are 'none', 'logarithmic', 'squareRoot', 'inverse', and 'boxCox'.
    dataTransformationParameters
        The data transformation parameters for the Box-Cox transformation. This parameter
        accepts a two-item list where the first item is the power parameter and the
        second item is the shift parameter.
    title
        Sets the title of the chart. The title text appears at the top of the chart view and
        is used as the label for the chart in the Contents pane.
    description
        Sets the description of the chart. The description text appears at the bottom of the
        chart view.
    xTitle
        Sets the title for the x-axis of the chart.
    yTitle
        Sets the title for the y-axis of the chart.
    dataSource
        Sets the data source of the chart. When a chart is exported using the exportToSVG method
        or displayed in an ArcGIS Notebook, the data source is read and rendered on the chart.
        Valid data sources include paths to datasets, including local datasets, UNC paths, and
        service URLs, and arcpy.mp Layer objects.
    displaySize
        Sets the size of the chart when exported using the exportToSVG method or displayed in an
        ArcGIS Notebook. The value must be specified as a two-item list, where the first item is
        the width of the chart and the second item is the height of the chart.
   """
    def __init__(self, x, *, y = None, showReferenceLine = None, dataTransformationType = None, dataTransformationParameters = None, title = None, description = None, xTitle = None, yTitle = None, dataSource = None, displaySize = None, theme = None):

        super(QQPlot, self).__init__("chart" + str(_uuid.uuid4()), title=title, description = description, xTitle = xTitle, yTitle = yTitle, dataSource = dataSource, displaySize = displaySize, theme = theme)

        self.type = "qqPlot"
        del self.qqPlot

        self.x = x
        if y != None :
            self.y = y

        if showReferenceLine != None :
            self.showReferenceLine = showReferenceLine
        if dataTransformationType != None :
            self.dataTransformationType = dataTransformationType
        if dataTransformationParameters != None :
            self.dataTransformationParameters = dataTransformationParameters

    x = _passthrough_attr('fieldX', doc = 'The name of the attribute field.')
    y = _passthrough_attr('fieldY1', doc = 'The name of the attribute field.')
    showReferenceLine = _passthrough_attr('showReferenceLine')
    dataTransformationType = _passthrough_attr('dataTransformationType')
    dataTransformationParameters = _passthrough_attr('dataTransformationParameters')

class ScatterMatrix(Chart):
    """Sets scatter plot matrix properties.

    fields
        A list of field names to display in the matrix. A minimum of three fields is required.
    showTrendLine
        Indicates whether trend lines are visible in the scatter plots.
        True displays the lines. False hides the lines.
    lowerLeft
        Sets the display of the lower left half of the matrix.
        Supported options are 'R_SQUARED', 'PEARSONS_R', and 'SCATTERPLOTS'.
    upperRight
        Sets the display of the upper right half of the matrix.
        Supported options are 'R_SQUARED', 'PEARSONS_R', 'SCATTERPLOTS', 'PREVIEW_PLOT',
        and 'NONE'.
    diagonal
        Sets the display of the diagonal view.
        Supported options are 'FIELD_NAMES', 'HISTOGRAMS', and 'NONE'.
    sort
        The sorting method that is applied to the matrix.
        Supported options are 'ASC', 'DESC', and 'NONE'.
        Use ASC or DESC to specify a sorting direction when sortBy is set to 'R_SQUARED' or
        'PEARSONS_R'. When 'NONE' is chosen, the matrix will be sorted by the order of the
        fields list.
    sortBy
        The method that is used to sort the matrix when you want to sort the rows according
        to the metric scores for a target field.
        Supported options are 'R_SQUARED' and 'PEARSONS_R'.
        When 'R_SQUARED' or 'PEARSONS_R' are chosen, the matrix will be sorted by metrics for the
        field specified by the first item in the fields list. When this property is not explicitly
        set, the matrix will be sorted by the order of the fields list.
    title
        Sets the title of the chart. The title text appears at the top of the chart view and
        is used as the label for the chart in the Contents pane.
    description
        Sets the description of the chart. The description text appears at the bottom of the
        chart view.
    dataSource
        Sets the data source of the chart. When a chart is exported using the exportToSVG method
        or displayed in an ArcGIS Notebook, the data source is read and rendered on the chart.
        Valid data sources include paths to datasets, including local datasets, UNC paths, and
        service URLs, and arcpy.mp Layer objects.
    displaySize
        Sets the size of the chart when exported using the exportToSVG method or displayed in an
        ArcGIS Notebook. The value must be specified as a two-item list, where the first item is
        the width of the chart and the second item is the height of the chart.
    """
    def __init__(self, fields, *, showTrendLine = None, lowerLeft = None, upperRight = None, diagonal = None, sort = None, sortBy = None, title = None, description = None, dataSource = None, displaySize = None, theme = None):

        super(ScatterMatrix, self).__init__("chart" + str(_uuid.uuid4()), title=title, description = description, dataSource = dataSource, displaySize = displaySize, theme = theme)

        self.type = "scatterMatrix"
        del self.scatterMatrix
        del self.xAxis
        del self.yAxis

        self.fields = fields

        if showTrendLine != None :
            self.showTrendLine = showTrendLine
        if lowerLeft != None :
            self.lowerLeft = lowerLeft
        if upperRight != None :
            self.upperRight = upperRight
        if diagonal != None :
            self.diagonal = diagonal
        if sort != None :
            self.sort = sort
        if sortBy != None :
            self.sortBy = sortBy


    fields = _passthrough_attr('fields')
    showTrendLine = _passthrough_attr('showTrendLine')
    lowerLeft = _passthrough_attr('lowerLeft')
    upperRight =  _passthrough_attr('upperRight')
    diagonal = _passthrough_attr('diagonal')
    sort = _passthrough_attr('sort')
    sortBy = _passthrough_attr('sortBy')

class DataClock(Chart):
    """Sets data clock chart properties.

    dateField
        The name of the date field that is used to create the chart.
    numberField
        The name of the field that is aggregated and used to determine the
        color of the chart cells.
    timeUnitsRingWedge
        The description for the time-unit pair supported in the data clock chart.
        The following options are supported: 'YEARS_MONTHS', 'YEARS_WEEKS', 'YEARS_DAYS',
        'WEEKS_DAYS', 'DAYS_HOURS'.
    aggregation
        The statistical calculation applied to values aggregated into each cell.
        Supported statistics are 'COUNT', 'SUM', 'MEAN', 'MEDIAN', 'MIN', and 'MAX'.
    nullPolicy
        How summarized cells returning a null value are displayed.
        Supported options are 'null' and 'zero'.
    classificationMethod
        The classification method used to visualize cell color.
        Supported options are 'equalIntervals', 'geometricalIntervals', 'naturalBreaks',
        and 'quantiles'.
    classCount
        The number of classes used in the classification method.
    title
        Sets the title of the chart. The title text appears at the top of the chart view and
        is used as the label for the chart in the Contents pane.
    description
        Sets the description of the chart. The description text appears at the bottom of the
        chart view.
    dataSource
        Sets the data source of the chart. When a chart is exported using the exportToSVG method
        or displayed in an ArcGIS Notebook, the data source is read and rendered on the chart.
        Valid data sources include paths to datasets, including local datasets, UNC paths, and
        service URLs, and arcpy.mp Layer objects.
    displaySize
        Sets the size of the chart when exported using the exportToSVG method or displayed in an
        ArcGIS Notebook. The value must be specified as a two-item list, where the first item is
        the width of the chart and the second item is the height of the chart.
    """
    def __init__(self, dateField, *, numberField = None, timeUnitsRingWedge = None, aggregation = None, nullPolicy = None, classificationMethod = None, classCount = None, title = None, description = None, dataSource = None, displaySize = None, theme = None):

        super(DataClock, self).__init__("chart" + str(_uuid.uuid4()), title = title, description = description, dataSource = dataSource, displaySize = displaySize, theme = theme)

        self.type = "dataClock"
        del self.dataClock
        del self.xAxis
        del self.yAxis

        self.dateField = dateField
        if numberField != None :
            self.numberField = numberField

        if timeUnitsRingWedge != None:
            self.timeUnitsRingWedge = timeUnitsRingWedge
        if aggregation != None:
            self.aggregation = aggregation
        if nullPolicy != None:
            self.nullPolicy = nullPolicy
        if classificationMethod != None:
            self.classificationMethod = classificationMethod
        if classCount != None:
            self.classCount = classCount

    dateField = _passthrough_attr('fieldX', doc = 'The name of the attribute field.')
    numberField = _passthrough_attr('fieldY1', doc = 'The name of the attribute field.')
    aggregation = _passthrough_attr('aggregation')
    timeUnitsRingWedge = _passthrough_attr('timeUnitsRingWedge')
    nullPolicy = _passthrough_attr('nullPolicy')
    classificationMethod = _passthrough_attr('classificationMethod')
    classCount = _passthrough_attr('classCount')

class CalendarHeat(Chart):
    """
    Sets calendar heat chart properties.

    dateField
        The name of the date field that is used to create the chart.
    numberField
        The name of the field that is aggregated and used to determine the color
        of the chart cells.
    calendarType
        The description for the time-unit pair supported in the data clock chart.
        Supported options are 'YEAR_MONTHSDAYS' and 'WEEK_DAYSHOURS'.
    viewType
        Sets calendar heat chart view type to be de-aggregated into consecutive calendars or aggregated into a single calendar.
        Supported options are 'SINGLE' and 'SEQUENTIAL`
    invertViews    
        Indicates whether the rows' (years or months) order should be ascending in bottom-top (True) or top-bottom (False) direction.
    includeLeapDay
        Indicates whether to include the leap day (February 29) cell in the chart.
    aggregation
        The statistical calculation applied to values aggregated into each cell.
        Supported statistics are 'COUNT', 'SUM', 'MEAN', 'MEDIAN', 'MIN', and 'MAX'.
    nullPolicy
        How summarized cells returning a null value are displayed.
        Supported options are 'null' and 'zero'.
    classificationMethod
        The classification method used to visualize cell color.
        Supported options are 'equalIntervals', 'geometricalIntervals', 'naturalBreaks',
        and 'quantiles'
    classCount
        The number of classes used in the classification method.
    title
        Sets the title of the chart. The title text appears at the top of the chart view and
        is used as the label for the chart in the Contents pane.
    description
        Sets the description of the chart. The description text appears at the bottom of the
        chart view.
    xTitle
        Sets the title for the x-axis of the chart.
    yTitle
        Sets the title for the y-axis of the chart.
    dataSource
        Sets the data source of the chart. When a chart is exported using the exportToSVG method
        or displayed in an ArcGIS Notebook, the data source is read and rendered on the chart.
        Valid data sources include paths to datasets, including local datasets, UNC paths, and
        service URLs, and arcpy.mp Layer objects.
    displaySize
        Sets the size of the chart when exported using the exportToSVG method or displayed in an
        ArcGIS Notebook. The value must be specified as a two-item list, where the first item is
        the width of the chart and the second item is the height of the chart.
    """
    def __init__(self, dateField, *, numberField = None, calendarType = None, viewType = None, invertViews = None, includeLeapDay = None, aggregation = None, nullPolicy = None, classificationMethod = None, classCount = None, title = None, description = None, xTitle = None, yTitle = None, dataSource = None, displaySize = None, theme = None):

        super(CalendarHeat, self).__init__("chart" + str(_uuid.uuid4()), title=title, description = description, xTitle = xTitle, yTitle = yTitle, dataSource = dataSource, displaySize = displaySize, theme = theme)

        self.type = "calendarHeatChart"
        del self.calendarHeatChart

        self.dateField = dateField
        if numberField != None :
            self.numberField = numberField

        if calendarType != None:
            self.calendarType = calendarType
        if viewType != None :
            self.viewType = viewType
        if invertViews != None :
            self.invertViews = invertViews
        if includeLeapDay != None :
            self.includeLeapDay = includeLeapDay
        if aggregation != None:
            self.aggregation = aggregation
        if nullPolicy != None:
            self.nullPolicy = nullPolicy
        if classificationMethod != None:
            self.classificationMethod = classificationMethod
        if classCount != None:
            self.classCount = classCount

    dateField = _passthrough_attr('fieldX', doc = 'The name of the attribute field.')
    numberField = _passthrough_attr('fieldY1', doc = 'The name of the attribute field.')
    aggregation = _passthrough_attr('aggregation')
    calendarType = _passthrough_attr('calendarType')
    nullPolicy = _passthrough_attr('nullPolicy')
    classificationMethod = _passthrough_attr('classificationMethod')
    classCount = _passthrough_attr('classCount')
    includeLeapDay = _passthrough_attr('includeLeapDay')
    viewType = _passthrough_attr('calendarViewType')
    invertViews = _passthrough_attr('invert')

class MatrixHeat(Chart):
    """Sets matrix heat chart properties.

    x
        The name of the field that determines the column categories.
    y
        The name of the field that determines the row categories.
    numberField
        The name of the field that is aggregated and used to determine the color of the chart cells.
    aggregation
        The statistical calculation applied to values aggregated into each cell.
        Supported statistics are 'COUNT', 'SUM', 'MEAN', 'MEDIAN', 'MIN', and 'MAX'.
    nullPolicy
       How summarized cells returning a null value are displayed.
       Supported options are 'null' and 'zero'.
    classificationMethod
        The classification method used to visualize cell color.
        Supported options are 'equalIntervals', 'geometricalIntervals', 'naturalBreaks',
        and 'quantiles'.
    classCount
        The number of classes used in the classification method.
    title
        Sets the title of the chart. The title text appears at the top of the chart view and
        is used as the label for the chart in the Contents pane.
    description
        Sets the description of the chart. The description text appears at the bottom of the
        chart view.
    xTitle
        Sets the title for the x-axis of the chart.
    yTitle
        Sets the title for the y-axis of the chart.
    dataSource
        Sets the data source of the chart. When a chart is exported using the exportToSVG method
        or displayed in an ArcGIS Notebook, the data source is read and rendered on the chart.
        Valid data sources include paths to datasets, including local datasets, UNC paths, and
        service URLs, and arcpy.mp Layer objects.
    displaySize
        Sets the size of the chart when exported using the exportToSVG method or displayed in an
        ArcGIS Notebook. The value must be specified as a two-item list, where the first item is
        the width of the chart and the second item is the height of the chart.
    timeBinningPropertiesCol
        Sets time binning properties, if needed for date-time based x field, as TimeBinningProperties object
    timeBinningPropertiesRow
        Sets time binning properties, if needed for date-time based y field, as TimeBinningProperties object
    """
    def __init__(self, x, y, *, numberField = None, aggregation = None, nullPolicy = None, classificationMethod = None, classCount = None, title = None, description = None, xTitle = None, yTitle = None, dataSource = None, displaySize = None, theme = None,
                 timeBinningPropertiesCol = None, timeBinningPropertiesRow = None):

        super(MatrixHeat, self).__init__("chart" + str(_uuid.uuid4()), title=title, description = description, xTitle = xTitle, yTitle = yTitle, dataSource = dataSource, displaySize = displaySize, theme = theme)

        self.type = "matrixHeatChart"
        del self.matrixHeatChart

        self.x = x
        self.y = y
        if numberField != None :
            self.numberField = numberField
        else :
            self.numberField = ""

        if aggregation != None:
            self.aggregation = aggregation
        if nullPolicy != None:
            self.nullPolicy = nullPolicy
        if classificationMethod != None:
            self.classificationMethod = classificationMethod
        if classCount != None:
            self.classCount = classCount
        if timeBinningPropertiesCol != None :
            self.timeBinningPropertiesCol = timeBinningPropertiesCol
        if timeBinningPropertiesRow != None :
            self.timeBinningPropertiesRow = timeBinningPropertiesRow

    x = _passthrough_attr('fieldX', doc = 'The name of the attribute field.')
    y = _passthrough_attr('fieldY1', doc = 'The name of the attribute field.')
    numberField = _passthrough_attr('fieldZ', doc = 'The name of the attribute field.')
    aggregation = _passthrough_attr('aggregation')
    nullPolicy = _passthrough_attr('nullPolicy')
    classificationMethod = _passthrough_attr('classificationMethod')
    classCount = _passthrough_attr('classCount')
    timeBinningPropertiesRow = _passthrough_attr('timeBinningPropertiesRow')
    timeBinningPropertiesCol = _passthrough_attr('timeBinningPropertiesCol')

def _getWebSpecFromChartCimArray(dataSource, chartCimArray):
    from .cim.cimloader import  CimJsonEncoder
    enc = CimJsonEncoder();
    chartJsonArray = []
    for chartCim in chartCimArray:
        chartJsonArray.append(enc.encode(chartCim))

    import arcgisscripting
    return arcgisscripting.charts._getWebSpecFromChartJsonArray(*_gp_fixargs((dataSource,chartJsonArray,), True))

def _openChartView(mapMember, chartName):   
    import arcgisscripting
    return arcgisscripting.charts._openChartView(*_gp_fixargs((mapMember,chartName,), True))
