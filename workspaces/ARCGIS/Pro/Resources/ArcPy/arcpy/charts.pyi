import pyarrow as pa
from arcpy._mp import Table, Layer
from datetime import datetime
from typing import Literal, Iterable


class Legend:

    @property
    def visible(self) -> bool:
        """Specifies whether the legend is visible."""
        ...
    
    @visible.setter
    def visible(self, value: bool) -> None: ...

    @property
    def title(self) -> str:
        """The title of the legend."""
        ...
    
    @title.setter
    def title(self, value: str) -> None: ...

    @property
    def alignment(self) -> Literal["left", "bottom", "top", "right"]:
        """Specifies the alignment of the legend."""
        ...
    
    @alignment.setter
    def alignment(self, value: Literal["left", "bottom", "top", "right"]) -> None: ...



class Chart:

    legend: Legend
    """The properties of the legend."""
    
    @property
    def title(self) -> str:
        """The title of the chart."""
        ...

    @title.setter
    def title(self, value: str) -> None: ...

    @property
    def description(self) -> str:
        """The description of the chart."""
        ...

    @description.setter
    def description(self, value: str) -> None: ...

    @property
    def dataSource(self) -> str | Table | Layer | pa.Table:
        """The data source of the chart."""
        ...

    @dataSource.setter
    def dataSource(self, value: str | Table | Layer | pa.Table) -> None: ...

    @property
    def displaySize(self) -> Iterable[int | float]:
        """The display size of the chart."""
        ...

    @displaySize.setter
    def displaySize(self, value: Iterable[int | float]) -> None: ...

    @property
    def theme(self) -> str:
        """The name of the theme that is applied to the chart."""
        ...

    @theme.setter
    def theme(self, value: str) -> None: ...

    def addToLayer(self, layer_or_layerfile: Layer | Table) -> None: ...
    
    def exportToSVG(self, path: str, width: int, height: int) -> None: ...

    def updateChart(self) -> None: ...
    

class Bar(Chart):

    class XAxis:
   
        @property
        def field(self) -> str:
            """The field of the axis."""
            ...

        @field.setter
        def field(self, value: str) -> None: ...
        
        @property
        def maximum(self) -> int | float:
            """The maximum extent of the axis."""
            ...
        
        @maximum.setter
        def maximum(self, value: int | float) -> None: ...

        @property
        def minimum(self) -> int | float:
            """The minimum extent of the axis."""
            ...

        @minimum.setter
        def minimum(self, value: int | float) -> None: ...

        @property
        def sort(self) -> Literal["ASC", "DESC"] | Iterable[str]:
            """The sort option of the axis."""
            ...

        @sort.setter
        def sort(self, value: Literal["ASC", "DESC"] | Iterable[str]) -> None: ...

        @property 
        def title(self) -> str:
            """The title of the axis."""
            ...

        @title.setter
        def title(self, value: str) -> None: ...

        @property 
        def useAdaptiveBounds(self) -> bool:
            """Specifies whether adaptive bounds are applied to mini-charts."""
            ...
        
        @useAdaptiveBounds.setter
        def useAdaptiveBounds(self, value: bool) -> None: ...

    class YAxis:

        @property
        def field(self) -> str | Iterable[str]:
            """The field of the axis."""
            ...

        @field.setter
        def field(self, value: str | Iterable[str]) -> None: ...
        
        @property
        def maximum(self) -> int | float:
            """The maximum extent of the axis."""
            ...
        
        @maximum.setter
        def maximum(self, value: int | float) -> None: ...

        @property
        def minimum(self) -> int | float:
            """The minimum extent of the axis."""
            ...

        @minimum.setter
        def minimum(self, value: int | float) -> None: ...

        @property
        def sort(self) -> Literal["ASC", "DESC"]:
            """The sort option of the axis."""
            ...

        @sort.setter
        def sort(self, value: Literal["ASC", "DESC"]) -> None: ...

        @property 
        def title(self) -> str:
            """The title of the axis."""
            ...

        @title.setter
        def title(self, value: str) -> None: ...

        @property 
        def useAdaptiveBounds(self) -> bool:
            """Specifies whether adaptive bounds are applied to mini-charts."""
            ...
        
        @useAdaptiveBounds.setter
        def useAdaptiveBounds(self, value: bool) -> None: ...
        

    @property
    def x(self) -> str:
        """The x axis field name."""
        ...
    
    @x.setter
    def x(self, value: str) -> None: ...

    @property
    def y(self) -> str | Iterable[str]:
        """The y axis field name(s)."""
        ...

    @y.setter
    def y(self, value: str | Iterable[str]) -> None: ...   

    @property
    def aggregation(self) -> Literal["", "COUNT", "SUM", "MEAN", "MEDIAN", "MIN", "MAX"]: 
        """Specifies the aggregation option applied to the values on the x axis."""
        ...
    
    @aggregation.setter
    def aggregation(self, value: Literal["", "COUNT", "SUM", "MEAN", "MEDIAN", "MIN", "MAX"]) -> None: ...

    @property
    def splitCategory(self) -> str:
        """A second categorical field that adds a separate series for each unique value in the field."""
        ...

    @splitCategory.setter
    def splitCategory(self, value: str) -> None: ...

    @property
    def multiSeriesDisplay(self) -> Literal["sideBySide", "stacked", "stacked100", "grid"]:
        """Specifies the display type when displaying multiple series."""
        ...

    @multiSeriesDisplay.setter
    def multiSeriesDisplay(self, value: Literal["sideBySide", "stacked", "stacked100", "grid"]) -> None: ...

    @property
    def nullCategoryColor(self) -> str:
        """The hexadecimal color value for the null category bar."""
        ...
    
    @nullCategoryColor.setter
    def nullCategoryColor(self, value: str) -> None: ...

    @property
    def nullCategoryLabel(self) -> str:
        """The label for the null category bar."""
        ...
    
    @nullCategoryLabel.setter
    def nullCategoryLabel(self, value: str) -> None: ...

    @property
    def miniChartsPerRow(self) -> int:
        """The number of minicharts that will be shown per row."""
        ...
    
    @miniChartsPerRow.setter
    def miniChartsPerRow(self, value: int) -> None: ...

    @property
    def showPreviewChart(self) -> bool:
        """Specifies whether the preview chart is displayed."""
        ...

    @showPreviewChart.setter
    def showPreviewChart(self, value: bool) -> None: ...

    @property
    def showMovingAverage(self) -> bool:
        """Specifies whether the moving average line is displayed."""
        ...

    @showMovingAverage.setter
    def showMovingAverage(self, value: bool) -> None: ...

    @property
    def showNullCategory(self) -> bool:
        """Specifies whether the null values are summarized by an additional bar."""
        ...

    @showNullCategory.setter
    def showNullCategory(self, value: bool) -> None: ...
    
    @property
    def movingAveragePeriod(self) -> int:
        """The size of the moving average period."""
        ...
    
    @movingAveragePeriod.setter
    def movingAveragePeriod(self, value: int) -> None: ...

    @property
    def timeBinningProperties(self) -> TimeBinningProperties:
        """The time binning properties from the `TimeBinningProperties` class."""
        ...
    
    @timeBinningProperties.setter
    def timeBinningProperties(self, value: TimeBinningProperties) -> None: ...

    @property
    def rotated(self) -> bool:
        """Specifies whether the chart is rotated."""
        ...

    @rotated.setter
    def rotated(self, value: bool) -> None: ...

    xAxis: XAxis
    """The properties of the x axis."""

    yAxis: YAxis
    """The properties of the y axis."""

    def __init__(
        self,
        x: str,
        *,
        y: str | Iterable[str] | None = None, 
        aggregation: Literal["", "COUNT", "SUM", "MEAN", "MEDIAN", "MIN", "MAX"] | None = None,
        splitCategory: str | None = None,
        multiSeriesDisplay: Literal["sideBySide", "stacked", "stacked100", "grid"] | None = None,
        miniChartsPerRow: int | None = None,
        showPreviewChart: bool | None = None,
        showMovingAverage: bool | None = None,
        movingAveragePeriod: int | None = None,
        timeBinningProperties: TimeBinningProperties | None = None,
        rotated: bool | None = None,
        title: str | None = None,
        description: str | None = None,
        xTitle: str | None = None,
        yTitle: str | None = None,
        dataSource: str | Table | Layer | pa.Table | None = None,
        displaySize: Iterable[int | float] | None = None,
        theme: str | None = None
    ) -> None: ...


