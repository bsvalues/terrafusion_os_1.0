



CREATE VIEW dbo.EOY_CHG_OF_OWNER_VW
AS
SELECT chg_of_owner.coo_sl_dt, chg_of_owner.chg_of_owner_id, 
    chg_of_owner_prop_assoc.prop_id
FROM chg_of_owner LEFT OUTER JOIN
    chg_of_owner_prop_assoc ON 
    chg_of_owner.chg_of_owner_id = chg_of_owner_prop_assoc.chg_of_owner_id
WHERE chg_of_owner_prop_assoc.prop_id in
(
	select pv.prop_id
	from property_val as pv, pacs_system as ps
	where pv.prop_inactive_dt is null
	and pv.prop_val_yr = ps.appr_yr
)

GO

