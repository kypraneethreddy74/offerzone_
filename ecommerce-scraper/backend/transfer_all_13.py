"""
Transfer ALL 13 Mandatory Tables
"""
import pymysql
import sys

LOCAL = {
    "host": "localhost",
    "port": 3306,
    "user": "root",
    "password": "Kpkr@153",
    "database": "offerzone_project"
}

RAILWAY = {
    "host": "crossover.proxy.rlwy.net",
    "port": 55256,
    "user": "root",
    "password": "ILVVkfvAVVeukiJIFgEvavPiqdyfvaWm",
    "database": "railway"
}

# Order matters! Tables with foreign keys should be created after their parent tables
MANDATORY_TABLES = [
    "users",
    "refresh_sessions",
    "email_verification_tokens",
    "tv_brand_master",
    "tv_platform_master",
    "tv_product_master",
    "tv_platform_latest_master",
    "product_statistics",
    "admin_stats_cache",
    "wishlists",
    "price_alerts",
    "alert_notifications",
    "tvs_unified"  # Largest table last
]

def transfer_table(local_conn, railway_conn, table_name):
    try:
        local_cursor = local_conn.cursor()
        railway_cursor = railway_conn.cursor()

        # Get CREATE TABLE
        local_cursor.execute(f"SHOW CREATE TABLE `{table_name}`")
        create_sql = local_cursor.fetchone()[1]

        # Drop and recreate
        railway_cursor.execute(f"DROP TABLE IF EXISTS `{table_name}`")
        railway_cursor.execute(create_sql)
        railway_conn.commit()

        # Get column names
        local_cursor.execute(f"SHOW COLUMNS FROM `{table_name}`")
        columns = [row[0] for row in local_cursor.fetchall()]
        col_names = ", ".join([f"`{c}`" for c in columns])
        placeholders = ", ".join(["%s"] * len(columns))

        # Count rows
        local_cursor.execute(f"SELECT COUNT(*) FROM `{table_name}`")
        total = local_cursor.fetchone()[0]
        print(f"\n📦 {table_name}: {total} rows")

        if total == 0:
            print(f"   ✅ Created (empty)")
            return True

        # Special handling for tvs_unified (limit to last 7 days)
        if table_name == "tvs_unified" and total > 15000:
            print(f"   ⚠️ Large table! Transferring last 7 days only...")
            
            # Get max date first
            local_cursor.execute("SELECT MAX(scraped_at) FROM tvs_unified")
            max_date = local_cursor.fetchone()[0]
            
            local_cursor.execute(f"""
                SELECT COUNT(*) FROM tvs_unified 
                WHERE scraped_at >= DATE_SUB('{max_date}', INTERVAL 7 DAY)
            """)
            total = local_cursor.fetchone()[0]
            print(f"   Reduced to {total} rows (last 7 days)")
            
            batch = 500
            offset = 0
            
            while offset < total:
                local_cursor.execute(f"""
                    SELECT {col_names} FROM tvs_unified 
                    WHERE scraped_at >= DATE_SUB('{max_date}', INTERVAL 7 DAY)
                    LIMIT {batch} OFFSET {offset}
                """)
                rows = local_cursor.fetchall()
                if not rows:
                    break
                try:
                    railway_cursor.executemany(
                        f"INSERT INTO `{table_name}` ({col_names}) VALUES ({placeholders})",
                        rows
                    )
                    railway_conn.commit()
                    offset += batch
                    print(f"   {min(offset, total)}/{total} rows...")
                except Exception as e:
                    print(f"   ⚠️ Stopped at {offset}: {str(e)}")
                    railway_conn.commit()
                    break
        else:
            # Normal transfer
            batch = 500
            offset = 0

            while offset < total:
                local_cursor.execute(f"SELECT {col_names} FROM `{table_name}` LIMIT {batch} OFFSET {offset}")
                rows = local_cursor.fetchall()
                if not rows:
                    break
                try:
                    railway_cursor.executemany(
                        f"INSERT INTO `{table_name}` ({col_names}) VALUES ({placeholders})",
                        rows
                    )
                    railway_conn.commit()
                    offset += batch
                    print(f"   {min(offset, total)}/{total} rows...")
                except Exception as e:
                    print(f"   ⚠️ Stopped at {offset}: {str(e)}")
                    railway_conn.commit()
                    return False

        # Verify
        railway_cursor.execute(f"SELECT COUNT(*) FROM `{table_name}`")
        final = railway_cursor.fetchone()[0]
        print(f"   ✅ {final} rows transferred!")

        local_cursor.close()
        railway_cursor.close()
        return True

    except Exception as e:
        print(f"   ❌ Error: {str(e)}")
        return False


def main():
    print("\n" + "=" * 60)
    print("🚀 TRANSFERRING ALL 13 MANDATORY TABLES")
    print("=" * 60)

    local_conn = pymysql.connect(**LOCAL)
    print("\n✅ Local DB connected")

    railway_conn = pymysql.connect(**RAILWAY)
    print("✅ Railway DB connected")

    success = 0
    failed = 0

    for table in MANDATORY_TABLES:
        result = transfer_table(local_conn, railway_conn, table)
        if result:
            success += 1
        else:
            failed += 1

    # Final Report
    print("\n" + "=" * 60)
    print("📊 FINAL REPORT")
    print("=" * 60)
    
    railway_cursor = railway_conn.cursor()
    for tbl in MANDATORY_TABLES:
        try:
            railway_cursor.execute(f"SELECT COUNT(*) FROM `{tbl}`")
            count = railway_cursor.fetchone()[0]
            status = "✅" if count > 0 else "⚠️ Empty"
            print(f"   {status} {tbl}: {count} rows")
        except:
            print(f"   ❌ {tbl}: NOT FOUND")
    railway_cursor.close()

    print(f"\n   ✅ Success: {success}/13")
    print(f"   ❌ Failed: {failed}/13")

    local_conn.close()
    railway_conn.close()

    print("\n🎉 Transfer Complete!")
    print("🔗 Test: https://offerzone-backend-9pq1.onrender.com/products")
    print("🔗 Website: https://offerzone-3psu.vercel.app\n")


if __name__ == "__main__":
    main()