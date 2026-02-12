
CREATE PROCEDURE [dbo].[Jefferson_UpdateParcelPACSEARCHtable]

AS
DECLARE
@AssessYear int

SET NOCOUNT ON

SET @AssessYear = (SELECT appr_yr FROM pacs_system)

DELETE FROM PARCEL_PACS_SEARCH

INSERT INTO PARCEL_PACS_SEARCH
(Parcel_No, Prop_ID, Situs_No, Situs_Street, Use_Code, Last_Name, First_Name, Down_Date)
SELECT
Left(a.geo_id,30), a.prop_id, '', '', LEFT(IsNull(b.property_use_cd,''),4), LEFT(IsNull(c.last_name,''), 30), LEFT(IsNull(c.first_name,''), 14), GetDate()
FROM TRUEDB.pacs_oltp.dbo.property As a
INNER JOIN property_val As b ON a.prop_id = b.prop_id AND b.sup_num = 0 AND b.prop_val_yr = @AssessYear
INNER JOIN TRUEDB.pacs_oltp.dbo.account As c ON a.col_owner_id = c.acct_id
LEFT OUTER JOIN TRUEDB.pacs_oltp.dbo.address As d ON c.acct_id = d.acct_id AND d.primary_addr = 'Y'
WHERE a.prop_type_cd <> 'P'

UPDATE PARCEL_PACS_SEARCH SET Situs_No = IsNull(b.situs_num,''), Situs_Street = Left((IsNull(b.situs_street_prefx,'') +
   CASE
      WHEN IsNull(b.situs_street_prefx,'') <> '' THEN ' '
      ELSE ''
   END
+ IsNull(b.situs_street,'')),20)
FROM PARCEL_PACS_SEARCH As a, situs As b
WHERE a.Prop_ID = b.prop_id AND b.situs_num NOT LIKE '%[^0-9]%' AND ISNUMERIC(b.situs_num) = 1

GRANT EXECUTE ON [dbo].[Jefferson_UpdateParcelPACSEARCHtable] TO [COUNTY\Assesor's Office]
GRANT EXECUTE ON [dbo].[Jefferson_UpdateParcelPACSEARCHtable] TO [PUBLIC]

GO

GRANT EXECUTE
    ON OBJECT::[dbo].[Jefferson_UpdateParcelPACSEARCHtable] TO [COUNTY\Assesor's Office]
    AS [dbo];


GO

GRANT EXECUTE
    ON OBJECT::[dbo].[Jefferson_UpdateParcelPACSEARCHtable] TO PUBLIC
    AS [dbo];


GO

