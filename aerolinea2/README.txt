README — Aerolínea v6 (neumorphism + extras + Mis vuelos)
Fecha: 2025-09-21

Novedades:
- Layout móvil arreglado (grids de asientos responsivos).
- Registro con contraseña robusta (8+, 1 mayús, 1 número) y confirmación.
- Sesiones estables (fetch con credentials) y toasts de estado.
- Diálogos cierran correctamente con Cancelar/Esc.
- Mensajes de éxito al registrar y pagar.
- "Mis vuelos" con historial del usuario.
- Equipaje extra/documentado con desglose y suma al total.

Instalación:
1) Copia `aerolinea_ngrok_v6/` a `htdocs` (XAMPP).
2) phpMyAdmin → Importa `database.sql` (crea todo).
3) Ajusta `config.php` si tu MySQL usa contraseña.
4) Local: http://localhost/aerolinea_ngrok_v6/public/
5) Ngrok: ngrok http 80 → usa la URL pública + `/aerolinea_ngrok_v6/public/`
