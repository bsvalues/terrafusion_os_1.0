

CREATE PROCEDURE AIN

	@case_id	int,
	@ID1 int,
	@ID2 int = NULL
as

DECLARE @prop_val_yr int
DECLARE @prot_by_id int

if @ID2 is NULL 
	set @prop_val_yr = @ID1
else
begin
	set @prop_val_yr = @ID2
	set @prot_by_id = @ID1
end

declare @prop_id int
declare @notice_num int


SELECT @prop_id = prop_id
FROM _arb_inquiry as ai
WITH (NOLOCK)
WHERE case_id = @case_id
AND prop_val_yr = @prop_val_yr


SELECT @notice_num = MAX(notice_num)
FROM appr_notice_prop_list
WITH (NOLOCK)
WHERE prop_id = @prop_id
AND notice_yr = @prop_val_yr


SELECT TOP 1
	LEFT(CONVERT(varchar(20), CONVERT(money, an_market_val), 1), CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, an_market_val), 1), 1) - 1) as notice_market,
	LEFT(CONVERT(varchar(20), CONVERT(money, an_assessed_val), 1), CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, an_assessed_val), 1), 1) - 1) as notice_assessed,
	LEFT(CONVERT(varchar(20), CONVERT(money, an_land_hstd_val), 1), CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, an_land_hstd_val), 1), 1) - 1) as notice_land_hstd_val,
	LEFT(CONVERT(varchar(20), CONVERT(money, an_land_non_hstd_val), 1), CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, an_land_non_hstd_val), 1), 1) - 1) as notice_land_non_hstd_val,
	LEFT(CONVERT(varchar(20), CONVERT(money, an_imprv_hstd_val), 1), CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, an_imprv_hstd_val), 1), 1) - 1) as notice_imprv_hstd_val,
	LEFT(CONVERT(varchar(20), CONVERT(money, an_imprv_non_hstd_val), 1), CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, an_imprv_non_hstd_val), 1), 1) - 1) as notice_imprv_non_hstd_val,
	LEFT(CONVERT(varchar(20), CONVERT(money, an_ag_land_use_val), 1), CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, an_ag_land_use_val), 1), 1) - 1) as notice_ag_use_val,
	LEFT(CONVERT(varchar(20), CONVERT(money, an_ag_land_mkt_val), 1), CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, an_ag_land_mkt_val), 1), 1) - 1) as notice_ag_market,
	LEFT(CONVERT(varchar(20), CONVERT(money, an_timber_use), 1), CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, an_timber_use), 1), 1) - 1) as notice_timber_use,
	LEFT(CONVERT(varchar(20), CONVERT(money, an_timber_market), 1), CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, an_timber_market), 1), 1) - 1) as notice_timber_market,
	LEFT(CONVERT(varchar(20), CONVERT(money, an_appraised_val), 1), CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, an_appraised_val), 1), 1) - 1) as notice_appraised_val,
	LEFT(CONVERT(varchar(20), CONVERT(money, an_ten_percent_cap), 1), CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, an_ten_percent_cap), 1), 1) - 1) as notice_ten_percent_cap,
			0 as notice_rendered,
			convert(varchar(10), print_dt, 101) as notice_print_dt,
			exemption as notice_exemptions
       
FROM appr_notice_prop_list as anpl
WITH (NOLOCK)

INNER JOIN appr_notice_selection_criteria as ansc
WITH (NOLOCK)
ON anpl.notice_yr = ansc.notice_yr
AND anpl.notice_num = ansc.notice_num

WHERE prop_id = @prop_id
AND anpl.notice_yr = @prop_val_yr
AND anpl.notice_num = @notice_num

ORDER BY anpl.notice_num DESC

GO

