
CREATE PROCEDURE CopyDeedHistory
 	@src_prop_id int,
 	@dest_prop_id int

WITH RECOMPILE

AS

	-- build a table of change of owner records to copy
	declare @coo table
	(
		cooID_existing int,
		SeqNum_existing int,
		cooID_new int
	)

	insert @coo (cooID_existing, SeqNum_existing)
	select chg_of_owner_id, seq_num 
	from chg_of_owner_prop_assoc coopa_source with(nolock)
	where coopa_source.prop_id = @src_prop_id
	and not exists (
		select 1 from chg_of_owner_prop_assoc coopa_dest with(nolock)
		where coopa_dest.prop_id = @dest_prop_id
		and coopa_dest.seq_num = coopa_source.seq_num
	)

	-- reserve new change of owner IDs for the copies
	declare @first_new_cooID int
	declare @coo_count int

	select @coo_count = count(*) from @coo
	if @coo_count > 0 	
		exec dbo.GetUniqueID 'chg_of_owner', @first_new_cooID output, @coo_count, 0

	-- assign IDs to the records
	update c
	set cooID_new = new_id
	from @coo c
	join 
	(
		select cooID_existing, SeqNum_existing, 
			(@first_new_cooID + row_number() over(order by SeqNum_existing) - 1) new_id
		from @coo	
	) cnew
	on c.cooID_existing = cnew.cooID_existing
	and c.SeqNum_existing = cnew.SeqNum_existing

	-- copy [chg_of_owner] records	
	insert chg_of_owner
	(
		chg_of_owner_id,
		deed_type_cd,
		deed_num,
		deed_book_id,
		deed_book_page,
		deed_dt,
		coo_sl_dt,
		consideration,
		buyer_lttr_url,
		seller_lttr_url,
		buyer_lttr_prt_dt,
		seller_lttr_prt_dt,
		comment,
		ref_id1,
		grantor_cv,
		grantee_cv,
		recorded_dt,
		coo_exported_flag,
		lttr_id,
		print_buyer_letter,
		print_seller_letter,
		excise_number,
		override_excise
	)
	select	
		c.cooID_new,
		deed_type_cd,
		deed_num,
		deed_book_id,
		deed_book_page,
		deed_dt,
		coo_sl_dt,
		consideration,
		buyer_lttr_url,
		seller_lttr_url,
		buyer_lttr_prt_dt,
		seller_lttr_prt_dt,
		comment,
		ref_id1,
		grantor_cv,
		grantee_cv,
		recorded_dt,
		coo_exported_flag,
		lttr_id,
		print_buyer_letter,
		print_seller_letter,
		null,
		0
	from @coo c
	join chg_of_owner coo with(nolock)
	on coo.chg_of_owner_id = c.cooID_existing


	-- copy [chg_of_owner_prop_assoc] records
	insert chg_of_owner_prop_assoc
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
	select	
		c.cooID_new,
		@dest_prop_id,
		coopa.seq_num,
		coopa.sup_tax_yr,
		coopa.imprv_hstd_val,
		coopa.imprv_non_hstd_val,
		coopa.land_hstd_val,
		coopa.land_non_hstd_val,
		coopa.ag_use_val,
		coopa.ag_market,
		coopa.ag_loss,
		coopa.timber_use,
		coopa.timber_market,
		coopa.timber_loss,
		coopa.appraised_val,
		coopa.assessed_val,
		coopa.market
	FROM @coo c
	join chg_of_owner_prop_assoc coopa with(nolock)
	on c.cooID_existing = coopa.chg_of_owner_id
	where coopa.prop_id = @src_prop_id

	-- copy buyer associations
	insert buyer_assoc (chg_of_owner_id, buyer_id)
	select c.cooID_new, ba.buyer_id 
	from buyer_assoc ba with(nolock)
	join @coo c
		on ba.chg_of_owner_id = c.cooID_existing
	where not exists(
		select 1 from buyer_assoc ba_ex
		where ba_ex.chg_of_owner_id = c.cooID_new
		and ba_ex.buyer_id = ba.buyer_id
	)

	-- copy seller associations
	insert seller_assoc (chg_of_owner_id, seller_id, prop_id)
	select c.cooID_new, sa.seller_id, @dest_prop_id 
	from seller_assoc sa with(nolock)
	join @coo c
		on sa.chg_of_owner_id = c.cooID_existing
	where sa.prop_id = @src_prop_id
	and not exists(
		select 1 from seller_assoc sa_ex
		where sa_ex.chg_of_owner_id = c.cooID_new
		and sa_ex.seller_id = sa.seller_id
		and sa_ex.prop_id = @dest_prop_id
	)

GO

