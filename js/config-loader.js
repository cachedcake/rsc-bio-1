/**
 * Config Loader - Loads and manages config.json data
 * Makes profile data available to all other scripts
 */

class ConfigLoader {
    constructor() {
        this.config = null;
        this.profiles = null;
        this.badges = null;
        this.platforms = null;
        this.loaded = false;
        this.loadPromise = null;
    }

    async load() {
        if (this.loaded) return this.config;
        if (this.loadPromise) return this.loadPromise;

        this.loadPromise = fetch('config.json')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to load config.json');
                }
                return response.json();
            })
            .then(data => {
                this.config = data;
                this.profiles = data.profiles;
                this.badges = data.badges;
                this.platforms = data.config.platforms;
                this.loaded = true;
                console.log('[Config] Loaded successfully');
                return data;
            })
            .catch(error => {
                console.error('[Config] Error loading:', error);
                return null;
            });

        return this.loadPromise;
    }

    // Get all profiles as flat array
    getAllProfiles() {
        if (!this.profiles) return [];
        return [...(this.profiles.founders || []), ...(this.profiles.members || [])];
    }

    // Get profile by member name
    getProfile(memberName) {
        const all = this.getAllProfiles();
        return all.find(p => p.name.toLowerCase() === memberName.toLowerCase());
    }

    // Get Discord ID for a member
    getDiscordId(memberName) {
        const profile = this.getProfile(memberName);
        if (profile && profile.socials && profile.socials.discord) {
            return profile.socials.discord;
        }
        return null;
    }

    // Get all Discord IDs as object { memberName: discordId }
    getAllDiscordIds() {
        const ids = {};
        this.getAllProfiles().forEach(profile => {
            if (profile.socials && profile.socials.discord) {
                ids[profile.name] = profile.socials.discord;
            }
        });
        return ids;
    }

    // Get badge info
    getBadgeInfo(badgeName) {
        if (!this.badges) return null;
        return this.badges[badgeName] || null;
    }

    // Get badges for a member
    getMemberBadges(memberName) {
        const profile = this.getProfile(memberName);
        if (!profile || !profile.badges) return [];
        
        return profile.badges.map(badgeName => {
            const badgeInfo = this.getBadgeInfo(badgeName);
            if (badgeInfo) {
                return {
                    name: badgeName,
                    file: badgeInfo.file,
                    displayName: badgeInfo.displayName
                };
            }
            return null;
        }).filter(b => b !== null);
    }

    // Get platform info
    getPlatformInfo(platformName) {
        if (!this.platforms) return null;
        return this.platforms[platformName] || null;
    }

    // Get badges path
    getBadgesPath() {
        return this.config?.config?.badgesPath || 'assets/badges/';
    }
}

// Create global instance
window.configLoader = new ConfigLoader();
