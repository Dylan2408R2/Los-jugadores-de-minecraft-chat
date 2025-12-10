
# 🚀 Jugadores de Minecraft - Chat Local

¡Bienvenido a **Jugadores de Minecraft**! Una aplicación de chat moderna, visualmente impactante y completamente funcional que opera directamente en tu navegador sin necesidad de servidores complejos para pruebas locales.

![Status](https://img.shields.io/badge/Status-Active-success)
![Technology](https://img.shields.io/badge/React-v19-blue)
![Style](https://img.shields.io/badge/Tailwind-CSS-38bdf8)

## ✨ Características Principales

*   **👥 Usuarios Reales (Simulación Local):** Abre múltiples pestañas en tu navegador y chatea entre ellas instantáneamente. El sistema detecta cuando entras y sales.
*   **🔒 Autenticación Segura:** Sistema completo de **Registro** e **Inicio de Sesión** con contraseñas.
*   **🎨 Personalización Avanzada:** Elige tu **Color de Aura** (tema) y sube tu propia foto de perfil.
*   **🖱️ Mouse Avanzado:** Cursor personalizado con físicas y efectos de luz reactivos.
*   **💾 Persistencia de Datos:** Todos los usuarios y mensajes se guardan en el navegador (`localStorage`), así que no perderás tu cuenta si recargas.
*   **💎 UI Glassmorphism:** Diseño futurista con efectos de desenfoque, gradientes de neón y animaciones fluidas.

## 🛠️ Tecnologías

*   **React 19**: Biblioteca UI.
*   **Tailwind CSS**: Estilizado rápido y moderno.
*   **BroadcastChannel API**: Para la comunicación en tiempo real entre pestañas.
*   **LocalStorage**: Como base de datos ligera en el navegador.
*   **Lucide React**: Iconografía.

## 🚀 Cómo probarlo "Multijugador"

Dado que esta versión funciona sin backend externo (Serverless Local):

1.  Abre la aplicación en una pestaña.
2.  Regístrate como **Usuario A** (ej: "Juan").
3.  Abre una **segunda pestaña** con la misma URL.
4.  Regístrate (o inicia sesión) como **Usuario B** (ej: "Maria").
5.  ¡Escribe en una pestaña y verás el mensaje instantáneamente en la otra!

## 📦 Instalación (Para Desarrolladores)

Si descargaste este código para usarlo localmente:

1.  Asegúrate de tener Node.js instalado.
2.  Instala las dependencias (si usas un entorno local con package.json, aunque este ejemplo usa módulos ES directos en navegador para máxima simplicidad).

## 📄 Licencia

Este proyecto es de código abierto. ¡Siéntete libre de modificarlo y aprender de él!