class Box(Chart):

    class XAxis:
   
        @property
        def field(self) -> str:
            """The field of the axis."""
            ...

        @field.setter
        def field(self, value: str) -> None: ...
        
        @property
        def maximum(self) -> int | float:
            """The maximum extent of the axis."""
            ...
        
        @maximum.setter
        def maximum(self, value: int | float) -> None: ...

        @property
        def minimum(self) -> int | float:
            """The minimum extent of the axis."""
            ...

        @minimum.setter
        def minimum(self, value: int | float) -> None: ...

        @property
        def sort(self) -> Literal["ASC", "DESC"]:
            """The sort option of the axis."""
            ...

        @sort.setter
        def sort(self, value: Literal["ASC", "DESC"]) -> None: ...

        @property 
        def title(self) -> str:
            """The title of the axis."""
            ...

        @title.setter
        def title(self, value: str) -> None: ...


    class YAxis:

        @property
        def field(self) -> str | Iterable[str]:
            """The field of the axis."""
            ...

        @field.setter
        def field(self, value: str | Iterable[str]) -> None: ...
        
        @property
        def maximum(self) -> int | float:
            """The maximum extent of the axis."""
            ...
        
        @maximum.setter
        def maximum(self, value: int | float) -> None: ...

        @property
        def minimum(self) -> int | float:
            """The minimum extent of the axis."""
            ...

        @minimum.setter
        def minimum(self, value: int | float) -> None: ...

        @property
        def sort(self) -> Literal["MEAN_ASC", "MEAN_DESC", "MEDIAN_ASC", "MEDIAN_DESC"]:
            """The sort option of the axis."""
            ...

        @sort.setter
        def sort(self, value: Literal["MEAN_ASC", "MEAN_DESC", "MEDIAN_ASC", "MEDIAN_DESC"]) -> None: ...

        @property 
        def title(self) -> str:
            """The title of the axis."""
            ...

        @title.setter
        def title(self, value: str) -> None: ...


    @property
    def y(self) -> str | Iterable[str]:
        """The y axis field name(s)."""
        ...

    @y.setter
    def y(self, value: str | Iterable[str]) -> None: ...   
  
    @property
    def x(self) -> str:
        """The x axis field name."""
        ...
    
    @x.setter
    def x(self, value: str) -> None: ...

    @property
    def splitCategory(self) -> str:
        """A second categorical field that adds a separate series for each unique value in the field."""
        ...

    @splitCategory.setter
    def splitCategory(self, value: str) -> None: ...

    @property
    def splitCategoryAsMeanLine(self) -> bool:
        """Specifies whether multiseries box plots display as mean lines or side-by-side boxes."""
        ...

    @splitCategoryAsMeanLine.setter
    def splitCategoryAsMeanLine(self, value: bool) -> None: ...

    @property
    def standardizeValues(self) -> bool:
        """Specifies whether values are standardized."""
        ...

    @standardizeValues.setter
    def standardizeValues(self, value: bool) -> None: ...

    @property
    def showOutliers(self) -> bool:
        """Specifies whether the outliers are displayed."""
        ...

    @showOutliers.setter
    def showOutliers(self, value: bool) -> None: ...

    @property
    def rotated(self) -> bool:
        """Specifies whether the chart is rotated."""
        ...

    @rotated.setter
    def rotated(self, value: bool) -> None: ...

    xAxis: XAxis
    """The properties of the x axis."""

    yAxis: YAxis
    """The properties of the y axis."""

    def __init__(
        self,
        y: str | Iterable[str],
        *,
        x: str | None = None,
        splitCategory: str | None = None,
        splitCategoryAsMeanLine: bool | None = None,
        standardizeValues: bool | None = None,
        showOutliers: bool | None = None,
        rotated: bool | None = None,
        title: str | None = None,
        description: str | None = None,
        xTitle: str | None = None,
        yTitle: str | None = None,
        dataSource: str | Table | Layer | pa.Table | None = None,
        displaySize: Iterable[int | float] | None = None,
        theme: str | None = None
    ) -> None: ...


