
CREATE PROCEDURE exp_TravisCASS @Command int, @Year int
AS

if @Command = 0 OR @Command = 2
BEGIN
    declare @new_zip   as char(10)
    declare @new_cass  as char(10)
    declare @new_route as char(10)

    select @new_zip = ''
    select @new_cass = ''
    select @new_route = ''

-- Command 0 returns all rows. Command 2 returns 1 row
    if @Command = 2 BEGIN SET ROWCOUNT 1 END ELSE BEGIN set nocount on END
SELECT
    DISTINCT(CAST(ow.owner_id AS char(10))) AS owner_id,
    CAST(ow.owner_tax_yr AS char(4))  AS owner_tax_yr,
    CAST(ac.file_as_name AS char(50)) AS file_as_name,
    CAST(ad.addr_type_cd AS char(1))  AS addr_type_cd,
    CAST(ad.addr_line1   AS char(50)) AS addr_line1,
    CAST(ad.addr_line2   AS char(50)) AS addr_line2,
    CAST(ad.addr_line3   AS char(50)) AS addr_line3,
    CAST(ad.addr_city    AS char(50)) AS addr_city,
    CAST(ad.addr_state   AS char(2))  AS addr_state,
    CAST(ad.zip          AS char(10)) AS zip,
    CAST(ad.cass         AS char(10)) AS cass,
    CAST(ad.route        AS char(10)) AS route,
    @new_zip   as new_zip,
    @new_cass  as new_cass,
    @new_route as new_route
FROM address ad INNER JOIN account ac ON ad.acct_id = ac.acct_id
        INNER JOIN owner ow ON ac.acct_id = ow.owner_id
        INNER JOIN property_val pv ON ow.prop_id = pv.prop_id
    AND ow.sup_num = pv.sup_num AND ow.owner_tax_yr = @Year
    AND pv.prop_val_yr = @Year
WHERE (pv.prop_inactive_dt IS NULL)
     AND (ad.primary_addr = 'Y')
END

ELSE if @Command = 1 -- return the number of records in the query
BEGIN
SELECT count(DISTINCT(ow.owner_id)) as NumRecords
FROM address ad INNER JOIN account ac ON ad.acct_id = ac.acct_id
        INNER JOIN owner ow ON ac.acct_id = ow.owner_id
        INNER JOIN property_val pv ON ow.prop_id = pv.prop_id
    AND ow.sup_num = pv.sup_num AND ow.owner_tax_yr = @Year
    AND pv.prop_val_yr = @Year
WHERE (pv.prop_inactive_dt IS NULL)
    AND (ad.primary_addr = 'Y')
END

GO

