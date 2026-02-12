
create procedure NBDHUpdateCaptureProps
	@szBCPFile varchar(512) 
with recompile
as

set nocount on

	declare @szSQL varchar(512)  
	declare @lRowCount int

------------------------------------------------
--Create the temp table
CREATE TABLE [#nbhd_cost_calc_capture_props] (
	[profile_run_list_detail_id] [int] NOT NULL ,
	[run_id] [int] NULL ,
	[chg_of_owner_id] [int] NOT NULL ,
	[prop_id] [int] NULL ,
	[is_outlier] [bit] NULL ,
	[living_area] [int] NULL ,
	[land_total_val] [numeric](14, 0) NULL ,
	[imprv_val] [numeric](14, 0) NULL ,
	[sale_cont_imprv_val] [numeric](14, 0) NULL ,
	[ind_nbhd_adj] [numeric](14, 2) NULL ,
	[sale_psf] [numeric](14, 2) NULL ,
	[land_to_sale_ratio] [numeric](14, 4) NULL ,
	[appr_to_sale_ratio] [numeric](14, 4) NULL ,
	[rev_imprv_val] [numeric](14, 0) NULL ,
	[rev_appr_val] [numeric](14, 0) NULL ,
	[rev_appr_psf] [numeric](14, 2) NULL ,
	[rev_appr_to_sale_ratio] [numeric](14, 4) NULL 
) ON [PRIMARY]

	set @szSQL = '
		bulk insert #nbhd_cost_calc_capture_props
		from ''' + @szBCPFile + '''
		with
		(
			maxerrors = 0,
			tablock
		)
	'
	exec(@szSQL) 

	/* Update all rows   */
    UPDATE [nbhd_cost_calc_capture_props]  
    SET [sale_cont_imprv_val] = tncp.[sale_cont_imprv_val],
    [ind_nbhd_adj] = tncp.[ind_nbhd_adj],
    [sale_psf] = tncp.[sale_psf],
    [land_to_sale_ratio] = tncp.[land_to_sale_ratio],
    [appr_to_sale_ratio] = tncp.[appr_to_sale_ratio],
    [rev_imprv_val] = tncp.[rev_imprv_val],
    [rev_appr_val] = tncp.[rev_appr_val] ,
    [rev_appr_psf] = tncp.[rev_appr_psf] ,
    [rev_appr_to_sale_ratio] = tncp.[rev_appr_to_sale_ratio]
    FROM [nbhd_cost_calc_capture_props]  ncp INNER JOIN
    [#nbhd_cost_calc_capture_props] tncp ON 
    tncp.[profile_run_list_detail_id] = ncp.[profile_run_list_detail_id]
    AND tncp.[run_id] = ncp.[run_id]
    AND tncp.[chg_of_owner_id] = ncp.[chg_of_owner_id]
    AND tncp.[prop_id] = ncp.[prop_id]
 
	
	
set nocount off

GO

