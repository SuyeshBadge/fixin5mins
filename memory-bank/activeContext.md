# Active Context

## Current Focus
- Implementing content generation that focuses on authentic empathy rather than viral marketing tactics
- Improving content quality by replacing fabricated statistics with genuine understanding
- Moving from shock-value statements to relatable questions that connect with users
- Creating content that acknowledges the real complexity of people's challenges
- Testing and refining our empathetic content generation approach

We have been enhancing the project's content creation capabilities by adding a new purpose-story template that features a clean, minimalist design with bold typography for motivational and purpose-driven content. The template uses a light gradient background with dark text for strong visual impact, featuring a "MOTIVATION" label at the top, a bold main message in the center, and customizable branding elements at the bottom. The design is inspired by professional motivational posters with clean typography and modern aesthetics.

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

Most recently, we've enhanced the scheduler to always post at script startup regardless of whether posts have already been scheduled for the day, and we've removed the artificial limit of 2 posts per day, allowing all optimal posting times defined for each day to be used. We've also fixed an issue where the scheduler could randomly select the same base time multiple times, resulting in clustered posts with similar posting times. Now it ensures each unique optimal time slot is used exactly once, providing better distribution throughout the day.

## Recent Changes
- Enhanced the elegant-dark template:
  - Made the background gradient darker for a more premium look (changed from #2c3e50/#34495e to #0f1419/#191f24)
  - Increased font sizes for better prominence
  - Used heavier font weights (800 for headings, 600 for subheadings, 500 for body text)
  - Added subtle text shadows for depth and improved readability
  - Improved color contrast with brighter text colors for better visibility
  - Refined the gold accent color for a more sophisticated look
  - Updated responsive text sizing for different content lengths
  - Added additional font weights to the Google Fonts import

- Completely revamped the content generation service to focus on authentic empathy
- Updated the system prompt to emphasize genuine understanding of human struggles
- Replaced pattern-interrupt hooks with relatable questions
- Eliminated made-up statistics in favor of realistic advice
- Modified all mock content templates to align with the new approach
- Created test script to verify empathetic content generation
- Reduced the frequency of metrics in content (only used when relevant and factual)

- Created a new purpose-story template:
  - Implemented a clean, minimalist design with light gradient background
  - Used Oswald font for bold, impactful typography
  - Added "MOTIVATION" label with a dark background at the top
  - Created strong, centered main message with large bold text
  - Added professional branding elements at the bottom
  - Included Instagram handle display
  - Created full documentation and example implementation
  - Registered the template in templateConfig.ts

- Fixed the post scheduler time distribution issue:
  - Added generateSpecificOptimalPostingTime function to use a specific time slot
  - Updated the scheduler to assign each unique optimal time slot exactly once
  - Improved logging to show which base time slot is being used
  - Prevented clustered posts by ensuring better time distribution

- Enhanced the daily post scheduler:
  - Modified the scheduler to always schedule posts at startup
  - Removed the artificial limit of 2 posts per day
  - Updated the scheduler to use all optimal posting times defined for each day
  - Updated logging to clearly indicate posts are being scheduled at startup

- Integrated OpenRouter for AI text generation:
  - Updated configuration to support OpenRouter settings
  - Created constants file for free model options
  - Implemented AiServiceClient using OpenRouter's API
  - Added fallback mechanism to try multiple models
  - Enhanced system prompts for better results with free models
  - Created comprehensive test scripts for OpenRouter integration
  - Expanded mock content system with high-quality topic templates
  - Updated package.json with new test scripts

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

- Fixed critical Instagram posting issue:
  - Identified missing `domain=INSTAGRAM` parameter in API calls
  - Added the parameter to uploadMediaWithTracking function in instagram.service.ts
  - This parameter is required by Instagram Graph API for media creation
  - The fix ensures compatibility with Instagram's API requirements

## Active Decisions

1. **Template Design**: Created purpose-story template with a clean, minimalist design, bold typography, and professional branding elements
2. **Typography**: Using Oswald font for strong, impactful headings and Outfit for clean body text
3. **Layout Strategy**: Positioning the motivation label at top, main message in center, and branding at bottom for visual balance
4. **Color Scheme**: Using a light gradient background with dark text for maximum readability and impact
5. **Branding Elements**: Including customizable brand name and subtitle in a distinctive angled box
6. **Variable Structure**: Supporting custom top label, main message, brand name, brand subtitle, and Instagram handle
7. **Default Values**: Providing sensible defaults for all variables to ensure the template works well out-of-the-box
8. **OpenRouter Integration**: Using OpenRouter to access free, open-source models like Mistral and Llama
9. **Model Selection**: Using mistralai/mistral-7b-instruct as the primary model due to its good balance of quality and speed
10. **Fallback Strategy**: Implementing automatic fallbacks to other free models when the primary model fails
11. **Enhanced Prompting**: Creating specialized prompts for free models with clear instructions and formatting
12. **Mock Content System**: Expanding topic-specific templates for high-quality offline operation
13. **Scheduling Strategy**: Using optimal posting times specific to each day of the week based on Instagram research
14. **Time Variation**: Adding small random variations (±15 minutes) to optimal times for unpredictability
15. **Template Rotation**: Ensuring consecutive posts use different templates for visual variety
16. **State Persistence**: Using a local JSON file to track last used template and posting times
17. **Schedule Regeneration**: Creating new schedules at midnight each day based on the current day's optimal times
18. **Production Deployment**: Recommending PM2 for running the scheduler in production environments
19. **Immediate Scheduling**: Always scheduling posts at script startup, regardless of existing schedules
20. **Full Schedule Usage**: Using all optimal posting times defined for each day without limitation
21. **Unique Time Slot Assignment**: Ensuring each optimal time slot is used exactly once for better distribution
22. **Previous Template Design**: Created motivation-accent template with a clean cream background, bold typography, and highlighted words
23. **Word Highlighting**: Implementing automatic extraction and highlighting of first words from emotionalHook and actionStep
24. **Visual Elements**: Using accent dot, arrow, and black dots for visual interest and modern aesthetic
25. **Template Design**: Created self-love-gradient template with a soothing gradient background and premium typography
26. **Font Selection**: Using Outfit for motivation-accent template; using Playfair Display, Great Vibes, and Cormorant Garamond for self-love-gradient template
27. **Layout Design**: Positioned handle name at the top, emotionalReward below main text, and date at the bottom
28. **Responsive Design**: Implemented dynamic font sizing to accommodate various content lengths
29. **Cloud Image Hosting**: Integrated Cloudinary for reliable image hosting before posting to Instagram
30. **Instagram API Approach**: Implemented separate functions for carousel and single image posting to handle Instagram's API requirements correctly
31. **Brand Messaging**: Updated template heading to better reflect brand voice ("Fix your life in 5 minutes")
32. **Offline Capability**: Added mock mode to ensure the script can function without external AI services
33. **Graceful Degradation**: Implemented automatic fallback to predefined templates when AI service fails
34. **Topic-Specific Templates**: Created custom templates for common topics to ensure quality content
35. **End-to-End Automation**: Created a single script to handle the entire process from content generation to Instagram posting
36. **Command-Line Interface**: Implemented a flexible CLI with options to control topic, template, and posting behavior
37. **Emotional Content Structure**: Standardized the emotional content format with three components - hook, action step, and reward
38. **System Prompt Design**: Created a detailed system prompt for emotional content generation that emphasizes concise, actionable advice
39. **Content Structure**: Using hooks, action steps, and rewards for the emotional structure format
40. **Image Generation**: Using Puppeteer for headless browser rendering
41. **Social Media Integration**: Enhanced Instagram carousel posting for multi-image content
42. **Emotional Themes**: Implemented support for various emotional themes in templates
43. **Inline Styles**: Used inline styles in the EJS template to avoid CSS parsing issues
44. **Content Generation Service**: Used TypeScript interfaces for better type safety
45. **JSON Extraction**: Implemented JSON extraction for cases where the AI might add extra text
46. **Error Handling**: Added error handling for all potential failure points
47. **Structured Content Generation**: Created a specialized method for generating structured content
48. **Compatibility**: Maintained compatibility with the existing AiServiceClient
49. **Elegant Dark Template Enhancement**: Refined template with darker background gradient, more prominent typography, and improved contrast
50. **Professional Typography**: Using heavier font weights (800/600/500) and subtle text shadows for emphasis without sacrificing elegance
51. **Color Refinement**: Using sophisticated gold accent (#C9A55C) and brighter teal (#1E7C78) for visual interest with professional restraint
52. **Responsive Adjustments**: Adjusted long text variants to maintain readability with the new larger base font sizes

## Next Steps

1. **Test Enhanced Elegant-Dark Template**:
   - Test the template with different content lengths
   - Verify readability on various devices with the darker background
   - Test the enhanced typography with different types of content
   - Compare before/after visual impact and professional appearance
   - Ensure the darker background maintains sufficient contrast with text
   - Verify subtle text shadows enhance rather than distract

2. **Test Purpose-Story Template**:
   - Test the template with different content lengths
   - Test with various brand names and subtitles
   - Verify Instagram handle display in different scenarios
   - Test on different devices to ensure readability

3. **Create Template Variations**:
   - Create color variations of the purpose-story template
   - Explore alternative layouts and typography
   - Consider vertical and horizontal variations

4. **Test OpenRouter Integration**:
   - Test each free model with various prompts
   - Verify that the fallback mechanism works correctly
   - Test the enhanced prompt engineering for better outputs
   - Measure response times and quality for different models

5. **Evaluate Model Quality**:
   - Compare outputs from different free models
   - Document the strengths and weaknesses of each model
   - Identify the best models for different content types
   - Fine-tune system prompts based on evaluation results

6. **Test Instagram Content Generation**:
   - Test content generation with various topics
   - Verify that generated content works well with templates
   - Test the entire workflow from generation to posting
   - Compare quality of AI-generated vs. mock content

7. **Test Enhanced Daily Scheduler**:
   - Test the scheduler with different days of the week
   - Verify that day-specific optimal times are used correctly
   - Test the random time variation functionality
   - Verify that template rotation works correctly
   - Test state persistence between restarts
   - Ensure proper error handling for failed posts

8. **Deploy Scheduler to Production**:
   - Set up PM2 for process management
   - Configure automatic startup after system reboots
   - Implement monitoring and alerting

9. **Test Motivation-Accent Template**:
   - Test the template with different content types and lengths
   - Verify that the word highlighting works correctly
   - Test with various emotionalHook and actionStep combinations
   - Ensure responsive sizing works well for different content lengths

10. **Test Self-Love Gradient Template**:
    - Test the template with different content types and lengths
    - Verify that the pill alignment is correct in all cases
    - Test across different topics and themes

11. **Test Instagram Posting**:
    - Test the fixed single image posting functionality
    - Verify that the Cloudinary integration works properly
    - Document the Instagram posting workflow

12. **Test Cloudinary Integration**:
    - Verify that images are properly uploaded to Cloudinary
    - Test the cleanup process after successful posting
    - Ensure error handling works correctly when Cloudinary operations fail

13. **Test Updated Template**:
    - Verify that the updated heading appears correctly in generated images
    - Test with different content topics to ensure it works with various content types

14. **Test Mock Mode**:
    - Test the mock mode functionality with various topics
    - Validate the quality of the predefined templates
    - Add more topic-specific templates for common use cases

15. **Test Automation Script**:
    - Test the new script with various topics and templates
    - Verify the end-to-end process works correctly
    - Document usage examples and patterns

16. **Content Generation Testing**:
    - Create example scripts using the new generateEmotionalContent method
    - Test with various topics and emotional themes
    - Validate output quality and consistency

17. **Template Improvements**:
    - Create additional template variations
    - Add more visual design options
    - Implement advanced typography features

## Implementation Considerations
- Consider creating color variations of the purpose-story template for different moods and topics
- Explore alternative layouts for the purpose-story template (e.g., vertical stacking for longer messages)
- Test purpose-story template with different content types to ensure versatility
- Consider creating dynamic content adaptation for the purpose-story template
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
- What color variations would be most effective for the purpose-story template?
- Should we create additional layout variations of the purpose-story template?
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
1. Test the purpose-story template with various content types and lengths
2. Create additional template variations with different styles and layouts
3. Test OpenRouter integration with different models and prompts
4. Evaluate the quality of content generated by different free models
5. Test the fallback mechanisms for reliability
6. Fine-tune system prompts based on testing results
7. Document the OpenRouter integration and free model capabilities
8. Test the daily scheduler with various optimal time configurations
9. Analyze engagement metrics for posts at optimal times
10. Deploy the scheduler to production using PM2
11. Monitor initial posts for engagement patterns 