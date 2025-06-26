#!/usr/bin/env node

const puppeteer = require('puppeteer');

async function testPuppeteer() {
    console.log('🔍 Testing Puppeteer in container environment...');
    console.log('Environment variables:');
    console.log('- PUPPETEER_EXECUTABLE_PATH:', process.env.PUPPETEER_EXECUTABLE_PATH);
    console.log('- CHROME_BIN:', process.env.CHROME_BIN);
    console.log('- NODE_ENV:', process.env.NODE_ENV);
    
    let browser;
    try {
        console.log('\n🚀 Launching browser...');
        
        browser = await puppeteer.launch({
            headless: true,
            protocolTimeout: 60000,
            timeout: 60000,
            executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/google-chrome',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--memory-pressure-off',
                '--disable-background-timer-throttling',
                '--disable-backgrounding-occluded-windows',
                '--disable-renderer-backgrounding',
                '--disable-extensions',
                '--disable-plugins',
                '--disable-gpu',
                '--disable-web-security',
                '--disable-features=TranslateUI',
                '--disable-features=BlinkGenPropertyTrees',
                '--disable-ipc-flooding-protection',
                '--disable-background-networking',
                '--disable-client-side-phishing-detection',
                '--disable-sync',
                '--disable-default-apps',
                '--no-first-run',
                '--no-zygote',
                '--hide-scrollbars',
                '--mute-audio',
                '--virtual-time-budget=5000',
                '--disable-features=VizDisplayCompositor'
            ]
        });
        
        console.log('✅ Browser launched successfully!');
        
        // Test basic functionality
        console.log('\n📄 Creating new page...');
        const page = await browser.newPage();
        
        console.log('🔧 Setting viewport...');
        await page.setViewport({ width: 1080, height: 1080 });
        
        console.log('📝 Setting content...');
        await page.setContent('<html><body><h1>Test Page</h1></body></html>');
        
        console.log('📸 Taking screenshot...');
        const screenshot = await page.screenshot({ type: 'png' });
        
        console.log(`✅ Screenshot taken! Size: ${screenshot.length} bytes`);
        
        await page.close();
        console.log('✅ Page closed successfully');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('Stack:', error.stack);
        process.exit(1);
    } finally {
        if (browser) {
            try {
                await browser.close();
                console.log('✅ Browser closed successfully');
            } catch (closeError) {
                console.error('⚠️  Error closing browser:', closeError.message);
            }
        }
    }
    
    console.log('\n🎉 Puppeteer test completed successfully!');
}

testPuppeteer().catch(console.error); 