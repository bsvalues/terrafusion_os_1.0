create view Parcel_1 as

select m.prop_id, CENTROID_X,CENTROID_Y,X,Y
FROM         dbo.ccProperty AS m 
inner join 
(select CENTROID_X,CENTROID_Y,geometry,prop_id,X,Y
from benton_spatial_data.dbo.parcel)as sp on m.prop_id=sp.prop_id

GO

