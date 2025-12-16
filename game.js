/**
 * Clase principal del juego "1000 en 1 Minuto"
 * Gestiona toda la lógica del juego, eventos y actualizaciones de UI
 */
class ClickerGame {
  constructor() {
    // Sistema de sonidos
    this.sounds = {
      click: this.createSound(800, 0.1, 'sine'),
      upgrade: this.createSound(600, 0.15, 'square'),
      error: this.createSound(200, 0.2, 'sawtooth'),
      win: this.createVictorySound(),
      tick: this.createTickTockSound(),
      whistle: this.createWhistleSound()
    };
    this.isMuted = false;

    // Constantes del juego
    this.CONFIG = {
      COOLDOWN_INITIAL: 5,
      COUNTDOWN_TIMER_INITIAL: 60,
      POINTS_FOR_ADD_POINT: 2,
      POINTS_FOR_REDUCE_COOLDOWN: 5,
      POINTS_FOR_ADD_TIME: 100,
      POINTS_FOR_WIN_GAME: 1000,
      EXTRA_TIME: 10,
      ONE_SECOND: 1000,
      MIN_COOLDOWN: 1,
      MAX_CLICK_POWER: 50,
      MAX_TIME_UPGRADES: 3,
      MAX_WIN_USES: 1
    };

    // Estado del juego
    this.state = {
      canClick: true,
      countdown: 0,
      points: 0,
      pointsAvailable: 1,
      cooldown: this.CONFIG.COOLDOWN_INITIAL,
      countdownTimer: this.CONFIG.COUNTDOWN_TIMER_INITIAL,
      gameEnded: false,
      gameStarted: false,
      timeUpgradesUsed: 0,
      winUsed: 0
    };

    // Referencias a elementos del DOM
    this.elements = {};
    
    // Timers
    this.timers = {
      countdown: null,
      cooldown: null
    };

    this.init();
  }

  /**
   * Inicializa el juego y obtiene referencias a elementos del DOM
   */
  init() {
    this.cacheDOMElements();
    this.attachEventListeners();
    this.createCooldownIndicators();
    this.createTimeIndicators();
    this.createWinIndicator();
    this.updateUI();
    this.setupInfoModal();
  }

  /**
   * Crea los indicadores visuales para las mejoras de cooldown
   */
  createCooldownIndicators() {
    if (!this.elements.cooldownIndicators) return;
    
    // El cooldown inicial es 5, el mínimo es 1, por lo que hay 4 mejoras posibles
    const maxUpgrades = this.CONFIG.COOLDOWN_INITIAL - this.CONFIG.MIN_COOLDOWN;
    this.elements.cooldownIndicators.innerHTML = '';
    
    for (let i = 0; i < maxUpgrades; i++) {
      const indicator = document.createElement('span');
      indicator.className = 'upgrade-dot';
      indicator.id = `cooldown-dot-${i}`;
      this.elements.cooldownIndicators.appendChild(indicator);
    }
  }

  /**
   * Crea los indicadores visuales para las mejoras de tiempo
   */
  createTimeIndicators() {
    if (!this.elements.timeIndicators) return;
    
    this.elements.timeIndicators.innerHTML = '';
    
    for (let i = 0; i < this.CONFIG.MAX_TIME_UPGRADES; i++) {
      const indicator = document.createElement('span');
      indicator.className = 'upgrade-dot';
      indicator.id = `time-dot-${i}`;
      this.elements.timeIndicators.appendChild(indicator);
    }
  }

  /**
   * Crea el indicador visual para el botón de victoria
   */
  createWinIndicator() {
    if (!this.elements.winIndicator) return;
    
    this.elements.winIndicator.innerHTML = '';
    
    const indicator = document.createElement('span');
    indicator.className = 'upgrade-dot';
    indicator.id = 'win-dot';
    this.elements.winIndicator.appendChild(indicator);
  }

