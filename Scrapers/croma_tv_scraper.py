import time
import re
import pymysql
import requests
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor, as_completed
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager
from bs4 import BeautifulSoup

# ---------------- DB CONFIG ----------------
DB_CONFIG = {
    "host": "localhost",
    "user": "root",
    "password": "Kpkr@153",
    "database": "offerzone_project"
}

scraped_time = datetime.now().replace(second=0, microsecond=0)

# ---------------- REQUESTS SESSION (Faster than Selenium) ----------------
SESSION = requests.Session()
SESSION.headers.update({
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.5",
})

# ---------------- HELPER FUNCTIONS -------------------
def clean_price(price_str):
    if not price_str:
        return 0
    cleaned = re.sub(r'[₹Rs,\s]', '', str(price_str))
    digits = re.sub(r'[^\d]', '', cleaned)
    return int(digits) if digits else 0

def clean_discount(discount_str):
    if not discount_str:
        return 0
    match = re.search(r'(\d+)', str(discount_str))
    return int(match.group(1)) if match else 0

def clean_rating(rating_str):
    if not rating_str:
        return 0.0
    match = re.search(r'([\d.]+)', str(rating_str))
    return float(match.group(1)) if match else 0.0

def extract_screen_resolution(text):
    if not text:
        return "Unknown"
    t = text.upper()
    if re.search(r"\b8K\b", t):
        return "8K"
    if re.search(r"ULTRA\s*HD|\b4K\b", t):
        return "4K"
    if re.search(r"FULL\s*HD", t):
        return "Full HD"
    if re.search(r"HD\s*READY|\bHD\b", t):
        return "HD"
    return "Unknown"

def extract_panel_type(text):
    if not text:
        return "Unknown"
    t = text.upper()
    if re.search(r"MINI\s*LED", t):
        return "Mini LED"
    if re.search(r"QNED", t):
        return "QNED"
    if re.search(r"QLED", t):
        return "QLED"
    if re.search(r"OLED", t):
        return "OLED"
    if re.search(r"NANOCELL", t):
        return "NanoCell"
    if re.search(r"\bLED\b", t):
        return "LED"
    return "Unknown"