class Pie(Chart):

    @property
    def categoryField(self) -> str:
        """The category field name."""
        ...
    
    @categoryField.setter
    def categoryField(self, value: str) -> None: ...

    @property
    def numberFields(self) -> str | Iterable[str]:
        """The number field name(s)."""
        ...

    @numberFields.setter
    def numberFields(self, value: str | Iterable[str]) -> None: ...   

    @property
    def splitCategory(self) -> str:
        """A categorical field that adds a separate series for each unique value in the field."""
        ...

    @splitCategory.setter
    def splitCategory(self, value: str) -> None: ...

    @property
    def miniChartsPerRow(self) -> int:
        """The number of minicharts that will be shown per row."""
        ...
    
    @miniChartsPerRow.setter
    def miniChartsPerRow(self, value: int) -> None: ...

    @property
    def showPreviewChart(self) -> bool:
        """Specifies whether the preview chart is displayed."""
        ...

    @showPreviewChart.setter
    def showPreviewChart(self, value: bool) -> None: ...

    @property
    def groupingPercent(self) -> int:
        """The percentage threshold for grouping smaller slices into a single Other category."""
        ...
    
    @groupingPercent.setter
    def groupingPercent(self, value: int) -> None: ... 

    @property
    def donutSize(self) -> int:
        """The size (0-100) of the hole when displaying a pie chart as a donut."""
        ...
    
    @donutSize.setter
    def donutSize(self, value: int) -> None: ... 
  
    @property
    def sort(self) -> Literal["LABEL_CLOCKWISE", "LABEL_COUNTERCLOCKWISE", "VALUE_CLOCKWISE", "VALUE_COUNTERCLOCKWISE"]:
        """The sort order for the slices in the chart."""
        ...
    
    @sort.setter
    def sort(self, value: Literal["LABEL_CLOCKWISE", "LABEL_COUNTERCLOCKWISE", "VALUE_CLOCKWISE", "VALUE_COUNTERCLOCKWISE"]) -> None: ...

    @property
    def showDataLabels(self) -> bool:
        """Specifies whether data labels are displayed."""
        ...

    @showDataLabels.setter
    def showDataLabels(self, value: bool) -> None: ...

    @property
    def dataLabelsDisplay(self) -> Literal["VALUE", "PERCENTAGE", "PERCENTAGE_AND_VALUE"]:
        """The sort order for the slices in the chart."""
        ...
    
    @dataLabelsDisplay.setter
    def dataLabelsDisplay(self, value: Literal["VALUE", "PERCENTAGE", "PERCENTAGE_AND_VALUE"]) -> None: ...


    def __init__(
        self,
        categoryField: str | None = None,
        numberFields: str | Iterable[str] | None = None,
        splitCategory: str | None = None,
        miniChartsPerRow: int | None = None,
        showPreviewChart: bool | None = None,
        groupingPercent: int | None = None,
        donutSize: int | None = None,
        sort: Literal["LABEL_CLOCKWISE", "LABEL_COUNTERCLOCKWISE", "VALUE_CLOCKWISE", "VALUE_COUNTERCLOCKWISE"] | None = None,
        showDataLabels: bool | None = None,
        dataLabelsDisplay: Literal["VALUE", "PERCENTAGE", "PERCENTAGE_AND_VALUE"] | None = None,
        title: str | None = None,
        description: str | None = None,
        dataSource: str | Table | Layer | pa.Table | None = None,
        displaySize: Iterable[int | float] | None = None,
        theme: str | None = None
    ) -> None: ...


class Line(Chart):

    class XAxis:
   
        @property
        def field(self) -> str:
            """The field of the axis."""
            ...

        @field.setter
        def field(self, value: str) -> None: ...
        
        @property
        def logarithmic(self) -> bool:
            """Specifies whether the axis is logarithmic."""
            ...
        
        @logarithmic.setter
        def logarithmic(self, value: bool) -> None: ...

        @property
        def maximum(self) -> int | float:
            """The maximum extent of the axis."""
            ...
        
        @maximum.setter
        def maximum(self, value: int | float) -> None: ...

        @property
        def minimum(self) -> int | float:
            """The minimum extent of the axis."""
            ...

        @minimum.setter
        def minimum(self, value: int | float) -> None: ...

        @property
        def sort(self) -> Literal["ASC", "DESC"] | Iterable[str]:
            """The sort option of the axis."""
            ...

        @sort.setter
        def sort(self, value: Literal["ASC", "DESC"] | Iterable[str]) -> None: ...

        @property 
        def title(self) -> str:
            """The title of the axis."""
            ...

        @title.setter
        def title(self, value: str) -> None: ...

    class YAxis:

        @property
        def field(self) -> str | Iterable[str]:
            """The field of the axis."""
            ...

        @field.setter
        def field(self, value: str | Iterable[str]) -> None: ...
        
        @property
        def logarithmic(self) -> bool:
            """Specifies whether the axis is logarithmic."""
            ...
        
        @logarithmic.setter
        def logarithmic(self, value: bool) -> None: ...

        @property
        def maximum(self) -> int | float:
            """The maximum extent of the axis."""
            ...
        
        @maximum.setter
        def maximum(self, value: int | float) -> None: ...

        @property
        def minimum(self) -> int | float:
            """The minimum extent of the axis."""
            ...

        @minimum.setter
        def minimum(self, value: int | float) -> None: ...

        @property
        def sort(self) -> Literal["ASC", "DESC"] | Iterable[str]:
            """The sort option of the axis."""
            ...

        @sort.setter
        def sort(self, value: Literal["ASC", "DESC"] | Iterable[str]) -> None: ...

        @property 
        def title(self) -> str:
            """The title of the axis."""
            ...

        @title.setter
        def title(self, value: str) -> None: ...

        @property 
        def useAdaptiveBounds(self) -> bool:
            """Specifies whether adaptive bounds are applied to mini-charts."""
            ...
        
        @useAdaptiveBounds.setter
        def useAdaptiveBounds(self, value: bool) -> None: ...

        @property
        def invert(self) -> bool:
            """Specifies whether the axis is inverted."""
            ...
        
        @invert.setter
        def invert(self, bool) -> None: ...


    @property
    def x(self) -> str:
        """The x axis field name."""
        ...
    
    @x.setter
    def x(self, value: str) -> None: ...

    @property
    def y(self) -> str | Iterable[str]:
        """The y axis field name(s)."""
        ...

    @y.setter
    def y(self, value: str | Iterable[str]) -> None: ...   

    @property
    def aggregation(self) -> Literal["", "COUNT", "SUM", "MEAN", "MEDIAN", "MIN", "MAX"]: 
        """Specifies the aggregation option applied to the values on the x axis."""
        ...
    
    @aggregation.setter
    def aggregation(self, value: Literal["", "COUNT", "SUM", "MEAN", "MEDIAN", "MIN", "MAX"]) -> None: ...

    @property
    def splitCategory(self) -> str:
        """A second categorical field that adds a separate series for each unique value in the field."""
        ...

    @splitCategory.setter
    def splitCategory(self, value: str) -> None: ...

    @property
    def multiSeriesDisplay(self) -> Literal["singleChart", "grid"]:
        """Specifies the display type when displaying multiple series."""
        ...

    @multiSeriesDisplay.setter
    def multiSeriesDisplay(self, value: Literal["singleChart", "grid"]) -> None: ...

    @property
    def miniChartsPerRow(self) -> int:
        """The number of minicharts that will be shown per row."""
        ...
    
    @miniChartsPerRow.setter
    def miniChartsPerRow(self, value: int) -> None: ...

    @property
    def showPreviewChart(self) -> bool:
        """Specifies whether the preview chart is displayed."""
        ...

    @showPreviewChart.setter
    def showPreviewChart(self, value: bool) -> None: ...

    @property
    def timeIntervalUnits(self) -> Literal["SECONDS", "MINUTES", "HOURS", "DAYS", "WEEKS", "MONTHS", "YEARS"]:
        """Specifies the time units."""
        ...
    
    @timeIntervalUnits.setter   
    def timeIntervalUnits(self, value: Literal["SECONDS", "MINUTES", "HOURS", "DAYS", "WEEKS", "MONTHS", "YEARS"]) -> None: ...

    @property
    def timeIntervalSize(self) -> int:
        """Specifies the span of time that is binned or aggregated."""
        ...
    
    @timeIntervalSize.setter   
    def timeIntervalSize(self, value: int) -> None: ...

    @property
    def timeAggregationType(self) -> Literal["equalIntervalsFromStartTime", "equalIntervalsFromEndTime"]:
        """Specifies the time interval alignment type."""
        ...
    
    @timeAggregationType.setter   
    def timeAggregationType(self, value: Literal["equalIntervalsFromStartTime", "equalIntervalsFromEndTime"]) -> None: ...

    @property
    def trimIncompleteInterval(self) -> bool:
        """Specifies wether incomplete time intervals at the start or end of the date span are removed (trimmed)."""
        ...

    @trimIncompleteInterval.setter
    def trimIncompleteInterval(self, value: bool) -> None: ...

    @property
    def nullPolicy(self) -> Literal["null", "zero", "interpolate"]:
        """Specifies how sumarized bins returning a null value are displayed."""
        ...

    @nullPolicy.setter
    def nullPolicy(self, value: Literal["null", "zero", "interpolate"]): ...

    @property
    def rotated(self) -> bool:
        """Specifies whether the chart is rotated."""
        ...

    @rotated.setter
    def rotated(self, value: bool) -> None: ...

    xAxis: XAxis
    """The properties of the x axis."""

    yAxis: YAxis
    """The properties of the y axis."""

    def __init__(
        self,
        x: str,
        *,
        y: str | Iterable[str] | None = None,
        splitCategory: str | None = None,
        multiSeriesDisplay: Literal["singleChart", "grid"] | None = None,
        miniChartsPerRow: int | None = None,
        showPreviewChart: bool | None = None,
        aggregation: Literal["", "COUNT", "SUM", "MEAN", "MEDIAN", "MIN", "MAX"] | None = None,
        timeIntervalUnits: Literal["SECONDS", "MINUTES", "HOURS", "DAYS", "WEEKS", "MONTHS", "YEARS"] | None = None,
        timeIntervalSize: int | None = None,
        timeAggregationType: Literal["equalIntervalsFromStartTime", "equalIntervalsFromEndTime"] | None = None,
        trimIncompleteInterval: bool | None = None,
        nullPolicy: Literal["null", "zero", "interpolate"] | None = None,
        rotated: bool | None = None,
        title: str | None = None,
        description: str | None = None,
        xTitle: str | None = None,
        yTitle: str | None = None,
        dataSource: str | Table | Layer | pa.Table | None = None,
        displaySize: Iterable[int | float] | None = None,
        theme: str | None = None
    ) -> None: ...