  /**
   * Crea un sonido usando Web Audio API
   */
  createSound(frequency, duration, type = 'sine') {
    return () => {
      if (this.isMuted) return;
      try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = frequency;
        oscillator.type = type;
        
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + duration);
      } catch (e) {
        console.log('Audio no soportado');
      }
    };
  }

  /**
   * Crea un sonido de tic-tac de reloj
   */
  createTickTockSound() {
    let isTickSound = true;
    return () => {
      if (this.isMuted) return;
      try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        // Alternar entre dos frecuencias para el efecto tic-tac
        oscillator.frequency.value = isTickSound ? 800 : 600;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.08);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.08);
        
        isTickSound = !isTickSound;
      } catch (e) {
        console.log('Audio no soportado');
      }
    };
  }

  /**
   * Crea un sonido de silbato para cuando se acaba el tiempo
   */
  createWhistleSound() {
    return () => {
      if (this.isMuted) return;
      try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // Primer silbido (ascendente)
        const osc1 = audioContext.createOscillator();
        const gain1 = audioContext.createGain();
        osc1.connect(gain1);
        gain1.connect(audioContext.destination);
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(800, audioContext.currentTime);
        osc1.frequency.linearRampToValueAtTime(1200, audioContext.currentTime + 0.15);
        gain1.gain.setValueAtTime(0.2, audioContext.currentTime);
        gain1.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
        osc1.start(audioContext.currentTime);
        osc1.stop(audioContext.currentTime + 0.15);
        
        // Segundo silbido (descendente)
        const osc2 = audioContext.createOscillator();
        const gain2 = audioContext.createGain();
        osc2.connect(gain2);
        gain2.connect(audioContext.destination);
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(1200, audioContext.currentTime + 0.2);
        osc2.frequency.linearRampToValueAtTime(600, audioContext.currentTime + 0.5);
        gain2.gain.setValueAtTime(0.2, audioContext.currentTime + 0.2);
        gain2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        osc2.start(audioContext.currentTime + 0.2);
        osc2.stop(audioContext.currentTime + 0.5);
      } catch (e) {
        console.log('Audio no soportado');
      }
    };
  }

  /**
   * Crea un sonido de victoria con múltiples tonos ascendentes
   */
  createVictorySound() {
    return () => {
      if (this.isMuted) return;
      try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const frequencies = [523, 659, 784, 1047]; // Do, Mi, Sol, Do (octava alta)
        
        frequencies.forEach((freq, index) => {
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();
          
          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);
          
          oscillator.frequency.value = freq;
          oscillator.type = 'sine';
          
          const startTime = audioContext.currentTime + (index * 0.15);
          gainNode.gain.setValueAtTime(0.15, startTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.3);
          
          oscillator.start(startTime);
          oscillator.stop(startTime + 0.3);
        });
      } catch (e) {
        console.log('Audio no soportado');
      }
    };
  }

  /**
   * Configura la modal de información
   */
  setupInfoModal() {
    const infoBtn = document.getElementById('infoBtn');
    const infoModal = document.getElementById('infoModal');
    const closeModal = document.getElementById('closeModal');

    if (infoBtn && infoModal) {
      infoBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        infoModal.classList.remove('hidden');
      });
    }

    if (closeModal && infoModal) {
      closeModal.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        infoModal.classList.add('hidden');
      });
    }

    if (infoModal) {
      infoModal.addEventListener('click', (e) => {
        if (e.target === infoModal) {
          e.preventDefault();
          e.stopPropagation();
          infoModal.classList.add('hidden');
        }
      });
    }

    // Asegurar que el modal esté oculto al cargar
    if (infoModal) {
      infoModal.classList.add('hidden');
    }
  }

  /**
   * Toggle mute/unmute
   */
  toggleMute() {
    this.isMuted = !this.isMuted;
    const muteBtn = document.getElementById('muteBtn');
    muteBtn.textContent = this.isMuted ? '🔇' : '🔊';
    muteBtn.title = this.isMuted ? 'Activar sonidos' : 'Silenciar sonidos';
  }

  /**
   * Almacena referencias a elementos del DOM
   */
  cacheDOMElements() {
    this.elements = {
      startBtn: document.getElementById('startBtn'),
      gameContainer: document.getElementById('gameContainer'),
      clickBtn: document.getElementById('clickBtn'),
      counter: document.getElementById('counter'),
      countdown: document.getElementById('countdown'),
      addTimeBtn: document.getElementById('addTimeBtn'),
      addPointBtn: document.getElementById('addPointBtn'),
      reduceCooldownBtn: document.getElementById('reduceCooldownBtn'),
      winGameBtn: document.getElementById('winGameBtn'),
      messages: document.getElementById('messages'),
      progressBar: document.getElementById('progressBar'),
      cooldownIndicators: document.getElementById('cooldownIndicators'),
      pointsProgressBar: document.getElementById('pointsProgressBar'),
      timeIndicators: document.getElementById('timeIndicators'),
      winIndicator: document.getElementById('winIndicator')
    };
  }

  /**
   * Asocia eventos a los elementos del DOM
   */
  attachEventListeners() {
    // Botón de inicio
    this.elements.startBtn.addEventListener('click', () => this.startGame());

    // Botón de mute
    const muteBtn = document.getElementById('muteBtn');
    if (muteBtn) {
      muteBtn.addEventListener('click', () => this.toggleMute());
    }

    // Botones del juego
    this.elements.clickBtn.addEventListener('click', () => this.clickButton());
    this.elements.addPointBtn.addEventListener('click', () => this.upgradeClickPower());
    this.elements.reduceCooldownBtn.addEventListener('click', () => this.reduceCooldown());
    this.elements.addTimeBtn.addEventListener('click', () => this.addTime());
    this.elements.winGameBtn.addEventListener('click', () => this.winGame());
  }

  /**
   * Inicia el juego
   */
  startGame() {
    this.state.gameStarted = true;
    this.state.gameEnded = false;
    this.elements.startBtn.classList.add('hidden');
    this.elements.gameContainer.classList.remove('hidden');
    this.elements.messages.classList.add('hidden');
    
    this.resetGame();
    this.startCountdown();
    this.updateUI();
    
    this.showNotification('¡Juego iniciado! ¡Llega a 1000 puntos!', 'success');
  }

  /**
   * Reinicia el estado del juego
   */
  resetGame() {
    this.state.countdownTimer = this.CONFIG.COUNTDOWN_TIMER_INITIAL;
    this.state.cooldown = this.CONFIG.COOLDOWN_INITIAL;
    this.state.points = 0;
    this.state.pointsAvailable = 1;
    this.state.canClick = true;
    this.state.countdown = 0;
    this.state.timeUpgradesUsed = 0;
    this.state.winUsed = 0;
    this.updateCooldownIndicators();
    this.updatePointsProgressBar();
    this.updateTimeIndicators();
    this.updateWinIndicator();
  }

  /**
   * Maneja el clic en el botón principal
   */
  clickButton() {
    if (!this.state.canClick || this.state.gameEnded) return;

    this.state.canClick = false;
    this.state.countdown = this.state.cooldown - 1; // Restar 1 porque el primer tick es inmediato
    this.state.points += this.state.pointsAvailable;
    
    this.sounds.click();
    this.updateUI();
    this.startCooldown();
    this.createClickParticles();
    
    // Efecto de feedback visual
    this.elements.clickBtn.style.transform = 'scale(0.95)';
    setTimeout(() => {
      this.elements.clickBtn.style.transform = '';
    }, 100);
  }

  /**
   * Mejora el poder de clic
   */
  upgradeClickPower() {
    if (this.state.pointsAvailable >= this.CONFIG.MAX_CLICK_POWER) {
      this.sounds.error();
      this.showNotification('¡Poder de clic al máximo!', 'error');
      return;
    }
    
    if (this.state.points >= this.CONFIG.POINTS_FOR_ADD_POINT && !this.state.gameEnded) {
      this.state.points -= this.CONFIG.POINTS_FOR_ADD_POINT;
      this.state.pointsAvailable++;
      this.sounds.upgrade();
      this.updatePointsProgressBar();
      this.updateUI();
      this.showNotification(`¡Mejora comprada! +${this.state.pointsAvailable} puntos por clic`, 'success');
    } else {
      this.sounds.error();
      this.showNotification('¡Puntos insuficientes!', 'error');
    }
  }

  /**
   * Reduce el tiempo de espera
   */
  reduceCooldown() {
    if (this.state.points >= this.CONFIG.POINTS_FOR_REDUCE_COOLDOWN && 
        this.state.cooldown > this.CONFIG.MIN_COOLDOWN && 
        !this.state.gameEnded) {
      this.state.points -= this.CONFIG.POINTS_FOR_REDUCE_COOLDOWN;
      this.state.cooldown--;
      this.sounds.upgrade();
      this.updateCooldownIndicators();
      this.updateUI();
      this.showNotification(`¡Cooldown reducido a ${this.state.cooldown}s!`, 'success');
    } else if (this.state.cooldown <= this.CONFIG.MIN_COOLDOWN) {
      this.sounds.error();
      this.showNotification('¡Cooldown ya está al mínimo!', 'error');
    } else {
      this.sounds.error();
      this.showNotification('¡Puntos insuficientes!', 'error');
    }
  }

  /**
   * Añade tiempo al contador
   */
  addTime() {
    if (this.state.timeUpgradesUsed >= this.CONFIG.MAX_TIME_UPGRADES) {
      this.sounds.error();
      this.showNotification('¡Límite de mejoras de tiempo alcanzado!', 'error');
      return;
    }
    
    if (this.state.points >= this.CONFIG.POINTS_FOR_ADD_TIME && !this.state.gameEnded) {
      this.state.points -= this.CONFIG.POINTS_FOR_ADD_TIME;
      this.state.countdownTimer += this.CONFIG.EXTRA_TIME;
      this.state.timeUpgradesUsed++;
      this.sounds.upgrade();
      this.updateTimeIndicators();
      this.updateUI();
      this.showNotification(`¡+${this.CONFIG.EXTRA_TIME} segundos añadidos!`, 'success');
    } else {
      this.sounds.error();
      this.showNotification('¡Puntos insuficientes!', 'error');
    }
  }

  /**
   * Gana el juego instantáneamente
   */
  winGame() {
    if (this.state.winUsed >= this.CONFIG.MAX_WIN_USES) {
      this.sounds.error();
      this.showNotification('¡Ya usaste esta opción!', 'error');
      return;
    }
    
    if (this.state.points >= this.CONFIG.POINTS_FOR_WIN_GAME && !this.state.gameEnded) {
      this.state.points -= this.CONFIG.POINTS_FOR_WIN_GAME;
      this.state.winUsed++;
      this.sounds.win();
      this.updateWinIndicator();
      this.handleGameWin();
    } else {
      this.sounds.error();
      this.showNotification('¡Necesitas 1000 puntos!', 'error');
    }
  }

  /**
   * Inicia el contador de tiempo del juego
   */
  startCountdown() {
    if (this.timers.countdown) {
      clearInterval(this.timers.countdown);
    }

    this.timers.countdown = setInterval(() => {
      if (this.state.countdownTimer > 0 && !this.state.gameEnded) {
        this.state.countdownTimer--;
        if (this.state.countdownTimer <= 10) {
          this.sounds.tick();
        }
        this.updateUI();
      } else if (!this.state.gameEnded) {
        this.handleGameLoss();
      }
    }, this.CONFIG.ONE_SECOND);
  }

  /**
   * Inicia el cooldown del botón de clic
   */
  startCooldown() {
    if (this.timers.cooldown) {
      clearInterval(this.timers.cooldown);
    }

    this.timers.cooldown = setInterval(() => {
      if (this.state.countdown > 0) {
        this.state.countdown--;
        this.updateUI();
      } else {
        this.state.canClick = true;
        clearInterval(this.timers.cooldown);
        this.updateUI();
      }
    }, this.CONFIG.ONE_SECOND);
  }

  /**
   * Maneja la victoria del juego
   */
  handleGameWin() {
    this.state.gameEnded = true;
    clearInterval(this.timers.countdown);
    clearInterval(this.timers.cooldown);
    this.sounds.win();
    
    this.elements.messages.innerHTML = `
      <div class="message-box">
        <h2>🏆 ¡VICTORIA! 🏆</h2>
        <p style="font-size: 1.5em; margin: 20px 0;">¡Has ganado el juego!</p>
        <button onclick="game.restartFromUI()" class="btn-primary" style="margin-top: 20px; padding: 15px 30px;">
          🔄 Jugar de nuevo
        </button>
      </div>
    `;
    this.elements.messages.classList.remove('hidden');
    this.elements.gameContainer.classList.add('celebrate');
    
    this.createConfetti();
  }

  /**
   * Maneja la derrota del juego
   */
  handleGameLoss() {
    this.state.gameEnded = true;
    clearInterval(this.timers.countdown);
    clearInterval(this.timers.cooldown);
    this.sounds.whistle();
    
    this.elements.messages.innerHTML = `
      <div class="message-box">
        <h2 style="color: #f44336;">⏰ ¡Tiempo agotado!</h2>
        <p style="font-size: 1.5em; margin: 20px 0;">Puntos conseguidos: ${this.state.points}/1000</p>
        <p style="font-size: 1.2em; color: #666;">¡Sigue intentándolo!</p>
        <button onclick="game.restartFromUI()" class="btn-primary" style="margin-top: 20px; padding: 15px 30px;">
          🔄 Intentar de nuevo
        </button>
      </div>
    `;
    this.elements.messages.classList.remove('hidden');
    this.elements.gameContainer.classList.add('hidden');
  }

  /**
   * Reinicia el juego desde la UI
   */
  restartFromUI() {
    this.startGame();
  }

  /**
   * Actualiza todos los elementos de la UI
   */
  updateUI() {
    // Actualizar valores principales
    this.elements.counter.textContent = this.state.points;
    this.elements.countdown.textContent = this.state.countdownTimer;

    // Actualizar botón de clic con información integrada
    if (this.state.canClick) {
      this.elements.clickBtn.innerHTML = `
        <div style="font-size: 2.5em; margin-bottom: 8px;">👆 ¡CLIC!</div>
        <div style="font-size: 0.75em; opacity: 0.95; display: flex; justify-content: center; gap: 25px; font-weight: 600;">
          <span>💎 +${this.state.pointsAvailable} puntos</span>
          <span>⏱️ Espera: ${this.state.cooldown}s</span>
        </div>
      `;
      this.elements.clickBtn.classList.remove('disabled');
    } else {
      this.elements.clickBtn.innerHTML = `
        <div style="font-size: 2.5em; margin-bottom: 8px;">⏱️ ${this.state.countdown}s</div>
        <div style="font-size: 0.75em; opacity: 0.95; display: flex; justify-content: center; gap: 25px; font-weight: 600;">
          <span>💎 +${this.state.pointsAvailable} puntos</span>
          <span>⏱️ Espera: ${this.state.cooldown}s</span>
        </div>
      `;
      this.elements.clickBtn.classList.add('disabled');
    }

    // Actualizar estados de botones de mejora
    this.updateButtonState(this.elements.addPointBtn, this.CONFIG.POINTS_FOR_ADD_POINT);
    this.updateButtonState(this.elements.reduceCooldownBtn, this.CONFIG.POINTS_FOR_REDUCE_COOLDOWN);
    this.updateButtonState(this.elements.addTimeBtn, this.CONFIG.POINTS_FOR_ADD_TIME);
    this.updateButtonState(this.elements.winGameBtn, this.CONFIG.POINTS_FOR_WIN_GAME);

    // Actualizar barra de progreso
    this.updateProgressBar();
  }

  /**
   * Actualiza los indicadores visuales de mejoras de cooldown
   */
  updateCooldownIndicators() {
    const upgradesPurchased = this.CONFIG.COOLDOWN_INITIAL - this.state.cooldown;
    const maxUpgrades = this.CONFIG.COOLDOWN_INITIAL - this.CONFIG.MIN_COOLDOWN;
    
    for (let i = 0; i < maxUpgrades; i++) {
      const dot = document.getElementById(`cooldown-dot-${i}`);
      if (dot) {
        if (i < upgradesPurchased) {
          dot.classList.add('active');
        } else {
          dot.classList.remove('active');
        }
      }
    }
  }

  /**
   * Actualiza la barra de progreso de mejoras de puntos
   */
  updatePointsProgressBar() {
    if (!this.elements.pointsProgressBar) return;
    
    const progress = ((this.state.pointsAvailable - 1) / (this.CONFIG.MAX_CLICK_POWER - 1)) * 100;
    this.elements.pointsProgressBar.style.width = `${progress}%`;
  }

  /**
   * Actualiza los indicadores visuales de mejoras de tiempo
   */
  updateTimeIndicators() {
    for (let i = 0; i < this.CONFIG.MAX_TIME_UPGRADES; i++) {
      const dot = document.getElementById(`time-dot-${i}`);
      if (dot) {
        if (i < this.state.timeUpgradesUsed) {
          dot.classList.add('active');
        } else {
          dot.classList.remove('active');
        }
      }
    }
  }

  /**
   * Actualiza el indicador visual del botón de victoria
   */
  updateWinIndicator() {
    const dot = document.getElementById('win-dot');
    if (dot && this.state.winUsed > 0) {
      dot.classList.add('active');
    }
  }

  /**
   * Actualiza el estado visual de un botón según el costo
   */
  updateButtonState(button, cost) {
    // Caso especial para el botón de cooldown
    if (button === this.elements.reduceCooldownBtn) {
      if (this.state.cooldown <= this.CONFIG.MIN_COOLDOWN) {
        button.classList.add('disabled');
        return;
      }
    }
    
    // Caso especial para el botón de más puntos
    if (button === this.elements.addPointBtn) {
      if (this.state.pointsAvailable >= this.CONFIG.MAX_CLICK_POWER) {
        button.classList.add('disabled');
        return;
      }
    }
    
    // Caso especial para el botón de más tiempo
    if (button === this.elements.addTimeBtn) {
      if (this.state.timeUpgradesUsed >= this.CONFIG.MAX_TIME_UPGRADES) {
        button.classList.add('disabled');
        return;
      }
    }
    
    // Caso especial para el botón de victoria
    if (button === this.elements.winGameBtn) {
      if (this.state.winUsed >= this.CONFIG.MAX_WIN_USES) {
        button.classList.add('disabled');
        return;
      }
    }
    
    if (this.state.points >= cost && !this.state.gameEnded) {
      button.classList.remove('disabled');
    } else {
      button.classList.add('disabled');
    }
  }

  /**
   * Actualiza la barra de progreso
   */
  updateProgressBar() {
    const progress = Math.min((this.state.points / this.CONFIG.POINTS_FOR_WIN_GAME) * 100, 100);
    this.elements.progressBar.style.width = `${progress}%`;
  }

  /**
   * Muestra una notificación temporal
   */
  showNotification(message, type = 'info') {
    // Buscar el contenedor de botones para posicionar la notificación
    const buttonGrid = document.querySelector('.button-grid');
    if (!buttonGrid) return;

    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
      position: absolute;
      top: -60px;
      left: 0;
      right: 0;
      background: ${type === 'success' ? '#4CAF50' : '#f44336'};
      color: white;
      padding: 12px 20px;
      border-radius: 10px;
      box-shadow: 0 4px 15px rgba(0,0,0,0.3);
      z-index: 100;
      animation: notificationSlideDown 0.3s ease-out;
      font-weight: 600;
      font-size: 1em;
      text-align: center;
      width: 100%;
      box-sizing: border-box;
    `;

    // Posicionar el contenedor como relative para que la notificación se posicione correctamente
    buttonGrid.parentElement.style.position = 'relative';
    buttonGrid.parentElement.appendChild(notification);

    setTimeout(() => {
      notification.style.animation = 'notificationSlideUp 0.3s ease-in forwards';
      setTimeout(() => notification.remove(), 300);
    }, 2000);
  }

  /**
   * Crea partículas animadas al hacer clic
   */
  createClickParticles() {
    const colors = ['#FFD700', '#4CAF50', '#2196F3', '#FF69B4'];
    const count = 5;

    for (let i = 0; i < count; i++) {
      const particle = document.createElement('div');
      particle.textContent = `+${this.state.pointsAvailable}`;
      particle.style.cssText = `
        position: fixed;
        left: 50%;
        top: 50%;
        color: ${colors[Math.floor(Math.random() * colors.length)]};
        font-size: 24px;
        font-weight: bold;
        pointer-events: none;
        z-index: 1000;
        animation: floatUp 1s ease-out forwards;
      `;
      particle.style.transform = `translate(${(Math.random() - 0.5) * 100}px, -50%)`;
      
      document.body.appendChild(particle);
      
      setTimeout(() => particle.remove(), 1000);
    }
  }

  /**
   * Crea confetti para celebrar la victoria
   */
  createConfetti() {
    const colors = ['#FFD700', '#4CAF50', '#2196F3', '#FF69B4', '#FFA500', '#9C27B0'];
    const symbols = ['🎉', '🎊', '⭐', '✨', '🏆', '🎯'];
    const count = 50;

    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        const confetti = document.createElement('div');
        confetti.className = 'particle';
        confetti.textContent = symbols[Math.floor(Math.random() * symbols.length)];
        confetti.style.cssText = `
          left: ${Math.random() * 100}vw;
          top: -20px;
          font-size: ${20 + Math.random() * 20}px;
          color: ${colors[Math.floor(Math.random() * colors.length)]};
        `;
        
        document.body.appendChild(confetti);
        
        setTimeout(() => confetti.remove(), 2000);
      }, i * 50);
    }
  }
}

// Añadir estilos de animación para notificaciones
const style = document.createElement('style');
style.textContent = `
  @keyframes notificationSlideDown {
    from {
      transform: translateY(-20px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
  
  @keyframes notificationSlideUp {
    from {
      transform: translateY(0);
      opacity: 1;
    }
    to {
      transform: translateY(-20px);
      opacity: 0;
    }
  }
  
  @keyframes floatUp {
    from {
      opacity: 1;
      transform: translateY(0);
    }
    to {
      opacity: 0;
      transform: translateY(-150px) scale(1.5);
    }
  }
`;
document.head.appendChild(style);

// Inicializar el juego cuando se carga la página
let game;
document.addEventListener('DOMContentLoaded', () => {
  game = new ClickerGame();
});
