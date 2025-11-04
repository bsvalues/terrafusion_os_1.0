
create view [dbo].[__aALand_Pct_Chg] as
SELECT  __aaApprEst_ppsf.prop_id,Reval, neighborhood,tax_area,
        Land_pct_chg,
		case
	WHEN	Land_pct_chg  >-1000.00	and	Land_pct_chg	<=	-50.00	Then '-1000_to_-50'	 
	WHEN	Land_pct_chg  >	-50.00	and	Land_pct_chg	<=	0 Then '-50_to_-.01	'
	WHEN	Land_pct_chg	=	0.00	Then	 'None'
	WHEN	Land_pct_chg	>	0.01	and	Land_pct_chg	<=	50.00	Then	 '.01_to50'
	WHEN	Land_pct_chg	>	50.00	and	Land_pct_chg	<=	80.00	Then	 '50_to_80'
	WHEN	Land_pct_chg	>	80.00	and	Land_pct_chg	<=	120.00	Then	 '80_to_120'
	WHEN	Land_pct_chg	>	120.00	and	Land_pct_chg	<=	150.00	Then	 '120_to_150 '
	WHEN	Land_pct_chg	>	150.00					Then	 '	150+'
					else	null		end	 as	Land_pct_chg_range	,

		  
		   __AAPARCEL_.CENTROID_X, __AAPARCEL_.CENTROID_Y
        

		   from __aaApprEst_ppsf
		                       inner join    __AAPARCEL_ ON __aaApprEst_ppsf.prop_id = __AAPARCEL_.Prop_ID
GROUP BY __aaApprEst_ppsf.prop_id,  __aaApprEst_ppsf.prop_id, Land_pct_chg,  __AAPARCEL_.CENTROID_X, __AAPARCEL_.CENTROID_Y,Reval, neighborhood,tax_area

GO

