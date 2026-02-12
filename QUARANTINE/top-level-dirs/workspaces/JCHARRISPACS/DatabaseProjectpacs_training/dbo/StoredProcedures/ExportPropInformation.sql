
-- exec ExportPropInformation 2005
CREATE   PROCEDURE [dbo].[ExportPropInformation]
@input_yr numeric(4,0)

AS

SET NOCOUNT ON

--Revisions
--10/16/2002 - EricZ - Added detailed situs information; requested by Dean/Lamar CAD.

--Drop table if exists...
if object_id('tempdb..#prop_export') is not null
	drop table dbo.#prop_export

--Create table...
CREATE TABLE dbo.#prop_export (
	[prop_id] [int] NOT NULL ,
	[prop_yr] [numeric](4, 0) NOT NULL ,
	[geo_id] [varchar] (50) NULL ,
	[owner_id] [int] NOT NULL ,
	[owner_name] [varchar] (70) NULL ,
	[addr_line1] [varchar] (60) NULL ,
	[addr_line2] [varchar] (60) NULL ,
	[addr_line3] [varchar] (60) NULL ,
	[addr_city] [varchar] (50) NULL ,
	[addr_state] [varchar] (50) NULL ,
	[addr_zip] [varchar] (20) NULL ,
	[legal_desc] [varchar] (255) NULL ,
	[legal_desc_2] [varchar] (255) NULL ,
	[legal_desc_3] [varchar] (255) NULL ,
	[legal_desc_4] [varchar] (255) NULL ,
	[year_built] [numeric](4, 0) NULL ,
	[sq_ft] [int] NULL ,
	[num_acres] [numeric](14, 4) NULL ,
	[imprv_hstd_val] [numeric](14, 2) NULL ,
	[land_hstd_val] [numeric](14, 2) NULL ,
	[state_cd] [varchar] (10) NULL ,
	[status] [varchar] (1) NULL ,
	[market_val] [numeric](14, 2) NULL ,
	[prev_market_val] [numeric](14, 2) NULL ,
	[sale_date] [datetime] NULL ,
	[sale_price] [numeric](14, 2) NULL ,
	[sale_vol] [varchar] (15) NULL ,
	[sale_inst] [varchar] (15) NULL ,
	[sale_page] [varchar] (15) NULL ,
	[sale_grantor] [varchar] (70) NULL ,
	[sale_grantee] [varchar] (70) NULL ,
	[mortgage_cd] [varchar] (10) NULL ,
	[entity_1] [varchar] (5) NULL ,
	[entity_2] [varchar] (5) NULL ,
	[entity_3] [varchar] (5) NULL ,
	[entity_4] [varchar] (5) NULL ,
	[entity_5] [varchar] (5) NULL ,
	[entity_6] [varchar] (5) NULL ,
	[entity_7] [varchar] (5) NULL ,
	[entity_8] [varchar] (5) NULL ,
	[entity_9] [varchar] (5) NULL ,
	[entity_10] [varchar] (5) NULL ,
	[tax_due_1] [numeric](14, 2) NULL ,
	[tax_due_2] [numeric](14, 2) NULL ,
	[tax_due_3] [numeric](14, 2) NULL ,
	[tax_due_4] [numeric](14, 2) NULL ,
	[tax_due_5] [numeric](14, 2) NULL ,
	[tax_due_6] [numeric](14, 2) NULL ,
	[tax_due_7] [numeric](14, 2) NULL ,
	[tax_due_8] [numeric](14, 2) NULL ,
	[tax_due_9] [numeric](14, 2) NULL ,
	[tax_due_10] [numeric](14, 2) NULL ,
	[exmpt_hs] [varchar] (1) NULL ,
	[exmpt_ov65] [varchar] (1) NULL ,
	[exmpt_dp] [varchar] (1) NULL ,
	[exmpt_dv] [varchar] (1) NULL ,
	[exmpt_ex] [varchar] (1) NULL ,
	[exmpt_other] [varchar] (5) NULL,
	[use_frz] [varchar] (1) NULL,
	[frz_ceil] [numeric] (14,2) NULL,
	[situs_display] [varchar] (150) NULL,
	[dba_name] [varchar] (50) NULL
) ON [PRIMARY]

