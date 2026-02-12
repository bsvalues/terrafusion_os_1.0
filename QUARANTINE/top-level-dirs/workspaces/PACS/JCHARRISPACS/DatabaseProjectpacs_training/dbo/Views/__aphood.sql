
create view [dbo].[__aphood] as
SELECT        
prop_id,neighborhood.hood_cd, neighborhood.hood_yr, neighborhood.hood_name, neighborhood.hood_land_pct, neighborhood.hood_imprv_pct, neighborhood.sys_flag,  neighborhood.inactive, 
                         neighborhood.inactive_date, neighborhood.created_date, neighborhood.cycle, neighborhood.nbhd_descr
						 , neighborhood.nbhd_comment, neighborhood.ls_id, neighborhood.appraiser_id, neighborhood.comments, 
                         __aAParcelupdate.CENTROID_X, __aAParcelupdate.CENTROID_Y, __aAParcelupdate.Shape
FROM            neighborhood INNER JOIN
                         __aAParcelupdate ON neighborhood.hood_cd = __aAParcelupdate.neighborhood_code
						 where neighborhood.hood_yr=(select appr_yr from pacs_oltp.dbo.pacs_system)

GO

