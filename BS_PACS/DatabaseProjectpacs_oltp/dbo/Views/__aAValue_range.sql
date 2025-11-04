create view __aAValue_range as
SELECT  ap.prop_id,reval,neighborhood,Current_Ratio,yearbuilt,class_cd,
       ap.ImpVal,ap.landval,ap.TotalArea,ap.bppsf,land_sqft,TotalAcres,Land_UnitVal,SaleDate,OriginalSalePrice,adjustedSaleprice,


case when ap.landVal> 0 and OriginalSalePrice>0 	then (OriginalSalePrice-ap.landval) else 0 end as Imprv_residual,
case when ap.ImpVal> 0 and OriginalSalePrice>0 	then (OriginalSalePrice-ap.impval) else 0 end as Land_residual,			

		  
		  p.CENTROID_X, p.CENTROID_Y
        

		   from __aaApprEst_ppsf ap
		                       inner join    __AAPARCEL_ p ON ap.prop_id = p.Prop_ID
GROUP BY ap.prop_id,  ap.prop_id, ap.TotalArea, ap.ImpVal,ap.TotalArea,bppsf,OriginalSalePrice,reval,neighborhood,adjustedSaleprice,ap.TotalMarketValue, 
ap.LandVal,p.CENTROID_X, p.CENTROID_Y,land_sqft,TotalAcres,Land_UnitVal,SaleDate,Current_Ratio,yearbuilt,class_cd

GO