--Set indexes
--ALTER TABLE dbo.#prop_export ADD CONSTRAINT
--	PK__tmp_prop_export PRIMARY KEY NONCLUSTERED (
--		prop_id,
--		prop_yr,
--		owner_id
--) ON [PRIMARY]
CREATE NONCLUSTERED INDEX IX__tmp_prop_export_0 ON dbo.#prop_export	(
		prop_id,
		prop_yr,
		owner_id
) ON [PRIMARY]

CREATE NONCLUSTERED INDEX IX__tmp_prop_export ON dbo.#prop_export	(
	prop_id,
	prop_yr
) ON [PRIMARY]

CREATE NONCLUSTERED INDEX IX__tmp_prop_export_1 ON dbo.#prop_export	(
	prop_id
) ON [PRIMARY]

--Drop table if exists...
if object_id('tempdb..#prop_export_entities') is not null
	drop table dbo.#prop_export_entities

--Create temp table...
CREATE TABLE dbo.#prop_export_entities (
 	prop_id int NOT NULL,
	prop_yr numeric(4, 0) NOT NULL,
	owner_id int NOT NULL,
	entity_1 varchar(5) NULL,
	entity_2 varchar(5) NULL,
	entity_3 varchar(5) NULL,
	entity_4 varchar(5) NULL,
	entity_5 varchar(5) NULL,
	entity_6 varchar(5) NULL,
	entity_7 varchar(5) NULL,
	entity_8 varchar(5) NULL,
	entity_9 varchar(5) NULL,
	entity_10 varchar(5) NULL,
	tax_due_1 numeric(14, 2) NULL,
	tax_due_2 numeric(14, 2) NULL,
	tax_due_3 numeric(14, 2) NULL,
	tax_due_4 numeric(14, 2) NULL,
	tax_due_5 numeric(14, 2) NULL,
	tax_due_6 numeric(14, 2) NULL,
	tax_due_7 numeric(14, 2) NULL,
	tax_due_8 numeric(14, 2) NULL,
	tax_due_9 numeric(14, 2) NULL,
	tax_due_10 numeric(14, 2) NULL
) ON [PRIMARY]

--Set indexes...
/*
ALTER TABLE dbo.#prop_export_entities ADD CONSTRAINT
	PK__tmp_prop_export_entities PRIMARY KEY NONCLUSTERED 
	(
	prop_id,
	prop_yr,
	owner_id
	) ON [PRIMARY]
*/
CREATE NONCLUSTERED INDEX IX__tmp_prop_export_entities ON dbo.#prop_export_entities	(
	prop_id,
	prop_yr,
	owner_id
) ON [PRIMARY]


--Drop table if exists...
if object_id('tempdb..#prop_export_exemptions') is not null
	drop table dbo.#prop_export_exemptions

--Create table...
CREATE TABLE dbo.#prop_export_exemptions (
 	prop_id int NOT NULL,
	prop_yr numeric(4, 0) NOT NULL,
	owner_id int NOT NULL,
	exmpt_hs varchar(1) NULL,
	exmpt_ov65 varchar(1) NULL,
	exmpt_dp varchar(1) NULL,
	exmpt_dv varchar(1) NULL,
	exmpt_ex varchar(1) NULL,
	exmpt_other varchar(5) NULL
) ON [PRIMARY]

--Set indexes...
/*
ALTER TABLE dbo.#prop_export_exemptions ADD CONSTRAINT
	PK__tmp_prop_export_exemptions PRIMARY KEY NONCLUSTERED 
	(
	prop_id,
	prop_yr,
	owner_id
	) ON [PRIMARY]
*/
CREATE NONCLUSTERED INDEX IX__tmp_prop_export_exemptions ON dbo.#prop_export_exemptions	(
	prop_id,
	prop_yr,
	owner_id
) ON [PRIMARY]

