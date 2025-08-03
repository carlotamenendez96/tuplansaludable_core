#!/usr/bin/env node

/**
 * Script para validar el archivo swagger.json
 * Uso: node scripts/validate-swagger.js
 */

const fs = require('fs');
const path = require('path');

function validateSwagger() {
  console.log('🔍 Validando archivo swagger.json...\n');
  
  try {
    // Leer el archivo swagger.json
    const swaggerPath = path.join(__dirname, '../swagger.json');
    
    if (!fs.existsSync(swaggerPath)) {
      console.error('❌ Error: No se encontró el archivo swagger.json');
      console.log('💡 Asegúrate de que el archivo existe en la raíz del proyecto');
      process.exit(1);
    }
    
    const swaggerContent = fs.readFileSync(swaggerPath, 'utf8');
    const swaggerSpec = JSON.parse(swaggerContent);
    
    console.log('✅ Sintaxis JSON válida');
    
    // Validaciones básicas
    const validations = [
      {
        name: 'Versión OpenAPI',
        check: () => swaggerSpec.openapi && swaggerSpec.openapi.startsWith('3.'),
        message: 'Debe usar OpenAPI 3.x'
      },
      {
        name: 'Información de la API',
        check: () => swaggerSpec.info && swaggerSpec.info.title && swaggerSpec.info.version,
        message: 'Debe incluir información básica de la API'
      },
      {
        name: 'Servidores',
        check: () => swaggerSpec.servers && swaggerSpec.servers.length > 0,
        message: 'Debe incluir al menos un servidor'
      },
      {
        name: 'Esquemas de seguridad',
        check: () => swaggerSpec.components && swaggerSpec.components.securitySchemes,
        message: 'Debe incluir esquemas de seguridad'
      },
      {
        name: 'Esquemas de datos',
        check: () => swaggerSpec.components && swaggerSpec.components.schemas,
        message: 'Debe incluir esquemas de datos'
      },
      {
        name: 'Endpoints',
        check: () => swaggerSpec.paths && Object.keys(swaggerSpec.paths).length > 0,
        message: 'Debe incluir al menos un endpoint'
      },
      {
        name: 'Tags',
        check: () => swaggerSpec.tags && swaggerSpec.tags.length > 0,
        message: 'Debe incluir tags para organizar endpoints'
      }
    ];
    
    let passedValidations = 0;
    
    validations.forEach(validation => {
      if (validation.check()) {
        console.log(`✅ ${validation.name}`);
        passedValidations++;
      } else {
        console.log(`❌ ${validation.name}: ${validation.message}`);
      }
    });
    
    // Contar endpoints por tag
    if (swaggerSpec.paths) {
      console.log('\n📊 Estadísticas de endpoints:');
      
      const tagCounts = {};
      Object.values(swaggerSpec.paths).forEach(path => {
        Object.values(path).forEach(method => {
          if (method.tags && method.tags.length > 0) {
            method.tags.forEach(tag => {
              tagCounts[tag] = (tagCounts[tag] || 0) + 1;
            });
          }
        });
      });
      
      Object.entries(tagCounts).forEach(([tag, count]) => {
        console.log(`  ${tag}: ${count} endpoints`);
      });
    }
    
    // Contar esquemas
    if (swaggerSpec.components && swaggerSpec.components.schemas) {
      const schemaCount = Object.keys(swaggerSpec.components.schemas).length;
      console.log(`\n📋 Esquemas de datos: ${schemaCount}`);
    }
    
    console.log(`\n📈 Resultado: ${passedValidations}/${validations.length} validaciones pasaron`);
    
    if (passedValidations === validations.length) {
      console.log('🎉 ¡Archivo swagger.json válido!');
      console.log('\n💡 Para ver la documentación:');
      console.log('   npm start');
      console.log('   http://localhost:5000/api/docs');
    } else {
      console.log('⚠️  Algunas validaciones fallaron. Revisa los errores arriba.');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Error al validar swagger.json:');
    console.error(error.message);
    
    if (error instanceof SyntaxError) {
      console.log('\n💡 El archivo JSON tiene errores de sintaxis.');
      console.log('   Usa un editor JSON para encontrar y corregir los errores.');
    }
    
    process.exit(1);
  }
}

// Ejecutar validación si el script se ejecuta directamente
if (require.main === module) {
  validateSwagger();
}

module.exports = { validateSwagger }; 