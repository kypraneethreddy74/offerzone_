"""
Transfer remaining 5 tables - Disable Foreign Key Checks
"""
import pymysql

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

REMAINING_TABLES = [
    "users",
    "refresh_sessions",
    "email_verification_tokens",
    "wishlists",
    "price_alerts"
]

def main():
    print("\n🚀 Transferring Remaining 5 Tables...\n")

    local_conn = pymysql.connect(**LOCAL)
    railway_conn = pymysql.connect(**RAILWAY)
    print("✅ Both DBs connected\n")

    railway_cursor = railway_conn.cursor()

    # DISABLE FOREIGN KEY CHECKS
    railway_cursor.execute("SET FOREIGN_KEY_CHECKS = 0")
    railway_conn.commit()
    print("🔓 Foreign Key Checks DISABLED\n")

    for table_name in REMAINING_TABLES:
        try:
            local_cursor = local_conn.cursor()

            # Drop and recreate
            local_cursor.execute(f"SHOW CREATE TABLE `{table_name}`")
            create_sql = local_cursor.fetchone()[1]

            railway_cursor.execute(f"DROP TABLE IF EXISTS `{table_name}`")
            railway_cursor.execute(create_sql)
            railway_conn.commit()

            # Get columns
            local_cursor.execute(f"SHOW COLUMNS FROM `{table_name}`")
            columns = [row[0] for row in local_cursor.fetchall()]
            col_names = ", ".join([f"`{c}`" for c in columns])
            placeholders = ", ".join(["%s"] * len(columns))

            # Count
            local_cursor.execute(f"SELECT COUNT(*) FROM `{table_name}`")
            total = local_cursor.fetchone()[0]
            print(f"📦 {table_name}: {total} rows")

            if total == 0:
                print(f"   ✅ Created (empty)\n")
                continue

            # Transfer
            batch = 500
            offset = 0

            while offset < total:
                local_cursor.execute(f"SELECT {col_names} FROM `{table_name}` LIMIT {batch} OFFSET {offset}")
                rows = local_cursor.fetchall()
                if not rows:
                    break

                railway_cursor.executemany(
                    f"INSERT INTO `{table_name}` ({col_names}) VALUES ({placeholders})",
                    rows
                )
                railway_conn.commit()
                offset += batch
                print(f"   {min(offset, total)}/{total} rows...")

            # Verify
            railway_cursor.execute(f"SELECT COUNT(*) FROM `{table_name}`")
            final = railway_cursor.fetchone()[0]
            print(f"   ✅ {final} rows transferred!\n")

            local_cursor.close()

        except Exception as e:
            print(f"   ❌ {table_name}: {str(e)}\n")

    # RE-ENABLE FOREIGN KEY CHECKS
    railway_cursor.execute("SET FOREIGN_KEY_CHECKS = 1")
    railway_conn.commit()
    print("🔒 Foreign Key Checks RE-ENABLED\n")

    # FINAL REPORT - ALL 13 TABLES
    print("=" * 60)
    print("📊 COMPLETE REPORT - ALL 13 TABLES")
    print("=" * 60)

    ALL_TABLES = [
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
        "tvs_unified"
    ]

    success = 0
    for tbl in ALL_TABLES:
        try:
            railway_cursor.execute(f"SELECT COUNT(*) FROM `{tbl}`")
            count = railway_cursor.fetchone()[0]
            status = "✅" if count >= 0 else "❌"
            print(f"   {status} {tbl}: {count} rows")
            success += 1
        except:
            print(f"   ❌ {tbl}: NOT FOUND")

    print(f"\n   🎉 {success}/13 Tables Ready!")

    railway_cursor.close()
    local_conn.close()
    railway_conn.close()

    print("\n🔗 Test API: https://offerzone-backend-9pq1.onrender.com/products")
    print("🔗 Website: https://offerzone-3psu.vercel.app\n")


if __name__ == "__main__":
    main()