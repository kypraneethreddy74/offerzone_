"""
Transfer ONLY essential missing tables
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

# ONLY essential tables
ESSENTIAL_TABLES = [
    "product_statistics",
    "tvs_unified"
]

def check_local_size(conn):
    """Check table sizes"""
    cursor = conn.cursor()
    for table in ESSENTIAL_TABLES:
        cursor.execute(f"SELECT COUNT(*) FROM `{table}`")
        count = cursor.fetchone()[0]
        
        cursor.execute(f"""
            SELECT ROUND((data_length + index_length)/1024/1024, 2) 
            FROM information_schema.tables 
            WHERE table_schema = 'offerzone_project' 
            AND table_name = '{table}'
        """)
        size = cursor.fetchone()[0]
        print(f"   {table}: {count} rows, {size} MB")
    cursor.close()

def transfer_table(local_conn, railway_conn, table_name):
    try:
        local_cursor = local_conn.cursor()
        railway_cursor = railway_conn.cursor()

        # Get CREATE TABLE
        local_cursor.execute(f"SHOW CREATE TABLE `{table_name}`")
        create_sql = local_cursor.fetchone()[1]

        # Create in Railway
        railway_cursor.execute(f"DROP TABLE IF EXISTS `{table_name}`")
        railway_cursor.execute(create_sql)
        railway_conn.commit()

        # Get count
        local_cursor.execute(f"SELECT COUNT(*) FROM `{table_name}`")
        total = local_cursor.fetchone()[0]
        print(f"\n📦 {table_name}: {total} rows...")

        if total == 0:
            print(f"✅ {table_name}: Created (empty)")
            return

        batch = 500
        offset = 0

        while offset < total:
            local_cursor.execute(f"SELECT * FROM `{table_name}` LIMIT {batch} OFFSET {offset}")
            rows = local_cursor.fetchall()
            if not rows:
                break

            cols = len(rows[0])
            ph = ", ".join(["%s"] * cols)

            railway_cursor.executemany(
                f"INSERT INTO `{table_name}` VALUES ({ph})",
                rows
            )
            railway_conn.commit()

            offset += batch
            print(f"   {min(offset, total)}/{total} rows...")

        print(f"✅ {table_name}: {total} rows done!")
        local_cursor.close()
        railway_cursor.close()

    except Exception as e:
        print(f"❌ {table_name}: {str(e)}")


def main():
    print("\n🚀 Transferring Essential Tables Only...\n")

    local_conn = pymysql.connect(**LOCAL)
    print("✅ Local DB connected")

    # Check sizes first
    print("\n📊 Table sizes:")
    check_local_size(local_conn)

    railway_conn = pymysql.connect(**RAILWAY)
    print("\n✅ Railway DB connected\n")

    for table in ESSENTIAL_TABLES:
        transfer_table(local_conn, railway_conn, table)

    local_conn.close()
    railway_conn.close()

    print("\n🎉 Essential Tables Transferred!\n")


if __name__ == "__main__":
    main()