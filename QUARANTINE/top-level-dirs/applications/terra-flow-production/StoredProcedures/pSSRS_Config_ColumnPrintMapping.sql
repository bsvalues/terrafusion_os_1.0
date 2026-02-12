CREATE PROCEDURE [RPT].[pSSRS_Config_ColumnPrintMapping]
@ColumnPrintID INT
AS
--EXEC RPT.pSSRS_Config_ColumnPrintMapping @ColumnPrintID = 14 -- int

--Report - List of FileNames and if they have been mapped - Click to Edit - Needs a Module Selector
--FileName ColumnPrint -> Mapping

DECLARE @ColumnPrintText AS VARCHAR(4000)
/*
DECLARE @ColumnPrintID INT
SET @ColumnPrintID = 1
*/
SET @ColumnPrintText = (SELECT TOP 1 columnprint_text FROM config.columnprint cp INNER JOIN config.modules m ON m.ModuleID = cp.ModuleID WHERE cp.columnprintid = @ColumnPrintID)

DECLARE @MapFromColumns TABLE (
SrcMapFromColumnName VARCHAR(500), 
DestMapFromColumnName VARCHAR(500),
ColumnPrintID INT,
FromSortOrder int
)

---- Create Mapping Path
	INSERT INTO @MapFromColumns
		(
			SrcMapFromColumnName,
			ColumnPrintID,
			FromSortOrder
		)
		SELECT Data ColumnName, @ColumnPrintID, RANK() OVER(ORDER BY Data ASC) SortOrder 
		FROM dbo.Split(@ColumnPrintText,',') z
		WHERE ISNULL(Data,'') <> ''

		UPDATE mfc
		SET mfc.DestMapFromColumnName = cm.destinationcolumnname
		FROM @MapFromColumns mfc
		INNER JOIN config.columnprintmapping cm ON mfc.SrcMapFromColumnName = cm.filecolumnname AND mfc.ColumnPrintID = cm.columnprintid
		WHERE cm.enabled = 1

DECLARE @MapToColumns TABLE (
ColumnPrintID INT,
MapToColumnName VARCHAR(500),
ToSortOrder int
)

INSERT INTO @MapToColumns
(
	ColumnPrintID,
    MapToColumnName,
	ToSortOrder
)
SELECT @ColumnPrintID, destinationcolumnname, RANK() OVER(ORDER BY destinationcolumnname ASC) SortOrder
FROM config.columnprintmapping WHERE columnprintid = 0
--UNION 
--SELECT @ColumnPrintID, '-Clear-', -99

SELECT frm.SrcMapFromColumnName,
       frm.DestMapFromColumnName,
       frm.ColumnPrintID,
       frm.FromSortOrder,
       m2c.MapToColumnName,
       m2c.ToSortOrder,
	   CASE WHEN ISNULL(frm.DestMapFromColumnName,'-') <> ISNULL(m2c.MapToColumnName,'') THEN 0 ELSE 1 END IsMapped
FROM @MapFromColumns frm
INNER JOIN @MapToColumns m2c ON frm.ColumnPrintID = m2c.ColumnPrintID

GO

