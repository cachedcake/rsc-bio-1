/**
 * Lanyard Discord Activity Integration
 * Displays real-time Discord presence for multiple users
 */

class LanyardIntegration {
    constructor() {
        this.websockets = new Map();
        this.userStates = new Map();
        this.retryAttempts = new Map();
        this.maxRetries = 5;
        this.retryDelay = 3000;
        
        // Discord IDs will be loaded from config
        this.discordIds = {};
        
        this.init();
    }

    async init() {
        // Wait for config to load first
        if (window.configLoader) {
            await window.configLoader.load();
            this.discordIds = window.configLoader.getAllDiscordIds();
        }
        
        // Wait for DOM and cards to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.waitForCards());
        } else {
            this.waitForCards();
        }
    }

    waitForCards() {
        // Listen for cards being generated
        document.addEventListener('cardsGenerated', () => this.setupLanyard());
        
        // Also check if cards already exist
        const cards = document.querySelectorAll('.card[data-member]');
        if (cards.length > 0) {
            this.setupLanyard();
        }
    }

    setupLanyard() {
        // Find all cards with member data
        const cards = document.querySelectorAll('.card[data-member]');
        
        cards.forEach(card => {
            const memberName = card.getAttribute('data-member');
            const discordId = this.discordIds[memberName];
            
            if (discordId) {
                // Add status indicator to profile image
                this.addStatusIndicator(card);
                
                // Connect to Lanyard WebSocket for this user
                this.connectToLanyard(memberName, discordId);
            }
        });
    }

    addStatusIndicator(card) {
        // CardGenerator already renders a status indicator; avoid duplicates.
        if (card.querySelector('.status-indicator')) return;

        const profileImg = card.querySelector('.profile-img');
        if (!profileImg) return;
        
        // Create status indicator
        const statusIndicator = document.createElement('div');
        statusIndicator.className = 'status-indicator';
        statusIndicator.setAttribute('data-status', 'offline');
        
        // Wrap profile image in container if not already wrapped
        let imgContainer = profileImg.parentElement;
        if (!imgContainer.classList.contains('profile-img-container')) {
            imgContainer = document.createElement('div');
            imgContainer.className = 'profile-img-container';
            profileImg.parentNode.insertBefore(imgContainer, profileImg);
            imgContainer.appendChild(profileImg);
        }
        
        imgContainer.appendChild(statusIndicator);
    }

    connectToLanyard(memberName, discordId) {
        const ws = new WebSocket('wss://api.lanyard.rest/socket');
        this.websockets.set(memberName, ws);

        ws.onopen = () => {
            console.log(`[Lanyard] Connected for ${memberName}`);
            this.retryAttempts.set(memberName, 0);
        };

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            
            switch (data.op) {
                case 1: // Hello
                    // Send subscribe message
                    ws.send(JSON.stringify({
                        op: 2,
                        d: {
                            subscribe_to_id: discordId
                        }
                    }));
                    
                    // Setup heartbeat
                    const heartbeatInterval = data.d.heartbeat_interval;
                    setInterval(() => {
                        if (ws.readyState === WebSocket.OPEN) {
                            ws.send(JSON.stringify({ op: 3 }));
                        }
                    }, heartbeatInterval);
                    break;
                    
                case 0: // Event
                    if (data.t === 'INIT_STATE' || data.t === 'PRESENCE_UPDATE') {
                        this.updateUserPresence(memberName, data.d);
                    }
                    break;
            }
        };

        ws.onerror = (error) => {
            console.error(`[Lanyard] Error for ${memberName}:`, error);
        };

        ws.onclose = () => {
            console.log(`[Lanyard] Disconnected for ${memberName}`);
            this.handleReconnect(memberName, discordId);
        };
    }

    handleReconnect(memberName, discordId) {
        const attempts = this.retryAttempts.get(memberName) || 0;
        
        if (attempts < this.maxRetries) {
            this.retryAttempts.set(memberName, attempts + 1);
            console.log(`[Lanyard] Reconnecting for ${memberName} (attempt ${attempts + 1}/${this.maxRetries})`);
            
            setTimeout(() => {
                this.connectToLanyard(memberName, discordId);
            }, this.retryDelay);
        } else {
            console.error(`[Lanyard] Max retries reached for ${memberName}`);
        }
    }

    updateUserPresence(memberName, presenceData) {
        this.userStates.set(memberName, presenceData);
        
        // Get status from presence data
        const status = presenceData.discord_status || 'offline';
        const activities = presenceData.activities || [];
        
        // Update all cards for this member (regular and expanded)
        this.updateCardStatus(memberName, status, activities);
    }

    updateCardStatus(memberName, status, activities) {
        // Update regular card
        const card = document.querySelector(`.card[data-member="${memberName}"]`);
        if (card) {
            const indicator = card.querySelector('.status-indicator');
            if (indicator) {
                indicator.setAttribute('data-status', status);
                
                // Add tooltip with activity info
                let tooltip = this.getActivityTooltip(status, activities);
                indicator.setAttribute('title', tooltip);
            }
        }
        
        // Update expanded card if it exists
        const expandedCard = document.querySelector('.card-expanded');
        if (expandedCard) {
            const expandedMember = expandedCard.getAttribute('data-member');
            if (expandedMember === memberName) {
                // Update status indicator (keep title in sync)
                const expandedIndicator = expandedCard.querySelector('.status-indicator');
                if (expandedIndicator) {
                    expandedIndicator.setAttribute('data-status', status);
                    const tooltip = this.getActivityTooltip(status, activities);
                    expandedIndicator.setAttribute('title', tooltip);
                }
                // Notify card handler to refresh activity block (so late-arriving data shows and timer works)
                document.dispatchEvent(new CustomEvent('lanyardPresenceUpdate', { detail: { memberName } }));
            }
        }
    }

    getActivityTooltip(status, activities) {
        const statusText = {
            'online': 'Online',
            'idle': 'Idle',
            'dnd': 'Do Not Disturb',
            'offline': 'Offline'
        };
        
        let tooltip = statusText[status] || 'Unknown';
        
        // Add activity if present
        if (activities && activities.length > 0) {
            const activity = activities[0];
            if (activity.name) {
                tooltip += ` - ${activity.name}`;
                if (activity.details) {
                    tooltip += `: ${activity.details}`;
                }
            }
        }
        
        return tooltip;
    }

    // Public method to get user state
    getUserState(memberName) {
        return this.userStates.get(memberName);
    }

    // Cleanup method
    destroy() {
        this.websockets.forEach((ws, memberName) => {
            ws.close();
        });
        this.websockets.clear();
        this.userStates.clear();
    }
}

// Initialize when DOM is ready and make globally accessible
let lanyardIntegration;
document.addEventListener('DOMContentLoaded', () => {
    lanyardIntegration = new LanyardIntegration();
    window.lanyardIntegration = lanyardIntegration;
});
