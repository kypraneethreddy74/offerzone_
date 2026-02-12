"""
Transfer MISSING tables from Local MySQL to Railway MySQL
"""
import pymysql

# Local Database
LOCAL = {
    "host": "localhost",
    "port": 3306,
    "user": "root",
    "password": "Kpkr@153",
    "database": "offerzone_project"
}

# Railway Database
RAILWAY = {
    "host": "crossover.proxy.rlwy.net",
    "port": 55256,
    "user": "root",
    "password": "ILVVkfvAVVeukiJIFgEvavPiqdyfvaWm",
    "database": "railway"
}

# Missing tables to transfer
MISSING_TABLES = [
    "admin_stats_cache",
    "amazon_tv",
    "amazon_tv_standardized",
    "croma_tv_standardized",
    "croma_tvsss",
    "flipkart_products_new",
    "flipkart_tv_standardized",
    "product_statistics",
    "tvs_unified"
]

def transfer_table(local_conn, railway_conn, table_name):
    try:
        local_cursor = local_conn.cursor()
        railway_cursor = railway_conn.cursor()

        # Get CREATE TABLE statement
        local_cursor.execute(f"SHOW CREATE TABLE `{table_name}`")
        create_sql = local_cursor.fetchone()[1]

        # Drop if exists and create in Railway
        railway_cursor.execute(f"DROP TABLE IF EXISTS `{table_name}`")
        railway_cursor.execute(create_sql)
        railway_conn.commit()

        # Get row count
        local_cursor.execute(f"SELECT COUNT(*) FROM `{table_name}`")
        total_rows = local_cursor.fetchone()[0]
        print(f"\n📦 {table_name}: {total_rows} rows to transfer...")

        if total_rows == 0:
            print(f"✅ {table_name}: Table created (empty)")
            return

        # Transfer in batches
        batch_size = 500
        offset = 0

        while offset < total_rows:
            local_cursor.execute(f"SELECT * FROM `{table_name}` LIMIT {batch_size} OFFSET {offset}")
            rows = local_cursor.fetchall()

            if not rows:
                break

            columns = len(rows[0])
            placeholders = ", ".join(["%s"] * columns)

            railway_cursor.executemany(
                f"INSERT INTO `{table_name}` VALUES ({placeholders})",
                rows
            )
            railway_conn.commit()

            offset += batch_size
            print(f"   Transferred {min(offset, total_rows)}/{total_rows} rows...")

        print(f"✅ {table_name}: {total_rows} rows transferred successfully!")

        local_cursor.close()
        railway_cursor.close()

    except Exception as e:
        print(f"❌ {table_name}: Error - {str(e)}")


def main():
    print("\n🚀 Starting Transfer of Missing Tables...\n")

    print("Connecting to Local DB...")
    local_conn = pymysql.connect(**LOCAL)
    print("✅ Local DB connected")

    print("Connecting to Railway DB...")
    railway_conn = pymysql.connect(**RAILWAY)
    print("✅ Railway DB connected")

    for table in MISSING_TABLES:
        transfer_table(local_conn, railway_conn, table)

    local_conn.close()
    railway_conn.close()

    print("\n🎉 All Missing Tables Transferred!\n")


if __name__ == "__main__":
    main()