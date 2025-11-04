




CREATE VIEW dbo.prop_count_vw
AS
SELECT prop_val_yr, COUNT(prop_id) AS prop_count
FROM property_val
WHERE prop_inactive_dt IS NULL
GROUP BY prop_val_yr

GO

