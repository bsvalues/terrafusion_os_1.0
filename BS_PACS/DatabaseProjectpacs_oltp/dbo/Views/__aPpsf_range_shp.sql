
create view [dbo].[__aPpsf_range_shp] as 
SELECT __aaApprEst_ppsf.prop_id,Reval,neighborhood,tax_area,
        PPSF,
        CASE
           WHEN PPSF = 0 THEN '0'
           WHEN PPSF > 0 AND PPSF<= 50 THEN '0 _to_50'
           WHEN PPSF > 50 AND PPSF <= 80 THEN '50_To_80'
           WHEN PPSF > 80 AND PPSF <=120 THEN '80_to_120'
           WHEN PPSF> 120	AND PPSF <= 150 THEN '120_to_150'
           WHEN PPSF > 150 AND PPSF <= 200 THEN '150_to_200'
		   WHEN PPSF > 200 AND PPSF <= 300 THEN '200_to_300'
           WHEN PPSF > 300 THEN '300_up'
		   else null end as ppsf_range
		    ,__AAPARCEL_.CENTROID_X, __AAPARCEL_.CENTROID_Y
        

		   from __aaApprEst_ppsf
		                       inner join    __AAPARCEL_ ON __aaApprEst_ppsf.prop_id = __AAPARCEL_.Prop_ID
GROUP BY __aaApprEst_ppsf.prop_id,  __aaApprEst_ppsf.prop_id, PPSF,  __AAPARCEL_.CENTROID_X, __AAPARCEL_.CENTROID_Y,Reval,neighborhood,tax_area

GO

