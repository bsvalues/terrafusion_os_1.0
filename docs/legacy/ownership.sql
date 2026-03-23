SELECT DISTINCT pv.prop_id as Property_ID,, o.owner_id, ac.file_as_name, o.pct_ownership
FROM  property_val pv WITH (nolock) 
INNER JOIN prop_supp_assoc psa WITH (nolock) ON
       pv.prop_id = psa.prop_id
       AND pv.prop_val_yr = psa.owner_tax_yr
       AND pv.sup_num = psa.sup_num
INNER JOIN property p WITH (nolock) ON
       pv.prop_id = p.prop_id
INNER JOIN owner o WITH (nolock) ON
       pv.prop_id = o.prop_id 
       AND pv.prop_val_yr = o.owner_tax_yr
       AND pv.sup_num = o.sup_num
       AND isnull(o.pct_ownership, 0) <> 100
INNER JOIN account ac WITH (nolock) ON
       o.owner_id = ac.acct_id
WHERE pv.prop_val_yr = @TAXYEAR
		AND pv.prop_inactive_dt is null 
		and	p.prop_id in @KEYFIELD_IDS