class Histogram(Chart):

    class XAxis:
   
        @property
        def field(self) -> str:
            """The field of the axis."""
            ...

        @field.setter
        def field(self, value: str) -> None: ...
        
        @property
        def maximum(self) -> int | float:
            """The maximum extent of the axis."""
            ...
        
        @maximum.setter
        def maximum(self, value: int | float) -> None: ...

        @property
        def minimum(self) -> int | float:
            """The minimum extent of the axis."""
            ...

        @minimum.setter
        def minimum(self, value: int | float) -> None: ...

        @property 
        def title(self) -> str:
            """The title of the axis."""
            ...

        @title.setter
        def title(self, value: str) -> None: ...

    class YAxis:

        @property
        def maximum(self) -> int | float:
            """The maximum extent of the axis."""
            ...
        
        @maximum.setter
        def maximum(self, value: int | float) -> None: ...

        @property
        def minimum(self) -> int | float:
            """The minimum extent of the axis."""
            ...

        @minimum.setter
        def minimum(self, value: int | float) -> None: ...

        @property 
        def title(self) -> str:
            """The title of the axis."""
            ...

        @title.setter
        def title(self, value: str) -> None: ...

    @property
    def x(self) -> str:
        """The x axis field name."""
        ...
    
    @x.setter
    def x(self, value: str) -> None: ...

    @property
    def splitCategory(self) -> str:
        """A second categorical field that adds a separate series for each unique value in the field."""
        ...

    @splitCategory.setter
    def splitCategory(self, value: str) -> None: ...

    @property
    def miniChartsPerRow(self) -> int:
        """The number of minicharts that will be shown per row."""
        ...
    
    @miniChartsPerRow.setter
    def miniChartsPerRow(self, value: int) -> None: ...

    @property
    def showPreviewChart(self) -> bool:
        """Specifies whether the preview chart is displayed."""
        ...

    @showPreviewChart.setter
    def showPreviewChart(self, value: bool) -> None: ...

    @property
    def binCount(self) -> int:
        """The number of bins to display in the histogram."""
        ...
    
    @binCount.setter
    def binCount(self, value: int) -> None: ...

    @property
    def showMean(self) -> bool:
        """Specifies whether the mean statistical line is visible in the histogram."""
        ...

    @showMean.setter
    def showMean(self, value: bool) -> None: ...

    @property
    def showMedian(self) -> bool:
        """Specifies whether the median statistical line is visible in the histogram."""
        ...

    @showMedian.setter
    def showMedian(self, value: bool) -> None: ...

    @property
    def showStandardDeviation(self) -> bool:
        """Specifies whether the standard deviation lines are visible in the histogram."""
        ...

    @showStandardDeviation.setter
    def showStandardDeviation(self, value: bool) -> None: ...

    @property
    def showComparisonDistribution(self) -> bool:
        """Specifies whether the normal distribution comparison line is visible in the histogram."""
        ...

    @showComparisonDistribution.setter
    def showComparisonDistribution(self, value: bool) -> None: ...

    @property
    def dataTransformationType(self) -> Literal["none", "logarithmic", "squareRoot", "inverse", "boxCox"]:
        """Specifies the data transformation type."""
        ...
    
    @dataTransformationType.setter   
    def dataTransformationType(self, value: Literal["none", "logarithmic", "squareRoot", "inverse", "boxCox"]) -> None: ...

    @property 
    def dataTransformationParameters(self) -> Iterable[int]:
        """The data transformation parameters for the Box-Cox transformation. This parameter accepts a two-item list 
        in which the first item is the power parameter and the second item is the shift parameter."""
        ...
    
    @dataTransformationParameters.setter
    def dataTransformationParameters(self, value: Iterable[int]) -> None: ...

    xAxis: XAxis
    """The properties of the x axis."""

    yAxis: YAxis
    """The properties of the y axis."""

    def __init__(
        self,
        x: str,
        *,
        splitCategory: str | None = None,
        miniChartsPerRow: int | None = None,
        showPreviewChart: bool | None = None,
        binCount: int | None = None,
        showMean: bool | None = None,
        showMedian: bool | None = None,
        showStandardDeviation: bool | None = None,
        showComparisonDistribution: bool | None = None,
        dataTransformationType: Literal["none", "logarithmic", "squareRoot", "inverse", "boxCox"] | None = None,
        dataTransformationParameters: Iterable[int] | None = None,
        title: str | None = None,        
        description: str | None = None,
        xTitle: str | None = None,
        yTitle: str | None = None,
        dataSource: str | Table | Layer | pa.Table | None = None,
        displaySize: Iterable[int | float] | None = None,
        theme: str | None = None
    ) -> None: ...


