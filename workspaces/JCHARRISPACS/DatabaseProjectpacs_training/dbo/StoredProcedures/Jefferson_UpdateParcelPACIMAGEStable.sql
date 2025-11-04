
CREATE PROCEDURE [dbo].[Jefferson_UpdateParcelPACIMAGEStable]

AS
DECLARE
@AssessYear int

SET NOCOUNT ON

SET @AssessYear = (SELECT appr_yr FROM pacs_system)

DELETE FROM PARCEL_PACS_IMAGES

INSERT INTO PARCEL_PACS_IMAGES
(Parcel_No, Prop_ID, Directory, Directory2, Down_Date)
SELECT
Left(a.geo_id,30), a.prop_id, '', '', GetDate()
FROM property As a
INNER JOIN property_val As b ON a.prop_id = b.prop_id AND b.sup_num = 0 AND b.prop_val_yr = @AssessYear
WHERE a.prop_type_cd <> 'P'

UPDATE PARCEL_PACS_IMAGES SET Directory = Left(b.location,100)
FROM PARCEL_PACS_IMAGES As a, pacs_image As b
WHERE a.Prop_ID = b.ref_id AND b.main = 1 AND b.sub_type = 'PIC'

UPDATE PARCEL_PACS_IMAGES SET Directory2 = Left(b.location,100)
FROM PARCEL_PACS_IMAGES As a, (SELECT TOP 1 * FROM pacs_image ORDER BY image_id) As b
WHERE a.Prop_ID = b.ref_id AND b.main <> 1 AND b.sub_type = 'PIC' AND b.ref_id1 IS NOT NULL

UPDATE PARCEL_PACS_IMAGES SET Directory2 = Left(b.location,100)
FROM PARCEL_PACS_IMAGES As a, (SELECT TOP 1 * FROM pacs_image ORDER BY image_id) As b
WHERE a.Prop_ID = b.ref_id AND b.main <> 1 AND b.sub_type = 'PIC' AND a.Directory2 = ''

GRANT EXECUTE ON [dbo].[Jefferson_UpdateParcelPACIMAGEStable] TO [COUNTY\Assesor's Office]
GRANT EXECUTE ON [dbo].[Jefferson_UpdateParcelPACIMAGEStable] TO [PUBLIC]

GO

GRANT EXECUTE
    ON OBJECT::[dbo].[Jefferson_UpdateParcelPACIMAGEStable] TO [COUNTY\Assesor's Office]
    AS [dbo];


GO

GRANT EXECUTE
    ON OBJECT::[dbo].[Jefferson_UpdateParcelPACIMAGEStable] TO PUBLIC
    AS [dbo];


GO

