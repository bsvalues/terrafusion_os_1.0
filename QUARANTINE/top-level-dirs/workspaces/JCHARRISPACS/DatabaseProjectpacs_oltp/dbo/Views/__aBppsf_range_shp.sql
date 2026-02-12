create view __aBppsf_range_shp as 
SELECT __aaApprEst_ppsf.prop_id,
        bPPSF,
        CASE
           WHEN bPPSF = 0 THEN '0'
           WHEN bPPSF > 0 AND bPPSF<= 50 THEN '0 _to_50'
           WHEN bPPSF > 50 AND bPPSF <= 80 THEN '50_To_80'
           WHEN bPPSF > 80 AND bPPSF <=120 THEN '80_to_120'
           WHEN bPPSF> 120	AND bPPSF <= 150 THEN '120_to_150'
           WHEN bPPSF > 150 AND bPPSF <= 200 THEN '150_to_200'
		   WHEN bPPSF > 200 AND bPPSF <= 300 THEN '200_to_300'
           WHEN bPPSF > 300 THEN '300_up'
		   else null end as bppsf_range

		 , __AAPARCEL_.CENTROID_X, __AAPARCEL_.CENTROID_Y
        

		   from __aaApprEst_ppsf
		                       inner join    __AAPARCEL_ ON __aaApprEst_ppsf.prop_id = __AAPARCEL_.Prop_ID
GROUP BY __aaApprEst_ppsf.prop_id,  __aaApprEst_ppsf.prop_id, bPPSF,  __AAPARCEL_.CENTROID_X, __AAPARCEL_.CENTROID_Y

GO

