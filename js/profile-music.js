class ProfileMusicPlayer {
    constructor() {
        this.currentAudio = null;
        this.currentMusicPath = null;
        this.audioCache = new Map();
        this.isMuted = false;
        this.anthem = null;
        this.isPlayingProfile = false;
        this.init();
        
        // Make this globally accessible for audio manager
        window.profileMusicPlayer = this;
    }

    init() {
        // Setup anthem
        this.anthem = new Audio('https://github.com/zoxycontin/rsc-bio/raw/refs/heads/main/assets/songs/anthem.mp3');
        this.anthem.loop = true;
        this.anthem.volume = 0.25;
        
        // Listen for dynamically generated cards
        document.addEventListener('cardsGenerated', () => this.setupCardListeners());
        
        // Also setup for any existing cards
        this.setupCardListeners();
    }

    setupCardListeners() {
        const cards = document.querySelectorAll('.card');
        cards.forEach(card => {
            // Avoid adding duplicate listeners
            if (card.hasAttribute('data-music-listener')) return;
            card.setAttribute('data-music-listener', 'true');
            
            const musicPath = card.dataset.music;
            if (musicPath) {
                // Preload audio
                this.preloadAudio(musicPath);
                
                // Play on hover - music continues after mouse leaves
                card.addEventListener('mouseenter', () => {
                    this.playMusic(musicPath);
                });
            }
        });
    }

    preloadAudio(musicPath) {
        if (!this.audioCache.has(musicPath)) {
            const audio = new Audio(musicPath);
            audio.preload = 'auto';
            audio.volume = 0.25;
            audio.loop = true;
            this.audioCache.set(musicPath, audio);
        }
    }

    playMusic(musicPath) {
        if (this.isMuted) return;
        
        // Don't restart if same music is already playing
        if (this.currentMusicPath === musicPath && this.currentAudio && !this.currentAudio.paused) {
            return;
        }
        
        this.stopMusic();
        
        // Pause anthem when playing profile music
        if (this.anthem) {
            this.anthem.pause();
        }
        
        const audio = this.audioCache.get(musicPath);
        if (audio) {
            this.currentAudio = audio;
            this.currentMusicPath = musicPath;
            this.isPlayingProfile = true;
            audio.currentTime = 0;
            audio.play().catch(error => {
                console.log("Audio play failed:", error);
            });
            
            // Update now playing display
            this.updateNowPlaying(musicPath);
        }
    }

    stopMusic() {
        if (this.currentAudio) {
            this.currentAudio.pause();
            this.currentAudio.currentTime = 0;
            this.currentAudio = null;
            this.currentMusicPath = null;
            this.isPlayingProfile = false;
        }
    }
    
    // Called when navigating to a new section - returns to anthem
    returnToAnthem() {
        if (this.isMuted) return;
        
        this.stopMusic();
        
        if (this.anthem) {
            this.anthem.currentTime = 0;
            this.anthem.play().catch(error => {
                console.log("Anthem play failed:", error);
            });
            this.updateNowPlaying('anthem');
        }
    }
    
    updateNowPlaying(musicPath) {
        const npTrack = document.querySelector('.np-track');
        if (npTrack) {
            if (musicPath === 'anthem') {
                npTrack.textContent = 'RSC Anthem';
            } else {
                // Extract track name from path
                const trackName = musicPath.split('/').pop().replace('.mp3', '').replace('-theme', '');
                npTrack.textContent = trackName.charAt(0).toUpperCase() + trackName.slice(1) + "'s Theme";
            }
        }
    }
    
    setMuted(muted) {
        this.isMuted = muted;
        if (muted) {
            this.stopMusic();
            if (this.anthem) {
                this.anthem.pause();
            }
        }
    }
    
    // Initialize anthem playback
    initAnthem() {
        if (!this.isMuted && this.anthem && !this.isPlayingProfile) {
            this.anthem.play().catch(error => {
                console.log("Anthem autoplay failed:", error);
            });
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.profileMusicPlayer = new ProfileMusicPlayer();
});