--Fill in most of the information...
INSERT INTO dbo.#prop_export
(
	[prop_id] ,
	[prop_yr] ,
	[geo_id] ,
	[owner_id] ,
	[owner_name] ,
	[addr_line1] ,
	[addr_line2] ,
	[addr_line3] ,
	[addr_city] ,
	[addr_state] ,
	[addr_zip] ,
	[legal_desc] ,
	[legal_desc_2] ,
	[year_built] ,
	[sq_ft] ,
	[num_acres] ,
	[imprv_hstd_val] ,
	[land_hstd_val] ,
	[state_cd] ,
	[status] ,
	[market_val] ,
	[situs_display] ,
	[dba_name]
)
SELECT DISTINCT 
	[prop_id] ,
	[owner_tax_yr] ,
	[geo_id] ,
	[owner_id] ,
	[file_as_name] ,
	[addr_line1] ,
	[addr_line2] ,
	[addr_line3] ,
	[addr_city] ,
	[addr_state] ,
	[addr_zip] ,
	[legal_desc] ,
	[legal_desc_2] ,
	[yr_blt] ,
	[living_area] ,
	[land_acres] ,
	[imprv_hstd_val] ,
	[land_hstd_val] ,
	[state_cd] ,
	'A' ,
	[appraised_val],
	REPLACE(isnull(([situs_display]), ''), CHAR(13) + CHAR(10), ' '),
	[dba_name]
FROM prop_export_vw
WHERE owner_tax_yr = @input_yr
ORDER BY geo_id

--Fill in previous year information...
UPDATE dbo.#prop_export
SET [prev_market_val] = isnull(appraised_val, 0)
FROM prop_supp_assoc as psa, property_val as pv
WHERE psa.prop_id = pv.prop_id
and   psa.owner_tax_yr = pv.prop_val_yr
and   psa.sup_num = pv.sup_num
and   psa.owner_tax_yr = (@input_yr - 1)
and   psa.prop_id = #prop_export.prop_id
and   psa.owner_tax_yr = #prop_export.prop_yr

--Fill in sales information...
UPDATE dbo.#prop_export
SET	[sale_date] = deed_dt ,
	[sale_price] = chg_of_owner_vw.sl_price ,
	[sale_vol] = cast(deed_book_id as varchar(15)),
	[sale_inst] = cast(deed_type_cd as varchar(15)),
	[sale_page] = cast(deed_book_page as varchar(15)),
	[sale_grantor] = ISNULL(seller_file_as_name, grantor_cv) ,
	[sale_grantee] = ISNULL(buyer_file_as_name, grantee_cv)
FROM chg_of_owner_vw LEFT OUTER JOIN
    sale ON 
    chg_of_owner_vw.chg_of_owner_id = sale.chg_of_owner_id
WHERE chg_of_owner_vw.prop_id = #prop_export.prop_id
and chg_of_owner_vw.seq_num = 0

--Fill in mortgage code...
UPDATE dbo.#prop_export
SET [mortgage_cd] = mortgage_co.mortgage_cd
FROM mortgage_assoc INNER JOIN
    mortgage_co ON 
    mortgage_assoc.mortgage_co_id = mortgage_co.mortgage_co_id
     RIGHT OUTER JOIN
    #prop_export ON 
    mortgage_assoc.prop_id = #prop_export.prop_id

--Fill in all the entities...
declare @prop_id   	int
declare @next_prop_id	int
declare @owner_id 	int
declare @insert_sql 	varchar(512)
declare @entity_cd 	varchar(10)
declare @entity_id	int
--declare @entity_1 	varchar(10)
--declare @entity_2 	varchar(10)
--declare @entity_3 	varchar(10)
--declare @entity_4 	varchar(10)
--declare @entity_5 	varchar(10)
--declare @entity_6 	varchar(10)
--declare @entity_7 	varchar(10)
--declare @entity_8 	varchar(10)
--declare @entity_9 	varchar(10)
--declare @entity_10 	varchar(10)
--declare @tax_due_1 	varchar(20)
--declare @tax_due_2 	varchar(24)
--declare @tax_due_3 	varchar(24)
--declare @tax_due_4 	varchar(24)
--declare @tax_due_5 	varchar(24)
--declare @tax_due_6 	varchar(24)
--declare @tax_due_7 	varchar(24)
--declare @tax_due_8 	varchar(24)
--declare @tax_due_9 	varchar(24)
--declare @tax_due_10 	varchar(24)
declare @exmpt_cd	varchar(10)
declare @exmpt_hs 	varchar(1)
declare @exmpt_ov65 	varchar(1)
declare @exmpt_dp 	varchar(1)
declare @exmpt_dv 	varchar(1)
declare @exmpt_ex 	varchar(1)
declare @exmpt_other 	varchar(5)

