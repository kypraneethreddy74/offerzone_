"""
Fixed Transfer Script - Main Product Tables
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

TABLES = [
    "tv_platform_latest_master",
    "tv_product_master"
]

def transfer_table(local_conn, railway_conn, table_name):
    try:
        local_cursor = local_conn.cursor()
        railway_cursor = railway_conn.cursor()

        # Step 1: Drop and recreate table from local structure
        print(f"\n📦 {table_name}:")
        print(f"   Dropping old table in Railway...")
        railway_cursor.execute(f"DROP TABLE IF EXISTS `{table_name}`")
        railway_conn.commit()

        # Step 2: Get CREATE TABLE from local
        local_cursor.execute(f"SHOW CREATE TABLE `{table_name}`")
        create_sql = local_cursor.fetchone()[1]

        # Step 3: Create fresh table in Railway
        print(f"   Creating fresh table...")
        railway_cursor.execute(create_sql)
        railway_conn.commit()

        # Step 4: Get column names
        local_cursor.execute(f"SHOW COLUMNS FROM `{table_name}`")
        columns = [row[0] for row in local_cursor.fetchall()]
        print(f"   Columns: {len(columns)}")

        # Step 5: Count rows
        local_cursor.execute(f"SELECT COUNT(*) FROM `{table_name}`")
        total = local_cursor.fetchone()[0]
        print(f"   Total rows: {total}")

        if total == 0:
            print(f"   ⚠️ No data in local!")
            return

        # Step 6: Transfer using column names
        col_names = ", ".join([f"`{c}`" for c in columns])
        placeholders = ", ".join(["%s"] * len(columns))

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
                print(f"   ❌ Error at {offset}: {str(e)}")
                railway_conn.rollback()
                break

        # Verify
        railway_cursor.execute(f"SELECT COUNT(*) FROM `{table_name}`")
        final = railway_cursor.fetchone()[0]
        print(f"   ✅ {table_name}: {final} rows in Railway!")

        local_cursor.close()
        railway_cursor.close()

    except Exception as e:
        print(f"❌ {table_name}: {str(e)}")


def main():
    print("\n🚀 Fixed Transfer - Main Product Tables...\n")

    local_conn = pymysql.connect(**LOCAL)
    print("✅ Local DB connected")

    railway_conn = pymysql.connect(**RAILWAY)
    print("✅ Railway DB connected")

    for table in TABLES:
        transfer_table(local_conn, railway_conn, table)

    # Final verification
    print("\n\n📊 Final Verification:")
    railway_cursor = railway_conn.cursor()
    for tbl in TABLES:
        railway_cursor.execute(f"SELECT COUNT(*) FROM `{tbl}`")
        count = railway_cursor.fetchone()[0]
        print(f"   {tbl}: {count} rows")
    railway_cursor.close()

    local_conn.close()
    railway_conn.close()

    print("\n🎉 Transfer Complete!")
    print("\n🔗 Test API: https://offerzone-backend-9pq1.onrender.com/products")
    print("🔗 Test Website: https://offerzone-3psu.vercel.app\n")


if __name__ == "__main__":
    main()