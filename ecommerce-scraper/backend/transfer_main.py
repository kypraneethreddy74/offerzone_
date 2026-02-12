"""
Transfer main product tables from Local to Railway
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

MAIN_TABLES = [
    "tv_platform_latest_master",
    "tv_brand_master",
    "tv_platform_master",
    "tv_product_master"
]

def transfer_table(local_conn, railway_conn, table_name):
    try:
        local_cursor = local_conn.cursor()
        railway_cursor = railway_conn.cursor()

        # Check local data count
        local_cursor.execute(f"SELECT COUNT(*) FROM `{table_name}`")
        total = local_cursor.fetchone()[0]
        print(f"\n📦 {table_name}: {total} rows to transfer...")

        if total == 0:
            print(f"⚠️ {table_name}: No data in local DB!")
            return

        # Clear existing Railway table data
        railway_cursor.execute(f"DELETE FROM `{table_name}`")
        railway_conn.commit()

        # Transfer in batches
        batch = 500
        offset = 0

        while offset < total:
            local_cursor.execute(f"SELECT * FROM `{table_name}` LIMIT {batch} OFFSET {offset}")
            rows = local_cursor.fetchall()
            if not rows:
                break

            cols = len(rows[0])
            ph = ", ".join(["%s"] * cols)

            try:
                railway_cursor.executemany(
                    f"INSERT INTO `{table_name}` VALUES ({ph})",
                    rows
                )
                railway_conn.commit()
                offset += batch
                print(f"   {min(offset, total)}/{total} rows...")
            except Exception as e:
                print(f"   ⚠️ Error at {offset}: {str(e)}")
                break

        # Verify
        railway_cursor.execute(f"SELECT COUNT(*) FROM `{table_name}`")
        final = railway_cursor.fetchone()[0]
        print(f"✅ {table_name}: {final} rows in Railway!")

        local_cursor.close()
        railway_cursor.close()

    except Exception as e:
        print(f"❌ {table_name}: {str(e)}")


def main():
    print("\n🚀 Transferring Main Product Tables...\n")

    local_conn = pymysql.connect(**LOCAL)
    print("✅ Local DB connected")

    railway_conn = pymysql.connect(**RAILWAY)
    print("✅ Railway DB connected")

    for table in MAIN_TABLES:
        transfer_table(local_conn, railway_conn, table)

    # Final verification
    print("\n\n📊 Final Verification:")
    railway_cursor = railway_conn.cursor()
    for table in MAIN_TABLES:
        railway_cursor.execute(f"SELECT COUNT(*) FROM `{table_name}`")
        count = railway_cursor.fetchone()[0]
        print(f"   {table}: {count} rows")
    railway_cursor.close()

    local_conn.close()
    railway_conn.close()

    print("\n🎉 All Main Tables Transferred!\n")
    print("Now test: https://offerzone-backend-9pq1.onrender.com/products")


if __name__ == "__main__":
    main()