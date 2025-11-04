CREATE PROCEDURE [RPT].[pSSRS_Permit_DropDowns]
@DropDown_Type VARCHAR(100)
AS 

DECLARE @ReturnTable TABLE (ValueID VARCHAR(500), ValueText VARCHAR(500), SortOrder INT)

IF @DropDown_Type = 'FileName'
	BEGIN	
		INSERT INTO @ReturnTable
		(
			ValueID,
			ValueText,
			SortOrder
		)
		SELECT distinct f.fileid, filelocation, RANK() OVER(ORDER BY filelocation ASC)
		FROM import.files f 
		INNER JOIN permit.building_import bi ON bi.fileid = f.fileid
	END



	SELECT ValueID,
       ValueText FROM @ReturnTable
	   ORDER BY SortOrder

GO

