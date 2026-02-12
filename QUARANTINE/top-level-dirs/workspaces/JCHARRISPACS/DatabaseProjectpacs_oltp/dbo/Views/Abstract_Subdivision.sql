create view Abstract_Subdivision as
SELECT        property_val.prop_id, abs_subdv.abs_subdv_cd,   abs_subdv.abs_subdv_desc, abs_subdv.bActive, abs_subdv.cInCounty, abs_subdv.changed_flag, abs_subdv.sys_flag, 
                         abs_subdv.abs_subdv_ind, abs_subdv.abs_imprv_pct, abs_subdv.abs_land_pct
FROM            property_val INNER JOIN
                         abs_subdv ON property_val.abs_subdv_cd = abs_subdv.abs_subdv_cd AND property_val.prop_val_yr = abs_subdv.abs_subdv_yr

						 where prop_val_yr=(select appr_yr from pacs_oltp.dbo.pacs_system)

GO

