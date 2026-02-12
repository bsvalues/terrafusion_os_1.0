
CREATE procedure ConvertSharedValue

as

declare @pacs_prop_id		int
declare @shared_year		numeric(4)
declare @shared_cad_code 	varchar(5)
declare @shared_prop_id		varchar(30)
declare @ov_mkt_lan		numeric(14)
declare @ov_agr_lan		numeric(14)
declare @ov_mkt_agl		numeric(14)
declare @ov_impr		numeric(14)
declare @ov_hs_impr		numeric(14)
declare @ov_hs_lan		numeric(14)
declare @next_shared_id		int
declare @sptb_mkt  		varchar(10)
declare @sptb_agrl		varchar(10)
declare @sptb_imprv		varchar(10)
declare @use_code		varchar(5)


declare shared_prop scroll cursor for
select 
pacs_prop_id,                                                                                                                     
shared_year,                                                                                                                    
shared_cad_code,                                                                                                            
shared_prop_id,
ov_mkt_lan,
ov_agr_lan,
ov_mkt_agl,
ov_impr,
ov_hs_impr,
ov_hs_land
from shared_prop, ccad_overlap
where shared_prop.pacs_prop_id    = convert(int, ccad_overlap.OV_ACCT)
and   shared_prop.shared_cad_code = ccad_overlap.OV_ALT_CAD

exec dbo.GetUniqueID 'shared_prop_value', @next_shared_id output, 1, 0

open shared_prop
fetch next from shared_prop into @pacs_prop_id, @shared_year, @shared_cad_code, @shared_prop_id,
				 @ov_mkt_lan, @ov_agr_lan, @ov_mkt_agl, @ov_impr, @ov_hs_impr, @ov_hs_lan

