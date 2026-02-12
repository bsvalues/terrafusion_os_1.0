USE pacs_oltp
GO

CREATE VIEW vw_TerraFusion_Property_Summary AS
SELECT 
    p.prop_id,
    p.geo_id,
    p.prop_type_cd,
    pt.prop_type_desc,
    s.situs_display,
    s.situs_city,
    s.situs_state,
    s.situs_zip,
    pv.prop_val_yr,
    pv.assessed_val,
    pv.market,
    pv.sup_num,
    CASE 
        WHEN pv.assessed_val > 0 THEN 'VALUED'
        ELSE 'PENDING'
    END as valuation_status,
    p.prop_create_dt as created_date
FROM property p WITH (NOLOCK)
LEFT JOIN property_type pt WITH (NOLOCK) ON p.prop_type_cd = pt.prop_type_cd
LEFT JOIN situs s WITH (NOLOCK) ON p.prop_id = s.prop_id AND s.primary_situs = 'Y'
LEFT JOIN property_val pv WITH (NOLOCK) ON p.prop_id = pv.prop_id AND pv.prop_val_yr = YEAR(GETDATE())
WHERE p.prop_type_cd IS NOT NULL
GO

GRANT SELECT ON vw_TerraFusion_Property_Summary TO [TerraFusion_Integration]
GO

PRINT 'Created vw_TerraFusion_Property_Summary view'
GO