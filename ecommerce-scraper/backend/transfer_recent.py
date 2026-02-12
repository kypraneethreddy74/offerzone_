"""
Transfer only recent tvs_unified data (last 30 days)
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

def main():
    print("\n🚀 Transferring Recent tvs_unified Data (Last 30 Days)...\n")

    local_conn = pymysql.connect(**LOCAL)
    railway_conn = pymysql.connect(**RAILWAY)
    print("✅ Both DBs connected\n")

    local_cursor = local_conn.cursor()
    railway_cursor = railway_conn.cursor()

    # Step 1: Get CREATE TABLE
    local_cursor.execute("SHOW CREATE TABLE tvs_unified")
    create_sql = local_cursor.fetchone()[1]

    # Step 2: Create table in Railway
    railway_cursor.execute("DROP TABLE IF EXISTS tvs_unified")
    railway_cursor.execute(create_sql)
    railway_conn.commit()
    print("✅ Table created in Railway")

    # Step 3: Count recent rows
    local_cursor.execute("""
        SELECT COUNT(*) FROM tvs_unified 
        WHERE scraped_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    """)
    recent_count = local_cursor.fetchone()[0]
    print(f"📊 Recent rows (last 30 days): {recent_count}")

    # If still too many, try last 15 days
    if recent_count > 20000:
        print("⚠️ Still too many rows. Trying last 15 days...")
        local_cursor.execute("""
            SELECT COUNT(*) FROM tvs_unified 
            WHERE scraped_at >= DATE_SUB(NOW(), INTERVAL 15 DAY)
        """)
        recent_count = local_cursor.fetchone()[0]
        days = 15
        print(f"📊 Recent rows (last 15 days): {recent_count}")
    else:
        days = 30

    # Step 4: Transfer in batches
    batch_size = 500
    offset = 0

    print(f"\n📦 Transferring {recent_count} rows...\n")

    while offset < recent_count:
        local_cursor.execute(f"""
            SELECT * FROM tvs_unified 
            WHERE scraped_at >= DATE_SUB(NOW(), INTERVAL {days} DAY)
            LIMIT {batch_size} OFFSET {offset}
        """)
        rows = local_cursor.fetchall()

        if not rows:
            break

        cols = len(rows[0])
        ph = ", ".join(["%s"] * cols)

        try:
            railway_cursor.executemany(
                f"INSERT INTO tvs_unified VALUES ({ph})",
                rows
            )
            railway_conn.commit()
            offset += batch_size
            print(f"   {min(offset, recent_count)}/{recent_count} rows...")
        except Exception as e:
            print(f"\n⚠️ Disk full at {offset} rows!")
            print(f"   Successfully transferred {offset} rows")
            railway_conn.commit()
            break

    # Step 5: Verify
    railway_cursor.execute("SELECT COUNT(*) FROM tvs_unified")
    final_count = railway_cursor.fetchone()[0]
    print(f"\n✅ tvs_unified: {final_count} rows in Railway!")

    local_cursor.close()
    railway_cursor.close()
    local_conn.close()
    railway_conn.close()

    print("\n🎉 Transfer Complete!\n")


if __name__ == "__main__":
    main()