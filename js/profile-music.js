class ProfileMusicPlayer {
    constructor() {
        this.currentAudio = null;
        this.audioCache = new Map();
        this.isMuted = false;
        this.init();
        
        // Make this globally accessible for audio manager
        window.profileMusicPlayer = this;
    }

    init() {
        const cards = document.querySelectorAll('.card');
        cards.forEach(card => {
            const profileImg = card.querySelector('.profile-img');
            if (profileImg) {
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
<<<<<<< HEAD
            audio.volume = 0.3;
=======
            audio.volume = 0.25; // Set volume to 25% to not be too loud
>>>>>>> a89c772e8e78b2bedf5659dc2ae372a27e72e7c2
            this.audioCache.set(musicPath, audio);
        }
    }

    playMusic(musicPath) {
<<<<<<< HEAD
=======
        // Don't play if muted
        if (this.isMuted) return;
        
        // Stop any currently playing music
>>>>>>> a89c772e8e78b2bedf5659dc2ae372a27e72e7c2
        this.stopMusic();
        
        const audio = this.audioCache.get(musicPath);
        if (audio) {
            this.currentAudio = audio;
            audio.currentTime = 0;
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
    
    setMuted(muted) {
        this.isMuted = muted;
        if (muted && this.currentAudio) {
            this.stopMusic();
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new ProfileMusicPlayer();
    new AudioManager();
});