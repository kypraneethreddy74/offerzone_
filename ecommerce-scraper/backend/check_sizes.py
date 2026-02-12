import pymysql

LOCAL = {
    "host": "localhost",
    "port": 3306,
    "user": "root",
    "password": "Kpkr@153",
    "database": "offerzone_project"
}

MANDATORY_TABLES = [
    "admin_stats_cache",
    "alert_notifications",
    "email_verification_tokens",
    "price_alerts",
    "product_statistics",
    "refresh_sessions",
    "tv_brand_master",
    "tv_platform_latest_master",
    "tv_platform_master",
    "tv_product_master",
    "tvs_unified",
    "users",
    "wishlists"
]

conn = pymysql.connect(**LOCAL)
cursor = conn.cursor()

print("\n📊 13 Mandatory Tables - Local Database:\n")
total_size = 0

for table in MANDATORY_TABLES:
    cursor.execute(f"SELECT COUNT(*) FROM `{table}`")
    rows = cursor.fetchone()[0]
    
    cursor.execute(f"""
        SELECT ROUND((data_length + index_length)/1024/1024, 2)
        FROM information_schema.tables
        WHERE table_schema = 'offerzone_project'
        AND table_name = '{table}'
    """)
    size = cursor.fetchone()[0] or 0
    total_size += float(size)
    print(f"   {table}: {rows} rows, {size} MB")

print(f"\n   📦 TOTAL SIZE: {round(total_size, 2)} MB")
print(f"   💾 Railway Free Limit: 500 MB")
print(f"   {'✅ FITS!' if total_size < 500 else '❌ TOO LARGE!'}")

cursor.close()
conn.close()