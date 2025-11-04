
CREATE PROCEDURE [dbo].Jefferson_GetPersonalPropertyOutstandingRenditions
  @AssessmentYear char(4)
 
AS
DECLARE
@AssessYear int

SET NOCOUNT ON

SET @AssessYear = Cast(@AssessmentYear As Int)

SELECT a.prop_id, b.geo_id, c.file_as_name, Replace(Replace(a.legal_desc,char(10),''),char(13),' ') As legal_desc, IsNull(d.active_flag,'F') As active_flag, 'NOT SUBMITTED' AS rendition_date
FROM property_val As a
JOIN property As b ON a.prop_id = b.prop_id
JOIN account As c ON b.col_owner_id = c.acct_id
LEFT OUTER JOIN pers_prop_rendition As d
ON a.prop_id = d.prop_id AND a.prop_val_yr = d.rendition_year
WHERE a.prop_val_yr = @AssessYear AND b.prop_type_cd = 'P' AND Isnull(a.prop_inactive_dt, '1/1/1900') = '1/1/1900'
AND IsNull(d.rendition_date,'1/1/1900') = '1/1/1900' AND Left(b.geo_id,1) <> '5'
ORDER BY a.prop_id


GRANT EXECUTE ON [dbo].Jefferson_GetPersonalPropertyOutstandingRenditions TO [COUNTY\Assesor's Office]
GRANT EXECUTE ON [dbo].Jefferson_GetPersonalPropertyOutstandingRenditions TO [PUBLIC]

GO

GRANT EXECUTE
    ON OBJECT::[dbo].[Jefferson_GetPersonalPropertyOutstandingRenditions] TO PUBLIC
    AS [dbo];


GO

GRANT EXECUTE
    ON OBJECT::[dbo].[Jefferson_GetPersonalPropertyOutstandingRenditions] TO [COUNTY\Assesor's Office]
    AS [dbo];


GO