class Scatter(Chart):

    class XAxis:

        @property
        def field(self) -> str | Iterable[str]:
            """The field of the axis."""
            ...

        @field.setter
        def field(self, value: str | Iterable[str]) -> None: ...
        
        @property
        def logarithmic(self) -> bool:
            """Specifies whether the axis is logarithmic."""
            ...
        
        @logarithmic.setter
        def logarithmic(self, value: bool) -> None: ...

        @property
        def maximum(self) -> int | float:
            """The maximum extent of the axis."""
            ...
        
        @maximum.setter
        def maximum(self, value: int | float) -> None: ...

        @property
        def minimum(self) -> int | float:
            """The minimum extent of the axis."""
            ...

        @minimum.setter
        def minimum(self, value: int | float) -> None: ...

        @property 
        def title(self) -> str:
            """The title of the axis."""
            ...

        @title.setter
        def title(self, value: str) -> None: ...

        @property 
        def useAdaptiveBounds(self) -> bool:
            """Specifies whether adaptive bounds are applied to mini-charts."""
            ...
        
        @useAdaptiveBounds.setter
        def useAdaptiveBounds(self, value: bool) -> None: ...

        @property
        def invert(self) -> bool:
            """Specifies whether the axis is inverted."""
            ...
        
        @invert.setter
        def invert(self, bool) -> None: ...

    class YAxis:

        @property
        def field(self) -> str | Iterable[str]:
            """The field of the axis."""
            ...

        @field.setter
        def field(self, value: str | Iterable[str]) -> None: ...
        
        @property
        def logarithmic(self) -> bool:
            """Specifies whether the axis is logarithmic."""
            ...
        
        @logarithmic.setter
        def logarithmic(self, value: bool) -> None: ...

        @property
        def maximum(self) -> int | float:
            """The maximum extent of the axis."""
            ...
        
        @maximum.setter
        def maximum(self, value: int | float) -> None: ...

        @property
        def minimum(self) -> int | float:
            """The minimum extent of the axis."""
            ...

        @minimum.setter
        def minimum(self, value: int | float) -> None: ...

        @property 
        def title(self) -> str:
            """The title of the axis."""
            ...

        @title.setter
        def title(self, value: str) -> None: ...

        @property 
        def useAdaptiveBounds(self) -> bool:
            """Specifies whether adaptive bounds are applied to mini-charts."""
            ...
        
        @useAdaptiveBounds.setter
        def useAdaptiveBounds(self, value: bool) -> None: ...

        @property
        def invert(self) -> bool:
            """Specifies whether the axis is inverted."""
            ...
        
        @invert.setter
        def invert(self, bool) -> None: ...

    @property
    def x(self) -> str:
        """The x axis field name."""
        ...
    
    @x.setter
    def x(self, value: str) -> None: ...

    @property
    def y(self) -> str:
        """The y axis field name."""
        ...

    @y.setter
    def y(self, value: str) -> None: ...   

    @property
    def splitCategory(self) -> str:
        """A second categorical field that adds a separate series for each unique value in the field."""
        ...

    @splitCategory.setter
    def splitCategory(self, value: str) -> None: ...

    @property
    def multiSeriesDisplay(self) -> Literal["singleChart", "grid"]:
        """Specifies the display type when displaying multiple series."""
        ...

    @multiSeriesDisplay.setter
    def multiSeriesDisplay(self, value: Literal["singleChart", "grid"]) -> None: ...

    @property
    def miniChartsPerRow(self) -> int:
        """The number of minicharts that will be shown per row."""
        ...
    
    @miniChartsPerRow.setter
    def miniChartsPerRow(self, value: int) -> None: ...

    @property
    def showPreviewChart(self) -> bool:
        """Specifies whether the preview chart is displayed."""
        ...

    @showPreviewChart.setter
    def showPreviewChart(self, value: bool) -> None: ...

    @property
    def showTrendLine(self) -> bool:
        """Specifies whether the trend line is displayed."""
        ...

    @showTrendLine.setter
    def showTrendLine(self, value: bool) -> None: ...

    @property
    def sizeField(self) -> str:
        """The field used to determine the size of the proportional symbol when creating a bubble plot."""
        ...
    
    @sizeField.setter
    def sizeField(self, value: str) -> None: ...

    @property
    def sizeMin(self) -> int:
        """The minimum size for points in a bubble plot."""
        ...
    
    @sizeMin.setter
    def sizeMin(self, value: int) -> None: ...

    @property
    def sizeMax(self) -> int:
        """The maximum size for points in a bubble plot."""
        ...
    
    @sizeMax.setter
    def sizeMax(self, value: int) -> None: ...

    xAxis: XAxis
    """The properties of the x axis."""

    yAxis: YAxis
    """The properties of the y axis."""

    def __init__(
        self,
        x: str,
        y: str,
        *,
        splitCategory: str | None = None,
        sizeField: str | None = None,
        sizeMin: int | None = None,
        sizeMax: int | None = None,
        multiSeriesDisplay: Literal["singleChart", "grid"] | None = None,
        miniChartsPerRow: int | None = None,
        showPreviewChart: bool | None = None,
        showTrendLine: bool | None = None,
        title: str | None = None,
        description: str | None = None,
        xTitle: str | None = None,
        yTitle: str | None = None,
        dataSource: str | Table | Layer | pa.Table | None = None,
        displaySize: Iterable[int | float] | None = None,
        theme: str | None = None
    ) -> None: ...


class QQPlot(Chart):

    class XAxis:
   
        @property
        def field(self) -> str:
            """The field of the axis."""
            ...

        @field.setter
        def field(self, value: str) -> None: ...
        
        @property
        def maximum(self) -> int | float:
            """The maximum extent of the axis."""
            ...
        
        @maximum.setter
        def maximum(self, value: int | float) -> None: ...

        @property
        def minimum(self) -> int | float:
            """The minimum extent of the axis."""
            ...

        @minimum.setter
        def minimum(self, value: int | float) -> None: ...

        @property 
        def title(self) -> str:
            """The title of the axis."""
            ...

        @title.setter
        def title(self, value: str) -> None: ...

    class YAxis:
   
        @property
        def field(self) -> str:
            """The field of the axis."""
            ...

        @field.setter
        def field(self, value: str) -> None: ...
        
        @property
        def maximum(self) -> int | float:
            """The maximum extent of the axis."""
            ...
        
        @maximum.setter
        def maximum(self, value: int | float) -> None: ...

        @property
        def minimum(self) -> int | float:
            """The minimum extent of the axis."""
            ...

        @minimum.setter
        def minimum(self, value: int | float) -> None: ...

        @property 
        def title(self) -> str:
            """The title of the axis."""
            ...

        @title.setter
        def title(self, value: str) -> None: ...

    @property
    def x(self) -> str:
        """The x axis field name."""
        ...
    
    @x.setter
    def x(self, value: str) -> None: ...

    @property
    def y(self) -> str:
        """The y axis field name."""
        ...

    @y.setter
    def y(self, value: str) -> None: ... 

    @property
    def showReferenceLine(self) -> bool:
        """Specifies whether the reference line is displayed."""
        ...

    @showReferenceLine.setter
    def showReferenceLine(self, value: bool) -> None: ...

    @property
    def dataTransformationType(self) -> Literal["none", "logarithmic", "squareRoot", "inverse", "boxCox"]:
        """Specifies the data transformation type."""
        ...
    
    @dataTransformationType.setter   
    def dataTransformationType(self, value: Literal["none", "logarithmic", "squareRoot", "inverse", "boxCox"]) -> None: ...

    @property 
    def dataTransformationParameters(self) -> Iterable[int]:
        """The data transformation parameters for the Box-Cox transformation. This parameter accepts a two-item list 
        in which the first item is the power parameter and the second item is the shift parameter."""
        ...
    
    @dataTransformationParameters.setter
    def dataTransformationParameters(self, value: Iterable[int]) -> None: ...

    xAxis: XAxis
    """The properties of the x axis."""

    yAxis: YAxis
    """The properties of the y axis."""

    def __init__(
        self,
        x: str,
        *,
        y: str | None = None,
        showReferenceLine: bool | None = None,
        dataTransformationType: Literal["none", "logarithmic", "squareRoot", "inverse", "boxCox"] | None = None,
        dataTransformationParameters: Iterable[int] | None = None,
        title: str | None = None,
        description: str | None = None,
        xTitle: str | None = None,
        yTitle: str | None = None,
        dataSource: str | Table | Layer | pa.Table | None = None,
        displaySize: Iterable[int | float] | None = None,
        theme: str | None = None
    ) -> None: ...


