// Profile hover music functionality
class ProfileMusicPlayer {
    constructor() {
        this.currentAudio = null;
        this.audioCache = new Map();
        this.init();
    }

    init() {
        const cards = document.querySelectorAll('.card');
        cards.forEach(card => {
            const profileImg = card.querySelector('.profile-img');
            if (profileImg) {
                // Get the music file path from data attribute
                const musicPath = card.dataset.music;
                if (musicPath) {
                    // Preload audio
                    this.preloadAudio(musicPath);
                    
                    // Add hover event listeners
                    card.addEventListener('mouseenter', () => {
                        this.playMusic(musicPath);
                    });
                    
                    card.addEventListener('mouseleave', () => {
                        this.stopMusic();
                    });
                }
            }
        });
    }

    preloadAudio(musicPath) {
        if (!this.audioCache.has(musicPath)) {
            const audio = new Audio(musicPath);
            audio.preload = 'auto';
            audio.volume = 0.3; // Set volume to 30% to not be too loud
            this.audioCache.set(musicPath, audio);
        }
    }

    playMusic(musicPath) {
        // Stop any currently playing music
        this.stopMusic();
        
        const audio = this.audioCache.get(musicPath);
        if (audio) {
            this.currentAudio = audio;
            audio.currentTime = 0; // Reset to beginning
            audio.play().catch(error => {
                console.log("Audio play failed:", error);
            });
        }
    }

    stopMusic() {
        if (this.currentAudio) {
            this.currentAudio.pause();
            this.currentAudio.currentTime = 0;
            this.currentAudio = null;
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ProfileMusicPlayer();
});