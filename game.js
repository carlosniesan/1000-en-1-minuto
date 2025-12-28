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

    // Hard mode flag: when true, penalizations are active
    this.state.hardMode = false;

    // Referencias a elementos del DOM
    this.elements = {};
    
    // Timers
    this.timers = {
      countdown: null,
      cooldown: null,
      notification: null
    };

    // Estado y timers para la bomba
    this.state.bomb = {
      status: 'idle', // 'idle' | 'arming' | 'armed'
      armingRemaining: 0,
      armedRemaining: 0
    };

    this.timers.bombArming = null;
    this.timers.bombArmed = null;

    // Estado y timers para el segundo botón (2 bombas)
    this.state.dualBomb = {
      status: 'idle', // 'idle'|'arming'|'armed'
      armingRemaining: 0,
      armedRemaining: 0
    };
    this.timers.dualBombArming = null;
    this.timers.dualBombArmed = null;

    // Estado y timer para el botón de muerte (porcentaje 0-100)
    this.state.deathButton = {
      percent: 0
    };
    this.timers.death = null;

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
      hardModeToggle: document.getElementById('hardModeToggle'),
      hardModeContainer: document.getElementById('hardModeContainer'),
      specialSection: document.querySelector('.special-section'),
      gameContainer: document.getElementById('gameContainer'),
      clickBtn: document.getElementById('clickBtn'),
      counter: document.getElementById('counter'),
      countdown: document.getElementById('countdown'),
      addTimeBtn: document.getElementById('addTimeBtn'),
      addPointBtn: document.getElementById('addPointBtn'),
      reduceCooldownBtn: document.getElementById('reduceCooldownBtn'),
      winGameBtn: document.getElementById('winGameBtn'),
      bombBtn: document.getElementById('bombBtn'),
      bombProgressFill: document.getElementById('bombProgressFill'),
      specialBtn2: document.getElementById('specialBtn2'),
      specialBtnLarge: document.getElementById('specialBtnLarge'),
      deathIcon: document.getElementById('deathIcon'),
      deathLabel: document.getElementById('deathLabel'),
      deathProgressFill: document.getElementById('deathProgressFill'),
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
    if (this.elements.startBtn) this.elements.startBtn.addEventListener('click', () => this.startGame());

    // Hard mode toggle
    if (this.elements.hardModeToggle) {
      this.elements.hardModeToggle.addEventListener('change', (e) => this.setHardMode(!!e.target.checked));
      // initialize toggle UI from state
      this.elements.hardModeToggle.checked = !!this.state.hardMode;
    }

    // Apply the current hard mode to UI (ensure buttons reflect the state)
    // If setHardMode is not yet defined due to ordering, guard it
    if (typeof this.setHardMode === 'function') {
      this.setHardMode(!!this.state.hardMode);
    }

    // Botón de mute
    const muteBtn = document.getElementById('muteBtn');
    if (muteBtn) {
      muteBtn.addEventListener('click', () => this.toggleMute());
    }

    // Botones del juego (comprobando existencia para evitar excepciones)
    if (this.elements.clickBtn) this.elements.clickBtn.addEventListener('click', () => this.clickButton());
    if (this.elements.addPointBtn) this.elements.addPointBtn.addEventListener('click', () => this.upgradeClickPower());
    if (this.elements.reduceCooldownBtn) this.elements.reduceCooldownBtn.addEventListener('click', () => this.reduceCooldown());
    if (this.elements.addTimeBtn) this.elements.addTimeBtn.addEventListener('click', () => this.addTime());
    if (this.elements.winGameBtn) this.elements.winGameBtn.addEventListener('click', () => this.winGame());

    // Botones especiales
    if (this.elements.bombBtn) {
      // Usar onclick para sobrescribir cualquier handler previo cuando el innerHTML cambia
      this.elements.bombBtn.onclick = () => { if (this.state.hardMode) this.handleBombButton(); };
    }
    if (this.elements.specialBtn2) {
      this.elements.specialBtn2.onclick = () => { if (this.state.hardMode) this.handleDualBombButton(); };
    }
    if (this.elements.specialBtnLarge) {
      // death button click reduces percent by 1%
      this.elements.specialBtnLarge.onclick = () => { if (this.state.hardMode) this.handleDeathButtonClick(); };
    }
  }

  /**
   * Inicia el juego
   */
  startGame() {
    this.state.gameStarted = true;
    this.state.gameEnded = false;
    this.elements.startBtn.classList.add('hidden');
    // Hide hard mode selector after starting the game (selection only allowed on initial screen)
    if (this.elements.hardModeContainer) this.elements.hardModeContainer.classList.add('hidden');
    this.elements.gameContainer.classList.remove('hidden');
    
    this.resetGame();
    this.startCountdown();
    this.updateUI();

    // Iniciar automáticamente el ciclo de la bomba y del dualBomb SOLO si hardMode
    if (this.state.hardMode) {
      this.startBombArming();
      this.startDualBombCycle();
      this.startDeathTimer();
    }

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
    // Reset bomba
    this.clearBombTimers();
    this.state.bomb.status = 'idle';
    this.state.bomb.armingRemaining = 0;
    this.state.bomb.armedRemaining = 0;
    // Reset dual bomb
    this.clearDualBombTimers();
    this.state.dualBomb.status = 'idle';
    this.state.dualBomb.armingRemaining = 0;
    this.state.dualBomb.armedRemaining = 0;
    // Reset death button
    this.clearDeathTimer();
    this.state.deathButton.percent = 0;
    // Remove any end-game overlay messages so messages area layout stays the same
    if (this.elements.messages) {
      const existingOverlay = this.elements.messages.querySelector('.message-overlay');
      if (existingOverlay) existingOverlay.remove();
    }
    // If hard mode is off, ensure penalization UIs show disabled
    if (!this.state.hardMode) {
      if (this.elements.bombBtn) this.elements.bombBtn.classList.add('disabled');
      if (this.elements.specialBtn2) this.elements.specialBtn2.classList.add('disabled');
      if (this.elements.specialBtnLarge) this.elements.specialBtnLarge.classList.add('disabled');
    }
    this.updateCooldownIndicators();
    this.updatePointsProgressBar();
    this.updateTimeIndicators();
    this.updateWinIndicator();
  }

  /**
   * Maneja el clic en el botón principal
   */
  clickButton() {
    if (this.state.gameEnded) return;

    // Si el botón está disponible, comportamiento normal (sumar puntos y empezar cooldown)
    if (this.state.canClick) {
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
    } else {
      // Si está en cooldown, el clic penaliza restando 5 segundos del tiempo restante
      const PENALTY = 5;
        this.state.countdownTimer = Math.max(0, this.state.countdownTimer - PENALTY);
        this.sounds.error();
        this.showNotification(`- ${PENALTY}s (penalizado)`, 'error');
      this.updateUI();

      if (this.state.countdownTimer <= 0) {
        this.handleGameLoss();
      }
    }
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
    // Create an absolute overlay inside #messages so its position in the flow doesn't change
    if (this.elements.messages) {
      // remove previous overlay if any
      const prev = this.elements.messages.querySelector('.message-overlay');
      if (prev) prev.remove();
      const overlay = document.createElement('div');
      overlay.className = 'message-overlay';
      overlay.innerHTML = `
        <div class="message-box">
          <h2>🏆 ¡VICTORIA! 🏆</h2>
          <p style="font-size: 1.5em; margin: 20px 0;">¡Has ganado el juego!</p>
          <button onclick="game.restartFromUI()" class="btn-primary" style="margin-top: 20px; padding: 15px 30px;">
            🔄 Jugar de nuevo
          </button>
        </div>
      `;
      this.elements.messages.appendChild(overlay);
    }
    // Keep gameContainer visible so the #messages position doesn't change;
    // remove celebration class but do not hide the container.
    if (this.elements.gameContainer) {
      this.elements.gameContainer.classList.remove('celebrate');
    }
    if (this.elements.startBtn) this.elements.startBtn.classList.remove('hidden');
    
    this.createConfetti();
    // Show hard mode selector again after game ends
    if (this.elements.hardModeContainer) this.elements.hardModeContainer.classList.remove('hidden');
  }

  /**
   * Maneja la derrota del juego
   */
  handleGameLoss() {
    // Prevent duplicate loss handling
    if (this.state.gameEnded) return;

    this.state.gameEnded = true;
    // Clear all timers to avoid any further effects after death
    this.clearAllTimers();
    this.sounds.whistle();

    // Ensure messages container exists; if not, create a fallback
    if (!this.elements.messages) {
      const msgs = document.getElementById('messages') || document.createElement('div');
      msgs.id = 'messages';
      document.body.appendChild(msgs);
      this.elements.messages = msgs;
    }

    // Build overlay message content and append inside #messages so layout doesn't shift
    const lossHtml = `
      <div class="message-box">
        <h2 style="color: #f44336;">⏰ ¡Tiempo agotado!</h2>
        <p style="font-size: 1.5em; margin: 20px 0;">Puntos conseguidos: ${this.state.points}/1000</p>
        <p style="font-size: 1.2em; color: #666;">¡Sigue intentándolo!</p>
        <button onclick="game.restartFromUI()" class="btn-primary" style="margin-top: 20px; padding: 15px 30px;">
          🔄 Intentar de nuevo
        </button>
      </div>
    `;

    try {
      if (this.elements.messages) {
        const prev = this.elements.messages.querySelector('.message-overlay');
        if (prev) prev.remove();
        const overlay = document.createElement('div');
        overlay.className = 'message-overlay';
        overlay.innerHTML = lossHtml;
        this.elements.messages.appendChild(overlay);
      } else {
        // fallback: append to body
        const fallback = document.createElement('div');
        fallback.className = 'message-overlay';
        fallback.innerHTML = lossHtml;
        document.body.appendChild(fallback);
      }
    } catch (e) {
      console.warn('Failed to render loss overlay', e);
    }

    // Keep gameContainer visible so #messages stays in place; do not hide it.
    // Show hard mode selector again after game ends
    if (this.elements.hardModeContainer && this.elements.hardModeContainer.classList) this.elements.hardModeContainer.classList.remove('hidden');
  }

  /**
   * Limpia todos los timers usados por el juego
   */
  clearAllTimers() {
    // Core timers
    if (this.timers.countdown) { clearInterval(this.timers.countdown); this.timers.countdown = null; }
    if (this.timers.cooldown) { clearInterval(this.timers.cooldown); this.timers.cooldown = null; }

    // Bomb timers
    if (this.timers.bombArming) { clearInterval(this.timers.bombArming); this.timers.bombArming = null; }
    if (this.timers.bombArmed) { clearInterval(this.timers.bombArmed); this.timers.bombArmed = null; }

    // Dual bomb timers
    if (this.timers.dualBombArming) { clearInterval(this.timers.dualBombArming); this.timers.dualBombArming = null; }
    if (this.timers.dualBombArmed) { clearInterval(this.timers.dualBombArmed); this.timers.dualBombArmed = null; }

    // Death timer
    if (this.timers.death) { clearInterval(this.timers.death); this.timers.death = null; }
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
          <span>⏬ -5s</span>
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

    // Actualizar UI de la bomba
    this.updateBombUI();

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

    const parent = buttonGrid.parentElement;
    if (!parent) return;

    // Si ya hay una notificación flotante, eliminarla (asegurar singleton)
    const existing = parent.querySelector('.notification');
    if (existing) existing.remove();

    // Limpiar timeout anterior si existe
    if (this.timers && this.timers.notification) {
      clearTimeout(this.timers.notification);
      this.timers.notification = null;
    }

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
    if (!parent.style.position) parent.style.position = 'relative';
    parent.appendChild(notification);

    // Si estamos en modo Easy (hardMode === false), también publicar la notificación
    // dentro del contenedor #messages para que sea visible. Asegurarse de una sola.
    try {
      if (this.elements && this.elements.messages && !this.state.hardMode) {
        // No sobreescribir la caja grande de victoria/derrota
        if (!this.elements.messages.querySelector('.message-box')) {
          // Eliminar cualquier easy-notification previa
          const prevEasy = this.elements.messages.querySelector('.easy-notification');
          if (prevEasy) prevEasy.remove();

          const easyMsg = document.createElement('div');
          easyMsg.className = `easy-notification easy-${type}`;
          easyMsg.textContent = message;
          this.elements.messages.appendChild(easyMsg);
          // auto-eliminar ligeramente después de la notificación flotante
          setTimeout(() => { if (easyMsg.parentElement) easyMsg.remove(); }, 2300);
        }
      }
    } catch (e) {
      // no bloquear si algo falla
      console.warn('No se pudo postear notificación en #messages', e);
    }

    // Guardar timeout para permitir limpiar si aparece otra notificación
    this.timers.notification = setTimeout(() => {
      notification.style.animation = 'notificationSlideUp 0.3s ease-in forwards';
      setTimeout(() => {
        if (notification.parentElement) notification.remove();
        if (this.timers && this.timers.notification) {
          clearTimeout(this.timers.notification);
          this.timers.notification = null;
        }
      }, 300);
    }, 2000);
  }

  // inline message helpers removed to restore original messaging behavior

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
   * Limpia timers relacionados con la bomba
   */
  clearBombTimers() {
    if (this.timers.bombArming) {
      clearInterval(this.timers.bombArming);
      this.timers.bombArming = null;
    }
    if (this.timers.bombArmed) {
      clearInterval(this.timers.bombArmed);
      this.timers.bombArmed = null;
    }
  }

  clearDualBombTimers() {
    if (this.timers.dualBombArming) {
      clearInterval(this.timers.dualBombArming);
      this.timers.dualBombArming = null;
    }
    if (this.timers.dualBombArmed) {
      clearInterval(this.timers.dualBombArmed);
      this.timers.dualBombArmed = null;
    }
  }

  clearDeathTimer() {
    if (this.timers.death) {
      clearInterval(this.timers.death);
      this.timers.death = null;
    }
  }

  /**
   * Configura el modo Hard y actualiza la UI de los botones penalizadores
   */
  setHardMode(enabled) {
    this.state.hardMode = !!enabled;

    // Update visual state of special buttons
    if (this.elements.bombBtn) {
      if (!this.state.hardMode) this.elements.bombBtn.classList.add('disabled');
      else this.elements.bombBtn.classList.remove('disabled');
    }
    if (this.elements.specialBtn2) {
      if (!this.state.hardMode) this.elements.specialBtn2.classList.add('disabled');
      else this.elements.specialBtn2.classList.remove('disabled');
    }
    if (this.elements.specialBtnLarge) {
      if (!this.state.hardMode) this.elements.specialBtnLarge.classList.add('disabled');
      else this.elements.specialBtnLarge.classList.remove('disabled');
    }

    // Ensure the checkbox matches state
    if (this.elements.hardModeToggle) this.elements.hardModeToggle.checked = !!this.state.hardMode;
    // Show or hide the penalizations section depending on hard mode
    if (this.elements.specialSection) {
      if (this.state.hardMode) this.elements.specialSection.classList.remove('hidden');
      else this.elements.specialSection.classList.add('hidden');
    }
  }

  startDeathTimer() {
    this.clearDeathTimer();
    this.state.deathButton.percent = 0;
    this.updateDeathUI();
    this.timers.death = setInterval(() => {
      if (this.state.gameEnded) {
        this.clearDeathTimer();
        return;
      }

      // increase 1% every 1000ms (1 second)
      this.state.deathButton.percent = Math.min(100, this.state.deathButton.percent + 1);
      this.updateDeathUI();
      if (this.state.deathButton.percent >= 100) {
        this.clearDeathTimer();
        // lose all time
        this.state.countdownTimer = 0;
        this.updateUI();
        this.sounds.whistle();
        if (!this.state.gameEnded) this.handleGameLoss();
      }
    }, 1000);
  }

  handleDeathButtonClick() {
    // reduce percent by 1% on each click (and update UI)
    if (this.state.gameEnded) return;
    this.state.deathButton.percent = Math.max(0, this.state.deathButton.percent - 1);
    this.updateDeathUI();
    // immediate feedback sound
    this.sounds.click();
  }

  updateDeathUI() {
    const btn = this.elements.specialBtnLarge;
    if (!btn) return;
    const icon = document.getElementById('deathIcon');
    const label = document.getElementById('deathLabel');
    const fill = document.getElementById('deathProgressFill');

    if (this.state.deathButton.percent >= 80) {
      btn.classList.add('death-critical');
    } else {
      btn.classList.remove('death-critical');
    }

    if (icon) icon.textContent = '☠️';
    if (label) label.textContent = `Muerte ${this.state.deathButton.percent}%`;
    if (fill) fill.style.width = `${this.state.deathButton.percent}%`;
  }

  /**
   * Maneja el flujo del segundo botón (2 bombas)
   */
  handleDualBombButton() {
    const d = this.state.dualBomb;
    if (d.status === 'idle') {
      this.startDualBombCycle();
    } else if (d.status === 'arming') {
      this.sounds.error();
      this.showNotification('Aún armando...', 'info');
    } else if (d.status === 'armed') {
      // Pulsado durante el segundo: cancelar penalización y reiniciar
      this.dualBombSuccess();
      if (this.elements.specialBtn2) this.elements.specialBtn2.onclick = () => this.handleDualBombButton();
    }
  }

  startDualBombCycle() {
    this.clearDualBombTimers();
    this.state.dualBomb.status = 'arming';
    this.state.dualBomb.armingRemaining = 5.0; // 5 segundos de ciclo
    this.updateDualBombUI();

    this.timers.dualBombArming = setInterval(() => {
      this.state.dualBomb.armingRemaining = Math.max(0, this.state.dualBomb.armingRemaining - 0.1);
      this.updateDualBombUI();
      if (this.state.dualBomb.armingRemaining <= 0) {
        clearInterval(this.timers.dualBombArming);
        this.timers.dualBombArming = null;
        this.dualBombArmingComplete();
      }
    }, 100);
  }

  dualBombArmingComplete() {
    this.state.dualBomb.status = 'armed';
    this.state.dualBomb.armedRemaining = 1.0; // 1s ventana
    this.updateDualBombUI();

    this.timers.dualBombArmed = setInterval(() => {
      this.state.dualBomb.armedRemaining = Math.max(0, this.state.dualBomb.armedRemaining - 0.05);
      this.updateDualBombUI();
      if (this.state.dualBomb.armedRemaining <= 0) {
        clearInterval(this.timers.dualBombArmed);
        this.timers.dualBombArmed = null;
        this.dualBombFail();
      }
    }, 50);
  }

  dualBombSuccess() {
    this.clearDualBombTimers();
    this.state.dualBomb.status = 'idle';
    this.state.dualBomb.armingRemaining = 0;
    this.state.dualBomb.armedRemaining = 0;
    this.sounds.upgrade();
    this.showNotification('¡Desactivadas 2 bombas!', 'success');
    this.updateDualBombUI();
    if (!this.state.gameEnded) this.startDualBombCycle();
  }

  dualBombFail() {
    this.clearDualBombTimers();
    this.state.dualBomb.status = 'idle';
    this.state.dualBomb.armingRemaining = 0;
    this.state.dualBomb.armedRemaining = 0;
    const PENALTY = 5;
    this.state.countdownTimer = Math.max(0, this.state.countdownTimer - PENALTY);
    this.sounds.error();
    this.showNotification(`- ${PENALTY}s (2 bombas)`, 'error');
    this.updateDualBombUI();
    if (this.state.countdownTimer <= 0) this.handleGameLoss();
    if (!this.state.gameEnded) this.startDualBombCycle();
  }

  updateDualBombUI() {
    const btn = this.elements.specialBtn2;
    if (!btn) return;
    const icon = document.getElementById('special2Icon');
    const label = document.getElementById('special2Label');
    const fill = document.getElementById('special2ProgressFill');

    if (this.state.dualBomb.status === 'idle') {
      btn.classList.remove('disabled');
      btn.classList.remove('bomb-armed');
      if (icon) icon.textContent = '🔧';
      if (label) label.textContent = '2 Bombas';
      if (fill) fill.style.width = '0%';
    } else if (this.state.dualBomb.status === 'arming') {
      btn.classList.add('disabled');
      btn.classList.remove('bomb-armed');
      if (icon) icon.textContent = '💣💣';
      if (label) label.textContent = `Armando... ${Math.ceil(this.state.dualBomb.armingRemaining)}s`;
      const pct = Math.round(((5 - this.state.dualBomb.armingRemaining) / 5) * 100);
      if (fill) fill.style.width = `${pct}%`;
    } else if (this.state.dualBomb.status === 'armed') {
      btn.classList.remove('disabled');
      btn.classList.add('bomb-armed');
      if (icon) icon.textContent = '✂️✂️';
      if (label) label.textContent = `Desactivar ${this.state.dualBomb.armedRemaining.toFixed(1)}s`;
      const pct = Math.round((this.state.dualBomb.armedRemaining / 1) * 100);
      if (fill) fill.style.width = `${pct}%`;
    }
  }

  /**
   * Maneja el flujo del botón bomba
   */
  handleBombButton() {
    // Si ya está arming o armed, responder según estado
    const bomb = this.state.bomb;

    if (bomb.status === 'idle') {
      // Empezar arming de 3s
      this.startBombArming();
    } else if (bomb.status === 'arming') {
      // Ignorar clicks mientras arma
      this.sounds.error();
      this.showNotification('Aún armando...', 'info');
    } else if (bomb.status === 'armed') {
      // Si está armado y pulsas dentro del segundo, cancelar penalización
      this.bombSuccess();
      // Asegurar que el listener siga activo en el botón tras cambios de innerHTML
      if (this.elements.bombBtn) this.elements.bombBtn.onclick = () => this.handleBombButton();
    }
  }

  startBombArming() {
    this.clearBombTimers();
    this.state.bomb.status = 'arming';
    this.state.bomb.armingRemaining = 3.0; // segundos
    this.updateBombUI();

    // Actualizar progresivamente cada 100ms
    this.timers.bombArming = setInterval(() => {
      this.state.bomb.armingRemaining = Math.max(0, this.state.bomb.armingRemaining - 0.1);
      this.updateBombUI();
      if (this.state.bomb.armingRemaining <= 0) {
        clearInterval(this.timers.bombArming);
        this.timers.bombArming = null;
        this.bombArmingComplete();
      }
    }, 100);
  }

  bombArmingComplete() {
    // Pasar a estado armado por 1 segundo
    this.state.bomb.status = 'armed';
    this.state.bomb.armedRemaining = 1.0;
    this.updateBombUI();

    this.timers.bombArmed = setInterval(() => {
      this.state.bomb.armedRemaining = Math.max(0, this.state.bomb.armedRemaining - 0.05);
      this.updateBombUI();
      if (this.state.bomb.armedRemaining <= 0) {
        clearInterval(this.timers.bombArmed);
        this.timers.bombArmed = null;
        this.bombFail();
      }
    }, 50);
  }

  bombSuccess() {
    // Jugador pulsó durante la ventana de 1s: cancelar y feedback
    this.clearBombTimers();
    this.state.bomb.status = 'idle';
    this.state.bomb.armingRemaining = 0;
    this.state.bomb.armedRemaining = 0;
    this.sounds.upgrade();
    this.showNotification('¡Bomba desactivada!', 'success');
    this.updateBombUI();
    // Reiniciar armado automático inmediatamente
    if (!this.state.gameEnded) this.startBombArming();
  }

  bombFail() {
    // No pulsó durante el segundo: penalizar 3s
    this.clearBombTimers();
    this.state.bomb.status = 'idle';
    this.state.bomb.armingRemaining = 0;
    this.state.bomb.armedRemaining = 0;
    const PENALTY = 3;
    this.state.countdownTimer = Math.max(0, this.state.countdownTimer - PENALTY);
    this.sounds.error();
    this.showNotification(`- ${PENALTY}s (bomba)`, 'error');
    this.updateBombUI();
    if (this.state.countdownTimer <= 0) {
      this.handleGameLoss();
    }
    // Reiniciar armado automático inmediatamente
    if (!this.state.gameEnded) this.startBombArming();
  }

  /**
   * Actualiza la UI del botón bomba según su estado
   */
  updateBombUI() {
    const btn = this.elements.bombBtn;
    if (!btn) return;

    // Get child elements (these exist in the HTML and won't be recreated)
    const iconEl = document.getElementById('bombIcon');
    const labelEl = document.getElementById('bombLabel');
    const fill = document.getElementById('bombProgressFill');

    if (this.state.bomb.status === 'idle') {
      btn.classList.remove('disabled');
      btn.classList.remove('bomb-armed');
      if (iconEl) iconEl.textContent = '💣';
      if (labelEl) labelEl.textContent = 'Bomba';
      if (fill) fill.style.width = '0%';
    } else if (this.state.bomb.status === 'arming') {
      btn.classList.add('disabled');
      btn.classList.remove('bomb-armed');
      if (iconEl) iconEl.textContent = '💣';
      if (labelEl) labelEl.textContent = `Armando... ${Math.ceil(this.state.bomb.armingRemaining)}s`;
      const pct = Math.round(((3 - this.state.bomb.armingRemaining) / 3) * 100);
      if (fill) fill.style.width = `${pct}%`;
    } else if (this.state.bomb.status === 'armed') {
      btn.classList.remove('disabled');
      btn.classList.add('bomb-armed');
      if (iconEl) iconEl.textContent = '✂️';
      if (labelEl) labelEl.textContent = `Desactivar ${this.state.bomb.armedRemaining.toFixed(1)}s`;
      const pct = Math.round((this.state.bomb.armedRemaining / 1) * 100);
      if (fill) fill.style.width = `${pct}%`;
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
  // Fallback listeners: asegurar que la modal de info abra/cierre incluso si
  // setupInfoModal() no logró asociar los eventos por algún motivo.
  try {
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
  } catch (err) {
    console.warn('Fallback info modal listeners failed', err);
  }
});