class ScatterMatrix(Chart):

    @property
    def fields(self) -> Iterable[str]:
        """The x axis field name."""
        ...
    
    @fields.setter
    def fields(self, value: Iterable[str]) -> None: ...

    @property
    def showTrendLine(self) -> bool:
        """Specifies whether the trend lines are displayed."""
        ...

    @showTrendLine.setter
    def showTrendLine(self, value: bool) -> None: ...

    @property
    def lowerLeft(self) -> Literal["R_SQUARED", "PEARSONS_R", "SCATTERPLOTS"]:
        """Sets the display of the lower left half of the matrix."""
        ...

    @lowerLeft.setter
    def lowerLeft(self, value: Literal["R_SQUARED", "PEARSONS_R", "SCATTERPLOTS"]) -> None: ...

    @property
    def upperRight(self) -> Literal["R_SQUARED", "PEARSONS_R", "SCATTERPLOTS", "PREVIEW_PLOT", "NONE"]:
        """Sets the display of the upper right half of the matrix."""
        ...

    @upperRight.setter
    def upperRight(self, value: Literal["R_SQUARED", "PEARSONS_R", "SCATTERPLOTS", "PREVIEW_PLOT", "NONE"]) -> None: ...

    @property
    def diagonal(self) -> Literal["FIELD_NAMES", "HISTOGRAMS", "NONE"]:
        """Sets the display of the diagonal view."""
        ...

    @diagonal.setter
    def diagonal(self, value: Literal["FIELD_NAMES", "HISTOGRAMS", "NONE"]) -> None: ...

    @property
    def sort(self) -> Literal["ASC", "DESC", "NONE"]:
        """The sorting method that is applied to the matrix."""
        ...

    @sort.setter
    def sort(self, value: Literal["ASC", "DESC", "NONE"]) -> None: ...

    @property
    def sortBy(self) -> Literal["R_SQUARED", "PEARSONS_R"]:
        """The method that is used to sort the matrix when you want to sort the rows according to the metric scores for a target field."""
        ...

    @sortBy.setter
    def sortBy(self, value: Literal["R_SQUARED", "PEARSONS_R"]) -> None: ...

    def __init__(
        self,
        fields: Iterable[str],
        *,
        showTrendLine: bool | None = None,
        lowerLeft: Literal["R_SQUARED", "PEARSONS_R", "SCATTERPLOTS"] | None = None,
        upperRight: Literal["R_SQUARED", "PEARSONS_R", "SCATTERPLOTS", "PREVIEW_PLOT", "NONE"] | None = None,
        diagonal: Literal["FIELD_NAMES", "HISTOGRAMS", "NONE"] | None = None,
        sort: Literal["ASC", "DESC", "NONE"] | None = None,
        sortBy: Literal["R_SQUARED", "PEARSONS_R"] | None = None,
        title: str | None = None,
        description: str | None = None,
        dataSource: str | Table | Layer | pa.Table | None = None,
        displaySize: Iterable[int | float] | None = None,
        theme: str | None = None
    ) -> None: ...


class DataClock(Chart):

    @property
    def dateField(self) -> str:
        """The field name for the date field."""
        ...
    
    @dateField.setter
    def dateField(self, value: str) -> None: ...

    @property
    def numberField(self) -> str:
        """The name of the field that is aggregated and used to determine the color of the chart cells."""
        ...
    
    @numberField.setter
    def numberField(self, value: str) -> None: ...


    @property
    def timeUnitsRingWedge(self) -> Literal["YEARS_MONTHS", "YEARS_WEEKS", "YEARS_DAYS", "WEEKS_DAYS", "DAYS_HOURS"]: 
        """Specifies the time-unit pair that is supported in the data clock chart."""
        ...
    
    @timeUnitsRingWedge.setter
    def timeUnitsRingWedge(self, value: Literal["YEARS_MONTHS", "YEARS_WEEKS", "YEARS_DAYS", "WEEKS_DAYS", "DAYS_HOURS"]) -> None: ...

    @property
    def aggregation(self) -> Literal["COUNT", "SUM", "MEAN", "MEDIAN", "MIN", "MAX"]: 
        """Specifies the statistical calculation that will be applied to values aggregated into each cell."""
        ...
    
    @aggregation.setter
    def aggregation(self, value: Literal["COUNT", "SUM", "MEAN", "MEDIAN", "MIN", "MAX"]) -> None: ...

    @property
    def nullPolicy(self) -> Literal["null", "zero"]: 
        """Specifies how summarized cells returning a null value will be displayed."""
        ...
    
    @nullPolicy.setter
    def nullPolicy(self, value: Literal["null", "zero"]) -> None: ...

    @property
    def classificationMethod(self) ->Literal["equalIntervals", "geometricalIntervals", "naturalBreaks", "quantiles"]: 
        """Specifies the classification method that will be used to visualize cell color and classify data."""
        ...
    
    @classificationMethod.setter
    def classificationMethod(self, value: Literal["equalIntervals", "geometricalIntervals", "naturalBreaks", "quantiles"]) -> None: ...

    @property
    def classCount(self) -> int:
        """The number of classes used in the classification method."""
        ...

    def __init__(
        self,
        dateField: str,
        *,
        numberField: str | None = None,
        timeUnitsRingWedge: Literal["YEARS_MONTHS", "YEARS_WEEKS", "YEARS_DAYS", "WEEKS_DAYS", "DAYS_HOURS"] | None = None,
        aggregation: Literal["COUNT", "SUM", "MEAN", "MEDIAN", "MIN", "MAX"] | None = None,
        nullPolicy: Literal["null", "zero"] | None = None,
        classificationMethod: Literal["equalIntervals", "geometricalIntervals", "naturalBreaks", "quantiles"] | None = None,
        classCount: int | None = None,
        title: str | None = None,
        description: str | None = None,
        dataSource: str | Table | Layer | pa.Table | None = None,
        displaySize: Iterable[int | float] | None = None,
        theme: str | None = None
    ) -> None: ...


