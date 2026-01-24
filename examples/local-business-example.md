# Example: Geotagging Photos for a Local Business

This example demonstrates how to use the GBP Photo Geotag MCP to optimize photos for a plumbing business in Seattle.

## Scenario

Acme Plumbing wants to geotag their service photos before uploading to:
- Google Business Profile
- Their website
- Social media

## Step 1: Geotag a Single Photo

```
Use the add_geotag tool with:
- file_path: "/Users/photos/water-heater-install.jpg"
- address: "123 Main Street, Seattle, WA 98101"
- business_name: "Acme Plumbing"
- keywords: ["plumber", "water heater", "seattle", "installation"]
```

### Result

The photo will have embedded:
- GPS coordinates: 47.6062, -122.3321
- IPTC City: Seattle
- IPTC State: Washington
- IPTC Country: United States
- Artist: Acme Plumbing
- Copyright: © 2025 Acme Plumbing

## Step 2: Rename for SEO

```
Use the rename_for_seo tool with:
- file_path: "/Users/photos/water-heater-install.jpg"
- business_name: "Acme Plumbing"
- service: "water heater installation"
- city: "Seattle"
- state: "WA"
```

### Result

File renamed to: `acme-plumbing-water-heater-installation-seattle-wa.jpg`

## Step 3: Batch Process a Folder

```
Use the batch_geotag tool with:
- directory: "/Users/photos/december-jobs"
- address: "456 Oak Avenue, Bellevue, WA 98004"
- business_name: "Acme Plumbing"
- keywords: ["plumber", "bellevue", "residential"]
- recursive: true
```

### Result

All JPEG and PNG files in the folder (and subfolders) are geotagged with the Bellevue location.

## Tips for Best Results

1. **Use exact business address** for storefront and team photos
2. **Use job site address** for service/project photos
3. **Include relevant keywords** for your industry and location
4. **Rename files before uploading** as Google uses filenames for ranking

## Verifying Metadata

After geotagging, you can verify the metadata:

```bash
# Using ExifTool directly
exiftool -a -G photo.jpg

# Or use the read_geotag tool
```
