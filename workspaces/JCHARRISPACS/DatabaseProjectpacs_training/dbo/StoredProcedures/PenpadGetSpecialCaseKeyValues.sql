

create procedure PenpadGetSpecialCaseKeyValues
	@szTableName sysname,
	@szKeys varchar(512) output
as

set nocount on

	declare @lRet int
	set @lRet = 0

	if ( @szTableName = 'imprv' )
	begin
		exec PenpadGetSpecialCaseKeyValue_imprv @szKeys output
	end
	else if ( @szTableName = 'imprv_adj' )
	begin
		exec PenpadGetSpecialCaseKeyValue_imprv_adj @szKeys output
	end
	else if ( @szTableName = 'imprv_attr' )
	begin
		exec PenpadGetSpecialCaseKeyValue_imprv_attr @szKeys output
	end
	else if ( @szTableName = 'imprv_det_adj' )
	begin
		exec PenpadGetSpecialCaseKeyValue_imprv_det_adj @szKeys output
	end
	else if ( @szTableName = 'imprv_detail' )
	begin
		exec PenpadGetSpecialCaseKeyValue_imprv_detail @szKeys output
	end
	else if ( @szTableName = 'land_adj' )
	begin
		exec PenpadGetSpecialCaseKeyValue_land_adj @szKeys output
	end
	else if ( @szTableName = 'land_detail' )
	begin
		exec PenpadGetSpecialCaseKeyValue_land_detail @szKeys output
	end
	else if ( @szTableName = 'entity_prop_assoc' )
	begin
		exec PenpadGetSpecialCaseKeyValue_entity_prop_assoc @szKeys output
	end
	else if ( @szTableName = 'images' )
	begin
		exec PenpadGetSpecialCaseKeyValue_images @szKeys output
	end
	else if ( @szTableName = 'owner' )
	begin
		exec PenpadGetSpecialCaseKeyValue_owner @szKeys output
	end
	else
	begin
		set @lRet = -1
	end

set nocount off

	return(@lRet)

GO

