

CREATE PROCEDURE Ov65PopulateTemp 
@year as int,
@ntype as int
AS
if not exists (select * from tempdb.dbo.sysobjects where name = '##auto_add_ov65_candidates') 
CREATE TABLE [##auto_add_ov65_candidates] 
(
	[session_id]			[int] NOT NULL,			
	[prop_id] 				[int] NOT NULL,
	[udi_parent_prop_id] 	[int] NULL,
	[owner_id]				[int] NOT NULL,
	[owner_tax_yr] 			[numeric] (4, 0)NOT NULL,
	[sup_num]				[int] NOT NULL,
	[file_as_name] 			[varchar] (256),
	[birth_dt]   			[datetime] NULL,
	[spouse_birth_dt] 		[datetime] NULL,
	[addr_line1] 			[varchar] (256) NULL,
	[addr_line2] 			[varchar] (256) NULL,
	[addr_line3] 			[varchar] (256) NULL,
	[addr_city]  			[varchar] (32)  NULL,
	[addr_state] 			[varchar] (32)  NULL,
	[addr_zip]   			[varchar] (32)  NULL,
	[ntype]      			[numeric] (1, 0)NULL,
	[stype]      			[varchar] (256) NULL,
	[sp_processed_status] 	[varchar] (256)	NULL
)

DELETE FROM [##auto_add_ov65_candidates] where session_id = @@SPID
INSERT INTO [##auto_add_ov65_candidates]
SELECT 	@@SPID, [prop_id], [udi_parent_prop_id], [owner_id], [owner_tax_yr], [sup_num], [file_as_name], [birth_dt], [spouse_birth_dt], 
case ltrim(rtrim(isnull([addr_line1], ''))) 
	when '' then
		case ltrim(rtrim(isnull([addr_line2], ''))) 
			when '' then
				case ltrim(rtrim(isnull([addr_line3], ''))) 
					when '' then '' 		-- return empty
					else [addr_line3] 		-- return line 3 only
				end
			else
				case ltrim(rtrim(isnull([addr_line3], ''))) 
					when '' then [addr_line2] 	-- return line 2 only
					else [addr_line2] + CHAR(13) + CHAR(10) + [addr_line3] 	-- return line 2 + 3 only
				end
		end
	else
		case ltrim(rtrim(isnull([addr_line2], ''))) 
			when '' then
				case ltrim(rtrim(isnull([addr_line3], ''))) 
					when '' then [addr_line1] 	-- return line 1 only
	    				else [addr_line1] + CHAR(13) + CHAR(10) + [addr_line3] 	-- return line 1 + 3 only
				end
			else
				case ltrim(rtrim(isnull([addr_line3], ''))) 
					when '' then [addr_line1] + CHAR(13) + CHAR(10) + [addr_line2]	-- return line 1 + 2 only
					else [addr_line1] + CHAR(13) + CHAR(10) + [addr_line2] + CHAR(13) + CHAR(10) + [addr_line3]	-- return all 3 lines
			end
		end
	end 
	+ CHAR(13) + CHAR(10) + [addr_city] + ', ' + [addr_state] + ' ' +[addr_zip] as [addr_line1], 
	[addr_line2], [addr_line3], [addr_city], [addr_state], [addr_zip], [ntype], [stype], NULL 
FROM [dbo].[auto_add_ov65_candidates_vw]
WHERE [owner_tax_yr] = @year and [ntype] <= @ntype

GO

