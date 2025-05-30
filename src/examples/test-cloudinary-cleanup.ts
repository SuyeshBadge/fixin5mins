#!/usr/bin/env node

/**
 * Test script to verify Cloudinary image cleanup in the content generation job
 * This simulates what happens during scheduled posts
 */

import dotenv from 'dotenv';
import { spawn } from 'child_process';
import path from 'path';
import logger from '../utils/logger';

// Load environment variables
dotenv.config();

/**
 * Run the content generation script and monitor Cloudinary cleanup
 */
async function testCloudinaryCleanup(): Promise<void> {
    logger.info('Testing Cloudinary cleanup in scheduled post simulation...');
    
    try {
        // Path to the content generation script (same as scheduler uses)
        const CONTENT_GENERATION_SCRIPT = path.join(process.cwd(), 'src', 'jobs', 'generateAndPostContent.ts');
        
        // Run the script with test parameters
        const childProcess = spawn('ts-node', [
            CONTENT_GENERATION_SCRIPT,
            '--template', 'elegant-dark',
            '--topic', 'productivity test for cleanup verification',
            '--skip-posting' // Don't actually post to Instagram for testing
        ], {
            stdio: 'pipe', // Capture output
            shell: true
        });
        
        // Capture and log the output
        childProcess.stdout?.on('data', (data) => {
            const output = data.toString();
            console.log(output);
            
            // Monitor for Cloudinary-related logs
            if (output.includes('Cloudinary')) {
                logger.info(`CLOUDINARY LOG: ${output.trim()}`);
            }
            
            // Monitor cleanup summary
            if (output.includes('Cleanup Summary')) {
                logger.info(`CLEANUP DETECTED: ${output.trim()}`);
            }
            
            // Monitor for warnings about orphaned images
            if (output.includes('ORPHANED') || output.includes('WARNING')) {
                logger.warn(`CLEANUP WARNING: ${output.trim()}`);
            }
        });
        
        childProcess.stderr?.on('data', (data) => {
            const errorOutput = data.toString();
            console.error(errorOutput);
            
            if (errorOutput.includes('Cloudinary')) {
                logger.error(`CLOUDINARY ERROR: ${errorOutput.trim()}`);
            }
        });
        
        // Wait for the process to complete
        const exitCode = await new Promise<number>((resolve) => {
            childProcess.on('close', (code) => {
                resolve(code || 0);
            });
        });
        
        if (exitCode === 0) {
            logger.info('✅ Content generation test completed successfully');
            logger.info('Check the logs above for Cloudinary cleanup verification');
        } else {
            logger.error(`❌ Content generation test failed with exit code: ${exitCode}`);
        }
        
    } catch (error) {
        logger.error('Error running Cloudinary cleanup test:', error);
    }
}

/**
 * Main function
 */
async function main(): Promise<void> {
    console.log('\n🧪 Cloudinary Cleanup Test for Scheduled Posts\n');
    console.log('This test simulates how the scheduler runs content generation');
    console.log('and verifies that Cloudinary images are properly cleaned up.\n');
    
    await testCloudinaryCleanup();
    
    console.log('\n📝 What to look for in the logs:');
    console.log('✅ "Successfully uploaded to Cloudinary" - Image upload worked');
    console.log('✅ "Tracking public ID for cleanup" - Public ID is tracked');
    console.log('✅ "Successfully deleted Cloudinary image" - Cleanup worked');
    console.log('✅ "Cleanup Summary" with "Cloudinary deleted: true" - Final verification');
    console.log('❌ "CRITICAL: Cloudinary image was not deleted" - Cleanup failed');
    console.log('❌ "WARNING: Cloudinary image may still exist" - Orphaned image detected');
}

// Run the test if this script is executed directly
if (require.main === module) {
    main().catch(error => {
        logger.error('Unhandled error in test:', error);
        process.exit(1);
    });
} 