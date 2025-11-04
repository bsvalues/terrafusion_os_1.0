
create view [dbo].[__aSppsf_range_shp] as 
SELECT __aaApprEst_ppsf.prop_id,Reval,neighborhood,tax_area,
        SPPSF,
        CASE
           WHEN SPPSF = 0 THEN '0'
           WHEN SPPSF > 0 AND SPPSF<= 50 THEN '0 _to_50'
           WHEN SPPSF > 50 AND SPPSF <= 80 THEN '50_To_80'
           WHEN SPPSF > 80 AND SPPSF <=120 THEN '80_to_120'
           WHEN SPPSF> 120	AND SPPSF <= 150 THEN '120_to_150'
           WHEN SPPSF > 150 AND SPPSF <= 200 THEN '150_to_200'
		   WHEN SPPSF > 200 AND SPPSF <= 300 THEN '200_to_300'
           WHEN SPPSF > 300 THEN '300_up'
		   else null end as sppsf_range
    ,__AAPARCEL_.CENTROID_X, __AAPARCEL_.CENTROID_Y
        

		   from __aaApprEst_ppsf
		                       inner join    __AAPARCEL_ ON __aaApprEst_ppsf.prop_id = __AAPARCEL_.Prop_ID
GROUP BY __aaApprEst_ppsf.prop_id,  __aaApprEst_ppsf.prop_id, SPPSF,  __AAPARCEL_.CENTROID_X, __AAPARCEL_.CENTROID_Y,Reval,neighborhood,tax_area

GO

