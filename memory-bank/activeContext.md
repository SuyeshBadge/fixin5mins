# Active Context

## Current Focus

We have been enhancing the project's content creation capabilities by integrating OpenRouter as the AI service provider. OpenRouter gives us access to free, open-source models like Mistral, Llama, and Gemma, replacing the previous proprietary AI service. The integration includes a robust fallback mechanism that automatically tries alternative models if the primary one fails, ensuring reliable content generation even when certain models have issues. We've also enhanced the prompt engineering specifically for these smaller open-source models, with clear formatting instructions and improved context to generate higher-quality outputs. Additionally, we've expanded the mock content system with topic-specific templates for common topics to provide quality content even when AI services are completely unavailable.

We have been enhancing the project's content creation capabilities by adding a new motivation-accent template that features a clean, modern design with accent-highlighted words in colored boxes. The template is designed for motivational quotes and action-oriented content, using a warm cream/beige background with bold typography and strategic highlighting of key words. The design includes distinctive visual elements such as an orange accent dot, arrow, and black dots to create a contemporary, professional aesthetic.

We've also been enhancing the project's capabilities by adding proper Cloudinary integration and fixing Instagram posting issues. We've updated the configuration file to include Cloudinary keys and integrated Cloudinary image hosting into the content generation workflow. Additionally, we've fixed an issue with Instagram posting by implementing a dedicated single image posting function that works correctly with the Instagram API instead of trying to use the carousel function for single images. We've also updated the heading in the template from "Quick Fix" to "Fix your life in 5 minutes" to better reflect the brand messaging.

We also enhanced the content generation script with a mock mode to make it work without requiring an external AI service. This improvement addresses the error we encountered when trying to run the script with the AI service unavailable. The script now:

1. Has a new `--mock` flag to force using mock content instead of the AI service
2. Automatically falls back to mock content if the AI service fails
3. Provides topic-specific predefined content templates for common topics
4. Generates generic content for any custom topic

We created a comprehensive automation script (generateAndPostContent.ts) that brings together all the components of our system to provide an end-to-end solution for content generation and Instagram posting. This script:

1. Uses the ContentGenerationService to generate emotional content in our standardized format
2. Creates images using the template system with various templates including the new self-love-gradient
3. Posts the content to Instagram with appropriate captions and hashtags
4. Provides command-line options for flexibility and control

The EmotionalContentFormat consists of:
- emotionalHook: Connects with the audience's pain point or emotional state
- actionStep: Provides a concrete action that can be completed in 5 minutes
- emotionalReward: Describes the emotional benefit of taking the action

We have been implementing an automatic daily post scheduler that handles Instagram content posting with randomly generated times and template rotation. The scheduler posts content twice daily - once in the morning and once in the evening - using random times that change each day to maintain unpredictability and engagement. The scheduler also ensures that consecutive posts use different templates to maintain visual variety.

We have now enhanced the scheduling system to use optimal posting times for each day of the week based on Instagram engagement research. The scheduler now randomly selects from researched optimal time slots for each day (e.g., Monday: 3pm, 5pm, 7pm) with small variations (±15 minutes) to maintain unpredictability while maximizing potential engagement. The system selects different templates for consecutive posts and maintains state between runs.

## Recent Changes

- Integrated OpenRouter for AI text generation:
  - Updated configuration to support OpenRouter settings
  - Created constants file for free model options
  - Implemented AiServiceClient using OpenRouter's API
  - Added fallback mechanism to try multiple models
  - Enhanced system prompts for better results with free models
  - Created comprehensive test scripts for OpenRouter integration
  - Expanded mock content system with high-quality topic templates
  - Updated package.json with new test scripts

- Enhanced post scheduler with optimal posting times:
  - Implemented day-specific optimal time configuration based on Instagram research
  - Created a system to select from researched optimal posting slots for each day
  - Added small random variations (±15 minutes) to maintain unpredictability
  - Updated state management to track scheduled optimal time slots
  - Enhanced logging to show the optimal time selection process

- Created a new motivation-accent template:
  - Implemented a clean design with cream/beige background and bold typography
  - Used Outfit font for a modern, clean appearance
  - Added highlight boxes for first words (gray for emotionalHook, orange for actionStep)
  - Included accent elements (orange dot, arrow, black dots) for visual interest
  - Added dynamic font sizing for different content lengths
  - Positioned handle at the top and date at the bottom
  - Implemented EJS logic to automatically extract and highlight first words of phrases
  - Registered the template in templateConfig.ts