class CalendarHeat(Chart):

    class XAxis:
   
        @property
        def field(self) -> str:
            """The field of the axis."""
            ...

        @field.setter
        def field(self, value: str) -> None: ...
        
        @property 
        def title(self) -> str:
            """The title of the axis."""
            ...

        @title.setter
        def title(self, value: str) -> None: ...

    class YAxis:
   
        @property
        def field(self) -> str:
            """The field of the axis."""
            ...

        @field.setter
        def field(self, value: str) -> None: ...
        
        @property 
        def title(self) -> str:
            """The title of the axis."""
            ...

        @title.setter
        def title(self, value: str) -> None: ...

    @property
    def dateField(self) -> str:
        """The field name for the date field."""
        ...
    
    @dateField.setter
    def dateField(self, value: str) -> None: ...

    @property
    def numberField(self) -> str:
        """The name of the field that is aggregated and used to determine the color of the chart cells."""
        ...
    
    @numberField.setter
    def numberField(self, value: str) -> None: ...

    @property
    def calendarType(self) -> Literal["YEAR_MONTHSDAYS", "WEEK_DAYSHOURS"]:
        """Specifies the time-unit pair that is supported in the calendar heat chart."""
        ...
    
    @calendarType.setter   
    def calendarType(self, value: Literal["YEAR_MONTHSDAYS", "WEEK_DAYSHOURS"]) -> None: ...

    @property
    def viewType(self) -> Literal["SINGLE", "SEQUENTIAL"]:
        """Specifies whether the calendar will be collapsed into a single calendar view or displayed 
        as sequential calendar views."""
        ...
    
    @viewType.setter   
    def viewType(self, value: Literal["SINGLE", "SEQUENTIAL"]) -> None: ...

    @property
    def includeLeapDay(self) -> bool:
        """Specifies whether the leap day (February 29) cell will be included in the chart."""
        ...

    @includeLeapDay.setter
    def includeLeapDay(self, value: bool) -> None: ...

    @property
    def invertViews(self) -> bool:
        """Specifies whether the calendar view is inverted."""
        ...

    @invertViews.setter
    def invertViews(self, value: bool) -> None: ...

    @property
    def aggregation(self) -> Literal["COUNT", "SUM", "MEAN", "MEDIAN", "MIN", "MAX"]: 
        """Specifies the statistical calculation that will be applied to values aggregated into each cell."""
        ...
    
    @aggregation.setter
    def aggregation(self, value: Literal["COUNT", "SUM", "MEAN", "MEDIAN", "MIN", "MAX"]) -> None: ...

    @property
    def nullPolicy(self) -> Literal["null", "zero"]: 
        """Specifies how summarized cells returning a null value will be displayed."""
        ...
    
    @nullPolicy.setter
    def nullPolicy(self, value: Literal["null", "zero"]) -> None: ...

    @property
    def classificationMethod(self) ->Literal["equalIntervals", "geometricalIntervals", "naturalBreaks", "quantiles"]: 
        """Specifies the classification method that will be used to visualize cell color and classify data."""
        ...
    
    @classificationMethod.setter
    def classificationMethod(self, value: Literal["equalIntervals", "geometricalIntervals", "naturalBreaks", "quantiles"]) -> None: ...

    @property
    def classCount(self) -> int:
        """The number of classes used in the classification method."""
        ...
    
    @classCount.setter
    def classCount(self, value: int) -> None: ...

    xAxis: XAxis
    """The properties of the x axis."""

    yAxis: YAxis
    """The properties of the y axis."""

    def __init__(
        self,
        dateField: str,
        *,
        numberField: str | None = None,
        calendarType: Literal["YEAR_MONTHSDAYS", "WEEK_DAYSHOURS"] | None = None,
        viewType: Literal["SINGLE", "SEQUENTIAL"] | None = None,
        includeLeapDay: bool | None = None,
        aggregation: Literal["COUNT", "SUM", "MEAN", "MEDIAN", "MIN", "MAX"] | None = None,
        nullPolicy: Literal["null", "zero"] | None = None,
        classificationMethod: Literal["equalIntervals", "geometricalIntervals", "naturalBreaks", "quantiles"] | None = None,
        classCount: int | None = None,
        title: str | None = None,
        description: str | None = None,
        xTitle: str | None = None,
        yTitle: str | None = None,
        dataSource: str | Table | Layer | pa.Table | None = None,
        displaySize: Iterable[int | float] | None = None,
        theme: str | None = None
    ) -> None: ...


