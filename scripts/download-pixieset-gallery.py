#!/usr/bin/env python3
"""
Pixieset Gallery Downloader for Norwedfilm

Usage:
1. Open kunder.norwedfilm.no in your browser
2. Open Developer Tools (F12) → Network tab
3. Navigate to a gallery
4. Find an XHR request to look for these values:
   - cid (collection ID) - a number
   - cuk (collection key) - a string
   - gs (gallery name/slug)
5. Get the PHPSESSID cookie from Application → Cookies

Then run:
python3 scripts/download-pixieset-gallery.py \
    --base-url "https://kunder.norwedfilm.no/api/v1/collection_photos" \
    --collection-id 12345 \
    --collection-key "abc123" \
    --gallery-name "wedding-name" \
    --cookie "your-phpsessid-value"
"""

import argparse
import json
import os
import re
import sys
from pathlib import Path

try:
    import requests
except ImportError:
    print("Installing required package: requests")
    os.system("pip3 install requests")
    import requests


def download_gallery(base_url: str, collection_id: int, collection_key: str, 
                    gallery_name: str, cookie: str, output_dir: str = "./downloads"):
    """Download all images from a Pixieset gallery"""
    
    output_path = Path(output_dir) / gallery_name
    output_path.mkdir(parents=True, exist_ok=True)
    
    print(f"Downloading to: {output_path}")
    
    page = 1
    total_downloaded = 0
    image_urls = []
    
    while True:
        print(f"Fetching page {page}...")
        
        params = {
            'cid': collection_id,
            'cuk': collection_key,
            'gs': gallery_name,
            'page': page
        }
        headers = {
            'x-requested-with': 'XMLHttpRequest',
            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        cookies = {'PHPSESSID': cookie}
        
        try:
            response = requests.get(base_url, params=params, headers=headers, cookies=cookies)
            response.raise_for_status()
            data = response.json()
        except Exception as e:
            print(f"Error fetching page {page}: {e}")
            break
        
        photos = data.get('photos', [])
        if not photos:
            print("No more photos found")
            break
        
        for photo in photos:
            # Get the highest resolution URL
            photo_url = photo.get('fullsize_url') or photo.get('large_url') or photo.get('url')
            if photo_url:
                if photo_url.startswith('//'):
                    photo_url = 'https:' + photo_url
                image_urls.append({
                    'url': photo_url,
                    'name': photo.get('filename') or f"image_{len(image_urls) + 1}.jpg"
                })
        
        print(f"  Found {len(photos)} photos on page {page}")
        
        if data.get('isLastPage', False):
            break
        
        page += 1
    
    print(f"\nTotal images found: {len(image_urls)}")
    
    # Download images
    for i, img in enumerate(image_urls, 1):
        try:
            print(f"Downloading {i}/{len(image_urls)}: {img['name']}")
            response = requests.get(img['url'], stream=True)
            response.raise_for_status()
            
            filename = output_path / img['name']
            with open(filename, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)
            
            total_downloaded += 1
        except Exception as e:
            print(f"  Error downloading {img['name']}: {e}")
    
    print(f"\n✅ Downloaded {total_downloaded} images to {output_path}")
    
    # Output URLs for use in the app
    urls_file = output_path / "image_urls.json"
    with open(urls_file, 'w') as f:
        json.dump(image_urls, f, indent=2)
    print(f"📋 Image URLs saved to {urls_file}")
    
    return image_urls


def main():
    parser = argparse.ArgumentParser(description='Download Pixieset gallery images')
    parser.add_argument('--base-url', required=True, help='API base URL')
    parser.add_argument('--collection-id', type=int, required=True, help='Collection ID')
    parser.add_argument('--collection-key', required=True, help='Collection key')
    parser.add_argument('--gallery-name', required=True, help='Gallery name/slug')
    parser.add_argument('--cookie', required=True, help='PHPSESSID cookie value')
    parser.add_argument('--output', default='./downloads', help='Output directory')
    
    args = parser.parse_args()
    
    download_gallery(
        base_url=args.base_url,
        collection_id=args.collection_id,
        collection_key=args.collection_key,
        gallery_name=args.gallery_name,
        cookie=args.cookie,
        output_dir=args.output
    )


if __name__ == '__main__':
    main()
