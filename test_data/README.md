# Test Card Images

This directory contains sample card images for testing the CardCataloger application.

## File Naming Convention

Card images should follow this naming pattern:
- Front image: `<lot>-<iteration>-front.jpg`
- Back image: `<lot>-<iteration>-back.jpg`

Examples:
- `box1a-00001-front.jpg` and `box1a-00001-back.jpg`
- `box1a-00002-front.jpg` and `box1a-00002-back.jpg`
- `box2b-00001-front.jpg` (front only, no back image)

## Sample Files

The following sample files are included:
- `sample-001-front.jpg` - Sample front card image
- `sample-001-back.jpg` - Sample back card image
- `sample-002-front.jpg` - Sample front-only card image
- `sample-003-front.jpg` - Another sample front card image
- `sample-003-back.jpg` - Another sample back card image

## Usage

1. Use the path `/app/test_data` when scanning directories in the CardCataloger application
2. The application will detect and pair front/back images automatically
3. Single front images without matching back images will be detected as "front-only" cards

## Adding Your Own Test Images

You can add your own card images to this directory following the naming convention above. The application supports the following image formats:
- .jpg / .jpeg
- .png
- .gif
- .bmp
- .webp