class MatrixHeat(Chart):

    class XAxis:
   
        @property
        def field(self) -> str:
            """The field of the axis."""
            ...

        @field.setter
        def field(self, value: str) -> None: ...
        
        @property
        def sort(self)  -> Literal["ASC", "DESC"] | Iterable[str]:
            """The sorting method applied to this axis."""

        @sort.setter
        def sort(self, value: Literal["ASC", "DESC"] | Iterable[str]) -> None:
            ...

        @property 
        def title(self) -> str:
            """The title of the axis."""
            ...

        @title.setter
        def title(self, value: str) -> None: ...

    class YAxis:
   
        @property
        def field(self) -> str:
            """The field of the axis."""
            ...

        @field.setter
        def field(self, value: str) -> None: ...
        
        @property
        def sort(self)  -> Literal["ASC", "DESC"] | Iterable[str]:
            """The sorting method applied to this axis."""

        @sort.setter
        def sort(self, value: Literal["ASC", "DESC"] | Iterable[str]) -> None:
            ...

        @property 
        def title(self) -> str:
            """The title of the axis."""
            ...

        @title.setter
        def title(self, value: str) -> None: ...

    @property
    def x(self) -> str:
        """The field name that determines the column categories."""
        ...
    
    @x.setter
    def x(self, value: str) -> None: ...

    @property
    def y(self) -> str:
        """The field name that determines the row categories."""
        ...

    @y.setter
    def y(self, value: str) -> None: ...  

    @property
    def numberField(self) -> str:
        """The name of the field that is aggregated and used to determine the color of the chart cells."""
        ...
    
    @numberField.setter
    def numberField(self, value: str) -> None: ...

    @property
    def aggregation(self) -> Literal["COUNT", "SUM", "MEAN", "MEDIAN", "MIN", "MAX"]: 
        """Specifies the statistical calculation that will be applied to values aggregated into each cell."""
        ...
    
    @aggregation.setter
    def aggregation(self, value: Literal["COUNT", "SUM", "MEAN", "MEDIAN", "MIN", "MAX"]) -> None: ...

    @property
    def nullPolicy(self) -> Literal["null", "zero"]: 
        """Specifies how summarized cells returning a null value will be displayed."""
        ...
    
    @nullPolicy.setter
    def nullPolicy(self, value: Literal["null", "zero"]) -> None: ...

    @property
    def classificationMethod(self) ->Literal["equalIntervals", "geometricalIntervals", "naturalBreaks", "quantiles"]: 
        """Specifies the classification method that will be used to visualize cell color and classify data."""
        ...
    
    @classificationMethod.setter
    def classificationMethod(self, value: Literal["equalIntervals", "geometricalIntervals", "naturalBreaks", "quantiles"]) -> None: ...

    @property
    def classCount(self) -> int:
        """The number of classes used in the classification method."""

    @property
    def timeBinningPropertiesRow(self) -> TimeBinningProperties:
        """The time binning properties from the `TimeBinningProperties` class that are applied to the row axis."""
        ...
    
    @timeBinningPropertiesRow.setter
    def timeBinningPropertiesRow(self, value: TimeBinningProperties) -> None: ...

    @property
    def timeBinningPropertiesCol(self) -> TimeBinningProperties:
        """The time binning properties from the `TimeBinningProperties` class that are applied to the column axis."""
        ...
    
    @timeBinningPropertiesCol.setter
    def timeBinningPropertiesCol(self, value: TimeBinningProperties) -> None: ...

    xAxis: XAxis
    """The properties of the x axis."""

    yAxis: YAxis
    """The properties of the y axis."""

    def __init__(
        self,
        x: str,
        y: str,
        *,
        numberField: str | None = None,
        aggregation: Literal["COUNT", "SUM", "MEAN", "MEDIAN", "MIN", "MAX"] | None = None,
        nullPolicy: Literal["null", "zero"] | None = None,
        classificationMethod: Literal["equalIntervals", "geometricalIntervals", "naturalBreaks", "quantiles"] | None = None,
        classCount: int | None = None,
        timeBinningPropertiesCol: TimeBinningProperties | None = None,
        timeBinningPropertiesRow: TimeBinningProperties | None = None,
        title: str | None = None,
        description: str | None = None,
        xTitle: str | None = None,
        yTitle: str | None = None,
        dataSource: str | Table | Layer | pa.Table | None = None,
        displaySize: Iterable[int | float] | None = None,
        theme: str | None = None
    ) -> None: ...


class TimeBinningProperties(object):

    @property
    def intervalUnits(self) -> Literal["SECONDS", "MINUTES", "HOURS", "DAYS", "WEEKS", "MONTHS", "YEARS"]:
        """Specifies the time units."""
        ...
    
    @intervalUnits.setter   
    def intervalUnits(self, value: Literal["SECONDS", "MINUTES", "HOURS", "DAYS", "WEEKS", "MONTHS", "YEARS"]) -> None: ...

    @property
    def intervalSize(self) -> int:
        """Specifies the span of time that is binned or aggregated."""
        ...
    
    @intervalSize.setter   
    def intervalSize(self, value: int) -> None: ...

    @property
    def timeAggregationType(self) -> Literal["equalIntervalsFromStartTime", "equalIntervalsFromEndTime", "referenceTime"]:
        """Specifies the time interval alignment type."""
        ...
    
    @timeAggregationType.setter   
    def timeAggregationType(self, value: Literal["equalIntervalsFromStartTime", "equalIntervalsFromEndTime", "referenceTime"]) -> None: ...

    @property
    def trimIncompleteInterval(self) -> bool:
        """Specifies wether incomplete time intervals at the start or end of the date span are removed (trimmed)."""
        ...

    @trimIncompleteInterval.setter
    def trimIncompleteInterval(self, value: bool) -> None: ...

    @property 
    def referenceTime(self) -> datetime:
        """Specifies the date time that binning is initiated."""
        ...

    @referenceTime.setter
    def referenceTime(self, value: datetime) -> None:
        ...

    def __init__(
        self,
        intervalSize: int | None = None,
        intervalUnits: Literal["SECONDS", "MINUTES", "HOURS", "DAYS", "WEEKS", "MONTHS", "YEARS"] | None = None,
        timeAggregationType: Literal["equalIntervalsFromStartTime", "equalIntervalsFromEndTime", "referenceTime"] | None = None,
        trimIncompleteInterval: bool | None = None,
        referenceTime: datetime | None = None
    ) -> None: ...


class Guide(object):

    @property
    def guideType(self) -> Literal["line", "range", "polyline"]:
        """Specifies the guide type."""
        ...
    
    @guideType.setter
    def guideType(self, value: Literal["line", "range", "polyline"]) -> None:
        ...

    @property
    def name(self) -> str:
        """The unique name of the guide."""
        ...
    
    @name.setter
    def name(self, value: str) -> None: ...

    @property
    def label(self) -> str:
        """The guide label that will be displayed on the chart."""
        ...
    
    @label.setter
    def label(self, value: str) -> None: ...

    @property
    def valueFrom(self) -> int | float:
        """The axis value at which the line or range guide starts."""
        ...
    
    @valueFrom.setter
    def valueFrom(self, value: int | float) -> None: ...

    @property
    def valueTo(self) -> int | float:
        """The axis value at which the range guide ends."""
        ...
    
    @valueTo.setter
    def valueTo(self, value: int | float) -> None: ...

    @property
    def polyline(self) -> Iterable[int | float]:
        """Vertices of the polyline guide as a list of x and y coordinates in a row-major order."""
        ...
    
    @polyline.setter
    def polyline(self, value:  Iterable[int | float]) -> None: ...

    
    @property
    def lineColor(self) -> str:
        """The RGBA color string that sets the color of the line guide."""
        ...
    
    @lineColor.setter
    def lineColor(self, value:  str) -> None: ...

    @property
    def lineWidth(self) -> int | float:
        """The width of the line."""
        ...
    
    @lineWidth.setter
    def lineWidth(self, value:  int | float) -> None: ...
 
    @property
    def lineDashStyle(self) -> Literal["solid", "dot", "dash", "dashDot", "longDash", "longDashDot"]:
        """The dash style of the line."""
        ...
    
    @lineDashStyle.setter
    def lineDashStyle(self, value: Literal["solid", "dot", "dash", "dashDot", "longDash", "longDashDot"]) -> None:
        ...

    @property
    def fillColor(self) -> str:
        """The RGBA color string that sets the color of the range guide."""
        ...
    
    @fillColor.setter
    def fillColor(self, value:  str) -> None: ...

    def __init__(
        self,
        guideType: Literal["line", "range", "polyline"],
        *,
        name: str | None = None,
        label: str | None = None,
        valueFrom: int | float | None = None,
        valueTo: int | float | None = None,
        fillColor: str | None = None,
        lineColor: str | None = None,
        lineWidth: int | float | None = None,
        lineDashStyle: Literal["solid", "dot", "dash", "dashDot", "longDash", "longDashDot"] | None = None,
        polyline: Iterable[int | float] | None = None
    ) -> None: ...
