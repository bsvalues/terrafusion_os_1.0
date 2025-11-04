

--monitor command to run this monitor -- {call OwnerswithSNRDSBL ('2011', '2010')}
--1st variable is prop_val_yr; 2nd variable is the exemption qualify year


CREATE PROCEDURE [dbo].[OwnerswithSNRDSBL]

@prop_val_yr numeric(4,0),
@qualyr numeric(4,0)

as

SELECT pv.prop_id, a.file_as_name, wpoe.exempt_qualify_cd,
pe.qualify_yr, pv.prop_val_yr

FROM property_val pv WITH (nolock) 

INNER JOIN prop_supp_assoc psa WITH (nolock) ON
	pv.prop_id = psa.prop_id
	AND pv.prop_val_yr = psa.owner_tax_yr
	AND pv.sup_num = psa.sup_num

INNER JOIN owner o WITH (nolock) ON
	pv.prop_id = o.prop_id
	AND pv.prop_val_yr = o.owner_tax_yr
	AND pv.sup_num = o.sup_num

INNER JOIN account a WITH (nolock) ON
	o.owner_id = a.acct_id

INNER JOIN property_exemption pe WITH (nolock) ON
	pv.prop_id = pe.prop_id
	AND pv.prop_val_yr = pe.owner_tax_yr
	AND pv.sup_num = pe.sup_num
	AND o.owner_id = pe.owner_id

INNER JOIN wash_prop_owner_exemption wpoe WITH (nolock) ON
	pv.prop_id = wpoe.prop_id
	AND pv.prop_val_yr = wpoe.year
	AND pv.sup_num = wpoe.sup_num
	AND o.owner_id = wpoe.owner_id

WHERE pv.prop_val_yr = @prop_val_yr 
AND pv.prop_inactive_dt is null
AND wpoe.exmpt_type_cd = 'SNR/DSBL'
AND pe.qualify_yr = @qualyr
ORDER BY a.file_as_name

GO