set @next_prop_id = 0

declare @cds varchar(2000)
declare @i int


DECLARE TMP_PROP CURSOR FAST_FORWARD
FOR	SELECT DISTINCT #prop_export.prop_id, #prop_export.owner_id
	FROM #prop_export
	WHERE #prop_export.prop_yr = @input_yr
	ORDER by #prop_export.prop_id, #prop_export.owner_id

OPEN TMP_PROP
FETCH NEXT FROM TMP_PROP into @prop_id, @owner_id

WHILE (@@FETCH_STATUS = 0)
BEGIN

	set @cds = ','
	set @i = 0
	
	SELECT @cds = @cds + '''' + rtrim(entity.entity_cd) + ''',', @i = @i + 1
		FROM prop_supp_assoc INNER JOIN
		    entity_prop_assoc INNER JOIN
		    entity ON entity_prop_assoc.entity_id = entity.entity_id ON 
		    prop_supp_assoc.prop_id = entity_prop_assoc.prop_id AND 
		    prop_supp_assoc.owner_tax_yr = entity_prop_assoc.tax_yr AND
		     prop_supp_assoc.sup_num = entity_prop_assoc.sup_num
		WHERE prop_supp_assoc.owner_tax_yr = @input_yr AND
			prop_supp_assoc.prop_id = @prop_id
		ORDER by entity.entity_cd

