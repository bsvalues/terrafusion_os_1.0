

create view GIS_Building_ppsf_range as 
SELECT prop_id,Reval, neighborhood,
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

		   from __aaApprEst_ppsf

GO

