CREATE PROCEDURE [RPT].[GetFileViewerDetails] 
    @FileID NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        f.filelocation,
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
        bi.taxlot_found [ParcelNumber_Found],
        CAST(CASE WHEN bi.prop_id IS NOT NULL AND taxlot_found = 0 THEN 1 ELSE 0 END AS BIT) [AddressMatched],
        CAST(CASE WHEN bi.bldg_permit_id IS NOT NULL THEN 1 ELSE 0 END AS BIT) [BuildingPermit_Associated]
    FROM 
        import.files f 
    INNER JOIN 
        permit.building_import bi ON bi.fileid = f.fileid
    WHERE 
        f.fileid = @FileID
END
GO

CREATE PROCEDURE [RPT].[GetFileViewerDetails] 
@FileID VARCHAR(100)
AS 

/*
DECLARE @FileName VARCHAR(100)
SET @FileName = '1-27-2020  W  INCOMPLETE - Copy.csv'
*/

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
       bi.taxlot_found ParcelNumber_Found,
       CAST(CASE WHEN bi.prop_id IS NOT NULL AND taxlot_found = 0 THEN 1 ELSE 0 END AS BIT) AddressMatched,
       CAST(CASE WHEN bi.bldg_permit_id IS NOT NULL THEN 1 ELSE 0 END AS BIT) BuildingPermit_Associated
FROM import.files f 
INNER JOIN permit.building_import bi ON bi.fileid = f.fileid
Where f.fileid = @FileID

GO

