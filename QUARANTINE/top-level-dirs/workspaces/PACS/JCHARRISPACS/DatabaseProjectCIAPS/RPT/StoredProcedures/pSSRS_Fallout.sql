CREATE PROCEDURE [RPT].[pSSRS_Fallout] 
@Bypass BIT = 0
AS 

/*
DECLARE @FileName VARCHAR(100)
SET @FileName = '1-27-2020  W  INCOMPLETE - Copy.csv'
*/

IF @Bypass = 1
	BEGIN
		GOTO Bypassing
		RETURN;
	END

SELECT f.filelocation,
       f.filename,
       f.columnprintid,
       f.locationcreated,
       bi.issuedate,
       bi.permitno,
       bi.customer_firstname,
       bi.customer_lastname,
       bi.contractor_lastname,
       bi.serviceaddress,
       bi.lotownername,
       bi.lotowneraddress,
       bi.taxlot,
       bi.permittype,
       bi.DESCRIPTION,
       bi.projectcost,
       bi.permitstatus,
       bi.balance,
       bi.appno,
       bi.customerno,
       bi.lotno,
       bi.fileid,
       bi.LoadDate,
       bi.UpdatedDate,
       ISNULL(bi.taxlot_found,0) ParcelNumber_Found,
       CAST(CASE WHEN bi.prop_id IS NOT NULL AND taxlot_found = 0 THEN 1 ELSE 0 END AS BIT) AddressMatched,
       CAST(CASE WHEN bi.bldg_permit_id IS NOT NULL THEN 1 ELSE 0 END AS BIT) BuildingPermit_Associated
FROM import.files f 
INNER JOIN permit.building_import bi ON bi.fileid = f.fileid
Where CAST(CASE WHEN bi.bldg_permit_id IS NOT NULL THEN 1 ELSE 0 END AS BIT) = 0

RETURN;

Bypassing:
	PRINT 'Bypassed'
	Return

GO

