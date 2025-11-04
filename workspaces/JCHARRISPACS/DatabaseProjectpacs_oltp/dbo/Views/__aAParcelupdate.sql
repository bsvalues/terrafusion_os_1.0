create view __aAParcelupdate as
SELECT        [CO\FGP].ParcelUpdates.owner_name, [CO\FGP].ParcelUpdates.prop_id, [CO\FGP].ParcelUpdates.geo_id, [CO\FGP].ParcelUpdates.legal_desc, [CO\FGP].ParcelUpdates.owner_address, 
                         [CO\FGP].ParcelUpdates.situs_address, [CO\FGP].ParcelUpdates.tax_code_area, [CO\FGP].ParcelUpdates.appraised_val, [CO\FGP].ParcelUpdates.neighborhood_name, 
                         [CO\FGP].ParcelUpdates.neighborhood_code, [CO\FGP].ParcelUpdates.legal_acres, [CO\FGP].ParcelUpdates.year_blt, [CO\FGP].ParcelUpdates.primary_use, [CO\FGP].ParcelUpdates.cycle, 
                         __AAPARCEL_.Prop_ID AS Expr1, __AAPARCEL_.Shape, __AAPARCEL_.CENTROID_X, __AAPARCEL_.CENTROID_Y, __AAPARCEL_.Parcel_ID
FROM            [CO\FGP].ParcelUpdates INNER JOIN
                         __AAPARCEL_ ON [CO\FGP].ParcelUpdates.prop_id = __AAPARCEL_.Prop_ID

GO

