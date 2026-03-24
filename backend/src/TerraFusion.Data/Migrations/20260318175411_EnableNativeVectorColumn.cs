using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TerraFusion.Data.Migrations
{
    /// <inheritdoc />
    public partial class EnableNativeVectorColumn : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Safety guard: abort if any embedding has wrong dimension.
            // The USING cast below requires every non-null row to be exactly 1536 floats.
            migrationBuilder.Sql(@"
                DO $$
                BEGIN
                    IF (SELECT COUNT(*) FROM ""RAGEmbeddings""
                        WHERE array_length(""Embedding"", 1) != 1536
                          AND ""Embedding"" IS NOT NULL) > 0
                    THEN
                        RAISE EXCEPTION
                            'EnableNativeVectorColumn: found embeddings with dimension != 1536. '
                            'Correct the data before running this migration.';
                    END IF;
                END $$;");

            // Convert real[] → vector(1536). USING cast is required by PostgreSQL
            // when changing between incompatible column types.
            migrationBuilder.Sql(@"
                ALTER TABLE ""RAGEmbeddings""
                ALTER COLUMN ""Embedding"" TYPE vector(1536)
                USING ""Embedding""::vector(1536);");

            // Add ivfflat cosine index for nearest-neighbor queries.
            // CONCURRENTLY cannot run inside a transaction — suppressTransaction: true.
            // lists=100 is appropriate for initial dataset sizes; tune for production.
            migrationBuilder.Sql(@"
                CREATE INDEX IF NOT EXISTS IX_RAGEmbeddings_Embedding_ivfflat
                ON ""RAGEmbeddings""
                USING ivfflat (""Embedding"" vector_cosine_ops)
                WITH (lists = 100);",
                suppressTransaction: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Drop the ivfflat index first.
            migrationBuilder.Sql(@"
                DROP INDEX IF EXISTS IX_RAGEmbeddings_Embedding_ivfflat;",
                suppressTransaction: true);

            // Revert vector(1536) → real[].
            // All existing rows are safe to cast back because vector elements are floats.
            migrationBuilder.Sql(@"
                ALTER TABLE ""RAGEmbeddings""
                ALTER COLUMN ""Embedding"" TYPE real[]
                USING ""Embedding""::real[];");
        }
    }
}
