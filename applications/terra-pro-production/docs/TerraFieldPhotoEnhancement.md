# TerraField Photo Enhancement

## Overview

The TerraField Photo Enhancement feature provides AI-powered tools for improving property photos taken by appraisers in the field. It leverages both OpenAI and Anthropic to deliver professional-quality images with automatic feature detection.

## Features

### AI-Powered Photo Enhancement

- **Lighting Improvement**: Automatically adjusts brightness, contrast, and exposure for optimal visibility
- **Perspective Correction**: Fixes distortion in photos taken at angles
- **Detail Enhancement**: Sharpens and clarifies architectural details
- **Clutter Reduction**: Minimizes distracting elements
- **Feature Identification**: Automatically detects and labels property characteristics

### Multi-AI Integration

The system uses a specialized approach with multiple AI services:

- **OpenAI (DALL-E 3)**: Handles image enhancement tasks
- **Anthropic (Claude)**: Performs property feature detection and analysis

### Offline-First Architecture

- Photos can be captured and queued while offline
- Enhancement occurs when connectivity is restored
- Original photos are preserved alongside enhanced versions
- Synchronizes with AppraisalCore backend via secure APIs

## Technical Implementation

### Server-Side Components

#### Photo Enhancement Service

```typescript
// Key methods in PhotoEnhancementService
class PhotoEnhancementService {
  // Enhance property photo using AI
  public async enhancePropertyPhoto(
    base64Image: string,
    options: PhotoEnhancementOptions = {}
  ): Promise<EnhancedPhotoResult>;

  // Get enhancement recommendations based on image analysis
  public async getRecommendedEnhancements(base64Image: string): Promise<PhotoEnhancementOptions>;

  // Analyze property photo to detect features
  private async analyzePhotoWithAnthropic(
    base64Image: string,
    options: PhotoEnhancementOptions
  ): Promise<string[]>;

  // Enhance photo using OpenAI's DALL-E
  private async enhancePhotoWithOpenAI(
    base64Image: string,
    options: PhotoEnhancementOptions
  ): Promise<string>;
}
```

#### API Endpoints

```
POST /api/photo-enhancement/analyze
- Analyzes a photo and provides enhancement recommendations
- Request: multipart/form-data with 'photo' field
- Response: { success: true, recommendations: PhotoEnhancementOptions }

POST /api/photo-enhancement/enhance
- Enhances a property photo using AI
- Request: multipart/form-data with 'photo' field and option flags
- Response: { success: true, result: EnhancedPhotoResult }
```

### Mobile Components

#### PhotoEnhancementScreen

- UI for capturing/selecting property photos
- Controls for enhancement options
- Preview of original vs. enhanced photos
- Display of detected features
- Integration with PhotoSyncService for offline storage

#### PhotoSyncService

- Handles offline storage of photos and metadata
- Synchronizes with server when connectivity is available
- Tracks sync status of photos
- Integrates with CRDT library for conflict resolution

## Usage Example

1. Field appraiser captures a property photo
2. Photo is immediately analyzed for enhancement recommendations
3. Appraiser selects desired enhancements
4. AI processes the photo and returns enhanced version
5. Both original and enhanced photos are synchronized with AppraisalCore
6. Enhanced photos are used in the final appraisal report

## Benefits

1. **Improved Photo Quality**: Consistent, professional-quality photos even in challenging conditions
2. **Time Savings**: Automatic enhancement reduces manual editing time
3. **Feature Identification**: AI helps identify and document property characteristics
4. **Consistency**: Standardized photo enhancements across all reports
5. **Offline Capability**: Works in areas with limited connectivity

## Future Enhancements

1. **Advanced Feature Detection**: More detailed property characteristic identification
2. **Batch Processing**: Apply enhancement settings to multiple photos
3. **3D Reconstruction**: Generate 3D models from multiple enhanced photos
4. **Integration with Sketches**: Use enhanced photos to improve floor plan sketches
5. **AR Overlay**: Augmented reality feature identification on camera preview