/*
	set @entity_1 	= space(5)
	set @entity_2 	= space(5)
	set @entity_3 	= space(5)
	set @entity_4 	= space(5)
	set @entity_5 	= space(5)
	set @entity_6 	= space(5)
	set @entity_7 	= space(5)
	set @entity_8 	= space(5)
	set @entity_9 	= space(5)
	set @entity_10 	= space(5)
	set @tax_due_1 	= 0
	set @tax_due_2 	= 0
	set @tax_due_3 	= 0
	set @tax_due_4 	= 0
	set @tax_due_5 	= 0
	set @tax_due_6 	= 0
	set @tax_due_7 	= 0
	set @tax_due_8 	= 0
	set @tax_due_9 	= 0
	set @tax_due_10 = 0

	DECLARE TMP_ENTITY CURSOR FAST_FORWARD
	FOR	SELECT DISTINCT entity.entity_cd, entity.entity_id
		FROM prop_supp_assoc INNER JOIN
		    entity_prop_assoc INNER JOIN
		    entity ON entity_prop_assoc.entity_id = entity.entity_id ON 
		    prop_supp_assoc.prop_id = entity_prop_assoc.prop_id AND 
		    prop_supp_assoc.owner_tax_yr = entity_prop_assoc.tax_yr AND
		     prop_supp_assoc.sup_num = entity_prop_assoc.sup_num
		WHERE prop_supp_assoc.owner_tax_yr = @input_yr AND
			prop_supp_assoc.prop_id = @prop_id
		ORDER by entity.entity_cd

	OPEN TMP_ENTITY
	FETCH NEXT FROM TMP_ENTITY into @entity_cd, @entity_id

	WHILE (@@FETCH_STATUS = 0)
	BEGIN
		set @entity_1 = @entity_cd
				
--		select @tax_due_1 = sum(isnull(bill_m_n_o, 0) + isnull(bill_i_n_s, 0))
--				from prop_supp_assoc, bill_vw
--				where prop_supp_assoc.prop_id = bill_vw.prop_id
--				and   prop_supp_assoc.owner_tax_yr = bill_vw.sup_tax_yr
--				and   prop_supp_assoc.sup_num = bill_vw.sup_num
--				and   bill_vw.entity_id = @entity_id
--				and   bill_vw.owner_id = @owner_id
--				and   bill_vw.prop_id = @prop_id

		FETCH NEXT FROM TMP_ENTITY into @entity_cd, @entity_id

		if (@@FETCH_STATUS = 0)
		begin
			set @entity_2 = @entity_cd

--			select @tax_due_2 = sum(isnull(bill_m_n_o, 0) + isnull(bill_i_n_s, 0))
--					from prop_supp_assoc, bill_vw
--					where prop_supp_assoc.prop_id = bill_vw.prop_id
--					and   prop_supp_assoc.owner_tax_yr = bill_vw.sup_tax_yr
--					and   prop_supp_assoc.sup_num = bill_vw.sup_num
--					and   bill_vw.entity_id = @entity_id
--					and   bill_vw.owner_id = @owner_id
--					and   bill_vw.prop_id = @prop_id

			FETCH NEXT FROM TMP_ENTITY into @entity_cd, @entity_id

			if (@@FETCH_STATUS = 0)
			begin
				set @entity_3 = @entity_cd

--				select @tax_due_3 = sum(isnull(bill_m_n_o, 0) + isnull(bill_i_n_s, 0))
--						from prop_supp_assoc, bill_vw
--						where prop_supp_assoc.prop_id = bill_vw.prop_id
--						and   prop_supp_assoc.owner_tax_yr = bill_vw.sup_tax_yr
--						and   prop_supp_assoc.sup_num = bill_vw.sup_num
--						and   bill_vw.entity_id = @entity_id
--						and   bill_vw.owner_id = @owner_id
--						and   bill_vw.prop_id = @prop_id

				FETCH NEXT FROM TMP_ENTITY into @entity_cd, @entity_id

				if (@@FETCH_STATUS = 0)
				begin
					set @entity_4 = @entity_cd

--					select @tax_due_4 = sum(isnull(bill_m_n_o, 0) + isnull(bill_i_n_s, 0))
--							from prop_supp_assoc, bill_vw
--							where prop_supp_assoc.prop_id = bill_vw.prop_id
--							and   prop_supp_assoc.owner_tax_yr = bill_vw.sup_tax_yr
--							and   prop_supp_assoc.sup_num = bill_vw.sup_num
--							and   bill_vw.entity_id = @entity_id
--							and   bill_vw.owner_id = @owner_id
--							and   bill_vw.prop_id = @prop_id

					FETCH NEXT FROM TMP_ENTITY into @entity_cd, @entity_id

					if (@@FETCH_STATUS = 0)
					begin
						set @entity_5 = @entity_cd

--						select @tax_due_5 = sum(isnull(bill_m_n_o, 0) + isnull(bill_i_n_s, 0))
--								from prop_supp_assoc, bill_vw
--								where prop_supp_assoc.prop_id = bill_vw.prop_id
--								and   prop_supp_assoc.owner_tax_yr = bill_vw.sup_tax_yr
--								and   prop_supp_assoc.sup_num = bill_vw.sup_num
--								and   bill_vw.entity_id = @entity_id
--								and   bill_vw.owner_id = @owner_id
--								and   bill_vw.prop_id = @prop_id

						FETCH NEXT FROM TMP_ENTITY into @entity_cd, @entity_id

						if (@@FETCH_STATUS = 0)
						begin
							set @entity_6 = @entity_cd

--							select @tax_due_6 = sum(isnull(bill_m_n_o, 0) + isnull(bill_i_n_s, 0))
--									from prop_supp_assoc, bill_vw
--									where prop_supp_assoc.prop_id = bill_vw.prop_id
--									and   prop_supp_assoc.owner_tax_yr = bill_vw.sup_tax_yr
--									and   prop_supp_assoc.sup_num = bill_vw.sup_num
--									and   bill_vw.entity_id = @entity_id
--									and   bill_vw.owner_id = @owner_id
--									and   bill_vw.prop_id = @prop_id

							FETCH NEXT FROM TMP_ENTITY into @entity_cd, @entity_id

							if (@@FETCH_STATUS = 0)
							begin
								set @entity_7 = @entity_cd

--								select @tax_due_7 = sum(isnull(bill_m_n_o, 0) + isnull(bill_i_n_s, 0))
--										from prop_supp_assoc, bill_vw
--										where prop_supp_assoc.prop_id = bill_vw.prop_id
--										and   prop_supp_assoc.owner_tax_yr = bill_vw.sup_tax_yr
--										and   prop_supp_assoc.sup_num = bill_vw.sup_num
--										and   bill_vw.entity_id = @entity_id
--										and   bill_vw.owner_id = @owner_id
--										and   bill_vw.prop_id = @prop_id

								FETCH NEXT FROM TMP_ENTITY into @entity_cd, @entity_id

								if (@@FETCH_STATUS = 0)
								begin
									set @entity_8 = @entity_cd

--									select @tax_due_8 = sum(isnull(bill_m_n_o, 0) + isnull(bill_i_n_s, 0))
--											from prop_supp_assoc, bill_vw
--											where prop_supp_assoc.prop_id = bill_vw.prop_id
--											and   prop_supp_assoc.owner_tax_yr = bill_vw.sup_tax_yr
--											and   prop_supp_assoc.sup_num = bill_vw.sup_num
--											and   bill_vw.entity_id = @entity_id
--											and   bill_vw.owner_id = @owner_id
--											and   bill_vw.prop_id = @prop_id

									FETCH NEXT FROM TMP_ENTITY into @entity_cd, @entity_id

									if (@@FETCH_STATUS = 0)
									begin
										set @entity_9 = @entity_cd

--										select @tax_due_9 = sum(isnull(bill_m_n_o, 0) + isnull(bill_i_n_s, 0))
--												from prop_supp_assoc, bill_vw
--												where prop_supp_assoc.prop_id = bill_vw.prop_id
--												and   prop_supp_assoc.owner_tax_yr = bill_vw.sup_tax_yr
--												and   prop_supp_assoc.sup_num = bill_vw.sup_num
--												and   bill_vw.entity_id = @entity_id
--												and   bill_vw.owner_id = @owner_id
--												and   bill_vw.prop_id = @prop_id

										FETCH NEXT FROM TMP_ENTITY into @entity_cd, @entity_id

										if (@@FETCH_STATUS = 0)
										begin
											set @entity_10 = @entity_cd

--											select @tax_due_10 = sum(isnull(bill_m_n_o, 0) + isnull(bill_i_n_s, 0))
--													from prop_supp_assoc, bill_vw
--													where prop_supp_assoc.prop_id = bill_vw.prop_id
--													and   prop_supp_assoc.owner_tax_yr = bill_vw.sup_tax_yr
--													and   prop_supp_assoc.sup_num = bill_vw.sup_num
--													and   bill_vw.entity_id = @entity_id
--													and   bill_vw.owner_id = @owner_id
--													and   bill_vw.prop_id = @prop_id
										end
									end
								end
							end
						end
					end
				end
			end
		end
	END

	CLOSE TMP_ENTITY
	DEALLOCATE TMP_ENTITY
*/

	set @insert_sql = 'insert into #prop_export_entities values (' +
				cast(@prop_id as varchar(15)) + ',' +
				cast(@input_yr as varchar(4)) + ',' +
				cast(@owner_id as varchar(15)) + --',' +
				@cds + replicate(''''',', 10 - @i) + 
				'0,0,0,0,0,0,0,0,0,0)'  -- tax due was applicable only for old Texas functionality?

--				'''' + isnull(@entity_1, space(5)) + ''',' +
--				'''' + isnull(@entity_2, space(5)) + ''',' +
--				'''' + isnull(@entity_3, space(5)) + ''',' +
--				'''' + isnull(@entity_4, space(5)) + ''',' +
--				'''' + isnull(@entity_5, space(5)) + ''',' +
--				'''' + isnull(@entity_6, space(5)) + ''',' +
--				'''' + isnull(@entity_7, space(5)) + ''',' +
--				'''' + isnull(@entity_8, space(5)) + ''',' +
--				'''' + isnull(@entity_9, space(5)) + ''',' +
--				'''' + isnull(@entity_10, space(5)) + ''',' +
--				isnull(@tax_due_1, 0) + ',' +
--				isnull(@tax_due_2, 0) + ',' +
--				isnull(@tax_due_3, 0) + ',' +
--				isnull(@tax_due_4, 0) + ',' +
--				isnull(@tax_due_5, 0) + ',' +
--				isnull(@tax_due_6, 0) + ',' +
--				isnull(@tax_due_7, 0) + ',' +
--				isnull(@tax_due_8, 0) + ',' +
--				isnull(@tax_due_9, 0) + ',' +
--				isnull(@tax_due_10, 0) + ')'

	--print @insert_sql
	exec(@insert_sql)

	set @exmpt_hs 	 = 'F'
	set @exmpt_ov65  = 'F'
	set @exmpt_dp 	 = 'F'
	set @exmpt_dv 	 = 'F'
	set @exmpt_ex 	 = 'F'
	set @exmpt_other = space(5)

	--Populate exemptions

	SELECT 
		@exmpt_hs = case when property_exemption.exmpt_type_cd in ('HS') then 'T' else @exmpt_hs end,
		@exmpt_ov65 = case when property_exemption.exmpt_type_cd like ('OV%') then 'T' else @exmpt_ov65 end,
		@exmpt_dp = case when property_exemption.exmpt_type_cd in ('DP') then 'T' else @exmpt_dp end,
		@exmpt_dv = case when property_exemption.exmpt_type_cd like ('DV%') then 'T' else @exmpt_dp end,
		@exmpt_ex = case when property_exemption.exmpt_type_cd like ('EX%') then 'T' else @exmpt_ex end,
		@exmpt_other = case when not (
						property_exemption.exmpt_type_cd in ('HS', 'DP') 
				 or property_exemption.exmpt_type_cd like ('OV%')
				 or property_exemption.exmpt_type_cd like ('DV%')
				 or property_exemption.exmpt_type_cd like ('EX%'))
			then property_exemption.exmpt_type_cd else @exmpt_other end

		FROM prop_supp_assoc LEFT OUTER JOIN
		    property_exemption ON 
		    prop_supp_assoc.sup_num = property_exemption.sup_num
		     AND 
		    prop_supp_assoc.owner_tax_yr = property_exemption.owner_tax_yr
		     AND 
		    prop_supp_assoc.prop_id = property_exemption.prop_id
		WHERE property_exemption.prop_id = @prop_id AND
		property_exemption.owner_tax_yr = @input_yr AND
		property_exemption.owner_id = @owner_id

/*
	DECLARE TMP_EXEMPTION CURSOR FAST_FORWARD
	FOR	SELECT property_exemption.exmpt_type_cd
		FROM prop_supp_assoc LEFT OUTER JOIN
		    property_exemption ON 
		    prop_supp_assoc.sup_num = property_exemption.sup_num
		     AND 
		    prop_supp_assoc.owner_tax_yr = property_exemption.owner_tax_yr
		     AND 
		    prop_supp_assoc.prop_id = property_exemption.prop_id
		WHERE property_exemption.prop_id = @prop_id AND
		property_exemption.owner_tax_yr = @input_yr AND
		property_exemption.owner_id = @owner_id

	OPEN TMP_EXEMPTION
	FETCH NEXT FROM TMP_EXEMPTION into @exmpt_cd

	WHILE (@@FETCH_STATUS = 0)
	BEGIN
		if (@exmpt_cd in ('HS'))
		begin
			set @exmpt_hs = 'T'
		end
		else if (@exmpt_cd like 'OV%')
		begin
			set @exmpt_ov65 = 'T'
		end
		else if (@exmpt_cd in ('DP'))
		begin
			set @exmpt_dp = 'T'
		end
		else if (@exmpt_cd like 'DV%')
		begin
			set @exmpt_dv = 'T'
		end
		else if (@exmpt_cd like 'EX%')
		begin
			set @exmpt_ex = 'T'
		end
		else
		begin
			set @exmpt_other = @exmpt_cd
		end

		FETCH NEXT FROM TMP_EXEMPTION into @exmpt_cd
	END

	CLOSE TMP_EXEMPTION
	DEALLOCATE TMP_EXEMPTION
*/

	set @insert_sql = 'insert into #prop_export_exemptions values (' +
				cast(@prop_id as varchar(15)) + ',' +
				cast(@input_yr as varchar(4)) + ',' +
				cast(@owner_id as varchar(15)) + ',' +
				'''' + isnull(@exmpt_hs, space(1)) + ''',' +
				'''' + isnull(@exmpt_ov65, space(1)) + ''',' +
				'''' + isnull(@exmpt_dp, space(1)) + ''',' +
				'''' + isnull(@exmpt_dv, space(1)) + ''',' +
				'''' + isnull(@exmpt_ex, space(1)) + ''',' +
				'''' + isnull(@exmpt_other, space(1)) + ''')'

	--print @insert_sql
	exec(@insert_sql)
	
	FETCH NEXT FROM TMP_PROP into @prop_id, @owner_id