while (@@FETCH_STATUS = 0)
begin

	select @sptb_mkt  = sptb_mktl,
	       @sptb_agrl = sptb_agrl,
	       @sptb_imprv = sptb_impr
	from ccad_overlap_sptb
	where ccad_overlap_sptb.acct_no = @pacs_prop_id

	if (@ov_hs_impr is null)
	begin
		select @ov_hs_impr = 0
	end

	if (@ov_hs_lan is null)
	begin
		select @ov_hs_lan = 0
	end

	if (@ov_impr is null)
	begin
		select @ov_hs_impr = 0
	end

	if (@ov_mkt_lan is null)
	begin
		select @ov_mkt_lan = 0
	end

	if (@ov_hs_impr <> 0) 
	begin

	    	if ((@ov_hs_impr - @ov_impr) <= 0) and (@ov_impr > 0 or @ov_hs_impr > 0)
	 	begin

			exec dbo.GetUniqueID 'shared_prop_value', @next_shared_id output, 1, 0

			insert into shared_prop_value
			(
			pacs_prop_id,
			shared_prop_id,
			shared_year,
			shared_cad_code,
			shared_value_id,
			state_code,
			shared_value,
			acres,
			ag_use_code,
			record_type,
			land_type_code,
			homesite_flag,
			ag_use_value
			)
			values
			(
			@pacs_prop_id,
			@shared_prop_id,
			@shared_year,
			@shared_cad_code,
			@next_shared_id,
			@sptb_imprv,
			@ov_hs_impr,
			0,
			NULL,
			'I',
			NULL,
			'T',
			0
			)
		end
		else
		begin
			exec dbo.GetUniqueID 'shared_prop_value', @next_shared_id output, 1, 0

			insert into shared_prop_value
			(
			pacs_prop_id,
			shared_prop_id,
			shared_year,
			shared_cad_code,
			shared_value_id,
			state_code,
			shared_value,
			acres,
			ag_use_code,
			record_type,
			land_type_code,
			homesite_flag,
			ag_use_value
			)
			values
			(
			@pacs_prop_id,
			@shared_prop_id,
			@shared_year,
			@shared_cad_code,
			@next_shared_id,
			@sptb_imprv,
			@ov_hs_impr,
			0,
			NULL,
			'I',
			NULL,
			'T',
			0
			)

			exec dbo.GetUniqueID 'shared_prop_value', @next_shared_id output, 1, 0

			insert into shared_prop_value
			(
			pacs_prop_id,
			shared_prop_id,
			shared_year,
			shared_cad_code,
			shared_value_id,
			state_code,
			shared_value,
			acres,
			ag_use_code,
			record_type,
			land_type_code,
			homesite_flag,
			ag_use_value
			)
			values
			(
			@pacs_prop_id,
			@shared_prop_id,
			@shared_year,
			@shared_cad_code,
			@next_shared_id,
			@sptb_imprv,
			@ov_impr - @ov_hs_impr,
			0,
			NULL,
			'I',
			NULL,
			'F',
			0
			)
		end
	end
	else
	begin
		if (@ov_impr > 0)
		begin
			exec dbo.GetUniqueID 'shared_prop_value', @next_shared_id output, 1, 0

			insert into shared_prop_value
			(
			pacs_prop_id,
			shared_prop_id,
			shared_year,

			shared_cad_code,
			shared_value_id,
			state_code,
			shared_value,
			acres,
			ag_use_code,
			record_type,
			land_type_code,
			homesite_flag,
			ag_use_value
			)
			values
			(
			@pacs_prop_id,
			@shared_prop_id,
			@shared_year,
			@shared_cad_code,
			@next_shared_id,
			@sptb_imprv,
			@ov_impr,
			0,
			NULL,
			'I',
			NULL,
			'F',
			0
			)
		end
	end

	/*****************************************************/
	/*********************** LAND ************************/
	/*****************************************************/
	if (@ov_hs_lan <> 0) 
	begin

	    	if ((@ov_mkt_lan - @ov_hs_lan) <= 0) and (@ov_mkt_lan > 0 or @ov_hs_lan > 0)
	 	begin
			exec dbo.GetUniqueID 'shared_prop_value', @next_shared_id output, 1, 0

			insert into shared_prop_value
			(
			pacs_prop_id,
			shared_prop_id,
			shared_year,
			shared_cad_code,
			shared_value_id,
			state_code,
			shared_value,
			acres,
			ag_use_code,
			record_type,
			land_type_code,
			homesite_flag,
			ag_use_value
			)
			values
			(
			@pacs_prop_id,
			@shared_prop_id,
			@shared_year,
			@shared_cad_code,
			@next_shared_id,
			@sptb_mkt,
			@ov_hs_lan,
			0,
			NULL,
			'L',
			NULL,
			'T',
			0
			)
		end
		else
		begin
			exec dbo.GetUniqueID 'shared_prop_value', @next_shared_id output, 1, 0

			insert into shared_prop_value
			(
			pacs_prop_id,
			shared_prop_id,
			shared_year,
			shared_cad_code,
			shared_value_id,
			state_code,
			shared_value,
			acres,
			ag_use_code,
			record_type,
			land_type_code,
			homesite_flag,
			ag_use_value
			)
			values
			(
			@pacs_prop_id,
			@shared_prop_id,
			@shared_year,
			@shared_cad_code,
			@next_shared_id,
			@sptb_mkt,
			@ov_hs_lan,
			0,
			NULL,
			'L',
			NULL,
			'T',
			0
			)

			exec dbo.GetUniqueID 'shared_prop_value', @next_shared_id output, 1, 0

			insert into shared_prop_value
			(
			pacs_prop_id,
			shared_prop_id,
			shared_year,
			shared_cad_code,
			shared_value_id,
			state_code,
			shared_value,
			acres,
			ag_use_code,
			record_type,
			land_type_code,
			homesite_flag,
			ag_use_value
			)
			values
			(
			@pacs_prop_id,
			@shared_prop_id,
			@shared_year,
			@shared_cad_code,
			@next_shared_id,
			@sptb_mkt,
			@ov_mkt_lan - @ov_hs_lan,
			0,
			NULL,
			'L',
			NULL,
			'F',
			0
			)
		end
	end
	else
	begin
		if (@ov_mkt_lan > 0)
		begin
			exec dbo.GetUniqueID 'shared_prop_value', @next_shared_id output, 1, 0

			insert into shared_prop_value
			(
			pacs_prop_id,
			shared_prop_id,
			shared_year,
			shared_cad_code,
			shared_value_id,
			state_code,
			shared_value,
			acres,
			ag_use_code,
			record_type,
			land_type_code,
			homesite_flag,
			ag_use_value
			)
			values
			(
			@pacs_prop_id,
			@shared_prop_id,
			@shared_year,
			@shared_cad_code,
			@next_shared_id,
			@sptb_mkt,
			@ov_mkt_lan,
			0,
			NULL,
			'L',
			NULL,
			'F',
			0
			)
		end
	end

	/******************************************/
	/************* ag value *******************/
	if (@ov_agr_lan > 0) or (@ov_mkt_agl > 0)
	begin
		exec dbo.GetUniqueID 'shared_prop_value', @next_shared_id output, 1, 0
		
		select @use_code = NULL

		if (@sptb_agrl = 'D2')
		begin
			select @use_code = 'TIM'
		end
		else if (@sptb_agrl = 'D1' or @sptb_agrl = 'D3')
		begin
			select @use_code = '1D1'
		end
		
		insert into shared_prop_value
		(
		pacs_prop_id,
		shared_prop_id,
		shared_year,
		shared_cad_code,
		shared_value_id,
		state_code,
		shared_value,
		acres,
		ag_use_code,
		record_type,
		land_type_code,
		homesite_flag,
		ag_use_value
		)
		values
		(
		@pacs_prop_id,
		@shared_prop_id,
		@shared_year,
		@shared_cad_code,
		@next_shared_id,
		@sptb_agrl,
		@ov_mkt_agl ,
		0,
		@use_code,
		'L',
		null,
		'F',
		@ov_agr_lan
		)
	end


	
		

	fetch next from shared_prop into @pacs_prop_id, @shared_year, @shared_cad_code, @shared_prop_id,
				 	 @ov_mkt_lan, @ov_agr_lan, @ov_mkt_agl, @ov_impr, @ov_hs_impr, @ov_hs_lan
end


close shared_prop
deallocate shared_prop

GO

