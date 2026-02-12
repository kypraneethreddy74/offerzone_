import subprocess
import sys

files = [
    "flipkart_tv_scraper.py",
    "amazon_tv_scraper.py",
    "croma_tv_scraper.py"  # Updated from c.py
]

for f in files:
    print(f"\n▶️ Running {f}")
    result = subprocess.run([sys.executable, f])

    if result.returncode != 0:
        print(f"❌ Failed at {f}. Stopping pipeline.")
        break
    else:
        print(f"✅ {f} completed")

print("\n🏁 Scraper Pipeline Finished")