END

CLOSE TMP_PROP
DEALLOCATE TMP_PROP

--Update entities...
update #prop_export
set #prop_export.entity_1 = #prop_export_entities.entity_1,
	#prop_export.entity_2 = #prop_export_entities.entity_2,
	#prop_export.entity_3 = #prop_export_entities.entity_3,
	#prop_export.entity_4 = #prop_export_entities.entity_4,
	#prop_export.entity_5 = #prop_export_entities.entity_5,
	#prop_export.entity_6 = #prop_export_entities.entity_6,
	#prop_export.entity_7 = #prop_export_entities.entity_7,
	#prop_export.entity_8 = #prop_export_entities.entity_8,
	#prop_export.entity_9 = #prop_export_entities.entity_9,
	#prop_export.entity_10 = #prop_export_entities.entity_10,
	#prop_export.tax_due_1 = #prop_export_entities.tax_due_1,
	#prop_export.tax_due_2 = #prop_export_entities.tax_due_2,
	#prop_export.tax_due_3 = #prop_export_entities.tax_due_3,
	#prop_export.tax_due_4 = #prop_export_entities.tax_due_4,
	#prop_export.tax_due_5 = #prop_export_entities.tax_due_5,
	#prop_export.tax_due_6 = #prop_export_entities.tax_due_6,
	#prop_export.tax_due_7 = #prop_export_entities.tax_due_7,
	#prop_export.tax_due_8 = #prop_export_entities.tax_due_8,
	#prop_export.tax_due_9 = #prop_export_entities.tax_due_9,
	#prop_export.tax_due_10 = #prop_export_entities.tax_due_10
