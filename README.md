# 🎯 1000 en 1 Minuto

Un juego de clicker moderno y adictivo donde debes alcanzar 1000 puntos en solo 1 minuto. ¡Mejora tu estrategia, compra upgrades y domina el tiempo!

## 🎮 Cómo Jugar

1. **Objetivo**: Alcanzar 1000 puntos antes de que se acabe el tiempo
2. **Mecánica**: Haz clic en el botón principal para ganar puntos
3. **Estrategia**: Usa tus puntos para comprar mejoras que te ayuden a conseguir más puntos más rápido

## 🎯 Características

### ✨ Mejoras Disponibles

- **➕ Más Puntos** (2 💎): Aumenta los puntos ganados por cada clic
- **⚡ Más Rápido** (5 💎): Reduce el tiempo de espera entre clics
- **⌛ Más Tiempo** (100 💎): Añade 10 segundos al contador
- **🏆 Victoria** (1000 💎): Gana instantáneamente el juego

### 🎨 Mejoras Visuales

- **Diseño moderno y responsive**: Se adapta a cualquier dispositivo
- **Animaciones suaves**: Transiciones fluidas y efectos visuales
- **Feedback instantáneo**: Notificaciones, partículas y efectos de clic
- **Barra de progreso**: Visualiza tu avance hacia la meta
- **Efectos de celebración**: Confetti y animaciones al ganar

### ⌨️ Atajos de Teclado

- **Tecla 1**: Hacer clic
- **Tecla 2**: Comprar mejora de puntos
- **Tecla 3**: Comprar mejora de velocidad
- **Tecla 4**: Comprar más tiempo
- **Tecla 5**: Victoria instantánea

## 📁 Estructura del Proyecto

```
1Kx1min/
│
├── index.html          # Estructura HTML del juego
├── styles.css          # Estilos y animaciones
├── game.js            # Lógica del juego (POO)
├── 1Kx1min.html       # Versión original (backup)
└── README.md          # Este archivo
```

## 🔧 Arquitectura del Código

### Clase Principal: `ClickerGame`

El juego está implementado usando programación orientada a objetos con una clase principal que gestiona:

- **Estado del juego**: Puntos, tiempo, mejoras, etc.
- **Eventos**: Clics, teclado, botones
- **UI**: Actualización de elementos visuales
- **Lógica**: Validaciones, compras, victoria/derrota

### Características Técnicas

- **Sin dependencias**: JavaScript vanilla puro
- **Responsive**: CSS Grid y Flexbox
- **Modular**: Código separado en archivos
- **Documentado**: Comentarios JSDoc en funciones
- **Optimizado**: Caché de elementos DOM

## 🚀 Cómo Ejecutar

1. Abre `index.html` en tu navegador web
2. Haz clic en "▶️ Iniciar Juego"
3. ¡Diviértete alcanzando los 1000 puntos!

## 🎨 Personalización

### Modificar Configuración del Juego

Edita las constantes en `game.js`:

```javascript
this.CONFIG = {
  COOLDOWN_INITIAL: 5,              // Segundos de espera inicial
  COUNTDOWN_TIMER_INITIAL: 60,      // Tiempo total del juego
  POINTS_FOR_ADD_POINT: 2,          // Costo de mejora de puntos
  POINTS_FOR_REDUCE_COOLDOWN: 5,    // Costo de mejora de velocidad
  POINTS_FOR_ADD_TIME: 100,         // Costo de más tiempo
  POINTS_FOR_WIN_GAME: 1000,        // Meta para ganar
  EXTRA_TIME: 10,                   // Segundos añadidos
  MIN_COOLDOWN: 1                   // Mínimo cooldown
};
```

### Modificar Colores y Estilos

Edita las variables CSS en `styles.css`:

```css
:root {
  --primary-color: #4CAF50;
  --secondary-color: #2196F3;
  --danger-color: #f44336;
  --warning-color: #ff9800;
  --success-color: #4CAF50;
  --background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
```

## 📊 Mejoras Implementadas

### Desde la Versión Original

✅ **Separación de código**
- HTML limpio y semántico
- CSS en archivo separado
- JavaScript modular con POO

✅ **Mejoras visuales**
- Gradientes modernos
- Animaciones suaves
- Diseño responsive
- Efectos de partículas
- Barra de progreso

✅ **Mejoras de UX**
- Notificaciones informativas
- Tooltips mejorados
- Feedback visual inmediato
- Atajos de teclado
- Estados visuales claros

✅ **Mejoras de código**
- Programación orientada a objetos
- Funciones bien documentadas
- Código limpio y mantenible
- Configuración centralizada

## 🎯 Estrategias para Ganar

1. **Estrategia Rápida**: Enfócate en reducir el cooldown primero
2. **Estrategia de Potencia**: Aumenta los puntos por clic constantemente
3. **Estrategia Equilibrada**: Combina ambas mejoras
4. **Estrategia Conservadora**: Compra tiempo extra cuando sea necesario

## 🐛 Solución de Problemas

- **El juego no se inicia**: Verifica que los archivos estén en la misma carpeta
- **Los estilos no se cargan**: Comprueba que `styles.css` esté en el mismo directorio
- **Los atajos no funcionan**: Asegúrate de que el juego esté activo

## 📝 Licencia

Este proyecto es de código abierto y está disponible para uso personal y educativo.

## 🤝 Contribuciones

¡Las mejoras y sugerencias son bienvenidas! Siéntete libre de modificar el código para añadir nuevas características.

---

**¡Disfruta del juego y alcanza esos 1000 puntos! 🏆**
