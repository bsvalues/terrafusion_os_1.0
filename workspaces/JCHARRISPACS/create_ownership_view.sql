USE pacs_oltp
GO

CREATE VIEW vw_TerraFusion_Property_Ownership AS
SELECT 
    p.prop_id,
    p.geo_id,
    p.prop_type_cd,
    s.situs_display,
    s.situs_city,
    s.situs_state,
    s.situs_zip,
    o.owner_name,
    o.owner_seq,
    o.mail_address1,
    o.mail_address2,
    o.mail_city,
    o.mail_state,
    o.mail_zip,
    pv.prop_val_yr,
    pv.assessed_val,
    pv.market
FROM property p WITH (NOLOCK)
LEFT JOIN situs s WITH (NOLOCK) ON p.prop_id = s.prop_id AND s.primary_situs = 'Y'
LEFT JOIN owner o WITH (NOLOCK) ON p.prop_id = o.prop_id AND o.owner_seq = 1
LEFT JOIN property_val pv WITH (NOLOCK) ON p.prop_id = pv.prop_id AND pv.prop_val_yr = YEAR(GETDATE())
WHERE p.prop_type_cd IS NOT NULL
GO

GRANT SELECT ON vw_TerraFusion_Property_Ownership TO [TerraFusion_Integration]
GO

PRINT 'Created vw_TerraFusion_Property_Ownership view'
GO