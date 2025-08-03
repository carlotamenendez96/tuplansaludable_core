import { Router } from 'express';
import path from 'path';
import fs from 'fs';

const router = Router();

/**
 * @route   GET /api/docs
 * @desc    Servir documentación Swagger UI
 * @access  Public
 */
router.get('/', (req, res) => {
  try {
    const swaggerPath = path.join(__dirname, '../../swagger.json');
    const swaggerContent = fs.readFileSync(swaggerPath, 'utf8');
    const swaggerSpec = JSON.parse(swaggerContent);
    
    const html = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Tu Plan Saludable API - Documentación</title>
    <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui.css" />
    <style>
        html {
            box-sizing: border-box;
            overflow: -moz-scrollbars-vertical;
            overflow-y: scroll;
        }
        *, *:before, *:after {
            box-sizing: inherit;
        }
        body {
            margin:0;
            background: #fafafa;
        }
        .swagger-ui .topbar {
            background-color: #2c3e50;
        }
        .swagger-ui .topbar .download-url-wrapper .select-label {
            color: #fff;
        }
        .swagger-ui .info .title {
            color: #2c3e50;
        }
        .swagger-ui .scheme-container {
            background-color: #f8f9fa;
            box-shadow: none;
        }
    </style>
</head>
<body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui-bundle.js"></script>
    <script src="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui-standalone-preset.js"></script>
    <script>
        window.onload = function() {
            const ui = SwaggerUIBundle({
                spec: ${JSON.stringify(swaggerSpec)},
                dom_id: '#swagger-ui',
                deepLinking: true,
                presets: [
                    SwaggerUIBundle.presets.apis,
                    SwaggerUIStandalonePreset
                ],
                plugins: [
                    SwaggerUIBundle.plugins.DownloadUrl
                ],
                layout: "StandaloneLayout",
                docExpansion: "list",
                filter: true,
                showExtensions: true,
                showCommonExtensions: true,
                tryItOutEnabled: true,
                requestInterceptor: function(request) {
                    // Agregar token JWT si está disponible
                    const token = localStorage.getItem('jwt_token');
                    if (token) {
                        request.headers.Authorization = 'Bearer ' + token;
                    }
                    return request;
                },
                responseInterceptor: function(response) {
                    // Guardar token JWT si está en la respuesta
                    if (response.obj && response.obj.data && response.obj.data.token) {
                        localStorage.setItem('jwt_token', response.obj.data.token);
                    }
                    return response;
                }
            });
            
            // Agregar botón para limpiar token
            const topbar = document.querySelector('.swagger-ui .topbar');
            if (topbar) {
                const clearTokenBtn = document.createElement('button');
                clearTokenBtn.textContent = 'Limpiar Token';
                clearTokenBtn.style.cssText = 'margin-left: 10px; padding: 5px 10px; background: #e74c3c; color: white; border: none; border-radius: 3px; cursor: pointer;';
                clearTokenBtn.onclick = function() {
                    localStorage.removeItem('jwt_token');
                    alert('Token JWT eliminado');
                };
                topbar.appendChild(clearTokenBtn);
            }
        };
    </script>
</body>
</html>`;
    
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (error) {
    console.error('Error loading Swagger documentation:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cargar la documentación',
      error: 'No se pudo cargar el archivo swagger.json'
    });
  }
});

/**
 * @route   GET /api/docs/swagger.json
 * @desc    Obtener especificación Swagger en formato JSON
 * @access  Public
 */
router.get('/swagger.json', (req, res) => {
  try {
    const swaggerPath = path.join(__dirname, '../../swagger.json');
    const swaggerContent = fs.readFileSync(swaggerPath, 'utf8');
    const swaggerSpec = JSON.parse(swaggerContent);
    
    res.setHeader('Content-Type', 'application/json');
    res.json(swaggerSpec);
  } catch (error) {
    console.error('Error loading Swagger JSON:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cargar la especificación Swagger',
      error: 'No se pudo cargar el archivo swagger.json'
    });
  }
});

export default router; 