- Created a new self-love-gradient template:
  - Implemented a modern design with a gradient background and elegant typography
  - Used "The Young Serif" and "Burgues Script" inspired fonts
  - Added proper dynamic font sizing for different content lengths
  - Created a centered pill design for the handle name
  - Added "fix your life in 5 minutes" text in the top left corner
  - Included the date in the top right corner
  - Registered the template in templateConfig.ts
  - Fixed center alignment issues with the handle pill

- Added Cloudinary configuration and integration:
  - Updated config.ts to include CloudinaryConfig interface
  - Added cloudinary configuration with cloudName, apiKey, and apiSecret
  - Integrated uploadImageToCloudinary in the content generation workflow
  - Used Cloudinary URLs for Instagram posting
  
- Fixed Instagram posting issues:
  - Added a new postSingleImageToInstagram function to properly handle single image posts
  - Updated generateAndPostContent.ts to use the single image posting function
  - Added proper error handling for Instagram API interactions
  - Improved cleanup of Cloudinary images after successful posting

- Updated template heading:
  - Changed heading from "Quick Fix" to "Fix your life in 5 minutes"
  - Enhanced brand positioning for better messaging

- Added mock mode to the generateAndPostContent.ts script:
  - Created the getMockContent function with predefined templates
  - Added error handling to fall back to mock content on AI service failure
  - Implemented the --mock command-line flag
  - Added topic-specific content templates for various topics
  
- Created a comprehensive end-to-end automation script (generateAndPostContent.ts) that:
  - Generates emotional content using the ContentGenerationService
  - Creates images with the template system
  - Posts to Instagram as a carousel
  - Supports command-line arguments for flexibility
  
- Added a new npm script "generate-and-post" to package.json
- Added EmotionalContentFormat interface to contentGenerationService.ts
- Implemented generateEmotionalContent method that uses a specialized system prompt
- Added `src/services/contentGenerationService.ts`:
  - Implemented ContentGenerationService class
  - Created interfaces for options and responses
  - Added JSON parsing and validation functionality
  - Added structured content generation with schema support
  
- Updated the quote-red template to include new emotional structure format for generating Instagram posts
- Improved the Instagram carousel posting workflow
- Updated typography with premium fonts for a more sophisticated aesthetic
- Added example implementation for @fixin5mins posts
- Created comprehensive documentation for the @fixin5mins template

## Active Decisions

1. **OpenRouter Integration**: Using OpenRouter to access free, open-source models like Mistral and Llama
2. **Model Selection**: Using mistralai/mistral-7b-instruct as the primary model due to its good balance of quality and speed
3. **Fallback Strategy**: Implementing automatic fallbacks to other free models when the primary model fails
4. **Enhanced Prompting**: Creating specialized prompts for free models with clear instructions and formatting
5. **Mock Content System**: Expanding topic-specific templates for high-quality offline operation
6. **Scheduling Strategy**: Using optimal posting times specific to each day of the week based on Instagram research
7. **Time Variation**: Adding small random variations (±15 minutes) to optimal times for unpredictability
8. **Template Rotation**: Ensuring consecutive posts use different templates for visual variety
9. **State Persistence**: Using a local JSON file to track last used template and posting times
10. **Schedule Regeneration**: Creating new schedules at midnight each day based on the current day's optimal times
11. **Production Deployment**: Recommending PM2 for running the scheduler in production environments
12. **Template Design**: Created motivation-accent template with a clean cream background, bold typography, and highlighted words
13. **Word Highlighting**: Implementing automatic extraction and highlighting of first words from emotionalHook and actionStep
14. **Visual Elements**: Using accent dot, arrow, and black dots for visual interest and modern aesthetic
15. **Previous Template Design**: Created self-love-gradient template with a soothing gradient background and premium typography
16. **Font Selection**: Using Outfit for motivation-accent template; using Playfair Display, Great Vibes, and Cormorant Garamond for self-love-gradient template
17. **Layout Design**: Positioned handle name at the top, emotionalReward below main text, and date at the bottom
18. **Responsive Design**: Implemented dynamic font sizing to accommodate various content lengths
19. **Cloud Image Hosting**: Integrated Cloudinary for reliable image hosting before posting to Instagram
20. **Instagram API Approach**: Implemented separate functions for carousel and single image posting to handle Instagram's API requirements correctly
21. **Brand Messaging**: Updated template heading to better reflect brand voice ("Fix your life in 5 minutes")
22. **Offline Capability**: Added mock mode to ensure the script can function without external AI services
23. **Graceful Degradation**: Implemented automatic fallback to predefined templates when AI service fails
24. **Topic-Specific Templates**: Created custom templates for common topics to ensure quality content
25. **End-to-End Automation**: Created a single script to handle the entire process from content generation to Instagram posting
26. **Command-Line Interface**: Implemented a flexible CLI with options to control topic, template, and posting behavior
27. **Emotional Content Structure**: Standardized the emotional content format with three components - hook, action step, and reward
28. **System Prompt Design**: Created a detailed system prompt for emotional content generation that emphasizes concise, actionable advice
29. **Content Structure**: Using hooks, action steps, and rewards for the emotional structure format
30. **Image Generation**: Using Puppeteer for headless browser rendering
31. **Social Media Integration**: Enhanced Instagram carousel posting for multi-image content
32. **Emotional Themes**: Implemented support for various emotional themes in templates
33. **Inline Styles**: Used inline styles in the EJS template to avoid CSS parsing issues
34. **Content Generation Service**: Used TypeScript interfaces for better type safety
35. **JSON Extraction**: Implemented JSON extraction for cases where the AI might add extra text
36. **Error Handling**: Added error handling for all potential failure points
37. **Structured Content Generation**: Created a specialized method for generating structured content
38. **Compatibility**: Maintained compatibility with the existing AiServiceClient

