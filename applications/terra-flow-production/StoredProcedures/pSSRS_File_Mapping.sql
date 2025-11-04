CREATE PROCEDURE [RPT].[pSSRS_File_Mapping]
AS

DECLARE @files TABLE (FileID INT, filename VARCHAR(500), ModuleID INT, ColumnPrintID INT, ColumnPrintMapping_Found BIT, SortOrder INT)

INSERT INTO @files
(
    FileID,
    filename,
    ModuleID,
	ColumnPrintID,
    ColumnPrintMapping_Found,
	SortOrder
)
SELECT f.fileid, filelocation, cp.ModuleID, cp.ColumnPrintID, (SELECT CASE WHEN COUNT(*) > 0 THEN 1 ELSE 0 END FROM config.columnprintmapping cm WHERE cm.columnprintid = cp.columnprintid AND cm.enabled = 1) CP_Found
, ROW_NUMBER() OVER(ORDER BY f.created Desc) SortOrder
FROM import.files f
LEFT JOIN config.columnprint cp ON cp.columnprintid = f.columnprintid
WHERE cp.columnprintid IS NOT NULL
ORDER BY filename

DECLARE @Output TABLE (FileID INT, FileName VARCHAR(500), ModuleID INT, ColumnPrintID INT, ModuleName VARCHAR(500), ColumnPrintMapping_Found BIT, SortOrder INT)

INSERT INTO @Output
(
    FileID,
    FileName,
    ModuleID,
    ColumnPrintID,
    ModuleName,
    ColumnPrintMapping_Found,
	SortOrder
)
SELECT f.FileID,
       f.filename,
       ISNULL(f.ModuleID,1),
	   f.ColumnPrintID,
	   m1.ModuleName,
       f.ColumnPrintMapping_Found,
	   f.SortOrder
FROM @files f 
LEFT JOIN config.modules m1 ON ISNULL(f.ModuleID,1) = m1.ModuleID

SELECT * FROM @Output;

GO

