import os
import time
import requests
import argparse
from pathlib import Path

# 配置信息
API_URL = "https://your-cloudflare-pages-domain.pages.dev"
AUTH_TOKEN = "your-secret-password"
DOWNLOAD_DIR = Path.home() / "Downloads" / "OptionSnap"

def fetch_and_delete(category: str):
    print(f"Fetching images for category: {category}...")
    headers = {"Authorization": f"Bearer {AUTH_TOKEN}"}
    
    # 1. 列出文件
    res = requests.get(f"{API_URL}/api/list?category={category}", headers=headers)
    if res.status_code != 200:
        print(f"Failed to list: {res.text}")
        return
        
    data = res.json()
    files = data.get("files", [])
    
    if not files:
        print("No new images.")
        return
        
    print(f"Found {len(files)} images. Downloading...")
    
    cat_dir = DOWNLOAD_DIR / category
    cat_dir.mkdir(parents=True, exist_ok=True)
    
    for f in files:
        key = f["key"]
        filename = key.split("/")[-1]
        filepath = cat_dir / filename
        
        # 2. 下载文件
        img_res = requests.get(f"{API_URL}/api/image?key={key}", headers=headers)
        if img_res.status_code == 200:
            with open(filepath, "wb") as out:
                out.write(img_res.content)
            print(f"Downloaded {filename}")
            
            # 3. 删除服务端文件
            del_res = requests.delete(f"{API_URL}/api/delete?key={key}", headers=headers)
            if del_res.status_code == 200:
                print(f"Deleted {filename} from server")
            else:
                print(f"Failed to delete {filename}: {del_res.text}")
        else:
            print(f"Failed to download {filename}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="OptionSnap PC Fetcher")
    parser.add_argument("--category", choices=["Options", "Trades", "all"], default="all")
    args = parser.parse_args()
    
    if args.category == "all":
        fetch_and_delete("Options")
        print("-" * 30)
        fetch_and_delete("Trades")
    else:
        fetch_and_delete(args.category)
