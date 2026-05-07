import { execSync } from 'child_process';
import fs from 'fs';

try {
    // 1. Get the list of staged files
    const stagedFiles = execSync('git diff --cached --name-only', { encoding: 'utf8' }).split('\n');

    // 2. Check if package.json is staged
    if (!stagedFiles.includes('package.json')) {
        process.exit(0); 
    }

    const getFileContent = (ref) => {
        try {
            return execSync(`git show ${ref}`, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
        } catch (e) {
            return null;
        }
    };

    const currentVersion = JSON.parse(getFileContent(':package.json') || '{}').version;
    const oldVersion = JSON.parse(getFileContent('HEAD:package.json') || '{}').version;

    if (currentVersion && oldVersion && currentVersion !== oldVersion) {
        console.log(`📦 Version bump detected: ${oldVersion} -> ${currentVersion}`);

        const isChangelogStaged = stagedFiles.some(f => f.includes('CHANGELOG.md'));

        if (!isChangelogStaged) {
            console.error('\n❌ ERROR: package.json version bumped but CHANGELOG.md was not updated.');
            console.error('👉 Please update CHANGELOG.md to document your changes.\n');
            process.exit(1);
        }

        try {
            // Read the STAGED version of CHANGELOG.md
            const changelogContent = getFileContent(':CHANGELOG.md');
            if (!changelogContent || !changelogContent.includes(`[${currentVersion}]`)) {
                console.error(`\n❌ ERROR: CHANGELOG.md is staged but missing entry for version [${currentVersion}].`);
                console.error(`👉 Please add a "## [${currentVersion}]" section to CHANGELOG.md.\n`);
                process.exit(1);
            }
        } catch (e) {
            console.error('⚠️ Could not verify staged CHANGELOG.md content:', e.message);
            process.exit(1);
        }

        console.log('✅ CHANGELOG.md update confirmed.');
    }
} catch (error) {
    console.error('❌ Unexpected error in version bump check:', error);
    process.exit(1);
}