from #prop_export_entities
where #prop_export.prop_id = #prop_export_entities.prop_id
and   #prop_export.owner_id = #prop_export_entities.owner_id
and   #prop_export.prop_yr = #prop_export_entities.prop_yr
and   #prop_export.prop_yr = @input_yr

--Update exemptions...
update #prop_export
set #prop_export.exmpt_hs = #prop_export_exemptions.exmpt_hs,
	#prop_export.exmpt_ov65 = #prop_export_exemptions.exmpt_ov65,
	#prop_export.exmpt_dp = #prop_export_exemptions.exmpt_dp,
	#prop_export.exmpt_dv = #prop_export_exemptions.exmpt_dv,
	#prop_export.exmpt_ex = #prop_export_exemptions.exmpt_ex,
	#prop_export.exmpt_other = #prop_export_exemptions.exmpt_other
from #prop_export_exemptions
where #prop_export.prop_id = #prop_export_exemptions.prop_id
and   #prop_export.owner_id = #prop_export_exemptions.owner_id
and   #prop_export.prop_yr = #prop_export_exemptions.prop_yr
and   #prop_export.prop_yr = @input_yr

--Update Use Freeze and Freeze Ceiling
update #prop_export
set use_frz = use_freeze,
frz_ceil = freeze_ceiling
from #prop_export join property_freeze
on  #prop_export.prop_id  = property_freeze.prop_id
and #prop_export.owner_id = property_freeze.owner_id
and #prop_export.prop_yr  = property_freeze.owner_tax_yr
and #prop_export.prop_yr = @input_yr
where use_freeze = 'T'

--IF OBJECT_ID('tempdb..#prop_export') IS NOT NULL 
			SELECT 
				prop_id, prop_yr prop_yr, geo_id, owner_id, owner_name, addr_line1,
				addr_line2, addr_line3, addr_city, addr_state, addr_zip, legal_desc,
				legal_desc_2, legal_desc_3, legal_desc_4, year_built, sq_ft, num_acres, 
				imprv_hstd_val, land_hstd_val, state_cd, [status], market_val, prev_market_val, 
				sale_date, sale_price, sale_vol, sale_inst, sale_page, sale_grantor, 
				sale_grantee, mortgage_cd, entity_1, entity_2, entity_3, entity_4, entity_5, 
				entity_6, entity_7, entity_8, entity_9, entity_10, tax_due_1, tax_due_2, 
				tax_due_3, tax_due_4, tax_due_5, tax_due_6, tax_due_7, tax_due_8, tax_due_9, 
				tax_due_10, exmpt_hs, exmpt_ov65, exmpt_dp, exmpt_dv, exmpt_ex, exmpt_other, 
				use_frz, frz_ceil, situs_display, dba_name 
			FROM #prop_export

drop table #prop_export_exemptions
drop table #prop_export_entities
drop table #prop_export

GO

