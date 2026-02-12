
CREATE PROCEDURE CopyDeedHistoryFromUDIParentToProperty 
 	@parent_prop_id      	int,
	@parent_sup_num 	int,
	@parent_tax_yr      	numeric(4,0),
 	@dest_prop_id      	int,
	@dest_sup_num 		int,
	@dest_tax_yr      	numeric(4,0)
WITH RECOMPILE

AS

-- 01-08-05 	TrentN		Created 

DECLARE @coo_chg_of_owner_id	int
DECLARE @coo_prop_id		int
DECLARE @coo_seq_num		int
DECLARE @coo_sup_num		int
DECLARE @coo_sup_tax_yr		numeric
DECLARE @coo_imprv_hstd_val	numeric
DECLARE @coo_imprv_non_hstd_val	numeric
DECLARE @coo_land_hstd_val	numeric
DECLARE @coo_land_non_hstd_val	numeric
DECLARE @coo_ag_use_val		numeric
DECLARE @coo_ag_market		numeric
DECLARE @coo_ag_loss		numeric
DECLARE @coo_timber_use		numeric
DECLARE @coo_timber_market	numeric
DECLARE @coo_timber_loss	numeric
DECLARE @coo_appraised_val	numeric
DECLARE @coo_assessed_val	numeric
DECLARE @coo_market		numeric

DECLARE @next_seq_num		int
SET @next_seq_num = 0


DECLARE chg_of_owner_cursor SCROLL CURSOR
FOR 	SELECT	prop_assoc.chg_of_owner_id,
		prop_assoc.prop_id,
		prop_assoc.seq_num,
		psa.sup_num,
		prop_assoc.sup_tax_yr,
		prop_assoc.imprv_hstd_val,
		prop_assoc.imprv_non_hstd_val,
		prop_assoc.land_hstd_val,
		prop_assoc.land_non_hstd_val,
		prop_assoc.ag_use_val,
		prop_assoc.ag_market,
		prop_assoc.ag_loss,
		prop_assoc.timber_use,
		prop_assoc.timber_market,
		prop_assoc.timber_loss,
		prop_assoc.appraised_val,
		prop_assoc.assessed_val,
		prop_assoc.market
FROM	chg_of_owner_prop_assoc AS prop_assoc
with (nolock)
join prop_supp_assoc as psa
with (nolock)
on prop_assoc.sup_tax_yr = psa.owner_tax_yr
and prop_assoc.prop_id = psa.prop_id
JOIN property_val as pv
with (nolock)
ON
			psa.owner_tax_yr = pv.prop_val_yr and
			psa.sup_num = pv.sup_num and
			psa.prop_id = pv.prop_id
		JOIN property_val AS parent ON
			(IsNull(parent.udi_parent, '') = 'T' OR IsNull(parent.udi_parent, '') = 'D') AND
			pv.udi_parent_prop_id = parent.prop_id AND
			pv.sup_num = parent.sup_num AND
			pv.prop_val_yr = parent.prop_val_yr AND
			parent.prop_id = @parent_prop_id AND
			parent.sup_num = @parent_sup_num AND
			parent.prop_val_yr = @parent_tax_yr
		JOIN chg_of_owner AS chg_of_owner ON
			chg_of_owner.chg_of_owner_id = prop_assoc.chg_of_owner_id
	ORDER BY chg_of_owner.deed_dt ASC

OPEN chg_of_owner_cursor
FETCH NEXT FROM chg_of_owner_cursor INTO
	@coo_chg_of_owner_id,
	@coo_prop_id,
	@coo_seq_num,
	@coo_sup_tax_yr,
	@coo_imprv_hstd_val,
	@coo_imprv_non_hstd_val,
	@coo_land_hstd_val,
	@coo_land_non_hstd_val,
	@coo_ag_use_val,
	@coo_ag_market,
	@coo_ag_loss,
	@coo_timber_use,
	@coo_timber_market,
	@coo_timber_loss,
	@coo_appraised_val,
	@coo_assessed_val,
	@coo_market

IF (@@FETCH_STATUS = 0)
BEGIN
	DELETE FROM chg_of_owner_prop_assoc
		WHERE	prop_id = @coo_prop_id AND
			sup_tax_yr = @coo_sup_tax_yr
END

WHILE (@@FETCH_STATUS = 0)
BEGIN
	INSERT INTO chg_of_owner_prop_assoc
	(
		chg_of_owner_id,
		prop_id,
		seq_num,
		sup_tax_yr,
		imprv_hstd_val,
		imprv_non_hstd_val,
		land_hstd_val,
		land_non_hstd_val,
		ag_use_val,
		ag_market,
		ag_loss,
		timber_use,
		timber_market,
		timber_loss,
		appraised_val,
		assessed_val,
		market
	)
	VALUES
	(
		@coo_chg_of_owner_id,
		@coo_prop_id,
		@next_seq_num,
		@coo_sup_tax_yr,
		@coo_imprv_hstd_val,
		@coo_imprv_non_hstd_val,
		@coo_land_hstd_val,
		@coo_land_non_hstd_val,
		@coo_ag_use_val,
		@coo_ag_market,
		@coo_ag_loss,
		@coo_timber_use,
		@coo_timber_market,
		@coo_timber_loss,
		@coo_appraised_val,
		@coo_assessed_val,
		@coo_market
	)

	SET @next_seq_num = @next_seq_num + 1
	FETCH NEXT FROM chg_of_owner_cursor INTO
		@coo_chg_of_owner_id,
		@coo_prop_id,
		@coo_seq_num,
		@coo_sup_tax_yr,
		@coo_imprv_hstd_val,
		@coo_imprv_non_hstd_val,
		@coo_land_hstd_val,
		@coo_land_non_hstd_val,
		@coo_ag_use_val,
		@coo_ag_market,
		@coo_ag_loss,
		@coo_timber_use,
		@coo_timber_market,
		@coo_timber_loss,
		@coo_appraised_val,
		@coo_assessed_val,
		@coo_market
END

CLOSE chg_of_owner_cursor
DEALLOCATE chg_of_owner_cursor

GO

