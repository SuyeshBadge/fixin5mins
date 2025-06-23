// Production-ready health check script for FixIn5Mins Docker container
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const HEALTH_CHECK_TIMEOUT = 5000; // 5 seconds timeout

function log(message) {
    console.log(`[HEALTH] ${new Date().toISOString()}: ${message}`);
}

function error(message) {
    console.error(`[HEALTH ERROR] ${new Date().toISOString()}: ${message}`);
}

async function checkFileSystem() {
    try {
        // Check if the application directory exists
        if (!fs.existsSync('/app/dist')) {
            throw new Error('Application dist directory not found');
        }

        // Check if main application file exists
        if (!fs.existsSync('/app/dist/index.js')) {
            throw new Error('Main application file not found');
        }

        // Check if templates directory exists
        if (!fs.existsSync('/app/src/templates')) {
            throw new Error('Templates directory not found');
        }

        // Check template count
        const templates = fs.readdirSync('/app/src/templates').filter(item => 
            fs.statSync(path.join('/app/src/templates', item)).isDirectory()
        );
        
        if (templates.length === 0) {
            throw new Error('No templates found');
        }

        log(`Found ${templates.length} templates: ${templates.join(', ')}`);

        // Check if generated directory is writable
        const testFile = '/app/generated/.health-test';
        try {
            fs.writeFileSync(testFile, `health check ${Date.now()}`);
            fs.unlinkSync(testFile);
        } catch (error) {
            throw new Error(`Generated directory is not writable: ${error.message}`);
        }

        // Check if logs directory is writable
        const logTestFile = '/app/logs/.health-test';
        try {
            fs.writeFileSync(logTestFile, `health check ${Date.now()}`);
            fs.unlinkSync(logTestFile);
        } catch (error) {
            throw new Error(`Logs directory is not writable: ${error.message}`);
        }

        return true;
    } catch (err) {
        throw new Error(`Filesystem check failed: ${err.message}`);
    }
}

async function checkChromium() {
    return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
            reject(new Error('Chromium check timed out'));
        }, HEALTH_CHECK_TIMEOUT);

        exec('chromium-browser --version', (error, stdout, stderr) => {
            clearTimeout(timeout);
            
            if (error) {
                reject(new Error(`Chromium not available: ${error.message}`));
                return;
            }
            
            log(`Chromium version: ${stdout.trim()}`);
            resolve(true);
        });
    });
}

async function checkNodeModules() {
    try {
        // Check if critical packages are available
        const criticalPackages = ['puppeteer', 'ejs', 'cloudinary'];
        
        for (const pkg of criticalPackages) {
            try {
                require.resolve(pkg);
            } catch (error) {
                throw new Error(`Critical package '${pkg}' not found`);
            }
        }

        log(`All critical packages available: ${criticalPackages.join(', ')}`);
        return true;
    } catch (err) {
        throw new Error(`Node modules check failed: ${err.message}`);
    }
}

async function checkMemoryUsage() {
    try {
        const memUsage = process.memoryUsage();
        const memUsageMB = {
            rss: Math.round(memUsage.rss / 1024 / 1024),
            heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
            heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
            external: Math.round(memUsage.external / 1024 / 1024)
        };

        log(`Memory usage - RSS: ${memUsageMB.rss}MB, Heap: ${memUsageMB.heapUsed}/${memUsageMB.heapTotal}MB`);

        // Alert if memory usage is too high (over 800MB RSS)
        if (memUsageMB.rss > 800) {
            error(`High memory usage detected: ${memUsageMB.rss}MB RSS`);
        }

        return true;
    } catch (err) {
        throw new Error(`Memory check failed: ${err.message}`);
    }
}

async function runHealthCheck() {
    const startTime = Date.now();
    
    try {
        log('Starting health check...');

        // Run all health checks
        await checkFileSystem();
        await checkChromium();
        await checkNodeModules();
        await checkMemoryUsage();

        const duration = Date.now() - startTime;
        log(`Health check passed in ${duration}ms`);
        
        // Write successful health check to log
        const healthLog = `/app/logs/health.log`;
        const healthEntry = `${new Date().toISOString()}: HEALTHY (${duration}ms)\n`;
        fs.appendFileSync(healthLog, healthEntry);
        
        process.exit(0);

    } catch (err) {
        const duration = Date.now() - startTime;
        error(`Health check failed after ${duration}ms: ${err.message}`);
        
        // Write failed health check to log
        const healthLog = `/app/logs/health.log`;
        const healthEntry = `${new Date().toISOString()}: UNHEALTHY - ${err.message} (${duration}ms)\n`;
        
        try {
            fs.appendFileSync(healthLog, healthEntry);
        } catch (logError) {
            error(`Failed to write health log: ${logError.message}`);
        }
        
        process.exit(1);
    }
}

// Add timeout for the entire health check
const globalTimeout = setTimeout(() => {
    error('Health check timed out');
    process.exit(1);
}, 10000); // 10 second global timeout

// Run health check
runHealthCheck().finally(() => {
    clearTimeout(globalTimeout);
}); 