# ---------------- DRIVER (Only for initial listing) -------------------
def get_driver():
    options = Options()
    options.add_argument("--start-maximized")
    options.add_argument("--disable-blink-features=AutomationControlled")
    options.add_experimental_option("excludeSwitches", ["enable-automation"])
    options.add_argument(
        "user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    )
    return webdriver.Chrome(
        service=Service(ChromeDriverManager().install()),
        options=options
    )

# ---------------- GET EXISTING PRODUCTS FROM DB -----------------
def get_existing_products():
    conn = pymysql.connect(**DB_CONFIG)
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT DISTINCT product_id, model_number 
        FROM croma_tvsss 
        WHERE model_number IS NOT NULL 
          AND model_number != 'N/A'
          AND model_number != ''
    """)
    
    existing = {str(row[0]): row[1] for row in cursor.fetchall()}
    conn.close()
    
    print(f"Loaded {len(existing)} unique existing products from database")
    return existing

# ---------------- COLLECTION (Selenium - Required for dynamic page) -----------------
def collect_listings():
    driver = get_driver()
    driver.get("https://www.croma.com/televisions-accessories/c/997?q=%3Arelevance%3ASG-TelevisionCategory-TelevisionFormat%3AUltra+HD+4K%3ASG-TelevisionCategory-TelevisionFormat%3AHD+Ready%3ASG-TelevisionCategory-TelevisionFormat%3AFull+HD%3ASG-TelevisionCategory-TelevisionFormat%3AHD%3ASG-TelevisionCategory-TelevisionFormat%3AUltra+HD+8K")
    wait = WebDriverWait(driver, 15)

    print(f" Starting Scrape at: {scraped_time}")
    print(" Collecting product listings (Selenium)...")
    
    for _ in range(30): 
        try:
            driver.execute_script("window.scrollBy(0, 1200);")
            time.sleep(1.5)
            btn = wait.until(EC.element_to_be_clickable((By.XPATH, "//button[contains(text(),'View More')]")))
            driver.execute_script("arguments[0].click();", btn)
        except:
            break

    soup = BeautifulSoup(driver.page_source, "html.parser")
    driver.quit()

    items = soup.find_all("li", class_="product-item")
    print("-" * 30)
    print(f" TOTAL PRODUCTS Found: {len(items)}")
    print("-" * 30)
    return items

# ---------------- FAST SCRAPE using Requests + BS4 -----------------
def scrape_model_number_fast(product_url):
    """
    🚀 FAST: Use requests + BeautifulSoup instead of Selenium
    ~0.2-0.3 seconds vs ~1.5-2 seconds with Selenium
    """
    try:
        response = SESSION.get(product_url, timeout=10)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.text, "html.parser")
        
        model_number = "N/A"
        
        # Method 1: Find by h4 label
        lbl = soup.find("h4", string=re.compile("Model Number", re.I))
        if lbl:
            val = lbl.find_parent("li").find_next_sibling("li")
            model_number = val.text.strip() if val else "N/A"
        
        # Method 2: Alternative selector if Method 1 fails
        if model_number == "N/A":
            spec_item = soup.find("li", {"data-testid": "model-number"})
            if spec_item:
                model_number = spec_item.text.strip()
        
        # Method 3: Search in script tags (sometimes data is in JSON)
        if model_number == "N/A":
            scripts = soup.find_all("script", type="application/ld+json")
            for script in scripts:
                if "model" in script.text.lower():
                    match = re.search(r'"model"\s*:\s*"([^"]+)"', script.text)
                    if match:
                        model_number = match.group(1)
                        break
        
        stock_status = "Out of Stock" if "Out of Stock" in response.text else "In Stock"
        
        return model_number, stock_status, True  # True = success
        
    except Exception as e:
        return "N/A", "Unknown", False  # False = failed, might need Selenium

# ---------------- SELENIUM FALLBACK (Only if requests fails) -----------------
def scrape_model_number_selenium(driver, product_url):
    """
    🐢 SLOW: Fallback to Selenium if requests fails
    """
    try:
        driver.get(product_url)
        time.sleep(1.5)
        soup = BeautifulSoup(driver.page_source, "html.parser")
        
        model_number = "N/A"
        lbl = soup.find("h4", string=re.compile("Model Number", re.I))
        if lbl:
            val = lbl.find_parent("li").find_next_sibling("li")
            model_number = val.text.strip() if val else "N/A"
        
        stock_status = "Out of Stock" if "Out of Stock" in driver.page_source else "In Stock"
        
        return model_number, stock_status
    except Exception as e:
        print(f"⚠️ Selenium error: {e}")
        return "N/A", "Unknown"

# ---------------- PROCESSING -----------------
def stage_products(items, existing_products):
    conn = pymysql.connect(**DB_CONFIG)
    cursor = conn.cursor()
    
    driver = None  # Only create if needed
    stats = {"cached": 0, "fast": 0, "selenium": 0, "failed": 0}

    insert_sql = """
    INSERT INTO croma_tvsss 
    (product_id, platform, brand, model_number, full_name, display_type, 
     sale_price, original_cost, discount, rating, stock_status, 
     product_url, image_url, scraped_at, screen_resolution) 
    VALUES (%s, 'CROMA', %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """

    for idx, item in enumerate(items, start=1):
        try:
            link = item.find("a", href=True)
            if not link: 
                continue
            
            product_url = "https://www.croma.com" + link["href"]
            product_id = re.search(r"/p/(\d+)", product_url).group(1)

            full_name = item.find("h3").text.strip()
            brand = full_name.split()[0].upper()

            # Extract and clean values
            sale_el = item.select_one("span.amount, .sale-price, .cp-product-price")
            sale_price = clean_price(sale_el.text.strip() if sale_el else "0")

            mrp_el = item.select_one("span.old-price, .mrp, .cp-product-mrp")
            original_cost = clean_price(mrp_el.text.strip() if mrp_el else str(sale_price))

            disc_el = item.select_one("span.discount-newsearch-plp, .cp-productDiscount")
            discount = clean_discount(disc_el.text.strip() if disc_el else "0")

            rating_el = item.select_one(".cp-product-rating, .cp-rating")
            rating = clean_rating(rating_el.text.strip() if rating_el else "0")

            img = item.find("img")
            image_url = img.get("data-src") or img.get("src") if img else "N/A"

            screen_type = extract_screen_resolution(full_name)
            panel_type = extract_panel_type(full_name)

            # ⭐ OPTIMIZATION LOGIC
            if product_id in existing_products:
                # ✅ FASTEST: Use cached model_number from DB
                model_number = existing_products[product_id]
                stock_status = "In Stock"
                stats["cached"] += 1
                print(f" [{idx}] Product_id: {product_id} | ₹{sale_price:,}")
                
            else:
                # 🆕 NEW PRODUCT - Try fast method first
                model_number, stock_status, success = scrape_model_number_fast(product_url)
                
                if success and model_number != "N/A":
                    # 🚀 FAST: requests + BS4 worked
                    stats["fast"] += 1
                    print(f"🚀 [{idx}] FAST: {product_id} | Model: {model_number}")
                else:
                    # 🐢 SLOW: Fall back to Selenium
                    if driver is None:
                        print("🔧 Starting Selenium (fallback)...")
                        driver = get_driver()
                    
                    model_number, stock_status = scrape_model_number_selenium(driver, product_url)
                    stats["selenium"] += 1
                    print(f"🐢 [{idx}] SELENIUM: {product_id} | Model: {model_number}")
                
                # Add to cache for future use
                existing_products[product_id] = model_number

            # Execute INSERT
            cursor.execute(insert_sql, (
                product_id, brand, model_number, full_name, screen_type,
                sale_price, original_cost, discount, rating, stock_status,
                product_url, image_url, scraped_time, panel_type
            ))
            conn.commit()

        except Exception as e:
            stats["failed"] += 1
            print(f"❌ [{idx}] Error: {e}")
            continue

    if driver:
        driver.quit()
    conn.close()
    
    return stats

# ---------------- MAIN -----------------
def main():
    start_time = time.time()
    

    
    # Step 1: Load existing products
    existing_products = get_existing_products()
    
    # Step 2: Collect listings (Selenium required for dynamic page)
    items = collect_listings()
    
    # Step 3: Process all products
    total_stats = {"cached": 0, "fast": 0, "selenium": 0, "failed": 0}
    batch_size = 50  # Larger batches since it's faster now
    
    for i in range(0, len(items), batch_size):
        batch_num = (i // batch_size) + 1
        print(f"\n Processing Batch {batch_num}...")
        stats = stage_products(items[i:i + batch_size], existing_products)
        
        for key in total_stats:
            total_stats[key] += stats[key]
    
    # Calculate time
    elapsed = time.time() - start_time
    
    # Summary
    print("\n" + "-" * 60)

    print(f" Through DB:     {total_stats['cached']} products")
    print(f" requests+BS4:  {total_stats['fast']} products")
    print(f" Selenium :  {total_stats['selenium']} products")
    print(f" Failed:               {total_stats['failed']} products")
    print("-" * 60)
    print(f" Total time: {elapsed:.1f} seconds")
    print(f" Average: {elapsed/len(items):.2f} sec/product")
  
 

if __name__ == "__main__":
    main()