## Next Steps

1. **Test OpenRouter Integration**:
   - Test each free model with various prompts
   - Verify that the fallback mechanism works correctly
   - Test the enhanced prompt engineering for better outputs
   - Measure response times and quality for different models

2. **Evaluate Model Quality**:
   - Compare outputs from different free models
   - Document the strengths and weaknesses of each model
   - Identify the best models for different content types
   - Fine-tune system prompts based on evaluation results

3. **Test Instagram Content Generation**:
   - Test content generation with various topics
   - Verify that generated content works well with templates
   - Test the entire workflow from generation to posting
   - Compare quality of AI-generated vs. mock content

4. **Test Enhanced Daily Scheduler**:
   - Test the scheduler with different days of the week
   - Verify that day-specific optimal times are used correctly
   - Test the random time variation functionality
   - Verify that template rotation works correctly
   - Test state persistence between restarts
   - Ensure proper error handling for failed posts

5. **Deploy Scheduler to Production**:
   - Set up PM2 for process management
   - Configure automatic startup after system reboots
   - Implement monitoring and alerting

6. **Test Motivation-Accent Template**:
   - Test the template with different content types and lengths
   - Verify that the word highlighting works correctly
   - Test with various emotionalHook and actionStep combinations
   - Ensure responsive sizing works well for different content lengths

7. **Test Self-Love Gradient Template**:
   - Test the template with different content types and lengths
   - Verify that the pill alignment is correct in all cases
   - Test across different topics and themes

8. **Create Additional Templates**:
   - Create more template variations with different styles
   - Explore other color schemes and typography options
   - Create templates for different emotional tones

9. **Test Instagram Posting**:
   - Test the fixed single image posting functionality
   - Verify that the Cloudinary integration works properly
   - Document the Instagram posting workflow

10. **Test Cloudinary Integration**:
    - Verify that images are properly uploaded to Cloudinary
    - Test the cleanup process after successful posting
    - Ensure error handling works correctly when Cloudinary operations fail

11. **Test Updated Template**:
    - Verify that the updated heading appears correctly in generated images
    - Test with different content topics to ensure it works with various content types

12. **Test Mock Mode**:
    - Test the mock mode functionality with various topics
    - Validate the quality of the predefined templates
    - Add more topic-specific templates for common use cases

13. **Test Automation Script**:
    - Test the new script with various topics and templates
    - Verify the end-to-end process works correctly
    - Document usage examples and patterns

14. **Content Generation Testing**:
    - Create example scripts using the new generateEmotionalContent method
    - Test with various topics and emotional themes
    - Validate output quality and consistency

15. **Template Improvements**:
    - Create additional template variations
    - Add more visual design options
    - Implement advanced typography features

