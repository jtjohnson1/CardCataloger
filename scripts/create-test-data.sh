#!/bin/bash

# Create test data directory if it doesn't exist
mkdir -p test_data

# Create sample placeholder images using ImageMagick (if available) or simple text files
if command -v convert &> /dev/null; then
    echo "Creating sample card images with ImageMagick..."
    
    # Create sample card front images
    convert -size 200x280 xc:lightblue -gravity center -pointsize 16 -annotate +0+0 "Sample Card 001\nFRONT" test_data/sample-001-front.jpg
    convert -size 200x280 xc:lightgreen -gravity center -pointsize 16 -annotate +0+0 "Sample Card 001\nBACK" test_data/sample-001-back.jpg
    
    convert -size 200x280 xc:lightcoral -gravity center -pointsize 16 -annotate +0+0 "Sample Card 002\nFRONT ONLY" test_data/sample-002-front.jpg
    
    convert -size 200x280 xc:lightyellow -gravity center -pointsize 16 -annotate +0+0 "Sample Card 003\nFRONT" test_data/sample-003-front.jpg
    convert -size 200x280 xc:lightpink -gravity center -pointsize 16 -annotate +0+0 "Sample Card 003\nBACK" test_data/sample-003-back.jpg
    
    # Create some with different lot numbers
    convert -size 200x280 xc:lightsteelblue -gravity center -pointsize 16 -annotate +0+0 "Box 1A Card 001\nFRONT" test_data/box1a-00001-front.jpg
    convert -size 200x280 xc:lightcyan -gravity center -pointsize 16 -annotate +0+0 "Box 1A Card 001\nBACK" test_data/box1a-00001-back.jpg
    
    convert -size 200x280 xc:lavender -gravity center -pointsize 16 -annotate +0+0 "Box 1A Card 002\nFRONT" test_data/box1a-00002-front.jpg
    convert -size 200x280 xc:thistle -gravity center -pointsize 16 -annotate +0+0 "Box 1A Card 002\nBACK" test_data/box1a-00002-back.jpg
    
    echo "Sample card images created successfully!"
else
    echo "ImageMagick not found. Creating placeholder text files..."
    
    # Create placeholder files that can be detected by the scanner
    echo "Sample Card 001 Front" > test_data/sample-001-front.jpg
    echo "Sample Card 001 Back" > test_data/sample-001-back.jpg
    echo "Sample Card 002 Front Only" > test_data/sample-002-front.jpg
    echo "Sample Card 003 Front" > test_data/sample-003-front.jpg
    echo "Sample Card 003 Back" > test_data/sample-003-back.jpg
    echo "Box 1A Card 001 Front" > test_data/box1a-00001-front.jpg
    echo "Box 1A Card 001 Back" > test_data/box1a-00001-back.jpg
    echo "Box 1A Card 002 Front" > test_data/box1a-00002-front.jpg
    echo "Box 1A Card 002 Back" > test_data/box1a-00002-back.jpg
    
    echo "Placeholder test files created!"
fi

echo ""
echo "Test data setup complete!"
echo "You can now use the path '/app/test_data' in the CardCataloger application."
echo ""
echo "Available test files:"
ls -la test_data/