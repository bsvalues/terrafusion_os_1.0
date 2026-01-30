using Microsoft.Data.Sqlite;
using System;
using System.IO;

namespace TerraFusion.API.Scripts
{
    public class DatabaseCleanup
    {
        public static void Execute()
        {
            var dbPath = "terrafusion.db";
            
            if (!File.Exists(dbPath))
            {
                Console.WriteLine("❌ Database not found. Run the application to create it.");
                return;
            }
            
            var backupPath = $"terrafusion_backup_{DateTime.Now:yyyyMMdd_HHmmss}.db";
            File.Copy(dbPath, backupPath, true);
            Console.WriteLine($"✅ Backup created: {backupPath}");
            
            using var connection = new SqliteConnection($"Data Source={dbPath}");
            connection.Open();
            
            using (var cmd = connection.CreateCommand())
            {
                cmd.CommandText = @"
                    DELETE FROM Modules 
                    WHERE Name IN (
                        SELECT Name 
                        FROM Modules 
                        GROUP BY Name 
                        HAVING COUNT(*) > 1
                    ) 
                    AND rowid NOT IN (
                        SELECT MIN(rowid) 
                        FROM Modules 
                        GROUP BY Name
                    )";
                var deletedDuplicates = cmd.ExecuteNonQuery();
                Console.WriteLine($"✅ Removed {deletedDuplicates} duplicate modules");
            }
            
            using (var cmd = connection.CreateCommand())
            {
                cmd.CommandText = @"
                    SELECT COUNT(*) AS TotalModules,
                           COUNT(DISTINCT Name) AS UniqueModules
                    FROM Modules";
                
                using var reader = cmd.ExecuteReader();
                if (reader.Read())
                {
                    var total = reader.GetInt32(0);
                    var unique = reader.GetInt32(1);
                    Console.WriteLine($"📊 Database now has {unique} unique modules (was {total})");
                }
            }
            
            using (var cmd = connection.CreateCommand())
            {
                cmd.CommandText = @"
                    SELECT Name, COUNT(*) as Count 
                    FROM Modules 
                    GROUP BY Name 
                    HAVING COUNT(*) > 1";
                
                using var reader = cmd.ExecuteReader();
                var hasDuplicates = false;
                while (reader.Read())
                {
                    hasDuplicates = true;
                    Console.WriteLine($"⚠️  Still has duplicate: {reader.GetString(0)} ({reader.GetInt32(1)} copies)");
                }
                
                if (!hasDuplicates)
                {
                    Console.WriteLine("✅ No more duplicates found!");
                }
            }
            
            using (var cmd = connection.CreateCommand())
            {
                cmd.CommandText = "VACUUM";
                cmd.ExecuteNonQuery();
                Console.WriteLine("✅ Database optimized");
            }
            
            Console.WriteLine("\n✨ Database cleanup complete!");
        }
    }
}