## Implementation Considerations
- Evaluate if mistralai/mistral-7b-instruct continues to be the best primary model
- Monitor OpenRouter API for new free models that might offer better performance
- Consider implementing a model quality evaluation framework
- Explore different system prompt strategies to improve output quality
- Monitor rate limits with free models and adjust usage patterns if needed
- Consider adding telemetry to track which models perform best for different topics
- Implement a cache layer to prevent redundant API calls for similar prompts
- Test different temperature settings for optimal creativity vs. consistency
- Compare engagement metrics between posts at optimal times vs. non-optimal times
- Analyze optimal times for specific content types or audience demographics
- Consider creating a more sophisticated engagement-based scheduling algorithm
- Explore more template rotation strategies (e.g., weighted, least recently used)
- Consider creating a web interface for viewing/editing scheduled posts
- Explore different highlight styles and colors for the motivation-accent template
- Consider creating more accent-style templates with different color schemes
- Create variations of the motivation-accent template for different content types
- Explore more gradient combinations for different emotional themes
- Consider creating template variations based on content categories
- Monitor Instagram API changes that might affect posting functionality
- Consider implementing a retry mechanism for failed Instagram posts
- Optimize Cloudinary usage to minimize costs (cleanup unused images)
- Ensure proper error handling for all Cloudinary and Instagram operations
- Implement better logging for debugging Instagram API issues
- Consider adding metrics to track successful posts vs. failures
- Ensure the emotional content format is effective across different topics
- Consider adding topic-specific variations of the emotional content structure
- Maintain a consistent visual language across different template types
- Provide clear documentation for all template options
- Optimize image size and quality for social media platforms
- Ensure content is accessible and readable on mobile devices

## Open Questions
- What additional open-source models should we consider integrating?
- Should we implement a more sophisticated model selection strategy based on content type?
- How can we measure and track the quality of outputs from different models?
- What fallback strategies should we implement if OpenRouter itself is unavailable?
- Should we implement a client-side caching layer to reduce API calls?
- What additional prompt engineering techniques can improve outputs from free models?
- Are the current optimal posting times effective for our specific audience?
- Should we implement A/B testing to compare engagement between different posting times?
- Would it be beneficial to have more granular audience-specific optimal times?
- Should we adjust optimal posting times seasonally or based on holidays?

## Current Priorities
1. Test OpenRouter integration with different models and prompts
2. Evaluate the quality of content generated by different free models
3. Test the fallback mechanisms for reliability
4. Fine-tune system prompts based on testing results
5. Document the OpenRouter integration and free model capabilities
6. Test the daily scheduler with various optimal time configurations
7. Analyze engagement metrics for posts at optimal times
8. Deploy the scheduler to production using PM2
9. Monitor initial posts for engagement patterns
- What are the optimal time windows for maximum engagement based on audience analytics?
- Should we implement more sophisticated scheduling algorithms based on engagement data?
- Should we add support for skipping scheduled posts on certain days (e.g., holidays)?
- Would it be beneficial to add different time windows for weekdays vs. weekends?
- What additional accent colors should we explore for the motivation-accent template?
- Should we create variations of the motivation-accent template with different highlight shapes?
- What additional template styles would best support the brand?
- Should we create multiple gradient variations for different emotional tones?
- What other font combinations should we explore for template variations?
- Should we support multiple Cloudinary accounts or configurations?
- Should we implement a scheduling system for posting content at optimal times?
- What is the best approach for handling Instagram API rate limits?
- What additional topics should have predefined templates?
- How can we make the mock templates more customizable?
- What additional emotional themes should be prioritized for template variations?
- Should we create separate templates for each post format, or keep a single flexible template?
- How can we better integrate the template with content generation and scheduling?
- What visual styles would be most effective for different emotional themes?
- How can we measure the engagement impact of different post formats?

## Current Priorities
1. Test the daily scheduler with various optimal time configurations
2. Deploy the scheduler to production using PM2
3. Monitor initial posts for engagement patterns
4. Test the motivation-accent template with various content types
5. Test the self-love-gradient template with various content types
6. Create additional template variations with different styles
7. Test the single image Instagram posting functionality
8. Test the Cloudinary integration in the content generation workflow
9. Test the updated template heading in different contexts
10. Test the mock mode with various topics
11. Test the new generateAndPostContent.ts script with various topics
12. Create examples using the new generateEmotionalContent method
13. Create variations of templates for different emotional themes
14. Test template-based image generation with sample content
15. Optimize template visual design
16. Document template usage process 