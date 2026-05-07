import { execSync } from 'child_process';
import fs from 'fs';

try {
    // 1. Get the list of staged files
    const stagedFiles = execSync('git diff --cached --name-only', { encoding: 'utf8' }).split('\n');

    // 2. Check if package.json is staged
    if (!stagedFiles.includes('package.json')) {
        process.exit(0); 
    }

    const getVersion = (ref) => {
        try {
            const content = execSync(`git show ${ref}`, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
            return JSON.parse(content).version;
        } catch (e) {
            return null;
        }
    };

    const currentVersion = getVersion(':package.json');
    const oldVersion = getVersion('HEAD:package.json');

    if (currentVersion && oldVersion && currentVersion !== oldVersion) {
        console.log(`📦 Version bump detected: ${oldVersion} -> ${currentVersion}`);

        const isChangelogStaged = stagedFiles.some(f => f.includes('CHANGELOG.md'));

        if (!isChangelogStaged) {
            console.error('\n❌ ERROR: package.json version bumped but CHANGELOG.md was not updated.');
            console.error('👉 Please update CHANGELOG.md to document your changes.\n');
            process.exit(1);
        }

        try {
            const changelogContent = fs.readFileSync('CHANGELOG.md', 'utf8');
            if (!changelogContent.includes(`[${currentVersion}]`)) {
                console.error(`\n❌ ERROR: CHANGELOG.md is staged but missing entry for version [${currentVersion}].`);
                console.error(`👉 Please add a "## [${currentVersion}]" section to CHANGELOG.md.\n`);
                process.exit(1);
            }
        } catch (e) {
            console.warn('⚠️ Could not verify CHANGELOG.md content:', e.message);
        }

        console.log('✅ CHANGELOG.md update confirmed.');
    }
} catch (error) {
    process.exit(0);
}
